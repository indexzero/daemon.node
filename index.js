var child_process = require('child_process');

// daemonize ourselves
module.exports = function(opt) {
    // we are a daemon, don't daemonize again
    if (process.env.__daemon) {
        return process.pid;
    }

    var args = [].concat(process.argv);

    // shift off node
    args.shift();

    // our script name
    var script = args.shift();

    // start ourselves as a daemon
    var child = module.exports.daemon(script, args, opt);

    // parent is done
    return process.exit();
}

// daemonizes the script and returns the child process object
module.exports.daemon = function(script, args, opt) {

    // we are a daemon
    if (process.env.__daemon) {
        return process.pid;
    }

    opt = opt || {};

    var stdout = opt.stdout || 'ignore';
    var stderr = opt.stderr || 'ignore';

    var env = opt.env || process.env;

    // the child process will have this set to know they are daemonized
    env.__daemon = true;

    var opt = {
        stdio: ['ignore', stdout, stderr],
        env: env,
        detached: true
    };

    // spawn the child using the same node process as ours
    var child = child_process.spawn(process.execPath, [script].concat(args), opt);

    // required so the parent will exit
    child.unref();

    return child.pid;
}

