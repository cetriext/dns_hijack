const Queue = require('bull');
const dnsQueue = new Queue("dns", 'redis://127.0.0.1:6379');


dnsQueue.process(function(job, done){

    job.progress(42);
    done();
    done(new Error('error transcoding'));
    done(null, { framerate: 29.5 /* etc... */ });
    throw new Error('some unexpected error');
  });

for(let i=0;i < 100; i++){
        dnsQueue.add({"hello": 1})
}

dnsQueue.on('completed', function(job, result){
    // Job completed with output result!
    console.log("done");
})

dnsQueue.on('error', function(job, result){
    // Job completed with output result!
    console.log("done");
})