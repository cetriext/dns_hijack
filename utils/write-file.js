const fs = require("fs");
const path = require("path");
const logger = require('log4js').getLogger('app');

module.exports = function writeToFile(filename, content, domain){
    let dst = path.join(path.resolve("./"), "output" + "/");
    if(content === "amass"){
        let stream = fs.createReadStream(`${filename}`, {encoding: 'utf8'});
        //improvement use pipe method here and try
        stream.on("data", (chunk) => {
            fs.appendFileSync(dst + domain + "_result.txt", );
        })
        stream.on("end", () => {
            logger.info(`Done writing final content for domain ${domain}`);        
        })
    } else {
        fs.writeFileSync(dst + filename, "");
        logger.info(`Emptied contents for filename ${filename}`)
        fs.appendFileSync(dst + filename, content);
        logger.info(`Done writing content for filename ${filename}`);
        fs.appendFileSync(dst + domain + "_result.txt", content);
        logger.info(`Done writing final content for domain ${domain}`);
    }
}