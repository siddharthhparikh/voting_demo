(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
    try {
        cachedSetTimeout = setTimeout;
    } catch (e) {
        cachedSetTimeout = function () {
            throw new Error('setTimeout is not defined');
        }
    }
    try {
        cachedClearTimeout = clearTimeout;
    } catch (e) {
        cachedClearTimeout = function () {
            throw new Error('clearTimeout is not defined');
        }
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],2:[function(require,module,exports){
(function (process){
var forge = {};
var aes = forge.aes = {};
var md = forge.md = {};
var pki = forge.pki = {};
var rsa = forge.pki.rsa = forge.rsa = {};
var util = forge.util = {};

/**
 * Expose `keypair`.
 */

module.exports = function (opts) {
  if (!opts) opts = {};
  if (typeof opts.bits == 'undefined') opts.bits = 2048;
  var keypair = forge.rsa.generateKeyPair(opts);
  keypair = {
    public: fix(forge.pki.publicKeyToRSAPublicKeyPem(keypair.publicKey, 72)),
    private: fix(forge.pki.privateKeyToPem(keypair.privateKey, 72))
  };
  return keypair;
};

function fix (str) {
  return str.replace(/\r/g, '') + '\n'
}

/**
 * util.fillString
 */

util.fillString = function(c, n) {
  var s = '';
  while(n > 0) {
    if(n & 1) {
      s += c;
    }
    n >>>= 1;
    if(n > 0) {
      c += c;
    }
  }
  return s;
};

/**
 * md.sha1
 */

var sha1 = forge.sha1 = forge.md.sha1 = {};

// sha-1 padding bytes not initialized yet
var _padding = null;
var _initialized = false;

/**
 * Initializes the constant tables.
 */
var _init = function() {
  // create padding
  _padding = String.fromCharCode(128);
  _padding += forge.util.fillString(String.fromCharCode(0x00), 64);

  // now initialized
  _initialized = true;
};

/**
 * Updates a SHA-1 state with the given byte buffer.
 *
 * @param s the SHA-1 state to update.
 * @param w the array to use to store words.
 * @param bytes the byte buffer to update with.
 */
var _update = function(s, w, bytes) {
  // consume 512 bit (64 byte) chunks
  var t, a, b, c, d, e, f, i;
  var len = bytes.length();
  while(len >= 64) {
    // the w array will be populated with sixteen 32-bit big-endian words
    // and then extended into 80 32-bit words according to SHA-1 algorithm
    // and for 32-79 using Max Locktyukhin's optimization

    // initialize hash value for this chunk
    a = s.h0;
    b = s.h1;
    c = s.h2;
    d = s.h3;
    e = s.h4;

    // round 1
    for(i = 0; i < 16; ++i) {
      t = bytes.getInt32();
      w[i] = t;
      f = d ^ (b & (c ^ d));
      t = ((a << 5) | (a >>> 27)) + f + e + 0x5A827999 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    for(; i < 20; ++i) {
      t = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]);
      t = (t << 1) | (t >>> 31);
      w[i] = t;
      f = d ^ (b & (c ^ d));
      t = ((a << 5) | (a >>> 27)) + f + e + 0x5A827999 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    // round 2
    for(; i < 32; ++i) {
      t = (w[i - 3] ^ w[i - 8] ^ w[i - 14] ^ w[i - 16]);
      t = (t << 1) | (t >>> 31);
      w[i] = t;
      f = b ^ c ^ d;
      t = ((a << 5) | (a >>> 27)) + f + e + 0x6ED9EBA1 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    for(; i < 40; ++i) {
      t = (w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32]);
      t = (t << 2) | (t >>> 30);
      w[i] = t;
      f = b ^ c ^ d;
      t = ((a << 5) | (a >>> 27)) + f + e + 0x6ED9EBA1 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    // round 3
    for(; i < 60; ++i) {
      t = (w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32]);
      t = (t << 2) | (t >>> 30);
      w[i] = t;
      f = (b & c) | (d & (b ^ c));
      t = ((a << 5) | (a >>> 27)) + f + e + 0x8F1BBCDC + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }
    // round 4
    for(; i < 80; ++i) {
      t = (w[i - 6] ^ w[i - 16] ^ w[i - 28] ^ w[i - 32]);
      t = (t << 2) | (t >>> 30);
      w[i] = t;
      f = b ^ c ^ d;
      t = ((a << 5) | (a >>> 27)) + f + e + 0xCA62C1D6 + t;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = t;
    }

    // update hash state
    s.h0 += a;
    s.h1 += b;
    s.h2 += c;
    s.h3 += d;
    s.h4 += e;

    len -= 64;
  }
};

/**
 * Creates a SHA-1 message digest object.
 *
 * @return a message digest object.
 */
sha1.create = function() {
  // do initialization as necessary
  if(!_initialized) {
    _init();
  }

  // SHA-1 state contains five 32-bit integers
  var _state = null;

  // input buffer
  var _input = forge.util.createBuffer();

  // used for word storage
  var _w = new Array(80);

  // message digest object
  var md = {
    algorithm: 'sha1',
    blockLength: 64,
    digestLength: 20,
    // length of message so far (does not including padding)
    messageLength: 0
  };

  /**
   * Starts the digest.
   */
  md.start = function() {
    md.messageLength = 0;
    _input = forge.util.createBuffer();
    _state = {
      h0: 0x67452301,
      h1: 0xEFCDAB89,
      h2: 0x98BADCFE,
      h3: 0x10325476,
      h4: 0xC3D2E1F0
    };
  };
  // start digest automatically for first time
  md.start();

  /**
   * Updates the digest with the given message input. The given input can
   * treated as raw input (no encoding will be applied) or an encoding of
   * 'utf8' maybe given to encode the input using UTF-8.
   *
   * @param msg the message input to update with.
   * @param encoding the encoding to use (default: 'raw', other: 'utf8').
   */
  md.update = function(msg, encoding) {
    if(encoding === 'utf8') {
      msg = forge.util.encodeUtf8(msg);
    }

    // update message length
    md.messageLength += msg.length;

    // add bytes to input buffer
    _input.putBytes(msg);

    // process bytes
    _update(_state, _w, _input);

    // compact input buffer every 2K or if empty
    if(_input.read > 2048 || _input.length() === 0) {
      _input.compact();
    }
  };

   /**
    * Produces the digest.
    *
    * @return a byte buffer containing the digest value.
    */
   md.digest = function() {
    /* Note: Here we copy the remaining bytes in the input buffer and
      add the appropriate SHA-1 padding. Then we do the final update
      on a copy of the state so that if the user wants to get
      intermediate digests they can do so. */

    /* Determine the number of bytes that must be added to the message
      to ensure its length is congruent to 448 mod 512. In other words,
      a 64-bit integer that gives the length of the message will be
      appended to the message and whatever the length of the message is
      plus 64 bits must be a multiple of 512. So the length of the
      message must be congruent to 448 mod 512 because 512 - 64 = 448.

      In order to fill up the message length it must be filled with
      padding that begins with 1 bit followed by all 0 bits. Padding
      must *always* be present, so if the message length is already
      congruent to 448 mod 512, then 512 padding bits must be added. */

    // 512 bits == 64 bytes, 448 bits == 56 bytes, 64 bits = 8 bytes
    // _padding starts with 1 byte with first bit is set in it which
    // is byte value 128, then there may be up to 63 other pad bytes
    var len = md.messageLength;
    var padBytes = forge.util.createBuffer();
    padBytes.putBytes(_input.bytes());
    padBytes.putBytes(_padding.substr(0, 64 - ((len + 8) % 64)));

    /* Now append length of the message. The length is appended in bits
      as a 64-bit number in big-endian order. Since we store the length
      in bytes, we must multiply it by 8 (or left shift by 3). So here
      store the high 3 bits in the low end of the first 32-bits of the
      64-bit number and the lower 5 bits in the high end of the second
      32-bits. */
    padBytes.putInt32((len >>> 29) & 0xFF);
    padBytes.putInt32((len << 3) & 0xFFFFFFFF);
    var s2 = {
      h0: _state.h0,
      h1: _state.h1,
      h2: _state.h2,
      h3: _state.h3,
      h4: _state.h4
    };
    _update(s2, _w, padBytes);
    var rval = forge.util.createBuffer();
    rval.putInt32(s2.h0);
    rval.putInt32(s2.h1);
    rval.putInt32(s2.h2);
    rval.putInt32(s2.h3);
    rval.putInt32(s2.h4);
    return rval;
  };

  return md;
};


/**
 * util.ByteBuffer
 */

/**
 * Constructor for a byte buffer.
 *
 * @param b the bytes to wrap (as a UTF-8 string) (optional).
 */
util.ByteBuffer = function(b) {
  // the data in this buffer
  this.data = b || '';
  // the pointer for reading from this buffer
  this.read = 0;
};

/**
 * Gets the number of bytes in this buffer.
 *
 * @return the number of bytes in this buffer.
 */
util.ByteBuffer.prototype.length = function() {
  return this.data.length - this.read;
};

/**
 * Gets whether or not this buffer is empty.
 *
 * @return true if this buffer is empty, false if not.
 */
util.ByteBuffer.prototype.isEmpty = function() {
  return (this.data.length - this.read) === 0;
};

/**
 * Puts a byte in this buffer.
 *
 * @param b the byte to put.
 */
util.ByteBuffer.prototype.putByte = function(b) {
  this.data += String.fromCharCode(b);
};

/**
 * Puts a byte in this buffer N times.
 *
 * @param b the byte to put.
 * @param n the number of bytes of value b to put.
 */
util.ByteBuffer.prototype.fillWithByte = function(b, n) {
  b = String.fromCharCode(b);
  var d = this.data;
  while(n > 0) {
    if(n & 1) {
      d += b;
    }
    n >>>= 1;
    if(n > 0) {
      b += b;
    }
  }
  this.data = d;
};

/**
 * Puts bytes in this buffer.
 *
 * @param bytes the bytes (as a UTF-8 encoded string) to put.
 */
util.ByteBuffer.prototype.putBytes = function(bytes) {
  this.data += bytes;
};

/**
 * Puts a UTF-16 encoded string into this buffer.
 *
 * @param str the string to put.
 */
util.ByteBuffer.prototype.putString = function(str) {
  this.data += util.encodeUtf8(str);
};

/**
 * Puts a 16-bit integer in this buffer in big-endian order.
 *
 * @param i the 16-bit integer.
 */
util.ByteBuffer.prototype.putInt16 = function(i) {
  this.data +=
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i & 0xFF);
};

/**
 * Puts a 24-bit integer in this buffer in big-endian order.
 *
 * @param i the 24-bit integer.
 */
util.ByteBuffer.prototype.putInt24 = function(i) {
  this.data +=
    String.fromCharCode(i >> 16 & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i & 0xFF);
};

/**
 * Puts a 32-bit integer in this buffer in big-endian order.
 *
 * @param i the 32-bit integer.
 */
util.ByteBuffer.prototype.putInt32 = function(i) {
  this.data +=
    String.fromCharCode(i >> 24 & 0xFF) +
    String.fromCharCode(i >> 16 & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i & 0xFF);
};

/**
 * Puts a 16-bit integer in this buffer in little-endian order.
 *
 * @param i the 16-bit integer.
 */
util.ByteBuffer.prototype.putInt16Le = function(i) {
  this.data +=
    String.fromCharCode(i & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF);
};

/**
 * Puts a 24-bit integer in this buffer in little-endian order.
 *
 * @param i the 24-bit integer.
 */
util.ByteBuffer.prototype.putInt24Le = function(i) {
  this.data +=
    String.fromCharCode(i & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i >> 16 & 0xFF);
};

/**
 * Puts a 32-bit integer in this buffer in little-endian order.
 *
 * @param i the 32-bit integer.
 */
util.ByteBuffer.prototype.putInt32Le = function(i) {
  this.data +=
    String.fromCharCode(i & 0xFF) +
    String.fromCharCode(i >> 8 & 0xFF) +
    String.fromCharCode(i >> 16 & 0xFF) +
    String.fromCharCode(i >> 24 & 0xFF);
};

/**
 * Puts an n-bit integer in this buffer in big-endian order.
 *
 * @param i the n-bit integer.
 * @param n the number of bits in the integer.
 */
util.ByteBuffer.prototype.putInt = function(i, n) {
  do {
    n -= 8;
    this.data += String.fromCharCode((i >> n) & 0xFF);
  }
  while(n > 0);
};

/**
 * Puts the given buffer into this buffer.
 *
 * @param buffer the buffer to put into this one.
 */
util.ByteBuffer.prototype.putBuffer = function(buffer) {
  this.data += buffer.getBytes();
};

/**
 * Gets a byte from this buffer and advances the read pointer by 1.
 *
 * @return the byte.
 */
util.ByteBuffer.prototype.getByte = function() {
  return this.data.charCodeAt(this.read++);
};

/**
 * Gets a uint16 from this buffer in big-endian order and advances the read
 * pointer by 2.
 *
 * @return the uint16.
 */
util.ByteBuffer.prototype.getInt16 = function() {
  var rval = (
    this.data.charCodeAt(this.read) << 8 ^
    this.data.charCodeAt(this.read + 1));
  this.read += 2;
  return rval;
};

/**
 * Gets a uint24 from this buffer in big-endian order and advances the read
 * pointer by 3.
 *
 * @return the uint24.
 */
util.ByteBuffer.prototype.getInt24 = function() {
  var rval = (
    this.data.charCodeAt(this.read) << 16 ^
    this.data.charCodeAt(this.read + 1) << 8 ^
    this.data.charCodeAt(this.read + 2));
  this.read += 3;
  return rval;
};

/**
 * Gets a uint32 from this buffer in big-endian order and advances the read
 * pointer by 4.
 *
 * @return the word.
 */
util.ByteBuffer.prototype.getInt32 = function() {
  var rval = (
    this.data.charCodeAt(this.read) << 24 ^
    this.data.charCodeAt(this.read + 1) << 16 ^
    this.data.charCodeAt(this.read + 2) << 8 ^
    this.data.charCodeAt(this.read + 3));
  this.read += 4;
  return rval;
};

/**
 * Gets a uint16 from this buffer in little-endian order and advances the read
 * pointer by 2.
 *
 * @return the uint16.
 */
util.ByteBuffer.prototype.getInt16Le = function() {
  var rval = (
    this.data.charCodeAt(this.read) ^
    this.data.charCodeAt(this.read + 1) << 8);
  this.read += 2;
  return rval;
};

/**
 * Gets a uint24 from this buffer in little-endian order and advances the read
 * pointer by 3.
 *
 * @return the uint24.
 */
util.ByteBuffer.prototype.getInt24Le = function() {
  var rval = (
    this.data.charCodeAt(this.read) ^
    this.data.charCodeAt(this.read + 1) << 8 ^
    this.data.charCodeAt(this.read + 2) << 16);
  this.read += 3;
  return rval;
};

/**
 * Gets a uint32 from this buffer in little-endian order and advances the read
 * pointer by 4.
 *
 * @return the word.
 */
util.ByteBuffer.prototype.getInt32Le = function() {
  var rval = (
    this.data.charCodeAt(this.read) ^
    this.data.charCodeAt(this.read + 1) << 8 ^
    this.data.charCodeAt(this.read + 2) << 16 ^
    this.data.charCodeAt(this.read + 3) << 24);
  this.read += 4;
  return rval;
};

/**
 * Gets an n-bit integer from this buffer in big-endian order and advances the
 * read pointer by n/8.
 *
 * @param n the number of bits in the integer.
 *
 * @return the integer.
 */
util.ByteBuffer.prototype.getInt = function(n) {
  var rval = 0;
  do {
    rval = (rval << n) + this.data.charCodeAt(this.read++);
    n -= 8;
  }
  while(n > 0);
  return rval;
};

/**
 * Reads bytes out into a UTF-8 string and clears them from the buffer.
 *
 * @param count the number of bytes to read, undefined or null for all.
 *
 * @return a UTF-8 string of bytes.
 */
util.ByteBuffer.prototype.getBytes = function(count) {
  var rval;
  if(count) {
    // read count bytes
    count = Math.min(this.length(), count);
    rval = this.data.slice(this.read, this.read + count);
    this.read += count;
  }
  else if(count === 0) {
    rval = '';
  }
  else {
    // read all bytes, optimize to only copy when needed
    rval = (this.read === 0) ? this.data : this.data.slice(this.read);
    this.clear();
  }
  return rval;
};

/**
 * Gets a UTF-8 encoded string of the bytes from this buffer without modifying
 * the read pointer.
 *
 * @param count the number of bytes to get, omit to get all.
 *
 * @return a string full of UTF-8 encoded characters.
 */
util.ByteBuffer.prototype.bytes = function(count) {
  return (typeof(count) === 'undefined' ?
    this.data.slice(this.read) :
    this.data.slice(this.read, this.read + count));
};

/**
 * Gets a byte at the given index without modifying the read pointer.
 *
 * @param i the byte index.
 *
 * @return the byte.
 */
util.ByteBuffer.prototype.at = function(i) {
  return this.data.charCodeAt(this.read + i);
};

/**
 * Puts a byte at the given index without modifying the read pointer.
 *
 * @param i the byte index.
 * @param b the byte to put.
 */
util.ByteBuffer.prototype.setAt = function(i, b) {
  this.data = this.data.substr(0, this.read + i) +
    String.fromCharCode(b) +
    this.data.substr(this.read + i + 1);
};

/**
 * Gets the last byte without modifying the read pointer.
 *
 * @return the last byte.
 */
util.ByteBuffer.prototype.last = function() {
  return this.data.charCodeAt(this.data.length - 1);
};

/**
 * Creates a copy of this buffer.
 *
 * @return the copy.
 */
util.ByteBuffer.prototype.copy = function() {
  var c = util.createBuffer(this.data);
  c.read = this.read;
  return c;
};

/**
 * Compacts this buffer.
 */
util.ByteBuffer.prototype.compact = function() {
  if(this.read > 0) {
    this.data = this.data.slice(this.read);
    this.read = 0;
  }
};

/**
 * Clears this buffer.
 */
util.ByteBuffer.prototype.clear = function() {
  this.data = '';
  this.read = 0;
};

/**
 * Shortens this buffer by triming bytes off of the end of this buffer.
 *
 * @param count the number of bytes to trim off.
 */
util.ByteBuffer.prototype.truncate = function(count) {
  var len = Math.max(0, this.length() - count);
  this.data = this.data.substr(this.read, len);
  this.read = 0;
};

/**
 * Converts this buffer to a hexadecimal string.
 *
 * @return a hexadecimal string.
 */
util.ByteBuffer.prototype.toHex = function() {
  var rval = '';
  for(var i = this.read; i < this.data.length; ++i) {
    var b = this.data.charCodeAt(i);
    if(b < 16) {
      rval += '0';
    }
    rval += b.toString(16);
  }
  return rval;
};

/**
 * Converts this buffer to a UTF-16 string (standard JavaScript string).
 *
 * @return a UTF-16 string.
 */
util.ByteBuffer.prototype.toString = function() {
  return util.decodeUtf8(this.bytes());
};
/**
 * util.createBuffer
 */

util.createBuffer = function(input, encoding) {
  encoding = encoding || 'raw';
  if(input !== undefined && encoding === 'utf8') {
    input = util.encodeUtf8(input);
  }
  return new util.ByteBuffer(input);
};

/**
 * prng.create
 */

var prng = forge.prng = {};
var crypto = null;

prng.create = function(plugin) {
  var ctx = {
    plugin: plugin,
    key: null,
    seed: null,
    time: null,
    // number of reseeds so far
    reseeds: 0,
    // amount of data generated so far
    generated: 0
  };

  // create 32 entropy pools (each is a message digest)
  var md = plugin.md;
  var pools = new Array(32);
  for(var i = 0; i < 32; ++i) {
    pools[i] = md.create();
  }
  ctx.pools = pools;

  // entropy pools are written to cyclically, starting at index 0
  ctx.pool = 0;

  /**
   * Generates random bytes. The bytes may be generated synchronously or
   * asynchronously. Web workers must use the asynchronous interface or
   * else the behavior is undefined.
   *
   * @param count the number of random bytes to generate.
   * @param [callback(err, bytes)] called once the operation completes.
   *
   * @return count random bytes as a string.
   */
  ctx.generate = function(count, callback) {
    // do synchronously
    if(!callback) {
      return ctx.generateSync(count);
    }

    // simple generator using counter-based CBC
    var cipher = ctx.plugin.cipher;
    var increment = ctx.plugin.increment;
    var formatKey = ctx.plugin.formatKey;
    var formatSeed = ctx.plugin.formatSeed;
    var b = forge.util.createBuffer();

    generate();

    function generate(err) {
      if(err) {
        return callback(err);
      }

      // sufficient bytes generated
      if(b.length() >= count) {
        return callback(null, b.getBytes(count));
      }

      // if amount of data generated is greater than 1 MiB, trigger reseed
      if(ctx.generated >= 1048576) {
        // only do reseed at most every 100 ms
        var now = +new Date();
        if(ctx.time === null || (now - ctx.time > 100)) {
          ctx.key = null;
        }
      }

      if(ctx.key === null) {
        return _reseed(generate);
      }

      // generate the random bytes
      var bytes = cipher(ctx.key, ctx.seed);
      ctx.generated += bytes.length;
      b.putBytes(bytes);

      // generate bytes for a new key and seed
      ctx.key = formatKey(cipher(ctx.key, increment(ctx.seed)));
      ctx.seed = formatSeed(cipher(ctx.key, ctx.seed));

      forge.util.setImmediate(generate);
    }
  };

  /**
   * Generates random bytes synchronously.
   *
   * @param count the number of random bytes to generate.
   *
   * @return count random bytes as a string.
   */
  ctx.generateSync = function(count) {
    // simple generator using counter-based CBC
    var cipher = ctx.plugin.cipher;
    var increment = ctx.plugin.increment;
    var formatKey = ctx.plugin.formatKey;
    var formatSeed = ctx.plugin.formatSeed;
    var b = forge.util.createBuffer();
    while(b.length() < count) {
      // if amount of data generated is greater than 1 MiB, trigger reseed
      if(ctx.generated >= 1048576) {
        // only do reseed at most every 100 ms
        var now = +new Date();
        if(ctx.time === null || (now - ctx.time > 100)) {
          ctx.key = null;
        }
      }

      if(ctx.key === null) {
        _reseedSync();
      }

      // generate the random bytes
      var bytes = cipher(ctx.key, ctx.seed);
      ctx.generated += bytes.length;
      b.putBytes(bytes);

      // generate bytes for a new key and seed
      ctx.key = formatKey(cipher(ctx.key, increment(ctx.seed)));
      ctx.seed = formatSeed(cipher(ctx.key, ctx.seed));
    }

    return b.getBytes(count);
  };

  /**
   * Private function that asynchronously reseeds a generator.
   *
   * @param callback(err) called once the operation completes.
   */
  function _reseed(callback) {
    if(ctx.pools[0].messageLength >= 32) {
      _seed();
      return callback();
    }
    // not enough seed data...
    var needed = (32 - ctx.pools[0].messageLength) << 5;
    ctx.seedFile(needed, function(err, bytes) {
      if(err) {
        return callback(err);
      }
      ctx.collect(bytes);
      _seed();
      callback();
    });
  }

  /**
   * Private function that synchronously reseeds a generator.
   */
  function _reseedSync() {
    if(ctx.pools[0].messageLength >= 32) {
      return _seed();
    }
    // not enough seed data...
    var needed = (32 - ctx.pools[0].messageLength) << 5;
    ctx.collect(ctx.seedFileSync(needed));
    _seed();
  }

  /**
   * Private function that seeds a generator once enough bytes are available.
   */
  function _seed() {
    // create a SHA-1 message digest
    var md = forge.md.sha1.create();

    // digest pool 0's entropy and restart it
    md.update(ctx.pools[0].digest().getBytes());
    ctx.pools[0].start();

    // digest the entropy of other pools whose index k meet the
    // condition '2^k mod n == 0' where n is the number of reseeds
    var k = 1;
    for(var i = 1; i < 32; ++i) {
      // prevent signed numbers from being used
      k = (k === 31) ? 0x80000000 : (k << 2);
      if(k % ctx.reseeds === 0) {
        md.update(ctx.pools[i].digest().getBytes());
        ctx.pools[i].start();
      }
    }

    // get digest for key bytes and iterate again for seed bytes
    var keyBytes = md.digest().getBytes();
    md.start();
    md.update(keyBytes);
    var seedBytes = md.digest().getBytes();

    // update
    ctx.key = ctx.plugin.formatKey(keyBytes);
    ctx.seed = ctx.plugin.formatSeed(seedBytes);
    ++ctx.reseeds;
    ctx.generated = 0;
    ctx.time = +new Date();
  }

  /**
   * The built-in default seedFile. This seedFile is used when entropy
   * is needed immediately.
   *
   * @param needed the number of bytes that are needed.
   *
   * @return the random bytes.
   */
  function defaultSeedFile(needed) {
    // use window.crypto.getRandomValues strong source of entropy if
    // available
    var b = forge.util.createBuffer();
    if(typeof window !== 'undefined' &&
      window.crypto && window.crypto.getRandomValues) {
      var entropy = new Uint32Array(needed / 4);
      try {
        window.crypto.getRandomValues(entropy);
        for(var i = 0; i < entropy.length; ++i) {
          b.putInt32(entropy[i]);
        }
      }
      catch(e) {
        /* Mozilla claims getRandomValues can throw QuotaExceededError, so
         ignore errors. In this case, weak entropy will be added, but
         hopefully this never happens.
         https://developer.mozilla.org/en-US/docs/DOM/window.crypto.getRandomValues
         However I've never observed this exception --@evanj */
      }
    }

    // be sad and add some weak random data
    if(b.length() < needed) {
      /* Draws from Park-Miller "minimal standard" 31 bit PRNG,
      implemented with David G. Carta's optimization: with 32 bit math
      and without division (Public Domain). */
      var hi, lo, next;
      var seed = Math.floor(Math.random() * 0xFFFF);
      while(b.length() < needed) {
        lo = 16807 * (seed & 0xFFFF);
        hi = 16807 * (seed >> 16);
        lo += (hi & 0x7FFF) << 16;
        lo += hi >> 15;
        lo = (lo & 0x7FFFFFFF) + (lo >> 31);
        seed = lo & 0xFFFFFFFF;

        // consume lower 3 bytes of seed
        for(var i = 0; i < 3; ++i) {
          // throw in more pseudo random
          next = seed >>> (i << 3);
          next ^= Math.floor(Math.random() * 0xFF);
          b.putByte(String.fromCharCode(next & 0xFF));
        }
      }
    }

    return b.getBytes();
  }
  // initialize seed file APIs
  if(crypto) {
    // use nodejs async API
    ctx.seedFile = function(needed, callback) {
      crypto.randomBytes(needed, function(err, bytes) {
        if(err) {
          return callback(err);
        }
        callback(null, bytes.toString());
      });
    };
    // use nodejs sync API
    ctx.seedFileSync = function(needed) {
      return crypto.randomBytes(needed).toString();
    };
  }
  else {
    ctx.seedFile = function(needed, callback) {
      try {
        callback(null, defaultSeedFile(needed));
      }
      catch(e) {
        callback(e);
      }
    };
    ctx.seedFileSync = defaultSeedFile;
  }

  /**
   * Adds entropy to a prng ctx's accumulator.
   *
   * @param bytes the bytes of entropy as a string.
   */
  ctx.collect = function(bytes) {
    // iterate over pools distributing entropy cyclically
    var count = bytes.length;
    for(var i = 0; i < count; ++i) {
      ctx.pools[ctx.pool].update(bytes.substr(i, 1));
      ctx.pool = (ctx.pool === 31) ? 0 : ctx.pool + 1;
    }
  };

  /**
   * Collects an integer of n bits.
   *
   * @param i the integer entropy.
   * @param n the number of bits in the integer.
   */
  ctx.collectInt = function(i, n) {
    var bytes = '';
    for(var x = 0; x < n; x += 8) {
      bytes += String.fromCharCode((i >> x) & 0xFF);
    }
    ctx.collect(bytes);
  };

  /**
   * Registers a Web Worker to receive immediate entropy from the main thread.
   * This method is required until Web Workers can access the native crypto
   * API. This method should be called twice for each created worker, once in
   * the main thread, and once in the worker itself.
   *
   * @param worker the worker to register.
   */
  ctx.registerWorker = function(worker) {
    // worker receives random bytes
    if(worker === self) {
      ctx.seedFile = function(needed, callback) {
        function listener(e) {
          var data = e.data;
          if(data.forge && data.forge.prng) {
            self.removeEventListener('message', listener);
            callback(data.forge.prng.err, data.forge.prng.bytes);
          }
        }
        self.addEventListener('message', listener);
        self.postMessage({forge: {prng: {needed: needed}}});
      };
    }
    // main thread sends random bytes upon request
    else {
      function listener(e) {
        var data = e.data;
        if(data.forge && data.forge.prng) {
          ctx.seedFile(data.forge.prng.needed, function(err, bytes) {
            worker.postMessage({forge: {prng: {err: err, bytes: bytes}}});
          });
        }
      }
      // TODO: do we need to remove the event listener when the worker dies?
      worker.addEventListener('message', listener);
    }
  };

  return ctx;
};

/**
 * aes._expendKey
 */

var init = false; // not yet initialized
var Nb = 4;       // number of words comprising the state (AES = 4)
var sbox;         // non-linear substitution table used in key expansion
var isbox;        // inversion of sbox
var rcon;         // round constant word array
var mix;          // mix-columns table
var imix;         // inverse mix-columns table

var initialize = function() {
  init = true;

  /* Populate the Rcon table. These are the values given by
    [x^(i-1),{00},{00},{00}] where x^(i-1) are powers of x (and x = 0x02)
    in the field of GF(2^8), where i starts at 1.

    rcon[0] = [0x00, 0x00, 0x00, 0x00]
    rcon[1] = [0x01, 0x00, 0x00, 0x00] 2^(1-1) = 2^0 = 1
    rcon[2] = [0x02, 0x00, 0x00, 0x00] 2^(2-1) = 2^1 = 2
    ...
    rcon[9]  = [0x1B, 0x00, 0x00, 0x00] 2^(9-1)  = 2^8 = 0x1B
    rcon[10] = [0x36, 0x00, 0x00, 0x00] 2^(10-1) = 2^9 = 0x36

    We only store the first byte because it is the only one used.
  */
  rcon = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1B, 0x36];

  // compute xtime table which maps i onto GF(i, 0x02)
  var xtime = new Array(256);
  for(var i = 0; i < 128; ++i) {
    xtime[i] = i << 1;
    xtime[i + 128] = (i + 128) << 1 ^ 0x11B;
  }

  // compute all other tables
  sbox = new Array(256);
  isbox = new Array(256);
  mix = new Array(4);
  imix = new Array(4);
  for(var i = 0; i < 4; ++i) {
    mix[i] = new Array(256);
    imix[i] = new Array(256);
  }
  var e = 0, ei = 0, e2, e4, e8, sx, sx2, me, ime;
  for(var i = 0; i < 256; ++i) {
    /* We need to generate the SubBytes() sbox and isbox tables so that
      we can perform byte substitutions. This requires us to traverse
      all of the elements in GF, find their multiplicative inverses,
      and apply to each the following affine transformation:

      bi' = bi ^ b(i + 4) mod 8 ^ b(i + 5) mod 8 ^ b(i + 6) mod 8 ^
            b(i + 7) mod 8 ^ ci
      for 0 <= i < 8, where bi is the ith bit of the byte, and ci is the
      ith bit of a byte c with the value {63} or {01100011}.

      It is possible to traverse every possible value in a Galois field
      using what is referred to as a 'generator'. There are many
      generators (128 out of 256): 3,5,6,9,11,82 to name a few. To fully
      traverse GF we iterate 255 times, multiplying by our generator
      each time.

      On each iteration we can determine the multiplicative inverse for
      the current element.

      Suppose there is an element in GF 'e'. For a given generator 'g',
      e = g^x. The multiplicative inverse of e is g^(255 - x). It turns
      out that if use the inverse of a generator as another generator
      it will produce all of the corresponding multiplicative inverses
      at the same time. For this reason, we choose 5 as our inverse
      generator because it only requires 2 multiplies and 1 add and its
      inverse, 82, requires relatively few operations as well.

      In order to apply the affine transformation, the multiplicative
      inverse 'ei' of 'e' can be repeatedly XOR'd (4 times) with a
      bit-cycling of 'ei'. To do this 'ei' is first stored in 's' and
      'x'. Then 's' is left shifted and the high bit of 's' is made the
      low bit. The resulting value is stored in 's'. Then 'x' is XOR'd
      with 's' and stored in 'x'. On each subsequent iteration the same
      operation is performed. When 4 iterations are complete, 'x' is
      XOR'd with 'c' (0x63) and the transformed value is stored in 'x'.
      For example:

      s = 01000001
      x = 01000001

      iteration 1: s = 10000010, x ^= s
      iteration 2: s = 00000101, x ^= s
      iteration 3: s = 00001010, x ^= s
      iteration 4: s = 00010100, x ^= s
      x ^= 0x63

      This can be done with a loop where s = (s << 1) | (s >> 7). However,
      it can also be done by using a single 16-bit (in this case 32-bit)
      number 'sx'. Since XOR is an associative operation, we can set 'sx'
      to 'ei' and then XOR it with 'sx' left-shifted 1,2,3, and 4 times.
      The most significant bits will flow into the high 8 bit positions
      and be correctly XOR'd with one another. All that remains will be
      to cycle the high 8 bits by XOR'ing them all with the lower 8 bits
      afterwards.

      At the same time we're populating sbox and isbox we can precompute
      the multiplication we'll need to do to do MixColumns() later.
    */

    // apply affine transformation
    sx = ei ^ (ei << 1) ^ (ei << 2) ^ (ei << 3) ^ (ei << 4);
    sx = (sx >> 8) ^ (sx & 255) ^ 0x63;

    // update tables
    sbox[e] = sx;
    isbox[sx] = e;

    /* Mixing columns is done using matrix multiplication. The columns
      that are to be mixed are each a single word in the current state.
      The state has Nb columns (4 columns). Therefore each column is a
      4 byte word. So to mix the columns in a single column 'c' where
      its rows are r0, r1, r2, and r3, we use the following matrix
      multiplication:

      [2 3 1 1]*[r0,c]=[r'0,c]
      [1 2 3 1] [r1,c] [r'1,c]
      [1 1 2 3] [r2,c] [r'2,c]
      [3 1 1 2] [r3,c] [r'3,c]

      r0, r1, r2, and r3 are each 1 byte of one of the words in the
      state (a column). To do matrix multiplication for each mixed
      column c' we multiply the corresponding row from the left matrix
      with the corresponding column from the right matrix. In total, we
      get 4 equations:

      r0,c' = 2*r0,c + 3*r1,c + 1*r2,c + 1*r3,c
      r1,c' = 1*r0,c + 2*r1,c + 3*r2,c + 1*r3,c
      r2,c' = 1*r0,c + 1*r1,c + 2*r2,c + 3*r3,c
      r3,c' = 3*r0,c + 1*r1,c + 1*r2,c + 2*r3,c

      As usual, the multiplication is as previously defined and the
      addition is XOR. In order to optimize mixing columns we can store
      the multiplication results in tables. If you think of the whole
      column as a word (it might help to visualize by mentally rotating
      the equations above by counterclockwise 90 degrees) then you can
      see that it would be useful to map the multiplications performed on
      each byte (r0, r1, r2, r3) onto a word as well. For instance, we
      could map 2*r0,1*r0,1*r0,3*r0 onto a word by storing 2*r0 in the
      highest 8 bits and 3*r0 in the lowest 8 bits (with the other two
      respectively in the middle). This means that a table can be
      constructed that uses r0 as an index to the word. We can do the
      same with r1, r2, and r3, creating a total of 4 tables.

      To construct a full c', we can just look up each byte of c in
      their respective tables and XOR the results together.

      Also, to build each table we only have to calculate the word
      for 2,1,1,3 for every byte ... which we can do on each iteration
      of this loop since we will iterate over every byte. After we have
      calculated 2,1,1,3 we can get the results for the other tables
      by cycling the byte at the end to the beginning. For instance
      we can take the result of table 2,1,1,3 and produce table 3,2,1,1
      by moving the right most byte to the left most position just like
      how you can imagine the 3 moved out of 2,1,1,3 and to the front
      to produce 3,2,1,1.

      There is another optimization in that the same multiples of
      the current element we need in order to advance our generator
      to the next iteration can be reused in performing the 2,1,1,3
      calculation. We also calculate the inverse mix column tables,
      with e,9,d,b being the inverse of 2,1,1,3.

      When we're done, and we need to actually mix columns, the first
      byte of each state word should be put through mix[0] (2,1,1,3),
      the second through mix[1] (3,2,1,1) and so forth. Then they should
      be XOR'd together to produce the fully mixed column.
    */

    // calculate mix and imix table values
    sx2 = xtime[sx];
    e2 = xtime[e];
    e4 = xtime[e2];
    e8 = xtime[e4];
    me =
      (sx2 << 24) ^  // 2
      (sx << 16) ^   // 1
      (sx << 8) ^    // 1
      (sx ^ sx2);    // 3
    ime =
      (e2 ^ e4 ^ e8) << 24 ^  // E (14)
      (e ^ e8) << 16 ^        // 9
      (e ^ e4 ^ e8) << 8 ^    // D (13)
      (e ^ e2 ^ e8);          // B (11)
    // produce each of the mix tables by rotating the 2,1,1,3 value
    for(var n = 0; n < 4; ++n) {
      mix[n][e] = me;
      imix[n][sx] = ime;
      // cycle the right most byte to the left most position
      // ie: 2,1,1,3 becomes 3,2,1,1
      me = me << 24 | me >>> 8;
      ime = ime << 24 | ime >>> 8;
    }

    // get next element and inverse
    if(e === 0) {
      // 1 is the inverse of 1
      e = ei = 1;
    }
    else {
      // e = 2e + 2*2*2*(10e)) = multiply e by 82 (chosen generator)
      // ei = ei + 2*2*ei = multiply ei by 5 (inverse generator)
      e = e2 ^ xtime[xtime[xtime[e2 ^ e8]]];
      ei ^= xtime[xtime[ei]];
    }
  }
};

/**
 * Generates a key schedule using the AES key expansion algorithm.
 *
 * The AES algorithm takes the Cipher Key, K, and performs a Key Expansion
 * routine to generate a key schedule. The Key Expansion generates a total
 * of Nb*(Nr + 1) words: the algorithm requires an initial set of Nb words,
 * and each of the Nr rounds requires Nb words of key data. The resulting
 * key schedule consists of a linear array of 4-byte words, denoted [wi ],
 * with i in the range 0 ≤ i < Nb(Nr + 1).
 *
 * KeyExpansion(byte key[4*Nk], word w[Nb*(Nr+1)], Nk)
 * AES-128 (Nb=4, Nk=4, Nr=10)
 * AES-192 (Nb=4, Nk=6, Nr=12)
 * AES-256 (Nb=4, Nk=8, Nr=14)
 * Note: Nr=Nk+6.
 *
 * Nb is the number of columns (32-bit words) comprising the State (or
 * number of bytes in a block). For AES, Nb=4.
 *
 * @param key the key to schedule (as an array of 32-bit words).
 * @param decrypt true to modify the key schedule to decrypt, false not to.
 *
 * @return the generated key schedule.
 */
var expandKey = function(key, decrypt) {
  // copy the key's words to initialize the key schedule
  var w = key.slice(0);

  /* RotWord() will rotate a word, moving the first byte to the last
    byte's position (shifting the other bytes left).

    We will be getting the value of Rcon at i / Nk. 'i' will iterate
    from Nk to (Nb * Nr+1). Nk = 4 (4 byte key), Nb = 4 (4 words in
    a block), Nr = Nk + 6 (10). Therefore 'i' will iterate from
    4 to 44 (exclusive). Each time we iterate 4 times, i / Nk will
    increase by 1. We use a counter iNk to keep track of this.
   */

  // go through the rounds expanding the key
  var temp, iNk = 1;
  var Nk = w.length;
  var Nr1 = Nk + 6 + 1;
  var end = Nb * Nr1;
  for(var i = Nk; i < end; ++i) {
    temp = w[i - 1];
    if(i % Nk === 0) {
      // temp = SubWord(RotWord(temp)) ^ Rcon[i / Nk]
      temp =
        sbox[temp >>> 16 & 255] << 24 ^
        sbox[temp >>> 8 & 255] << 16 ^
        sbox[temp & 255] << 8 ^
        sbox[temp >>> 24] ^ (rcon[iNk] << 24);
      iNk++;
    }
    else if(Nk > 6 && (i % Nk == 4)) {
      // temp = SubWord(temp)
      temp =
        sbox[temp >>> 24] << 24 ^
        sbox[temp >>> 16 & 255] << 16 ^
        sbox[temp >>> 8 & 255] << 8 ^
        sbox[temp & 255];
    }
    w[i] = w[i - Nk] ^ temp;
  }

   /* When we are updating a cipher block we always use the code path for
     encryption whether we are decrypting or not (to shorten code and
     simplify the generation of look up tables). However, because there
     are differences in the decryption algorithm, other than just swapping
     in different look up tables, we must transform our key schedule to
     account for these changes:

     1. The decryption algorithm gets its key rounds in reverse order.
     2. The decryption algorithm adds the round key before mixing columns
       instead of afterwards.

     We don't need to modify our key schedule to handle the first case,
     we can just traverse the key schedule in reverse order when decrypting.

     The second case requires a little work.

     The tables we built for performing rounds will take an input and then
     perform SubBytes() and MixColumns() or, for the decrypt version,
     InvSubBytes() and InvMixColumns(). But the decrypt algorithm requires
     us to AddRoundKey() before InvMixColumns(). This means we'll need to
     apply some transformations to the round key to inverse-mix its columns
     so they'll be correct for moving AddRoundKey() to after the state has
     had its columns inverse-mixed.

     To inverse-mix the columns of the state when we're decrypting we use a
     lookup table that will apply InvSubBytes() and InvMixColumns() at the
     same time. However, the round key's bytes are not inverse-substituted
     in the decryption algorithm. To get around this problem, we can first
     substitute the bytes in the round key so that when we apply the
     transformation via the InvSubBytes()+InvMixColumns() table, it will
     undo our substitution leaving us with the original value that we
     want -- and then inverse-mix that value.

     This change will correctly alter our key schedule so that we can XOR
     each round key with our already transformed decryption state. This
     allows us to use the same code path as the encryption algorithm.

     We make one more change to the decryption key. Since the decryption
     algorithm runs in reverse from the encryption algorithm, we reverse
     the order of the round keys to avoid having to iterate over the key
     schedule backwards when running the encryption algorithm later in
     decryption mode. In addition to reversing the order of the round keys,
     we also swap each round key's 2nd and 4th rows. See the comments
     section where rounds are performed for more details about why this is
     done. These changes are done inline with the other substitution
     described above.
  */
  if(decrypt) {
    var tmp;
    var m0 = imix[0];
    var m1 = imix[1];
    var m2 = imix[2];
    var m3 = imix[3];
    var wnew = w.slice(0);
    var end = w.length;
    for(var i = 0, wi = end - Nb; i < end; i += Nb, wi -= Nb) {
      // do not sub the first or last round key (round keys are Nb
      // words) as no column mixing is performed before they are added,
      // but do change the key order
      if(i === 0 || i === (end - Nb)) {
        wnew[i] = w[wi];
        wnew[i + 1] = w[wi + 3];
        wnew[i + 2] = w[wi + 2];
        wnew[i + 3] = w[wi + 1];
      }
      else {
        // substitute each round key byte because the inverse-mix
        // table will inverse-substitute it (effectively cancel the
        // substitution because round key bytes aren't sub'd in
        // decryption mode) and swap indexes 3 and 1
        for(var n = 0; n < Nb; ++n) {
          tmp = w[wi + n];
          wnew[i + (3&-n)] =
            m0[sbox[tmp >>> 24]] ^
            m1[sbox[tmp >>> 16 & 255]] ^
            m2[sbox[tmp >>> 8 & 255]] ^
            m3[sbox[tmp & 255]];
        }
      }
    }
    w = wnew;
  }

  return w;
};


forge.aes._expandKey = function(key, decrypt) {
  if(!init) {
    initialize();
  }
  return expandKey(key, decrypt);
};

/**
 * aes._updateBlock
 */

var _updateBlock = function(w, input, output, decrypt) {
  /*
  Cipher(byte in[4*Nb], byte out[4*Nb], word w[Nb*(Nr+1)])
  begin
    byte state[4,Nb]
    state = in
    AddRoundKey(state, w[0, Nb-1])
    for round = 1 step 1 to Nr–1
      SubBytes(state)
      ShiftRows(state)
      MixColumns(state)
      AddRoundKey(state, w[round*Nb, (round+1)*Nb-1])
    end for
    SubBytes(state)
    ShiftRows(state)
    AddRoundKey(state, w[Nr*Nb, (Nr+1)*Nb-1])
    out = state
  end

  InvCipher(byte in[4*Nb], byte out[4*Nb], word w[Nb*(Nr+1)])
  begin
    byte state[4,Nb]
    state = in
    AddRoundKey(state, w[Nr*Nb, (Nr+1)*Nb-1])
    for round = Nr-1 step -1 downto 1
      InvShiftRows(state)
      InvSubBytes(state)
      AddRoundKey(state, w[round*Nb, (round+1)*Nb-1])
      InvMixColumns(state)
    end for
    InvShiftRows(state)
    InvSubBytes(state)
    AddRoundKey(state, w[0, Nb-1])
    out = state
  end
  */

  // Encrypt: AddRoundKey(state, w[0, Nb-1])
  // Decrypt: AddRoundKey(state, w[Nr*Nb, (Nr+1)*Nb-1])
  var Nr = w.length / 4 - 1;
  var m0, m1, m2, m3, sub;
  if(decrypt) {
    m0 = imix[0];
    m1 = imix[1];
    m2 = imix[2];
    m3 = imix[3];
    sub = isbox;
  }
  else {
    m0 = mix[0];
    m1 = mix[1];
    m2 = mix[2];
    m3 = mix[3];
    sub = sbox;
  }
  var a, b, c, d, a2, b2, c2;
  a = input[0] ^ w[0];
  b = input[decrypt ? 3 : 1] ^ w[1];
  c = input[2] ^ w[2];
  d = input[decrypt ? 1 : 3] ^ w[3];
  var i = 3;

  /* In order to share code we follow the encryption algorithm when both
    encrypting and decrypting. To account for the changes required in the
    decryption algorithm, we use different lookup tables when decrypting
    and use a modified key schedule to account for the difference in the
    order of transformations applied when performing rounds. We also get
    key rounds in reverse order (relative to encryption). */
  for(var round = 1; round < Nr; ++round) {
    /* As described above, we'll be using table lookups to perform the
      column mixing. Each column is stored as a word in the state (the
      array 'input' has one column as a word at each index). In order to
      mix a column, we perform these transformations on each row in c,
      which is 1 byte in each word. The new column for c0 is c'0:

               m0      m1      m2      m3
      r0,c'0 = 2*r0,c0 + 3*r1,c0 + 1*r2,c0 + 1*r3,c0
      r1,c'0 = 1*r0,c0 + 2*r1,c0 + 3*r2,c0 + 1*r3,c0
      r2,c'0 = 1*r0,c0 + 1*r1,c0 + 2*r2,c0 + 3*r3,c0
      r3,c'0 = 3*r0,c0 + 1*r1,c0 + 1*r2,c0 + 2*r3,c0

      So using mix tables where c0 is a word with r0 being its upper
      8 bits and r3 being its lower 8 bits:

      m0[c0 >> 24] will yield this word: [2*r0,1*r0,1*r0,3*r0]
      ...
      m3[c0 & 255] will yield this word: [1*r3,1*r3,3*r3,2*r3]

      Therefore to mix the columns in each word in the state we
      do the following (& 255 omitted for brevity):
      c'0,r0 = m0[c0 >> 24] ^ m1[c1 >> 16] ^ m2[c2 >> 8] ^ m3[c3]
      c'0,r1 = m0[c0 >> 24] ^ m1[c1 >> 16] ^ m2[c2 >> 8] ^ m3[c3]
      c'0,r2 = m0[c0 >> 24] ^ m1[c1 >> 16] ^ m2[c2 >> 8] ^ m3[c3]
      c'0,r3 = m0[c0 >> 24] ^ m1[c1 >> 16] ^ m2[c2 >> 8] ^ m3[c3]

      However, before mixing, the algorithm requires us to perform
      ShiftRows(). The ShiftRows() transformation cyclically shifts the
      last 3 rows of the state over different offsets. The first row
      (r = 0) is not shifted.

      s'_r,c = s_r,(c + shift(r, Nb) mod Nb
      for 0 < r < 4 and 0 <= c < Nb and
      shift(1, 4) = 1
      shift(2, 4) = 2
      shift(3, 4) = 3.

      This causes the first byte in r = 1 to be moved to the end of
      the row, the first 2 bytes in r = 2 to be moved to the end of
      the row, the first 3 bytes in r = 3 to be moved to the end of
      the row:

      r1: [c0 c1 c2 c3] => [c1 c2 c3 c0]
      r2: [c0 c1 c2 c3]    [c2 c3 c0 c1]
      r3: [c0 c1 c2 c3]    [c3 c0 c1 c2]

      We can make these substitutions inline with our column mixing to
      generate an updated set of equations to produce each word in the
      state (note the columns have changed positions):

      c0 c1 c2 c3 => c0 c1 c2 c3
      c0 c1 c2 c3    c1 c2 c3 c0  (cycled 1 byte)
      c0 c1 c2 c3    c2 c3 c0 c1  (cycled 2 bytes)
      c0 c1 c2 c3    c3 c0 c1 c2  (cycled 3 bytes)

      Therefore:

      c'0 = 2*r0,c0 + 3*r1,c1 + 1*r2,c2 + 1*r3,c3
      c'0 = 1*r0,c0 + 2*r1,c1 + 3*r2,c2 + 1*r3,c3
      c'0 = 1*r0,c0 + 1*r1,c1 + 2*r2,c2 + 3*r3,c3
      c'0 = 3*r0,c0 + 1*r1,c1 + 1*r2,c2 + 2*r3,c3

      c'1 = 2*r0,c1 + 3*r1,c2 + 1*r2,c3 + 1*r3,c0
      c'1 = 1*r0,c1 + 2*r1,c2 + 3*r2,c3 + 1*r3,c0
      c'1 = 1*r0,c1 + 1*r1,c2 + 2*r2,c3 + 3*r3,c0
      c'1 = 3*r0,c1 + 1*r1,c2 + 1*r2,c3 + 2*r3,c0

      ... and so forth for c'2 and c'3. The important distinction is
      that the columns are cycling, with c0 being used with the m0
      map when calculating c0, but c1 being used with the m0 map when
      calculating c1 ... and so forth.

      When performing the inverse we transform the mirror image and
      skip the bottom row, instead of the top one, and move upwards:

      c3 c2 c1 c0 => c0 c3 c2 c1  (cycled 3 bytes) *same as encryption
      c3 c2 c1 c0    c1 c0 c3 c2  (cycled 2 bytes)
      c3 c2 c1 c0    c2 c1 c0 c3  (cycled 1 byte)  *same as encryption
      c3 c2 c1 c0    c3 c2 c1 c0

      If you compare the resulting matrices for ShiftRows()+MixColumns()
      and for InvShiftRows()+InvMixColumns() the 2nd and 4th columns are
      different (in encrypt mode vs. decrypt mode). So in order to use
      the same code to handle both encryption and decryption, we will
      need to do some mapping.

      If in encryption mode we let a=c0, b=c1, c=c2, d=c3, and r<N> be
      a row number in the state, then the resulting matrix in encryption
      mode for applying the above transformations would be:

      r1: a b c d
      r2: b c d a
      r3: c d a b
      r4: d a b c

      If we did the same in decryption mode we would get:

      r1: a d c b
      r2: b a d c
      r3: c b a d
      r4: d c b a

      If instead we swap d and b (set b=c3 and d=c1), then we get:

      r1: a b c d
      r2: d a b c
      r3: c d a b
      r4: b c d a

      Now the 1st and 3rd rows are the same as the encryption matrix. All
      we need to do then to make the mapping exactly the same is to swap
      the 2nd and 4th rows when in decryption mode. To do this without
      having to do it on each iteration, we swapped the 2nd and 4th rows
      in the decryption key schedule. We also have to do the swap above
      when we first pull in the input and when we set the final output. */
    a2 =
      m0[a >>> 24] ^
      m1[b >>> 16 & 255] ^
      m2[c >>> 8 & 255] ^
      m3[d & 255] ^ w[++i];
    b2 =
      m0[b >>> 24] ^
      m1[c >>> 16 & 255] ^
      m2[d >>> 8 & 255] ^
      m3[a & 255] ^ w[++i];
    c2 =
      m0[c >>> 24] ^
      m1[d >>> 16 & 255] ^
      m2[a >>> 8 & 255] ^
      m3[b & 255] ^ w[++i];
    d =
      m0[d >>> 24] ^
      m1[a >>> 16 & 255] ^
      m2[b >>> 8 & 255] ^
      m3[c & 255] ^ w[++i];
    a = a2;
    b = b2;
    c = c2;
  }

  /*
    Encrypt:
    SubBytes(state)
    ShiftRows(state)
    AddRoundKey(state, w[Nr*Nb, (Nr+1)*Nb-1])

    Decrypt:
    InvShiftRows(state)
    InvSubBytes(state)
    AddRoundKey(state, w[0, Nb-1])
   */
   // Note: rows are shifted inline
  output[0] =
    (sub[a >>> 24] << 24) ^
    (sub[b >>> 16 & 255] << 16) ^
    (sub[c >>> 8 & 255] << 8) ^
    (sub[d & 255]) ^ w[++i];
  output[decrypt ? 3 : 1] =
    (sub[b >>> 24] << 24) ^
    (sub[c >>> 16 & 255] << 16) ^
    (sub[d >>> 8 & 255] << 8) ^
    (sub[a & 255]) ^ w[++i];
  output[2] =
    (sub[c >>> 24] << 24) ^
    (sub[d >>> 16 & 255] << 16) ^
    (sub[a >>> 8 & 255] << 8) ^
    (sub[b & 255]) ^ w[++i];
  output[decrypt ? 1 : 3] =
    (sub[d >>> 24] << 24) ^
    (sub[a >>> 16 & 255] << 16) ^
    (sub[b >>> 8 & 255] << 8) ^
    (sub[c & 255]) ^ w[++i];
};


forge.aes._updateBlock = _updateBlock;

/**
 * random.generate
 */

// the default prng plugin, uses AES-128
var prng_aes = {};
var _prng_aes_output = new Array(4);
var _prng_aes_buffer = forge.util.createBuffer();
prng_aes.formatKey = function(key) {
  // convert the key into 32-bit integers
  var tmp = forge.util.createBuffer(key);
  key = new Array(4);
  key[0] = tmp.getInt32();
  key[1] = tmp.getInt32();
  key[2] = tmp.getInt32();
  key[3] = tmp.getInt32();

  // return the expanded key
  return forge.aes._expandKey(key, false);
};
prng_aes.formatSeed = function(seed) {
  // convert seed into 32-bit integers
  var tmp = forge.util.createBuffer(seed);
  seed = new Array(4);
  seed[0] = tmp.getInt32();
  seed[1] = tmp.getInt32();
  seed[2] = tmp.getInt32();
  seed[3] = tmp.getInt32();
  return seed;
};
prng_aes.cipher = function(key, seed) {
  forge.aes._updateBlock(key, seed, _prng_aes_output, false);
  _prng_aes_buffer.putInt32(_prng_aes_output[0]);
  _prng_aes_buffer.putInt32(_prng_aes_output[1]);
  _prng_aes_buffer.putInt32(_prng_aes_output[2]);
  _prng_aes_buffer.putInt32(_prng_aes_output[3]);
  return _prng_aes_buffer.getBytes();
};
prng_aes.increment = function(seed) {
  // FIXME: do we care about carry or signed issues?
  ++seed[3];
  return seed;
};
prng_aes.md = forge.md.sha1;

// create default prng context
var _ctx = forge.prng.create(prng_aes);

// add other sources of entropy only if window.crypto.getRandomValues is not
// available -- otherwise this source will be automatically used by the prng

if (typeof window == 'undefined' || !window.crypto || !window.crypto.getRandomValues) {
// if this is a web worker, do not use weak entropy, instead register to
  // receive strong entropy asynchronously from the main thread
  if(typeof window === 'undefined' || window.document === undefined) {
    // FIXME:
  }

  // get load time entropy
  _ctx.collectInt(+new Date(), 32);

  // add some entropy from navigator object
  if(typeof(navigator) !== 'undefined') {
    var _navBytes = '';
    for(var key in navigator) {
      try {
        if(typeof(navigator[key]) == 'string') {
          _navBytes += navigator[key];
        }
      }
      catch(e) {
        /* Some navigator keys might not be accessible, e.g. the geolocation
          attribute throws an exception if touched in Mozilla chrome://
          context.

          Silently ignore this and just don't use this as a source of
          entropy. */
      }
    }
    _ctx.collect(_navBytes);
    _navBytes = null;
  }
}

forge.random = _ctx;

/**
 * random.getBytes
 */

forge.random.getBytes = function(count, callback) {
  return forge.random.generate(count, callback);
};

/**
 * pki
 * @author Dave Longley
 * @author Stefan Siegl <stesie@brokenpipe.de>
 *
 * Copyright (c) 2010-2013 Digital Bazaar, Inc.
 * Copyright (c) 2012 Stefan Siegl <stesie@brokenpipe.de>
 */

/**
 * pki.rsa.createKeyPairGenerationState
 */

forge.pki.rsa.createKeyPairGenerationState = function(bits, e) {
  // set default bits
  if(typeof(bits) === 'string') {
    bits = parseInt(bits, 10);
  }
  bits = bits || 1024;

  // create prng with api that matches BigInteger secure random
  var rng = {
    // x is an array to fill with bytes
    nextBytes: function(x) {
      var b = forge.random.getBytes(x.length);
      for(var i = 0; i < x.length; ++i) {
        x[i] = b.charCodeAt(i);
      }
    }
  };

  var rval = {
    state: 0,
    bits: bits,
    rng: rng,
    eInt: e || 65537,
    e: new BigInteger(null),
    p: null,
    q: null,
    qBits: bits >> 1,
    pBits: bits - (bits >> 1),
    pqState: 0,
    num: null,
    keys: null
  };
  rval.e.fromInt(rval.eInt);

  return rval;
};

/**
 * jsbn.BigInteger
 */

var dbits;

// JavaScript engine analysis
var canary = 0xdeadbeefcafe;
var j_lm = ((canary&0xffffff)==0xefcafe);

// (public) Constructor
function BigInteger(a,b,c) {
  this.data = [];
  if(a != null)
    if("number" == typeof a) this.fromNumber(a,b,c);
    else if(b == null && "string" != typeof a) this.fromString(a,256);
    else this.fromString(a,b);
}

// return new, unset BigInteger
function nbi() { return new BigInteger(null); }

// am: Compute w_j += (x*this_i), propagate carries,
// c is initial carry, returns final carry.
// c < 3*dvalue, x < 2*dvalue, this_i < dvalue
// We need to select the fastest one that works in this environment.

// am1: use a single mult and divide to get the high bits,
// max digit bits should be 26 because
// max internal value = 2*dvalue^2-2*dvalue (< 2^53)
function am1(i,x,w,j,c,n) {
  while(--n >= 0) {
    var v = x*this.data[i++]+w.data[j]+c;
    c = Math.floor(v/0x4000000);
    w.data[j++] = v&0x3ffffff;
  }
  return c;
}
// am2 avoids a big mult-and-extract completely.
// Max digit bits should be <= 30 because we do bitwise ops
// on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
function am2(i,x,w,j,c,n) {
  var xl = x&0x7fff, xh = x>>15;
  while(--n >= 0) {
    var l = this.data[i]&0x7fff;
    var h = this.data[i++]>>15;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x7fff)<<15)+w.data[j]+(c&0x3fffffff);
    c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
    w.data[j++] = l&0x3fffffff;
  }
  return c;
}
// Alternately, set max digit bits to 28 since some
// browsers slow down when dealing with 32-bit numbers.
function am3(i,x,w,j,c,n) {
  var xl = x&0x3fff, xh = x>>14;
  while(--n >= 0) {
    var l = this.data[i]&0x3fff;
    var h = this.data[i++]>>14;
    var m = xh*l+h*xl;
    l = xl*l+((m&0x3fff)<<14)+w.data[j]+c;
    c = (l>>28)+(m>>14)+xh*h;
    w.data[j++] = l&0xfffffff;
  }
  return c;
}

// node.js (no browser)
if(typeof(navigator) === 'undefined')
{
   BigInteger.prototype.am = am3;
   dbits = 28;
}
else if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
  BigInteger.prototype.am = am2;
  dbits = 30;
}
else if(j_lm && (navigator.appName != "Netscape")) {
  BigInteger.prototype.am = am1;
  dbits = 26;
}
else { // Mozilla/Netscape seems to prefer am3
  BigInteger.prototype.am = am3;
  dbits = 28;
}

BigInteger.prototype.DB = dbits;
BigInteger.prototype.DM = ((1<<dbits)-1);
BigInteger.prototype.DV = (1<<dbits);

var BI_FP = 52;
BigInteger.prototype.FV = Math.pow(2,BI_FP);
BigInteger.prototype.F1 = BI_FP-dbits;
BigInteger.prototype.F2 = 2*dbits-BI_FP;

// Digit conversions
var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
var BI_RC = new Array();
var rr,vv;
rr = "0".charCodeAt(0);
for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
rr = "a".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
rr = "A".charCodeAt(0);
for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;

function int2char(n) { return BI_RM.charAt(n); }
function intAt(s,i) {
  var c = BI_RC[s.charCodeAt(i)];
  return (c==null)?-1:c;
}

// (protected) copy this to r
function bnpCopyTo(r) {
  for(var i = this.t-1; i >= 0; --i) r.data[i] = this.data[i];
  r.t = this.t;
  r.s = this.s;
}

// (protected) set from integer value x, -DV <= x < DV
function bnpFromInt(x) {
  this.t = 1;
  this.s = (x<0)?-1:0;
  if(x > 0) this.data[0] = x;
  else if(x < -1) this.data[0] = x+DV;
  else this.t = 0;
}

// return bigint initialized to value
function nbv(i) { var r = nbi(); r.fromInt(i); return r; }

// (protected) set from string and radix
function bnpFromString(s,b) {
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 256) k = 8; // byte array
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else { this.fromRadix(s,b); return; }
  this.t = 0;
  this.s = 0;
  var i = s.length, mi = false, sh = 0;
  while(--i >= 0) {
    var x = (k==8)?s[i]&0xff:intAt(s,i);
    if(x < 0) {
      if(s.charAt(i) == "-") mi = true;
      continue;
    }
    mi = false;
    if(sh == 0)
      this.data[this.t++] = x;
    else if(sh+k > this.DB) {
      this.data[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
      this.data[this.t++] = (x>>(this.DB-sh));
    }
    else
      this.data[this.t-1] |= x<<sh;
    sh += k;
    if(sh >= this.DB) sh -= this.DB;
  }
  if(k == 8 && (s[0]&0x80) != 0) {
    this.s = -1;
    if(sh > 0) this.data[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
  }
  this.clamp();
  if(mi) BigInteger.ZERO.subTo(this,this);
}

// (protected) clamp off excess high words
function bnpClamp() {
  var c = this.s&this.DM;
  while(this.t > 0 && this.data[this.t-1] == c) --this.t;
}

// (public) return string representation in given radix
function bnToString(b) {
  if(this.s < 0) return "-"+this.negate().toString(b);
  var k;
  if(b == 16) k = 4;
  else if(b == 8) k = 3;
  else if(b == 2) k = 1;
  else if(b == 32) k = 5;
  else if(b == 4) k = 2;
  else return this.toRadix(b);
  var km = (1<<k)-1, d, m = false, r = "", i = this.t;
  var p = this.DB-(i*this.DB)%k;
  if(i-- > 0) {
    if(p < this.DB && (d = this.data[i]>>p) > 0) { m = true; r = int2char(d); }
    while(i >= 0) {
      if(p < k) {
        d = (this.data[i]&((1<<p)-1))<<(k-p);
        d |= this.data[--i]>>(p+=this.DB-k);
      }
      else {
        d = (this.data[i]>>(p-=k))&km;
        if(p <= 0) { p += this.DB; --i; }
      }
      if(d > 0) m = true;
      if(m) r += int2char(d);
    }
  }
  return m?r:"0";
}

// (public) -this
function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }

// (public) |this|
function bnAbs() { return (this.s<0)?this.negate():this; }

// (public) return + if this > a, - if this < a, 0 if equal
function bnCompareTo(a) {
  var r = this.s-a.s;
  if(r != 0) return r;
  var i = this.t;
  r = i-a.t;
  if(r != 0) return (this.s<0)?-r:r;
  while(--i >= 0) if((r=this.data[i]-a.data[i]) != 0) return r;
  return 0;
}

// returns bit length of the integer x
function nbits(x) {
  var r = 1, t;
  if((t=x>>>16) != 0) { x = t; r += 16; }
  if((t=x>>8) != 0) { x = t; r += 8; }
  if((t=x>>4) != 0) { x = t; r += 4; }
  if((t=x>>2) != 0) { x = t; r += 2; }
  if((t=x>>1) != 0) { x = t; r += 1; }
  return r;
}

// (public) return the number of bits in "this"
function bnBitLength() {
  if(this.t <= 0) return 0;
  return this.DB*(this.t-1)+nbits(this.data[this.t-1]^(this.s&this.DM));
}

// (protected) r = this << n*DB
function bnpDLShiftTo(n,r) {
  var i;
  for(i = this.t-1; i >= 0; --i) r.data[i+n] = this.data[i];
  for(i = n-1; i >= 0; --i) r.data[i] = 0;
  r.t = this.t+n;
  r.s = this.s;
}

// (protected) r = this >> n*DB
function bnpDRShiftTo(n,r) {
  for(var i = n; i < this.t; ++i) r.data[i-n] = this.data[i];
  r.t = Math.max(this.t-n,0);
  r.s = this.s;
}

// (protected) r = this << n
function bnpLShiftTo(n,r) {
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<cbs)-1;
  var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
  for(i = this.t-1; i >= 0; --i) {
    r.data[i+ds+1] = (this.data[i]>>cbs)|c;
    c = (this.data[i]&bm)<<bs;
  }
  for(i = ds-1; i >= 0; --i) r.data[i] = 0;
  r.data[ds] = c;
  r.t = this.t+ds+1;
  r.s = this.s;
  r.clamp();
}

// (protected) r = this >> n
function bnpRShiftTo(n,r) {
  r.s = this.s;
  var ds = Math.floor(n/this.DB);
  if(ds >= this.t) { r.t = 0; return; }
  var bs = n%this.DB;
  var cbs = this.DB-bs;
  var bm = (1<<bs)-1;
  r.data[0] = this.data[ds]>>bs;
  for(var i = ds+1; i < this.t; ++i) {
    r.data[i-ds-1] |= (this.data[i]&bm)<<cbs;
    r.data[i-ds] = this.data[i]>>bs;
  }
  if(bs > 0) r.data[this.t-ds-1] |= (this.s&bm)<<cbs;
  r.t = this.t-ds;
  r.clamp();
}

// (protected) r = this - a
function bnpSubTo(a,r) {
  var i = 0, c = 0, m = Math.min(a.t,this.t);
  while(i < m) {
    c += this.data[i]-a.data[i];
    r.data[i++] = c&this.DM;
    c >>= this.DB;
  }
  if(a.t < this.t) {
    c -= a.s;
    while(i < this.t) {
      c += this.data[i];
      r.data[i++] = c&this.DM;
      c >>= this.DB;
    }
    c += this.s;
  }
  else {
    c += this.s;
    while(i < a.t) {
      c -= a.data[i];
      r.data[i++] = c&this.DM;
      c >>= this.DB;
    }
    c -= a.s;
  }
  r.s = (c<0)?-1:0;
  if(c < -1) r.data[i++] = this.DV+c;
  else if(c > 0) r.data[i++] = c;
  r.t = i;
  r.clamp();
}

// (protected) r = this * a, r != this,a (HAC 14.12)
// "this" should be the larger one if appropriate.
function bnpMultiplyTo(a,r) {
  var x = this.abs(), y = a.abs();
  var i = x.t;
  r.t = i+y.t;
  while(--i >= 0) r.data[i] = 0;
  for(i = 0; i < y.t; ++i) r.data[i+x.t] = x.am(0,y.data[i],r,i,0,x.t);
  r.s = 0;
  r.clamp();
  if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
}

// (protected) r = this^2, r != this (HAC 14.16)
function bnpSquareTo(r) {
  var x = this.abs();
  var i = r.t = 2*x.t;
  while(--i >= 0) r.data[i] = 0;
  for(i = 0; i < x.t-1; ++i) {
    var c = x.am(i,x.data[i],r,2*i,0,1);
    if((r.data[i+x.t]+=x.am(i+1,2*x.data[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
      r.data[i+x.t] -= x.DV;
      r.data[i+x.t+1] = 1;
    }
  }
  if(r.t > 0) r.data[r.t-1] += x.am(i,x.data[i],r,2*i,0,1);
  r.s = 0;
  r.clamp();
}

// (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
// r != q, this != m.  q or r may be null.
function bnpDivRemTo(m,q,r) {
  var pm = m.abs();
  if(pm.t <= 0) return;
  var pt = this.abs();
  if(pt.t < pm.t) {
    if(q != null) q.fromInt(0);
    if(r != null) this.copyTo(r);
    return;
  }
  if(r == null) r = nbi();
  var y = nbi(), ts = this.s, ms = m.s;
  var nsh = this.DB-nbits(pm.data[pm.t-1]); // normalize modulus
  if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
  else { pm.copyTo(y); pt.copyTo(r); }
  var ys = y.t;
  var y0 = y.data[ys-1];
  if(y0 == 0) return;
  var yt = y0*(1<<this.F1)+((ys>1)?y.data[ys-2]>>this.F2:0);
  var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
  var i = r.t, j = i-ys, t = (q==null)?nbi():q;
  y.dlShiftTo(j,t);
  if(r.compareTo(t) >= 0) {
    r.data[r.t++] = 1;
    r.subTo(t,r);
  }
  BigInteger.ONE.dlShiftTo(ys,t);
  t.subTo(y,y); // "negative" y so we can replace sub with am later
  while(y.t < ys) y.data[y.t++] = 0;
  while(--j >= 0) {
    // Estimate quotient digit
    var qd = (r.data[--i]==y0)?this.DM:Math.floor(r.data[i]*d1+(r.data[i-1]+e)*d2);
    if((r.data[i]+=y.am(0,qd,r,j,0,ys)) < qd) { // Try it out
      y.dlShiftTo(j,t);
      r.subTo(t,r);
      while(r.data[i] < --qd) r.subTo(t,r);
    }
  }
  if(q != null) {
    r.drShiftTo(ys,q);
    if(ts != ms) BigInteger.ZERO.subTo(q,q);
  }
  r.t = ys;
  r.clamp();
  if(nsh > 0) r.rShiftTo(nsh,r);  // Denormalize remainder
  if(ts < 0) BigInteger.ZERO.subTo(r,r);
}

// (public) this mod a
function bnMod(a) {
  var r = nbi();
  this.abs().divRemTo(a,null,r);
  if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
  return r;
}

// Modular reduction using "classic" algorithm
function Classic(m) { this.m = m; }
function cConvert(x) {
  if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
  else return x;
}
function cRevert(x) { return x; }
function cReduce(x) { x.divRemTo(this.m,null,x); }
function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

Classic.prototype.convert = cConvert;
Classic.prototype.revert = cRevert;
Classic.prototype.reduce = cReduce;
Classic.prototype.mulTo = cMulTo;
Classic.prototype.sqrTo = cSqrTo;

// (protected) return "-1/this % 2^DB"; useful for Mont. reduction
// justification:
//         xy == 1 (mod m)
//         xy =  1+km
//   xy(2-xy) = (1+km)(1-km)
// x[y(2-xy)] = 1-k^2m^2
// x[y(2-xy)] == 1 (mod m^2)
// if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
// should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
// JS multiply "overflows" differently from C/C++, so care is needed here.
function bnpInvDigit() {
  if(this.t < 1) return 0;
  var x = this.data[0];
  if((x&1) == 0) return 0;
  var y = x&3;    // y == 1/x mod 2^2
  y = (y*(2-(x&0xf)*y))&0xf;  // y == 1/x mod 2^4
  y = (y*(2-(x&0xff)*y))&0xff;  // y == 1/x mod 2^8
  y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff; // y == 1/x mod 2^16
  // last step - calculate inverse mod DV directly;
  // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
  y = (y*(2-x*y%this.DV))%this.DV;    // y == 1/x mod 2^dbits
  // we really want the negative inverse, and -DV < y < DV
  return (y>0)?this.DV-y:-y;
}

// Montgomery reduction
function Montgomery(m) {
  this.m = m;
  this.mp = m.invDigit();
  this.mpl = this.mp&0x7fff;
  this.mph = this.mp>>15;
  this.um = (1<<(m.DB-15))-1;
  this.mt2 = 2*m.t;
}

// xR mod m
function montConvert(x) {
  var r = nbi();
  x.abs().dlShiftTo(this.m.t,r);
  r.divRemTo(this.m,null,r);
  if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
  return r;
}

// x/R mod m
function montRevert(x) {
  var r = nbi();
  x.copyTo(r);
  this.reduce(r);
  return r;
}

// x = x/R mod m (HAC 14.32)
function montReduce(x) {
  while(x.t <= this.mt2)  // pad x so am has enough room later
    x.data[x.t++] = 0;
  for(var i = 0; i < this.m.t; ++i) {
    // faster way of calculating u0 = x.data[i]*mp mod DV
    var j = x.data[i]&0x7fff;
    var u0 = (j*this.mpl+(((j*this.mph+(x.data[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
    // use am to combine the multiply-shift-add into one call
    j = i+this.m.t;
    x.data[j] += this.m.am(0,u0,x,i,0,this.m.t);
    // propagate carry
    while(x.data[j] >= x.DV) { x.data[j] -= x.DV; x.data[++j]++; }
  }
  x.clamp();
  x.drShiftTo(this.m.t,x);
  if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

// r = "x^2/R mod m"; x != r
function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

// r = "xy/R mod m"; x,y != r
function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Montgomery.prototype.convert = montConvert;
Montgomery.prototype.revert = montRevert;
Montgomery.prototype.reduce = montReduce;
Montgomery.prototype.mulTo = montMulTo;
Montgomery.prototype.sqrTo = montSqrTo;

// (protected) true iff this is even
function bnpIsEven() { return ((this.t>0)?(this.data[0]&1):this.s) == 0; }

// (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
function bnpExp(e,z) {
  if(e > 0xffffffff || e < 1) return BigInteger.ONE;
  var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
  g.copyTo(r);
  while(--i >= 0) {
    z.sqrTo(r,r2);
    if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
    else { var t = r; r = r2; r2 = t; }
  }
  return z.revert(r);
}

// (public) this^e % m, 0 <= e < 2^32
function bnModPowInt(e,m) {
  var z;
  if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
  return this.exp(e,z);
}

// protected
BigInteger.prototype.copyTo = bnpCopyTo;
BigInteger.prototype.fromInt = bnpFromInt;
BigInteger.prototype.fromString = bnpFromString;
BigInteger.prototype.clamp = bnpClamp;
BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
BigInteger.prototype.drShiftTo = bnpDRShiftTo;
BigInteger.prototype.lShiftTo = bnpLShiftTo;
BigInteger.prototype.rShiftTo = bnpRShiftTo;
BigInteger.prototype.subTo = bnpSubTo;
BigInteger.prototype.multiplyTo = bnpMultiplyTo;
BigInteger.prototype.squareTo = bnpSquareTo;
BigInteger.prototype.divRemTo = bnpDivRemTo;
BigInteger.prototype.invDigit = bnpInvDigit;
BigInteger.prototype.isEven = bnpIsEven;
BigInteger.prototype.exp = bnpExp;

// public
BigInteger.prototype.toString = bnToString;
BigInteger.prototype.negate = bnNegate;
BigInteger.prototype.abs = bnAbs;
BigInteger.prototype.compareTo = bnCompareTo;
BigInteger.prototype.bitLength = bnBitLength;
BigInteger.prototype.mod = bnMod;
BigInteger.prototype.modPowInt = bnModPowInt;

// "constants"
BigInteger.ZERO = nbv(0);
BigInteger.ONE = nbv(1);

// jsbn2 lib

//Copyright (c) 2005-2009  Tom Wu
//All Rights Reserved.
//See "LICENSE" for details (See jsbn.js for LICENSE).

//Extended JavaScript BN functions, required for RSA private ops.

//Version 1.1: new BigInteger("0", 10) returns "proper" zero

//(public)
function bnClone() { var r = nbi(); this.copyTo(r); return r; }

//(public) return value as integer
function bnIntValue() {
if(this.s < 0) {
 if(this.t == 1) return this.data[0]-this.DV;
 else if(this.t == 0) return -1;
}
else if(this.t == 1) return this.data[0];
else if(this.t == 0) return 0;
// assumes 16 < DB < 32
return ((this.data[1]&((1<<(32-this.DB))-1))<<this.DB)|this.data[0];
}

//(public) return value as byte
function bnByteValue() { return (this.t==0)?this.s:(this.data[0]<<24)>>24; }

//(public) return value as short (assumes DB>=16)
function bnShortValue() { return (this.t==0)?this.s:(this.data[0]<<16)>>16; }

//(protected) return x s.t. r^x < DV
function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }

//(public) 0 if this == 0, 1 if this > 0
function bnSigNum() {
if(this.s < 0) return -1;
else if(this.t <= 0 || (this.t == 1 && this.data[0] <= 0)) return 0;
else return 1;
}

//(protected) convert to radix string
function bnpToRadix(b) {
if(b == null) b = 10;
if(this.signum() == 0 || b < 2 || b > 36) return "0";
var cs = this.chunkSize(b);
var a = Math.pow(b,cs);
var d = nbv(a), y = nbi(), z = nbi(), r = "";
this.divRemTo(d,y,z);
while(y.signum() > 0) {
 r = (a+z.intValue()).toString(b).substr(1) + r;
 y.divRemTo(d,y,z);
}
return z.intValue().toString(b) + r;
}

//(protected) convert from radix string
function bnpFromRadix(s,b) {
this.fromInt(0);
if(b == null) b = 10;
var cs = this.chunkSize(b);
var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
for(var i = 0; i < s.length; ++i) {
 var x = intAt(s,i);
 if(x < 0) {
   if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
   continue;
 }
 w = b*w+x;
 if(++j >= cs) {
   this.dMultiply(d);
   this.dAddOffset(w,0);
   j = 0;
   w = 0;
 }
}
if(j > 0) {
 this.dMultiply(Math.pow(b,j));
 this.dAddOffset(w,0);
}
if(mi) BigInteger.ZERO.subTo(this,this);
}

//(protected) alternate constructor
function bnpFromNumber(a,b,c) {
if("number" == typeof b) {
 // new BigInteger(int,int,RNG)
 if(a < 2) this.fromInt(1);
 else {
   this.fromNumber(a,c);
   if(!this.testBit(a-1))  // force MSB set
     this.bitwiseTo(BigInteger.ONE.shiftLeft(a-1),op_or,this);
   if(this.isEven()) this.dAddOffset(1,0); // force odd
   while(!this.isProbablePrime(b)) {
     this.dAddOffset(2,0);
     if(this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a-1),this);
   }
 }
}
else {
 // new BigInteger(int,RNG)
 var x = new Array(), t = a&7;
 x.length = (a>>3)+1;
 b.nextBytes(x);
 if(t > 0) x[0] &= ((1<<t)-1); else x[0] = 0;
 this.fromString(x,256);
}
}

//(public) convert to bigendian byte array
function bnToByteArray() {
var i = this.t, r = new Array();
r[0] = this.s;
var p = this.DB-(i*this.DB)%8, d, k = 0;
if(i-- > 0) {
 if(p < this.DB && (d = this.data[i]>>p) != (this.s&this.DM)>>p)
   r[k++] = d|(this.s<<(this.DB-p));
 while(i >= 0) {
   if(p < 8) {
     d = (this.data[i]&((1<<p)-1))<<(8-p);
     d |= this.data[--i]>>(p+=this.DB-8);
   }
   else {
     d = (this.data[i]>>(p-=8))&0xff;
     if(p <= 0) { p += this.DB; --i; }
   }
   if((d&0x80) != 0) d |= -256;
   if(k == 0 && (this.s&0x80) != (d&0x80)) ++k;
   if(k > 0 || d != this.s) r[k++] = d;
 }
}
return r;
}

function bnEquals(a) { return(this.compareTo(a)==0); }
function bnMin(a) { return(this.compareTo(a)<0)?this:a; }
function bnMax(a) { return(this.compareTo(a)>0)?this:a; }

//(protected) r = this op a (bitwise)
function bnpBitwiseTo(a,op,r) {
var i, f, m = Math.min(a.t,this.t);
for(i = 0; i < m; ++i) r.data[i] = op(this.data[i],a.data[i]);
if(a.t < this.t) {
 f = a.s&this.DM;
 for(i = m; i < this.t; ++i) r.data[i] = op(this.data[i],f);
 r.t = this.t;
}
else {
 f = this.s&this.DM;
 for(i = m; i < a.t; ++i) r.data[i] = op(f,a.data[i]);
 r.t = a.t;
}
r.s = op(this.s,a.s);
r.clamp();
}

//(public) this & a
function op_and(x,y) { return x&y; }
function bnAnd(a) { var r = nbi(); this.bitwiseTo(a,op_and,r); return r; }

//(public) this | a
function op_or(x,y) { return x|y; }
function bnOr(a) { var r = nbi(); this.bitwiseTo(a,op_or,r); return r; }

//(public) this ^ a
function op_xor(x,y) { return x^y; }
function bnXor(a) { var r = nbi(); this.bitwiseTo(a,op_xor,r); return r; }

//(public) this & ~a
function op_andnot(x,y) { return x&~y; }
function bnAndNot(a) { var r = nbi(); this.bitwiseTo(a,op_andnot,r); return r; }

//(public) ~this
function bnNot() {
var r = nbi();
for(var i = 0; i < this.t; ++i) r.data[i] = this.DM&~this.data[i];
r.t = this.t;
r.s = ~this.s;
return r;
}

//(public) this << n
function bnShiftLeft(n) {
var r = nbi();
if(n < 0) this.rShiftTo(-n,r); else this.lShiftTo(n,r);
return r;
}

//(public) this >> n
function bnShiftRight(n) {
var r = nbi();
if(n < 0) this.lShiftTo(-n,r); else this.rShiftTo(n,r);
return r;
}

//return index of lowest 1-bit in x, x < 2^31
function lbit(x) {
if(x == 0) return -1;
var r = 0;
if((x&0xffff) == 0) { x >>= 16; r += 16; }
if((x&0xff) == 0) { x >>= 8; r += 8; }
if((x&0xf) == 0) { x >>= 4; r += 4; }
if((x&3) == 0) { x >>= 2; r += 2; }
if((x&1) == 0) ++r;
return r;
}

//(public) returns index of lowest 1-bit (or -1 if none)
function bnGetLowestSetBit() {
for(var i = 0; i < this.t; ++i)
 if(this.data[i] != 0) return i*this.DB+lbit(this.data[i]);
if(this.s < 0) return this.t*this.DB;
return -1;
}

//return number of 1 bits in x
function cbit(x) {
var r = 0;
while(x != 0) { x &= x-1; ++r; }
return r;
}

//(public) return number of set bits
function bnBitCount() {
var r = 0, x = this.s&this.DM;
for(var i = 0; i < this.t; ++i) r += cbit(this.data[i]^x);
return r;
}

//(public) true iff nth bit is set
function bnTestBit(n) {
var j = Math.floor(n/this.DB);
if(j >= this.t) return(this.s!=0);
return((this.data[j]&(1<<(n%this.DB)))!=0);
}

//(protected) this op (1<<n)
function bnpChangeBit(n,op) {
var r = BigInteger.ONE.shiftLeft(n);
this.bitwiseTo(r,op,r);
return r;
}

//(public) this | (1<<n)
function bnSetBit(n) { return this.changeBit(n,op_or); }

//(public) this & ~(1<<n)
function bnClearBit(n) { return this.changeBit(n,op_andnot); }

//(public) this ^ (1<<n)
function bnFlipBit(n) { return this.changeBit(n,op_xor); }

//(protected) r = this + a
function bnpAddTo(a,r) {
var i = 0, c = 0, m = Math.min(a.t,this.t);
while(i < m) {
 c += this.data[i]+a.data[i];
 r.data[i++] = c&this.DM;
 c >>= this.DB;
}
if(a.t < this.t) {
 c += a.s;
 while(i < this.t) {
   c += this.data[i];
   r.data[i++] = c&this.DM;
   c >>= this.DB;
 }
 c += this.s;
}
else {
 c += this.s;
 while(i < a.t) {
   c += a.data[i];
   r.data[i++] = c&this.DM;
   c >>= this.DB;
 }
 c += a.s;
}
r.s = (c<0)?-1:0;
if(c > 0) r.data[i++] = c;
else if(c < -1) r.data[i++] = this.DV+c;
r.t = i;
r.clamp();
}

//(public) this + a
function bnAdd(a) { var r = nbi(); this.addTo(a,r); return r; }

//(public) this - a
function bnSubtract(a) { var r = nbi(); this.subTo(a,r); return r; }

//(public) this * a
function bnMultiply(a) { var r = nbi(); this.multiplyTo(a,r); return r; }

//(public) this / a
function bnDivide(a) { var r = nbi(); this.divRemTo(a,r,null); return r; }

//(public) this % a
function bnRemainder(a) { var r = nbi(); this.divRemTo(a,null,r); return r; }

//(public) [this/a,this%a]
function bnDivideAndRemainder(a) {
var q = nbi(), r = nbi();
this.divRemTo(a,q,r);
return new Array(q,r);
}

//(protected) this *= n, this >= 0, 1 < n < DV
function bnpDMultiply(n) {
this.data[this.t] = this.am(0,n-1,this,0,0,this.t);
++this.t;
this.clamp();
}

//(protected) this += n << w words, this >= 0
function bnpDAddOffset(n,w) {
if(n == 0) return;
while(this.t <= w) this.data[this.t++] = 0;
this.data[w] += n;
while(this.data[w] >= this.DV) {
 this.data[w] -= this.DV;
 if(++w >= this.t) this.data[this.t++] = 0;
 ++this.data[w];
}
}

//A "null" reducer
function NullExp() {}
function nNop(x) { return x; }
function nMulTo(x,y,r) { x.multiplyTo(y,r); }
function nSqrTo(x,r) { x.squareTo(r); }

NullExp.prototype.convert = nNop;
NullExp.prototype.revert = nNop;
NullExp.prototype.mulTo = nMulTo;
NullExp.prototype.sqrTo = nSqrTo;

//(public) this^e
function bnPow(e) { return this.exp(e,new NullExp()); }

//(protected) r = lower n words of "this * a", a.t <= n
//"this" should be the larger one if appropriate.
function bnpMultiplyLowerTo(a,n,r) {
var i = Math.min(this.t+a.t,n);
r.s = 0; // assumes a,this >= 0
r.t = i;
while(i > 0) r.data[--i] = 0;
var j;
for(j = r.t-this.t; i < j; ++i) r.data[i+this.t] = this.am(0,a.data[i],r,i,0,this.t);
for(j = Math.min(a.t,n); i < j; ++i) this.am(0,a.data[i],r,i,0,n-i);
r.clamp();
}

//(protected) r = "this * a" without lower n words, n > 0
//"this" should be the larger one if appropriate.
function bnpMultiplyUpperTo(a,n,r) {
--n;
var i = r.t = this.t+a.t-n;
r.s = 0; // assumes a,this >= 0
while(--i >= 0) r.data[i] = 0;
for(i = Math.max(n-this.t,0); i < a.t; ++i)
 r.data[this.t+i-n] = this.am(n-i,a.data[i],r,0,0,this.t+i-n);
r.clamp();
r.drShiftTo(1,r);
}

//Barrett modular reduction
function Barrett(m) {
// setup Barrett
this.r2 = nbi();
this.q3 = nbi();
BigInteger.ONE.dlShiftTo(2*m.t,this.r2);
this.mu = this.r2.divide(m);
this.m = m;
}

function barrettConvert(x) {
if(x.s < 0 || x.t > 2*this.m.t) return x.mod(this.m);
else if(x.compareTo(this.m) < 0) return x;
else { var r = nbi(); x.copyTo(r); this.reduce(r); return r; }
}

function barrettRevert(x) { return x; }

//x = x mod m (HAC 14.42)
function barrettReduce(x) {
x.drShiftTo(this.m.t-1,this.r2);
if(x.t > this.m.t+1) { x.t = this.m.t+1; x.clamp(); }
this.mu.multiplyUpperTo(this.r2,this.m.t+1,this.q3);
this.m.multiplyLowerTo(this.q3,this.m.t+1,this.r2);
while(x.compareTo(this.r2) < 0) x.dAddOffset(1,this.m.t+1);
x.subTo(this.r2,x);
while(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
}

//r = x^2 mod m; x != r
function barrettSqrTo(x,r) { x.squareTo(r); this.reduce(r); }

//r = x*y mod m; x,y != r
function barrettMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }

Barrett.prototype.convert = barrettConvert;
Barrett.prototype.revert = barrettRevert;
Barrett.prototype.reduce = barrettReduce;
Barrett.prototype.mulTo = barrettMulTo;
Barrett.prototype.sqrTo = barrettSqrTo;

//(public) this^e % m (HAC 14.85)
function bnModPow(e,m) {
var i = e.bitLength(), k, r = nbv(1), z;
if(i <= 0) return r;
else if(i < 18) k = 1;
else if(i < 48) k = 3;
else if(i < 144) k = 4;
else if(i < 768) k = 5;
else k = 6;
if(i < 8)
 z = new Classic(m);
else if(m.isEven())
 z = new Barrett(m);
else
 z = new Montgomery(m);

// precomputation
var g = new Array(), n = 3, k1 = k-1, km = (1<<k)-1;
g[1] = z.convert(this);
if(k > 1) {
 var g2 = nbi();
 z.sqrTo(g[1],g2);
 while(n <= km) {
   g[n] = nbi();
   z.mulTo(g2,g[n-2],g[n]);
   n += 2;
 }
}

var j = e.t-1, w, is1 = true, r2 = nbi(), t;
i = nbits(e.data[j])-1;
while(j >= 0) {
 if(i >= k1) w = (e.data[j]>>(i-k1))&km;
 else {
   w = (e.data[j]&((1<<(i+1))-1))<<(k1-i);
   if(j > 0) w |= e.data[j-1]>>(this.DB+i-k1);
 }

 n = k;
 while((w&1) == 0) { w >>= 1; --n; }
 if((i -= n) < 0) { i += this.DB; --j; }
 if(is1) {  // ret == 1, don't bother squaring or multiplying it
   g[w].copyTo(r);
   is1 = false;
 }
 else {
   while(n > 1) { z.sqrTo(r,r2); z.sqrTo(r2,r); n -= 2; }
   if(n > 0) z.sqrTo(r,r2); else { t = r; r = r2; r2 = t; }
   z.mulTo(r2,g[w],r);
 }

 while(j >= 0 && (e.data[j]&(1<<i)) == 0) {
   z.sqrTo(r,r2); t = r; r = r2; r2 = t;
   if(--i < 0) { i = this.DB-1; --j; }
 }
}
return z.revert(r);
}

//(public) gcd(this,a) (HAC 14.54)
function bnGCD(a) {
var x = (this.s<0)?this.negate():this.clone();
var y = (a.s<0)?a.negate():a.clone();
if(x.compareTo(y) < 0) { var t = x; x = y; y = t; }
var i = x.getLowestSetBit(), g = y.getLowestSetBit();
if(g < 0) return x;
if(i < g) g = i;
if(g > 0) {
 x.rShiftTo(g,x);
 y.rShiftTo(g,y);
}
while(x.signum() > 0) {
 if((i = x.getLowestSetBit()) > 0) x.rShiftTo(i,x);
 if((i = y.getLowestSetBit()) > 0) y.rShiftTo(i,y);
 if(x.compareTo(y) >= 0) {
   x.subTo(y,x);
   x.rShiftTo(1,x);
 }
 else {
   y.subTo(x,y);
   y.rShiftTo(1,y);
 }
}
if(g > 0) y.lShiftTo(g,y);
return y;
}

//(protected) this % n, n < 2^26
function bnpModInt(n) {
if(n <= 0) return 0;
var d = this.DV%n, r = (this.s<0)?n-1:0;
if(this.t > 0)
 if(d == 0) r = this.data[0]%n;
 else for(var i = this.t-1; i >= 0; --i) r = (d*r+this.data[i])%n;
return r;
}

//(public) 1/this % m (HAC 14.61)
function bnModInverse(m) {
var ac = m.isEven();
if((this.isEven() && ac) || m.signum() == 0) return BigInteger.ZERO;
var u = m.clone(), v = this.clone();
var a = nbv(1), b = nbv(0), c = nbv(0), d = nbv(1);
while(u.signum() != 0) {
 while(u.isEven()) {
   u.rShiftTo(1,u);
   if(ac) {
     if(!a.isEven() || !b.isEven()) { a.addTo(this,a); b.subTo(m,b); }
     a.rShiftTo(1,a);
   }
   else if(!b.isEven()) b.subTo(m,b);
   b.rShiftTo(1,b);
 }
 while(v.isEven()) {
   v.rShiftTo(1,v);
   if(ac) {
     if(!c.isEven() || !d.isEven()) { c.addTo(this,c); d.subTo(m,d); }
     c.rShiftTo(1,c);
   }
   else if(!d.isEven()) d.subTo(m,d);
   d.rShiftTo(1,d);
 }
 if(u.compareTo(v) >= 0) {
   u.subTo(v,u);
   if(ac) a.subTo(c,a);
   b.subTo(d,b);
 }
 else {
   v.subTo(u,v);
   if(ac) c.subTo(a,c);
   d.subTo(b,d);
 }
}
if(v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
if(d.compareTo(m) >= 0) return d.subtract(m);
if(d.signum() < 0) d.addTo(m,d); else return d;
if(d.signum() < 0) return d.add(m); else return d;
}

var lowprimes = [2,3,5,7,11,13,17,19,23,29,31,37,41,43,47,53,59,61,67,71,73,79,83,89,97,101,103,107,109,113,127,131,137,139,149,151,157,163,167,173,179,181,191,193,197,199,211,223,227,229,233,239,241,251,257,263,269,271,277,281,283,293,307,311,313,317,331,337,347,349,353,359,367,373,379,383,389,397,401,409,419,421,431,433,439,443,449,457,461,463,467,479,487,491,499,503,509];
var lplim = (1<<26)/lowprimes[lowprimes.length-1];

//(public) test primality with certainty >= 1-.5^t
function bnIsProbablePrime(t) {
var i, x = this.abs();
if(x.t == 1 && x.data[0] <= lowprimes[lowprimes.length-1]) {
 for(i = 0; i < lowprimes.length; ++i)
   if(x.data[0] == lowprimes[i]) return true;
 return false;
}
if(x.isEven()) return false;
i = 1;
while(i < lowprimes.length) {
 var m = lowprimes[i], j = i+1;
 while(j < lowprimes.length && m < lplim) m *= lowprimes[j++];
 m = x.modInt(m);
 while(i < j) if(m%lowprimes[i++] == 0) return false;
}
return x.millerRabin(t);
}

//(protected) true if probably prime (HAC 4.24, Miller-Rabin)
function bnpMillerRabin(t) {
var n1 = this.subtract(BigInteger.ONE);
var k = n1.getLowestSetBit();
if(k <= 0) return false;
var r = n1.shiftRight(k);
t = (t+1)>>1;
if(t > lowprimes.length) t = lowprimes.length;
var a = nbi();
for(var i = 0; i < t; ++i) {
 a.fromInt(lowprimes[i]);
 var y = a.modPow(r,this);
 if(y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
   var j = 1;
   while(j++ < k && y.compareTo(n1) != 0) {
     y = y.modPowInt(2,this);
     if(y.compareTo(BigInteger.ONE) == 0) return false;
   }
   if(y.compareTo(n1) != 0) return false;
 }
}
return true;
}

//protected
BigInteger.prototype.chunkSize = bnpChunkSize;
BigInteger.prototype.toRadix = bnpToRadix;
BigInteger.prototype.fromRadix = bnpFromRadix;
BigInteger.prototype.fromNumber = bnpFromNumber;
BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
BigInteger.prototype.changeBit = bnpChangeBit;
BigInteger.prototype.addTo = bnpAddTo;
BigInteger.prototype.dMultiply = bnpDMultiply;
BigInteger.prototype.dAddOffset = bnpDAddOffset;
BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
BigInteger.prototype.modInt = bnpModInt;
BigInteger.prototype.millerRabin = bnpMillerRabin;

//public
BigInteger.prototype.clone = bnClone;
BigInteger.prototype.intValue = bnIntValue;
BigInteger.prototype.byteValue = bnByteValue;
BigInteger.prototype.shortValue = bnShortValue;
BigInteger.prototype.signum = bnSigNum;
BigInteger.prototype.toByteArray = bnToByteArray;
BigInteger.prototype.equals = bnEquals;
BigInteger.prototype.min = bnMin;
BigInteger.prototype.max = bnMax;
BigInteger.prototype.and = bnAnd;
BigInteger.prototype.or = bnOr;
BigInteger.prototype.xor = bnXor;
BigInteger.prototype.andNot = bnAndNot;
BigInteger.prototype.not = bnNot;
BigInteger.prototype.shiftLeft = bnShiftLeft;
BigInteger.prototype.shiftRight = bnShiftRight;
BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
BigInteger.prototype.bitCount = bnBitCount;
BigInteger.prototype.testBit = bnTestBit;
BigInteger.prototype.setBit = bnSetBit;
BigInteger.prototype.clearBit = bnClearBit;
BigInteger.prototype.flipBit = bnFlipBit;
BigInteger.prototype.add = bnAdd;
BigInteger.prototype.subtract = bnSubtract;
BigInteger.prototype.multiply = bnMultiply;
BigInteger.prototype.divide = bnDivide;
BigInteger.prototype.remainder = bnRemainder;
BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
BigInteger.prototype.modPow = bnModPow;
BigInteger.prototype.modInverse = bnModInverse;
BigInteger.prototype.pow = bnPow;
BigInteger.prototype.gcd = bnGCD;
BigInteger.prototype.isProbablePrime = bnIsProbablePrime;

//BigInteger interfaces not implemented in jsbn:

//BigInteger(int signum, byte[] magnitude)
//double doubleValue()
//float floatValue()
//int hashCode()
//long longValue()
//static BigInteger valueOf(long val)

forge.jsbn = forge.jsbn || {};
forge.jsbn.BigInteger = BigInteger;

/**
 * util.setImmediate
 */

/* Utilities API */
var util = forge.util = forge.util || {};

// define setImmediate and nextTick
if(typeof process === 'undefined' || !process.nextTick) {
  if(typeof setImmediate === 'function') {
    util.setImmediate = setImmediate;
    util.nextTick = function(callback) {
      return setImmediate(callback);
    };
  }
  else {
    util.setImmediate = function(callback) {
      setTimeout(callback, 0);
    };
    util.nextTick = util.setImmediate;
  }
}
else {
  util.nextTick = process.nextTick;
  if(typeof setImmediate === 'function') {
    util.setImmediate = setImmediate;
  }
  else {
    util.setImmediate = util.nextTick;
  }
}

// _modPow

var _modPow = function(x, key, pub) {
  var y;

  if(pub) {
    y = x.modPow(key.e, key.n);
  }
  else {
    // pre-compute dP, dQ, and qInv if necessary
    if(!key.dP) {
      key.dP = key.d.mod(key.p.subtract(BigInteger.ONE));
    }
    if(!key.dQ) {
      key.dQ = key.d.mod(key.q.subtract(BigInteger.ONE));
    }
    if(!key.qInv) {
      key.qInv = key.q.modInverse(key.p);
    }

    /* Chinese remainder theorem (CRT) states:

      Suppose n1, n2, ..., nk are positive integers which are pairwise
      coprime (n1 and n2 have no common factors other than 1). For any
      integers x1, x2, ..., xk there exists an integer x solving the
      system of simultaneous congruences (where ~= means modularly
      congruent so a ~= b mod n means a mod n = b mod n):

      x ~= x1 mod n1
      x ~= x2 mod n2
      ...
      x ~= xk mod nk

      This system of congruences has a single simultaneous solution x
      between 0 and n - 1. Furthermore, each xk solution and x itself
      is congruent modulo the product n = n1*n2*...*nk.
      So x1 mod n = x2 mod n = xk mod n = x mod n.

      The single simultaneous solution x can be solved with the following
      equation:

      x = sum(xi*ri*si) mod n where ri = n/ni and si = ri^-1 mod ni.

      Where x is less than n, xi = x mod ni.

      For RSA we are only concerned with k = 2. The modulus n = pq, where
      p and q are coprime. The RSA decryption algorithm is:

      y = x^d mod n

      Given the above:

      x1 = x^d mod p
      r1 = n/p = q
      s1 = q^-1 mod p
      x2 = x^d mod q
      r2 = n/q = p
      s2 = p^-1 mod q

      So y = (x1r1s1 + x2r2s2) mod n
           = ((x^d mod p)q(q^-1 mod p) + (x^d mod q)p(p^-1 mod q)) mod n

      According to Fermat's Little Theorem, if the modulus P is prime,
      for any integer A not evenly divisible by P, A^(P-1) ~= 1 mod P.
      Since A is not divisible by P it follows that if:
      N ~= M mod (P - 1), then A^N mod P = A^M mod P. Therefore:

      A^N mod P = A^(M mod (P - 1)) mod P. (The latter takes less effort
      to calculate). In order to calculate x^d mod p more quickly the
      exponent d mod (p - 1) is stored in the RSA private key (the same
      is done for x^d mod q). These values are referred to as dP and dQ
      respectively. Therefore we now have:

      y = ((x^dP mod p)q(q^-1 mod p) + (x^dQ mod q)p(p^-1 mod q)) mod n

      Since we'll be reducing x^dP by modulo p (same for q) we can also
      reduce x by p (and q respectively) before hand. Therefore, let

      xp = ((x mod p)^dP mod p), and
      xq = ((x mod q)^dQ mod q), yielding:

      y = (xp*q*(q^-1 mod p) + xq*p*(p^-1 mod q)) mod n

      This can be further reduced to a simple algorithm that only
      requires 1 inverse (the q inverse is used) to be used and stored.
      The algorithm is called Garner's algorithm. If qInv is the
      inverse of q, we simply calculate:

      y = (qInv*(xp - xq) mod p) * q + xq

      However, there are two further complications. First, we need to
      ensure that xp > xq to prevent signed BigIntegers from being used
      so we add p until this is true (since we will be mod'ing with
      p anyway). Then, there is a known timing attack on algorithms
      using the CRT. To mitigate this risk, "cryptographic blinding"
      should be used (*Not yet implemented*). This requires simply
      generating a random number r between 0 and n-1 and its inverse
      and multiplying x by r^e before calculating y and then multiplying
      y by r^-1 afterwards.
    */

    // TODO: do cryptographic blinding

    // calculate xp and xq
    var xp = x.mod(key.p).modPow(key.dP, key.p);
    var xq = x.mod(key.q).modPow(key.dQ, key.q);

    // xp must be larger than xq to avoid signed bit usage
    while(xp.compareTo(xq) < 0) {
      xp = xp.add(key.p);
    }

    // do last step
    y = xp.subtract(xq)
      .multiply(key.qInv).mod(key.p)
      .multiply(key.q).add(xq);
  }

  return y;
};

/**
 * util.encodeUtf8
 */

util.encodeUtf8 = function(str) {
  return unescape(encodeURIComponent(str));
};

/**
 * util.decodeUtf8
 */

util.decodeUtf8 = function(str) {
  return decodeURIComponent(escape(str));
};


/**
 * Creates a buffer that stores bytes. A value may be given to put into the
 * buffer that is either a string of bytes or a UTF-16 string that will
 * be encoded using UTF-8 (to do the latter, specify 'utf8' as the encoding).
 *
 * @param [input] the bytes to wrap (as a string) or a UTF-16 string to encode
 *          as UTF-8.
 * @param [encoding] (default: 'raw', other: 'utf8').
 */
util.createBuffer = function(input, encoding) {
  encoding = encoding || 'raw';
  if(input !== undefined && encoding === 'utf8') {
    input = util.encodeUtf8(input);
  }
  return new util.ByteBuffer(input);
};

/**
 * util.hexToBytes
 */

util.hexToBytes = function(hex) {
  var rval = '';
  var i = 0;
  if(hex.length & 1 == 1) {
    // odd number of characters, convert first character alone
    i = 1;
    rval += String.fromCharCode(parseInt(hex[0], 16));
  }
  // convert 2 characters (1 byte) at a time
  for(; i < hex.length; i += 2) {
    rval += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return rval;
};

/**
 * pki.rsa.decrypt
 */

pki.rsa.decrypt = function(ed, key, pub, ml) {
  // get the length of the modulus in bytes
  var k = Math.ceil(key.n.bitLength() / 8);

  // error if the length of the encrypted data ED is not k
  if(ed.length != k) {
    throw {
      message: 'Encrypted message length is invalid.',
      length: ed.length,
      expected: k
    };
  }

  // convert encrypted data into a big integer
  // FIXME: hex conversion inefficient, get BigInteger w/byte strings
  var y = new BigInteger(forge.util.createBuffer(ed).toHex(), 16);

  // do RSA decryption
  var x = _modPow(y, key, pub);

  // create the encryption block, if x is shorter in bytes than k, then
  // prepend zero bytes to fill up eb
  // FIXME: hex conversion inefficient, get BigInteger w/byte strings
  var xhex = x.toString(16);
  var eb = forge.util.createBuffer();
  var zeros = k - Math.ceil(xhex.length / 2);
  while(zeros > 0) {
    eb.putByte(0x00);
    --zeros;
  }
  eb.putBytes(forge.util.hexToBytes(xhex));

  if(ml !== false) {
    /* It is an error if any of the following conditions occurs:

      1. The encryption block EB cannot be parsed unambiguously.
      2. The padding string PS consists of fewer than eight octets
        or is inconsisent with the block type BT.
      3. The decryption process is a public-key operation and the block
        type BT is not 00 or 01, or the decryption process is a
        private-key operation and the block type is not 02.
     */

    // parse the encryption block
    var first = eb.getByte();
    var bt = eb.getByte();
    if(first !== 0x00 ||
      (pub && bt !== 0x00 && bt !== 0x01) ||
      (!pub && bt != 0x02) ||
      (pub && bt === 0x00 && typeof(ml) === 'undefined')) {
      throw {
        message: 'Encryption block is invalid.'
      };
    }

    var padNum = 0;
    if(bt === 0x00) {
      // check all padding bytes for 0x00
      padNum = k - 3 - ml;
      for(var i = 0; i < padNum; ++i) {
        if(eb.getByte() !== 0x00) {
          throw {
            message: 'Encryption block is invalid.'
          };
        }
      }
    }
    else if(bt === 0x01) {
      // find the first byte that isn't 0xFF, should be after all padding
      padNum = 0;
      while(eb.length() > 1) {
        if(eb.getByte() !== 0xFF) {
          --eb.read;
          break;
        }
        ++padNum;
      }
    }
    else if(bt === 0x02) {
      // look for 0x00 byte
      padNum = 0;
      while(eb.length() > 1) {
        if(eb.getByte() === 0x00) {
          --eb.read;
          break;
        }
        ++padNum;
      }
    }

    // zero must be 0x00 and padNum must be (k - 3 - message length)
    var zero = eb.getByte();
    if(zero !== 0x00 || padNum !== (k - 3 - eb.length())) {
      throw {
        message: 'Encryption block is invalid.'
      };
    }
  }

  // return message
  return eb.getBytes();
};

/**
 * pki.rsa.encrypt
 */

pki.rsa.encrypt = function(m, key, bt) {
  var pub = bt;
  var eb = forge.util.createBuffer();

  // get the length of the modulus in bytes
  var k = Math.ceil(key.n.bitLength() / 8);

  if(bt !== false && bt !== true) {
    /* use PKCS#1 v1.5 padding */
    if(m.length > (k - 11)) {
      throw {
        message: 'Message is too long to encrypt.',
        length: m.length,
        max: (k - 11)
      };
    }

    /* A block type BT, a padding string PS, and the data D shall be
      formatted into an octet string EB, the encryption block:

      EB = 00 || BT || PS || 00 || D

      The block type BT shall be a single octet indicating the structure of
      the encryption block. For this version of the document it shall have
      value 00, 01, or 02. For a private-key operation, the block type
      shall be 00 or 01. For a public-key operation, it shall be 02.

      The padding string PS shall consist of k-3-||D|| octets. For block
      type 00, the octets shall have value 00; for block type 01, they
      shall have value FF; and for block type 02, they shall be
      pseudorandomly generated and nonzero. This makes the length of the
      encryption block EB equal to k. */

    // build the encryption block
    eb.putByte(0x00);
    eb.putByte(bt);

    // create the padding, get key type
    var padNum = k - 3 - m.length;
    var padByte;
    if(bt === 0x00 || bt === 0x01) {
      pub = false;
      padByte = (bt === 0x00) ? 0x00 : 0xFF;
      for(var i = 0; i < padNum; ++i) {
        eb.putByte(padByte);
      }
    }
    else {
      pub = true;
      for(var i = 0; i < padNum; ++i) {
        padByte = Math.floor(Math.random() * 255) + 1;
        eb.putByte(padByte);
      }
    }

    // zero followed by message
    eb.putByte(0x00);
  }

  eb.putBytes(m);

  // load encryption block as big integer 'x'
  // FIXME: hex conversion inefficient, get BigInteger w/byte strings
  var x = new BigInteger(eb.toHex(), 16);

  // do RSA encryption
  var y = _modPow(x, key, pub);

  // convert y into the encrypted data byte string, if y is shorter in
  // bytes than k, then prepend zero bytes to fill up ed
  // FIXME: hex conversion inefficient, get BigInteger w/byte strings
  var yhex = y.toString(16);
  var ed = forge.util.createBuffer();
  var zeros = k - Math.ceil(yhex.length / 2);
  while(zeros > 0) {
    ed.putByte(0x00);
    --zeros;
  }
  ed.putBytes(forge.util.hexToBytes(yhex));
  return ed.getBytes();
};

/**
 * pki.rsa.setPrivateKey
 */

pki.rsa.setPrivateKey = function(n, e, d, p, q, dP, dQ, qInv) {
  var key = {
    n: n,
    e: e,
    d: d,
    p: p,
    q: q,
    dP: dP,
    dQ: dQ,
    qInv: qInv
  };

  /**
   * Decrypts the given data with this private key.
   *
   * @param data the byte string to decrypt.
   *
   * @return the decrypted byte string.
   */
  key.decrypt = function(data) {
    return pki.rsa.decrypt(data, key, false);
  };

  /**
   * Signs the given digest, producing a signature.
   *
   * PKCS#1 supports multiple (currently two) signature schemes:
   * RSASSA-PKCS1-v1_5 and RSASSA-PSS.
   *
   * By default this implementation uses the "old scheme", i.e.
   * RSASSA-PKCS1-v1_5.  In order to generate a PSS signature, provide
   * an instance of Forge PSS object as scheme parameter.
   *
   * @param md the message digest object with the hash to sign.
   * @param scheme signature scheme to use, undefined for PKCS#1 v1.5
   *   padding style.
   * @return the signature as a byte string.
   */
  key.sign = function(md, scheme) {
    var bt = false;  /* private key operation */

    if(scheme === undefined) {
      scheme = { encode: emsaPkcs1v15encode };
      bt = 0x01;
    }

    var d = scheme.encode(md, key.n.bitLength());
    return pki.rsa.encrypt(d, key, bt);
  };

  return key;
};

/**
 * _getValueLength
 */

var _getValueLength = function(b) {
  var b2 = b.getByte();
  if(b2 == 0x80) {
    return undefined;
  }

  // see if the length is "short form" or "long form" (bit 8 set)
  var length;
  var longForm = b2 & 0x80;
  if(!longForm) {
    // length is just the first byte
    length = b2;
  }
  else {
    // the number of bytes the length is specified in bits 7 through 1
    // and each length byte is in big-endian base-256
    length = b.getInt((b2 & 0x7F) << 3);
  }
  return length;
};

/**
 * asn1
 */

/**
 * asn1.Type
 */

var asn1 = forge.asn1 = forge.asn1 || {};
asn1.Type = {
  NONE:             0,
  BOOLEAN:          1,
  INTEGER:          2,
  BITSTRING:        3,
  OCTETSTRING:      4,
  NULL:             5,
  OID:              6,
  ODESC:            7,
  EXTERNAL:         8,
  REAL:             9,
  ENUMERATED:      10,
  EMBEDDED:        11,
  UTF8:            12,
  ROID:            13,
  SEQUENCE:        16,
  SET:             17,
  PRINTABLESTRING: 19,
  IA5STRING:       22,
  UTCTIME:         23,
  GENERALIZEDTIME: 24,
  BMPSTRING:       30
};

/**
 * asn1.Class
 */

asn1.Class = {
  UNIVERSAL:        0x00,
  APPLICATION:      0x40,
  CONTEXT_SPECIFIC: 0x80,
  PRIVATE:          0xC0
};

/**
 * asn1.create
 */

asn1.create = function(tagClass, type, constructed, value) {
  /* An asn1 object has a tagClass, a type, a constructed flag, and a
    value. The value's type depends on the constructed flag. If
    constructed, it will contain a list of other asn1 objects. If not,
    it will contain the ASN.1 value as an array of bytes formatted
    according to the ASN.1 data type. */

  // remove undefined values
  if(value.constructor == Array) {
    var tmp = [];
    for(var i = 0; i < value.length; ++i) {
      if(value[i] !== undefined) {
        tmp.push(value[i]);
      }
    }
    value = tmp;
  }

  return {
    tagClass: tagClass,
    type: type,
    constructed: constructed,
    composed: constructed || (value.constructor == Array),
    value: value
  };
};

/**
 * asn1.fromDer
 */

asn1.fromDer = function(bytes) {
  // wrap in buffer if needed
  if(bytes.constructor == String) {
    bytes = forge.util.createBuffer(bytes);
  }

  // minimum length for ASN.1 DER structure is 2
  if(bytes.length() < 2)    {
    throw {
      message: 'Too few bytes to parse DER.',
      bytes: bytes.length()
    };
  }

  // get the first byte
  var b1 = bytes.getByte();

  // get the tag class
  var tagClass = (b1 & 0xC0);

  // get the type (bits 1-5)
  var type = b1 & 0x1F;

  // get the value length
  var length = _getValueLength(bytes);

  // ensure there are enough bytes to get the value
  if(bytes.length() < length) {
    throw {
      message: 'Too few bytes to read ASN.1 value.',
      detail: bytes.length() + ' < ' + length
    };
  }

  // prepare to get value
  var value;

  // constructed flag is bit 6 (32 = 0x20) of the first byte
  var constructed = ((b1 & 0x20) == 0x20);

  // determine if the value is composed of other ASN.1 objects (if its
  // constructed it will be and if its a BITSTRING it may be)
  var composed = constructed;
  if(!composed && tagClass === asn1.Class.UNIVERSAL &&
    type === asn1.Type.BITSTRING && length > 1) {
    /* The first octet gives the number of bits by which the length of the
      bit string is less than the next multiple of eight (this is called
      the "number of unused bits").

      The second and following octets give the value of the bit string
      converted to an octet string. */
    // if there are no unused bits, maybe the bitstring holds ASN.1 objs
    var read = bytes.read;
    var unused = bytes.getByte();
    if(unused === 0) {
      // if the first byte indicates UNIVERSAL or CONTEXT_SPECIFIC,
      // and the length is valid, assume we've got an ASN.1 object
      b1 = bytes.getByte();
      var tc = (b1 & 0xC0);
      if(tc === asn1.Class.UNIVERSAL ||
        tc === asn1.Class.CONTEXT_SPECIFIC) {
        try {
          var len = _getValueLength(bytes);
          composed = (len === length - (bytes.read - read));
          if(composed) {
            // adjust read/length to account for unused bits byte
            ++read;
            --length;
          }
        }
        catch(ex) {}
      }
    }
    // restore read pointer
    bytes.read = read;
  }

  if(composed) {
    // parse child asn1 objects from the value
    value = [];
    if(length === undefined) {
      // asn1 object of indefinite length, read until end tag
      for(;;) {
        if(bytes.bytes(2) === String.fromCharCode(0, 0)) {
          bytes.getBytes(2);
          break;
        }
        value.push(asn1.fromDer(bytes));
      }
    }
    else {
      // parsing asn1 object of definite length
      var start = bytes.length();
      while(length > 0) {
        value.push(asn1.fromDer(bytes));
        length -= start - bytes.length();
        start = bytes.length();
      }
    }
  }
  // asn1 not composed, get raw value
  else {
    // TODO: do DER to OID conversion and vice-versa in .toDer?

    if(length === undefined) {
      throw {
        message: 'Non-constructed ASN.1 object of indefinite length.'
      };
    }

    if(type === asn1.Type.BMPSTRING) {
      value = '';
      for(var i = 0; i < length; i += 2) {
        value += String.fromCharCode(bytes.getInt16());
      }
    }
    else {
      value = bytes.getBytes(length);
    }
  }

  // create and return asn1 object
  return asn1.create(tagClass, type, constructed, value);
};

/**
 * asn1.toDer
 */

asn1.toDer = function(obj) {
  var bytes = forge.util.createBuffer();

  // build the first byte
  var b1 = obj.tagClass | obj.type;

  // for storing the ASN.1 value
  var value = forge.util.createBuffer();

  // if composed, use each child asn1 object's DER bytes as value
  if(obj.composed) {
    // turn on 6th bit (0x20 = 32) to indicate asn1 is constructed
    // from other asn1 objects
    if(obj.constructed) {
      b1 |= 0x20;
    }
    // if type is a bit string, add unused bits of 0x00
    else {
      value.putByte(0x00);
    }

    // add all of the child DER bytes together
    for(var i = 0; i < obj.value.length; ++i) {
      if(obj.value[i] !== undefined) {
        value.putBuffer(asn1.toDer(obj.value[i]));
      }
    }
  }
  // use asn1.value directly
  else {
    if(obj.type === asn1.Type.BMPSTRING) {
      for(var i = 0; i < obj.value.length; ++i) {
        value.putInt16(obj.value.charCodeAt(i));
      }
    }
    else {
      value.putBytes(obj.value);
    }
  }

  // add tag byte
  bytes.putByte(b1);

  // use "short form" encoding
  if(value.length() <= 127) {
    // one byte describes the length
    // bit 8 = 0 and bits 7-1 = length
    bytes.putByte(value.length() & 0x7F);
  }
  // use "long form" encoding
  else {
    // 2 to 127 bytes describe the length
    // first byte: bit 8 = 1 and bits 7-1 = # of additional bytes
    // other bytes: length in base 256, big-endian
    var len = value.length();
    var lenBytes = '';
    do {
      lenBytes += String.fromCharCode(len & 0xFF);
      len = len >>> 8;
    }
    while(len > 0);

    // set first byte to # bytes used to store the length and turn on
    // bit 8 to indicate long-form length is used
    bytes.putByte(lenBytes.length | 0x80);

    // concatenate length bytes in reverse since they were generated
    // little endian and we need big endian
    for(var i = lenBytes.length - 1; i >= 0; --i) {
      bytes.putByte(lenBytes.charCodeAt(i));
    }
  }

  // concatenate value bytes
  bytes.putBuffer(value);
  return bytes;
};

/**
 * pki.rsa.setPublicKey
 */

pki.rsa.setPublicKey = function(n, e) {
  var key = {
    n: n,
    e: e
  };

  /**
   * Encrypts the given data with this public key.
   *
   * @param data the byte string to encrypt.
   *
   * @return the encrypted byte string.
   */
  key.encrypt = function(data) {
    return pki.rsa.encrypt(data, key, 0x02);
  };

  /**
   * Verifies the given signature against the given digest.
   *
   * PKCS#1 supports multiple (currently two) signature schemes:
   * RSASSA-PKCS1-v1_5 and RSASSA-PSS.
   *
   * By default this implementation uses the "old scheme", i.e.
   * RSASSA-PKCS1-v1_5, in which case once RSA-decrypted, the
   * signature is an OCTET STRING that holds a DigestInfo.
   *
   * DigestInfo ::= SEQUENCE {
   *   digestAlgorithm DigestAlgorithmIdentifier,
   *   digest Digest
   * }
   * DigestAlgorithmIdentifier ::= AlgorithmIdentifier
   * Digest ::= OCTET STRING
   *
   * To perform PSS signature verification, provide an instance
   * of Forge PSS object as scheme parameter.
   *
   * @param digest the message digest hash to compare against the signature.
   * @param signature the signature to verify.
   * @param scheme signature scheme to use, undefined for PKCS#1 v1.5
   *   padding style.
   * @return true if the signature was verified, false if not.
   */
   key.verify = function(digest, signature, scheme) {
     // do rsa decryption
     var ml = scheme === undefined ? undefined : false;
     var d = pki.rsa.decrypt(signature, key, true, ml);

     if(scheme === undefined) {
       // d is ASN.1 BER-encoded DigestInfo
       var obj = asn1.fromDer(d);

       // compare the given digest to the decrypted one
       return digest === obj.value[1].value;
     }
     else {
       return scheme.verify(digest, d, key.n.bitLength());
     }
  };

  return key;
};

/**
 * pki.rsa.stepKeyPairGenerationState
 */

var GCD_30_DELTA = [6, 4, 2, 4, 2, 4, 6, 2];

pki.rsa.stepKeyPairGenerationState = function(state, n) {
  // do key generation (based on Tom Wu's rsa.js, see jsbn.js license)
  // with some minor optimizations and designed to run in steps

  // local state vars
  var THIRTY = new BigInteger(null);
  THIRTY.fromInt(30);
  var deltaIdx = 0;
  var op_or = function(x,y) { return x|y; };

  // keep stepping until time limit is reached or done
  var t1 = +new Date();
  var t2;
  var total = 0;
  while(state.keys === null && (n <= 0 || total < n)) {
    // generate p or q
    if(state.state === 0) {
      /* Note: All primes are of the form:

        30k+i, for i < 30 and gcd(30, i)=1, where there are 8 values for i

        When we generate a random number, we always align it at 30k + 1. Each
        time the number is determined not to be prime we add to get to the
        next 'i', eg: if the number was at 30k + 1 we add 6. */
      var bits = (state.p === null) ? state.pBits : state.qBits;
      var bits1 = bits - 1;

      // get a random number
      if(state.pqState === 0) {
        state.num = new BigInteger(bits, state.rng);
        // force MSB set
        if(!state.num.testBit(bits1)) {
          state.num.bitwiseTo(
            BigInteger.ONE.shiftLeft(bits1), op_or, state.num);
        }
        // align number on 30k+1 boundary
        state.num.dAddOffset(31 - state.num.mod(THIRTY).byteValue(), 0);
        deltaIdx = 0;

        ++state.pqState;
      }
      // try to make the number a prime
      else if(state.pqState === 1) {
        // overflow, try again
        if(state.num.bitLength() > bits) {
          state.pqState = 0;
        }
        // do primality test
        else if(state.num.isProbablePrime(1)) {
          ++state.pqState;
        }
        else {
          // get next potential prime
          state.num.dAddOffset(GCD_30_DELTA[deltaIdx++ % 8], 0);
        }
      }
      // ensure number is coprime with e
      else if(state.pqState === 2) {
        state.pqState =
          (state.num.subtract(BigInteger.ONE).gcd(state.e)
          .compareTo(BigInteger.ONE) === 0) ? 3 : 0;
      }
      // ensure number is a probable prime
      else if(state.pqState === 3) {
        state.pqState = 0;
        if(state.num.isProbablePrime(10)) {
          if(state.p === null) {
            state.p = state.num;
          }
          else {
            state.q = state.num;
          }

          // advance state if both p and q are ready
          if(state.p !== null && state.q !== null) {
            ++state.state;
          }
        }
        state.num = null;
      }
    }
    // ensure p is larger than q (swap them if not)
    else if(state.state === 1) {
      if(state.p.compareTo(state.q) < 0) {
        state.num = state.p;
        state.p = state.q;
        state.q = state.num;
      }
      ++state.state;
    }
    // compute phi: (p - 1)(q - 1) (Euler's totient function)
    else if(state.state === 2) {
      state.p1 = state.p.subtract(BigInteger.ONE);
      state.q1 = state.q.subtract(BigInteger.ONE);
      state.phi = state.p1.multiply(state.q1);
      ++state.state;
    }
    // ensure e and phi are coprime
    else if(state.state === 3) {
      if(state.phi.gcd(state.e).compareTo(BigInteger.ONE) === 0) {
        // phi and e are coprime, advance
        ++state.state;
      }
      else {
        // phi and e aren't coprime, so generate a new p and q
        state.p = null;
        state.q = null;
        state.state = 0;
      }
    }
    // create n, ensure n is has the right number of bits
    else if(state.state === 4) {
      state.n = state.p.multiply(state.q);

      // ensure n is right number of bits
      if(state.n.bitLength() === state.bits) {
        // success, advance
        ++state.state;
      }
      else {
        // failed, get new q
        state.q = null;
        state.state = 0;
      }
    }
    // set keys
    else if(state.state === 5) {
      var d = state.e.modInverse(state.phi);
      state.keys = {
        privateKey: forge.pki.rsa.setPrivateKey(
          state.n, state.e, d, state.p, state.q,
          d.mod(state.p1), d.mod(state.q1),
          state.q.modInverse(state.p)),
        publicKey: forge.pki.rsa.setPublicKey(state.n, state.e)
      };
    }

    // update timing
    t2 = +new Date();
    total += t2 - t1;
    t1 = t2;
  }

  return state.keys !== null;
};

/**
 * _generateKeyPair
 */

function _generateKeyPair(state, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  // web workers unavailable, use setImmediate
  if(false || typeof(Worker) === 'undefined') {
    function step() {
      // 10 ms gives 5ms of leeway for other calculations before dropping
      // below 60fps (1000/60 == 16.67), but in reality, the number will
      // likely be higher due to an 'atomic' big int modPow
      if(forge.pki.rsa.stepKeyPairGenerationState(state, 10)) {
        return callback(null, state.keys);
      }
      forge.util.setImmediate(step);
    }
    return step();
  }

  // use web workers to generate keys
  var numWorkers = options.workers || 2;
  var workLoad = options.workLoad || 100;
  var range = workLoad * 30/8;
  var workerScript = options.workerScript || 'forge/prime.worker.js';
  var THIRTY = new BigInteger(null);
  THIRTY.fromInt(30);
  var op_or = function(x,y) { return x|y; };
  generate();

  function generate() {
    // find p and then q (done in series to simplify setting worker number)
    getPrime(state.pBits, function(err, num) {
      if(err) {
        return callback(err);
      }
      state.p = num;
      getPrime(state.qBits, finish);
    });
  }

  // implement prime number generation using web workers
  function getPrime(bits, callback) {
    // TODO: consider optimizing by starting workers outside getPrime() ...
    // note that in order to clean up they will have to be made internally
    // asynchronous which may actually be slower

    // start workers immediately
    var workers = [];
    for(var i = 0; i < numWorkers; ++i) {
      // FIXME: fix path or use blob URLs
      workers[i] = new Worker(workerScript);
    }
    var running = numWorkers;

    // initialize random number
    var num = generateRandom();

    // listen for requests from workers and assign ranges to find prime
    for(var i = 0; i < numWorkers; ++i) {
      workers[i].addEventListener('message', workerMessage);
    }

    /* Note: The distribution of random numbers is unknown. Therefore, each
    web worker is continuously allocated a range of numbers to check for a
    random number until one is found.

    Every 30 numbers will be checked just 8 times, because prime numbers
    have the form:

    30k+i, for i < 30 and gcd(30, i)=1 (there are 8 values of i for this)

    Therefore, if we want a web worker to run N checks before asking for
    a new range of numbers, each range must contain N*30/8 numbers.

    For 100 checks (workLoad), this is a range of 375. */

    function generateRandom() {
      var bits1 = bits - 1;
      var num = new BigInteger(bits, state.rng);
      // force MSB set
      if(!num.testBit(bits1)) {
        num.bitwiseTo(BigInteger.ONE.shiftLeft(bits1), op_or, num);
      }
      // align number on 30k+1 boundary
      num.dAddOffset(31 - num.mod(THIRTY).byteValue(), 0);
      return num;
    }

    var found = false;
    function workerMessage(e) {
      // ignore message, prime already found
      if(found) {
        return;
      }

      --running;
      var data = e.data;
      if(data.found) {
        // terminate all workers
        for(var i = 0; i < workers.length; ++i) {
          workers[i].terminate();
        }
        found = true;
        return callback(null, new BigInteger(data.prime, 16));
      }

      // overflow, regenerate prime
      if(num.bitLength() > bits) {
        num = generateRandom();
      }

      // assign new range to check
      var hex = num.toString(16);

      // start prime search
      e.target.postMessage({
        e: state.eInt,
        hex: hex,
        workLoad: workLoad
      });

      num.dAddOffset(range, 0);
    }
  }

  function finish(err, num) {
    // set q
    state.q = num;

    // ensure p is larger than q (swap them if not)
    if(state.p.compareTo(state.q) < 0) {
      var tmp = state.p;
      state.p = state.q;
      state.q = tmp;
    }

    // compute phi: (p - 1)(q - 1) (Euler's totient function)
    state.p1 = state.p.subtract(BigInteger.ONE);
    state.q1 = state.q.subtract(BigInteger.ONE);
    state.phi = state.p1.multiply(state.q1);

    // ensure e and phi are coprime
    if(state.phi.gcd(state.e).compareTo(BigInteger.ONE) !== 0) {
      // phi and e aren't coprime, so generate a new p and q
      state.p = state.q = null;
      generate();
      return;
    }

    // create n, ensure n is has the right number of bits
    state.n = state.p.multiply(state.q);
    if(state.n.bitLength() !== state.bits) {
      // failed, get new q
      state.q = null;
      getPrime(state.qBits, finish);
      return;
    }

    // set keys
    var d = state.e.modInverse(state.phi);
    state.keys = {
      privateKey: forge.pki.rsa.setPrivateKey(
        state.n, state.e, d, state.p, state.q,
        d.mod(state.p1), d.mod(state.q1),
        state.q.modInverse(state.p)),
      publicKey: forge.pki.rsa.setPublicKey(state.n, state.e)
    };

    callback(null, state.keys);
  }
}

/**
 * pki.rsa.generateKeyPair
 */

pki.rsa.generateKeyPair = function(bits, e, options, callback) {
  // (bits), (options), (callback)
  if(arguments.length === 1) {
    if(typeof bits === 'object') {
      options = bits;
      bits = undefined;
    }
    else if(typeof bits === 'function') {
      callback = bits;
      bits = undefined;
    }
  }
  // (bits, options), (bits, callback), (options, callback)
  else if(arguments.length === 2) {
    if(typeof bits === 'number') {
      if(typeof e === 'function') {
        callback = e;
      }
      else {
        options = e;
      }
    }
    else {
      options = bits;
      callback = e;
      bits = undefined;
    }
    e = undefined;
  }
  // (bits, e, options), (bits, e, callback), (bits, options, callback)
  else if(arguments.length === 3) {
    if(typeof e === 'number') {
      if(typeof options === 'function') {
        callback = options;
        options = undefined;
      }
    }
    else {
      callback = options;
      options = e;
      e = undefined;
    }
  }
  options = options || {};
  if(bits === undefined) {
    bits = options.bits || 1024;
  }
  if(e === undefined) {
    e = options.e || 0x10001;
  }
  var state = pki.rsa.createKeyPairGenerationState(bits, e);
  if(!callback) {
    pki.rsa.stepKeyPairGenerationState(state, 0);
    return state.keys;
  }
  _generateKeyPair(state, options, callback);
};

/**
 * _bnToBytes
 */

var _bnToBytes = function(b) {
  // prepend 0x00 if first byte >= 0x80
  var hex = b.toString(16);
  if(hex[0] >= '8') {
    hex = '00' + hex;
  }
  return forge.util.hexToBytes(hex);
};

/**
 * pki.publicKeyToRSAPublicKey
 */

pki.publicKeyToRSAPublicKey = function(key) {
  // RSAPublicKey
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    // modulus (n)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.n)),
    // publicExponent (e)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.e))
  ]);
};

/**
 * util.encode64
 */

var _base64 =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

util.encode64 = function(input, maxline) {
  var line = '';
  var output = '';
  var chr1, chr2, chr3;
  var i = 0;
  while(i < input.length) {
    chr1 = input.charCodeAt(i++);
    chr2 = input.charCodeAt(i++);
    chr3 = input.charCodeAt(i++);

    // encode 4 character group
    line += _base64.charAt(chr1 >> 2);
    line += _base64.charAt(((chr1 & 3) << 4) | (chr2 >> 4));
    if(isNaN(chr2)) {
      line += '==';
    }
    else {
      line += _base64.charAt(((chr2 & 15) << 2) | (chr3 >> 6));
      line += isNaN(chr3) ? '=' : _base64.charAt(chr3 & 63);
    }

    if(maxline && line.length > maxline) {
      output += line.substr(0, maxline) + '\r\n';
      line = line.substr(maxline);
    }
  }
  output += line;

  return output;
};

/**
 * pki.publicKeyToRSAPublicKeyPem
 */

pki.publicKeyToRSAPublicKeyPem = function(key, maxline) {
  // convert to ASN.1, then DER, then base64-encode
  var out = asn1.toDer(pki.publicKeyToRSAPublicKey(key));
  out = forge.util.encode64(out.getBytes(), maxline || 64);
  return (
    '-----BEGIN RSA PUBLIC KEY-----\r\n' +
    out +
    '\r\n-----END RSA PUBLIC KEY-----');
};

/**
 * pki.privateKeyToAsn1
 */

pki.privateKeyToAsn1 = pki.privateKeyToRSAPrivateKey = function(key) {
  // RSAPrivateKey
  return asn1.create(asn1.Class.UNIVERSAL, asn1.Type.SEQUENCE, true, [
    // version (0 = only 2 primes, 1 multiple primes)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      String.fromCharCode(0x00)),
    // modulus (n)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.n)),
    // publicExponent (e)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.e)),
    // privateExponent (d)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.d)),
    // privateKeyPrime1 (p)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.p)),
    // privateKeyPrime2 (q)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.q)),
    // privateKeyExponent1 (dP)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.dP)),
    // privateKeyExponent2 (dQ)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.dQ)),
    // coefficient (qInv)
    asn1.create(asn1.Class.UNIVERSAL, asn1.Type.INTEGER, false,
      _bnToBytes(key.qInv))
  ]);
};

/**
 * pki.privateKeyToPem
 */

pki.privateKeyToPem = function(key, maxline) {
  // convert to ASN.1, then DER, then base64-encode
  var out = asn1.toDer(pki.privateKeyToAsn1(key));
  out = forge.util.encode64(out.getBytes(), maxline || 64);
  return (
    '-----BEGIN RSA PRIVATE KEY-----\r\n' +
    out +
    '\r\n-----END RSA PRIVATE KEY-----');
};

}).call(this,require('_process'))

},{"_process":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy5udm0vdmVyc2lvbnMvbm9kZS92Ni4yLjIvbGliL25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuLi8uLi8uLi8uLi8ubnZtL3ZlcnNpb25zL25vZGUvdjYuMi4yL2xpYi9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwibm9kZV9tb2R1bGVzL25vZGVfbW9kdWxlcy9rZXlwYWlyL2luZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDaEtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuKGZ1bmN0aW9uICgpIHtcbiAgICB0cnkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaXMgbm90IGRlZmluZWQnKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2NsZWFyVGltZW91dCBpcyBub3QgZGVmaW5lZCcpO1xuICAgICAgICB9XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0IHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKG51bGwsIGZ1biwgMCk7XG4gICAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvclxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbCh0aGlzLCBmdW4sIDApO1xuICAgICAgICB9XG4gICAgfVxuXG5cbn1cbmZ1bmN0aW9uIHJ1bkNsZWFyVGltZW91dChtYXJrZXIpIHtcbiAgICBpZiAoY2FjaGVkQ2xlYXJUaW1lb3V0ID09PSBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBjbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgIHRydXN0IHRoZSBnbG9iYWwgb2JqZWN0IHdoZW4gY2FsbGVkIG5vcm1hbGx5XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwobnVsbCwgbWFya2VyKTtcbiAgICAgICAgfSBjYXRjaCAoZSl7XG4gICAgICAgICAgICAvLyBzYW1lIGFzIGFib3ZlIGJ1dCB3aGVuIGl0J3MgYSB2ZXJzaW9uIG9mIEkuRS4gdGhhdCBtdXN0IGhhdmUgdGhlIGdsb2JhbCBvYmplY3QgZm9yICd0aGlzJywgaG9wZnVsbHkgb3VyIGNvbnRleHQgY29ycmVjdCBvdGhlcndpc2UgaXQgd2lsbCB0aHJvdyBhIGdsb2JhbCBlcnJvci5cbiAgICAgICAgICAgIC8vIFNvbWUgdmVyc2lvbnMgb2YgSS5FLiBoYXZlIGRpZmZlcmVudCBydWxlcyBmb3IgY2xlYXJUaW1lb3V0IHZzIHNldFRpbWVvdXRcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbCh0aGlzLCBtYXJrZXIpO1xuICAgICAgICB9XG4gICAgfVxuXG5cblxufVxudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgaWYgKCFkcmFpbmluZyB8fCAhY3VycmVudFF1ZXVlKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gcnVuVGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgcnVuQ2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgcnVuVGltZW91dChkcmFpblF1ZXVlKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsInZhciBmb3JnZSA9IHt9O1xudmFyIGFlcyA9IGZvcmdlLmFlcyA9IHt9O1xudmFyIG1kID0gZm9yZ2UubWQgPSB7fTtcbnZhciBwa2kgPSBmb3JnZS5wa2kgPSB7fTtcbnZhciByc2EgPSBmb3JnZS5wa2kucnNhID0gZm9yZ2UucnNhID0ge307XG52YXIgdXRpbCA9IGZvcmdlLnV0aWwgPSB7fTtcblxuLyoqXG4gKiBFeHBvc2UgYGtleXBhaXJgLlxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9wdHMpIHtcbiAgaWYgKCFvcHRzKSBvcHRzID0ge307XG4gIGlmICh0eXBlb2Ygb3B0cy5iaXRzID09ICd1bmRlZmluZWQnKSBvcHRzLmJpdHMgPSAyMDQ4O1xuICB2YXIga2V5cGFpciA9IGZvcmdlLnJzYS5nZW5lcmF0ZUtleVBhaXIob3B0cyk7XG4gIGtleXBhaXIgPSB7XG4gICAgcHVibGljOiBmaXgoZm9yZ2UucGtpLnB1YmxpY0tleVRvUlNBUHVibGljS2V5UGVtKGtleXBhaXIucHVibGljS2V5LCA3MikpLFxuICAgIHByaXZhdGU6IGZpeChmb3JnZS5wa2kucHJpdmF0ZUtleVRvUGVtKGtleXBhaXIucHJpdmF0ZUtleSwgNzIpKVxuICB9O1xuICByZXR1cm4ga2V5cGFpcjtcbn07XG5cbmZ1bmN0aW9uIGZpeCAoc3RyKSB7XG4gIHJldHVybiBzdHIucmVwbGFjZSgvXFxyL2csICcnKSArICdcXG4nXG59XG5cbi8qKlxuICogdXRpbC5maWxsU3RyaW5nXG4gKi9cblxudXRpbC5maWxsU3RyaW5nID0gZnVuY3Rpb24oYywgbikge1xuICB2YXIgcyA9ICcnO1xuICB3aGlsZShuID4gMCkge1xuICAgIGlmKG4gJiAxKSB7XG4gICAgICBzICs9IGM7XG4gICAgfVxuICAgIG4gPj4+PSAxO1xuICAgIGlmKG4gPiAwKSB7XG4gICAgICBjICs9IGM7XG4gICAgfVxuICB9XG4gIHJldHVybiBzO1xufTtcblxuLyoqXG4gKiBtZC5zaGExXG4gKi9cblxudmFyIHNoYTEgPSBmb3JnZS5zaGExID0gZm9yZ2UubWQuc2hhMSA9IHt9O1xuXG4vLyBzaGEtMSBwYWRkaW5nIGJ5dGVzIG5vdCBpbml0aWFsaXplZCB5ZXRcbnZhciBfcGFkZGluZyA9IG51bGw7XG52YXIgX2luaXRpYWxpemVkID0gZmFsc2U7XG5cbi8qKlxuICogSW5pdGlhbGl6ZXMgdGhlIGNvbnN0YW50IHRhYmxlcy5cbiAqL1xudmFyIF9pbml0ID0gZnVuY3Rpb24oKSB7XG4gIC8vIGNyZWF0ZSBwYWRkaW5nXG4gIF9wYWRkaW5nID0gU3RyaW5nLmZyb21DaGFyQ29kZSgxMjgpO1xuICBfcGFkZGluZyArPSBmb3JnZS51dGlsLmZpbGxTdHJpbmcoU3RyaW5nLmZyb21DaGFyQ29kZSgweDAwKSwgNjQpO1xuXG4gIC8vIG5vdyBpbml0aWFsaXplZFxuICBfaW5pdGlhbGl6ZWQgPSB0cnVlO1xufTtcblxuLyoqXG4gKiBVcGRhdGVzIGEgU0hBLTEgc3RhdGUgd2l0aCB0aGUgZ2l2ZW4gYnl0ZSBidWZmZXIuXG4gKlxuICogQHBhcmFtIHMgdGhlIFNIQS0xIHN0YXRlIHRvIHVwZGF0ZS5cbiAqIEBwYXJhbSB3IHRoZSBhcnJheSB0byB1c2UgdG8gc3RvcmUgd29yZHMuXG4gKiBAcGFyYW0gYnl0ZXMgdGhlIGJ5dGUgYnVmZmVyIHRvIHVwZGF0ZSB3aXRoLlxuICovXG52YXIgX3VwZGF0ZSA9IGZ1bmN0aW9uKHMsIHcsIGJ5dGVzKSB7XG4gIC8vIGNvbnN1bWUgNTEyIGJpdCAoNjQgYnl0ZSkgY2h1bmtzXG4gIHZhciB0LCBhLCBiLCBjLCBkLCBlLCBmLCBpO1xuICB2YXIgbGVuID0gYnl0ZXMubGVuZ3RoKCk7XG4gIHdoaWxlKGxlbiA+PSA2NCkge1xuICAgIC8vIHRoZSB3IGFycmF5IHdpbGwgYmUgcG9wdWxhdGVkIHdpdGggc2l4dGVlbiAzMi1iaXQgYmlnLWVuZGlhbiB3b3Jkc1xuICAgIC8vIGFuZCB0aGVuIGV4dGVuZGVkIGludG8gODAgMzItYml0IHdvcmRzIGFjY29yZGluZyB0byBTSEEtMSBhbGdvcml0aG1cbiAgICAvLyBhbmQgZm9yIDMyLTc5IHVzaW5nIE1heCBMb2NrdHl1a2hpbidzIG9wdGltaXphdGlvblxuXG4gICAgLy8gaW5pdGlhbGl6ZSBoYXNoIHZhbHVlIGZvciB0aGlzIGNodW5rXG4gICAgYSA9IHMuaDA7XG4gICAgYiA9IHMuaDE7XG4gICAgYyA9IHMuaDI7XG4gICAgZCA9IHMuaDM7XG4gICAgZSA9IHMuaDQ7XG5cbiAgICAvLyByb3VuZCAxXG4gICAgZm9yKGkgPSAwOyBpIDwgMTY7ICsraSkge1xuICAgICAgdCA9IGJ5dGVzLmdldEludDMyKCk7XG4gICAgICB3W2ldID0gdDtcbiAgICAgIGYgPSBkIF4gKGIgJiAoYyBeIGQpKTtcbiAgICAgIHQgPSAoKGEgPDwgNSkgfCAoYSA+Pj4gMjcpKSArIGYgKyBlICsgMHg1QTgyNzk5OSArIHQ7XG4gICAgICBlID0gZDtcbiAgICAgIGQgPSBjO1xuICAgICAgYyA9IChiIDw8IDMwKSB8IChiID4+PiAyKTtcbiAgICAgIGIgPSBhO1xuICAgICAgYSA9IHQ7XG4gICAgfVxuICAgIGZvcig7IGkgPCAyMDsgKytpKSB7XG4gICAgICB0ID0gKHdbaSAtIDNdIF4gd1tpIC0gOF0gXiB3W2kgLSAxNF0gXiB3W2kgLSAxNl0pO1xuICAgICAgdCA9ICh0IDw8IDEpIHwgKHQgPj4+IDMxKTtcbiAgICAgIHdbaV0gPSB0O1xuICAgICAgZiA9IGQgXiAoYiAmIChjIF4gZCkpO1xuICAgICAgdCA9ICgoYSA8PCA1KSB8IChhID4+PiAyNykpICsgZiArIGUgKyAweDVBODI3OTk5ICsgdDtcbiAgICAgIGUgPSBkO1xuICAgICAgZCA9IGM7XG4gICAgICBjID0gKGIgPDwgMzApIHwgKGIgPj4+IDIpO1xuICAgICAgYiA9IGE7XG4gICAgICBhID0gdDtcbiAgICB9XG4gICAgLy8gcm91bmQgMlxuICAgIGZvcig7IGkgPCAzMjsgKytpKSB7XG4gICAgICB0ID0gKHdbaSAtIDNdIF4gd1tpIC0gOF0gXiB3W2kgLSAxNF0gXiB3W2kgLSAxNl0pO1xuICAgICAgdCA9ICh0IDw8IDEpIHwgKHQgPj4+IDMxKTtcbiAgICAgIHdbaV0gPSB0O1xuICAgICAgZiA9IGIgXiBjIF4gZDtcbiAgICAgIHQgPSAoKGEgPDwgNSkgfCAoYSA+Pj4gMjcpKSArIGYgKyBlICsgMHg2RUQ5RUJBMSArIHQ7XG4gICAgICBlID0gZDtcbiAgICAgIGQgPSBjO1xuICAgICAgYyA9IChiIDw8IDMwKSB8IChiID4+PiAyKTtcbiAgICAgIGIgPSBhO1xuICAgICAgYSA9IHQ7XG4gICAgfVxuICAgIGZvcig7IGkgPCA0MDsgKytpKSB7XG4gICAgICB0ID0gKHdbaSAtIDZdIF4gd1tpIC0gMTZdIF4gd1tpIC0gMjhdIF4gd1tpIC0gMzJdKTtcbiAgICAgIHQgPSAodCA8PCAyKSB8ICh0ID4+PiAzMCk7XG4gICAgICB3W2ldID0gdDtcbiAgICAgIGYgPSBiIF4gYyBeIGQ7XG4gICAgICB0ID0gKChhIDw8IDUpIHwgKGEgPj4+IDI3KSkgKyBmICsgZSArIDB4NkVEOUVCQTEgKyB0O1xuICAgICAgZSA9IGQ7XG4gICAgICBkID0gYztcbiAgICAgIGMgPSAoYiA8PCAzMCkgfCAoYiA+Pj4gMik7XG4gICAgICBiID0gYTtcbiAgICAgIGEgPSB0O1xuICAgIH1cbiAgICAvLyByb3VuZCAzXG4gICAgZm9yKDsgaSA8IDYwOyArK2kpIHtcbiAgICAgIHQgPSAod1tpIC0gNl0gXiB3W2kgLSAxNl0gXiB3W2kgLSAyOF0gXiB3W2kgLSAzMl0pO1xuICAgICAgdCA9ICh0IDw8IDIpIHwgKHQgPj4+IDMwKTtcbiAgICAgIHdbaV0gPSB0O1xuICAgICAgZiA9IChiICYgYykgfCAoZCAmIChiIF4gYykpO1xuICAgICAgdCA9ICgoYSA8PCA1KSB8IChhID4+PiAyNykpICsgZiArIGUgKyAweDhGMUJCQ0RDICsgdDtcbiAgICAgIGUgPSBkO1xuICAgICAgZCA9IGM7XG4gICAgICBjID0gKGIgPDwgMzApIHwgKGIgPj4+IDIpO1xuICAgICAgYiA9IGE7XG4gICAgICBhID0gdDtcbiAgICB9XG4gICAgLy8gcm91bmQgNFxuICAgIGZvcig7IGkgPCA4MDsgKytpKSB7XG4gICAgICB0ID0gKHdbaSAtIDZdIF4gd1tpIC0gMTZdIF4gd1tpIC0gMjhdIF4gd1tpIC0gMzJdKTtcbiAgICAgIHQgPSAodCA8PCAyKSB8ICh0ID4+PiAzMCk7XG4gICAgICB3W2ldID0gdDtcbiAgICAgIGYgPSBiIF4gYyBeIGQ7XG4gICAgICB0ID0gKChhIDw8IDUpIHwgKGEgPj4+IDI3KSkgKyBmICsgZSArIDB4Q0E2MkMxRDYgKyB0O1xuICAgICAgZSA9IGQ7XG4gICAgICBkID0gYztcbiAgICAgIGMgPSAoYiA8PCAzMCkgfCAoYiA+Pj4gMik7XG4gICAgICBiID0gYTtcbiAgICAgIGEgPSB0O1xuICAgIH1cblxuICAgIC8vIHVwZGF0ZSBoYXNoIHN0YXRlXG4gICAgcy5oMCArPSBhO1xuICAgIHMuaDEgKz0gYjtcbiAgICBzLmgyICs9IGM7XG4gICAgcy5oMyArPSBkO1xuICAgIHMuaDQgKz0gZTtcblxuICAgIGxlbiAtPSA2NDtcbiAgfVxufTtcblxuLyoqXG4gKiBDcmVhdGVzIGEgU0hBLTEgbWVzc2FnZSBkaWdlc3Qgb2JqZWN0LlxuICpcbiAqIEByZXR1cm4gYSBtZXNzYWdlIGRpZ2VzdCBvYmplY3QuXG4gKi9cbnNoYTEuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG4gIC8vIGRvIGluaXRpYWxpemF0aW9uIGFzIG5lY2Vzc2FyeVxuICBpZighX2luaXRpYWxpemVkKSB7XG4gICAgX2luaXQoKTtcbiAgfVxuXG4gIC8vIFNIQS0xIHN0YXRlIGNvbnRhaW5zIGZpdmUgMzItYml0IGludGVnZXJzXG4gIHZhciBfc3RhdGUgPSBudWxsO1xuXG4gIC8vIGlucHV0IGJ1ZmZlclxuICB2YXIgX2lucHV0ID0gZm9yZ2UudXRpbC5jcmVhdGVCdWZmZXIoKTtcblxuICAvLyB1c2VkIGZvciB3b3JkIHN0b3JhZ2VcbiAgdmFyIF93ID0gbmV3IEFycmF5KDgwKTtcblxuICAvLyBtZXNzYWdlIGRpZ2VzdCBvYmplY3RcbiAgdmFyIG1kID0ge1xuICAgIGFsZ29yaXRobTogJ3NoYTEnLFxuICAgIGJsb2NrTGVuZ3RoOiA2NCxcbiAgICBkaWdlc3RMZW5ndGg6IDIwLFxuICAgIC8vIGxlbmd0aCBvZiBtZXNzYWdlIHNvIGZhciAoZG9lcyBub3QgaW5jbHVkaW5nIHBhZGRpbmcpXG4gICAgbWVzc2FnZUxlbmd0aDogMFxuICB9O1xuXG4gIC8qKlxuICAgKiBTdGFydHMgdGhlIGRpZ2VzdC5cbiAgICovXG4gIG1kLnN0YXJ0ID0gZnVuY3Rpb24oKSB7XG4gICAgbWQubWVzc2FnZUxlbmd0aCA9IDA7XG4gICAgX2lucHV0ID0gZm9yZ2UudXRpbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBfc3RhdGUgPSB7XG4gICAgICBoMDogMHg2NzQ1MjMwMSxcbiAgICAgIGgxOiAweEVGQ0RBQjg5LFxuICAgICAgaDI6IDB4OThCQURDRkUsXG4gICAgICBoMzogMHgxMDMyNTQ3NixcbiAgICAgIGg0OiAweEMzRDJFMUYwXG4gICAgfTtcbiAgfTtcbiAgLy8gc3RhcnQgZGlnZXN0IGF1dG9tYXRpY2FsbHkgZm9yIGZpcnN0IHRpbWVcbiAgbWQuc3RhcnQoKTtcblxuICAvKipcbiAgICogVXBkYXRlcyB0aGUgZGlnZXN0IHdpdGggdGhlIGdpdmVuIG1lc3NhZ2UgaW5wdXQuIFRoZSBnaXZlbiBpbnB1dCBjYW5cbiAgICogdHJlYXRlZCBhcyByYXcgaW5wdXQgKG5vIGVuY29kaW5nIHdpbGwgYmUgYXBwbGllZCkgb3IgYW4gZW5jb2Rpbmcgb2ZcbiAgICogJ3V0ZjgnIG1heWJlIGdpdmVuIHRvIGVuY29kZSB0aGUgaW5wdXQgdXNpbmcgVVRGLTguXG4gICAqXG4gICAqIEBwYXJhbSBtc2cgdGhlIG1lc3NhZ2UgaW5wdXQgdG8gdXBkYXRlIHdpdGguXG4gICAqIEBwYXJhbSBlbmNvZGluZyB0aGUgZW5jb2RpbmcgdG8gdXNlIChkZWZhdWx0OiAncmF3Jywgb3RoZXI6ICd1dGY4JykuXG4gICAqL1xuICBtZC51cGRhdGUgPSBmdW5jdGlvbihtc2csIGVuY29kaW5nKSB7XG4gICAgaWYoZW5jb2RpbmcgPT09ICd1dGY4Jykge1xuICAgICAgbXNnID0gZm9yZ2UudXRpbC5lbmNvZGVVdGY4KG1zZyk7XG4gICAgfVxuXG4gICAgLy8gdXBkYXRlIG1lc3NhZ2UgbGVuZ3RoXG4gICAgbWQubWVzc2FnZUxlbmd0aCArPSBtc2cubGVuZ3RoO1xuXG4gICAgLy8gYWRkIGJ5dGVzIHRvIGlucHV0IGJ1ZmZlclxuICAgIF9pbnB1dC5wdXRCeXRlcyhtc2cpO1xuXG4gICAgLy8gcHJvY2VzcyBieXRlc1xuICAgIF91cGRhdGUoX3N0YXRlLCBfdywgX2lucHV0KTtcblxuICAgIC8vIGNvbXBhY3QgaW5wdXQgYnVmZmVyIGV2ZXJ5IDJLIG9yIGlmIGVtcHR5XG4gICAgaWYoX2lucHV0LnJlYWQgPiAyMDQ4IHx8IF9pbnB1dC5sZW5ndGgoKSA9PT0gMCkge1xuICAgICAgX2lucHV0LmNvbXBhY3QoKTtcbiAgICB9XG4gIH07XG5cbiAgIC8qKlxuICAgICogUHJvZHVjZXMgdGhlIGRpZ2VzdC5cbiAgICAqXG4gICAgKiBAcmV0dXJuIGEgYnl0ZSBidWZmZXIgY29udGFpbmluZyB0aGUgZGlnZXN0IHZhbHVlLlxuICAgICovXG4gICBtZC5kaWdlc3QgPSBmdW5jdGlvbigpIHtcbiAgICAvKiBOb3RlOiBIZXJlIHdlIGNvcHkgdGhlIHJlbWFpbmluZyBieXRlcyBpbiB0aGUgaW5wdXQgYnVmZmVyIGFuZFxuICAgICAgYWRkIHRoZSBhcHByb3ByaWF0ZSBTSEEtMSBwYWRkaW5nLiBUaGVuIHdlIGRvIHRoZSBmaW5hbCB1cGRhdGVcbiAgICAgIG9uIGEgY29weSBvZiB0aGUgc3RhdGUgc28gdGhhdCBpZiB0aGUgdXNlciB3YW50cyB0byBnZXRcbiAgICAgIGludGVybWVkaWF0ZSBkaWdlc3RzIHRoZXkgY2FuIGRvIHNvLiAqL1xuXG4gICAgLyogRGV0ZXJtaW5lIHRoZSBudW1iZXIgb2YgYnl0ZXMgdGhhdCBtdXN0IGJlIGFkZGVkIHRvIHRoZSBtZXNzYWdlXG4gICAgICB0byBlbnN1cmUgaXRzIGxlbmd0aCBpcyBjb25ncnVlbnQgdG8gNDQ4IG1vZCA1MTIuIEluIG90aGVyIHdvcmRzLFxuICAgICAgYSA2NC1iaXQgaW50ZWdlciB0aGF0IGdpdmVzIHRoZSBsZW5ndGggb2YgdGhlIG1lc3NhZ2Ugd2lsbCBiZVxuICAgICAgYXBwZW5kZWQgdG8gdGhlIG1lc3NhZ2UgYW5kIHdoYXRldmVyIHRoZSBsZW5ndGggb2YgdGhlIG1lc3NhZ2UgaXNcbiAgICAgIHBsdXMgNjQgYml0cyBtdXN0IGJlIGEgbXVsdGlwbGUgb2YgNTEyLiBTbyB0aGUgbGVuZ3RoIG9mIHRoZVxuICAgICAgbWVzc2FnZSBtdXN0IGJlIGNvbmdydWVudCB0byA0NDggbW9kIDUxMiBiZWNhdXNlIDUxMiAtIDY0ID0gNDQ4LlxuXG4gICAgICBJbiBvcmRlciB0byBmaWxsIHVwIHRoZSBtZXNzYWdlIGxlbmd0aCBpdCBtdXN0IGJlIGZpbGxlZCB3aXRoXG4gICAgICBwYWRkaW5nIHRoYXQgYmVnaW5zIHdpdGggMSBiaXQgZm9sbG93ZWQgYnkgYWxsIDAgYml0cy4gUGFkZGluZ1xuICAgICAgbXVzdCAqYWx3YXlzKiBiZSBwcmVzZW50LCBzbyBpZiB0aGUgbWVzc2FnZSBsZW5ndGggaXMgYWxyZWFkeVxuICAgICAgY29uZ3J1ZW50IHRvIDQ0OCBtb2QgNTEyLCB0aGVuIDUxMiBwYWRkaW5nIGJpdHMgbXVzdCBiZSBhZGRlZC4gKi9cblxuICAgIC8vIDUxMiBiaXRzID09IDY0IGJ5dGVzLCA0NDggYml0cyA9PSA1NiBieXRlcywgNjQgYml0cyA9IDggYnl0ZXNcbiAgICAvLyBfcGFkZGluZyBzdGFydHMgd2l0aCAxIGJ5dGUgd2l0aCBmaXJzdCBiaXQgaXMgc2V0IGluIGl0IHdoaWNoXG4gICAgLy8gaXMgYnl0ZSB2YWx1ZSAxMjgsIHRoZW4gdGhlcmUgbWF5IGJlIHVwIHRvIDYzIG90aGVyIHBhZCBieXRlc1xuICAgIHZhciBsZW4gPSBtZC5tZXNzYWdlTGVuZ3RoO1xuICAgIHZhciBwYWRCeXRlcyA9IGZvcmdlLnV0aWwuY3JlYXRlQnVmZmVyKCk7XG4gICAgcGFkQnl0ZXMucHV0Qnl0ZXMoX2lucHV0LmJ5dGVzKCkpO1xuICAgIHBhZEJ5dGVzLnB1dEJ5dGVzKF9wYWRkaW5nLnN1YnN0cigwLCA2NCAtICgobGVuICsgOCkgJSA2NCkpKTtcblxuICAgIC8qIE5vdyBhcHBlbmQgbGVuZ3RoIG9mIHRoZSBtZXNzYWdlLiBUaGUgbGVuZ3RoIGlzIGFwcGVuZGVkIGluIGJpdHNcbiAgICAgIGFzIGEgNjQtYml0IG51bWJlciBpbiBiaWctZW5kaWFuIG9yZGVyLiBTaW5jZSB3ZSBzdG9yZSB0aGUgbGVuZ3RoXG4gICAgICBpbiBieXRlcywgd2UgbXVzdCBtdWx0aXBseSBpdCBieSA4IChvciBsZWZ0IHNoaWZ0IGJ5IDMpLiBTbyBoZXJlXG4gICAgICBzdG9yZSB0aGUgaGlnaCAzIGJpdHMgaW4gdGhlIGxvdyBlbmQgb2YgdGhlIGZpcnN0IDMyLWJpdHMgb2YgdGhlXG4gICAgICA2NC1iaXQgbnVtYmVyIGFuZCB0aGUgbG93ZXIgNSBiaXRzIGluIHRoZSBoaWdoIGVuZCBvZiB0aGUgc2Vjb25kXG4gICAgICAzMi1iaXRzLiAqL1xuICAgIHBhZEJ5dGVzLnB1dEludDMyKChsZW4gPj4+IDI5KSAmIDB4RkYpO1xuICAgIHBhZEJ5dGVzLnB1dEludDMyKChsZW4gPDwgMykgJiAweEZGRkZGRkZGKTtcbiAgICB2YXIgczIgPSB7XG4gICAgICBoMDogX3N0YXRlLmgwLFxuICAgICAgaDE6IF9zdGF0ZS5oMSxcbiAgICAgIGgyOiBfc3RhdGUuaDIsXG4gICAgICBoMzogX3N0YXRlLmgzLFxuICAgICAgaDQ6IF9zdGF0ZS5oNFxuICAgIH07XG4gICAgX3VwZGF0ZShzMiwgX3csIHBhZEJ5dGVzKTtcbiAgICB2YXIgcnZhbCA9IGZvcmdlLnV0aWwuY3JlYXRlQnVmZmVyKCk7XG4gICAgcnZhbC5wdXRJbnQzMihzMi5oMCk7XG4gICAgcnZhbC5wdXRJbnQzMihzMi5oMSk7XG4gICAgcnZhbC5wdXRJbnQzMihzMi5oMik7XG4gICAgcnZhbC5wdXRJbnQzMihzMi5oMyk7XG4gICAgcnZhbC5wdXRJbnQzMihzMi5oNCk7XG4gICAgcmV0dXJuIHJ2YWw7XG4gIH07XG5cbiAgcmV0dXJuIG1kO1xufTtcblxuXG4vKipcbiAqIHV0aWwuQnl0ZUJ1ZmZlclxuICovXG5cbi8qKlxuICogQ29uc3RydWN0b3IgZm9yIGEgYnl0ZSBidWZmZXIuXG4gKlxuICogQHBhcmFtIGIgdGhlIGJ5dGVzIHRvIHdyYXAgKGFzIGEgVVRGLTggc3RyaW5nKSAob3B0aW9uYWwpLlxuICovXG51dGlsLkJ5dGVCdWZmZXIgPSBmdW5jdGlvbihiKSB7XG4gIC8vIHRoZSBkYXRhIGluIHRoaXMgYnVmZmVyXG4gIHRoaXMuZGF0YSA9IGIgfHwgJyc7XG4gIC8vIHRoZSBwb2ludGVyIGZvciByZWFkaW5nIGZyb20gdGhpcyBidWZmZXJcbiAgdGhpcy5yZWFkID0gMDtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgbnVtYmVyIG9mIGJ5dGVzIGluIHRoaXMgYnVmZmVyLlxuICpcbiAqIEByZXR1cm4gdGhlIG51bWJlciBvZiBieXRlcyBpbiB0aGlzIGJ1ZmZlci5cbiAqL1xudXRpbC5CeXRlQnVmZmVyLnByb3RvdHlwZS5sZW5ndGggPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZGF0YS5sZW5ndGggLSB0aGlzLnJlYWQ7XG59O1xuXG4vKipcbiAqIEdldHMgd2hldGhlciBvciBub3QgdGhpcyBidWZmZXIgaXMgZW1wdHkuXG4gKlxuICogQHJldHVybiB0cnVlIGlmIHRoaXMgYnVmZmVyIGlzIGVtcHR5LCBmYWxzZSBpZiBub3QuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUuaXNFbXB0eSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gKHRoaXMuZGF0YS5sZW5ndGggLSB0aGlzLnJlYWQpID09PSAwO1xufTtcblxuLyoqXG4gKiBQdXRzIGEgYnl0ZSBpbiB0aGlzIGJ1ZmZlci5cbiAqXG4gKiBAcGFyYW0gYiB0aGUgYnl0ZSB0byBwdXQuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucHV0Qnl0ZSA9IGZ1bmN0aW9uKGIpIHtcbiAgdGhpcy5kYXRhICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYik7XG59O1xuXG4vKipcbiAqIFB1dHMgYSBieXRlIGluIHRoaXMgYnVmZmVyIE4gdGltZXMuXG4gKlxuICogQHBhcmFtIGIgdGhlIGJ5dGUgdG8gcHV0LlxuICogQHBhcmFtIG4gdGhlIG51bWJlciBvZiBieXRlcyBvZiB2YWx1ZSBiIHRvIHB1dC5cbiAqL1xudXRpbC5CeXRlQnVmZmVyLnByb3RvdHlwZS5maWxsV2l0aEJ5dGUgPSBmdW5jdGlvbihiLCBuKSB7XG4gIGIgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKGIpO1xuICB2YXIgZCA9IHRoaXMuZGF0YTtcbiAgd2hpbGUobiA+IDApIHtcbiAgICBpZihuICYgMSkge1xuICAgICAgZCArPSBiO1xuICAgIH1cbiAgICBuID4+Pj0gMTtcbiAgICBpZihuID4gMCkge1xuICAgICAgYiArPSBiO1xuICAgIH1cbiAgfVxuICB0aGlzLmRhdGEgPSBkO1xufTtcblxuLyoqXG4gKiBQdXRzIGJ5dGVzIGluIHRoaXMgYnVmZmVyLlxuICpcbiAqIEBwYXJhbSBieXRlcyB0aGUgYnl0ZXMgKGFzIGEgVVRGLTggZW5jb2RlZCBzdHJpbmcpIHRvIHB1dC5cbiAqL1xudXRpbC5CeXRlQnVmZmVyLnByb3RvdHlwZS5wdXRCeXRlcyA9IGZ1bmN0aW9uKGJ5dGVzKSB7XG4gIHRoaXMuZGF0YSArPSBieXRlcztcbn07XG5cbi8qKlxuICogUHV0cyBhIFVURi0xNiBlbmNvZGVkIHN0cmluZyBpbnRvIHRoaXMgYnVmZmVyLlxuICpcbiAqIEBwYXJhbSBzdHIgdGhlIHN0cmluZyB0byBwdXQuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucHV0U3RyaW5nID0gZnVuY3Rpb24oc3RyKSB7XG4gIHRoaXMuZGF0YSArPSB1dGlsLmVuY29kZVV0Zjgoc3RyKTtcbn07XG5cbi8qKlxuICogUHV0cyBhIDE2LWJpdCBpbnRlZ2VyIGluIHRoaXMgYnVmZmVyIGluIGJpZy1lbmRpYW4gb3JkZXIuXG4gKlxuICogQHBhcmFtIGkgdGhlIDE2LWJpdCBpbnRlZ2VyLlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dEludDE2ID0gZnVuY3Rpb24oaSkge1xuICB0aGlzLmRhdGEgKz1cbiAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKGkgPj4gOCAmIDB4RkYpICtcbiAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKGkgJiAweEZGKTtcbn07XG5cbi8qKlxuICogUHV0cyBhIDI0LWJpdCBpbnRlZ2VyIGluIHRoaXMgYnVmZmVyIGluIGJpZy1lbmRpYW4gb3JkZXIuXG4gKlxuICogQHBhcmFtIGkgdGhlIDI0LWJpdCBpbnRlZ2VyLlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dEludDI0ID0gZnVuY3Rpb24oaSkge1xuICB0aGlzLmRhdGEgKz1cbiAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKGkgPj4gMTYgJiAweEZGKSArXG4gICAgU3RyaW5nLmZyb21DaGFyQ29kZShpID4+IDggJiAweEZGKSArXG4gICAgU3RyaW5nLmZyb21DaGFyQ29kZShpICYgMHhGRik7XG59O1xuXG4vKipcbiAqIFB1dHMgYSAzMi1iaXQgaW50ZWdlciBpbiB0aGlzIGJ1ZmZlciBpbiBiaWctZW5kaWFuIG9yZGVyLlxuICpcbiAqIEBwYXJhbSBpIHRoZSAzMi1iaXQgaW50ZWdlci5cbiAqL1xudXRpbC5CeXRlQnVmZmVyLnByb3RvdHlwZS5wdXRJbnQzMiA9IGZ1bmN0aW9uKGkpIHtcbiAgdGhpcy5kYXRhICs9XG4gICAgU3RyaW5nLmZyb21DaGFyQ29kZShpID4+IDI0ICYgMHhGRikgK1xuICAgIFN0cmluZy5mcm9tQ2hhckNvZGUoaSA+PiAxNiAmIDB4RkYpICtcbiAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKGkgPj4gOCAmIDB4RkYpICtcbiAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKGkgJiAweEZGKTtcbn07XG5cbi8qKlxuICogUHV0cyBhIDE2LWJpdCBpbnRlZ2VyIGluIHRoaXMgYnVmZmVyIGluIGxpdHRsZS1lbmRpYW4gb3JkZXIuXG4gKlxuICogQHBhcmFtIGkgdGhlIDE2LWJpdCBpbnRlZ2VyLlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLnB1dEludDE2TGUgPSBmdW5jdGlvbihpKSB7XG4gIHRoaXMuZGF0YSArPVxuICAgIFN0cmluZy5mcm9tQ2hhckNvZGUoaSAmIDB4RkYpICtcbiAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKGkgPj4gOCAmIDB4RkYpO1xufTtcblxuLyoqXG4gKiBQdXRzIGEgMjQtYml0IGludGVnZXIgaW4gdGhpcyBidWZmZXIgaW4gbGl0dGxlLWVuZGlhbiBvcmRlci5cbiAqXG4gKiBAcGFyYW0gaSB0aGUgMjQtYml0IGludGVnZXIuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucHV0SW50MjRMZSA9IGZ1bmN0aW9uKGkpIHtcbiAgdGhpcy5kYXRhICs9XG4gICAgU3RyaW5nLmZyb21DaGFyQ29kZShpICYgMHhGRikgK1xuICAgIFN0cmluZy5mcm9tQ2hhckNvZGUoaSA+PiA4ICYgMHhGRikgK1xuICAgIFN0cmluZy5mcm9tQ2hhckNvZGUoaSA+PiAxNiAmIDB4RkYpO1xufTtcblxuLyoqXG4gKiBQdXRzIGEgMzItYml0IGludGVnZXIgaW4gdGhpcyBidWZmZXIgaW4gbGl0dGxlLWVuZGlhbiBvcmRlci5cbiAqXG4gKiBAcGFyYW0gaSB0aGUgMzItYml0IGludGVnZXIuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucHV0SW50MzJMZSA9IGZ1bmN0aW9uKGkpIHtcbiAgdGhpcy5kYXRhICs9XG4gICAgU3RyaW5nLmZyb21DaGFyQ29kZShpICYgMHhGRikgK1xuICAgIFN0cmluZy5mcm9tQ2hhckNvZGUoaSA+PiA4ICYgMHhGRikgK1xuICAgIFN0cmluZy5mcm9tQ2hhckNvZGUoaSA+PiAxNiAmIDB4RkYpICtcbiAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKGkgPj4gMjQgJiAweEZGKTtcbn07XG5cbi8qKlxuICogUHV0cyBhbiBuLWJpdCBpbnRlZ2VyIGluIHRoaXMgYnVmZmVyIGluIGJpZy1lbmRpYW4gb3JkZXIuXG4gKlxuICogQHBhcmFtIGkgdGhlIG4tYml0IGludGVnZXIuXG4gKiBAcGFyYW0gbiB0aGUgbnVtYmVyIG9mIGJpdHMgaW4gdGhlIGludGVnZXIuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucHV0SW50ID0gZnVuY3Rpb24oaSwgbikge1xuICBkbyB7XG4gICAgbiAtPSA4O1xuICAgIHRoaXMuZGF0YSArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChpID4+IG4pICYgMHhGRik7XG4gIH1cbiAgd2hpbGUobiA+IDApO1xufTtcblxuLyoqXG4gKiBQdXRzIHRoZSBnaXZlbiBidWZmZXIgaW50byB0aGlzIGJ1ZmZlci5cbiAqXG4gKiBAcGFyYW0gYnVmZmVyIHRoZSBidWZmZXIgdG8gcHV0IGludG8gdGhpcyBvbmUuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUucHV0QnVmZmVyID0gZnVuY3Rpb24oYnVmZmVyKSB7XG4gIHRoaXMuZGF0YSArPSBidWZmZXIuZ2V0Qnl0ZXMoKTtcbn07XG5cbi8qKlxuICogR2V0cyBhIGJ5dGUgZnJvbSB0aGlzIGJ1ZmZlciBhbmQgYWR2YW5jZXMgdGhlIHJlYWQgcG9pbnRlciBieSAxLlxuICpcbiAqIEByZXR1cm4gdGhlIGJ5dGUuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUuZ2V0Qnl0ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy5yZWFkKyspO1xufTtcblxuLyoqXG4gKiBHZXRzIGEgdWludDE2IGZyb20gdGhpcyBidWZmZXIgaW4gYmlnLWVuZGlhbiBvcmRlciBhbmQgYWR2YW5jZXMgdGhlIHJlYWRcbiAqIHBvaW50ZXIgYnkgMi5cbiAqXG4gKiBAcmV0dXJuIHRoZSB1aW50MTYuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUuZ2V0SW50MTYgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJ2YWwgPSAoXG4gICAgdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy5yZWFkKSA8PCA4IF5cbiAgICB0aGlzLmRhdGEuY2hhckNvZGVBdCh0aGlzLnJlYWQgKyAxKSk7XG4gIHRoaXMucmVhZCArPSAyO1xuICByZXR1cm4gcnZhbDtcbn07XG5cbi8qKlxuICogR2V0cyBhIHVpbnQyNCBmcm9tIHRoaXMgYnVmZmVyIGluIGJpZy1lbmRpYW4gb3JkZXIgYW5kIGFkdmFuY2VzIHRoZSByZWFkXG4gKiBwb2ludGVyIGJ5IDMuXG4gKlxuICogQHJldHVybiB0aGUgdWludDI0LlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldEludDI0ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBydmFsID0gKFxuICAgIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMucmVhZCkgPDwgMTYgXlxuICAgIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMucmVhZCArIDEpIDw8IDggXlxuICAgIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMucmVhZCArIDIpKTtcbiAgdGhpcy5yZWFkICs9IDM7XG4gIHJldHVybiBydmFsO1xufTtcblxuLyoqXG4gKiBHZXRzIGEgdWludDMyIGZyb20gdGhpcyBidWZmZXIgaW4gYmlnLWVuZGlhbiBvcmRlciBhbmQgYWR2YW5jZXMgdGhlIHJlYWRcbiAqIHBvaW50ZXIgYnkgNC5cbiAqXG4gKiBAcmV0dXJuIHRoZSB3b3JkLlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldEludDMyID0gZnVuY3Rpb24oKSB7XG4gIHZhciBydmFsID0gKFxuICAgIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMucmVhZCkgPDwgMjQgXlxuICAgIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMucmVhZCArIDEpIDw8IDE2IF5cbiAgICB0aGlzLmRhdGEuY2hhckNvZGVBdCh0aGlzLnJlYWQgKyAyKSA8PCA4IF5cbiAgICB0aGlzLmRhdGEuY2hhckNvZGVBdCh0aGlzLnJlYWQgKyAzKSk7XG4gIHRoaXMucmVhZCArPSA0O1xuICByZXR1cm4gcnZhbDtcbn07XG5cbi8qKlxuICogR2V0cyBhIHVpbnQxNiBmcm9tIHRoaXMgYnVmZmVyIGluIGxpdHRsZS1lbmRpYW4gb3JkZXIgYW5kIGFkdmFuY2VzIHRoZSByZWFkXG4gKiBwb2ludGVyIGJ5IDIuXG4gKlxuICogQHJldHVybiB0aGUgdWludDE2LlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldEludDE2TGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJ2YWwgPSAoXG4gICAgdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy5yZWFkKSBeXG4gICAgdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy5yZWFkICsgMSkgPDwgOCk7XG4gIHRoaXMucmVhZCArPSAyO1xuICByZXR1cm4gcnZhbDtcbn07XG5cbi8qKlxuICogR2V0cyBhIHVpbnQyNCBmcm9tIHRoaXMgYnVmZmVyIGluIGxpdHRsZS1lbmRpYW4gb3JkZXIgYW5kIGFkdmFuY2VzIHRoZSByZWFkXG4gKiBwb2ludGVyIGJ5IDMuXG4gKlxuICogQHJldHVybiB0aGUgdWludDI0LlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLmdldEludDI0TGUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJ2YWwgPSAoXG4gICAgdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy5yZWFkKSBeXG4gICAgdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy5yZWFkICsgMSkgPDwgOCBeXG4gICAgdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy5yZWFkICsgMikgPDwgMTYpO1xuICB0aGlzLnJlYWQgKz0gMztcbiAgcmV0dXJuIHJ2YWw7XG59O1xuXG4vKipcbiAqIEdldHMgYSB1aW50MzIgZnJvbSB0aGlzIGJ1ZmZlciBpbiBsaXR0bGUtZW5kaWFuIG9yZGVyIGFuZCBhZHZhbmNlcyB0aGUgcmVhZFxuICogcG9pbnRlciBieSA0LlxuICpcbiAqIEByZXR1cm4gdGhlIHdvcmQuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUuZ2V0SW50MzJMZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcnZhbCA9IChcbiAgICB0aGlzLmRhdGEuY2hhckNvZGVBdCh0aGlzLnJlYWQpIF5cbiAgICB0aGlzLmRhdGEuY2hhckNvZGVBdCh0aGlzLnJlYWQgKyAxKSA8PCA4IF5cbiAgICB0aGlzLmRhdGEuY2hhckNvZGVBdCh0aGlzLnJlYWQgKyAyKSA8PCAxNiBeXG4gICAgdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy5yZWFkICsgMykgPDwgMjQpO1xuICB0aGlzLnJlYWQgKz0gNDtcbiAgcmV0dXJuIHJ2YWw7XG59O1xuXG4vKipcbiAqIEdldHMgYW4gbi1iaXQgaW50ZWdlciBmcm9tIHRoaXMgYnVmZmVyIGluIGJpZy1lbmRpYW4gb3JkZXIgYW5kIGFkdmFuY2VzIHRoZVxuICogcmVhZCBwb2ludGVyIGJ5IG4vOC5cbiAqXG4gKiBAcGFyYW0gbiB0aGUgbnVtYmVyIG9mIGJpdHMgaW4gdGhlIGludGVnZXIuXG4gKlxuICogQHJldHVybiB0aGUgaW50ZWdlci5cbiAqL1xudXRpbC5CeXRlQnVmZmVyLnByb3RvdHlwZS5nZXRJbnQgPSBmdW5jdGlvbihuKSB7XG4gIHZhciBydmFsID0gMDtcbiAgZG8ge1xuICAgIHJ2YWwgPSAocnZhbCA8PCBuKSArIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMucmVhZCsrKTtcbiAgICBuIC09IDg7XG4gIH1cbiAgd2hpbGUobiA+IDApO1xuICByZXR1cm4gcnZhbDtcbn07XG5cbi8qKlxuICogUmVhZHMgYnl0ZXMgb3V0IGludG8gYSBVVEYtOCBzdHJpbmcgYW5kIGNsZWFycyB0aGVtIGZyb20gdGhlIGJ1ZmZlci5cbiAqXG4gKiBAcGFyYW0gY291bnQgdGhlIG51bWJlciBvZiBieXRlcyB0byByZWFkLCB1bmRlZmluZWQgb3IgbnVsbCBmb3IgYWxsLlxuICpcbiAqIEByZXR1cm4gYSBVVEYtOCBzdHJpbmcgb2YgYnl0ZXMuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUuZ2V0Qnl0ZXMgPSBmdW5jdGlvbihjb3VudCkge1xuICB2YXIgcnZhbDtcbiAgaWYoY291bnQpIHtcbiAgICAvLyByZWFkIGNvdW50IGJ5dGVzXG4gICAgY291bnQgPSBNYXRoLm1pbih0aGlzLmxlbmd0aCgpLCBjb3VudCk7XG4gICAgcnZhbCA9IHRoaXMuZGF0YS5zbGljZSh0aGlzLnJlYWQsIHRoaXMucmVhZCArIGNvdW50KTtcbiAgICB0aGlzLnJlYWQgKz0gY291bnQ7XG4gIH1cbiAgZWxzZSBpZihjb3VudCA9PT0gMCkge1xuICAgIHJ2YWwgPSAnJztcbiAgfVxuICBlbHNlIHtcbiAgICAvLyByZWFkIGFsbCBieXRlcywgb3B0aW1pemUgdG8gb25seSBjb3B5IHdoZW4gbmVlZGVkXG4gICAgcnZhbCA9ICh0aGlzLnJlYWQgPT09IDApID8gdGhpcy5kYXRhIDogdGhpcy5kYXRhLnNsaWNlKHRoaXMucmVhZCk7XG4gICAgdGhpcy5jbGVhcigpO1xuICB9XG4gIHJldHVybiBydmFsO1xufTtcblxuLyoqXG4gKiBHZXRzIGEgVVRGLTggZW5jb2RlZCBzdHJpbmcgb2YgdGhlIGJ5dGVzIGZyb20gdGhpcyBidWZmZXIgd2l0aG91dCBtb2RpZnlpbmdcbiAqIHRoZSByZWFkIHBvaW50ZXIuXG4gKlxuICogQHBhcmFtIGNvdW50IHRoZSBudW1iZXIgb2YgYnl0ZXMgdG8gZ2V0LCBvbWl0IHRvIGdldCBhbGwuXG4gKlxuICogQHJldHVybiBhIHN0cmluZyBmdWxsIG9mIFVURi04IGVuY29kZWQgY2hhcmFjdGVycy5cbiAqL1xudXRpbC5CeXRlQnVmZmVyLnByb3RvdHlwZS5ieXRlcyA9IGZ1bmN0aW9uKGNvdW50KSB7XG4gIHJldHVybiAodHlwZW9mKGNvdW50KSA9PT0gJ3VuZGVmaW5lZCcgP1xuICAgIHRoaXMuZGF0YS5zbGljZSh0aGlzLnJlYWQpIDpcbiAgICB0aGlzLmRhdGEuc2xpY2UodGhpcy5yZWFkLCB0aGlzLnJlYWQgKyBjb3VudCkpO1xufTtcblxuLyoqXG4gKiBHZXRzIGEgYnl0ZSBhdCB0aGUgZ2l2ZW4gaW5kZXggd2l0aG91dCBtb2RpZnlpbmcgdGhlIHJlYWQgcG9pbnRlci5cbiAqXG4gKiBAcGFyYW0gaSB0aGUgYnl0ZSBpbmRleC5cbiAqXG4gKiBAcmV0dXJuIHRoZSBieXRlLlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24oaSkge1xuICByZXR1cm4gdGhpcy5kYXRhLmNoYXJDb2RlQXQodGhpcy5yZWFkICsgaSk7XG59O1xuXG4vKipcbiAqIFB1dHMgYSBieXRlIGF0IHRoZSBnaXZlbiBpbmRleCB3aXRob3V0IG1vZGlmeWluZyB0aGUgcmVhZCBwb2ludGVyLlxuICpcbiAqIEBwYXJhbSBpIHRoZSBieXRlIGluZGV4LlxuICogQHBhcmFtIGIgdGhlIGJ5dGUgdG8gcHV0LlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLnNldEF0ID0gZnVuY3Rpb24oaSwgYikge1xuICB0aGlzLmRhdGEgPSB0aGlzLmRhdGEuc3Vic3RyKDAsIHRoaXMucmVhZCArIGkpICtcbiAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKGIpICtcbiAgICB0aGlzLmRhdGEuc3Vic3RyKHRoaXMucmVhZCArIGkgKyAxKTtcbn07XG5cbi8qKlxuICogR2V0cyB0aGUgbGFzdCBieXRlIHdpdGhvdXQgbW9kaWZ5aW5nIHRoZSByZWFkIHBvaW50ZXIuXG4gKlxuICogQHJldHVybiB0aGUgbGFzdCBieXRlLlxuICovXG51dGlsLkJ5dGVCdWZmZXIucHJvdG90eXBlLmxhc3QgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHRoaXMuZGF0YS5jaGFyQ29kZUF0KHRoaXMuZGF0YS5sZW5ndGggLSAxKTtcbn07XG5cbi8qKlxuICogQ3JlYXRlcyBhIGNvcHkgb2YgdGhpcyBidWZmZXIuXG4gKlxuICogQHJldHVybiB0aGUgY29weS5cbiAqL1xudXRpbC5CeXRlQnVmZmVyLnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24oKSB7XG4gIHZhciBjID0gdXRpbC5jcmVhdGVCdWZmZXIodGhpcy5kYXRhKTtcbiAgYy5yZWFkID0gdGhpcy5yZWFkO1xuICByZXR1cm4gYztcbn07XG5cbi8qKlxuICogQ29tcGFjdHMgdGhpcyBidWZmZXIuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUuY29tcGFjdCA9IGZ1bmN0aW9uKCkge1xuICBpZih0aGlzLnJlYWQgPiAwKSB7XG4gICAgdGhpcy5kYXRhID0gdGhpcy5kYXRhLnNsaWNlKHRoaXMucmVhZCk7XG4gICAgdGhpcy5yZWFkID0gMDtcbiAgfVxufTtcblxuLyoqXG4gKiBDbGVhcnMgdGhpcyBidWZmZXIuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUuY2xlYXIgPSBmdW5jdGlvbigpIHtcbiAgdGhpcy5kYXRhID0gJyc7XG4gIHRoaXMucmVhZCA9IDA7XG59O1xuXG4vKipcbiAqIFNob3J0ZW5zIHRoaXMgYnVmZmVyIGJ5IHRyaW1pbmcgYnl0ZXMgb2ZmIG9mIHRoZSBlbmQgb2YgdGhpcyBidWZmZXIuXG4gKlxuICogQHBhcmFtIGNvdW50IHRoZSBudW1iZXIgb2YgYnl0ZXMgdG8gdHJpbSBvZmYuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUudHJ1bmNhdGUgPSBmdW5jdGlvbihjb3VudCkge1xuICB2YXIgbGVuID0gTWF0aC5tYXgoMCwgdGhpcy5sZW5ndGgoKSAtIGNvdW50KTtcbiAgdGhpcy5kYXRhID0gdGhpcy5kYXRhLnN1YnN0cih0aGlzLnJlYWQsIGxlbik7XG4gIHRoaXMucmVhZCA9IDA7XG59O1xuXG4vKipcbiAqIENvbnZlcnRzIHRoaXMgYnVmZmVyIHRvIGEgaGV4YWRlY2ltYWwgc3RyaW5nLlxuICpcbiAqIEByZXR1cm4gYSBoZXhhZGVjaW1hbCBzdHJpbmcuXG4gKi9cbnV0aWwuQnl0ZUJ1ZmZlci5wcm90b3R5cGUudG9IZXggPSBmdW5jdGlvbigpIHtcbiAgdmFyIHJ2YWwgPSAnJztcbiAgZm9yKHZhciBpID0gdGhpcy5yZWFkOyBpIDwgdGhpcy5kYXRhLmxlbmd0aDsgKytpKSB7XG4gICAgdmFyIGIgPSB0aGlzLmRhdGEuY2hhckNvZGVBdChpKTtcbiAgICBpZihiIDwgMTYpIHtcbiAgICAgIHJ2YWwgKz0gJzAnO1xuICAgIH1cbiAgICBydmFsICs9IGIudG9TdHJpbmcoMTYpO1xuICB9XG4gIHJldHVybiBydmFsO1xufTtcblxuLyoqXG4gKiBDb252ZXJ0cyB0aGlzIGJ1ZmZlciB0byBhIFVURi0xNiBzdHJpbmcgKHN0YW5kYXJkIEphdmFTY3JpcHQgc3RyaW5nKS5cbiAqXG4gKiBAcmV0dXJuIGEgVVRGLTE2IHN0cmluZy5cbiAqL1xudXRpbC5CeXRlQnVmZmVyLnByb3RvdHlwZS50b1N0cmluZyA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gdXRpbC5kZWNvZGVVdGY4KHRoaXMuYnl0ZXMoKSk7XG59O1xuLyoqXG4gKiB1dGlsLmNyZWF0ZUJ1ZmZlclxuICovXG5cbnV0aWwuY3JlYXRlQnVmZmVyID0gZnVuY3Rpb24oaW5wdXQsIGVuY29kaW5nKSB7XG4gIGVuY29kaW5nID0gZW5jb2RpbmcgfHwgJ3Jhdyc7XG4gIGlmKGlucHV0ICE9PSB1bmRlZmluZWQgJiYgZW5jb2RpbmcgPT09ICd1dGY4Jykge1xuICAgIGlucHV0ID0gdXRpbC5lbmNvZGVVdGY4KGlucHV0KTtcbiAgfVxuICByZXR1cm4gbmV3IHV0aWwuQnl0ZUJ1ZmZlcihpbnB1dCk7XG59O1xuXG4vKipcbiAqIHBybmcuY3JlYXRlXG4gKi9cblxudmFyIHBybmcgPSBmb3JnZS5wcm5nID0ge307XG52YXIgY3J5cHRvID0gbnVsbDtcblxucHJuZy5jcmVhdGUgPSBmdW5jdGlvbihwbHVnaW4pIHtcbiAgdmFyIGN0eCA9IHtcbiAgICBwbHVnaW46IHBsdWdpbixcbiAgICBrZXk6IG51bGwsXG4gICAgc2VlZDogbnVsbCxcbiAgICB0aW1lOiBudWxsLFxuICAgIC8vIG51bWJlciBvZiByZXNlZWRzIHNvIGZhclxuICAgIHJlc2VlZHM6IDAsXG4gICAgLy8gYW1vdW50IG9mIGRhdGEgZ2VuZXJhdGVkIHNvIGZhclxuICAgIGdlbmVyYXRlZDogMFxuICB9O1xuXG4gIC8vIGNyZWF0ZSAzMiBlbnRyb3B5IHBvb2xzIChlYWNoIGlzIGEgbWVzc2FnZSBkaWdlc3QpXG4gIHZhciBtZCA9IHBsdWdpbi5tZDtcbiAgdmFyIHBvb2xzID0gbmV3IEFycmF5KDMyKTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IDMyOyArK2kpIHtcbiAgICBwb29sc1tpXSA9IG1kLmNyZWF0ZSgpO1xuICB9XG4gIGN0eC5wb29scyA9IHBvb2xzO1xuXG4gIC8vIGVudHJvcHkgcG9vbHMgYXJlIHdyaXR0ZW4gdG8gY3ljbGljYWxseSwgc3RhcnRpbmcgYXQgaW5kZXggMFxuICBjdHgucG9vbCA9IDA7XG5cbiAgLyoqXG4gICAqIEdlbmVyYXRlcyByYW5kb20gYnl0ZXMuIFRoZSBieXRlcyBtYXkgYmUgZ2VuZXJhdGVkIHN5bmNocm9ub3VzbHkgb3JcbiAgICogYXN5bmNocm9ub3VzbHkuIFdlYiB3b3JrZXJzIG11c3QgdXNlIHRoZSBhc3luY2hyb25vdXMgaW50ZXJmYWNlIG9yXG4gICAqIGVsc2UgdGhlIGJlaGF2aW9yIGlzIHVuZGVmaW5lZC5cbiAgICpcbiAgICogQHBhcmFtIGNvdW50IHRoZSBudW1iZXIgb2YgcmFuZG9tIGJ5dGVzIHRvIGdlbmVyYXRlLlxuICAgKiBAcGFyYW0gW2NhbGxiYWNrKGVyciwgYnl0ZXMpXSBjYWxsZWQgb25jZSB0aGUgb3BlcmF0aW9uIGNvbXBsZXRlcy5cbiAgICpcbiAgICogQHJldHVybiBjb3VudCByYW5kb20gYnl0ZXMgYXMgYSBzdHJpbmcuXG4gICAqL1xuICBjdHguZ2VuZXJhdGUgPSBmdW5jdGlvbihjb3VudCwgY2FsbGJhY2spIHtcbiAgICAvLyBkbyBzeW5jaHJvbm91c2x5XG4gICAgaWYoIWNhbGxiYWNrKSB7XG4gICAgICByZXR1cm4gY3R4LmdlbmVyYXRlU3luYyhjb3VudCk7XG4gICAgfVxuXG4gICAgLy8gc2ltcGxlIGdlbmVyYXRvciB1c2luZyBjb3VudGVyLWJhc2VkIENCQ1xuICAgIHZhciBjaXBoZXIgPSBjdHgucGx1Z2luLmNpcGhlcjtcbiAgICB2YXIgaW5jcmVtZW50ID0gY3R4LnBsdWdpbi5pbmNyZW1lbnQ7XG4gICAgdmFyIGZvcm1hdEtleSA9IGN0eC5wbHVnaW4uZm9ybWF0S2V5O1xuICAgIHZhciBmb3JtYXRTZWVkID0gY3R4LnBsdWdpbi5mb3JtYXRTZWVkO1xuICAgIHZhciBiID0gZm9yZ2UudXRpbC5jcmVhdGVCdWZmZXIoKTtcblxuICAgIGdlbmVyYXRlKCk7XG5cbiAgICBmdW5jdGlvbiBnZW5lcmF0ZShlcnIpIHtcbiAgICAgIGlmKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cblxuICAgICAgLy8gc3VmZmljaWVudCBieXRlcyBnZW5lcmF0ZWRcbiAgICAgIGlmKGIubGVuZ3RoKCkgPj0gY291bnQpIHtcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKG51bGwsIGIuZ2V0Qnl0ZXMoY291bnQpKTtcbiAgICAgIH1cblxuICAgICAgLy8gaWYgYW1vdW50IG9mIGRhdGEgZ2VuZXJhdGVkIGlzIGdyZWF0ZXIgdGhhbiAxIE1pQiwgdHJpZ2dlciByZXNlZWRcbiAgICAgIGlmKGN0eC5nZW5lcmF0ZWQgPj0gMTA0ODU3Nikge1xuICAgICAgICAvLyBvbmx5IGRvIHJlc2VlZCBhdCBtb3N0IGV2ZXJ5IDEwMCBtc1xuICAgICAgICB2YXIgbm93ID0gK25ldyBEYXRlKCk7XG4gICAgICAgIGlmKGN0eC50aW1lID09PSBudWxsIHx8IChub3cgLSBjdHgudGltZSA+IDEwMCkpIHtcbiAgICAgICAgICBjdHgua2V5ID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZihjdHgua2V5ID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBfcmVzZWVkKGdlbmVyYXRlKTtcbiAgICAgIH1cblxuICAgICAgLy8gZ2VuZXJhdGUgdGhlIHJhbmRvbSBieXRlc1xuICAgICAgdmFyIGJ5dGVzID0gY2lwaGVyKGN0eC5rZXksIGN0eC5zZWVkKTtcbiAgICAgIGN0eC5nZW5lcmF0ZWQgKz0gYnl0ZXMubGVuZ3RoO1xuICAgICAgYi5wdXRCeXRlcyhieXRlcyk7XG5cbiAgICAgIC8vIGdlbmVyYXRlIGJ5dGVzIGZvciBhIG5ldyBrZXkgYW5kIHNlZWRcbiAgICAgIGN0eC5rZXkgPSBmb3JtYXRLZXkoY2lwaGVyKGN0eC5rZXksIGluY3JlbWVudChjdHguc2VlZCkpKTtcbiAgICAgIGN0eC5zZWVkID0gZm9ybWF0U2VlZChjaXBoZXIoY3R4LmtleSwgY3R4LnNlZWQpKTtcblxuICAgICAgZm9yZ2UudXRpbC5zZXRJbW1lZGlhdGUoZ2VuZXJhdGUpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogR2VuZXJhdGVzIHJhbmRvbSBieXRlcyBzeW5jaHJvbm91c2x5LlxuICAgKlxuICAgKiBAcGFyYW0gY291bnQgdGhlIG51bWJlciBvZiByYW5kb20gYnl0ZXMgdG8gZ2VuZXJhdGUuXG4gICAqXG4gICAqIEByZXR1cm4gY291bnQgcmFuZG9tIGJ5dGVzIGFzIGEgc3RyaW5nLlxuICAgKi9cbiAgY3R4LmdlbmVyYXRlU3luYyA9IGZ1bmN0aW9uKGNvdW50KSB7XG4gICAgLy8gc2ltcGxlIGdlbmVyYXRvciB1c2luZyBjb3VudGVyLWJhc2VkIENCQ1xuICAgIHZhciBjaXBoZXIgPSBjdHgucGx1Z2luLmNpcGhlcjtcbiAgICB2YXIgaW5jcmVtZW50ID0gY3R4LnBsdWdpbi5pbmNyZW1lbnQ7XG4gICAgdmFyIGZvcm1hdEtleSA9IGN0eC5wbHVnaW4uZm9ybWF0S2V5O1xuICAgIHZhciBmb3JtYXRTZWVkID0gY3R4LnBsdWdpbi5mb3JtYXRTZWVkO1xuICAgIHZhciBiID0gZm9yZ2UudXRpbC5jcmVhdGVCdWZmZXIoKTtcbiAgICB3aGlsZShiLmxlbmd0aCgpIDwgY291bnQpIHtcbiAgICAgIC8vIGlmIGFtb3VudCBvZiBkYXRhIGdlbmVyYXRlZCBpcyBncmVhdGVyIHRoYW4gMSBNaUIsIHRyaWdnZXIgcmVzZWVkXG4gICAgICBpZihjdHguZ2VuZXJhdGVkID49IDEwNDg1NzYpIHtcbiAgICAgICAgLy8gb25seSBkbyByZXNlZWQgYXQgbW9zdCBldmVyeSAxMDAgbXNcbiAgICAgICAgdmFyIG5vdyA9ICtuZXcgRGF0ZSgpO1xuICAgICAgICBpZihjdHgudGltZSA9PT0gbnVsbCB8fCAobm93IC0gY3R4LnRpbWUgPiAxMDApKSB7XG4gICAgICAgICAgY3R4LmtleSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYoY3R4LmtleSA9PT0gbnVsbCkge1xuICAgICAgICBfcmVzZWVkU3luYygpO1xuICAgICAgfVxuXG4gICAgICAvLyBnZW5lcmF0ZSB0aGUgcmFuZG9tIGJ5dGVzXG4gICAgICB2YXIgYnl0ZXMgPSBjaXBoZXIoY3R4LmtleSwgY3R4LnNlZWQpO1xuICAgICAgY3R4LmdlbmVyYXRlZCArPSBieXRlcy5sZW5ndGg7XG4gICAgICBiLnB1dEJ5dGVzKGJ5dGVzKTtcblxuICAgICAgLy8gZ2VuZXJhdGUgYnl0ZXMgZm9yIGEgbmV3IGtleSBhbmQgc2VlZFxuICAgICAgY3R4LmtleSA9IGZvcm1hdEtleShjaXBoZXIoY3R4LmtleSwgaW5jcmVtZW50KGN0eC5zZWVkKSkpO1xuICAgICAgY3R4LnNlZWQgPSBmb3JtYXRTZWVkKGNpcGhlcihjdHgua2V5LCBjdHguc2VlZCkpO1xuICAgIH1cblxuICAgIHJldHVybiBiLmdldEJ5dGVzKGNvdW50KTtcbiAgfTtcblxuICAvKipcbiAgICogUHJpdmF0ZSBmdW5jdGlvbiB0aGF0IGFzeW5jaHJvbm91c2x5IHJlc2VlZHMgYSBnZW5lcmF0b3IuXG4gICAqXG4gICAqIEBwYXJhbSBjYWxsYmFjayhlcnIpIGNhbGxlZCBvbmNlIHRoZSBvcGVyYXRpb24gY29tcGxldGVzLlxuICAgKi9cbiAgZnVuY3Rpb24gX3Jlc2VlZChjYWxsYmFjaykge1xuICAgIGlmKGN0eC5wb29sc1swXS5tZXNzYWdlTGVuZ3RoID49IDMyKSB7XG4gICAgICBfc2VlZCgpO1xuICAgICAgcmV0dXJuIGNhbGxiYWNrKCk7XG4gICAgfVxuICAgIC8vIG5vdCBlbm91Z2ggc2VlZCBkYXRhLi4uXG4gICAgdmFyIG5lZWRlZCA9ICgzMiAtIGN0eC5wb29sc1swXS5tZXNzYWdlTGVuZ3RoKSA8PCA1O1xuICAgIGN0eC5zZWVkRmlsZShuZWVkZWQsIGZ1bmN0aW9uKGVyciwgYnl0ZXMpIHtcbiAgICAgIGlmKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICAgIGN0eC5jb2xsZWN0KGJ5dGVzKTtcbiAgICAgIF9zZWVkKCk7XG4gICAgICBjYWxsYmFjaygpO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIFByaXZhdGUgZnVuY3Rpb24gdGhhdCBzeW5jaHJvbm91c2x5IHJlc2VlZHMgYSBnZW5lcmF0b3IuXG4gICAqL1xuICBmdW5jdGlvbiBfcmVzZWVkU3luYygpIHtcbiAgICBpZihjdHgucG9vbHNbMF0ubWVzc2FnZUxlbmd0aCA+PSAzMikge1xuICAgICAgcmV0dXJuIF9zZWVkKCk7XG4gICAgfVxuICAgIC8vIG5vdCBlbm91Z2ggc2VlZCBkYXRhLi4uXG4gICAgdmFyIG5lZWRlZCA9ICgzMiAtIGN0eC5wb29sc1swXS5tZXNzYWdlTGVuZ3RoKSA8PCA1O1xuICAgIGN0eC5jb2xsZWN0KGN0eC5zZWVkRmlsZVN5bmMobmVlZGVkKSk7XG4gICAgX3NlZWQoKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcml2YXRlIGZ1bmN0aW9uIHRoYXQgc2VlZHMgYSBnZW5lcmF0b3Igb25jZSBlbm91Z2ggYnl0ZXMgYXJlIGF2YWlsYWJsZS5cbiAgICovXG4gIGZ1bmN0aW9uIF9zZWVkKCkge1xuICAgIC8vIGNyZWF0ZSBhIFNIQS0xIG1lc3NhZ2UgZGlnZXN0XG4gICAgdmFyIG1kID0gZm9yZ2UubWQuc2hhMS5jcmVhdGUoKTtcblxuICAgIC8vIGRpZ2VzdCBwb29sIDAncyBlbnRyb3B5IGFuZCByZXN0YXJ0IGl0XG4gICAgbWQudXBkYXRlKGN0eC5wb29sc1swXS5kaWdlc3QoKS5nZXRCeXRlcygpKTtcbiAgICBjdHgucG9vbHNbMF0uc3RhcnQoKTtcblxuICAgIC8vIGRpZ2VzdCB0aGUgZW50cm9weSBvZiBvdGhlciBwb29scyB3aG9zZSBpbmRleCBrIG1lZXQgdGhlXG4gICAgLy8gY29uZGl0aW9uICcyXmsgbW9kIG4gPT0gMCcgd2hlcmUgbiBpcyB0aGUgbnVtYmVyIG9mIHJlc2VlZHNcbiAgICB2YXIgayA9IDE7XG4gICAgZm9yKHZhciBpID0gMTsgaSA8IDMyOyArK2kpIHtcbiAgICAgIC8vIHByZXZlbnQgc2lnbmVkIG51bWJlcnMgZnJvbSBiZWluZyB1c2VkXG4gICAgICBrID0gKGsgPT09IDMxKSA/IDB4ODAwMDAwMDAgOiAoayA8PCAyKTtcbiAgICAgIGlmKGsgJSBjdHgucmVzZWVkcyA9PT0gMCkge1xuICAgICAgICBtZC51cGRhdGUoY3R4LnBvb2xzW2ldLmRpZ2VzdCgpLmdldEJ5dGVzKCkpO1xuICAgICAgICBjdHgucG9vbHNbaV0uc3RhcnQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBnZXQgZGlnZXN0IGZvciBrZXkgYnl0ZXMgYW5kIGl0ZXJhdGUgYWdhaW4gZm9yIHNlZWQgYnl0ZXNcbiAgICB2YXIga2V5Qnl0ZXMgPSBtZC5kaWdlc3QoKS5nZXRCeXRlcygpO1xuICAgIG1kLnN0YXJ0KCk7XG4gICAgbWQudXBkYXRlKGtleUJ5dGVzKTtcbiAgICB2YXIgc2VlZEJ5dGVzID0gbWQuZGlnZXN0KCkuZ2V0Qnl0ZXMoKTtcblxuICAgIC8vIHVwZGF0ZVxuICAgIGN0eC5rZXkgPSBjdHgucGx1Z2luLmZvcm1hdEtleShrZXlCeXRlcyk7XG4gICAgY3R4LnNlZWQgPSBjdHgucGx1Z2luLmZvcm1hdFNlZWQoc2VlZEJ5dGVzKTtcbiAgICArK2N0eC5yZXNlZWRzO1xuICAgIGN0eC5nZW5lcmF0ZWQgPSAwO1xuICAgIGN0eC50aW1lID0gK25ldyBEYXRlKCk7XG4gIH1cblxuICAvKipcbiAgICogVGhlIGJ1aWx0LWluIGRlZmF1bHQgc2VlZEZpbGUuIFRoaXMgc2VlZEZpbGUgaXMgdXNlZCB3aGVuIGVudHJvcHlcbiAgICogaXMgbmVlZGVkIGltbWVkaWF0ZWx5LlxuICAgKlxuICAgKiBAcGFyYW0gbmVlZGVkIHRoZSBudW1iZXIgb2YgYnl0ZXMgdGhhdCBhcmUgbmVlZGVkLlxuICAgKlxuICAgKiBAcmV0dXJuIHRoZSByYW5kb20gYnl0ZXMuXG4gICAqL1xuICBmdW5jdGlvbiBkZWZhdWx0U2VlZEZpbGUobmVlZGVkKSB7XG4gICAgLy8gdXNlIHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzIHN0cm9uZyBzb3VyY2Ugb2YgZW50cm9weSBpZlxuICAgIC8vIGF2YWlsYWJsZVxuICAgIHZhciBiID0gZm9yZ2UudXRpbC5jcmVhdGVCdWZmZXIoKTtcbiAgICBpZih0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJyAmJlxuICAgICAgd2luZG93LmNyeXB0byAmJiB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcykge1xuICAgICAgdmFyIGVudHJvcHkgPSBuZXcgVWludDMyQXJyYXkobmVlZGVkIC8gNCk7XG4gICAgICB0cnkge1xuICAgICAgICB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhlbnRyb3B5KTtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGVudHJvcHkubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICBiLnB1dEludDMyKGVudHJvcHlbaV0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjYXRjaChlKSB7XG4gICAgICAgIC8qIE1vemlsbGEgY2xhaW1zIGdldFJhbmRvbVZhbHVlcyBjYW4gdGhyb3cgUXVvdGFFeGNlZWRlZEVycm9yLCBzb1xuICAgICAgICAgaWdub3JlIGVycm9ycy4gSW4gdGhpcyBjYXNlLCB3ZWFrIGVudHJvcHkgd2lsbCBiZSBhZGRlZCwgYnV0XG4gICAgICAgICBob3BlZnVsbHkgdGhpcyBuZXZlciBoYXBwZW5zLlxuICAgICAgICAgaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9ET00vd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXNcbiAgICAgICAgIEhvd2V2ZXIgSSd2ZSBuZXZlciBvYnNlcnZlZCB0aGlzIGV4Y2VwdGlvbiAtLUBldmFuaiAqL1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGJlIHNhZCBhbmQgYWRkIHNvbWUgd2VhayByYW5kb20gZGF0YVxuICAgIGlmKGIubGVuZ3RoKCkgPCBuZWVkZWQpIHtcbiAgICAgIC8qIERyYXdzIGZyb20gUGFyay1NaWxsZXIgXCJtaW5pbWFsIHN0YW5kYXJkXCIgMzEgYml0IFBSTkcsXG4gICAgICBpbXBsZW1lbnRlZCB3aXRoIERhdmlkIEcuIENhcnRhJ3Mgb3B0aW1pemF0aW9uOiB3aXRoIDMyIGJpdCBtYXRoXG4gICAgICBhbmQgd2l0aG91dCBkaXZpc2lvbiAoUHVibGljIERvbWFpbikuICovXG4gICAgICB2YXIgaGksIGxvLCBuZXh0O1xuICAgICAgdmFyIHNlZWQgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAweEZGRkYpO1xuICAgICAgd2hpbGUoYi5sZW5ndGgoKSA8IG5lZWRlZCkge1xuICAgICAgICBsbyA9IDE2ODA3ICogKHNlZWQgJiAweEZGRkYpO1xuICAgICAgICBoaSA9IDE2ODA3ICogKHNlZWQgPj4gMTYpO1xuICAgICAgICBsbyArPSAoaGkgJiAweDdGRkYpIDw8IDE2O1xuICAgICAgICBsbyArPSBoaSA+PiAxNTtcbiAgICAgICAgbG8gPSAobG8gJiAweDdGRkZGRkZGKSArIChsbyA+PiAzMSk7XG4gICAgICAgIHNlZWQgPSBsbyAmIDB4RkZGRkZGRkY7XG5cbiAgICAgICAgLy8gY29uc3VtZSBsb3dlciAzIGJ5dGVzIG9mIHNlZWRcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IDM7ICsraSkge1xuICAgICAgICAgIC8vIHRocm93IGluIG1vcmUgcHNldWRvIHJhbmRvbVxuICAgICAgICAgIG5leHQgPSBzZWVkID4+PiAoaSA8PCAzKTtcbiAgICAgICAgICBuZXh0IF49IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDB4RkYpO1xuICAgICAgICAgIGIucHV0Qnl0ZShTdHJpbmcuZnJvbUNoYXJDb2RlKG5leHQgJiAweEZGKSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gYi5nZXRCeXRlcygpO1xuICB9XG4gIC8vIGluaXRpYWxpemUgc2VlZCBmaWxlIEFQSXNcbiAgaWYoY3J5cHRvKSB7XG4gICAgLy8gdXNlIG5vZGVqcyBhc3luYyBBUElcbiAgICBjdHguc2VlZEZpbGUgPSBmdW5jdGlvbihuZWVkZWQsIGNhbGxiYWNrKSB7XG4gICAgICBjcnlwdG8ucmFuZG9tQnl0ZXMobmVlZGVkLCBmdW5jdGlvbihlcnIsIGJ5dGVzKSB7XG4gICAgICAgIGlmKGVycikge1xuICAgICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgICB9XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIGJ5dGVzLnRvU3RyaW5nKCkpO1xuICAgICAgfSk7XG4gICAgfTtcbiAgICAvLyB1c2Ugbm9kZWpzIHN5bmMgQVBJXG4gICAgY3R4LnNlZWRGaWxlU3luYyA9IGZ1bmN0aW9uKG5lZWRlZCkge1xuICAgICAgcmV0dXJuIGNyeXB0by5yYW5kb21CeXRlcyhuZWVkZWQpLnRvU3RyaW5nKCk7XG4gICAgfTtcbiAgfVxuICBlbHNlIHtcbiAgICBjdHguc2VlZEZpbGUgPSBmdW5jdGlvbihuZWVkZWQsIGNhbGxiYWNrKSB7XG4gICAgICB0cnkge1xuICAgICAgICBjYWxsYmFjayhudWxsLCBkZWZhdWx0U2VlZEZpbGUobmVlZGVkKSk7XG4gICAgICB9XG4gICAgICBjYXRjaChlKSB7XG4gICAgICAgIGNhbGxiYWNrKGUpO1xuICAgICAgfVxuICAgIH07XG4gICAgY3R4LnNlZWRGaWxlU3luYyA9IGRlZmF1bHRTZWVkRmlsZTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBZGRzIGVudHJvcHkgdG8gYSBwcm5nIGN0eCdzIGFjY3VtdWxhdG9yLlxuICAgKlxuICAgKiBAcGFyYW0gYnl0ZXMgdGhlIGJ5dGVzIG9mIGVudHJvcHkgYXMgYSBzdHJpbmcuXG4gICAqL1xuICBjdHguY29sbGVjdCA9IGZ1bmN0aW9uKGJ5dGVzKSB7XG4gICAgLy8gaXRlcmF0ZSBvdmVyIHBvb2xzIGRpc3RyaWJ1dGluZyBlbnRyb3B5IGN5Y2xpY2FsbHlcbiAgICB2YXIgY291bnQgPSBieXRlcy5sZW5ndGg7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGNvdW50OyArK2kpIHtcbiAgICAgIGN0eC5wb29sc1tjdHgucG9vbF0udXBkYXRlKGJ5dGVzLnN1YnN0cihpLCAxKSk7XG4gICAgICBjdHgucG9vbCA9IChjdHgucG9vbCA9PT0gMzEpID8gMCA6IGN0eC5wb29sICsgMTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIENvbGxlY3RzIGFuIGludGVnZXIgb2YgbiBiaXRzLlxuICAgKlxuICAgKiBAcGFyYW0gaSB0aGUgaW50ZWdlciBlbnRyb3B5LlxuICAgKiBAcGFyYW0gbiB0aGUgbnVtYmVyIG9mIGJpdHMgaW4gdGhlIGludGVnZXIuXG4gICAqL1xuICBjdHguY29sbGVjdEludCA9IGZ1bmN0aW9uKGksIG4pIHtcbiAgICB2YXIgYnl0ZXMgPSAnJztcbiAgICBmb3IodmFyIHggPSAwOyB4IDwgbjsgeCArPSA4KSB7XG4gICAgICBieXRlcyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKChpID4+IHgpICYgMHhGRik7XG4gICAgfVxuICAgIGN0eC5jb2xsZWN0KGJ5dGVzKTtcbiAgfTtcblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgV2ViIFdvcmtlciB0byByZWNlaXZlIGltbWVkaWF0ZSBlbnRyb3B5IGZyb20gdGhlIG1haW4gdGhyZWFkLlxuICAgKiBUaGlzIG1ldGhvZCBpcyByZXF1aXJlZCB1bnRpbCBXZWIgV29ya2VycyBjYW4gYWNjZXNzIHRoZSBuYXRpdmUgY3J5cHRvXG4gICAqIEFQSS4gVGhpcyBtZXRob2Qgc2hvdWxkIGJlIGNhbGxlZCB0d2ljZSBmb3IgZWFjaCBjcmVhdGVkIHdvcmtlciwgb25jZSBpblxuICAgKiB0aGUgbWFpbiB0aHJlYWQsIGFuZCBvbmNlIGluIHRoZSB3b3JrZXIgaXRzZWxmLlxuICAgKlxuICAgKiBAcGFyYW0gd29ya2VyIHRoZSB3b3JrZXIgdG8gcmVnaXN0ZXIuXG4gICAqL1xuICBjdHgucmVnaXN0ZXJXb3JrZXIgPSBmdW5jdGlvbih3b3JrZXIpIHtcbiAgICAvLyB3b3JrZXIgcmVjZWl2ZXMgcmFuZG9tIGJ5dGVzXG4gICAgaWYod29ya2VyID09PSBzZWxmKSB7XG4gICAgICBjdHguc2VlZEZpbGUgPSBmdW5jdGlvbihuZWVkZWQsIGNhbGxiYWNrKSB7XG4gICAgICAgIGZ1bmN0aW9uIGxpc3RlbmVyKGUpIHtcbiAgICAgICAgICB2YXIgZGF0YSA9IGUuZGF0YTtcbiAgICAgICAgICBpZihkYXRhLmZvcmdlICYmIGRhdGEuZm9yZ2UucHJuZykge1xuICAgICAgICAgICAgc2VsZi5yZW1vdmVFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgbGlzdGVuZXIpO1xuICAgICAgICAgICAgY2FsbGJhY2soZGF0YS5mb3JnZS5wcm5nLmVyciwgZGF0YS5mb3JnZS5wcm5nLmJ5dGVzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc2VsZi5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgbGlzdGVuZXIpO1xuICAgICAgICBzZWxmLnBvc3RNZXNzYWdlKHtmb3JnZToge3Bybmc6IHtuZWVkZWQ6IG5lZWRlZH19fSk7XG4gICAgICB9O1xuICAgIH1cbiAgICAvLyBtYWluIHRocmVhZCBzZW5kcyByYW5kb20gYnl0ZXMgdXBvbiByZXF1ZXN0XG4gICAgZWxzZSB7XG4gICAgICBmdW5jdGlvbiBsaXN0ZW5lcihlKSB7XG4gICAgICAgIHZhciBkYXRhID0gZS5kYXRhO1xuICAgICAgICBpZihkYXRhLmZvcmdlICYmIGRhdGEuZm9yZ2UucHJuZykge1xuICAgICAgICAgIGN0eC5zZWVkRmlsZShkYXRhLmZvcmdlLnBybmcubmVlZGVkLCBmdW5jdGlvbihlcnIsIGJ5dGVzKSB7XG4gICAgICAgICAgICB3b3JrZXIucG9zdE1lc3NhZ2Uoe2ZvcmdlOiB7cHJuZzoge2VycjogZXJyLCBieXRlczogYnl0ZXN9fX0pO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBUT0RPOiBkbyB3ZSBuZWVkIHRvIHJlbW92ZSB0aGUgZXZlbnQgbGlzdGVuZXIgd2hlbiB0aGUgd29ya2VyIGRpZXM/XG4gICAgICB3b3JrZXIuYWRkRXZlbnRMaXN0ZW5lcignbWVzc2FnZScsIGxpc3RlbmVyKTtcbiAgICB9XG4gIH07XG5cbiAgcmV0dXJuIGN0eDtcbn07XG5cbi8qKlxuICogYWVzLl9leHBlbmRLZXlcbiAqL1xuXG52YXIgaW5pdCA9IGZhbHNlOyAvLyBub3QgeWV0IGluaXRpYWxpemVkXG52YXIgTmIgPSA0OyAgICAgICAvLyBudW1iZXIgb2Ygd29yZHMgY29tcHJpc2luZyB0aGUgc3RhdGUgKEFFUyA9IDQpXG52YXIgc2JveDsgICAgICAgICAvLyBub24tbGluZWFyIHN1YnN0aXR1dGlvbiB0YWJsZSB1c2VkIGluIGtleSBleHBhbnNpb25cbnZhciBpc2JveDsgICAgICAgIC8vIGludmVyc2lvbiBvZiBzYm94XG52YXIgcmNvbjsgICAgICAgICAvLyByb3VuZCBjb25zdGFudCB3b3JkIGFycmF5XG52YXIgbWl4OyAgICAgICAgICAvLyBtaXgtY29sdW1ucyB0YWJsZVxudmFyIGltaXg7ICAgICAgICAgLy8gaW52ZXJzZSBtaXgtY29sdW1ucyB0YWJsZVxuXG52YXIgaW5pdGlhbGl6ZSA9IGZ1bmN0aW9uKCkge1xuICBpbml0ID0gdHJ1ZTtcblxuICAvKiBQb3B1bGF0ZSB0aGUgUmNvbiB0YWJsZS4gVGhlc2UgYXJlIHRoZSB2YWx1ZXMgZ2l2ZW4gYnlcbiAgICBbeF4oaS0xKSx7MDB9LHswMH0sezAwfV0gd2hlcmUgeF4oaS0xKSBhcmUgcG93ZXJzIG9mIHggKGFuZCB4ID0gMHgwMilcbiAgICBpbiB0aGUgZmllbGQgb2YgR0YoMl44KSwgd2hlcmUgaSBzdGFydHMgYXQgMS5cblxuICAgIHJjb25bMF0gPSBbMHgwMCwgMHgwMCwgMHgwMCwgMHgwMF1cbiAgICByY29uWzFdID0gWzB4MDEsIDB4MDAsIDB4MDAsIDB4MDBdIDJeKDEtMSkgPSAyXjAgPSAxXG4gICAgcmNvblsyXSA9IFsweDAyLCAweDAwLCAweDAwLCAweDAwXSAyXigyLTEpID0gMl4xID0gMlxuICAgIC4uLlxuICAgIHJjb25bOV0gID0gWzB4MUIsIDB4MDAsIDB4MDAsIDB4MDBdIDJeKDktMSkgID0gMl44ID0gMHgxQlxuICAgIHJjb25bMTBdID0gWzB4MzYsIDB4MDAsIDB4MDAsIDB4MDBdIDJeKDEwLTEpID0gMl45ID0gMHgzNlxuXG4gICAgV2Ugb25seSBzdG9yZSB0aGUgZmlyc3QgYnl0ZSBiZWNhdXNlIGl0IGlzIHRoZSBvbmx5IG9uZSB1c2VkLlxuICAqL1xuICByY29uID0gWzB4MDAsIDB4MDEsIDB4MDIsIDB4MDQsIDB4MDgsIDB4MTAsIDB4MjAsIDB4NDAsIDB4ODAsIDB4MUIsIDB4MzZdO1xuXG4gIC8vIGNvbXB1dGUgeHRpbWUgdGFibGUgd2hpY2ggbWFwcyBpIG9udG8gR0YoaSwgMHgwMilcbiAgdmFyIHh0aW1lID0gbmV3IEFycmF5KDI1Nik7XG4gIGZvcih2YXIgaSA9IDA7IGkgPCAxMjg7ICsraSkge1xuICAgIHh0aW1lW2ldID0gaSA8PCAxO1xuICAgIHh0aW1lW2kgKyAxMjhdID0gKGkgKyAxMjgpIDw8IDEgXiAweDExQjtcbiAgfVxuXG4gIC8vIGNvbXB1dGUgYWxsIG90aGVyIHRhYmxlc1xuICBzYm94ID0gbmV3IEFycmF5KDI1Nik7XG4gIGlzYm94ID0gbmV3IEFycmF5KDI1Nik7XG4gIG1peCA9IG5ldyBBcnJheSg0KTtcbiAgaW1peCA9IG5ldyBBcnJheSg0KTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IDQ7ICsraSkge1xuICAgIG1peFtpXSA9IG5ldyBBcnJheSgyNTYpO1xuICAgIGltaXhbaV0gPSBuZXcgQXJyYXkoMjU2KTtcbiAgfVxuICB2YXIgZSA9IDAsIGVpID0gMCwgZTIsIGU0LCBlOCwgc3gsIHN4MiwgbWUsIGltZTtcbiAgZm9yKHZhciBpID0gMDsgaSA8IDI1NjsgKytpKSB7XG4gICAgLyogV2UgbmVlZCB0byBnZW5lcmF0ZSB0aGUgU3ViQnl0ZXMoKSBzYm94IGFuZCBpc2JveCB0YWJsZXMgc28gdGhhdFxuICAgICAgd2UgY2FuIHBlcmZvcm0gYnl0ZSBzdWJzdGl0dXRpb25zLiBUaGlzIHJlcXVpcmVzIHVzIHRvIHRyYXZlcnNlXG4gICAgICBhbGwgb2YgdGhlIGVsZW1lbnRzIGluIEdGLCBmaW5kIHRoZWlyIG11bHRpcGxpY2F0aXZlIGludmVyc2VzLFxuICAgICAgYW5kIGFwcGx5IHRvIGVhY2ggdGhlIGZvbGxvd2luZyBhZmZpbmUgdHJhbnNmb3JtYXRpb246XG5cbiAgICAgIGJpJyA9IGJpIF4gYihpICsgNCkgbW9kIDggXiBiKGkgKyA1KSBtb2QgOCBeIGIoaSArIDYpIG1vZCA4IF5cbiAgICAgICAgICAgIGIoaSArIDcpIG1vZCA4IF4gY2lcbiAgICAgIGZvciAwIDw9IGkgPCA4LCB3aGVyZSBiaSBpcyB0aGUgaXRoIGJpdCBvZiB0aGUgYnl0ZSwgYW5kIGNpIGlzIHRoZVxuICAgICAgaXRoIGJpdCBvZiBhIGJ5dGUgYyB3aXRoIHRoZSB2YWx1ZSB7NjN9IG9yIHswMTEwMDAxMX0uXG5cbiAgICAgIEl0IGlzIHBvc3NpYmxlIHRvIHRyYXZlcnNlIGV2ZXJ5IHBvc3NpYmxlIHZhbHVlIGluIGEgR2Fsb2lzIGZpZWxkXG4gICAgICB1c2luZyB3aGF0IGlzIHJlZmVycmVkIHRvIGFzIGEgJ2dlbmVyYXRvcicuIFRoZXJlIGFyZSBtYW55XG4gICAgICBnZW5lcmF0b3JzICgxMjggb3V0IG9mIDI1Nik6IDMsNSw2LDksMTEsODIgdG8gbmFtZSBhIGZldy4gVG8gZnVsbHlcbiAgICAgIHRyYXZlcnNlIEdGIHdlIGl0ZXJhdGUgMjU1IHRpbWVzLCBtdWx0aXBseWluZyBieSBvdXIgZ2VuZXJhdG9yXG4gICAgICBlYWNoIHRpbWUuXG5cbiAgICAgIE9uIGVhY2ggaXRlcmF0aW9uIHdlIGNhbiBkZXRlcm1pbmUgdGhlIG11bHRpcGxpY2F0aXZlIGludmVyc2UgZm9yXG4gICAgICB0aGUgY3VycmVudCBlbGVtZW50LlxuXG4gICAgICBTdXBwb3NlIHRoZXJlIGlzIGFuIGVsZW1lbnQgaW4gR0YgJ2UnLiBGb3IgYSBnaXZlbiBnZW5lcmF0b3IgJ2cnLFxuICAgICAgZSA9IGdeeC4gVGhlIG11bHRpcGxpY2F0aXZlIGludmVyc2Ugb2YgZSBpcyBnXigyNTUgLSB4KS4gSXQgdHVybnNcbiAgICAgIG91dCB0aGF0IGlmIHVzZSB0aGUgaW52ZXJzZSBvZiBhIGdlbmVyYXRvciBhcyBhbm90aGVyIGdlbmVyYXRvclxuICAgICAgaXQgd2lsbCBwcm9kdWNlIGFsbCBvZiB0aGUgY29ycmVzcG9uZGluZyBtdWx0aXBsaWNhdGl2ZSBpbnZlcnNlc1xuICAgICAgYXQgdGhlIHNhbWUgdGltZS4gRm9yIHRoaXMgcmVhc29uLCB3ZSBjaG9vc2UgNSBhcyBvdXIgaW52ZXJzZVxuICAgICAgZ2VuZXJhdG9yIGJlY2F1c2UgaXQgb25seSByZXF1aXJlcyAyIG11bHRpcGxpZXMgYW5kIDEgYWRkIGFuZCBpdHNcbiAgICAgIGludmVyc2UsIDgyLCByZXF1aXJlcyByZWxhdGl2ZWx5IGZldyBvcGVyYXRpb25zIGFzIHdlbGwuXG5cbiAgICAgIEluIG9yZGVyIHRvIGFwcGx5IHRoZSBhZmZpbmUgdHJhbnNmb3JtYXRpb24sIHRoZSBtdWx0aXBsaWNhdGl2ZVxuICAgICAgaW52ZXJzZSAnZWknIG9mICdlJyBjYW4gYmUgcmVwZWF0ZWRseSBYT1InZCAoNCB0aW1lcykgd2l0aCBhXG4gICAgICBiaXQtY3ljbGluZyBvZiAnZWknLiBUbyBkbyB0aGlzICdlaScgaXMgZmlyc3Qgc3RvcmVkIGluICdzJyBhbmRcbiAgICAgICd4Jy4gVGhlbiAncycgaXMgbGVmdCBzaGlmdGVkIGFuZCB0aGUgaGlnaCBiaXQgb2YgJ3MnIGlzIG1hZGUgdGhlXG4gICAgICBsb3cgYml0LiBUaGUgcmVzdWx0aW5nIHZhbHVlIGlzIHN0b3JlZCBpbiAncycuIFRoZW4gJ3gnIGlzIFhPUidkXG4gICAgICB3aXRoICdzJyBhbmQgc3RvcmVkIGluICd4Jy4gT24gZWFjaCBzdWJzZXF1ZW50IGl0ZXJhdGlvbiB0aGUgc2FtZVxuICAgICAgb3BlcmF0aW9uIGlzIHBlcmZvcm1lZC4gV2hlbiA0IGl0ZXJhdGlvbnMgYXJlIGNvbXBsZXRlLCAneCcgaXNcbiAgICAgIFhPUidkIHdpdGggJ2MnICgweDYzKSBhbmQgdGhlIHRyYW5zZm9ybWVkIHZhbHVlIGlzIHN0b3JlZCBpbiAneCcuXG4gICAgICBGb3IgZXhhbXBsZTpcblxuICAgICAgcyA9IDAxMDAwMDAxXG4gICAgICB4ID0gMDEwMDAwMDFcblxuICAgICAgaXRlcmF0aW9uIDE6IHMgPSAxMDAwMDAxMCwgeCBePSBzXG4gICAgICBpdGVyYXRpb24gMjogcyA9IDAwMDAwMTAxLCB4IF49IHNcbiAgICAgIGl0ZXJhdGlvbiAzOiBzID0gMDAwMDEwMTAsIHggXj0gc1xuICAgICAgaXRlcmF0aW9uIDQ6IHMgPSAwMDAxMDEwMCwgeCBePSBzXG4gICAgICB4IF49IDB4NjNcblxuICAgICAgVGhpcyBjYW4gYmUgZG9uZSB3aXRoIGEgbG9vcCB3aGVyZSBzID0gKHMgPDwgMSkgfCAocyA+PiA3KS4gSG93ZXZlcixcbiAgICAgIGl0IGNhbiBhbHNvIGJlIGRvbmUgYnkgdXNpbmcgYSBzaW5nbGUgMTYtYml0IChpbiB0aGlzIGNhc2UgMzItYml0KVxuICAgICAgbnVtYmVyICdzeCcuIFNpbmNlIFhPUiBpcyBhbiBhc3NvY2lhdGl2ZSBvcGVyYXRpb24sIHdlIGNhbiBzZXQgJ3N4J1xuICAgICAgdG8gJ2VpJyBhbmQgdGhlbiBYT1IgaXQgd2l0aCAnc3gnIGxlZnQtc2hpZnRlZCAxLDIsMywgYW5kIDQgdGltZXMuXG4gICAgICBUaGUgbW9zdCBzaWduaWZpY2FudCBiaXRzIHdpbGwgZmxvdyBpbnRvIHRoZSBoaWdoIDggYml0IHBvc2l0aW9uc1xuICAgICAgYW5kIGJlIGNvcnJlY3RseSBYT1InZCB3aXRoIG9uZSBhbm90aGVyLiBBbGwgdGhhdCByZW1haW5zIHdpbGwgYmVcbiAgICAgIHRvIGN5Y2xlIHRoZSBoaWdoIDggYml0cyBieSBYT1InaW5nIHRoZW0gYWxsIHdpdGggdGhlIGxvd2VyIDggYml0c1xuICAgICAgYWZ0ZXJ3YXJkcy5cblxuICAgICAgQXQgdGhlIHNhbWUgdGltZSB3ZSdyZSBwb3B1bGF0aW5nIHNib3ggYW5kIGlzYm94IHdlIGNhbiBwcmVjb21wdXRlXG4gICAgICB0aGUgbXVsdGlwbGljYXRpb24gd2UnbGwgbmVlZCB0byBkbyB0byBkbyBNaXhDb2x1bW5zKCkgbGF0ZXIuXG4gICAgKi9cblxuICAgIC8vIGFwcGx5IGFmZmluZSB0cmFuc2Zvcm1hdGlvblxuICAgIHN4ID0gZWkgXiAoZWkgPDwgMSkgXiAoZWkgPDwgMikgXiAoZWkgPDwgMykgXiAoZWkgPDwgNCk7XG4gICAgc3ggPSAoc3ggPj4gOCkgXiAoc3ggJiAyNTUpIF4gMHg2MztcblxuICAgIC8vIHVwZGF0ZSB0YWJsZXNcbiAgICBzYm94W2VdID0gc3g7XG4gICAgaXNib3hbc3hdID0gZTtcblxuICAgIC8qIE1peGluZyBjb2x1bW5zIGlzIGRvbmUgdXNpbmcgbWF0cml4IG11bHRpcGxpY2F0aW9uLiBUaGUgY29sdW1uc1xuICAgICAgdGhhdCBhcmUgdG8gYmUgbWl4ZWQgYXJlIGVhY2ggYSBzaW5nbGUgd29yZCBpbiB0aGUgY3VycmVudCBzdGF0ZS5cbiAgICAgIFRoZSBzdGF0ZSBoYXMgTmIgY29sdW1ucyAoNCBjb2x1bW5zKS4gVGhlcmVmb3JlIGVhY2ggY29sdW1uIGlzIGFcbiAgICAgIDQgYnl0ZSB3b3JkLiBTbyB0byBtaXggdGhlIGNvbHVtbnMgaW4gYSBzaW5nbGUgY29sdW1uICdjJyB3aGVyZVxuICAgICAgaXRzIHJvd3MgYXJlIHIwLCByMSwgcjIsIGFuZCByMywgd2UgdXNlIHRoZSBmb2xsb3dpbmcgbWF0cml4XG4gICAgICBtdWx0aXBsaWNhdGlvbjpcblxuICAgICAgWzIgMyAxIDFdKltyMCxjXT1bcicwLGNdXG4gICAgICBbMSAyIDMgMV0gW3IxLGNdIFtyJzEsY11cbiAgICAgIFsxIDEgMiAzXSBbcjIsY10gW3InMixjXVxuICAgICAgWzMgMSAxIDJdIFtyMyxjXSBbciczLGNdXG5cbiAgICAgIHIwLCByMSwgcjIsIGFuZCByMyBhcmUgZWFjaCAxIGJ5dGUgb2Ygb25lIG9mIHRoZSB3b3JkcyBpbiB0aGVcbiAgICAgIHN0YXRlIChhIGNvbHVtbikuIFRvIGRvIG1hdHJpeCBtdWx0aXBsaWNhdGlvbiBmb3IgZWFjaCBtaXhlZFxuICAgICAgY29sdW1uIGMnIHdlIG11bHRpcGx5IHRoZSBjb3JyZXNwb25kaW5nIHJvdyBmcm9tIHRoZSBsZWZ0IG1hdHJpeFxuICAgICAgd2l0aCB0aGUgY29ycmVzcG9uZGluZyBjb2x1bW4gZnJvbSB0aGUgcmlnaHQgbWF0cml4LiBJbiB0b3RhbCwgd2VcbiAgICAgIGdldCA0IGVxdWF0aW9uczpcblxuICAgICAgcjAsYycgPSAyKnIwLGMgKyAzKnIxLGMgKyAxKnIyLGMgKyAxKnIzLGNcbiAgICAgIHIxLGMnID0gMSpyMCxjICsgMipyMSxjICsgMypyMixjICsgMSpyMyxjXG4gICAgICByMixjJyA9IDEqcjAsYyArIDEqcjEsYyArIDIqcjIsYyArIDMqcjMsY1xuICAgICAgcjMsYycgPSAzKnIwLGMgKyAxKnIxLGMgKyAxKnIyLGMgKyAyKnIzLGNcblxuICAgICAgQXMgdXN1YWwsIHRoZSBtdWx0aXBsaWNhdGlvbiBpcyBhcyBwcmV2aW91c2x5IGRlZmluZWQgYW5kIHRoZVxuICAgICAgYWRkaXRpb24gaXMgWE9SLiBJbiBvcmRlciB0byBvcHRpbWl6ZSBtaXhpbmcgY29sdW1ucyB3ZSBjYW4gc3RvcmVcbiAgICAgIHRoZSBtdWx0aXBsaWNhdGlvbiByZXN1bHRzIGluIHRhYmxlcy4gSWYgeW91IHRoaW5rIG9mIHRoZSB3aG9sZVxuICAgICAgY29sdW1uIGFzIGEgd29yZCAoaXQgbWlnaHQgaGVscCB0byB2aXN1YWxpemUgYnkgbWVudGFsbHkgcm90YXRpbmdcbiAgICAgIHRoZSBlcXVhdGlvbnMgYWJvdmUgYnkgY291bnRlcmNsb2Nrd2lzZSA5MCBkZWdyZWVzKSB0aGVuIHlvdSBjYW5cbiAgICAgIHNlZSB0aGF0IGl0IHdvdWxkIGJlIHVzZWZ1bCB0byBtYXAgdGhlIG11bHRpcGxpY2F0aW9ucyBwZXJmb3JtZWQgb25cbiAgICAgIGVhY2ggYnl0ZSAocjAsIHIxLCByMiwgcjMpIG9udG8gYSB3b3JkIGFzIHdlbGwuIEZvciBpbnN0YW5jZSwgd2VcbiAgICAgIGNvdWxkIG1hcCAyKnIwLDEqcjAsMSpyMCwzKnIwIG9udG8gYSB3b3JkIGJ5IHN0b3JpbmcgMipyMCBpbiB0aGVcbiAgICAgIGhpZ2hlc3QgOCBiaXRzIGFuZCAzKnIwIGluIHRoZSBsb3dlc3QgOCBiaXRzICh3aXRoIHRoZSBvdGhlciB0d29cbiAgICAgIHJlc3BlY3RpdmVseSBpbiB0aGUgbWlkZGxlKS4gVGhpcyBtZWFucyB0aGF0IGEgdGFibGUgY2FuIGJlXG4gICAgICBjb25zdHJ1Y3RlZCB0aGF0IHVzZXMgcjAgYXMgYW4gaW5kZXggdG8gdGhlIHdvcmQuIFdlIGNhbiBkbyB0aGVcbiAgICAgIHNhbWUgd2l0aCByMSwgcjIsIGFuZCByMywgY3JlYXRpbmcgYSB0b3RhbCBvZiA0IHRhYmxlcy5cblxuICAgICAgVG8gY29uc3RydWN0IGEgZnVsbCBjJywgd2UgY2FuIGp1c3QgbG9vayB1cCBlYWNoIGJ5dGUgb2YgYyBpblxuICAgICAgdGhlaXIgcmVzcGVjdGl2ZSB0YWJsZXMgYW5kIFhPUiB0aGUgcmVzdWx0cyB0b2dldGhlci5cblxuICAgICAgQWxzbywgdG8gYnVpbGQgZWFjaCB0YWJsZSB3ZSBvbmx5IGhhdmUgdG8gY2FsY3VsYXRlIHRoZSB3b3JkXG4gICAgICBmb3IgMiwxLDEsMyBmb3IgZXZlcnkgYnl0ZSAuLi4gd2hpY2ggd2UgY2FuIGRvIG9uIGVhY2ggaXRlcmF0aW9uXG4gICAgICBvZiB0aGlzIGxvb3Agc2luY2Ugd2Ugd2lsbCBpdGVyYXRlIG92ZXIgZXZlcnkgYnl0ZS4gQWZ0ZXIgd2UgaGF2ZVxuICAgICAgY2FsY3VsYXRlZCAyLDEsMSwzIHdlIGNhbiBnZXQgdGhlIHJlc3VsdHMgZm9yIHRoZSBvdGhlciB0YWJsZXNcbiAgICAgIGJ5IGN5Y2xpbmcgdGhlIGJ5dGUgYXQgdGhlIGVuZCB0byB0aGUgYmVnaW5uaW5nLiBGb3IgaW5zdGFuY2VcbiAgICAgIHdlIGNhbiB0YWtlIHRoZSByZXN1bHQgb2YgdGFibGUgMiwxLDEsMyBhbmQgcHJvZHVjZSB0YWJsZSAzLDIsMSwxXG4gICAgICBieSBtb3ZpbmcgdGhlIHJpZ2h0IG1vc3QgYnl0ZSB0byB0aGUgbGVmdCBtb3N0IHBvc2l0aW9uIGp1c3QgbGlrZVxuICAgICAgaG93IHlvdSBjYW4gaW1hZ2luZSB0aGUgMyBtb3ZlZCBvdXQgb2YgMiwxLDEsMyBhbmQgdG8gdGhlIGZyb250XG4gICAgICB0byBwcm9kdWNlIDMsMiwxLDEuXG5cbiAgICAgIFRoZXJlIGlzIGFub3RoZXIgb3B0aW1pemF0aW9uIGluIHRoYXQgdGhlIHNhbWUgbXVsdGlwbGVzIG9mXG4gICAgICB0aGUgY3VycmVudCBlbGVtZW50IHdlIG5lZWQgaW4gb3JkZXIgdG8gYWR2YW5jZSBvdXIgZ2VuZXJhdG9yXG4gICAgICB0byB0aGUgbmV4dCBpdGVyYXRpb24gY2FuIGJlIHJldXNlZCBpbiBwZXJmb3JtaW5nIHRoZSAyLDEsMSwzXG4gICAgICBjYWxjdWxhdGlvbi4gV2UgYWxzbyBjYWxjdWxhdGUgdGhlIGludmVyc2UgbWl4IGNvbHVtbiB0YWJsZXMsXG4gICAgICB3aXRoIGUsOSxkLGIgYmVpbmcgdGhlIGludmVyc2Ugb2YgMiwxLDEsMy5cblxuICAgICAgV2hlbiB3ZSdyZSBkb25lLCBhbmQgd2UgbmVlZCB0byBhY3R1YWxseSBtaXggY29sdW1ucywgdGhlIGZpcnN0XG4gICAgICBieXRlIG9mIGVhY2ggc3RhdGUgd29yZCBzaG91bGQgYmUgcHV0IHRocm91Z2ggbWl4WzBdICgyLDEsMSwzKSxcbiAgICAgIHRoZSBzZWNvbmQgdGhyb3VnaCBtaXhbMV0gKDMsMiwxLDEpIGFuZCBzbyBmb3J0aC4gVGhlbiB0aGV5IHNob3VsZFxuICAgICAgYmUgWE9SJ2QgdG9nZXRoZXIgdG8gcHJvZHVjZSB0aGUgZnVsbHkgbWl4ZWQgY29sdW1uLlxuICAgICovXG5cbiAgICAvLyBjYWxjdWxhdGUgbWl4IGFuZCBpbWl4IHRhYmxlIHZhbHVlc1xuICAgIHN4MiA9IHh0aW1lW3N4XTtcbiAgICBlMiA9IHh0aW1lW2VdO1xuICAgIGU0ID0geHRpbWVbZTJdO1xuICAgIGU4ID0geHRpbWVbZTRdO1xuICAgIG1lID1cbiAgICAgIChzeDIgPDwgMjQpIF4gIC8vIDJcbiAgICAgIChzeCA8PCAxNikgXiAgIC8vIDFcbiAgICAgIChzeCA8PCA4KSBeICAgIC8vIDFcbiAgICAgIChzeCBeIHN4Mik7ICAgIC8vIDNcbiAgICBpbWUgPVxuICAgICAgKGUyIF4gZTQgXiBlOCkgPDwgMjQgXiAgLy8gRSAoMTQpXG4gICAgICAoZSBeIGU4KSA8PCAxNiBeICAgICAgICAvLyA5XG4gICAgICAoZSBeIGU0IF4gZTgpIDw8IDggXiAgICAvLyBEICgxMylcbiAgICAgIChlIF4gZTIgXiBlOCk7ICAgICAgICAgIC8vIEIgKDExKVxuICAgIC8vIHByb2R1Y2UgZWFjaCBvZiB0aGUgbWl4IHRhYmxlcyBieSByb3RhdGluZyB0aGUgMiwxLDEsMyB2YWx1ZVxuICAgIGZvcih2YXIgbiA9IDA7IG4gPCA0OyArK24pIHtcbiAgICAgIG1peFtuXVtlXSA9IG1lO1xuICAgICAgaW1peFtuXVtzeF0gPSBpbWU7XG4gICAgICAvLyBjeWNsZSB0aGUgcmlnaHQgbW9zdCBieXRlIHRvIHRoZSBsZWZ0IG1vc3QgcG9zaXRpb25cbiAgICAgIC8vIGllOiAyLDEsMSwzIGJlY29tZXMgMywyLDEsMVxuICAgICAgbWUgPSBtZSA8PCAyNCB8IG1lID4+PiA4O1xuICAgICAgaW1lID0gaW1lIDw8IDI0IHwgaW1lID4+PiA4O1xuICAgIH1cblxuICAgIC8vIGdldCBuZXh0IGVsZW1lbnQgYW5kIGludmVyc2VcbiAgICBpZihlID09PSAwKSB7XG4gICAgICAvLyAxIGlzIHRoZSBpbnZlcnNlIG9mIDFcbiAgICAgIGUgPSBlaSA9IDE7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgLy8gZSA9IDJlICsgMioyKjIqKDEwZSkpID0gbXVsdGlwbHkgZSBieSA4MiAoY2hvc2VuIGdlbmVyYXRvcilcbiAgICAgIC8vIGVpID0gZWkgKyAyKjIqZWkgPSBtdWx0aXBseSBlaSBieSA1IChpbnZlcnNlIGdlbmVyYXRvcilcbiAgICAgIGUgPSBlMiBeIHh0aW1lW3h0aW1lW3h0aW1lW2UyIF4gZThdXV07XG4gICAgICBlaSBePSB4dGltZVt4dGltZVtlaV1dO1xuICAgIH1cbiAgfVxufTtcblxuLyoqXG4gKiBHZW5lcmF0ZXMgYSBrZXkgc2NoZWR1bGUgdXNpbmcgdGhlIEFFUyBrZXkgZXhwYW5zaW9uIGFsZ29yaXRobS5cbiAqXG4gKiBUaGUgQUVTIGFsZ29yaXRobSB0YWtlcyB0aGUgQ2lwaGVyIEtleSwgSywgYW5kIHBlcmZvcm1zIGEgS2V5IEV4cGFuc2lvblxuICogcm91dGluZSB0byBnZW5lcmF0ZSBhIGtleSBzY2hlZHVsZS4gVGhlIEtleSBFeHBhbnNpb24gZ2VuZXJhdGVzIGEgdG90YWxcbiAqIG9mIE5iKihOciArIDEpIHdvcmRzOiB0aGUgYWxnb3JpdGhtIHJlcXVpcmVzIGFuIGluaXRpYWwgc2V0IG9mIE5iIHdvcmRzLFxuICogYW5kIGVhY2ggb2YgdGhlIE5yIHJvdW5kcyByZXF1aXJlcyBOYiB3b3JkcyBvZiBrZXkgZGF0YS4gVGhlIHJlc3VsdGluZ1xuICoga2V5IHNjaGVkdWxlIGNvbnNpc3RzIG9mIGEgbGluZWFyIGFycmF5IG9mIDQtYnl0ZSB3b3JkcywgZGVub3RlZCBbd2kgXSxcbiAqIHdpdGggaSBpbiB0aGUgcmFuZ2UgMCDiiaQgaSA8IE5iKE5yICsgMSkuXG4gKlxuICogS2V5RXhwYW5zaW9uKGJ5dGUga2V5WzQqTmtdLCB3b3JkIHdbTmIqKE5yKzEpXSwgTmspXG4gKiBBRVMtMTI4IChOYj00LCBOaz00LCBOcj0xMClcbiAqIEFFUy0xOTIgKE5iPTQsIE5rPTYsIE5yPTEyKVxuICogQUVTLTI1NiAoTmI9NCwgTms9OCwgTnI9MTQpXG4gKiBOb3RlOiBOcj1Oays2LlxuICpcbiAqIE5iIGlzIHRoZSBudW1iZXIgb2YgY29sdW1ucyAoMzItYml0IHdvcmRzKSBjb21wcmlzaW5nIHRoZSBTdGF0ZSAob3JcbiAqIG51bWJlciBvZiBieXRlcyBpbiBhIGJsb2NrKS4gRm9yIEFFUywgTmI9NC5cbiAqXG4gKiBAcGFyYW0ga2V5IHRoZSBrZXkgdG8gc2NoZWR1bGUgKGFzIGFuIGFycmF5IG9mIDMyLWJpdCB3b3JkcykuXG4gKiBAcGFyYW0gZGVjcnlwdCB0cnVlIHRvIG1vZGlmeSB0aGUga2V5IHNjaGVkdWxlIHRvIGRlY3J5cHQsIGZhbHNlIG5vdCB0by5cbiAqXG4gKiBAcmV0dXJuIHRoZSBnZW5lcmF0ZWQga2V5IHNjaGVkdWxlLlxuICovXG52YXIgZXhwYW5kS2V5ID0gZnVuY3Rpb24oa2V5LCBkZWNyeXB0KSB7XG4gIC8vIGNvcHkgdGhlIGtleSdzIHdvcmRzIHRvIGluaXRpYWxpemUgdGhlIGtleSBzY2hlZHVsZVxuICB2YXIgdyA9IGtleS5zbGljZSgwKTtcblxuICAvKiBSb3RXb3JkKCkgd2lsbCByb3RhdGUgYSB3b3JkLCBtb3ZpbmcgdGhlIGZpcnN0IGJ5dGUgdG8gdGhlIGxhc3RcbiAgICBieXRlJ3MgcG9zaXRpb24gKHNoaWZ0aW5nIHRoZSBvdGhlciBieXRlcyBsZWZ0KS5cblxuICAgIFdlIHdpbGwgYmUgZ2V0dGluZyB0aGUgdmFsdWUgb2YgUmNvbiBhdCBpIC8gTmsuICdpJyB3aWxsIGl0ZXJhdGVcbiAgICBmcm9tIE5rIHRvIChOYiAqIE5yKzEpLiBOayA9IDQgKDQgYnl0ZSBrZXkpLCBOYiA9IDQgKDQgd29yZHMgaW5cbiAgICBhIGJsb2NrKSwgTnIgPSBOayArIDYgKDEwKS4gVGhlcmVmb3JlICdpJyB3aWxsIGl0ZXJhdGUgZnJvbVxuICAgIDQgdG8gNDQgKGV4Y2x1c2l2ZSkuIEVhY2ggdGltZSB3ZSBpdGVyYXRlIDQgdGltZXMsIGkgLyBOayB3aWxsXG4gICAgaW5jcmVhc2UgYnkgMS4gV2UgdXNlIGEgY291bnRlciBpTmsgdG8ga2VlcCB0cmFjayBvZiB0aGlzLlxuICAgKi9cblxuICAvLyBnbyB0aHJvdWdoIHRoZSByb3VuZHMgZXhwYW5kaW5nIHRoZSBrZXlcbiAgdmFyIHRlbXAsIGlOayA9IDE7XG4gIHZhciBOayA9IHcubGVuZ3RoO1xuICB2YXIgTnIxID0gTmsgKyA2ICsgMTtcbiAgdmFyIGVuZCA9IE5iICogTnIxO1xuICBmb3IodmFyIGkgPSBOazsgaSA8IGVuZDsgKytpKSB7XG4gICAgdGVtcCA9IHdbaSAtIDFdO1xuICAgIGlmKGkgJSBOayA9PT0gMCkge1xuICAgICAgLy8gdGVtcCA9IFN1YldvcmQoUm90V29yZCh0ZW1wKSkgXiBSY29uW2kgLyBOa11cbiAgICAgIHRlbXAgPVxuICAgICAgICBzYm94W3RlbXAgPj4+IDE2ICYgMjU1XSA8PCAyNCBeXG4gICAgICAgIHNib3hbdGVtcCA+Pj4gOCAmIDI1NV0gPDwgMTYgXlxuICAgICAgICBzYm94W3RlbXAgJiAyNTVdIDw8IDggXlxuICAgICAgICBzYm94W3RlbXAgPj4+IDI0XSBeIChyY29uW2lOa10gPDwgMjQpO1xuICAgICAgaU5rKys7XG4gICAgfVxuICAgIGVsc2UgaWYoTmsgPiA2ICYmIChpICUgTmsgPT0gNCkpIHtcbiAgICAgIC8vIHRlbXAgPSBTdWJXb3JkKHRlbXApXG4gICAgICB0ZW1wID1cbiAgICAgICAgc2JveFt0ZW1wID4+PiAyNF0gPDwgMjQgXlxuICAgICAgICBzYm94W3RlbXAgPj4+IDE2ICYgMjU1XSA8PCAxNiBeXG4gICAgICAgIHNib3hbdGVtcCA+Pj4gOCAmIDI1NV0gPDwgOCBeXG4gICAgICAgIHNib3hbdGVtcCAmIDI1NV07XG4gICAgfVxuICAgIHdbaV0gPSB3W2kgLSBOa10gXiB0ZW1wO1xuICB9XG5cbiAgIC8qIFdoZW4gd2UgYXJlIHVwZGF0aW5nIGEgY2lwaGVyIGJsb2NrIHdlIGFsd2F5cyB1c2UgdGhlIGNvZGUgcGF0aCBmb3JcbiAgICAgZW5jcnlwdGlvbiB3aGV0aGVyIHdlIGFyZSBkZWNyeXB0aW5nIG9yIG5vdCAodG8gc2hvcnRlbiBjb2RlIGFuZFxuICAgICBzaW1wbGlmeSB0aGUgZ2VuZXJhdGlvbiBvZiBsb29rIHVwIHRhYmxlcykuIEhvd2V2ZXIsIGJlY2F1c2UgdGhlcmVcbiAgICAgYXJlIGRpZmZlcmVuY2VzIGluIHRoZSBkZWNyeXB0aW9uIGFsZ29yaXRobSwgb3RoZXIgdGhhbiBqdXN0IHN3YXBwaW5nXG4gICAgIGluIGRpZmZlcmVudCBsb29rIHVwIHRhYmxlcywgd2UgbXVzdCB0cmFuc2Zvcm0gb3VyIGtleSBzY2hlZHVsZSB0b1xuICAgICBhY2NvdW50IGZvciB0aGVzZSBjaGFuZ2VzOlxuXG4gICAgIDEuIFRoZSBkZWNyeXB0aW9uIGFsZ29yaXRobSBnZXRzIGl0cyBrZXkgcm91bmRzIGluIHJldmVyc2Ugb3JkZXIuXG4gICAgIDIuIFRoZSBkZWNyeXB0aW9uIGFsZ29yaXRobSBhZGRzIHRoZSByb3VuZCBrZXkgYmVmb3JlIG1peGluZyBjb2x1bW5zXG4gICAgICAgaW5zdGVhZCBvZiBhZnRlcndhcmRzLlxuXG4gICAgIFdlIGRvbid0IG5lZWQgdG8gbW9kaWZ5IG91ciBrZXkgc2NoZWR1bGUgdG8gaGFuZGxlIHRoZSBmaXJzdCBjYXNlLFxuICAgICB3ZSBjYW4ganVzdCB0cmF2ZXJzZSB0aGUga2V5IHNjaGVkdWxlIGluIHJldmVyc2Ugb3JkZXIgd2hlbiBkZWNyeXB0aW5nLlxuXG4gICAgIFRoZSBzZWNvbmQgY2FzZSByZXF1aXJlcyBhIGxpdHRsZSB3b3JrLlxuXG4gICAgIFRoZSB0YWJsZXMgd2UgYnVpbHQgZm9yIHBlcmZvcm1pbmcgcm91bmRzIHdpbGwgdGFrZSBhbiBpbnB1dCBhbmQgdGhlblxuICAgICBwZXJmb3JtIFN1YkJ5dGVzKCkgYW5kIE1peENvbHVtbnMoKSBvciwgZm9yIHRoZSBkZWNyeXB0IHZlcnNpb24sXG4gICAgIEludlN1YkJ5dGVzKCkgYW5kIEludk1peENvbHVtbnMoKS4gQnV0IHRoZSBkZWNyeXB0IGFsZ29yaXRobSByZXF1aXJlc1xuICAgICB1cyB0byBBZGRSb3VuZEtleSgpIGJlZm9yZSBJbnZNaXhDb2x1bW5zKCkuIFRoaXMgbWVhbnMgd2UnbGwgbmVlZCB0b1xuICAgICBhcHBseSBzb21lIHRyYW5zZm9ybWF0aW9ucyB0byB0aGUgcm91bmQga2V5IHRvIGludmVyc2UtbWl4IGl0cyBjb2x1bW5zXG4gICAgIHNvIHRoZXknbGwgYmUgY29ycmVjdCBmb3IgbW92aW5nIEFkZFJvdW5kS2V5KCkgdG8gYWZ0ZXIgdGhlIHN0YXRlIGhhc1xuICAgICBoYWQgaXRzIGNvbHVtbnMgaW52ZXJzZS1taXhlZC5cblxuICAgICBUbyBpbnZlcnNlLW1peCB0aGUgY29sdW1ucyBvZiB0aGUgc3RhdGUgd2hlbiB3ZSdyZSBkZWNyeXB0aW5nIHdlIHVzZSBhXG4gICAgIGxvb2t1cCB0YWJsZSB0aGF0IHdpbGwgYXBwbHkgSW52U3ViQnl0ZXMoKSBhbmQgSW52TWl4Q29sdW1ucygpIGF0IHRoZVxuICAgICBzYW1lIHRpbWUuIEhvd2V2ZXIsIHRoZSByb3VuZCBrZXkncyBieXRlcyBhcmUgbm90IGludmVyc2Utc3Vic3RpdHV0ZWRcbiAgICAgaW4gdGhlIGRlY3J5cHRpb24gYWxnb3JpdGhtLiBUbyBnZXQgYXJvdW5kIHRoaXMgcHJvYmxlbSwgd2UgY2FuIGZpcnN0XG4gICAgIHN1YnN0aXR1dGUgdGhlIGJ5dGVzIGluIHRoZSByb3VuZCBrZXkgc28gdGhhdCB3aGVuIHdlIGFwcGx5IHRoZVxuICAgICB0cmFuc2Zvcm1hdGlvbiB2aWEgdGhlIEludlN1YkJ5dGVzKCkrSW52TWl4Q29sdW1ucygpIHRhYmxlLCBpdCB3aWxsXG4gICAgIHVuZG8gb3VyIHN1YnN0aXR1dGlvbiBsZWF2aW5nIHVzIHdpdGggdGhlIG9yaWdpbmFsIHZhbHVlIHRoYXQgd2VcbiAgICAgd2FudCAtLSBhbmQgdGhlbiBpbnZlcnNlLW1peCB0aGF0IHZhbHVlLlxuXG4gICAgIFRoaXMgY2hhbmdlIHdpbGwgY29ycmVjdGx5IGFsdGVyIG91ciBrZXkgc2NoZWR1bGUgc28gdGhhdCB3ZSBjYW4gWE9SXG4gICAgIGVhY2ggcm91bmQga2V5IHdpdGggb3VyIGFscmVhZHkgdHJhbnNmb3JtZWQgZGVjcnlwdGlvbiBzdGF0ZS4gVGhpc1xuICAgICBhbGxvd3MgdXMgdG8gdXNlIHRoZSBzYW1lIGNvZGUgcGF0aCBhcyB0aGUgZW5jcnlwdGlvbiBhbGdvcml0aG0uXG5cbiAgICAgV2UgbWFrZSBvbmUgbW9yZSBjaGFuZ2UgdG8gdGhlIGRlY3J5cHRpb24ga2V5LiBTaW5jZSB0aGUgZGVjcnlwdGlvblxuICAgICBhbGdvcml0aG0gcnVucyBpbiByZXZlcnNlIGZyb20gdGhlIGVuY3J5cHRpb24gYWxnb3JpdGhtLCB3ZSByZXZlcnNlXG4gICAgIHRoZSBvcmRlciBvZiB0aGUgcm91bmQga2V5cyB0byBhdm9pZCBoYXZpbmcgdG8gaXRlcmF0ZSBvdmVyIHRoZSBrZXlcbiAgICAgc2NoZWR1bGUgYmFja3dhcmRzIHdoZW4gcnVubmluZyB0aGUgZW5jcnlwdGlvbiBhbGdvcml0aG0gbGF0ZXIgaW5cbiAgICAgZGVjcnlwdGlvbiBtb2RlLiBJbiBhZGRpdGlvbiB0byByZXZlcnNpbmcgdGhlIG9yZGVyIG9mIHRoZSByb3VuZCBrZXlzLFxuICAgICB3ZSBhbHNvIHN3YXAgZWFjaCByb3VuZCBrZXkncyAybmQgYW5kIDR0aCByb3dzLiBTZWUgdGhlIGNvbW1lbnRzXG4gICAgIHNlY3Rpb24gd2hlcmUgcm91bmRzIGFyZSBwZXJmb3JtZWQgZm9yIG1vcmUgZGV0YWlscyBhYm91dCB3aHkgdGhpcyBpc1xuICAgICBkb25lLiBUaGVzZSBjaGFuZ2VzIGFyZSBkb25lIGlubGluZSB3aXRoIHRoZSBvdGhlciBzdWJzdGl0dXRpb25cbiAgICAgZGVzY3JpYmVkIGFib3ZlLlxuICAqL1xuICBpZihkZWNyeXB0KSB7XG4gICAgdmFyIHRtcDtcbiAgICB2YXIgbTAgPSBpbWl4WzBdO1xuICAgIHZhciBtMSA9IGltaXhbMV07XG4gICAgdmFyIG0yID0gaW1peFsyXTtcbiAgICB2YXIgbTMgPSBpbWl4WzNdO1xuICAgIHZhciB3bmV3ID0gdy5zbGljZSgwKTtcbiAgICB2YXIgZW5kID0gdy5sZW5ndGg7XG4gICAgZm9yKHZhciBpID0gMCwgd2kgPSBlbmQgLSBOYjsgaSA8IGVuZDsgaSArPSBOYiwgd2kgLT0gTmIpIHtcbiAgICAgIC8vIGRvIG5vdCBzdWIgdGhlIGZpcnN0IG9yIGxhc3Qgcm91bmQga2V5IChyb3VuZCBrZXlzIGFyZSBOYlxuICAgICAgLy8gd29yZHMpIGFzIG5vIGNvbHVtbiBtaXhpbmcgaXMgcGVyZm9ybWVkIGJlZm9yZSB0aGV5IGFyZSBhZGRlZCxcbiAgICAgIC8vIGJ1dCBkbyBjaGFuZ2UgdGhlIGtleSBvcmRlclxuICAgICAgaWYoaSA9PT0gMCB8fCBpID09PSAoZW5kIC0gTmIpKSB7XG4gICAgICAgIHduZXdbaV0gPSB3W3dpXTtcbiAgICAgICAgd25ld1tpICsgMV0gPSB3W3dpICsgM107XG4gICAgICAgIHduZXdbaSArIDJdID0gd1t3aSArIDJdO1xuICAgICAgICB3bmV3W2kgKyAzXSA9IHdbd2kgKyAxXTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICAvLyBzdWJzdGl0dXRlIGVhY2ggcm91bmQga2V5IGJ5dGUgYmVjYXVzZSB0aGUgaW52ZXJzZS1taXhcbiAgICAgICAgLy8gdGFibGUgd2lsbCBpbnZlcnNlLXN1YnN0aXR1dGUgaXQgKGVmZmVjdGl2ZWx5IGNhbmNlbCB0aGVcbiAgICAgICAgLy8gc3Vic3RpdHV0aW9uIGJlY2F1c2Ugcm91bmQga2V5IGJ5dGVzIGFyZW4ndCBzdWInZCBpblxuICAgICAgICAvLyBkZWNyeXB0aW9uIG1vZGUpIGFuZCBzd2FwIGluZGV4ZXMgMyBhbmQgMVxuICAgICAgICBmb3IodmFyIG4gPSAwOyBuIDwgTmI7ICsrbikge1xuICAgICAgICAgIHRtcCA9IHdbd2kgKyBuXTtcbiAgICAgICAgICB3bmV3W2kgKyAoMyYtbildID1cbiAgICAgICAgICAgIG0wW3Nib3hbdG1wID4+PiAyNF1dIF5cbiAgICAgICAgICAgIG0xW3Nib3hbdG1wID4+PiAxNiAmIDI1NV1dIF5cbiAgICAgICAgICAgIG0yW3Nib3hbdG1wID4+PiA4ICYgMjU1XV0gXlxuICAgICAgICAgICAgbTNbc2JveFt0bXAgJiAyNTVdXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICB3ID0gd25ldztcbiAgfVxuXG4gIHJldHVybiB3O1xufTtcblxuXG5mb3JnZS5hZXMuX2V4cGFuZEtleSA9IGZ1bmN0aW9uKGtleSwgZGVjcnlwdCkge1xuICBpZighaW5pdCkge1xuICAgIGluaXRpYWxpemUoKTtcbiAgfVxuICByZXR1cm4gZXhwYW5kS2V5KGtleSwgZGVjcnlwdCk7XG59O1xuXG4vKipcbiAqIGFlcy5fdXBkYXRlQmxvY2tcbiAqL1xuXG52YXIgX3VwZGF0ZUJsb2NrID0gZnVuY3Rpb24odywgaW5wdXQsIG91dHB1dCwgZGVjcnlwdCkge1xuICAvKlxuICBDaXBoZXIoYnl0ZSBpbls0Kk5iXSwgYnl0ZSBvdXRbNCpOYl0sIHdvcmQgd1tOYiooTnIrMSldKVxuICBiZWdpblxuICAgIGJ5dGUgc3RhdGVbNCxOYl1cbiAgICBzdGF0ZSA9IGluXG4gICAgQWRkUm91bmRLZXkoc3RhdGUsIHdbMCwgTmItMV0pXG4gICAgZm9yIHJvdW5kID0gMSBzdGVwIDEgdG8gTnLigJMxXG4gICAgICBTdWJCeXRlcyhzdGF0ZSlcbiAgICAgIFNoaWZ0Um93cyhzdGF0ZSlcbiAgICAgIE1peENvbHVtbnMoc3RhdGUpXG4gICAgICBBZGRSb3VuZEtleShzdGF0ZSwgd1tyb3VuZCpOYiwgKHJvdW5kKzEpKk5iLTFdKVxuICAgIGVuZCBmb3JcbiAgICBTdWJCeXRlcyhzdGF0ZSlcbiAgICBTaGlmdFJvd3Moc3RhdGUpXG4gICAgQWRkUm91bmRLZXkoc3RhdGUsIHdbTnIqTmIsIChOcisxKSpOYi0xXSlcbiAgICBvdXQgPSBzdGF0ZVxuICBlbmRcblxuICBJbnZDaXBoZXIoYnl0ZSBpbls0Kk5iXSwgYnl0ZSBvdXRbNCpOYl0sIHdvcmQgd1tOYiooTnIrMSldKVxuICBiZWdpblxuICAgIGJ5dGUgc3RhdGVbNCxOYl1cbiAgICBzdGF0ZSA9IGluXG4gICAgQWRkUm91bmRLZXkoc3RhdGUsIHdbTnIqTmIsIChOcisxKSpOYi0xXSlcbiAgICBmb3Igcm91bmQgPSBOci0xIHN0ZXAgLTEgZG93bnRvIDFcbiAgICAgIEludlNoaWZ0Um93cyhzdGF0ZSlcbiAgICAgIEludlN1YkJ5dGVzKHN0YXRlKVxuICAgICAgQWRkUm91bmRLZXkoc3RhdGUsIHdbcm91bmQqTmIsIChyb3VuZCsxKSpOYi0xXSlcbiAgICAgIEludk1peENvbHVtbnMoc3RhdGUpXG4gICAgZW5kIGZvclxuICAgIEludlNoaWZ0Um93cyhzdGF0ZSlcbiAgICBJbnZTdWJCeXRlcyhzdGF0ZSlcbiAgICBBZGRSb3VuZEtleShzdGF0ZSwgd1swLCBOYi0xXSlcbiAgICBvdXQgPSBzdGF0ZVxuICBlbmRcbiAgKi9cblxuICAvLyBFbmNyeXB0OiBBZGRSb3VuZEtleShzdGF0ZSwgd1swLCBOYi0xXSlcbiAgLy8gRGVjcnlwdDogQWRkUm91bmRLZXkoc3RhdGUsIHdbTnIqTmIsIChOcisxKSpOYi0xXSlcbiAgdmFyIE5yID0gdy5sZW5ndGggLyA0IC0gMTtcbiAgdmFyIG0wLCBtMSwgbTIsIG0zLCBzdWI7XG4gIGlmKGRlY3J5cHQpIHtcbiAgICBtMCA9IGltaXhbMF07XG4gICAgbTEgPSBpbWl4WzFdO1xuICAgIG0yID0gaW1peFsyXTtcbiAgICBtMyA9IGltaXhbM107XG4gICAgc3ViID0gaXNib3g7XG4gIH1cbiAgZWxzZSB7XG4gICAgbTAgPSBtaXhbMF07XG4gICAgbTEgPSBtaXhbMV07XG4gICAgbTIgPSBtaXhbMl07XG4gICAgbTMgPSBtaXhbM107XG4gICAgc3ViID0gc2JveDtcbiAgfVxuICB2YXIgYSwgYiwgYywgZCwgYTIsIGIyLCBjMjtcbiAgYSA9IGlucHV0WzBdIF4gd1swXTtcbiAgYiA9IGlucHV0W2RlY3J5cHQgPyAzIDogMV0gXiB3WzFdO1xuICBjID0gaW5wdXRbMl0gXiB3WzJdO1xuICBkID0gaW5wdXRbZGVjcnlwdCA/IDEgOiAzXSBeIHdbM107XG4gIHZhciBpID0gMztcblxuICAvKiBJbiBvcmRlciB0byBzaGFyZSBjb2RlIHdlIGZvbGxvdyB0aGUgZW5jcnlwdGlvbiBhbGdvcml0aG0gd2hlbiBib3RoXG4gICAgZW5jcnlwdGluZyBhbmQgZGVjcnlwdGluZy4gVG8gYWNjb3VudCBmb3IgdGhlIGNoYW5nZXMgcmVxdWlyZWQgaW4gdGhlXG4gICAgZGVjcnlwdGlvbiBhbGdvcml0aG0sIHdlIHVzZSBkaWZmZXJlbnQgbG9va3VwIHRhYmxlcyB3aGVuIGRlY3J5cHRpbmdcbiAgICBhbmQgdXNlIGEgbW9kaWZpZWQga2V5IHNjaGVkdWxlIHRvIGFjY291bnQgZm9yIHRoZSBkaWZmZXJlbmNlIGluIHRoZVxuICAgIG9yZGVyIG9mIHRyYW5zZm9ybWF0aW9ucyBhcHBsaWVkIHdoZW4gcGVyZm9ybWluZyByb3VuZHMuIFdlIGFsc28gZ2V0XG4gICAga2V5IHJvdW5kcyBpbiByZXZlcnNlIG9yZGVyIChyZWxhdGl2ZSB0byBlbmNyeXB0aW9uKS4gKi9cbiAgZm9yKHZhciByb3VuZCA9IDE7IHJvdW5kIDwgTnI7ICsrcm91bmQpIHtcbiAgICAvKiBBcyBkZXNjcmliZWQgYWJvdmUsIHdlJ2xsIGJlIHVzaW5nIHRhYmxlIGxvb2t1cHMgdG8gcGVyZm9ybSB0aGVcbiAgICAgIGNvbHVtbiBtaXhpbmcuIEVhY2ggY29sdW1uIGlzIHN0b3JlZCBhcyBhIHdvcmQgaW4gdGhlIHN0YXRlICh0aGVcbiAgICAgIGFycmF5ICdpbnB1dCcgaGFzIG9uZSBjb2x1bW4gYXMgYSB3b3JkIGF0IGVhY2ggaW5kZXgpLiBJbiBvcmRlciB0b1xuICAgICAgbWl4IGEgY29sdW1uLCB3ZSBwZXJmb3JtIHRoZXNlIHRyYW5zZm9ybWF0aW9ucyBvbiBlYWNoIHJvdyBpbiBjLFxuICAgICAgd2hpY2ggaXMgMSBieXRlIGluIGVhY2ggd29yZC4gVGhlIG5ldyBjb2x1bW4gZm9yIGMwIGlzIGMnMDpcblxuICAgICAgICAgICAgICAgbTAgICAgICBtMSAgICAgIG0yICAgICAgbTNcbiAgICAgIHIwLGMnMCA9IDIqcjAsYzAgKyAzKnIxLGMwICsgMSpyMixjMCArIDEqcjMsYzBcbiAgICAgIHIxLGMnMCA9IDEqcjAsYzAgKyAyKnIxLGMwICsgMypyMixjMCArIDEqcjMsYzBcbiAgICAgIHIyLGMnMCA9IDEqcjAsYzAgKyAxKnIxLGMwICsgMipyMixjMCArIDMqcjMsYzBcbiAgICAgIHIzLGMnMCA9IDMqcjAsYzAgKyAxKnIxLGMwICsgMSpyMixjMCArIDIqcjMsYzBcblxuICAgICAgU28gdXNpbmcgbWl4IHRhYmxlcyB3aGVyZSBjMCBpcyBhIHdvcmQgd2l0aCByMCBiZWluZyBpdHMgdXBwZXJcbiAgICAgIDggYml0cyBhbmQgcjMgYmVpbmcgaXRzIGxvd2VyIDggYml0czpcblxuICAgICAgbTBbYzAgPj4gMjRdIHdpbGwgeWllbGQgdGhpcyB3b3JkOiBbMipyMCwxKnIwLDEqcjAsMypyMF1cbiAgICAgIC4uLlxuICAgICAgbTNbYzAgJiAyNTVdIHdpbGwgeWllbGQgdGhpcyB3b3JkOiBbMSpyMywxKnIzLDMqcjMsMipyM11cblxuICAgICAgVGhlcmVmb3JlIHRvIG1peCB0aGUgY29sdW1ucyBpbiBlYWNoIHdvcmQgaW4gdGhlIHN0YXRlIHdlXG4gICAgICBkbyB0aGUgZm9sbG93aW5nICgmIDI1NSBvbWl0dGVkIGZvciBicmV2aXR5KTpcbiAgICAgIGMnMCxyMCA9IG0wW2MwID4+IDI0XSBeIG0xW2MxID4+IDE2XSBeIG0yW2MyID4+IDhdIF4gbTNbYzNdXG4gICAgICBjJzAscjEgPSBtMFtjMCA+PiAyNF0gXiBtMVtjMSA+PiAxNl0gXiBtMltjMiA+PiA4XSBeIG0zW2MzXVxuICAgICAgYycwLHIyID0gbTBbYzAgPj4gMjRdIF4gbTFbYzEgPj4gMTZdIF4gbTJbYzIgPj4gOF0gXiBtM1tjM11cbiAgICAgIGMnMCxyMyA9IG0wW2MwID4+IDI0XSBeIG0xW2MxID4+IDE2XSBeIG0yW2MyID4+IDhdIF4gbTNbYzNdXG5cbiAgICAgIEhvd2V2ZXIsIGJlZm9yZSBtaXhpbmcsIHRoZSBhbGdvcml0aG0gcmVxdWlyZXMgdXMgdG8gcGVyZm9ybVxuICAgICAgU2hpZnRSb3dzKCkuIFRoZSBTaGlmdFJvd3MoKSB0cmFuc2Zvcm1hdGlvbiBjeWNsaWNhbGx5IHNoaWZ0cyB0aGVcbiAgICAgIGxhc3QgMyByb3dzIG9mIHRoZSBzdGF0ZSBvdmVyIGRpZmZlcmVudCBvZmZzZXRzLiBUaGUgZmlyc3Qgcm93XG4gICAgICAociA9IDApIGlzIG5vdCBzaGlmdGVkLlxuXG4gICAgICBzJ19yLGMgPSBzX3IsKGMgKyBzaGlmdChyLCBOYikgbW9kIE5iXG4gICAgICBmb3IgMCA8IHIgPCA0IGFuZCAwIDw9IGMgPCBOYiBhbmRcbiAgICAgIHNoaWZ0KDEsIDQpID0gMVxuICAgICAgc2hpZnQoMiwgNCkgPSAyXG4gICAgICBzaGlmdCgzLCA0KSA9IDMuXG5cbiAgICAgIFRoaXMgY2F1c2VzIHRoZSBmaXJzdCBieXRlIGluIHIgPSAxIHRvIGJlIG1vdmVkIHRvIHRoZSBlbmQgb2ZcbiAgICAgIHRoZSByb3csIHRoZSBmaXJzdCAyIGJ5dGVzIGluIHIgPSAyIHRvIGJlIG1vdmVkIHRvIHRoZSBlbmQgb2ZcbiAgICAgIHRoZSByb3csIHRoZSBmaXJzdCAzIGJ5dGVzIGluIHIgPSAzIHRvIGJlIG1vdmVkIHRvIHRoZSBlbmQgb2ZcbiAgICAgIHRoZSByb3c6XG5cbiAgICAgIHIxOiBbYzAgYzEgYzIgYzNdID0+IFtjMSBjMiBjMyBjMF1cbiAgICAgIHIyOiBbYzAgYzEgYzIgYzNdICAgIFtjMiBjMyBjMCBjMV1cbiAgICAgIHIzOiBbYzAgYzEgYzIgYzNdICAgIFtjMyBjMCBjMSBjMl1cblxuICAgICAgV2UgY2FuIG1ha2UgdGhlc2Ugc3Vic3RpdHV0aW9ucyBpbmxpbmUgd2l0aCBvdXIgY29sdW1uIG1peGluZyB0b1xuICAgICAgZ2VuZXJhdGUgYW4gdXBkYXRlZCBzZXQgb2YgZXF1YXRpb25zIHRvIHByb2R1Y2UgZWFjaCB3b3JkIGluIHRoZVxuICAgICAgc3RhdGUgKG5vdGUgdGhlIGNvbHVtbnMgaGF2ZSBjaGFuZ2VkIHBvc2l0aW9ucyk6XG5cbiAgICAgIGMwIGMxIGMyIGMzID0+IGMwIGMxIGMyIGMzXG4gICAgICBjMCBjMSBjMiBjMyAgICBjMSBjMiBjMyBjMCAgKGN5Y2xlZCAxIGJ5dGUpXG4gICAgICBjMCBjMSBjMiBjMyAgICBjMiBjMyBjMCBjMSAgKGN5Y2xlZCAyIGJ5dGVzKVxuICAgICAgYzAgYzEgYzIgYzMgICAgYzMgYzAgYzEgYzIgIChjeWNsZWQgMyBieXRlcylcblxuICAgICAgVGhlcmVmb3JlOlxuXG4gICAgICBjJzAgPSAyKnIwLGMwICsgMypyMSxjMSArIDEqcjIsYzIgKyAxKnIzLGMzXG4gICAgICBjJzAgPSAxKnIwLGMwICsgMipyMSxjMSArIDMqcjIsYzIgKyAxKnIzLGMzXG4gICAgICBjJzAgPSAxKnIwLGMwICsgMSpyMSxjMSArIDIqcjIsYzIgKyAzKnIzLGMzXG4gICAgICBjJzAgPSAzKnIwLGMwICsgMSpyMSxjMSArIDEqcjIsYzIgKyAyKnIzLGMzXG5cbiAgICAgIGMnMSA9IDIqcjAsYzEgKyAzKnIxLGMyICsgMSpyMixjMyArIDEqcjMsYzBcbiAgICAgIGMnMSA9IDEqcjAsYzEgKyAyKnIxLGMyICsgMypyMixjMyArIDEqcjMsYzBcbiAgICAgIGMnMSA9IDEqcjAsYzEgKyAxKnIxLGMyICsgMipyMixjMyArIDMqcjMsYzBcbiAgICAgIGMnMSA9IDMqcjAsYzEgKyAxKnIxLGMyICsgMSpyMixjMyArIDIqcjMsYzBcblxuICAgICAgLi4uIGFuZCBzbyBmb3J0aCBmb3IgYycyIGFuZCBjJzMuIFRoZSBpbXBvcnRhbnQgZGlzdGluY3Rpb24gaXNcbiAgICAgIHRoYXQgdGhlIGNvbHVtbnMgYXJlIGN5Y2xpbmcsIHdpdGggYzAgYmVpbmcgdXNlZCB3aXRoIHRoZSBtMFxuICAgICAgbWFwIHdoZW4gY2FsY3VsYXRpbmcgYzAsIGJ1dCBjMSBiZWluZyB1c2VkIHdpdGggdGhlIG0wIG1hcCB3aGVuXG4gICAgICBjYWxjdWxhdGluZyBjMSAuLi4gYW5kIHNvIGZvcnRoLlxuXG4gICAgICBXaGVuIHBlcmZvcm1pbmcgdGhlIGludmVyc2Ugd2UgdHJhbnNmb3JtIHRoZSBtaXJyb3IgaW1hZ2UgYW5kXG4gICAgICBza2lwIHRoZSBib3R0b20gcm93LCBpbnN0ZWFkIG9mIHRoZSB0b3Agb25lLCBhbmQgbW92ZSB1cHdhcmRzOlxuXG4gICAgICBjMyBjMiBjMSBjMCA9PiBjMCBjMyBjMiBjMSAgKGN5Y2xlZCAzIGJ5dGVzKSAqc2FtZSBhcyBlbmNyeXB0aW9uXG4gICAgICBjMyBjMiBjMSBjMCAgICBjMSBjMCBjMyBjMiAgKGN5Y2xlZCAyIGJ5dGVzKVxuICAgICAgYzMgYzIgYzEgYzAgICAgYzIgYzEgYzAgYzMgIChjeWNsZWQgMSBieXRlKSAgKnNhbWUgYXMgZW5jcnlwdGlvblxuICAgICAgYzMgYzIgYzEgYzAgICAgYzMgYzIgYzEgYzBcblxuICAgICAgSWYgeW91IGNvbXBhcmUgdGhlIHJlc3VsdGluZyBtYXRyaWNlcyBmb3IgU2hpZnRSb3dzKCkrTWl4Q29sdW1ucygpXG4gICAgICBhbmQgZm9yIEludlNoaWZ0Um93cygpK0ludk1peENvbHVtbnMoKSB0aGUgMm5kIGFuZCA0dGggY29sdW1ucyBhcmVcbiAgICAgIGRpZmZlcmVudCAoaW4gZW5jcnlwdCBtb2RlIHZzLiBkZWNyeXB0IG1vZGUpLiBTbyBpbiBvcmRlciB0byB1c2VcbiAgICAgIHRoZSBzYW1lIGNvZGUgdG8gaGFuZGxlIGJvdGggZW5jcnlwdGlvbiBhbmQgZGVjcnlwdGlvbiwgd2Ugd2lsbFxuICAgICAgbmVlZCB0byBkbyBzb21lIG1hcHBpbmcuXG5cbiAgICAgIElmIGluIGVuY3J5cHRpb24gbW9kZSB3ZSBsZXQgYT1jMCwgYj1jMSwgYz1jMiwgZD1jMywgYW5kIHI8Tj4gYmVcbiAgICAgIGEgcm93IG51bWJlciBpbiB0aGUgc3RhdGUsIHRoZW4gdGhlIHJlc3VsdGluZyBtYXRyaXggaW4gZW5jcnlwdGlvblxuICAgICAgbW9kZSBmb3IgYXBwbHlpbmcgdGhlIGFib3ZlIHRyYW5zZm9ybWF0aW9ucyB3b3VsZCBiZTpcblxuICAgICAgcjE6IGEgYiBjIGRcbiAgICAgIHIyOiBiIGMgZCBhXG4gICAgICByMzogYyBkIGEgYlxuICAgICAgcjQ6IGQgYSBiIGNcblxuICAgICAgSWYgd2UgZGlkIHRoZSBzYW1lIGluIGRlY3J5cHRpb24gbW9kZSB3ZSB3b3VsZCBnZXQ6XG5cbiAgICAgIHIxOiBhIGQgYyBiXG4gICAgICByMjogYiBhIGQgY1xuICAgICAgcjM6IGMgYiBhIGRcbiAgICAgIHI0OiBkIGMgYiBhXG5cbiAgICAgIElmIGluc3RlYWQgd2Ugc3dhcCBkIGFuZCBiIChzZXQgYj1jMyBhbmQgZD1jMSksIHRoZW4gd2UgZ2V0OlxuXG4gICAgICByMTogYSBiIGMgZFxuICAgICAgcjI6IGQgYSBiIGNcbiAgICAgIHIzOiBjIGQgYSBiXG4gICAgICByNDogYiBjIGQgYVxuXG4gICAgICBOb3cgdGhlIDFzdCBhbmQgM3JkIHJvd3MgYXJlIHRoZSBzYW1lIGFzIHRoZSBlbmNyeXB0aW9uIG1hdHJpeC4gQWxsXG4gICAgICB3ZSBuZWVkIHRvIGRvIHRoZW4gdG8gbWFrZSB0aGUgbWFwcGluZyBleGFjdGx5IHRoZSBzYW1lIGlzIHRvIHN3YXBcbiAgICAgIHRoZSAybmQgYW5kIDR0aCByb3dzIHdoZW4gaW4gZGVjcnlwdGlvbiBtb2RlLiBUbyBkbyB0aGlzIHdpdGhvdXRcbiAgICAgIGhhdmluZyB0byBkbyBpdCBvbiBlYWNoIGl0ZXJhdGlvbiwgd2Ugc3dhcHBlZCB0aGUgMm5kIGFuZCA0dGggcm93c1xuICAgICAgaW4gdGhlIGRlY3J5cHRpb24ga2V5IHNjaGVkdWxlLiBXZSBhbHNvIGhhdmUgdG8gZG8gdGhlIHN3YXAgYWJvdmVcbiAgICAgIHdoZW4gd2UgZmlyc3QgcHVsbCBpbiB0aGUgaW5wdXQgYW5kIHdoZW4gd2Ugc2V0IHRoZSBmaW5hbCBvdXRwdXQuICovXG4gICAgYTIgPVxuICAgICAgbTBbYSA+Pj4gMjRdIF5cbiAgICAgIG0xW2IgPj4+IDE2ICYgMjU1XSBeXG4gICAgICBtMltjID4+PiA4ICYgMjU1XSBeXG4gICAgICBtM1tkICYgMjU1XSBeIHdbKytpXTtcbiAgICBiMiA9XG4gICAgICBtMFtiID4+PiAyNF0gXlxuICAgICAgbTFbYyA+Pj4gMTYgJiAyNTVdIF5cbiAgICAgIG0yW2QgPj4+IDggJiAyNTVdIF5cbiAgICAgIG0zW2EgJiAyNTVdIF4gd1srK2ldO1xuICAgIGMyID1cbiAgICAgIG0wW2MgPj4+IDI0XSBeXG4gICAgICBtMVtkID4+PiAxNiAmIDI1NV0gXlxuICAgICAgbTJbYSA+Pj4gOCAmIDI1NV0gXlxuICAgICAgbTNbYiAmIDI1NV0gXiB3WysraV07XG4gICAgZCA9XG4gICAgICBtMFtkID4+PiAyNF0gXlxuICAgICAgbTFbYSA+Pj4gMTYgJiAyNTVdIF5cbiAgICAgIG0yW2IgPj4+IDggJiAyNTVdIF5cbiAgICAgIG0zW2MgJiAyNTVdIF4gd1srK2ldO1xuICAgIGEgPSBhMjtcbiAgICBiID0gYjI7XG4gICAgYyA9IGMyO1xuICB9XG5cbiAgLypcbiAgICBFbmNyeXB0OlxuICAgIFN1YkJ5dGVzKHN0YXRlKVxuICAgIFNoaWZ0Um93cyhzdGF0ZSlcbiAgICBBZGRSb3VuZEtleShzdGF0ZSwgd1tOcipOYiwgKE5yKzEpKk5iLTFdKVxuXG4gICAgRGVjcnlwdDpcbiAgICBJbnZTaGlmdFJvd3Moc3RhdGUpXG4gICAgSW52U3ViQnl0ZXMoc3RhdGUpXG4gICAgQWRkUm91bmRLZXkoc3RhdGUsIHdbMCwgTmItMV0pXG4gICAqL1xuICAgLy8gTm90ZTogcm93cyBhcmUgc2hpZnRlZCBpbmxpbmVcbiAgb3V0cHV0WzBdID1cbiAgICAoc3ViW2EgPj4+IDI0XSA8PCAyNCkgXlxuICAgIChzdWJbYiA+Pj4gMTYgJiAyNTVdIDw8IDE2KSBeXG4gICAgKHN1YltjID4+PiA4ICYgMjU1XSA8PCA4KSBeXG4gICAgKHN1YltkICYgMjU1XSkgXiB3WysraV07XG4gIG91dHB1dFtkZWNyeXB0ID8gMyA6IDFdID1cbiAgICAoc3ViW2IgPj4+IDI0XSA8PCAyNCkgXlxuICAgIChzdWJbYyA+Pj4gMTYgJiAyNTVdIDw8IDE2KSBeXG4gICAgKHN1YltkID4+PiA4ICYgMjU1XSA8PCA4KSBeXG4gICAgKHN1YlthICYgMjU1XSkgXiB3WysraV07XG4gIG91dHB1dFsyXSA9XG4gICAgKHN1YltjID4+PiAyNF0gPDwgMjQpIF5cbiAgICAoc3ViW2QgPj4+IDE2ICYgMjU1XSA8PCAxNikgXlxuICAgIChzdWJbYSA+Pj4gOCAmIDI1NV0gPDwgOCkgXlxuICAgIChzdWJbYiAmIDI1NV0pIF4gd1srK2ldO1xuICBvdXRwdXRbZGVjcnlwdCA/IDEgOiAzXSA9XG4gICAgKHN1YltkID4+PiAyNF0gPDwgMjQpIF5cbiAgICAoc3ViW2EgPj4+IDE2ICYgMjU1XSA8PCAxNikgXlxuICAgIChzdWJbYiA+Pj4gOCAmIDI1NV0gPDwgOCkgXlxuICAgIChzdWJbYyAmIDI1NV0pIF4gd1srK2ldO1xufTtcblxuXG5mb3JnZS5hZXMuX3VwZGF0ZUJsb2NrID0gX3VwZGF0ZUJsb2NrO1xuXG4vKipcbiAqIHJhbmRvbS5nZW5lcmF0ZVxuICovXG5cbi8vIHRoZSBkZWZhdWx0IHBybmcgcGx1Z2luLCB1c2VzIEFFUy0xMjhcbnZhciBwcm5nX2FlcyA9IHt9O1xudmFyIF9wcm5nX2Flc19vdXRwdXQgPSBuZXcgQXJyYXkoNCk7XG52YXIgX3BybmdfYWVzX2J1ZmZlciA9IGZvcmdlLnV0aWwuY3JlYXRlQnVmZmVyKCk7XG5wcm5nX2Flcy5mb3JtYXRLZXkgPSBmdW5jdGlvbihrZXkpIHtcbiAgLy8gY29udmVydCB0aGUga2V5IGludG8gMzItYml0IGludGVnZXJzXG4gIHZhciB0bXAgPSBmb3JnZS51dGlsLmNyZWF0ZUJ1ZmZlcihrZXkpO1xuICBrZXkgPSBuZXcgQXJyYXkoNCk7XG4gIGtleVswXSA9IHRtcC5nZXRJbnQzMigpO1xuICBrZXlbMV0gPSB0bXAuZ2V0SW50MzIoKTtcbiAga2V5WzJdID0gdG1wLmdldEludDMyKCk7XG4gIGtleVszXSA9IHRtcC5nZXRJbnQzMigpO1xuXG4gIC8vIHJldHVybiB0aGUgZXhwYW5kZWQga2V5XG4gIHJldHVybiBmb3JnZS5hZXMuX2V4cGFuZEtleShrZXksIGZhbHNlKTtcbn07XG5wcm5nX2Flcy5mb3JtYXRTZWVkID0gZnVuY3Rpb24oc2VlZCkge1xuICAvLyBjb252ZXJ0IHNlZWQgaW50byAzMi1iaXQgaW50ZWdlcnNcbiAgdmFyIHRtcCA9IGZvcmdlLnV0aWwuY3JlYXRlQnVmZmVyKHNlZWQpO1xuICBzZWVkID0gbmV3IEFycmF5KDQpO1xuICBzZWVkWzBdID0gdG1wLmdldEludDMyKCk7XG4gIHNlZWRbMV0gPSB0bXAuZ2V0SW50MzIoKTtcbiAgc2VlZFsyXSA9IHRtcC5nZXRJbnQzMigpO1xuICBzZWVkWzNdID0gdG1wLmdldEludDMyKCk7XG4gIHJldHVybiBzZWVkO1xufTtcbnBybmdfYWVzLmNpcGhlciA9IGZ1bmN0aW9uKGtleSwgc2VlZCkge1xuICBmb3JnZS5hZXMuX3VwZGF0ZUJsb2NrKGtleSwgc2VlZCwgX3BybmdfYWVzX291dHB1dCwgZmFsc2UpO1xuICBfcHJuZ19hZXNfYnVmZmVyLnB1dEludDMyKF9wcm5nX2Flc19vdXRwdXRbMF0pO1xuICBfcHJuZ19hZXNfYnVmZmVyLnB1dEludDMyKF9wcm5nX2Flc19vdXRwdXRbMV0pO1xuICBfcHJuZ19hZXNfYnVmZmVyLnB1dEludDMyKF9wcm5nX2Flc19vdXRwdXRbMl0pO1xuICBfcHJuZ19hZXNfYnVmZmVyLnB1dEludDMyKF9wcm5nX2Flc19vdXRwdXRbM10pO1xuICByZXR1cm4gX3BybmdfYWVzX2J1ZmZlci5nZXRCeXRlcygpO1xufTtcbnBybmdfYWVzLmluY3JlbWVudCA9IGZ1bmN0aW9uKHNlZWQpIHtcbiAgLy8gRklYTUU6IGRvIHdlIGNhcmUgYWJvdXQgY2Fycnkgb3Igc2lnbmVkIGlzc3Vlcz9cbiAgKytzZWVkWzNdO1xuICByZXR1cm4gc2VlZDtcbn07XG5wcm5nX2Flcy5tZCA9IGZvcmdlLm1kLnNoYTE7XG5cbi8vIGNyZWF0ZSBkZWZhdWx0IHBybmcgY29udGV4dFxudmFyIF9jdHggPSBmb3JnZS5wcm5nLmNyZWF0ZShwcm5nX2Flcyk7XG5cbi8vIGFkZCBvdGhlciBzb3VyY2VzIG9mIGVudHJvcHkgb25seSBpZiB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyBpcyBub3Rcbi8vIGF2YWlsYWJsZSAtLSBvdGhlcndpc2UgdGhpcyBzb3VyY2Ugd2lsbCBiZSBhdXRvbWF0aWNhbGx5IHVzZWQgYnkgdGhlIHBybmdcblxuaWYgKHR5cGVvZiB3aW5kb3cgPT0gJ3VuZGVmaW5lZCcgfHwgIXdpbmRvdy5jcnlwdG8gfHwgIXdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKSB7XG4vLyBpZiB0aGlzIGlzIGEgd2ViIHdvcmtlciwgZG8gbm90IHVzZSB3ZWFrIGVudHJvcHksIGluc3RlYWQgcmVnaXN0ZXIgdG9cbiAgLy8gcmVjZWl2ZSBzdHJvbmcgZW50cm9weSBhc3luY2hyb25vdXNseSBmcm9tIHRoZSBtYWluIHRocmVhZFxuICBpZih0eXBlb2Ygd2luZG93ID09PSAndW5kZWZpbmVkJyB8fCB3aW5kb3cuZG9jdW1lbnQgPT09IHVuZGVmaW5lZCkge1xuICAgIC8vIEZJWE1FOlxuICB9XG5cbiAgLy8gZ2V0IGxvYWQgdGltZSBlbnRyb3B5XG4gIF9jdHguY29sbGVjdEludCgrbmV3IERhdGUoKSwgMzIpO1xuXG4gIC8vIGFkZCBzb21lIGVudHJvcHkgZnJvbSBuYXZpZ2F0b3Igb2JqZWN0XG4gIGlmKHR5cGVvZihuYXZpZ2F0b3IpICE9PSAndW5kZWZpbmVkJykge1xuICAgIHZhciBfbmF2Qnl0ZXMgPSAnJztcbiAgICBmb3IodmFyIGtleSBpbiBuYXZpZ2F0b3IpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGlmKHR5cGVvZihuYXZpZ2F0b3Jba2V5XSkgPT0gJ3N0cmluZycpIHtcbiAgICAgICAgICBfbmF2Qnl0ZXMgKz0gbmF2aWdhdG9yW2tleV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGNhdGNoKGUpIHtcbiAgICAgICAgLyogU29tZSBuYXZpZ2F0b3Iga2V5cyBtaWdodCBub3QgYmUgYWNjZXNzaWJsZSwgZS5nLiB0aGUgZ2VvbG9jYXRpb25cbiAgICAgICAgICBhdHRyaWJ1dGUgdGhyb3dzIGFuIGV4Y2VwdGlvbiBpZiB0b3VjaGVkIGluIE1vemlsbGEgY2hyb21lOi8vXG4gICAgICAgICAgY29udGV4dC5cblxuICAgICAgICAgIFNpbGVudGx5IGlnbm9yZSB0aGlzIGFuZCBqdXN0IGRvbid0IHVzZSB0aGlzIGFzIGEgc291cmNlIG9mXG4gICAgICAgICAgZW50cm9weS4gKi9cbiAgICAgIH1cbiAgICB9XG4gICAgX2N0eC5jb2xsZWN0KF9uYXZCeXRlcyk7XG4gICAgX25hdkJ5dGVzID0gbnVsbDtcbiAgfVxufVxuXG5mb3JnZS5yYW5kb20gPSBfY3R4O1xuXG4vKipcbiAqIHJhbmRvbS5nZXRCeXRlc1xuICovXG5cbmZvcmdlLnJhbmRvbS5nZXRCeXRlcyA9IGZ1bmN0aW9uKGNvdW50LCBjYWxsYmFjaykge1xuICByZXR1cm4gZm9yZ2UucmFuZG9tLmdlbmVyYXRlKGNvdW50LCBjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIHBraVxuICogQGF1dGhvciBEYXZlIExvbmdsZXlcbiAqIEBhdXRob3IgU3RlZmFuIFNpZWdsIDxzdGVzaWVAYnJva2VucGlwZS5kZT5cbiAqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTAtMjAxMyBEaWdpdGFsIEJhemFhciwgSW5jLlxuICogQ29weXJpZ2h0IChjKSAyMDEyIFN0ZWZhbiBTaWVnbCA8c3Rlc2llQGJyb2tlbnBpcGUuZGU+XG4gKi9cblxuLyoqXG4gKiBwa2kucnNhLmNyZWF0ZUtleVBhaXJHZW5lcmF0aW9uU3RhdGVcbiAqL1xuXG5mb3JnZS5wa2kucnNhLmNyZWF0ZUtleVBhaXJHZW5lcmF0aW9uU3RhdGUgPSBmdW5jdGlvbihiaXRzLCBlKSB7XG4gIC8vIHNldCBkZWZhdWx0IGJpdHNcbiAgaWYodHlwZW9mKGJpdHMpID09PSAnc3RyaW5nJykge1xuICAgIGJpdHMgPSBwYXJzZUludChiaXRzLCAxMCk7XG4gIH1cbiAgYml0cyA9IGJpdHMgfHwgMTAyNDtcblxuICAvLyBjcmVhdGUgcHJuZyB3aXRoIGFwaSB0aGF0IG1hdGNoZXMgQmlnSW50ZWdlciBzZWN1cmUgcmFuZG9tXG4gIHZhciBybmcgPSB7XG4gICAgLy8geCBpcyBhbiBhcnJheSB0byBmaWxsIHdpdGggYnl0ZXNcbiAgICBuZXh0Qnl0ZXM6IGZ1bmN0aW9uKHgpIHtcbiAgICAgIHZhciBiID0gZm9yZ2UucmFuZG9tLmdldEJ5dGVzKHgubGVuZ3RoKTtcbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB4Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgIHhbaV0gPSBiLmNoYXJDb2RlQXQoaSk7XG4gICAgICB9XG4gICAgfVxuICB9O1xuXG4gIHZhciBydmFsID0ge1xuICAgIHN0YXRlOiAwLFxuICAgIGJpdHM6IGJpdHMsXG4gICAgcm5nOiBybmcsXG4gICAgZUludDogZSB8fCA2NTUzNyxcbiAgICBlOiBuZXcgQmlnSW50ZWdlcihudWxsKSxcbiAgICBwOiBudWxsLFxuICAgIHE6IG51bGwsXG4gICAgcUJpdHM6IGJpdHMgPj4gMSxcbiAgICBwQml0czogYml0cyAtIChiaXRzID4+IDEpLFxuICAgIHBxU3RhdGU6IDAsXG4gICAgbnVtOiBudWxsLFxuICAgIGtleXM6IG51bGxcbiAgfTtcbiAgcnZhbC5lLmZyb21JbnQocnZhbC5lSW50KTtcblxuICByZXR1cm4gcnZhbDtcbn07XG5cbi8qKlxuICoganNibi5CaWdJbnRlZ2VyXG4gKi9cblxudmFyIGRiaXRzO1xuXG4vLyBKYXZhU2NyaXB0IGVuZ2luZSBhbmFseXNpc1xudmFyIGNhbmFyeSA9IDB4ZGVhZGJlZWZjYWZlO1xudmFyIGpfbG0gPSAoKGNhbmFyeSYweGZmZmZmZik9PTB4ZWZjYWZlKTtcblxuLy8gKHB1YmxpYykgQ29uc3RydWN0b3JcbmZ1bmN0aW9uIEJpZ0ludGVnZXIoYSxiLGMpIHtcbiAgdGhpcy5kYXRhID0gW107XG4gIGlmKGEgIT0gbnVsbClcbiAgICBpZihcIm51bWJlclwiID09IHR5cGVvZiBhKSB0aGlzLmZyb21OdW1iZXIoYSxiLGMpO1xuICAgIGVsc2UgaWYoYiA9PSBudWxsICYmIFwic3RyaW5nXCIgIT0gdHlwZW9mIGEpIHRoaXMuZnJvbVN0cmluZyhhLDI1Nik7XG4gICAgZWxzZSB0aGlzLmZyb21TdHJpbmcoYSxiKTtcbn1cblxuLy8gcmV0dXJuIG5ldywgdW5zZXQgQmlnSW50ZWdlclxuZnVuY3Rpb24gbmJpKCkgeyByZXR1cm4gbmV3IEJpZ0ludGVnZXIobnVsbCk7IH1cblxuLy8gYW06IENvbXB1dGUgd19qICs9ICh4KnRoaXNfaSksIHByb3BhZ2F0ZSBjYXJyaWVzLFxuLy8gYyBpcyBpbml0aWFsIGNhcnJ5LCByZXR1cm5zIGZpbmFsIGNhcnJ5LlxuLy8gYyA8IDMqZHZhbHVlLCB4IDwgMipkdmFsdWUsIHRoaXNfaSA8IGR2YWx1ZVxuLy8gV2UgbmVlZCB0byBzZWxlY3QgdGhlIGZhc3Rlc3Qgb25lIHRoYXQgd29ya3MgaW4gdGhpcyBlbnZpcm9ubWVudC5cblxuLy8gYW0xOiB1c2UgYSBzaW5nbGUgbXVsdCBhbmQgZGl2aWRlIHRvIGdldCB0aGUgaGlnaCBiaXRzLFxuLy8gbWF4IGRpZ2l0IGJpdHMgc2hvdWxkIGJlIDI2IGJlY2F1c2Vcbi8vIG1heCBpbnRlcm5hbCB2YWx1ZSA9IDIqZHZhbHVlXjItMipkdmFsdWUgKDwgMl41MylcbmZ1bmN0aW9uIGFtMShpLHgsdyxqLGMsbikge1xuICB3aGlsZSgtLW4gPj0gMCkge1xuICAgIHZhciB2ID0geCp0aGlzLmRhdGFbaSsrXSt3LmRhdGFbal0rYztcbiAgICBjID0gTWF0aC5mbG9vcih2LzB4NDAwMDAwMCk7XG4gICAgdy5kYXRhW2orK10gPSB2JjB4M2ZmZmZmZjtcbiAgfVxuICByZXR1cm4gYztcbn1cbi8vIGFtMiBhdm9pZHMgYSBiaWcgbXVsdC1hbmQtZXh0cmFjdCBjb21wbGV0ZWx5LlxuLy8gTWF4IGRpZ2l0IGJpdHMgc2hvdWxkIGJlIDw9IDMwIGJlY2F1c2Ugd2UgZG8gYml0d2lzZSBvcHNcbi8vIG9uIHZhbHVlcyB1cCB0byAyKmhkdmFsdWVeMi1oZHZhbHVlLTEgKDwgMl4zMSlcbmZ1bmN0aW9uIGFtMihpLHgsdyxqLGMsbikge1xuICB2YXIgeGwgPSB4JjB4N2ZmZiwgeGggPSB4Pj4xNTtcbiAgd2hpbGUoLS1uID49IDApIHtcbiAgICB2YXIgbCA9IHRoaXMuZGF0YVtpXSYweDdmZmY7XG4gICAgdmFyIGggPSB0aGlzLmRhdGFbaSsrXT4+MTU7XG4gICAgdmFyIG0gPSB4aCpsK2gqeGw7XG4gICAgbCA9IHhsKmwrKChtJjB4N2ZmZik8PDE1KSt3LmRhdGFbal0rKGMmMHgzZmZmZmZmZik7XG4gICAgYyA9IChsPj4+MzApKyhtPj4+MTUpK3hoKmgrKGM+Pj4zMCk7XG4gICAgdy5kYXRhW2orK10gPSBsJjB4M2ZmZmZmZmY7XG4gIH1cbiAgcmV0dXJuIGM7XG59XG4vLyBBbHRlcm5hdGVseSwgc2V0IG1heCBkaWdpdCBiaXRzIHRvIDI4IHNpbmNlIHNvbWVcbi8vIGJyb3dzZXJzIHNsb3cgZG93biB3aGVuIGRlYWxpbmcgd2l0aCAzMi1iaXQgbnVtYmVycy5cbmZ1bmN0aW9uIGFtMyhpLHgsdyxqLGMsbikge1xuICB2YXIgeGwgPSB4JjB4M2ZmZiwgeGggPSB4Pj4xNDtcbiAgd2hpbGUoLS1uID49IDApIHtcbiAgICB2YXIgbCA9IHRoaXMuZGF0YVtpXSYweDNmZmY7XG4gICAgdmFyIGggPSB0aGlzLmRhdGFbaSsrXT4+MTQ7XG4gICAgdmFyIG0gPSB4aCpsK2gqeGw7XG4gICAgbCA9IHhsKmwrKChtJjB4M2ZmZik8PDE0KSt3LmRhdGFbal0rYztcbiAgICBjID0gKGw+PjI4KSsobT4+MTQpK3hoKmg7XG4gICAgdy5kYXRhW2orK10gPSBsJjB4ZmZmZmZmZjtcbiAgfVxuICByZXR1cm4gYztcbn1cblxuLy8gbm9kZS5qcyAobm8gYnJvd3NlcilcbmlmKHR5cGVvZihuYXZpZ2F0b3IpID09PSAndW5kZWZpbmVkJylcbntcbiAgIEJpZ0ludGVnZXIucHJvdG90eXBlLmFtID0gYW0zO1xuICAgZGJpdHMgPSAyODtcbn1cbmVsc2UgaWYoal9sbSAmJiAobmF2aWdhdG9yLmFwcE5hbWUgPT0gXCJNaWNyb3NvZnQgSW50ZXJuZXQgRXhwbG9yZXJcIikpIHtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW0gPSBhbTI7XG4gIGRiaXRzID0gMzA7XG59XG5lbHNlIGlmKGpfbG0gJiYgKG5hdmlnYXRvci5hcHBOYW1lICE9IFwiTmV0c2NhcGVcIikpIHtcbiAgQmlnSW50ZWdlci5wcm90b3R5cGUuYW0gPSBhbTE7XG4gIGRiaXRzID0gMjY7XG59XG5lbHNlIHsgLy8gTW96aWxsYS9OZXRzY2FwZSBzZWVtcyB0byBwcmVmZXIgYW0zXG4gIEJpZ0ludGVnZXIucHJvdG90eXBlLmFtID0gYW0zO1xuICBkYml0cyA9IDI4O1xufVxuXG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5EQiA9IGRiaXRzO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuRE0gPSAoKDE8PGRiaXRzKS0xKTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLkRWID0gKDE8PGRiaXRzKTtcblxudmFyIEJJX0ZQID0gNTI7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5GViA9IE1hdGgucG93KDIsQklfRlApO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuRjEgPSBCSV9GUC1kYml0cztcbkJpZ0ludGVnZXIucHJvdG90eXBlLkYyID0gMipkYml0cy1CSV9GUDtcblxuLy8gRGlnaXQgY29udmVyc2lvbnNcbnZhciBCSV9STSA9IFwiMDEyMzQ1Njc4OWFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6XCI7XG52YXIgQklfUkMgPSBuZXcgQXJyYXkoKTtcbnZhciBycix2djtcbnJyID0gXCIwXCIuY2hhckNvZGVBdCgwKTtcbmZvcih2diA9IDA7IHZ2IDw9IDk7ICsrdnYpIEJJX1JDW3JyKytdID0gdnY7XG5yciA9IFwiYVwiLmNoYXJDb2RlQXQoMCk7XG5mb3IodnYgPSAxMDsgdnYgPCAzNjsgKyt2dikgQklfUkNbcnIrK10gPSB2djtcbnJyID0gXCJBXCIuY2hhckNvZGVBdCgwKTtcbmZvcih2diA9IDEwOyB2diA8IDM2OyArK3Z2KSBCSV9SQ1tycisrXSA9IHZ2O1xuXG5mdW5jdGlvbiBpbnQyY2hhcihuKSB7IHJldHVybiBCSV9STS5jaGFyQXQobik7IH1cbmZ1bmN0aW9uIGludEF0KHMsaSkge1xuICB2YXIgYyA9IEJJX1JDW3MuY2hhckNvZGVBdChpKV07XG4gIHJldHVybiAoYz09bnVsbCk/LTE6Yztcbn1cblxuLy8gKHByb3RlY3RlZCkgY29weSB0aGlzIHRvIHJcbmZ1bmN0aW9uIGJucENvcHlUbyhyKSB7XG4gIGZvcih2YXIgaSA9IHRoaXMudC0xOyBpID49IDA7IC0taSkgci5kYXRhW2ldID0gdGhpcy5kYXRhW2ldO1xuICByLnQgPSB0aGlzLnQ7XG4gIHIucyA9IHRoaXMucztcbn1cblxuLy8gKHByb3RlY3RlZCkgc2V0IGZyb20gaW50ZWdlciB2YWx1ZSB4LCAtRFYgPD0geCA8IERWXG5mdW5jdGlvbiBibnBGcm9tSW50KHgpIHtcbiAgdGhpcy50ID0gMTtcbiAgdGhpcy5zID0gKHg8MCk/LTE6MDtcbiAgaWYoeCA+IDApIHRoaXMuZGF0YVswXSA9IHg7XG4gIGVsc2UgaWYoeCA8IC0xKSB0aGlzLmRhdGFbMF0gPSB4K0RWO1xuICBlbHNlIHRoaXMudCA9IDA7XG59XG5cbi8vIHJldHVybiBiaWdpbnQgaW5pdGlhbGl6ZWQgdG8gdmFsdWVcbmZ1bmN0aW9uIG5idihpKSB7IHZhciByID0gbmJpKCk7IHIuZnJvbUludChpKTsgcmV0dXJuIHI7IH1cblxuLy8gKHByb3RlY3RlZCkgc2V0IGZyb20gc3RyaW5nIGFuZCByYWRpeFxuZnVuY3Rpb24gYm5wRnJvbVN0cmluZyhzLGIpIHtcbiAgdmFyIGs7XG4gIGlmKGIgPT0gMTYpIGsgPSA0O1xuICBlbHNlIGlmKGIgPT0gOCkgayA9IDM7XG4gIGVsc2UgaWYoYiA9PSAyNTYpIGsgPSA4OyAvLyBieXRlIGFycmF5XG4gIGVsc2UgaWYoYiA9PSAyKSBrID0gMTtcbiAgZWxzZSBpZihiID09IDMyKSBrID0gNTtcbiAgZWxzZSBpZihiID09IDQpIGsgPSAyO1xuICBlbHNlIHsgdGhpcy5mcm9tUmFkaXgocyxiKTsgcmV0dXJuOyB9XG4gIHRoaXMudCA9IDA7XG4gIHRoaXMucyA9IDA7XG4gIHZhciBpID0gcy5sZW5ndGgsIG1pID0gZmFsc2UsIHNoID0gMDtcbiAgd2hpbGUoLS1pID49IDApIHtcbiAgICB2YXIgeCA9IChrPT04KT9zW2ldJjB4ZmY6aW50QXQocyxpKTtcbiAgICBpZih4IDwgMCkge1xuICAgICAgaWYocy5jaGFyQXQoaSkgPT0gXCItXCIpIG1pID0gdHJ1ZTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBtaSA9IGZhbHNlO1xuICAgIGlmKHNoID09IDApXG4gICAgICB0aGlzLmRhdGFbdGhpcy50KytdID0geDtcbiAgICBlbHNlIGlmKHNoK2sgPiB0aGlzLkRCKSB7XG4gICAgICB0aGlzLmRhdGFbdGhpcy50LTFdIHw9ICh4JigoMTw8KHRoaXMuREItc2gpKS0xKSk8PHNoO1xuICAgICAgdGhpcy5kYXRhW3RoaXMudCsrXSA9ICh4Pj4odGhpcy5EQi1zaCkpO1xuICAgIH1cbiAgICBlbHNlXG4gICAgICB0aGlzLmRhdGFbdGhpcy50LTFdIHw9IHg8PHNoO1xuICAgIHNoICs9IGs7XG4gICAgaWYoc2ggPj0gdGhpcy5EQikgc2ggLT0gdGhpcy5EQjtcbiAgfVxuICBpZihrID09IDggJiYgKHNbMF0mMHg4MCkgIT0gMCkge1xuICAgIHRoaXMucyA9IC0xO1xuICAgIGlmKHNoID4gMCkgdGhpcy5kYXRhW3RoaXMudC0xXSB8PSAoKDE8PCh0aGlzLkRCLXNoKSktMSk8PHNoO1xuICB9XG4gIHRoaXMuY2xhbXAoKTtcbiAgaWYobWkpIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyh0aGlzLHRoaXMpO1xufVxuXG4vLyAocHJvdGVjdGVkKSBjbGFtcCBvZmYgZXhjZXNzIGhpZ2ggd29yZHNcbmZ1bmN0aW9uIGJucENsYW1wKCkge1xuICB2YXIgYyA9IHRoaXMucyZ0aGlzLkRNO1xuICB3aGlsZSh0aGlzLnQgPiAwICYmIHRoaXMuZGF0YVt0aGlzLnQtMV0gPT0gYykgLS10aGlzLnQ7XG59XG5cbi8vIChwdWJsaWMpIHJldHVybiBzdHJpbmcgcmVwcmVzZW50YXRpb24gaW4gZ2l2ZW4gcmFkaXhcbmZ1bmN0aW9uIGJuVG9TdHJpbmcoYikge1xuICBpZih0aGlzLnMgPCAwKSByZXR1cm4gXCItXCIrdGhpcy5uZWdhdGUoKS50b1N0cmluZyhiKTtcbiAgdmFyIGs7XG4gIGlmKGIgPT0gMTYpIGsgPSA0O1xuICBlbHNlIGlmKGIgPT0gOCkgayA9IDM7XG4gIGVsc2UgaWYoYiA9PSAyKSBrID0gMTtcbiAgZWxzZSBpZihiID09IDMyKSBrID0gNTtcbiAgZWxzZSBpZihiID09IDQpIGsgPSAyO1xuICBlbHNlIHJldHVybiB0aGlzLnRvUmFkaXgoYik7XG4gIHZhciBrbSA9ICgxPDxrKS0xLCBkLCBtID0gZmFsc2UsIHIgPSBcIlwiLCBpID0gdGhpcy50O1xuICB2YXIgcCA9IHRoaXMuREItKGkqdGhpcy5EQiklaztcbiAgaWYoaS0tID4gMCkge1xuICAgIGlmKHAgPCB0aGlzLkRCICYmIChkID0gdGhpcy5kYXRhW2ldPj5wKSA+IDApIHsgbSA9IHRydWU7IHIgPSBpbnQyY2hhcihkKTsgfVxuICAgIHdoaWxlKGkgPj0gMCkge1xuICAgICAgaWYocCA8IGspIHtcbiAgICAgICAgZCA9ICh0aGlzLmRhdGFbaV0mKCgxPDxwKS0xKSk8PChrLXApO1xuICAgICAgICBkIHw9IHRoaXMuZGF0YVstLWldPj4ocCs9dGhpcy5EQi1rKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBkID0gKHRoaXMuZGF0YVtpXT4+KHAtPWspKSZrbTtcbiAgICAgICAgaWYocCA8PSAwKSB7IHAgKz0gdGhpcy5EQjsgLS1pOyB9XG4gICAgICB9XG4gICAgICBpZihkID4gMCkgbSA9IHRydWU7XG4gICAgICBpZihtKSByICs9IGludDJjaGFyKGQpO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbT9yOlwiMFwiO1xufVxuXG4vLyAocHVibGljKSAtdGhpc1xuZnVuY3Rpb24gYm5OZWdhdGUoKSB7IHZhciByID0gbmJpKCk7IEJpZ0ludGVnZXIuWkVSTy5zdWJUbyh0aGlzLHIpOyByZXR1cm4gcjsgfVxuXG4vLyAocHVibGljKSB8dGhpc3xcbmZ1bmN0aW9uIGJuQWJzKCkgeyByZXR1cm4gKHRoaXMuczwwKT90aGlzLm5lZ2F0ZSgpOnRoaXM7IH1cblxuLy8gKHB1YmxpYykgcmV0dXJuICsgaWYgdGhpcyA+IGEsIC0gaWYgdGhpcyA8IGEsIDAgaWYgZXF1YWxcbmZ1bmN0aW9uIGJuQ29tcGFyZVRvKGEpIHtcbiAgdmFyIHIgPSB0aGlzLnMtYS5zO1xuICBpZihyICE9IDApIHJldHVybiByO1xuICB2YXIgaSA9IHRoaXMudDtcbiAgciA9IGktYS50O1xuICBpZihyICE9IDApIHJldHVybiAodGhpcy5zPDApPy1yOnI7XG4gIHdoaWxlKC0taSA+PSAwKSBpZigocj10aGlzLmRhdGFbaV0tYS5kYXRhW2ldKSAhPSAwKSByZXR1cm4gcjtcbiAgcmV0dXJuIDA7XG59XG5cbi8vIHJldHVybnMgYml0IGxlbmd0aCBvZiB0aGUgaW50ZWdlciB4XG5mdW5jdGlvbiBuYml0cyh4KSB7XG4gIHZhciByID0gMSwgdDtcbiAgaWYoKHQ9eD4+PjE2KSAhPSAwKSB7IHggPSB0OyByICs9IDE2OyB9XG4gIGlmKCh0PXg+PjgpICE9IDApIHsgeCA9IHQ7IHIgKz0gODsgfVxuICBpZigodD14Pj40KSAhPSAwKSB7IHggPSB0OyByICs9IDQ7IH1cbiAgaWYoKHQ9eD4+MikgIT0gMCkgeyB4ID0gdDsgciArPSAyOyB9XG4gIGlmKCh0PXg+PjEpICE9IDApIHsgeCA9IHQ7IHIgKz0gMTsgfVxuICByZXR1cm4gcjtcbn1cblxuLy8gKHB1YmxpYykgcmV0dXJuIHRoZSBudW1iZXIgb2YgYml0cyBpbiBcInRoaXNcIlxuZnVuY3Rpb24gYm5CaXRMZW5ndGgoKSB7XG4gIGlmKHRoaXMudCA8PSAwKSByZXR1cm4gMDtcbiAgcmV0dXJuIHRoaXMuREIqKHRoaXMudC0xKStuYml0cyh0aGlzLmRhdGFbdGhpcy50LTFdXih0aGlzLnMmdGhpcy5ETSkpO1xufVxuXG4vLyAocHJvdGVjdGVkKSByID0gdGhpcyA8PCBuKkRCXG5mdW5jdGlvbiBibnBETFNoaWZ0VG8obixyKSB7XG4gIHZhciBpO1xuICBmb3IoaSA9IHRoaXMudC0xOyBpID49IDA7IC0taSkgci5kYXRhW2krbl0gPSB0aGlzLmRhdGFbaV07XG4gIGZvcihpID0gbi0xOyBpID49IDA7IC0taSkgci5kYXRhW2ldID0gMDtcbiAgci50ID0gdGhpcy50K247XG4gIHIucyA9IHRoaXMucztcbn1cblxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgPj4gbipEQlxuZnVuY3Rpb24gYm5wRFJTaGlmdFRvKG4scikge1xuICBmb3IodmFyIGkgPSBuOyBpIDwgdGhpcy50OyArK2kpIHIuZGF0YVtpLW5dID0gdGhpcy5kYXRhW2ldO1xuICByLnQgPSBNYXRoLm1heCh0aGlzLnQtbiwwKTtcbiAgci5zID0gdGhpcy5zO1xufVxuXG4vLyAocHJvdGVjdGVkKSByID0gdGhpcyA8PCBuXG5mdW5jdGlvbiBibnBMU2hpZnRUbyhuLHIpIHtcbiAgdmFyIGJzID0gbiV0aGlzLkRCO1xuICB2YXIgY2JzID0gdGhpcy5EQi1icztcbiAgdmFyIGJtID0gKDE8PGNicyktMTtcbiAgdmFyIGRzID0gTWF0aC5mbG9vcihuL3RoaXMuREIpLCBjID0gKHRoaXMuczw8YnMpJnRoaXMuRE0sIGk7XG4gIGZvcihpID0gdGhpcy50LTE7IGkgPj0gMDsgLS1pKSB7XG4gICAgci5kYXRhW2krZHMrMV0gPSAodGhpcy5kYXRhW2ldPj5jYnMpfGM7XG4gICAgYyA9ICh0aGlzLmRhdGFbaV0mYm0pPDxicztcbiAgfVxuICBmb3IoaSA9IGRzLTE7IGkgPj0gMDsgLS1pKSByLmRhdGFbaV0gPSAwO1xuICByLmRhdGFbZHNdID0gYztcbiAgci50ID0gdGhpcy50K2RzKzE7XG4gIHIucyA9IHRoaXMucztcbiAgci5jbGFtcCgpO1xufVxuXG4vLyAocHJvdGVjdGVkKSByID0gdGhpcyA+PiBuXG5mdW5jdGlvbiBibnBSU2hpZnRUbyhuLHIpIHtcbiAgci5zID0gdGhpcy5zO1xuICB2YXIgZHMgPSBNYXRoLmZsb29yKG4vdGhpcy5EQik7XG4gIGlmKGRzID49IHRoaXMudCkgeyByLnQgPSAwOyByZXR1cm47IH1cbiAgdmFyIGJzID0gbiV0aGlzLkRCO1xuICB2YXIgY2JzID0gdGhpcy5EQi1icztcbiAgdmFyIGJtID0gKDE8PGJzKS0xO1xuICByLmRhdGFbMF0gPSB0aGlzLmRhdGFbZHNdPj5icztcbiAgZm9yKHZhciBpID0gZHMrMTsgaSA8IHRoaXMudDsgKytpKSB7XG4gICAgci5kYXRhW2ktZHMtMV0gfD0gKHRoaXMuZGF0YVtpXSZibSk8PGNicztcbiAgICByLmRhdGFbaS1kc10gPSB0aGlzLmRhdGFbaV0+PmJzO1xuICB9XG4gIGlmKGJzID4gMCkgci5kYXRhW3RoaXMudC1kcy0xXSB8PSAodGhpcy5zJmJtKTw8Y2JzO1xuICByLnQgPSB0aGlzLnQtZHM7XG4gIHIuY2xhbXAoKTtcbn1cblxuLy8gKHByb3RlY3RlZCkgciA9IHRoaXMgLSBhXG5mdW5jdGlvbiBibnBTdWJUbyhhLHIpIHtcbiAgdmFyIGkgPSAwLCBjID0gMCwgbSA9IE1hdGgubWluKGEudCx0aGlzLnQpO1xuICB3aGlsZShpIDwgbSkge1xuICAgIGMgKz0gdGhpcy5kYXRhW2ldLWEuZGF0YVtpXTtcbiAgICByLmRhdGFbaSsrXSA9IGMmdGhpcy5ETTtcbiAgICBjID4+PSB0aGlzLkRCO1xuICB9XG4gIGlmKGEudCA8IHRoaXMudCkge1xuICAgIGMgLT0gYS5zO1xuICAgIHdoaWxlKGkgPCB0aGlzLnQpIHtcbiAgICAgIGMgKz0gdGhpcy5kYXRhW2ldO1xuICAgICAgci5kYXRhW2krK10gPSBjJnRoaXMuRE07XG4gICAgICBjID4+PSB0aGlzLkRCO1xuICAgIH1cbiAgICBjICs9IHRoaXMucztcbiAgfVxuICBlbHNlIHtcbiAgICBjICs9IHRoaXMucztcbiAgICB3aGlsZShpIDwgYS50KSB7XG4gICAgICBjIC09IGEuZGF0YVtpXTtcbiAgICAgIHIuZGF0YVtpKytdID0gYyZ0aGlzLkRNO1xuICAgICAgYyA+Pj0gdGhpcy5EQjtcbiAgICB9XG4gICAgYyAtPSBhLnM7XG4gIH1cbiAgci5zID0gKGM8MCk/LTE6MDtcbiAgaWYoYyA8IC0xKSByLmRhdGFbaSsrXSA9IHRoaXMuRFYrYztcbiAgZWxzZSBpZihjID4gMCkgci5kYXRhW2krK10gPSBjO1xuICByLnQgPSBpO1xuICByLmNsYW1wKCk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIHIgPSB0aGlzICogYSwgciAhPSB0aGlzLGEgKEhBQyAxNC4xMilcbi8vIFwidGhpc1wiIHNob3VsZCBiZSB0aGUgbGFyZ2VyIG9uZSBpZiBhcHByb3ByaWF0ZS5cbmZ1bmN0aW9uIGJucE11bHRpcGx5VG8oYSxyKSB7XG4gIHZhciB4ID0gdGhpcy5hYnMoKSwgeSA9IGEuYWJzKCk7XG4gIHZhciBpID0geC50O1xuICByLnQgPSBpK3kudDtcbiAgd2hpbGUoLS1pID49IDApIHIuZGF0YVtpXSA9IDA7XG4gIGZvcihpID0gMDsgaSA8IHkudDsgKytpKSByLmRhdGFbaSt4LnRdID0geC5hbSgwLHkuZGF0YVtpXSxyLGksMCx4LnQpO1xuICByLnMgPSAwO1xuICByLmNsYW1wKCk7XG4gIGlmKHRoaXMucyAhPSBhLnMpIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhyLHIpO1xufVxuXG4vLyAocHJvdGVjdGVkKSByID0gdGhpc14yLCByICE9IHRoaXMgKEhBQyAxNC4xNilcbmZ1bmN0aW9uIGJucFNxdWFyZVRvKHIpIHtcbiAgdmFyIHggPSB0aGlzLmFicygpO1xuICB2YXIgaSA9IHIudCA9IDIqeC50O1xuICB3aGlsZSgtLWkgPj0gMCkgci5kYXRhW2ldID0gMDtcbiAgZm9yKGkgPSAwOyBpIDwgeC50LTE7ICsraSkge1xuICAgIHZhciBjID0geC5hbShpLHguZGF0YVtpXSxyLDIqaSwwLDEpO1xuICAgIGlmKChyLmRhdGFbaSt4LnRdKz14LmFtKGkrMSwyKnguZGF0YVtpXSxyLDIqaSsxLGMseC50LWktMSkpID49IHguRFYpIHtcbiAgICAgIHIuZGF0YVtpK3gudF0gLT0geC5EVjtcbiAgICAgIHIuZGF0YVtpK3gudCsxXSA9IDE7XG4gICAgfVxuICB9XG4gIGlmKHIudCA+IDApIHIuZGF0YVtyLnQtMV0gKz0geC5hbShpLHguZGF0YVtpXSxyLDIqaSwwLDEpO1xuICByLnMgPSAwO1xuICByLmNsYW1wKCk7XG59XG5cbi8vIChwcm90ZWN0ZWQpIGRpdmlkZSB0aGlzIGJ5IG0sIHF1b3RpZW50IGFuZCByZW1haW5kZXIgdG8gcSwgciAoSEFDIDE0LjIwKVxuLy8gciAhPSBxLCB0aGlzICE9IG0uICBxIG9yIHIgbWF5IGJlIG51bGwuXG5mdW5jdGlvbiBibnBEaXZSZW1UbyhtLHEscikge1xuICB2YXIgcG0gPSBtLmFicygpO1xuICBpZihwbS50IDw9IDApIHJldHVybjtcbiAgdmFyIHB0ID0gdGhpcy5hYnMoKTtcbiAgaWYocHQudCA8IHBtLnQpIHtcbiAgICBpZihxICE9IG51bGwpIHEuZnJvbUludCgwKTtcbiAgICBpZihyICE9IG51bGwpIHRoaXMuY29weVRvKHIpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZihyID09IG51bGwpIHIgPSBuYmkoKTtcbiAgdmFyIHkgPSBuYmkoKSwgdHMgPSB0aGlzLnMsIG1zID0gbS5zO1xuICB2YXIgbnNoID0gdGhpcy5EQi1uYml0cyhwbS5kYXRhW3BtLnQtMV0pOyAvLyBub3JtYWxpemUgbW9kdWx1c1xuICBpZihuc2ggPiAwKSB7IHBtLmxTaGlmdFRvKG5zaCx5KTsgcHQubFNoaWZ0VG8obnNoLHIpOyB9XG4gIGVsc2UgeyBwbS5jb3B5VG8oeSk7IHB0LmNvcHlUbyhyKTsgfVxuICB2YXIgeXMgPSB5LnQ7XG4gIHZhciB5MCA9IHkuZGF0YVt5cy0xXTtcbiAgaWYoeTAgPT0gMCkgcmV0dXJuO1xuICB2YXIgeXQgPSB5MCooMTw8dGhpcy5GMSkrKCh5cz4xKT95LmRhdGFbeXMtMl0+PnRoaXMuRjI6MCk7XG4gIHZhciBkMSA9IHRoaXMuRlYveXQsIGQyID0gKDE8PHRoaXMuRjEpL3l0LCBlID0gMTw8dGhpcy5GMjtcbiAgdmFyIGkgPSByLnQsIGogPSBpLXlzLCB0ID0gKHE9PW51bGwpP25iaSgpOnE7XG4gIHkuZGxTaGlmdFRvKGosdCk7XG4gIGlmKHIuY29tcGFyZVRvKHQpID49IDApIHtcbiAgICByLmRhdGFbci50KytdID0gMTtcbiAgICByLnN1YlRvKHQscik7XG4gIH1cbiAgQmlnSW50ZWdlci5PTkUuZGxTaGlmdFRvKHlzLHQpO1xuICB0LnN1YlRvKHkseSk7IC8vIFwibmVnYXRpdmVcIiB5IHNvIHdlIGNhbiByZXBsYWNlIHN1YiB3aXRoIGFtIGxhdGVyXG4gIHdoaWxlKHkudCA8IHlzKSB5LmRhdGFbeS50KytdID0gMDtcbiAgd2hpbGUoLS1qID49IDApIHtcbiAgICAvLyBFc3RpbWF0ZSBxdW90aWVudCBkaWdpdFxuICAgIHZhciBxZCA9IChyLmRhdGFbLS1pXT09eTApP3RoaXMuRE06TWF0aC5mbG9vcihyLmRhdGFbaV0qZDErKHIuZGF0YVtpLTFdK2UpKmQyKTtcbiAgICBpZigoci5kYXRhW2ldKz15LmFtKDAscWQscixqLDAseXMpKSA8IHFkKSB7IC8vIFRyeSBpdCBvdXRcbiAgICAgIHkuZGxTaGlmdFRvKGosdCk7XG4gICAgICByLnN1YlRvKHQscik7XG4gICAgICB3aGlsZShyLmRhdGFbaV0gPCAtLXFkKSByLnN1YlRvKHQscik7XG4gICAgfVxuICB9XG4gIGlmKHEgIT0gbnVsbCkge1xuICAgIHIuZHJTaGlmdFRvKHlzLHEpO1xuICAgIGlmKHRzICE9IG1zKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8ocSxxKTtcbiAgfVxuICByLnQgPSB5cztcbiAgci5jbGFtcCgpO1xuICBpZihuc2ggPiAwKSByLnJTaGlmdFRvKG5zaCxyKTsgIC8vIERlbm9ybWFsaXplIHJlbWFpbmRlclxuICBpZih0cyA8IDApIEJpZ0ludGVnZXIuWkVSTy5zdWJUbyhyLHIpO1xufVxuXG4vLyAocHVibGljKSB0aGlzIG1vZCBhXG5mdW5jdGlvbiBibk1vZChhKSB7XG4gIHZhciByID0gbmJpKCk7XG4gIHRoaXMuYWJzKCkuZGl2UmVtVG8oYSxudWxsLHIpO1xuICBpZih0aGlzLnMgPCAwICYmIHIuY29tcGFyZVRvKEJpZ0ludGVnZXIuWkVSTykgPiAwKSBhLnN1YlRvKHIscik7XG4gIHJldHVybiByO1xufVxuXG4vLyBNb2R1bGFyIHJlZHVjdGlvbiB1c2luZyBcImNsYXNzaWNcIiBhbGdvcml0aG1cbmZ1bmN0aW9uIENsYXNzaWMobSkgeyB0aGlzLm0gPSBtOyB9XG5mdW5jdGlvbiBjQ29udmVydCh4KSB7XG4gIGlmKHgucyA8IDAgfHwgeC5jb21wYXJlVG8odGhpcy5tKSA+PSAwKSByZXR1cm4geC5tb2QodGhpcy5tKTtcbiAgZWxzZSByZXR1cm4geDtcbn1cbmZ1bmN0aW9uIGNSZXZlcnQoeCkgeyByZXR1cm4geDsgfVxuZnVuY3Rpb24gY1JlZHVjZSh4KSB7IHguZGl2UmVtVG8odGhpcy5tLG51bGwseCk7IH1cbmZ1bmN0aW9uIGNNdWxUbyh4LHkscikgeyB4Lm11bHRpcGx5VG8oeSxyKTsgdGhpcy5yZWR1Y2Uocik7IH1cbmZ1bmN0aW9uIGNTcXJUbyh4LHIpIHsgeC5zcXVhcmVUbyhyKTsgdGhpcy5yZWR1Y2Uocik7IH1cblxuQ2xhc3NpYy5wcm90b3R5cGUuY29udmVydCA9IGNDb252ZXJ0O1xuQ2xhc3NpYy5wcm90b3R5cGUucmV2ZXJ0ID0gY1JldmVydDtcbkNsYXNzaWMucHJvdG90eXBlLnJlZHVjZSA9IGNSZWR1Y2U7XG5DbGFzc2ljLnByb3RvdHlwZS5tdWxUbyA9IGNNdWxUbztcbkNsYXNzaWMucHJvdG90eXBlLnNxclRvID0gY1NxclRvO1xuXG4vLyAocHJvdGVjdGVkKSByZXR1cm4gXCItMS90aGlzICUgMl5EQlwiOyB1c2VmdWwgZm9yIE1vbnQuIHJlZHVjdGlvblxuLy8ganVzdGlmaWNhdGlvbjpcbi8vICAgICAgICAgeHkgPT0gMSAobW9kIG0pXG4vLyAgICAgICAgIHh5ID0gIDEra21cbi8vICAgeHkoMi14eSkgPSAoMStrbSkoMS1rbSlcbi8vIHhbeSgyLXh5KV0gPSAxLWteMm1eMlxuLy8geFt5KDIteHkpXSA9PSAxIChtb2QgbV4yKVxuLy8gaWYgeSBpcyAxL3ggbW9kIG0sIHRoZW4geSgyLXh5KSBpcyAxL3ggbW9kIG1eMlxuLy8gc2hvdWxkIHJlZHVjZSB4IGFuZCB5KDIteHkpIGJ5IG1eMiBhdCBlYWNoIHN0ZXAgdG8ga2VlcCBzaXplIGJvdW5kZWQuXG4vLyBKUyBtdWx0aXBseSBcIm92ZXJmbG93c1wiIGRpZmZlcmVudGx5IGZyb20gQy9DKyssIHNvIGNhcmUgaXMgbmVlZGVkIGhlcmUuXG5mdW5jdGlvbiBibnBJbnZEaWdpdCgpIHtcbiAgaWYodGhpcy50IDwgMSkgcmV0dXJuIDA7XG4gIHZhciB4ID0gdGhpcy5kYXRhWzBdO1xuICBpZigoeCYxKSA9PSAwKSByZXR1cm4gMDtcbiAgdmFyIHkgPSB4JjM7ICAgIC8vIHkgPT0gMS94IG1vZCAyXjJcbiAgeSA9ICh5KigyLSh4JjB4ZikqeSkpJjB4ZjsgIC8vIHkgPT0gMS94IG1vZCAyXjRcbiAgeSA9ICh5KigyLSh4JjB4ZmYpKnkpKSYweGZmOyAgLy8geSA9PSAxL3ggbW9kIDJeOFxuICB5ID0gKHkqKDItKCgoeCYweGZmZmYpKnkpJjB4ZmZmZikpKSYweGZmZmY7IC8vIHkgPT0gMS94IG1vZCAyXjE2XG4gIC8vIGxhc3Qgc3RlcCAtIGNhbGN1bGF0ZSBpbnZlcnNlIG1vZCBEViBkaXJlY3RseTtcbiAgLy8gYXNzdW1lcyAxNiA8IERCIDw9IDMyIGFuZCBhc3N1bWVzIGFiaWxpdHkgdG8gaGFuZGxlIDQ4LWJpdCBpbnRzXG4gIHkgPSAoeSooMi14KnkldGhpcy5EVikpJXRoaXMuRFY7ICAgIC8vIHkgPT0gMS94IG1vZCAyXmRiaXRzXG4gIC8vIHdlIHJlYWxseSB3YW50IHRoZSBuZWdhdGl2ZSBpbnZlcnNlLCBhbmQgLURWIDwgeSA8IERWXG4gIHJldHVybiAoeT4wKT90aGlzLkRWLXk6LXk7XG59XG5cbi8vIE1vbnRnb21lcnkgcmVkdWN0aW9uXG5mdW5jdGlvbiBNb250Z29tZXJ5KG0pIHtcbiAgdGhpcy5tID0gbTtcbiAgdGhpcy5tcCA9IG0uaW52RGlnaXQoKTtcbiAgdGhpcy5tcGwgPSB0aGlzLm1wJjB4N2ZmZjtcbiAgdGhpcy5tcGggPSB0aGlzLm1wPj4xNTtcbiAgdGhpcy51bSA9ICgxPDwobS5EQi0xNSkpLTE7XG4gIHRoaXMubXQyID0gMiptLnQ7XG59XG5cbi8vIHhSIG1vZCBtXG5mdW5jdGlvbiBtb250Q29udmVydCh4KSB7XG4gIHZhciByID0gbmJpKCk7XG4gIHguYWJzKCkuZGxTaGlmdFRvKHRoaXMubS50LHIpO1xuICByLmRpdlJlbVRvKHRoaXMubSxudWxsLHIpO1xuICBpZih4LnMgPCAwICYmIHIuY29tcGFyZVRvKEJpZ0ludGVnZXIuWkVSTykgPiAwKSB0aGlzLm0uc3ViVG8ocixyKTtcbiAgcmV0dXJuIHI7XG59XG5cbi8vIHgvUiBtb2QgbVxuZnVuY3Rpb24gbW9udFJldmVydCh4KSB7XG4gIHZhciByID0gbmJpKCk7XG4gIHguY29weVRvKHIpO1xuICB0aGlzLnJlZHVjZShyKTtcbiAgcmV0dXJuIHI7XG59XG5cbi8vIHggPSB4L1IgbW9kIG0gKEhBQyAxNC4zMilcbmZ1bmN0aW9uIG1vbnRSZWR1Y2UoeCkge1xuICB3aGlsZSh4LnQgPD0gdGhpcy5tdDIpICAvLyBwYWQgeCBzbyBhbSBoYXMgZW5vdWdoIHJvb20gbGF0ZXJcbiAgICB4LmRhdGFbeC50KytdID0gMDtcbiAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMubS50OyArK2kpIHtcbiAgICAvLyBmYXN0ZXIgd2F5IG9mIGNhbGN1bGF0aW5nIHUwID0geC5kYXRhW2ldKm1wIG1vZCBEVlxuICAgIHZhciBqID0geC5kYXRhW2ldJjB4N2ZmZjtcbiAgICB2YXIgdTAgPSAoaip0aGlzLm1wbCsoKChqKnRoaXMubXBoKyh4LmRhdGFbaV0+PjE1KSp0aGlzLm1wbCkmdGhpcy51bSk8PDE1KSkmeC5ETTtcbiAgICAvLyB1c2UgYW0gdG8gY29tYmluZSB0aGUgbXVsdGlwbHktc2hpZnQtYWRkIGludG8gb25lIGNhbGxcbiAgICBqID0gaSt0aGlzLm0udDtcbiAgICB4LmRhdGFbal0gKz0gdGhpcy5tLmFtKDAsdTAseCxpLDAsdGhpcy5tLnQpO1xuICAgIC8vIHByb3BhZ2F0ZSBjYXJyeVxuICAgIHdoaWxlKHguZGF0YVtqXSA+PSB4LkRWKSB7IHguZGF0YVtqXSAtPSB4LkRWOyB4LmRhdGFbKytqXSsrOyB9XG4gIH1cbiAgeC5jbGFtcCgpO1xuICB4LmRyU2hpZnRUbyh0aGlzLm0udCx4KTtcbiAgaWYoeC5jb21wYXJlVG8odGhpcy5tKSA+PSAwKSB4LnN1YlRvKHRoaXMubSx4KTtcbn1cblxuLy8gciA9IFwieF4yL1IgbW9kIG1cIjsgeCAhPSByXG5mdW5jdGlvbiBtb250U3FyVG8oeCxyKSB7IHguc3F1YXJlVG8ocik7IHRoaXMucmVkdWNlKHIpOyB9XG5cbi8vIHIgPSBcInh5L1IgbW9kIG1cIjsgeCx5ICE9IHJcbmZ1bmN0aW9uIG1vbnRNdWxUbyh4LHkscikgeyB4Lm11bHRpcGx5VG8oeSxyKTsgdGhpcy5yZWR1Y2Uocik7IH1cblxuTW9udGdvbWVyeS5wcm90b3R5cGUuY29udmVydCA9IG1vbnRDb252ZXJ0O1xuTW9udGdvbWVyeS5wcm90b3R5cGUucmV2ZXJ0ID0gbW9udFJldmVydDtcbk1vbnRnb21lcnkucHJvdG90eXBlLnJlZHVjZSA9IG1vbnRSZWR1Y2U7XG5Nb250Z29tZXJ5LnByb3RvdHlwZS5tdWxUbyA9IG1vbnRNdWxUbztcbk1vbnRnb21lcnkucHJvdG90eXBlLnNxclRvID0gbW9udFNxclRvO1xuXG4vLyAocHJvdGVjdGVkKSB0cnVlIGlmZiB0aGlzIGlzIGV2ZW5cbmZ1bmN0aW9uIGJucElzRXZlbigpIHsgcmV0dXJuICgodGhpcy50PjApPyh0aGlzLmRhdGFbMF0mMSk6dGhpcy5zKSA9PSAwOyB9XG5cbi8vIChwcm90ZWN0ZWQpIHRoaXNeZSwgZSA8IDJeMzIsIGRvaW5nIHNxciBhbmQgbXVsIHdpdGggXCJyXCIgKEhBQyAxNC43OSlcbmZ1bmN0aW9uIGJucEV4cChlLHopIHtcbiAgaWYoZSA+IDB4ZmZmZmZmZmYgfHwgZSA8IDEpIHJldHVybiBCaWdJbnRlZ2VyLk9ORTtcbiAgdmFyIHIgPSBuYmkoKSwgcjIgPSBuYmkoKSwgZyA9IHouY29udmVydCh0aGlzKSwgaSA9IG5iaXRzKGUpLTE7XG4gIGcuY29weVRvKHIpO1xuICB3aGlsZSgtLWkgPj0gMCkge1xuICAgIHouc3FyVG8ocixyMik7XG4gICAgaWYoKGUmKDE8PGkpKSA+IDApIHoubXVsVG8ocjIsZyxyKTtcbiAgICBlbHNlIHsgdmFyIHQgPSByOyByID0gcjI7IHIyID0gdDsgfVxuICB9XG4gIHJldHVybiB6LnJldmVydChyKTtcbn1cblxuLy8gKHB1YmxpYykgdGhpc15lICUgbSwgMCA8PSBlIDwgMl4zMlxuZnVuY3Rpb24gYm5Nb2RQb3dJbnQoZSxtKSB7XG4gIHZhciB6O1xuICBpZihlIDwgMjU2IHx8IG0uaXNFdmVuKCkpIHogPSBuZXcgQ2xhc3NpYyhtKTsgZWxzZSB6ID0gbmV3IE1vbnRnb21lcnkobSk7XG4gIHJldHVybiB0aGlzLmV4cChlLHopO1xufVxuXG4vLyBwcm90ZWN0ZWRcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNvcHlUbyA9IGJucENvcHlUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmZyb21JbnQgPSBibnBGcm9tSW50O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbVN0cmluZyA9IGJucEZyb21TdHJpbmc7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5jbGFtcCA9IGJucENsYW1wO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGxTaGlmdFRvID0gYm5wRExTaGlmdFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZHJTaGlmdFRvID0gYm5wRFJTaGlmdFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubFNoaWZ0VG8gPSBibnBMU2hpZnRUbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLnJTaGlmdFRvID0gYm5wUlNoaWZ0VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zdWJUbyA9IGJucFN1YlRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHlUbyA9IGJucE11bHRpcGx5VG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zcXVhcmVUbyA9IGJucFNxdWFyZVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2UmVtVG8gPSBibnBEaXZSZW1UbztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmludkRpZ2l0ID0gYm5wSW52RGlnaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5pc0V2ZW4gPSBibnBJc0V2ZW47XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5leHAgPSBibnBFeHA7XG5cbi8vIHB1YmxpY1xuQmlnSW50ZWdlci5wcm90b3R5cGUudG9TdHJpbmcgPSBiblRvU3RyaW5nO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubmVnYXRlID0gYm5OZWdhdGU7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hYnMgPSBibkFicztcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNvbXBhcmVUbyA9IGJuQ29tcGFyZVRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYml0TGVuZ3RoID0gYm5CaXRMZW5ndGg7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2QgPSBibk1vZDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1vZFBvd0ludCA9IGJuTW9kUG93SW50O1xuXG4vLyBcImNvbnN0YW50c1wiXG5CaWdJbnRlZ2VyLlpFUk8gPSBuYnYoMCk7XG5CaWdJbnRlZ2VyLk9ORSA9IG5idigxKTtcblxuLy8ganNibjIgbGliXG5cbi8vQ29weXJpZ2h0IChjKSAyMDA1LTIwMDkgIFRvbSBXdVxuLy9BbGwgUmlnaHRzIFJlc2VydmVkLlxuLy9TZWUgXCJMSUNFTlNFXCIgZm9yIGRldGFpbHMgKFNlZSBqc2JuLmpzIGZvciBMSUNFTlNFKS5cblxuLy9FeHRlbmRlZCBKYXZhU2NyaXB0IEJOIGZ1bmN0aW9ucywgcmVxdWlyZWQgZm9yIFJTQSBwcml2YXRlIG9wcy5cblxuLy9WZXJzaW9uIDEuMTogbmV3IEJpZ0ludGVnZXIoXCIwXCIsIDEwKSByZXR1cm5zIFwicHJvcGVyXCIgemVyb1xuXG4vLyhwdWJsaWMpXG5mdW5jdGlvbiBibkNsb25lKCkgeyB2YXIgciA9IG5iaSgpOyB0aGlzLmNvcHlUbyhyKTsgcmV0dXJuIHI7IH1cblxuLy8ocHVibGljKSByZXR1cm4gdmFsdWUgYXMgaW50ZWdlclxuZnVuY3Rpb24gYm5JbnRWYWx1ZSgpIHtcbmlmKHRoaXMucyA8IDApIHtcbiBpZih0aGlzLnQgPT0gMSkgcmV0dXJuIHRoaXMuZGF0YVswXS10aGlzLkRWO1xuIGVsc2UgaWYodGhpcy50ID09IDApIHJldHVybiAtMTtcbn1cbmVsc2UgaWYodGhpcy50ID09IDEpIHJldHVybiB0aGlzLmRhdGFbMF07XG5lbHNlIGlmKHRoaXMudCA9PSAwKSByZXR1cm4gMDtcbi8vIGFzc3VtZXMgMTYgPCBEQiA8IDMyXG5yZXR1cm4gKCh0aGlzLmRhdGFbMV0mKCgxPDwoMzItdGhpcy5EQikpLTEpKTw8dGhpcy5EQil8dGhpcy5kYXRhWzBdO1xufVxuXG4vLyhwdWJsaWMpIHJldHVybiB2YWx1ZSBhcyBieXRlXG5mdW5jdGlvbiBibkJ5dGVWYWx1ZSgpIHsgcmV0dXJuICh0aGlzLnQ9PTApP3RoaXMuczoodGhpcy5kYXRhWzBdPDwyNCk+PjI0OyB9XG5cbi8vKHB1YmxpYykgcmV0dXJuIHZhbHVlIGFzIHNob3J0IChhc3N1bWVzIERCPj0xNilcbmZ1bmN0aW9uIGJuU2hvcnRWYWx1ZSgpIHsgcmV0dXJuICh0aGlzLnQ9PTApP3RoaXMuczoodGhpcy5kYXRhWzBdPDwxNik+PjE2OyB9XG5cbi8vKHByb3RlY3RlZCkgcmV0dXJuIHggcy50LiByXnggPCBEVlxuZnVuY3Rpb24gYm5wQ2h1bmtTaXplKHIpIHsgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5MTjIqdGhpcy5EQi9NYXRoLmxvZyhyKSk7IH1cblxuLy8ocHVibGljKSAwIGlmIHRoaXMgPT0gMCwgMSBpZiB0aGlzID4gMFxuZnVuY3Rpb24gYm5TaWdOdW0oKSB7XG5pZih0aGlzLnMgPCAwKSByZXR1cm4gLTE7XG5lbHNlIGlmKHRoaXMudCA8PSAwIHx8ICh0aGlzLnQgPT0gMSAmJiB0aGlzLmRhdGFbMF0gPD0gMCkpIHJldHVybiAwO1xuZWxzZSByZXR1cm4gMTtcbn1cblxuLy8ocHJvdGVjdGVkKSBjb252ZXJ0IHRvIHJhZGl4IHN0cmluZ1xuZnVuY3Rpb24gYm5wVG9SYWRpeChiKSB7XG5pZihiID09IG51bGwpIGIgPSAxMDtcbmlmKHRoaXMuc2lnbnVtKCkgPT0gMCB8fCBiIDwgMiB8fCBiID4gMzYpIHJldHVybiBcIjBcIjtcbnZhciBjcyA9IHRoaXMuY2h1bmtTaXplKGIpO1xudmFyIGEgPSBNYXRoLnBvdyhiLGNzKTtcbnZhciBkID0gbmJ2KGEpLCB5ID0gbmJpKCksIHogPSBuYmkoKSwgciA9IFwiXCI7XG50aGlzLmRpdlJlbVRvKGQseSx6KTtcbndoaWxlKHkuc2lnbnVtKCkgPiAwKSB7XG4gciA9IChhK3ouaW50VmFsdWUoKSkudG9TdHJpbmcoYikuc3Vic3RyKDEpICsgcjtcbiB5LmRpdlJlbVRvKGQseSx6KTtcbn1cbnJldHVybiB6LmludFZhbHVlKCkudG9TdHJpbmcoYikgKyByO1xufVxuXG4vLyhwcm90ZWN0ZWQpIGNvbnZlcnQgZnJvbSByYWRpeCBzdHJpbmdcbmZ1bmN0aW9uIGJucEZyb21SYWRpeChzLGIpIHtcbnRoaXMuZnJvbUludCgwKTtcbmlmKGIgPT0gbnVsbCkgYiA9IDEwO1xudmFyIGNzID0gdGhpcy5jaHVua1NpemUoYik7XG52YXIgZCA9IE1hdGgucG93KGIsY3MpLCBtaSA9IGZhbHNlLCBqID0gMCwgdyA9IDA7XG5mb3IodmFyIGkgPSAwOyBpIDwgcy5sZW5ndGg7ICsraSkge1xuIHZhciB4ID0gaW50QXQocyxpKTtcbiBpZih4IDwgMCkge1xuICAgaWYocy5jaGFyQXQoaSkgPT0gXCItXCIgJiYgdGhpcy5zaWdudW0oKSA9PSAwKSBtaSA9IHRydWU7XG4gICBjb250aW51ZTtcbiB9XG4gdyA9IGIqdyt4O1xuIGlmKCsraiA+PSBjcykge1xuICAgdGhpcy5kTXVsdGlwbHkoZCk7XG4gICB0aGlzLmRBZGRPZmZzZXQodywwKTtcbiAgIGogPSAwO1xuICAgdyA9IDA7XG4gfVxufVxuaWYoaiA+IDApIHtcbiB0aGlzLmRNdWx0aXBseShNYXRoLnBvdyhiLGopKTtcbiB0aGlzLmRBZGRPZmZzZXQodywwKTtcbn1cbmlmKG1pKSBCaWdJbnRlZ2VyLlpFUk8uc3ViVG8odGhpcyx0aGlzKTtcbn1cblxuLy8ocHJvdGVjdGVkKSBhbHRlcm5hdGUgY29uc3RydWN0b3JcbmZ1bmN0aW9uIGJucEZyb21OdW1iZXIoYSxiLGMpIHtcbmlmKFwibnVtYmVyXCIgPT0gdHlwZW9mIGIpIHtcbiAvLyBuZXcgQmlnSW50ZWdlcihpbnQsaW50LFJORylcbiBpZihhIDwgMikgdGhpcy5mcm9tSW50KDEpO1xuIGVsc2Uge1xuICAgdGhpcy5mcm9tTnVtYmVyKGEsYyk7XG4gICBpZighdGhpcy50ZXN0Qml0KGEtMSkpICAvLyBmb3JjZSBNU0Igc2V0XG4gICAgIHRoaXMuYml0d2lzZVRvKEJpZ0ludGVnZXIuT05FLnNoaWZ0TGVmdChhLTEpLG9wX29yLHRoaXMpO1xuICAgaWYodGhpcy5pc0V2ZW4oKSkgdGhpcy5kQWRkT2Zmc2V0KDEsMCk7IC8vIGZvcmNlIG9kZFxuICAgd2hpbGUoIXRoaXMuaXNQcm9iYWJsZVByaW1lKGIpKSB7XG4gICAgIHRoaXMuZEFkZE9mZnNldCgyLDApO1xuICAgICBpZih0aGlzLmJpdExlbmd0aCgpID4gYSkgdGhpcy5zdWJUbyhCaWdJbnRlZ2VyLk9ORS5zaGlmdExlZnQoYS0xKSx0aGlzKTtcbiAgIH1cbiB9XG59XG5lbHNlIHtcbiAvLyBuZXcgQmlnSW50ZWdlcihpbnQsUk5HKVxuIHZhciB4ID0gbmV3IEFycmF5KCksIHQgPSBhJjc7XG4geC5sZW5ndGggPSAoYT4+MykrMTtcbiBiLm5leHRCeXRlcyh4KTtcbiBpZih0ID4gMCkgeFswXSAmPSAoKDE8PHQpLTEpOyBlbHNlIHhbMF0gPSAwO1xuIHRoaXMuZnJvbVN0cmluZyh4LDI1Nik7XG59XG59XG5cbi8vKHB1YmxpYykgY29udmVydCB0byBiaWdlbmRpYW4gYnl0ZSBhcnJheVxuZnVuY3Rpb24gYm5Ub0J5dGVBcnJheSgpIHtcbnZhciBpID0gdGhpcy50LCByID0gbmV3IEFycmF5KCk7XG5yWzBdID0gdGhpcy5zO1xudmFyIHAgPSB0aGlzLkRCLShpKnRoaXMuREIpJTgsIGQsIGsgPSAwO1xuaWYoaS0tID4gMCkge1xuIGlmKHAgPCB0aGlzLkRCICYmIChkID0gdGhpcy5kYXRhW2ldPj5wKSAhPSAodGhpcy5zJnRoaXMuRE0pPj5wKVxuICAgcltrKytdID0gZHwodGhpcy5zPDwodGhpcy5EQi1wKSk7XG4gd2hpbGUoaSA+PSAwKSB7XG4gICBpZihwIDwgOCkge1xuICAgICBkID0gKHRoaXMuZGF0YVtpXSYoKDE8PHApLTEpKTw8KDgtcCk7XG4gICAgIGQgfD0gdGhpcy5kYXRhWy0taV0+PihwKz10aGlzLkRCLTgpO1xuICAgfVxuICAgZWxzZSB7XG4gICAgIGQgPSAodGhpcy5kYXRhW2ldPj4ocC09OCkpJjB4ZmY7XG4gICAgIGlmKHAgPD0gMCkgeyBwICs9IHRoaXMuREI7IC0taTsgfVxuICAgfVxuICAgaWYoKGQmMHg4MCkgIT0gMCkgZCB8PSAtMjU2O1xuICAgaWYoayA9PSAwICYmICh0aGlzLnMmMHg4MCkgIT0gKGQmMHg4MCkpICsraztcbiAgIGlmKGsgPiAwIHx8IGQgIT0gdGhpcy5zKSByW2srK10gPSBkO1xuIH1cbn1cbnJldHVybiByO1xufVxuXG5mdW5jdGlvbiBibkVxdWFscyhhKSB7IHJldHVybih0aGlzLmNvbXBhcmVUbyhhKT09MCk7IH1cbmZ1bmN0aW9uIGJuTWluKGEpIHsgcmV0dXJuKHRoaXMuY29tcGFyZVRvKGEpPDApP3RoaXM6YTsgfVxuZnVuY3Rpb24gYm5NYXgoYSkgeyByZXR1cm4odGhpcy5jb21wYXJlVG8oYSk+MCk/dGhpczphOyB9XG5cbi8vKHByb3RlY3RlZCkgciA9IHRoaXMgb3AgYSAoYml0d2lzZSlcbmZ1bmN0aW9uIGJucEJpdHdpc2VUbyhhLG9wLHIpIHtcbnZhciBpLCBmLCBtID0gTWF0aC5taW4oYS50LHRoaXMudCk7XG5mb3IoaSA9IDA7IGkgPCBtOyArK2kpIHIuZGF0YVtpXSA9IG9wKHRoaXMuZGF0YVtpXSxhLmRhdGFbaV0pO1xuaWYoYS50IDwgdGhpcy50KSB7XG4gZiA9IGEucyZ0aGlzLkRNO1xuIGZvcihpID0gbTsgaSA8IHRoaXMudDsgKytpKSByLmRhdGFbaV0gPSBvcCh0aGlzLmRhdGFbaV0sZik7XG4gci50ID0gdGhpcy50O1xufVxuZWxzZSB7XG4gZiA9IHRoaXMucyZ0aGlzLkRNO1xuIGZvcihpID0gbTsgaSA8IGEudDsgKytpKSByLmRhdGFbaV0gPSBvcChmLGEuZGF0YVtpXSk7XG4gci50ID0gYS50O1xufVxuci5zID0gb3AodGhpcy5zLGEucyk7XG5yLmNsYW1wKCk7XG59XG5cbi8vKHB1YmxpYykgdGhpcyAmIGFcbmZ1bmN0aW9uIG9wX2FuZCh4LHkpIHsgcmV0dXJuIHgmeTsgfVxuZnVuY3Rpb24gYm5BbmQoYSkgeyB2YXIgciA9IG5iaSgpOyB0aGlzLmJpdHdpc2VUbyhhLG9wX2FuZCxyKTsgcmV0dXJuIHI7IH1cblxuLy8ocHVibGljKSB0aGlzIHwgYVxuZnVuY3Rpb24gb3Bfb3IoeCx5KSB7IHJldHVybiB4fHk7IH1cbmZ1bmN0aW9uIGJuT3IoYSkgeyB2YXIgciA9IG5iaSgpOyB0aGlzLmJpdHdpc2VUbyhhLG9wX29yLHIpOyByZXR1cm4gcjsgfVxuXG4vLyhwdWJsaWMpIHRoaXMgXiBhXG5mdW5jdGlvbiBvcF94b3IoeCx5KSB7IHJldHVybiB4Xnk7IH1cbmZ1bmN0aW9uIGJuWG9yKGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5iaXR3aXNlVG8oYSxvcF94b3Iscik7IHJldHVybiByOyB9XG5cbi8vKHB1YmxpYykgdGhpcyAmIH5hXG5mdW5jdGlvbiBvcF9hbmRub3QoeCx5KSB7IHJldHVybiB4Jn55OyB9XG5mdW5jdGlvbiBibkFuZE5vdChhKSB7IHZhciByID0gbmJpKCk7IHRoaXMuYml0d2lzZVRvKGEsb3BfYW5kbm90LHIpOyByZXR1cm4gcjsgfVxuXG4vLyhwdWJsaWMpIH50aGlzXG5mdW5jdGlvbiBibk5vdCgpIHtcbnZhciByID0gbmJpKCk7XG5mb3IodmFyIGkgPSAwOyBpIDwgdGhpcy50OyArK2kpIHIuZGF0YVtpXSA9IHRoaXMuRE0mfnRoaXMuZGF0YVtpXTtcbnIudCA9IHRoaXMudDtcbnIucyA9IH50aGlzLnM7XG5yZXR1cm4gcjtcbn1cblxuLy8ocHVibGljKSB0aGlzIDw8IG5cbmZ1bmN0aW9uIGJuU2hpZnRMZWZ0KG4pIHtcbnZhciByID0gbmJpKCk7XG5pZihuIDwgMCkgdGhpcy5yU2hpZnRUbygtbixyKTsgZWxzZSB0aGlzLmxTaGlmdFRvKG4scik7XG5yZXR1cm4gcjtcbn1cblxuLy8ocHVibGljKSB0aGlzID4+IG5cbmZ1bmN0aW9uIGJuU2hpZnRSaWdodChuKSB7XG52YXIgciA9IG5iaSgpO1xuaWYobiA8IDApIHRoaXMubFNoaWZ0VG8oLW4scik7IGVsc2UgdGhpcy5yU2hpZnRUbyhuLHIpO1xucmV0dXJuIHI7XG59XG5cbi8vcmV0dXJuIGluZGV4IG9mIGxvd2VzdCAxLWJpdCBpbiB4LCB4IDwgMl4zMVxuZnVuY3Rpb24gbGJpdCh4KSB7XG5pZih4ID09IDApIHJldHVybiAtMTtcbnZhciByID0gMDtcbmlmKCh4JjB4ZmZmZikgPT0gMCkgeyB4ID4+PSAxNjsgciArPSAxNjsgfVxuaWYoKHgmMHhmZikgPT0gMCkgeyB4ID4+PSA4OyByICs9IDg7IH1cbmlmKCh4JjB4ZikgPT0gMCkgeyB4ID4+PSA0OyByICs9IDQ7IH1cbmlmKCh4JjMpID09IDApIHsgeCA+Pj0gMjsgciArPSAyOyB9XG5pZigoeCYxKSA9PSAwKSArK3I7XG5yZXR1cm4gcjtcbn1cblxuLy8ocHVibGljKSByZXR1cm5zIGluZGV4IG9mIGxvd2VzdCAxLWJpdCAob3IgLTEgaWYgbm9uZSlcbmZ1bmN0aW9uIGJuR2V0TG93ZXN0U2V0Qml0KCkge1xuZm9yKHZhciBpID0gMDsgaSA8IHRoaXMudDsgKytpKVxuIGlmKHRoaXMuZGF0YVtpXSAhPSAwKSByZXR1cm4gaSp0aGlzLkRCK2xiaXQodGhpcy5kYXRhW2ldKTtcbmlmKHRoaXMucyA8IDApIHJldHVybiB0aGlzLnQqdGhpcy5EQjtcbnJldHVybiAtMTtcbn1cblxuLy9yZXR1cm4gbnVtYmVyIG9mIDEgYml0cyBpbiB4XG5mdW5jdGlvbiBjYml0KHgpIHtcbnZhciByID0gMDtcbndoaWxlKHggIT0gMCkgeyB4ICY9IHgtMTsgKytyOyB9XG5yZXR1cm4gcjtcbn1cblxuLy8ocHVibGljKSByZXR1cm4gbnVtYmVyIG9mIHNldCBiaXRzXG5mdW5jdGlvbiBibkJpdENvdW50KCkge1xudmFyIHIgPSAwLCB4ID0gdGhpcy5zJnRoaXMuRE07XG5mb3IodmFyIGkgPSAwOyBpIDwgdGhpcy50OyArK2kpIHIgKz0gY2JpdCh0aGlzLmRhdGFbaV1eeCk7XG5yZXR1cm4gcjtcbn1cblxuLy8ocHVibGljKSB0cnVlIGlmZiBudGggYml0IGlzIHNldFxuZnVuY3Rpb24gYm5UZXN0Qml0KG4pIHtcbnZhciBqID0gTWF0aC5mbG9vcihuL3RoaXMuREIpO1xuaWYoaiA+PSB0aGlzLnQpIHJldHVybih0aGlzLnMhPTApO1xucmV0dXJuKCh0aGlzLmRhdGFbal0mKDE8PChuJXRoaXMuREIpKSkhPTApO1xufVxuXG4vLyhwcm90ZWN0ZWQpIHRoaXMgb3AgKDE8PG4pXG5mdW5jdGlvbiBibnBDaGFuZ2VCaXQobixvcCkge1xudmFyIHIgPSBCaWdJbnRlZ2VyLk9ORS5zaGlmdExlZnQobik7XG50aGlzLmJpdHdpc2VUbyhyLG9wLHIpO1xucmV0dXJuIHI7XG59XG5cbi8vKHB1YmxpYykgdGhpcyB8ICgxPDxuKVxuZnVuY3Rpb24gYm5TZXRCaXQobikgeyByZXR1cm4gdGhpcy5jaGFuZ2VCaXQobixvcF9vcik7IH1cblxuLy8ocHVibGljKSB0aGlzICYgfigxPDxuKVxuZnVuY3Rpb24gYm5DbGVhckJpdChuKSB7IHJldHVybiB0aGlzLmNoYW5nZUJpdChuLG9wX2FuZG5vdCk7IH1cblxuLy8ocHVibGljKSB0aGlzIF4gKDE8PG4pXG5mdW5jdGlvbiBibkZsaXBCaXQobikgeyByZXR1cm4gdGhpcy5jaGFuZ2VCaXQobixvcF94b3IpOyB9XG5cbi8vKHByb3RlY3RlZCkgciA9IHRoaXMgKyBhXG5mdW5jdGlvbiBibnBBZGRUbyhhLHIpIHtcbnZhciBpID0gMCwgYyA9IDAsIG0gPSBNYXRoLm1pbihhLnQsdGhpcy50KTtcbndoaWxlKGkgPCBtKSB7XG4gYyArPSB0aGlzLmRhdGFbaV0rYS5kYXRhW2ldO1xuIHIuZGF0YVtpKytdID0gYyZ0aGlzLkRNO1xuIGMgPj49IHRoaXMuREI7XG59XG5pZihhLnQgPCB0aGlzLnQpIHtcbiBjICs9IGEucztcbiB3aGlsZShpIDwgdGhpcy50KSB7XG4gICBjICs9IHRoaXMuZGF0YVtpXTtcbiAgIHIuZGF0YVtpKytdID0gYyZ0aGlzLkRNO1xuICAgYyA+Pj0gdGhpcy5EQjtcbiB9XG4gYyArPSB0aGlzLnM7XG59XG5lbHNlIHtcbiBjICs9IHRoaXMucztcbiB3aGlsZShpIDwgYS50KSB7XG4gICBjICs9IGEuZGF0YVtpXTtcbiAgIHIuZGF0YVtpKytdID0gYyZ0aGlzLkRNO1xuICAgYyA+Pj0gdGhpcy5EQjtcbiB9XG4gYyArPSBhLnM7XG59XG5yLnMgPSAoYzwwKT8tMTowO1xuaWYoYyA+IDApIHIuZGF0YVtpKytdID0gYztcbmVsc2UgaWYoYyA8IC0xKSByLmRhdGFbaSsrXSA9IHRoaXMuRFYrYztcbnIudCA9IGk7XG5yLmNsYW1wKCk7XG59XG5cbi8vKHB1YmxpYykgdGhpcyArIGFcbmZ1bmN0aW9uIGJuQWRkKGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5hZGRUbyhhLHIpOyByZXR1cm4gcjsgfVxuXG4vLyhwdWJsaWMpIHRoaXMgLSBhXG5mdW5jdGlvbiBiblN1YnRyYWN0KGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5zdWJUbyhhLHIpOyByZXR1cm4gcjsgfVxuXG4vLyhwdWJsaWMpIHRoaXMgKiBhXG5mdW5jdGlvbiBibk11bHRpcGx5KGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5tdWx0aXBseVRvKGEscik7IHJldHVybiByOyB9XG5cbi8vKHB1YmxpYykgdGhpcyAvIGFcbmZ1bmN0aW9uIGJuRGl2aWRlKGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5kaXZSZW1UbyhhLHIsbnVsbCk7IHJldHVybiByOyB9XG5cbi8vKHB1YmxpYykgdGhpcyAlIGFcbmZ1bmN0aW9uIGJuUmVtYWluZGVyKGEpIHsgdmFyIHIgPSBuYmkoKTsgdGhpcy5kaXZSZW1UbyhhLG51bGwscik7IHJldHVybiByOyB9XG5cbi8vKHB1YmxpYykgW3RoaXMvYSx0aGlzJWFdXG5mdW5jdGlvbiBibkRpdmlkZUFuZFJlbWFpbmRlcihhKSB7XG52YXIgcSA9IG5iaSgpLCByID0gbmJpKCk7XG50aGlzLmRpdlJlbVRvKGEscSxyKTtcbnJldHVybiBuZXcgQXJyYXkocSxyKTtcbn1cblxuLy8ocHJvdGVjdGVkKSB0aGlzICo9IG4sIHRoaXMgPj0gMCwgMSA8IG4gPCBEVlxuZnVuY3Rpb24gYm5wRE11bHRpcGx5KG4pIHtcbnRoaXMuZGF0YVt0aGlzLnRdID0gdGhpcy5hbSgwLG4tMSx0aGlzLDAsMCx0aGlzLnQpO1xuKyt0aGlzLnQ7XG50aGlzLmNsYW1wKCk7XG59XG5cbi8vKHByb3RlY3RlZCkgdGhpcyArPSBuIDw8IHcgd29yZHMsIHRoaXMgPj0gMFxuZnVuY3Rpb24gYm5wREFkZE9mZnNldChuLHcpIHtcbmlmKG4gPT0gMCkgcmV0dXJuO1xud2hpbGUodGhpcy50IDw9IHcpIHRoaXMuZGF0YVt0aGlzLnQrK10gPSAwO1xudGhpcy5kYXRhW3ddICs9IG47XG53aGlsZSh0aGlzLmRhdGFbd10gPj0gdGhpcy5EVikge1xuIHRoaXMuZGF0YVt3XSAtPSB0aGlzLkRWO1xuIGlmKCsrdyA+PSB0aGlzLnQpIHRoaXMuZGF0YVt0aGlzLnQrK10gPSAwO1xuICsrdGhpcy5kYXRhW3ddO1xufVxufVxuXG4vL0EgXCJudWxsXCIgcmVkdWNlclxuZnVuY3Rpb24gTnVsbEV4cCgpIHt9XG5mdW5jdGlvbiBuTm9wKHgpIHsgcmV0dXJuIHg7IH1cbmZ1bmN0aW9uIG5NdWxUbyh4LHkscikgeyB4Lm11bHRpcGx5VG8oeSxyKTsgfVxuZnVuY3Rpb24gblNxclRvKHgscikgeyB4LnNxdWFyZVRvKHIpOyB9XG5cbk51bGxFeHAucHJvdG90eXBlLmNvbnZlcnQgPSBuTm9wO1xuTnVsbEV4cC5wcm90b3R5cGUucmV2ZXJ0ID0gbk5vcDtcbk51bGxFeHAucHJvdG90eXBlLm11bFRvID0gbk11bFRvO1xuTnVsbEV4cC5wcm90b3R5cGUuc3FyVG8gPSBuU3FyVG87XG5cbi8vKHB1YmxpYykgdGhpc15lXG5mdW5jdGlvbiBiblBvdyhlKSB7IHJldHVybiB0aGlzLmV4cChlLG5ldyBOdWxsRXhwKCkpOyB9XG5cbi8vKHByb3RlY3RlZCkgciA9IGxvd2VyIG4gd29yZHMgb2YgXCJ0aGlzICogYVwiLCBhLnQgPD0gblxuLy9cInRoaXNcIiBzaG91bGQgYmUgdGhlIGxhcmdlciBvbmUgaWYgYXBwcm9wcmlhdGUuXG5mdW5jdGlvbiBibnBNdWx0aXBseUxvd2VyVG8oYSxuLHIpIHtcbnZhciBpID0gTWF0aC5taW4odGhpcy50K2EudCxuKTtcbnIucyA9IDA7IC8vIGFzc3VtZXMgYSx0aGlzID49IDBcbnIudCA9IGk7XG53aGlsZShpID4gMCkgci5kYXRhWy0taV0gPSAwO1xudmFyIGo7XG5mb3IoaiA9IHIudC10aGlzLnQ7IGkgPCBqOyArK2kpIHIuZGF0YVtpK3RoaXMudF0gPSB0aGlzLmFtKDAsYS5kYXRhW2ldLHIsaSwwLHRoaXMudCk7XG5mb3IoaiA9IE1hdGgubWluKGEudCxuKTsgaSA8IGo7ICsraSkgdGhpcy5hbSgwLGEuZGF0YVtpXSxyLGksMCxuLWkpO1xuci5jbGFtcCgpO1xufVxuXG4vLyhwcm90ZWN0ZWQpIHIgPSBcInRoaXMgKiBhXCIgd2l0aG91dCBsb3dlciBuIHdvcmRzLCBuID4gMFxuLy9cInRoaXNcIiBzaG91bGQgYmUgdGhlIGxhcmdlciBvbmUgaWYgYXBwcm9wcmlhdGUuXG5mdW5jdGlvbiBibnBNdWx0aXBseVVwcGVyVG8oYSxuLHIpIHtcbi0tbjtcbnZhciBpID0gci50ID0gdGhpcy50K2EudC1uO1xuci5zID0gMDsgLy8gYXNzdW1lcyBhLHRoaXMgPj0gMFxud2hpbGUoLS1pID49IDApIHIuZGF0YVtpXSA9IDA7XG5mb3IoaSA9IE1hdGgubWF4KG4tdGhpcy50LDApOyBpIDwgYS50OyArK2kpXG4gci5kYXRhW3RoaXMudCtpLW5dID0gdGhpcy5hbShuLWksYS5kYXRhW2ldLHIsMCwwLHRoaXMudCtpLW4pO1xuci5jbGFtcCgpO1xuci5kclNoaWZ0VG8oMSxyKTtcbn1cblxuLy9CYXJyZXR0IG1vZHVsYXIgcmVkdWN0aW9uXG5mdW5jdGlvbiBCYXJyZXR0KG0pIHtcbi8vIHNldHVwIEJhcnJldHRcbnRoaXMucjIgPSBuYmkoKTtcbnRoaXMucTMgPSBuYmkoKTtcbkJpZ0ludGVnZXIuT05FLmRsU2hpZnRUbygyKm0udCx0aGlzLnIyKTtcbnRoaXMubXUgPSB0aGlzLnIyLmRpdmlkZShtKTtcbnRoaXMubSA9IG07XG59XG5cbmZ1bmN0aW9uIGJhcnJldHRDb252ZXJ0KHgpIHtcbmlmKHgucyA8IDAgfHwgeC50ID4gMip0aGlzLm0udCkgcmV0dXJuIHgubW9kKHRoaXMubSk7XG5lbHNlIGlmKHguY29tcGFyZVRvKHRoaXMubSkgPCAwKSByZXR1cm4geDtcbmVsc2UgeyB2YXIgciA9IG5iaSgpOyB4LmNvcHlUbyhyKTsgdGhpcy5yZWR1Y2Uocik7IHJldHVybiByOyB9XG59XG5cbmZ1bmN0aW9uIGJhcnJldHRSZXZlcnQoeCkgeyByZXR1cm4geDsgfVxuXG4vL3ggPSB4IG1vZCBtIChIQUMgMTQuNDIpXG5mdW5jdGlvbiBiYXJyZXR0UmVkdWNlKHgpIHtcbnguZHJTaGlmdFRvKHRoaXMubS50LTEsdGhpcy5yMik7XG5pZih4LnQgPiB0aGlzLm0udCsxKSB7IHgudCA9IHRoaXMubS50KzE7IHguY2xhbXAoKTsgfVxudGhpcy5tdS5tdWx0aXBseVVwcGVyVG8odGhpcy5yMix0aGlzLm0udCsxLHRoaXMucTMpO1xudGhpcy5tLm11bHRpcGx5TG93ZXJUbyh0aGlzLnEzLHRoaXMubS50KzEsdGhpcy5yMik7XG53aGlsZSh4LmNvbXBhcmVUbyh0aGlzLnIyKSA8IDApIHguZEFkZE9mZnNldCgxLHRoaXMubS50KzEpO1xueC5zdWJUbyh0aGlzLnIyLHgpO1xud2hpbGUoeC5jb21wYXJlVG8odGhpcy5tKSA+PSAwKSB4LnN1YlRvKHRoaXMubSx4KTtcbn1cblxuLy9yID0geF4yIG1vZCBtOyB4ICE9IHJcbmZ1bmN0aW9uIGJhcnJldHRTcXJUbyh4LHIpIHsgeC5zcXVhcmVUbyhyKTsgdGhpcy5yZWR1Y2Uocik7IH1cblxuLy9yID0geCp5IG1vZCBtOyB4LHkgIT0gclxuZnVuY3Rpb24gYmFycmV0dE11bFRvKHgseSxyKSB7IHgubXVsdGlwbHlUbyh5LHIpOyB0aGlzLnJlZHVjZShyKTsgfVxuXG5CYXJyZXR0LnByb3RvdHlwZS5jb252ZXJ0ID0gYmFycmV0dENvbnZlcnQ7XG5CYXJyZXR0LnByb3RvdHlwZS5yZXZlcnQgPSBiYXJyZXR0UmV2ZXJ0O1xuQmFycmV0dC5wcm90b3R5cGUucmVkdWNlID0gYmFycmV0dFJlZHVjZTtcbkJhcnJldHQucHJvdG90eXBlLm11bFRvID0gYmFycmV0dE11bFRvO1xuQmFycmV0dC5wcm90b3R5cGUuc3FyVG8gPSBiYXJyZXR0U3FyVG87XG5cbi8vKHB1YmxpYykgdGhpc15lICUgbSAoSEFDIDE0Ljg1KVxuZnVuY3Rpb24gYm5Nb2RQb3coZSxtKSB7XG52YXIgaSA9IGUuYml0TGVuZ3RoKCksIGssIHIgPSBuYnYoMSksIHo7XG5pZihpIDw9IDApIHJldHVybiByO1xuZWxzZSBpZihpIDwgMTgpIGsgPSAxO1xuZWxzZSBpZihpIDwgNDgpIGsgPSAzO1xuZWxzZSBpZihpIDwgMTQ0KSBrID0gNDtcbmVsc2UgaWYoaSA8IDc2OCkgayA9IDU7XG5lbHNlIGsgPSA2O1xuaWYoaSA8IDgpXG4geiA9IG5ldyBDbGFzc2ljKG0pO1xuZWxzZSBpZihtLmlzRXZlbigpKVxuIHogPSBuZXcgQmFycmV0dChtKTtcbmVsc2VcbiB6ID0gbmV3IE1vbnRnb21lcnkobSk7XG5cbi8vIHByZWNvbXB1dGF0aW9uXG52YXIgZyA9IG5ldyBBcnJheSgpLCBuID0gMywgazEgPSBrLTEsIGttID0gKDE8PGspLTE7XG5nWzFdID0gei5jb252ZXJ0KHRoaXMpO1xuaWYoayA+IDEpIHtcbiB2YXIgZzIgPSBuYmkoKTtcbiB6LnNxclRvKGdbMV0sZzIpO1xuIHdoaWxlKG4gPD0ga20pIHtcbiAgIGdbbl0gPSBuYmkoKTtcbiAgIHoubXVsVG8oZzIsZ1tuLTJdLGdbbl0pO1xuICAgbiArPSAyO1xuIH1cbn1cblxudmFyIGogPSBlLnQtMSwgdywgaXMxID0gdHJ1ZSwgcjIgPSBuYmkoKSwgdDtcbmkgPSBuYml0cyhlLmRhdGFbal0pLTE7XG53aGlsZShqID49IDApIHtcbiBpZihpID49IGsxKSB3ID0gKGUuZGF0YVtqXT4+KGktazEpKSZrbTtcbiBlbHNlIHtcbiAgIHcgPSAoZS5kYXRhW2pdJigoMTw8KGkrMSkpLTEpKTw8KGsxLWkpO1xuICAgaWYoaiA+IDApIHcgfD0gZS5kYXRhW2otMV0+Pih0aGlzLkRCK2ktazEpO1xuIH1cblxuIG4gPSBrO1xuIHdoaWxlKCh3JjEpID09IDApIHsgdyA+Pj0gMTsgLS1uOyB9XG4gaWYoKGkgLT0gbikgPCAwKSB7IGkgKz0gdGhpcy5EQjsgLS1qOyB9XG4gaWYoaXMxKSB7ICAvLyByZXQgPT0gMSwgZG9uJ3QgYm90aGVyIHNxdWFyaW5nIG9yIG11bHRpcGx5aW5nIGl0XG4gICBnW3ddLmNvcHlUbyhyKTtcbiAgIGlzMSA9IGZhbHNlO1xuIH1cbiBlbHNlIHtcbiAgIHdoaWxlKG4gPiAxKSB7IHouc3FyVG8ocixyMik7IHouc3FyVG8ocjIscik7IG4gLT0gMjsgfVxuICAgaWYobiA+IDApIHouc3FyVG8ocixyMik7IGVsc2UgeyB0ID0gcjsgciA9IHIyOyByMiA9IHQ7IH1cbiAgIHoubXVsVG8ocjIsZ1t3XSxyKTtcbiB9XG5cbiB3aGlsZShqID49IDAgJiYgKGUuZGF0YVtqXSYoMTw8aSkpID09IDApIHtcbiAgIHouc3FyVG8ocixyMik7IHQgPSByOyByID0gcjI7IHIyID0gdDtcbiAgIGlmKC0taSA8IDApIHsgaSA9IHRoaXMuREItMTsgLS1qOyB9XG4gfVxufVxucmV0dXJuIHoucmV2ZXJ0KHIpO1xufVxuXG4vLyhwdWJsaWMpIGdjZCh0aGlzLGEpIChIQUMgMTQuNTQpXG5mdW5jdGlvbiBibkdDRChhKSB7XG52YXIgeCA9ICh0aGlzLnM8MCk/dGhpcy5uZWdhdGUoKTp0aGlzLmNsb25lKCk7XG52YXIgeSA9IChhLnM8MCk/YS5uZWdhdGUoKTphLmNsb25lKCk7XG5pZih4LmNvbXBhcmVUbyh5KSA8IDApIHsgdmFyIHQgPSB4OyB4ID0geTsgeSA9IHQ7IH1cbnZhciBpID0geC5nZXRMb3dlc3RTZXRCaXQoKSwgZyA9IHkuZ2V0TG93ZXN0U2V0Qml0KCk7XG5pZihnIDwgMCkgcmV0dXJuIHg7XG5pZihpIDwgZykgZyA9IGk7XG5pZihnID4gMCkge1xuIHguclNoaWZ0VG8oZyx4KTtcbiB5LnJTaGlmdFRvKGcseSk7XG59XG53aGlsZSh4LnNpZ251bSgpID4gMCkge1xuIGlmKChpID0geC5nZXRMb3dlc3RTZXRCaXQoKSkgPiAwKSB4LnJTaGlmdFRvKGkseCk7XG4gaWYoKGkgPSB5LmdldExvd2VzdFNldEJpdCgpKSA+IDApIHkuclNoaWZ0VG8oaSx5KTtcbiBpZih4LmNvbXBhcmVUbyh5KSA+PSAwKSB7XG4gICB4LnN1YlRvKHkseCk7XG4gICB4LnJTaGlmdFRvKDEseCk7XG4gfVxuIGVsc2Uge1xuICAgeS5zdWJUbyh4LHkpO1xuICAgeS5yU2hpZnRUbygxLHkpO1xuIH1cbn1cbmlmKGcgPiAwKSB5LmxTaGlmdFRvKGcseSk7XG5yZXR1cm4geTtcbn1cblxuLy8ocHJvdGVjdGVkKSB0aGlzICUgbiwgbiA8IDJeMjZcbmZ1bmN0aW9uIGJucE1vZEludChuKSB7XG5pZihuIDw9IDApIHJldHVybiAwO1xudmFyIGQgPSB0aGlzLkRWJW4sIHIgPSAodGhpcy5zPDApP24tMTowO1xuaWYodGhpcy50ID4gMClcbiBpZihkID09IDApIHIgPSB0aGlzLmRhdGFbMF0lbjtcbiBlbHNlIGZvcih2YXIgaSA9IHRoaXMudC0xOyBpID49IDA7IC0taSkgciA9IChkKnIrdGhpcy5kYXRhW2ldKSVuO1xucmV0dXJuIHI7XG59XG5cbi8vKHB1YmxpYykgMS90aGlzICUgbSAoSEFDIDE0LjYxKVxuZnVuY3Rpb24gYm5Nb2RJbnZlcnNlKG0pIHtcbnZhciBhYyA9IG0uaXNFdmVuKCk7XG5pZigodGhpcy5pc0V2ZW4oKSAmJiBhYykgfHwgbS5zaWdudW0oKSA9PSAwKSByZXR1cm4gQmlnSW50ZWdlci5aRVJPO1xudmFyIHUgPSBtLmNsb25lKCksIHYgPSB0aGlzLmNsb25lKCk7XG52YXIgYSA9IG5idigxKSwgYiA9IG5idigwKSwgYyA9IG5idigwKSwgZCA9IG5idigxKTtcbndoaWxlKHUuc2lnbnVtKCkgIT0gMCkge1xuIHdoaWxlKHUuaXNFdmVuKCkpIHtcbiAgIHUuclNoaWZ0VG8oMSx1KTtcbiAgIGlmKGFjKSB7XG4gICAgIGlmKCFhLmlzRXZlbigpIHx8ICFiLmlzRXZlbigpKSB7IGEuYWRkVG8odGhpcyxhKTsgYi5zdWJUbyhtLGIpOyB9XG4gICAgIGEuclNoaWZ0VG8oMSxhKTtcbiAgIH1cbiAgIGVsc2UgaWYoIWIuaXNFdmVuKCkpIGIuc3ViVG8obSxiKTtcbiAgIGIuclNoaWZ0VG8oMSxiKTtcbiB9XG4gd2hpbGUodi5pc0V2ZW4oKSkge1xuICAgdi5yU2hpZnRUbygxLHYpO1xuICAgaWYoYWMpIHtcbiAgICAgaWYoIWMuaXNFdmVuKCkgfHwgIWQuaXNFdmVuKCkpIHsgYy5hZGRUbyh0aGlzLGMpOyBkLnN1YlRvKG0sZCk7IH1cbiAgICAgYy5yU2hpZnRUbygxLGMpO1xuICAgfVxuICAgZWxzZSBpZighZC5pc0V2ZW4oKSkgZC5zdWJUbyhtLGQpO1xuICAgZC5yU2hpZnRUbygxLGQpO1xuIH1cbiBpZih1LmNvbXBhcmVUbyh2KSA+PSAwKSB7XG4gICB1LnN1YlRvKHYsdSk7XG4gICBpZihhYykgYS5zdWJUbyhjLGEpO1xuICAgYi5zdWJUbyhkLGIpO1xuIH1cbiBlbHNlIHtcbiAgIHYuc3ViVG8odSx2KTtcbiAgIGlmKGFjKSBjLnN1YlRvKGEsYyk7XG4gICBkLnN1YlRvKGIsZCk7XG4gfVxufVxuaWYodi5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpICE9IDApIHJldHVybiBCaWdJbnRlZ2VyLlpFUk87XG5pZihkLmNvbXBhcmVUbyhtKSA+PSAwKSByZXR1cm4gZC5zdWJ0cmFjdChtKTtcbmlmKGQuc2lnbnVtKCkgPCAwKSBkLmFkZFRvKG0sZCk7IGVsc2UgcmV0dXJuIGQ7XG5pZihkLnNpZ251bSgpIDwgMCkgcmV0dXJuIGQuYWRkKG0pOyBlbHNlIHJldHVybiBkO1xufVxuXG52YXIgbG93cHJpbWVzID0gWzIsMyw1LDcsMTEsMTMsMTcsMTksMjMsMjksMzEsMzcsNDEsNDMsNDcsNTMsNTksNjEsNjcsNzEsNzMsNzksODMsODksOTcsMTAxLDEwMywxMDcsMTA5LDExMywxMjcsMTMxLDEzNywxMzksMTQ5LDE1MSwxNTcsMTYzLDE2NywxNzMsMTc5LDE4MSwxOTEsMTkzLDE5NywxOTksMjExLDIyMywyMjcsMjI5LDIzMywyMzksMjQxLDI1MSwyNTcsMjYzLDI2OSwyNzEsMjc3LDI4MSwyODMsMjkzLDMwNywzMTEsMzEzLDMxNywzMzEsMzM3LDM0NywzNDksMzUzLDM1OSwzNjcsMzczLDM3OSwzODMsMzg5LDM5Nyw0MDEsNDA5LDQxOSw0MjEsNDMxLDQzMyw0MzksNDQzLDQ0OSw0NTcsNDYxLDQ2Myw0NjcsNDc5LDQ4Nyw0OTEsNDk5LDUwMyw1MDldO1xudmFyIGxwbGltID0gKDE8PDI2KS9sb3dwcmltZXNbbG93cHJpbWVzLmxlbmd0aC0xXTtcblxuLy8ocHVibGljKSB0ZXN0IHByaW1hbGl0eSB3aXRoIGNlcnRhaW50eSA+PSAxLS41XnRcbmZ1bmN0aW9uIGJuSXNQcm9iYWJsZVByaW1lKHQpIHtcbnZhciBpLCB4ID0gdGhpcy5hYnMoKTtcbmlmKHgudCA9PSAxICYmIHguZGF0YVswXSA8PSBsb3dwcmltZXNbbG93cHJpbWVzLmxlbmd0aC0xXSkge1xuIGZvcihpID0gMDsgaSA8IGxvd3ByaW1lcy5sZW5ndGg7ICsraSlcbiAgIGlmKHguZGF0YVswXSA9PSBsb3dwcmltZXNbaV0pIHJldHVybiB0cnVlO1xuIHJldHVybiBmYWxzZTtcbn1cbmlmKHguaXNFdmVuKCkpIHJldHVybiBmYWxzZTtcbmkgPSAxO1xud2hpbGUoaSA8IGxvd3ByaW1lcy5sZW5ndGgpIHtcbiB2YXIgbSA9IGxvd3ByaW1lc1tpXSwgaiA9IGkrMTtcbiB3aGlsZShqIDwgbG93cHJpbWVzLmxlbmd0aCAmJiBtIDwgbHBsaW0pIG0gKj0gbG93cHJpbWVzW2orK107XG4gbSA9IHgubW9kSW50KG0pO1xuIHdoaWxlKGkgPCBqKSBpZihtJWxvd3ByaW1lc1tpKytdID09IDApIHJldHVybiBmYWxzZTtcbn1cbnJldHVybiB4Lm1pbGxlclJhYmluKHQpO1xufVxuXG4vLyhwcm90ZWN0ZWQpIHRydWUgaWYgcHJvYmFibHkgcHJpbWUgKEhBQyA0LjI0LCBNaWxsZXItUmFiaW4pXG5mdW5jdGlvbiBibnBNaWxsZXJSYWJpbih0KSB7XG52YXIgbjEgPSB0aGlzLnN1YnRyYWN0KEJpZ0ludGVnZXIuT05FKTtcbnZhciBrID0gbjEuZ2V0TG93ZXN0U2V0Qml0KCk7XG5pZihrIDw9IDApIHJldHVybiBmYWxzZTtcbnZhciByID0gbjEuc2hpZnRSaWdodChrKTtcbnQgPSAodCsxKT4+MTtcbmlmKHQgPiBsb3dwcmltZXMubGVuZ3RoKSB0ID0gbG93cHJpbWVzLmxlbmd0aDtcbnZhciBhID0gbmJpKCk7XG5mb3IodmFyIGkgPSAwOyBpIDwgdDsgKytpKSB7XG4gYS5mcm9tSW50KGxvd3ByaW1lc1tpXSk7XG4gdmFyIHkgPSBhLm1vZFBvdyhyLHRoaXMpO1xuIGlmKHkuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSAhPSAwICYmIHkuY29tcGFyZVRvKG4xKSAhPSAwKSB7XG4gICB2YXIgaiA9IDE7XG4gICB3aGlsZShqKysgPCBrICYmIHkuY29tcGFyZVRvKG4xKSAhPSAwKSB7XG4gICAgIHkgPSB5Lm1vZFBvd0ludCgyLHRoaXMpO1xuICAgICBpZih5LmNvbXBhcmVUbyhCaWdJbnRlZ2VyLk9ORSkgPT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgfVxuICAgaWYoeS5jb21wYXJlVG8objEpICE9IDApIHJldHVybiBmYWxzZTtcbiB9XG59XG5yZXR1cm4gdHJ1ZTtcbn1cblxuLy9wcm90ZWN0ZWRcbkJpZ0ludGVnZXIucHJvdG90eXBlLmNodW5rU2l6ZSA9IGJucENodW5rU2l6ZTtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnRvUmFkaXggPSBibnBUb1JhZGl4O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbVJhZGl4ID0gYm5wRnJvbVJhZGl4O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZnJvbU51bWJlciA9IGJucEZyb21OdW1iZXI7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5iaXR3aXNlVG8gPSBibnBCaXR3aXNlVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5jaGFuZ2VCaXQgPSBibnBDaGFuZ2VCaXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hZGRUbyA9IGJucEFkZFRvO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZE11bHRpcGx5ID0gYm5wRE11bHRpcGx5O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZEFkZE9mZnNldCA9IGJucERBZGRPZmZzZXQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseUxvd2VyVG8gPSBibnBNdWx0aXBseUxvd2VyVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tdWx0aXBseVVwcGVyVG8gPSBibnBNdWx0aXBseVVwcGVyVG87XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RJbnQgPSBibnBNb2RJbnQ7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5taWxsZXJSYWJpbiA9IGJucE1pbGxlclJhYmluO1xuXG4vL3B1YmxpY1xuQmlnSW50ZWdlci5wcm90b3R5cGUuY2xvbmUgPSBibkNsb25lO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuaW50VmFsdWUgPSBibkludFZhbHVlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYnl0ZVZhbHVlID0gYm5CeXRlVmFsdWU7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5zaG9ydFZhbHVlID0gYm5TaG9ydFZhbHVlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuc2lnbnVtID0gYm5TaWdOdW07XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS50b0J5dGVBcnJheSA9IGJuVG9CeXRlQXJyYXk7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5lcXVhbHMgPSBibkVxdWFscztcbkJpZ0ludGVnZXIucHJvdG90eXBlLm1pbiA9IGJuTWluO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubWF4ID0gYm5NYXg7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5hbmQgPSBibkFuZDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLm9yID0gYm5PcjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnhvciA9IGJuWG9yO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYW5kTm90ID0gYm5BbmROb3Q7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5ub3QgPSBibk5vdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnNoaWZ0TGVmdCA9IGJuU2hpZnRMZWZ0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuc2hpZnRSaWdodCA9IGJuU2hpZnRSaWdodDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmdldExvd2VzdFNldEJpdCA9IGJuR2V0TG93ZXN0U2V0Qml0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuYml0Q291bnQgPSBibkJpdENvdW50O1xuQmlnSW50ZWdlci5wcm90b3R5cGUudGVzdEJpdCA9IGJuVGVzdEJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLnNldEJpdCA9IGJuU2V0Qml0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuY2xlYXJCaXQgPSBibkNsZWFyQml0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZmxpcEJpdCA9IGJuRmxpcEJpdDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmFkZCA9IGJuQWRkO1xuQmlnSW50ZWdlci5wcm90b3R5cGUuc3VidHJhY3QgPSBiblN1YnRyYWN0O1xuQmlnSW50ZWdlci5wcm90b3R5cGUubXVsdGlwbHkgPSBibk11bHRpcGx5O1xuQmlnSW50ZWdlci5wcm90b3R5cGUuZGl2aWRlID0gYm5EaXZpZGU7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5yZW1haW5kZXIgPSBiblJlbWFpbmRlcjtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmRpdmlkZUFuZFJlbWFpbmRlciA9IGJuRGl2aWRlQW5kUmVtYWluZGVyO1xuQmlnSW50ZWdlci5wcm90b3R5cGUubW9kUG93ID0gYm5Nb2RQb3c7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5tb2RJbnZlcnNlID0gYm5Nb2RJbnZlcnNlO1xuQmlnSW50ZWdlci5wcm90b3R5cGUucG93ID0gYm5Qb3c7XG5CaWdJbnRlZ2VyLnByb3RvdHlwZS5nY2QgPSBibkdDRDtcbkJpZ0ludGVnZXIucHJvdG90eXBlLmlzUHJvYmFibGVQcmltZSA9IGJuSXNQcm9iYWJsZVByaW1lO1xuXG4vL0JpZ0ludGVnZXIgaW50ZXJmYWNlcyBub3QgaW1wbGVtZW50ZWQgaW4ganNibjpcblxuLy9CaWdJbnRlZ2VyKGludCBzaWdudW0sIGJ5dGVbXSBtYWduaXR1ZGUpXG4vL2RvdWJsZSBkb3VibGVWYWx1ZSgpXG4vL2Zsb2F0IGZsb2F0VmFsdWUoKVxuLy9pbnQgaGFzaENvZGUoKVxuLy9sb25nIGxvbmdWYWx1ZSgpXG4vL3N0YXRpYyBCaWdJbnRlZ2VyIHZhbHVlT2YobG9uZyB2YWwpXG5cbmZvcmdlLmpzYm4gPSBmb3JnZS5qc2JuIHx8IHt9O1xuZm9yZ2UuanNibi5CaWdJbnRlZ2VyID0gQmlnSW50ZWdlcjtcblxuLyoqXG4gKiB1dGlsLnNldEltbWVkaWF0ZVxuICovXG5cbi8qIFV0aWxpdGllcyBBUEkgKi9cbnZhciB1dGlsID0gZm9yZ2UudXRpbCA9IGZvcmdlLnV0aWwgfHwge307XG5cbi8vIGRlZmluZSBzZXRJbW1lZGlhdGUgYW5kIG5leHRUaWNrXG5pZih0eXBlb2YgcHJvY2VzcyA9PT0gJ3VuZGVmaW5lZCcgfHwgIXByb2Nlc3MubmV4dFRpY2spIHtcbiAgaWYodHlwZW9mIHNldEltbWVkaWF0ZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHV0aWwuc2V0SW1tZWRpYXRlID0gc2V0SW1tZWRpYXRlO1xuICAgIHV0aWwubmV4dFRpY2sgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICAgICAgcmV0dXJuIHNldEltbWVkaWF0ZShjYWxsYmFjayk7XG4gICAgfTtcbiAgfVxuICBlbHNlIHtcbiAgICB1dGlsLnNldEltbWVkaWF0ZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gICAgICBzZXRUaW1lb3V0KGNhbGxiYWNrLCAwKTtcbiAgICB9O1xuICAgIHV0aWwubmV4dFRpY2sgPSB1dGlsLnNldEltbWVkaWF0ZTtcbiAgfVxufVxuZWxzZSB7XG4gIHV0aWwubmV4dFRpY2sgPSBwcm9jZXNzLm5leHRUaWNrO1xuICBpZih0eXBlb2Ygc2V0SW1tZWRpYXRlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdXRpbC5zZXRJbW1lZGlhdGUgPSBzZXRJbW1lZGlhdGU7XG4gIH1cbiAgZWxzZSB7XG4gICAgdXRpbC5zZXRJbW1lZGlhdGUgPSB1dGlsLm5leHRUaWNrO1xuICB9XG59XG5cbi8vIF9tb2RQb3dcblxudmFyIF9tb2RQb3cgPSBmdW5jdGlvbih4LCBrZXksIHB1Yikge1xuICB2YXIgeTtcblxuICBpZihwdWIpIHtcbiAgICB5ID0geC5tb2RQb3coa2V5LmUsIGtleS5uKTtcbiAgfVxuICBlbHNlIHtcbiAgICAvLyBwcmUtY29tcHV0ZSBkUCwgZFEsIGFuZCBxSW52IGlmIG5lY2Vzc2FyeVxuICAgIGlmKCFrZXkuZFApIHtcbiAgICAgIGtleS5kUCA9IGtleS5kLm1vZChrZXkucC5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSkpO1xuICAgIH1cbiAgICBpZigha2V5LmRRKSB7XG4gICAgICBrZXkuZFEgPSBrZXkuZC5tb2Qoa2V5LnEuc3VidHJhY3QoQmlnSW50ZWdlci5PTkUpKTtcbiAgICB9XG4gICAgaWYoIWtleS5xSW52KSB7XG4gICAgICBrZXkucUludiA9IGtleS5xLm1vZEludmVyc2Uoa2V5LnApO1xuICAgIH1cblxuICAgIC8qIENoaW5lc2UgcmVtYWluZGVyIHRoZW9yZW0gKENSVCkgc3RhdGVzOlxuXG4gICAgICBTdXBwb3NlIG4xLCBuMiwgLi4uLCBuayBhcmUgcG9zaXRpdmUgaW50ZWdlcnMgd2hpY2ggYXJlIHBhaXJ3aXNlXG4gICAgICBjb3ByaW1lIChuMSBhbmQgbjIgaGF2ZSBubyBjb21tb24gZmFjdG9ycyBvdGhlciB0aGFuIDEpLiBGb3IgYW55XG4gICAgICBpbnRlZ2VycyB4MSwgeDIsIC4uLiwgeGsgdGhlcmUgZXhpc3RzIGFuIGludGVnZXIgeCBzb2x2aW5nIHRoZVxuICAgICAgc3lzdGVtIG9mIHNpbXVsdGFuZW91cyBjb25ncnVlbmNlcyAod2hlcmUgfj0gbWVhbnMgbW9kdWxhcmx5XG4gICAgICBjb25ncnVlbnQgc28gYSB+PSBiIG1vZCBuIG1lYW5zIGEgbW9kIG4gPSBiIG1vZCBuKTpcblxuICAgICAgeCB+PSB4MSBtb2QgbjFcbiAgICAgIHggfj0geDIgbW9kIG4yXG4gICAgICAuLi5cbiAgICAgIHggfj0geGsgbW9kIG5rXG5cbiAgICAgIFRoaXMgc3lzdGVtIG9mIGNvbmdydWVuY2VzIGhhcyBhIHNpbmdsZSBzaW11bHRhbmVvdXMgc29sdXRpb24geFxuICAgICAgYmV0d2VlbiAwIGFuZCBuIC0gMS4gRnVydGhlcm1vcmUsIGVhY2ggeGsgc29sdXRpb24gYW5kIHggaXRzZWxmXG4gICAgICBpcyBjb25ncnVlbnQgbW9kdWxvIHRoZSBwcm9kdWN0IG4gPSBuMSpuMiouLi4qbmsuXG4gICAgICBTbyB4MSBtb2QgbiA9IHgyIG1vZCBuID0geGsgbW9kIG4gPSB4IG1vZCBuLlxuXG4gICAgICBUaGUgc2luZ2xlIHNpbXVsdGFuZW91cyBzb2x1dGlvbiB4IGNhbiBiZSBzb2x2ZWQgd2l0aCB0aGUgZm9sbG93aW5nXG4gICAgICBlcXVhdGlvbjpcblxuICAgICAgeCA9IHN1bSh4aSpyaSpzaSkgbW9kIG4gd2hlcmUgcmkgPSBuL25pIGFuZCBzaSA9IHJpXi0xIG1vZCBuaS5cblxuICAgICAgV2hlcmUgeCBpcyBsZXNzIHRoYW4gbiwgeGkgPSB4IG1vZCBuaS5cblxuICAgICAgRm9yIFJTQSB3ZSBhcmUgb25seSBjb25jZXJuZWQgd2l0aCBrID0gMi4gVGhlIG1vZHVsdXMgbiA9IHBxLCB3aGVyZVxuICAgICAgcCBhbmQgcSBhcmUgY29wcmltZS4gVGhlIFJTQSBkZWNyeXB0aW9uIGFsZ29yaXRobSBpczpcblxuICAgICAgeSA9IHheZCBtb2QgblxuXG4gICAgICBHaXZlbiB0aGUgYWJvdmU6XG5cbiAgICAgIHgxID0geF5kIG1vZCBwXG4gICAgICByMSA9IG4vcCA9IHFcbiAgICAgIHMxID0gcV4tMSBtb2QgcFxuICAgICAgeDIgPSB4XmQgbW9kIHFcbiAgICAgIHIyID0gbi9xID0gcFxuICAgICAgczIgPSBwXi0xIG1vZCBxXG5cbiAgICAgIFNvIHkgPSAoeDFyMXMxICsgeDJyMnMyKSBtb2QgblxuICAgICAgICAgICA9ICgoeF5kIG1vZCBwKXEocV4tMSBtb2QgcCkgKyAoeF5kIG1vZCBxKXAocF4tMSBtb2QgcSkpIG1vZCBuXG5cbiAgICAgIEFjY29yZGluZyB0byBGZXJtYXQncyBMaXR0bGUgVGhlb3JlbSwgaWYgdGhlIG1vZHVsdXMgUCBpcyBwcmltZSxcbiAgICAgIGZvciBhbnkgaW50ZWdlciBBIG5vdCBldmVubHkgZGl2aXNpYmxlIGJ5IFAsIEFeKFAtMSkgfj0gMSBtb2QgUC5cbiAgICAgIFNpbmNlIEEgaXMgbm90IGRpdmlzaWJsZSBieSBQIGl0IGZvbGxvd3MgdGhhdCBpZjpcbiAgICAgIE4gfj0gTSBtb2QgKFAgLSAxKSwgdGhlbiBBXk4gbW9kIFAgPSBBXk0gbW9kIFAuIFRoZXJlZm9yZTpcblxuICAgICAgQV5OIG1vZCBQID0gQV4oTSBtb2QgKFAgLSAxKSkgbW9kIFAuIChUaGUgbGF0dGVyIHRha2VzIGxlc3MgZWZmb3J0XG4gICAgICB0byBjYWxjdWxhdGUpLiBJbiBvcmRlciB0byBjYWxjdWxhdGUgeF5kIG1vZCBwIG1vcmUgcXVpY2tseSB0aGVcbiAgICAgIGV4cG9uZW50IGQgbW9kIChwIC0gMSkgaXMgc3RvcmVkIGluIHRoZSBSU0EgcHJpdmF0ZSBrZXkgKHRoZSBzYW1lXG4gICAgICBpcyBkb25lIGZvciB4XmQgbW9kIHEpLiBUaGVzZSB2YWx1ZXMgYXJlIHJlZmVycmVkIHRvIGFzIGRQIGFuZCBkUVxuICAgICAgcmVzcGVjdGl2ZWx5LiBUaGVyZWZvcmUgd2Ugbm93IGhhdmU6XG5cbiAgICAgIHkgPSAoKHheZFAgbW9kIHApcShxXi0xIG1vZCBwKSArICh4XmRRIG1vZCBxKXAocF4tMSBtb2QgcSkpIG1vZCBuXG5cbiAgICAgIFNpbmNlIHdlJ2xsIGJlIHJlZHVjaW5nIHheZFAgYnkgbW9kdWxvIHAgKHNhbWUgZm9yIHEpIHdlIGNhbiBhbHNvXG4gICAgICByZWR1Y2UgeCBieSBwIChhbmQgcSByZXNwZWN0aXZlbHkpIGJlZm9yZSBoYW5kLiBUaGVyZWZvcmUsIGxldFxuXG4gICAgICB4cCA9ICgoeCBtb2QgcCleZFAgbW9kIHApLCBhbmRcbiAgICAgIHhxID0gKCh4IG1vZCBxKV5kUSBtb2QgcSksIHlpZWxkaW5nOlxuXG4gICAgICB5ID0gKHhwKnEqKHFeLTEgbW9kIHApICsgeHEqcCoocF4tMSBtb2QgcSkpIG1vZCBuXG5cbiAgICAgIFRoaXMgY2FuIGJlIGZ1cnRoZXIgcmVkdWNlZCB0byBhIHNpbXBsZSBhbGdvcml0aG0gdGhhdCBvbmx5XG4gICAgICByZXF1aXJlcyAxIGludmVyc2UgKHRoZSBxIGludmVyc2UgaXMgdXNlZCkgdG8gYmUgdXNlZCBhbmQgc3RvcmVkLlxuICAgICAgVGhlIGFsZ29yaXRobSBpcyBjYWxsZWQgR2FybmVyJ3MgYWxnb3JpdGhtLiBJZiBxSW52IGlzIHRoZVxuICAgICAgaW52ZXJzZSBvZiBxLCB3ZSBzaW1wbHkgY2FsY3VsYXRlOlxuXG4gICAgICB5ID0gKHFJbnYqKHhwIC0geHEpIG1vZCBwKSAqIHEgKyB4cVxuXG4gICAgICBIb3dldmVyLCB0aGVyZSBhcmUgdHdvIGZ1cnRoZXIgY29tcGxpY2F0aW9ucy4gRmlyc3QsIHdlIG5lZWQgdG9cbiAgICAgIGVuc3VyZSB0aGF0IHhwID4geHEgdG8gcHJldmVudCBzaWduZWQgQmlnSW50ZWdlcnMgZnJvbSBiZWluZyB1c2VkXG4gICAgICBzbyB3ZSBhZGQgcCB1bnRpbCB0aGlzIGlzIHRydWUgKHNpbmNlIHdlIHdpbGwgYmUgbW9kJ2luZyB3aXRoXG4gICAgICBwIGFueXdheSkuIFRoZW4sIHRoZXJlIGlzIGEga25vd24gdGltaW5nIGF0dGFjayBvbiBhbGdvcml0aG1zXG4gICAgICB1c2luZyB0aGUgQ1JULiBUbyBtaXRpZ2F0ZSB0aGlzIHJpc2ssIFwiY3J5cHRvZ3JhcGhpYyBibGluZGluZ1wiXG4gICAgICBzaG91bGQgYmUgdXNlZCAoKk5vdCB5ZXQgaW1wbGVtZW50ZWQqKS4gVGhpcyByZXF1aXJlcyBzaW1wbHlcbiAgICAgIGdlbmVyYXRpbmcgYSByYW5kb20gbnVtYmVyIHIgYmV0d2VlbiAwIGFuZCBuLTEgYW5kIGl0cyBpbnZlcnNlXG4gICAgICBhbmQgbXVsdGlwbHlpbmcgeCBieSByXmUgYmVmb3JlIGNhbGN1bGF0aW5nIHkgYW5kIHRoZW4gbXVsdGlwbHlpbmdcbiAgICAgIHkgYnkgcl4tMSBhZnRlcndhcmRzLlxuICAgICovXG5cbiAgICAvLyBUT0RPOiBkbyBjcnlwdG9ncmFwaGljIGJsaW5kaW5nXG5cbiAgICAvLyBjYWxjdWxhdGUgeHAgYW5kIHhxXG4gICAgdmFyIHhwID0geC5tb2Qoa2V5LnApLm1vZFBvdyhrZXkuZFAsIGtleS5wKTtcbiAgICB2YXIgeHEgPSB4Lm1vZChrZXkucSkubW9kUG93KGtleS5kUSwga2V5LnEpO1xuXG4gICAgLy8geHAgbXVzdCBiZSBsYXJnZXIgdGhhbiB4cSB0byBhdm9pZCBzaWduZWQgYml0IHVzYWdlXG4gICAgd2hpbGUoeHAuY29tcGFyZVRvKHhxKSA8IDApIHtcbiAgICAgIHhwID0geHAuYWRkKGtleS5wKTtcbiAgICB9XG5cbiAgICAvLyBkbyBsYXN0IHN0ZXBcbiAgICB5ID0geHAuc3VidHJhY3QoeHEpXG4gICAgICAubXVsdGlwbHkoa2V5LnFJbnYpLm1vZChrZXkucClcbiAgICAgIC5tdWx0aXBseShrZXkucSkuYWRkKHhxKTtcbiAgfVxuXG4gIHJldHVybiB5O1xufTtcblxuLyoqXG4gKiB1dGlsLmVuY29kZVV0ZjhcbiAqL1xuXG51dGlsLmVuY29kZVV0ZjggPSBmdW5jdGlvbihzdHIpIHtcbiAgcmV0dXJuIHVuZXNjYXBlKGVuY29kZVVSSUNvbXBvbmVudChzdHIpKTtcbn07XG5cbi8qKlxuICogdXRpbC5kZWNvZGVVdGY4XG4gKi9cblxudXRpbC5kZWNvZGVVdGY4ID0gZnVuY3Rpb24oc3RyKSB7XG4gIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZXNjYXBlKHN0cikpO1xufTtcblxuXG4vKipcbiAqIENyZWF0ZXMgYSBidWZmZXIgdGhhdCBzdG9yZXMgYnl0ZXMuIEEgdmFsdWUgbWF5IGJlIGdpdmVuIHRvIHB1dCBpbnRvIHRoZVxuICogYnVmZmVyIHRoYXQgaXMgZWl0aGVyIGEgc3RyaW5nIG9mIGJ5dGVzIG9yIGEgVVRGLTE2IHN0cmluZyB0aGF0IHdpbGxcbiAqIGJlIGVuY29kZWQgdXNpbmcgVVRGLTggKHRvIGRvIHRoZSBsYXR0ZXIsIHNwZWNpZnkgJ3V0ZjgnIGFzIHRoZSBlbmNvZGluZykuXG4gKlxuICogQHBhcmFtIFtpbnB1dF0gdGhlIGJ5dGVzIHRvIHdyYXAgKGFzIGEgc3RyaW5nKSBvciBhIFVURi0xNiBzdHJpbmcgdG8gZW5jb2RlXG4gKiAgICAgICAgICBhcyBVVEYtOC5cbiAqIEBwYXJhbSBbZW5jb2RpbmddIChkZWZhdWx0OiAncmF3Jywgb3RoZXI6ICd1dGY4JykuXG4gKi9cbnV0aWwuY3JlYXRlQnVmZmVyID0gZnVuY3Rpb24oaW5wdXQsIGVuY29kaW5nKSB7XG4gIGVuY29kaW5nID0gZW5jb2RpbmcgfHwgJ3Jhdyc7XG4gIGlmKGlucHV0ICE9PSB1bmRlZmluZWQgJiYgZW5jb2RpbmcgPT09ICd1dGY4Jykge1xuICAgIGlucHV0ID0gdXRpbC5lbmNvZGVVdGY4KGlucHV0KTtcbiAgfVxuICByZXR1cm4gbmV3IHV0aWwuQnl0ZUJ1ZmZlcihpbnB1dCk7XG59O1xuXG4vKipcbiAqIHV0aWwuaGV4VG9CeXRlc1xuICovXG5cbnV0aWwuaGV4VG9CeXRlcyA9IGZ1bmN0aW9uKGhleCkge1xuICB2YXIgcnZhbCA9ICcnO1xuICB2YXIgaSA9IDA7XG4gIGlmKGhleC5sZW5ndGggJiAxID09IDEpIHtcbiAgICAvLyBvZGQgbnVtYmVyIG9mIGNoYXJhY3RlcnMsIGNvbnZlcnQgZmlyc3QgY2hhcmFjdGVyIGFsb25lXG4gICAgaSA9IDE7XG4gICAgcnZhbCArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHBhcnNlSW50KGhleFswXSwgMTYpKTtcbiAgfVxuICAvLyBjb252ZXJ0IDIgY2hhcmFjdGVycyAoMSBieXRlKSBhdCBhIHRpbWVcbiAgZm9yKDsgaSA8IGhleC5sZW5ndGg7IGkgKz0gMikge1xuICAgIHJ2YWwgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShwYXJzZUludChoZXguc3Vic3RyKGksIDIpLCAxNikpO1xuICB9XG4gIHJldHVybiBydmFsO1xufTtcblxuLyoqXG4gKiBwa2kucnNhLmRlY3J5cHRcbiAqL1xuXG5wa2kucnNhLmRlY3J5cHQgPSBmdW5jdGlvbihlZCwga2V5LCBwdWIsIG1sKSB7XG4gIC8vIGdldCB0aGUgbGVuZ3RoIG9mIHRoZSBtb2R1bHVzIGluIGJ5dGVzXG4gIHZhciBrID0gTWF0aC5jZWlsKGtleS5uLmJpdExlbmd0aCgpIC8gOCk7XG5cbiAgLy8gZXJyb3IgaWYgdGhlIGxlbmd0aCBvZiB0aGUgZW5jcnlwdGVkIGRhdGEgRUQgaXMgbm90IGtcbiAgaWYoZWQubGVuZ3RoICE9IGspIHtcbiAgICB0aHJvdyB7XG4gICAgICBtZXNzYWdlOiAnRW5jcnlwdGVkIG1lc3NhZ2UgbGVuZ3RoIGlzIGludmFsaWQuJyxcbiAgICAgIGxlbmd0aDogZWQubGVuZ3RoLFxuICAgICAgZXhwZWN0ZWQ6IGtcbiAgICB9O1xuICB9XG5cbiAgLy8gY29udmVydCBlbmNyeXB0ZWQgZGF0YSBpbnRvIGEgYmlnIGludGVnZXJcbiAgLy8gRklYTUU6IGhleCBjb252ZXJzaW9uIGluZWZmaWNpZW50LCBnZXQgQmlnSW50ZWdlciB3L2J5dGUgc3RyaW5nc1xuICB2YXIgeSA9IG5ldyBCaWdJbnRlZ2VyKGZvcmdlLnV0aWwuY3JlYXRlQnVmZmVyKGVkKS50b0hleCgpLCAxNik7XG5cbiAgLy8gZG8gUlNBIGRlY3J5cHRpb25cbiAgdmFyIHggPSBfbW9kUG93KHksIGtleSwgcHViKTtcblxuICAvLyBjcmVhdGUgdGhlIGVuY3J5cHRpb24gYmxvY2ssIGlmIHggaXMgc2hvcnRlciBpbiBieXRlcyB0aGFuIGssIHRoZW5cbiAgLy8gcHJlcGVuZCB6ZXJvIGJ5dGVzIHRvIGZpbGwgdXAgZWJcbiAgLy8gRklYTUU6IGhleCBjb252ZXJzaW9uIGluZWZmaWNpZW50LCBnZXQgQmlnSW50ZWdlciB3L2J5dGUgc3RyaW5nc1xuICB2YXIgeGhleCA9IHgudG9TdHJpbmcoMTYpO1xuICB2YXIgZWIgPSBmb3JnZS51dGlsLmNyZWF0ZUJ1ZmZlcigpO1xuICB2YXIgemVyb3MgPSBrIC0gTWF0aC5jZWlsKHhoZXgubGVuZ3RoIC8gMik7XG4gIHdoaWxlKHplcm9zID4gMCkge1xuICAgIGViLnB1dEJ5dGUoMHgwMCk7XG4gICAgLS16ZXJvcztcbiAgfVxuICBlYi5wdXRCeXRlcyhmb3JnZS51dGlsLmhleFRvQnl0ZXMoeGhleCkpO1xuXG4gIGlmKG1sICE9PSBmYWxzZSkge1xuICAgIC8qIEl0IGlzIGFuIGVycm9yIGlmIGFueSBvZiB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnMgb2NjdXJzOlxuXG4gICAgICAxLiBUaGUgZW5jcnlwdGlvbiBibG9jayBFQiBjYW5ub3QgYmUgcGFyc2VkIHVuYW1iaWd1b3VzbHkuXG4gICAgICAyLiBUaGUgcGFkZGluZyBzdHJpbmcgUFMgY29uc2lzdHMgb2YgZmV3ZXIgdGhhbiBlaWdodCBvY3RldHNcbiAgICAgICAgb3IgaXMgaW5jb25zaXNlbnQgd2l0aCB0aGUgYmxvY2sgdHlwZSBCVC5cbiAgICAgIDMuIFRoZSBkZWNyeXB0aW9uIHByb2Nlc3MgaXMgYSBwdWJsaWMta2V5IG9wZXJhdGlvbiBhbmQgdGhlIGJsb2NrXG4gICAgICAgIHR5cGUgQlQgaXMgbm90IDAwIG9yIDAxLCBvciB0aGUgZGVjcnlwdGlvbiBwcm9jZXNzIGlzIGFcbiAgICAgICAgcHJpdmF0ZS1rZXkgb3BlcmF0aW9uIGFuZCB0aGUgYmxvY2sgdHlwZSBpcyBub3QgMDIuXG4gICAgICovXG5cbiAgICAvLyBwYXJzZSB0aGUgZW5jcnlwdGlvbiBibG9ja1xuICAgIHZhciBmaXJzdCA9IGViLmdldEJ5dGUoKTtcbiAgICB2YXIgYnQgPSBlYi5nZXRCeXRlKCk7XG4gICAgaWYoZmlyc3QgIT09IDB4MDAgfHxcbiAgICAgIChwdWIgJiYgYnQgIT09IDB4MDAgJiYgYnQgIT09IDB4MDEpIHx8XG4gICAgICAoIXB1YiAmJiBidCAhPSAweDAyKSB8fFxuICAgICAgKHB1YiAmJiBidCA9PT0gMHgwMCAmJiB0eXBlb2YobWwpID09PSAndW5kZWZpbmVkJykpIHtcbiAgICAgIHRocm93IHtcbiAgICAgICAgbWVzc2FnZTogJ0VuY3J5cHRpb24gYmxvY2sgaXMgaW52YWxpZC4nXG4gICAgICB9O1xuICAgIH1cblxuICAgIHZhciBwYWROdW0gPSAwO1xuICAgIGlmKGJ0ID09PSAweDAwKSB7XG4gICAgICAvLyBjaGVjayBhbGwgcGFkZGluZyBieXRlcyBmb3IgMHgwMFxuICAgICAgcGFkTnVtID0gayAtIDMgLSBtbDtcbiAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwYWROdW07ICsraSkge1xuICAgICAgICBpZihlYi5nZXRCeXRlKCkgIT09IDB4MDApIHtcbiAgICAgICAgICB0aHJvdyB7XG4gICAgICAgICAgICBtZXNzYWdlOiAnRW5jcnlwdGlvbiBibG9jayBpcyBpbnZhbGlkLidcbiAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYoYnQgPT09IDB4MDEpIHtcbiAgICAgIC8vIGZpbmQgdGhlIGZpcnN0IGJ5dGUgdGhhdCBpc24ndCAweEZGLCBzaG91bGQgYmUgYWZ0ZXIgYWxsIHBhZGRpbmdcbiAgICAgIHBhZE51bSA9IDA7XG4gICAgICB3aGlsZShlYi5sZW5ndGgoKSA+IDEpIHtcbiAgICAgICAgaWYoZWIuZ2V0Qnl0ZSgpICE9PSAweEZGKSB7XG4gICAgICAgICAgLS1lYi5yZWFkO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgICsrcGFkTnVtO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIGlmKGJ0ID09PSAweDAyKSB7XG4gICAgICAvLyBsb29rIGZvciAweDAwIGJ5dGVcbiAgICAgIHBhZE51bSA9IDA7XG4gICAgICB3aGlsZShlYi5sZW5ndGgoKSA+IDEpIHtcbiAgICAgICAgaWYoZWIuZ2V0Qnl0ZSgpID09PSAweDAwKSB7XG4gICAgICAgICAgLS1lYi5yZWFkO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgICsrcGFkTnVtO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHplcm8gbXVzdCBiZSAweDAwIGFuZCBwYWROdW0gbXVzdCBiZSAoayAtIDMgLSBtZXNzYWdlIGxlbmd0aClcbiAgICB2YXIgemVybyA9IGViLmdldEJ5dGUoKTtcbiAgICBpZih6ZXJvICE9PSAweDAwIHx8IHBhZE51bSAhPT0gKGsgLSAzIC0gZWIubGVuZ3RoKCkpKSB7XG4gICAgICB0aHJvdyB7XG4gICAgICAgIG1lc3NhZ2U6ICdFbmNyeXB0aW9uIGJsb2NrIGlzIGludmFsaWQuJ1xuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICAvLyByZXR1cm4gbWVzc2FnZVxuICByZXR1cm4gZWIuZ2V0Qnl0ZXMoKTtcbn07XG5cbi8qKlxuICogcGtpLnJzYS5lbmNyeXB0XG4gKi9cblxucGtpLnJzYS5lbmNyeXB0ID0gZnVuY3Rpb24obSwga2V5LCBidCkge1xuICB2YXIgcHViID0gYnQ7XG4gIHZhciBlYiA9IGZvcmdlLnV0aWwuY3JlYXRlQnVmZmVyKCk7XG5cbiAgLy8gZ2V0IHRoZSBsZW5ndGggb2YgdGhlIG1vZHVsdXMgaW4gYnl0ZXNcbiAgdmFyIGsgPSBNYXRoLmNlaWwoa2V5Lm4uYml0TGVuZ3RoKCkgLyA4KTtcblxuICBpZihidCAhPT0gZmFsc2UgJiYgYnQgIT09IHRydWUpIHtcbiAgICAvKiB1c2UgUEtDUyMxIHYxLjUgcGFkZGluZyAqL1xuICAgIGlmKG0ubGVuZ3RoID4gKGsgLSAxMSkpIHtcbiAgICAgIHRocm93IHtcbiAgICAgICAgbWVzc2FnZTogJ01lc3NhZ2UgaXMgdG9vIGxvbmcgdG8gZW5jcnlwdC4nLFxuICAgICAgICBsZW5ndGg6IG0ubGVuZ3RoLFxuICAgICAgICBtYXg6IChrIC0gMTEpXG4gICAgICB9O1xuICAgIH1cblxuICAgIC8qIEEgYmxvY2sgdHlwZSBCVCwgYSBwYWRkaW5nIHN0cmluZyBQUywgYW5kIHRoZSBkYXRhIEQgc2hhbGwgYmVcbiAgICAgIGZvcm1hdHRlZCBpbnRvIGFuIG9jdGV0IHN0cmluZyBFQiwgdGhlIGVuY3J5cHRpb24gYmxvY2s6XG5cbiAgICAgIEVCID0gMDAgfHwgQlQgfHwgUFMgfHwgMDAgfHwgRFxuXG4gICAgICBUaGUgYmxvY2sgdHlwZSBCVCBzaGFsbCBiZSBhIHNpbmdsZSBvY3RldCBpbmRpY2F0aW5nIHRoZSBzdHJ1Y3R1cmUgb2ZcbiAgICAgIHRoZSBlbmNyeXB0aW9uIGJsb2NrLiBGb3IgdGhpcyB2ZXJzaW9uIG9mIHRoZSBkb2N1bWVudCBpdCBzaGFsbCBoYXZlXG4gICAgICB2YWx1ZSAwMCwgMDEsIG9yIDAyLiBGb3IgYSBwcml2YXRlLWtleSBvcGVyYXRpb24sIHRoZSBibG9jayB0eXBlXG4gICAgICBzaGFsbCBiZSAwMCBvciAwMS4gRm9yIGEgcHVibGljLWtleSBvcGVyYXRpb24sIGl0IHNoYWxsIGJlIDAyLlxuXG4gICAgICBUaGUgcGFkZGluZyBzdHJpbmcgUFMgc2hhbGwgY29uc2lzdCBvZiBrLTMtfHxEfHwgb2N0ZXRzLiBGb3IgYmxvY2tcbiAgICAgIHR5cGUgMDAsIHRoZSBvY3RldHMgc2hhbGwgaGF2ZSB2YWx1ZSAwMDsgZm9yIGJsb2NrIHR5cGUgMDEsIHRoZXlcbiAgICAgIHNoYWxsIGhhdmUgdmFsdWUgRkY7IGFuZCBmb3IgYmxvY2sgdHlwZSAwMiwgdGhleSBzaGFsbCBiZVxuICAgICAgcHNldWRvcmFuZG9tbHkgZ2VuZXJhdGVkIGFuZCBub256ZXJvLiBUaGlzIG1ha2VzIHRoZSBsZW5ndGggb2YgdGhlXG4gICAgICBlbmNyeXB0aW9uIGJsb2NrIEVCIGVxdWFsIHRvIGsuICovXG5cbiAgICAvLyBidWlsZCB0aGUgZW5jcnlwdGlvbiBibG9ja1xuICAgIGViLnB1dEJ5dGUoMHgwMCk7XG4gICAgZWIucHV0Qnl0ZShidCk7XG5cbiAgICAvLyBjcmVhdGUgdGhlIHBhZGRpbmcsIGdldCBrZXkgdHlwZVxuICAgIHZhciBwYWROdW0gPSBrIC0gMyAtIG0ubGVuZ3RoO1xuICAgIHZhciBwYWRCeXRlO1xuICAgIGlmKGJ0ID09PSAweDAwIHx8IGJ0ID09PSAweDAxKSB7XG4gICAgICBwdWIgPSBmYWxzZTtcbiAgICAgIHBhZEJ5dGUgPSAoYnQgPT09IDB4MDApID8gMHgwMCA6IDB4RkY7XG4gICAgICBmb3IodmFyIGkgPSAwOyBpIDwgcGFkTnVtOyArK2kpIHtcbiAgICAgICAgZWIucHV0Qnl0ZShwYWRCeXRlKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBwdWIgPSB0cnVlO1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHBhZE51bTsgKytpKSB7XG4gICAgICAgIHBhZEJ5dGUgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAyNTUpICsgMTtcbiAgICAgICAgZWIucHV0Qnl0ZShwYWRCeXRlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyB6ZXJvIGZvbGxvd2VkIGJ5IG1lc3NhZ2VcbiAgICBlYi5wdXRCeXRlKDB4MDApO1xuICB9XG5cbiAgZWIucHV0Qnl0ZXMobSk7XG5cbiAgLy8gbG9hZCBlbmNyeXB0aW9uIGJsb2NrIGFzIGJpZyBpbnRlZ2VyICd4J1xuICAvLyBGSVhNRTogaGV4IGNvbnZlcnNpb24gaW5lZmZpY2llbnQsIGdldCBCaWdJbnRlZ2VyIHcvYnl0ZSBzdHJpbmdzXG4gIHZhciB4ID0gbmV3IEJpZ0ludGVnZXIoZWIudG9IZXgoKSwgMTYpO1xuXG4gIC8vIGRvIFJTQSBlbmNyeXB0aW9uXG4gIHZhciB5ID0gX21vZFBvdyh4LCBrZXksIHB1Yik7XG5cbiAgLy8gY29udmVydCB5IGludG8gdGhlIGVuY3J5cHRlZCBkYXRhIGJ5dGUgc3RyaW5nLCBpZiB5IGlzIHNob3J0ZXIgaW5cbiAgLy8gYnl0ZXMgdGhhbiBrLCB0aGVuIHByZXBlbmQgemVybyBieXRlcyB0byBmaWxsIHVwIGVkXG4gIC8vIEZJWE1FOiBoZXggY29udmVyc2lvbiBpbmVmZmljaWVudCwgZ2V0IEJpZ0ludGVnZXIgdy9ieXRlIHN0cmluZ3NcbiAgdmFyIHloZXggPSB5LnRvU3RyaW5nKDE2KTtcbiAgdmFyIGVkID0gZm9yZ2UudXRpbC5jcmVhdGVCdWZmZXIoKTtcbiAgdmFyIHplcm9zID0gayAtIE1hdGguY2VpbCh5aGV4Lmxlbmd0aCAvIDIpO1xuICB3aGlsZSh6ZXJvcyA+IDApIHtcbiAgICBlZC5wdXRCeXRlKDB4MDApO1xuICAgIC0temVyb3M7XG4gIH1cbiAgZWQucHV0Qnl0ZXMoZm9yZ2UudXRpbC5oZXhUb0J5dGVzKHloZXgpKTtcbiAgcmV0dXJuIGVkLmdldEJ5dGVzKCk7XG59O1xuXG4vKipcbiAqIHBraS5yc2Euc2V0UHJpdmF0ZUtleVxuICovXG5cbnBraS5yc2Euc2V0UHJpdmF0ZUtleSA9IGZ1bmN0aW9uKG4sIGUsIGQsIHAsIHEsIGRQLCBkUSwgcUludikge1xuICB2YXIga2V5ID0ge1xuICAgIG46IG4sXG4gICAgZTogZSxcbiAgICBkOiBkLFxuICAgIHA6IHAsXG4gICAgcTogcSxcbiAgICBkUDogZFAsXG4gICAgZFE6IGRRLFxuICAgIHFJbnY6IHFJbnZcbiAgfTtcblxuICAvKipcbiAgICogRGVjcnlwdHMgdGhlIGdpdmVuIGRhdGEgd2l0aCB0aGlzIHByaXZhdGUga2V5LlxuICAgKlxuICAgKiBAcGFyYW0gZGF0YSB0aGUgYnl0ZSBzdHJpbmcgdG8gZGVjcnlwdC5cbiAgICpcbiAgICogQHJldHVybiB0aGUgZGVjcnlwdGVkIGJ5dGUgc3RyaW5nLlxuICAgKi9cbiAga2V5LmRlY3J5cHQgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgcmV0dXJuIHBraS5yc2EuZGVjcnlwdChkYXRhLCBrZXksIGZhbHNlKTtcbiAgfTtcblxuICAvKipcbiAgICogU2lnbnMgdGhlIGdpdmVuIGRpZ2VzdCwgcHJvZHVjaW5nIGEgc2lnbmF0dXJlLlxuICAgKlxuICAgKiBQS0NTIzEgc3VwcG9ydHMgbXVsdGlwbGUgKGN1cnJlbnRseSB0d28pIHNpZ25hdHVyZSBzY2hlbWVzOlxuICAgKiBSU0FTU0EtUEtDUzEtdjFfNSBhbmQgUlNBU1NBLVBTUy5cbiAgICpcbiAgICogQnkgZGVmYXVsdCB0aGlzIGltcGxlbWVudGF0aW9uIHVzZXMgdGhlIFwib2xkIHNjaGVtZVwiLCBpLmUuXG4gICAqIFJTQVNTQS1QS0NTMS12MV81LiAgSW4gb3JkZXIgdG8gZ2VuZXJhdGUgYSBQU1Mgc2lnbmF0dXJlLCBwcm92aWRlXG4gICAqIGFuIGluc3RhbmNlIG9mIEZvcmdlIFBTUyBvYmplY3QgYXMgc2NoZW1lIHBhcmFtZXRlci5cbiAgICpcbiAgICogQHBhcmFtIG1kIHRoZSBtZXNzYWdlIGRpZ2VzdCBvYmplY3Qgd2l0aCB0aGUgaGFzaCB0byBzaWduLlxuICAgKiBAcGFyYW0gc2NoZW1lIHNpZ25hdHVyZSBzY2hlbWUgdG8gdXNlLCB1bmRlZmluZWQgZm9yIFBLQ1MjMSB2MS41XG4gICAqICAgcGFkZGluZyBzdHlsZS5cbiAgICogQHJldHVybiB0aGUgc2lnbmF0dXJlIGFzIGEgYnl0ZSBzdHJpbmcuXG4gICAqL1xuICBrZXkuc2lnbiA9IGZ1bmN0aW9uKG1kLCBzY2hlbWUpIHtcbiAgICB2YXIgYnQgPSBmYWxzZTsgIC8qIHByaXZhdGUga2V5IG9wZXJhdGlvbiAqL1xuXG4gICAgaWYoc2NoZW1lID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHNjaGVtZSA9IHsgZW5jb2RlOiBlbXNhUGtjczF2MTVlbmNvZGUgfTtcbiAgICAgIGJ0ID0gMHgwMTtcbiAgICB9XG5cbiAgICB2YXIgZCA9IHNjaGVtZS5lbmNvZGUobWQsIGtleS5uLmJpdExlbmd0aCgpKTtcbiAgICByZXR1cm4gcGtpLnJzYS5lbmNyeXB0KGQsIGtleSwgYnQpO1xuICB9O1xuXG4gIHJldHVybiBrZXk7XG59O1xuXG4vKipcbiAqIF9nZXRWYWx1ZUxlbmd0aFxuICovXG5cbnZhciBfZ2V0VmFsdWVMZW5ndGggPSBmdW5jdGlvbihiKSB7XG4gIHZhciBiMiA9IGIuZ2V0Qnl0ZSgpO1xuICBpZihiMiA9PSAweDgwKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfVxuXG4gIC8vIHNlZSBpZiB0aGUgbGVuZ3RoIGlzIFwic2hvcnQgZm9ybVwiIG9yIFwibG9uZyBmb3JtXCIgKGJpdCA4IHNldClcbiAgdmFyIGxlbmd0aDtcbiAgdmFyIGxvbmdGb3JtID0gYjIgJiAweDgwO1xuICBpZighbG9uZ0Zvcm0pIHtcbiAgICAvLyBsZW5ndGggaXMganVzdCB0aGUgZmlyc3QgYnl0ZVxuICAgIGxlbmd0aCA9IGIyO1xuICB9XG4gIGVsc2Uge1xuICAgIC8vIHRoZSBudW1iZXIgb2YgYnl0ZXMgdGhlIGxlbmd0aCBpcyBzcGVjaWZpZWQgaW4gYml0cyA3IHRocm91Z2ggMVxuICAgIC8vIGFuZCBlYWNoIGxlbmd0aCBieXRlIGlzIGluIGJpZy1lbmRpYW4gYmFzZS0yNTZcbiAgICBsZW5ndGggPSBiLmdldEludCgoYjIgJiAweDdGKSA8PCAzKTtcbiAgfVxuICByZXR1cm4gbGVuZ3RoO1xufTtcblxuLyoqXG4gKiBhc24xXG4gKi9cblxuLyoqXG4gKiBhc24xLlR5cGVcbiAqL1xuXG52YXIgYXNuMSA9IGZvcmdlLmFzbjEgPSBmb3JnZS5hc24xIHx8IHt9O1xuYXNuMS5UeXBlID0ge1xuICBOT05FOiAgICAgICAgICAgICAwLFxuICBCT09MRUFOOiAgICAgICAgICAxLFxuICBJTlRFR0VSOiAgICAgICAgICAyLFxuICBCSVRTVFJJTkc6ICAgICAgICAzLFxuICBPQ1RFVFNUUklORzogICAgICA0LFxuICBOVUxMOiAgICAgICAgICAgICA1LFxuICBPSUQ6ICAgICAgICAgICAgICA2LFxuICBPREVTQzogICAgICAgICAgICA3LFxuICBFWFRFUk5BTDogICAgICAgICA4LFxuICBSRUFMOiAgICAgICAgICAgICA5LFxuICBFTlVNRVJBVEVEOiAgICAgIDEwLFxuICBFTUJFRERFRDogICAgICAgIDExLFxuICBVVEY4OiAgICAgICAgICAgIDEyLFxuICBST0lEOiAgICAgICAgICAgIDEzLFxuICBTRVFVRU5DRTogICAgICAgIDE2LFxuICBTRVQ6ICAgICAgICAgICAgIDE3LFxuICBQUklOVEFCTEVTVFJJTkc6IDE5LFxuICBJQTVTVFJJTkc6ICAgICAgIDIyLFxuICBVVENUSU1FOiAgICAgICAgIDIzLFxuICBHRU5FUkFMSVpFRFRJTUU6IDI0LFxuICBCTVBTVFJJTkc6ICAgICAgIDMwXG59O1xuXG4vKipcbiAqIGFzbjEuQ2xhc3NcbiAqL1xuXG5hc24xLkNsYXNzID0ge1xuICBVTklWRVJTQUw6ICAgICAgICAweDAwLFxuICBBUFBMSUNBVElPTjogICAgICAweDQwLFxuICBDT05URVhUX1NQRUNJRklDOiAweDgwLFxuICBQUklWQVRFOiAgICAgICAgICAweEMwXG59O1xuXG4vKipcbiAqIGFzbjEuY3JlYXRlXG4gKi9cblxuYXNuMS5jcmVhdGUgPSBmdW5jdGlvbih0YWdDbGFzcywgdHlwZSwgY29uc3RydWN0ZWQsIHZhbHVlKSB7XG4gIC8qIEFuIGFzbjEgb2JqZWN0IGhhcyBhIHRhZ0NsYXNzLCBhIHR5cGUsIGEgY29uc3RydWN0ZWQgZmxhZywgYW5kIGFcbiAgICB2YWx1ZS4gVGhlIHZhbHVlJ3MgdHlwZSBkZXBlbmRzIG9uIHRoZSBjb25zdHJ1Y3RlZCBmbGFnLiBJZlxuICAgIGNvbnN0cnVjdGVkLCBpdCB3aWxsIGNvbnRhaW4gYSBsaXN0IG9mIG90aGVyIGFzbjEgb2JqZWN0cy4gSWYgbm90LFxuICAgIGl0IHdpbGwgY29udGFpbiB0aGUgQVNOLjEgdmFsdWUgYXMgYW4gYXJyYXkgb2YgYnl0ZXMgZm9ybWF0dGVkXG4gICAgYWNjb3JkaW5nIHRvIHRoZSBBU04uMSBkYXRhIHR5cGUuICovXG5cbiAgLy8gcmVtb3ZlIHVuZGVmaW5lZCB2YWx1ZXNcbiAgaWYodmFsdWUuY29uc3RydWN0b3IgPT0gQXJyYXkpIHtcbiAgICB2YXIgdG1wID0gW107XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IHZhbHVlLmxlbmd0aDsgKytpKSB7XG4gICAgICBpZih2YWx1ZVtpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRtcC5wdXNoKHZhbHVlW2ldKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdmFsdWUgPSB0bXA7XG4gIH1cblxuICByZXR1cm4ge1xuICAgIHRhZ0NsYXNzOiB0YWdDbGFzcyxcbiAgICB0eXBlOiB0eXBlLFxuICAgIGNvbnN0cnVjdGVkOiBjb25zdHJ1Y3RlZCxcbiAgICBjb21wb3NlZDogY29uc3RydWN0ZWQgfHwgKHZhbHVlLmNvbnN0cnVjdG9yID09IEFycmF5KSxcbiAgICB2YWx1ZTogdmFsdWVcbiAgfTtcbn07XG5cbi8qKlxuICogYXNuMS5mcm9tRGVyXG4gKi9cblxuYXNuMS5mcm9tRGVyID0gZnVuY3Rpb24oYnl0ZXMpIHtcbiAgLy8gd3JhcCBpbiBidWZmZXIgaWYgbmVlZGVkXG4gIGlmKGJ5dGVzLmNvbnN0cnVjdG9yID09IFN0cmluZykge1xuICAgIGJ5dGVzID0gZm9yZ2UudXRpbC5jcmVhdGVCdWZmZXIoYnl0ZXMpO1xuICB9XG5cbiAgLy8gbWluaW11bSBsZW5ndGggZm9yIEFTTi4xIERFUiBzdHJ1Y3R1cmUgaXMgMlxuICBpZihieXRlcy5sZW5ndGgoKSA8IDIpICAgIHtcbiAgICB0aHJvdyB7XG4gICAgICBtZXNzYWdlOiAnVG9vIGZldyBieXRlcyB0byBwYXJzZSBERVIuJyxcbiAgICAgIGJ5dGVzOiBieXRlcy5sZW5ndGgoKVxuICAgIH07XG4gIH1cblxuICAvLyBnZXQgdGhlIGZpcnN0IGJ5dGVcbiAgdmFyIGIxID0gYnl0ZXMuZ2V0Qnl0ZSgpO1xuXG4gIC8vIGdldCB0aGUgdGFnIGNsYXNzXG4gIHZhciB0YWdDbGFzcyA9IChiMSAmIDB4QzApO1xuXG4gIC8vIGdldCB0aGUgdHlwZSAoYml0cyAxLTUpXG4gIHZhciB0eXBlID0gYjEgJiAweDFGO1xuXG4gIC8vIGdldCB0aGUgdmFsdWUgbGVuZ3RoXG4gIHZhciBsZW5ndGggPSBfZ2V0VmFsdWVMZW5ndGgoYnl0ZXMpO1xuXG4gIC8vIGVuc3VyZSB0aGVyZSBhcmUgZW5vdWdoIGJ5dGVzIHRvIGdldCB0aGUgdmFsdWVcbiAgaWYoYnl0ZXMubGVuZ3RoKCkgPCBsZW5ndGgpIHtcbiAgICB0aHJvdyB7XG4gICAgICBtZXNzYWdlOiAnVG9vIGZldyBieXRlcyB0byByZWFkIEFTTi4xIHZhbHVlLicsXG4gICAgICBkZXRhaWw6IGJ5dGVzLmxlbmd0aCgpICsgJyA8ICcgKyBsZW5ndGhcbiAgICB9O1xuICB9XG5cbiAgLy8gcHJlcGFyZSB0byBnZXQgdmFsdWVcbiAgdmFyIHZhbHVlO1xuXG4gIC8vIGNvbnN0cnVjdGVkIGZsYWcgaXMgYml0IDYgKDMyID0gMHgyMCkgb2YgdGhlIGZpcnN0IGJ5dGVcbiAgdmFyIGNvbnN0cnVjdGVkID0gKChiMSAmIDB4MjApID09IDB4MjApO1xuXG4gIC8vIGRldGVybWluZSBpZiB0aGUgdmFsdWUgaXMgY29tcG9zZWQgb2Ygb3RoZXIgQVNOLjEgb2JqZWN0cyAoaWYgaXRzXG4gIC8vIGNvbnN0cnVjdGVkIGl0IHdpbGwgYmUgYW5kIGlmIGl0cyBhIEJJVFNUUklORyBpdCBtYXkgYmUpXG4gIHZhciBjb21wb3NlZCA9IGNvbnN0cnVjdGVkO1xuICBpZighY29tcG9zZWQgJiYgdGFnQ2xhc3MgPT09IGFzbjEuQ2xhc3MuVU5JVkVSU0FMICYmXG4gICAgdHlwZSA9PT0gYXNuMS5UeXBlLkJJVFNUUklORyAmJiBsZW5ndGggPiAxKSB7XG4gICAgLyogVGhlIGZpcnN0IG9jdGV0IGdpdmVzIHRoZSBudW1iZXIgb2YgYml0cyBieSB3aGljaCB0aGUgbGVuZ3RoIG9mIHRoZVxuICAgICAgYml0IHN0cmluZyBpcyBsZXNzIHRoYW4gdGhlIG5leHQgbXVsdGlwbGUgb2YgZWlnaHQgKHRoaXMgaXMgY2FsbGVkXG4gICAgICB0aGUgXCJudW1iZXIgb2YgdW51c2VkIGJpdHNcIikuXG5cbiAgICAgIFRoZSBzZWNvbmQgYW5kIGZvbGxvd2luZyBvY3RldHMgZ2l2ZSB0aGUgdmFsdWUgb2YgdGhlIGJpdCBzdHJpbmdcbiAgICAgIGNvbnZlcnRlZCB0byBhbiBvY3RldCBzdHJpbmcuICovXG4gICAgLy8gaWYgdGhlcmUgYXJlIG5vIHVudXNlZCBiaXRzLCBtYXliZSB0aGUgYml0c3RyaW5nIGhvbGRzIEFTTi4xIG9ianNcbiAgICB2YXIgcmVhZCA9IGJ5dGVzLnJlYWQ7XG4gICAgdmFyIHVudXNlZCA9IGJ5dGVzLmdldEJ5dGUoKTtcbiAgICBpZih1bnVzZWQgPT09IDApIHtcbiAgICAgIC8vIGlmIHRoZSBmaXJzdCBieXRlIGluZGljYXRlcyBVTklWRVJTQUwgb3IgQ09OVEVYVF9TUEVDSUZJQyxcbiAgICAgIC8vIGFuZCB0aGUgbGVuZ3RoIGlzIHZhbGlkLCBhc3N1bWUgd2UndmUgZ290IGFuIEFTTi4xIG9iamVjdFxuICAgICAgYjEgPSBieXRlcy5nZXRCeXRlKCk7XG4gICAgICB2YXIgdGMgPSAoYjEgJiAweEMwKTtcbiAgICAgIGlmKHRjID09PSBhc24xLkNsYXNzLlVOSVZFUlNBTCB8fFxuICAgICAgICB0YyA9PT0gYXNuMS5DbGFzcy5DT05URVhUX1NQRUNJRklDKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgdmFyIGxlbiA9IF9nZXRWYWx1ZUxlbmd0aChieXRlcyk7XG4gICAgICAgICAgY29tcG9zZWQgPSAobGVuID09PSBsZW5ndGggLSAoYnl0ZXMucmVhZCAtIHJlYWQpKTtcbiAgICAgICAgICBpZihjb21wb3NlZCkge1xuICAgICAgICAgICAgLy8gYWRqdXN0IHJlYWQvbGVuZ3RoIHRvIGFjY291bnQgZm9yIHVudXNlZCBiaXRzIGJ5dGVcbiAgICAgICAgICAgICsrcmVhZDtcbiAgICAgICAgICAgIC0tbGVuZ3RoO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBjYXRjaChleCkge31cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gcmVzdG9yZSByZWFkIHBvaW50ZXJcbiAgICBieXRlcy5yZWFkID0gcmVhZDtcbiAgfVxuXG4gIGlmKGNvbXBvc2VkKSB7XG4gICAgLy8gcGFyc2UgY2hpbGQgYXNuMSBvYmplY3RzIGZyb20gdGhlIHZhbHVlXG4gICAgdmFsdWUgPSBbXTtcbiAgICBpZihsZW5ndGggPT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gYXNuMSBvYmplY3Qgb2YgaW5kZWZpbml0ZSBsZW5ndGgsIHJlYWQgdW50aWwgZW5kIHRhZ1xuICAgICAgZm9yKDs7KSB7XG4gICAgICAgIGlmKGJ5dGVzLmJ5dGVzKDIpID09PSBTdHJpbmcuZnJvbUNoYXJDb2RlKDAsIDApKSB7XG4gICAgICAgICAgYnl0ZXMuZ2V0Qnl0ZXMoMik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUucHVzaChhc24xLmZyb21EZXIoYnl0ZXMpKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAvLyBwYXJzaW5nIGFzbjEgb2JqZWN0IG9mIGRlZmluaXRlIGxlbmd0aFxuICAgICAgdmFyIHN0YXJ0ID0gYnl0ZXMubGVuZ3RoKCk7XG4gICAgICB3aGlsZShsZW5ndGggPiAwKSB7XG4gICAgICAgIHZhbHVlLnB1c2goYXNuMS5mcm9tRGVyKGJ5dGVzKSk7XG4gICAgICAgIGxlbmd0aCAtPSBzdGFydCAtIGJ5dGVzLmxlbmd0aCgpO1xuICAgICAgICBzdGFydCA9IGJ5dGVzLmxlbmd0aCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyBhc24xIG5vdCBjb21wb3NlZCwgZ2V0IHJhdyB2YWx1ZVxuICBlbHNlIHtcbiAgICAvLyBUT0RPOiBkbyBERVIgdG8gT0lEIGNvbnZlcnNpb24gYW5kIHZpY2UtdmVyc2EgaW4gLnRvRGVyP1xuXG4gICAgaWYobGVuZ3RoID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IHtcbiAgICAgICAgbWVzc2FnZTogJ05vbi1jb25zdHJ1Y3RlZCBBU04uMSBvYmplY3Qgb2YgaW5kZWZpbml0ZSBsZW5ndGguJ1xuICAgICAgfTtcbiAgICB9XG5cbiAgICBpZih0eXBlID09PSBhc24xLlR5cGUuQk1QU1RSSU5HKSB7XG4gICAgICB2YWx1ZSA9ICcnO1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSArPSAyKSB7XG4gICAgICAgIHZhbHVlICs9IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZXMuZ2V0SW50MTYoKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFsdWUgPSBieXRlcy5nZXRCeXRlcyhsZW5ndGgpO1xuICAgIH1cbiAgfVxuXG4gIC8vIGNyZWF0ZSBhbmQgcmV0dXJuIGFzbjEgb2JqZWN0XG4gIHJldHVybiBhc24xLmNyZWF0ZSh0YWdDbGFzcywgdHlwZSwgY29uc3RydWN0ZWQsIHZhbHVlKTtcbn07XG5cbi8qKlxuICogYXNuMS50b0RlclxuICovXG5cbmFzbjEudG9EZXIgPSBmdW5jdGlvbihvYmopIHtcbiAgdmFyIGJ5dGVzID0gZm9yZ2UudXRpbC5jcmVhdGVCdWZmZXIoKTtcblxuICAvLyBidWlsZCB0aGUgZmlyc3QgYnl0ZVxuICB2YXIgYjEgPSBvYmoudGFnQ2xhc3MgfCBvYmoudHlwZTtcblxuICAvLyBmb3Igc3RvcmluZyB0aGUgQVNOLjEgdmFsdWVcbiAgdmFyIHZhbHVlID0gZm9yZ2UudXRpbC5jcmVhdGVCdWZmZXIoKTtcblxuICAvLyBpZiBjb21wb3NlZCwgdXNlIGVhY2ggY2hpbGQgYXNuMSBvYmplY3QncyBERVIgYnl0ZXMgYXMgdmFsdWVcbiAgaWYob2JqLmNvbXBvc2VkKSB7XG4gICAgLy8gdHVybiBvbiA2dGggYml0ICgweDIwID0gMzIpIHRvIGluZGljYXRlIGFzbjEgaXMgY29uc3RydWN0ZWRcbiAgICAvLyBmcm9tIG90aGVyIGFzbjEgb2JqZWN0c1xuICAgIGlmKG9iai5jb25zdHJ1Y3RlZCkge1xuICAgICAgYjEgfD0gMHgyMDtcbiAgICB9XG4gICAgLy8gaWYgdHlwZSBpcyBhIGJpdCBzdHJpbmcsIGFkZCB1bnVzZWQgYml0cyBvZiAweDAwXG4gICAgZWxzZSB7XG4gICAgICB2YWx1ZS5wdXRCeXRlKDB4MDApO1xuICAgIH1cblxuICAgIC8vIGFkZCBhbGwgb2YgdGhlIGNoaWxkIERFUiBieXRlcyB0b2dldGhlclxuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBvYmoudmFsdWUubGVuZ3RoOyArK2kpIHtcbiAgICAgIGlmKG9iai52YWx1ZVtpXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHZhbHVlLnB1dEJ1ZmZlcihhc24xLnRvRGVyKG9iai52YWx1ZVtpXSkpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICAvLyB1c2UgYXNuMS52YWx1ZSBkaXJlY3RseVxuICBlbHNlIHtcbiAgICBpZihvYmoudHlwZSA9PT0gYXNuMS5UeXBlLkJNUFNUUklORykge1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG9iai52YWx1ZS5sZW5ndGg7ICsraSkge1xuICAgICAgICB2YWx1ZS5wdXRJbnQxNihvYmoudmFsdWUuY2hhckNvZGVBdChpKSk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgdmFsdWUucHV0Qnl0ZXMob2JqLnZhbHVlKTtcbiAgICB9XG4gIH1cblxuICAvLyBhZGQgdGFnIGJ5dGVcbiAgYnl0ZXMucHV0Qnl0ZShiMSk7XG5cbiAgLy8gdXNlIFwic2hvcnQgZm9ybVwiIGVuY29kaW5nXG4gIGlmKHZhbHVlLmxlbmd0aCgpIDw9IDEyNykge1xuICAgIC8vIG9uZSBieXRlIGRlc2NyaWJlcyB0aGUgbGVuZ3RoXG4gICAgLy8gYml0IDggPSAwIGFuZCBiaXRzIDctMSA9IGxlbmd0aFxuICAgIGJ5dGVzLnB1dEJ5dGUodmFsdWUubGVuZ3RoKCkgJiAweDdGKTtcbiAgfVxuICAvLyB1c2UgXCJsb25nIGZvcm1cIiBlbmNvZGluZ1xuICBlbHNlIHtcbiAgICAvLyAyIHRvIDEyNyBieXRlcyBkZXNjcmliZSB0aGUgbGVuZ3RoXG4gICAgLy8gZmlyc3QgYnl0ZTogYml0IDggPSAxIGFuZCBiaXRzIDctMSA9ICMgb2YgYWRkaXRpb25hbCBieXRlc1xuICAgIC8vIG90aGVyIGJ5dGVzOiBsZW5ndGggaW4gYmFzZSAyNTYsIGJpZy1lbmRpYW5cbiAgICB2YXIgbGVuID0gdmFsdWUubGVuZ3RoKCk7XG4gICAgdmFyIGxlbkJ5dGVzID0gJyc7XG4gICAgZG8ge1xuICAgICAgbGVuQnl0ZXMgKz0gU3RyaW5nLmZyb21DaGFyQ29kZShsZW4gJiAweEZGKTtcbiAgICAgIGxlbiA9IGxlbiA+Pj4gODtcbiAgICB9XG4gICAgd2hpbGUobGVuID4gMCk7XG5cbiAgICAvLyBzZXQgZmlyc3QgYnl0ZSB0byAjIGJ5dGVzIHVzZWQgdG8gc3RvcmUgdGhlIGxlbmd0aCBhbmQgdHVybiBvblxuICAgIC8vIGJpdCA4IHRvIGluZGljYXRlIGxvbmctZm9ybSBsZW5ndGggaXMgdXNlZFxuICAgIGJ5dGVzLnB1dEJ5dGUobGVuQnl0ZXMubGVuZ3RoIHwgMHg4MCk7XG5cbiAgICAvLyBjb25jYXRlbmF0ZSBsZW5ndGggYnl0ZXMgaW4gcmV2ZXJzZSBzaW5jZSB0aGV5IHdlcmUgZ2VuZXJhdGVkXG4gICAgLy8gbGl0dGxlIGVuZGlhbiBhbmQgd2UgbmVlZCBiaWcgZW5kaWFuXG4gICAgZm9yKHZhciBpID0gbGVuQnl0ZXMubGVuZ3RoIC0gMTsgaSA+PSAwOyAtLWkpIHtcbiAgICAgIGJ5dGVzLnB1dEJ5dGUobGVuQnl0ZXMuY2hhckNvZGVBdChpKSk7XG4gICAgfVxuICB9XG5cbiAgLy8gY29uY2F0ZW5hdGUgdmFsdWUgYnl0ZXNcbiAgYnl0ZXMucHV0QnVmZmVyKHZhbHVlKTtcbiAgcmV0dXJuIGJ5dGVzO1xufTtcblxuLyoqXG4gKiBwa2kucnNhLnNldFB1YmxpY0tleVxuICovXG5cbnBraS5yc2Euc2V0UHVibGljS2V5ID0gZnVuY3Rpb24obiwgZSkge1xuICB2YXIga2V5ID0ge1xuICAgIG46IG4sXG4gICAgZTogZVxuICB9O1xuXG4gIC8qKlxuICAgKiBFbmNyeXB0cyB0aGUgZ2l2ZW4gZGF0YSB3aXRoIHRoaXMgcHVibGljIGtleS5cbiAgICpcbiAgICogQHBhcmFtIGRhdGEgdGhlIGJ5dGUgc3RyaW5nIHRvIGVuY3J5cHQuXG4gICAqXG4gICAqIEByZXR1cm4gdGhlIGVuY3J5cHRlZCBieXRlIHN0cmluZy5cbiAgICovXG4gIGtleS5lbmNyeXB0ID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIHJldHVybiBwa2kucnNhLmVuY3J5cHQoZGF0YSwga2V5LCAweDAyKTtcbiAgfTtcblxuICAvKipcbiAgICogVmVyaWZpZXMgdGhlIGdpdmVuIHNpZ25hdHVyZSBhZ2FpbnN0IHRoZSBnaXZlbiBkaWdlc3QuXG4gICAqXG4gICAqIFBLQ1MjMSBzdXBwb3J0cyBtdWx0aXBsZSAoY3VycmVudGx5IHR3bykgc2lnbmF0dXJlIHNjaGVtZXM6XG4gICAqIFJTQVNTQS1QS0NTMS12MV81IGFuZCBSU0FTU0EtUFNTLlxuICAgKlxuICAgKiBCeSBkZWZhdWx0IHRoaXMgaW1wbGVtZW50YXRpb24gdXNlcyB0aGUgXCJvbGQgc2NoZW1lXCIsIGkuZS5cbiAgICogUlNBU1NBLVBLQ1MxLXYxXzUsIGluIHdoaWNoIGNhc2Ugb25jZSBSU0EtZGVjcnlwdGVkLCB0aGVcbiAgICogc2lnbmF0dXJlIGlzIGFuIE9DVEVUIFNUUklORyB0aGF0IGhvbGRzIGEgRGlnZXN0SW5mby5cbiAgICpcbiAgICogRGlnZXN0SW5mbyA6Oj0gU0VRVUVOQ0Uge1xuICAgKiAgIGRpZ2VzdEFsZ29yaXRobSBEaWdlc3RBbGdvcml0aG1JZGVudGlmaWVyLFxuICAgKiAgIGRpZ2VzdCBEaWdlc3RcbiAgICogfVxuICAgKiBEaWdlc3RBbGdvcml0aG1JZGVudGlmaWVyIDo6PSBBbGdvcml0aG1JZGVudGlmaWVyXG4gICAqIERpZ2VzdCA6Oj0gT0NURVQgU1RSSU5HXG4gICAqXG4gICAqIFRvIHBlcmZvcm0gUFNTIHNpZ25hdHVyZSB2ZXJpZmljYXRpb24sIHByb3ZpZGUgYW4gaW5zdGFuY2VcbiAgICogb2YgRm9yZ2UgUFNTIG9iamVjdCBhcyBzY2hlbWUgcGFyYW1ldGVyLlxuICAgKlxuICAgKiBAcGFyYW0gZGlnZXN0IHRoZSBtZXNzYWdlIGRpZ2VzdCBoYXNoIHRvIGNvbXBhcmUgYWdhaW5zdCB0aGUgc2lnbmF0dXJlLlxuICAgKiBAcGFyYW0gc2lnbmF0dXJlIHRoZSBzaWduYXR1cmUgdG8gdmVyaWZ5LlxuICAgKiBAcGFyYW0gc2NoZW1lIHNpZ25hdHVyZSBzY2hlbWUgdG8gdXNlLCB1bmRlZmluZWQgZm9yIFBLQ1MjMSB2MS41XG4gICAqICAgcGFkZGluZyBzdHlsZS5cbiAgICogQHJldHVybiB0cnVlIGlmIHRoZSBzaWduYXR1cmUgd2FzIHZlcmlmaWVkLCBmYWxzZSBpZiBub3QuXG4gICAqL1xuICAga2V5LnZlcmlmeSA9IGZ1bmN0aW9uKGRpZ2VzdCwgc2lnbmF0dXJlLCBzY2hlbWUpIHtcbiAgICAgLy8gZG8gcnNhIGRlY3J5cHRpb25cbiAgICAgdmFyIG1sID0gc2NoZW1lID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBmYWxzZTtcbiAgICAgdmFyIGQgPSBwa2kucnNhLmRlY3J5cHQoc2lnbmF0dXJlLCBrZXksIHRydWUsIG1sKTtcblxuICAgICBpZihzY2hlbWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgIC8vIGQgaXMgQVNOLjEgQkVSLWVuY29kZWQgRGlnZXN0SW5mb1xuICAgICAgIHZhciBvYmogPSBhc24xLmZyb21EZXIoZCk7XG5cbiAgICAgICAvLyBjb21wYXJlIHRoZSBnaXZlbiBkaWdlc3QgdG8gdGhlIGRlY3J5cHRlZCBvbmVcbiAgICAgICByZXR1cm4gZGlnZXN0ID09PSBvYmoudmFsdWVbMV0udmFsdWU7XG4gICAgIH1cbiAgICAgZWxzZSB7XG4gICAgICAgcmV0dXJuIHNjaGVtZS52ZXJpZnkoZGlnZXN0LCBkLCBrZXkubi5iaXRMZW5ndGgoKSk7XG4gICAgIH1cbiAgfTtcblxuICByZXR1cm4ga2V5O1xufTtcblxuLyoqXG4gKiBwa2kucnNhLnN0ZXBLZXlQYWlyR2VuZXJhdGlvblN0YXRlXG4gKi9cblxudmFyIEdDRF8zMF9ERUxUQSA9IFs2LCA0LCAyLCA0LCAyLCA0LCA2LCAyXTtcblxucGtpLnJzYS5zdGVwS2V5UGFpckdlbmVyYXRpb25TdGF0ZSA9IGZ1bmN0aW9uKHN0YXRlLCBuKSB7XG4gIC8vIGRvIGtleSBnZW5lcmF0aW9uIChiYXNlZCBvbiBUb20gV3UncyByc2EuanMsIHNlZSBqc2JuLmpzIGxpY2Vuc2UpXG4gIC8vIHdpdGggc29tZSBtaW5vciBvcHRpbWl6YXRpb25zIGFuZCBkZXNpZ25lZCB0byBydW4gaW4gc3RlcHNcblxuICAvLyBsb2NhbCBzdGF0ZSB2YXJzXG4gIHZhciBUSElSVFkgPSBuZXcgQmlnSW50ZWdlcihudWxsKTtcbiAgVEhJUlRZLmZyb21JbnQoMzApO1xuICB2YXIgZGVsdGFJZHggPSAwO1xuICB2YXIgb3Bfb3IgPSBmdW5jdGlvbih4LHkpIHsgcmV0dXJuIHh8eTsgfTtcblxuICAvLyBrZWVwIHN0ZXBwaW5nIHVudGlsIHRpbWUgbGltaXQgaXMgcmVhY2hlZCBvciBkb25lXG4gIHZhciB0MSA9ICtuZXcgRGF0ZSgpO1xuICB2YXIgdDI7XG4gIHZhciB0b3RhbCA9IDA7XG4gIHdoaWxlKHN0YXRlLmtleXMgPT09IG51bGwgJiYgKG4gPD0gMCB8fCB0b3RhbCA8IG4pKSB7XG4gICAgLy8gZ2VuZXJhdGUgcCBvciBxXG4gICAgaWYoc3RhdGUuc3RhdGUgPT09IDApIHtcbiAgICAgIC8qIE5vdGU6IEFsbCBwcmltZXMgYXJlIG9mIHRoZSBmb3JtOlxuXG4gICAgICAgIDMwaytpLCBmb3IgaSA8IDMwIGFuZCBnY2QoMzAsIGkpPTEsIHdoZXJlIHRoZXJlIGFyZSA4IHZhbHVlcyBmb3IgaVxuXG4gICAgICAgIFdoZW4gd2UgZ2VuZXJhdGUgYSByYW5kb20gbnVtYmVyLCB3ZSBhbHdheXMgYWxpZ24gaXQgYXQgMzBrICsgMS4gRWFjaFxuICAgICAgICB0aW1lIHRoZSBudW1iZXIgaXMgZGV0ZXJtaW5lZCBub3QgdG8gYmUgcHJpbWUgd2UgYWRkIHRvIGdldCB0byB0aGVcbiAgICAgICAgbmV4dCAnaScsIGVnOiBpZiB0aGUgbnVtYmVyIHdhcyBhdCAzMGsgKyAxIHdlIGFkZCA2LiAqL1xuICAgICAgdmFyIGJpdHMgPSAoc3RhdGUucCA9PT0gbnVsbCkgPyBzdGF0ZS5wQml0cyA6IHN0YXRlLnFCaXRzO1xuICAgICAgdmFyIGJpdHMxID0gYml0cyAtIDE7XG5cbiAgICAgIC8vIGdldCBhIHJhbmRvbSBudW1iZXJcbiAgICAgIGlmKHN0YXRlLnBxU3RhdGUgPT09IDApIHtcbiAgICAgICAgc3RhdGUubnVtID0gbmV3IEJpZ0ludGVnZXIoYml0cywgc3RhdGUucm5nKTtcbiAgICAgICAgLy8gZm9yY2UgTVNCIHNldFxuICAgICAgICBpZighc3RhdGUubnVtLnRlc3RCaXQoYml0czEpKSB7XG4gICAgICAgICAgc3RhdGUubnVtLmJpdHdpc2VUbyhcbiAgICAgICAgICAgIEJpZ0ludGVnZXIuT05FLnNoaWZ0TGVmdChiaXRzMSksIG9wX29yLCBzdGF0ZS5udW0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIGFsaWduIG51bWJlciBvbiAzMGsrMSBib3VuZGFyeVxuICAgICAgICBzdGF0ZS5udW0uZEFkZE9mZnNldCgzMSAtIHN0YXRlLm51bS5tb2QoVEhJUlRZKS5ieXRlVmFsdWUoKSwgMCk7XG4gICAgICAgIGRlbHRhSWR4ID0gMDtcblxuICAgICAgICArK3N0YXRlLnBxU3RhdGU7XG4gICAgICB9XG4gICAgICAvLyB0cnkgdG8gbWFrZSB0aGUgbnVtYmVyIGEgcHJpbWVcbiAgICAgIGVsc2UgaWYoc3RhdGUucHFTdGF0ZSA9PT0gMSkge1xuICAgICAgICAvLyBvdmVyZmxvdywgdHJ5IGFnYWluXG4gICAgICAgIGlmKHN0YXRlLm51bS5iaXRMZW5ndGgoKSA+IGJpdHMpIHtcbiAgICAgICAgICBzdGF0ZS5wcVN0YXRlID0gMDtcbiAgICAgICAgfVxuICAgICAgICAvLyBkbyBwcmltYWxpdHkgdGVzdFxuICAgICAgICBlbHNlIGlmKHN0YXRlLm51bS5pc1Byb2JhYmxlUHJpbWUoMSkpIHtcbiAgICAgICAgICArK3N0YXRlLnBxU3RhdGU7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgLy8gZ2V0IG5leHQgcG90ZW50aWFsIHByaW1lXG4gICAgICAgICAgc3RhdGUubnVtLmRBZGRPZmZzZXQoR0NEXzMwX0RFTFRBW2RlbHRhSWR4KysgJSA4XSwgMCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGVuc3VyZSBudW1iZXIgaXMgY29wcmltZSB3aXRoIGVcbiAgICAgIGVsc2UgaWYoc3RhdGUucHFTdGF0ZSA9PT0gMikge1xuICAgICAgICBzdGF0ZS5wcVN0YXRlID1cbiAgICAgICAgICAoc3RhdGUubnVtLnN1YnRyYWN0KEJpZ0ludGVnZXIuT05FKS5nY2Qoc3RhdGUuZSlcbiAgICAgICAgICAuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSA9PT0gMCkgPyAzIDogMDtcbiAgICAgIH1cbiAgICAgIC8vIGVuc3VyZSBudW1iZXIgaXMgYSBwcm9iYWJsZSBwcmltZVxuICAgICAgZWxzZSBpZihzdGF0ZS5wcVN0YXRlID09PSAzKSB7XG4gICAgICAgIHN0YXRlLnBxU3RhdGUgPSAwO1xuICAgICAgICBpZihzdGF0ZS5udW0uaXNQcm9iYWJsZVByaW1lKDEwKSkge1xuICAgICAgICAgIGlmKHN0YXRlLnAgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHN0YXRlLnAgPSBzdGF0ZS5udW07XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgc3RhdGUucSA9IHN0YXRlLm51bTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBhZHZhbmNlIHN0YXRlIGlmIGJvdGggcCBhbmQgcSBhcmUgcmVhZHlcbiAgICAgICAgICBpZihzdGF0ZS5wICE9PSBudWxsICYmIHN0YXRlLnEgIT09IG51bGwpIHtcbiAgICAgICAgICAgICsrc3RhdGUuc3RhdGU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHN0YXRlLm51bSA9IG51bGw7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIGVuc3VyZSBwIGlzIGxhcmdlciB0aGFuIHEgKHN3YXAgdGhlbSBpZiBub3QpXG4gICAgZWxzZSBpZihzdGF0ZS5zdGF0ZSA9PT0gMSkge1xuICAgICAgaWYoc3RhdGUucC5jb21wYXJlVG8oc3RhdGUucSkgPCAwKSB7XG4gICAgICAgIHN0YXRlLm51bSA9IHN0YXRlLnA7XG4gICAgICAgIHN0YXRlLnAgPSBzdGF0ZS5xO1xuICAgICAgICBzdGF0ZS5xID0gc3RhdGUubnVtO1xuICAgICAgfVxuICAgICAgKytzdGF0ZS5zdGF0ZTtcbiAgICB9XG4gICAgLy8gY29tcHV0ZSBwaGk6IChwIC0gMSkocSAtIDEpIChFdWxlcidzIHRvdGllbnQgZnVuY3Rpb24pXG4gICAgZWxzZSBpZihzdGF0ZS5zdGF0ZSA9PT0gMikge1xuICAgICAgc3RhdGUucDEgPSBzdGF0ZS5wLnN1YnRyYWN0KEJpZ0ludGVnZXIuT05FKTtcbiAgICAgIHN0YXRlLnExID0gc3RhdGUucS5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSk7XG4gICAgICBzdGF0ZS5waGkgPSBzdGF0ZS5wMS5tdWx0aXBseShzdGF0ZS5xMSk7XG4gICAgICArK3N0YXRlLnN0YXRlO1xuICAgIH1cbiAgICAvLyBlbnN1cmUgZSBhbmQgcGhpIGFyZSBjb3ByaW1lXG4gICAgZWxzZSBpZihzdGF0ZS5zdGF0ZSA9PT0gMykge1xuICAgICAgaWYoc3RhdGUucGhpLmdjZChzdGF0ZS5lKS5jb21wYXJlVG8oQmlnSW50ZWdlci5PTkUpID09PSAwKSB7XG4gICAgICAgIC8vIHBoaSBhbmQgZSBhcmUgY29wcmltZSwgYWR2YW5jZVxuICAgICAgICArK3N0YXRlLnN0YXRlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIHBoaSBhbmQgZSBhcmVuJ3QgY29wcmltZSwgc28gZ2VuZXJhdGUgYSBuZXcgcCBhbmQgcVxuICAgICAgICBzdGF0ZS5wID0gbnVsbDtcbiAgICAgICAgc3RhdGUucSA9IG51bGw7XG4gICAgICAgIHN0YXRlLnN0YXRlID0gMDtcbiAgICAgIH1cbiAgICB9XG4gICAgLy8gY3JlYXRlIG4sIGVuc3VyZSBuIGlzIGhhcyB0aGUgcmlnaHQgbnVtYmVyIG9mIGJpdHNcbiAgICBlbHNlIGlmKHN0YXRlLnN0YXRlID09PSA0KSB7XG4gICAgICBzdGF0ZS5uID0gc3RhdGUucC5tdWx0aXBseShzdGF0ZS5xKTtcblxuICAgICAgLy8gZW5zdXJlIG4gaXMgcmlnaHQgbnVtYmVyIG9mIGJpdHNcbiAgICAgIGlmKHN0YXRlLm4uYml0TGVuZ3RoKCkgPT09IHN0YXRlLmJpdHMpIHtcbiAgICAgICAgLy8gc3VjY2VzcywgYWR2YW5jZVxuICAgICAgICArK3N0YXRlLnN0YXRlO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIGZhaWxlZCwgZ2V0IG5ldyBxXG4gICAgICAgIHN0YXRlLnEgPSBudWxsO1xuICAgICAgICBzdGF0ZS5zdGF0ZSA9IDA7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIHNldCBrZXlzXG4gICAgZWxzZSBpZihzdGF0ZS5zdGF0ZSA9PT0gNSkge1xuICAgICAgdmFyIGQgPSBzdGF0ZS5lLm1vZEludmVyc2Uoc3RhdGUucGhpKTtcbiAgICAgIHN0YXRlLmtleXMgPSB7XG4gICAgICAgIHByaXZhdGVLZXk6IGZvcmdlLnBraS5yc2Euc2V0UHJpdmF0ZUtleShcbiAgICAgICAgICBzdGF0ZS5uLCBzdGF0ZS5lLCBkLCBzdGF0ZS5wLCBzdGF0ZS5xLFxuICAgICAgICAgIGQubW9kKHN0YXRlLnAxKSwgZC5tb2Qoc3RhdGUucTEpLFxuICAgICAgICAgIHN0YXRlLnEubW9kSW52ZXJzZShzdGF0ZS5wKSksXG4gICAgICAgIHB1YmxpY0tleTogZm9yZ2UucGtpLnJzYS5zZXRQdWJsaWNLZXkoc3RhdGUubiwgc3RhdGUuZSlcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gdXBkYXRlIHRpbWluZ1xuICAgIHQyID0gK25ldyBEYXRlKCk7XG4gICAgdG90YWwgKz0gdDIgLSB0MTtcbiAgICB0MSA9IHQyO1xuICB9XG5cbiAgcmV0dXJuIHN0YXRlLmtleXMgIT09IG51bGw7XG59O1xuXG4vKipcbiAqIF9nZW5lcmF0ZUtleVBhaXJcbiAqL1xuXG5mdW5jdGlvbiBfZ2VuZXJhdGVLZXlQYWlyKHN0YXRlLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZih0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICBvcHRpb25zID0ge307XG4gIH1cblxuICAvLyB3ZWIgd29ya2VycyB1bmF2YWlsYWJsZSwgdXNlIHNldEltbWVkaWF0ZVxuICBpZihmYWxzZSB8fCB0eXBlb2YoV29ya2VyKSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICBmdW5jdGlvbiBzdGVwKCkge1xuICAgICAgLy8gMTAgbXMgZ2l2ZXMgNW1zIG9mIGxlZXdheSBmb3Igb3RoZXIgY2FsY3VsYXRpb25zIGJlZm9yZSBkcm9wcGluZ1xuICAgICAgLy8gYmVsb3cgNjBmcHMgKDEwMDAvNjAgPT0gMTYuNjcpLCBidXQgaW4gcmVhbGl0eSwgdGhlIG51bWJlciB3aWxsXG4gICAgICAvLyBsaWtlbHkgYmUgaGlnaGVyIGR1ZSB0byBhbiAnYXRvbWljJyBiaWcgaW50IG1vZFBvd1xuICAgICAgaWYoZm9yZ2UucGtpLnJzYS5zdGVwS2V5UGFpckdlbmVyYXRpb25TdGF0ZShzdGF0ZSwgMTApKSB7XG4gICAgICAgIHJldHVybiBjYWxsYmFjayhudWxsLCBzdGF0ZS5rZXlzKTtcbiAgICAgIH1cbiAgICAgIGZvcmdlLnV0aWwuc2V0SW1tZWRpYXRlKHN0ZXApO1xuICAgIH1cbiAgICByZXR1cm4gc3RlcCgpO1xuICB9XG5cbiAgLy8gdXNlIHdlYiB3b3JrZXJzIHRvIGdlbmVyYXRlIGtleXNcbiAgdmFyIG51bVdvcmtlcnMgPSBvcHRpb25zLndvcmtlcnMgfHwgMjtcbiAgdmFyIHdvcmtMb2FkID0gb3B0aW9ucy53b3JrTG9hZCB8fCAxMDA7XG4gIHZhciByYW5nZSA9IHdvcmtMb2FkICogMzAvODtcbiAgdmFyIHdvcmtlclNjcmlwdCA9IG9wdGlvbnMud29ya2VyU2NyaXB0IHx8ICdmb3JnZS9wcmltZS53b3JrZXIuanMnO1xuICB2YXIgVEhJUlRZID0gbmV3IEJpZ0ludGVnZXIobnVsbCk7XG4gIFRISVJUWS5mcm9tSW50KDMwKTtcbiAgdmFyIG9wX29yID0gZnVuY3Rpb24oeCx5KSB7IHJldHVybiB4fHk7IH07XG4gIGdlbmVyYXRlKCk7XG5cbiAgZnVuY3Rpb24gZ2VuZXJhdGUoKSB7XG4gICAgLy8gZmluZCBwIGFuZCB0aGVuIHEgKGRvbmUgaW4gc2VyaWVzIHRvIHNpbXBsaWZ5IHNldHRpbmcgd29ya2VyIG51bWJlcilcbiAgICBnZXRQcmltZShzdGF0ZS5wQml0cywgZnVuY3Rpb24oZXJyLCBudW0pIHtcbiAgICAgIGlmKGVycikge1xuICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICAgIH1cbiAgICAgIHN0YXRlLnAgPSBudW07XG4gICAgICBnZXRQcmltZShzdGF0ZS5xQml0cywgZmluaXNoKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vIGltcGxlbWVudCBwcmltZSBudW1iZXIgZ2VuZXJhdGlvbiB1c2luZyB3ZWIgd29ya2Vyc1xuICBmdW5jdGlvbiBnZXRQcmltZShiaXRzLCBjYWxsYmFjaykge1xuICAgIC8vIFRPRE86IGNvbnNpZGVyIG9wdGltaXppbmcgYnkgc3RhcnRpbmcgd29ya2VycyBvdXRzaWRlIGdldFByaW1lKCkgLi4uXG4gICAgLy8gbm90ZSB0aGF0IGluIG9yZGVyIHRvIGNsZWFuIHVwIHRoZXkgd2lsbCBoYXZlIHRvIGJlIG1hZGUgaW50ZXJuYWxseVxuICAgIC8vIGFzeW5jaHJvbm91cyB3aGljaCBtYXkgYWN0dWFsbHkgYmUgc2xvd2VyXG5cbiAgICAvLyBzdGFydCB3b3JrZXJzIGltbWVkaWF0ZWx5XG4gICAgdmFyIHdvcmtlcnMgPSBbXTtcbiAgICBmb3IodmFyIGkgPSAwOyBpIDwgbnVtV29ya2VyczsgKytpKSB7XG4gICAgICAvLyBGSVhNRTogZml4IHBhdGggb3IgdXNlIGJsb2IgVVJMc1xuICAgICAgd29ya2Vyc1tpXSA9IG5ldyBXb3JrZXIod29ya2VyU2NyaXB0KTtcbiAgICB9XG4gICAgdmFyIHJ1bm5pbmcgPSBudW1Xb3JrZXJzO1xuXG4gICAgLy8gaW5pdGlhbGl6ZSByYW5kb20gbnVtYmVyXG4gICAgdmFyIG51bSA9IGdlbmVyYXRlUmFuZG9tKCk7XG5cbiAgICAvLyBsaXN0ZW4gZm9yIHJlcXVlc3RzIGZyb20gd29ya2VycyBhbmQgYXNzaWduIHJhbmdlcyB0byBmaW5kIHByaW1lXG4gICAgZm9yKHZhciBpID0gMDsgaSA8IG51bVdvcmtlcnM7ICsraSkge1xuICAgICAgd29ya2Vyc1tpXS5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgd29ya2VyTWVzc2FnZSk7XG4gICAgfVxuXG4gICAgLyogTm90ZTogVGhlIGRpc3RyaWJ1dGlvbiBvZiByYW5kb20gbnVtYmVycyBpcyB1bmtub3duLiBUaGVyZWZvcmUsIGVhY2hcbiAgICB3ZWIgd29ya2VyIGlzIGNvbnRpbnVvdXNseSBhbGxvY2F0ZWQgYSByYW5nZSBvZiBudW1iZXJzIHRvIGNoZWNrIGZvciBhXG4gICAgcmFuZG9tIG51bWJlciB1bnRpbCBvbmUgaXMgZm91bmQuXG5cbiAgICBFdmVyeSAzMCBudW1iZXJzIHdpbGwgYmUgY2hlY2tlZCBqdXN0IDggdGltZXMsIGJlY2F1c2UgcHJpbWUgbnVtYmVyc1xuICAgIGhhdmUgdGhlIGZvcm06XG5cbiAgICAzMGsraSwgZm9yIGkgPCAzMCBhbmQgZ2NkKDMwLCBpKT0xICh0aGVyZSBhcmUgOCB2YWx1ZXMgb2YgaSBmb3IgdGhpcylcblxuICAgIFRoZXJlZm9yZSwgaWYgd2Ugd2FudCBhIHdlYiB3b3JrZXIgdG8gcnVuIE4gY2hlY2tzIGJlZm9yZSBhc2tpbmcgZm9yXG4gICAgYSBuZXcgcmFuZ2Ugb2YgbnVtYmVycywgZWFjaCByYW5nZSBtdXN0IGNvbnRhaW4gTiozMC84IG51bWJlcnMuXG5cbiAgICBGb3IgMTAwIGNoZWNrcyAod29ya0xvYWQpLCB0aGlzIGlzIGEgcmFuZ2Ugb2YgMzc1LiAqL1xuXG4gICAgZnVuY3Rpb24gZ2VuZXJhdGVSYW5kb20oKSB7XG4gICAgICB2YXIgYml0czEgPSBiaXRzIC0gMTtcbiAgICAgIHZhciBudW0gPSBuZXcgQmlnSW50ZWdlcihiaXRzLCBzdGF0ZS5ybmcpO1xuICAgICAgLy8gZm9yY2UgTVNCIHNldFxuICAgICAgaWYoIW51bS50ZXN0Qml0KGJpdHMxKSkge1xuICAgICAgICBudW0uYml0d2lzZVRvKEJpZ0ludGVnZXIuT05FLnNoaWZ0TGVmdChiaXRzMSksIG9wX29yLCBudW0pO1xuICAgICAgfVxuICAgICAgLy8gYWxpZ24gbnVtYmVyIG9uIDMwaysxIGJvdW5kYXJ5XG4gICAgICBudW0uZEFkZE9mZnNldCgzMSAtIG51bS5tb2QoVEhJUlRZKS5ieXRlVmFsdWUoKSwgMCk7XG4gICAgICByZXR1cm4gbnVtO1xuICAgIH1cblxuICAgIHZhciBmb3VuZCA9IGZhbHNlO1xuICAgIGZ1bmN0aW9uIHdvcmtlck1lc3NhZ2UoZSkge1xuICAgICAgLy8gaWdub3JlIG1lc3NhZ2UsIHByaW1lIGFscmVhZHkgZm91bmRcbiAgICAgIGlmKGZvdW5kKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgLS1ydW5uaW5nO1xuICAgICAgdmFyIGRhdGEgPSBlLmRhdGE7XG4gICAgICBpZihkYXRhLmZvdW5kKSB7XG4gICAgICAgIC8vIHRlcm1pbmF0ZSBhbGwgd29ya2Vyc1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgd29ya2Vycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgIHdvcmtlcnNbaV0udGVybWluYXRlKCk7XG4gICAgICAgIH1cbiAgICAgICAgZm91bmQgPSB0cnVlO1xuICAgICAgICByZXR1cm4gY2FsbGJhY2sobnVsbCwgbmV3IEJpZ0ludGVnZXIoZGF0YS5wcmltZSwgMTYpKTtcbiAgICAgIH1cblxuICAgICAgLy8gb3ZlcmZsb3csIHJlZ2VuZXJhdGUgcHJpbWVcbiAgICAgIGlmKG51bS5iaXRMZW5ndGgoKSA+IGJpdHMpIHtcbiAgICAgICAgbnVtID0gZ2VuZXJhdGVSYW5kb20oKTtcbiAgICAgIH1cblxuICAgICAgLy8gYXNzaWduIG5ldyByYW5nZSB0byBjaGVja1xuICAgICAgdmFyIGhleCA9IG51bS50b1N0cmluZygxNik7XG5cbiAgICAgIC8vIHN0YXJ0IHByaW1lIHNlYXJjaFxuICAgICAgZS50YXJnZXQucG9zdE1lc3NhZ2Uoe1xuICAgICAgICBlOiBzdGF0ZS5lSW50LFxuICAgICAgICBoZXg6IGhleCxcbiAgICAgICAgd29ya0xvYWQ6IHdvcmtMb2FkXG4gICAgICB9KTtcblxuICAgICAgbnVtLmRBZGRPZmZzZXQocmFuZ2UsIDApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbmlzaChlcnIsIG51bSkge1xuICAgIC8vIHNldCBxXG4gICAgc3RhdGUucSA9IG51bTtcblxuICAgIC8vIGVuc3VyZSBwIGlzIGxhcmdlciB0aGFuIHEgKHN3YXAgdGhlbSBpZiBub3QpXG4gICAgaWYoc3RhdGUucC5jb21wYXJlVG8oc3RhdGUucSkgPCAwKSB7XG4gICAgICB2YXIgdG1wID0gc3RhdGUucDtcbiAgICAgIHN0YXRlLnAgPSBzdGF0ZS5xO1xuICAgICAgc3RhdGUucSA9IHRtcDtcbiAgICB9XG5cbiAgICAvLyBjb21wdXRlIHBoaTogKHAgLSAxKShxIC0gMSkgKEV1bGVyJ3MgdG90aWVudCBmdW5jdGlvbilcbiAgICBzdGF0ZS5wMSA9IHN0YXRlLnAuc3VidHJhY3QoQmlnSW50ZWdlci5PTkUpO1xuICAgIHN0YXRlLnExID0gc3RhdGUucS5zdWJ0cmFjdChCaWdJbnRlZ2VyLk9ORSk7XG4gICAgc3RhdGUucGhpID0gc3RhdGUucDEubXVsdGlwbHkoc3RhdGUucTEpO1xuXG4gICAgLy8gZW5zdXJlIGUgYW5kIHBoaSBhcmUgY29wcmltZVxuICAgIGlmKHN0YXRlLnBoaS5nY2Qoc3RhdGUuZSkuY29tcGFyZVRvKEJpZ0ludGVnZXIuT05FKSAhPT0gMCkge1xuICAgICAgLy8gcGhpIGFuZCBlIGFyZW4ndCBjb3ByaW1lLCBzbyBnZW5lcmF0ZSBhIG5ldyBwIGFuZCBxXG4gICAgICBzdGF0ZS5wID0gc3RhdGUucSA9IG51bGw7XG4gICAgICBnZW5lcmF0ZSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGNyZWF0ZSBuLCBlbnN1cmUgbiBpcyBoYXMgdGhlIHJpZ2h0IG51bWJlciBvZiBiaXRzXG4gICAgc3RhdGUubiA9IHN0YXRlLnAubXVsdGlwbHkoc3RhdGUucSk7XG4gICAgaWYoc3RhdGUubi5iaXRMZW5ndGgoKSAhPT0gc3RhdGUuYml0cykge1xuICAgICAgLy8gZmFpbGVkLCBnZXQgbmV3IHFcbiAgICAgIHN0YXRlLnEgPSBudWxsO1xuICAgICAgZ2V0UHJpbWUoc3RhdGUucUJpdHMsIGZpbmlzaCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gc2V0IGtleXNcbiAgICB2YXIgZCA9IHN0YXRlLmUubW9kSW52ZXJzZShzdGF0ZS5waGkpO1xuICAgIHN0YXRlLmtleXMgPSB7XG4gICAgICBwcml2YXRlS2V5OiBmb3JnZS5wa2kucnNhLnNldFByaXZhdGVLZXkoXG4gICAgICAgIHN0YXRlLm4sIHN0YXRlLmUsIGQsIHN0YXRlLnAsIHN0YXRlLnEsXG4gICAgICAgIGQubW9kKHN0YXRlLnAxKSwgZC5tb2Qoc3RhdGUucTEpLFxuICAgICAgICBzdGF0ZS5xLm1vZEludmVyc2Uoc3RhdGUucCkpLFxuICAgICAgcHVibGljS2V5OiBmb3JnZS5wa2kucnNhLnNldFB1YmxpY0tleShzdGF0ZS5uLCBzdGF0ZS5lKVxuICAgIH07XG5cbiAgICBjYWxsYmFjayhudWxsLCBzdGF0ZS5rZXlzKTtcbiAgfVxufVxuXG4vKipcbiAqIHBraS5yc2EuZ2VuZXJhdGVLZXlQYWlyXG4gKi9cblxucGtpLnJzYS5nZW5lcmF0ZUtleVBhaXIgPSBmdW5jdGlvbihiaXRzLCBlLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICAvLyAoYml0cyksIChvcHRpb25zKSwgKGNhbGxiYWNrKVxuICBpZihhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgaWYodHlwZW9mIGJpdHMgPT09ICdvYmplY3QnKSB7XG4gICAgICBvcHRpb25zID0gYml0cztcbiAgICAgIGJpdHMgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGVsc2UgaWYodHlwZW9mIGJpdHMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gYml0cztcbiAgICAgIGJpdHMgPSB1bmRlZmluZWQ7XG4gICAgfVxuICB9XG4gIC8vIChiaXRzLCBvcHRpb25zKSwgKGJpdHMsIGNhbGxiYWNrKSwgKG9wdGlvbnMsIGNhbGxiYWNrKVxuICBlbHNlIGlmKGFyZ3VtZW50cy5sZW5ndGggPT09IDIpIHtcbiAgICBpZih0eXBlb2YgYml0cyA9PT0gJ251bWJlcicpIHtcbiAgICAgIGlmKHR5cGVvZiBlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIGNhbGxiYWNrID0gZTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBvcHRpb25zID0gZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBvcHRpb25zID0gYml0cztcbiAgICAgIGNhbGxiYWNrID0gZTtcbiAgICAgIGJpdHMgPSB1bmRlZmluZWQ7XG4gICAgfVxuICAgIGUgPSB1bmRlZmluZWQ7XG4gIH1cbiAgLy8gKGJpdHMsIGUsIG9wdGlvbnMpLCAoYml0cywgZSwgY2FsbGJhY2spLCAoYml0cywgb3B0aW9ucywgY2FsbGJhY2spXG4gIGVsc2UgaWYoYXJndW1lbnRzLmxlbmd0aCA9PT0gMykge1xuICAgIGlmKHR5cGVvZiBlID09PSAnbnVtYmVyJykge1xuICAgICAgaWYodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgICAgICBvcHRpb25zID0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSBlO1xuICAgICAgZSA9IHVuZGVmaW5lZDtcbiAgICB9XG4gIH1cbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge307XG4gIGlmKGJpdHMgPT09IHVuZGVmaW5lZCkge1xuICAgIGJpdHMgPSBvcHRpb25zLmJpdHMgfHwgMTAyNDtcbiAgfVxuICBpZihlID09PSB1bmRlZmluZWQpIHtcbiAgICBlID0gb3B0aW9ucy5lIHx8IDB4MTAwMDE7XG4gIH1cbiAgdmFyIHN0YXRlID0gcGtpLnJzYS5jcmVhdGVLZXlQYWlyR2VuZXJhdGlvblN0YXRlKGJpdHMsIGUpO1xuICBpZighY2FsbGJhY2spIHtcbiAgICBwa2kucnNhLnN0ZXBLZXlQYWlyR2VuZXJhdGlvblN0YXRlKHN0YXRlLCAwKTtcbiAgICByZXR1cm4gc3RhdGUua2V5cztcbiAgfVxuICBfZ2VuZXJhdGVLZXlQYWlyKHN0YXRlLCBvcHRpb25zLCBjYWxsYmFjayk7XG59O1xuXG4vKipcbiAqIF9iblRvQnl0ZXNcbiAqL1xuXG52YXIgX2JuVG9CeXRlcyA9IGZ1bmN0aW9uKGIpIHtcbiAgLy8gcHJlcGVuZCAweDAwIGlmIGZpcnN0IGJ5dGUgPj0gMHg4MFxuICB2YXIgaGV4ID0gYi50b1N0cmluZygxNik7XG4gIGlmKGhleFswXSA+PSAnOCcpIHtcbiAgICBoZXggPSAnMDAnICsgaGV4O1xuICB9XG4gIHJldHVybiBmb3JnZS51dGlsLmhleFRvQnl0ZXMoaGV4KTtcbn07XG5cbi8qKlxuICogcGtpLnB1YmxpY0tleVRvUlNBUHVibGljS2V5XG4gKi9cblxucGtpLnB1YmxpY0tleVRvUlNBUHVibGljS2V5ID0gZnVuY3Rpb24oa2V5KSB7XG4gIC8vIFJTQVB1YmxpY0tleVxuICByZXR1cm4gYXNuMS5jcmVhdGUoYXNuMS5DbGFzcy5VTklWRVJTQUwsIGFzbjEuVHlwZS5TRVFVRU5DRSwgdHJ1ZSwgW1xuICAgIC8vIG1vZHVsdXMgKG4pXG4gICAgYXNuMS5jcmVhdGUoYXNuMS5DbGFzcy5VTklWRVJTQUwsIGFzbjEuVHlwZS5JTlRFR0VSLCBmYWxzZSxcbiAgICAgIF9iblRvQnl0ZXMoa2V5Lm4pKSxcbiAgICAvLyBwdWJsaWNFeHBvbmVudCAoZSlcbiAgICBhc24xLmNyZWF0ZShhc24xLkNsYXNzLlVOSVZFUlNBTCwgYXNuMS5UeXBlLklOVEVHRVIsIGZhbHNlLFxuICAgICAgX2JuVG9CeXRlcyhrZXkuZSkpXG4gIF0pO1xufTtcblxuLyoqXG4gKiB1dGlsLmVuY29kZTY0XG4gKi9cblxudmFyIF9iYXNlNjQgPVxuICAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrLz0nO1xuXG51dGlsLmVuY29kZTY0ID0gZnVuY3Rpb24oaW5wdXQsIG1heGxpbmUpIHtcbiAgdmFyIGxpbmUgPSAnJztcbiAgdmFyIG91dHB1dCA9ICcnO1xuICB2YXIgY2hyMSwgY2hyMiwgY2hyMztcbiAgdmFyIGkgPSAwO1xuICB3aGlsZShpIDwgaW5wdXQubGVuZ3RoKSB7XG4gICAgY2hyMSA9IGlucHV0LmNoYXJDb2RlQXQoaSsrKTtcbiAgICBjaHIyID0gaW5wdXQuY2hhckNvZGVBdChpKyspO1xuICAgIGNocjMgPSBpbnB1dC5jaGFyQ29kZUF0KGkrKyk7XG5cbiAgICAvLyBlbmNvZGUgNCBjaGFyYWN0ZXIgZ3JvdXBcbiAgICBsaW5lICs9IF9iYXNlNjQuY2hhckF0KGNocjEgPj4gMik7XG4gICAgbGluZSArPSBfYmFzZTY0LmNoYXJBdCgoKGNocjEgJiAzKSA8PCA0KSB8IChjaHIyID4+IDQpKTtcbiAgICBpZihpc05hTihjaHIyKSkge1xuICAgICAgbGluZSArPSAnPT0nO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIGxpbmUgKz0gX2Jhc2U2NC5jaGFyQXQoKChjaHIyICYgMTUpIDw8IDIpIHwgKGNocjMgPj4gNikpO1xuICAgICAgbGluZSArPSBpc05hTihjaHIzKSA/ICc9JyA6IF9iYXNlNjQuY2hhckF0KGNocjMgJiA2Myk7XG4gICAgfVxuXG4gICAgaWYobWF4bGluZSAmJiBsaW5lLmxlbmd0aCA+IG1heGxpbmUpIHtcbiAgICAgIG91dHB1dCArPSBsaW5lLnN1YnN0cigwLCBtYXhsaW5lKSArICdcXHJcXG4nO1xuICAgICAgbGluZSA9IGxpbmUuc3Vic3RyKG1heGxpbmUpO1xuICAgIH1cbiAgfVxuICBvdXRwdXQgKz0gbGluZTtcblxuICByZXR1cm4gb3V0cHV0O1xufTtcblxuLyoqXG4gKiBwa2kucHVibGljS2V5VG9SU0FQdWJsaWNLZXlQZW1cbiAqL1xuXG5wa2kucHVibGljS2V5VG9SU0FQdWJsaWNLZXlQZW0gPSBmdW5jdGlvbihrZXksIG1heGxpbmUpIHtcbiAgLy8gY29udmVydCB0byBBU04uMSwgdGhlbiBERVIsIHRoZW4gYmFzZTY0LWVuY29kZVxuICB2YXIgb3V0ID0gYXNuMS50b0Rlcihwa2kucHVibGljS2V5VG9SU0FQdWJsaWNLZXkoa2V5KSk7XG4gIG91dCA9IGZvcmdlLnV0aWwuZW5jb2RlNjQob3V0LmdldEJ5dGVzKCksIG1heGxpbmUgfHwgNjQpO1xuICByZXR1cm4gKFxuICAgICctLS0tLUJFR0lOIFJTQSBQVUJMSUMgS0VZLS0tLS1cXHJcXG4nICtcbiAgICBvdXQgK1xuICAgICdcXHJcXG4tLS0tLUVORCBSU0EgUFVCTElDIEtFWS0tLS0tJyk7XG59O1xuXG4vKipcbiAqIHBraS5wcml2YXRlS2V5VG9Bc24xXG4gKi9cblxucGtpLnByaXZhdGVLZXlUb0FzbjEgPSBwa2kucHJpdmF0ZUtleVRvUlNBUHJpdmF0ZUtleSA9IGZ1bmN0aW9uKGtleSkge1xuICAvLyBSU0FQcml2YXRlS2V5XG4gIHJldHVybiBhc24xLmNyZWF0ZShhc24xLkNsYXNzLlVOSVZFUlNBTCwgYXNuMS5UeXBlLlNFUVVFTkNFLCB0cnVlLCBbXG4gICAgLy8gdmVyc2lvbiAoMCA9IG9ubHkgMiBwcmltZXMsIDEgbXVsdGlwbGUgcHJpbWVzKVxuICAgIGFzbjEuY3JlYXRlKGFzbjEuQ2xhc3MuVU5JVkVSU0FMLCBhc24xLlR5cGUuSU5URUdFUiwgZmFsc2UsXG4gICAgICBTdHJpbmcuZnJvbUNoYXJDb2RlKDB4MDApKSxcbiAgICAvLyBtb2R1bHVzIChuKVxuICAgIGFzbjEuY3JlYXRlKGFzbjEuQ2xhc3MuVU5JVkVSU0FMLCBhc24xLlR5cGUuSU5URUdFUiwgZmFsc2UsXG4gICAgICBfYm5Ub0J5dGVzKGtleS5uKSksXG4gICAgLy8gcHVibGljRXhwb25lbnQgKGUpXG4gICAgYXNuMS5jcmVhdGUoYXNuMS5DbGFzcy5VTklWRVJTQUwsIGFzbjEuVHlwZS5JTlRFR0VSLCBmYWxzZSxcbiAgICAgIF9iblRvQnl0ZXMoa2V5LmUpKSxcbiAgICAvLyBwcml2YXRlRXhwb25lbnQgKGQpXG4gICAgYXNuMS5jcmVhdGUoYXNuMS5DbGFzcy5VTklWRVJTQUwsIGFzbjEuVHlwZS5JTlRFR0VSLCBmYWxzZSxcbiAgICAgIF9iblRvQnl0ZXMoa2V5LmQpKSxcbiAgICAvLyBwcml2YXRlS2V5UHJpbWUxIChwKVxuICAgIGFzbjEuY3JlYXRlKGFzbjEuQ2xhc3MuVU5JVkVSU0FMLCBhc24xLlR5cGUuSU5URUdFUiwgZmFsc2UsXG4gICAgICBfYm5Ub0J5dGVzKGtleS5wKSksXG4gICAgLy8gcHJpdmF0ZUtleVByaW1lMiAocSlcbiAgICBhc24xLmNyZWF0ZShhc24xLkNsYXNzLlVOSVZFUlNBTCwgYXNuMS5UeXBlLklOVEVHRVIsIGZhbHNlLFxuICAgICAgX2JuVG9CeXRlcyhrZXkucSkpLFxuICAgIC8vIHByaXZhdGVLZXlFeHBvbmVudDEgKGRQKVxuICAgIGFzbjEuY3JlYXRlKGFzbjEuQ2xhc3MuVU5JVkVSU0FMLCBhc24xLlR5cGUuSU5URUdFUiwgZmFsc2UsXG4gICAgICBfYm5Ub0J5dGVzKGtleS5kUCkpLFxuICAgIC8vIHByaXZhdGVLZXlFeHBvbmVudDIgKGRRKVxuICAgIGFzbjEuY3JlYXRlKGFzbjEuQ2xhc3MuVU5JVkVSU0FMLCBhc24xLlR5cGUuSU5URUdFUiwgZmFsc2UsXG4gICAgICBfYm5Ub0J5dGVzKGtleS5kUSkpLFxuICAgIC8vIGNvZWZmaWNpZW50IChxSW52KVxuICAgIGFzbjEuY3JlYXRlKGFzbjEuQ2xhc3MuVU5JVkVSU0FMLCBhc24xLlR5cGUuSU5URUdFUiwgZmFsc2UsXG4gICAgICBfYm5Ub0J5dGVzKGtleS5xSW52KSlcbiAgXSk7XG59O1xuXG4vKipcbiAqIHBraS5wcml2YXRlS2V5VG9QZW1cbiAqL1xuXG5wa2kucHJpdmF0ZUtleVRvUGVtID0gZnVuY3Rpb24oa2V5LCBtYXhsaW5lKSB7XG4gIC8vIGNvbnZlcnQgdG8gQVNOLjEsIHRoZW4gREVSLCB0aGVuIGJhc2U2NC1lbmNvZGVcbiAgdmFyIG91dCA9IGFzbjEudG9EZXIocGtpLnByaXZhdGVLZXlUb0FzbjEoa2V5KSk7XG4gIG91dCA9IGZvcmdlLnV0aWwuZW5jb2RlNjQob3V0LmdldEJ5dGVzKCksIG1heGxpbmUgfHwgNjQpO1xuICByZXR1cm4gKFxuICAgICctLS0tLUJFR0lOIFJTQSBQUklWQVRFIEtFWS0tLS0tXFxyXFxuJyArXG4gICAgb3V0ICtcbiAgICAnXFxyXFxuLS0tLS1FTkQgUlNBIFBSSVZBVEUgS0VZLS0tLS0nKTtcbn07XG4iXX0=
