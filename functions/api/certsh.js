const logger = require("log4js").getLogger("app");
const http = require("request");
const writeToFile = require("../../utils/write-file");

module.exports = function getDomainsFromCRTSH(domain, callback, retry = false){
    let url = `https://crt.sh/?Identity=%.${domain}`;
    http(url, {method: 'GET'}, (err, res, body) => {
        if(err){
            logger.fatal(`Error while getting results from crt.sh for domain: ${domain} \r\n Error: ${err}`);
            callback("error","");
        } else {
            let result = new Set();
            domain = domain.replace(/ /g,"")
            let regexp = new RegExp("<TD>\\S*"+domain+"\\S*<\\/TD>","ig")
            let matches = body.match(regexp)
            if(matches){
                matches.map((res) => {
                    result.add(res)
                })
            }
            logger.info(`Getting subdomains from crtsh completed for domain: ${domain}`)
            let content = "";
            result.forEach((domain) => {
                domain = domain.replace(/<TD>/i,"").replace(/<\/TD>/i,"")
                //take care of wild card subdomains
                content += domain + "\r\n"; 
            })
            logger.info(`Total number of results for task: crtsh domain: ${domain} count: ${result.size}`)
            writeToFile(`crtsh_${domain}.txt`, content, domain);
            callback(null, "success");
            // res.on('data', (chunk) => {
            //     console.log("chunk")
            //     chunk = chunk.toString();
            //     let matches = chunk.match(/<TD>\S+.com<\/TD>/g)
            //     if(matches){
            //         matches.map((res) => {
            //             result.add(res)
            //         })
            //     }
            // })
            // res.on('end', ()=>{
            //     log.info(`Getting subdomains from crtsh completed for domain: ${domain}`)
            //     let content = "";
            //     result.forEach((domain) => {
            //         content += domain + "\r\n";
            //     })
            //     // writeToFile(`crtsh_${domain}.txt`, content, domain);
            //     callback(null, "success");
            // })
        }
    })
}