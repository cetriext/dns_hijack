const fs = require("fs");
const async = require("async");

const readStream1 = fs.createReadStream("c://apps/words1.txt", 'utf8');
const readStream2 = fs.createReadStream("c://apps/words2.txt", 'utf8');
const writeStream = fs.createWriteStream("c://apps/words1.txt", {
    encoding: 'utf8',
    flags: 'a'
});

const loadData1 = new Set();
const loadData2 = new Set();

async.parallel([
    (cb) => {
    readStream1.on('data', (chunk) => {
        chunk.split('\r\n').map((word) => {
            if(word !== "" || word !== "\n" || word !== "\r\n"){
                loadData1.add(word)
            }
        });   
    })
    readStream1.on('end', () => {
        cb(null, "suc");
    })
    readStream1.on('error', (err) => {
        console.error(err);
        if(err.code === 'ENOENT'){
            console.log(`No file existing at ${err.path}`)
        }
        cb(err, "err")
    })
},
(cb) => {
    readStream2.on('data', (chunk) => {
        chunk.split('\n').map((word) => {
            if(word !== "" || word !== "\n" || word !== "\r\n"){
                loadData2.add(word)
            }
        });   
    })
    readStream2.on('end', () => {
        cb(null, "suc");
    })
    readStream2.on('error', (err) => {
        console.error(err);
        if(err.code === 'ENOENT'){
            console.log(`No file existing at ${err.path}`)
        }
        cb(err, "err");
    })
}],(err, result) => {
    let matches = 0;
    let newdata = new Set();
    let count = 0;
    if(result[0] === "suc" && result[1] === "suc"){
        loadData2.forEach((word) => {
            if(loadData1.has(word)){
                matches++;
            } else{
                count++;
                newdata.add(word);
            }
        })
        newdata.forEach((word) => {
            writeStream.write(word + '\r\n', (err) => {
                if(err){
                    console.log(`Error while writing chunk to file \r\n ${err}`);
                }
            })
        })
        console.log(`Done removing duplicates file1: ${ loadData1.size } file2: ${ loadData2.size } and writing to file unique records: ${Math.round(((loadData2.size - matches)/loadData2.size) * 100)}%`);
    }
})



//if entire file to be read is a single line how node deals with breaking chunks
//how to compare big files without loading into memory completely i.e hwo to remove duplicates