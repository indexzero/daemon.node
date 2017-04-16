var child_process = require('child_process');

// daemonize ourselves
module.exports = function(opt) {
    // we are a daemon, don't daemonize again
    if (process.env.__daemon) {
        // We're spawning a child, not doing a traditional unix exec, so we
        // can't do anything with setuid/setgid until we get here.
        // Similarly, we can't write the pidfile until after spawn().
        if (opt.pidfile){
            if (!process.env.__daemon_pidfile){
                // If the daemon spawns further children, e.g. using cluster,
                // they mustn't try overwrite the pidfile.
                process.env.__daemon_pidfile = true;
                write_pidfile(opt.pidfile);
            }
        }

        if (opt.uid){
            var uid_num = parseInt(opt.uid);
            if (isNaN(uid_num)){
                uid_num = uid_from_name(opt.uid);
            }
            if (uid_num){
                process.setuid(uid_num);
            }
        }

        return process.pid;
    }

    var args = [].concat(process.argv);

    // shift off node
    args.shift();

    // our script name
    var script = args.shift();

    opt = opt || {};
    var env = opt.env || process.env;

    // the child process will have this set so we can identify it as being daemonized
    env.__daemon = true;

    // start ourselves as a daemon
    module.exports.daemon(script, args, opt);

    // parent is done
    return process.exit();
};

// daemonizes the script and returns the child process object
module.exports.daemon = function(script, args, opt) {

    opt = opt || {};

    var stdout = opt.stdout || 'ignore';
    var stderr = opt.stderr || 'ignore';

    var env = opt.env || process.env;
    var cwd = opt.cwd || process.cwd;

    var cp_opt = {
        stdio: ['ignore', stdout, stderr],
        env: env,
        cwd: cwd,
        detached: true
    };

    // spawn the child using the same node process as ours
    var child = child_process.spawn(process.execPath, [script].concat(args), cp_opt);

    // required so the parent can exit
    child.unref();

    return child;
};

function uid_from_name(name) {
    var id = undefined,
        users = undefined;
    try{
        var users = require('fs').readFileSync('/etc/passwd', {encoding: 'utf8'});
    }catch(ex){
        throw new Error('/etc/passwd not readable; try using a numeric UID instead of a username');
    }
    var parts = users.match(new RegExp('^' + name + ':[^:]+:([0-9]+)', 'm'));
    if (!parts){
        throw new Error('No such user "' + name + '" in /etc/passwd');
    }
    id = parseInt(parts[1]);
    if (isNaN(id)){
        throw new Error('Cannot parse UID for "' + name + '" from /etc/passwd');
    }
    return id;
}

function write_pidfile(name) {
    var path = require('path'),
        fs = require('fs');

    if (typeof(name) !== 'string'){
        throw new Error('pidfile must be a fully qualified filename string');
    }

    var name = path.normalize(name),
        dir = path.dirname(name);

    if (!fs.existsSync(dir)){
        throw new Error('pidfile directory ' + dir + ' does not exist');
    }

    fs.writeFileSync(name, process.pid + '\n');
}
