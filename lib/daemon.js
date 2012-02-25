/*
 * daemon.js: Wrapper for C++ bindings
 *
 * (C) 2010 Charlie Robbins
 * MIT LICENCE
 *
 */

var fs = require('fs'),
    binding;

binding = require('./daemon.' + process.version);

var daemon = exports;

//
// Export the raw bindings directly
//
Object.keys(binding).forEach(function (k) { daemon[k] = binding[k] });

// 
// ### function start (stdout, stderr)
// #### @stdout {string} Filename to use for the daemon stdout
// #### @stderr {string} Filename to use for the daemon stderr
// Wrapper around C++ start code to update the pid property of the  
// global process js object. If only `stdout` is passed then it is 
// used for both `stdout` and `stderr` in the daemon process.
//
daemon.start = function (stdout, stderr) {
  var pid;
  
  pid = arguments.length === 2
    ? binding.start(stdout, stderr)
    : binding.start(stdout);
  
  process.pid = pid;
  return pid;
};
  
// 
// function daemonize ([out, lock, callback])
//   Run is designed to encapsulate the basic daemon operation in a single async call.
//   When the callback returns you are in the the child process.
//
daemon.daemonize = function (out, lock, callback) {
  function start(fds) {
    var pid = daemon.start.apply(null, fds);
    daemon.lock(lock);
    callback(null, pid);
  }

  if (arguments.length === 1) {
    return start([out]);
  }

  return typeof out === 'object'
    ? open([out.stdout, out.stderr].filter(Boolean), [])
    : open([out], []);
};
  
// 
// function kill (lock, callback)
//   Asynchronously stop the process in the lock file and 
//   remove the lock file
//
daemon.kill = function (lock, callback) {
  fs.readFile(lock, function (err, data) {
    if (err) {
      return callback(err);
    }
    
    try {
      // Stop the process with the pid in the lock file
      var pid = parseInt(data.toString());
      if (pid > 0) {
        process.kill(pid);
      }
      
      // Remove the lock file
      fs.unlink(lock, function (err) {
        return err 
          ? callback(err)
          : callback(null, pid);
      });
    }
    catch (ex) {
      callback(ex);
    }
  });
};
