const path = require("path");
const fs = require("fs");
const logger = require("log4js").getLogger("app");
const location = path.join(path.resolve("./"),"output/"); 

function readIPData(port){
    let ipData = fs.readFileSync(location + "out.json","utf8");
    let array = JSON.parse(ipData);
    let result1 = [];
    array.map((result) => {
        if(port === "misc" ? result.ports[0].port != 80 && result.ports[0].port != 443 && result.ports[0].port != 22 && result.ports[0].port != 8080 && result.ports[0].port !== 8443  : result.ports[0].port === port){
            let dir = fs.readdirSync(location)
            for(let i=0; i < dir.length; i++){
                folder = dir[i];
                if(folder.match(/finalresult/)){
                    let match;
                    let content = fs.readFileSync(location + folder, "utf8");
                    content.split('\n').map((re) => {
                        let regex = new RegExp(`\\S+\\s+${result.ip}`)
                        let data = re.match(regex)
                        if(data){
                            result1.push({
                                "ip": result.ip,
                                "port": result.ports[0].port,
                                "data": data[0]
                            })
                            if(result.ports[0].service && result.ports[0].service.banner && match){
                                let match = result.ports[0].service.banner.match(/server:\s*\S+/gi)
                                if(match){
                                    result1[result1.length - 1].banner = match
                                }
                            }
                            match = true;
                        }
                    })
                    if(match){
                        break;
                    }
                }
            }
        }
    })
    result1.sort((a,b) => {
        if(a.port < b.port){
            return -1
        } else {
            return 1
        }
    })
    let content = "";
    result1.map((op) => {
        content += JSON.stringify(op) + "\n"
    })
    fs.writeFileSync(`./port_scan_op_${port}.txt`,content)
}

readIPData("misc")