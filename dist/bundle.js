(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.app = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
exports.__esModule = true;
exports.setBoardParams = void 0;
var pinch = require('touch-pinch');
var canvas = document.getElementById('main');
var scaleSlider = document.getElementById('scale');
var oxSlider = document.getElementById('ox');
var oySlider = document.getElementById('oy');
var modeInput = document.getElementById('mode');
var Mode;
(function (Mode) {
    Mode[Mode["DRAW"] = 0] = "DRAW";
    Mode[Mode["SCROLL"] = 1] = "SCROLL";
})(Mode || (Mode = {}));
var boardParams = {
    ox: 0,
    oy: 0,
    scale: 1
};
var drawHistory = {
    paths: [],
    activePath: []
};
var isDrawing = false;
var isScrolling = false;
var scrollStart = { x: 0, y: 0 };
var pinchCenter = { x: 0, y: 0 };
var pinchCenterBoard = { x: 0, y: 0 };
var pinchStartScale = 1;
var mode = Mode.DRAW;
if (canvas.getContext) {
    var ctx = canvas.getContext('2d');
    // draw(ctx);
}
else {
    // canvas-unsupported code here
}
function toBoardCoordinates(p) {
    return { x: (p.x - boardParams.ox) / boardParams.scale, y: (p.y - boardParams.oy) / boardParams.scale };
}
function toCanvasCoordinates(p) {
    return { x: p.x * boardParams.scale + boardParams.ox, y: p.y * boardParams.scale + boardParams.oy };
}
function scalePoint(p, scale) {
    return { x: p.x * scale, y: p.y * scale };
}
scaleSlider.addEventListener("change", refreshBoardParams);
oxSlider.addEventListener("change", refreshBoardParams);
oySlider.addEventListener("change", refreshBoardParams);
modeInput.addEventListener("change", function (e) {
    if (modeInput.value === "draw") {
        mode = Mode.DRAW;
    }
    else {
        mode = Mode.SCROLL;
    }
});
function refreshBoardParams(_) {
    console.log('scale: ' + scaleSlider.value, ', ox: ' + oxSlider.value + ', oy: ' + oySlider.value);
    boardParams.scale = +scaleSlider.value;
    boardParams.ox = +oxSlider.value;
    boardParams.oy = +oySlider.value;
    render();
}
function mouseDown(point) {
    if (mode === Mode.DRAW) {
        isDrawing = true;
        drawHistory.activePath = [toBoardCoordinates({ x: point.x, y: point.y })];
    }
    else if (mode === Mode.SCROLL) {
        isScrolling = true;
        scrollStart = { x: point.x, y: point.y };
    }
}
function mouseUp() {
    if (mode === Mode.DRAW) {
        isDrawing = false;
        drawHistory.paths.push(drawHistory.activePath);
        drawHistory.activePath = [];
        render();
    }
    else if (mode === Mode.SCROLL) {
        isScrolling = false;
    }
}
function mouseMove(point) {
    if (mode === Mode.DRAW) {
        if (isDrawing) {
            drawHistory.activePath.push(toBoardCoordinates({ x: point.x, y: point.y }));
            render();
        }
    }
    else if (mode === Mode.SCROLL) {
        if (isScrolling) {
            var dx = (point.x - scrollStart.x);
            var dy = (point.y - scrollStart.y);
            scrollStart = { x: point.x, y: point.y };
            boardParams.ox += dx;
            boardParams.oy += dy;
            render();
        }
    }
}
canvas.addEventListener('mousedown', function (e) { return mouseDown({ x: e.offsetX, y: e.offsetY }); });
canvas.addEventListener('mouseup', function (e) { return mouseUp(); });
canvas.addEventListener('mousemove', function (e) { return mouseMove({ x: e.offsetX, y: e.offsetY }); });
function clamp(val, min, max) {
    return Math.max(Math.min(val, max), min);
}
var pinchHandler = pinch(canvas);
pinchHandler.on('change', function (dist, prevDist) {
    var delta = dist - prevDist;
    boardParams.scale = Math.exp(clamp(Math.log(boardParams.scale) + delta / 100, Math.log(0.25), Math.log(8)));
    boardParams.ox = pinchCenter.x - pinchCenterBoard.x * boardParams.scale;
    boardParams.oy = pinchCenter.y - pinchCenterBoard.y * boardParams.scale;
    render();
});
pinchHandler.on('start', function (_) {
    var fingerA = pinchHandler.fingers[0].position;
    var fingerB = pinchHandler.fingers[1].position;
    pinchCenter = { x: Math.floor((fingerA[0] + fingerB[0]) / 2), y: Math.floor((fingerA[1] + fingerB[1]) / 2) };
    pinchCenterBoard = toBoardCoordinates(pinchCenter);
    pinchStartScale = boardParams.scale;
});
canvas.addEventListener('touchstart', function (e) {
    if (e.targetTouches.length > 1) {
        return;
    }
    e.preventDefault();
    var r = canvas.getBoundingClientRect();
    mouseDown({ x: e.targetTouches[0].clientX - r.x, y: e.targetTouches[0].clientY - r.y });
});
canvas.addEventListener('touchmove', function (e) {
    if (e.targetTouches.length > 1) {
        mouseUp();
    }
    var r = canvas.getBoundingClientRect();
    mouseMove({ x: e.targetTouches[0].clientX - r.x, y: e.targetTouches[0].clientY - r.y });
});
canvas.addEventListener('touchend', function (e) { return mouseUp(); });
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawHistory.paths.forEach(function (path) {
        ctx.stroke(createDrawablePath(path));
    });
    ctx.stroke(createDrawablePath(drawHistory.activePath));
}
function createDrawablePath(points) {
    var path = new Path2D();
    points = points.map(function (p) { return toCanvasCoordinates(p); });
    for (var i = 0; i < points.length - 2; i++) {
        var m1x = Math.floor((points[i].x + points[i + 1].x) / 2);
        var m1y = Math.floor((points[i].y + points[i + 1].y) / 2);
        var m2x = Math.floor((points[i + 1].x + points[i + 2].x) / 2);
        var m2y = Math.floor((points[i + 1].y + points[i + 2].y) / 2);
        path.moveTo(m1x, m1y);
        path.quadraticCurveTo(points[i + 1].x, points[i + 1].y, m2x, m2y);
    }
    return path;
}
function setBoardParams(scale, originX, originY) {
    boardParams.scale = scale;
    boardParams.ox = originX;
    boardParams.oy = originY;
    render();
}
exports.setBoardParams = setBoardParams;

},{"touch-pinch":6}],2:[function(require,module,exports){
module.exports = defaultProperty

function defaultProperty (get, set) {
  return {
    configurable: true,
    enumerable: true,
    get: get,
    set: set
  }
}

},{}],3:[function(require,module,exports){
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

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],4:[function(require,module,exports){
module.exports = distance

/**
 * Calculates the euclidian distance between two vec2's
 *
 * @param {vec2} a the first operand
 * @param {vec2} b the second operand
 * @returns {Number} distance between a and b
 */
function distance(a, b) {
    var x = b[0] - a[0],
        y = b[1] - a[1]
    return Math.sqrt(x*x + y*y)
}
},{}],5:[function(require,module,exports){
var rootPosition = { left: 0, top: 0 }

module.exports = mouseEventOffset
function mouseEventOffset (ev, target, out) {
  target = target || ev.currentTarget || ev.srcElement
  if (!Array.isArray(out)) {
    out = [ 0, 0 ]
  }
  var cx = ev.clientX || 0
  var cy = ev.clientY || 0
  var rect = getBoundingClientOffset(target)
  out[0] = cx - rect.left
  out[1] = cy - rect.top
  return out
}

function getBoundingClientOffset (element) {
  if (element === window ||
      element === document ||
      element === document.body) {
    return rootPosition
  } else {
    return element.getBoundingClientRect()
  }
}

},{}],6:[function(require,module,exports){
var getDistance = require('gl-vec2/distance')
var EventEmitter = require('events').EventEmitter
var dprop = require('dprop')
var eventOffset = require('mouse-event-offset')

module.exports = touchPinch
function touchPinch (target) {
  target = target || window

  var emitter = new EventEmitter()
  var fingers = [ null, null ]
  var activeCount = 0

  var lastDistance = 0
  var ended = false
  var enabled = false

  // some read-only values
  Object.defineProperties(emitter, {
    pinching: dprop(function () {
      return activeCount === 2
    }),

    fingers: dprop(function () {
      return fingers
    })
  })

  enable()
  emitter.enable = enable
  emitter.disable = disable
  emitter.indexOfTouch = indexOfTouch
  return emitter

  function indexOfTouch (touch) {
    var id = touch.identifier
    for (var i = 0; i < fingers.length; i++) {
      if (fingers[i] &&
        fingers[i].touch &&
        fingers[i].touch.identifier === id) {
        return i
      }
    }
    return -1
  }

  function enable () {
    if (enabled) return
    enabled = true
    target.addEventListener('touchstart', onTouchStart, false)
    target.addEventListener('touchmove', onTouchMove, false)
    target.addEventListener('touchend', onTouchRemoved, false)
    target.addEventListener('touchcancel', onTouchRemoved, false)
  }

  function disable () {
    if (!enabled) return
    enabled = false
    activeCount = 0
    fingers[0] = null
    fingers[1] = null
    lastDistance = 0
    ended = false
    target.removeEventListener('touchstart', onTouchStart, false)
    target.removeEventListener('touchmove', onTouchMove, false)
    target.removeEventListener('touchend', onTouchRemoved, false)
    target.removeEventListener('touchcancel', onTouchRemoved, false)
  }

  function onTouchStart (ev) {
    for (var i = 0; i < ev.changedTouches.length; i++) {
      var newTouch = ev.changedTouches[i]
      var id = newTouch.identifier
      var idx = indexOfTouch(id)

      if (idx === -1 && activeCount < 2) {
        var first = activeCount === 0

        // newest and previous finger (previous may be undefined)
        var newIndex = fingers[0] ? 1 : 0
        var oldIndex = fingers[0] ? 0 : 1
        var newFinger = new Finger()

        // add to stack
        fingers[newIndex] = newFinger
        activeCount++

        // update touch event & position
        newFinger.touch = newTouch
        eventOffset(newTouch, target, newFinger.position)

        var oldTouch = fingers[oldIndex] ? fingers[oldIndex].touch : undefined
        emitter.emit('place', newTouch, oldTouch)

        if (!first) {
          var initialDistance = computeDistance()
          ended = false
          emitter.emit('start', initialDistance)
          lastDistance = initialDistance
        }
      }
    }
  }

  function onTouchMove (ev) {
    var changed = false
    for (var i = 0; i < ev.changedTouches.length; i++) {
      var movedTouch = ev.changedTouches[i]
      var idx = indexOfTouch(movedTouch)
      if (idx !== -1) {
        changed = true
        fingers[idx].touch = movedTouch // avoid caching touches
        eventOffset(movedTouch, target, fingers[idx].position)
      }
    }

    if (activeCount === 2 && changed) {
      var currentDistance = computeDistance()
      emitter.emit('change', currentDistance, lastDistance)
      lastDistance = currentDistance
    }
  }

  function onTouchRemoved (ev) {
    for (var i = 0; i < ev.changedTouches.length; i++) {
      var removed = ev.changedTouches[i]
      var idx = indexOfTouch(removed)

      if (idx !== -1) {
        fingers[idx] = null
        activeCount--
        var otherIdx = idx === 0 ? 1 : 0
        var otherTouch = fingers[otherIdx] ? fingers[otherIdx].touch : undefined
        emitter.emit('lift', removed, otherTouch)
      }
    }

    if (!ended && activeCount !== 2) {
      ended = true
      emitter.emit('end')
    }
  }

  function computeDistance () {
    if (activeCount < 2) return 0
    return getDistance(fingers[0].position, fingers[1].position)
  }
}

function Finger () {
  this.position = [0, 0]
  this.touch = null
}

},{"dprop":2,"events":3,"gl-vec2/distance":4,"mouse-event-offset":5}]},{},[1])(1)
});
