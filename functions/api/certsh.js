const logger = require("log4js").getLogger("app");
const http = require("request");
const writeToFile = require("../../utils/write-file");

module.exports = function getDomainsFromCRTSH(domain, callback){
    http(`https://crt.sh/?Identity=%${domain}`, {method: 'GET'}, (err, res, body) => {
        if(err){
            logger.fatal(`Error while getting results from crt.sh for domain: ${domain} \r\n Error: ${err}`);
            callback("error","");
        } else {
            let result = new Set();
            let matches = body.match(/<TD>\S+.com<\/TD>/g)
                if(matches){
                    matches.map((res) => {
                        result.add(res)
                    })
            }
            logger.info(`Getting subdomains from crtsh completed for domain: ${domain}`)
            let content = "";
            result.forEach((domain) => {
                domain = domain.replace("<TD>","").replace("</TD>","")
                //take care of wild card subdomains
                content += domain + "\r\n";
            })
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