var progressBuilder = require("../../utils/progress-builder.js");
var writeToFile = require("../../utils/write-file.js");
const httpRequest = require("request");
const logger = require("log4js").getLogger("app");

module.exports = async function queryUsingCTLogs(domain, callback) {
    logger.info("Started Querying Using ctlogs for domain "+ domain);
    let hashes = new Set();
    let result = new Set();
    let ctQueryURL = "https://transparencyreport.google.com/transparencyreport/api/v3/httpsreport/ct/certsearch?include_expired=true&include_subdomains=true&domain="+ domain;
    let hashLookupURL = "https://transparencyreport.google.com/transparencyreport/api/v3/httpsreport/ct/certbyhash?hash=";
    let ctPageQueryURL = ctQueryURL.split("?")[0];
    let nextPage = "firstPage";
    let limit = 0;
    let iteration = 0;
    let errorCount = 0;
    await new Promise((resolve, reject) => {
        function loop(nextPage) {
            if (!nextPage) {
                resolve("done");
                return;
            }
            iteration++;
            // logger.info(`Task CTLOG: domain ${domain} iteration ${iteration}`);
            httpRequest(nextPage === "firstPage" ? ctQueryURL : ctPageQueryURL + "/page?p=" + nextPage, {
                method: "GET"
            }, (error, response, rbody) => {
                if (error) {
                    errorCount++;
                    // implement retires for vertything to prevent call struvk in window console
                    logger.fatal(`Task ctlogs for domain ${domain}: Error while making http call for hashes \r\n ${error}`)
                    if(JSON.stringify(error).match(/ETIMEDOUT/gi) && errorCount < 5){
                        logger.debug(`Task ctlogs for domain ${domain}: Error while making http call for hashes retry: ${errorCount}`)
                    } 
                        logger.error(`Task ctlogs for domain ${domain}: Network Connectivity issues`);
                        loop(nextPage);
                        // callback("error","")
                } else {
                    let err;
                    let url;
                    try {
                        let body = JSON.parse(rbody.replace(")]}'", ""));
                        err = body;
                        body[0][3][1] ? url = body[0][3][1] : url = "";
                        body[0][1].map((entry) => {
                            hashes.add(entry[5]);
                            result.add(entry[1]);
                        })
                        if (nextPage === "nextPage") {
                            limit = body[0][3][4]
                        }
                        if (limit === body[0][3][3]) {
                            loop("");
                        } else {
                            errorCount = 0;
                            loop(url);
                            return;
                        }
                    } catch (e) {
                        logger.error(`Task ctlogs for domain ${domain}: Error while fetching hashes \r\n ${e}`)
                        logger.info(nextPage);
                        logger.info(err[0]);
                        errorCount++;
                        if(errorCount < 5){
                            logger.debug(`Retry attempt: ${errorCount} for domain: ${domain} for hash: ${nextPage}`);
                            loop(nextPage);
                        } else {
                            logger.error(`Max Retreis exceeded: ${errorCount} for domain: ${domain} for hash: ${nextPage}`);
                        }
                    }
                }
            })
        }
        loop(nextPage);
    })
    logger.info(`Task ctlogs for domain: ${domain} Done Fetching hashes`);
    logger.info(`Task ctlogs for domain: ${domain} Progress ${progressBuilder(25)} 25%`);
    await new Promise((resolve, reject) => {
        logger.info(`Task ctlogs: Started Fetching sub-domains from hashes for domain ${domain}`);
        let iteration = 0;
        let hashArray = [...hashes];
        let errorRetries = 0;
        function retrieveHash(){
                if(iteration < hashArray.length){
                    httpRequest(hashLookupURL + hashArray[iteration].replace(/\+/g, "%2B"), {
                        method: "GET"
                    }, (err, res, rbody) => {
                        iteration++;
                        if(iteration % 25 === 0){
                            let prog = Math.round((iteration / hashes.size) * 75) + 25;
                            logger.info(`Task ctlogs for domain: ${domain} Progress ${progressBuilder(prog)} ${prog}%`);
                        }
                        if (err) {
                            errorRetries++;
                            logger.error(`Task ctlogs for domain: ${domain} Error while fetching domains from hash \r\n ${err}`)
                            if(errorRetries < 5){
                                logger.debug(`Task ctlogs for domain ${domain}: Error occured. Retrying hash ${hashArray[iteration - 1]} retry: ${errorRetries}`)
                                iteration--;
                                retrieveHash();
                            } else {
                                logger.error(`Task ctlogs for domain ${domain}: Error while parsing subdomains from hash: ${hashArray[iteration-1]} Max retires exceeded`);
                                callback("error","");
                            }
                        } else {
                            try {
                                var body = JSON.parse(rbody.replace(")]}'", ""));
                                body[0][1][7].map((subdomain) => {
                                    result.add(subdomain);
                                    if (!subdomain.match(domain)) {
                                        // logger.info("nomatch", subdomain);
                                    }
                                })
                                errorRetries = 0;
                                retrieveHash();
                            } catch (e) {
                                errorRetries++;
                                logger.error(`Task ctlogs for domain ${domain}: Error while parsing subdomains from hash: ${hashArray[iteration-1]} \r\n ${e}`)
                                if(JSON.stringify(e).match(/typeerror/gi) || errorRetries < 5){
                                    logger.debug(`Task ctlogs for domain ${domain}: Error occured. Retrying hash ${hashArray[iteration - 1]} retry: ${errorRetries}`)
                                    iteration--;
                                    retrieveHash();
                                } else {
                                    logger.error(`Task ctlogs for domain ${domain}: Error while parsing subdomains from hash: ${hashArray[iteration-1]} Max retires exceeded`);
                                    callback("error","");
                                }
                            }
                        }
                        if (iteration === hashes.size) {
                            logger.info(`Task ctlogs for domain: ${domain} Done Fetching all subdomains list... Progress 100%`)
                            callback(null,"success");
                            resolve("done");
                        } else{
                            // logger.info(`Iteration ${iteration} size ${hashes.size}`);
                        }
                    })
                }
        }
        retrieveHash();
    })
    let content = "";
    result.forEach((subdomain) => {
        content += subdomain + "\r\n";
    })
    writeToFile(`ctlogs_${domain}.txt`, content, domain);
}
//improvement add task progress for fetching hashes as well based on list last page from api