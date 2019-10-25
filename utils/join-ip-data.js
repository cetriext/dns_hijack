const path = require("path");
const fs = require("fs");
const logger = require("log4js").getLogger("app");
const location = path.join(path.resolve("./"),"output/"); 

function joinIPData(){
    let dirData = fs.readdirSync(location);
    let result = new Set();
    dirData.map((file) => {
        if(file.match(/finalresult/)){
            let fileData = fs.readFileSync(location+file, "utf8");
            let ip = fileData.match(/\s+[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}\.[0-9]{0,3}\s+/ig)
            if(ip){
                ip.map((entry) => {
                    entry = entry.replace(/\s/g,"")
                    let chunks = entry.split(".")
                    if((chunks[0] === "192" && chunks[1] === "168") || (chunks[0] === "172" && (Number(chunks[1]) < 31 || Number(chunks[1]) > 16 )) || chunks[0] === 10){
                        console.log(`Error private ip address ${entry}`)
                    } else {
                        result.add(entry)
                    }
                })
            }
        }
    })
    let content = "";
    result.forEach((entry) => {
        content += entry + "\n"
    })
    fs.writeFileSync(location+ `final_ip_result.txt`, content);
    logger.info(`Done appending ip data to result file count: ${result.size}`)
    // callback(null, "success")
}

joinIPData()