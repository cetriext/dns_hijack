const yargs = require("yargs").argv;
var http = require("https");
const log4js = require("log4js");
require('dotenv').config()

log4js.configure({
    appenders: {
        out: {
            type: 'stdout'
        },
        app: {
            type: 'file',
            filename: 'app.log'
        },
        queue: {
            type: 'file',
            filename: 'queue.log'
        }
    },
    categories: {
        default: {
            appenders: ['app', 'out'],
            level: 'all'
        },
        queue: {
            appenders: ["queue", 'out'],
            level: 'all'
        }
    }
});
const Queues = require("./utils/queue-manager");
const queues = new Queues();


const { performance, PerformanceObserver } = require("perf_hooks");
const obs = new PerformanceObserver((items) => {
    let duration = items.getEntries()[0].duration;
    console.log(`Program took ${duration / (1000 * 60)} minutes to complete`);
    performance.clearMarks();
  });
obs.observe({ entryTypes: ['measure'] });

async function main() {
    performance.mark("A");
    // implement this in queues whith number of max items set to max sockets in node try
    // fetchProgramData();
    let commands = yargs._;
    let domains = yargs.domains.split(",");
    if(!domains.length){
        console.log("Domains required are empty");
        return
    }
    if(commands.includes("query")){
        domains.map((each) => {
            queues.addJobToQueue("ctlogs",each);
        })
    } else {
        console.log("Invalid Command");
        return
    }
}

process.on("exit", () => {
    performance.mark("B");
    performance.measure("A to B", "A", "B");
    console.log("==================> EXIT <=================")
})

process.on("SIGINT", () => {
    queues.emptyQueues();
    performance.mark("B");
    performance.measure("A to B", "A", "B");
    console.log("==================> EXIT <=================")
})

main();
//function input as iterable vs every time invoking fucntion from main fucntion
//for loop block till asybnc code like primise await
// promise in fucntion return after resolve hope happnes check