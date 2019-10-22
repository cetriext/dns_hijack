const path = require("path");
const fs = require("fs");
const logger = require("log4js").getLogger("app");
const location = path.join(path.resolve("../"),"output/"); 
const dns = require("dns");
const { spawn } = require("child_process");

module.exports = function joinAmassData(domain){
    let dirData = fs.readdirSync(location);
    let result = new Set();
    dirData.map((file) => {
        if(file.match(domain) && file.match(/amass/)){
            let fileData = fs.readFileSync(location+file, "utf8");
            fileData.split("\r\n").map((entry) => {
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
    logger.info(`Done appending data to result file from amass for domain: ${domain}`)
    // dnsResolver(domain);
}

// function dnsResolver(domain) {
//     cindex = 1;
//     let command = spawn("concurrency.exe",[domain])
//     command.stdout.on("data", (chunk) => {
//         if(chunk && cindex===1){
//             cindex++;
//             logger.info(`Resolver Task for domain: ${domain} first chunk received`)
//         }
//         console.log(chunk);
//     })
//     command.stderr.on("error", (err) => {
//         logger.info(`Resolver  Task for domain: ${domain} Error \r\n ${err}`)
//         // callback("error","")
//     })
//     command.on("exit", (code) => {
//         if(code === 0){
//             logger.info(`Resolver Task for domain: ${domain} successfully done`);
//             // writeToFile(`${location}amass_${domain}_${type}.txt`, "amass", domain);
//             callback(null,"success")
//             resolve("success"); 
//         } else {
//             logger.info(`Resolver Task for domain: ${domain} done with unknown statuscode: ${code}`);
//             // callback("error","")
//         }
//     })
// }