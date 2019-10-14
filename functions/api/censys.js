async function censysapi() {
    var url = "https://censys.io/api/v1/search/certificates";
    let au = "Basic " + new Buffer("a46504b5-0163-4011-ab27-cfca3dd058d4" + ":" + "cvgmgZWHnroB5cb3biqRaZzf1s3OX70I").toString("base64");
    fs.writeFileSync("sta_result.txt", "");
    result = "";
    await new Promise((res, rej) => {
        for (let i = 1; i < 11; i++) {
            let query = `{"query": "starbucks.com", "page" : ${i}}`
            httpRequest(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": au
                },
                body: query
            }, (err, resp, body) => {
                data = JSON.parse(body);
                console.log(data);
                data.results.map((re) => {
                    let match = re["parsed.subject_dn"].match(/CN=\S+/)[0].replace("CN=", "")
                    if (match) {
                        result += match + "\r\n";
                    }
                })
                if (i === 10) {
                    res("success")
                }
            })
        }
    })
    fs.appendFileSync("sta_result.txt", result);

}