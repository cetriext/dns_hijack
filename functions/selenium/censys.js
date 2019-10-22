const webdriver = require('selenium-webdriver');
const logger = require("log4js").getLogger("app");
var writeToFile = require("../../utils/write-file.js");
// hosab@imailpro.net
module.exports = async function selenium(domain, callback) {
    var driver = await new webdriver.Builder().forBrowser('firefox').build();
    try {
        var result = "";
        let page = 1;
        await driver.get("https://censys.io/login")
        await driver.findElement(webdriver.By.id("login")).sendKeys("hemachandsai@gmail.com")
        await driver.findElement(webdriver.By.id("password")).sendKeys("11371026@saiI")
        await driver.findElement(webdriver.By.className("button")).click()
        for (let i = 1; i <= 100; i++) {
            let url = `https://censys.io/certificates?q=${domain}` + (i === 1 ? "" : `&page=${i}`);
            await driver.get(url)
            // await driver.sleep(2000)
            let elements;
            await driver.wait(webdriver.until.elementLocated(webdriver.By.className("SearchResult__title-text")), 15000);
            await driver.findElements(webdriver.By.className("SearchResult__title-text")).then((res) => {
                elements = res;
            })
            if (elements.length !== 25) {
                logger.warn("Not equals 25 error in censys selenium with real length: " + elements.length);
                if(elements.length === 0){
                    callback("error","");
                    driver.close();
                    break;
                }
            } 
            // else {
                await new Promise((res, rej) => {
                    let count = 0;
                    elements.map(async (ele) => {
                        ele.getAttribute("innerText").then((text) => {
                            count++;
                            let match = text.match(/CN=\S+/,'');
                            if(match){
                                result += match[0].replace("CN=","") + "\r\n";
                            }
                            if (count === 10) {
                                // res("success")
                            }
                            res("success")
                        })
                    })
                })
            // }
            page++;
            if(elements.length < 25){
                driver.close();
                break;
            }
        }
    } catch (err) {
        logger.error(`Error in selenium censys page with error: ${err}`);
        console.log(err);
    } finally {
        driver.close(); 
    }
    logger.info(`Selenium scraping from censys successfull for domain: ${domain}`)
    writeToFile(`censys_${domain}.txt`, result, domain);
    callback(null, "success");
}