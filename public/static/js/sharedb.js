(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
// ISC @ Julien Fontanet

'use strict'

// ===================================================================

var defineProperty = Object.defineProperty

// -------------------------------------------------------------------

var captureStackTrace = Error.captureStackTrace
if (!captureStackTrace) {
  captureStackTrace = function captureStackTrace (error) {
    var container = new Error()

    defineProperty(error, 'stack', {
      configurable: true,
      get: function getStack () {
        var stack = container.stack

        // Replace property with value for faster future accesses.
        defineProperty(this, 'stack', {
          value: stack
        })

        return stack
      },
      set: function setStack (stack) {
        defineProperty(error, 'stack', {
          configurable: true,
          value: stack,
          writable: true
        })
      }
    })
  }
}

// -------------------------------------------------------------------

function BaseError (message) {
  if (message) {
    defineProperty(this, 'message', {
      configurable: true,
      value: message,
      writable: true
    })
  }

  var cname = this.constructor.name
  if (
    cname &&
    cname !== this.name
  ) {
    defineProperty(this, 'name', {
      configurable: true,
      value: cname,
      writable: true
    })
  }

  captureStackTrace(this, this.constructor)
}

BaseError.prototype = Object.create(Error.prototype, {
  // See: https://github.com/JsCommunity/make-error/issues/4
  constructor: {
    configurable: true,
    value: BaseError,
    writable: true
  }
})

// -------------------------------------------------------------------

// Sets the name of a function if possible (depends of the JS engine).
var setFunctionName = (function () {
  function setFunctionName (fn, name) {
    return defineProperty(fn, 'name', {
      configurable: true,
      value: name
    })
  }
  try {
    var f = function () {}
    setFunctionName(f, 'foo')
    if (f.name === 'foo') {
      return setFunctionName
    }
  } catch (_) {}
})()

// -------------------------------------------------------------------

function makeError (constructor, super_) {
  if (super_ == null || super_ === Error) {
    super_ = BaseError
  } else if (typeof super_ !== 'function') {
    throw new TypeError('super_ should be a function')
  }

  var name
  if (typeof constructor === 'string') {
    name = constructor
    constructor = function () { super_.apply(this, arguments) }

    // If the name can be set, do it once and for all.
    if (setFunctionName) {
      setFunctionName(constructor, name)
      name = null
    }
  } else if (typeof constructor !== 'function') {
    throw new TypeError('constructor should be either a string or a function')
  }

  // Also register the super constructor also as `constructor.super_` just
  // like Node's `util.inherits()`.
  constructor.super_ = constructor['super'] = super_

  var properties = {
    constructor: {
      configurable: true,
      value: constructor,
      writable: true
    }
  }

  // If the name could not be set on the constructor, set it on the
  // prototype.
  if (name != null) {
    properties.name = {
      configurable: true,
      value: name,
      writable: true
    }
  }
  constructor.prototype = Object.create(super_.prototype, properties)

  return constructor
}
exports = module.exports = makeError
exports.BaseError = BaseError

},{}],3:[function(require,module,exports){
// These methods let you build a transform function from a transformComponent
// function for OT types like JSON0 in which operations are lists of components
// and transforming them requires N^2 work. I find it kind of nasty that I need
// this, but I'm not really sure what a better solution is. Maybe I should do
// this automatically to types that don't have a compose function defined.

// Add transform and transformX functions for an OT type which has
// transformComponent defined.  transformComponent(destination array,
// component, other component, side)
module.exports = bootstrapTransform
function bootstrapTransform(type, transformComponent, checkValidOp, append) {
  var transformComponentX = function(left, right, destLeft, destRight) {
    transformComponent(destLeft, left, right, 'left');
    transformComponent(destRight, right, left, 'right');
  };

  var transformX = type.transformX = function(leftOp, rightOp) {
    checkValidOp(leftOp);
    checkValidOp(rightOp);
    var newRightOp = [];

    for (var i = 0; i < rightOp.length; i++) {
      var rightComponent = rightOp[i];

      // Generate newLeftOp by composing leftOp by rightComponent
      var newLeftOp = [];
      var k = 0;
      while (k < leftOp.length) {
        var nextC = [];
        transformComponentX(leftOp[k], rightComponent, newLeftOp, nextC);
        k++;

        if (nextC.length === 1) {
          rightComponent = nextC[0];
        } else if (nextC.length === 0) {
          for (var j = k; j < leftOp.length; j++) {
            append(newLeftOp, leftOp[j]);
          }
          rightComponent = null;
          break;
        } else {
          // Recurse.
          var pair = transformX(leftOp.slice(k), nextC);
          for (var l = 0; l < pair[0].length; l++) {
            append(newLeftOp, pair[0][l]);
          }
          for (var r = 0; r < pair[1].length; r++) {
            append(newRightOp, pair[1][r]);
          }
          rightComponent = null;
          break;
        }
      }

      if (rightComponent != null) {
        append(newRightOp, rightComponent);
      }
      leftOp = newLeftOp;
    }
    return [leftOp, newRightOp];
  };

  // Transforms op with specified type ('left' or 'right') by otherOp.
  type.transform = function(op, otherOp, type) {
    if (!(type === 'left' || type === 'right'))
      throw new Error("type must be 'left' or 'right'");

    if (otherOp.length === 0) return op;

    if (op.length === 1 && otherOp.length === 1)
      return transformComponent([], op[0], otherOp[0], type);

    if (type === 'left')
      return transformX(op, otherOp)[0];
    else
      return transformX(otherOp, op)[1];
  };
};

},{}],4:[function(require,module,exports){
// Only the JSON type is exported, because the text type is deprecated
// otherwise. (If you want to use it somewhere, you're welcome to pull it out
// into a separate module that json0 can depend on).

module.exports = {
  type: require('./json0')
};

},{"./json0":5}],5:[function(require,module,exports){
/*
 This is the implementation of the JSON OT type.

 Spec is here: https://github.com/josephg/ShareJS/wiki/JSON-Operations

 Note: This is being made obsolete. It will soon be replaced by the JSON2 type.
*/

/**
 * UTILITY FUNCTIONS
 */

/**
 * Checks if the passed object is an Array instance. Can't use Array.isArray
 * yet because its not supported on IE8.
 *
 * @param obj
 * @returns {boolean}
 */
var isArray = function(obj) {
  return Object.prototype.toString.call(obj) == '[object Array]';
};

/**
 * Checks if the passed object is an Object instance.
 * No function call (fast) version
 *
 * @param obj
 * @returns {boolean}
 */
var isObject = function(obj) {
  return (!!obj) && (obj.constructor === Object);
};

/**
 * Clones the passed object using JSON serialization (which is slow).
 *
 * hax, copied from test/types/json. Apparently this is still the fastest way
 * to deep clone an object, assuming we have browser support for JSON.  @see
 * http://jsperf.com/cloning-an-object/12
 */
var clone = function(o) {
  return JSON.parse(JSON.stringify(o));
};

/**
 * JSON OT Type
 * @type {*}
 */
var json = {
  name: 'json0',
  uri: 'http://sharejs.org/types/JSONv0'
};

// You can register another OT type as a subtype in a JSON document using
// the following function. This allows another type to handle certain
// operations instead of the builtin JSON type.
var subtypes = {};
json.registerSubtype = function(subtype) {
  subtypes[subtype.name] = subtype;
};

json.create = function(data) {
  // Null instead of undefined if you don't pass an argument.
  return data === undefined ? null : clone(data);
};

json.invertComponent = function(c) {
  var c_ = {p: c.p};

  // handle subtype ops
  if (c.t && subtypes[c.t]) {
    c_.t = c.t;
    c_.o = subtypes[c.t].invert(c.o);
  }

  if (c.si !== void 0) c_.sd = c.si;
  if (c.sd !== void 0) c_.si = c.sd;
  if (c.oi !== void 0) c_.od = c.oi;
  if (c.od !== void 0) c_.oi = c.od;
  if (c.li !== void 0) c_.ld = c.li;
  if (c.ld !== void 0) c_.li = c.ld;
  if (c.na !== void 0) c_.na = -c.na;

  if (c.lm !== void 0) {
    c_.lm = c.p[c.p.length-1];
    c_.p = c.p.slice(0,c.p.length-1).concat([c.lm]);
  }

  return c_;
};

json.invert = function(op) {
  var op_ = op.slice().reverse();
  var iop = [];
  for (var i = 0; i < op_.length; i++) {
    iop.push(json.invertComponent(op_[i]));
  }
  return iop;
};

json.checkValidOp = function(op) {
  for (var i = 0; i < op.length; i++) {
    if (!isArray(op[i].p)) throw new Error('Missing path');
  }
};

json.checkList = function(elem) {
  if (!isArray(elem))
    throw new Error('Referenced element not a list');
};

json.checkObj = function(elem) {
  if (!isObject(elem)) {
    throw new Error("Referenced element not an object (it was " + JSON.stringify(elem) + ")");
  }
};

// helper functions to convert old string ops to and from subtype ops
function convertFromText(c) {
  c.t = 'text0';
  var o = {p: c.p.pop()};
  if (c.si != null) o.i = c.si;
  if (c.sd != null) o.d = c.sd;
  c.o = [o];
}

function convertToText(c) {
  c.p.push(c.o[0].p);
  if (c.o[0].i != null) c.si = c.o[0].i;
  if (c.o[0].d != null) c.sd = c.o[0].d;
  delete c.t;
  delete c.o;
}

json.apply = function(snapshot, op) {
  json.checkValidOp(op);

  op = clone(op);

  var container = {
    data: snapshot
  };

  for (var i = 0; i < op.length; i++) {
    var c = op[i];

    // convert old string ops to use subtype for backwards compatibility
    if (c.si != null || c.sd != null)
      convertFromText(c);

    var parent = null;
    var parentKey = null;
    var elem = container;
    var key = 'data';

    for (var j = 0; j < c.p.length; j++) {
      var p = c.p[j];

      parent = elem;
      parentKey = key;
      elem = elem[key];
      key = p;

      if (parent == null)
        throw new Error('Path invalid');
    }

    // handle subtype ops
    if (c.t && c.o !== void 0 && subtypes[c.t]) {
      elem[key] = subtypes[c.t].apply(elem[key], c.o);

    // Number add
    } else if (c.na !== void 0) {
      if (typeof elem[key] != 'number')
        throw new Error('Referenced element not a number');

      elem[key] += c.na;
    }

    // List replace
    else if (c.li !== void 0 && c.ld !== void 0) {
      json.checkList(elem);
      // Should check the list element matches c.ld
      elem[key] = c.li;
    }

    // List insert
    else if (c.li !== void 0) {
      json.checkList(elem);
      elem.splice(key,0, c.li);
    }

    // List delete
    else if (c.ld !== void 0) {
      json.checkList(elem);
      // Should check the list element matches c.ld here too.
      elem.splice(key,1);
    }

    // List move
    else if (c.lm !== void 0) {
      json.checkList(elem);
      if (c.lm != key) {
        var e = elem[key];
        // Remove it...
        elem.splice(key,1);
        // And insert it back.
        elem.splice(c.lm,0,e);
      }
    }

    // Object insert / replace
    else if (c.oi !== void 0) {
      json.checkObj(elem);

      // Should check that elem[key] == c.od
      elem[key] = c.oi;
    }

    // Object delete
    else if (c.od !== void 0) {
      json.checkObj(elem);

      // Should check that elem[key] == c.od
      delete elem[key];
    }

    else {
      throw new Error('invalid / missing instruction in op');
    }
  }

  return container.data;
};

// Helper to break an operation up into a bunch of small ops.
json.shatter = function(op) {
  var results = [];
  for (var i = 0; i < op.length; i++) {
    results.push([op[i]]);
  }
  return results;
};

// Helper for incrementally applying an operation to a snapshot. Calls yield
// after each op component has been applied.
json.incrementalApply = function(snapshot, op, _yield) {
  for (var i = 0; i < op.length; i++) {
    var smallOp = [op[i]];
    snapshot = json.apply(snapshot, smallOp);
    // I'd just call this yield, but thats a reserved keyword. Bah!
    _yield(smallOp, snapshot);
  }

  return snapshot;
};

// Checks if two paths, p1 and p2 match.
var pathMatches = json.pathMatches = function(p1, p2, ignoreLast) {
  if (p1.length != p2.length)
    return false;

  for (var i = 0; i < p1.length; i++) {
    if (p1[i] !== p2[i] && (!ignoreLast || i !== p1.length - 1))
      return false;
  }

  return true;
};

json.append = function(dest,c) {
  c = clone(c);

  if (dest.length === 0) {
    dest.push(c);
    return;
  }

  var last = dest[dest.length - 1];

  // convert old string ops to use subtype for backwards compatibility
  if ((c.si != null || c.sd != null) && (last.si != null || last.sd != null)) {
    convertFromText(c);
    convertFromText(last);
  }

  if (pathMatches(c.p, last.p)) {
    // handle subtype ops
    if (c.t && last.t && c.t === last.t && subtypes[c.t]) {
      last.o = subtypes[c.t].compose(last.o, c.o);

      // convert back to old string ops
      if (c.si != null || c.sd != null) {
        var p = c.p;
        for (var i = 0; i < last.o.length - 1; i++) {
          c.o = [last.o.pop()];
          c.p = p.slice();
          convertToText(c);
          dest.push(c);
        }

        convertToText(last);
      }
    } else if (last.na != null && c.na != null) {
      dest[dest.length - 1] = {p: last.p, na: last.na + c.na};
    } else if (last.li !== undefined && c.li === undefined && c.ld === last.li) {
      // insert immediately followed by delete becomes a noop.
      if (last.ld !== undefined) {
        // leave the delete part of the replace
        delete last.li;
      } else {
        dest.pop();
      }
    } else if (last.od !== undefined && last.oi === undefined && c.oi !== undefined && c.od === undefined) {
      last.oi = c.oi;
    } else if (last.oi !== undefined && c.od !== undefined) {
      // The last path component inserted something that the new component deletes (or replaces).
      // Just merge them.
      if (c.oi !== undefined) {
        last.oi = c.oi;
      } else if (last.od !== undefined) {
        delete last.oi;
      } else {
        // An insert directly followed by a delete turns into a no-op and can be removed.
        dest.pop();
      }
    } else if (c.lm !== undefined && c.p[c.p.length - 1] === c.lm) {
      // don't do anything
    } else {
      dest.push(c);
    }
  } else {
    // convert string ops back
    if ((c.si != null || c.sd != null) && (last.si != null || last.sd != null)) {
      convertToText(c);
      convertToText(last);
    }

    dest.push(c);
  }
};

json.compose = function(op1,op2) {
  json.checkValidOp(op1);
  json.checkValidOp(op2);

  var newOp = clone(op1);

  for (var i = 0; i < op2.length; i++) {
    json.append(newOp,op2[i]);
  }

  return newOp;
};

json.normalize = function(op) {
  var newOp = [];

  op = isArray(op) ? op : [op];

  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    if (c.p == null) c.p = [];

    json.append(newOp,c);
  }

  return newOp;
};

// Returns the common length of the paths of ops a and b
json.commonLengthForOps = function(a, b) {
  var alen = a.p.length;
  var blen = b.p.length;
  if (a.na != null || a.t)
    alen++;

  if (b.na != null || b.t)
    blen++;

  if (alen === 0) return -1;
  if (blen === 0) return null;

  alen--;
  blen--;

  for (var i = 0; i < alen; i++) {
    var p = a.p[i];
    if (i >= blen || p !== b.p[i])
      return null;
  }

  return alen;
};

// Returns true if an op can affect the given path
json.canOpAffectPath = function(op, path) {
  return json.commonLengthForOps({p:path}, op) != null;
};

// transform c so it applies to a document with otherC applied.
json.transformComponent = function(dest, c, otherC, type) {
  c = clone(c);

  var common = json.commonLengthForOps(otherC, c);
  var common2 = json.commonLengthForOps(c, otherC);
  var cplength = c.p.length;
  var otherCplength = otherC.p.length;

  if (c.na != null || c.t)
    cplength++;

  if (otherC.na != null || otherC.t)
    otherCplength++;

  // if c is deleting something, and that thing is changed by otherC, we need to
  // update c to reflect that change for invertibility.
  if (common2 != null && otherCplength > cplength && c.p[common2] == otherC.p[common2]) {
    if (c.ld !== void 0) {
      var oc = clone(otherC);
      oc.p = oc.p.slice(cplength);
      c.ld = json.apply(clone(c.ld),[oc]);
    } else if (c.od !== void 0) {
      var oc = clone(otherC);
      oc.p = oc.p.slice(cplength);
      c.od = json.apply(clone(c.od),[oc]);
    }
  }

  if (common != null) {
    var commonOperand = cplength == otherCplength;

    // backward compatibility for old string ops
    var oc = otherC;
    if ((c.si != null || c.sd != null) && (otherC.si != null || otherC.sd != null)) {
      convertFromText(c);
      oc = clone(otherC);
      convertFromText(oc);
    }

    // handle subtype ops
    if (oc.t && subtypes[oc.t]) {
      if (c.t && c.t === oc.t) {
        var res = subtypes[c.t].transform(c.o, oc.o, type);

        if (res.length > 0) {
          // convert back to old string ops
          if (c.si != null || c.sd != null) {
            var p = c.p;
            for (var i = 0; i < res.length; i++) {
              c.o = [res[i]];
              c.p = p.slice();
              convertToText(c);
              json.append(dest, c);
            }
          } else {
            c.o = res;
            json.append(dest, c);
          }
        }

        return dest;
      }
    }

    // transform based on otherC
    else if (otherC.na !== void 0) {
      // this case is handled below
    } else if (otherC.li !== void 0 && otherC.ld !== void 0) {
      if (otherC.p[common] === c.p[common]) {
        // noop

        if (!commonOperand) {
          return dest;
        } else if (c.ld !== void 0) {
          // we're trying to delete the same element, -> noop
          if (c.li !== void 0 && type === 'left') {
            // we're both replacing one element with another. only one can survive
            c.ld = clone(otherC.li);
          } else {
            return dest;
          }
        }
      }
    } else if (otherC.li !== void 0) {
      if (c.li !== void 0 && c.ld === undefined && commonOperand && c.p[common] === otherC.p[common]) {
        // in li vs. li, left wins.
        if (type === 'right')
          c.p[common]++;
      } else if (otherC.p[common] <= c.p[common]) {
        c.p[common]++;
      }

      if (c.lm !== void 0) {
        if (commonOperand) {
          // otherC edits the same list we edit
          if (otherC.p[common] <= c.lm)
            c.lm++;
          // changing c.from is handled above.
        }
      }
    } else if (otherC.ld !== void 0) {
      if (c.lm !== void 0) {
        if (commonOperand) {
          if (otherC.p[common] === c.p[common]) {
            // they deleted the thing we're trying to move
            return dest;
          }
          // otherC edits the same list we edit
          var p = otherC.p[common];
          var from = c.p[common];
          var to = c.lm;
          if (p < to || (p === to && from < to))
            c.lm--;

        }
      }

      if (otherC.p[common] < c.p[common]) {
        c.p[common]--;
      } else if (otherC.p[common] === c.p[common]) {
        if (otherCplength < cplength) {
          // we're below the deleted element, so -> noop
          return dest;
        } else if (c.ld !== void 0) {
          if (c.li !== void 0) {
            // we're replacing, they're deleting. we become an insert.
            delete c.ld;
          } else {
            // we're trying to delete the same element, -> noop
            return dest;
          }
        }
      }

    } else if (otherC.lm !== void 0) {
      if (c.lm !== void 0 && cplength === otherCplength) {
        // lm vs lm, here we go!
        var from = c.p[common];
        var to = c.lm;
        var otherFrom = otherC.p[common];
        var otherTo = otherC.lm;
        if (otherFrom !== otherTo) {
          // if otherFrom == otherTo, we don't need to change our op.

          // where did my thing go?
          if (from === otherFrom) {
            // they moved it! tie break.
            if (type === 'left') {
              c.p[common] = otherTo;
              if (from === to) // ugh
                c.lm = otherTo;
            } else {
              return dest;
            }
          } else {
            // they moved around it
            if (from > otherFrom) c.p[common]--;
            if (from > otherTo) c.p[common]++;
            else if (from === otherTo) {
              if (otherFrom > otherTo) {
                c.p[common]++;
                if (from === to) // ugh, again
                  c.lm++;
              }
            }

            // step 2: where am i going to put it?
            if (to > otherFrom) {
              c.lm--;
            } else if (to === otherFrom) {
              if (to > from)
                c.lm--;
            }
            if (to > otherTo) {
              c.lm++;
            } else if (to === otherTo) {
              // if we're both moving in the same direction, tie break
              if ((otherTo > otherFrom && to > from) ||
                  (otherTo < otherFrom && to < from)) {
                if (type === 'right') c.lm++;
              } else {
                if (to > from) c.lm++;
                else if (to === otherFrom) c.lm--;
              }
            }
          }
        }
      } else if (c.li !== void 0 && c.ld === undefined && commonOperand) {
        // li
        var from = otherC.p[common];
        var to = otherC.lm;
        p = c.p[common];
        if (p > from) c.p[common]--;
        if (p > to) c.p[common]++;
      } else {
        // ld, ld+li, si, sd, na, oi, od, oi+od, any li on an element beneath
        // the lm
        //
        // i.e. things care about where their item is after the move.
        var from = otherC.p[common];
        var to = otherC.lm;
        p = c.p[common];
        if (p === from) {
          c.p[common] = to;
        } else {
          if (p > from) c.p[common]--;
          if (p > to) c.p[common]++;
          else if (p === to && from > to) c.p[common]++;
        }
      }
    }
    else if (otherC.oi !== void 0 && otherC.od !== void 0) {
      if (c.p[common] === otherC.p[common]) {
        if (c.oi !== void 0 && commonOperand) {
          // we inserted where someone else replaced
          if (type === 'right') {
            // left wins
            return dest;
          } else {
            // we win, make our op replace what they inserted
            c.od = otherC.oi;
          }
        } else {
          // -> noop if the other component is deleting the same object (or any parent)
          return dest;
        }
      }
    } else if (otherC.oi !== void 0) {
      if (c.oi !== void 0 && c.p[common] === otherC.p[common]) {
        // left wins if we try to insert at the same place
        if (type === 'left') {
          json.append(dest,{p: c.p, od:otherC.oi});
        } else {
          return dest;
        }
      }
    } else if (otherC.od !== void 0) {
      if (c.p[common] == otherC.p[common]) {
        if (!commonOperand)
          return dest;
        if (c.oi !== void 0) {
          delete c.od;
        } else {
          return dest;
        }
      }
    }
  }

  json.append(dest,c);
  return dest;
};

require('./bootstrapTransform')(json, json.transformComponent, json.checkValidOp, json.append);

/**
 * Register a subtype for string operations, using the text0 type.
 */
var text = require('./text0');

json.registerSubtype(text);
module.exports = json;


},{"./bootstrapTransform":3,"./text0":6}],6:[function(require,module,exports){
// DEPRECATED!
//
// This type works, but is not exported. Its included here because the JSON0
// embedded string operations use this library.


// A simple text implementation
//
// Operations are lists of components. Each component either inserts or deletes
// at a specified position in the document.
//
// Components are either:
//  {i:'str', p:100}: Insert 'str' at position 100 in the document
//  {d:'str', p:100}: Delete 'str' at position 100 in the document
//
// Components in an operation are executed sequentially, so the position of components
// assumes previous components have already executed.
//
// Eg: This op:
//   [{i:'abc', p:0}]
// is equivalent to this op:
//   [{i:'a', p:0}, {i:'b', p:1}, {i:'c', p:2}]

var text = module.exports = {
  name: 'text0',
  uri: 'http://sharejs.org/types/textv0',
  create: function(initial) {
    if ((initial != null) && typeof initial !== 'string') {
      throw new Error('Initial data must be a string');
    }
    return initial || '';
  }
};

/** Insert s2 into s1 at pos. */
var strInject = function(s1, pos, s2) {
  return s1.slice(0, pos) + s2 + s1.slice(pos);
};

/** Check that an operation component is valid. Throws if its invalid. */
var checkValidComponent = function(c) {
  if (typeof c.p !== 'number')
    throw new Error('component missing position field');

  if ((typeof c.i === 'string') === (typeof c.d === 'string'))
    throw new Error('component needs an i or d field');

  if (c.p < 0)
    throw new Error('position cannot be negative');
};

/** Check that an operation is valid */
var checkValidOp = function(op) {
  for (var i = 0; i < op.length; i++) {
    checkValidComponent(op[i]);
  }
};

/** Apply op to snapshot */
text.apply = function(snapshot, op) {
  var deleted;

  checkValidOp(op);
  for (var i = 0; i < op.length; i++) {
    var component = op[i];
    if (component.i != null) {
      snapshot = strInject(snapshot, component.p, component.i);
    } else {
      deleted = snapshot.slice(component.p, component.p + component.d.length);
      if (component.d !== deleted)
        throw new Error("Delete component '" + component.d + "' does not match deleted text '" + deleted + "'");

      snapshot = snapshot.slice(0, component.p) + snapshot.slice(component.p + component.d.length);
    }
  }
  return snapshot;
};

/**
 * Append a component to the end of newOp. Exported for use by the random op
 * generator and the JSON0 type.
 */
var append = text._append = function(newOp, c) {
  if (c.i === '' || c.d === '') return;

  if (newOp.length === 0) {
    newOp.push(c);
  } else {
    var last = newOp[newOp.length - 1];

    if (last.i != null && c.i != null && last.p <= c.p && c.p <= last.p + last.i.length) {
      // Compose the insert into the previous insert
      newOp[newOp.length - 1] = {i:strInject(last.i, c.p - last.p, c.i), p:last.p};

    } else if (last.d != null && c.d != null && c.p <= last.p && last.p <= c.p + c.d.length) {
      // Compose the deletes together
      newOp[newOp.length - 1] = {d:strInject(c.d, last.p - c.p, last.d), p:c.p};

    } else {
      newOp.push(c);
    }
  }
};

/** Compose op1 and op2 together */
text.compose = function(op1, op2) {
  checkValidOp(op1);
  checkValidOp(op2);
  var newOp = op1.slice();
  for (var i = 0; i < op2.length; i++) {
    append(newOp, op2[i]);
  }
  return newOp;
};

/** Clean up an op */
text.normalize = function(op) {
  var newOp = [];

  // Normalize should allow ops which are a single (unwrapped) component:
  // {i:'asdf', p:23}.
  // There's no good way to test if something is an array:
  // http://perfectionkills.com/instanceof-considered-harmful-or-how-to-write-a-robust-isarray/
  // so this is probably the least bad solution.
  if (op.i != null || op.p != null) op = [op];

  for (var i = 0; i < op.length; i++) {
    var c = op[i];
    if (c.p == null) c.p = 0;

    append(newOp, c);
  }

  return newOp;
};

// This helper method transforms a position by an op component.
//
// If c is an insert, insertAfter specifies whether the transform
// is pushed after the insert (true) or before it (false).
//
// insertAfter is optional for deletes.
var transformPosition = function(pos, c, insertAfter) {
  // This will get collapsed into a giant ternary by uglify.
  if (c.i != null) {
    if (c.p < pos || (c.p === pos && insertAfter)) {
      return pos + c.i.length;
    } else {
      return pos;
    }
  } else {
    // I think this could also be written as: Math.min(c.p, Math.min(c.p -
    // otherC.p, otherC.d.length)) but I think its harder to read that way, and
    // it compiles using ternary operators anyway so its no slower written like
    // this.
    if (pos <= c.p) {
      return pos;
    } else if (pos <= c.p + c.d.length) {
      return c.p;
    } else {
      return pos - c.d.length;
    }
  }
};

// Helper method to transform a cursor position as a result of an op.
//
// Like transformPosition above, if c is an insert, insertAfter specifies
// whether the cursor position is pushed after an insert (true) or before it
// (false).
text.transformCursor = function(position, op, side) {
  var insertAfter = side === 'right';
  for (var i = 0; i < op.length; i++) {
    position = transformPosition(position, op[i], insertAfter);
  }

  return position;
};

// Transform an op component by another op component. Asymmetric.
// The result will be appended to destination.
//
// exported for use in JSON type
var transformComponent = text._tc = function(dest, c, otherC, side) {
  //var cIntersect, intersectEnd, intersectStart, newC, otherIntersect, s;

  checkValidComponent(c);
  checkValidComponent(otherC);

  if (c.i != null) {
    // Insert.
    append(dest, {i:c.i, p:transformPosition(c.p, otherC, side === 'right')});
  } else {
    // Delete
    if (otherC.i != null) {
      // Delete vs insert
      var s = c.d;
      if (c.p < otherC.p) {
        append(dest, {d:s.slice(0, otherC.p - c.p), p:c.p});
        s = s.slice(otherC.p - c.p);
      }
      if (s !== '')
        append(dest, {d: s, p: c.p + otherC.i.length});

    } else {
      // Delete vs delete
      if (c.p >= otherC.p + otherC.d.length)
        append(dest, {d: c.d, p: c.p - otherC.d.length});
      else if (c.p + c.d.length <= otherC.p)
        append(dest, c);
      else {
        // They overlap somewhere.
        var newC = {d: '', p: c.p};

        if (c.p < otherC.p)
          newC.d = c.d.slice(0, otherC.p - c.p);

        if (c.p + c.d.length > otherC.p + otherC.d.length)
          newC.d += c.d.slice(otherC.p + otherC.d.length - c.p);

        // This is entirely optional - I'm just checking the deleted text in
        // the two ops matches
        var intersectStart = Math.max(c.p, otherC.p);
        var intersectEnd = Math.min(c.p + c.d.length, otherC.p + otherC.d.length);
        var cIntersect = c.d.slice(intersectStart - c.p, intersectEnd - c.p);
        var otherIntersect = otherC.d.slice(intersectStart - otherC.p, intersectEnd - otherC.p);
        if (cIntersect !== otherIntersect)
          throw new Error('Delete ops delete different text in the same region of the document');

        if (newC.d !== '') {
          newC.p = transformPosition(newC.p, otherC);
          append(dest, newC);
        }
      }
    }
  }

  return dest;
};

var invertComponent = function(c) {
  return (c.i != null) ? {d:c.i, p:c.p} : {i:c.d, p:c.p};
};

// No need to use append for invert, because the components won't be able to
// cancel one another.
text.invert = function(op) {
  // Shallow copy & reverse that sucka.
  op = op.slice().reverse();
  for (var i = 0; i < op.length; i++) {
    op[i] = invertComponent(op[i]);
  }
  return op;
};

require('./bootstrapTransform')(text, transformComponent, checkValidOp, append);

},{"./bootstrapTransform":3}],7:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
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
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
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

},{}],8:[function(require,module,exports){
(function (global){
global.sharedb=require("../server/vendor/sharedb/lib/client")

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"../server/vendor/sharedb/lib/client":11}],9:[function(require,module,exports){
(function (process){
var Doc = require('./doc');
var Query = require('./query');
var emitter = require('../emitter');
var ShareDBError = require('../error');
var types = require('../types');
var util = require('../util');

/**
 * Handles communication with the sharejs server and provides queries and
 * documents.
 *
 * We create a connection with a socket object
 *   connection = new sharejs.Connection(sockset)
 * The socket may be any object handling the websocket protocol. See the
 * documentation of bindToSocket() for details. We then wait for the connection
 * to connect
 *   connection.on('connected', ...)
 * and are finally able to work with shared documents
 *   connection.get('food', 'steak') // Doc
 *
 * @param socket @see bindToSocket
 */
module.exports = Connection;
function Connection(socket) {
  emitter.EventEmitter.call(this);

  // Map of collection -> id -> doc object for created documents.
  // (created documents MUST BE UNIQUE)
  this.collections = {};

  // Each query is created with an id that the server uses when it sends us
  // info about the query (updates, etc)
  this.nextQueryId = 1;

  // Map from query ID -> query object.
  this.queries = {};

  // A unique message number for the given id
  this.seq = 1;

  // Equals agent.clientId on the server
  this.id = null;

  // This direct reference from connection to agent is not used internal to
  // ShareDB, but it is handy for server-side only user code that may cache
  // state on the agent and read it in middleware
  this.agent = null;

  this.debug = true;

  this.bindToSocket(socket);
}
emitter.mixin(Connection);


/**
 * Use socket to communicate with server
 *
 * Socket is an object that can handle the websocket protocol. This method
 * installs the onopen, onclose, onmessage and onerror handlers on the socket to
 * handle communication and sends messages by calling socket.send(message). The
 * sockets `readyState` property is used to determine the initaial state.
 *
 * @param socket Handles the websocket protocol
 * @param socket.readyState
 * @param socket.close
 * @param socket.send
 * @param socket.onopen
 * @param socket.onclose
 * @param socket.onmessage
 * @param socket.onerror
 */
Connection.prototype.bindToSocket = function(socket) {
  if (this.socket) {
    this.socket.close();
    this.socket.onmessage = null;
    this.socket.onopen = null;
    this.socket.onerror = null;
    this.socket.onclose = null;
  }

  this.socket = socket;

  // State of the connection. The correspoding events are emmited when this changes
  //
  // - 'connecting'   The connection is still being established, or we are still
  //                    waiting on the server to send us the initialization message
  // - 'connected'    The connection is open and we have connected to a server
  //                    and recieved the initialization message
  // - 'disconnected' Connection is closed, but it will reconnect automatically
  // - 'closed'       The connection was closed by the client, and will not reconnect
  // - 'stopped'      The connection was closed by the server, and will not reconnect
  this.state = (socket.readyState === 0 || socket.readyState === 1) ? 'connecting' : 'disconnected';

  // This is a helper variable the document uses to see whether we're
  // currently in a 'live' state. It is true if and only if we're connected
  this.canSend = false;

  var connection = this;

  socket.onmessage = function(event) {
    try {
      var data = (typeof event.data === 'string') ?
        JSON.parse(event.data) : event.data;
    } catch (err) {
      console.warn('Failed to parse message', event);
      return;
    }

    if (connection.debug) console.log('RECV', JSON.stringify(data));

    var request = {data: data};
    connection.emit('receive', request);
    if (!request.data) return;

    try {
      connection.handleMessage(request.data);
    } catch (err) {
      process.nextTick(function() {
        connection.emit('error', err);
      });
    }
  };

  socket.onopen = function() {
    connection._setState('connecting');
  };

  socket.onerror = function(err) {
    // This isn't the same as a regular error, because it will happen normally
    // from time to time. Your connection should probably automatically
    // reconnect anyway, but that should be triggered off onclose not onerror.
    // (onclose happens when onerror gets called anyway).
    connection.emit('connection error', err);
  };

  socket.onclose = function(reason) {
    // node-browserchannel reason values:
    //   'Closed' - The socket was manually closed by calling socket.close()
    //   'Stopped by server' - The server sent the stop message to tell the client not to try connecting
    //   'Request failed' - Server didn't respond to request (temporary, usually offline)
    //   'Unknown session ID' - Server session for client is missing (temporary, will immediately reestablish)

    if (reason === 'closed' || reason === 'Closed') {
      connection._setState('closed', reason);

    } else if (reason === 'stopped' || reason === 'Stopped by server') {
      connection._setState('stopped', reason);

    } else {
      connection._setState('disconnected', reason);
    }
  };
};

/**
 * @param {object} message
 * @param {String} message.a action
 */
Connection.prototype.handleMessage = function(message) {
  console.log(message)
  var err = null;
  if (message.error) {
    // wrap in Error object so can be passed through event emitters
    err = new Error(message.error.message);
    err.code = message.error.code;
    // Add the message data to the error object for more context
    err.data = message;
    delete message.error;
  }
  // Switch on the message action. Most messages are for documents and are
  // handled in the doc class.
  switch (message.a) {
    case 'init':
      // Client initialization packet
      if (message.protocol !== 1) {
        err = new ShareDBError(4019, 'Invalid protocol version');
        return this.emit('error', err);
      }
      if (types.map[message.type] !== types.defaultType) {
        err = new ShareDBError(4020, 'Invalid default type');
        return this.emit('error', err);
      }
      if (typeof message.id !== 'string') {
        err = new ShareDBError(4021, 'Invalid client id');
        return this.emit('error', err);
      }
      this.id = message.id;

      this._setState('connected');
      return;

    case 'qf':
      var query = this.queries[message.id];
      if (query) query._handleFetch(err, message.data, message.extra);
      return;
    case 'qs':
      var query = this.queries[message.id];
      if (query) query._handleSubscribe(err, message.data, message.extra);
      return;
    case 'qu':
      // Queries are removed immediately on calls to destroy, so we ignore
      // replies to query unsubscribes. Perhaps there should be a callback for
      // destroy, but this is currently unimplemented
      return;
    case 'q':
      // Query message. Pass this to the appropriate query object.
      var query = this.queries[message.id];
      if (!query) return;
      if (err) return query._handleError(err);
      if (message.diff) query._handleDiff(message.diff);
      if (message.hasOwnProperty('extra')) query._handleExtra(message.extra);
      return;

    case 'bf':
      return this._handleBulkMessage(message, '_handleFetch');
    case 'bs':
      return this._handleBulkMessage(message, '_handleSubscribe');
    case 'bu':
      return this._handleBulkMessage(message, '_handleUnsubscribe');

    case 'f':
      var doc = this.getExisting(message.c, message.d);
      if (doc) doc._handleFetch(err, message.data);
      return;
    case 's':
      var doc = this.getExisting(message.c, message.d);
      if (doc) doc._handleSubscribe(err, message.data);
      return;
    case 'u':
      var doc = this.getExisting(message.c, message.d);
      if (doc) doc._handleUnsubscribe(err);
      return;
    case 'op':
      var doc = this.getExisting(message.c, message.d);
      if (doc) doc._handleOp(err, message);
      return;

    default:
      console.warn('Ignorning unrecognized message', message);
  }
};

Connection.prototype._handleBulkMessage = function(message, method) {
  if (message.data) {
    for (var id in message.data) {
      var doc = this.getExisting(message.c, id);
      if (doc) doc[method](message.error, message.data[id]);
    }
  } else if (Array.isArray(message.b)) {
    for (var i = 0; i < message.b.length; i++) {
      var id = message.b[i];
      var doc = this.getExisting(message.c, id);
      if (doc) doc[method](message.error);
    }
  } else if (message.b) {
    for (var id in message.b) {
      var doc = this.getExisting(message.c, id);
      if (doc) doc[method](message.error);
    }
  } else {
    console.error('Invalid bulk message', message);
  }
};

Connection.prototype._reset = function() {
  this.seq = 1;
  this.id = null;
  this.agent = null;
};

// Set the connection's state. The connection is basically a state machine.
Connection.prototype._setState = function(newState, reason) {
  if (this.state === newState) return;

  // I made a state diagram. The only invalid transitions are getting to
  // 'connecting' from anywhere other than 'disconnected' and getting to
  // 'connected' from anywhere other than 'connecting'.
  if (
    (newState === 'connecting' && this.state !== 'disconnected' && this.state !== 'stopped' && this.state !== 'closed') ||
    (newState === 'connected' && this.state !== 'connecting')
  ) {
    var err = new ShareDBError(5007, 'Cannot transition directly from ' + this.state + ' to ' + newState);
    return this.emit('error', err);
  }

  this.state = newState;
  this.canSend = (newState === 'connected');

  if (newState === 'disconnected' || newState === 'stopped' || newState === 'closed') this._reset();

  // Group subscribes together to help server make more efficient calls
  this.startBulk();
  // Emit the event to all queries
  for (var id in this.queries) {
    var query = this.queries[id];
    query._onConnectionStateChanged();
  }
  // Emit the event to all documents
  for (var collection in this.collections) {
    var docs = this.collections[collection];
    for (var id in docs) {
      docs[id]._onConnectionStateChanged();
    }
  }
  this.endBulk();

  this.emit(newState, reason);
  this.emit('state', newState, reason);
};

Connection.prototype.startBulk = function() {
  if (!this.bulk) this.bulk = {};
};

Connection.prototype.endBulk = function() {
  if (this.bulk) {
    for (var collection in this.bulk) {
      var actions = this.bulk[collection];
      this._sendBulk('f', collection, actions.f);
      this._sendBulk('s', collection, actions.s);
      this._sendBulk('u', collection, actions.u);
    }
  }
  this.bulk = null;
};

Connection.prototype._sendBulk = function(action, collection, values) {
  if (!values) return;
  var ids = [];
  var versions = {};
  var versionsCount = 0;
  var versionId;
  for (var id in values) {
    var value = values[id];
    if (value == null) {
      ids.push(id);
    } else {
      versions[id] = value;
      versionId = id;
      versionsCount++;
    }
  }
  if (ids.length === 1) {
    var id = ids[0];
    this.send({a: action, c: collection, d: id});
  } else if (ids.length) {
    this.send({a: 'b' + action, c: collection, b: ids});
  }
  if (versionsCount === 1) {
    var version = versions[versionId];
    this.send({a: action, c: collection, d: versionId, v: version});
  } else if (versionsCount) {
    this.send({a: 'b' + action, c: collection, b: versions});
  }
};

Connection.prototype._sendAction = function(action, doc, version) {
  // Ensure the doc is registered so that it receives the reply message
  this._addDoc(doc);
  if (this.bulk) {
    // Bulk subscribe
    var actions = this.bulk[doc.collection] || (this.bulk[doc.collection] = {});
    var versions = actions[action] || (actions[action] = {});
    var isDuplicate = versions.hasOwnProperty(doc.id);
    versions[doc.id] = version;
    return isDuplicate;
  } else {
    // Send single doc subscribe message
    var message = {a: action, c: doc.collection, d: doc.id, v: version};
    this.send(message);
  }
};

Connection.prototype.sendFetch = function(doc) {
  return this._sendAction('f', doc, doc.version);
};

Connection.prototype.sendSubscribe = function(doc) {
  return this._sendAction('s', doc, doc.version);
};

Connection.prototype.sendUnsubscribe = function(doc) {
  return this._sendAction('u', doc);
};

Connection.prototype.sendOp = function(doc, op) {
  // Ensure the doc is registered so that it receives the reply message
  this._addDoc(doc);
  var message = {
    a: 'op',
    c: doc.collection,
    d: doc.id,
    v: doc.version,
    src: op.src,
    seq: op.seq
  };
  if (op.op) message.op = op.op;
  if (op.create) message.create = op.create;
  if (op.del) message.del = op.del;
  this.send(message);
};


/**
 * Sends a message down the socket
 */
Connection.prototype.send = function(message) {
  if (this.debug) console.log('SEND', JSON.stringify(message));

  this.emit('send', message);
  this.socket.send(JSON.stringify(message));
};


/**
 * Closes the socket and emits 'closed'
 */
Connection.prototype.close = function() {
  this.socket.close();
};

Connection.prototype.getExisting = function(collection, id) {
  if (this.collections[collection]) return this.collections[collection][id];
};


/**
 * Get or create a document.
 *
 * @param collection
 * @param id
 * @return {Doc}
 */
Connection.prototype.get = function(collection, id) {
  var docs = this.collections[collection] ||
    (this.collections[collection] = {});

  var doc = docs[id];
  if (!doc) {
    doc = docs[id] = new Doc(this, collection, id);
    this.emit('doc', doc);
  }

  return doc;
};


/**
 * Remove document from this.collections
 *
 * @private
 */
Connection.prototype._destroyDoc = function(doc) {
  var docs = this.collections[doc.collection];
  if (!docs) return;

  delete docs[doc.id];

  // Delete the collection container if its empty. This could be a source of
  // memory leaks if you slowly make a billion collections, which you probably
  // won't do anyway, but whatever.
  if (!util.hasKeys(docs)) {
    delete this.collections[doc.collection];
  }
};

Connection.prototype._addDoc = function(doc) {
  var docs = this.collections[doc.collection];
  if (!docs) {
    docs = this.collections[doc.collection] = {};
  }
  if (docs[doc.id] !== doc) {
    docs[doc.id] = doc;
  }
};

// Helper for createFetchQuery and createSubscribeQuery, below.
Connection.prototype._createQuery = function(action, collection, q, options, callback) {
  var id = this.nextQueryId++;
  var query = new Query(action, this, id, collection, q, options, callback);
  this.queries[id] = query;
  query.send();
  return query;
};

// Internal function. Use query.destroy() to remove queries.
Connection.prototype._destroyQuery = function(query) {
  delete this.queries[query.id];
};

// The query options object can contain the following fields:
//
// db: Name of the db for the query. You can attach extraDbs to ShareDB and
//   pick which one the query should hit using this parameter.

// Create a fetch query. Fetch queries are only issued once, returning the
// results directly into the callback.
//
// The callback should have the signature function(error, results, extra)
// where results is a list of Doc objects.
Connection.prototype.createFetchQuery = function(collection, q, options, callback) {
  return this._createQuery('qf', collection, q, options, callback);
};

// Create a subscribe query. Subscribe queries return with the initial data
// through the callback, then update themselves whenever the query result set
// changes via their own event emitter.
//
// If present, the callback should have the signature function(error, results, extra)
// where results is a list of Doc objects.
Connection.prototype.createSubscribeQuery = function(collection, q, options, callback) {
  return this._createQuery('qs', collection, q, options, callback);
};

Connection.prototype.hasPending = function() {
  return !!(
    this._firstDoc(hasPending) ||
    this._firstQuery(hasPending)
  );
};
function hasPending(object) {
  return object.hasPending();
}

Connection.prototype.hasWritePending = function() {
  return !!this._firstDoc(hasWritePending);
};
function hasWritePending(object) {
  return object.hasWritePending();
}

Connection.prototype.whenNothingPending = function(callback) {
  var doc = this._firstDoc(hasPending);
  if (doc) {
    // If a document is found with a pending operation, wait for it to emit
    // that nothing is pending anymore, and then recheck all documents again.
    // We have to recheck all documents, just in case another mutation has
    // been made in the meantime as a result of an event callback
    doc.once('nothing pending', this._nothingPendingRetry(callback));
    return;
  }
  var query = this._firstQuery(hasPending);
  if (query) {
    query.once('ready', this._nothingPendingRetry(callback));
    return;
  }
  // Call back when no pending operations
  process.nextTick(callback);
};
Connection.prototype._nothingPendingRetry = function(callback) {
  var connection = this;
  return function() {
    process.nextTick(function() {
      connection.whenNothingPending(callback);
    });
  };
};

Connection.prototype._firstDoc = function(fn) {
  for (var collection in this.collections) {
    var docs = this.collections[collection];
    for (var id in docs) {
      var doc = docs[id];
      if (fn(doc)) {
        return doc;
      }
    }
  }
};

Connection.prototype._firstQuery = function(fn) {
  for (var id in this.queries) {
    var query = this.queries[id];
    if (fn(query)) {
      return query;
    }
  }
};

}).call(this,require('_process'))

},{"../emitter":13,"../error":14,"../types":15,"../util":16,"./doc":10,"./query":12,"_process":7}],10:[function(require,module,exports){
(function (process){
var emitter = require('../emitter');
var ShareDBError = require('../error');
var types = require('../types');

/**
 * A Doc is a client's view on a sharejs document.
 *
 * It is is uniquely identified by its `id` and `collection`.  Documents
 * should not be created directly. Create them with connection.get()
 *
 *
 * Subscriptions
 * -------------
 *
 * We can subscribe a document to stay in sync with the server.
 *   doc.subscribe(function(error) {
 *     doc.subscribed // = true
 *   })
 * The server now sends us all changes concerning this document and these are
 * applied to our data. If the subscription was successful the initial
 * data and version sent by the server are loaded into the document.
 *
 * To stop listening to the changes we call `doc.unsubscribe()`.
 *
 * If we just want to load the data but not stay up-to-date, we call
 *   doc.fetch(function(error) {
 *     doc.data // sent by server
 *   })
 *
 *
 * Events
 * ------
 *
 * You can use doc.on(eventName, callback) to subscribe to the following events:
 * - `before op (op, source)` Fired before a partial operation is applied to the data.
 *   It may be used to read the old data just before applying an operation
 * - `op (op, source)` Fired after every partial operation with this operation as the
 *   first argument
 * - `create (source)` The document was created. That means its type was
 *   set and it has some initial data.
 * - `del (data, source)` Fired after the document is deleted, that is
 *   the data is null. It is passed the data before delteion as an
 *   arguments
 * - `load ()` Fired when a new snapshot is ingested from a fetch, subscribe, or query
 */

module.exports = Doc;
function Doc(connection, collection, id) {
  emitter.EventEmitter.call(this);

  this.connection = connection;

  this.collection = collection;
  this.id = id;

  this.version = null;
  this.type = null;
  this.data = undefined;

  // Array of callbacks or nulls as placeholders
  this.inflightFetch = [];
  this.inflightSubscribe = [];
  this.inflightUnsubscribe = [];
  this.pendingFetch = [];

  // Whether we think we are subscribed on the server. Synchronously set to
  // false on calls to unsubscribe and disconnect. Should never be true when
  // this.wantSubscribe is false
  this.subscribed = false;
  // Whether to re-establish the subscription on reconnect
  this.wantSubscribe = false;

  // The op that is currently roundtripping to the server, or null.
  //
  // When the connection reconnects, the inflight op is resubmitted.
  //
  // This has the same format as an entry in pendingOps
  this.inflightOp = null;

  // All ops that are waiting for the server to acknowledge this.inflightOp
  // This used to just be a single operation, but creates & deletes can't be
  // composed with regular operations.
  //
  // This is a list of {[create:{...}], [del:true], [op:...], callbacks:[...]}
  this.pendingOps = [];

  // The OT type of this document. An uncreated document has type `null`
  this.type = null;

  // The applyStack enables us to track any ops submitted while we are
  // applying an op incrementally. This value is an array when we are
  // performing an incremental apply and null otherwise. When it is an array,
  // all submitted ops should be pushed onto it. The `_otApply` method will
  // reset it back to null when all incremental apply loops are complete.
  this.applyStack = null;

  // Disable the default behavior of composing submitted ops. This is read at
  // the time of op submit, so it may be toggled on before submitting a
  // specifc op and toggled off afterward
  this.preventCompose = false;
}
emitter.mixin(Doc);

Doc.prototype.destroy = function(callback) {
  var doc = this;
  doc.whenNothingPending(function() {
    doc.connection._destroyDoc(doc);
    if (doc.wantSubscribe) {
      return doc.unsubscribe(callback);
    }
    if (callback) callback();
  });
};


// ****** Manipulating the document data, version and type.

// Set the document's type, and associated properties. Most of the logic in
// this function exists to update the document based on any added & removed API
// methods.
//
// @param newType OT type provided by the ottypes library or its name or uri
Doc.prototype._setType = function(newType) {
  if (typeof newType === 'string') {
    newType = types.map[newType];
  }

  if (newType) {
    this.type = newType;

  } else if (newType === null) {
    this.type = newType;
    // If we removed the type from the object, also remove its data
    this.data = undefined;

  } else {
    var err = new ShareDBError(4008, 'Missing type ' + newType);
    return this.emit('error', err);
  }
};

// Ingest snapshot data. This data must include a version, snapshot and type.
// This is used both to ingest data that was exported with a webpage and data
// that was received from the server during a fetch.
//
// @param snapshot.v    version
// @param snapshot.data
// @param snapshot.type
// @param callback
Doc.prototype.ingestSnapshot = function(snapshot, callback) {
  if (!snapshot) return callback && callback();

  if (typeof snapshot.v !== 'number') {
    var err = new ShareDBError(5008, 'Missing version in ingested snapshot. ' + this.collection + '.' + this.id);
    if (callback) return callback(err);
    return this.emit('error', err);
  }

  // If the doc is already created or there are ops pending, we cannot use the
  // ingested snapshot and need ops in order to update the document
  if (this.type || this.hasWritePending()) {
    // The version should only be null on a created document when it was
    // created locally without fetching
    if (this.version == null) {
      if (this.hasWritePending()) {
        // If we have pending ops and we get a snapshot for a locally created
        // document, we have to wait for the pending ops to complete, because
        // we don't know what version to fetch ops from. It is possible that
        // the snapshot came from our local op, but it is also possible that
        // the doc was created remotely (which would conflict and be an error)
        return callback && this.once('no write pending', callback);
      }
      // Otherwise, we've encounted an error state
      var err = new ShareDBError(5009, 'Cannot ingest snapshot in doc with null version. ' + this.collection + '.' + this.id);
      if (callback) return callback(err);
      return this.emit('error', err);
    }
    // If we got a snapshot for a version further along than the document is
    // currently, issue a fetch to get the latest ops and catch us up
    if (snapshot.v > this.version) return this.fetch(callback);
    return callback && callback();
  }

  // Ignore the snapshot if we are already at a newer version. Under no
  // circumstance should we ever set the current version backward
  if (this.version > snapshot.v) return callback && callback();

  this.version = snapshot.v;
  var type = (snapshot.type === undefined) ? types.defaultType : snapshot.type;
  this._setType(type);
  this.data = (this.type && this.type.deserialize) ?
    this.type.deserialize(snapshot.data) :
    snapshot.data;
  this.emit('load');
  callback && callback();
};

Doc.prototype.whenNothingPending = function(callback) {
  if (this.hasPending()) {
    this.once('nothing pending', callback);
    return;
  }
  callback();
};

Doc.prototype.hasPending = function() {
  return !!(
    this.inflightOp ||
    this.pendingOps.length ||
    this.inflightFetch.length ||
    this.inflightSubscribe.length ||
    this.inflightUnsubscribe.length ||
    this.pendingFetch.length
  );
};

Doc.prototype.hasWritePending = function() {
  return !!(this.inflightOp || this.pendingOps.length);
};

Doc.prototype._emitNothingPending = function() {
  if (this.hasWritePending()) return;
  this.emit('no write pending');
  if (this.hasPending()) return;
  this.emit('nothing pending');
};

// **** Helpers for network messages

Doc.prototype._emitResponseError = function(err, callback) {
  if (callback) {
    callback(err);
    this._emitNothingPending();
    return;
  }
  this._emitNothingPending();
  this.emit('error', err);
};

Doc.prototype._handleFetch = function(err, snapshot) {
  var callback = this.inflightFetch.shift();
  if (err) return this._emitResponseError(err, callback);
  this.ingestSnapshot(snapshot, callback);
  this._emitNothingPending();
};

Doc.prototype._handleSubscribe = function(err, snapshot) {
  var callback = this.inflightSubscribe.shift();
  if (err) return this._emitResponseError(err, callback);
  // Indicate we are subscribed only if the client still wants to be. In the
  // time since calling subscribe and receiving a response from the server,
  // unsubscribe could have been called and we might already be unsubscribed
  // but not have received the response. Also, because requests from the
  // client are not serialized and may take different async time to process,
  // it is possible that we could hear responses back in a different order
  // from the order originally sent
  if (this.wantSubscribe) this.subscribed = true;
  this.ingestSnapshot(snapshot, callback);
  this._emitNothingPending();
};

Doc.prototype._handleUnsubscribe = function(err) {
  var callback = this.inflightUnsubscribe.shift();
  if (err) return this._emitResponseError(err, callback);
  if (callback) callback();
  this._emitNothingPending();
};

Doc.prototype._handleOp = function(err, message) {
  if (err) {
    if (this.inflightOp) {
      // The server has rejected submission of the current operation. If we get
      // an error code 4002 "Op submit rejected", this was done intentionally
      // and we should roll back but not return an error to the user.
      if (err.code === 4002) err = null;
      return this._rollback(err);
    }
    return this.emit('error', err);
  }

  if (this.inflightOp &&
      message.src === this.inflightOp.src &&
      message.seq === this.inflightOp.seq) {
    // The op has already been applied locally. Just update the version
    // and pending state appropriately
    this._opAcknowledged(message);
    return;
  }

  if (this.version == null || message.v > this.version) {
    // This will happen in normal operation if we become subscribed to a
    // new document via a query. It can also happen if we get an op for
    // a future version beyond the version we are expecting next. This
    // could happen if the server doesn't publish an op for whatever reason
    // or because of a race condition. In any case, we can send a fetch
    // command to catch back up.
    //
    // Fetch only sends a new fetch command if no fetches are inflight, which
    // will act as a natural debouncing so we don't send multiple fetch
    // requests for many ops received at once.
    this.fetch();
    return;
  }

  if (message.v < this.version) {
    // We can safely ignore the old (duplicate) operation.
    return;
  }

  if (this.inflightOp) {
    var transformErr = transformX(this.inflightOp, message);
    if (transformErr) return this._hardRollback(transformErr);
  }

  for (var i = 0; i < this.pendingOps.length; i++) {
    var transformErr = transformX(this.pendingOps[i], message);
    if (transformErr) return this._hardRollback(transformErr);
  }

  this.version++;
  this._otApply(message, false);
  return;
};

// Called whenever (you guessed it!) the connection state changes. This will
// happen when we get disconnected & reconnect.
Doc.prototype._onConnectionStateChanged = function() {
  if (this.connection.canSend) {
    this.flush();
    this._resubscribe();
  } else {
    if (this.inflightOp) {
      this.pendingOps.unshift(this.inflightOp);
      this.inflightOp = null;
    }
    this.subscribed = false;
    if (this.inflightFetch.length || this.inflightSubscribe.length) {
      this.pendingFetch = this.pendingFetch.concat(this.inflightFetch, this.inflightSubscribe);
      this.inflightFetch.length = 0;
      this.inflightSubscribe.length = 0;
    }
    if (this.inflightUnsubscribe.length) {
      var callbacks = this.inflightUnsubscribe;
      this.inflightUnsubscribe = [];
      callEach(callbacks);
    }
  }
};

Doc.prototype._resubscribe = function() {
  var callbacks = this.pendingFetch;
  this.pendingFetch = [];

  if (this.wantSubscribe) {
    if (callbacks.length) {
      this.subscribe(function(err) {
        callEach(callbacks, err);
      });
      return;
    }
    this.subscribe();
    return;
  }

  if (callbacks.length) {
    this.fetch(function(err) {
      callEach(callbacks, err);
    });
  }
};

// Request the current document snapshot or ops that bring us up to date
Doc.prototype.fetch = function(callback) {
  if (this.connection.canSend) {
    var isDuplicate = this.connection.sendFetch(this);
    pushActionCallback(this.inflightFetch, isDuplicate, callback);
    return;
  }
  this.pendingFetch.push(callback);
};

// Fetch the initial document and keep receiving updates
Doc.prototype.subscribe = function(callback) {
  this.wantSubscribe = true;
  if (this.connection.canSend) {
    var isDuplicate = this.connection.sendSubscribe(this);
    pushActionCallback(this.inflightSubscribe, isDuplicate, callback);
    return;
  }
  this.pendingFetch.push(callback);
};

// Unsubscribe. The data will stay around in local memory, but we'll stop
// receiving updates
Doc.prototype.unsubscribe = function(callback) {
  this.wantSubscribe = false;
  // The subscribed state should be conservative in indicating when we are
  // subscribed on the server. We'll actually be unsubscribed some time
  // between sending the message and hearing back, but we cannot know exactly
  // when. Thus, immediately mark us as not subscribed
  this.subscribed = false;
  if (this.connection.canSend) {
    var isDuplicate = this.connection.sendUnsubscribe(this);
    pushActionCallback(this.inflightUnsubscribe, isDuplicate, callback);
    return;
  }
  if (callback) process.nextTick(callback);
};

function pushActionCallback(inflight, isDuplicate, callback) {
  if (isDuplicate) {
    var lastCallback = inflight.pop();
    inflight.push(function(err) {
      lastCallback && lastCallback(err);
      callback && callback(err);
    });
  } else {
    inflight.push(callback);
  }
}


// Operations //

// Send the next pending op to the server, if we can.
//
// Only one operation can be in-flight at a time. If an operation is already on
// its way, or we're not currently connected, this method does nothing.
Doc.prototype.flush = function() {
  // Ignore if we can't send or we are already sending an op
  if (!this.connection.canSend || this.inflightOp) return;

  // Send first pending op unless paused
  if (!this.paused && this.pendingOps.length) {
    this._sendOp();
  }
};

// Helper function to set op to contain a no-op.
function setNoOp(op) {
  delete op.op;
  delete op.create;
  delete op.del;
}

// Transform server op data by a client op, and vice versa. Ops are edited in place.
function transformX(client, server) {
  // Order of statements in this function matters. Be especially careful if
  // refactoring this function

  // A client delete op should dominate if both the server and the client
  // delete the document. Thus, any ops following the client delete (such as a
  // subsequent create) will be maintained, since the server op is transformed
  // to a no-op
  if (client.del) return setNoOp(server);

  if (server.del) {
    return new ShareDBError(4017, 'Document was deleted');
  }
  if (server.create) {
    return new ShareDBError(4018, 'Document alredy created');
  }

  // Ignore no-op coming from server
  if (!server.op) return;

  // I believe that this should not occur, but check just in case
  if (client.create) {
    return new ShareDBError(4018, 'Document already created');
  }

  // They both edited the document. This is the normal case for this function -
  // as in, most of the time we'll end up down here.
  //
  // You should be wondering why I'm using client.type instead of this.type.
  // The reason is, if we get ops at an old version of the document, this.type
  // might be undefined or a totally different type. By pinning the type to the
  // op data, we make sure the right type has its transform function called.
  if (client.type.transformX) {
    var result = client.type.transformX(client.op, server.op);
    client.op = result[0];
    server.op = result[1];
  } else {
    var clientOp = client.type.transform(client.op, server.op, 'left');
    var serverOp = client.type.transform(server.op, client.op, 'right');
    client.op = clientOp;
    server.op = serverOp;
  }
};

/**
 * Applies the operation to the snapshot
 *
 * If the operation is create or delete it emits `create` or `del`. Then the
 * operation is applied to the snapshot and `op` and `after op` are emitted.
 * If the type supports incremental updates and `this.incremental` is true we
 * fire `op` after every small operation.
 *
 * This is the only function to fire the above mentioned events.
 *
 * @private
 */
Doc.prototype._otApply = function(op, source) {
  if (op.op) {
    if (!this.type) {
      var err = new ShareDBError(4015, 'Cannot apply op to uncreated document. ' + this.collection + '.' + this.id);
      return this.emit('error', err);
    }

    // Iteratively apply multi-component remote operations and rollback ops
    // (source === false) for the default JSON0 OT type. It could use
    // type.shatter(), but since this code is so specific to use cases for the
    // JSON0 type and ShareDB explicitly bundles the default type, we might as
    // well write it this way and save needing to iterate through the op
    // components twice.
    //
    // Ideally, we would not need this extra complexity. However, it is
    // helpful for implementing bindings that update DOM nodes and other
    // stateful objects by translating op events directly into corresponding
    // mutations. Such bindings are most easily written as responding to
    // individual op components one at a time in order, and it is important
    // that the snapshot only include updates from the particular op component
    // at the time of emission. Eliminating this would require rethinking how
    // such external bindings are implemented.
    if (!source && this.type === types.defaultType && op.op.length > 1) {
      if (!this.applyStack) this.applyStack = [];
      var stackLength = this.applyStack.length;
      for (var i = 0; i < op.op.length; i++) {
        var component = op.op[i];
        var componentOp = {op: [component]};
        // Transform componentOp against any ops that have been submitted
        // sychronously inside of an op event handler since we began apply of
        // our operation
        for (var j = stackLength; j < this.applyStack.length; j++) {
          var transformErr = transformX(this.applyStack[j], componentOp);
          if (transformErr) return this._hardRollback(transformErr);
        }
        // Apply the individual op component
        this.emit('before op', componentOp.op, source);
        this.data = this.type.apply(this.data, componentOp.op);
        this.emit('op', componentOp.op, source);
      }
      // Pop whatever was submitted since we started applying this op
      this._popApplyStack(stackLength);
      return;
    }

    // The 'before op' event enables clients to pull any necessary data out of
    // the snapshot before it gets changed
    this.emit('before op', op.op, source);
    // Apply the operation to the local data, mutating it in place
    this.data = this.type.apply(this.data, op.op);
    // Emit an 'op' event once the local data includes the changes from the
    // op. For locally submitted ops, this will be synchronously with
    // submission and before the server or other clients have received the op.
    // For ops from other clients, this will be after the op has been
    // committed to the database and published
    this.emit('op', op.op, source);
    return;
  }

  if (op.create) {
    this._setType(op.create.type);
    this.data = (this.type.deserialize) ?
      (this.type.createDeserialized) ?
        this.type.createDeserialized(op.create.data) :
        this.type.deserialize(this.type.create(op.create.data)) :
      this.type.create(op.create.data);
    this.emit('create', source);
    return;
  }

  if (op.del) {
    var oldData = this.data;
    this._setType(null);
    this.emit('del', oldData, source);
    return;
  }
};


// ***** Sending operations

// Actually send op to the server.
Doc.prototype._sendOp = function() {
  // Wait until we have a src id from the server
  var src = this.connection.id;
  if (!src) return;

  // When there is no inflightOp, send the first item in pendingOps. If
  // there is inflightOp, try sending it again
  if (!this.inflightOp) {
    // Send first pending op
    this.inflightOp = this.pendingOps.shift();
  }
  var op = this.inflightOp;
  if (!op) {
    var err = new ShareDBError(5010, 'No op to send on call to _sendOp');
    return this.emit('error', err);
  }

  // Track data for retrying ops
  op.sentAt = Date.now();
  op.retries = (op.retries == null) ? 0 : op.retries + 1;

  // The src + seq number is a unique ID representing this operation. This tuple
  // is used on the server to detect when ops have been sent multiple times and
  // on the client to match acknowledgement of an op back to the inflightOp.
  // Note that the src could be different from this.connection.id after a
  // reconnect, since an op may still be pending after the reconnection and
  // this.connection.id will change. In case an op is sent multiple times, we
  // also need to be careful not to override the original seq value.
  if (op.seq == null) op.seq = this.connection.seq++;

  this.connection.sendOp(this, op);

  // src isn't needed on the first try, since the server session will have the
  // same id, but it must be set on the inflightOp in case it is sent again
  // after a reconnect and the connection's id has changed by then
  if (op.src == null) op.src = src;
};


// Queues the operation for submission to the server and applies it locally.
//
// Internal method called to do the actual work for submit(), create() and del().
// @private
//
// @param op
// @param [op.op]
// @param [op.del]
// @param [op.create]
// @param [callback] called when operation is submitted
Doc.prototype._submit = function(op, source, callback) {
  // Locally submitted ops must always have a truthy source
  if (!source) source = true;

  // The op contains either op, create, delete, or none of the above (a no-op).
  if (op.op) {
    if (!this.type) {
      var err = new ShareDBError(4015, 'Cannot submit op. Document has not been created. ' + this.collection + '.' + this.id);
      if (callback) return callback(err);
      return this.emit('error', err);
    }
    // Try to normalize the op. This removes trailing skip:0's and things like that.
    if (this.type.normalize) op.op = this.type.normalize(op.op);
  }

  this._pushOp(op, callback);
  this._otApply(op, source);

  // The call to flush is delayed so if submit() is called multiple times
  // synchronously, all the ops are combined before being sent to the server.
  var doc = this;
  process.nextTick(function() {
    doc.flush();
  });
};

Doc.prototype._pushOp = function(op, callback) {
  if (this.applyStack) {
    // If we are in the process of incrementally applying an operation, don't
    // compose the op and push it onto the applyStack so it can be transformed
    // against other components from the op or ops being applied
    this.applyStack.push(op);
  } else {
    // If the type supports composes, try to compose the operation onto the
    // end of the last pending operation.
    var composed = this._tryCompose(op);
    if (composed) {
      composed.callbacks.push(callback);
      return;
    }
  }
  // Push on to the pendingOps queue of ops to submit if we didn't compose
  op.type = this.type;
  op.callbacks = [callback];
  this.pendingOps.push(op);
};

Doc.prototype._popApplyStack = function(to) {
  if (to > 0) {
    this.applyStack.length = to;
    return;
  }
  // Once we have completed the outermost apply loop, reset to null and no
  // longer add ops to the applyStack as they are submitted
  var op = this.applyStack[0];
  this.applyStack = null;
  if (!op) return;
  // Compose the ops added since the beginning of the apply stack, since we
  // had to skip compose when they were originally pushed
  var i = this.pendingOps.indexOf(op);
  if (i === -1) return;
  var ops = this.pendingOps.splice(i);
  for (var i = 0; i < ops.length; i++) {
    var op = ops[i];
    var composed = this._tryCompose(op);
    if (composed) {
      composed.callbacks = composed.callbacks.concat(op.callbacks);
    } else {
      this.pendingOps.push(op);
    }
  }
};

// Try to compose a submitted op into the last pending op. Returns the
// composed op if it succeeds, undefined otherwise
Doc.prototype._tryCompose = function(op) {
  if (this.preventCompose) return;

  // We can only compose into the last pending op. Inflight ops have already
  // been sent to the server, so we can't modify them
  var last = this.pendingOps[this.pendingOps.length - 1];
  if (!last) return;

  // Compose an op into a create by applying it. This effectively makes the op
  // invisible, as if the document were created including the op originally
  if (last.create && op.op) {
    last.create.data = this.type.apply(last.create.data, op.op);
    return last;
  }

  // Compose two ops into a single op if supported by the type. Types that
  // support compose must be able to compose any two ops together
  if (last.op && op.op && this.type.compose) {
    last.op = this.type.compose(last.op, op.op);
    return last;
  }
};

// *** Client OT entrypoints.

// Submit an operation to the document.
//
// @param operation handled by the OT type
// @param options  {source: ...}
// @param [callback] called after operation submitted
//
// @fires before op, op, after op
Doc.prototype.submitOp = function(component, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  var op = {op: component};
  var source = options && options.source;
  this._submit(op, source, callback);
};

// Create the document, which in ShareJS semantics means to set its type. Every
// object implicitly exists in the database but has no data and no type. Create
// sets the type of the object and can optionally set some initial data on the
// object, depending on the type.
//
// @param data  initial
// @param type  OT type
// @param options  {source: ...}
// @param callback  called when operation submitted
Doc.prototype.create = function(data, type, options, callback) {
  if (typeof type === 'function') {
    callback = type;
    options = null;
    type = null;
  } else if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (!type) {
    type = types.defaultType.uri;
  }
  if (this.type) {
    var err = new ShareDBError(4016, 'Document already exists');
    if (callback) return callback(err);
    return this.emit('error', err);
  }
  var op = {create: {type: type, data: data}};
  var source = options && options.source;
  this._submit(op, source, callback);
};

// Delete the document. This creates and submits a delete operation to the
// server. Deleting resets the object's type to null and deletes its data. The
// document still exists, and still has the version it used to have before you
// deleted it (well, old version +1).
//
// @param options  {source: ...}
// @param callback  called when operation submitted
Doc.prototype.del = function(options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options = null;
  }
  if (!this.type) {
    var err = new ShareDBError(4015, 'Document does not exist');
    if (callback) return callback(err);
    return this.emit('error', err);
  }
  var op = {del: true};
  var source = options && options.source;
  this._submit(op, source, callback);
};


// Stops the document from sending any operations to the server.
Doc.prototype.pause = function() {
  this.paused = true;
};

// Continue sending operations to the server
Doc.prototype.resume = function() {
  this.paused = false;
  this.flush();
};


// *** Receiving operations

// This is called when the server acknowledges an operation from the client.
Doc.prototype._opAcknowledged = function(message) {
  if (this.inflightOp.create) {
    this.version = message.v;

  } else if (message.v !== this.version) {
    // We should already be at the same version, because the server should
    // have sent all the ops that have happened before acknowledging our op
    console.warn('Invalid version from server. Expected: ' + this.version + ' Received: ' + message.v, message);

    // Fetching should get us back to a working document state
    return this.fetch();
  }

  // The op was committed successfully. Increment the version number
  this.version++;

  this._clearInflightOp();
};

Doc.prototype._rollback = function(err) {
  // The server has rejected submission of the current operation. Invert by
  // just the inflight op if possible. If not possible to invert, cancel all
  // pending ops and fetch the latest from the server to get us back into a
  // working state, then call back
  var op = this.inflightOp;

  if (op.op && op.type.invert) {
    op.op = op.type.invert(op.op);

    // Transform the undo operation by any pending ops.
    for (var i = 0; i < this.pendingOps.length; i++) {
      var transformErr = transformX(this.pendingOps[i], op);
      if (transformErr) return this._hardRollback(transformErr);
    }

    // ... and apply it locally, reverting the changes.
    //
    // This operation is applied to look like it comes from a remote source.
    // I'm still not 100% sure about this functionality, because its really a
    // local op. Basically, the problem is that if the client's op is rejected
    // by the server, the editor window should update to reflect the undo.
    this._otApply(op, false);

    this._clearInflightOp(err);
    return;
  }

  this._hardRollback(err);
};

Doc.prototype._hardRollback = function(err) {
  // Cancel all pending ops and reset if we can't invert
  var op = this.inflightOp;
  var pending = this.pendingOps;
  this._setType(null);
  this.version = null;
  this.inflightOp = null;
  this.pendingOps = [];

  // Fetch the latest from the server to get us back into a working state
  var doc = this;
  this.fetch(function() {
    var called = op && callEach(op.callbacks, err);
    for (var i = 0; i < pending.length; i++) {
      callEach(pending[i].callbacks, err);
    }
    if (err && !called) return doc.emit('error', err);
  });
};

Doc.prototype._clearInflightOp = function(err) {
  var called = callEach(this.inflightOp.callbacks, err);

  this.inflightOp = null;
  this.flush();
  this._emitNothingPending();

  if (err && !called) return this.emit('error', err);
};

function callEach(callbacks, err) {
  var called = false;
  for (var i = 0; i < callbacks.length; i++) {
    var callback = callbacks[i];
    if (callback) {
      callback(err);
      called = true;
    }
  }
  return called;
}

}).call(this,require('_process'))

},{"../emitter":13,"../error":14,"../types":15,"_process":7}],11:[function(require,module,exports){
exports.Connection = require('./connection');
exports.Doc = require('./doc');
exports.Error = require('../error');
exports.Query = require('./query');
exports.types = require('../types');

},{"../error":14,"../types":15,"./connection":9,"./doc":10,"./query":12}],12:[function(require,module,exports){
(function (process){
var emitter = require('../emitter');

// Queries are live requests to the database for particular sets of fields.
//
// The server actively tells the client when there's new data that matches
// a set of conditions.
module.exports = Query;
function Query(action, connection, id, collection, query, options, callback) {
  emitter.EventEmitter.call(this);

  // 'qf' or 'qs'
  this.action = action;

  this.connection = connection;
  this.id = id;
  this.collection = collection;

  // The query itself. For mongo, this should look something like {"data.x":5}
  this.query = query;

  // A list of resulting documents. These are actual documents, complete with
  // data and all the rest. It is possible to pass in an initial results set,
  // so that a query can be serialized and then re-established
  this.results = null;
  if (options && options.results) {
    this.results = options.results;
    delete options.results;
  }
  this.extra = undefined;

  // Options to pass through with the query
  this.options = options;

  this.callback = callback;
  this.ready = false;
  this.sent = false;
}
emitter.mixin(Query);

Query.prototype.hasPending = function() {
  return !this.ready;
};

// Helper for subscribe & fetch, since they share the same message format.
//
// This function actually issues the query.
Query.prototype.send = function() {
  if (!this.connection.canSend) return;

  var message = {
    a: this.action,
    id: this.id,
    c: this.collection,
    q: this.query
  };
  if (this.options) {
    message.o = this.options;
  }
  if (this.results) {
    // Collect the version of all the documents in the current result set so we
    // don't need to be sent their snapshots again.
    var results = [];
    for (var i = 0; i < this.results.length; i++) {
      var doc = this.results[i];
      results.push([doc.id, doc.version]);
    }
    message.r = results;
  }

  this.connection.send(message);
  this.sent = true;
};

// Destroy the query object. Any subsequent messages for the query will be
// ignored by the connection.
Query.prototype.destroy = function(callback) {
  if (this.connection.canSend && this.action === 'qs') {
    this.connection.send({a: 'qu', id: this.id});
  }
  this.connection._destroyQuery(this);
  // There is a callback for consistency, but we don't actually wait for the
  // server's unsubscribe message currently
  if (callback) process.nextTick(callback);
};

Query.prototype._onConnectionStateChanged = function() {
  if (this.connection.canSend && !this.sent) {
    this.send();
  } else {
    this.sent = false;
  }
};

Query.prototype._handleFetch = function(err, data, extra) {
  // Once a fetch query gets its data, it is destroyed.
  this.connection._destroyQuery(this);
  this._handleResponse(err, data, extra);
};

Query.prototype._handleSubscribe = function(err, data, extra) {
  this._handleResponse(err, data, extra);
};

Query.prototype._handleResponse = function(err, data, extra) {
  var callback = this.callback;
  this.callback = null;
  if (err) return this._finishResponse(err, callback);
  if (!data) return this._finishResponse(null, callback);

  var query = this;
  var wait = 1;
  var finish = function(err) {
    if (err) return query._finishResponse(err, callback);
    if (--wait) return;
    query._finishResponse(null, callback);
  };

  if (Array.isArray(data)) {
    wait += data.length;
    this.results = this._ingestSnapshots(data, finish);
    this.extra = extra;

  } else {
    for (var id in data) {
      wait++;
      var snapshot = data[id];
      var doc = this.connection.get(snapshot.c || this.collection, id);
      doc.ingestSnapshot(snapshot, finish);
    }
  }

  finish();
};

Query.prototype._ingestSnapshots = function(snapshots, finish) {
  var results = [];
  for (var i = 0; i < snapshots.length; i++) {
    var snapshot = snapshots[i];
    var doc = this.connection.get(snapshot.c || this.collection, snapshot.d);
    doc.ingestSnapshot(snapshot, finish);
    results.push(doc);
  }
  return results;
};

Query.prototype._finishResponse = function(err, callback) {
  this.emit('ready');
  this.ready = true;
  if (err) {
    this.connection._destroyQuery(this);
    if (callback) return callback(err);
    return this.emit('error', err);
  }
  if (callback) callback(null, this.results, this.extra);
};

Query.prototype._handleError = function(err) {
  this.emit('error', err);
};

Query.prototype._handleDiff = function(diff) {
  // We need to go through the list twice. First, we'll ingest all the new
  // documents. After that we'll emit events and actually update our list.
  // This avoids race conditions around setting documents to be subscribed &
  // unsubscribing documents in event callbacks.
  for (var i = 0; i < diff.length; i++) {
    var d = diff[i];
    if (d.type === 'insert') d.values = this._ingestSnapshots(d.values);
  }

  for (var i = 0; i < diff.length; i++) {
    var d = diff[i];
    switch (d.type) {
      case 'insert':
        var newDocs = d.values;
        Array.prototype.splice.apply(this.results, [d.index, 0].concat(newDocs));
        this.emit('insert', newDocs, d.index);
        break;
      case 'remove':
        var howMany = d.howMany || 1;
        var removed = this.results.splice(d.index, howMany);
        this.emit('remove', removed, d.index);
        break;
      case 'move':
        var howMany = d.howMany || 1;
        var docs = this.results.splice(d.from, howMany);
        Array.prototype.splice.apply(this.results, [d.to, 0].concat(docs));
        this.emit('move', docs, d.from, d.to);
        break;
    }
  }

  this.emit('changed', this.results);
};

Query.prototype._handleExtra = function(extra) {
  this.extra = extra;
  this.emit('extra', extra);
};

}).call(this,require('_process'))

},{"../emitter":13,"_process":7}],13:[function(require,module,exports){
var EventEmitter = require('events').EventEmitter;

exports.EventEmitter = EventEmitter;
exports.mixin = mixin;

function mixin(Constructor) {
  for (var key in EventEmitter.prototype) {
    Constructor.prototype[key] = EventEmitter.prototype[key];
  }
}

},{"events":1}],14:[function(require,module,exports){
var makeError = require('make-error');

function ShareDBError(code, message) {
  ShareDBError.super.call(this, message);
  this.code = code;
}

makeError(ShareDBError);

module.exports = ShareDBError;

},{"make-error":2}],15:[function(require,module,exports){

exports.defaultType = require('ot-json0').type;

exports.map = {};

exports.register = function(type) {
  if (type.name) exports.map[type.name] = type;
  if (type.uri) exports.map[type.uri] = type;
};

exports.register(exports.defaultType);

},{"ot-json0":4}],16:[function(require,module,exports){

exports.doNothing = doNothing;
function doNothing() {}

exports.hasKeys = function(object) {
  for (var key in object) return true;
  return false;
};

},{}]},{},[8])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9tYWtlLWVycm9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL290LWpzb24wL2xpYi9ib290c3RyYXBUcmFuc2Zvcm0uanMiLCJub2RlX21vZHVsZXMvb3QtanNvbjAvbGliL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL290LWpzb24wL2xpYi9qc29uMC5qcyIsIm5vZGVfbW9kdWxlcy9vdC1qc29uMC9saWIvdGV4dDAuanMiLCJub2RlX21vZHVsZXMvcHJvY2Vzcy9icm93c2VyLmpzIiwic3JjL2NsaWVudC9pbmRleC5qcyIsInNyYy9zZXJ2ZXIvdmVuZG9yL3NoYXJlZGIvbGliL2NsaWVudC9jb25uZWN0aW9uLmpzIiwic3JjL3NlcnZlci92ZW5kb3Ivc2hhcmVkYi9saWIvY2xpZW50L2RvYy5qcyIsInNyYy9zZXJ2ZXIvdmVuZG9yL3NoYXJlZGIvbGliL2NsaWVudC9pbmRleC5qcyIsInNyYy9zZXJ2ZXIvdmVuZG9yL3NoYXJlZGIvbGliL2NsaWVudC9xdWVyeS5qcyIsInNyYy9zZXJ2ZXIvdmVuZG9yL3NoYXJlZGIvbGliL2VtaXR0ZXIuanMiLCJzcmMvc2VydmVyL3ZlbmRvci9zaGFyZWRiL2xpYi9lcnJvci5qcyIsInNyYy9zZXJ2ZXIvdmVuZG9yL3NoYXJlZGIvbGliL3R5cGVzLmpzIiwic3JjL3NlcnZlci92ZW5kb3Ivc2hhcmVkYi9saWIvdXRpbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5U0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5SUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7OztBQ3BMQTtBQUNBOzs7OztBQ0RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7OztBQ25rQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQzk0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdk1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBBdCBsZWFzdCBnaXZlIHNvbWUga2luZCBvZiBjb250ZXh0IHRvIHRoZSB1c2VyXG4gICAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuICgnICsgZXIgKyAnKScpO1xuICAgICAgICBlcnIuY29udGV4dCA9IGVyO1xuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgICAgICBoYW5kbGVyLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc09iamVjdChoYW5kbGVyKSkge1xuICAgIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcbiAgICBsZW4gPSBsaXN0ZW5lcnMubGVuZ3RoO1xuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKylcbiAgICAgIGxpc3RlbmVyc1tpXS5hcHBseSh0aGlzLCBhcmdzKTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBtO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcblxuICAvLyBUbyBhdm9pZCByZWN1cnNpb24gaW4gdGhlIGNhc2UgdGhhdCB0eXBlID09PSBcIm5ld0xpc3RlbmVyXCIhIEJlZm9yZVxuICAvLyBhZGRpbmcgaXQgdG8gdGhlIGxpc3RlbmVycywgZmlyc3QgZW1pdCBcIm5ld0xpc3RlbmVyXCIuXG4gIGlmICh0aGlzLl9ldmVudHMubmV3TGlzdGVuZXIpXG4gICAgdGhpcy5lbWl0KCduZXdMaXN0ZW5lcicsIHR5cGUsXG4gICAgICAgICAgICAgIGlzRnVuY3Rpb24obGlzdGVuZXIubGlzdGVuZXIpID9cbiAgICAgICAgICAgICAgbGlzdGVuZXIubGlzdGVuZXIgOiBsaXN0ZW5lcik7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgLy8gT3B0aW1pemUgdGhlIGNhc2Ugb2Ygb25lIGxpc3RlbmVyLiBEb24ndCBuZWVkIHRoZSBleHRyYSBhcnJheSBvYmplY3QuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbGlzdGVuZXI7XG4gIGVsc2UgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgLy8gSWYgd2UndmUgYWxyZWFkeSBnb3QgYW4gYXJyYXksIGp1c3QgYXBwZW5kLlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5wdXNoKGxpc3RlbmVyKTtcbiAgZWxzZVxuICAgIC8vIEFkZGluZyB0aGUgc2Vjb25kIGVsZW1lbnQsIG5lZWQgdG8gY2hhbmdlIHRvIGFycmF5LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFt0aGlzLl9ldmVudHNbdHlwZV0sIGxpc3RlbmVyXTtcblxuICAvLyBDaGVjayBmb3IgbGlzdGVuZXIgbGVha1xuICBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSAmJiAhdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCkge1xuICAgIGlmICghaXNVbmRlZmluZWQodGhpcy5fbWF4TGlzdGVuZXJzKSkge1xuICAgICAgbSA9IHRoaXMuX21heExpc3RlbmVycztcbiAgICB9IGVsc2Uge1xuICAgICAgbSA9IEV2ZW50RW1pdHRlci5kZWZhdWx0TWF4TGlzdGVuZXJzO1xuICAgIH1cblxuICAgIGlmIChtICYmIG0gPiAwICYmIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGggPiBtKSB7XG4gICAgICB0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkID0gdHJ1ZTtcbiAgICAgIGNvbnNvbGUuZXJyb3IoJyhub2RlKSB3YXJuaW5nOiBwb3NzaWJsZSBFdmVudEVtaXR0ZXIgbWVtb3J5ICcgK1xuICAgICAgICAgICAgICAgICAgICAnbGVhayBkZXRlY3RlZC4gJWQgbGlzdGVuZXJzIGFkZGVkLiAnICtcbiAgICAgICAgICAgICAgICAgICAgJ1VzZSBlbWl0dGVyLnNldE1heExpc3RlbmVycygpIHRvIGluY3JlYXNlIGxpbWl0LicsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS5sZW5ndGgpO1xuICAgICAgaWYgKHR5cGVvZiBjb25zb2xlLnRyYWNlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIC8vIG5vdCBzdXBwb3J0ZWQgaW4gSUUgMTBcbiAgICAgICAgY29uc29sZS50cmFjZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbiA9IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICB2YXIgZmlyZWQgPSBmYWxzZTtcblxuICBmdW5jdGlvbiBnKCkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgZyk7XG5cbiAgICBpZiAoIWZpcmVkKSB7XG4gICAgICBmaXJlZCA9IHRydWU7XG4gICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuICAgIH1cbiAgfVxuXG4gIGcubGlzdGVuZXIgPSBsaXN0ZW5lcjtcbiAgdGhpcy5vbih0eXBlLCBnKTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbi8vIGVtaXRzIGEgJ3JlbW92ZUxpc3RlbmVyJyBldmVudCBpZmYgdGhlIGxpc3RlbmVyIHdhcyByZW1vdmVkXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIGxpc3QsIHBvc2l0aW9uLCBsZW5ndGgsIGk7XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgbGVuZ3RoID0gbGlzdC5sZW5ndGg7XG4gIHBvc2l0aW9uID0gLTE7XG5cbiAgaWYgKGxpc3QgPT09IGxpc3RlbmVyIHx8XG4gICAgICAoaXNGdW5jdGlvbihsaXN0Lmxpc3RlbmVyKSAmJiBsaXN0Lmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuXG4gIH0gZWxzZSBpZiAoaXNPYmplY3QobGlzdCkpIHtcbiAgICBmb3IgKGkgPSBsZW5ndGg7IGktLSA+IDA7KSB7XG4gICAgICBpZiAobGlzdFtpXSA9PT0gbGlzdGVuZXIgfHxcbiAgICAgICAgICAobGlzdFtpXS5saXN0ZW5lciAmJiBsaXN0W2ldLmxpc3RlbmVyID09PSBsaXN0ZW5lcikpIHtcbiAgICAgICAgcG9zaXRpb24gPSBpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAocG9zaXRpb24gPCAwKVxuICAgICAgcmV0dXJuIHRoaXM7XG5cbiAgICBpZiAobGlzdC5sZW5ndGggPT09IDEpIHtcbiAgICAgIGxpc3QubGVuZ3RoID0gMDtcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgfSBlbHNlIHtcbiAgICAgIGxpc3Quc3BsaWNlKHBvc2l0aW9uLCAxKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcbiAgfVxuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBrZXksIGxpc3RlbmVycztcblxuICBpZiAoIXRoaXMuX2V2ZW50cylcbiAgICByZXR1cm4gdGhpcztcblxuICAvLyBub3QgbGlzdGVuaW5nIGZvciByZW1vdmVMaXN0ZW5lciwgbm8gbmVlZCB0byBlbWl0XG4gIGlmICghdGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKSB7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApXG4gICAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICBlbHNlIGlmICh0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgLy8gZW1pdCByZW1vdmVMaXN0ZW5lciBmb3IgYWxsIGxpc3RlbmVycyBvbiBhbGwgZXZlbnRzXG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgZm9yIChrZXkgaW4gdGhpcy5fZXZlbnRzKSB7XG4gICAgICBpZiAoa2V5ID09PSAncmVtb3ZlTGlzdGVuZXInKSBjb250aW51ZTtcbiAgICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKGtleSk7XG4gICAgfVxuICAgIHRoaXMucmVtb3ZlQWxsTGlzdGVuZXJzKCdyZW1vdmVMaXN0ZW5lcicpO1xuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgbGlzdGVuZXJzID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGxpc3RlbmVycykpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVycyk7XG4gIH0gZWxzZSBpZiAobGlzdGVuZXJzKSB7XG4gICAgLy8gTElGTyBvcmRlclxuICAgIHdoaWxlIChsaXN0ZW5lcnMubGVuZ3RoKVxuICAgICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnNbbGlzdGVuZXJzLmxlbmd0aCAtIDFdKTtcbiAgfVxuICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lcnMgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciByZXQ7XG4gIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0pXG4gICAgcmV0ID0gW107XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24odGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcbiAgZWxzZVxuICAgIHJldCA9IHRoaXMuX2V2ZW50c1t0eXBlXS5zbGljZSgpO1xuICByZXR1cm4gcmV0O1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24odHlwZSkge1xuICBpZiAodGhpcy5fZXZlbnRzKSB7XG4gICAgdmFyIGV2bGlzdGVuZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgICBpZiAoaXNGdW5jdGlvbihldmxpc3RlbmVyKSlcbiAgICAgIHJldHVybiAxO1xuICAgIGVsc2UgaWYgKGV2bGlzdGVuZXIpXG4gICAgICByZXR1cm4gZXZsaXN0ZW5lci5sZW5ndGg7XG4gIH1cbiAgcmV0dXJuIDA7XG59O1xuXG5FdmVudEVtaXR0ZXIubGlzdGVuZXJDb3VudCA9IGZ1bmN0aW9uKGVtaXR0ZXIsIHR5cGUpIHtcbiAgcmV0dXJuIGVtaXR0ZXIubGlzdGVuZXJDb3VudCh0eXBlKTtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIi8vIElTQyBAIEp1bGllbiBGb250YW5ldFxuXG4ndXNlIHN0cmljdCdcblxuLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXG52YXIgZGVmaW5lUHJvcGVydHkgPSBPYmplY3QuZGVmaW5lUHJvcGVydHlcblxuLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG52YXIgY2FwdHVyZVN0YWNrVHJhY2UgPSBFcnJvci5jYXB0dXJlU3RhY2tUcmFjZVxuaWYgKCFjYXB0dXJlU3RhY2tUcmFjZSkge1xuICBjYXB0dXJlU3RhY2tUcmFjZSA9IGZ1bmN0aW9uIGNhcHR1cmVTdGFja1RyYWNlIChlcnJvcikge1xuICAgIHZhciBjb250YWluZXIgPSBuZXcgRXJyb3IoKVxuXG4gICAgZGVmaW5lUHJvcGVydHkoZXJyb3IsICdzdGFjaycsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGdldDogZnVuY3Rpb24gZ2V0U3RhY2sgKCkge1xuICAgICAgICB2YXIgc3RhY2sgPSBjb250YWluZXIuc3RhY2tcblxuICAgICAgICAvLyBSZXBsYWNlIHByb3BlcnR5IHdpdGggdmFsdWUgZm9yIGZhc3RlciBmdXR1cmUgYWNjZXNzZXMuXG4gICAgICAgIGRlZmluZVByb3BlcnR5KHRoaXMsICdzdGFjaycsIHtcbiAgICAgICAgICB2YWx1ZTogc3RhY2tcbiAgICAgICAgfSlcblxuICAgICAgICByZXR1cm4gc3RhY2tcbiAgICAgIH0sXG4gICAgICBzZXQ6IGZ1bmN0aW9uIHNldFN0YWNrIChzdGFjaykge1xuICAgICAgICBkZWZpbmVQcm9wZXJ0eShlcnJvciwgJ3N0YWNrJywge1xuICAgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgICAgICB2YWx1ZTogc3RhY2ssXG4gICAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KVxuICB9XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gQmFzZUVycm9yIChtZXNzYWdlKSB7XG4gIGlmIChtZXNzYWdlKSB7XG4gICAgZGVmaW5lUHJvcGVydHkodGhpcywgJ21lc3NhZ2UnLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogbWVzc2FnZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfSlcbiAgfVxuXG4gIHZhciBjbmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZVxuICBpZiAoXG4gICAgY25hbWUgJiZcbiAgICBjbmFtZSAhPT0gdGhpcy5uYW1lXG4gICkge1xuICAgIGRlZmluZVByb3BlcnR5KHRoaXMsICduYW1lJywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IGNuYW1lLFxuICAgICAgd3JpdGFibGU6IHRydWVcbiAgICB9KVxuICB9XG5cbiAgY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcilcbn1cblxuQmFzZUVycm9yLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoRXJyb3IucHJvdG90eXBlLCB7XG4gIC8vIFNlZTogaHR0cHM6Ly9naXRodWIuY29tL0pzQ29tbXVuaXR5L21ha2UtZXJyb3IvaXNzdWVzLzRcbiAgY29uc3RydWN0b3I6IHtcbiAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgdmFsdWU6IEJhc2VFcnJvcixcbiAgICB3cml0YWJsZTogdHJ1ZVxuICB9XG59KVxuXG4vLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbi8vIFNldHMgdGhlIG5hbWUgb2YgYSBmdW5jdGlvbiBpZiBwb3NzaWJsZSAoZGVwZW5kcyBvZiB0aGUgSlMgZW5naW5lKS5cbnZhciBzZXRGdW5jdGlvbk5hbWUgPSAoZnVuY3Rpb24gKCkge1xuICBmdW5jdGlvbiBzZXRGdW5jdGlvbk5hbWUgKGZuLCBuYW1lKSB7XG4gICAgcmV0dXJuIGRlZmluZVByb3BlcnR5KGZuLCAnbmFtZScsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBuYW1lXG4gICAgfSlcbiAgfVxuICB0cnkge1xuICAgIHZhciBmID0gZnVuY3Rpb24gKCkge31cbiAgICBzZXRGdW5jdGlvbk5hbWUoZiwgJ2ZvbycpXG4gICAgaWYgKGYubmFtZSA9PT0gJ2ZvbycpIHtcbiAgICAgIHJldHVybiBzZXRGdW5jdGlvbk5hbWVcbiAgICB9XG4gIH0gY2F0Y2ggKF8pIHt9XG59KSgpXG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuZnVuY3Rpb24gbWFrZUVycm9yIChjb25zdHJ1Y3Rvciwgc3VwZXJfKSB7XG4gIGlmIChzdXBlcl8gPT0gbnVsbCB8fCBzdXBlcl8gPT09IEVycm9yKSB7XG4gICAgc3VwZXJfID0gQmFzZUVycm9yXG4gIH0gZWxzZSBpZiAodHlwZW9mIHN1cGVyXyAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ3N1cGVyXyBzaG91bGQgYmUgYSBmdW5jdGlvbicpXG4gIH1cblxuICB2YXIgbmFtZVxuICBpZiAodHlwZW9mIGNvbnN0cnVjdG9yID09PSAnc3RyaW5nJykge1xuICAgIG5hbWUgPSBjb25zdHJ1Y3RvclxuICAgIGNvbnN0cnVjdG9yID0gZnVuY3Rpb24gKCkgeyBzdXBlcl8uYXBwbHkodGhpcywgYXJndW1lbnRzKSB9XG5cbiAgICAvLyBJZiB0aGUgbmFtZSBjYW4gYmUgc2V0LCBkbyBpdCBvbmNlIGFuZCBmb3IgYWxsLlxuICAgIGlmIChzZXRGdW5jdGlvbk5hbWUpIHtcbiAgICAgIHNldEZ1bmN0aW9uTmFtZShjb25zdHJ1Y3RvciwgbmFtZSlcbiAgICAgIG5hbWUgPSBudWxsXG4gICAgfVxuICB9IGVsc2UgaWYgKHR5cGVvZiBjb25zdHJ1Y3RvciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2NvbnN0cnVjdG9yIHNob3VsZCBiZSBlaXRoZXIgYSBzdHJpbmcgb3IgYSBmdW5jdGlvbicpXG4gIH1cblxuICAvLyBBbHNvIHJlZ2lzdGVyIHRoZSBzdXBlciBjb25zdHJ1Y3RvciBhbHNvIGFzIGBjb25zdHJ1Y3Rvci5zdXBlcl9gIGp1c3RcbiAgLy8gbGlrZSBOb2RlJ3MgYHV0aWwuaW5oZXJpdHMoKWAuXG4gIGNvbnN0cnVjdG9yLnN1cGVyXyA9IGNvbnN0cnVjdG9yWydzdXBlciddID0gc3VwZXJfXG5cbiAgdmFyIHByb3BlcnRpZXMgPSB7XG4gICAgY29uc3RydWN0b3I6IHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBjb25zdHJ1Y3RvcixcbiAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgfVxuICB9XG5cbiAgLy8gSWYgdGhlIG5hbWUgY291bGQgbm90IGJlIHNldCBvbiB0aGUgY29uc3RydWN0b3IsIHNldCBpdCBvbiB0aGVcbiAgLy8gcHJvdG90eXBlLlxuICBpZiAobmFtZSAhPSBudWxsKSB7XG4gICAgcHJvcGVydGllcy5uYW1lID0ge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IG5hbWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZVxuICAgIH1cbiAgfVxuICBjb25zdHJ1Y3Rvci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKHN1cGVyXy5wcm90b3R5cGUsIHByb3BlcnRpZXMpXG5cbiAgcmV0dXJuIGNvbnN0cnVjdG9yXG59XG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBtYWtlRXJyb3JcbmV4cG9ydHMuQmFzZUVycm9yID0gQmFzZUVycm9yXG4iLCIvLyBUaGVzZSBtZXRob2RzIGxldCB5b3UgYnVpbGQgYSB0cmFuc2Zvcm0gZnVuY3Rpb24gZnJvbSBhIHRyYW5zZm9ybUNvbXBvbmVudFxuLy8gZnVuY3Rpb24gZm9yIE9UIHR5cGVzIGxpa2UgSlNPTjAgaW4gd2hpY2ggb3BlcmF0aW9ucyBhcmUgbGlzdHMgb2YgY29tcG9uZW50c1xuLy8gYW5kIHRyYW5zZm9ybWluZyB0aGVtIHJlcXVpcmVzIE5eMiB3b3JrLiBJIGZpbmQgaXQga2luZCBvZiBuYXN0eSB0aGF0IEkgbmVlZFxuLy8gdGhpcywgYnV0IEknbSBub3QgcmVhbGx5IHN1cmUgd2hhdCBhIGJldHRlciBzb2x1dGlvbiBpcy4gTWF5YmUgSSBzaG91bGQgZG9cbi8vIHRoaXMgYXV0b21hdGljYWxseSB0byB0eXBlcyB0aGF0IGRvbid0IGhhdmUgYSBjb21wb3NlIGZ1bmN0aW9uIGRlZmluZWQuXG5cbi8vIEFkZCB0cmFuc2Zvcm0gYW5kIHRyYW5zZm9ybVggZnVuY3Rpb25zIGZvciBhbiBPVCB0eXBlIHdoaWNoIGhhc1xuLy8gdHJhbnNmb3JtQ29tcG9uZW50IGRlZmluZWQuICB0cmFuc2Zvcm1Db21wb25lbnQoZGVzdGluYXRpb24gYXJyYXksXG4vLyBjb21wb25lbnQsIG90aGVyIGNvbXBvbmVudCwgc2lkZSlcbm1vZHVsZS5leHBvcnRzID0gYm9vdHN0cmFwVHJhbnNmb3JtXG5mdW5jdGlvbiBib290c3RyYXBUcmFuc2Zvcm0odHlwZSwgdHJhbnNmb3JtQ29tcG9uZW50LCBjaGVja1ZhbGlkT3AsIGFwcGVuZCkge1xuICB2YXIgdHJhbnNmb3JtQ29tcG9uZW50WCA9IGZ1bmN0aW9uKGxlZnQsIHJpZ2h0LCBkZXN0TGVmdCwgZGVzdFJpZ2h0KSB7XG4gICAgdHJhbnNmb3JtQ29tcG9uZW50KGRlc3RMZWZ0LCBsZWZ0LCByaWdodCwgJ2xlZnQnKTtcbiAgICB0cmFuc2Zvcm1Db21wb25lbnQoZGVzdFJpZ2h0LCByaWdodCwgbGVmdCwgJ3JpZ2h0Jyk7XG4gIH07XG5cbiAgdmFyIHRyYW5zZm9ybVggPSB0eXBlLnRyYW5zZm9ybVggPSBmdW5jdGlvbihsZWZ0T3AsIHJpZ2h0T3ApIHtcbiAgICBjaGVja1ZhbGlkT3AobGVmdE9wKTtcbiAgICBjaGVja1ZhbGlkT3AocmlnaHRPcCk7XG4gICAgdmFyIG5ld1JpZ2h0T3AgPSBbXTtcblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcmlnaHRPcC5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHJpZ2h0Q29tcG9uZW50ID0gcmlnaHRPcFtpXTtcblxuICAgICAgLy8gR2VuZXJhdGUgbmV3TGVmdE9wIGJ5IGNvbXBvc2luZyBsZWZ0T3AgYnkgcmlnaHRDb21wb25lbnRcbiAgICAgIHZhciBuZXdMZWZ0T3AgPSBbXTtcbiAgICAgIHZhciBrID0gMDtcbiAgICAgIHdoaWxlIChrIDwgbGVmdE9wLmxlbmd0aCkge1xuICAgICAgICB2YXIgbmV4dEMgPSBbXTtcbiAgICAgICAgdHJhbnNmb3JtQ29tcG9uZW50WChsZWZ0T3Bba10sIHJpZ2h0Q29tcG9uZW50LCBuZXdMZWZ0T3AsIG5leHRDKTtcbiAgICAgICAgaysrO1xuXG4gICAgICAgIGlmIChuZXh0Qy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICByaWdodENvbXBvbmVudCA9IG5leHRDWzBdO1xuICAgICAgICB9IGVsc2UgaWYgKG5leHRDLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGZvciAodmFyIGogPSBrOyBqIDwgbGVmdE9wLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBhcHBlbmQobmV3TGVmdE9wLCBsZWZ0T3Bbal0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByaWdodENvbXBvbmVudCA9IG51bGw7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gUmVjdXJzZS5cbiAgICAgICAgICB2YXIgcGFpciA9IHRyYW5zZm9ybVgobGVmdE9wLnNsaWNlKGspLCBuZXh0Qyk7XG4gICAgICAgICAgZm9yICh2YXIgbCA9IDA7IGwgPCBwYWlyWzBdLmxlbmd0aDsgbCsrKSB7XG4gICAgICAgICAgICBhcHBlbmQobmV3TGVmdE9wLCBwYWlyWzBdW2xdKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yICh2YXIgciA9IDA7IHIgPCBwYWlyWzFdLmxlbmd0aDsgcisrKSB7XG4gICAgICAgICAgICBhcHBlbmQobmV3UmlnaHRPcCwgcGFpclsxXVtyXSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJpZ2h0Q29tcG9uZW50ID0gbnVsbDtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAocmlnaHRDb21wb25lbnQgIT0gbnVsbCkge1xuICAgICAgICBhcHBlbmQobmV3UmlnaHRPcCwgcmlnaHRDb21wb25lbnQpO1xuICAgICAgfVxuICAgICAgbGVmdE9wID0gbmV3TGVmdE9wO1xuICAgIH1cbiAgICByZXR1cm4gW2xlZnRPcCwgbmV3UmlnaHRPcF07XG4gIH07XG5cbiAgLy8gVHJhbnNmb3JtcyBvcCB3aXRoIHNwZWNpZmllZCB0eXBlICgnbGVmdCcgb3IgJ3JpZ2h0JykgYnkgb3RoZXJPcC5cbiAgdHlwZS50cmFuc2Zvcm0gPSBmdW5jdGlvbihvcCwgb3RoZXJPcCwgdHlwZSkge1xuICAgIGlmICghKHR5cGUgPT09ICdsZWZ0JyB8fCB0eXBlID09PSAncmlnaHQnKSlcbiAgICAgIHRocm93IG5ldyBFcnJvcihcInR5cGUgbXVzdCBiZSAnbGVmdCcgb3IgJ3JpZ2h0J1wiKTtcblxuICAgIGlmIChvdGhlck9wLmxlbmd0aCA9PT0gMCkgcmV0dXJuIG9wO1xuXG4gICAgaWYgKG9wLmxlbmd0aCA9PT0gMSAmJiBvdGhlck9wLmxlbmd0aCA9PT0gMSlcbiAgICAgIHJldHVybiB0cmFuc2Zvcm1Db21wb25lbnQoW10sIG9wWzBdLCBvdGhlck9wWzBdLCB0eXBlKTtcblxuICAgIGlmICh0eXBlID09PSAnbGVmdCcpXG4gICAgICByZXR1cm4gdHJhbnNmb3JtWChvcCwgb3RoZXJPcClbMF07XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIHRyYW5zZm9ybVgob3RoZXJPcCwgb3ApWzFdO1xuICB9O1xufTtcbiIsIi8vIE9ubHkgdGhlIEpTT04gdHlwZSBpcyBleHBvcnRlZCwgYmVjYXVzZSB0aGUgdGV4dCB0eXBlIGlzIGRlcHJlY2F0ZWRcbi8vIG90aGVyd2lzZS4gKElmIHlvdSB3YW50IHRvIHVzZSBpdCBzb21ld2hlcmUsIHlvdSdyZSB3ZWxjb21lIHRvIHB1bGwgaXQgb3V0XG4vLyBpbnRvIGEgc2VwYXJhdGUgbW9kdWxlIHRoYXQganNvbjAgY2FuIGRlcGVuZCBvbikuXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICB0eXBlOiByZXF1aXJlKCcuL2pzb24wJylcbn07XG4iLCIvKlxuIFRoaXMgaXMgdGhlIGltcGxlbWVudGF0aW9uIG9mIHRoZSBKU09OIE9UIHR5cGUuXG5cbiBTcGVjIGlzIGhlcmU6IGh0dHBzOi8vZ2l0aHViLmNvbS9qb3NlcGhnL1NoYXJlSlMvd2lraS9KU09OLU9wZXJhdGlvbnNcblxuIE5vdGU6IFRoaXMgaXMgYmVpbmcgbWFkZSBvYnNvbGV0ZS4gSXQgd2lsbCBzb29uIGJlIHJlcGxhY2VkIGJ5IHRoZSBKU09OMiB0eXBlLlxuKi9cblxuLyoqXG4gKiBVVElMSVRZIEZVTkNUSU9OU1xuICovXG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBwYXNzZWQgb2JqZWN0IGlzIGFuIEFycmF5IGluc3RhbmNlLiBDYW4ndCB1c2UgQXJyYXkuaXNBcnJheVxuICogeWV0IGJlY2F1c2UgaXRzIG5vdCBzdXBwb3J0ZWQgb24gSUU4LlxuICpcbiAqIEBwYXJhbSBvYmpcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG52YXIgaXNBcnJheSA9IGZ1bmN0aW9uKG9iaikge1xuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikgPT0gJ1tvYmplY3QgQXJyYXldJztcbn07XG5cbi8qKlxuICogQ2hlY2tzIGlmIHRoZSBwYXNzZWQgb2JqZWN0IGlzIGFuIE9iamVjdCBpbnN0YW5jZS5cbiAqIE5vIGZ1bmN0aW9uIGNhbGwgKGZhc3QpIHZlcnNpb25cbiAqXG4gKiBAcGFyYW0gb2JqXG4gKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAqL1xudmFyIGlzT2JqZWN0ID0gZnVuY3Rpb24ob2JqKSB7XG4gIHJldHVybiAoISFvYmopICYmIChvYmouY29uc3RydWN0b3IgPT09IE9iamVjdCk7XG59O1xuXG4vKipcbiAqIENsb25lcyB0aGUgcGFzc2VkIG9iamVjdCB1c2luZyBKU09OIHNlcmlhbGl6YXRpb24gKHdoaWNoIGlzIHNsb3cpLlxuICpcbiAqIGhheCwgY29waWVkIGZyb20gdGVzdC90eXBlcy9qc29uLiBBcHBhcmVudGx5IHRoaXMgaXMgc3RpbGwgdGhlIGZhc3Rlc3Qgd2F5XG4gKiB0byBkZWVwIGNsb25lIGFuIG9iamVjdCwgYXNzdW1pbmcgd2UgaGF2ZSBicm93c2VyIHN1cHBvcnQgZm9yIEpTT04uICBAc2VlXG4gKiBodHRwOi8vanNwZXJmLmNvbS9jbG9uaW5nLWFuLW9iamVjdC8xMlxuICovXG52YXIgY2xvbmUgPSBmdW5jdGlvbihvKSB7XG4gIHJldHVybiBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KG8pKTtcbn07XG5cbi8qKlxuICogSlNPTiBPVCBUeXBlXG4gKiBAdHlwZSB7Kn1cbiAqL1xudmFyIGpzb24gPSB7XG4gIG5hbWU6ICdqc29uMCcsXG4gIHVyaTogJ2h0dHA6Ly9zaGFyZWpzLm9yZy90eXBlcy9KU09OdjAnXG59O1xuXG4vLyBZb3UgY2FuIHJlZ2lzdGVyIGFub3RoZXIgT1QgdHlwZSBhcyBhIHN1YnR5cGUgaW4gYSBKU09OIGRvY3VtZW50IHVzaW5nXG4vLyB0aGUgZm9sbG93aW5nIGZ1bmN0aW9uLiBUaGlzIGFsbG93cyBhbm90aGVyIHR5cGUgdG8gaGFuZGxlIGNlcnRhaW5cbi8vIG9wZXJhdGlvbnMgaW5zdGVhZCBvZiB0aGUgYnVpbHRpbiBKU09OIHR5cGUuXG52YXIgc3VidHlwZXMgPSB7fTtcbmpzb24ucmVnaXN0ZXJTdWJ0eXBlID0gZnVuY3Rpb24oc3VidHlwZSkge1xuICBzdWJ0eXBlc1tzdWJ0eXBlLm5hbWVdID0gc3VidHlwZTtcbn07XG5cbmpzb24uY3JlYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuICAvLyBOdWxsIGluc3RlYWQgb2YgdW5kZWZpbmVkIGlmIHlvdSBkb24ndCBwYXNzIGFuIGFyZ3VtZW50LlxuICByZXR1cm4gZGF0YSA9PT0gdW5kZWZpbmVkID8gbnVsbCA6IGNsb25lKGRhdGEpO1xufTtcblxuanNvbi5pbnZlcnRDb21wb25lbnQgPSBmdW5jdGlvbihjKSB7XG4gIHZhciBjXyA9IHtwOiBjLnB9O1xuXG4gIC8vIGhhbmRsZSBzdWJ0eXBlIG9wc1xuICBpZiAoYy50ICYmIHN1YnR5cGVzW2MudF0pIHtcbiAgICBjXy50ID0gYy50O1xuICAgIGNfLm8gPSBzdWJ0eXBlc1tjLnRdLmludmVydChjLm8pO1xuICB9XG5cbiAgaWYgKGMuc2kgIT09IHZvaWQgMCkgY18uc2QgPSBjLnNpO1xuICBpZiAoYy5zZCAhPT0gdm9pZCAwKSBjXy5zaSA9IGMuc2Q7XG4gIGlmIChjLm9pICE9PSB2b2lkIDApIGNfLm9kID0gYy5vaTtcbiAgaWYgKGMub2QgIT09IHZvaWQgMCkgY18ub2kgPSBjLm9kO1xuICBpZiAoYy5saSAhPT0gdm9pZCAwKSBjXy5sZCA9IGMubGk7XG4gIGlmIChjLmxkICE9PSB2b2lkIDApIGNfLmxpID0gYy5sZDtcbiAgaWYgKGMubmEgIT09IHZvaWQgMCkgY18ubmEgPSAtYy5uYTtcblxuICBpZiAoYy5sbSAhPT0gdm9pZCAwKSB7XG4gICAgY18ubG0gPSBjLnBbYy5wLmxlbmd0aC0xXTtcbiAgICBjXy5wID0gYy5wLnNsaWNlKDAsYy5wLmxlbmd0aC0xKS5jb25jYXQoW2MubG1dKTtcbiAgfVxuXG4gIHJldHVybiBjXztcbn07XG5cbmpzb24uaW52ZXJ0ID0gZnVuY3Rpb24ob3ApIHtcbiAgdmFyIG9wXyA9IG9wLnNsaWNlKCkucmV2ZXJzZSgpO1xuICB2YXIgaW9wID0gW107XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3BfLmxlbmd0aDsgaSsrKSB7XG4gICAgaW9wLnB1c2goanNvbi5pbnZlcnRDb21wb25lbnQob3BfW2ldKSk7XG4gIH1cbiAgcmV0dXJuIGlvcDtcbn07XG5cbmpzb24uY2hlY2tWYWxpZE9wID0gZnVuY3Rpb24ob3ApIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcC5sZW5ndGg7IGkrKykge1xuICAgIGlmICghaXNBcnJheShvcFtpXS5wKSkgdGhyb3cgbmV3IEVycm9yKCdNaXNzaW5nIHBhdGgnKTtcbiAgfVxufTtcblxuanNvbi5jaGVja0xpc3QgPSBmdW5jdGlvbihlbGVtKSB7XG4gIGlmICghaXNBcnJheShlbGVtKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlZmVyZW5jZWQgZWxlbWVudCBub3QgYSBsaXN0Jyk7XG59O1xuXG5qc29uLmNoZWNrT2JqID0gZnVuY3Rpb24oZWxlbSkge1xuICBpZiAoIWlzT2JqZWN0KGVsZW0pKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiUmVmZXJlbmNlZCBlbGVtZW50IG5vdCBhbiBvYmplY3QgKGl0IHdhcyBcIiArIEpTT04uc3RyaW5naWZ5KGVsZW0pICsgXCIpXCIpO1xuICB9XG59O1xuXG4vLyBoZWxwZXIgZnVuY3Rpb25zIHRvIGNvbnZlcnQgb2xkIHN0cmluZyBvcHMgdG8gYW5kIGZyb20gc3VidHlwZSBvcHNcbmZ1bmN0aW9uIGNvbnZlcnRGcm9tVGV4dChjKSB7XG4gIGMudCA9ICd0ZXh0MCc7XG4gIHZhciBvID0ge3A6IGMucC5wb3AoKX07XG4gIGlmIChjLnNpICE9IG51bGwpIG8uaSA9IGMuc2k7XG4gIGlmIChjLnNkICE9IG51bGwpIG8uZCA9IGMuc2Q7XG4gIGMubyA9IFtvXTtcbn1cblxuZnVuY3Rpb24gY29udmVydFRvVGV4dChjKSB7XG4gIGMucC5wdXNoKGMub1swXS5wKTtcbiAgaWYgKGMub1swXS5pICE9IG51bGwpIGMuc2kgPSBjLm9bMF0uaTtcbiAgaWYgKGMub1swXS5kICE9IG51bGwpIGMuc2QgPSBjLm9bMF0uZDtcbiAgZGVsZXRlIGMudDtcbiAgZGVsZXRlIGMubztcbn1cblxuanNvbi5hcHBseSA9IGZ1bmN0aW9uKHNuYXBzaG90LCBvcCkge1xuICBqc29uLmNoZWNrVmFsaWRPcChvcCk7XG5cbiAgb3AgPSBjbG9uZShvcCk7XG5cbiAgdmFyIGNvbnRhaW5lciA9IHtcbiAgICBkYXRhOiBzbmFwc2hvdFxuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3AubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYyA9IG9wW2ldO1xuXG4gICAgLy8gY29udmVydCBvbGQgc3RyaW5nIG9wcyB0byB1c2Ugc3VidHlwZSBmb3IgYmFja3dhcmRzIGNvbXBhdGliaWxpdHlcbiAgICBpZiAoYy5zaSAhPSBudWxsIHx8IGMuc2QgIT0gbnVsbClcbiAgICAgIGNvbnZlcnRGcm9tVGV4dChjKTtcblxuICAgIHZhciBwYXJlbnQgPSBudWxsO1xuICAgIHZhciBwYXJlbnRLZXkgPSBudWxsO1xuICAgIHZhciBlbGVtID0gY29udGFpbmVyO1xuICAgIHZhciBrZXkgPSAnZGF0YSc7XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IGMucC5sZW5ndGg7IGorKykge1xuICAgICAgdmFyIHAgPSBjLnBbal07XG5cbiAgICAgIHBhcmVudCA9IGVsZW07XG4gICAgICBwYXJlbnRLZXkgPSBrZXk7XG4gICAgICBlbGVtID0gZWxlbVtrZXldO1xuICAgICAga2V5ID0gcDtcblxuICAgICAgaWYgKHBhcmVudCA9PSBudWxsKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1BhdGggaW52YWxpZCcpO1xuICAgIH1cblxuICAgIC8vIGhhbmRsZSBzdWJ0eXBlIG9wc1xuICAgIGlmIChjLnQgJiYgYy5vICE9PSB2b2lkIDAgJiYgc3VidHlwZXNbYy50XSkge1xuICAgICAgZWxlbVtrZXldID0gc3VidHlwZXNbYy50XS5hcHBseShlbGVtW2tleV0sIGMubyk7XG5cbiAgICAvLyBOdW1iZXIgYWRkXG4gICAgfSBlbHNlIGlmIChjLm5hICE9PSB2b2lkIDApIHtcbiAgICAgIGlmICh0eXBlb2YgZWxlbVtrZXldICE9ICdudW1iZXInKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlZmVyZW5jZWQgZWxlbWVudCBub3QgYSBudW1iZXInKTtcblxuICAgICAgZWxlbVtrZXldICs9IGMubmE7XG4gICAgfVxuXG4gICAgLy8gTGlzdCByZXBsYWNlXG4gICAgZWxzZSBpZiAoYy5saSAhPT0gdm9pZCAwICYmIGMubGQgIT09IHZvaWQgMCkge1xuICAgICAganNvbi5jaGVja0xpc3QoZWxlbSk7XG4gICAgICAvLyBTaG91bGQgY2hlY2sgdGhlIGxpc3QgZWxlbWVudCBtYXRjaGVzIGMubGRcbiAgICAgIGVsZW1ba2V5XSA9IGMubGk7XG4gICAgfVxuXG4gICAgLy8gTGlzdCBpbnNlcnRcbiAgICBlbHNlIGlmIChjLmxpICE9PSB2b2lkIDApIHtcbiAgICAgIGpzb24uY2hlY2tMaXN0KGVsZW0pO1xuICAgICAgZWxlbS5zcGxpY2Uoa2V5LDAsIGMubGkpO1xuICAgIH1cblxuICAgIC8vIExpc3QgZGVsZXRlXG4gICAgZWxzZSBpZiAoYy5sZCAhPT0gdm9pZCAwKSB7XG4gICAgICBqc29uLmNoZWNrTGlzdChlbGVtKTtcbiAgICAgIC8vIFNob3VsZCBjaGVjayB0aGUgbGlzdCBlbGVtZW50IG1hdGNoZXMgYy5sZCBoZXJlIHRvby5cbiAgICAgIGVsZW0uc3BsaWNlKGtleSwxKTtcbiAgICB9XG5cbiAgICAvLyBMaXN0IG1vdmVcbiAgICBlbHNlIGlmIChjLmxtICE9PSB2b2lkIDApIHtcbiAgICAgIGpzb24uY2hlY2tMaXN0KGVsZW0pO1xuICAgICAgaWYgKGMubG0gIT0ga2V5KSB7XG4gICAgICAgIHZhciBlID0gZWxlbVtrZXldO1xuICAgICAgICAvLyBSZW1vdmUgaXQuLi5cbiAgICAgICAgZWxlbS5zcGxpY2Uoa2V5LDEpO1xuICAgICAgICAvLyBBbmQgaW5zZXJ0IGl0IGJhY2suXG4gICAgICAgIGVsZW0uc3BsaWNlKGMubG0sMCxlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBPYmplY3QgaW5zZXJ0IC8gcmVwbGFjZVxuICAgIGVsc2UgaWYgKGMub2kgIT09IHZvaWQgMCkge1xuICAgICAganNvbi5jaGVja09iaihlbGVtKTtcblxuICAgICAgLy8gU2hvdWxkIGNoZWNrIHRoYXQgZWxlbVtrZXldID09IGMub2RcbiAgICAgIGVsZW1ba2V5XSA9IGMub2k7XG4gICAgfVxuXG4gICAgLy8gT2JqZWN0IGRlbGV0ZVxuICAgIGVsc2UgaWYgKGMub2QgIT09IHZvaWQgMCkge1xuICAgICAganNvbi5jaGVja09iaihlbGVtKTtcblxuICAgICAgLy8gU2hvdWxkIGNoZWNrIHRoYXQgZWxlbVtrZXldID09IGMub2RcbiAgICAgIGRlbGV0ZSBlbGVtW2tleV07XG4gICAgfVxuXG4gICAgZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFsaWQgLyBtaXNzaW5nIGluc3RydWN0aW9uIGluIG9wJyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGNvbnRhaW5lci5kYXRhO1xufTtcblxuLy8gSGVscGVyIHRvIGJyZWFrIGFuIG9wZXJhdGlvbiB1cCBpbnRvIGEgYnVuY2ggb2Ygc21hbGwgb3BzLlxuanNvbi5zaGF0dGVyID0gZnVuY3Rpb24ob3ApIHtcbiAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcC5sZW5ndGg7IGkrKykge1xuICAgIHJlc3VsdHMucHVzaChbb3BbaV1dKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0cztcbn07XG5cbi8vIEhlbHBlciBmb3IgaW5jcmVtZW50YWxseSBhcHBseWluZyBhbiBvcGVyYXRpb24gdG8gYSBzbmFwc2hvdC4gQ2FsbHMgeWllbGRcbi8vIGFmdGVyIGVhY2ggb3AgY29tcG9uZW50IGhhcyBiZWVuIGFwcGxpZWQuXG5qc29uLmluY3JlbWVudGFsQXBwbHkgPSBmdW5jdGlvbihzbmFwc2hvdCwgb3AsIF95aWVsZCkge1xuICBmb3IgKHZhciBpID0gMDsgaSA8IG9wLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHNtYWxsT3AgPSBbb3BbaV1dO1xuICAgIHNuYXBzaG90ID0ganNvbi5hcHBseShzbmFwc2hvdCwgc21hbGxPcCk7XG4gICAgLy8gSSdkIGp1c3QgY2FsbCB0aGlzIHlpZWxkLCBidXQgdGhhdHMgYSByZXNlcnZlZCBrZXl3b3JkLiBCYWghXG4gICAgX3lpZWxkKHNtYWxsT3AsIHNuYXBzaG90KTtcbiAgfVxuXG4gIHJldHVybiBzbmFwc2hvdDtcbn07XG5cbi8vIENoZWNrcyBpZiB0d28gcGF0aHMsIHAxIGFuZCBwMiBtYXRjaC5cbnZhciBwYXRoTWF0Y2hlcyA9IGpzb24ucGF0aE1hdGNoZXMgPSBmdW5jdGlvbihwMSwgcDIsIGlnbm9yZUxhc3QpIHtcbiAgaWYgKHAxLmxlbmd0aCAhPSBwMi5sZW5ndGgpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgcDEubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAocDFbaV0gIT09IHAyW2ldICYmICghaWdub3JlTGFzdCB8fCBpICE9PSBwMS5sZW5ndGggLSAxKSlcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufTtcblxuanNvbi5hcHBlbmQgPSBmdW5jdGlvbihkZXN0LGMpIHtcbiAgYyA9IGNsb25lKGMpO1xuXG4gIGlmIChkZXN0Lmxlbmd0aCA9PT0gMCkge1xuICAgIGRlc3QucHVzaChjKTtcbiAgICByZXR1cm47XG4gIH1cblxuICB2YXIgbGFzdCA9IGRlc3RbZGVzdC5sZW5ndGggLSAxXTtcblxuICAvLyBjb252ZXJ0IG9sZCBzdHJpbmcgb3BzIHRvIHVzZSBzdWJ0eXBlIGZvciBiYWNrd2FyZHMgY29tcGF0aWJpbGl0eVxuICBpZiAoKGMuc2kgIT0gbnVsbCB8fCBjLnNkICE9IG51bGwpICYmIChsYXN0LnNpICE9IG51bGwgfHwgbGFzdC5zZCAhPSBudWxsKSkge1xuICAgIGNvbnZlcnRGcm9tVGV4dChjKTtcbiAgICBjb252ZXJ0RnJvbVRleHQobGFzdCk7XG4gIH1cblxuICBpZiAocGF0aE1hdGNoZXMoYy5wLCBsYXN0LnApKSB7XG4gICAgLy8gaGFuZGxlIHN1YnR5cGUgb3BzXG4gICAgaWYgKGMudCAmJiBsYXN0LnQgJiYgYy50ID09PSBsYXN0LnQgJiYgc3VidHlwZXNbYy50XSkge1xuICAgICAgbGFzdC5vID0gc3VidHlwZXNbYy50XS5jb21wb3NlKGxhc3QubywgYy5vKTtcblxuICAgICAgLy8gY29udmVydCBiYWNrIHRvIG9sZCBzdHJpbmcgb3BzXG4gICAgICBpZiAoYy5zaSAhPSBudWxsIHx8IGMuc2QgIT0gbnVsbCkge1xuICAgICAgICB2YXIgcCA9IGMucDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsYXN0Lm8ubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgICAgICAgYy5vID0gW2xhc3Quby5wb3AoKV07XG4gICAgICAgICAgYy5wID0gcC5zbGljZSgpO1xuICAgICAgICAgIGNvbnZlcnRUb1RleHQoYyk7XG4gICAgICAgICAgZGVzdC5wdXNoKGMpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29udmVydFRvVGV4dChsYXN0KTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGxhc3QubmEgIT0gbnVsbCAmJiBjLm5hICE9IG51bGwpIHtcbiAgICAgIGRlc3RbZGVzdC5sZW5ndGggLSAxXSA9IHtwOiBsYXN0LnAsIG5hOiBsYXN0Lm5hICsgYy5uYX07XG4gICAgfSBlbHNlIGlmIChsYXN0LmxpICE9PSB1bmRlZmluZWQgJiYgYy5saSA9PT0gdW5kZWZpbmVkICYmIGMubGQgPT09IGxhc3QubGkpIHtcbiAgICAgIC8vIGluc2VydCBpbW1lZGlhdGVseSBmb2xsb3dlZCBieSBkZWxldGUgYmVjb21lcyBhIG5vb3AuXG4gICAgICBpZiAobGFzdC5sZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIC8vIGxlYXZlIHRoZSBkZWxldGUgcGFydCBvZiB0aGUgcmVwbGFjZVxuICAgICAgICBkZWxldGUgbGFzdC5saTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlc3QucG9wKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChsYXN0Lm9kICE9PSB1bmRlZmluZWQgJiYgbGFzdC5vaSA9PT0gdW5kZWZpbmVkICYmIGMub2kgIT09IHVuZGVmaW5lZCAmJiBjLm9kID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxhc3Qub2kgPSBjLm9pO1xuICAgIH0gZWxzZSBpZiAobGFzdC5vaSAhPT0gdW5kZWZpbmVkICYmIGMub2QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgLy8gVGhlIGxhc3QgcGF0aCBjb21wb25lbnQgaW5zZXJ0ZWQgc29tZXRoaW5nIHRoYXQgdGhlIG5ldyBjb21wb25lbnQgZGVsZXRlcyAob3IgcmVwbGFjZXMpLlxuICAgICAgLy8gSnVzdCBtZXJnZSB0aGVtLlxuICAgICAgaWYgKGMub2kgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBsYXN0Lm9pID0gYy5vaTtcbiAgICAgIH0gZWxzZSBpZiAobGFzdC5vZCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIGRlbGV0ZSBsYXN0Lm9pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQW4gaW5zZXJ0IGRpcmVjdGx5IGZvbGxvd2VkIGJ5IGEgZGVsZXRlIHR1cm5zIGludG8gYSBuby1vcCBhbmQgY2FuIGJlIHJlbW92ZWQuXG4gICAgICAgIGRlc3QucG9wKCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjLmxtICE9PSB1bmRlZmluZWQgJiYgYy5wW2MucC5sZW5ndGggLSAxXSA9PT0gYy5sbSkge1xuICAgICAgLy8gZG9uJ3QgZG8gYW55dGhpbmdcbiAgICB9IGVsc2Uge1xuICAgICAgZGVzdC5wdXNoKGMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBjb252ZXJ0IHN0cmluZyBvcHMgYmFja1xuICAgIGlmICgoYy5zaSAhPSBudWxsIHx8IGMuc2QgIT0gbnVsbCkgJiYgKGxhc3Quc2kgIT0gbnVsbCB8fCBsYXN0LnNkICE9IG51bGwpKSB7XG4gICAgICBjb252ZXJ0VG9UZXh0KGMpO1xuICAgICAgY29udmVydFRvVGV4dChsYXN0KTtcbiAgICB9XG5cbiAgICBkZXN0LnB1c2goYyk7XG4gIH1cbn07XG5cbmpzb24uY29tcG9zZSA9IGZ1bmN0aW9uKG9wMSxvcDIpIHtcbiAganNvbi5jaGVja1ZhbGlkT3Aob3AxKTtcbiAganNvbi5jaGVja1ZhbGlkT3Aob3AyKTtcblxuICB2YXIgbmV3T3AgPSBjbG9uZShvcDEpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3AyLmxlbmd0aDsgaSsrKSB7XG4gICAganNvbi5hcHBlbmQobmV3T3Asb3AyW2ldKTtcbiAgfVxuXG4gIHJldHVybiBuZXdPcDtcbn07XG5cbmpzb24ubm9ybWFsaXplID0gZnVuY3Rpb24ob3ApIHtcbiAgdmFyIG5ld09wID0gW107XG5cbiAgb3AgPSBpc0FycmF5KG9wKSA/IG9wIDogW29wXTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IG9wLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGMgPSBvcFtpXTtcbiAgICBpZiAoYy5wID09IG51bGwpIGMucCA9IFtdO1xuXG4gICAganNvbi5hcHBlbmQobmV3T3AsYyk7XG4gIH1cblxuICByZXR1cm4gbmV3T3A7XG59O1xuXG4vLyBSZXR1cm5zIHRoZSBjb21tb24gbGVuZ3RoIG9mIHRoZSBwYXRocyBvZiBvcHMgYSBhbmQgYlxuanNvbi5jb21tb25MZW5ndGhGb3JPcHMgPSBmdW5jdGlvbihhLCBiKSB7XG4gIHZhciBhbGVuID0gYS5wLmxlbmd0aDtcbiAgdmFyIGJsZW4gPSBiLnAubGVuZ3RoO1xuICBpZiAoYS5uYSAhPSBudWxsIHx8IGEudClcbiAgICBhbGVuKys7XG5cbiAgaWYgKGIubmEgIT0gbnVsbCB8fCBiLnQpXG4gICAgYmxlbisrO1xuXG4gIGlmIChhbGVuID09PSAwKSByZXR1cm4gLTE7XG4gIGlmIChibGVuID09PSAwKSByZXR1cm4gbnVsbDtcblxuICBhbGVuLS07XG4gIGJsZW4tLTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGFsZW47IGkrKykge1xuICAgIHZhciBwID0gYS5wW2ldO1xuICAgIGlmIChpID49IGJsZW4gfHwgcCAhPT0gYi5wW2ldKVxuICAgICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICByZXR1cm4gYWxlbjtcbn07XG5cbi8vIFJldHVybnMgdHJ1ZSBpZiBhbiBvcCBjYW4gYWZmZWN0IHRoZSBnaXZlbiBwYXRoXG5qc29uLmNhbk9wQWZmZWN0UGF0aCA9IGZ1bmN0aW9uKG9wLCBwYXRoKSB7XG4gIHJldHVybiBqc29uLmNvbW1vbkxlbmd0aEZvck9wcyh7cDpwYXRofSwgb3ApICE9IG51bGw7XG59O1xuXG4vLyB0cmFuc2Zvcm0gYyBzbyBpdCBhcHBsaWVzIHRvIGEgZG9jdW1lbnQgd2l0aCBvdGhlckMgYXBwbGllZC5cbmpzb24udHJhbnNmb3JtQ29tcG9uZW50ID0gZnVuY3Rpb24oZGVzdCwgYywgb3RoZXJDLCB0eXBlKSB7XG4gIGMgPSBjbG9uZShjKTtcblxuICB2YXIgY29tbW9uID0ganNvbi5jb21tb25MZW5ndGhGb3JPcHMob3RoZXJDLCBjKTtcbiAgdmFyIGNvbW1vbjIgPSBqc29uLmNvbW1vbkxlbmd0aEZvck9wcyhjLCBvdGhlckMpO1xuICB2YXIgY3BsZW5ndGggPSBjLnAubGVuZ3RoO1xuICB2YXIgb3RoZXJDcGxlbmd0aCA9IG90aGVyQy5wLmxlbmd0aDtcblxuICBpZiAoYy5uYSAhPSBudWxsIHx8IGMudClcbiAgICBjcGxlbmd0aCsrO1xuXG4gIGlmIChvdGhlckMubmEgIT0gbnVsbCB8fCBvdGhlckMudClcbiAgICBvdGhlckNwbGVuZ3RoKys7XG5cbiAgLy8gaWYgYyBpcyBkZWxldGluZyBzb21ldGhpbmcsIGFuZCB0aGF0IHRoaW5nIGlzIGNoYW5nZWQgYnkgb3RoZXJDLCB3ZSBuZWVkIHRvXG4gIC8vIHVwZGF0ZSBjIHRvIHJlZmxlY3QgdGhhdCBjaGFuZ2UgZm9yIGludmVydGliaWxpdHkuXG4gIGlmIChjb21tb24yICE9IG51bGwgJiYgb3RoZXJDcGxlbmd0aCA+IGNwbGVuZ3RoICYmIGMucFtjb21tb24yXSA9PSBvdGhlckMucFtjb21tb24yXSkge1xuICAgIGlmIChjLmxkICE9PSB2b2lkIDApIHtcbiAgICAgIHZhciBvYyA9IGNsb25lKG90aGVyQyk7XG4gICAgICBvYy5wID0gb2MucC5zbGljZShjcGxlbmd0aCk7XG4gICAgICBjLmxkID0ganNvbi5hcHBseShjbG9uZShjLmxkKSxbb2NdKTtcbiAgICB9IGVsc2UgaWYgKGMub2QgIT09IHZvaWQgMCkge1xuICAgICAgdmFyIG9jID0gY2xvbmUob3RoZXJDKTtcbiAgICAgIG9jLnAgPSBvYy5wLnNsaWNlKGNwbGVuZ3RoKTtcbiAgICAgIGMub2QgPSBqc29uLmFwcGx5KGNsb25lKGMub2QpLFtvY10pO1xuICAgIH1cbiAgfVxuXG4gIGlmIChjb21tb24gIT0gbnVsbCkge1xuICAgIHZhciBjb21tb25PcGVyYW5kID0gY3BsZW5ndGggPT0gb3RoZXJDcGxlbmd0aDtcblxuICAgIC8vIGJhY2t3YXJkIGNvbXBhdGliaWxpdHkgZm9yIG9sZCBzdHJpbmcgb3BzXG4gICAgdmFyIG9jID0gb3RoZXJDO1xuICAgIGlmICgoYy5zaSAhPSBudWxsIHx8IGMuc2QgIT0gbnVsbCkgJiYgKG90aGVyQy5zaSAhPSBudWxsIHx8IG90aGVyQy5zZCAhPSBudWxsKSkge1xuICAgICAgY29udmVydEZyb21UZXh0KGMpO1xuICAgICAgb2MgPSBjbG9uZShvdGhlckMpO1xuICAgICAgY29udmVydEZyb21UZXh0KG9jKTtcbiAgICB9XG5cbiAgICAvLyBoYW5kbGUgc3VidHlwZSBvcHNcbiAgICBpZiAob2MudCAmJiBzdWJ0eXBlc1tvYy50XSkge1xuICAgICAgaWYgKGMudCAmJiBjLnQgPT09IG9jLnQpIHtcbiAgICAgICAgdmFyIHJlcyA9IHN1YnR5cGVzW2MudF0udHJhbnNmb3JtKGMubywgb2MubywgdHlwZSk7XG5cbiAgICAgICAgaWYgKHJlcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gY29udmVydCBiYWNrIHRvIG9sZCBzdHJpbmcgb3BzXG4gICAgICAgICAgaWYgKGMuc2kgIT0gbnVsbCB8fCBjLnNkICE9IG51bGwpIHtcbiAgICAgICAgICAgIHZhciBwID0gYy5wO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCByZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgYy5vID0gW3Jlc1tpXV07XG4gICAgICAgICAgICAgIGMucCA9IHAuc2xpY2UoKTtcbiAgICAgICAgICAgICAgY29udmVydFRvVGV4dChjKTtcbiAgICAgICAgICAgICAganNvbi5hcHBlbmQoZGVzdCwgYyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGMubyA9IHJlcztcbiAgICAgICAgICAgIGpzb24uYXBwZW5kKGRlc3QsIGMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIHRyYW5zZm9ybSBiYXNlZCBvbiBvdGhlckNcbiAgICBlbHNlIGlmIChvdGhlckMubmEgIT09IHZvaWQgMCkge1xuICAgICAgLy8gdGhpcyBjYXNlIGlzIGhhbmRsZWQgYmVsb3dcbiAgICB9IGVsc2UgaWYgKG90aGVyQy5saSAhPT0gdm9pZCAwICYmIG90aGVyQy5sZCAhPT0gdm9pZCAwKSB7XG4gICAgICBpZiAob3RoZXJDLnBbY29tbW9uXSA9PT0gYy5wW2NvbW1vbl0pIHtcbiAgICAgICAgLy8gbm9vcFxuXG4gICAgICAgIGlmICghY29tbW9uT3BlcmFuZCkge1xuICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9IGVsc2UgaWYgKGMubGQgIT09IHZvaWQgMCkge1xuICAgICAgICAgIC8vIHdlJ3JlIHRyeWluZyB0byBkZWxldGUgdGhlIHNhbWUgZWxlbWVudCwgLT4gbm9vcFxuICAgICAgICAgIGlmIChjLmxpICE9PSB2b2lkIDAgJiYgdHlwZSA9PT0gJ2xlZnQnKSB7XG4gICAgICAgICAgICAvLyB3ZSdyZSBib3RoIHJlcGxhY2luZyBvbmUgZWxlbWVudCB3aXRoIGFub3RoZXIuIG9ubHkgb25lIGNhbiBzdXJ2aXZlXG4gICAgICAgICAgICBjLmxkID0gY2xvbmUob3RoZXJDLmxpKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvdGhlckMubGkgIT09IHZvaWQgMCkge1xuICAgICAgaWYgKGMubGkgIT09IHZvaWQgMCAmJiBjLmxkID09PSB1bmRlZmluZWQgJiYgY29tbW9uT3BlcmFuZCAmJiBjLnBbY29tbW9uXSA9PT0gb3RoZXJDLnBbY29tbW9uXSkge1xuICAgICAgICAvLyBpbiBsaSB2cy4gbGksIGxlZnQgd2lucy5cbiAgICAgICAgaWYgKHR5cGUgPT09ICdyaWdodCcpXG4gICAgICAgICAgYy5wW2NvbW1vbl0rKztcbiAgICAgIH0gZWxzZSBpZiAob3RoZXJDLnBbY29tbW9uXSA8PSBjLnBbY29tbW9uXSkge1xuICAgICAgICBjLnBbY29tbW9uXSsrO1xuICAgICAgfVxuXG4gICAgICBpZiAoYy5sbSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGlmIChjb21tb25PcGVyYW5kKSB7XG4gICAgICAgICAgLy8gb3RoZXJDIGVkaXRzIHRoZSBzYW1lIGxpc3Qgd2UgZWRpdFxuICAgICAgICAgIGlmIChvdGhlckMucFtjb21tb25dIDw9IGMubG0pXG4gICAgICAgICAgICBjLmxtKys7XG4gICAgICAgICAgLy8gY2hhbmdpbmcgYy5mcm9tIGlzIGhhbmRsZWQgYWJvdmUuXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG90aGVyQy5sZCAhPT0gdm9pZCAwKSB7XG4gICAgICBpZiAoYy5sbSAhPT0gdm9pZCAwKSB7XG4gICAgICAgIGlmIChjb21tb25PcGVyYW5kKSB7XG4gICAgICAgICAgaWYgKG90aGVyQy5wW2NvbW1vbl0gPT09IGMucFtjb21tb25dKSB7XG4gICAgICAgICAgICAvLyB0aGV5IGRlbGV0ZWQgdGhlIHRoaW5nIHdlJ3JlIHRyeWluZyB0byBtb3ZlXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gb3RoZXJDIGVkaXRzIHRoZSBzYW1lIGxpc3Qgd2UgZWRpdFxuICAgICAgICAgIHZhciBwID0gb3RoZXJDLnBbY29tbW9uXTtcbiAgICAgICAgICB2YXIgZnJvbSA9IGMucFtjb21tb25dO1xuICAgICAgICAgIHZhciB0byA9IGMubG07XG4gICAgICAgICAgaWYgKHAgPCB0byB8fCAocCA9PT0gdG8gJiYgZnJvbSA8IHRvKSlcbiAgICAgICAgICAgIGMubG0tLTtcblxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChvdGhlckMucFtjb21tb25dIDwgYy5wW2NvbW1vbl0pIHtcbiAgICAgICAgYy5wW2NvbW1vbl0tLTtcbiAgICAgIH0gZWxzZSBpZiAob3RoZXJDLnBbY29tbW9uXSA9PT0gYy5wW2NvbW1vbl0pIHtcbiAgICAgICAgaWYgKG90aGVyQ3BsZW5ndGggPCBjcGxlbmd0aCkge1xuICAgICAgICAgIC8vIHdlJ3JlIGJlbG93IHRoZSBkZWxldGVkIGVsZW1lbnQsIHNvIC0+IG5vb3BcbiAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgfSBlbHNlIGlmIChjLmxkICE9PSB2b2lkIDApIHtcbiAgICAgICAgICBpZiAoYy5saSAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgICAvLyB3ZSdyZSByZXBsYWNpbmcsIHRoZXkncmUgZGVsZXRpbmcuIHdlIGJlY29tZSBhbiBpbnNlcnQuXG4gICAgICAgICAgICBkZWxldGUgYy5sZDtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gd2UncmUgdHJ5aW5nIHRvIGRlbGV0ZSB0aGUgc2FtZSBlbGVtZW50LCAtPiBub29wXG4gICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgIH0gZWxzZSBpZiAob3RoZXJDLmxtICE9PSB2b2lkIDApIHtcbiAgICAgIGlmIChjLmxtICE9PSB2b2lkIDAgJiYgY3BsZW5ndGggPT09IG90aGVyQ3BsZW5ndGgpIHtcbiAgICAgICAgLy8gbG0gdnMgbG0sIGhlcmUgd2UgZ28hXG4gICAgICAgIHZhciBmcm9tID0gYy5wW2NvbW1vbl07XG4gICAgICAgIHZhciB0byA9IGMubG07XG4gICAgICAgIHZhciBvdGhlckZyb20gPSBvdGhlckMucFtjb21tb25dO1xuICAgICAgICB2YXIgb3RoZXJUbyA9IG90aGVyQy5sbTtcbiAgICAgICAgaWYgKG90aGVyRnJvbSAhPT0gb3RoZXJUbykge1xuICAgICAgICAgIC8vIGlmIG90aGVyRnJvbSA9PSBvdGhlclRvLCB3ZSBkb24ndCBuZWVkIHRvIGNoYW5nZSBvdXIgb3AuXG5cbiAgICAgICAgICAvLyB3aGVyZSBkaWQgbXkgdGhpbmcgZ28/XG4gICAgICAgICAgaWYgKGZyb20gPT09IG90aGVyRnJvbSkge1xuICAgICAgICAgICAgLy8gdGhleSBtb3ZlZCBpdCEgdGllIGJyZWFrLlxuICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdsZWZ0Jykge1xuICAgICAgICAgICAgICBjLnBbY29tbW9uXSA9IG90aGVyVG87XG4gICAgICAgICAgICAgIGlmIChmcm9tID09PSB0bykgLy8gdWdoXG4gICAgICAgICAgICAgICAgYy5sbSA9IG90aGVyVG87XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXR1cm4gZGVzdDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gdGhleSBtb3ZlZCBhcm91bmQgaXRcbiAgICAgICAgICAgIGlmIChmcm9tID4gb3RoZXJGcm9tKSBjLnBbY29tbW9uXS0tO1xuICAgICAgICAgICAgaWYgKGZyb20gPiBvdGhlclRvKSBjLnBbY29tbW9uXSsrO1xuICAgICAgICAgICAgZWxzZSBpZiAoZnJvbSA9PT0gb3RoZXJUbykge1xuICAgICAgICAgICAgICBpZiAob3RoZXJGcm9tID4gb3RoZXJUbykge1xuICAgICAgICAgICAgICAgIGMucFtjb21tb25dKys7XG4gICAgICAgICAgICAgICAgaWYgKGZyb20gPT09IHRvKSAvLyB1Z2gsIGFnYWluXG4gICAgICAgICAgICAgICAgICBjLmxtKys7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gc3RlcCAyOiB3aGVyZSBhbSBpIGdvaW5nIHRvIHB1dCBpdD9cbiAgICAgICAgICAgIGlmICh0byA+IG90aGVyRnJvbSkge1xuICAgICAgICAgICAgICBjLmxtLS07XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHRvID09PSBvdGhlckZyb20pIHtcbiAgICAgICAgICAgICAgaWYgKHRvID4gZnJvbSlcbiAgICAgICAgICAgICAgICBjLmxtLS07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAodG8gPiBvdGhlclRvKSB7XG4gICAgICAgICAgICAgIGMubG0rKztcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodG8gPT09IG90aGVyVG8pIHtcbiAgICAgICAgICAgICAgLy8gaWYgd2UncmUgYm90aCBtb3ZpbmcgaW4gdGhlIHNhbWUgZGlyZWN0aW9uLCB0aWUgYnJlYWtcbiAgICAgICAgICAgICAgaWYgKChvdGhlclRvID4gb3RoZXJGcm9tICYmIHRvID4gZnJvbSkgfHxcbiAgICAgICAgICAgICAgICAgIChvdGhlclRvIDwgb3RoZXJGcm9tICYmIHRvIDwgZnJvbSkpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZSA9PT0gJ3JpZ2h0JykgYy5sbSsrO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmICh0byA+IGZyb20pIGMubG0rKztcbiAgICAgICAgICAgICAgICBlbHNlIGlmICh0byA9PT0gb3RoZXJGcm9tKSBjLmxtLS07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoYy5saSAhPT0gdm9pZCAwICYmIGMubGQgPT09IHVuZGVmaW5lZCAmJiBjb21tb25PcGVyYW5kKSB7XG4gICAgICAgIC8vIGxpXG4gICAgICAgIHZhciBmcm9tID0gb3RoZXJDLnBbY29tbW9uXTtcbiAgICAgICAgdmFyIHRvID0gb3RoZXJDLmxtO1xuICAgICAgICBwID0gYy5wW2NvbW1vbl07XG4gICAgICAgIGlmIChwID4gZnJvbSkgYy5wW2NvbW1vbl0tLTtcbiAgICAgICAgaWYgKHAgPiB0bykgYy5wW2NvbW1vbl0rKztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIGxkLCBsZCtsaSwgc2ksIHNkLCBuYSwgb2ksIG9kLCBvaStvZCwgYW55IGxpIG9uIGFuIGVsZW1lbnQgYmVuZWF0aFxuICAgICAgICAvLyB0aGUgbG1cbiAgICAgICAgLy9cbiAgICAgICAgLy8gaS5lLiB0aGluZ3MgY2FyZSBhYm91dCB3aGVyZSB0aGVpciBpdGVtIGlzIGFmdGVyIHRoZSBtb3ZlLlxuICAgICAgICB2YXIgZnJvbSA9IG90aGVyQy5wW2NvbW1vbl07XG4gICAgICAgIHZhciB0byA9IG90aGVyQy5sbTtcbiAgICAgICAgcCA9IGMucFtjb21tb25dO1xuICAgICAgICBpZiAocCA9PT0gZnJvbSkge1xuICAgICAgICAgIGMucFtjb21tb25dID0gdG87XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKHAgPiBmcm9tKSBjLnBbY29tbW9uXS0tO1xuICAgICAgICAgIGlmIChwID4gdG8pIGMucFtjb21tb25dKys7XG4gICAgICAgICAgZWxzZSBpZiAocCA9PT0gdG8gJiYgZnJvbSA+IHRvKSBjLnBbY29tbW9uXSsrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2UgaWYgKG90aGVyQy5vaSAhPT0gdm9pZCAwICYmIG90aGVyQy5vZCAhPT0gdm9pZCAwKSB7XG4gICAgICBpZiAoYy5wW2NvbW1vbl0gPT09IG90aGVyQy5wW2NvbW1vbl0pIHtcbiAgICAgICAgaWYgKGMub2kgIT09IHZvaWQgMCAmJiBjb21tb25PcGVyYW5kKSB7XG4gICAgICAgICAgLy8gd2UgaW5zZXJ0ZWQgd2hlcmUgc29tZW9uZSBlbHNlIHJlcGxhY2VkXG4gICAgICAgICAgaWYgKHR5cGUgPT09ICdyaWdodCcpIHtcbiAgICAgICAgICAgIC8vIGxlZnQgd2luc1xuICAgICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIHdlIHdpbiwgbWFrZSBvdXIgb3AgcmVwbGFjZSB3aGF0IHRoZXkgaW5zZXJ0ZWRcbiAgICAgICAgICAgIGMub2QgPSBvdGhlckMub2k7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIC0+IG5vb3AgaWYgdGhlIG90aGVyIGNvbXBvbmVudCBpcyBkZWxldGluZyB0aGUgc2FtZSBvYmplY3QgKG9yIGFueSBwYXJlbnQpXG4gICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKG90aGVyQy5vaSAhPT0gdm9pZCAwKSB7XG4gICAgICBpZiAoYy5vaSAhPT0gdm9pZCAwICYmIGMucFtjb21tb25dID09PSBvdGhlckMucFtjb21tb25dKSB7XG4gICAgICAgIC8vIGxlZnQgd2lucyBpZiB3ZSB0cnkgdG8gaW5zZXJ0IGF0IHRoZSBzYW1lIHBsYWNlXG4gICAgICAgIGlmICh0eXBlID09PSAnbGVmdCcpIHtcbiAgICAgICAgICBqc29uLmFwcGVuZChkZXN0LHtwOiBjLnAsIG9kOm90aGVyQy5vaX0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChvdGhlckMub2QgIT09IHZvaWQgMCkge1xuICAgICAgaWYgKGMucFtjb21tb25dID09IG90aGVyQy5wW2NvbW1vbl0pIHtcbiAgICAgICAgaWYgKCFjb21tb25PcGVyYW5kKVxuICAgICAgICAgIHJldHVybiBkZXN0O1xuICAgICAgICBpZiAoYy5vaSAhPT0gdm9pZCAwKSB7XG4gICAgICAgICAgZGVsZXRlIGMub2Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIGRlc3Q7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBqc29uLmFwcGVuZChkZXN0LGMpO1xuICByZXR1cm4gZGVzdDtcbn07XG5cbnJlcXVpcmUoJy4vYm9vdHN0cmFwVHJhbnNmb3JtJykoanNvbiwganNvbi50cmFuc2Zvcm1Db21wb25lbnQsIGpzb24uY2hlY2tWYWxpZE9wLCBqc29uLmFwcGVuZCk7XG5cbi8qKlxuICogUmVnaXN0ZXIgYSBzdWJ0eXBlIGZvciBzdHJpbmcgb3BlcmF0aW9ucywgdXNpbmcgdGhlIHRleHQwIHR5cGUuXG4gKi9cbnZhciB0ZXh0ID0gcmVxdWlyZSgnLi90ZXh0MCcpO1xuXG5qc29uLnJlZ2lzdGVyU3VidHlwZSh0ZXh0KTtcbm1vZHVsZS5leHBvcnRzID0ganNvbjtcblxuIiwiLy8gREVQUkVDQVRFRCFcbi8vXG4vLyBUaGlzIHR5cGUgd29ya3MsIGJ1dCBpcyBub3QgZXhwb3J0ZWQuIEl0cyBpbmNsdWRlZCBoZXJlIGJlY2F1c2UgdGhlIEpTT04wXG4vLyBlbWJlZGRlZCBzdHJpbmcgb3BlcmF0aW9ucyB1c2UgdGhpcyBsaWJyYXJ5LlxuXG5cbi8vIEEgc2ltcGxlIHRleHQgaW1wbGVtZW50YXRpb25cbi8vXG4vLyBPcGVyYXRpb25zIGFyZSBsaXN0cyBvZiBjb21wb25lbnRzLiBFYWNoIGNvbXBvbmVudCBlaXRoZXIgaW5zZXJ0cyBvciBkZWxldGVzXG4vLyBhdCBhIHNwZWNpZmllZCBwb3NpdGlvbiBpbiB0aGUgZG9jdW1lbnQuXG4vL1xuLy8gQ29tcG9uZW50cyBhcmUgZWl0aGVyOlxuLy8gIHtpOidzdHInLCBwOjEwMH06IEluc2VydCAnc3RyJyBhdCBwb3NpdGlvbiAxMDAgaW4gdGhlIGRvY3VtZW50XG4vLyAge2Q6J3N0cicsIHA6MTAwfTogRGVsZXRlICdzdHInIGF0IHBvc2l0aW9uIDEwMCBpbiB0aGUgZG9jdW1lbnRcbi8vXG4vLyBDb21wb25lbnRzIGluIGFuIG9wZXJhdGlvbiBhcmUgZXhlY3V0ZWQgc2VxdWVudGlhbGx5LCBzbyB0aGUgcG9zaXRpb24gb2YgY29tcG9uZW50c1xuLy8gYXNzdW1lcyBwcmV2aW91cyBjb21wb25lbnRzIGhhdmUgYWxyZWFkeSBleGVjdXRlZC5cbi8vXG4vLyBFZzogVGhpcyBvcDpcbi8vICAgW3tpOidhYmMnLCBwOjB9XVxuLy8gaXMgZXF1aXZhbGVudCB0byB0aGlzIG9wOlxuLy8gICBbe2k6J2EnLCBwOjB9LCB7aTonYicsIHA6MX0sIHtpOidjJywgcDoyfV1cblxudmFyIHRleHQgPSBtb2R1bGUuZXhwb3J0cyA9IHtcbiAgbmFtZTogJ3RleHQwJyxcbiAgdXJpOiAnaHR0cDovL3NoYXJlanMub3JnL3R5cGVzL3RleHR2MCcsXG4gIGNyZWF0ZTogZnVuY3Rpb24oaW5pdGlhbCkge1xuICAgIGlmICgoaW5pdGlhbCAhPSBudWxsKSAmJiB0eXBlb2YgaW5pdGlhbCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignSW5pdGlhbCBkYXRhIG11c3QgYmUgYSBzdHJpbmcnKTtcbiAgICB9XG4gICAgcmV0dXJuIGluaXRpYWwgfHwgJyc7XG4gIH1cbn07XG5cbi8qKiBJbnNlcnQgczIgaW50byBzMSBhdCBwb3MuICovXG52YXIgc3RySW5qZWN0ID0gZnVuY3Rpb24oczEsIHBvcywgczIpIHtcbiAgcmV0dXJuIHMxLnNsaWNlKDAsIHBvcykgKyBzMiArIHMxLnNsaWNlKHBvcyk7XG59O1xuXG4vKiogQ2hlY2sgdGhhdCBhbiBvcGVyYXRpb24gY29tcG9uZW50IGlzIHZhbGlkLiBUaHJvd3MgaWYgaXRzIGludmFsaWQuICovXG52YXIgY2hlY2tWYWxpZENvbXBvbmVudCA9IGZ1bmN0aW9uKGMpIHtcbiAgaWYgKHR5cGVvZiBjLnAgIT09ICdudW1iZXInKVxuICAgIHRocm93IG5ldyBFcnJvcignY29tcG9uZW50IG1pc3NpbmcgcG9zaXRpb24gZmllbGQnKTtcblxuICBpZiAoKHR5cGVvZiBjLmkgPT09ICdzdHJpbmcnKSA9PT0gKHR5cGVvZiBjLmQgPT09ICdzdHJpbmcnKSlcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ2NvbXBvbmVudCBuZWVkcyBhbiBpIG9yIGQgZmllbGQnKTtcblxuICBpZiAoYy5wIDwgMClcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Bvc2l0aW9uIGNhbm5vdCBiZSBuZWdhdGl2ZScpO1xufTtcblxuLyoqIENoZWNrIHRoYXQgYW4gb3BlcmF0aW9uIGlzIHZhbGlkICovXG52YXIgY2hlY2tWYWxpZE9wID0gZnVuY3Rpb24ob3ApIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcC5sZW5ndGg7IGkrKykge1xuICAgIGNoZWNrVmFsaWRDb21wb25lbnQob3BbaV0pO1xuICB9XG59O1xuXG4vKiogQXBwbHkgb3AgdG8gc25hcHNob3QgKi9cbnRleHQuYXBwbHkgPSBmdW5jdGlvbihzbmFwc2hvdCwgb3ApIHtcbiAgdmFyIGRlbGV0ZWQ7XG5cbiAgY2hlY2tWYWxpZE9wKG9wKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcC5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjb21wb25lbnQgPSBvcFtpXTtcbiAgICBpZiAoY29tcG9uZW50LmkgIT0gbnVsbCkge1xuICAgICAgc25hcHNob3QgPSBzdHJJbmplY3Qoc25hcHNob3QsIGNvbXBvbmVudC5wLCBjb21wb25lbnQuaSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGRlbGV0ZWQgPSBzbmFwc2hvdC5zbGljZShjb21wb25lbnQucCwgY29tcG9uZW50LnAgKyBjb21wb25lbnQuZC5sZW5ndGgpO1xuICAgICAgaWYgKGNvbXBvbmVudC5kICE9PSBkZWxldGVkKVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEZWxldGUgY29tcG9uZW50ICdcIiArIGNvbXBvbmVudC5kICsgXCInIGRvZXMgbm90IG1hdGNoIGRlbGV0ZWQgdGV4dCAnXCIgKyBkZWxldGVkICsgXCInXCIpO1xuXG4gICAgICBzbmFwc2hvdCA9IHNuYXBzaG90LnNsaWNlKDAsIGNvbXBvbmVudC5wKSArIHNuYXBzaG90LnNsaWNlKGNvbXBvbmVudC5wICsgY29tcG9uZW50LmQubGVuZ3RoKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNuYXBzaG90O1xufTtcblxuLyoqXG4gKiBBcHBlbmQgYSBjb21wb25lbnQgdG8gdGhlIGVuZCBvZiBuZXdPcC4gRXhwb3J0ZWQgZm9yIHVzZSBieSB0aGUgcmFuZG9tIG9wXG4gKiBnZW5lcmF0b3IgYW5kIHRoZSBKU09OMCB0eXBlLlxuICovXG52YXIgYXBwZW5kID0gdGV4dC5fYXBwZW5kID0gZnVuY3Rpb24obmV3T3AsIGMpIHtcbiAgaWYgKGMuaSA9PT0gJycgfHwgYy5kID09PSAnJykgcmV0dXJuO1xuXG4gIGlmIChuZXdPcC5sZW5ndGggPT09IDApIHtcbiAgICBuZXdPcC5wdXNoKGMpO1xuICB9IGVsc2Uge1xuICAgIHZhciBsYXN0ID0gbmV3T3BbbmV3T3AubGVuZ3RoIC0gMV07XG5cbiAgICBpZiAobGFzdC5pICE9IG51bGwgJiYgYy5pICE9IG51bGwgJiYgbGFzdC5wIDw9IGMucCAmJiBjLnAgPD0gbGFzdC5wICsgbGFzdC5pLmxlbmd0aCkge1xuICAgICAgLy8gQ29tcG9zZSB0aGUgaW5zZXJ0IGludG8gdGhlIHByZXZpb3VzIGluc2VydFxuICAgICAgbmV3T3BbbmV3T3AubGVuZ3RoIC0gMV0gPSB7aTpzdHJJbmplY3QobGFzdC5pLCBjLnAgLSBsYXN0LnAsIGMuaSksIHA6bGFzdC5wfTtcblxuICAgIH0gZWxzZSBpZiAobGFzdC5kICE9IG51bGwgJiYgYy5kICE9IG51bGwgJiYgYy5wIDw9IGxhc3QucCAmJiBsYXN0LnAgPD0gYy5wICsgYy5kLmxlbmd0aCkge1xuICAgICAgLy8gQ29tcG9zZSB0aGUgZGVsZXRlcyB0b2dldGhlclxuICAgICAgbmV3T3BbbmV3T3AubGVuZ3RoIC0gMV0gPSB7ZDpzdHJJbmplY3QoYy5kLCBsYXN0LnAgLSBjLnAsIGxhc3QuZCksIHA6Yy5wfTtcblxuICAgIH0gZWxzZSB7XG4gICAgICBuZXdPcC5wdXNoKGMpO1xuICAgIH1cbiAgfVxufTtcblxuLyoqIENvbXBvc2Ugb3AxIGFuZCBvcDIgdG9nZXRoZXIgKi9cbnRleHQuY29tcG9zZSA9IGZ1bmN0aW9uKG9wMSwgb3AyKSB7XG4gIGNoZWNrVmFsaWRPcChvcDEpO1xuICBjaGVja1ZhbGlkT3Aob3AyKTtcbiAgdmFyIG5ld09wID0gb3AxLnNsaWNlKCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3AyLmxlbmd0aDsgaSsrKSB7XG4gICAgYXBwZW5kKG5ld09wLCBvcDJbaV0pO1xuICB9XG4gIHJldHVybiBuZXdPcDtcbn07XG5cbi8qKiBDbGVhbiB1cCBhbiBvcCAqL1xudGV4dC5ub3JtYWxpemUgPSBmdW5jdGlvbihvcCkge1xuICB2YXIgbmV3T3AgPSBbXTtcblxuICAvLyBOb3JtYWxpemUgc2hvdWxkIGFsbG93IG9wcyB3aGljaCBhcmUgYSBzaW5nbGUgKHVud3JhcHBlZCkgY29tcG9uZW50OlxuICAvLyB7aTonYXNkZicsIHA6MjN9LlxuICAvLyBUaGVyZSdzIG5vIGdvb2Qgd2F5IHRvIHRlc3QgaWYgc29tZXRoaW5nIGlzIGFuIGFycmF5OlxuICAvLyBodHRwOi8vcGVyZmVjdGlvbmtpbGxzLmNvbS9pbnN0YW5jZW9mLWNvbnNpZGVyZWQtaGFybWZ1bC1vci1ob3ctdG8td3JpdGUtYS1yb2J1c3QtaXNhcnJheS9cbiAgLy8gc28gdGhpcyBpcyBwcm9iYWJseSB0aGUgbGVhc3QgYmFkIHNvbHV0aW9uLlxuICBpZiAob3AuaSAhPSBudWxsIHx8IG9wLnAgIT0gbnVsbCkgb3AgPSBbb3BdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3AubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgYyA9IG9wW2ldO1xuICAgIGlmIChjLnAgPT0gbnVsbCkgYy5wID0gMDtcblxuICAgIGFwcGVuZChuZXdPcCwgYyk7XG4gIH1cblxuICByZXR1cm4gbmV3T3A7XG59O1xuXG4vLyBUaGlzIGhlbHBlciBtZXRob2QgdHJhbnNmb3JtcyBhIHBvc2l0aW9uIGJ5IGFuIG9wIGNvbXBvbmVudC5cbi8vXG4vLyBJZiBjIGlzIGFuIGluc2VydCwgaW5zZXJ0QWZ0ZXIgc3BlY2lmaWVzIHdoZXRoZXIgdGhlIHRyYW5zZm9ybVxuLy8gaXMgcHVzaGVkIGFmdGVyIHRoZSBpbnNlcnQgKHRydWUpIG9yIGJlZm9yZSBpdCAoZmFsc2UpLlxuLy9cbi8vIGluc2VydEFmdGVyIGlzIG9wdGlvbmFsIGZvciBkZWxldGVzLlxudmFyIHRyYW5zZm9ybVBvc2l0aW9uID0gZnVuY3Rpb24ocG9zLCBjLCBpbnNlcnRBZnRlcikge1xuICAvLyBUaGlzIHdpbGwgZ2V0IGNvbGxhcHNlZCBpbnRvIGEgZ2lhbnQgdGVybmFyeSBieSB1Z2xpZnkuXG4gIGlmIChjLmkgIT0gbnVsbCkge1xuICAgIGlmIChjLnAgPCBwb3MgfHwgKGMucCA9PT0gcG9zICYmIGluc2VydEFmdGVyKSkge1xuICAgICAgcmV0dXJuIHBvcyArIGMuaS5sZW5ndGg7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwb3M7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vIEkgdGhpbmsgdGhpcyBjb3VsZCBhbHNvIGJlIHdyaXR0ZW4gYXM6IE1hdGgubWluKGMucCwgTWF0aC5taW4oYy5wIC1cbiAgICAvLyBvdGhlckMucCwgb3RoZXJDLmQubGVuZ3RoKSkgYnV0IEkgdGhpbmsgaXRzIGhhcmRlciB0byByZWFkIHRoYXQgd2F5LCBhbmRcbiAgICAvLyBpdCBjb21waWxlcyB1c2luZyB0ZXJuYXJ5IG9wZXJhdG9ycyBhbnl3YXkgc28gaXRzIG5vIHNsb3dlciB3cml0dGVuIGxpa2VcbiAgICAvLyB0aGlzLlxuICAgIGlmIChwb3MgPD0gYy5wKSB7XG4gICAgICByZXR1cm4gcG9zO1xuICAgIH0gZWxzZSBpZiAocG9zIDw9IGMucCArIGMuZC5sZW5ndGgpIHtcbiAgICAgIHJldHVybiBjLnA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBwb3MgLSBjLmQubGVuZ3RoO1xuICAgIH1cbiAgfVxufTtcblxuLy8gSGVscGVyIG1ldGhvZCB0byB0cmFuc2Zvcm0gYSBjdXJzb3IgcG9zaXRpb24gYXMgYSByZXN1bHQgb2YgYW4gb3AuXG4vL1xuLy8gTGlrZSB0cmFuc2Zvcm1Qb3NpdGlvbiBhYm92ZSwgaWYgYyBpcyBhbiBpbnNlcnQsIGluc2VydEFmdGVyIHNwZWNpZmllc1xuLy8gd2hldGhlciB0aGUgY3Vyc29yIHBvc2l0aW9uIGlzIHB1c2hlZCBhZnRlciBhbiBpbnNlcnQgKHRydWUpIG9yIGJlZm9yZSBpdFxuLy8gKGZhbHNlKS5cbnRleHQudHJhbnNmb3JtQ3Vyc29yID0gZnVuY3Rpb24ocG9zaXRpb24sIG9wLCBzaWRlKSB7XG4gIHZhciBpbnNlcnRBZnRlciA9IHNpZGUgPT09ICdyaWdodCc7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3AubGVuZ3RoOyBpKyspIHtcbiAgICBwb3NpdGlvbiA9IHRyYW5zZm9ybVBvc2l0aW9uKHBvc2l0aW9uLCBvcFtpXSwgaW5zZXJ0QWZ0ZXIpO1xuICB9XG5cbiAgcmV0dXJuIHBvc2l0aW9uO1xufTtcblxuLy8gVHJhbnNmb3JtIGFuIG9wIGNvbXBvbmVudCBieSBhbm90aGVyIG9wIGNvbXBvbmVudC4gQXN5bW1ldHJpYy5cbi8vIFRoZSByZXN1bHQgd2lsbCBiZSBhcHBlbmRlZCB0byBkZXN0aW5hdGlvbi5cbi8vXG4vLyBleHBvcnRlZCBmb3IgdXNlIGluIEpTT04gdHlwZVxudmFyIHRyYW5zZm9ybUNvbXBvbmVudCA9IHRleHQuX3RjID0gZnVuY3Rpb24oZGVzdCwgYywgb3RoZXJDLCBzaWRlKSB7XG4gIC8vdmFyIGNJbnRlcnNlY3QsIGludGVyc2VjdEVuZCwgaW50ZXJzZWN0U3RhcnQsIG5ld0MsIG90aGVySW50ZXJzZWN0LCBzO1xuXG4gIGNoZWNrVmFsaWRDb21wb25lbnQoYyk7XG4gIGNoZWNrVmFsaWRDb21wb25lbnQob3RoZXJDKTtcblxuICBpZiAoYy5pICE9IG51bGwpIHtcbiAgICAvLyBJbnNlcnQuXG4gICAgYXBwZW5kKGRlc3QsIHtpOmMuaSwgcDp0cmFuc2Zvcm1Qb3NpdGlvbihjLnAsIG90aGVyQywgc2lkZSA9PT0gJ3JpZ2h0Jyl9KTtcbiAgfSBlbHNlIHtcbiAgICAvLyBEZWxldGVcbiAgICBpZiAob3RoZXJDLmkgIT0gbnVsbCkge1xuICAgICAgLy8gRGVsZXRlIHZzIGluc2VydFxuICAgICAgdmFyIHMgPSBjLmQ7XG4gICAgICBpZiAoYy5wIDwgb3RoZXJDLnApIHtcbiAgICAgICAgYXBwZW5kKGRlc3QsIHtkOnMuc2xpY2UoMCwgb3RoZXJDLnAgLSBjLnApLCBwOmMucH0pO1xuICAgICAgICBzID0gcy5zbGljZShvdGhlckMucCAtIGMucCk7XG4gICAgICB9XG4gICAgICBpZiAocyAhPT0gJycpXG4gICAgICAgIGFwcGVuZChkZXN0LCB7ZDogcywgcDogYy5wICsgb3RoZXJDLmkubGVuZ3RofSk7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gRGVsZXRlIHZzIGRlbGV0ZVxuICAgICAgaWYgKGMucCA+PSBvdGhlckMucCArIG90aGVyQy5kLmxlbmd0aClcbiAgICAgICAgYXBwZW5kKGRlc3QsIHtkOiBjLmQsIHA6IGMucCAtIG90aGVyQy5kLmxlbmd0aH0pO1xuICAgICAgZWxzZSBpZiAoYy5wICsgYy5kLmxlbmd0aCA8PSBvdGhlckMucClcbiAgICAgICAgYXBwZW5kKGRlc3QsIGMpO1xuICAgICAgZWxzZSB7XG4gICAgICAgIC8vIFRoZXkgb3ZlcmxhcCBzb21ld2hlcmUuXG4gICAgICAgIHZhciBuZXdDID0ge2Q6ICcnLCBwOiBjLnB9O1xuXG4gICAgICAgIGlmIChjLnAgPCBvdGhlckMucClcbiAgICAgICAgICBuZXdDLmQgPSBjLmQuc2xpY2UoMCwgb3RoZXJDLnAgLSBjLnApO1xuXG4gICAgICAgIGlmIChjLnAgKyBjLmQubGVuZ3RoID4gb3RoZXJDLnAgKyBvdGhlckMuZC5sZW5ndGgpXG4gICAgICAgICAgbmV3Qy5kICs9IGMuZC5zbGljZShvdGhlckMucCArIG90aGVyQy5kLmxlbmd0aCAtIGMucCk7XG5cbiAgICAgICAgLy8gVGhpcyBpcyBlbnRpcmVseSBvcHRpb25hbCAtIEknbSBqdXN0IGNoZWNraW5nIHRoZSBkZWxldGVkIHRleHQgaW5cbiAgICAgICAgLy8gdGhlIHR3byBvcHMgbWF0Y2hlc1xuICAgICAgICB2YXIgaW50ZXJzZWN0U3RhcnQgPSBNYXRoLm1heChjLnAsIG90aGVyQy5wKTtcbiAgICAgICAgdmFyIGludGVyc2VjdEVuZCA9IE1hdGgubWluKGMucCArIGMuZC5sZW5ndGgsIG90aGVyQy5wICsgb3RoZXJDLmQubGVuZ3RoKTtcbiAgICAgICAgdmFyIGNJbnRlcnNlY3QgPSBjLmQuc2xpY2UoaW50ZXJzZWN0U3RhcnQgLSBjLnAsIGludGVyc2VjdEVuZCAtIGMucCk7XG4gICAgICAgIHZhciBvdGhlckludGVyc2VjdCA9IG90aGVyQy5kLnNsaWNlKGludGVyc2VjdFN0YXJ0IC0gb3RoZXJDLnAsIGludGVyc2VjdEVuZCAtIG90aGVyQy5wKTtcbiAgICAgICAgaWYgKGNJbnRlcnNlY3QgIT09IG90aGVySW50ZXJzZWN0KVxuICAgICAgICAgIHRocm93IG5ldyBFcnJvcignRGVsZXRlIG9wcyBkZWxldGUgZGlmZmVyZW50IHRleHQgaW4gdGhlIHNhbWUgcmVnaW9uIG9mIHRoZSBkb2N1bWVudCcpO1xuXG4gICAgICAgIGlmIChuZXdDLmQgIT09ICcnKSB7XG4gICAgICAgICAgbmV3Qy5wID0gdHJhbnNmb3JtUG9zaXRpb24obmV3Qy5wLCBvdGhlckMpO1xuICAgICAgICAgIGFwcGVuZChkZXN0LCBuZXdDKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBkZXN0O1xufTtcblxudmFyIGludmVydENvbXBvbmVudCA9IGZ1bmN0aW9uKGMpIHtcbiAgcmV0dXJuIChjLmkgIT0gbnVsbCkgPyB7ZDpjLmksIHA6Yy5wfSA6IHtpOmMuZCwgcDpjLnB9O1xufTtcblxuLy8gTm8gbmVlZCB0byB1c2UgYXBwZW5kIGZvciBpbnZlcnQsIGJlY2F1c2UgdGhlIGNvbXBvbmVudHMgd29uJ3QgYmUgYWJsZSB0b1xuLy8gY2FuY2VsIG9uZSBhbm90aGVyLlxudGV4dC5pbnZlcnQgPSBmdW5jdGlvbihvcCkge1xuICAvLyBTaGFsbG93IGNvcHkgJiByZXZlcnNlIHRoYXQgc3Vja2EuXG4gIG9wID0gb3Auc2xpY2UoKS5yZXZlcnNlKCk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3AubGVuZ3RoOyBpKyspIHtcbiAgICBvcFtpXSA9IGludmVydENvbXBvbmVudChvcFtpXSk7XG4gIH1cbiAgcmV0dXJuIG9wO1xufTtcblxucmVxdWlyZSgnLi9ib290c3RyYXBUcmFuc2Zvcm0nKSh0ZXh0LCB0cmFuc2Zvcm1Db21wb25lbnQsIGNoZWNrVmFsaWRPcCwgYXBwZW5kKTtcbiIsIi8vIHNoaW0gZm9yIHVzaW5nIHByb2Nlc3MgaW4gYnJvd3NlclxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xuXG4vLyBjYWNoZWQgZnJvbSB3aGF0ZXZlciBnbG9iYWwgaXMgcHJlc2VudCBzbyB0aGF0IHRlc3QgcnVubmVycyB0aGF0IHN0dWIgaXRcbi8vIGRvbid0IGJyZWFrIHRoaW5ncy4gIEJ1dCB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0cnkgY2F0Y2ggaW4gY2FzZSBpdCBpc1xuLy8gd3JhcHBlZCBpbiBzdHJpY3QgbW9kZSBjb2RlIHdoaWNoIGRvZXNuJ3QgZGVmaW5lIGFueSBnbG9iYWxzLiAgSXQncyBpbnNpZGUgYVxuLy8gZnVuY3Rpb24gYmVjYXVzZSB0cnkvY2F0Y2hlcyBkZW9wdGltaXplIGluIGNlcnRhaW4gZW5naW5lcy5cblxudmFyIGNhY2hlZFNldFRpbWVvdXQ7XG52YXIgY2FjaGVkQ2xlYXJUaW1lb3V0O1xuXG5mdW5jdGlvbiBkZWZhdWx0U2V0VGltb3V0KCkge1xuICAgIHRocm93IG5ldyBFcnJvcignc2V0VGltZW91dCBoYXMgbm90IGJlZW4gZGVmaW5lZCcpO1xufVxuZnVuY3Rpb24gZGVmYXVsdENsZWFyVGltZW91dCAoKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdjbGVhclRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbihmdW5jdGlvbiAoKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBzZXRUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBkZWZhdWx0U2V0VGltb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgaWYgKHR5cGVvZiBjbGVhclRpbWVvdXQgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgICAgIH1cbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGRlZmF1bHRDbGVhclRpbWVvdXQ7XG4gICAgfVxufSAoKSlcbmZ1bmN0aW9uIHJ1blRpbWVvdXQoZnVuKSB7XG4gICAgaWYgKGNhY2hlZFNldFRpbWVvdXQgPT09IHNldFRpbWVvdXQpIHtcbiAgICAgICAgLy9ub3JtYWwgZW52aXJvbWVudHMgaW4gc2FuZSBzaXR1YXRpb25zXG4gICAgICAgIHJldHVybiBzZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfVxuICAgIC8vIGlmIHNldFRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRTZXRUaW1lb3V0ID09PSBkZWZhdWx0U2V0VGltb3V0IHx8ICFjYWNoZWRTZXRUaW1lb3V0KSAmJiBzZXRUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZFNldFRpbWVvdXQgPSBzZXRUaW1lb3V0O1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0KGZ1biwgMCk7XG4gICAgfSBjYXRjaChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZFNldFRpbWVvdXQuY2FsbChudWxsLCBmdW4sIDApO1xuICAgICAgICB9IGNhdGNoKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3JcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwodGhpcywgZnVuLCAwKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG59XG5mdW5jdGlvbiBydW5DbGVhclRpbWVvdXQobWFya2VyKSB7XG4gICAgaWYgKGNhY2hlZENsZWFyVGltZW91dCA9PT0gY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIC8vIGlmIGNsZWFyVGltZW91dCB3YXNuJ3QgYXZhaWxhYmxlIGJ1dCB3YXMgbGF0dGVyIGRlZmluZWRcbiAgICBpZiAoKGNhY2hlZENsZWFyVGltZW91dCA9PT0gZGVmYXVsdENsZWFyVGltZW91dCB8fCAhY2FjaGVkQ2xlYXJUaW1lb3V0KSAmJiBjbGVhclRpbWVvdXQpIHtcbiAgICAgICAgY2FjaGVkQ2xlYXJUaW1lb3V0ID0gY2xlYXJUaW1lb3V0O1xuICAgICAgICByZXR1cm4gY2xlYXJUaW1lb3V0KG1hcmtlcik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIC8vIHdoZW4gd2hlbiBzb21lYm9keSBoYXMgc2NyZXdlZCB3aXRoIHNldFRpbWVvdXQgYnV0IG5vIEkuRS4gbWFkZG5lc3NcbiAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgLy8gV2hlbiB3ZSBhcmUgaW4gSS5FLiBidXQgdGhlIHNjcmlwdCBoYXMgYmVlbiBldmFsZWQgc28gSS5FLiBkb2Vzbid0ICB0cnVzdCB0aGUgZ2xvYmFsIG9iamVjdCB3aGVuIGNhbGxlZCBub3JtYWxseVxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKG51bGwsIG1hcmtlcik7XG4gICAgICAgIH0gY2F0Y2ggKGUpe1xuICAgICAgICAgICAgLy8gc2FtZSBhcyBhYm92ZSBidXQgd2hlbiBpdCdzIGEgdmVyc2lvbiBvZiBJLkUuIHRoYXQgbXVzdCBoYXZlIHRoZSBnbG9iYWwgb2JqZWN0IGZvciAndGhpcycsIGhvcGZ1bGx5IG91ciBjb250ZXh0IGNvcnJlY3Qgb3RoZXJ3aXNlIGl0IHdpbGwgdGhyb3cgYSBnbG9iYWwgZXJyb3IuXG4gICAgICAgICAgICAvLyBTb21lIHZlcnNpb25zIG9mIEkuRS4gaGF2ZSBkaWZmZXJlbnQgcnVsZXMgZm9yIGNsZWFyVGltZW91dCB2cyBzZXRUaW1lb3V0XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkQ2xlYXJUaW1lb3V0LmNhbGwodGhpcywgbWFya2VyKTtcbiAgICAgICAgfVxuICAgIH1cblxuXG5cbn1cbnZhciBxdWV1ZSA9IFtdO1xudmFyIGRyYWluaW5nID0gZmFsc2U7XG52YXIgY3VycmVudFF1ZXVlO1xudmFyIHF1ZXVlSW5kZXggPSAtMTtcblxuZnVuY3Rpb24gY2xlYW5VcE5leHRUaWNrKCkge1xuICAgIGlmICghZHJhaW5pbmcgfHwgIWN1cnJlbnRRdWV1ZSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgaWYgKGN1cnJlbnRRdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgcXVldWUgPSBjdXJyZW50UXVldWUuY29uY2F0KHF1ZXVlKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgfVxuICAgIGlmIChxdWV1ZS5sZW5ndGgpIHtcbiAgICAgICAgZHJhaW5RdWV1ZSgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZHJhaW5RdWV1ZSgpIHtcbiAgICBpZiAoZHJhaW5pbmcpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB2YXIgdGltZW91dCA9IHJ1blRpbWVvdXQoY2xlYW5VcE5leHRUaWNrKTtcbiAgICBkcmFpbmluZyA9IHRydWU7XG5cbiAgICB2YXIgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIHdoaWxlKGxlbikge1xuICAgICAgICBjdXJyZW50UXVldWUgPSBxdWV1ZTtcbiAgICAgICAgcXVldWUgPSBbXTtcbiAgICAgICAgd2hpbGUgKCsrcXVldWVJbmRleCA8IGxlbikge1xuICAgICAgICAgICAgaWYgKGN1cnJlbnRRdWV1ZSkge1xuICAgICAgICAgICAgICAgIGN1cnJlbnRRdWV1ZVtxdWV1ZUluZGV4XS5ydW4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBxdWV1ZUluZGV4ID0gLTE7XG4gICAgICAgIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB9XG4gICAgY3VycmVudFF1ZXVlID0gbnVsbDtcbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIHJ1bkNsZWFyVGltZW91dCh0aW1lb3V0KTtcbn1cblxucHJvY2Vzcy5uZXh0VGljayA9IGZ1bmN0aW9uIChmdW4pIHtcbiAgICB2YXIgYXJncyA9IG5ldyBBcnJheShhcmd1bWVudHMubGVuZ3RoIC0gMSk7XG4gICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBxdWV1ZS5wdXNoKG5ldyBJdGVtKGZ1biwgYXJncykpO1xuICAgIGlmIChxdWV1ZS5sZW5ndGggPT09IDEgJiYgIWRyYWluaW5nKSB7XG4gICAgICAgIHJ1blRpbWVvdXQoZHJhaW5RdWV1ZSk7XG4gICAgfVxufTtcblxuLy8gdjggbGlrZXMgcHJlZGljdGlibGUgb2JqZWN0c1xuZnVuY3Rpb24gSXRlbShmdW4sIGFycmF5KSB7XG4gICAgdGhpcy5mdW4gPSBmdW47XG4gICAgdGhpcy5hcnJheSA9IGFycmF5O1xufVxuSXRlbS5wcm90b3R5cGUucnVuID0gZnVuY3Rpb24gKCkge1xuICAgIHRoaXMuZnVuLmFwcGx5KG51bGwsIHRoaXMuYXJyYXkpO1xufTtcbnByb2Nlc3MudGl0bGUgPSAnYnJvd3Nlcic7XG5wcm9jZXNzLmJyb3dzZXIgPSB0cnVlO1xucHJvY2Vzcy5lbnYgPSB7fTtcbnByb2Nlc3MuYXJndiA9IFtdO1xucHJvY2Vzcy52ZXJzaW9uID0gJyc7IC8vIGVtcHR5IHN0cmluZyB0byBhdm9pZCByZWdleHAgaXNzdWVzXG5wcm9jZXNzLnZlcnNpb25zID0ge307XG5cbmZ1bmN0aW9uIG5vb3AoKSB7fVxuXG5wcm9jZXNzLm9uID0gbm9vcDtcbnByb2Nlc3MuYWRkTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5vbmNlID0gbm9vcDtcbnByb2Nlc3Mub2ZmID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlTGlzdGVuZXIgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVBbGxMaXN0ZW5lcnMgPSBub29wO1xucHJvY2Vzcy5lbWl0ID0gbm9vcDtcblxucHJvY2Vzcy5iaW5kaW5nID0gZnVuY3Rpb24gKG5hbWUpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuYmluZGluZyBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xuXG5wcm9jZXNzLmN3ZCA9IGZ1bmN0aW9uICgpIHsgcmV0dXJuICcvJyB9O1xucHJvY2Vzcy5jaGRpciA9IGZ1bmN0aW9uIChkaXIpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3Byb2Nlc3MuY2hkaXIgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcbnByb2Nlc3MudW1hc2sgPSBmdW5jdGlvbigpIHsgcmV0dXJuIDA7IH07XG4iLCJnbG9iYWwuc2hhcmVkYj1yZXF1aXJlKFwiLi4vc2VydmVyL3ZlbmRvci9zaGFyZWRiL2xpYi9jbGllbnRcIilcbiIsInZhciBEb2MgPSByZXF1aXJlKCcuL2RvYycpO1xudmFyIFF1ZXJ5ID0gcmVxdWlyZSgnLi9xdWVyeScpO1xudmFyIGVtaXR0ZXIgPSByZXF1aXJlKCcuLi9lbWl0dGVyJyk7XG52YXIgU2hhcmVEQkVycm9yID0gcmVxdWlyZSgnLi4vZXJyb3InKTtcbnZhciB0eXBlcyA9IHJlcXVpcmUoJy4uL3R5cGVzJyk7XG52YXIgdXRpbCA9IHJlcXVpcmUoJy4uL3V0aWwnKTtcblxuLyoqXG4gKiBIYW5kbGVzIGNvbW11bmljYXRpb24gd2l0aCB0aGUgc2hhcmVqcyBzZXJ2ZXIgYW5kIHByb3ZpZGVzIHF1ZXJpZXMgYW5kXG4gKiBkb2N1bWVudHMuXG4gKlxuICogV2UgY3JlYXRlIGEgY29ubmVjdGlvbiB3aXRoIGEgc29ja2V0IG9iamVjdFxuICogICBjb25uZWN0aW9uID0gbmV3IHNoYXJlanMuQ29ubmVjdGlvbihzb2Nrc2V0KVxuICogVGhlIHNvY2tldCBtYXkgYmUgYW55IG9iamVjdCBoYW5kbGluZyB0aGUgd2Vic29ja2V0IHByb3RvY29sLiBTZWUgdGhlXG4gKiBkb2N1bWVudGF0aW9uIG9mIGJpbmRUb1NvY2tldCgpIGZvciBkZXRhaWxzLiBXZSB0aGVuIHdhaXQgZm9yIHRoZSBjb25uZWN0aW9uXG4gKiB0byBjb25uZWN0XG4gKiAgIGNvbm5lY3Rpb24ub24oJ2Nvbm5lY3RlZCcsIC4uLilcbiAqIGFuZCBhcmUgZmluYWxseSBhYmxlIHRvIHdvcmsgd2l0aCBzaGFyZWQgZG9jdW1lbnRzXG4gKiAgIGNvbm5lY3Rpb24uZ2V0KCdmb29kJywgJ3N0ZWFrJykgLy8gRG9jXG4gKlxuICogQHBhcmFtIHNvY2tldCBAc2VlIGJpbmRUb1NvY2tldFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IENvbm5lY3Rpb247XG5mdW5jdGlvbiBDb25uZWN0aW9uKHNvY2tldCkge1xuICBlbWl0dGVyLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIC8vIE1hcCBvZiBjb2xsZWN0aW9uIC0+IGlkIC0+IGRvYyBvYmplY3QgZm9yIGNyZWF0ZWQgZG9jdW1lbnRzLlxuICAvLyAoY3JlYXRlZCBkb2N1bWVudHMgTVVTVCBCRSBVTklRVUUpXG4gIHRoaXMuY29sbGVjdGlvbnMgPSB7fTtcblxuICAvLyBFYWNoIHF1ZXJ5IGlzIGNyZWF0ZWQgd2l0aCBhbiBpZCB0aGF0IHRoZSBzZXJ2ZXIgdXNlcyB3aGVuIGl0IHNlbmRzIHVzXG4gIC8vIGluZm8gYWJvdXQgdGhlIHF1ZXJ5ICh1cGRhdGVzLCBldGMpXG4gIHRoaXMubmV4dFF1ZXJ5SWQgPSAxO1xuXG4gIC8vIE1hcCBmcm9tIHF1ZXJ5IElEIC0+IHF1ZXJ5IG9iamVjdC5cbiAgdGhpcy5xdWVyaWVzID0ge307XG5cbiAgLy8gQSB1bmlxdWUgbWVzc2FnZSBudW1iZXIgZm9yIHRoZSBnaXZlbiBpZFxuICB0aGlzLnNlcSA9IDE7XG5cbiAgLy8gRXF1YWxzIGFnZW50LmNsaWVudElkIG9uIHRoZSBzZXJ2ZXJcbiAgdGhpcy5pZCA9IG51bGw7XG5cbiAgLy8gVGhpcyBkaXJlY3QgcmVmZXJlbmNlIGZyb20gY29ubmVjdGlvbiB0byBhZ2VudCBpcyBub3QgdXNlZCBpbnRlcm5hbCB0b1xuICAvLyBTaGFyZURCLCBidXQgaXQgaXMgaGFuZHkgZm9yIHNlcnZlci1zaWRlIG9ubHkgdXNlciBjb2RlIHRoYXQgbWF5IGNhY2hlXG4gIC8vIHN0YXRlIG9uIHRoZSBhZ2VudCBhbmQgcmVhZCBpdCBpbiBtaWRkbGV3YXJlXG4gIHRoaXMuYWdlbnQgPSBudWxsO1xuXG4gIHRoaXMuZGVidWcgPSB0cnVlO1xuXG4gIHRoaXMuYmluZFRvU29ja2V0KHNvY2tldCk7XG59XG5lbWl0dGVyLm1peGluKENvbm5lY3Rpb24pO1xuXG5cbi8qKlxuICogVXNlIHNvY2tldCB0byBjb21tdW5pY2F0ZSB3aXRoIHNlcnZlclxuICpcbiAqIFNvY2tldCBpcyBhbiBvYmplY3QgdGhhdCBjYW4gaGFuZGxlIHRoZSB3ZWJzb2NrZXQgcHJvdG9jb2wuIFRoaXMgbWV0aG9kXG4gKiBpbnN0YWxscyB0aGUgb25vcGVuLCBvbmNsb3NlLCBvbm1lc3NhZ2UgYW5kIG9uZXJyb3IgaGFuZGxlcnMgb24gdGhlIHNvY2tldCB0b1xuICogaGFuZGxlIGNvbW11bmljYXRpb24gYW5kIHNlbmRzIG1lc3NhZ2VzIGJ5IGNhbGxpbmcgc29ja2V0LnNlbmQobWVzc2FnZSkuIFRoZVxuICogc29ja2V0cyBgcmVhZHlTdGF0ZWAgcHJvcGVydHkgaXMgdXNlZCB0byBkZXRlcm1pbmUgdGhlIGluaXRhaWFsIHN0YXRlLlxuICpcbiAqIEBwYXJhbSBzb2NrZXQgSGFuZGxlcyB0aGUgd2Vic29ja2V0IHByb3RvY29sXG4gKiBAcGFyYW0gc29ja2V0LnJlYWR5U3RhdGVcbiAqIEBwYXJhbSBzb2NrZXQuY2xvc2VcbiAqIEBwYXJhbSBzb2NrZXQuc2VuZFxuICogQHBhcmFtIHNvY2tldC5vbm9wZW5cbiAqIEBwYXJhbSBzb2NrZXQub25jbG9zZVxuICogQHBhcmFtIHNvY2tldC5vbm1lc3NhZ2VcbiAqIEBwYXJhbSBzb2NrZXQub25lcnJvclxuICovXG5Db25uZWN0aW9uLnByb3RvdHlwZS5iaW5kVG9Tb2NrZXQgPSBmdW5jdGlvbihzb2NrZXQpIHtcbiAgaWYgKHRoaXMuc29ja2V0KSB7XG4gICAgdGhpcy5zb2NrZXQuY2xvc2UoKTtcbiAgICB0aGlzLnNvY2tldC5vbm1lc3NhZ2UgPSBudWxsO1xuICAgIHRoaXMuc29ja2V0Lm9ub3BlbiA9IG51bGw7XG4gICAgdGhpcy5zb2NrZXQub25lcnJvciA9IG51bGw7XG4gICAgdGhpcy5zb2NrZXQub25jbG9zZSA9IG51bGw7XG4gIH1cblxuICB0aGlzLnNvY2tldCA9IHNvY2tldDtcblxuICAvLyBTdGF0ZSBvZiB0aGUgY29ubmVjdGlvbi4gVGhlIGNvcnJlc3BvZGluZyBldmVudHMgYXJlIGVtbWl0ZWQgd2hlbiB0aGlzIGNoYW5nZXNcbiAgLy9cbiAgLy8gLSAnY29ubmVjdGluZycgICBUaGUgY29ubmVjdGlvbiBpcyBzdGlsbCBiZWluZyBlc3RhYmxpc2hlZCwgb3Igd2UgYXJlIHN0aWxsXG4gIC8vICAgICAgICAgICAgICAgICAgICB3YWl0aW5nIG9uIHRoZSBzZXJ2ZXIgdG8gc2VuZCB1cyB0aGUgaW5pdGlhbGl6YXRpb24gbWVzc2FnZVxuICAvLyAtICdjb25uZWN0ZWQnICAgIFRoZSBjb25uZWN0aW9uIGlzIG9wZW4gYW5kIHdlIGhhdmUgY29ubmVjdGVkIHRvIGEgc2VydmVyXG4gIC8vICAgICAgICAgICAgICAgICAgICBhbmQgcmVjaWV2ZWQgdGhlIGluaXRpYWxpemF0aW9uIG1lc3NhZ2VcbiAgLy8gLSAnZGlzY29ubmVjdGVkJyBDb25uZWN0aW9uIGlzIGNsb3NlZCwgYnV0IGl0IHdpbGwgcmVjb25uZWN0IGF1dG9tYXRpY2FsbHlcbiAgLy8gLSAnY2xvc2VkJyAgICAgICBUaGUgY29ubmVjdGlvbiB3YXMgY2xvc2VkIGJ5IHRoZSBjbGllbnQsIGFuZCB3aWxsIG5vdCByZWNvbm5lY3RcbiAgLy8gLSAnc3RvcHBlZCcgICAgICBUaGUgY29ubmVjdGlvbiB3YXMgY2xvc2VkIGJ5IHRoZSBzZXJ2ZXIsIGFuZCB3aWxsIG5vdCByZWNvbm5lY3RcbiAgdGhpcy5zdGF0ZSA9IChzb2NrZXQucmVhZHlTdGF0ZSA9PT0gMCB8fCBzb2NrZXQucmVhZHlTdGF0ZSA9PT0gMSkgPyAnY29ubmVjdGluZycgOiAnZGlzY29ubmVjdGVkJztcblxuICAvLyBUaGlzIGlzIGEgaGVscGVyIHZhcmlhYmxlIHRoZSBkb2N1bWVudCB1c2VzIHRvIHNlZSB3aGV0aGVyIHdlJ3JlXG4gIC8vIGN1cnJlbnRseSBpbiBhICdsaXZlJyBzdGF0ZS4gSXQgaXMgdHJ1ZSBpZiBhbmQgb25seSBpZiB3ZSdyZSBjb25uZWN0ZWRcbiAgdGhpcy5jYW5TZW5kID0gZmFsc2U7XG5cbiAgdmFyIGNvbm5lY3Rpb24gPSB0aGlzO1xuXG4gIHNvY2tldC5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgZGF0YSA9ICh0eXBlb2YgZXZlbnQuZGF0YSA9PT0gJ3N0cmluZycpID9cbiAgICAgICAgSlNPTi5wYXJzZShldmVudC5kYXRhKSA6IGV2ZW50LmRhdGE7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBjb25zb2xlLndhcm4oJ0ZhaWxlZCB0byBwYXJzZSBtZXNzYWdlJywgZXZlbnQpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChjb25uZWN0aW9uLmRlYnVnKSBjb25zb2xlLmxvZygnUkVDVicsIEpTT04uc3RyaW5naWZ5KGRhdGEpKTtcblxuICAgIHZhciByZXF1ZXN0ID0ge2RhdGE6IGRhdGF9O1xuICAgIGNvbm5lY3Rpb24uZW1pdCgncmVjZWl2ZScsIHJlcXVlc3QpO1xuICAgIGlmICghcmVxdWVzdC5kYXRhKSByZXR1cm47XG5cbiAgICB0cnkge1xuICAgICAgY29ubmVjdGlvbi5oYW5kbGVNZXNzYWdlKHJlcXVlc3QuZGF0YSk7XG4gICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICBwcm9jZXNzLm5leHRUaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICBjb25uZWN0aW9uLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcblxuICBzb2NrZXQub25vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgY29ubmVjdGlvbi5fc2V0U3RhdGUoJ2Nvbm5lY3RpbmcnKTtcbiAgfTtcblxuICBzb2NrZXQub25lcnJvciA9IGZ1bmN0aW9uKGVycikge1xuICAgIC8vIFRoaXMgaXNuJ3QgdGhlIHNhbWUgYXMgYSByZWd1bGFyIGVycm9yLCBiZWNhdXNlIGl0IHdpbGwgaGFwcGVuIG5vcm1hbGx5XG4gICAgLy8gZnJvbSB0aW1lIHRvIHRpbWUuIFlvdXIgY29ubmVjdGlvbiBzaG91bGQgcHJvYmFibHkgYXV0b21hdGljYWxseVxuICAgIC8vIHJlY29ubmVjdCBhbnl3YXksIGJ1dCB0aGF0IHNob3VsZCBiZSB0cmlnZ2VyZWQgb2ZmIG9uY2xvc2Ugbm90IG9uZXJyb3IuXG4gICAgLy8gKG9uY2xvc2UgaGFwcGVucyB3aGVuIG9uZXJyb3IgZ2V0cyBjYWxsZWQgYW55d2F5KS5cbiAgICBjb25uZWN0aW9uLmVtaXQoJ2Nvbm5lY3Rpb24gZXJyb3InLCBlcnIpO1xuICB9O1xuXG4gIHNvY2tldC5vbmNsb3NlID0gZnVuY3Rpb24ocmVhc29uKSB7XG4gICAgLy8gbm9kZS1icm93c2VyY2hhbm5lbCByZWFzb24gdmFsdWVzOlxuICAgIC8vICAgJ0Nsb3NlZCcgLSBUaGUgc29ja2V0IHdhcyBtYW51YWxseSBjbG9zZWQgYnkgY2FsbGluZyBzb2NrZXQuY2xvc2UoKVxuICAgIC8vICAgJ1N0b3BwZWQgYnkgc2VydmVyJyAtIFRoZSBzZXJ2ZXIgc2VudCB0aGUgc3RvcCBtZXNzYWdlIHRvIHRlbGwgdGhlIGNsaWVudCBub3QgdG8gdHJ5IGNvbm5lY3RpbmdcbiAgICAvLyAgICdSZXF1ZXN0IGZhaWxlZCcgLSBTZXJ2ZXIgZGlkbid0IHJlc3BvbmQgdG8gcmVxdWVzdCAodGVtcG9yYXJ5LCB1c3VhbGx5IG9mZmxpbmUpXG4gICAgLy8gICAnVW5rbm93biBzZXNzaW9uIElEJyAtIFNlcnZlciBzZXNzaW9uIGZvciBjbGllbnQgaXMgbWlzc2luZyAodGVtcG9yYXJ5LCB3aWxsIGltbWVkaWF0ZWx5IHJlZXN0YWJsaXNoKVxuXG4gICAgaWYgKHJlYXNvbiA9PT0gJ2Nsb3NlZCcgfHwgcmVhc29uID09PSAnQ2xvc2VkJykge1xuICAgICAgY29ubmVjdGlvbi5fc2V0U3RhdGUoJ2Nsb3NlZCcsIHJlYXNvbik7XG5cbiAgICB9IGVsc2UgaWYgKHJlYXNvbiA9PT0gJ3N0b3BwZWQnIHx8IHJlYXNvbiA9PT0gJ1N0b3BwZWQgYnkgc2VydmVyJykge1xuICAgICAgY29ubmVjdGlvbi5fc2V0U3RhdGUoJ3N0b3BwZWQnLCByZWFzb24pO1xuXG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbm5lY3Rpb24uX3NldFN0YXRlKCdkaXNjb25uZWN0ZWQnLCByZWFzb24pO1xuICAgIH1cbiAgfTtcbn07XG5cbi8qKlxuICogQHBhcmFtIHtvYmplY3R9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlLmEgYWN0aW9uXG4gKi9cbkNvbm5lY3Rpb24ucHJvdG90eXBlLmhhbmRsZU1lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIGNvbnNvbGUubG9nKG1lc3NhZ2UpXG4gIHZhciBlcnIgPSBudWxsO1xuICBpZiAobWVzc2FnZS5lcnJvcikge1xuICAgIC8vIHdyYXAgaW4gRXJyb3Igb2JqZWN0IHNvIGNhbiBiZSBwYXNzZWQgdGhyb3VnaCBldmVudCBlbWl0dGVyc1xuICAgIGVyciA9IG5ldyBFcnJvcihtZXNzYWdlLmVycm9yLm1lc3NhZ2UpO1xuICAgIGVyci5jb2RlID0gbWVzc2FnZS5lcnJvci5jb2RlO1xuICAgIC8vIEFkZCB0aGUgbWVzc2FnZSBkYXRhIHRvIHRoZSBlcnJvciBvYmplY3QgZm9yIG1vcmUgY29udGV4dFxuICAgIGVyci5kYXRhID0gbWVzc2FnZTtcbiAgICBkZWxldGUgbWVzc2FnZS5lcnJvcjtcbiAgfVxuICAvLyBTd2l0Y2ggb24gdGhlIG1lc3NhZ2UgYWN0aW9uLiBNb3N0IG1lc3NhZ2VzIGFyZSBmb3IgZG9jdW1lbnRzIGFuZCBhcmVcbiAgLy8gaGFuZGxlZCBpbiB0aGUgZG9jIGNsYXNzLlxuICBzd2l0Y2ggKG1lc3NhZ2UuYSkge1xuICAgIGNhc2UgJ2luaXQnOlxuICAgICAgLy8gQ2xpZW50IGluaXRpYWxpemF0aW9uIHBhY2tldFxuICAgICAgaWYgKG1lc3NhZ2UucHJvdG9jb2wgIT09IDEpIHtcbiAgICAgICAgZXJyID0gbmV3IFNoYXJlREJFcnJvcig0MDE5LCAnSW52YWxpZCBwcm90b2NvbCB2ZXJzaW9uJyk7XG4gICAgICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlcy5tYXBbbWVzc2FnZS50eXBlXSAhPT0gdHlwZXMuZGVmYXVsdFR5cGUpIHtcbiAgICAgICAgZXJyID0gbmV3IFNoYXJlREJFcnJvcig0MDIwLCAnSW52YWxpZCBkZWZhdWx0IHR5cGUnKTtcbiAgICAgICAgcmV0dXJuIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiBtZXNzYWdlLmlkICE9PSAnc3RyaW5nJykge1xuICAgICAgICBlcnIgPSBuZXcgU2hhcmVEQkVycm9yKDQwMjEsICdJbnZhbGlkIGNsaWVudCBpZCcpO1xuICAgICAgICByZXR1cm4gdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgICB9XG4gICAgICB0aGlzLmlkID0gbWVzc2FnZS5pZDtcblxuICAgICAgdGhpcy5fc2V0U3RhdGUoJ2Nvbm5lY3RlZCcpO1xuICAgICAgcmV0dXJuO1xuXG4gICAgY2FzZSAncWYnOlxuICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW21lc3NhZ2UuaWRdO1xuICAgICAgaWYgKHF1ZXJ5KSBxdWVyeS5faGFuZGxlRmV0Y2goZXJyLCBtZXNzYWdlLmRhdGEsIG1lc3NhZ2UuZXh0cmEpO1xuICAgICAgcmV0dXJuO1xuICAgIGNhc2UgJ3FzJzpcbiAgICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1ttZXNzYWdlLmlkXTtcbiAgICAgIGlmIChxdWVyeSkgcXVlcnkuX2hhbmRsZVN1YnNjcmliZShlcnIsIG1lc3NhZ2UuZGF0YSwgbWVzc2FnZS5leHRyYSk7XG4gICAgICByZXR1cm47XG4gICAgY2FzZSAncXUnOlxuICAgICAgLy8gUXVlcmllcyBhcmUgcmVtb3ZlZCBpbW1lZGlhdGVseSBvbiBjYWxscyB0byBkZXN0cm95LCBzbyB3ZSBpZ25vcmVcbiAgICAgIC8vIHJlcGxpZXMgdG8gcXVlcnkgdW5zdWJzY3JpYmVzLiBQZXJoYXBzIHRoZXJlIHNob3VsZCBiZSBhIGNhbGxiYWNrIGZvclxuICAgICAgLy8gZGVzdHJveSwgYnV0IHRoaXMgaXMgY3VycmVudGx5IHVuaW1wbGVtZW50ZWRcbiAgICAgIHJldHVybjtcbiAgICBjYXNlICdxJzpcbiAgICAgIC8vIFF1ZXJ5IG1lc3NhZ2UuIFBhc3MgdGhpcyB0byB0aGUgYXBwcm9wcmlhdGUgcXVlcnkgb2JqZWN0LlxuICAgICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW21lc3NhZ2UuaWRdO1xuICAgICAgaWYgKCFxdWVyeSkgcmV0dXJuO1xuICAgICAgaWYgKGVycikgcmV0dXJuIHF1ZXJ5Ll9oYW5kbGVFcnJvcihlcnIpO1xuICAgICAgaWYgKG1lc3NhZ2UuZGlmZikgcXVlcnkuX2hhbmRsZURpZmYobWVzc2FnZS5kaWZmKTtcbiAgICAgIGlmIChtZXNzYWdlLmhhc093blByb3BlcnR5KCdleHRyYScpKSBxdWVyeS5faGFuZGxlRXh0cmEobWVzc2FnZS5leHRyYSk7XG4gICAgICByZXR1cm47XG5cbiAgICBjYXNlICdiZic6XG4gICAgICByZXR1cm4gdGhpcy5faGFuZGxlQnVsa01lc3NhZ2UobWVzc2FnZSwgJ19oYW5kbGVGZXRjaCcpO1xuICAgIGNhc2UgJ2JzJzpcbiAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVCdWxrTWVzc2FnZShtZXNzYWdlLCAnX2hhbmRsZVN1YnNjcmliZScpO1xuICAgIGNhc2UgJ2J1JzpcbiAgICAgIHJldHVybiB0aGlzLl9oYW5kbGVCdWxrTWVzc2FnZShtZXNzYWdlLCAnX2hhbmRsZVVuc3Vic2NyaWJlJyk7XG5cbiAgICBjYXNlICdmJzpcbiAgICAgIHZhciBkb2MgPSB0aGlzLmdldEV4aXN0aW5nKG1lc3NhZ2UuYywgbWVzc2FnZS5kKTtcbiAgICAgIGlmIChkb2MpIGRvYy5faGFuZGxlRmV0Y2goZXJyLCBtZXNzYWdlLmRhdGEpO1xuICAgICAgcmV0dXJuO1xuICAgIGNhc2UgJ3MnOlxuICAgICAgdmFyIGRvYyA9IHRoaXMuZ2V0RXhpc3RpbmcobWVzc2FnZS5jLCBtZXNzYWdlLmQpO1xuICAgICAgaWYgKGRvYykgZG9jLl9oYW5kbGVTdWJzY3JpYmUoZXJyLCBtZXNzYWdlLmRhdGEpO1xuICAgICAgcmV0dXJuO1xuICAgIGNhc2UgJ3UnOlxuICAgICAgdmFyIGRvYyA9IHRoaXMuZ2V0RXhpc3RpbmcobWVzc2FnZS5jLCBtZXNzYWdlLmQpO1xuICAgICAgaWYgKGRvYykgZG9jLl9oYW5kbGVVbnN1YnNjcmliZShlcnIpO1xuICAgICAgcmV0dXJuO1xuICAgIGNhc2UgJ29wJzpcbiAgICAgIHZhciBkb2MgPSB0aGlzLmdldEV4aXN0aW5nKG1lc3NhZ2UuYywgbWVzc2FnZS5kKTtcbiAgICAgIGlmIChkb2MpIGRvYy5faGFuZGxlT3AoZXJyLCBtZXNzYWdlKTtcbiAgICAgIHJldHVybjtcblxuICAgIGRlZmF1bHQ6XG4gICAgICBjb25zb2xlLndhcm4oJ0lnbm9ybmluZyB1bnJlY29nbml6ZWQgbWVzc2FnZScsIG1lc3NhZ2UpO1xuICB9XG59O1xuXG5Db25uZWN0aW9uLnByb3RvdHlwZS5faGFuZGxlQnVsa01lc3NhZ2UgPSBmdW5jdGlvbihtZXNzYWdlLCBtZXRob2QpIHtcbiAgaWYgKG1lc3NhZ2UuZGF0YSkge1xuICAgIGZvciAodmFyIGlkIGluIG1lc3NhZ2UuZGF0YSkge1xuICAgICAgdmFyIGRvYyA9IHRoaXMuZ2V0RXhpc3RpbmcobWVzc2FnZS5jLCBpZCk7XG4gICAgICBpZiAoZG9jKSBkb2NbbWV0aG9kXShtZXNzYWdlLmVycm9yLCBtZXNzYWdlLmRhdGFbaWRdKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShtZXNzYWdlLmIpKSB7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtZXNzYWdlLmIubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBpZCA9IG1lc3NhZ2UuYltpXTtcbiAgICAgIHZhciBkb2MgPSB0aGlzLmdldEV4aXN0aW5nKG1lc3NhZ2UuYywgaWQpO1xuICAgICAgaWYgKGRvYykgZG9jW21ldGhvZF0obWVzc2FnZS5lcnJvcik7XG4gICAgfVxuICB9IGVsc2UgaWYgKG1lc3NhZ2UuYikge1xuICAgIGZvciAodmFyIGlkIGluIG1lc3NhZ2UuYikge1xuICAgICAgdmFyIGRvYyA9IHRoaXMuZ2V0RXhpc3RpbmcobWVzc2FnZS5jLCBpZCk7XG4gICAgICBpZiAoZG9jKSBkb2NbbWV0aG9kXShtZXNzYWdlLmVycm9yKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgY29uc29sZS5lcnJvcignSW52YWxpZCBidWxrIG1lc3NhZ2UnLCBtZXNzYWdlKTtcbiAgfVxufTtcblxuQ29ubmVjdGlvbi5wcm90b3R5cGUuX3Jlc2V0ID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc2VxID0gMTtcbiAgdGhpcy5pZCA9IG51bGw7XG4gIHRoaXMuYWdlbnQgPSBudWxsO1xufTtcblxuLy8gU2V0IHRoZSBjb25uZWN0aW9uJ3Mgc3RhdGUuIFRoZSBjb25uZWN0aW9uIGlzIGJhc2ljYWxseSBhIHN0YXRlIG1hY2hpbmUuXG5Db25uZWN0aW9uLnByb3RvdHlwZS5fc2V0U3RhdGUgPSBmdW5jdGlvbihuZXdTdGF0ZSwgcmVhc29uKSB7XG4gIGlmICh0aGlzLnN0YXRlID09PSBuZXdTdGF0ZSkgcmV0dXJuO1xuXG4gIC8vIEkgbWFkZSBhIHN0YXRlIGRpYWdyYW0uIFRoZSBvbmx5IGludmFsaWQgdHJhbnNpdGlvbnMgYXJlIGdldHRpbmcgdG9cbiAgLy8gJ2Nvbm5lY3RpbmcnIGZyb20gYW55d2hlcmUgb3RoZXIgdGhhbiAnZGlzY29ubmVjdGVkJyBhbmQgZ2V0dGluZyB0b1xuICAvLyAnY29ubmVjdGVkJyBmcm9tIGFueXdoZXJlIG90aGVyIHRoYW4gJ2Nvbm5lY3RpbmcnLlxuICBpZiAoXG4gICAgKG5ld1N0YXRlID09PSAnY29ubmVjdGluZycgJiYgdGhpcy5zdGF0ZSAhPT0gJ2Rpc2Nvbm5lY3RlZCcgJiYgdGhpcy5zdGF0ZSAhPT0gJ3N0b3BwZWQnICYmIHRoaXMuc3RhdGUgIT09ICdjbG9zZWQnKSB8fFxuICAgIChuZXdTdGF0ZSA9PT0gJ2Nvbm5lY3RlZCcgJiYgdGhpcy5zdGF0ZSAhPT0gJ2Nvbm5lY3RpbmcnKVxuICApIHtcbiAgICB2YXIgZXJyID0gbmV3IFNoYXJlREJFcnJvcig1MDA3LCAnQ2Fubm90IHRyYW5zaXRpb24gZGlyZWN0bHkgZnJvbSAnICsgdGhpcy5zdGF0ZSArICcgdG8gJyArIG5ld1N0YXRlKTtcbiAgICByZXR1cm4gdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG4gIH1cblxuICB0aGlzLnN0YXRlID0gbmV3U3RhdGU7XG4gIHRoaXMuY2FuU2VuZCA9IChuZXdTdGF0ZSA9PT0gJ2Nvbm5lY3RlZCcpO1xuXG4gIGlmIChuZXdTdGF0ZSA9PT0gJ2Rpc2Nvbm5lY3RlZCcgfHwgbmV3U3RhdGUgPT09ICdzdG9wcGVkJyB8fCBuZXdTdGF0ZSA9PT0gJ2Nsb3NlZCcpIHRoaXMuX3Jlc2V0KCk7XG5cbiAgLy8gR3JvdXAgc3Vic2NyaWJlcyB0b2dldGhlciB0byBoZWxwIHNlcnZlciBtYWtlIG1vcmUgZWZmaWNpZW50IGNhbGxzXG4gIHRoaXMuc3RhcnRCdWxrKCk7XG4gIC8vIEVtaXQgdGhlIGV2ZW50IHRvIGFsbCBxdWVyaWVzXG4gIGZvciAodmFyIGlkIGluIHRoaXMucXVlcmllcykge1xuICAgIHZhciBxdWVyeSA9IHRoaXMucXVlcmllc1tpZF07XG4gICAgcXVlcnkuX29uQ29ubmVjdGlvblN0YXRlQ2hhbmdlZCgpO1xuICB9XG4gIC8vIEVtaXQgdGhlIGV2ZW50IHRvIGFsbCBkb2N1bWVudHNcbiAgZm9yICh2YXIgY29sbGVjdGlvbiBpbiB0aGlzLmNvbGxlY3Rpb25zKSB7XG4gICAgdmFyIGRvY3MgPSB0aGlzLmNvbGxlY3Rpb25zW2NvbGxlY3Rpb25dO1xuICAgIGZvciAodmFyIGlkIGluIGRvY3MpIHtcbiAgICAgIGRvY3NbaWRdLl9vbkNvbm5lY3Rpb25TdGF0ZUNoYW5nZWQoKTtcbiAgICB9XG4gIH1cbiAgdGhpcy5lbmRCdWxrKCk7XG5cbiAgdGhpcy5lbWl0KG5ld1N0YXRlLCByZWFzb24pO1xuICB0aGlzLmVtaXQoJ3N0YXRlJywgbmV3U3RhdGUsIHJlYXNvbik7XG59O1xuXG5Db25uZWN0aW9uLnByb3RvdHlwZS5zdGFydEJ1bGsgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmJ1bGspIHRoaXMuYnVsayA9IHt9O1xufTtcblxuQ29ubmVjdGlvbi5wcm90b3R5cGUuZW5kQnVsayA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5idWxrKSB7XG4gICAgZm9yICh2YXIgY29sbGVjdGlvbiBpbiB0aGlzLmJ1bGspIHtcbiAgICAgIHZhciBhY3Rpb25zID0gdGhpcy5idWxrW2NvbGxlY3Rpb25dO1xuICAgICAgdGhpcy5fc2VuZEJ1bGsoJ2YnLCBjb2xsZWN0aW9uLCBhY3Rpb25zLmYpO1xuICAgICAgdGhpcy5fc2VuZEJ1bGsoJ3MnLCBjb2xsZWN0aW9uLCBhY3Rpb25zLnMpO1xuICAgICAgdGhpcy5fc2VuZEJ1bGsoJ3UnLCBjb2xsZWN0aW9uLCBhY3Rpb25zLnUpO1xuICAgIH1cbiAgfVxuICB0aGlzLmJ1bGsgPSBudWxsO1xufTtcblxuQ29ubmVjdGlvbi5wcm90b3R5cGUuX3NlbmRCdWxrID0gZnVuY3Rpb24oYWN0aW9uLCBjb2xsZWN0aW9uLCB2YWx1ZXMpIHtcbiAgaWYgKCF2YWx1ZXMpIHJldHVybjtcbiAgdmFyIGlkcyA9IFtdO1xuICB2YXIgdmVyc2lvbnMgPSB7fTtcbiAgdmFyIHZlcnNpb25zQ291bnQgPSAwO1xuICB2YXIgdmVyc2lvbklkO1xuICBmb3IgKHZhciBpZCBpbiB2YWx1ZXMpIHtcbiAgICB2YXIgdmFsdWUgPSB2YWx1ZXNbaWRdO1xuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICBpZHMucHVzaChpZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHZlcnNpb25zW2lkXSA9IHZhbHVlO1xuICAgICAgdmVyc2lvbklkID0gaWQ7XG4gICAgICB2ZXJzaW9uc0NvdW50Kys7XG4gICAgfVxuICB9XG4gIGlmIChpZHMubGVuZ3RoID09PSAxKSB7XG4gICAgdmFyIGlkID0gaWRzWzBdO1xuICAgIHRoaXMuc2VuZCh7YTogYWN0aW9uLCBjOiBjb2xsZWN0aW9uLCBkOiBpZH0pO1xuICB9IGVsc2UgaWYgKGlkcy5sZW5ndGgpIHtcbiAgICB0aGlzLnNlbmQoe2E6ICdiJyArIGFjdGlvbiwgYzogY29sbGVjdGlvbiwgYjogaWRzfSk7XG4gIH1cbiAgaWYgKHZlcnNpb25zQ291bnQgPT09IDEpIHtcbiAgICB2YXIgdmVyc2lvbiA9IHZlcnNpb25zW3ZlcnNpb25JZF07XG4gICAgdGhpcy5zZW5kKHthOiBhY3Rpb24sIGM6IGNvbGxlY3Rpb24sIGQ6IHZlcnNpb25JZCwgdjogdmVyc2lvbn0pO1xuICB9IGVsc2UgaWYgKHZlcnNpb25zQ291bnQpIHtcbiAgICB0aGlzLnNlbmQoe2E6ICdiJyArIGFjdGlvbiwgYzogY29sbGVjdGlvbiwgYjogdmVyc2lvbnN9KTtcbiAgfVxufTtcblxuQ29ubmVjdGlvbi5wcm90b3R5cGUuX3NlbmRBY3Rpb24gPSBmdW5jdGlvbihhY3Rpb24sIGRvYywgdmVyc2lvbikge1xuICAvLyBFbnN1cmUgdGhlIGRvYyBpcyByZWdpc3RlcmVkIHNvIHRoYXQgaXQgcmVjZWl2ZXMgdGhlIHJlcGx5IG1lc3NhZ2VcbiAgdGhpcy5fYWRkRG9jKGRvYyk7XG4gIGlmICh0aGlzLmJ1bGspIHtcbiAgICAvLyBCdWxrIHN1YnNjcmliZVxuICAgIHZhciBhY3Rpb25zID0gdGhpcy5idWxrW2RvYy5jb2xsZWN0aW9uXSB8fCAodGhpcy5idWxrW2RvYy5jb2xsZWN0aW9uXSA9IHt9KTtcbiAgICB2YXIgdmVyc2lvbnMgPSBhY3Rpb25zW2FjdGlvbl0gfHwgKGFjdGlvbnNbYWN0aW9uXSA9IHt9KTtcbiAgICB2YXIgaXNEdXBsaWNhdGUgPSB2ZXJzaW9ucy5oYXNPd25Qcm9wZXJ0eShkb2MuaWQpO1xuICAgIHZlcnNpb25zW2RvYy5pZF0gPSB2ZXJzaW9uO1xuICAgIHJldHVybiBpc0R1cGxpY2F0ZTtcbiAgfSBlbHNlIHtcbiAgICAvLyBTZW5kIHNpbmdsZSBkb2Mgc3Vic2NyaWJlIG1lc3NhZ2VcbiAgICB2YXIgbWVzc2FnZSA9IHthOiBhY3Rpb24sIGM6IGRvYy5jb2xsZWN0aW9uLCBkOiBkb2MuaWQsIHY6IHZlcnNpb259O1xuICAgIHRoaXMuc2VuZChtZXNzYWdlKTtcbiAgfVxufTtcblxuQ29ubmVjdGlvbi5wcm90b3R5cGUuc2VuZEZldGNoID0gZnVuY3Rpb24oZG9jKSB7XG4gIHJldHVybiB0aGlzLl9zZW5kQWN0aW9uKCdmJywgZG9jLCBkb2MudmVyc2lvbik7XG59O1xuXG5Db25uZWN0aW9uLnByb3RvdHlwZS5zZW5kU3Vic2NyaWJlID0gZnVuY3Rpb24oZG9jKSB7XG4gIHJldHVybiB0aGlzLl9zZW5kQWN0aW9uKCdzJywgZG9jLCBkb2MudmVyc2lvbik7XG59O1xuXG5Db25uZWN0aW9uLnByb3RvdHlwZS5zZW5kVW5zdWJzY3JpYmUgPSBmdW5jdGlvbihkb2MpIHtcbiAgcmV0dXJuIHRoaXMuX3NlbmRBY3Rpb24oJ3UnLCBkb2MpO1xufTtcblxuQ29ubmVjdGlvbi5wcm90b3R5cGUuc2VuZE9wID0gZnVuY3Rpb24oZG9jLCBvcCkge1xuICAvLyBFbnN1cmUgdGhlIGRvYyBpcyByZWdpc3RlcmVkIHNvIHRoYXQgaXQgcmVjZWl2ZXMgdGhlIHJlcGx5IG1lc3NhZ2VcbiAgdGhpcy5fYWRkRG9jKGRvYyk7XG4gIHZhciBtZXNzYWdlID0ge1xuICAgIGE6ICdvcCcsXG4gICAgYzogZG9jLmNvbGxlY3Rpb24sXG4gICAgZDogZG9jLmlkLFxuICAgIHY6IGRvYy52ZXJzaW9uLFxuICAgIHNyYzogb3Auc3JjLFxuICAgIHNlcTogb3Auc2VxXG4gIH07XG4gIGlmIChvcC5vcCkgbWVzc2FnZS5vcCA9IG9wLm9wO1xuICBpZiAob3AuY3JlYXRlKSBtZXNzYWdlLmNyZWF0ZSA9IG9wLmNyZWF0ZTtcbiAgaWYgKG9wLmRlbCkgbWVzc2FnZS5kZWwgPSBvcC5kZWw7XG4gIHRoaXMuc2VuZChtZXNzYWdlKTtcbn07XG5cblxuLyoqXG4gKiBTZW5kcyBhIG1lc3NhZ2UgZG93biB0aGUgc29ja2V0XG4gKi9cbkNvbm5lY3Rpb24ucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIGlmICh0aGlzLmRlYnVnKSBjb25zb2xlLmxvZygnU0VORCcsIEpTT04uc3RyaW5naWZ5KG1lc3NhZ2UpKTtcblxuICB0aGlzLmVtaXQoJ3NlbmQnLCBtZXNzYWdlKTtcbiAgdGhpcy5zb2NrZXQuc2VuZChKU09OLnN0cmluZ2lmeShtZXNzYWdlKSk7XG59O1xuXG5cbi8qKlxuICogQ2xvc2VzIHRoZSBzb2NrZXQgYW5kIGVtaXRzICdjbG9zZWQnXG4gKi9cbkNvbm5lY3Rpb24ucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMuc29ja2V0LmNsb3NlKCk7XG59O1xuXG5Db25uZWN0aW9uLnByb3RvdHlwZS5nZXRFeGlzdGluZyA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGlkKSB7XG4gIGlmICh0aGlzLmNvbGxlY3Rpb25zW2NvbGxlY3Rpb25dKSByZXR1cm4gdGhpcy5jb2xsZWN0aW9uc1tjb2xsZWN0aW9uXVtpZF07XG59O1xuXG5cbi8qKlxuICogR2V0IG9yIGNyZWF0ZSBhIGRvY3VtZW50LlxuICpcbiAqIEBwYXJhbSBjb2xsZWN0aW9uXG4gKiBAcGFyYW0gaWRcbiAqIEByZXR1cm4ge0RvY31cbiAqL1xuQ29ubmVjdGlvbi5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oY29sbGVjdGlvbiwgaWQpIHtcbiAgdmFyIGRvY3MgPSB0aGlzLmNvbGxlY3Rpb25zW2NvbGxlY3Rpb25dIHx8XG4gICAgKHRoaXMuY29sbGVjdGlvbnNbY29sbGVjdGlvbl0gPSB7fSk7XG5cbiAgdmFyIGRvYyA9IGRvY3NbaWRdO1xuICBpZiAoIWRvYykge1xuICAgIGRvYyA9IGRvY3NbaWRdID0gbmV3IERvYyh0aGlzLCBjb2xsZWN0aW9uLCBpZCk7XG4gICAgdGhpcy5lbWl0KCdkb2MnLCBkb2MpO1xuICB9XG5cbiAgcmV0dXJuIGRvYztcbn07XG5cblxuLyoqXG4gKiBSZW1vdmUgZG9jdW1lbnQgZnJvbSB0aGlzLmNvbGxlY3Rpb25zXG4gKlxuICogQHByaXZhdGVcbiAqL1xuQ29ubmVjdGlvbi5wcm90b3R5cGUuX2Rlc3Ryb3lEb2MgPSBmdW5jdGlvbihkb2MpIHtcbiAgdmFyIGRvY3MgPSB0aGlzLmNvbGxlY3Rpb25zW2RvYy5jb2xsZWN0aW9uXTtcbiAgaWYgKCFkb2NzKSByZXR1cm47XG5cbiAgZGVsZXRlIGRvY3NbZG9jLmlkXTtcblxuICAvLyBEZWxldGUgdGhlIGNvbGxlY3Rpb24gY29udGFpbmVyIGlmIGl0cyBlbXB0eS4gVGhpcyBjb3VsZCBiZSBhIHNvdXJjZSBvZlxuICAvLyBtZW1vcnkgbGVha3MgaWYgeW91IHNsb3dseSBtYWtlIGEgYmlsbGlvbiBjb2xsZWN0aW9ucywgd2hpY2ggeW91IHByb2JhYmx5XG4gIC8vIHdvbid0IGRvIGFueXdheSwgYnV0IHdoYXRldmVyLlxuICBpZiAoIXV0aWwuaGFzS2V5cyhkb2NzKSkge1xuICAgIGRlbGV0ZSB0aGlzLmNvbGxlY3Rpb25zW2RvYy5jb2xsZWN0aW9uXTtcbiAgfVxufTtcblxuQ29ubmVjdGlvbi5wcm90b3R5cGUuX2FkZERvYyA9IGZ1bmN0aW9uKGRvYykge1xuICB2YXIgZG9jcyA9IHRoaXMuY29sbGVjdGlvbnNbZG9jLmNvbGxlY3Rpb25dO1xuICBpZiAoIWRvY3MpIHtcbiAgICBkb2NzID0gdGhpcy5jb2xsZWN0aW9uc1tkb2MuY29sbGVjdGlvbl0gPSB7fTtcbiAgfVxuICBpZiAoZG9jc1tkb2MuaWRdICE9PSBkb2MpIHtcbiAgICBkb2NzW2RvYy5pZF0gPSBkb2M7XG4gIH1cbn07XG5cbi8vIEhlbHBlciBmb3IgY3JlYXRlRmV0Y2hRdWVyeSBhbmQgY3JlYXRlU3Vic2NyaWJlUXVlcnksIGJlbG93LlxuQ29ubmVjdGlvbi5wcm90b3R5cGUuX2NyZWF0ZVF1ZXJ5ID0gZnVuY3Rpb24oYWN0aW9uLCBjb2xsZWN0aW9uLCBxLCBvcHRpb25zLCBjYWxsYmFjaykge1xuICB2YXIgaWQgPSB0aGlzLm5leHRRdWVyeUlkKys7XG4gIHZhciBxdWVyeSA9IG5ldyBRdWVyeShhY3Rpb24sIHRoaXMsIGlkLCBjb2xsZWN0aW9uLCBxLCBvcHRpb25zLCBjYWxsYmFjayk7XG4gIHRoaXMucXVlcmllc1tpZF0gPSBxdWVyeTtcbiAgcXVlcnkuc2VuZCgpO1xuICByZXR1cm4gcXVlcnk7XG59O1xuXG4vLyBJbnRlcm5hbCBmdW5jdGlvbi4gVXNlIHF1ZXJ5LmRlc3Ryb3koKSB0byByZW1vdmUgcXVlcmllcy5cbkNvbm5lY3Rpb24ucHJvdG90eXBlLl9kZXN0cm95UXVlcnkgPSBmdW5jdGlvbihxdWVyeSkge1xuICBkZWxldGUgdGhpcy5xdWVyaWVzW3F1ZXJ5LmlkXTtcbn07XG5cbi8vIFRoZSBxdWVyeSBvcHRpb25zIG9iamVjdCBjYW4gY29udGFpbiB0aGUgZm9sbG93aW5nIGZpZWxkczpcbi8vXG4vLyBkYjogTmFtZSBvZiB0aGUgZGIgZm9yIHRoZSBxdWVyeS4gWW91IGNhbiBhdHRhY2ggZXh0cmFEYnMgdG8gU2hhcmVEQiBhbmRcbi8vICAgcGljayB3aGljaCBvbmUgdGhlIHF1ZXJ5IHNob3VsZCBoaXQgdXNpbmcgdGhpcyBwYXJhbWV0ZXIuXG5cbi8vIENyZWF0ZSBhIGZldGNoIHF1ZXJ5LiBGZXRjaCBxdWVyaWVzIGFyZSBvbmx5IGlzc3VlZCBvbmNlLCByZXR1cm5pbmcgdGhlXG4vLyByZXN1bHRzIGRpcmVjdGx5IGludG8gdGhlIGNhbGxiYWNrLlxuLy9cbi8vIFRoZSBjYWxsYmFjayBzaG91bGQgaGF2ZSB0aGUgc2lnbmF0dXJlIGZ1bmN0aW9uKGVycm9yLCByZXN1bHRzLCBleHRyYSlcbi8vIHdoZXJlIHJlc3VsdHMgaXMgYSBsaXN0IG9mIERvYyBvYmplY3RzLlxuQ29ubmVjdGlvbi5wcm90b3R5cGUuY3JlYXRlRmV0Y2hRdWVyeSA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24sIHEsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIHJldHVybiB0aGlzLl9jcmVhdGVRdWVyeSgncWYnLCBjb2xsZWN0aW9uLCBxLCBvcHRpb25zLCBjYWxsYmFjayk7XG59O1xuXG4vLyBDcmVhdGUgYSBzdWJzY3JpYmUgcXVlcnkuIFN1YnNjcmliZSBxdWVyaWVzIHJldHVybiB3aXRoIHRoZSBpbml0aWFsIGRhdGFcbi8vIHRocm91Z2ggdGhlIGNhbGxiYWNrLCB0aGVuIHVwZGF0ZSB0aGVtc2VsdmVzIHdoZW5ldmVyIHRoZSBxdWVyeSByZXN1bHQgc2V0XG4vLyBjaGFuZ2VzIHZpYSB0aGVpciBvd24gZXZlbnQgZW1pdHRlci5cbi8vXG4vLyBJZiBwcmVzZW50LCB0aGUgY2FsbGJhY2sgc2hvdWxkIGhhdmUgdGhlIHNpZ25hdHVyZSBmdW5jdGlvbihlcnJvciwgcmVzdWx0cywgZXh0cmEpXG4vLyB3aGVyZSByZXN1bHRzIGlzIGEgbGlzdCBvZiBEb2Mgb2JqZWN0cy5cbkNvbm5lY3Rpb24ucHJvdG90eXBlLmNyZWF0ZVN1YnNjcmliZVF1ZXJ5ID0gZnVuY3Rpb24oY29sbGVjdGlvbiwgcSwgb3B0aW9ucywgY2FsbGJhY2spIHtcbiAgcmV0dXJuIHRoaXMuX2NyZWF0ZVF1ZXJ5KCdxcycsIGNvbGxlY3Rpb24sIHEsIG9wdGlvbnMsIGNhbGxiYWNrKTtcbn07XG5cbkNvbm5lY3Rpb24ucHJvdG90eXBlLmhhc1BlbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICEhKFxuICAgIHRoaXMuX2ZpcnN0RG9jKGhhc1BlbmRpbmcpIHx8XG4gICAgdGhpcy5fZmlyc3RRdWVyeShoYXNQZW5kaW5nKVxuICApO1xufTtcbmZ1bmN0aW9uIGhhc1BlbmRpbmcob2JqZWN0KSB7XG4gIHJldHVybiBvYmplY3QuaGFzUGVuZGluZygpO1xufVxuXG5Db25uZWN0aW9uLnByb3RvdHlwZS5oYXNXcml0ZVBlbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICEhdGhpcy5fZmlyc3REb2MoaGFzV3JpdGVQZW5kaW5nKTtcbn07XG5mdW5jdGlvbiBoYXNXcml0ZVBlbmRpbmcob2JqZWN0KSB7XG4gIHJldHVybiBvYmplY3QuaGFzV3JpdGVQZW5kaW5nKCk7XG59XG5cbkNvbm5lY3Rpb24ucHJvdG90eXBlLndoZW5Ob3RoaW5nUGVuZGluZyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciBkb2MgPSB0aGlzLl9maXJzdERvYyhoYXNQZW5kaW5nKTtcbiAgaWYgKGRvYykge1xuICAgIC8vIElmIGEgZG9jdW1lbnQgaXMgZm91bmQgd2l0aCBhIHBlbmRpbmcgb3BlcmF0aW9uLCB3YWl0IGZvciBpdCB0byBlbWl0XG4gICAgLy8gdGhhdCBub3RoaW5nIGlzIHBlbmRpbmcgYW55bW9yZSwgYW5kIHRoZW4gcmVjaGVjayBhbGwgZG9jdW1lbnRzIGFnYWluLlxuICAgIC8vIFdlIGhhdmUgdG8gcmVjaGVjayBhbGwgZG9jdW1lbnRzLCBqdXN0IGluIGNhc2UgYW5vdGhlciBtdXRhdGlvbiBoYXNcbiAgICAvLyBiZWVuIG1hZGUgaW4gdGhlIG1lYW50aW1lIGFzIGEgcmVzdWx0IG9mIGFuIGV2ZW50IGNhbGxiYWNrXG4gICAgZG9jLm9uY2UoJ25vdGhpbmcgcGVuZGluZycsIHRoaXMuX25vdGhpbmdQZW5kaW5nUmV0cnkoY2FsbGJhY2spKTtcbiAgICByZXR1cm47XG4gIH1cbiAgdmFyIHF1ZXJ5ID0gdGhpcy5fZmlyc3RRdWVyeShoYXNQZW5kaW5nKTtcbiAgaWYgKHF1ZXJ5KSB7XG4gICAgcXVlcnkub25jZSgncmVhZHknLCB0aGlzLl9ub3RoaW5nUGVuZGluZ1JldHJ5KGNhbGxiYWNrKSk7XG4gICAgcmV0dXJuO1xuICB9XG4gIC8vIENhbGwgYmFjayB3aGVuIG5vIHBlbmRpbmcgb3BlcmF0aW9uc1xuICBwcm9jZXNzLm5leHRUaWNrKGNhbGxiYWNrKTtcbn07XG5Db25uZWN0aW9uLnByb3RvdHlwZS5fbm90aGluZ1BlbmRpbmdSZXRyeSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHZhciBjb25uZWN0aW9uID0gdGhpcztcbiAgcmV0dXJuIGZ1bmN0aW9uKCkge1xuICAgIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgICBjb25uZWN0aW9uLndoZW5Ob3RoaW5nUGVuZGluZyhjYWxsYmFjayk7XG4gICAgfSk7XG4gIH07XG59O1xuXG5Db25uZWN0aW9uLnByb3RvdHlwZS5fZmlyc3REb2MgPSBmdW5jdGlvbihmbikge1xuICBmb3IgKHZhciBjb2xsZWN0aW9uIGluIHRoaXMuY29sbGVjdGlvbnMpIHtcbiAgICB2YXIgZG9jcyA9IHRoaXMuY29sbGVjdGlvbnNbY29sbGVjdGlvbl07XG4gICAgZm9yICh2YXIgaWQgaW4gZG9jcykge1xuICAgICAgdmFyIGRvYyA9IGRvY3NbaWRdO1xuICAgICAgaWYgKGZuKGRvYykpIHtcbiAgICAgICAgcmV0dXJuIGRvYztcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG5cbkNvbm5lY3Rpb24ucHJvdG90eXBlLl9maXJzdFF1ZXJ5ID0gZnVuY3Rpb24oZm4pIHtcbiAgZm9yICh2YXIgaWQgaW4gdGhpcy5xdWVyaWVzKSB7XG4gICAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyaWVzW2lkXTtcbiAgICBpZiAoZm4ocXVlcnkpKSB7XG4gICAgICByZXR1cm4gcXVlcnk7XG4gICAgfVxuICB9XG59O1xuIiwidmFyIGVtaXR0ZXIgPSByZXF1aXJlKCcuLi9lbWl0dGVyJyk7XG52YXIgU2hhcmVEQkVycm9yID0gcmVxdWlyZSgnLi4vZXJyb3InKTtcbnZhciB0eXBlcyA9IHJlcXVpcmUoJy4uL3R5cGVzJyk7XG5cbi8qKlxuICogQSBEb2MgaXMgYSBjbGllbnQncyB2aWV3IG9uIGEgc2hhcmVqcyBkb2N1bWVudC5cbiAqXG4gKiBJdCBpcyBpcyB1bmlxdWVseSBpZGVudGlmaWVkIGJ5IGl0cyBgaWRgIGFuZCBgY29sbGVjdGlvbmAuICBEb2N1bWVudHNcbiAqIHNob3VsZCBub3QgYmUgY3JlYXRlZCBkaXJlY3RseS4gQ3JlYXRlIHRoZW0gd2l0aCBjb25uZWN0aW9uLmdldCgpXG4gKlxuICpcbiAqIFN1YnNjcmlwdGlvbnNcbiAqIC0tLS0tLS0tLS0tLS1cbiAqXG4gKiBXZSBjYW4gc3Vic2NyaWJlIGEgZG9jdW1lbnQgdG8gc3RheSBpbiBzeW5jIHdpdGggdGhlIHNlcnZlci5cbiAqICAgZG9jLnN1YnNjcmliZShmdW5jdGlvbihlcnJvcikge1xuICogICAgIGRvYy5zdWJzY3JpYmVkIC8vID0gdHJ1ZVxuICogICB9KVxuICogVGhlIHNlcnZlciBub3cgc2VuZHMgdXMgYWxsIGNoYW5nZXMgY29uY2VybmluZyB0aGlzIGRvY3VtZW50IGFuZCB0aGVzZSBhcmVcbiAqIGFwcGxpZWQgdG8gb3VyIGRhdGEuIElmIHRoZSBzdWJzY3JpcHRpb24gd2FzIHN1Y2Nlc3NmdWwgdGhlIGluaXRpYWxcbiAqIGRhdGEgYW5kIHZlcnNpb24gc2VudCBieSB0aGUgc2VydmVyIGFyZSBsb2FkZWQgaW50byB0aGUgZG9jdW1lbnQuXG4gKlxuICogVG8gc3RvcCBsaXN0ZW5pbmcgdG8gdGhlIGNoYW5nZXMgd2UgY2FsbCBgZG9jLnVuc3Vic2NyaWJlKClgLlxuICpcbiAqIElmIHdlIGp1c3Qgd2FudCB0byBsb2FkIHRoZSBkYXRhIGJ1dCBub3Qgc3RheSB1cC10by1kYXRlLCB3ZSBjYWxsXG4gKiAgIGRvYy5mZXRjaChmdW5jdGlvbihlcnJvcikge1xuICogICAgIGRvYy5kYXRhIC8vIHNlbnQgYnkgc2VydmVyXG4gKiAgIH0pXG4gKlxuICpcbiAqIEV2ZW50c1xuICogLS0tLS0tXG4gKlxuICogWW91IGNhbiB1c2UgZG9jLm9uKGV2ZW50TmFtZSwgY2FsbGJhY2spIHRvIHN1YnNjcmliZSB0byB0aGUgZm9sbG93aW5nIGV2ZW50czpcbiAqIC0gYGJlZm9yZSBvcCAob3AsIHNvdXJjZSlgIEZpcmVkIGJlZm9yZSBhIHBhcnRpYWwgb3BlcmF0aW9uIGlzIGFwcGxpZWQgdG8gdGhlIGRhdGEuXG4gKiAgIEl0IG1heSBiZSB1c2VkIHRvIHJlYWQgdGhlIG9sZCBkYXRhIGp1c3QgYmVmb3JlIGFwcGx5aW5nIGFuIG9wZXJhdGlvblxuICogLSBgb3AgKG9wLCBzb3VyY2UpYCBGaXJlZCBhZnRlciBldmVyeSBwYXJ0aWFsIG9wZXJhdGlvbiB3aXRoIHRoaXMgb3BlcmF0aW9uIGFzIHRoZVxuICogICBmaXJzdCBhcmd1bWVudFxuICogLSBgY3JlYXRlIChzb3VyY2UpYCBUaGUgZG9jdW1lbnQgd2FzIGNyZWF0ZWQuIFRoYXQgbWVhbnMgaXRzIHR5cGUgd2FzXG4gKiAgIHNldCBhbmQgaXQgaGFzIHNvbWUgaW5pdGlhbCBkYXRhLlxuICogLSBgZGVsIChkYXRhLCBzb3VyY2UpYCBGaXJlZCBhZnRlciB0aGUgZG9jdW1lbnQgaXMgZGVsZXRlZCwgdGhhdCBpc1xuICogICB0aGUgZGF0YSBpcyBudWxsLiBJdCBpcyBwYXNzZWQgdGhlIGRhdGEgYmVmb3JlIGRlbHRlaW9uIGFzIGFuXG4gKiAgIGFyZ3VtZW50c1xuICogLSBgbG9hZCAoKWAgRmlyZWQgd2hlbiBhIG5ldyBzbmFwc2hvdCBpcyBpbmdlc3RlZCBmcm9tIGEgZmV0Y2gsIHN1YnNjcmliZSwgb3IgcXVlcnlcbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IERvYztcbmZ1bmN0aW9uIERvYyhjb25uZWN0aW9uLCBjb2xsZWN0aW9uLCBpZCkge1xuICBlbWl0dGVyLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIHRoaXMuY29ubmVjdGlvbiA9IGNvbm5lY3Rpb247XG5cbiAgdGhpcy5jb2xsZWN0aW9uID0gY29sbGVjdGlvbjtcbiAgdGhpcy5pZCA9IGlkO1xuXG4gIHRoaXMudmVyc2lvbiA9IG51bGw7XG4gIHRoaXMudHlwZSA9IG51bGw7XG4gIHRoaXMuZGF0YSA9IHVuZGVmaW5lZDtcblxuICAvLyBBcnJheSBvZiBjYWxsYmFja3Mgb3IgbnVsbHMgYXMgcGxhY2Vob2xkZXJzXG4gIHRoaXMuaW5mbGlnaHRGZXRjaCA9IFtdO1xuICB0aGlzLmluZmxpZ2h0U3Vic2NyaWJlID0gW107XG4gIHRoaXMuaW5mbGlnaHRVbnN1YnNjcmliZSA9IFtdO1xuICB0aGlzLnBlbmRpbmdGZXRjaCA9IFtdO1xuXG4gIC8vIFdoZXRoZXIgd2UgdGhpbmsgd2UgYXJlIHN1YnNjcmliZWQgb24gdGhlIHNlcnZlci4gU3luY2hyb25vdXNseSBzZXQgdG9cbiAgLy8gZmFsc2Ugb24gY2FsbHMgdG8gdW5zdWJzY3JpYmUgYW5kIGRpc2Nvbm5lY3QuIFNob3VsZCBuZXZlciBiZSB0cnVlIHdoZW5cbiAgLy8gdGhpcy53YW50U3Vic2NyaWJlIGlzIGZhbHNlXG4gIHRoaXMuc3Vic2NyaWJlZCA9IGZhbHNlO1xuICAvLyBXaGV0aGVyIHRvIHJlLWVzdGFibGlzaCB0aGUgc3Vic2NyaXB0aW9uIG9uIHJlY29ubmVjdFxuICB0aGlzLndhbnRTdWJzY3JpYmUgPSBmYWxzZTtcblxuICAvLyBUaGUgb3AgdGhhdCBpcyBjdXJyZW50bHkgcm91bmR0cmlwcGluZyB0byB0aGUgc2VydmVyLCBvciBudWxsLlxuICAvL1xuICAvLyBXaGVuIHRoZSBjb25uZWN0aW9uIHJlY29ubmVjdHMsIHRoZSBpbmZsaWdodCBvcCBpcyByZXN1Ym1pdHRlZC5cbiAgLy9cbiAgLy8gVGhpcyBoYXMgdGhlIHNhbWUgZm9ybWF0IGFzIGFuIGVudHJ5IGluIHBlbmRpbmdPcHNcbiAgdGhpcy5pbmZsaWdodE9wID0gbnVsbDtcblxuICAvLyBBbGwgb3BzIHRoYXQgYXJlIHdhaXRpbmcgZm9yIHRoZSBzZXJ2ZXIgdG8gYWNrbm93bGVkZ2UgdGhpcy5pbmZsaWdodE9wXG4gIC8vIFRoaXMgdXNlZCB0byBqdXN0IGJlIGEgc2luZ2xlIG9wZXJhdGlvbiwgYnV0IGNyZWF0ZXMgJiBkZWxldGVzIGNhbid0IGJlXG4gIC8vIGNvbXBvc2VkIHdpdGggcmVndWxhciBvcGVyYXRpb25zLlxuICAvL1xuICAvLyBUaGlzIGlzIGEgbGlzdCBvZiB7W2NyZWF0ZTp7Li4ufV0sIFtkZWw6dHJ1ZV0sIFtvcDouLi5dLCBjYWxsYmFja3M6Wy4uLl19XG4gIHRoaXMucGVuZGluZ09wcyA9IFtdO1xuXG4gIC8vIFRoZSBPVCB0eXBlIG9mIHRoaXMgZG9jdW1lbnQuIEFuIHVuY3JlYXRlZCBkb2N1bWVudCBoYXMgdHlwZSBgbnVsbGBcbiAgdGhpcy50eXBlID0gbnVsbDtcblxuICAvLyBUaGUgYXBwbHlTdGFjayBlbmFibGVzIHVzIHRvIHRyYWNrIGFueSBvcHMgc3VibWl0dGVkIHdoaWxlIHdlIGFyZVxuICAvLyBhcHBseWluZyBhbiBvcCBpbmNyZW1lbnRhbGx5LiBUaGlzIHZhbHVlIGlzIGFuIGFycmF5IHdoZW4gd2UgYXJlXG4gIC8vIHBlcmZvcm1pbmcgYW4gaW5jcmVtZW50YWwgYXBwbHkgYW5kIG51bGwgb3RoZXJ3aXNlLiBXaGVuIGl0IGlzIGFuIGFycmF5LFxuICAvLyBhbGwgc3VibWl0dGVkIG9wcyBzaG91bGQgYmUgcHVzaGVkIG9udG8gaXQuIFRoZSBgX290QXBwbHlgIG1ldGhvZCB3aWxsXG4gIC8vIHJlc2V0IGl0IGJhY2sgdG8gbnVsbCB3aGVuIGFsbCBpbmNyZW1lbnRhbCBhcHBseSBsb29wcyBhcmUgY29tcGxldGUuXG4gIHRoaXMuYXBwbHlTdGFjayA9IG51bGw7XG5cbiAgLy8gRGlzYWJsZSB0aGUgZGVmYXVsdCBiZWhhdmlvciBvZiBjb21wb3Npbmcgc3VibWl0dGVkIG9wcy4gVGhpcyBpcyByZWFkIGF0XG4gIC8vIHRoZSB0aW1lIG9mIG9wIHN1Ym1pdCwgc28gaXQgbWF5IGJlIHRvZ2dsZWQgb24gYmVmb3JlIHN1Ym1pdHRpbmcgYVxuICAvLyBzcGVjaWZjIG9wIGFuZCB0b2dnbGVkIG9mZiBhZnRlcndhcmRcbiAgdGhpcy5wcmV2ZW50Q29tcG9zZSA9IGZhbHNlO1xufVxuZW1pdHRlci5taXhpbihEb2MpO1xuXG5Eb2MucHJvdG90eXBlLmRlc3Ryb3kgPSBmdW5jdGlvbihjYWxsYmFjaykge1xuICB2YXIgZG9jID0gdGhpcztcbiAgZG9jLndoZW5Ob3RoaW5nUGVuZGluZyhmdW5jdGlvbigpIHtcbiAgICBkb2MuY29ubmVjdGlvbi5fZGVzdHJveURvYyhkb2MpO1xuICAgIGlmIChkb2Mud2FudFN1YnNjcmliZSkge1xuICAgICAgcmV0dXJuIGRvYy51bnN1YnNjcmliZShjYWxsYmFjayk7XG4gICAgfVxuICAgIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgfSk7XG59O1xuXG5cbi8vICoqKioqKiBNYW5pcHVsYXRpbmcgdGhlIGRvY3VtZW50IGRhdGEsIHZlcnNpb24gYW5kIHR5cGUuXG5cbi8vIFNldCB0aGUgZG9jdW1lbnQncyB0eXBlLCBhbmQgYXNzb2NpYXRlZCBwcm9wZXJ0aWVzLiBNb3N0IG9mIHRoZSBsb2dpYyBpblxuLy8gdGhpcyBmdW5jdGlvbiBleGlzdHMgdG8gdXBkYXRlIHRoZSBkb2N1bWVudCBiYXNlZCBvbiBhbnkgYWRkZWQgJiByZW1vdmVkIEFQSVxuLy8gbWV0aG9kcy5cbi8vXG4vLyBAcGFyYW0gbmV3VHlwZSBPVCB0eXBlIHByb3ZpZGVkIGJ5IHRoZSBvdHR5cGVzIGxpYnJhcnkgb3IgaXRzIG5hbWUgb3IgdXJpXG5Eb2MucHJvdG90eXBlLl9zZXRUeXBlID0gZnVuY3Rpb24obmV3VHlwZSkge1xuICBpZiAodHlwZW9mIG5ld1R5cGUgPT09ICdzdHJpbmcnKSB7XG4gICAgbmV3VHlwZSA9IHR5cGVzLm1hcFtuZXdUeXBlXTtcbiAgfVxuXG4gIGlmIChuZXdUeXBlKSB7XG4gICAgdGhpcy50eXBlID0gbmV3VHlwZTtcblxuICB9IGVsc2UgaWYgKG5ld1R5cGUgPT09IG51bGwpIHtcbiAgICB0aGlzLnR5cGUgPSBuZXdUeXBlO1xuICAgIC8vIElmIHdlIHJlbW92ZWQgdGhlIHR5cGUgZnJvbSB0aGUgb2JqZWN0LCBhbHNvIHJlbW92ZSBpdHMgZGF0YVxuICAgIHRoaXMuZGF0YSA9IHVuZGVmaW5lZDtcblxuICB9IGVsc2Uge1xuICAgIHZhciBlcnIgPSBuZXcgU2hhcmVEQkVycm9yKDQwMDgsICdNaXNzaW5nIHR5cGUgJyArIG5ld1R5cGUpO1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgfVxufTtcblxuLy8gSW5nZXN0IHNuYXBzaG90IGRhdGEuIFRoaXMgZGF0YSBtdXN0IGluY2x1ZGUgYSB2ZXJzaW9uLCBzbmFwc2hvdCBhbmQgdHlwZS5cbi8vIFRoaXMgaXMgdXNlZCBib3RoIHRvIGluZ2VzdCBkYXRhIHRoYXQgd2FzIGV4cG9ydGVkIHdpdGggYSB3ZWJwYWdlIGFuZCBkYXRhXG4vLyB0aGF0IHdhcyByZWNlaXZlZCBmcm9tIHRoZSBzZXJ2ZXIgZHVyaW5nIGEgZmV0Y2guXG4vL1xuLy8gQHBhcmFtIHNuYXBzaG90LnYgICAgdmVyc2lvblxuLy8gQHBhcmFtIHNuYXBzaG90LmRhdGFcbi8vIEBwYXJhbSBzbmFwc2hvdC50eXBlXG4vLyBAcGFyYW0gY2FsbGJhY2tcbkRvYy5wcm90b3R5cGUuaW5nZXN0U25hcHNob3QgPSBmdW5jdGlvbihzbmFwc2hvdCwgY2FsbGJhY2spIHtcbiAgaWYgKCFzbmFwc2hvdCkgcmV0dXJuIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG5cbiAgaWYgKHR5cGVvZiBzbmFwc2hvdC52ICE9PSAnbnVtYmVyJykge1xuICAgIHZhciBlcnIgPSBuZXcgU2hhcmVEQkVycm9yKDUwMDgsICdNaXNzaW5nIHZlcnNpb24gaW4gaW5nZXN0ZWQgc25hcHNob3QuICcgKyB0aGlzLmNvbGxlY3Rpb24gKyAnLicgKyB0aGlzLmlkKTtcbiAgICBpZiAoY2FsbGJhY2spIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgfVxuXG4gIC8vIElmIHRoZSBkb2MgaXMgYWxyZWFkeSBjcmVhdGVkIG9yIHRoZXJlIGFyZSBvcHMgcGVuZGluZywgd2UgY2Fubm90IHVzZSB0aGVcbiAgLy8gaW5nZXN0ZWQgc25hcHNob3QgYW5kIG5lZWQgb3BzIGluIG9yZGVyIHRvIHVwZGF0ZSB0aGUgZG9jdW1lbnRcbiAgaWYgKHRoaXMudHlwZSB8fCB0aGlzLmhhc1dyaXRlUGVuZGluZygpKSB7XG4gICAgLy8gVGhlIHZlcnNpb24gc2hvdWxkIG9ubHkgYmUgbnVsbCBvbiBhIGNyZWF0ZWQgZG9jdW1lbnQgd2hlbiBpdCB3YXNcbiAgICAvLyBjcmVhdGVkIGxvY2FsbHkgd2l0aG91dCBmZXRjaGluZ1xuICAgIGlmICh0aGlzLnZlcnNpb24gPT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMuaGFzV3JpdGVQZW5kaW5nKCkpIHtcbiAgICAgICAgLy8gSWYgd2UgaGF2ZSBwZW5kaW5nIG9wcyBhbmQgd2UgZ2V0IGEgc25hcHNob3QgZm9yIGEgbG9jYWxseSBjcmVhdGVkXG4gICAgICAgIC8vIGRvY3VtZW50LCB3ZSBoYXZlIHRvIHdhaXQgZm9yIHRoZSBwZW5kaW5nIG9wcyB0byBjb21wbGV0ZSwgYmVjYXVzZVxuICAgICAgICAvLyB3ZSBkb24ndCBrbm93IHdoYXQgdmVyc2lvbiB0byBmZXRjaCBvcHMgZnJvbS4gSXQgaXMgcG9zc2libGUgdGhhdFxuICAgICAgICAvLyB0aGUgc25hcHNob3QgY2FtZSBmcm9tIG91ciBsb2NhbCBvcCwgYnV0IGl0IGlzIGFsc28gcG9zc2libGUgdGhhdFxuICAgICAgICAvLyB0aGUgZG9jIHdhcyBjcmVhdGVkIHJlbW90ZWx5ICh3aGljaCB3b3VsZCBjb25mbGljdCBhbmQgYmUgYW4gZXJyb3IpXG4gICAgICAgIHJldHVybiBjYWxsYmFjayAmJiB0aGlzLm9uY2UoJ25vIHdyaXRlIHBlbmRpbmcnLCBjYWxsYmFjayk7XG4gICAgICB9XG4gICAgICAvLyBPdGhlcndpc2UsIHdlJ3ZlIGVuY291bnRlZCBhbiBlcnJvciBzdGF0ZVxuICAgICAgdmFyIGVyciA9IG5ldyBTaGFyZURCRXJyb3IoNTAwOSwgJ0Nhbm5vdCBpbmdlc3Qgc25hcHNob3QgaW4gZG9jIHdpdGggbnVsbCB2ZXJzaW9uLiAnICsgdGhpcy5jb2xsZWN0aW9uICsgJy4nICsgdGhpcy5pZCk7XG4gICAgICBpZiAoY2FsbGJhY2spIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgICAgcmV0dXJuIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIpO1xuICAgIH1cbiAgICAvLyBJZiB3ZSBnb3QgYSBzbmFwc2hvdCBmb3IgYSB2ZXJzaW9uIGZ1cnRoZXIgYWxvbmcgdGhhbiB0aGUgZG9jdW1lbnQgaXNcbiAgICAvLyBjdXJyZW50bHksIGlzc3VlIGEgZmV0Y2ggdG8gZ2V0IHRoZSBsYXRlc3Qgb3BzIGFuZCBjYXRjaCB1cyB1cFxuICAgIGlmIChzbmFwc2hvdC52ID4gdGhpcy52ZXJzaW9uKSByZXR1cm4gdGhpcy5mZXRjaChjYWxsYmFjayk7XG4gICAgcmV0dXJuIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG4gIH1cblxuICAvLyBJZ25vcmUgdGhlIHNuYXBzaG90IGlmIHdlIGFyZSBhbHJlYWR5IGF0IGEgbmV3ZXIgdmVyc2lvbi4gVW5kZXIgbm9cbiAgLy8gY2lyY3Vtc3RhbmNlIHNob3VsZCB3ZSBldmVyIHNldCB0aGUgY3VycmVudCB2ZXJzaW9uIGJhY2t3YXJkXG4gIGlmICh0aGlzLnZlcnNpb24gPiBzbmFwc2hvdC52KSByZXR1cm4gY2FsbGJhY2sgJiYgY2FsbGJhY2soKTtcblxuICB0aGlzLnZlcnNpb24gPSBzbmFwc2hvdC52O1xuICB2YXIgdHlwZSA9IChzbmFwc2hvdC50eXBlID09PSB1bmRlZmluZWQpID8gdHlwZXMuZGVmYXVsdFR5cGUgOiBzbmFwc2hvdC50eXBlO1xuICB0aGlzLl9zZXRUeXBlKHR5cGUpO1xuICB0aGlzLmRhdGEgPSAodGhpcy50eXBlICYmIHRoaXMudHlwZS5kZXNlcmlhbGl6ZSkgP1xuICAgIHRoaXMudHlwZS5kZXNlcmlhbGl6ZShzbmFwc2hvdC5kYXRhKSA6XG4gICAgc25hcHNob3QuZGF0YTtcbiAgdGhpcy5lbWl0KCdsb2FkJyk7XG4gIGNhbGxiYWNrICYmIGNhbGxiYWNrKCk7XG59O1xuXG5Eb2MucHJvdG90eXBlLndoZW5Ob3RoaW5nUGVuZGluZyA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIGlmICh0aGlzLmhhc1BlbmRpbmcoKSkge1xuICAgIHRoaXMub25jZSgnbm90aGluZyBwZW5kaW5nJywgY2FsbGJhY2spO1xuICAgIHJldHVybjtcbiAgfVxuICBjYWxsYmFjaygpO1xufTtcblxuRG9jLnByb3RvdHlwZS5oYXNQZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhIShcbiAgICB0aGlzLmluZmxpZ2h0T3AgfHxcbiAgICB0aGlzLnBlbmRpbmdPcHMubGVuZ3RoIHx8XG4gICAgdGhpcy5pbmZsaWdodEZldGNoLmxlbmd0aCB8fFxuICAgIHRoaXMuaW5mbGlnaHRTdWJzY3JpYmUubGVuZ3RoIHx8XG4gICAgdGhpcy5pbmZsaWdodFVuc3Vic2NyaWJlLmxlbmd0aCB8fFxuICAgIHRoaXMucGVuZGluZ0ZldGNoLmxlbmd0aFxuICApO1xufTtcblxuRG9jLnByb3RvdHlwZS5oYXNXcml0ZVBlbmRpbmcgPSBmdW5jdGlvbigpIHtcbiAgcmV0dXJuICEhKHRoaXMuaW5mbGlnaHRPcCB8fCB0aGlzLnBlbmRpbmdPcHMubGVuZ3RoKTtcbn07XG5cbkRvYy5wcm90b3R5cGUuX2VtaXROb3RoaW5nUGVuZGluZyA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5oYXNXcml0ZVBlbmRpbmcoKSkgcmV0dXJuO1xuICB0aGlzLmVtaXQoJ25vIHdyaXRlIHBlbmRpbmcnKTtcbiAgaWYgKHRoaXMuaGFzUGVuZGluZygpKSByZXR1cm47XG4gIHRoaXMuZW1pdCgnbm90aGluZyBwZW5kaW5nJyk7XG59O1xuXG4vLyAqKioqIEhlbHBlcnMgZm9yIG5ldHdvcmsgbWVzc2FnZXNcblxuRG9jLnByb3RvdHlwZS5fZW1pdFJlc3BvbnNlRXJyb3IgPSBmdW5jdGlvbihlcnIsIGNhbGxiYWNrKSB7XG4gIGlmIChjYWxsYmFjaykge1xuICAgIGNhbGxiYWNrKGVycik7XG4gICAgdGhpcy5fZW1pdE5vdGhpbmdQZW5kaW5nKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIHRoaXMuX2VtaXROb3RoaW5nUGVuZGluZygpO1xuICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbn07XG5cbkRvYy5wcm90b3R5cGUuX2hhbmRsZUZldGNoID0gZnVuY3Rpb24oZXJyLCBzbmFwc2hvdCkge1xuICB2YXIgY2FsbGJhY2sgPSB0aGlzLmluZmxpZ2h0RmV0Y2guc2hpZnQoKTtcbiAgaWYgKGVycikgcmV0dXJuIHRoaXMuX2VtaXRSZXNwb25zZUVycm9yKGVyciwgY2FsbGJhY2spO1xuICB0aGlzLmluZ2VzdFNuYXBzaG90KHNuYXBzaG90LCBjYWxsYmFjayk7XG4gIHRoaXMuX2VtaXROb3RoaW5nUGVuZGluZygpO1xufTtcblxuRG9jLnByb3RvdHlwZS5faGFuZGxlU3Vic2NyaWJlID0gZnVuY3Rpb24oZXJyLCBzbmFwc2hvdCkge1xuICB2YXIgY2FsbGJhY2sgPSB0aGlzLmluZmxpZ2h0U3Vic2NyaWJlLnNoaWZ0KCk7XG4gIGlmIChlcnIpIHJldHVybiB0aGlzLl9lbWl0UmVzcG9uc2VFcnJvcihlcnIsIGNhbGxiYWNrKTtcbiAgLy8gSW5kaWNhdGUgd2UgYXJlIHN1YnNjcmliZWQgb25seSBpZiB0aGUgY2xpZW50IHN0aWxsIHdhbnRzIHRvIGJlLiBJbiB0aGVcbiAgLy8gdGltZSBzaW5jZSBjYWxsaW5nIHN1YnNjcmliZSBhbmQgcmVjZWl2aW5nIGEgcmVzcG9uc2UgZnJvbSB0aGUgc2VydmVyLFxuICAvLyB1bnN1YnNjcmliZSBjb3VsZCBoYXZlIGJlZW4gY2FsbGVkIGFuZCB3ZSBtaWdodCBhbHJlYWR5IGJlIHVuc3Vic2NyaWJlZFxuICAvLyBidXQgbm90IGhhdmUgcmVjZWl2ZWQgdGhlIHJlc3BvbnNlLiBBbHNvLCBiZWNhdXNlIHJlcXVlc3RzIGZyb20gdGhlXG4gIC8vIGNsaWVudCBhcmUgbm90IHNlcmlhbGl6ZWQgYW5kIG1heSB0YWtlIGRpZmZlcmVudCBhc3luYyB0aW1lIHRvIHByb2Nlc3MsXG4gIC8vIGl0IGlzIHBvc3NpYmxlIHRoYXQgd2UgY291bGQgaGVhciByZXNwb25zZXMgYmFjayBpbiBhIGRpZmZlcmVudCBvcmRlclxuICAvLyBmcm9tIHRoZSBvcmRlciBvcmlnaW5hbGx5IHNlbnRcbiAgaWYgKHRoaXMud2FudFN1YnNjcmliZSkgdGhpcy5zdWJzY3JpYmVkID0gdHJ1ZTtcbiAgdGhpcy5pbmdlc3RTbmFwc2hvdChzbmFwc2hvdCwgY2FsbGJhY2spO1xuICB0aGlzLl9lbWl0Tm90aGluZ1BlbmRpbmcoKTtcbn07XG5cbkRvYy5wcm90b3R5cGUuX2hhbmRsZVVuc3Vic2NyaWJlID0gZnVuY3Rpb24oZXJyKSB7XG4gIHZhciBjYWxsYmFjayA9IHRoaXMuaW5mbGlnaHRVbnN1YnNjcmliZS5zaGlmdCgpO1xuICBpZiAoZXJyKSByZXR1cm4gdGhpcy5fZW1pdFJlc3BvbnNlRXJyb3IoZXJyLCBjYWxsYmFjayk7XG4gIGlmIChjYWxsYmFjaykgY2FsbGJhY2soKTtcbiAgdGhpcy5fZW1pdE5vdGhpbmdQZW5kaW5nKCk7XG59O1xuXG5Eb2MucHJvdG90eXBlLl9oYW5kbGVPcCA9IGZ1bmN0aW9uKGVyciwgbWVzc2FnZSkge1xuICBpZiAoZXJyKSB7XG4gICAgaWYgKHRoaXMuaW5mbGlnaHRPcCkge1xuICAgICAgLy8gVGhlIHNlcnZlciBoYXMgcmVqZWN0ZWQgc3VibWlzc2lvbiBvZiB0aGUgY3VycmVudCBvcGVyYXRpb24uIElmIHdlIGdldFxuICAgICAgLy8gYW4gZXJyb3IgY29kZSA0MDAyIFwiT3Agc3VibWl0IHJlamVjdGVkXCIsIHRoaXMgd2FzIGRvbmUgaW50ZW50aW9uYWxseVxuICAgICAgLy8gYW5kIHdlIHNob3VsZCByb2xsIGJhY2sgYnV0IG5vdCByZXR1cm4gYW4gZXJyb3IgdG8gdGhlIHVzZXIuXG4gICAgICBpZiAoZXJyLmNvZGUgPT09IDQwMDIpIGVyciA9IG51bGw7XG4gICAgICByZXR1cm4gdGhpcy5fcm9sbGJhY2soZXJyKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIpO1xuICB9XG5cbiAgaWYgKHRoaXMuaW5mbGlnaHRPcCAmJlxuICAgICAgbWVzc2FnZS5zcmMgPT09IHRoaXMuaW5mbGlnaHRPcC5zcmMgJiZcbiAgICAgIG1lc3NhZ2Uuc2VxID09PSB0aGlzLmluZmxpZ2h0T3Auc2VxKSB7XG4gICAgLy8gVGhlIG9wIGhhcyBhbHJlYWR5IGJlZW4gYXBwbGllZCBsb2NhbGx5LiBKdXN0IHVwZGF0ZSB0aGUgdmVyc2lvblxuICAgIC8vIGFuZCBwZW5kaW5nIHN0YXRlIGFwcHJvcHJpYXRlbHlcbiAgICB0aGlzLl9vcEFja25vd2xlZGdlZChtZXNzYWdlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAodGhpcy52ZXJzaW9uID09IG51bGwgfHwgbWVzc2FnZS52ID4gdGhpcy52ZXJzaW9uKSB7XG4gICAgLy8gVGhpcyB3aWxsIGhhcHBlbiBpbiBub3JtYWwgb3BlcmF0aW9uIGlmIHdlIGJlY29tZSBzdWJzY3JpYmVkIHRvIGFcbiAgICAvLyBuZXcgZG9jdW1lbnQgdmlhIGEgcXVlcnkuIEl0IGNhbiBhbHNvIGhhcHBlbiBpZiB3ZSBnZXQgYW4gb3AgZm9yXG4gICAgLy8gYSBmdXR1cmUgdmVyc2lvbiBiZXlvbmQgdGhlIHZlcnNpb24gd2UgYXJlIGV4cGVjdGluZyBuZXh0LiBUaGlzXG4gICAgLy8gY291bGQgaGFwcGVuIGlmIHRoZSBzZXJ2ZXIgZG9lc24ndCBwdWJsaXNoIGFuIG9wIGZvciB3aGF0ZXZlciByZWFzb25cbiAgICAvLyBvciBiZWNhdXNlIG9mIGEgcmFjZSBjb25kaXRpb24uIEluIGFueSBjYXNlLCB3ZSBjYW4gc2VuZCBhIGZldGNoXG4gICAgLy8gY29tbWFuZCB0byBjYXRjaCBiYWNrIHVwLlxuICAgIC8vXG4gICAgLy8gRmV0Y2ggb25seSBzZW5kcyBhIG5ldyBmZXRjaCBjb21tYW5kIGlmIG5vIGZldGNoZXMgYXJlIGluZmxpZ2h0LCB3aGljaFxuICAgIC8vIHdpbGwgYWN0IGFzIGEgbmF0dXJhbCBkZWJvdW5jaW5nIHNvIHdlIGRvbid0IHNlbmQgbXVsdGlwbGUgZmV0Y2hcbiAgICAvLyByZXF1ZXN0cyBmb3IgbWFueSBvcHMgcmVjZWl2ZWQgYXQgb25jZS5cbiAgICB0aGlzLmZldGNoKCk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG1lc3NhZ2UudiA8IHRoaXMudmVyc2lvbikge1xuICAgIC8vIFdlIGNhbiBzYWZlbHkgaWdub3JlIHRoZSBvbGQgKGR1cGxpY2F0ZSkgb3BlcmF0aW9uLlxuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmICh0aGlzLmluZmxpZ2h0T3ApIHtcbiAgICB2YXIgdHJhbnNmb3JtRXJyID0gdHJhbnNmb3JtWCh0aGlzLmluZmxpZ2h0T3AsIG1lc3NhZ2UpO1xuICAgIGlmICh0cmFuc2Zvcm1FcnIpIHJldHVybiB0aGlzLl9oYXJkUm9sbGJhY2sodHJhbnNmb3JtRXJyKTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wZW5kaW5nT3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIHRyYW5zZm9ybUVyciA9IHRyYW5zZm9ybVgodGhpcy5wZW5kaW5nT3BzW2ldLCBtZXNzYWdlKTtcbiAgICBpZiAodHJhbnNmb3JtRXJyKSByZXR1cm4gdGhpcy5faGFyZFJvbGxiYWNrKHRyYW5zZm9ybUVycik7XG4gIH1cblxuICB0aGlzLnZlcnNpb24rKztcbiAgdGhpcy5fb3RBcHBseShtZXNzYWdlLCBmYWxzZSk7XG4gIHJldHVybjtcbn07XG5cbi8vIENhbGxlZCB3aGVuZXZlciAoeW91IGd1ZXNzZWQgaXQhKSB0aGUgY29ubmVjdGlvbiBzdGF0ZSBjaGFuZ2VzLiBUaGlzIHdpbGxcbi8vIGhhcHBlbiB3aGVuIHdlIGdldCBkaXNjb25uZWN0ZWQgJiByZWNvbm5lY3QuXG5Eb2MucHJvdG90eXBlLl9vbkNvbm5lY3Rpb25TdGF0ZUNoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKHRoaXMuY29ubmVjdGlvbi5jYW5TZW5kKSB7XG4gICAgdGhpcy5mbHVzaCgpO1xuICAgIHRoaXMuX3Jlc3Vic2NyaWJlKCk7XG4gIH0gZWxzZSB7XG4gICAgaWYgKHRoaXMuaW5mbGlnaHRPcCkge1xuICAgICAgdGhpcy5wZW5kaW5nT3BzLnVuc2hpZnQodGhpcy5pbmZsaWdodE9wKTtcbiAgICAgIHRoaXMuaW5mbGlnaHRPcCA9IG51bGw7XG4gICAgfVxuICAgIHRoaXMuc3Vic2NyaWJlZCA9IGZhbHNlO1xuICAgIGlmICh0aGlzLmluZmxpZ2h0RmV0Y2gubGVuZ3RoIHx8IHRoaXMuaW5mbGlnaHRTdWJzY3JpYmUubGVuZ3RoKSB7XG4gICAgICB0aGlzLnBlbmRpbmdGZXRjaCA9IHRoaXMucGVuZGluZ0ZldGNoLmNvbmNhdCh0aGlzLmluZmxpZ2h0RmV0Y2gsIHRoaXMuaW5mbGlnaHRTdWJzY3JpYmUpO1xuICAgICAgdGhpcy5pbmZsaWdodEZldGNoLmxlbmd0aCA9IDA7XG4gICAgICB0aGlzLmluZmxpZ2h0U3Vic2NyaWJlLmxlbmd0aCA9IDA7XG4gICAgfVxuICAgIGlmICh0aGlzLmluZmxpZ2h0VW5zdWJzY3JpYmUubGVuZ3RoKSB7XG4gICAgICB2YXIgY2FsbGJhY2tzID0gdGhpcy5pbmZsaWdodFVuc3Vic2NyaWJlO1xuICAgICAgdGhpcy5pbmZsaWdodFVuc3Vic2NyaWJlID0gW107XG4gICAgICBjYWxsRWFjaChjYWxsYmFja3MpO1xuICAgIH1cbiAgfVxufTtcblxuRG9jLnByb3RvdHlwZS5fcmVzdWJzY3JpYmUgPSBmdW5jdGlvbigpIHtcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMucGVuZGluZ0ZldGNoO1xuICB0aGlzLnBlbmRpbmdGZXRjaCA9IFtdO1xuXG4gIGlmICh0aGlzLndhbnRTdWJzY3JpYmUpIHtcbiAgICBpZiAoY2FsbGJhY2tzLmxlbmd0aCkge1xuICAgICAgdGhpcy5zdWJzY3JpYmUoZnVuY3Rpb24oZXJyKSB7XG4gICAgICAgIGNhbGxFYWNoKGNhbGxiYWNrcywgZXJyKTtcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0aGlzLnN1YnNjcmliZSgpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChjYWxsYmFja3MubGVuZ3RoKSB7XG4gICAgdGhpcy5mZXRjaChmdW5jdGlvbihlcnIpIHtcbiAgICAgIGNhbGxFYWNoKGNhbGxiYWNrcywgZXJyKTtcbiAgICB9KTtcbiAgfVxufTtcblxuLy8gUmVxdWVzdCB0aGUgY3VycmVudCBkb2N1bWVudCBzbmFwc2hvdCBvciBvcHMgdGhhdCBicmluZyB1cyB1cCB0byBkYXRlXG5Eb2MucHJvdG90eXBlLmZldGNoID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgaWYgKHRoaXMuY29ubmVjdGlvbi5jYW5TZW5kKSB7XG4gICAgdmFyIGlzRHVwbGljYXRlID0gdGhpcy5jb25uZWN0aW9uLnNlbmRGZXRjaCh0aGlzKTtcbiAgICBwdXNoQWN0aW9uQ2FsbGJhY2sodGhpcy5pbmZsaWdodEZldGNoLCBpc0R1cGxpY2F0ZSwgY2FsbGJhY2spO1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnBlbmRpbmdGZXRjaC5wdXNoKGNhbGxiYWNrKTtcbn07XG5cbi8vIEZldGNoIHRoZSBpbml0aWFsIGRvY3VtZW50IGFuZCBrZWVwIHJlY2VpdmluZyB1cGRhdGVzXG5Eb2MucHJvdG90eXBlLnN1YnNjcmliZSA9IGZ1bmN0aW9uKGNhbGxiYWNrKSB7XG4gIHRoaXMud2FudFN1YnNjcmliZSA9IHRydWU7XG4gIGlmICh0aGlzLmNvbm5lY3Rpb24uY2FuU2VuZCkge1xuICAgIHZhciBpc0R1cGxpY2F0ZSA9IHRoaXMuY29ubmVjdGlvbi5zZW5kU3Vic2NyaWJlKHRoaXMpO1xuICAgIHB1c2hBY3Rpb25DYWxsYmFjayh0aGlzLmluZmxpZ2h0U3Vic2NyaWJlLCBpc0R1cGxpY2F0ZSwgY2FsbGJhY2spO1xuICAgIHJldHVybjtcbiAgfVxuICB0aGlzLnBlbmRpbmdGZXRjaC5wdXNoKGNhbGxiYWNrKTtcbn07XG5cbi8vIFVuc3Vic2NyaWJlLiBUaGUgZGF0YSB3aWxsIHN0YXkgYXJvdW5kIGluIGxvY2FsIG1lbW9yeSwgYnV0IHdlJ2xsIHN0b3Bcbi8vIHJlY2VpdmluZyB1cGRhdGVzXG5Eb2MucHJvdG90eXBlLnVuc3Vic2NyaWJlID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgdGhpcy53YW50U3Vic2NyaWJlID0gZmFsc2U7XG4gIC8vIFRoZSBzdWJzY3JpYmVkIHN0YXRlIHNob3VsZCBiZSBjb25zZXJ2YXRpdmUgaW4gaW5kaWNhdGluZyB3aGVuIHdlIGFyZVxuICAvLyBzdWJzY3JpYmVkIG9uIHRoZSBzZXJ2ZXIuIFdlJ2xsIGFjdHVhbGx5IGJlIHVuc3Vic2NyaWJlZCBzb21lIHRpbWVcbiAgLy8gYmV0d2VlbiBzZW5kaW5nIHRoZSBtZXNzYWdlIGFuZCBoZWFyaW5nIGJhY2ssIGJ1dCB3ZSBjYW5ub3Qga25vdyBleGFjdGx5XG4gIC8vIHdoZW4uIFRodXMsIGltbWVkaWF0ZWx5IG1hcmsgdXMgYXMgbm90IHN1YnNjcmliZWRcbiAgdGhpcy5zdWJzY3JpYmVkID0gZmFsc2U7XG4gIGlmICh0aGlzLmNvbm5lY3Rpb24uY2FuU2VuZCkge1xuICAgIHZhciBpc0R1cGxpY2F0ZSA9IHRoaXMuY29ubmVjdGlvbi5zZW5kVW5zdWJzY3JpYmUodGhpcyk7XG4gICAgcHVzaEFjdGlvbkNhbGxiYWNrKHRoaXMuaW5mbGlnaHRVbnN1YnNjcmliZSwgaXNEdXBsaWNhdGUsIGNhbGxiYWNrKTtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKGNhbGxiYWNrKSBwcm9jZXNzLm5leHRUaWNrKGNhbGxiYWNrKTtcbn07XG5cbmZ1bmN0aW9uIHB1c2hBY3Rpb25DYWxsYmFjayhpbmZsaWdodCwgaXNEdXBsaWNhdGUsIGNhbGxiYWNrKSB7XG4gIGlmIChpc0R1cGxpY2F0ZSkge1xuICAgIHZhciBsYXN0Q2FsbGJhY2sgPSBpbmZsaWdodC5wb3AoKTtcbiAgICBpbmZsaWdodC5wdXNoKGZ1bmN0aW9uKGVycikge1xuICAgICAgbGFzdENhbGxiYWNrICYmIGxhc3RDYWxsYmFjayhlcnIpO1xuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2soZXJyKTtcbiAgICB9KTtcbiAgfSBlbHNlIHtcbiAgICBpbmZsaWdodC5wdXNoKGNhbGxiYWNrKTtcbiAgfVxufVxuXG5cbi8vIE9wZXJhdGlvbnMgLy9cblxuLy8gU2VuZCB0aGUgbmV4dCBwZW5kaW5nIG9wIHRvIHRoZSBzZXJ2ZXIsIGlmIHdlIGNhbi5cbi8vXG4vLyBPbmx5IG9uZSBvcGVyYXRpb24gY2FuIGJlIGluLWZsaWdodCBhdCBhIHRpbWUuIElmIGFuIG9wZXJhdGlvbiBpcyBhbHJlYWR5IG9uXG4vLyBpdHMgd2F5LCBvciB3ZSdyZSBub3QgY3VycmVudGx5IGNvbm5lY3RlZCwgdGhpcyBtZXRob2QgZG9lcyBub3RoaW5nLlxuRG9jLnByb3RvdHlwZS5mbHVzaCA9IGZ1bmN0aW9uKCkge1xuICAvLyBJZ25vcmUgaWYgd2UgY2FuJ3Qgc2VuZCBvciB3ZSBhcmUgYWxyZWFkeSBzZW5kaW5nIGFuIG9wXG4gIGlmICghdGhpcy5jb25uZWN0aW9uLmNhblNlbmQgfHwgdGhpcy5pbmZsaWdodE9wKSByZXR1cm47XG5cbiAgLy8gU2VuZCBmaXJzdCBwZW5kaW5nIG9wIHVubGVzcyBwYXVzZWRcbiAgaWYgKCF0aGlzLnBhdXNlZCAmJiB0aGlzLnBlbmRpbmdPcHMubGVuZ3RoKSB7XG4gICAgdGhpcy5fc2VuZE9wKCk7XG4gIH1cbn07XG5cbi8vIEhlbHBlciBmdW5jdGlvbiB0byBzZXQgb3AgdG8gY29udGFpbiBhIG5vLW9wLlxuZnVuY3Rpb24gc2V0Tm9PcChvcCkge1xuICBkZWxldGUgb3Aub3A7XG4gIGRlbGV0ZSBvcC5jcmVhdGU7XG4gIGRlbGV0ZSBvcC5kZWw7XG59XG5cbi8vIFRyYW5zZm9ybSBzZXJ2ZXIgb3AgZGF0YSBieSBhIGNsaWVudCBvcCwgYW5kIHZpY2UgdmVyc2EuIE9wcyBhcmUgZWRpdGVkIGluIHBsYWNlLlxuZnVuY3Rpb24gdHJhbnNmb3JtWChjbGllbnQsIHNlcnZlcikge1xuICAvLyBPcmRlciBvZiBzdGF0ZW1lbnRzIGluIHRoaXMgZnVuY3Rpb24gbWF0dGVycy4gQmUgZXNwZWNpYWxseSBjYXJlZnVsIGlmXG4gIC8vIHJlZmFjdG9yaW5nIHRoaXMgZnVuY3Rpb25cblxuICAvLyBBIGNsaWVudCBkZWxldGUgb3Agc2hvdWxkIGRvbWluYXRlIGlmIGJvdGggdGhlIHNlcnZlciBhbmQgdGhlIGNsaWVudFxuICAvLyBkZWxldGUgdGhlIGRvY3VtZW50LiBUaHVzLCBhbnkgb3BzIGZvbGxvd2luZyB0aGUgY2xpZW50IGRlbGV0ZSAoc3VjaCBhcyBhXG4gIC8vIHN1YnNlcXVlbnQgY3JlYXRlKSB3aWxsIGJlIG1haW50YWluZWQsIHNpbmNlIHRoZSBzZXJ2ZXIgb3AgaXMgdHJhbnNmb3JtZWRcbiAgLy8gdG8gYSBuby1vcFxuICBpZiAoY2xpZW50LmRlbCkgcmV0dXJuIHNldE5vT3Aoc2VydmVyKTtcblxuICBpZiAoc2VydmVyLmRlbCkge1xuICAgIHJldHVybiBuZXcgU2hhcmVEQkVycm9yKDQwMTcsICdEb2N1bWVudCB3YXMgZGVsZXRlZCcpO1xuICB9XG4gIGlmIChzZXJ2ZXIuY3JlYXRlKSB7XG4gICAgcmV0dXJuIG5ldyBTaGFyZURCRXJyb3IoNDAxOCwgJ0RvY3VtZW50IGFscmVkeSBjcmVhdGVkJyk7XG4gIH1cblxuICAvLyBJZ25vcmUgbm8tb3AgY29taW5nIGZyb20gc2VydmVyXG4gIGlmICghc2VydmVyLm9wKSByZXR1cm47XG5cbiAgLy8gSSBiZWxpZXZlIHRoYXQgdGhpcyBzaG91bGQgbm90IG9jY3VyLCBidXQgY2hlY2sganVzdCBpbiBjYXNlXG4gIGlmIChjbGllbnQuY3JlYXRlKSB7XG4gICAgcmV0dXJuIG5ldyBTaGFyZURCRXJyb3IoNDAxOCwgJ0RvY3VtZW50IGFscmVhZHkgY3JlYXRlZCcpO1xuICB9XG5cbiAgLy8gVGhleSBib3RoIGVkaXRlZCB0aGUgZG9jdW1lbnQuIFRoaXMgaXMgdGhlIG5vcm1hbCBjYXNlIGZvciB0aGlzIGZ1bmN0aW9uIC1cbiAgLy8gYXMgaW4sIG1vc3Qgb2YgdGhlIHRpbWUgd2UnbGwgZW5kIHVwIGRvd24gaGVyZS5cbiAgLy9cbiAgLy8gWW91IHNob3VsZCBiZSB3b25kZXJpbmcgd2h5IEknbSB1c2luZyBjbGllbnQudHlwZSBpbnN0ZWFkIG9mIHRoaXMudHlwZS5cbiAgLy8gVGhlIHJlYXNvbiBpcywgaWYgd2UgZ2V0IG9wcyBhdCBhbiBvbGQgdmVyc2lvbiBvZiB0aGUgZG9jdW1lbnQsIHRoaXMudHlwZVxuICAvLyBtaWdodCBiZSB1bmRlZmluZWQgb3IgYSB0b3RhbGx5IGRpZmZlcmVudCB0eXBlLiBCeSBwaW5uaW5nIHRoZSB0eXBlIHRvIHRoZVxuICAvLyBvcCBkYXRhLCB3ZSBtYWtlIHN1cmUgdGhlIHJpZ2h0IHR5cGUgaGFzIGl0cyB0cmFuc2Zvcm0gZnVuY3Rpb24gY2FsbGVkLlxuICBpZiAoY2xpZW50LnR5cGUudHJhbnNmb3JtWCkge1xuICAgIHZhciByZXN1bHQgPSBjbGllbnQudHlwZS50cmFuc2Zvcm1YKGNsaWVudC5vcCwgc2VydmVyLm9wKTtcbiAgICBjbGllbnQub3AgPSByZXN1bHRbMF07XG4gICAgc2VydmVyLm9wID0gcmVzdWx0WzFdO1xuICB9IGVsc2Uge1xuICAgIHZhciBjbGllbnRPcCA9IGNsaWVudC50eXBlLnRyYW5zZm9ybShjbGllbnQub3AsIHNlcnZlci5vcCwgJ2xlZnQnKTtcbiAgICB2YXIgc2VydmVyT3AgPSBjbGllbnQudHlwZS50cmFuc2Zvcm0oc2VydmVyLm9wLCBjbGllbnQub3AsICdyaWdodCcpO1xuICAgIGNsaWVudC5vcCA9IGNsaWVudE9wO1xuICAgIHNlcnZlci5vcCA9IHNlcnZlck9wO1xuICB9XG59O1xuXG4vKipcbiAqIEFwcGxpZXMgdGhlIG9wZXJhdGlvbiB0byB0aGUgc25hcHNob3RcbiAqXG4gKiBJZiB0aGUgb3BlcmF0aW9uIGlzIGNyZWF0ZSBvciBkZWxldGUgaXQgZW1pdHMgYGNyZWF0ZWAgb3IgYGRlbGAuIFRoZW4gdGhlXG4gKiBvcGVyYXRpb24gaXMgYXBwbGllZCB0byB0aGUgc25hcHNob3QgYW5kIGBvcGAgYW5kIGBhZnRlciBvcGAgYXJlIGVtaXR0ZWQuXG4gKiBJZiB0aGUgdHlwZSBzdXBwb3J0cyBpbmNyZW1lbnRhbCB1cGRhdGVzIGFuZCBgdGhpcy5pbmNyZW1lbnRhbGAgaXMgdHJ1ZSB3ZVxuICogZmlyZSBgb3BgIGFmdGVyIGV2ZXJ5IHNtYWxsIG9wZXJhdGlvbi5cbiAqXG4gKiBUaGlzIGlzIHRoZSBvbmx5IGZ1bmN0aW9uIHRvIGZpcmUgdGhlIGFib3ZlIG1lbnRpb25lZCBldmVudHMuXG4gKlxuICogQHByaXZhdGVcbiAqL1xuRG9jLnByb3RvdHlwZS5fb3RBcHBseSA9IGZ1bmN0aW9uKG9wLCBzb3VyY2UpIHtcbiAgaWYgKG9wLm9wKSB7XG4gICAgaWYgKCF0aGlzLnR5cGUpIHtcbiAgICAgIHZhciBlcnIgPSBuZXcgU2hhcmVEQkVycm9yKDQwMTUsICdDYW5ub3QgYXBwbHkgb3AgdG8gdW5jcmVhdGVkIGRvY3VtZW50LiAnICsgdGhpcy5jb2xsZWN0aW9uICsgJy4nICsgdGhpcy5pZCk7XG4gICAgICByZXR1cm4gdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgfVxuXG4gICAgLy8gSXRlcmF0aXZlbHkgYXBwbHkgbXVsdGktY29tcG9uZW50IHJlbW90ZSBvcGVyYXRpb25zIGFuZCByb2xsYmFjayBvcHNcbiAgICAvLyAoc291cmNlID09PSBmYWxzZSkgZm9yIHRoZSBkZWZhdWx0IEpTT04wIE9UIHR5cGUuIEl0IGNvdWxkIHVzZVxuICAgIC8vIHR5cGUuc2hhdHRlcigpLCBidXQgc2luY2UgdGhpcyBjb2RlIGlzIHNvIHNwZWNpZmljIHRvIHVzZSBjYXNlcyBmb3IgdGhlXG4gICAgLy8gSlNPTjAgdHlwZSBhbmQgU2hhcmVEQiBleHBsaWNpdGx5IGJ1bmRsZXMgdGhlIGRlZmF1bHQgdHlwZSwgd2UgbWlnaHQgYXNcbiAgICAvLyB3ZWxsIHdyaXRlIGl0IHRoaXMgd2F5IGFuZCBzYXZlIG5lZWRpbmcgdG8gaXRlcmF0ZSB0aHJvdWdoIHRoZSBvcFxuICAgIC8vIGNvbXBvbmVudHMgdHdpY2UuXG4gICAgLy9cbiAgICAvLyBJZGVhbGx5LCB3ZSB3b3VsZCBub3QgbmVlZCB0aGlzIGV4dHJhIGNvbXBsZXhpdHkuIEhvd2V2ZXIsIGl0IGlzXG4gICAgLy8gaGVscGZ1bCBmb3IgaW1wbGVtZW50aW5nIGJpbmRpbmdzIHRoYXQgdXBkYXRlIERPTSBub2RlcyBhbmQgb3RoZXJcbiAgICAvLyBzdGF0ZWZ1bCBvYmplY3RzIGJ5IHRyYW5zbGF0aW5nIG9wIGV2ZW50cyBkaXJlY3RseSBpbnRvIGNvcnJlc3BvbmRpbmdcbiAgICAvLyBtdXRhdGlvbnMuIFN1Y2ggYmluZGluZ3MgYXJlIG1vc3QgZWFzaWx5IHdyaXR0ZW4gYXMgcmVzcG9uZGluZyB0b1xuICAgIC8vIGluZGl2aWR1YWwgb3AgY29tcG9uZW50cyBvbmUgYXQgYSB0aW1lIGluIG9yZGVyLCBhbmQgaXQgaXMgaW1wb3J0YW50XG4gICAgLy8gdGhhdCB0aGUgc25hcHNob3Qgb25seSBpbmNsdWRlIHVwZGF0ZXMgZnJvbSB0aGUgcGFydGljdWxhciBvcCBjb21wb25lbnRcbiAgICAvLyBhdCB0aGUgdGltZSBvZiBlbWlzc2lvbi4gRWxpbWluYXRpbmcgdGhpcyB3b3VsZCByZXF1aXJlIHJldGhpbmtpbmcgaG93XG4gICAgLy8gc3VjaCBleHRlcm5hbCBiaW5kaW5ncyBhcmUgaW1wbGVtZW50ZWQuXG4gICAgaWYgKCFzb3VyY2UgJiYgdGhpcy50eXBlID09PSB0eXBlcy5kZWZhdWx0VHlwZSAmJiBvcC5vcC5sZW5ndGggPiAxKSB7XG4gICAgICBpZiAoIXRoaXMuYXBwbHlTdGFjaykgdGhpcy5hcHBseVN0YWNrID0gW107XG4gICAgICB2YXIgc3RhY2tMZW5ndGggPSB0aGlzLmFwcGx5U3RhY2subGVuZ3RoO1xuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvcC5vcC5sZW5ndGg7IGkrKykge1xuICAgICAgICB2YXIgY29tcG9uZW50ID0gb3Aub3BbaV07XG4gICAgICAgIHZhciBjb21wb25lbnRPcCA9IHtvcDogW2NvbXBvbmVudF19O1xuICAgICAgICAvLyBUcmFuc2Zvcm0gY29tcG9uZW50T3AgYWdhaW5zdCBhbnkgb3BzIHRoYXQgaGF2ZSBiZWVuIHN1Ym1pdHRlZFxuICAgICAgICAvLyBzeWNocm9ub3VzbHkgaW5zaWRlIG9mIGFuIG9wIGV2ZW50IGhhbmRsZXIgc2luY2Ugd2UgYmVnYW4gYXBwbHkgb2ZcbiAgICAgICAgLy8gb3VyIG9wZXJhdGlvblxuICAgICAgICBmb3IgKHZhciBqID0gc3RhY2tMZW5ndGg7IGogPCB0aGlzLmFwcGx5U3RhY2subGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICB2YXIgdHJhbnNmb3JtRXJyID0gdHJhbnNmb3JtWCh0aGlzLmFwcGx5U3RhY2tbal0sIGNvbXBvbmVudE9wKTtcbiAgICAgICAgICBpZiAodHJhbnNmb3JtRXJyKSByZXR1cm4gdGhpcy5faGFyZFJvbGxiYWNrKHRyYW5zZm9ybUVycik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gQXBwbHkgdGhlIGluZGl2aWR1YWwgb3AgY29tcG9uZW50XG4gICAgICAgIHRoaXMuZW1pdCgnYmVmb3JlIG9wJywgY29tcG9uZW50T3Aub3AsIHNvdXJjZSk7XG4gICAgICAgIHRoaXMuZGF0YSA9IHRoaXMudHlwZS5hcHBseSh0aGlzLmRhdGEsIGNvbXBvbmVudE9wLm9wKTtcbiAgICAgICAgdGhpcy5lbWl0KCdvcCcsIGNvbXBvbmVudE9wLm9wLCBzb3VyY2UpO1xuICAgICAgfVxuICAgICAgLy8gUG9wIHdoYXRldmVyIHdhcyBzdWJtaXR0ZWQgc2luY2Ugd2Ugc3RhcnRlZCBhcHBseWluZyB0aGlzIG9wXG4gICAgICB0aGlzLl9wb3BBcHBseVN0YWNrKHN0YWNrTGVuZ3RoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBUaGUgJ2JlZm9yZSBvcCcgZXZlbnQgZW5hYmxlcyBjbGllbnRzIHRvIHB1bGwgYW55IG5lY2Vzc2FyeSBkYXRhIG91dCBvZlxuICAgIC8vIHRoZSBzbmFwc2hvdCBiZWZvcmUgaXQgZ2V0cyBjaGFuZ2VkXG4gICAgdGhpcy5lbWl0KCdiZWZvcmUgb3AnLCBvcC5vcCwgc291cmNlKTtcbiAgICAvLyBBcHBseSB0aGUgb3BlcmF0aW9uIHRvIHRoZSBsb2NhbCBkYXRhLCBtdXRhdGluZyBpdCBpbiBwbGFjZVxuICAgIHRoaXMuZGF0YSA9IHRoaXMudHlwZS5hcHBseSh0aGlzLmRhdGEsIG9wLm9wKTtcbiAgICAvLyBFbWl0IGFuICdvcCcgZXZlbnQgb25jZSB0aGUgbG9jYWwgZGF0YSBpbmNsdWRlcyB0aGUgY2hhbmdlcyBmcm9tIHRoZVxuICAgIC8vIG9wLiBGb3IgbG9jYWxseSBzdWJtaXR0ZWQgb3BzLCB0aGlzIHdpbGwgYmUgc3luY2hyb25vdXNseSB3aXRoXG4gICAgLy8gc3VibWlzc2lvbiBhbmQgYmVmb3JlIHRoZSBzZXJ2ZXIgb3Igb3RoZXIgY2xpZW50cyBoYXZlIHJlY2VpdmVkIHRoZSBvcC5cbiAgICAvLyBGb3Igb3BzIGZyb20gb3RoZXIgY2xpZW50cywgdGhpcyB3aWxsIGJlIGFmdGVyIHRoZSBvcCBoYXMgYmVlblxuICAgIC8vIGNvbW1pdHRlZCB0byB0aGUgZGF0YWJhc2UgYW5kIHB1Ymxpc2hlZFxuICAgIHRoaXMuZW1pdCgnb3AnLCBvcC5vcCwgc291cmNlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAob3AuY3JlYXRlKSB7XG4gICAgdGhpcy5fc2V0VHlwZShvcC5jcmVhdGUudHlwZSk7XG4gICAgdGhpcy5kYXRhID0gKHRoaXMudHlwZS5kZXNlcmlhbGl6ZSkgP1xuICAgICAgKHRoaXMudHlwZS5jcmVhdGVEZXNlcmlhbGl6ZWQpID9cbiAgICAgICAgdGhpcy50eXBlLmNyZWF0ZURlc2VyaWFsaXplZChvcC5jcmVhdGUuZGF0YSkgOlxuICAgICAgICB0aGlzLnR5cGUuZGVzZXJpYWxpemUodGhpcy50eXBlLmNyZWF0ZShvcC5jcmVhdGUuZGF0YSkpIDpcbiAgICAgIHRoaXMudHlwZS5jcmVhdGUob3AuY3JlYXRlLmRhdGEpO1xuICAgIHRoaXMuZW1pdCgnY3JlYXRlJywgc291cmNlKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAob3AuZGVsKSB7XG4gICAgdmFyIG9sZERhdGEgPSB0aGlzLmRhdGE7XG4gICAgdGhpcy5fc2V0VHlwZShudWxsKTtcbiAgICB0aGlzLmVtaXQoJ2RlbCcsIG9sZERhdGEsIHNvdXJjZSk7XG4gICAgcmV0dXJuO1xuICB9XG59O1xuXG5cbi8vICoqKioqIFNlbmRpbmcgb3BlcmF0aW9uc1xuXG4vLyBBY3R1YWxseSBzZW5kIG9wIHRvIHRoZSBzZXJ2ZXIuXG5Eb2MucHJvdG90eXBlLl9zZW5kT3AgPSBmdW5jdGlvbigpIHtcbiAgLy8gV2FpdCB1bnRpbCB3ZSBoYXZlIGEgc3JjIGlkIGZyb20gdGhlIHNlcnZlclxuICB2YXIgc3JjID0gdGhpcy5jb25uZWN0aW9uLmlkO1xuICBpZiAoIXNyYykgcmV0dXJuO1xuXG4gIC8vIFdoZW4gdGhlcmUgaXMgbm8gaW5mbGlnaHRPcCwgc2VuZCB0aGUgZmlyc3QgaXRlbSBpbiBwZW5kaW5nT3BzLiBJZlxuICAvLyB0aGVyZSBpcyBpbmZsaWdodE9wLCB0cnkgc2VuZGluZyBpdCBhZ2FpblxuICBpZiAoIXRoaXMuaW5mbGlnaHRPcCkge1xuICAgIC8vIFNlbmQgZmlyc3QgcGVuZGluZyBvcFxuICAgIHRoaXMuaW5mbGlnaHRPcCA9IHRoaXMucGVuZGluZ09wcy5zaGlmdCgpO1xuICB9XG4gIHZhciBvcCA9IHRoaXMuaW5mbGlnaHRPcDtcbiAgaWYgKCFvcCkge1xuICAgIHZhciBlcnIgPSBuZXcgU2hhcmVEQkVycm9yKDUwMTAsICdObyBvcCB0byBzZW5kIG9uIGNhbGwgdG8gX3NlbmRPcCcpO1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgfVxuXG4gIC8vIFRyYWNrIGRhdGEgZm9yIHJldHJ5aW5nIG9wc1xuICBvcC5zZW50QXQgPSBEYXRlLm5vdygpO1xuICBvcC5yZXRyaWVzID0gKG9wLnJldHJpZXMgPT0gbnVsbCkgPyAwIDogb3AucmV0cmllcyArIDE7XG5cbiAgLy8gVGhlIHNyYyArIHNlcSBudW1iZXIgaXMgYSB1bmlxdWUgSUQgcmVwcmVzZW50aW5nIHRoaXMgb3BlcmF0aW9uLiBUaGlzIHR1cGxlXG4gIC8vIGlzIHVzZWQgb24gdGhlIHNlcnZlciB0byBkZXRlY3Qgd2hlbiBvcHMgaGF2ZSBiZWVuIHNlbnQgbXVsdGlwbGUgdGltZXMgYW5kXG4gIC8vIG9uIHRoZSBjbGllbnQgdG8gbWF0Y2ggYWNrbm93bGVkZ2VtZW50IG9mIGFuIG9wIGJhY2sgdG8gdGhlIGluZmxpZ2h0T3AuXG4gIC8vIE5vdGUgdGhhdCB0aGUgc3JjIGNvdWxkIGJlIGRpZmZlcmVudCBmcm9tIHRoaXMuY29ubmVjdGlvbi5pZCBhZnRlciBhXG4gIC8vIHJlY29ubmVjdCwgc2luY2UgYW4gb3AgbWF5IHN0aWxsIGJlIHBlbmRpbmcgYWZ0ZXIgdGhlIHJlY29ubmVjdGlvbiBhbmRcbiAgLy8gdGhpcy5jb25uZWN0aW9uLmlkIHdpbGwgY2hhbmdlLiBJbiBjYXNlIGFuIG9wIGlzIHNlbnQgbXVsdGlwbGUgdGltZXMsIHdlXG4gIC8vIGFsc28gbmVlZCB0byBiZSBjYXJlZnVsIG5vdCB0byBvdmVycmlkZSB0aGUgb3JpZ2luYWwgc2VxIHZhbHVlLlxuICBpZiAob3Auc2VxID09IG51bGwpIG9wLnNlcSA9IHRoaXMuY29ubmVjdGlvbi5zZXErKztcblxuICB0aGlzLmNvbm5lY3Rpb24uc2VuZE9wKHRoaXMsIG9wKTtcblxuICAvLyBzcmMgaXNuJ3QgbmVlZGVkIG9uIHRoZSBmaXJzdCB0cnksIHNpbmNlIHRoZSBzZXJ2ZXIgc2Vzc2lvbiB3aWxsIGhhdmUgdGhlXG4gIC8vIHNhbWUgaWQsIGJ1dCBpdCBtdXN0IGJlIHNldCBvbiB0aGUgaW5mbGlnaHRPcCBpbiBjYXNlIGl0IGlzIHNlbnQgYWdhaW5cbiAgLy8gYWZ0ZXIgYSByZWNvbm5lY3QgYW5kIHRoZSBjb25uZWN0aW9uJ3MgaWQgaGFzIGNoYW5nZWQgYnkgdGhlblxuICBpZiAob3Auc3JjID09IG51bGwpIG9wLnNyYyA9IHNyYztcbn07XG5cblxuLy8gUXVldWVzIHRoZSBvcGVyYXRpb24gZm9yIHN1Ym1pc3Npb24gdG8gdGhlIHNlcnZlciBhbmQgYXBwbGllcyBpdCBsb2NhbGx5LlxuLy9cbi8vIEludGVybmFsIG1ldGhvZCBjYWxsZWQgdG8gZG8gdGhlIGFjdHVhbCB3b3JrIGZvciBzdWJtaXQoKSwgY3JlYXRlKCkgYW5kIGRlbCgpLlxuLy8gQHByaXZhdGVcbi8vXG4vLyBAcGFyYW0gb3Bcbi8vIEBwYXJhbSBbb3Aub3BdXG4vLyBAcGFyYW0gW29wLmRlbF1cbi8vIEBwYXJhbSBbb3AuY3JlYXRlXVxuLy8gQHBhcmFtIFtjYWxsYmFja10gY2FsbGVkIHdoZW4gb3BlcmF0aW9uIGlzIHN1Ym1pdHRlZFxuRG9jLnByb3RvdHlwZS5fc3VibWl0ID0gZnVuY3Rpb24ob3AsIHNvdXJjZSwgY2FsbGJhY2spIHtcbiAgLy8gTG9jYWxseSBzdWJtaXR0ZWQgb3BzIG11c3QgYWx3YXlzIGhhdmUgYSB0cnV0aHkgc291cmNlXG4gIGlmICghc291cmNlKSBzb3VyY2UgPSB0cnVlO1xuXG4gIC8vIFRoZSBvcCBjb250YWlucyBlaXRoZXIgb3AsIGNyZWF0ZSwgZGVsZXRlLCBvciBub25lIG9mIHRoZSBhYm92ZSAoYSBuby1vcCkuXG4gIGlmIChvcC5vcCkge1xuICAgIGlmICghdGhpcy50eXBlKSB7XG4gICAgICB2YXIgZXJyID0gbmV3IFNoYXJlREJFcnJvcig0MDE1LCAnQ2Fubm90IHN1Ym1pdCBvcC4gRG9jdW1lbnQgaGFzIG5vdCBiZWVuIGNyZWF0ZWQuICcgKyB0aGlzLmNvbGxlY3Rpb24gKyAnLicgKyB0aGlzLmlkKTtcbiAgICAgIGlmIChjYWxsYmFjaykgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgICByZXR1cm4gdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG4gICAgfVxuICAgIC8vIFRyeSB0byBub3JtYWxpemUgdGhlIG9wLiBUaGlzIHJlbW92ZXMgdHJhaWxpbmcgc2tpcDowJ3MgYW5kIHRoaW5ncyBsaWtlIHRoYXQuXG4gICAgaWYgKHRoaXMudHlwZS5ub3JtYWxpemUpIG9wLm9wID0gdGhpcy50eXBlLm5vcm1hbGl6ZShvcC5vcCk7XG4gIH1cblxuICB0aGlzLl9wdXNoT3Aob3AsIGNhbGxiYWNrKTtcbiAgdGhpcy5fb3RBcHBseShvcCwgc291cmNlKTtcblxuICAvLyBUaGUgY2FsbCB0byBmbHVzaCBpcyBkZWxheWVkIHNvIGlmIHN1Ym1pdCgpIGlzIGNhbGxlZCBtdWx0aXBsZSB0aW1lc1xuICAvLyBzeW5jaHJvbm91c2x5LCBhbGwgdGhlIG9wcyBhcmUgY29tYmluZWQgYmVmb3JlIGJlaW5nIHNlbnQgdG8gdGhlIHNlcnZlci5cbiAgdmFyIGRvYyA9IHRoaXM7XG4gIHByb2Nlc3MubmV4dFRpY2soZnVuY3Rpb24oKSB7XG4gICAgZG9jLmZsdXNoKCk7XG4gIH0pO1xufTtcblxuRG9jLnByb3RvdHlwZS5fcHVzaE9wID0gZnVuY3Rpb24ob3AsIGNhbGxiYWNrKSB7XG4gIGlmICh0aGlzLmFwcGx5U3RhY2spIHtcbiAgICAvLyBJZiB3ZSBhcmUgaW4gdGhlIHByb2Nlc3Mgb2YgaW5jcmVtZW50YWxseSBhcHBseWluZyBhbiBvcGVyYXRpb24sIGRvbid0XG4gICAgLy8gY29tcG9zZSB0aGUgb3AgYW5kIHB1c2ggaXQgb250byB0aGUgYXBwbHlTdGFjayBzbyBpdCBjYW4gYmUgdHJhbnNmb3JtZWRcbiAgICAvLyBhZ2FpbnN0IG90aGVyIGNvbXBvbmVudHMgZnJvbSB0aGUgb3Agb3Igb3BzIGJlaW5nIGFwcGxpZWRcbiAgICB0aGlzLmFwcGx5U3RhY2sucHVzaChvcCk7XG4gIH0gZWxzZSB7XG4gICAgLy8gSWYgdGhlIHR5cGUgc3VwcG9ydHMgY29tcG9zZXMsIHRyeSB0byBjb21wb3NlIHRoZSBvcGVyYXRpb24gb250byB0aGVcbiAgICAvLyBlbmQgb2YgdGhlIGxhc3QgcGVuZGluZyBvcGVyYXRpb24uXG4gICAgdmFyIGNvbXBvc2VkID0gdGhpcy5fdHJ5Q29tcG9zZShvcCk7XG4gICAgaWYgKGNvbXBvc2VkKSB7XG4gICAgICBjb21wb3NlZC5jYWxsYmFja3MucHVzaChjYWxsYmFjayk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICB9XG4gIC8vIFB1c2ggb24gdG8gdGhlIHBlbmRpbmdPcHMgcXVldWUgb2Ygb3BzIHRvIHN1Ym1pdCBpZiB3ZSBkaWRuJ3QgY29tcG9zZVxuICBvcC50eXBlID0gdGhpcy50eXBlO1xuICBvcC5jYWxsYmFja3MgPSBbY2FsbGJhY2tdO1xuICB0aGlzLnBlbmRpbmdPcHMucHVzaChvcCk7XG59O1xuXG5Eb2MucHJvdG90eXBlLl9wb3BBcHBseVN0YWNrID0gZnVuY3Rpb24odG8pIHtcbiAgaWYgKHRvID4gMCkge1xuICAgIHRoaXMuYXBwbHlTdGFjay5sZW5ndGggPSB0bztcbiAgICByZXR1cm47XG4gIH1cbiAgLy8gT25jZSB3ZSBoYXZlIGNvbXBsZXRlZCB0aGUgb3V0ZXJtb3N0IGFwcGx5IGxvb3AsIHJlc2V0IHRvIG51bGwgYW5kIG5vXG4gIC8vIGxvbmdlciBhZGQgb3BzIHRvIHRoZSBhcHBseVN0YWNrIGFzIHRoZXkgYXJlIHN1Ym1pdHRlZFxuICB2YXIgb3AgPSB0aGlzLmFwcGx5U3RhY2tbMF07XG4gIHRoaXMuYXBwbHlTdGFjayA9IG51bGw7XG4gIGlmICghb3ApIHJldHVybjtcbiAgLy8gQ29tcG9zZSB0aGUgb3BzIGFkZGVkIHNpbmNlIHRoZSBiZWdpbm5pbmcgb2YgdGhlIGFwcGx5IHN0YWNrLCBzaW5jZSB3ZVxuICAvLyBoYWQgdG8gc2tpcCBjb21wb3NlIHdoZW4gdGhleSB3ZXJlIG9yaWdpbmFsbHkgcHVzaGVkXG4gIHZhciBpID0gdGhpcy5wZW5kaW5nT3BzLmluZGV4T2Yob3ApO1xuICBpZiAoaSA9PT0gLTEpIHJldHVybjtcbiAgdmFyIG9wcyA9IHRoaXMucGVuZGluZ09wcy5zcGxpY2UoaSk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgb3BzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIG9wID0gb3BzW2ldO1xuICAgIHZhciBjb21wb3NlZCA9IHRoaXMuX3RyeUNvbXBvc2Uob3ApO1xuICAgIGlmIChjb21wb3NlZCkge1xuICAgICAgY29tcG9zZWQuY2FsbGJhY2tzID0gY29tcG9zZWQuY2FsbGJhY2tzLmNvbmNhdChvcC5jYWxsYmFja3MpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBlbmRpbmdPcHMucHVzaChvcCk7XG4gICAgfVxuICB9XG59O1xuXG4vLyBUcnkgdG8gY29tcG9zZSBhIHN1Ym1pdHRlZCBvcCBpbnRvIHRoZSBsYXN0IHBlbmRpbmcgb3AuIFJldHVybnMgdGhlXG4vLyBjb21wb3NlZCBvcCBpZiBpdCBzdWNjZWVkcywgdW5kZWZpbmVkIG90aGVyd2lzZVxuRG9jLnByb3RvdHlwZS5fdHJ5Q29tcG9zZSA9IGZ1bmN0aW9uKG9wKSB7XG4gIGlmICh0aGlzLnByZXZlbnRDb21wb3NlKSByZXR1cm47XG5cbiAgLy8gV2UgY2FuIG9ubHkgY29tcG9zZSBpbnRvIHRoZSBsYXN0IHBlbmRpbmcgb3AuIEluZmxpZ2h0IG9wcyBoYXZlIGFscmVhZHlcbiAgLy8gYmVlbiBzZW50IHRvIHRoZSBzZXJ2ZXIsIHNvIHdlIGNhbid0IG1vZGlmeSB0aGVtXG4gIHZhciBsYXN0ID0gdGhpcy5wZW5kaW5nT3BzW3RoaXMucGVuZGluZ09wcy5sZW5ndGggLSAxXTtcbiAgaWYgKCFsYXN0KSByZXR1cm47XG5cbiAgLy8gQ29tcG9zZSBhbiBvcCBpbnRvIGEgY3JlYXRlIGJ5IGFwcGx5aW5nIGl0LiBUaGlzIGVmZmVjdGl2ZWx5IG1ha2VzIHRoZSBvcFxuICAvLyBpbnZpc2libGUsIGFzIGlmIHRoZSBkb2N1bWVudCB3ZXJlIGNyZWF0ZWQgaW5jbHVkaW5nIHRoZSBvcCBvcmlnaW5hbGx5XG4gIGlmIChsYXN0LmNyZWF0ZSAmJiBvcC5vcCkge1xuICAgIGxhc3QuY3JlYXRlLmRhdGEgPSB0aGlzLnR5cGUuYXBwbHkobGFzdC5jcmVhdGUuZGF0YSwgb3Aub3ApO1xuICAgIHJldHVybiBsYXN0O1xuICB9XG5cbiAgLy8gQ29tcG9zZSB0d28gb3BzIGludG8gYSBzaW5nbGUgb3AgaWYgc3VwcG9ydGVkIGJ5IHRoZSB0eXBlLiBUeXBlcyB0aGF0XG4gIC8vIHN1cHBvcnQgY29tcG9zZSBtdXN0IGJlIGFibGUgdG8gY29tcG9zZSBhbnkgdHdvIG9wcyB0b2dldGhlclxuICBpZiAobGFzdC5vcCAmJiBvcC5vcCAmJiB0aGlzLnR5cGUuY29tcG9zZSkge1xuICAgIGxhc3Qub3AgPSB0aGlzLnR5cGUuY29tcG9zZShsYXN0Lm9wLCBvcC5vcCk7XG4gICAgcmV0dXJuIGxhc3Q7XG4gIH1cbn07XG5cbi8vICoqKiBDbGllbnQgT1QgZW50cnlwb2ludHMuXG5cbi8vIFN1Ym1pdCBhbiBvcGVyYXRpb24gdG8gdGhlIGRvY3VtZW50LlxuLy9cbi8vIEBwYXJhbSBvcGVyYXRpb24gaGFuZGxlZCBieSB0aGUgT1QgdHlwZVxuLy8gQHBhcmFtIG9wdGlvbnMgIHtzb3VyY2U6IC4uLn1cbi8vIEBwYXJhbSBbY2FsbGJhY2tdIGNhbGxlZCBhZnRlciBvcGVyYXRpb24gc3VibWl0dGVkXG4vL1xuLy8gQGZpcmVzIGJlZm9yZSBvcCwgb3AsIGFmdGVyIG9wXG5Eb2MucHJvdG90eXBlLnN1Ym1pdE9wID0gZnVuY3Rpb24oY29tcG9uZW50LCBvcHRpb25zLCBjYWxsYmFjaykge1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gICAgb3B0aW9ucyA9IG51bGw7XG4gIH1cbiAgdmFyIG9wID0ge29wOiBjb21wb25lbnR9O1xuICB2YXIgc291cmNlID0gb3B0aW9ucyAmJiBvcHRpb25zLnNvdXJjZTtcbiAgdGhpcy5fc3VibWl0KG9wLCBzb3VyY2UsIGNhbGxiYWNrKTtcbn07XG5cbi8vIENyZWF0ZSB0aGUgZG9jdW1lbnQsIHdoaWNoIGluIFNoYXJlSlMgc2VtYW50aWNzIG1lYW5zIHRvIHNldCBpdHMgdHlwZS4gRXZlcnlcbi8vIG9iamVjdCBpbXBsaWNpdGx5IGV4aXN0cyBpbiB0aGUgZGF0YWJhc2UgYnV0IGhhcyBubyBkYXRhIGFuZCBubyB0eXBlLiBDcmVhdGVcbi8vIHNldHMgdGhlIHR5cGUgb2YgdGhlIG9iamVjdCBhbmQgY2FuIG9wdGlvbmFsbHkgc2V0IHNvbWUgaW5pdGlhbCBkYXRhIG9uIHRoZVxuLy8gb2JqZWN0LCBkZXBlbmRpbmcgb24gdGhlIHR5cGUuXG4vL1xuLy8gQHBhcmFtIGRhdGEgIGluaXRpYWxcbi8vIEBwYXJhbSB0eXBlICBPVCB0eXBlXG4vLyBAcGFyYW0gb3B0aW9ucyAge3NvdXJjZTogLi4ufVxuLy8gQHBhcmFtIGNhbGxiYWNrICBjYWxsZWQgd2hlbiBvcGVyYXRpb24gc3VibWl0dGVkXG5Eb2MucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uKGRhdGEsIHR5cGUsIG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gIGlmICh0eXBlb2YgdHlwZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gdHlwZTtcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgICB0eXBlID0gbnVsbDtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgfVxuICBpZiAoIXR5cGUpIHtcbiAgICB0eXBlID0gdHlwZXMuZGVmYXVsdFR5cGUudXJpO1xuICB9XG4gIGlmICh0aGlzLnR5cGUpIHtcbiAgICB2YXIgZXJyID0gbmV3IFNoYXJlREJFcnJvcig0MDE2LCAnRG9jdW1lbnQgYWxyZWFkeSBleGlzdHMnKTtcbiAgICBpZiAoY2FsbGJhY2spIHJldHVybiBjYWxsYmFjayhlcnIpO1xuICAgIHJldHVybiB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcbiAgfVxuICB2YXIgb3AgPSB7Y3JlYXRlOiB7dHlwZTogdHlwZSwgZGF0YTogZGF0YX19O1xuICB2YXIgc291cmNlID0gb3B0aW9ucyAmJiBvcHRpb25zLnNvdXJjZTtcbiAgdGhpcy5fc3VibWl0KG9wLCBzb3VyY2UsIGNhbGxiYWNrKTtcbn07XG5cbi8vIERlbGV0ZSB0aGUgZG9jdW1lbnQuIFRoaXMgY3JlYXRlcyBhbmQgc3VibWl0cyBhIGRlbGV0ZSBvcGVyYXRpb24gdG8gdGhlXG4vLyBzZXJ2ZXIuIERlbGV0aW5nIHJlc2V0cyB0aGUgb2JqZWN0J3MgdHlwZSB0byBudWxsIGFuZCBkZWxldGVzIGl0cyBkYXRhLiBUaGVcbi8vIGRvY3VtZW50IHN0aWxsIGV4aXN0cywgYW5kIHN0aWxsIGhhcyB0aGUgdmVyc2lvbiBpdCB1c2VkIHRvIGhhdmUgYmVmb3JlIHlvdVxuLy8gZGVsZXRlZCBpdCAod2VsbCwgb2xkIHZlcnNpb24gKzEpLlxuLy9cbi8vIEBwYXJhbSBvcHRpb25zICB7c291cmNlOiAuLi59XG4vLyBAcGFyYW0gY2FsbGJhY2sgIGNhbGxlZCB3aGVuIG9wZXJhdGlvbiBzdWJtaXR0ZWRcbkRvYy5wcm90b3R5cGUuZGVsID0gZnVuY3Rpb24ob3B0aW9ucywgY2FsbGJhY2spIHtcbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSAnZnVuY3Rpb24nKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICAgIG9wdGlvbnMgPSBudWxsO1xuICB9XG4gIGlmICghdGhpcy50eXBlKSB7XG4gICAgdmFyIGVyciA9IG5ldyBTaGFyZURCRXJyb3IoNDAxNSwgJ0RvY3VtZW50IGRvZXMgbm90IGV4aXN0Jyk7XG4gICAgaWYgKGNhbGxiYWNrKSByZXR1cm4gY2FsbGJhY2soZXJyKTtcbiAgICByZXR1cm4gdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG4gIH1cbiAgdmFyIG9wID0ge2RlbDogdHJ1ZX07XG4gIHZhciBzb3VyY2UgPSBvcHRpb25zICYmIG9wdGlvbnMuc291cmNlO1xuICB0aGlzLl9zdWJtaXQob3AsIHNvdXJjZSwgY2FsbGJhY2spO1xufTtcblxuXG4vLyBTdG9wcyB0aGUgZG9jdW1lbnQgZnJvbSBzZW5kaW5nIGFueSBvcGVyYXRpb25zIHRvIHRoZSBzZXJ2ZXIuXG5Eb2MucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24oKSB7XG4gIHRoaXMucGF1c2VkID0gdHJ1ZTtcbn07XG5cbi8vIENvbnRpbnVlIHNlbmRpbmcgb3BlcmF0aW9ucyB0byB0aGUgc2VydmVyXG5Eb2MucHJvdG90eXBlLnJlc3VtZSA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xuICB0aGlzLmZsdXNoKCk7XG59O1xuXG5cbi8vICoqKiBSZWNlaXZpbmcgb3BlcmF0aW9uc1xuXG4vLyBUaGlzIGlzIGNhbGxlZCB3aGVuIHRoZSBzZXJ2ZXIgYWNrbm93bGVkZ2VzIGFuIG9wZXJhdGlvbiBmcm9tIHRoZSBjbGllbnQuXG5Eb2MucHJvdG90eXBlLl9vcEFja25vd2xlZGdlZCA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgaWYgKHRoaXMuaW5mbGlnaHRPcC5jcmVhdGUpIHtcbiAgICB0aGlzLnZlcnNpb24gPSBtZXNzYWdlLnY7XG5cbiAgfSBlbHNlIGlmIChtZXNzYWdlLnYgIT09IHRoaXMudmVyc2lvbikge1xuICAgIC8vIFdlIHNob3VsZCBhbHJlYWR5IGJlIGF0IHRoZSBzYW1lIHZlcnNpb24sIGJlY2F1c2UgdGhlIHNlcnZlciBzaG91bGRcbiAgICAvLyBoYXZlIHNlbnQgYWxsIHRoZSBvcHMgdGhhdCBoYXZlIGhhcHBlbmVkIGJlZm9yZSBhY2tub3dsZWRnaW5nIG91ciBvcFxuICAgIGNvbnNvbGUud2FybignSW52YWxpZCB2ZXJzaW9uIGZyb20gc2VydmVyLiBFeHBlY3RlZDogJyArIHRoaXMudmVyc2lvbiArICcgUmVjZWl2ZWQ6ICcgKyBtZXNzYWdlLnYsIG1lc3NhZ2UpO1xuXG4gICAgLy8gRmV0Y2hpbmcgc2hvdWxkIGdldCB1cyBiYWNrIHRvIGEgd29ya2luZyBkb2N1bWVudCBzdGF0ZVxuICAgIHJldHVybiB0aGlzLmZldGNoKCk7XG4gIH1cblxuICAvLyBUaGUgb3Agd2FzIGNvbW1pdHRlZCBzdWNjZXNzZnVsbHkuIEluY3JlbWVudCB0aGUgdmVyc2lvbiBudW1iZXJcbiAgdGhpcy52ZXJzaW9uKys7XG5cbiAgdGhpcy5fY2xlYXJJbmZsaWdodE9wKCk7XG59O1xuXG5Eb2MucHJvdG90eXBlLl9yb2xsYmFjayA9IGZ1bmN0aW9uKGVycikge1xuICAvLyBUaGUgc2VydmVyIGhhcyByZWplY3RlZCBzdWJtaXNzaW9uIG9mIHRoZSBjdXJyZW50IG9wZXJhdGlvbi4gSW52ZXJ0IGJ5XG4gIC8vIGp1c3QgdGhlIGluZmxpZ2h0IG9wIGlmIHBvc3NpYmxlLiBJZiBub3QgcG9zc2libGUgdG8gaW52ZXJ0LCBjYW5jZWwgYWxsXG4gIC8vIHBlbmRpbmcgb3BzIGFuZCBmZXRjaCB0aGUgbGF0ZXN0IGZyb20gdGhlIHNlcnZlciB0byBnZXQgdXMgYmFjayBpbnRvIGFcbiAgLy8gd29ya2luZyBzdGF0ZSwgdGhlbiBjYWxsIGJhY2tcbiAgdmFyIG9wID0gdGhpcy5pbmZsaWdodE9wO1xuXG4gIGlmIChvcC5vcCAmJiBvcC50eXBlLmludmVydCkge1xuICAgIG9wLm9wID0gb3AudHlwZS5pbnZlcnQob3Aub3ApO1xuXG4gICAgLy8gVHJhbnNmb3JtIHRoZSB1bmRvIG9wZXJhdGlvbiBieSBhbnkgcGVuZGluZyBvcHMuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBlbmRpbmdPcHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciB0cmFuc2Zvcm1FcnIgPSB0cmFuc2Zvcm1YKHRoaXMucGVuZGluZ09wc1tpXSwgb3ApO1xuICAgICAgaWYgKHRyYW5zZm9ybUVycikgcmV0dXJuIHRoaXMuX2hhcmRSb2xsYmFjayh0cmFuc2Zvcm1FcnIpO1xuICAgIH1cblxuICAgIC8vIC4uLiBhbmQgYXBwbHkgaXQgbG9jYWxseSwgcmV2ZXJ0aW5nIHRoZSBjaGFuZ2VzLlxuICAgIC8vXG4gICAgLy8gVGhpcyBvcGVyYXRpb24gaXMgYXBwbGllZCB0byBsb29rIGxpa2UgaXQgY29tZXMgZnJvbSBhIHJlbW90ZSBzb3VyY2UuXG4gICAgLy8gSSdtIHN0aWxsIG5vdCAxMDAlIHN1cmUgYWJvdXQgdGhpcyBmdW5jdGlvbmFsaXR5LCBiZWNhdXNlIGl0cyByZWFsbHkgYVxuICAgIC8vIGxvY2FsIG9wLiBCYXNpY2FsbHksIHRoZSBwcm9ibGVtIGlzIHRoYXQgaWYgdGhlIGNsaWVudCdzIG9wIGlzIHJlamVjdGVkXG4gICAgLy8gYnkgdGhlIHNlcnZlciwgdGhlIGVkaXRvciB3aW5kb3cgc2hvdWxkIHVwZGF0ZSB0byByZWZsZWN0IHRoZSB1bmRvLlxuICAgIHRoaXMuX290QXBwbHkob3AsIGZhbHNlKTtcblxuICAgIHRoaXMuX2NsZWFySW5mbGlnaHRPcChlcnIpO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIHRoaXMuX2hhcmRSb2xsYmFjayhlcnIpO1xufTtcblxuRG9jLnByb3RvdHlwZS5faGFyZFJvbGxiYWNrID0gZnVuY3Rpb24oZXJyKSB7XG4gIC8vIENhbmNlbCBhbGwgcGVuZGluZyBvcHMgYW5kIHJlc2V0IGlmIHdlIGNhbid0IGludmVydFxuICB2YXIgb3AgPSB0aGlzLmluZmxpZ2h0T3A7XG4gIHZhciBwZW5kaW5nID0gdGhpcy5wZW5kaW5nT3BzO1xuICB0aGlzLl9zZXRUeXBlKG51bGwpO1xuICB0aGlzLnZlcnNpb24gPSBudWxsO1xuICB0aGlzLmluZmxpZ2h0T3AgPSBudWxsO1xuICB0aGlzLnBlbmRpbmdPcHMgPSBbXTtcblxuICAvLyBGZXRjaCB0aGUgbGF0ZXN0IGZyb20gdGhlIHNlcnZlciB0byBnZXQgdXMgYmFjayBpbnRvIGEgd29ya2luZyBzdGF0ZVxuICB2YXIgZG9jID0gdGhpcztcbiAgdGhpcy5mZXRjaChmdW5jdGlvbigpIHtcbiAgICB2YXIgY2FsbGVkID0gb3AgJiYgY2FsbEVhY2gob3AuY2FsbGJhY2tzLCBlcnIpO1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgcGVuZGluZy5sZW5ndGg7IGkrKykge1xuICAgICAgY2FsbEVhY2gocGVuZGluZ1tpXS5jYWxsYmFja3MsIGVycik7XG4gICAgfVxuICAgIGlmIChlcnIgJiYgIWNhbGxlZCkgcmV0dXJuIGRvYy5lbWl0KCdlcnJvcicsIGVycik7XG4gIH0pO1xufTtcblxuRG9jLnByb3RvdHlwZS5fY2xlYXJJbmZsaWdodE9wID0gZnVuY3Rpb24oZXJyKSB7XG4gIHZhciBjYWxsZWQgPSBjYWxsRWFjaCh0aGlzLmluZmxpZ2h0T3AuY2FsbGJhY2tzLCBlcnIpO1xuXG4gIHRoaXMuaW5mbGlnaHRPcCA9IG51bGw7XG4gIHRoaXMuZmx1c2goKTtcbiAgdGhpcy5fZW1pdE5vdGhpbmdQZW5kaW5nKCk7XG5cbiAgaWYgKGVyciAmJiAhY2FsbGVkKSByZXR1cm4gdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG59O1xuXG5mdW5jdGlvbiBjYWxsRWFjaChjYWxsYmFja3MsIGVycikge1xuICB2YXIgY2FsbGVkID0gZmFsc2U7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGNhbGxiYWNrID0gY2FsbGJhY2tzW2ldO1xuICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgY2FsbGJhY2soZXJyKTtcbiAgICAgIGNhbGxlZCA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBjYWxsZWQ7XG59XG4iLCJleHBvcnRzLkNvbm5lY3Rpb24gPSByZXF1aXJlKCcuL2Nvbm5lY3Rpb24nKTtcbmV4cG9ydHMuRG9jID0gcmVxdWlyZSgnLi9kb2MnKTtcbmV4cG9ydHMuRXJyb3IgPSByZXF1aXJlKCcuLi9lcnJvcicpO1xuZXhwb3J0cy5RdWVyeSA9IHJlcXVpcmUoJy4vcXVlcnknKTtcbmV4cG9ydHMudHlwZXMgPSByZXF1aXJlKCcuLi90eXBlcycpO1xuIiwidmFyIGVtaXR0ZXIgPSByZXF1aXJlKCcuLi9lbWl0dGVyJyk7XG5cbi8vIFF1ZXJpZXMgYXJlIGxpdmUgcmVxdWVzdHMgdG8gdGhlIGRhdGFiYXNlIGZvciBwYXJ0aWN1bGFyIHNldHMgb2YgZmllbGRzLlxuLy9cbi8vIFRoZSBzZXJ2ZXIgYWN0aXZlbHkgdGVsbHMgdGhlIGNsaWVudCB3aGVuIHRoZXJlJ3MgbmV3IGRhdGEgdGhhdCBtYXRjaGVzXG4vLyBhIHNldCBvZiBjb25kaXRpb25zLlxubW9kdWxlLmV4cG9ydHMgPSBRdWVyeTtcbmZ1bmN0aW9uIFF1ZXJ5KGFjdGlvbiwgY29ubmVjdGlvbiwgaWQsIGNvbGxlY3Rpb24sIHF1ZXJ5LCBvcHRpb25zLCBjYWxsYmFjaykge1xuICBlbWl0dGVyLkV2ZW50RW1pdHRlci5jYWxsKHRoaXMpO1xuXG4gIC8vICdxZicgb3IgJ3FzJ1xuICB0aGlzLmFjdGlvbiA9IGFjdGlvbjtcblxuICB0aGlzLmNvbm5lY3Rpb24gPSBjb25uZWN0aW9uO1xuICB0aGlzLmlkID0gaWQ7XG4gIHRoaXMuY29sbGVjdGlvbiA9IGNvbGxlY3Rpb247XG5cbiAgLy8gVGhlIHF1ZXJ5IGl0c2VsZi4gRm9yIG1vbmdvLCB0aGlzIHNob3VsZCBsb29rIHNvbWV0aGluZyBsaWtlIHtcImRhdGEueFwiOjV9XG4gIHRoaXMucXVlcnkgPSBxdWVyeTtcblxuICAvLyBBIGxpc3Qgb2YgcmVzdWx0aW5nIGRvY3VtZW50cy4gVGhlc2UgYXJlIGFjdHVhbCBkb2N1bWVudHMsIGNvbXBsZXRlIHdpdGhcbiAgLy8gZGF0YSBhbmQgYWxsIHRoZSByZXN0LiBJdCBpcyBwb3NzaWJsZSB0byBwYXNzIGluIGFuIGluaXRpYWwgcmVzdWx0cyBzZXQsXG4gIC8vIHNvIHRoYXQgYSBxdWVyeSBjYW4gYmUgc2VyaWFsaXplZCBhbmQgdGhlbiByZS1lc3RhYmxpc2hlZFxuICB0aGlzLnJlc3VsdHMgPSBudWxsO1xuICBpZiAob3B0aW9ucyAmJiBvcHRpb25zLnJlc3VsdHMpIHtcbiAgICB0aGlzLnJlc3VsdHMgPSBvcHRpb25zLnJlc3VsdHM7XG4gICAgZGVsZXRlIG9wdGlvbnMucmVzdWx0cztcbiAgfVxuICB0aGlzLmV4dHJhID0gdW5kZWZpbmVkO1xuXG4gIC8vIE9wdGlvbnMgdG8gcGFzcyB0aHJvdWdoIHdpdGggdGhlIHF1ZXJ5XG4gIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cbiAgdGhpcy5jYWxsYmFjayA9IGNhbGxiYWNrO1xuICB0aGlzLnJlYWR5ID0gZmFsc2U7XG4gIHRoaXMuc2VudCA9IGZhbHNlO1xufVxuZW1pdHRlci5taXhpbihRdWVyeSk7XG5cblF1ZXJ5LnByb3RvdHlwZS5oYXNQZW5kaW5nID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiAhdGhpcy5yZWFkeTtcbn07XG5cbi8vIEhlbHBlciBmb3Igc3Vic2NyaWJlICYgZmV0Y2gsIHNpbmNlIHRoZXkgc2hhcmUgdGhlIHNhbWUgbWVzc2FnZSBmb3JtYXQuXG4vL1xuLy8gVGhpcyBmdW5jdGlvbiBhY3R1YWxseSBpc3N1ZXMgdGhlIHF1ZXJ5LlxuUXVlcnkucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbigpIHtcbiAgaWYgKCF0aGlzLmNvbm5lY3Rpb24uY2FuU2VuZCkgcmV0dXJuO1xuXG4gIHZhciBtZXNzYWdlID0ge1xuICAgIGE6IHRoaXMuYWN0aW9uLFxuICAgIGlkOiB0aGlzLmlkLFxuICAgIGM6IHRoaXMuY29sbGVjdGlvbixcbiAgICBxOiB0aGlzLnF1ZXJ5XG4gIH07XG4gIGlmICh0aGlzLm9wdGlvbnMpIHtcbiAgICBtZXNzYWdlLm8gPSB0aGlzLm9wdGlvbnM7XG4gIH1cbiAgaWYgKHRoaXMucmVzdWx0cykge1xuICAgIC8vIENvbGxlY3QgdGhlIHZlcnNpb24gb2YgYWxsIHRoZSBkb2N1bWVudHMgaW4gdGhlIGN1cnJlbnQgcmVzdWx0IHNldCBzbyB3ZVxuICAgIC8vIGRvbid0IG5lZWQgdG8gYmUgc2VudCB0aGVpciBzbmFwc2hvdHMgYWdhaW4uXG4gICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIGRvYyA9IHRoaXMucmVzdWx0c1tpXTtcbiAgICAgIHJlc3VsdHMucHVzaChbZG9jLmlkLCBkb2MudmVyc2lvbl0pO1xuICAgIH1cbiAgICBtZXNzYWdlLnIgPSByZXN1bHRzO1xuICB9XG5cbiAgdGhpcy5jb25uZWN0aW9uLnNlbmQobWVzc2FnZSk7XG4gIHRoaXMuc2VudCA9IHRydWU7XG59O1xuXG4vLyBEZXN0cm95IHRoZSBxdWVyeSBvYmplY3QuIEFueSBzdWJzZXF1ZW50IG1lc3NhZ2VzIGZvciB0aGUgcXVlcnkgd2lsbCBiZVxuLy8gaWdub3JlZCBieSB0aGUgY29ubmVjdGlvbi5cblF1ZXJ5LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgaWYgKHRoaXMuY29ubmVjdGlvbi5jYW5TZW5kICYmIHRoaXMuYWN0aW9uID09PSAncXMnKSB7XG4gICAgdGhpcy5jb25uZWN0aW9uLnNlbmQoe2E6ICdxdScsIGlkOiB0aGlzLmlkfSk7XG4gIH1cbiAgdGhpcy5jb25uZWN0aW9uLl9kZXN0cm95UXVlcnkodGhpcyk7XG4gIC8vIFRoZXJlIGlzIGEgY2FsbGJhY2sgZm9yIGNvbnNpc3RlbmN5LCBidXQgd2UgZG9uJ3QgYWN0dWFsbHkgd2FpdCBmb3IgdGhlXG4gIC8vIHNlcnZlcidzIHVuc3Vic2NyaWJlIG1lc3NhZ2UgY3VycmVudGx5XG4gIGlmIChjYWxsYmFjaykgcHJvY2Vzcy5uZXh0VGljayhjYWxsYmFjayk7XG59O1xuXG5RdWVyeS5wcm90b3R5cGUuX29uQ29ubmVjdGlvblN0YXRlQ2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICBpZiAodGhpcy5jb25uZWN0aW9uLmNhblNlbmQgJiYgIXRoaXMuc2VudCkge1xuICAgIHRoaXMuc2VuZCgpO1xuICB9IGVsc2Uge1xuICAgIHRoaXMuc2VudCA9IGZhbHNlO1xuICB9XG59O1xuXG5RdWVyeS5wcm90b3R5cGUuX2hhbmRsZUZldGNoID0gZnVuY3Rpb24oZXJyLCBkYXRhLCBleHRyYSkge1xuICAvLyBPbmNlIGEgZmV0Y2ggcXVlcnkgZ2V0cyBpdHMgZGF0YSwgaXQgaXMgZGVzdHJveWVkLlxuICB0aGlzLmNvbm5lY3Rpb24uX2Rlc3Ryb3lRdWVyeSh0aGlzKTtcbiAgdGhpcy5faGFuZGxlUmVzcG9uc2UoZXJyLCBkYXRhLCBleHRyYSk7XG59O1xuXG5RdWVyeS5wcm90b3R5cGUuX2hhbmRsZVN1YnNjcmliZSA9IGZ1bmN0aW9uKGVyciwgZGF0YSwgZXh0cmEpIHtcbiAgdGhpcy5faGFuZGxlUmVzcG9uc2UoZXJyLCBkYXRhLCBleHRyYSk7XG59O1xuXG5RdWVyeS5wcm90b3R5cGUuX2hhbmRsZVJlc3BvbnNlID0gZnVuY3Rpb24oZXJyLCBkYXRhLCBleHRyYSkge1xuICB2YXIgY2FsbGJhY2sgPSB0aGlzLmNhbGxiYWNrO1xuICB0aGlzLmNhbGxiYWNrID0gbnVsbDtcbiAgaWYgKGVycikgcmV0dXJuIHRoaXMuX2ZpbmlzaFJlc3BvbnNlKGVyciwgY2FsbGJhY2spO1xuICBpZiAoIWRhdGEpIHJldHVybiB0aGlzLl9maW5pc2hSZXNwb25zZShudWxsLCBjYWxsYmFjayk7XG5cbiAgdmFyIHF1ZXJ5ID0gdGhpcztcbiAgdmFyIHdhaXQgPSAxO1xuICB2YXIgZmluaXNoID0gZnVuY3Rpb24oZXJyKSB7XG4gICAgaWYgKGVycikgcmV0dXJuIHF1ZXJ5Ll9maW5pc2hSZXNwb25zZShlcnIsIGNhbGxiYWNrKTtcbiAgICBpZiAoLS13YWl0KSByZXR1cm47XG4gICAgcXVlcnkuX2ZpbmlzaFJlc3BvbnNlKG51bGwsIGNhbGxiYWNrKTtcbiAgfTtcblxuICBpZiAoQXJyYXkuaXNBcnJheShkYXRhKSkge1xuICAgIHdhaXQgKz0gZGF0YS5sZW5ndGg7XG4gICAgdGhpcy5yZXN1bHRzID0gdGhpcy5faW5nZXN0U25hcHNob3RzKGRhdGEsIGZpbmlzaCk7XG4gICAgdGhpcy5leHRyYSA9IGV4dHJhO1xuXG4gIH0gZWxzZSB7XG4gICAgZm9yICh2YXIgaWQgaW4gZGF0YSkge1xuICAgICAgd2FpdCsrO1xuICAgICAgdmFyIHNuYXBzaG90ID0gZGF0YVtpZF07XG4gICAgICB2YXIgZG9jID0gdGhpcy5jb25uZWN0aW9uLmdldChzbmFwc2hvdC5jIHx8IHRoaXMuY29sbGVjdGlvbiwgaWQpO1xuICAgICAgZG9jLmluZ2VzdFNuYXBzaG90KHNuYXBzaG90LCBmaW5pc2gpO1xuICAgIH1cbiAgfVxuXG4gIGZpbmlzaCgpO1xufTtcblxuUXVlcnkucHJvdG90eXBlLl9pbmdlc3RTbmFwc2hvdHMgPSBmdW5jdGlvbihzbmFwc2hvdHMsIGZpbmlzaCkge1xuICB2YXIgcmVzdWx0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHNuYXBzaG90cy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBzbmFwc2hvdCA9IHNuYXBzaG90c1tpXTtcbiAgICB2YXIgZG9jID0gdGhpcy5jb25uZWN0aW9uLmdldChzbmFwc2hvdC5jIHx8IHRoaXMuY29sbGVjdGlvbiwgc25hcHNob3QuZCk7XG4gICAgZG9jLmluZ2VzdFNuYXBzaG90KHNuYXBzaG90LCBmaW5pc2gpO1xuICAgIHJlc3VsdHMucHVzaChkb2MpO1xuICB9XG4gIHJldHVybiByZXN1bHRzO1xufTtcblxuUXVlcnkucHJvdG90eXBlLl9maW5pc2hSZXNwb25zZSA9IGZ1bmN0aW9uKGVyciwgY2FsbGJhY2spIHtcbiAgdGhpcy5lbWl0KCdyZWFkeScpO1xuICB0aGlzLnJlYWR5ID0gdHJ1ZTtcbiAgaWYgKGVycikge1xuICAgIHRoaXMuY29ubmVjdGlvbi5fZGVzdHJveVF1ZXJ5KHRoaXMpO1xuICAgIGlmIChjYWxsYmFjaykgcmV0dXJuIGNhbGxiYWNrKGVycik7XG4gICAgcmV0dXJuIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIpO1xuICB9XG4gIGlmIChjYWxsYmFjaykgY2FsbGJhY2sobnVsbCwgdGhpcy5yZXN1bHRzLCB0aGlzLmV4dHJhKTtcbn07XG5cblF1ZXJ5LnByb3RvdHlwZS5faGFuZGxlRXJyb3IgPSBmdW5jdGlvbihlcnIpIHtcbiAgdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XG59O1xuXG5RdWVyeS5wcm90b3R5cGUuX2hhbmRsZURpZmYgPSBmdW5jdGlvbihkaWZmKSB7XG4gIC8vIFdlIG5lZWQgdG8gZ28gdGhyb3VnaCB0aGUgbGlzdCB0d2ljZS4gRmlyc3QsIHdlJ2xsIGluZ2VzdCBhbGwgdGhlIG5ld1xuICAvLyBkb2N1bWVudHMuIEFmdGVyIHRoYXQgd2UnbGwgZW1pdCBldmVudHMgYW5kIGFjdHVhbGx5IHVwZGF0ZSBvdXIgbGlzdC5cbiAgLy8gVGhpcyBhdm9pZHMgcmFjZSBjb25kaXRpb25zIGFyb3VuZCBzZXR0aW5nIGRvY3VtZW50cyB0byBiZSBzdWJzY3JpYmVkICZcbiAgLy8gdW5zdWJzY3JpYmluZyBkb2N1bWVudHMgaW4gZXZlbnQgY2FsbGJhY2tzLlxuICBmb3IgKHZhciBpID0gMDsgaSA8IGRpZmYubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZCA9IGRpZmZbaV07XG4gICAgaWYgKGQudHlwZSA9PT0gJ2luc2VydCcpIGQudmFsdWVzID0gdGhpcy5faW5nZXN0U25hcHNob3RzKGQudmFsdWVzKTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGlmZi5sZW5ndGg7IGkrKykge1xuICAgIHZhciBkID0gZGlmZltpXTtcbiAgICBzd2l0Y2ggKGQudHlwZSkge1xuICAgICAgY2FzZSAnaW5zZXJ0JzpcbiAgICAgICAgdmFyIG5ld0RvY3MgPSBkLnZhbHVlcztcbiAgICAgICAgQXJyYXkucHJvdG90eXBlLnNwbGljZS5hcHBseSh0aGlzLnJlc3VsdHMsIFtkLmluZGV4LCAwXS5jb25jYXQobmV3RG9jcykpO1xuICAgICAgICB0aGlzLmVtaXQoJ2luc2VydCcsIG5ld0RvY3MsIGQuaW5kZXgpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3JlbW92ZSc6XG4gICAgICAgIHZhciBob3dNYW55ID0gZC5ob3dNYW55IHx8IDE7XG4gICAgICAgIHZhciByZW1vdmVkID0gdGhpcy5yZXN1bHRzLnNwbGljZShkLmluZGV4LCBob3dNYW55KTtcbiAgICAgICAgdGhpcy5lbWl0KCdyZW1vdmUnLCByZW1vdmVkLCBkLmluZGV4KTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlICdtb3ZlJzpcbiAgICAgICAgdmFyIGhvd01hbnkgPSBkLmhvd01hbnkgfHwgMTtcbiAgICAgICAgdmFyIGRvY3MgPSB0aGlzLnJlc3VsdHMuc3BsaWNlKGQuZnJvbSwgaG93TWFueSk7XG4gICAgICAgIEFycmF5LnByb3RvdHlwZS5zcGxpY2UuYXBwbHkodGhpcy5yZXN1bHRzLCBbZC50bywgMF0uY29uY2F0KGRvY3MpKTtcbiAgICAgICAgdGhpcy5lbWl0KCdtb3ZlJywgZG9jcywgZC5mcm9tLCBkLnRvKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgdGhpcy5lbWl0KCdjaGFuZ2VkJywgdGhpcy5yZXN1bHRzKTtcbn07XG5cblF1ZXJ5LnByb3RvdHlwZS5faGFuZGxlRXh0cmEgPSBmdW5jdGlvbihleHRyYSkge1xuICB0aGlzLmV4dHJhID0gZXh0cmE7XG4gIHRoaXMuZW1pdCgnZXh0cmEnLCBleHRyYSk7XG59O1xuIiwidmFyIEV2ZW50RW1pdHRlciA9IHJlcXVpcmUoJ2V2ZW50cycpLkV2ZW50RW1pdHRlcjtcblxuZXhwb3J0cy5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5leHBvcnRzLm1peGluID0gbWl4aW47XG5cbmZ1bmN0aW9uIG1peGluKENvbnN0cnVjdG9yKSB7XG4gIGZvciAodmFyIGtleSBpbiBFdmVudEVtaXR0ZXIucHJvdG90eXBlKSB7XG4gICAgQ29uc3RydWN0b3IucHJvdG90eXBlW2tleV0gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlW2tleV07XG4gIH1cbn1cbiIsInZhciBtYWtlRXJyb3IgPSByZXF1aXJlKCdtYWtlLWVycm9yJyk7XG5cbmZ1bmN0aW9uIFNoYXJlREJFcnJvcihjb2RlLCBtZXNzYWdlKSB7XG4gIFNoYXJlREJFcnJvci5zdXBlci5jYWxsKHRoaXMsIG1lc3NhZ2UpO1xuICB0aGlzLmNvZGUgPSBjb2RlO1xufVxuXG5tYWtlRXJyb3IoU2hhcmVEQkVycm9yKTtcblxubW9kdWxlLmV4cG9ydHMgPSBTaGFyZURCRXJyb3I7XG4iLCJcbmV4cG9ydHMuZGVmYXVsdFR5cGUgPSByZXF1aXJlKCdvdC1qc29uMCcpLnR5cGU7XG5cbmV4cG9ydHMubWFwID0ge307XG5cbmV4cG9ydHMucmVnaXN0ZXIgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICh0eXBlLm5hbWUpIGV4cG9ydHMubWFwW3R5cGUubmFtZV0gPSB0eXBlO1xuICBpZiAodHlwZS51cmkpIGV4cG9ydHMubWFwW3R5cGUudXJpXSA9IHR5cGU7XG59O1xuXG5leHBvcnRzLnJlZ2lzdGVyKGV4cG9ydHMuZGVmYXVsdFR5cGUpO1xuIiwiXG5leHBvcnRzLmRvTm90aGluZyA9IGRvTm90aGluZztcbmZ1bmN0aW9uIGRvTm90aGluZygpIHt9XG5cbmV4cG9ydHMuaGFzS2V5cyA9IGZ1bmN0aW9uKG9iamVjdCkge1xuICBmb3IgKHZhciBrZXkgaW4gb2JqZWN0KSByZXR1cm4gdHJ1ZTtcbiAgcmV0dXJuIGZhbHNlO1xufTtcbiJdfQ==
