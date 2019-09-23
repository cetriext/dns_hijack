const httpRequest = require("request");
require("rxjs");
const fs = require("fs");
const dns = require("dns");
const webdriver  = require('selenium-webdriver');
const query = '{"query":"query Directory_page($secure_order_by_1:FiltersTeamFilterOrder!,$where_2:FiltersTeamFilterInput!,$size_3:ProfilePictureSizes!,$size_4:ProfilePictureSizes!) {query {id,...F8}} fragment F0 on Team {resolved_report_count,id} fragment F1 on Team {_profile_picturePkPpF:profile_picture(size:$size_4),name,about,_structured_scopes633GZ:structured_scopes(archived:false,eligible_for_submission:true) {total_count},currency,bounties_paid_last_90_days,reports_received_last_90_days,last_report_resolved_at,id} fragment F2 on Team {handle,name,id,...F1} fragment F3 on Team {_profile_picture1Fh783:profile_picture(size:$size_3),name,handle,submission_state,triage_active,state,external_program {id},id,...F2} fragment F4 on Team {started_accepting_at,id} fragment F5 on Team {currency,base_bounty,id} fragment F6 on Team {currency,average_bounty_lower_amount,average_bounty_upper_amount,id} fragment F7 on Team {id,bookmarked} fragment F8 on Query {me {edit_unclaimed_profiles,id},_teams4qVwvk:teams(first:1000,secure_order_by:$secure_order_by_1,where:$where_2) {pageInfo {hasNextPage,hasPreviousPage},edges {node {id,bookmarked,...F0,...F3,...F4,...F5,...F6,...F7},cursor}},id}","variables":{"first_0":900,"secure_order_by_1":{"started_accepting_at":{"_direction":"DESC"}},"where_2":{"_and":[{"_or":[{"submission_state":{"_eq":"open"}},{"external_program":{"id":{"_is_null":false}}}]},{"external_program":{"id":{"_is_null":true}}},{"_or":[{"_and":[{"state":{"_neq":"sandboxed"}},{"state":{"_neq":"soft_launched"}}]},{"external_program":{"id":{"_is_null":false}}}]}]},"size_3":"medium","size_4":"small"}}';
const source1 = ["lp.starbucks.com", "www.starbucks.com.pe", "www.starbucks.com.tr", "www.starbucks.com.mx", "news.starbucks.com", "e.starbucks.com", "email.mg.starbucks.com", "www.starbucks.com", "store.starbucks.com", "starbucks.com", "promotions.starbucks.com", "www.starbucks.com.tw", "www.starbucks.com.sg", "customerservice.starbucks.com", "ebm.e.starbucks.com", "athome.starbucks.com", "members.starbucks.com", "partner.starbucks.com", "www.starbucks.com.ar", "www.starbucks.com.cn", "www.starbucks.com.br", "www.starbucks.com.hk", "www.starbucks.com.my", "roastery.starbucks.com", "globalassets.starbucks.com"];

function fetchListFromHackerOne() {
    return new Promise((res, rej) => {
        httpRequest({
            url: "https://hackerone.com/graphql?",
            body: query,
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            // json: true
        }, (error, resp, body) => {
            if (error) {
                rej(error)
            }
            if (resp) {
                res(body)
            }
        })
    })
}
async function dnsResolver(subdomains, domain){
    console.log(subdomains.size);
    let cnameRecords = "";
    let ipNA = "";
    let noRecord = "";
    let count = 0;
    let space = "                                 ";
    fs.writeFileSync(`./${domain}_result.txt`,"");
    await new Promise((resolve, rej) => {
        subdomains.forEach((subdom) => {
            dns.resolveCname(subdom, async (err, addr) =>{
                if(err) {
                    count++;
                    if(err.code === "ENODATA" || err.code ==="ESERVFAIL"){
                       noRecord += subdom + space + "NO CNAME ENTRY AVAILABLE" + "\r\n";      
                       if(count === subdomains.size){
                             resolve("success");
                        }               
                    }
                } else {
                    if(addr){
                        dns.resolve(subdom, (err, res) => {
                                count++;
                                if(err){
                                    ipNA += subdom + space + addr[0] + "\r\n";
                                } else if(res) {
                                    cnameRecords += subdom + space + addr[0] +space+"IP" + res + "\r\n"; 
                                }else {
                                    console.log(res);
                                }
                                console.log(count);

                                if(count === subdomains.size){
                                    resolve("success");
                                }
                        })
                    }
                }
            })
        });
    });
    console.log(`Domain ${domain} End`);
    fs.appendFileSync(`./${domain}_result.txt`, "NXDOMAINS DATA \r\n");
    fs.appendFileSync(`./${domain}_result.txt`, ipNA);
    fs.appendFileSync(`./${domain}_result.txt`, "CNAME RECORDS DATA \r\n");
    fs.appendFileSync(`./${domain}_result.txt`, cnameRecords);
    fs.appendFileSync(`./${domain}_result.txt`, "NO RECORDS DATA \r\n");
    fs.appendFileSync(`./${domain}_result.txt`, noRecord);
}
function readSubdomains(domain){
    let subdomains = fs.readFileSync(`./censys_${domain}.txt`, {
        encoding: "utf8"
    
    })
    // let engines = new Set("ThreatCrowd", "DNSdumpster","Baidu", "Yahoo", "Bing", "Netcraft");
    let list = subdomains.split("\r\n");
    let finalList = [];
    list.map((element) => {
        let match = element.match(/CN=\S+/,'');
        if(match){
            finalList.push(match[0].replace("CN=",""))
        }
    })
    return new Set(finalList);
}
async function selenium(domain){
    try{
        var driver = await new webdriver.Builder().forBrowser('firefox').build();
        var result = "";
        let page = 1;
        await driver.get("https://censys.io/login")
        await driver.findElement(webdriver.By.id("login")).sendKeys("hemachandsai@gmail.com")
        await driver.findElement(webdriver.By.id("password")).sendKeys("11371026@saii")
        await driver.findElement(webdriver.By.className("button")).click()
        for(let i=1; i <= 100; i++){
            let url = `https://censys.io/certificates?q=${domain}.com` + (i === 1 ? "" : `&page=${i}`);
            console.log(url);
            await driver.get(url)
            await driver.sleep(1000)
            let elements;
            await driver.findElements(webdriver.By.className("SearchResult__title-text")).then((res) => {
                console.log(res)
                elements  = res;
            })
            console.log(elements)
            if(elements.length !== 25){
                console.log("Not equals 25 "+ elements.length)
                break;n
            } else {
                await new Promise((res, rej) => {
                    let count = 0;
                    elements.map(async (ele) => {
                        ele.getAttribute("innerText").then((text) => {
                            count++;
                            result += text + "\r\n";
                            if(count === 10){
                                res("success")
                            }
                        })
                    })  
                })
            }
            page++;
        }
    }catch(e){
        console.log(e)
    } finally{
        fs.writeFileSync(`censys_${domain}.txt`, result);
        driver.quit();
    }
}
async function getWebsites(){
    try{
        var driver = await new webdriver.Builder().forBrowser('firefox').setFirefoxOptions().build();
        var result = "";
        let page = 1;
        await driver.get("https://www.google.com");
        await driver.findElement(webdriver.By.className("gLFyf")).sendKeys("hemachandsai@gmail.com");
        await driver.findElement(webdriver.By.className("gNO89b")).click();
        


    }catch(e){
        console.log(e)
    } finally{
        fs.writeFileSync(`censys_${domain}.txt`, result);
        driver.quit();
    }
}
async function main() {
    // selenium("uber")
    let subdomains = readSubdomains("uber");
    await dnsResolver(subdomains, "uber");
    // let result = await fetchListFromHackerOne();
    // fs.writeFileSync("./hckerone.txt", result)
    // let result = await fs.readFileSync("./hckerone.txt", "utf8");
    // result.data.query[Object.keys(result.data.query)[2]].edges.map((edge) => {
    //     console.log(edge.node.name);
    // })
    // console.log(result.data.query[Object.keys(result.data.query)[2]].edges[1])
    // getWebsites();
}
main();


//function input as iterable vs every time invoking fucntion from main fucntion