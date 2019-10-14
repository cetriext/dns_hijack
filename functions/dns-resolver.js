
function readSubdomains(domain) {
    let subdomains = fs.readFileSync(`./re.txt`, {
        encoding: "utf8"

    })
    // let engines = new Set("ThreatCrowd", "DNSdumpster","Baidu", "Yahoo", "Bing", "Netcraft");
    let list = subdomains.split("\r\n");
    let finalList = [];
    list.map((element) => {
        finalList.push(element);
        // let match = element.match(/CN=\S+/,'');
        // if(match){
        //     finalList.push(match[0].replace("CN=",""))
        // }
    })
    return new Set(finalList);
}
async function dnsResolver(subdomains, domain) {
    console.log(subdomains.size);
    let cnameRecords = "";
    let ipNA = "";
    let noRecord = "";
    let count = 0;
    let space = "                                 ";
    fs.writeFileSync(`./${domain}_result.txt`, "");
    await new Promise((resolve, rej) => {
        subdomains.forEach((subdom) => {
            dns.resolveCname(subdom, async (err, addr) => {
                if (err) {
                    count++;
                    if (err.code === "ENODATA" || err.code === "ESERVFAIL") {
                        noRecord += subdom + space + "NO CNAME ENTRY AVAILABLE" + "\r\n";
                        if (count === subdomains.size) {
                            resolve("success");
                        }
                    }
                } else {
                    if (addr) {
                        dns.resolve(subdom, (err, res) => {
                            count++;
                            if (err) {
                                subdom === "pd00.mfa.starbucks.com" ? console.log(err) : null;
                                ipNA += subdom + space + addr[0] + "\r\n";
                            } else if (res) {
                            if(subdom === "pd00.mfa.starbucks.com"){
                                    console.log(res)
                                    console.log("success")
                                }
                                cnameRecords += subdom + space + addr[0] + space + "IP" + res + "\r\n";
                            } else {
                                console.log(res);
                            }
                            // console.log(count);

                            if (count === subdomains.size) {
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
    fs.appendFileSync(`./${domain}_result.txt`, "\r\n\r\n\r\n");
    fs.appendFileSync(`./${domain}_result.txt`, "CNAME RECORDS DATA \r\n");
    fs.appendFileSync(`./${domain}_result.txt`, cnameRecords);
    fs.appendFileSync(`./${domain}_result.txt`, "\r\n\r\n\r\n");
    fs.appendFileSync(`./${domain}_result.txt`, "NO RECORDS DATA \r\n");
    fs.appendFileSync(`./${domain}_result.txt`, noRecord);
}