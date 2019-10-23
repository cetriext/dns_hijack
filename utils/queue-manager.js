const Queue = require("bull");
const queryCTlogs = require("../functions/api/ctlogs");
const runAmass = require("./amass");
const queryCensus = require("../functions/selenium/censys.js");
const queryCRTSH = require("../functions/api/certsh.js");
const queryFBcrtsh = require("../functions/api/facebook-crt.js");
const joindata = require("../utils/join-data");
const cleanResultdata = require("../utils/clean-result-files");
const log4js = require("log4js");
const yargs = require("yargs").argv;


require("dotenv").config();

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
const logger = require("log4js").getLogger("queue");

class Queues{
    constructor(){
        this.queueList = ["ctlogs","censys","crtsh","join","clean","amass", "fbcrtsh"];
        this.ctlogsQueue = this.generateAllQueues("ctlogs");
        this.censysQueue = this.generateAllQueues("censys");
        this.crtshQueue = this.generateAllQueues("crtsh");
        this.fbcrtshQueue = this.generateAllQueues("fbcrtsh");
        this.joinQueue = this.generateAllQueues("join");
        this.cleanQueue = this.generateAllQueues("clean");
        this.amassQueue = this.generateAllQueues("amass");
        this.queuesArray = [this.ctlogsQueue,this.censysQueue, this.crtshQueue, this.joinQueue, this.cleanQueue, this.amassQueue, this.fbcrtshQueue]
        this.addEventListeners(this.queuesArray);
        this.processQueues(this.queuesArray);
        this.test();
    }
    addEventListeners(queuesLis){
        queuesLis.map((queue, index) => {
            queue.on("error", (err) => {
                logger.error(`Error in queue: ${this.queueList[index]} \r\n ${err}`)
            })
            queue.on("active", (job, promise) => {
                logger.info(`A job has started in queue: ${this.queueList[index]} domain: ${job.data.domain}`)
            })
            queue.on("completed", async(job, result) => {
                logger.trace(`A job completed in queue: ${this.queueList[index]} domain: ${job.data.domain}`)
                if(this.queueList[index] === 'ctlogs'){
                    let count1 = await this.ctlogsQueue.count();
                    let count2 = await this.ctlogsQueue.getActiveCount();
                    if(count1 + count2 === 0){
                        logger.debug(`Queue empty queuename: CTLOGS`)
                    }
                    // this.addJobToQueue("crtsh", job.data.domain)
                } else if(this.queueList[index] === 'crtsh'){
                    let count1 = await this.crtshQueue.count();
                    let count2 = await this.crtshQueue.getActiveCount();
                    if(count1 + count2 === 0){
                        logger.debug(`Queue empty queuename: CRTSH`)
                    }
                    // this.addJobToQueue("censys", job.data.domain)
                    // this.addJobToQueue("fbcrtsh", job.data.domain)
                } else if(this.queueList[index] === 'fbcrtsh'){
                    
                    let count1 = await this.fbcrtshQueue.count();
                    let count2 = await this.fbcrtshQueue.getActiveCount();
                    if(count1 + count2 === 0){
                        logger.debug(`Queue empty queuename: FBCRTSH`)
                    }
                    // this.addJobToQueue("amass", job.data.domain, 1, "timeout");
                    // this.addJobToQueue("censys", job.data.domain);
                } else if(this.queueList[index] === 'censys'){
                    
                    let count1 = await this.censysQueue.count();
                    let count2 = await this.censysQueue.getActiveCount();
                    if(count1 + count2 === 0){
                        logger.debug(`Queue empty queuename: CENSYS`)
                    }
                    // this.addJobToQueue("amass", job.data.domain, 1, "timeout");
                } else if(this.queueList[index] === 'amass'){
                    //condition here with max variations in amass
                    logger.info(`Adding iteration job to  queue: amass domain: ${job.data.domain}`)
                    if(job.data.type + 1 <= 9){
                        this.addJobToQueue("amass",job.data.domain,job.data.type + 1,"timeout")
                    } else {
                        logger.info(`Max iterations completed quque: amass domain: ${job.data.domain}`)
                    }
                } else{
                    //next sequence
                    // this.addJobToQueue("amass",job.data.domain,1,"timeout")

                }
            })
            queue.on("failed", async (job, err) => {
                logger.warn(`A job failed in queue: ${this.queueList[index]} for domain: ${job.data.domain} with error: ${err}`);
                if(!JSON.stringify(err).match(/job stalled more than allowable limit/)){
                    await job.releaseLock().then(() => {logger.info("releasing the lock")});
                    if(this.queueList[index] !== 5){
                        // job.retry().then(() => {
                            // logger.info(`A failed job added to retry in queue: ${this.queueList[index]} with domain: ${job.data.domain}`);
                        // })
                    }
                }
            })
            queue.on("paused", ()=> {
                logger.info(`A Queue got paused quque: ${this.queueList[index]}`)
            })
            queue.on("resumed", (job) => {
                logger.info(`A Queue got resumed queue: ${this.queueList[index]}`)
            })
            queue.on("removed", (job)=> {
                logger.info(`A job got removed from queue: ${this.queueList[index]} domain: ${job.data.domain}`)
            })
        })
    }
    generateAllQueues(name){
        if(name !== 'amass'){
            return new Queue(name, {
                    defaultJobOptions: {
                        attempts: 10,
                        removeOnComplete: true
                    }
                })
        } else {
            return new Queue("amass", {
                defaultJobOptions: {
                    backoff: {
                        type: "exponential",
                        delay: 10000
                    },
                    attempts: 10,
                    removeOnComplete: true
                }
            })
        }
    }
    processQueues(queueList){
        this.ctlogsQueue.process(6, (job, done) => {
            job.takeLock().then((res) => {
                logger.info(`Lock aquired Successfully for task: ctlogs domain: ${job.data.domain}`)
                queryCTlogs(job.data.domain, done);
            }, (err) => {
                logger.error(`Error while taking lock for task: ctlogs domain: ${job.data.domain} \r\n error: ${err}`)
            });
        })
        this.amassQueue.process((job, done) => {
            job.takeLock().then((res) => {
                logger.info(`Lock aquired Successfully for task: amass domain: ${job.data.domain}`)
                runAmass(job.data.domain, job.data.type, done);
            }, (err) => {
                logger.error(`Error while taking lock for task: ctlogs domain: ${job.data.domain} \r\n error: ${err}`)
            });
        })
        this.fbcrtshQueue.process(6,(job, done) => {
            job.takeLock().then((res) => {
                logger.info(`Lock aquired Successfully for task: fbcrtsh domain: ${job.data.domain}`)
                queryFBcrtsh(job.data.domain, done);
            }, (err) => {
                logger.error(`Error while taking lock for task: ctlogs domain: ${job.data.domain} \r\n error: ${err}`)
            });
        })
        this.crtshQueue.process(6,(job, done) => {
            job.takeLock().then((res) => {
                logger.info(`Lock aquired Successfully for task: ctrsh domain: ${job.data.domain}`)
                queryCRTSH(job.data.domain, done);
            }, (err) => {
                logger.error(`Error while taking lock for task: ctlogs domain: ${job.data.domain} \r\n error: ${err}`)
            });
        })
        this.censysQueue.process(2,(job, done) => {
            job.takeLock().then((res) => {
                logger.info(`Lock aquired Successfully for task: censys domain: ${job.data.domain}`)
                queryCensus(job.data.domain, done);
            }, (err) => {
                logger.error(`Error while taking lock for task: ctlogs domain: ${job.data.domain} \r\n error: ${err}`)
            });
        })
        this.joinQueue.process(3, (job, done) => {
            job.takeLock().then((res) => {
                logger.info(`Lock aquired Successfully for task: join domain: ${job.data.domain}`)
                joindata(job.data.domain, done);
            }, (err) => {
                logger.error(`Error while taking lock for task: join domain: ${job.data.domain} \r\n error: ${err}`)
            });
        })
        
        this.cleanQueue.process(3, (job, done) => {
            job.takeLock().then((res) => {
                logger.info(`Lock aquired Successfully for task: clean domain: ${job.data.domain}`)
                cleanResultdata(job.data.domain, done);
            }, (err) => {
                logger.error(`Error while taking lock for task: clean domain: ${job.data.domain} \r\n error: ${err}`)
            });
        })
    }
    async addJobToQueue(queuename, domain, type = 0, mode="timeout"){
        logger.info(`Adding job to queue: ${queuename} domain: ${domain}`);
        if(queuename === 'amass'){
            let count1 = await this.ctlogsQueue.count();
            let count2 = await this.ctlogsQueue.getActiveCount();
            let count3 = await this.censysQueue.count();
            let count4 = await this.censysQueue.getActiveCount();
            let count5 = await this.crtshQueue.count();
            let count6 = await this.crtshQueue.getActiveCount();
            let count7 = await this.joinQueue.count();
            let count8 = await this.joinQueue.getActiveCount();
            let count9 = await this.cleanQueue.count();
            let count10 = await this.cleanQueue.getActiveCount();
            let count11 = await this.fbcrtshQueue.count();
            let count12 = await this.fbcrtshQueue.getActiveCount();
            let total = count1+count2+count3+count4+count5+count6+count7+count8+count9+count10+count11+count12;
            logger.warn(`Existing jobs count :${total} ctlogsqueue: ${count1 + count2} censysQueue: ${count3 + count4} crtshQueue: ${count5 + count6} joinQueue: ${count7 + count8} resolveQueue: ${count9 + count10} fbcrtshQueue: ${count11 + count12}`)
            if(total === 0){
                logger.info(`All queues are empty so running amass on domain ${domain}`);
                this.amassQueue.resume().then(() => {
                    logger.info(    `Resuming queue: amass for job on domain: ${domain}`);
                }) 
                if(mode === "timeout"){
                    this.amassQueue.add({domain: domain, type: type}, {
                        defaultJobOptions: {
                            timeout: 6 * 60 * 1000
                        }
                    }).then(() => {
                        logger.info(`Job added to queue: amass for domain: ${domain}`)
                    })
                } else if(mode === "delay"){
                    this.amassQueue.add({domain: domain, type: type}, {
                        defaultJobOptions: {
                            delay: 10 * 60 * 1000
                        }
                    }).then(() => {
                        logger.info(`Job added to queue: amass for domain: ${domain}`)
                    })
                }
            } else {
                logger.info(`Existing jobs in other Queues pausing amass domain: ${domain}`);
                this.amassQueue.pause().then(() => {
                    logger.info(`Amass queue successfully paused`);                    
                });
                this.amassQueue.add({domain: domain, type: type}, {
                    defaultJobOptions: {
                        delay: 10 * 60 * 1000
                    }
                }).then(() => {
                    logger.info(`Job added after pausing to queue: amass for domain: ${domain}`)
                })
            }
        } else if(queuename === 'ctlogs'){
            this.ctlogsQueue.add({domain: domain}).then(() => {
                logger.info(`Job added to queue: ctlogs for domain: ${domain}`)
            })
        } else if(queuename === 'crtsh'){
            this.crtshQueue.add({domain: domain}).then(() => {
                logger.info(`Job added to queue: crtsh for domain: ${domain}`)
            })
        } else if(queuename === 'censys'){
            this.censysQueue.add({domain: domain}).then(() => {
                logger.info(`Job added to queue: censys for domain: ${domain}`)
            })
        } else if(queuename === 'fbcrtsh'){
            this.fbcrtshQueue.add({domain: domain}).then(() => {
                logger.info(`Job added to queue: fbcrtsh for domain: ${domain}`)
            })
        } else if(queuename === 'join'){
            this.joinQueue.add({domain: domain}).then(() => {
                logger.info(`Job added to queue: join for domain: ${domain}`)
            })
        } else if(queuename === 'clean'){
            this.cleanQueue.add({domain: domain}).then(() => {
                logger.info(`Job added to queue: clean for domain: ${domain}`)
            })
        }
    }
    emptyQueues(){
        this.queuesArray.map((queue, index) => {
            queue.empty().then(() => {
                queue.clean(0, 'delayed');
                queue.clean(0, 'wait');
                queue.clean(0, 'active');
                queue.clean(0, 'completed');
                queue.clean(0, 'failed');
                logger.info(`Emptied redis queue: ${this.queueList[index]}`);
            });
        })
        this.shutDownBull(this.queuesArray);
    }
    shutDownBull(queueList){
        let count = 0;
        queueList.map((queue, index) => {
            queue.close()
            .then(() => {
                count++;
                logger.info(`Bull queue shutdown gracefully for queue: ${this.queueList[index]}`);
                if(count === queueList.length){
                    logger.info(`Bull shutdown gracefully`);
                    process.exit(0);
                }
              }, function(err) {
                count++;
                logger.error(`Bull closed with error: ${err.message}`);
                process.exit(1);
              });
        })
    }
    test(){
        let commands = yargs._;
            let array = ["berush.com", "bitmoji.com", "bitstrips.com", "events.semrush.com ", "gnip.com", "greenhouse.io", "hacker101.com", "hackerone-ext-content.com", "hackerone-user-content.com", "hackerone.com", "hackerone.net", "istarbucks.co.kr", "labs-semrush.com", "legalrobot.com", "mobpub.com", "onelogin.com", "paypal.com", "periscope.tv", "pscp.tv", "semrush.com", "shipt.com", "slack-files.com", "slack-imgs.com", "slack-redir.net", "slack.com", "slackatwork.com", "slackb.com", "spaces.pm", "starbucks.ca", "starbucks.co.jp", "starbucks.co.uk", "starbucks.com", "starbucks.com.br", "starbucks.com.cn", "starbucks.com.sg", "starbucks.de", "starbucks.fr", "starbucksreserve.com", "twimg.com", "twitter.com", "uber.com", "uber.com.cn", "ubunt.com", "ui.com", "vine.co"];
            array.map((domain) => {
                domain = domain.replace(/ /g,"")
                if(commands.includes("ctlogs")){
                    this.addJobToQueue("ctlogs", domain)
                } else if(commands.includes("crtsh")){
                    this.addJobToQueue("crtsh", domain)
                } else if(commands.includes("fbcrtsh")){
                    this.addJobToQueue("fbcrtsh", domain)
                }  else if(commands.includes("join")){
                    this.addJobToQueue("join", domain)
                }  else if(commands.includes("clean")){
                    this.addJobToQueue("clean", domain)
                }
        })
    }
}

let ce = new Queues();
// module.exports = Queues;
// //check amass for stalled event