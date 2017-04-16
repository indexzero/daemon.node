var cluster = require('cluster');
var numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
    // Daemonize before forking if you want the "uid" option to be useful.
    require('../')();

    // Fork workers.
    for (var i = 0; i < numCPUs; ++i) {
        cluster.fork();
    }

    cluster.on('exit', function(worker, code, signal) {
        console.log('worker ' + worker.process.pid + ' died');
        cluster.fork();
    });

    return;
}

var http = require('http');
http.createServer(function(req, res) {
    res.writeHead(200);
    res.end('process: ' + process.pid);

    // just a demo to cycle workers
    // DO NOT DO THIS IN PRODUCTION
    process.exit();
}).listen(8000);
