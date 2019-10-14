const Queue = require("bull");
const queryCTlogs = require("../functions/api/ctlogs");
const runAmass = require("./amass");
const queryCensus = require("../functions/selenium/censys.js");
const quertCRTSH = require("../functions/api/certsh.js");
const log4js = require("log4js");
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
        this.queueList = ["ctlogs","censys","crtsh","join","resolve","amass"];
        this.ctlogsQueue = this.generateAllQueues("ctlogs");
        this.censysQueue = this.generateAllQueues("censys");
        this.crtshQueue = this.generateAllQueues("crtsh");
        this.joinQueue = this.generateAllQueues("join");
        this.resolveQueue = this.generateAllQueues("resolve");
        this.amassQueue = this.generateAllQueues("amass");
        this.queuesArray = [this.ctlogsQueue,this.censysQueue, this.crtshQueue, this.joinQueue, this.resolveQueue, this.amassQueue]
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
            queue.on("completed", (job, result) => {
                logger.info(`A job completed in queue: ${this.queueList[index]} domain: ${job.data.domain}`)
                if(this.queueList[index] === 'ctlogs'){
                    this.addJobToQueue("crtsh", job.data.domain)
                } else if(this.queueList[index] === 'crtsh'){
                    // this.addJobToQueue("censys", job.data.domain)
                } else if(this.queueList[index] === 'censys'){
                    // this.addJobToQueue("amass", job.data.domain, 1, "timeout");
                } else if(this.queueList[index] === 'amass'){
                    //condition here with max variations in amass
                    logger.info(`Adding iteration job to  quque: amass domain: ${job.data.domain}`)
                    if(i + 1 <= 9){
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
                await job.releaseLock().then(() => {logger.info("releasing the lock")});
                if(this.queueList[index] !== 5){
                    job.retry().then(() => {
                        logger.info(`A failed job added to retry in queue: ${this.queueList[index]} with domain: ${job.data.domain}`);
                    })
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
        this.crtshQueue.process(4,(job, done) => {
            job.takeLock().then((res) => {
                logger.info(`Lock aquired Successfully for task: ctrsh domain: ${job.data.domain}`)
                quertCRTSH(job.data.domain, done);
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
            let count9 = await this.resolveQueue.count();
            let count10 = await this.resolveQueue.getActiveCount();
            let total = count1+count2+count3+count4+count5+count6+count7+count8+count9+count10;
            logger.warn(`Existing jobs count :${total} ctlogsqueue: ${count1 + count2} censysQueue: ${count3 + count4} crtshQueue: ${count5 + count6} joinQueue: ${count7 + count8} resolveQueue: ${count9 + count10}`)
            if(total === 0){
                logger.info(`All queues are empty so running amass on domain ${domain}`);
                this.amassQueue.resume().then(() => {
                    logger.info("Resuming queue: amass for job on domain: ${domain}");
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
        let array = ["facebook.com","starbucks.com","shopify.com","twitter.com","snapchat.com","paypal.com"]
        array.map((domain) => {
            this.ctlogsQueue.add({domain: domain}).then(() => {
                logger.info(`Job added to queue: censys for domain: ${domain}`)
            })
        })
    }

}

let ce = new Queues();
// module.exports = Queues;
// //check amass for stalled event