const path = require("path");
const fs = require("fs");
const logger = require("log4js").getLogger("app");
const location = path.join(path.resolve("./"),"output/"); 

module.exports = function cleanResultsFile(domain, callback){
    let dirData = fs.readdirSync(location);
    let result = new Set();
    let intitalLength;
    let matchCount = 0;
    dirData.map((file) => {
        if(file.match(domain) && file.match(/result/)){
            matchCount++;
            let fileData = fs.readFileSync(location+file, "utf8");
            intitalLength = fileData.split("\n").length
            fileData.split("\n").map((entry) => {
                if(entry){
                    entry = entry.replace(/\*\./g, "");
                    result.add(entry)
                }
            })
        }
    })
    if(matchCount === 0){
        logger.error(`Could not find final result files with domain: ${domain}`)
    } else if(matchCount > 1){
        logger.fatal(`Found more final result files with domain: ${domain} count: ${matchCount}`)
    }
    let content = "";
    result.forEach((entry) => {
        content += entry + "\n"
    })
    fs.writeFileSync(location+ `${domain}_result.txt`, content);
    logger.info(`Done cleaning result file for domain: ${domain} initialCount: ${intitalLength} finalCount: ${result.size}`)
    callback(null, "success");
}