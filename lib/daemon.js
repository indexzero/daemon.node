/*
 * daemon.js: Wrapper for C++ bindings
 *
 * (C) 2010 and Charlie Robbins
 * MIT LICENCE
 *
 */

var fs = require('fs'),
    binding;

//
// Try catch here around multiple build paths to support
// `node@0.4.x` and `node@0.6.x`.
//
try { binding = require('../build/default/daemon') }
catch (ex) { binding = require('../build/Release/daemon') }

var daemon = exports;

//
// Export the raw bindings directly
//
Object.keys(binding).forEach(function (k) { daemon[k] = binding[k] });

// 
// function start (fd)
//   Wrapper around C++ start code to update the pid property of the  
//   global process js object.  
//
daemon.start = function (fd) {
  var pid;
  process.stdout.write('');
  process.stderr.write('');
  if (process._channel) {
    // stops failed assertion when used in forked process
    process._channel.close();
  }
  if (typeof(fd) === 'object') {
    pid = binding.start(fd.stdout, fd.stderr);
  }
  else {
    pid = binding.start(fd);
  }
  process.pid = pid;
  return pid;
};
  
// 
// function daemonize ([out, lock, callback])
//   Run is designed to encapsulate the basic daemon operation in a single async call.
//   When the callback returns you are in the the child process.
//
daemon.daemonize = function (out, lock, callback) {
  //
  // If we only get one argument assume it's an fd and 
  // simply return with the pid from daemon.start(fd);
  //
  if (arguments.length === 1) {
    return daemon.start(out);
  }
  
  var errors = [],
      fds = {},
      outstanding = 0;

  var finish = function () { 
    if (errors.length) {
      callback(new Error('could reopen stdout/stderr: ' + errors.join('')))
    }
    try {
      var pid = daemon.start(fds.both || fds);
      daemon.lock(lock);
      callback(null, pid);
    }
    catch (ex) {
      callback(ex);
    }
  };

  var open = function (name, path) {
    outstanding++;
    fs.open(path, 'a+', 0666, function (err, fd) {
      if (err) {
        errors.push(err);
      }
      else {
        fds[name] = fd;
      }
      if (--outstanding === 0) {
        finish();
      }
    });
  };

  if (typeof out === 'object') {
    if (out.stdout) {
      open('stdout', out.stdout);
    }
    if (out.stderr) {
      open('stderr', out.stderr);
    }
  }
  else {
    open('both', out);
  }
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
