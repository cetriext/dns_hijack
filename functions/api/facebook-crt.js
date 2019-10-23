const http = require("request");
const fs = require("fs");
const path = require("path");
const log = require("log4js").getLogger("app");
const writetoFile = require("../../utils/write-file");

module.exports = function getDomainsFromFacebook(domain, callback){
    domain = domain.replace(/ /g,"")
    url =`https://developers.facebook.com/tools/ct/async/search/?step_size=50&query=${domain}`
    j = http.jar();
    const cookie1 = http.cookie(`datr=${process.env.datr}`);
    const cookie2 = http.cookie('c_user=100001999080727');
    const cookie3 = http.cookie(`xs=${process.env.xs}`);
    j.setCookie(cookie1, url);
    j.setCookie(cookie2, url);
    j.setCookie(cookie3, url);
    makeHttpCall(url, domain, callback);
}

function makeHttpCall(url, domain, callback){    
    const  result = new Set(); 
    let errorCount = 0;
    http(url,{
        method: 'POST',
        body: `__a=1&fb_dtsg=${process.env.fb_dtsg}`,
        headers: {
            "Origin" : "https://developers.facebook.com",
            "Host": "developers.facebook.com",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        jar: j
    },(err, resp, body) => {
        if(err){
            log.err(`Error in task: facebookcrt for domain: ${domain} with error: \r\n ${err}`);
            errorCount++;
            if(errorCount < 5){
                makeHttpCall(url, domain, callback);
                log.info(`Retrying error in task: facebookcrt for domain: ${domain} retryCount: ${errorCount}`);
            } else {
                log.error(`Giving up task: facebookcrt for domain: ${domain} retryCount: ${errorCount}`);
                callback("failed", "");
            }
        }
        if(body){
            try{
                body = body.replace("for","");
                body = body.replace("(;;);","");
                body = JSON.parse(body);
                if(body.error){
                    errorCount++;
                    reloadEnv();
                    makeHttpCall(url, domain, callback);
                    log.info(`Retrying token error in task: facebookcrt for domain: ${domain} retryCount: ${errorCount}`);
                }
                if(!url.match(/next_cursor/)){
                    log.info(`Total number of estimated result for task: fbcrtsh domain: ${domain} count: ${body.payload.paging.results_total}`)
                }
                body.payload.data.map((re) => {
                    re.domains.map((domain) => {
                        result.add(domain);
                    })                
                });
                let nextCursor = body.payload.paging.next_cursor;
                if(nextCursor){
                    url += `&next_cursor=${nextCursor}`
                    makeHttpCall(url, domain, callback)
                } else {
                    log.info(`Done fetching all subdomains for task: facebookcrt domain: ${domain} total_results: ${result.size}`);            
                    let content = "";
                    result.forEach((entry) => [
                        content += entry + '\r\n' 
                    ])
                    writetoFile(`facebookcrt_${domain}.txt`, content, domain);
                    callback(null, "success")
                }
            }catch(e){
                log.error(`Error while trying to decode body for task: facebookcrt domain: ${domain}`)
                errorCount++;
                if(errorCount < 5){
                    makeHttpCall(url, domain, callback);
                    log.info(`Retrying decoding error in task: facebookcrt for domain: ${domain} retryCount: ${errorCount}`);
                } else {
                    log.error(`Giving up task: facebookcrt for domain: ${domain} retryCount: ${errorCount}`);
                    callback("failed", "");
                }
            }
        }
    })
}


function reloadEnv(){
    const envFile = path.join(path.resolve("./"),".env");
    let data = fs.readFileSync(envFile, 'utf8');
    data = data.split("\r\n");
    let env = process.env;
    data.map((key) => {
        if(key.match(/fb_dtsg/)){
            let value = key.split("=")[1];
            if(env.fb_dtsg !== value){
                env.fb_dtsg = value;
                log.info(`Environment variable change detected task: facebook_crt key: fb_dtsg`);
            } 
        } else if(key.match(/datr/)){
            let value = key.split("=")[1];
            if(env.datr !== value){
                env.datr = value;
                log.info(`Environment variable change detected task: facebook_crt key: datr`);
            }
        } else if(key.match(/xs/)){
            let value = key.split("=")[1];
            if(env.xs !== value){
                env.xs = value;
                log.info(`Environment variable change detected task: facebook_crt key: xs`);
            }
        }
    })
    log.info(`Environemnt Variables reload done successfully`);
}