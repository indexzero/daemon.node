# daemon.node

A C++ add-on for Node.js to enable simple daemons in Javascript plus some useful wrappers in Javascript.

## Installation

### Installing daemon.node with npm
```
  [sudo] npm install daemon
```

### Installing daemon.node locally 
```
  node-waf configure build  
```

## Usage

### Caveats Regarding Forking Safety

As of v0.6, node.js has not been fork-safe. What this means for you is that **all daemonization should happen on the first tick and not as part of an asynchronous action**. The easiest way to ensure this is to daemonize your process very early in the script, near the "require" block.

`daemon.kill`, however, is still asynchronous.

### Starting a daemon:
Starting a daemon is easy, just call daemon.start() and daemon.lock().

``` js
var daemon = require('daemon'),
    pid;

pid = daemon.start('stdout.log', 'stderr.log');
daemon.lock('/tmp/yourprogram.pid');
```

`daemon.start` daemonizes your script's process and redirects stdio to the specified files. `daemon.lock` places a lockfile on your daemon.

This library also exposes a higher level facility through javascript for starting daemons:

``` js
  var daemon = require('daemon'),
      pid;
  
  pid = daemon.daemonize({ stdout: 'somefile.log', stderr: 'error.log' }, '/tmp/yourprogram.pid');
  console.log('Daemon started successfully with pid: ' + pid);
```

If you wish you can also simply pass a single pass which you wish to be used for both `stdout` and `stderr`:

``` js
  var daemon = require('daemon'),
      pid;
  
  pid = daemon.daemonize('stdout-and-stderr.log', '/tmp/yourprogram.pid');
  console.log('Daemon started successfully with pid: ' + pid);
```

### Methods

#### daemon.start(stdout[, stderr])
  Takes two filenames, one for `stdout` and one for `stderr`. If only `stdout` is supplied, `stderr` will use the same filename. If no arguments are passed, `stdout` and `stderr` output will be sent to `/dev/null`. Returns the process pid.
#### daemon.lock('/tmp/lockfile.pid')
  Try to lock the file. If it's unable to OPEN the file it will exit. If it's unable to get a LOCK on the file it will return false. Else it will return true.
#### daemon.daemonize({ stdout: 'stdout.log', stderr: 'stderr.log' }, '/tmp/lockfile.pid', [cb])
  A convenience wrapper around `daemon.start` and `daemon.lock`. Returns pid, optionally calls `cb(err, pid)` for error handling and backwards compatibility. *This method is still synchronous*.
#### daemon.kill(lockfile, cb)
  Kills the process specified in the lockfile and cleans the file. Unlike every other method in this library, this one is asynchronous.
#### daemon.closeStdin()
  Closes stdin and reopens fd as /dev/null.
#### daemon.closeStdout()
  Closes stdout and reopens fd as /dev/null.
#### daemon.closeStderr()
  Closes stderr and reopens fd as /dev/null.
#### daemon.closeStdio()
  Closes std[in|out|err] and reopens fd as /dev/null.
#### daemon.chroot('/path_to_chroot_to')
  Attempts to chroot the process, returns exception on error, returns true on success.
#### daemon.setreuid(1000)
  Change the effective user of the process. Can take either an integer (UID) or a string (Username). Returns exceptions on error and true on success.

### The Fine Print

This library is available under the MIT LICENSE. See the LICENSE file for more details. It was originally created by [Slashed][2] and has been forked/improved/hacked upon by a lot of good people. Special thanks to [Isaacs][5] for npm and a great example in [glob][6].

#### Author: [Slashed](http://github.com/slashed)
#### Contributors: [Charlie Robbins](http://nodejitsu.com), [Pedro Teixeira](https://github.com/pgte), [James Halliday](https://github.com/substack), [Zak Taylor](https://github.com/dobl), [Daniel Bartlett](https://github.com/danbuk), [Charlie McConnell](https://github.com/AvianFlu)

[0]: http://slashed.posterous.com/writing-daemons-in-javascript-with-nodejs-0
[1]: https://github.com/pgte/fugue/blob/master/deps/daemon.cc
[2]: https://github.com/slashed/daemon.node
[3]: https://github.com/substack/daemon.node/
[4]: https://github.com/dobl/daemon.node
[5]: https://github.com/isaacs/npm
[6]: https://github.com/isaacs/node-glob
