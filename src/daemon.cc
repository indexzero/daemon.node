/*
* Daemon.node: A node.JS addon that allows creating Unix/Linux Daemons in pure Javascript.
 *
* Copyright 2010 (c) <arthur@norgic.com>
* Modified By: Pedro Teixeira  2010
* Modified By: James Haliday   2010
* Modified By: Charlie Robbins 2010
* Modified By: Zak Taylor      2010
* Modified By: Daniel Bartlett 2011
* Modified By: Charlie Robbins 2011
*
* Under MIT License. See LICENSE file.
*
*/

#include <v8.h>
#include <node.h>
#include <unistd.h>
#include <stdlib.h>
#include <sys/stat.h>
#include <sys/types.h>
#include <fcntl.h>
#include <errno.h>
#include <pwd.h>

#define PID_MAXLEN 10

using namespace v8;
using namespace node;

//
// Go through special routines to become a daemon.
// if successful, returns daemon pid
//
static Handle<Value> Start(const Arguments& args) {
  HandleScope scope;
  pid_t sid, pid;
  int new_fd = -1, new_fd_stderr, length;

  pid = fork();
  if (pid < 0) {
    return ThrowException(ErrnoException(errno, "fork()"));
  }
  else if (pid > 0) exit(0);

  if (pid == 0) {
    // Child process:

    sid = setsid();
    if(sid < 0) {
      return ThrowException(ErrnoException(errno, "setsid()"));
    }

    // Close stdin
    freopen("/dev/null", "r", stdin);
    
    length = args.Length();
    
    //
    // Attempt to set STDOUT_FILENO if we have been
    // passed an argument for it, otherwise point
    // to /dev/null
    //
    if (length > 0 && args[0]->IsString()) {
      String::Utf8Value outfile(args[0]->ToString());
      new_fd = open(*outfile, O_WRONLY | O_APPEND | O_CREAT,
                S_IWUSR | S_IWGRP | S_IRUSR | S_IRGRP);
      if (new_fd < 0) {
        return ThrowException(ErrnoException(errno, "open()"));
      }
      dup2(new_fd, STDOUT_FILENO);
    }
    else {
      freopen("/dev/null", "w", stdout);
    }

    //
    // Get the STDERR fd if it has been passed
    // as an argument
    //
    if (length > 1 && args[1]->IsString()) {
      String::Utf8Value errfile(args[1]->ToString());
      new_fd_stderr = open(*errfile, O_WRONLY | O_APPEND | O_CREAT,
                            S_IWUSR | S_IWGRP | S_IRUSR | S_IRGRP);
      if (new_fd_stderr < 0) {
        return ThrowException(ErrnoException(errno, "open()"));
      }
    }
    else {
      new_fd_stderr = new_fd;
    }

    //
    // Attempt to set STDERR_FILENO if we have
    // a valid file descriptor, otherwise point
    // to /dev/null
    //
    if (new_fd_stderr != -1) {
      dup2(new_fd_stderr, STDERR_FILENO);
    }
    else {
      freopen("/dev/null", "w", stderr);
    }
  }

  return scope.Close(Integer::New(getpid()));
}

//
// Close stdin by redirecting it to /dev/null
//
Handle<Value> CloseStdin(const Arguments& args) {
  freopen("/dev/null", "r", stdin);
}

//
// Close stderr by redirecting to /dev/null
//
Handle<Value> CloseStderr(const Arguments& args) {
  freopen("/dev/null", "w", stderr);
}

//
// Close stdout by redirecting to /dev/null
//
Handle<Value> CloseStdout(const Arguments& args) {
  freopen("/dev/null", "w", stdout);
}

//
// Closes all stdio by redirecting to /dev/null
//
Handle<Value> CloseStdio(const Arguments& args) {
  freopen("/dev/null", "r", stdin);
  freopen("/dev/null", "w", stderr);
  freopen("/dev/null", "w", stdout);
}

//
// File-lock to make sure that only one instance of daemon is running, also for storing pid
//   lock (filename)
//   @filename: a path to a lock-file.
// 
//   Note: if filename doesn't exist, it will be created when function is called.
//
Handle<Value> LockD(const Arguments& args) {
  if (!args[0]->IsString())
    return Boolean::New(false);
  
  String::Utf8Value data(args[0]->ToString());
  char pid_str[PID_MAXLEN+1];
  
  int lfp = open(*data, O_RDWR | O_CREAT | O_TRUNC, 0640);
  if(lfp < 0) exit(1);
  if(lockf(lfp, F_TLOCK, 0) < 0) return Boolean::New(false);
  
  int len = snprintf(pid_str, PID_MAXLEN, "%d", getpid());
  write(lfp, pid_str, len);
  fsync(lfp);
  
  return Boolean::New(true);
}

const char* ToCString(const v8::String::Utf8Value& value) {
  return *value ? *value : "<string conversion failed>";
}

//
// Set the chroot of this process. You probably want to be sure stuff is in here.
//   chroot (folder)
//   @folder {string}: The new root
//
Handle<Value> Chroot(const Arguments& args) {
  if (args.Length() < 1) {
    return ThrowException(Exception::TypeError(
      String::New("Must have one argument; a string of the folder to chroot to.")
    ));
  }
  uid_t uid;
  int rv;

  String::Utf8Value folderUtf8(args[0]->ToString());
  const char *folder = ToCString(folderUtf8);
  rv = chroot(folder);
  if (rv != 0) {
    return ThrowException(ErrnoException(errno, "chroot"));
  }
  chdir("/");

  return Boolean::New(true);
}

//
// Allow changing the real and effective user ID of this process 
// so a root process can become unprivileged
//
Handle<Value> SetReuid(const Arguments& args) {
  if (args.Length() == 0 || (!args[0]->IsString() && !args[0]->IsInt32()))
    return ThrowException(Exception::Error(
      String::New("Must give a uid or username to become")
    ));

  if (args[0]->IsString()) {
    String::AsciiValue username(args[0]);

    struct passwd* pwd_entry = getpwnam(*username);

    if (pwd_entry) {
      setreuid(pwd_entry->pw_uid, pwd_entry->pw_uid);
      return Boolean::New(true);
    } 
    else {
      return ThrowException(Exception::Error(
        String::New("User not found")
      ));
    }
  }
  else if (args[0]->IsInt32()) {
    uid_t uid;
    uid = args[0]->Int32Value();
    setreuid(uid, uid);
    return Boolean::New(true);
  }
}

//
// Initialize this add-on
//
extern "C" void init(Handle<Object> target) {
  HandleScope scope;
  
  NODE_SET_METHOD(target, "start", Start);
  NODE_SET_METHOD(target, "lock", LockD);
  NODE_SET_METHOD(target, "chroot", Chroot);
  NODE_SET_METHOD(target, "setreuid", SetReuid);
  NODE_SET_METHOD(target, "closeStderr", CloseStderr);
  NODE_SET_METHOD(target, "closeStdout", CloseStdout);
  NODE_SET_METHOD(target, "closeStdin", CloseStdin);
  NODE_SET_METHOD(target, "closeStdio", CloseStdio);
}
