const path = require("path");
const fs = require("fs");
const logger = require("log4js").getLogger("app");
const location = path.join(path.resolve("../"),"output/"); 

module.exports = function joinAmassData(domain, callback){
    let dirData = fs.readdirSync(location);
    let result = new Set();
    dirData.map((file) => {
        if(file.match(domain) && file.match(/amass/)){
            let fileData = fs.readFileSync(location+file, "utf8");
            fileData.split("\n").map((entry) => {
                if(entry){
                    result.add(entry)
                }
            })
        }
    })
    let content = "";
    result.forEach((entry) => {
        content += entry + "\r\n"
    })
    fs.appendFileSync(location+ `${domain}_result.txt`, content);
    logger.info(`Done appending data to result file from amass for domain: ${domain} results added from amass count: ${result.size}`)
    callback(null, "success")
}