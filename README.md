# daemon.node

A C++ add-on for Node.js to enable simple daemons in Javascript plus some useful wrappers in Javascript.

## Installation

### Installing npm (node package manager)
```
  curl http://npmjs.org/install.sh | sh
```

### Installing daemon.node with npm
```
  [sudo] npm install daemon
```

### Installing daemon.node locally 
```
  node-waf configure build  
```

## Usage 

There is a great getting started article on daemons and node.js by Slashed that you [can read here][0]. The API has changed slightly from that version thanks to contributions from ptge and [fugue][1]; there is no longer a daemon.closeIO() method, this is done automatically for you.

### Starting a daemon:
Starting a daemon is easy, just call daemon.start() and daemon.lock(). 

``` js
  var daemon = require('daemon');
  
  // Your awesome code here
  
  fs.open('somefile.log', 'w+', function (err, fd) {
    daemon.start(fd);
    daemon.lock('/tmp/yourprogram.pid');
  });
```

This library also exposes a higher level facility through javascript for starting daemons:

``` js
  var util = require('util'),
      daemon = require('daemon');
  
  // Your awesome code here
  
  daemon.daemonize({ stdout: 'somefile.log', stderr: 'error.log' }, '/tmp/yourprogram.pid', function (err, pid) {
    // We are now in the daemon process
    if (err) return util.puts('Error starting daemon: ' + err);
    
    util.puts('Daemon started successfully with pid: ' + pid);
  });
```

### Methods

#### daemon.start([ fd for stdout and stderr | { stdout: fd, stderr: fd } ])
  Either a file descriptor that stdout and stderr should be redirected to or an object containing separate file descriptors for 'stdout' and/or 'stderr'. Otherwise output will be sent to /dev/null.
#### daemon.closeStdin()
  Closes stdin and reopens fd as /dev/null.
#### daemon.closeStdout()
  Closes stdout and reopens fd as /dev/null.
#### daemon.closeStderr()
  Closes stderr and reopens fd as /dev/null.
#### daemon.closeStdio()
  Closes std[in|out|err] and reopens fd as /dev/null.
#### daemon.lock('/file_to_lock')
  Try to lock the file. If it's unable to OPEN the file it will exit. If it's unable to get a LOCK on the file it will return false. Else it will return true.
#### daemon.setsid()
  Starts a new session for the process. Returns the SID as an integer.
#### daemon.chroot('/path_to_chroot_to')
  Attempts to chroot the process, returns exception on error, returns true on success.
#### daemon.setreuid(1000)
  Change the effective user of the process. Can take either an integer (UID) or a string (Username). Returns exceptions on error and true on success.


### The Fine Print
This library is available under the MIT LICENSE. See the LICENSE file for more details. It was created by [Slashed][2] and [forked][3] / [improved][4] / [hacked upon][1] by a lot of good people. Special thanks to [Isaacs][5] for npm and a great example in [glob][6].

#### Author: [Slashed](http://github.com/slashed)
#### Contributors: [Charlie Robbins](http://nodejitsu.com), [Pedro Teixeira](https://github.com/pgte), [James Halliday](https://github.com/substack), [Zak Taylor](https://github.com/dobl), [Daniel Bartlett](https://github.com/danbuk)

[0]: http://slashed.posterous.com/writing-daemons-in-javascript-with-nodejs-0
[1]: https://github.com/pgte/fugue/blob/master/deps/daemon.cc
[2]: https://github.com/slashed/daemon.node
[3]: https://github.com/substack/daemon.node/
[4]: https://github.com/dobl/daemon.node
[5]: https://github.com/isaacs/npm
[6]: https://github.com/isaacs/node-glob
