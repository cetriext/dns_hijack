const { spawn } = require("child_process");
const path = require("path");
var writeToFile = require("./write-file.js");
const logger = require("log4js").getLogger("app");
//improvement try with shell as well
module.exports =  function runAmass(domain, type, callback){
new Promise((resolve, reject) =>{
// typecodes:-
    // 1 passive
    // 2 active
    // 3 brute
    // 6 active with wordlist
    // 7 passive with wordlist
    // 8 brute with wordlist
    // 9 active with alterations with wordlist
    // 10 passive with alterations with wordlist
    let command;
    let processIdentifier = "";
    let location = path.join(path.resolve("./")+"\\output\\");
    switch(type){
        case 1:
            command = spawn("amass.exe",["enum","-passive", "-o",`${location}amass_${domain}_${type}.txt`, "-d",`${domain}`,"-timeout","2"])
            processIdentifier = "passive mode"
            break;
        case 2:
            command = spawn("amass.exe",["enum","-active", "-o",`${location}amass_${domain}_${type}.txt`, "-d",`${domain}`,"-timeout","2"])
            processIdentifier = "active mode"            
            break;
        case 3:
            command = spawn("amass.exe",["enum","-brute", "-o",`${location}amass_${domain}_${type}.txt`, "-d",`${domain}`,"-timeout","5"])
            processIdentifier = "brute force mode"       
            break;
        case 4:
            command = spawn("amass.exe",["enum","-active", "-w","c:\\apps\\words1.txt","-o",`${location}amass_${domain}_${type}.txt`, "-d",`${domain}`,"-timeout","2"])
            processIdentifier = "active mode with wordlist"
            break;
        case 5:
            command = spawn("amass.exe",["enum","-passive", "-w", "c:\\apps\\words1.txt", "-o",`${location}amass_${domain}_${type}.txt`, "-d",`${domain}`,"-timeout","2"])
            processIdentifier = "passive mode with wordlist"
            break;
        case 6:
            command = spawn("amass.exe",["enum","-brute", "-w", "c:\\apps\\words1.txt", "-o",`${location}amass_${domain}_${type}.txt`, "-d",`${domain}`,"-timeout","5"])
            processIdentifier = "brute mode with wordlist"
            break;
        case 7:
            command = spawn("amass.exe",["enum","-active", "-aw" , "c:\\apps\\words1.txt","-o",`${location}amass_${domain}_${type}.txt`, "-d",`${domain}`,"-timeout","2"])
            processIdentifier = "active mode with alterations and wordlist"
            break;
        case 8:
            command = spawn("amass.exe",["enum","-passive", "-aw", "c:\\apps\\words1.txt", "-o",`${location}amass_${domain}_${type}.txt`, "-d",`${domain}`,"-timeout","2"])
            processIdentifier = "passive mode with alterations and wordlist"
            break;
        case 9:
            command = spawn("amass.exe",["enum","-vbrute", "-aw", "c:\\apps\\words1.txt", "-o",`${location}amass_${domain}_${type}.txt`, "-d",`${domain}`,"-timeout","5"])
            processIdentifier = "brute mode with alterations and wordlist"
            break;
    }
    let cindex = 1;
    command.stdout.on("data", (chunk) => {
        if(chunk && cindex===1){
            cindex++;
            logger.info(`AMASS Task for domain: ${domain} and identifier ${processIdentifier} first chunk received`)
        }
    })
    command.stderr.on("error", (err) => {
        logger.info(`AMASS Task for domain: ${domain} and identifier ${processIdentifier} Error \r\n ${err}`)
        callback("error","")
    })
    command.on("exit", (code) => {
        if(code === 0){
            logger.info(`AMASS Task for domain: ${domain} and identifier ${processIdentifier} successfully done`);
            // writeToFile(`${location}amass_${domain}_${type}.txt`, "amass", domain);
            callback(null,"success")
            resolve("success"); 
        } else {
            logger.info(`AMASS Task for domain: ${domain} and identifier ${processIdentifier} done with unknown statuscode: ${code}`);
            callback("error","")
        }
    })
    })
}