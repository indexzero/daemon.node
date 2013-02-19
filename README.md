# daemon

Turn a node script into a daemon.

## install via npm

```
npm install daemon
```

Requires node >= 0.8

## examples

```javascript
var daemon = require('daemon');

console.log(process.pid);

/// code above this line will run twice
/// see notes below

var pid = daemon();

// different pid because we are now forked
// original parent has exited
console.log(process.pid);
```

## notes

Daemon actually re-spawns the current application and runs it again. The only difference between the original and the fork is that the original will not execute past the `daemon()` call whereas the fork will.

### Author: [Slashed](http://github.com/slashed)
### Contributors: [Charlie Robbins](http://nodejitsu.com), [Pedro Teixeira](https://github.com/pgte), [James Halliday](https://github.com/substack), [Zak Taylor](https://github.com/dobl), [Daniel Bartlett](https://github.com/danbuk), [Charlie McConnell](https://github.com/AvianFlu)

