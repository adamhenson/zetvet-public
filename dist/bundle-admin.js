(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
  Copyright (c) 2016 Jed Watson.
  Licensed under the MIT License (MIT), see
  http://jedwatson.github.io/classnames
*/
/* global define */

(function () {
	'use strict';

	var hasOwn = {}.hasOwnProperty;

	function classNames () {
		var classes = [];

		for (var i = 0; i < arguments.length; i++) {
			var arg = arguments[i];
			if (!arg) continue;

			var argType = typeof arg;

			if (argType === 'string' || argType === 'number') {
				classes.push(arg);
			} else if (Array.isArray(arg)) {
				classes.push(classNames.apply(null, arg));
			} else if (argType === 'object') {
				for (var key in arg) {
					if (hasOwn.call(arg, key) && arg[key]) {
						classes.push(key);
					}
				}
			}
		}

		return classes.join(' ');
	}

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = classNames;
	} else if (typeof define === 'function' && typeof define.amd === 'object' && define.amd) {
		// register as 'classnames', consistent with npm package name
		define('classnames', [], function () {
			return classNames;
		});
	} else {
		window.classNames = classNames;
	}
}());

},{}],2:[function(require,module,exports){
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
      }
      throw TypeError('Uncaught, unspecified "error" event.');
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

},{}],3:[function(require,module,exports){
(function (process){
/**
 * Copyright 2013-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule invariant
 */

"use strict";

/**
 * Use invariant() to assert state which your program assumes to be true.
 *
 * Provide sprintf-style format (only %s is supported) and arguments
 * to provide information about what broke and what you were
 * expecting.
 *
 * The invariant message will be stripped in production, but the invariant
 * will remain to ensure logic does not differ in production.
 */

var invariant = function (condition, format, a, b, c, d, e, f) {
  if (process.env.NODE_ENV !== 'production') {
    if (format === undefined) {
      throw new Error('invariant requires an error message argument');
    }
  }

  if (!condition) {
    var error;
    if (format === undefined) {
      error = new Error('Minified exception occurred; use the non-minified dev environment ' + 'for the full error message and additional helpful warnings.');
    } else {
      var args = [a, b, c, d, e, f];
      var argIndex = 0;
      error = new Error('Invariant Violation: ' + format.replace(/%s/g, function () {
        return args[argIndex++];
      }));
    }

    error.framesToPop = 1; // we don't care about invariant's own frame
    throw error;
  }
};

module.exports = invariant;
}).call(this,require('_process'))

},{"_process":7}],4:[function(require,module,exports){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

module.exports.Dispatcher = require('./lib/Dispatcher');

},{"./lib/Dispatcher":5}],5:[function(require,module,exports){
(function (process){
/**
 * Copyright (c) 2014-2015, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Dispatcher
 * 
 * @preventMunge
 */

'use strict';

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var invariant = require('fbjs/lib/invariant');

var _prefix = 'ID_';

/**
 * Dispatcher is used to broadcast payloads to registered callbacks. This is
 * different from generic pub-sub systems in two ways:
 *
 *   1) Callbacks are not subscribed to particular events. Every payload is
 *      dispatched to every registered callback.
 *   2) Callbacks can be deferred in whole or part until other callbacks have
 *      been executed.
 *
 * For example, consider this hypothetical flight destination form, which
 * selects a default city when a country is selected:
 *
 *   var flightDispatcher = new Dispatcher();
 *
 *   // Keeps track of which country is selected
 *   var CountryStore = {country: null};
 *
 *   // Keeps track of which city is selected
 *   var CityStore = {city: null};
 *
 *   // Keeps track of the base flight price of the selected city
 *   var FlightPriceStore = {price: null}
 *
 * When a user changes the selected city, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'city-update',
 *     selectedCity: 'paris'
 *   });
 *
 * This payload is digested by `CityStore`:
 *
 *   flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'city-update') {
 *       CityStore.city = payload.selectedCity;
 *     }
 *   });
 *
 * When the user selects a country, we dispatch the payload:
 *
 *   flightDispatcher.dispatch({
 *     actionType: 'country-update',
 *     selectedCountry: 'australia'
 *   });
 *
 * This payload is digested by both stores:
 *
 *   CountryStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       CountryStore.country = payload.selectedCountry;
 *     }
 *   });
 *
 * When the callback to update `CountryStore` is registered, we save a reference
 * to the returned token. Using this token with `waitFor()`, we can guarantee
 * that `CountryStore` is updated before the callback that updates `CityStore`
 * needs to query its data.
 *
 *   CityStore.dispatchToken = flightDispatcher.register(function(payload) {
 *     if (payload.actionType === 'country-update') {
 *       // `CountryStore.country` may not be updated.
 *       flightDispatcher.waitFor([CountryStore.dispatchToken]);
 *       // `CountryStore.country` is now guaranteed to be updated.
 *
 *       // Select the default city for the new country
 *       CityStore.city = getDefaultCityForCountry(CountryStore.country);
 *     }
 *   });
 *
 * The usage of `waitFor()` can be chained, for example:
 *
 *   FlightPriceStore.dispatchToken =
 *     flightDispatcher.register(function(payload) {
 *       switch (payload.actionType) {
 *         case 'country-update':
 *         case 'city-update':
 *           flightDispatcher.waitFor([CityStore.dispatchToken]);
 *           FlightPriceStore.price =
 *             getFlightPriceStore(CountryStore.country, CityStore.city);
 *           break;
 *     }
 *   });
 *
 * The `country-update` payload will be guaranteed to invoke the stores'
 * registered callbacks in order: `CountryStore`, `CityStore`, then
 * `FlightPriceStore`.
 */

var Dispatcher = (function () {
  function Dispatcher() {
    _classCallCheck(this, Dispatcher);

    this._callbacks = {};
    this._isDispatching = false;
    this._isHandled = {};
    this._isPending = {};
    this._lastID = 1;
  }

  /**
   * Registers a callback to be invoked with every dispatched payload. Returns
   * a token that can be used with `waitFor()`.
   */

  Dispatcher.prototype.register = function register(callback) {
    var id = _prefix + this._lastID++;
    this._callbacks[id] = callback;
    return id;
  };

  /**
   * Removes a callback based on its token.
   */

  Dispatcher.prototype.unregister = function unregister(id) {
    !this._callbacks[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.unregister(...): `%s` does not map to a registered callback.', id) : invariant(false) : undefined;
    delete this._callbacks[id];
  };

  /**
   * Waits for the callbacks specified to be invoked before continuing execution
   * of the current callback. This method should only be used by a callback in
   * response to a dispatched payload.
   */

  Dispatcher.prototype.waitFor = function waitFor(ids) {
    !this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Must be invoked while dispatching.') : invariant(false) : undefined;
    for (var ii = 0; ii < ids.length; ii++) {
      var id = ids[ii];
      if (this._isPending[id]) {
        !this._isHandled[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): Circular dependency detected while ' + 'waiting for `%s`.', id) : invariant(false) : undefined;
        continue;
      }
      !this._callbacks[id] ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatcher.waitFor(...): `%s` does not map to a registered callback.', id) : invariant(false) : undefined;
      this._invokeCallback(id);
    }
  };

  /**
   * Dispatches a payload to all registered callbacks.
   */

  Dispatcher.prototype.dispatch = function dispatch(payload) {
    !!this._isDispatching ? process.env.NODE_ENV !== 'production' ? invariant(false, 'Dispatch.dispatch(...): Cannot dispatch in the middle of a dispatch.') : invariant(false) : undefined;
    this._startDispatching(payload);
    try {
      for (var id in this._callbacks) {
        if (this._isPending[id]) {
          continue;
        }
        this._invokeCallback(id);
      }
    } finally {
      this._stopDispatching();
    }
  };

  /**
   * Is this Dispatcher currently dispatching.
   */

  Dispatcher.prototype.isDispatching = function isDispatching() {
    return this._isDispatching;
  };

  /**
   * Call the callback stored with the given id. Also do some internal
   * bookkeeping.
   *
   * @internal
   */

  Dispatcher.prototype._invokeCallback = function _invokeCallback(id) {
    this._isPending[id] = true;
    this._callbacks[id](this._pendingPayload);
    this._isHandled[id] = true;
  };

  /**
   * Set up bookkeeping needed when dispatching.
   *
   * @internal
   */

  Dispatcher.prototype._startDispatching = function _startDispatching(payload) {
    for (var id in this._callbacks) {
      this._isPending[id] = false;
      this._isHandled[id] = false;
    }
    this._pendingPayload = payload;
    this._isDispatching = true;
  };

  /**
   * Clear bookkeeping used for dispatching.
   *
   * @internal
   */

  Dispatcher.prototype._stopDispatching = function _stopDispatching() {
    delete this._pendingPayload;
    this._isDispatching = false;
  };

  return Dispatcher;
})();

module.exports = Dispatcher;
}).call(this,require('_process'))

},{"_process":7,"fbjs/lib/invariant":3}],6:[function(require,module,exports){
/**
 * Copyright 2013-2014 Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

"use strict";

/**
 * Constructs an enumeration with keys equal to their value.
 *
 * For example:
 *
 *   var COLORS = keyMirror({blue: null, red: null});
 *   var myColor = COLORS.blue;
 *   var isColorValid = !!COLORS[myColor];
 *
 * The last line could not be performed if the values of the generated enum were
 * not equal to their keys.
 *
 *   Input:  {key1: val1, key2: val2}
 *   Output: {key1: key1, key2: key2}
 *
 * @param {object} obj
 * @return {object}
 */
var keyMirror = function(obj) {
  var ret = {};
  var key;
  if (!(obj instanceof Object && !Array.isArray(obj))) {
    throw new Error('keyMirror(...): Argument must be an object.');
  }
  for (key in obj) {
    if (!obj.hasOwnProperty(key)) {
      continue;
    }
    ret[key] = key;
  }
  return ret;
};

module.exports = keyMirror;

},{}],7:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
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
    var timeout = setTimeout(cleanUpNextTick);
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
    clearTimeout(timeout);
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
        setTimeout(drainQueue, 0);
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
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AppDispatcher = require('../dispatcher/AppDispatcher.js');

var _AppDispatcher2 = _interopRequireDefault(_AppDispatcher);

var _AdminConstants = require('../constants/AdminConstants.js');

var _AdminConstants2 = _interopRequireDefault(_AdminConstants);

var _AdminWebAPIUtils = require('../utils/AdminWebAPIUtils.js');

var _AdminWebAPIUtils2 = _interopRequireDefault(_AdminWebAPIUtils);

var _AdminFileAPIUtils = require('../utils/AdminFileAPIUtils.js');

var _AdminFileAPIUtils2 = _interopRequireDefault(_AdminFileAPIUtils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AdminActions = {

  /**
   * Get data from via http GET request. This action simply
   *    executes the request. The response is then delegated 
   *    via the `receive` action.
   * @param  {object} url A URL to make the GET request with.
   * @param  {object} component A React component class name.
   */

  get: function get(url, component) {
    _AppDispatcher2.default.dispatch({
      'actionType': _AdminConstants2.default.Actions.GET,
      'component': component
    });

    _AdminWebAPIUtils2.default.get(url, component);
  },


  /**
   * Save data from a submitted form, via http POST, PUT, or DELETE
   *    request. This action simply executes the request. The response
   *    is then delegated via the `receive` action.
   * @param  {object} event An event object. This should be a change
   *    event from a file input.
   * @param  {object} component A React component class name.
   */
  save: function save(event, component) {
    _AppDispatcher2.default.dispatch({
      'actionType': _AdminConstants2.default.Actions.SAVE,
      'component': component
    });

    _AdminWebAPIUtils2.default.save(event, component);
  },


  /**
   * Get image file from an input on change invoked by input. This action
   * simply executes the file API method to get the file. The data that
   * is retrieved is delegated via the `receive` method.
   * @param  {object} event An event object. This should be a change
   *    event from a file input.
   * @param  {object} component A React component class name.
   */
  getImageFile: function getImageFile(event, component) {
    _AppDispatcher2.default.dispatch({
      'actionType': _AdminConstants2.default.Actions.GET_IMAGE_FILE,
      'component': component
    });

    _AdminFileAPIUtils2.default.getImageFile(event, component);
  },


  /**
   * Receive a payload, analyze, and delegate to stores.
   * @param  {object} payload An object containing message, http, and/or
   *    component data. This data is delegated to stores.
   */
  receive: function receive(payload) {
    _AppDispatcher2.default.dispatch({
      'actionType': _AdminConstants2.default.Actions.RECEIVE,
      'payload': payload
    });
  }
};

exports.default = AdminActions;

},{"../constants/AdminConstants.js":16,"../dispatcher/AppDispatcher.js":17,"../utils/AdminFileAPIUtils.js":19,"../utils/AdminWebAPIUtils.js":20}],9:[function(require,module,exports){
'use strict';

var _AdminBioProviderReact = require('./components/bio/AdminBioProvider.react.js');

var _AdminBioProviderReact2 = _interopRequireDefault(_AdminBioProviderReact);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function (window, document, undefined) {

  var components = {
    'AdminBioProvider': _AdminBioProviderReact2.default
  };

  function renderReactComponent(componentName) {
    var $el = $('.' + componentName);
    var ReactComponent = components[componentName];
    if ($el.length) {
      ReactDOM.render(React.createElement(ReactComponent, null), $el[0]);
    };
  };

  if (typeof Zetvet !== 'undefined' && Zetvet.loadObject && Zetvet.loadObject.components) {
    for (var i = 0; Zetvet.loadObject.components.length > i; i++) {
      renderReactComponent(Zetvet.loadObject.components[i]);
    }
  }
})(window, document);

},{"./components/bio/AdminBioProvider.react.js":15}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _AdminActions = require('../actions/AdminActions.js');

var _AdminActions2 = _interopRequireDefault(_AdminActions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ElementEditable = function (_React$Component) {
  _inherits(ElementEditable, _React$Component);

  function ElementEditable(props) {
    _classCallCheck(this, ElementEditable);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(ElementEditable).call(this, props));

    _this.emitChange = _this.emitChange.bind(_this);
    return _this;
  }

  _createClass(ElementEditable, [{
    key: 'shouldComponentUpdate',
    value: function shouldComponentUpdate(nextProps) {
      return nextProps.html !== ReactDOM.findDOMNode(this).innerHTML;
    }
  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      if (this.props.html !== ReactDOM.findDOMNode(this).innerHTML) ReactDOM.findDOMNode(this).innerHTML = this.props.html;
    }
  }, {
    key: 'render',
    value: function render() {
      var el = React.createElement('div', { className: this.props.className, onInput: this.emitChange, onBlur: this.emitChange, contentEditable: true, spellCheck: 'false', dangerouslySetInnerHTML: { __html: this.props.html } });

      if (this.props.type === 'h1') el = React.createElement('h1', { className: this.props.className, onInput: this.emitChange, onBlur: this.emitChange, contentEditable: true, spellCheck: 'false', dangerouslySetInnerHTML: { __html: this.props.html } });
      if (this.props.type === 'p') el = React.createElement('p', { className: this.props.className, onInput: this.emitChange, onBlur: this.emitChange, contentEditable: true, spellCheck: 'false', dangerouslySetInnerHTML: { __html: this.props.html } });
      if (this.props.type === 'span') el = React.createElement('span', { className: this.props.className, onInput: this.emitChange, onBlur: this.emitChange, contentEditable: true, spellCheck: 'false', dangerouslySetInnerHTML: { __html: this.props.html } });

      return el;
    }
  }, {
    key: 'emitChange',
    value: function emitChange() {
      var self = this;
      var html = ReactDOM.findDOMNode(self).innerHTML;

      if (html !== self.lastHtml) {
        _AdminActions2.default.receive({
          'component': self.props.component,
          'data': _defineProperty({}, self.props.input, html)
        });
      }

      self.lastHtml = html;
    }
  }]);

  return ElementEditable;
}(React.Component);

exports.default = ElementEditable;

},{"../actions/AdminActions.js":8}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _AdminConstants = require('../../constants/AdminConstants.js');

var _AdminConstants2 = _interopRequireDefault(_AdminConstants);

var _AdminActions = require('../../actions/AdminActions.js');

var _AdminActions2 = _interopRequireDefault(_AdminActions);

var _ElementEditableReact = require('../ElementEditable.react.js');

var _ElementEditableReact2 = _interopRequireDefault(_ElementEditableReact);

var _AdminBioComponentReact = require('./AdminBioComponent.react.js');

var _AdminBioComponentReact2 = _interopRequireDefault(_AdminBioComponentReact);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AdminBioPicEditForm = function (_React$Component) {
  _inherits(AdminBioPicEditForm, _React$Component);

  function AdminBioPicEditForm() {
    _classCallCheck(this, AdminBioPicEditForm);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(AdminBioPicEditForm).apply(this, arguments));
  }

  _createClass(AdminBioPicEditForm, [{
    key: 'render',
    value: function render() {
      var self = this;
      var formMethod = self.props.id ? 'put' : 'post';
      var formAction = !self.props.id ? _AdminConstants2.default.Urls.PIC_POST : _AdminConstants2.default.Urls.PIC_POST + '/' + self.props.id;
      var deleteFormElement = !self.props.bioImage ? '' : React.createElement(
        'form',
        { action: formAction, method: 'post', 'data-method': 'put', encType: 'multipart/form-data', onSubmit: self.props.onFormSubmit },
        React.createElement('input', { type: 'hidden', name: 'upload', value: 'undefined' }),
        React.createElement(
          'button',
          { className: 'btn btn--delete' },
          _AdminConstants2.default.Copy.TEXT_DELETE
        )
      );

      return React.createElement(
        'div',
        { className: 'container--form' },
        React.createElement(
          'form',
          { action: formAction, method: 'post', 'data-method': formMethod, encType: 'multipart/form-data', onSubmit: self.props.onFormSubmit },
          React.createElement(
            'a',
            { href: '#', onClick: self.props.onChangeImageClick, className: 'btn btn--no-border' },
            self.props.editButtonText
          ),
          React.createElement(
            'div',
            { className: 'form__file-container' },
            React.createElement(
              'label',
              { htmlFor: 'upload-pic', className: 'btn btn--label' },
              _AdminConstants2.default.Copy.TEXT_SELECT_FILE
            ),
            React.createElement('input', { type: 'file', name: 'upload', id: 'upload-pic', onChange: self.props.onFileChange })
          ),
          React.createElement(
            'button',
            { className: 'btn btn--save' },
            _AdminConstants2.default.Copy.TEXT_SAVE
          )
        ),
        deleteFormElement
      );
    }
  }]);

  return AdminBioPicEditForm;
}(React.Component);

var AdminBioCard = function (_AdminBioComponent) {
  _inherits(AdminBioCard, _AdminBioComponent);

  function AdminBioCard(props) {
    _classCallCheck(this, AdminBioCard);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(AdminBioCard).call(this, props));

    _this2.name = _AdminConstants2.default.Components.ADMIN_BIO_CARD;
    return _this2;
  }

  _createClass(AdminBioCard, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.state = {
        'isEditing': false
      };

      if (!Zetvet.loadObject.user.name) {
        Zetvet.loadObject.user.name = Zetvet.loadObject.user.username;
      }

      _AdminActions2.default.receive({
        'component': this.name,
        'data': Zetvet.loadObject.user
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _classObject;

      var self = this;
      var component = this.name;
      var store = self.props.store.data[component];
      var image = !store.pic || !store.pic.thumb ? false : store.pic.thumb;
      var sectionClass = 'section-module';
      var classObject = (_classObject = {}, _defineProperty(_classObject, sectionClass, true), _defineProperty(_classObject, sectionClass + '--bio-card', true), _defineProperty(_classObject, sectionClass + '--editing', self.state.isEditing), _defineProperty(_classObject, sectionClass + '--unsaved', !!store.isUnsaved), _defineProperty(_classObject, sectionClass + '--pic-empty', !image), _classObject);
      var classes = (0, _classnames2.default)(classObject);
      var style = {
        'backgroundImage': !image ? null : 'url(' + image + ')'
      };
      var bioImage = !image ? React.createElement(
        'figcaption',
        null,
        store.initial
      ) : React.createElement('img', { src: image });
      var bioImageEditButtonTextPrefix = self.state.isEditing ? '- ' : '+ ';
      var bioImageEditButtonText = !image ? bioImageEditButtonTextPrefix + _AdminConstants2.default.Copy.TEXT_IMAGE_ADD : bioImageEditButtonTextPrefix + _AdminConstants2.default.Copy.TEXT_IMAGE_CHANGE;

      return React.createElement(
        'section',
        { className: classes },
        React.createElement(
          'figure',
          { style: style },
          React.createElement(AdminBioPicEditForm, { bioImage: image, id: store._id, onChangeImageClick: self.onChangeImageClick, onFormSubmit: self.onFormSubmit, onFileChange: self.onFileChange, editButtonText: bioImageEditButtonText }),
          bioImage
        ),
        React.createElement(
          'div',
          null,
          React.createElement(
            'form',
            { action: _AdminConstants2.default.Urls.PROFILE_POST + '/' + store._id, method: 'post', 'data-method': 'put', encType: 'multipart/form-data', onSubmit: self.onFormSubmit },
            React.createElement(_ElementEditableReact2.default, { input: 'name', html: store.name, type: 'h1', component: component }),
            React.createElement('input', { type: 'hidden', name: 'name', value: store.name }),
            React.createElement(
              'p',
              { className: 'small' },
              React.createElement(_ElementEditableReact2.default, { input: 'phone', className: 'small__span small__span--phone', html: store.phone, type: 'span', component: component }),
              React.createElement('input', { type: 'hidden', name: 'phone', value: store.phone })
            ),
            React.createElement(
              'p',
              { className: 'small' },
              React.createElement(_ElementEditableReact2.default, { className: 'small__span small__span--adress', input: 'address', html: store.address, type: 'span', component: component }),
              React.createElement('input', { type: 'hidden', name: 'address', value: store.address }),
              React.createElement('input', { type: 'hidden', name: 'zipcode' })
            ),
            React.createElement(
              'button',
              { className: 'btn btn--save' },
              _AdminConstants2.default.Copy.TEXT_SAVE
            )
          )
        )
      );
    }
  }]);

  return AdminBioCard;
}(_AdminBioComponentReact2.default);

exports.default = AdminBioCard;

},{"../../actions/AdminActions.js":8,"../../constants/AdminConstants.js":16,"../ElementEditable.react.js":10,"./AdminBioComponent.react.js":12,"classnames":1}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _AdminActions = require('../../actions/AdminActions.js');

var _AdminActions2 = _interopRequireDefault(_AdminActions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AdminBioComponent = function (_React$Component) {
  _inherits(AdminBioComponent, _React$Component);

  function AdminBioComponent(props) {
    _classCallCheck(this, AdminBioComponent);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(AdminBioComponent).call(this, props));

    _this.onFileChange = _this.onFileChange.bind(_this);
    _this.onFormSubmit = _this.onFormSubmit.bind(_this);
    _this.onChangeImageClick = _this.onChangeImageClick.bind(_this);
    if (_this.onChange) _this.onChange = _this.onChange.bind(_this);
    return _this;
  }

  _createClass(AdminBioComponent, [{
    key: 'onFileChange',
    value: function onFileChange(e) {
      _AdminActions2.default.getImageFile(e, this.name);
    }
  }, {
    key: 'onFormSubmit',
    value: function onFormSubmit(e) {
      e.preventDefault();
      this.setState({ 'isUnsaved': false });
      _AdminActions2.default.save(e, this.name);
    }
  }, {
    key: 'onChangeImageClick',
    value: function onChangeImageClick(e) {
      e.preventDefault();
      var isEditing = !this.state.isEditing;

      this.setState({
        'isEditing': isEditing
      });
    }
  }]);

  return AdminBioComponent;
}(React.Component);

exports.default = AdminBioComponent;

},{"../../actions/AdminActions.js":8}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _AdminConstants = require('../../constants/AdminConstants.js');

var _AdminConstants2 = _interopRequireDefault(_AdminConstants);

var _AdminActions = require('../../actions/AdminActions.js');

var _AdminActions2 = _interopRequireDefault(_AdminActions);

var _ElementEditableReact = require('../ElementEditable.react.js');

var _ElementEditableReact2 = _interopRequireDefault(_ElementEditableReact);

var _AdminBioComponentReact = require('./AdminBioComponent.react.js');

var _AdminBioComponentReact2 = _interopRequireDefault(_AdminBioComponentReact);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AdminBioCoverEditForm = function (_React$Component) {
  _inherits(AdminBioCoverEditForm, _React$Component);

  function AdminBioCoverEditForm() {
    _classCallCheck(this, AdminBioCoverEditForm);

    return _possibleConstructorReturn(this, Object.getPrototypeOf(AdminBioCoverEditForm).apply(this, arguments));
  }

  _createClass(AdminBioCoverEditForm, [{
    key: 'render',
    value: function render() {
      var self = this;
      var formMethod = self.props.id ? 'put' : 'post';
      var formAction = !self.props.id ? _AdminConstants2.default.Urls.IMAGE_POST : _AdminConstants2.default.Urls.IMAGE_POST + '/' + self.props.id;
      var deleteFormElement = !self.props.id ? '' : React.createElement(
        'form',
        { action: formAction, method: 'post', 'data-method': 'delete', encType: 'multipart/form-data', onSubmit: self.props.onFormSubmit },
        React.createElement('input', { type: 'hidden', name: '_id', value: self.props.id }),
        React.createElement(
          'button',
          { className: 'btn btn--delete' },
          _AdminConstants2.default.Copy.TEXT_DELETE
        )
      );

      return React.createElement(
        'div',
        { className: 'container--form' },
        React.createElement(
          'form',
          { action: formAction, method: 'post', 'data-method': formMethod, encType: 'multipart/form-data', onSubmit: self.props.onFormSubmit },
          React.createElement(
            'a',
            { href: '#', onClick: self.props.onChangeImageClick, className: 'btn btn--no-border' },
            self.props.editButtonText
          ),
          React.createElement(
            'div',
            { className: 'form__file-container' },
            React.createElement(
              'label',
              { htmlFor: 'upload', className: 'btn btn--label' },
              _AdminConstants2.default.Copy.TEXT_SELECT_FILE
            ),
            React.createElement('input', { type: 'file', name: 'upload', id: 'upload', onChange: self.props.onFileChange })
          ),
          React.createElement('input', { type: 'hidden', name: 'type', value: 'cover' }),
          React.createElement(
            'button',
            { className: 'btn btn--save' },
            _AdminConstants2.default.Copy.TEXT_SAVE
          )
        ),
        deleteFormElement
      );
    }
  }]);

  return AdminBioCoverEditForm;
}(React.Component);

var AdminBioCover = function (_AdminBioComponent) {
  _inherits(AdminBioCover, _AdminBioComponent);

  function AdminBioCover(props) {
    _classCallCheck(this, AdminBioCover);

    var _this2 = _possibleConstructorReturn(this, Object.getPrototypeOf(AdminBioCover).call(this, props));

    _this2.name = _AdminConstants2.default.Components.ADMIN_BIO_COVER;
    return _this2;
  }

  _createClass(AdminBioCover, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.state = {
        'isEditing': false
      };

      _AdminActions2.default.receive({
        'component': this.name,
        'data': Zetvet.loadObject.user.cover || {}
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _classObject;

      var self = this;
      var component = this.name;
      var store = self.props.store.data[component];
      var image = !store || !store.pic || !store.pic.full ? false : store.pic.full;
      var imageId = !store || !store._id || !image ? false : store._id;
      var sectionClass = 'section-module';
      var classObject = (_classObject = {}, _defineProperty(_classObject, sectionClass, true), _defineProperty(_classObject, sectionClass + '--cover', true), _defineProperty(_classObject, sectionClass + '--editing', self.state.isEditing), _defineProperty(_classObject, sectionClass + '--unsaved', !!store.isUnsaved), _defineProperty(_classObject, sectionClass + '--empty', !image), _classObject);
      var classes = (0, _classnames2.default)(classObject);
      var style = {
        'backgroundImage': !image ? null : 'url(' + image + ')'
      };
      var coverImage = !image ? '' : React.createElement('img', { src: image });
      var coverEditButtonTextPrefix = self.state.isEditing ? '- ' : '+ ';
      var coverEditButtonText = !image ? coverEditButtonTextPrefix + _AdminConstants2.default.Copy.TEXT_IMAGE_ADD : coverEditButtonTextPrefix + _AdminConstants2.default.Copy.TEXT_IMAGE_CHANGE;

      return React.createElement(
        'section',
        { className: classes },
        React.createElement(
          'figure',
          { style: style },
          React.createElement(AdminBioCoverEditForm, { id: imageId, onChangeImageClick: self.onChangeImageClick, onFormSubmit: self.onFormSubmit, onFileChange: self.onFileChange, editButtonText: coverEditButtonText }),
          coverImage
        )
      );
    }
  }]);

  return AdminBioCover;
}(_AdminBioComponentReact2.default);

exports.default = AdminBioCover;

},{"../../actions/AdminActions.js":8,"../../constants/AdminConstants.js":16,"../ElementEditable.react.js":10,"./AdminBioComponent.react.js":12,"classnames":1}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _AdminConstants = require('../../constants/AdminConstants.js');

var _AdminConstants2 = _interopRequireDefault(_AdminConstants);

var _AdminActions = require('../../actions/AdminActions.js');

var _AdminActions2 = _interopRequireDefault(_AdminActions);

var _ElementEditableReact = require('../ElementEditable.react.js');

var _ElementEditableReact2 = _interopRequireDefault(_ElementEditableReact);

var _AdminBioComponentReact = require('./AdminBioComponent.react.js');

var _AdminBioComponentReact2 = _interopRequireDefault(_AdminBioComponentReact);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var AdminBioDescription = function (_AdminBioComponent) {
  _inherits(AdminBioDescription, _AdminBioComponent);

  function AdminBioDescription(props) {
    _classCallCheck(this, AdminBioDescription);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(AdminBioDescription).call(this, props));

    _this.name = _AdminConstants2.default.Components.ADMIN_BIO_DESCRIPTION;
    return _this;
  }

  _createClass(AdminBioDescription, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.state = {
        'isEditing': false
      };

      _AdminActions2.default.receive({
        'component': this.name,
        'data': {
          '_id': Zetvet.loadObject.user._id,
          'description': Zetvet.loadObject.user.description
        }
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _classObject;

      var self = this;
      var component = this.name;
      var store = self.props.store.data[component];
      var sectionClass = 'section-module';
      var classObject = (_classObject = {}, _defineProperty(_classObject, sectionClass, true), _defineProperty(_classObject, sectionClass + '--bio-description', true), _defineProperty(_classObject, sectionClass + '--empty', !Zetvet.loadObject.user.description || Zetvet.loadObject.user.description === ''), _defineProperty(_classObject, sectionClass + '--editing', self.state.isEditing), _defineProperty(_classObject, sectionClass + '--unsaved', self.state.isUnsaved), _classObject);
      var classes = (0, _classnames2.default)(classObject);

      return React.createElement(
        'section',
        { className: classes },
        React.createElement(_ElementEditableReact2.default, { className: 'paragraphs', input: 'description', html: store.description, component: component }),
        React.createElement(
          'form',
          { action: _AdminConstants2.default.Urls.PROFILE_POST + '/' + Zetvet.loadObject.user._id, method: 'post', 'data-method': 'put', encType: 'multipart/form-data', onSubmit: self.onFormSubmit },
          React.createElement('input', { type: 'hidden', name: 'description', value: store.description }),
          React.createElement(
            'button',
            { className: 'btn btn--save' },
            _AdminConstants2.default.Copy.TEXT_SAVE
          )
        )
      );
    }
  }]);

  return AdminBioDescription;
}(_AdminBioComponentReact2.default);

exports.default = AdminBioDescription;

},{"../../actions/AdminActions.js":8,"../../constants/AdminConstants.js":16,"../ElementEditable.react.js":10,"./AdminBioComponent.react.js":12,"classnames":1}],15:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _classnames = require('classnames');

var _classnames2 = _interopRequireDefault(_classnames);

var _AdminStore = require('../../stores/AdminStore.js');

var _AdminStore2 = _interopRequireDefault(_AdminStore);

var _AdminBioCoverReact = require('./AdminBioCover.react.js');

var _AdminBioCoverReact2 = _interopRequireDefault(_AdminBioCoverReact);

var _AdminBioCardReact = require('./AdminBioCard.react.js');

var _AdminBioCardReact2 = _interopRequireDefault(_AdminBioCardReact);

var _AdminBioDescriptionReact = require('./AdminBioDescription.react.js');

var _AdminBioDescriptionReact2 = _interopRequireDefault(_AdminBioDescriptionReact);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function getStateFromStores() {
  return _AdminStore2.default.getAll();
}

var AdminBioProvider = function (_React$Component) {
  _inherits(AdminBioProvider, _React$Component);

  function AdminBioProvider(props) {
    _classCallCheck(this, AdminBioProvider);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(AdminBioProvider).call(this, props));

    _this.onChange = _this.onChange.bind(_this);
    return _this;
  }

  _createClass(AdminBioProvider, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.setState({
        'store': getStateFromStores()
      });

      this.state = {
        'isEditing': false
      };
    }
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      _AdminStore2.default.addChangeListener(this.onChange);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      _AdminStore2.default.removeChangeListener(this.onChange);
    }
  }, {
    key: 'render',
    value: function render() {
      var _classObject;

      var self = this;
      var mainClass = 'main';
      var withMessage = self.state.store.message && self.state.store.message.type && self.state.store.message.body;
      var classObject = (_classObject = {}, _defineProperty(_classObject, mainClass, true), _defineProperty(_classObject, mainClass + '--page', true), _defineProperty(_classObject, mainClass + '--loading', self.state.store.isLoading), _defineProperty(_classObject, mainClass + '--message-active', withMessage), _classObject);
      var classes = (0, _classnames2.default)(classObject);
      var message = !withMessage ? '' : React.createElement(
        'div',
        { className: 'message message--' + self.state.store.message.type },
        self.state.store.message.body
      );
      var loadingElement = '';

      if (self.state.store.isLoading) {
        loadingElement = React.createElement('div', { className: 'page__overlay' });
        $('body').addClass('page--blur');
      } else {
        $('body').removeClass('page--blur');
      }

      return React.createElement(
        'main',
        { className: classes },
        loadingElement,
        message,
        React.createElement(_AdminBioCoverReact2.default, { store: self.state.store }),
        React.createElement(_AdminBioCardReact2.default, { store: self.state.store }),
        React.createElement(_AdminBioDescriptionReact2.default, { store: self.state.store })
      );
    }
  }, {
    key: 'onChange',
    value: function onChange() {
      this.setState({
        'store': getStateFromStores()
      });
    }
  }]);

  return AdminBioProvider;
}(React.Component);

exports.default = AdminBioProvider;

},{"../../stores/AdminStore.js":18,"./AdminBioCard.react.js":11,"./AdminBioCover.react.js":13,"./AdminBioDescription.react.js":14,"classnames":1}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _keymirror = require('keymirror');

var _keymirror2 = _interopRequireDefault(_keymirror);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AdminConstants = {
  'Copy': {
    'TEXT_IMAGE_ADD': 'add image',
    'TEXT_IMAGE_CHANGE': 'change image',
    'TEXT_DELETE': 'delete',
    'TEXT_SAVE': 'save',
    'TEXT_SELECT_FILE': 'select file'
  },
  'Urls': {
    'IMAGE_GET': '/api/image',
    'IMAGE_POST': '/private/api/image',
    'PROFILE_POST': '/private/api/profile',
    'PIC_POST': '/private/api/pic'
  }
};

AdminConstants.Actions = (0, _keymirror2.default)({
  GET: null,
  GET_IMAGE_FILE: null,
  GET_HTTP_ERROR_MESSAGE: null,
  SAVE: null,
  RECEIVE: null
});

AdminConstants.Components = (0, _keymirror2.default)({
  ADMIN_BIO_CARD: null,
  ADMIN_BIO_COVER: null,
  ADMIN_BIO_DESCRIPTION: null
});

exports.default = AdminConstants;

},{"keymirror":6}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var Dispatcher = require('flux').Dispatcher;

exports.default = new Dispatcher();

},{"flux":4}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

var _AppDispatcher = require('../dispatcher/AppDispatcher.js');

var _AppDispatcher2 = _interopRequireDefault(_AppDispatcher);

var _AdminConstants = require('../constants/AdminConstants.js');

var _AdminConstants2 = _interopRequireDefault(_AdminConstants);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var CHANGE_EVENT = 'change';

var adminData = {};
var message = {};
var isLoading = false;

/**
 * Receive a payload, analyze, and delegate to stores.
 * @param  {object} payload An object containing message, http, and/or
 *    component data. This data is delegated to stores.
 */
function receive(payload) {
  if (payload.data) {
    if (adminData[payload.component]) {
      adminData[payload.component] = _extends(adminData[payload.component], payload.data);
    } else {
      var componentData = _defineProperty({}, payload.component, payload.data);

      adminData = _extends(adminData, componentData);
    }
  } else if (payload.body) {
    message = payload;
  }
}

var AdminStore = _extends({}, _events2.default.prototype, {
  emitChange: function emitChange() {
    this.emit(CHANGE_EVENT);
  },


  /**
   * @param {function} callback
   */
  addChangeListener: function addChangeListener(callback) {
    this.on(CHANGE_EVENT, callback);
  },


  /**
   * @param {function} callback
   */
  removeChangeListener: function removeChangeListener(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  },


  /**
   * Get all admin data.
   */
  getAll: function getAll() {
    return {
      'isLoading': isLoading,
      'message': message,
      'data': adminData
    };
  }
});

_AppDispatcher2.default.register(function (action) {

  switch (action.actionType) {

    case _AdminConstants2.default.Actions.SAVE:
      isLoading = true;
      AdminStore.emitChange();
      break;

    case _AdminConstants2.default.Actions.RECEIVE:
      receive(action.payload);
      isLoading = false;
      AdminStore.emitChange();
      break;

    default:
    // no op

  }
});

exports.default = AdminStore;

},{"../constants/AdminConstants.js":16,"../dispatcher/AppDispatcher.js":17,"events":2}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AdminActions = require('../actions/AdminActions.js');

var _AdminActions2 = _interopRequireDefault(_AdminActions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {

  /**
   * Get image file from an input on change invoked by input. This action
   * simply executes the file API method to get the file. The data that
   * is retrieved is delegated via the `receive` method.
   * @param  {object} event An event object. This should be a change
   *    event from a file input.
   * @param  {object} component A React component class name.
   */

  getImageFile: function getImageFile(event, component) {
    var self = this;
    var target = event.currentTarget;
    var $target = $(event.currentTarget);

    if (target.files && target.files[0]) {
      if (target.files[0].type.indexOf('image') === -1) {
        self.handleResponse({ 'error': 'Invalid file type.' }, component);
      } else {
        (function () {
          var fileReader = new FileReader();

          fileReader.onload = function () {
            self.handleResponse({
              'data': {
                'pic': {
                  'full': fileReader.result,
                  'thumb': fileReader.result
                },
                'isUnsaved': true
              }
            }, component);
          };

          fileReader.readAsDataURL(target.files[0]);
        })();
      }
    }
  },


  /**
   * Helper function to reduce redundancy in this file.
   * @param  {object} response Data object to transmit to the store
   * via the `receive` method.
   * @param  {object} component A React component class name.
   */
  handleResponse: function handleResponse(response, component) {
    if (response.error) {
      _AdminActions2.default.receive({
        'type': 'error',
        'component': component,
        'body': response.error
      });
    } else {
      _AdminActions2.default.receive({
        'component': component,
        'data': response.data
      });
    }
  }
};

},{"../actions/AdminActions.js":8}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _AdminActions = require('../actions/AdminActions.js');

var _AdminActions2 = _interopRequireDefault(_AdminActions);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {

  /**
   * Get data from via http GET request. This action simply
   *    executes the request. The response is then delegated 
   *    via the `receive` action.
   * @param  {object} url A URL to make the GET request with.
   * @param  {object} component A React component class name.
   */

  get: function get(url, component) {
    var self = this;

    $.ajax({
      'url': url,
      'type': 'get'
    }).done(function (response) {
      self.handleResponse({ 'data': response }, component);
    }).error(function (xhr, status, error) {
      self.handleResponse({ 'xhr': xhr }, component);
    });
  },


  /**
   * Save data from a submitted form, via http POST, PUT, or DELETE
   *    request. This action simply executes the request. The response
   *    is then delegated via the `receive` action.
   * @param  {object} event An event object. This should be a change
   *    event from a file input.
   * @param  {object} component A React component class name.
   */
  save: function save(event, component) {
    var self = this;
    var $this = $(event.target);
    var formData = new FormData($this[0]);
    var method = $this.attr('data-method');

    $.ajax({
      'url': $this.attr('action'),
      'type': method,
      'data': formData,
      'enctype': $this.attr('enctype'),
      'processData': false,
      'contentType': false
    }).done(function (response) {
      response.method = method.toLowerCase();
      self.handleResponse(response, component);
    }).error(function (xhr, status, error) {
      self.handleResponse({ 'xhr': xhr }, component);
    });
  },


  /**
   * Helper function to reduce redundancy in this file.
   * @param  {object} response Data object to transmit to the store
   * via the `receive` method.
   * @param  {object} component A React component class name.
   */
  handleResponse: function handleResponse(response, component) {
    if (response && response.xhr) {
      var message = this.getHttpErrorMessage(response.xhr);

      _AdminActions2.default.receive({
        'type': 'error',
        'component': component,
        'body': message
      });
    } else if (response) {
      if (response.data && response.data.message && response.data.message.success) {
        _AdminActions2.default.receive({
          'type': 'success',
          'component': component,
          'body': response.data.message.success
        });

        if (response.method && response.method === 'delete' && !response.data.responseData && component.toLowerCase() === 'adminbiocover') {
          response.data.responseData = {
            'pic': false,
            'isUnsaved': false
          };
        }
      }
      if (response.data && response.data.responseData) {
        response.data.responseData.isUnsaved = false;

        if (component.toLowerCase() === 'adminbiocard' && !response.data.responseData.pic) {
          response.data.responseData.pic = null;
        }

        _AdminActions2.default.receive({
          'component': component,
          'data': response.data.responseData
        });
      };
    }
  },


  /**
   * Get error generated by an http request and formulate a message.
   * @param  {object} xhr Object generated after http request.
   * @return {string || false}
   */
  getHttpErrorMessage: function getHttpErrorMessage(xhr) {
    return !xhr || !xhr.responseJSON || !xhr.responseJSON.data || !xhr.responseJSON.data.message || !xhr.responseJSON.data.message.error ? 'Something went wrong.' : xhr.responseJSON.data.message.error;
  }
};

},{"../actions/AdminActions.js":8}]},{},[9])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvY2xhc3NuYW1lcy9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9ldmVudHMvZXZlbnRzLmpzIiwibm9kZV9tb2R1bGVzL2ZianMvbGliL2ludmFyaWFudC5qcyIsIm5vZGVfbW9kdWxlcy9mbHV4L2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL2ZsdXgvbGliL0Rpc3BhdGNoZXIuanMiLCJub2RlX21vZHVsZXMva2V5bWlycm9yL2luZGV4LmpzIiwibm9kZV9tb2R1bGVzL3Byb2Nlc3MvYnJvd3Nlci5qcyIsInB1YmxpYy9qcy9zcmMvYWN0aW9ucy9BZG1pbkFjdGlvbnMuanMiLCJwdWJsaWMvanMvc3JjL2FkbWluLmpzIiwicHVibGljL2pzL3NyYy9jb21wb25lbnRzL0VsZW1lbnRFZGl0YWJsZS5yZWFjdC5qcyIsInB1YmxpYy9qcy9zcmMvY29tcG9uZW50cy9iaW8vQWRtaW5CaW9DYXJkLnJlYWN0LmpzIiwicHVibGljL2pzL3NyYy9jb21wb25lbnRzL2Jpby9BZG1pbkJpb0NvbXBvbmVudC5yZWFjdC5qcyIsInB1YmxpYy9qcy9zcmMvY29tcG9uZW50cy9iaW8vQWRtaW5CaW9Db3Zlci5yZWFjdC5qcyIsInB1YmxpYy9qcy9zcmMvY29tcG9uZW50cy9iaW8vQWRtaW5CaW9EZXNjcmlwdGlvbi5yZWFjdC5qcyIsInB1YmxpYy9qcy9zcmMvY29tcG9uZW50cy9iaW8vQWRtaW5CaW9Qcm92aWRlci5yZWFjdC5qcyIsInB1YmxpYy9qcy9zcmMvY29uc3RhbnRzL0FkbWluQ29uc3RhbnRzLmpzIiwicHVibGljL2pzL3NyYy9kaXNwYXRjaGVyL0FwcERpc3BhdGNoZXIuanMiLCJwdWJsaWMvanMvc3JjL3N0b3Jlcy9BZG1pblN0b3JlLmpzIiwicHVibGljL2pzL3NyYy91dGlscy9BZG1pbkZpbGVBUElVdGlscy5qcyIsInB1YmxpYy9qcy9zcmMvdXRpbHMvQWRtaW5XZWJBUElVdGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUMxU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDVkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDdE9BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FB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QWMsWUFBZCxJQUE4QixVQUFVLFdBQVYsT0FBNEIsZUFBNUIsRUFBNkM7QUFDaEksbUJBQVMsSUFBVCxDQUFjLFlBQWQsR0FBNkI7QUFDM0IsbUJBQVEsS0FBUjtBQUNBLHlCQUFjLEtBQWQ7V0FGRixDQURnSTtTQUFsSTtPQVBGO0FBY0EsVUFBRyxTQUFTLElBQVQsSUFBaUIsU0FBUyxJQUFULENBQWMsWUFBZCxFQUE0QjtBQUM5QyxpQkFBUyxJQUFULENBQWMsWUFBZCxDQUEyQixTQUEzQixHQUF1QyxLQUF2QyxDQUQ4Qzs7QUFHOUMsWUFBRyxVQUFVLFdBQVYsT0FBNEIsY0FBNUIsSUFBOEMsQ0FBQyxTQUFTLElBQVQsQ0FBYyxZQUFkLENBQTJCLEdBQTNCLEVBQWdDO0FBQ2hGLG1CQUFTLElBQVQsQ0FBYyxZQUFkLENBQTJCLEdBQTNCLEdBQWlDLElBQWpDLENBRGdGO1NBQWxGOztBQUlBLCtCQUFhLE9BQWIsQ0FBcUI7QUFDbkIsdUJBQWMsU0FBZDtBQUNBLGtCQUFTLFNBQVMsSUFBVCxDQUFjLFlBQWQ7U0FGWCxFQVA4QztPQUFoRCxDQWZrQjtLQUFiO0dBbEVJOzs7Ozs7OztBQXFHYixvREFBb0IsS0FBSztBQUN2QixXQUFPLENBQUUsR0FBRCxJQUFRLENBQUMsSUFBSSxZQUFKLElBQW9CLENBQUMsSUFBSSxZQUFKLENBQWlCLElBQWpCLElBQXlCLENBQUMsSUFBSSxZQUFKLENBQWlCLElBQWpCLENBQXNCLE9BQXRCLElBQWlDLENBQUMsSUFBSSxZQUFKLENBQWlCLElBQWpCLENBQXNCLE9BQXRCLENBQThCLEtBQTlCLEdBQzdGLHVCQURFLEdBRUgsSUFBSSxZQUFKLENBQWlCLElBQWpCLENBQXNCLE9BQXRCLENBQThCLEtBQTlCLENBSG1CO0dBckdaIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIVxuICBDb3B5cmlnaHQgKGMpIDIwMTYgSmVkIFdhdHNvbi5cbiAgTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBMaWNlbnNlIChNSVQpLCBzZWVcbiAgaHR0cDovL2plZHdhdHNvbi5naXRodWIuaW8vY2xhc3NuYW1lc1xuKi9cbi8qIGdsb2JhbCBkZWZpbmUgKi9cblxuKGZ1bmN0aW9uICgpIHtcblx0J3VzZSBzdHJpY3QnO1xuXG5cdHZhciBoYXNPd24gPSB7fS5oYXNPd25Qcm9wZXJ0eTtcblxuXHRmdW5jdGlvbiBjbGFzc05hbWVzICgpIHtcblx0XHR2YXIgY2xhc3NlcyA9IFtdO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBhcmcgPSBhcmd1bWVudHNbaV07XG5cdFx0XHRpZiAoIWFyZykgY29udGludWU7XG5cblx0XHRcdHZhciBhcmdUeXBlID0gdHlwZW9mIGFyZztcblxuXHRcdFx0aWYgKGFyZ1R5cGUgPT09ICdzdHJpbmcnIHx8IGFyZ1R5cGUgPT09ICdudW1iZXInKSB7XG5cdFx0XHRcdGNsYXNzZXMucHVzaChhcmcpO1xuXHRcdFx0fSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGFyZykpIHtcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKGNsYXNzTmFtZXMuYXBwbHkobnVsbCwgYXJnKSk7XG5cdFx0XHR9IGVsc2UgaWYgKGFyZ1R5cGUgPT09ICdvYmplY3QnKSB7XG5cdFx0XHRcdGZvciAodmFyIGtleSBpbiBhcmcpIHtcblx0XHRcdFx0XHRpZiAoaGFzT3duLmNhbGwoYXJnLCBrZXkpICYmIGFyZ1trZXldKSB7XG5cdFx0XHRcdFx0XHRjbGFzc2VzLnB1c2goa2V5KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gY2xhc3Nlcy5qb2luKCcgJyk7XG5cdH1cblxuXHRpZiAodHlwZW9mIG1vZHVsZSAhPT0gJ3VuZGVmaW5lZCcgJiYgbW9kdWxlLmV4cG9ydHMpIHtcblx0XHRtb2R1bGUuZXhwb3J0cyA9IGNsYXNzTmFtZXM7XG5cdH0gZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiB0eXBlb2YgZGVmaW5lLmFtZCA9PT0gJ29iamVjdCcgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIHJlZ2lzdGVyIGFzICdjbGFzc25hbWVzJywgY29uc2lzdGVudCB3aXRoIG5wbSBwYWNrYWdlIG5hbWVcblx0XHRkZWZpbmUoJ2NsYXNzbmFtZXMnLCBbXSwgZnVuY3Rpb24gKCkge1xuXHRcdFx0cmV0dXJuIGNsYXNzTmFtZXM7XG5cdFx0fSk7XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LmNsYXNzTmFtZXMgPSBjbGFzc05hbWVzO1xuXHR9XG59KCkpO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbmZ1bmN0aW9uIEV2ZW50RW1pdHRlcigpIHtcbiAgdGhpcy5fZXZlbnRzID0gdGhpcy5fZXZlbnRzIHx8IHt9O1xuICB0aGlzLl9tYXhMaXN0ZW5lcnMgPSB0aGlzLl9tYXhMaXN0ZW5lcnMgfHwgdW5kZWZpbmVkO1xufVxubW9kdWxlLmV4cG9ydHMgPSBFdmVudEVtaXR0ZXI7XG5cbi8vIEJhY2t3YXJkcy1jb21wYXQgd2l0aCBub2RlIDAuMTAueFxuRXZlbnRFbWl0dGVyLkV2ZW50RW1pdHRlciA9IEV2ZW50RW1pdHRlcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fZXZlbnRzID0gdW5kZWZpbmVkO1xuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5fbWF4TGlzdGVuZXJzID0gdW5kZWZpbmVkO1xuXG4vLyBCeSBkZWZhdWx0IEV2ZW50RW1pdHRlcnMgd2lsbCBwcmludCBhIHdhcm5pbmcgaWYgbW9yZSB0aGFuIDEwIGxpc3RlbmVycyBhcmVcbi8vIGFkZGVkIHRvIGl0LiBUaGlzIGlzIGEgdXNlZnVsIGRlZmF1bHQgd2hpY2ggaGVscHMgZmluZGluZyBtZW1vcnkgbGVha3MuXG5FdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycyA9IDEwO1xuXG4vLyBPYnZpb3VzbHkgbm90IGFsbCBFbWl0dGVycyBzaG91bGQgYmUgbGltaXRlZCB0byAxMC4gVGhpcyBmdW5jdGlvbiBhbGxvd3Ncbi8vIHRoYXQgdG8gYmUgaW5jcmVhc2VkLiBTZXQgdG8gemVybyBmb3IgdW5saW1pdGVkLlxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5zZXRNYXhMaXN0ZW5lcnMgPSBmdW5jdGlvbihuKSB7XG4gIGlmICghaXNOdW1iZXIobikgfHwgbiA8IDAgfHwgaXNOYU4obikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCduIG11c3QgYmUgYSBwb3NpdGl2ZSBudW1iZXInKTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gbjtcbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIHZhciBlciwgaGFuZGxlciwgbGVuLCBhcmdzLCBpLCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gSWYgdGhlcmUgaXMgbm8gJ2Vycm9yJyBldmVudCBsaXN0ZW5lciB0aGVuIHRocm93LlxuICBpZiAodHlwZSA9PT0gJ2Vycm9yJykge1xuICAgIGlmICghdGhpcy5fZXZlbnRzLmVycm9yIHx8XG4gICAgICAgIChpc09iamVjdCh0aGlzLl9ldmVudHMuZXJyb3IpICYmICF0aGlzLl9ldmVudHMuZXJyb3IubGVuZ3RoKSkge1xuICAgICAgZXIgPSBhcmd1bWVudHNbMV07XG4gICAgICBpZiAoZXIgaW5zdGFuY2VvZiBFcnJvcikge1xuICAgICAgICB0aHJvdyBlcjsgLy8gVW5oYW5kbGVkICdlcnJvcicgZXZlbnRcbiAgICAgIH1cbiAgICAgIHRocm93IFR5cGVFcnJvcignVW5jYXVnaHQsIHVuc3BlY2lmaWVkIFwiZXJyb3JcIiBldmVudC4nKTtcbiAgICB9XG4gIH1cblxuICBoYW5kbGVyID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuXG4gIGlmIChpc1VuZGVmaW5lZChoYW5kbGVyKSlcbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKGlzRnVuY3Rpb24oaGFuZGxlcikpIHtcbiAgICBzd2l0Y2ggKGFyZ3VtZW50cy5sZW5ndGgpIHtcbiAgICAgIC8vIGZhc3QgY2FzZXNcbiAgICAgIGNhc2UgMTpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMjpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSAzOlxuICAgICAgICBoYW5kbGVyLmNhbGwodGhpcywgYXJndW1lbnRzWzFdLCBhcmd1bWVudHNbMl0pO1xuICAgICAgICBicmVhaztcbiAgICAgIC8vIHNsb3dlclxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgICAgIGhhbmRsZXIuYXBwbHkodGhpcywgYXJncyk7XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGhhbmRsZXIpKSB7XG4gICAgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG4gICAgbGlzdGVuZXJzID0gaGFuZGxlci5zbGljZSgpO1xuICAgIGxlbiA9IGxpc3RlbmVycy5sZW5ndGg7XG4gICAgZm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKVxuICAgICAgbGlzdGVuZXJzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgdmFyIG07XG5cbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIFRvIGF2b2lkIHJlY3Vyc2lvbiBpbiB0aGUgY2FzZSB0aGF0IHR5cGUgPT09IFwibmV3TGlzdGVuZXJcIiEgQmVmb3JlXG4gIC8vIGFkZGluZyBpdCB0byB0aGUgbGlzdGVuZXJzLCBmaXJzdCBlbWl0IFwibmV3TGlzdGVuZXJcIi5cbiAgaWYgKHRoaXMuX2V2ZW50cy5uZXdMaXN0ZW5lcilcbiAgICB0aGlzLmVtaXQoJ25ld0xpc3RlbmVyJywgdHlwZSxcbiAgICAgICAgICAgICAgaXNGdW5jdGlvbihsaXN0ZW5lci5saXN0ZW5lcikgP1xuICAgICAgICAgICAgICBsaXN0ZW5lci5saXN0ZW5lciA6IGxpc3RlbmVyKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAvLyBPcHRpbWl6ZSB0aGUgY2FzZSBvZiBvbmUgbGlzdGVuZXIuIERvbid0IG5lZWQgdGhlIGV4dHJhIGFycmF5IG9iamVjdC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBsaXN0ZW5lcjtcbiAgZWxzZSBpZiAoaXNPYmplY3QodGhpcy5fZXZlbnRzW3R5cGVdKSlcbiAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXIpO1xuICBlbHNlXG4gICAgLy8gQWRkaW5nIHRoZSBzZWNvbmQgZWxlbWVudCwgbmVlZCB0byBjaGFuZ2UgdG8gYXJyYXkuXG4gICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gW3RoaXMuX2V2ZW50c1t0eXBlXSwgbGlzdGVuZXJdO1xuXG4gIC8vIENoZWNrIGZvciBsaXN0ZW5lciBsZWFrXG4gIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pICYmICF0aGlzLl9ldmVudHNbdHlwZV0ud2FybmVkKSB7XG4gICAgaWYgKCFpc1VuZGVmaW5lZCh0aGlzLl9tYXhMaXN0ZW5lcnMpKSB7XG4gICAgICBtID0gdGhpcy5fbWF4TGlzdGVuZXJzO1xuICAgIH0gZWxzZSB7XG4gICAgICBtID0gRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnM7XG4gICAgfVxuXG4gICAgaWYgKG0gJiYgbSA+IDAgJiYgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCA+IG0pIHtcbiAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQgPSB0cnVlO1xuICAgICAgY29uc29sZS5lcnJvcignKG5vZGUpIHdhcm5pbmc6IHBvc3NpYmxlIEV2ZW50RW1pdHRlciBtZW1vcnkgJyArXG4gICAgICAgICAgICAgICAgICAgICdsZWFrIGRldGVjdGVkLiAlZCBsaXN0ZW5lcnMgYWRkZWQuICcgK1xuICAgICAgICAgICAgICAgICAgICAnVXNlIGVtaXR0ZXIuc2V0TWF4TGlzdGVuZXJzKCkgdG8gaW5jcmVhc2UgbGltaXQuJyxcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLmxlbmd0aCk7XG4gICAgICBpZiAodHlwZW9mIGNvbnNvbGUudHJhY2UgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgLy8gbm90IHN1cHBvcnRlZCBpbiBJRSAxMFxuICAgICAgICBjb25zb2xlLnRyYWNlKCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uID0gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcjtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5vbmNlID0gZnVuY3Rpb24odHlwZSwgbGlzdGVuZXIpIHtcbiAgaWYgKCFpc0Z1bmN0aW9uKGxpc3RlbmVyKSlcbiAgICB0aHJvdyBUeXBlRXJyb3IoJ2xpc3RlbmVyIG11c3QgYmUgYSBmdW5jdGlvbicpO1xuXG4gIHZhciBmaXJlZCA9IGZhbHNlO1xuXG4gIGZ1bmN0aW9uIGcoKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblxuICAgIGlmICghZmlyZWQpIHtcbiAgICAgIGZpcmVkID0gdHJ1ZTtcbiAgICAgIGxpc3RlbmVyLmFwcGx5KHRoaXMsIGFyZ3VtZW50cyk7XG4gICAgfVxuICB9XG5cbiAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuICB0aGlzLm9uKHR5cGUsIGcpO1xuXG4gIHJldHVybiB0aGlzO1xufTtcblxuLy8gZW1pdHMgYSAncmVtb3ZlTGlzdGVuZXInIGV2ZW50IGlmZiB0aGUgbGlzdGVuZXIgd2FzIHJlbW92ZWRcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbGlzdCwgcG9zaXRpb24sIGxlbmd0aCwgaTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXR1cm4gdGhpcztcblxuICBsaXN0ID0gdGhpcy5fZXZlbnRzW3R5cGVdO1xuICBsZW5ndGggPSBsaXN0Lmxlbmd0aDtcbiAgcG9zaXRpb24gPSAtMTtcblxuICBpZiAobGlzdCA9PT0gbGlzdGVuZXIgfHxcbiAgICAgIChpc0Z1bmN0aW9uKGxpc3QubGlzdGVuZXIpICYmIGxpc3QubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG5cbiAgfSBlbHNlIGlmIChpc09iamVjdChsaXN0KSkge1xuICAgIGZvciAoaSA9IGxlbmd0aDsgaS0tID4gMDspIHtcbiAgICAgIGlmIChsaXN0W2ldID09PSBsaXN0ZW5lciB8fFxuICAgICAgICAgIChsaXN0W2ldLmxpc3RlbmVyICYmIGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSkge1xuICAgICAgICBwb3NpdGlvbiA9IGk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChwb3NpdGlvbiA8IDApXG4gICAgICByZXR1cm4gdGhpcztcblxuICAgIGlmIChsaXN0Lmxlbmd0aCA9PT0gMSkge1xuICAgICAgbGlzdC5sZW5ndGggPSAwO1xuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuICAgIH1cblxuICAgIGlmICh0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpXG4gICAgICB0aGlzLmVtaXQoJ3JlbW92ZUxpc3RlbmVyJywgdHlwZSwgbGlzdGVuZXIpO1xuICB9XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIGtleSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIC8vIG5vdCBsaXN0ZW5pbmcgZm9yIHJlbW92ZUxpc3RlbmVyLCBubyBuZWVkIHRvIGVtaXRcbiAgaWYgKCF0aGlzLl9ldmVudHMucmVtb3ZlTGlzdGVuZXIpIHtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMClcbiAgICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuICAgIGVsc2UgaWYgKHRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICAgIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAvLyBlbWl0IHJlbW92ZUxpc3RlbmVyIGZvciBhbGwgbGlzdGVuZXJzIG9uIGFsbCBldmVudHNcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICBmb3IgKGtleSBpbiB0aGlzLl9ldmVudHMpIHtcbiAgICAgIGlmIChrZXkgPT09ICdyZW1vdmVMaXN0ZW5lcicpIGNvbnRpbnVlO1xuICAgICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoa2V5KTtcbiAgICB9XG4gICAgdGhpcy5yZW1vdmVBbGxMaXN0ZW5lcnMoJ3JlbW92ZUxpc3RlbmVyJyk7XG4gICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBsaXN0ZW5lcnMgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgaWYgKGlzRnVuY3Rpb24obGlzdGVuZXJzKSkge1xuICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzKTtcbiAgfSBlbHNlIGlmIChsaXN0ZW5lcnMpIHtcbiAgICAvLyBMSUZPIG9yZGVyXG4gICAgd2hpbGUgKGxpc3RlbmVycy5sZW5ndGgpXG4gICAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGxpc3RlbmVyc1tsaXN0ZW5lcnMubGVuZ3RoIC0gMV0pO1xuICB9XG4gIGRlbGV0ZSB0aGlzLl9ldmVudHNbdHlwZV07XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKHR5cGUpIHtcbiAgdmFyIHJldDtcbiAgaWYgKCF0aGlzLl9ldmVudHMgfHwgIXRoaXMuX2V2ZW50c1t0eXBlXSlcbiAgICByZXQgPSBbXTtcbiAgZWxzZSBpZiAoaXNGdW5jdGlvbih0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIHJldCA9IFt0aGlzLl9ldmVudHNbdHlwZV1dO1xuICBlbHNlXG4gICAgcmV0ID0gdGhpcy5fZXZlbnRzW3R5cGVdLnNsaWNlKCk7XG4gIHJldHVybiByZXQ7XG59O1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVyQ291bnQgPSBmdW5jdGlvbih0eXBlKSB7XG4gIGlmICh0aGlzLl9ldmVudHMpIHtcbiAgICB2YXIgZXZsaXN0ZW5lciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICAgIGlmIChpc0Z1bmN0aW9uKGV2bGlzdGVuZXIpKVxuICAgICAgcmV0dXJuIDE7XG4gICAgZWxzZSBpZiAoZXZsaXN0ZW5lcilcbiAgICAgIHJldHVybiBldmxpc3RlbmVyLmxlbmd0aDtcbiAgfVxuICByZXR1cm4gMDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICByZXR1cm4gZW1pdHRlci5saXN0ZW5lckNvdW50KHR5cGUpO1xufTtcblxuZnVuY3Rpb24gaXNGdW5jdGlvbihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdmdW5jdGlvbic7XG59XG5cbmZ1bmN0aW9uIGlzTnVtYmVyKGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ251bWJlcic7XG59XG5cbmZ1bmN0aW9uIGlzT2JqZWN0KGFyZykge1xuICByZXR1cm4gdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgJiYgYXJnICE9PSBudWxsO1xufVxuXG5mdW5jdGlvbiBpc1VuZGVmaW5lZChhcmcpIHtcbiAgcmV0dXJuIGFyZyA9PT0gdm9pZCAwO1xufVxuIiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE1LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIGludmFyaWFudFxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIFVzZSBpbnZhcmlhbnQoKSB0byBhc3NlcnQgc3RhdGUgd2hpY2ggeW91ciBwcm9ncmFtIGFzc3VtZXMgdG8gYmUgdHJ1ZS5cbiAqXG4gKiBQcm92aWRlIHNwcmludGYtc3R5bGUgZm9ybWF0IChvbmx5ICVzIGlzIHN1cHBvcnRlZCkgYW5kIGFyZ3VtZW50c1xuICogdG8gcHJvdmlkZSBpbmZvcm1hdGlvbiBhYm91dCB3aGF0IGJyb2tlIGFuZCB3aGF0IHlvdSB3ZXJlXG4gKiBleHBlY3RpbmcuXG4gKlxuICogVGhlIGludmFyaWFudCBtZXNzYWdlIHdpbGwgYmUgc3RyaXBwZWQgaW4gcHJvZHVjdGlvbiwgYnV0IHRoZSBpbnZhcmlhbnRcbiAqIHdpbGwgcmVtYWluIHRvIGVuc3VyZSBsb2dpYyBkb2VzIG5vdCBkaWZmZXIgaW4gcHJvZHVjdGlvbi5cbiAqL1xuXG52YXIgaW52YXJpYW50ID0gZnVuY3Rpb24gKGNvbmRpdGlvbiwgZm9ybWF0LCBhLCBiLCBjLCBkLCBlLCBmKSB7XG4gIGlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nKSB7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ2ludmFyaWFudCByZXF1aXJlcyBhbiBlcnJvciBtZXNzYWdlIGFyZ3VtZW50Jyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCFjb25kaXRpb24pIHtcbiAgICB2YXIgZXJyb3I7XG4gICAgaWYgKGZvcm1hdCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcignTWluaWZpZWQgZXhjZXB0aW9uIG9jY3VycmVkOyB1c2UgdGhlIG5vbi1taW5pZmllZCBkZXYgZW52aXJvbm1lbnQgJyArICdmb3IgdGhlIGZ1bGwgZXJyb3IgbWVzc2FnZSBhbmQgYWRkaXRpb25hbCBoZWxwZnVsIHdhcm5pbmdzLicpO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgYXJncyA9IFthLCBiLCBjLCBkLCBlLCBmXTtcbiAgICAgIHZhciBhcmdJbmRleCA9IDA7XG4gICAgICBlcnJvciA9IG5ldyBFcnJvcignSW52YXJpYW50IFZpb2xhdGlvbjogJyArIGZvcm1hdC5yZXBsYWNlKC8lcy9nLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJldHVybiBhcmdzW2FyZ0luZGV4KytdO1xuICAgICAgfSkpO1xuICAgIH1cblxuICAgIGVycm9yLmZyYW1lc1RvUG9wID0gMTsgLy8gd2UgZG9uJ3QgY2FyZSBhYm91dCBpbnZhcmlhbnQncyBvd24gZnJhbWVcbiAgICB0aHJvdyBlcnJvcjtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBpbnZhcmlhbnQ7IiwiLyoqXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTQtMjAxNSwgRmFjZWJvb2ssIEluYy5cbiAqIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4gKlxuICogVGhpcyBzb3VyY2UgY29kZSBpcyBsaWNlbnNlZCB1bmRlciB0aGUgQlNELXN0eWxlIGxpY2Vuc2UgZm91bmQgaW4gdGhlXG4gKiBMSUNFTlNFIGZpbGUgaW4gdGhlIHJvb3QgZGlyZWN0b3J5IG9mIHRoaXMgc291cmNlIHRyZWUuIEFuIGFkZGl0aW9uYWwgZ3JhbnRcbiAqIG9mIHBhdGVudCByaWdodHMgY2FuIGJlIGZvdW5kIGluIHRoZSBQQVRFTlRTIGZpbGUgaW4gdGhlIHNhbWUgZGlyZWN0b3J5LlxuICovXG5cbm1vZHVsZS5leHBvcnRzLkRpc3BhdGNoZXIgPSByZXF1aXJlKCcuL2xpYi9EaXNwYXRjaGVyJyk7XG4iLCIvKipcbiAqIENvcHlyaWdodCAoYykgMjAxNC0yMDE1LCBGYWNlYm9vaywgSW5jLlxuICogQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqXG4gKiBUaGlzIHNvdXJjZSBjb2RlIGlzIGxpY2Vuc2VkIHVuZGVyIHRoZSBCU0Qtc3R5bGUgbGljZW5zZSBmb3VuZCBpbiB0aGVcbiAqIExJQ0VOU0UgZmlsZSBpbiB0aGUgcm9vdCBkaXJlY3Rvcnkgb2YgdGhpcyBzb3VyY2UgdHJlZS4gQW4gYWRkaXRpb25hbCBncmFudFxuICogb2YgcGF0ZW50IHJpZ2h0cyBjYW4gYmUgZm91bmQgaW4gdGhlIFBBVEVOVFMgZmlsZSBpbiB0aGUgc2FtZSBkaXJlY3RvcnkuXG4gKlxuICogQHByb3ZpZGVzTW9kdWxlIERpc3BhdGNoZXJcbiAqIFxuICogQHByZXZlbnRNdW5nZVxuICovXG5cbid1c2Ugc3RyaWN0JztcblxuZXhwb3J0cy5fX2VzTW9kdWxlID0gdHJ1ZTtcblxuZnVuY3Rpb24gX2NsYXNzQ2FsbENoZWNrKGluc3RhbmNlLCBDb25zdHJ1Y3RvcikgeyBpZiAoIShpbnN0YW5jZSBpbnN0YW5jZW9mIENvbnN0cnVjdG9yKSkgeyB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY2FsbCBhIGNsYXNzIGFzIGEgZnVuY3Rpb24nKTsgfSB9XG5cbnZhciBpbnZhcmlhbnQgPSByZXF1aXJlKCdmYmpzL2xpYi9pbnZhcmlhbnQnKTtcblxudmFyIF9wcmVmaXggPSAnSURfJztcblxuLyoqXG4gKiBEaXNwYXRjaGVyIGlzIHVzZWQgdG8gYnJvYWRjYXN0IHBheWxvYWRzIHRvIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLiBUaGlzIGlzXG4gKiBkaWZmZXJlbnQgZnJvbSBnZW5lcmljIHB1Yi1zdWIgc3lzdGVtcyBpbiB0d28gd2F5czpcbiAqXG4gKiAgIDEpIENhbGxiYWNrcyBhcmUgbm90IHN1YnNjcmliZWQgdG8gcGFydGljdWxhciBldmVudHMuIEV2ZXJ5IHBheWxvYWQgaXNcbiAqICAgICAgZGlzcGF0Y2hlZCB0byBldmVyeSByZWdpc3RlcmVkIGNhbGxiYWNrLlxuICogICAyKSBDYWxsYmFja3MgY2FuIGJlIGRlZmVycmVkIGluIHdob2xlIG9yIHBhcnQgdW50aWwgb3RoZXIgY2FsbGJhY2tzIGhhdmVcbiAqICAgICAgYmVlbiBleGVjdXRlZC5cbiAqXG4gKiBGb3IgZXhhbXBsZSwgY29uc2lkZXIgdGhpcyBoeXBvdGhldGljYWwgZmxpZ2h0IGRlc3RpbmF0aW9uIGZvcm0sIHdoaWNoXG4gKiBzZWxlY3RzIGEgZGVmYXVsdCBjaXR5IHdoZW4gYSBjb3VudHJ5IGlzIHNlbGVjdGVkOlxuICpcbiAqICAgdmFyIGZsaWdodERpc3BhdGNoZXIgPSBuZXcgRGlzcGF0Y2hlcigpO1xuICpcbiAqICAgLy8gS2VlcHMgdHJhY2sgb2Ygd2hpY2ggY291bnRyeSBpcyBzZWxlY3RlZFxuICogICB2YXIgQ291bnRyeVN0b3JlID0ge2NvdW50cnk6IG51bGx9O1xuICpcbiAqICAgLy8gS2VlcHMgdHJhY2sgb2Ygd2hpY2ggY2l0eSBpcyBzZWxlY3RlZFxuICogICB2YXIgQ2l0eVN0b3JlID0ge2NpdHk6IG51bGx9O1xuICpcbiAqICAgLy8gS2VlcHMgdHJhY2sgb2YgdGhlIGJhc2UgZmxpZ2h0IHByaWNlIG9mIHRoZSBzZWxlY3RlZCBjaXR5XG4gKiAgIHZhciBGbGlnaHRQcmljZVN0b3JlID0ge3ByaWNlOiBudWxsfVxuICpcbiAqIFdoZW4gYSB1c2VyIGNoYW5nZXMgdGhlIHNlbGVjdGVkIGNpdHksIHdlIGRpc3BhdGNoIHRoZSBwYXlsb2FkOlxuICpcbiAqICAgZmxpZ2h0RGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gKiAgICAgYWN0aW9uVHlwZTogJ2NpdHktdXBkYXRlJyxcbiAqICAgICBzZWxlY3RlZENpdHk6ICdwYXJpcydcbiAqICAgfSk7XG4gKlxuICogVGhpcyBwYXlsb2FkIGlzIGRpZ2VzdGVkIGJ5IGBDaXR5U3RvcmVgOlxuICpcbiAqICAgZmxpZ2h0RGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gKiAgICAgaWYgKHBheWxvYWQuYWN0aW9uVHlwZSA9PT0gJ2NpdHktdXBkYXRlJykge1xuICogICAgICAgQ2l0eVN0b3JlLmNpdHkgPSBwYXlsb2FkLnNlbGVjdGVkQ2l0eTtcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFdoZW4gdGhlIHVzZXIgc2VsZWN0cyBhIGNvdW50cnksIHdlIGRpc3BhdGNoIHRoZSBwYXlsb2FkOlxuICpcbiAqICAgZmxpZ2h0RGlzcGF0Y2hlci5kaXNwYXRjaCh7XG4gKiAgICAgYWN0aW9uVHlwZTogJ2NvdW50cnktdXBkYXRlJyxcbiAqICAgICBzZWxlY3RlZENvdW50cnk6ICdhdXN0cmFsaWEnXG4gKiAgIH0pO1xuICpcbiAqIFRoaXMgcGF5bG9hZCBpcyBkaWdlc3RlZCBieSBib3RoIHN0b3JlczpcbiAqXG4gKiAgIENvdW50cnlTdG9yZS5kaXNwYXRjaFRva2VuID0gZmxpZ2h0RGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gKiAgICAgaWYgKHBheWxvYWQuYWN0aW9uVHlwZSA9PT0gJ2NvdW50cnktdXBkYXRlJykge1xuICogICAgICAgQ291bnRyeVN0b3JlLmNvdW50cnkgPSBwYXlsb2FkLnNlbGVjdGVkQ291bnRyeTtcbiAqICAgICB9XG4gKiAgIH0pO1xuICpcbiAqIFdoZW4gdGhlIGNhbGxiYWNrIHRvIHVwZGF0ZSBgQ291bnRyeVN0b3JlYCBpcyByZWdpc3RlcmVkLCB3ZSBzYXZlIGEgcmVmZXJlbmNlXG4gKiB0byB0aGUgcmV0dXJuZWQgdG9rZW4uIFVzaW5nIHRoaXMgdG9rZW4gd2l0aCBgd2FpdEZvcigpYCwgd2UgY2FuIGd1YXJhbnRlZVxuICogdGhhdCBgQ291bnRyeVN0b3JlYCBpcyB1cGRhdGVkIGJlZm9yZSB0aGUgY2FsbGJhY2sgdGhhdCB1cGRhdGVzIGBDaXR5U3RvcmVgXG4gKiBuZWVkcyB0byBxdWVyeSBpdHMgZGF0YS5cbiAqXG4gKiAgIENpdHlTdG9yZS5kaXNwYXRjaFRva2VuID0gZmxpZ2h0RGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gKiAgICAgaWYgKHBheWxvYWQuYWN0aW9uVHlwZSA9PT0gJ2NvdW50cnktdXBkYXRlJykge1xuICogICAgICAgLy8gYENvdW50cnlTdG9yZS5jb3VudHJ5YCBtYXkgbm90IGJlIHVwZGF0ZWQuXG4gKiAgICAgICBmbGlnaHREaXNwYXRjaGVyLndhaXRGb3IoW0NvdW50cnlTdG9yZS5kaXNwYXRjaFRva2VuXSk7XG4gKiAgICAgICAvLyBgQ291bnRyeVN0b3JlLmNvdW50cnlgIGlzIG5vdyBndWFyYW50ZWVkIHRvIGJlIHVwZGF0ZWQuXG4gKlxuICogICAgICAgLy8gU2VsZWN0IHRoZSBkZWZhdWx0IGNpdHkgZm9yIHRoZSBuZXcgY291bnRyeVxuICogICAgICAgQ2l0eVN0b3JlLmNpdHkgPSBnZXREZWZhdWx0Q2l0eUZvckNvdW50cnkoQ291bnRyeVN0b3JlLmNvdW50cnkpO1xuICogICAgIH1cbiAqICAgfSk7XG4gKlxuICogVGhlIHVzYWdlIG9mIGB3YWl0Rm9yKClgIGNhbiBiZSBjaGFpbmVkLCBmb3IgZXhhbXBsZTpcbiAqXG4gKiAgIEZsaWdodFByaWNlU3RvcmUuZGlzcGF0Y2hUb2tlbiA9XG4gKiAgICAgZmxpZ2h0RGlzcGF0Y2hlci5yZWdpc3RlcihmdW5jdGlvbihwYXlsb2FkKSB7XG4gKiAgICAgICBzd2l0Y2ggKHBheWxvYWQuYWN0aW9uVHlwZSkge1xuICogICAgICAgICBjYXNlICdjb3VudHJ5LXVwZGF0ZSc6XG4gKiAgICAgICAgIGNhc2UgJ2NpdHktdXBkYXRlJzpcbiAqICAgICAgICAgICBmbGlnaHREaXNwYXRjaGVyLndhaXRGb3IoW0NpdHlTdG9yZS5kaXNwYXRjaFRva2VuXSk7XG4gKiAgICAgICAgICAgRmxpZ2h0UHJpY2VTdG9yZS5wcmljZSA9XG4gKiAgICAgICAgICAgICBnZXRGbGlnaHRQcmljZVN0b3JlKENvdW50cnlTdG9yZS5jb3VudHJ5LCBDaXR5U3RvcmUuY2l0eSk7XG4gKiAgICAgICAgICAgYnJlYWs7XG4gKiAgICAgfVxuICogICB9KTtcbiAqXG4gKiBUaGUgYGNvdW50cnktdXBkYXRlYCBwYXlsb2FkIHdpbGwgYmUgZ3VhcmFudGVlZCB0byBpbnZva2UgdGhlIHN0b3JlcydcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzIGluIG9yZGVyOiBgQ291bnRyeVN0b3JlYCwgYENpdHlTdG9yZWAsIHRoZW5cbiAqIGBGbGlnaHRQcmljZVN0b3JlYC5cbiAqL1xuXG52YXIgRGlzcGF0Y2hlciA9IChmdW5jdGlvbiAoKSB7XG4gIGZ1bmN0aW9uIERpc3BhdGNoZXIoKSB7XG4gICAgX2NsYXNzQ2FsbENoZWNrKHRoaXMsIERpc3BhdGNoZXIpO1xuXG4gICAgdGhpcy5fY2FsbGJhY2tzID0ge307XG4gICAgdGhpcy5faXNEaXNwYXRjaGluZyA9IGZhbHNlO1xuICAgIHRoaXMuX2lzSGFuZGxlZCA9IHt9O1xuICAgIHRoaXMuX2lzUGVuZGluZyA9IHt9O1xuICAgIHRoaXMuX2xhc3RJRCA9IDE7XG4gIH1cblxuICAvKipcbiAgICogUmVnaXN0ZXJzIGEgY2FsbGJhY2sgdG8gYmUgaW52b2tlZCB3aXRoIGV2ZXJ5IGRpc3BhdGNoZWQgcGF5bG9hZC4gUmV0dXJuc1xuICAgKiBhIHRva2VuIHRoYXQgY2FuIGJlIHVzZWQgd2l0aCBgd2FpdEZvcigpYC5cbiAgICovXG5cbiAgRGlzcGF0Y2hlci5wcm90b3R5cGUucmVnaXN0ZXIgPSBmdW5jdGlvbiByZWdpc3RlcihjYWxsYmFjaykge1xuICAgIHZhciBpZCA9IF9wcmVmaXggKyB0aGlzLl9sYXN0SUQrKztcbiAgICB0aGlzLl9jYWxsYmFja3NbaWRdID0gY2FsbGJhY2s7XG4gICAgcmV0dXJuIGlkO1xuICB9O1xuXG4gIC8qKlxuICAgKiBSZW1vdmVzIGEgY2FsbGJhY2sgYmFzZWQgb24gaXRzIHRva2VuLlxuICAgKi9cblxuICBEaXNwYXRjaGVyLnByb3RvdHlwZS51bnJlZ2lzdGVyID0gZnVuY3Rpb24gdW5yZWdpc3RlcihpZCkge1xuICAgICF0aGlzLl9jYWxsYmFja3NbaWRdID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ0Rpc3BhdGNoZXIudW5yZWdpc3RlciguLi4pOiBgJXNgIGRvZXMgbm90IG1hcCB0byBhIHJlZ2lzdGVyZWQgY2FsbGJhY2suJywgaWQpIDogaW52YXJpYW50KGZhbHNlKSA6IHVuZGVmaW5lZDtcbiAgICBkZWxldGUgdGhpcy5fY2FsbGJhY2tzW2lkXTtcbiAgfTtcblxuICAvKipcbiAgICogV2FpdHMgZm9yIHRoZSBjYWxsYmFja3Mgc3BlY2lmaWVkIHRvIGJlIGludm9rZWQgYmVmb3JlIGNvbnRpbnVpbmcgZXhlY3V0aW9uXG4gICAqIG9mIHRoZSBjdXJyZW50IGNhbGxiYWNrLiBUaGlzIG1ldGhvZCBzaG91bGQgb25seSBiZSB1c2VkIGJ5IGEgY2FsbGJhY2sgaW5cbiAgICogcmVzcG9uc2UgdG8gYSBkaXNwYXRjaGVkIHBheWxvYWQuXG4gICAqL1xuXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLndhaXRGb3IgPSBmdW5jdGlvbiB3YWl0Rm9yKGlkcykge1xuICAgICF0aGlzLl9pc0Rpc3BhdGNoaW5nID8gcHJvY2Vzcy5lbnYuTk9ERV9FTlYgIT09ICdwcm9kdWN0aW9uJyA/IGludmFyaWFudChmYWxzZSwgJ0Rpc3BhdGNoZXIud2FpdEZvciguLi4pOiBNdXN0IGJlIGludm9rZWQgd2hpbGUgZGlzcGF0Y2hpbmcuJykgOiBpbnZhcmlhbnQoZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCBpZHMubGVuZ3RoOyBpaSsrKSB7XG4gICAgICB2YXIgaWQgPSBpZHNbaWldO1xuICAgICAgaWYgKHRoaXMuX2lzUGVuZGluZ1tpZF0pIHtcbiAgICAgICAgIXRoaXMuX2lzSGFuZGxlZFtpZF0gPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnRGlzcGF0Y2hlci53YWl0Rm9yKC4uLik6IENpcmN1bGFyIGRlcGVuZGVuY3kgZGV0ZWN0ZWQgd2hpbGUgJyArICd3YWl0aW5nIGZvciBgJXNgLicsIGlkKSA6IGludmFyaWFudChmYWxzZSkgOiB1bmRlZmluZWQ7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgIXRoaXMuX2NhbGxiYWNrc1tpZF0gPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnRGlzcGF0Y2hlci53YWl0Rm9yKC4uLik6IGAlc2AgZG9lcyBub3QgbWFwIHRvIGEgcmVnaXN0ZXJlZCBjYWxsYmFjay4nLCBpZCkgOiBpbnZhcmlhbnQoZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgICAgdGhpcy5faW52b2tlQ2FsbGJhY2soaWQpO1xuICAgIH1cbiAgfTtcblxuICAvKipcbiAgICogRGlzcGF0Y2hlcyBhIHBheWxvYWQgdG8gYWxsIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxuICAgKi9cblxuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5kaXNwYXRjaCA9IGZ1bmN0aW9uIGRpc3BhdGNoKHBheWxvYWQpIHtcbiAgICAhIXRoaXMuX2lzRGlzcGF0Y2hpbmcgPyBwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gJ3Byb2R1Y3Rpb24nID8gaW52YXJpYW50KGZhbHNlLCAnRGlzcGF0Y2guZGlzcGF0Y2goLi4uKTogQ2Fubm90IGRpc3BhdGNoIGluIHRoZSBtaWRkbGUgb2YgYSBkaXNwYXRjaC4nKSA6IGludmFyaWFudChmYWxzZSkgOiB1bmRlZmluZWQ7XG4gICAgdGhpcy5fc3RhcnREaXNwYXRjaGluZyhwYXlsb2FkKTtcbiAgICB0cnkge1xuICAgICAgZm9yICh2YXIgaWQgaW4gdGhpcy5fY2FsbGJhY2tzKSB7XG4gICAgICAgIGlmICh0aGlzLl9pc1BlbmRpbmdbaWRdKSB7XG4gICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW52b2tlQ2FsbGJhY2soaWQpO1xuICAgICAgfVxuICAgIH0gZmluYWxseSB7XG4gICAgICB0aGlzLl9zdG9wRGlzcGF0Y2hpbmcoKTtcbiAgICB9XG4gIH07XG5cbiAgLyoqXG4gICAqIElzIHRoaXMgRGlzcGF0Y2hlciBjdXJyZW50bHkgZGlzcGF0Y2hpbmcuXG4gICAqL1xuXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLmlzRGlzcGF0Y2hpbmcgPSBmdW5jdGlvbiBpc0Rpc3BhdGNoaW5nKCkge1xuICAgIHJldHVybiB0aGlzLl9pc0Rpc3BhdGNoaW5nO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDYWxsIHRoZSBjYWxsYmFjayBzdG9yZWQgd2l0aCB0aGUgZ2l2ZW4gaWQuIEFsc28gZG8gc29tZSBpbnRlcm5hbFxuICAgKiBib29ra2VlcGluZy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLl9pbnZva2VDYWxsYmFjayA9IGZ1bmN0aW9uIF9pbnZva2VDYWxsYmFjayhpZCkge1xuICAgIHRoaXMuX2lzUGVuZGluZ1tpZF0gPSB0cnVlO1xuICAgIHRoaXMuX2NhbGxiYWNrc1tpZF0odGhpcy5fcGVuZGluZ1BheWxvYWQpO1xuICAgIHRoaXMuX2lzSGFuZGxlZFtpZF0gPSB0cnVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBTZXQgdXAgYm9va2tlZXBpbmcgbmVlZGVkIHdoZW4gZGlzcGF0Y2hpbmcuXG4gICAqXG4gICAqIEBpbnRlcm5hbFxuICAgKi9cblxuICBEaXNwYXRjaGVyLnByb3RvdHlwZS5fc3RhcnREaXNwYXRjaGluZyA9IGZ1bmN0aW9uIF9zdGFydERpc3BhdGNoaW5nKHBheWxvYWQpIHtcbiAgICBmb3IgKHZhciBpZCBpbiB0aGlzLl9jYWxsYmFja3MpIHtcbiAgICAgIHRoaXMuX2lzUGVuZGluZ1tpZF0gPSBmYWxzZTtcbiAgICAgIHRoaXMuX2lzSGFuZGxlZFtpZF0gPSBmYWxzZTtcbiAgICB9XG4gICAgdGhpcy5fcGVuZGluZ1BheWxvYWQgPSBwYXlsb2FkO1xuICAgIHRoaXMuX2lzRGlzcGF0Y2hpbmcgPSB0cnVlO1xuICB9O1xuXG4gIC8qKlxuICAgKiBDbGVhciBib29ra2VlcGluZyB1c2VkIGZvciBkaXNwYXRjaGluZy5cbiAgICpcbiAgICogQGludGVybmFsXG4gICAqL1xuXG4gIERpc3BhdGNoZXIucHJvdG90eXBlLl9zdG9wRGlzcGF0Y2hpbmcgPSBmdW5jdGlvbiBfc3RvcERpc3BhdGNoaW5nKCkge1xuICAgIGRlbGV0ZSB0aGlzLl9wZW5kaW5nUGF5bG9hZDtcbiAgICB0aGlzLl9pc0Rpc3BhdGNoaW5nID0gZmFsc2U7XG4gIH07XG5cbiAgcmV0dXJuIERpc3BhdGNoZXI7XG59KSgpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IERpc3BhdGNoZXI7IiwiLyoqXG4gKiBDb3B5cmlnaHQgMjAxMy0yMDE0IEZhY2Vib29rLCBJbmMuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICovXG5cblwidXNlIHN0cmljdFwiO1xuXG4vKipcbiAqIENvbnN0cnVjdHMgYW4gZW51bWVyYXRpb24gd2l0aCBrZXlzIGVxdWFsIHRvIHRoZWlyIHZhbHVlLlxuICpcbiAqIEZvciBleGFtcGxlOlxuICpcbiAqICAgdmFyIENPTE9SUyA9IGtleU1pcnJvcih7Ymx1ZTogbnVsbCwgcmVkOiBudWxsfSk7XG4gKiAgIHZhciBteUNvbG9yID0gQ09MT1JTLmJsdWU7XG4gKiAgIHZhciBpc0NvbG9yVmFsaWQgPSAhIUNPTE9SU1tteUNvbG9yXTtcbiAqXG4gKiBUaGUgbGFzdCBsaW5lIGNvdWxkIG5vdCBiZSBwZXJmb3JtZWQgaWYgdGhlIHZhbHVlcyBvZiB0aGUgZ2VuZXJhdGVkIGVudW0gd2VyZVxuICogbm90IGVxdWFsIHRvIHRoZWlyIGtleXMuXG4gKlxuICogICBJbnB1dDogIHtrZXkxOiB2YWwxLCBrZXkyOiB2YWwyfVxuICogICBPdXRwdXQ6IHtrZXkxOiBrZXkxLCBrZXkyOiBrZXkyfVxuICpcbiAqIEBwYXJhbSB7b2JqZWN0fSBvYmpcbiAqIEByZXR1cm4ge29iamVjdH1cbiAqL1xudmFyIGtleU1pcnJvciA9IGZ1bmN0aW9uKG9iaikge1xuICB2YXIgcmV0ID0ge307XG4gIHZhciBrZXk7XG4gIGlmICghKG9iaiBpbnN0YW5jZW9mIE9iamVjdCAmJiAhQXJyYXkuaXNBcnJheShvYmopKSkge1xuICAgIHRocm93IG5ldyBFcnJvcigna2V5TWlycm9yKC4uLik6IEFyZ3VtZW50IG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICB9XG4gIGZvciAoa2V5IGluIG9iaikge1xuICAgIGlmICghb2JqLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICByZXRba2V5XSA9IGtleTtcbiAgfVxuICByZXR1cm4gcmV0O1xufTtcblxubW9kdWxlLmV4cG9ydHMgPSBrZXlNaXJyb3I7XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcblxudmFyIHByb2Nlc3MgPSBtb2R1bGUuZXhwb3J0cyA9IHt9O1xudmFyIHF1ZXVlID0gW107XG52YXIgZHJhaW5pbmcgPSBmYWxzZTtcbnZhciBjdXJyZW50UXVldWU7XG52YXIgcXVldWVJbmRleCA9IC0xO1xuXG5mdW5jdGlvbiBjbGVhblVwTmV4dFRpY2soKSB7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBpZiAoY3VycmVudFF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBxdWV1ZSA9IGN1cnJlbnRRdWV1ZS5jb25jYXQocXVldWUpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICB9XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCkge1xuICAgICAgICBkcmFpblF1ZXVlKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBkcmFpblF1ZXVlKCkge1xuICAgIGlmIChkcmFpbmluZykge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciB0aW1lb3V0ID0gc2V0VGltZW91dChjbGVhblVwTmV4dFRpY2spO1xuICAgIGRyYWluaW5nID0gdHJ1ZTtcblxuICAgIHZhciBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgd2hpbGUobGVuKSB7XG4gICAgICAgIGN1cnJlbnRRdWV1ZSA9IHF1ZXVlO1xuICAgICAgICBxdWV1ZSA9IFtdO1xuICAgICAgICB3aGlsZSAoKytxdWV1ZUluZGV4IDwgbGVuKSB7XG4gICAgICAgICAgICBpZiAoY3VycmVudFF1ZXVlKSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFF1ZXVlW3F1ZXVlSW5kZXhdLnJ1bigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHF1ZXVlSW5kZXggPSAtMTtcbiAgICAgICAgbGVuID0gcXVldWUubGVuZ3RoO1xuICAgIH1cbiAgICBjdXJyZW50UXVldWUgPSBudWxsO1xuICAgIGRyYWluaW5nID0gZmFsc2U7XG4gICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xufVxuXG5wcm9jZXNzLm5leHRUaWNrID0gZnVuY3Rpb24gKGZ1bikge1xuICAgIHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKTtcbiAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA+IDEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHF1ZXVlLnB1c2gobmV3IEl0ZW0oZnVuLCBhcmdzKSk7XG4gICAgaWYgKHF1ZXVlLmxlbmd0aCA9PT0gMSAmJiAhZHJhaW5pbmcpIHtcbiAgICAgICAgc2V0VGltZW91dChkcmFpblF1ZXVlLCAwKTtcbiAgICB9XG59O1xuXG4vLyB2OCBsaWtlcyBwcmVkaWN0aWJsZSBvYmplY3RzXG5mdW5jdGlvbiBJdGVtKGZ1biwgYXJyYXkpIHtcbiAgICB0aGlzLmZ1biA9IGZ1bjtcbiAgICB0aGlzLmFycmF5ID0gYXJyYXk7XG59XG5JdGVtLnByb3RvdHlwZS5ydW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgdGhpcy5mdW4uYXBwbHkobnVsbCwgdGhpcy5hcnJheSk7XG59O1xucHJvY2Vzcy50aXRsZSA9ICdicm93c2VyJztcbnByb2Nlc3MuYnJvd3NlciA9IHRydWU7XG5wcm9jZXNzLmVudiA9IHt9O1xucHJvY2Vzcy5hcmd2ID0gW107XG5wcm9jZXNzLnZlcnNpb24gPSAnJzsgLy8gZW1wdHkgc3RyaW5nIHRvIGF2b2lkIHJlZ2V4cCBpc3N1ZXNcbnByb2Nlc3MudmVyc2lvbnMgPSB7fTtcblxuZnVuY3Rpb24gbm9vcCgpIHt9XG5cbnByb2Nlc3Mub24gPSBub29wO1xucHJvY2Vzcy5hZGRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLm9uY2UgPSBub29wO1xucHJvY2Vzcy5vZmYgPSBub29wO1xucHJvY2Vzcy5yZW1vdmVMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUFsbExpc3RlbmVycyA9IG5vb3A7XG5wcm9jZXNzLmVtaXQgPSBub29wO1xuXG5wcm9jZXNzLmJpbmRpbmcgPSBmdW5jdGlvbiAobmFtZSkge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5iaW5kaW5nIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5cbnByb2Nlc3MuY3dkID0gZnVuY3Rpb24gKCkgeyByZXR1cm4gJy8nIH07XG5wcm9jZXNzLmNoZGlyID0gZnVuY3Rpb24gKGRpcikge1xuICAgIHRocm93IG5ldyBFcnJvcigncHJvY2Vzcy5jaGRpciBpcyBub3Qgc3VwcG9ydGVkJyk7XG59O1xucHJvY2Vzcy51bWFzayA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gMDsgfTtcbiIsImltcG9ydCBBcHBEaXNwYXRjaGVyIGZyb20gJy4uL2Rpc3BhdGNoZXIvQXBwRGlzcGF0Y2hlci5qcyc7XG5pbXBvcnQgQWRtaW5Db25zdGFudHMgZnJvbSAnLi4vY29uc3RhbnRzL0FkbWluQ29uc3RhbnRzLmpzJztcbmltcG9ydCBBZG1pbldlYkFQSVV0aWxzIGZyb20gJy4uL3V0aWxzL0FkbWluV2ViQVBJVXRpbHMuanMnO1xuaW1wb3J0IEFkbWluRmlsZUFQSVV0aWxzIGZyb20gJy4uL3V0aWxzL0FkbWluRmlsZUFQSVV0aWxzLmpzJztcblxudmFyIEFkbWluQWN0aW9ucyA9IHtcblxuICAvKipcbiAgICogR2V0IGRhdGEgZnJvbSB2aWEgaHR0cCBHRVQgcmVxdWVzdC4gVGhpcyBhY3Rpb24gc2ltcGx5XG4gICAqICAgIGV4ZWN1dGVzIHRoZSByZXF1ZXN0LiBUaGUgcmVzcG9uc2UgaXMgdGhlbiBkZWxlZ2F0ZWQgXG4gICAqICAgIHZpYSB0aGUgYHJlY2VpdmVgIGFjdGlvbi5cbiAgICogQHBhcmFtICB7b2JqZWN0fSB1cmwgQSBVUkwgdG8gbWFrZSB0aGUgR0VUIHJlcXVlc3Qgd2l0aC5cbiAgICogQHBhcmFtICB7b2JqZWN0fSBjb21wb25lbnQgQSBSZWFjdCBjb21wb25lbnQgY2xhc3MgbmFtZS5cbiAgICovXG4gIGdldCh1cmwsIGNvbXBvbmVudCkge1xuICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgJ2FjdGlvblR5cGUnIDogQWRtaW5Db25zdGFudHMuQWN0aW9ucy5HRVQsXG4gICAgICAnY29tcG9uZW50JyA6IGNvbXBvbmVudFxuICAgIH0pO1xuXG4gICAgQWRtaW5XZWJBUElVdGlscy5nZXQodXJsLCBjb21wb25lbnQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBTYXZlIGRhdGEgZnJvbSBhIHN1Ym1pdHRlZCBmb3JtLCB2aWEgaHR0cCBQT1NULCBQVVQsIG9yIERFTEVURVxuICAgKiAgICByZXF1ZXN0LiBUaGlzIGFjdGlvbiBzaW1wbHkgZXhlY3V0ZXMgdGhlIHJlcXVlc3QuIFRoZSByZXNwb25zZVxuICAgKiAgICBpcyB0aGVuIGRlbGVnYXRlZCB2aWEgdGhlIGByZWNlaXZlYCBhY3Rpb24uXG4gICAqIEBwYXJhbSAge29iamVjdH0gZXZlbnQgQW4gZXZlbnQgb2JqZWN0LiBUaGlzIHNob3VsZCBiZSBhIGNoYW5nZVxuICAgKiAgICBldmVudCBmcm9tIGEgZmlsZSBpbnB1dC5cbiAgICogQHBhcmFtICB7b2JqZWN0fSBjb21wb25lbnQgQSBSZWFjdCBjb21wb25lbnQgY2xhc3MgbmFtZS5cbiAgICovXG4gIHNhdmUoZXZlbnQsIGNvbXBvbmVudCkge1xuICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgJ2FjdGlvblR5cGUnIDogQWRtaW5Db25zdGFudHMuQWN0aW9ucy5TQVZFLFxuICAgICAgJ2NvbXBvbmVudCcgOiBjb21wb25lbnRcbiAgICB9KTtcblxuICAgIEFkbWluV2ViQVBJVXRpbHMuc2F2ZShldmVudCwgY29tcG9uZW50KTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGltYWdlIGZpbGUgZnJvbSBhbiBpbnB1dCBvbiBjaGFuZ2UgaW52b2tlZCBieSBpbnB1dC4gVGhpcyBhY3Rpb25cbiAgICogc2ltcGx5IGV4ZWN1dGVzIHRoZSBmaWxlIEFQSSBtZXRob2QgdG8gZ2V0IHRoZSBmaWxlLiBUaGUgZGF0YSB0aGF0XG4gICAqIGlzIHJldHJpZXZlZCBpcyBkZWxlZ2F0ZWQgdmlhIHRoZSBgcmVjZWl2ZWAgbWV0aG9kLlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IGV2ZW50IEFuIGV2ZW50IG9iamVjdC4gVGhpcyBzaG91bGQgYmUgYSBjaGFuZ2VcbiAgICogICAgZXZlbnQgZnJvbSBhIGZpbGUgaW5wdXQuXG4gICAqIEBwYXJhbSAge29iamVjdH0gY29tcG9uZW50IEEgUmVhY3QgY29tcG9uZW50IGNsYXNzIG5hbWUuXG4gICAqL1xuICBnZXRJbWFnZUZpbGUoZXZlbnQsIGNvbXBvbmVudCkge1xuICAgIEFwcERpc3BhdGNoZXIuZGlzcGF0Y2goe1xuICAgICAgJ2FjdGlvblR5cGUnIDogQWRtaW5Db25zdGFudHMuQWN0aW9ucy5HRVRfSU1BR0VfRklMRSxcbiAgICAgICdjb21wb25lbnQnIDogY29tcG9uZW50XG4gICAgfSk7XG4gICAgXG4gICAgQWRtaW5GaWxlQVBJVXRpbHMuZ2V0SW1hZ2VGaWxlKGV2ZW50LCBjb21wb25lbnQpO1xuICB9LFxuXG4gIC8qKlxuICAgKiBSZWNlaXZlIGEgcGF5bG9hZCwgYW5hbHl6ZSwgYW5kIGRlbGVnYXRlIHRvIHN0b3Jlcy5cbiAgICogQHBhcmFtICB7b2JqZWN0fSBwYXlsb2FkIEFuIG9iamVjdCBjb250YWluaW5nIG1lc3NhZ2UsIGh0dHAsIGFuZC9vclxuICAgKiAgICBjb21wb25lbnQgZGF0YS4gVGhpcyBkYXRhIGlzIGRlbGVnYXRlZCB0byBzdG9yZXMuXG4gICAqL1xuICByZWNlaXZlKHBheWxvYWQpIHtcbiAgICBBcHBEaXNwYXRjaGVyLmRpc3BhdGNoKHtcbiAgICAgICdhY3Rpb25UeXBlJyA6IEFkbWluQ29uc3RhbnRzLkFjdGlvbnMuUkVDRUlWRSxcbiAgICAgICdwYXlsb2FkJyA6IHBheWxvYWRcbiAgICB9KTtcbiAgfVxuXG59O1xuXG5leHBvcnQgZGVmYXVsdCBBZG1pbkFjdGlvbnM7XG4iLCJpbXBvcnQgQWRtaW5CaW9Qcm92aWRlciBmcm9tICcuL2NvbXBvbmVudHMvYmlvL0FkbWluQmlvUHJvdmlkZXIucmVhY3QuanMnO1xuXG4oZnVuY3Rpb24od2luZG93LCBkb2N1bWVudCwgdW5kZWZpbmVkKXtcblxuICBsZXQgY29tcG9uZW50cyA9IHtcbiAgICAnQWRtaW5CaW9Qcm92aWRlcicgOiBBZG1pbkJpb1Byb3ZpZGVyXG4gIH07XG5cbiAgZnVuY3Rpb24gcmVuZGVyUmVhY3RDb21wb25lbnQoY29tcG9uZW50TmFtZSl7XG4gICAgbGV0ICRlbCA9ICQoJy4nICsgY29tcG9uZW50TmFtZSk7XG4gICAgbGV0IFJlYWN0Q29tcG9uZW50ID0gY29tcG9uZW50c1tjb21wb25lbnROYW1lXTtcbiAgICBpZigkZWwubGVuZ3RoKSB7XG4gICAgICBSZWFjdERPTS5yZW5kZXIoXG4gICAgICAgIDxSZWFjdENvbXBvbmVudCAvPixcbiAgICAgICAgJGVsWzBdXG4gICAgICApO1xuICAgIH07XG4gIH07XG5cbiAgaWYodHlwZW9mIFpldHZldCAhPT0gJ3VuZGVmaW5lZCcgJiYgWmV0dmV0LmxvYWRPYmplY3QgJiYgWmV0dmV0LmxvYWRPYmplY3QuY29tcG9uZW50cyl7XG4gICAgZm9yKGxldCBpID0gMDsgWmV0dmV0LmxvYWRPYmplY3QuY29tcG9uZW50cy5sZW5ndGggPiBpOyBpKyspe1xuICAgICAgcmVuZGVyUmVhY3RDb21wb25lbnQoWmV0dmV0LmxvYWRPYmplY3QuY29tcG9uZW50c1tpXSk7XG4gICAgfVxuICB9XG5cbn0pKHdpbmRvdywgZG9jdW1lbnQpOyIsImltcG9ydCBBZG1pbkFjdGlvbnMgZnJvbSAnLi4vYWN0aW9ucy9BZG1pbkFjdGlvbnMuanMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBFbGVtZW50RWRpdGFibGUgZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMuZW1pdENoYW5nZSA9IHRoaXMuZW1pdENoYW5nZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgc2hvdWxkQ29tcG9uZW50VXBkYXRlKG5leHRQcm9wcykge1xuICAgIHJldHVybiBuZXh0UHJvcHMuaHRtbCAhPT0gUmVhY3RET00uZmluZERPTU5vZGUodGhpcykuaW5uZXJIVE1MO1xuICB9XG5cbiAgY29tcG9uZW50RGlkVXBkYXRlKCkge1xuICAgIGlmKHRoaXMucHJvcHMuaHRtbCAhPT0gUmVhY3RET00uZmluZERPTU5vZGUodGhpcykuaW5uZXJIVE1MKSBSZWFjdERPTS5maW5kRE9NTm9kZSh0aGlzKS5pbm5lckhUTUwgPSB0aGlzLnByb3BzLmh0bWw7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IGVsID0gPGRpdiBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfSBvbklucHV0PXt0aGlzLmVtaXRDaGFuZ2V9IG9uQmx1cj17dGhpcy5lbWl0Q2hhbmdlfSBjb250ZW50RWRpdGFibGUgc3BlbGxDaGVjaz0nZmFsc2UnIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7X19odG1sOiB0aGlzLnByb3BzLmh0bWx9fSAvPlxuICAgIFxuICAgIGlmKHRoaXMucHJvcHMudHlwZSA9PT0gJ2gxJykgZWwgPSA8aDEgY2xhc3NOYW1lPXt0aGlzLnByb3BzLmNsYXNzTmFtZX0gb25JbnB1dD17dGhpcy5lbWl0Q2hhbmdlfSBvbkJsdXI9e3RoaXMuZW1pdENoYW5nZX0gY29udGVudEVkaXRhYmxlIHNwZWxsQ2hlY2s9J2ZhbHNlJyBkYW5nZXJvdXNseVNldElubmVySFRNTD17e19faHRtbDogdGhpcy5wcm9wcy5odG1sfX0gLz5cbiAgICBpZih0aGlzLnByb3BzLnR5cGUgPT09ICdwJykgZWwgPSA8cCBjbGFzc05hbWU9e3RoaXMucHJvcHMuY2xhc3NOYW1lfSBvbklucHV0PXt0aGlzLmVtaXRDaGFuZ2V9IG9uQmx1cj17dGhpcy5lbWl0Q2hhbmdlfSBjb250ZW50RWRpdGFibGUgc3BlbGxDaGVjaz0nZmFsc2UnIGRhbmdlcm91c2x5U2V0SW5uZXJIVE1MPXt7X19odG1sOiB0aGlzLnByb3BzLmh0bWx9fSAvPlxuICAgIGlmKHRoaXMucHJvcHMudHlwZSA9PT0gJ3NwYW4nKSBlbCA9IDxzcGFuIGNsYXNzTmFtZT17dGhpcy5wcm9wcy5jbGFzc05hbWV9IG9uSW5wdXQ9e3RoaXMuZW1pdENoYW5nZX0gb25CbHVyPXt0aGlzLmVtaXRDaGFuZ2V9IGNvbnRlbnRFZGl0YWJsZSBzcGVsbENoZWNrPSdmYWxzZScgZGFuZ2Vyb3VzbHlTZXRJbm5lckhUTUw9e3tfX2h0bWw6IHRoaXMucHJvcHMuaHRtbH19IC8+XG4gICAgXG4gICAgcmV0dXJuIGVsO1xuICB9XG5cbiAgZW1pdENoYW5nZSgpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGh0bWwgPSBSZWFjdERPTS5maW5kRE9NTm9kZShzZWxmKS5pbm5lckhUTUw7XG5cbiAgICBpZihodG1sICE9PSBzZWxmLmxhc3RIdG1sKSB7XG4gICAgICBBZG1pbkFjdGlvbnMucmVjZWl2ZSh7XG4gICAgICAgICdjb21wb25lbnQnIDogc2VsZi5wcm9wcy5jb21wb25lbnQsXG4gICAgICAgICdkYXRhJyA6IHtcbiAgICAgICAgICBbc2VsZi5wcm9wcy5pbnB1dF0gOiBodG1sXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICBcbiAgICBzZWxmLmxhc3RIdG1sID0gaHRtbDtcbiAgfVxuXG59IiwiaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5cbmltcG9ydCBBZG1pbkNvbnN0YW50cyBmcm9tICcuLi8uLi9jb25zdGFudHMvQWRtaW5Db25zdGFudHMuanMnO1xuaW1wb3J0IEFkbWluQWN0aW9ucyBmcm9tICcuLi8uLi9hY3Rpb25zL0FkbWluQWN0aW9ucy5qcyc7XG5pbXBvcnQgRWxlbWVudEVkaXRhYmxlIGZyb20gJy4uL0VsZW1lbnRFZGl0YWJsZS5yZWFjdC5qcyc7XG5pbXBvcnQgQWRtaW5CaW9Db21wb25lbnQgZnJvbSAnLi9BZG1pbkJpb0NvbXBvbmVudC5yZWFjdC5qcyc7XG5cbmNsYXNzIEFkbWluQmlvUGljRWRpdEZvcm0gZXh0ZW5kcyBSZWFjdC5Db21wb25lbnQge1xuXG4gIHJlbmRlcigpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGZvcm1NZXRob2QgPSAoc2VsZi5wcm9wcy5pZClcbiAgICAgID8gJ3B1dCdcbiAgICAgIDogJ3Bvc3QnO1xuICAgIGxldCBmb3JtQWN0aW9uID0gKCFzZWxmLnByb3BzLmlkKVxuICAgICAgPyBBZG1pbkNvbnN0YW50cy5VcmxzLlBJQ19QT1NUXG4gICAgICA6IEFkbWluQ29uc3RhbnRzLlVybHMuUElDX1BPU1QgKyAnLycgKyBzZWxmLnByb3BzLmlkO1xuICAgIGxldCBkZWxldGVGb3JtRWxlbWVudCA9ICghc2VsZi5wcm9wcy5iaW9JbWFnZSlcbiAgICAgID8gJydcbiAgICAgIDogKFxuICAgICAgICA8Zm9ybSBhY3Rpb249e2Zvcm1BY3Rpb259IG1ldGhvZD0ncG9zdCcgZGF0YS1tZXRob2Q9J3B1dCcgZW5jVHlwZT0nbXVsdGlwYXJ0L2Zvcm0tZGF0YScgb25TdWJtaXQ9e3NlbGYucHJvcHMub25Gb3JtU3VibWl0fT5cbiAgICAgICAgICA8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSd1cGxvYWQnIHZhbHVlPSd1bmRlZmluZWQnIC8+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2J0biBidG4tLWRlbGV0ZSc+e0FkbWluQ29uc3RhbnRzLkNvcHkuVEVYVF9ERUxFVEV9PC9idXR0b24+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgICk7XG5cbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9J2NvbnRhaW5lci0tZm9ybSc+XG4gICAgICAgIDxmb3JtIGFjdGlvbj17Zm9ybUFjdGlvbn0gbWV0aG9kPSdwb3N0JyBkYXRhLW1ldGhvZD17Zm9ybU1ldGhvZH0gZW5jVHlwZT0nbXVsdGlwYXJ0L2Zvcm0tZGF0YScgb25TdWJtaXQ9e3NlbGYucHJvcHMub25Gb3JtU3VibWl0fT5cbiAgICAgICAgICA8YSBocmVmPScjJyBvbkNsaWNrPXtzZWxmLnByb3BzLm9uQ2hhbmdlSW1hZ2VDbGlja30gY2xhc3NOYW1lPSdidG4gYnRuLS1uby1ib3JkZXInPntzZWxmLnByb3BzLmVkaXRCdXR0b25UZXh0fTwvYT5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT0nZm9ybV9fZmlsZS1jb250YWluZXInPlxuICAgICAgICAgICAgPGxhYmVsIGh0bWxGb3I9J3VwbG9hZC1waWMnIGNsYXNzTmFtZT0nYnRuIGJ0bi0tbGFiZWwnPntBZG1pbkNvbnN0YW50cy5Db3B5LlRFWFRfU0VMRUNUX0ZJTEV9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSdmaWxlJyBuYW1lPSd1cGxvYWQnIGlkPSd1cGxvYWQtcGljJyBvbkNoYW5nZT17c2VsZi5wcm9wcy5vbkZpbGVDaGFuZ2V9IC8+XG4gICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2J0biBidG4tLXNhdmUnPntBZG1pbkNvbnN0YW50cy5Db3B5LlRFWFRfU0FWRX08L2J1dHRvbj5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgICB7ZGVsZXRlRm9ybUVsZW1lbnR9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbn1cblxuY2xhc3MgQWRtaW5CaW9DYXJkIGV4dGVuZHMgQWRtaW5CaW9Db21wb25lbnQge1xuXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMubmFtZSA9IEFkbWluQ29uc3RhbnRzLkNvbXBvbmVudHMuQURNSU5fQklPX0NBUkQ7XG4gIH1cblxuICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICdpc0VkaXRpbmcnIDogZmFsc2VcbiAgICB9XG5cbiAgICBpZighWmV0dmV0LmxvYWRPYmplY3QudXNlci5uYW1lKSB7XG4gICAgICBaZXR2ZXQubG9hZE9iamVjdC51c2VyLm5hbWUgPSBaZXR2ZXQubG9hZE9iamVjdC51c2VyLnVzZXJuYW1lO1xuICAgIH1cblxuICAgIEFkbWluQWN0aW9ucy5yZWNlaXZlKHtcbiAgICAgICdjb21wb25lbnQnIDogdGhpcy5uYW1lLFxuICAgICAgJ2RhdGEnIDogWmV0dmV0LmxvYWRPYmplY3QudXNlclxuICAgIH0pO1xuICB9XG5cbiAgcmVuZGVyKCkge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgY29tcG9uZW50ID0gdGhpcy5uYW1lO1xuICAgIGxldCBzdG9yZSA9IHNlbGYucHJvcHMuc3RvcmUuZGF0YVtjb21wb25lbnRdO1xuICAgIGxldCBpbWFnZSA9ICghc3RvcmUucGljIHx8ICFzdG9yZS5waWMudGh1bWIpXG4gICAgICA/IGZhbHNlXG4gICAgICA6IHN0b3JlLnBpYy50aHVtYjtcbiAgICBsZXQgc2VjdGlvbkNsYXNzID0gJ3NlY3Rpb24tbW9kdWxlJztcbiAgICBsZXQgY2xhc3NPYmplY3QgPSB7XG4gICAgICBbc2VjdGlvbkNsYXNzXSA6IHRydWUsXG4gICAgICBbc2VjdGlvbkNsYXNzICsgJy0tYmlvLWNhcmQnXSA6IHRydWUsXG4gICAgICBbc2VjdGlvbkNsYXNzICsgJy0tZWRpdGluZyddIDogc2VsZi5zdGF0ZS5pc0VkaXRpbmcsXG4gICAgICBbc2VjdGlvbkNsYXNzICsgJy0tdW5zYXZlZCddIDogISFzdG9yZS5pc1Vuc2F2ZWQsXG4gICAgICBbc2VjdGlvbkNsYXNzICsgJy0tcGljLWVtcHR5J10gOiAhaW1hZ2VcbiAgICB9O1xuICAgIGxldCBjbGFzc2VzID0gY2xhc3NOYW1lcyhjbGFzc09iamVjdCk7XG4gICAgbGV0IHN0eWxlID0ge1xuICAgICAgJ2JhY2tncm91bmRJbWFnZScgOiAhaW1hZ2VcbiAgICAgICAgPyBudWxsXG4gICAgICAgIDogJ3VybCgnICsgaW1hZ2UgKyAnKSdcbiAgICB9O1xuICAgIGxldCBiaW9JbWFnZSA9ICghaW1hZ2UpXG4gICAgICA/ICg8ZmlnY2FwdGlvbj57c3RvcmUuaW5pdGlhbH08L2ZpZ2NhcHRpb24+KVxuICAgICAgOiA8aW1nIHNyYz17aW1hZ2V9IC8+O1xuICAgIGxldCBiaW9JbWFnZUVkaXRCdXR0b25UZXh0UHJlZml4ID0gKHNlbGYuc3RhdGUuaXNFZGl0aW5nKVxuICAgICAgPyAnLSAnXG4gICAgICA6ICcrICc7XG4gICAgbGV0IGJpb0ltYWdlRWRpdEJ1dHRvblRleHQgPSAoIWltYWdlKVxuICAgICAgPyBiaW9JbWFnZUVkaXRCdXR0b25UZXh0UHJlZml4ICsgQWRtaW5Db25zdGFudHMuQ29weS5URVhUX0lNQUdFX0FERFxuICAgICAgOiBiaW9JbWFnZUVkaXRCdXR0b25UZXh0UHJlZml4ICsgQWRtaW5Db25zdGFudHMuQ29weS5URVhUX0lNQUdFX0NIQU5HRTtcbiAgICAgIFxuICAgIHJldHVybiAoXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e2NsYXNzZXN9PlxuICAgICAgICA8ZmlndXJlIHN0eWxlPXtzdHlsZX0+XG4gICAgICAgICAgPEFkbWluQmlvUGljRWRpdEZvcm0gYmlvSW1hZ2U9e2ltYWdlfSBpZD17c3RvcmUuX2lkfSBvbkNoYW5nZUltYWdlQ2xpY2s9e3NlbGYub25DaGFuZ2VJbWFnZUNsaWNrfSBvbkZvcm1TdWJtaXQ9e3NlbGYub25Gb3JtU3VibWl0fSBvbkZpbGVDaGFuZ2U9e3NlbGYub25GaWxlQ2hhbmdlfSBlZGl0QnV0dG9uVGV4dD17YmlvSW1hZ2VFZGl0QnV0dG9uVGV4dH0gLz5cbiAgICAgICAgICB7YmlvSW1hZ2V9XG4gICAgICAgIDwvZmlndXJlPlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxmb3JtIGFjdGlvbj17QWRtaW5Db25zdGFudHMuVXJscy5QUk9GSUxFX1BPU1QgKyAnLycgKyBzdG9yZS5faWR9IG1ldGhvZD0ncG9zdCcgZGF0YS1tZXRob2Q9J3B1dCcgZW5jVHlwZT0nbXVsdGlwYXJ0L2Zvcm0tZGF0YScgb25TdWJtaXQ9e3NlbGYub25Gb3JtU3VibWl0fT5cbiAgICAgICAgICAgIDxFbGVtZW50RWRpdGFibGUgaW5wdXQ9J25hbWUnIGh0bWw9e3N0b3JlLm5hbWV9IHR5cGU9J2gxJyBjb21wb25lbnQ9e2NvbXBvbmVudH0gLz5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J25hbWUnIHZhbHVlPXtzdG9yZS5uYW1lfSAvPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSdzbWFsbCc+XG4gICAgICAgICAgICAgIDxFbGVtZW50RWRpdGFibGUgaW5wdXQ9J3Bob25lJyBjbGFzc05hbWU9J3NtYWxsX19zcGFuIHNtYWxsX19zcGFuLS1waG9uZScgaHRtbD17c3RvcmUucGhvbmV9IHR5cGU9J3NwYW4nIGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdwaG9uZScgdmFsdWU9e3N0b3JlLnBob25lfSAvPlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPSdzbWFsbCc+XG4gICAgICAgICAgICAgIDxFbGVtZW50RWRpdGFibGUgY2xhc3NOYW1lPSdzbWFsbF9fc3BhbiBzbWFsbF9fc3Bhbi0tYWRyZXNzJyBpbnB1dD0nYWRkcmVzcycgaHRtbD17c3RvcmUuYWRkcmVzc30gdHlwZT0nc3BhbicgY29tcG9uZW50PXtjb21wb25lbnR9IC8+XG4gICAgICAgICAgICAgIDxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2FkZHJlc3MnIHZhbHVlPXtzdG9yZS5hZGRyZXNzfSAvPlxuICAgICAgICAgICAgICA8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSd6aXBjb2RlJyAvPlxuICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2J0biBidG4tLXNhdmUnPntBZG1pbkNvbnN0YW50cy5Db3B5LlRFWFRfU0FWRX08L2J1dHRvbj5cbiAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9zZWN0aW9uPlxuICAgICk7XG4gIH1cblxufVxuIFxuZXhwb3J0IGRlZmF1bHQgQWRtaW5CaW9DYXJkO1xuIiwiaW1wb3J0IEFkbWluQWN0aW9ucyBmcm9tICcuLi8uLi9hY3Rpb25zL0FkbWluQWN0aW9ucy5qcyc7XG5cbmNsYXNzIEFkbWluQmlvQ29tcG9uZW50IGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcblxuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcblxuICAgIHRoaXMub25GaWxlQ2hhbmdlID0gdGhpcy5vbkZpbGVDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLm9uRm9ybVN1Ym1pdCA9IHRoaXMub25Gb3JtU3VibWl0LmJpbmQodGhpcyk7XG4gICAgdGhpcy5vbkNoYW5nZUltYWdlQ2xpY2sgPSB0aGlzLm9uQ2hhbmdlSW1hZ2VDbGljay5iaW5kKHRoaXMpO1xuICAgIGlmKHRoaXMub25DaGFuZ2UpIHRoaXMub25DaGFuZ2UgPSB0aGlzLm9uQ2hhbmdlLmJpbmQodGhpcyk7XG4gIH1cblxuICBvbkZpbGVDaGFuZ2UoZSkge1xuICAgIEFkbWluQWN0aW9ucy5nZXRJbWFnZUZpbGUoZSwgdGhpcy5uYW1lKTtcbiAgfVxuXG4gIG9uRm9ybVN1Ym1pdChlKSB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIHRoaXMuc2V0U3RhdGUoeyAnaXNVbnNhdmVkJyA6IGZhbHNlIH0pO1xuICAgIEFkbWluQWN0aW9ucy5zYXZlKGUsIHRoaXMubmFtZSk7XG4gIH1cblxuICBvbkNoYW5nZUltYWdlQ2xpY2soZSkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICBsZXQgaXNFZGl0aW5nID0gIXRoaXMuc3RhdGUuaXNFZGl0aW5nO1xuXG4gICAgdGhpcy5zZXRTdGF0ZSh7XG4gICAgICAnaXNFZGl0aW5nJyA6IGlzRWRpdGluZ1xuICAgIH0pO1xuICB9XG5cbn1cbiBcbmV4cG9ydCBkZWZhdWx0IEFkbWluQmlvQ29tcG9uZW50O1xuIiwiaW1wb3J0IGNsYXNzTmFtZXMgZnJvbSAnY2xhc3NuYW1lcyc7XG5cbmltcG9ydCBBZG1pbkNvbnN0YW50cyBmcm9tICcuLi8uLi9jb25zdGFudHMvQWRtaW5Db25zdGFudHMuanMnO1xuaW1wb3J0IEFkbWluQWN0aW9ucyBmcm9tICcuLi8uLi9hY3Rpb25zL0FkbWluQWN0aW9ucy5qcyc7XG5pbXBvcnQgRWxlbWVudEVkaXRhYmxlIGZyb20gJy4uL0VsZW1lbnRFZGl0YWJsZS5yZWFjdC5qcyc7XG5pbXBvcnQgQWRtaW5CaW9Db21wb25lbnQgZnJvbSAnLi9BZG1pbkJpb0NvbXBvbmVudC5yZWFjdC5qcyc7XG5cbmNsYXNzIEFkbWluQmlvQ292ZXJFZGl0Rm9ybSBleHRlbmRzIFJlYWN0LkNvbXBvbmVudCB7XG5cbiAgcmVuZGVyKCkge1xuICAgIGxldCBzZWxmID0gdGhpcztcbiAgICBsZXQgZm9ybU1ldGhvZCA9IChzZWxmLnByb3BzLmlkKVxuICAgICAgPyAncHV0J1xuICAgICAgOiAncG9zdCc7XG4gICAgbGV0IGZvcm1BY3Rpb24gPSAoIXNlbGYucHJvcHMuaWQpXG4gICAgICA/IEFkbWluQ29uc3RhbnRzLlVybHMuSU1BR0VfUE9TVFxuICAgICAgOiBBZG1pbkNvbnN0YW50cy5VcmxzLklNQUdFX1BPU1QgKyAnLycgKyBzZWxmLnByb3BzLmlkO1xuICAgIGxldCBkZWxldGVGb3JtRWxlbWVudCA9ICghc2VsZi5wcm9wcy5pZClcbiAgICAgID8gJydcbiAgICAgIDogKFxuICAgICAgICA8Zm9ybSBhY3Rpb249e2Zvcm1BY3Rpb259IG1ldGhvZD0ncG9zdCcgZGF0YS1tZXRob2Q9J2RlbGV0ZScgZW5jVHlwZT0nbXVsdGlwYXJ0L2Zvcm0tZGF0YScgb25TdWJtaXQ9e3NlbGYucHJvcHMub25Gb3JtU3VibWl0fT5cbiAgICAgICAgICA8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdfaWQnIHZhbHVlPXtzZWxmLnByb3BzLmlkfSAvPlxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdidG4gYnRuLS1kZWxldGUnPntBZG1pbkNvbnN0YW50cy5Db3B5LlRFWFRfREVMRVRFfTwvYnV0dG9uPlxuICAgICAgICA8L2Zvcm0+XG4gICAgICApO1xuXG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPSdjb250YWluZXItLWZvcm0nPlxuICAgICAgICA8Zm9ybSBhY3Rpb249e2Zvcm1BY3Rpb259IG1ldGhvZD0ncG9zdCcgZGF0YS1tZXRob2Q9e2Zvcm1NZXRob2R9IGVuY1R5cGU9J211bHRpcGFydC9mb3JtLWRhdGEnIG9uU3VibWl0PXtzZWxmLnByb3BzLm9uRm9ybVN1Ym1pdH0+XG4gICAgICAgICAgPGEgaHJlZj0nIycgb25DbGljaz17c2VsZi5wcm9wcy5vbkNoYW5nZUltYWdlQ2xpY2t9IGNsYXNzTmFtZT0nYnRuIGJ0bi0tbm8tYm9yZGVyJz57c2VsZi5wcm9wcy5lZGl0QnV0dG9uVGV4dH08L2E+XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9J2Zvcm1fX2ZpbGUtY29udGFpbmVyJz5cbiAgICAgICAgICAgIDxsYWJlbCBodG1sRm9yPSd1cGxvYWQnIGNsYXNzTmFtZT0nYnRuIGJ0bi0tbGFiZWwnPntBZG1pbkNvbnN0YW50cy5Db3B5LlRFWFRfU0VMRUNUX0ZJTEV9PC9sYWJlbD5cbiAgICAgICAgICAgIDxpbnB1dCB0eXBlPSdmaWxlJyBuYW1lPSd1cGxvYWQnIGlkPSd1cGxvYWQnIG9uQ2hhbmdlPXtzZWxmLnByb3BzLm9uRmlsZUNoYW5nZX0gLz5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSd0eXBlJyB2YWx1ZT0nY292ZXInIC8+XG4gICAgICAgICAgPGJ1dHRvbiBjbGFzc05hbWU9J2J0biBidG4tLXNhdmUnPntBZG1pbkNvbnN0YW50cy5Db3B5LlRFWFRfU0FWRX08L2J1dHRvbj5cbiAgICAgICAgPC9mb3JtPlxuICAgICAgICB7ZGVsZXRlRm9ybUVsZW1lbnR9XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbn1cbiBcbmNsYXNzIEFkbWluQmlvQ292ZXIgZXh0ZW5kcyBBZG1pbkJpb0NvbXBvbmVudCB7XG5cbiAgY29uc3RydWN0b3IocHJvcHMpIHtcbiAgICBzdXBlcihwcm9wcyk7XG4gICAgdGhpcy5uYW1lID0gQWRtaW5Db25zdGFudHMuQ29tcG9uZW50cy5BRE1JTl9CSU9fQ09WRVI7XG4gIH1cblxuICBjb21wb25lbnRXaWxsTW91bnQoKSB7XG4gICAgdGhpcy5zdGF0ZSA9IHtcbiAgICAgICdpc0VkaXRpbmcnIDogZmFsc2VcbiAgICB9XG5cbiAgICBBZG1pbkFjdGlvbnMucmVjZWl2ZSh7XG4gICAgICAnY29tcG9uZW50JyA6IHRoaXMubmFtZSxcbiAgICAgICdkYXRhJyA6IFpldHZldC5sb2FkT2JqZWN0LnVzZXIuY292ZXIgfHwge31cbiAgICB9KTtcbiAgfVxuXG4gIHJlbmRlcigpIHtcbiAgICBsZXQgc2VsZiA9IHRoaXM7XG4gICAgbGV0IGNvbXBvbmVudCA9IHRoaXMubmFtZTtcbiAgICBsZXQgc3RvcmUgPSBzZWxmLnByb3BzLnN0b3JlLmRhdGFbY29tcG9uZW50XTtcbiAgICBsZXQgaW1hZ2UgPSAoIXN0b3JlIHx8ICFzdG9yZS5waWMgfHwgIXN0b3JlLnBpYy5mdWxsKVxuICAgICAgPyBmYWxzZVxuICAgICAgOiBzdG9yZS5waWMuZnVsbDtcbiAgICBsZXQgaW1hZ2VJZCA9ICghc3RvcmUgfHwgIXN0b3JlLl9pZCB8fCAhaW1hZ2UpXG4gICAgICA/IGZhbHNlXG4gICAgICA6IHN0b3JlLl9pZDtcbiAgICBsZXQgc2VjdGlvbkNsYXNzID0gJ3NlY3Rpb24tbW9kdWxlJztcbiAgICBsZXQgY2xhc3NPYmplY3QgPSB7XG4gICAgICBbc2VjdGlvbkNsYXNzXSA6IHRydWUsXG4gICAgICBbc2VjdGlvbkNsYXNzICsgJy0tY292ZXInXSA6IHRydWUsXG4gICAgICBbc2VjdGlvbkNsYXNzICsgJy0tZWRpdGluZyddIDogc2VsZi5zdGF0ZS5pc0VkaXRpbmcsXG4gICAgICBbc2VjdGlvbkNsYXNzICsgJy0tdW5zYXZlZCddIDogISFzdG9yZS5pc1Vuc2F2ZWQsXG4gICAgICBbc2VjdGlvbkNsYXNzICsgJy0tZW1wdHknXSA6ICFpbWFnZVxuICAgIH07XG4gICAgbGV0IGNsYXNzZXMgPSBjbGFzc05hbWVzKGNsYXNzT2JqZWN0KTtcbiAgICBsZXQgc3R5bGUgPSB7XG4gICAgICAnYmFja2dyb3VuZEltYWdlJyA6ICFpbWFnZVxuICAgICAgICA/IG51bGxcbiAgICAgICAgOiAndXJsKCcgKyBpbWFnZSArICcpJ1xuICAgIH07XG4gICAgbGV0IGNvdmVySW1hZ2UgPSAoIWltYWdlKVxuICAgICAgPyAnJ1xuICAgICAgOiA8aW1nIHNyYz17aW1hZ2V9IC8+O1xuICAgIGxldCBjb3ZlckVkaXRCdXR0b25UZXh0UHJlZml4ID0gKHNlbGYuc3RhdGUuaXNFZGl0aW5nKVxuICAgICAgPyAnLSAnXG4gICAgICA6ICcrICc7XG4gICAgbGV0IGNvdmVyRWRpdEJ1dHRvblRleHQgPSAoIWltYWdlKVxuICAgICAgPyBjb3ZlckVkaXRCdXR0b25UZXh0UHJlZml4ICsgQWRtaW5Db25zdGFudHMuQ29weS5URVhUX0lNQUdFX0FERFxuICAgICAgOiBjb3ZlckVkaXRCdXR0b25UZXh0UHJlZml4ICsgQWRtaW5Db25zdGFudHMuQ29weS5URVhUX0lNQUdFX0NIQU5HRTtcblxuICAgIHJldHVybiAoXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9e2NsYXNzZXN9PlxuICAgICAgICA8ZmlndXJlIHN0eWxlPXtzdHlsZX0+XG4gICAgICAgICAgPEFkbWluQmlvQ292ZXJFZGl0Rm9ybSBpZD17aW1hZ2VJZH0gb25DaGFuZ2VJbWFnZUNsaWNrPXtzZWxmLm9uQ2hhbmdlSW1hZ2VDbGlja30gb25Gb3JtU3VibWl0PXtzZWxmLm9uRm9ybVN1Ym1pdH0gb25GaWxlQ2hhbmdlPXtzZWxmLm9uRmlsZUNoYW5nZX0gZWRpdEJ1dHRvblRleHQ9e2NvdmVyRWRpdEJ1dHRvblRleHR9IC8+XG4gICAgICAgICAge2NvdmVySW1hZ2V9XG4gICAgICAgIDwvZmlndXJlPlxuICAgICAgPC9zZWN0aW9uPlxuICAgICk7XG4gIH1cblxufVxuIFxuZXhwb3J0IGRlZmF1bHQgQWRtaW5CaW9Db3ZlcjtcbiIsImltcG9ydCBjbGFzc05hbWVzIGZyb20gJ2NsYXNzbmFtZXMnO1xuXG5pbXBvcnQgQWRtaW5Db25zdGFudHMgZnJvbSAnLi4vLi4vY29uc3RhbnRzL0FkbWluQ29uc3RhbnRzLmpzJztcbmltcG9ydCBBZG1pbkFjdGlvbnMgZnJvbSAnLi4vLi4vYWN0aW9ucy9BZG1pbkFjdGlvbnMuanMnO1xuaW1wb3J0IEVsZW1lbnRFZGl0YWJsZSBmcm9tICcuLi9FbGVtZW50RWRpdGFibGUucmVhY3QuanMnO1xuaW1wb3J0IEFkbWluQmlvQ29tcG9uZW50IGZyb20gJy4vQWRtaW5CaW9Db21wb25lbnQucmVhY3QuanMnO1xuXG5jbGFzcyBBZG1pbkJpb0Rlc2NyaXB0aW9uIGV4dGVuZHMgQWRtaW5CaW9Db21wb25lbnQge1xuXG4gIGNvbnN0cnVjdG9yKHByb3BzKSB7XG4gICAgc3VwZXIocHJvcHMpO1xuICAgIHRoaXMubmFtZSA9IEFkbWluQ29uc3RhbnRzLkNvbXBvbmVudHMuQURNSU5fQklPX0RFU0NSSVBUSU9OO1xuICB9XG5cbiAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAnaXNFZGl0aW5nJyA6IGZhbHNlXG4gICAgfVxuXG4gICAgQWRtaW5BY3Rpb25zLnJlY2VpdmUoe1xuICAgICAgJ2NvbXBvbmVudCcgOiB0aGlzLm5hbWUsXG4gICAgICAnZGF0YScgOiB7XG4gICAgICAgICdfaWQnIDogWmV0dmV0LmxvYWRPYmplY3QudXNlci5faWQsXG4gICAgICAgICdkZXNjcmlwdGlvbicgOiBaZXR2ZXQubG9hZE9iamVjdC51c2VyLmRlc2NyaXB0aW9uXG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBjb21wb25lbnQgPSB0aGlzLm5hbWU7XG4gICAgbGV0IHN0b3JlID0gc2VsZi5wcm9wcy5zdG9yZS5kYXRhW2NvbXBvbmVudF07XG4gICAgbGV0IHNlY3Rpb25DbGFzcyA9ICdzZWN0aW9uLW1vZHVsZSc7XG4gICAgbGV0IGNsYXNzT2JqZWN0ID0ge1xuICAgICAgW3NlY3Rpb25DbGFzc10gOiB0cnVlLFxuICAgICAgW3NlY3Rpb25DbGFzcyArICctLWJpby1kZXNjcmlwdGlvbiddIDogdHJ1ZSxcbiAgICAgIFtzZWN0aW9uQ2xhc3MgKyAnLS1lbXB0eSddIDogKCFaZXR2ZXQubG9hZE9iamVjdC51c2VyLmRlc2NyaXB0aW9uIHx8IFpldHZldC5sb2FkT2JqZWN0LnVzZXIuZGVzY3JpcHRpb24gPT09ICcnKSxcbiAgICAgIFtzZWN0aW9uQ2xhc3MgKyAnLS1lZGl0aW5nJ10gOiBzZWxmLnN0YXRlLmlzRWRpdGluZyxcbiAgICAgIFtzZWN0aW9uQ2xhc3MgKyAnLS11bnNhdmVkJ10gOiBzZWxmLnN0YXRlLmlzVW5zYXZlZFxuICAgIH07XG4gICAgbGV0IGNsYXNzZXMgPSBjbGFzc05hbWVzKGNsYXNzT2JqZWN0KTtcbiAgICBcbiAgICByZXR1cm4gKFxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAgPEVsZW1lbnRFZGl0YWJsZSBjbGFzc05hbWU9J3BhcmFncmFwaHMnIGlucHV0PSdkZXNjcmlwdGlvbicgaHRtbD17c3RvcmUuZGVzY3JpcHRpb259IGNvbXBvbmVudD17Y29tcG9uZW50fSAvPlxuICAgICAgICA8Zm9ybSBhY3Rpb249e0FkbWluQ29uc3RhbnRzLlVybHMuUFJPRklMRV9QT1NUICsgJy8nICsgWmV0dmV0LmxvYWRPYmplY3QudXNlci5faWR9IG1ldGhvZD0ncG9zdCcgZGF0YS1tZXRob2Q9J3B1dCcgZW5jVHlwZT0nbXVsdGlwYXJ0L2Zvcm0tZGF0YScgb25TdWJtaXQ9e3NlbGYub25Gb3JtU3VibWl0fT5cbiAgICAgICAgICA8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdkZXNjcmlwdGlvbicgdmFsdWU9e3N0b3JlLmRlc2NyaXB0aW9ufSAvPlxuICAgICAgICAgIDxidXR0b24gY2xhc3NOYW1lPSdidG4gYnRuLS1zYXZlJz57QWRtaW5Db25zdGFudHMuQ29weS5URVhUX1NBVkV9PC9idXR0b24+XG4gICAgICAgIDwvZm9ybT5cbiAgICAgIDwvc2VjdGlvbj5cbiAgICApO1xuICB9XG5cbn1cbiBcbmV4cG9ydCBkZWZhdWx0IEFkbWluQmlvRGVzY3JpcHRpb247XG4iLCJpbXBvcnQgY2xhc3NOYW1lcyBmcm9tICdjbGFzc25hbWVzJztcblxuaW1wb3J0IEFkbWluU3RvcmUgZnJvbSAnLi4vLi4vc3RvcmVzL0FkbWluU3RvcmUuanMnO1xuaW1wb3J0IEFkbWluQmlvQ292ZXIgZnJvbSAnLi9BZG1pbkJpb0NvdmVyLnJlYWN0LmpzJztcbmltcG9ydCBBZG1pbkJpb0NhcmQgZnJvbSAnLi9BZG1pbkJpb0NhcmQucmVhY3QuanMnO1xuaW1wb3J0IEFkbWluQmlvRGVzY3JpcHRpb24gZnJvbSAnLi9BZG1pbkJpb0Rlc2NyaXB0aW9uLnJlYWN0LmpzJztcblxuZnVuY3Rpb24gZ2V0U3RhdGVGcm9tU3RvcmVzKCl7XG4gIHJldHVybiBBZG1pblN0b3JlLmdldEFsbCgpO1xufVxuXG5jbGFzcyBBZG1pbkJpb1Byb3ZpZGVyIGV4dGVuZHMgUmVhY3QuQ29tcG9uZW50IHtcblxuICBjb25zdHJ1Y3Rvcihwcm9wcykge1xuICAgIHN1cGVyKHByb3BzKTtcbiAgICB0aGlzLm9uQ2hhbmdlID0gdGhpcy5vbkNoYW5nZS5iaW5kKHRoaXMpO1xuICB9XG5cbiAgY29tcG9uZW50V2lsbE1vdW50KCkge1xuICAgIHRoaXMuc2V0U3RhdGUoeyBcbiAgICAgICdzdG9yZScgOiBnZXRTdGF0ZUZyb21TdG9yZXMoKSBcbiAgICB9KTtcblxuICAgIHRoaXMuc3RhdGUgPSB7XG4gICAgICAnaXNFZGl0aW5nJyA6IGZhbHNlXG4gICAgfVxuICB9XG5cbiAgY29tcG9uZW50RGlkTW91bnQoKSB7XG4gICAgQWRtaW5TdG9yZS5hZGRDaGFuZ2VMaXN0ZW5lcih0aGlzLm9uQ2hhbmdlKTtcbiAgfVxuXG4gIGNvbXBvbmVudFdpbGxVbm1vdW50KCkge1xuICAgIEFkbWluU3RvcmUucmVtb3ZlQ2hhbmdlTGlzdGVuZXIodGhpcy5vbkNoYW5nZSk7XG4gIH1cblxuICByZW5kZXIoKSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCBtYWluQ2xhc3MgPSAnbWFpbic7XG4gICAgbGV0IHdpdGhNZXNzYWdlID0gKHNlbGYuc3RhdGUuc3RvcmUubWVzc2FnZSAmJiBzZWxmLnN0YXRlLnN0b3JlLm1lc3NhZ2UudHlwZSAmJiBzZWxmLnN0YXRlLnN0b3JlLm1lc3NhZ2UuYm9keSk7XG4gICAgbGV0IGNsYXNzT2JqZWN0ID0ge1xuICAgICAgW21haW5DbGFzc10gOiB0cnVlLFxuICAgICAgW21haW5DbGFzcyArICctLXBhZ2UnXSA6IHRydWUsXG4gICAgICBbbWFpbkNsYXNzICsgJy0tbG9hZGluZyddIDogc2VsZi5zdGF0ZS5zdG9yZS5pc0xvYWRpbmcsXG4gICAgICBbbWFpbkNsYXNzICsgJy0tbWVzc2FnZS1hY3RpdmUnXSA6IHdpdGhNZXNzYWdlXG4gICAgfTtcbiAgICBsZXQgY2xhc3NlcyA9IGNsYXNzTmFtZXMoY2xhc3NPYmplY3QpO1xuICAgIGxldCBtZXNzYWdlID0gKCF3aXRoTWVzc2FnZSlcbiAgICAgID8gJydcbiAgICAgIDogKDxkaXYgY2xhc3NOYW1lPXsnbWVzc2FnZSBtZXNzYWdlLS0nICsgc2VsZi5zdGF0ZS5zdG9yZS5tZXNzYWdlLnR5cGV9PntzZWxmLnN0YXRlLnN0b3JlLm1lc3NhZ2UuYm9keX08L2Rpdj4pO1xuICAgIGxldCBsb2FkaW5nRWxlbWVudCA9ICcnO1xuXG4gICAgaWYoc2VsZi5zdGF0ZS5zdG9yZS5pc0xvYWRpbmcpe1xuICAgICAgbG9hZGluZ0VsZW1lbnQgPSA8ZGl2IGNsYXNzTmFtZT0ncGFnZV9fb3ZlcmxheSc+PC9kaXY+O1xuICAgICAgJCgnYm9keScpLmFkZENsYXNzKCdwYWdlLS1ibHVyJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgICQoJ2JvZHknKS5yZW1vdmVDbGFzcygncGFnZS0tYmx1cicpO1xuICAgIH1cbiAgICBcbiAgICByZXR1cm4gKFxuICAgICAgPG1haW4gY2xhc3NOYW1lPXtjbGFzc2VzfT5cbiAgICAgICAge2xvYWRpbmdFbGVtZW50fVxuICAgICAgICB7bWVzc2FnZX1cbiAgICAgICAgPEFkbWluQmlvQ292ZXIgc3RvcmU9e3NlbGYuc3RhdGUuc3RvcmV9IC8+XG4gICAgICAgIDxBZG1pbkJpb0NhcmQgc3RvcmU9e3NlbGYuc3RhdGUuc3RvcmV9IC8+XG4gICAgICAgIDxBZG1pbkJpb0Rlc2NyaXB0aW9uIHN0b3JlPXtzZWxmLnN0YXRlLnN0b3JlfSAvPlxuICAgICAgPC9tYWluPlxuICAgICk7XG4gIH1cblxuICBvbkNoYW5nZSgpIHtcbiAgICB0aGlzLnNldFN0YXRlKHsgXG4gICAgICAnc3RvcmUnIDogZ2V0U3RhdGVGcm9tU3RvcmVzKCkgXG4gICAgfSk7XG4gIH1cblxufVxuIFxuZXhwb3J0IGRlZmF1bHQgQWRtaW5CaW9Qcm92aWRlcjtcbiIsImltcG9ydCBrZXlNaXJyb3IgZnJvbSAna2V5bWlycm9yJztcblxudmFyIEFkbWluQ29uc3RhbnRzID0ge1xuICAnQ29weScgOiB7XG4gICAgJ1RFWFRfSU1BR0VfQUREJyA6ICdhZGQgaW1hZ2UnLFxuICAgICdURVhUX0lNQUdFX0NIQU5HRScgOiAnY2hhbmdlIGltYWdlJyxcbiAgICAnVEVYVF9ERUxFVEUnIDogJ2RlbGV0ZScsXG4gICAgJ1RFWFRfU0FWRScgOiAnc2F2ZScsXG4gICAgJ1RFWFRfU0VMRUNUX0ZJTEUnIDogJ3NlbGVjdCBmaWxlJ1xuICB9LFxuICAnVXJscycgOiB7XG4gICAgJ0lNQUdFX0dFVCcgOiAnL2FwaS9pbWFnZScsXG4gICAgJ0lNQUdFX1BPU1QnIDogJy9wcml2YXRlL2FwaS9pbWFnZScsXG4gICAgJ1BST0ZJTEVfUE9TVCcgOiAnL3ByaXZhdGUvYXBpL3Byb2ZpbGUnLFxuICAgICdQSUNfUE9TVCcgOiAnL3ByaXZhdGUvYXBpL3BpYydcbiAgfVxufVxuXG5BZG1pbkNvbnN0YW50cy5BY3Rpb25zID0ga2V5TWlycm9yKHtcbiAgR0VUIDogbnVsbCxcbiAgR0VUX0lNQUdFX0ZJTEUgOiBudWxsLFxuICBHRVRfSFRUUF9FUlJPUl9NRVNTQUdFIDogbnVsbCxcblx0U0FWRSA6IG51bGwsXG4gIFJFQ0VJVkUgOiBudWxsXG59KTtcblxuQWRtaW5Db25zdGFudHMuQ29tcG9uZW50cyA9IGtleU1pcnJvcih7XG4gIEFETUlOX0JJT19DQVJEIDogbnVsbCxcbiAgQURNSU5fQklPX0NPVkVSIDogbnVsbCxcbiAgQURNSU5fQklPX0RFU0NSSVBUSU9OIDogbnVsbFxufSk7XG5cbmV4cG9ydCBkZWZhdWx0IEFkbWluQ29uc3RhbnRzOyIsImxldCBEaXNwYXRjaGVyID0gcmVxdWlyZSgnZmx1eCcpLkRpc3BhdGNoZXI7XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBEaXNwYXRjaGVyKCk7IiwiaW1wb3J0IEV2ZW50RW1pdHRlciBmcm9tICdldmVudHMnO1xuaW1wb3J0IEFwcERpc3BhdGNoZXIgZnJvbSAnLi4vZGlzcGF0Y2hlci9BcHBEaXNwYXRjaGVyLmpzJztcbmltcG9ydCBBZG1pbkNvbnN0YW50cyBmcm9tICcuLi9jb25zdGFudHMvQWRtaW5Db25zdGFudHMuanMnO1xuXG5jb25zdCBDSEFOR0VfRVZFTlQgPSAnY2hhbmdlJztcblxudmFyIGFkbWluRGF0YSA9IHt9O1xudmFyIG1lc3NhZ2UgPSB7fTtcbnZhciBpc0xvYWRpbmcgPSBmYWxzZTtcblxuLyoqXG4gKiBSZWNlaXZlIGEgcGF5bG9hZCwgYW5hbHl6ZSwgYW5kIGRlbGVnYXRlIHRvIHN0b3Jlcy5cbiAqIEBwYXJhbSAge29iamVjdH0gcGF5bG9hZCBBbiBvYmplY3QgY29udGFpbmluZyBtZXNzYWdlLCBodHRwLCBhbmQvb3JcbiAqICAgIGNvbXBvbmVudCBkYXRhLiBUaGlzIGRhdGEgaXMgZGVsZWdhdGVkIHRvIHN0b3Jlcy5cbiAqL1xuZnVuY3Rpb24gcmVjZWl2ZShwYXlsb2FkKSB7XG4gIGlmKHBheWxvYWQuZGF0YSkge1xuICAgIGlmKGFkbWluRGF0YVtwYXlsb2FkLmNvbXBvbmVudF0pIHtcbiAgICAgIGFkbWluRGF0YVtwYXlsb2FkLmNvbXBvbmVudF0gPSBPYmplY3QuYXNzaWduKGFkbWluRGF0YVtwYXlsb2FkLmNvbXBvbmVudF0sIHBheWxvYWQuZGF0YSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGxldCBjb21wb25lbnREYXRhID0ge1xuICAgICAgICBbcGF5bG9hZC5jb21wb25lbnRdIDogcGF5bG9hZC5kYXRhXG4gICAgICB9O1xuICAgICAgXG4gICAgICBhZG1pbkRhdGEgPSBPYmplY3QuYXNzaWduKGFkbWluRGF0YSwgY29tcG9uZW50RGF0YSk7XG4gICAgfVxuICB9IGVsc2UgaWYocGF5bG9hZC5ib2R5KSB7XG4gICAgbWVzc2FnZSA9IHBheWxvYWQ7XG4gIH1cbn1cblxudmFyIEFkbWluU3RvcmUgPSBPYmplY3QuYXNzaWduKHt9LCBFdmVudEVtaXR0ZXIucHJvdG90eXBlLCB7XG5cbiAgZW1pdENoYW5nZSgpIHtcbiAgICB0aGlzLmVtaXQoQ0hBTkdFX0VWRU5UKTtcbiAgfSxcblxuICAvKipcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIGFkZENoYW5nZUxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5vbihDSEFOR0VfRVZFTlQsIGNhbGxiYWNrKTtcbiAgfSxcblxuICAvKipcbiAgICogQHBhcmFtIHtmdW5jdGlvbn0gY2FsbGJhY2tcbiAgICovXG4gIHJlbW92ZUNoYW5nZUxpc3RlbmVyKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcihDSEFOR0VfRVZFTlQsIGNhbGxiYWNrKTtcbiAgfSxcblxuICAvKipcbiAgICogR2V0IGFsbCBhZG1pbiBkYXRhLlxuICAgKi9cbiAgZ2V0QWxsKCkge1xuICAgIHJldHVybiB7XG4gICAgICAnaXNMb2FkaW5nJyA6IGlzTG9hZGluZyxcbiAgICAgICdtZXNzYWdlJyA6IG1lc3NhZ2UsXG4gICAgICAnZGF0YScgOiBhZG1pbkRhdGFcbiAgICB9O1xuICB9XG5cbn0pO1xuXG5BcHBEaXNwYXRjaGVyLnJlZ2lzdGVyKChhY3Rpb24pID0+IHtcblxuICBzd2l0Y2goYWN0aW9uLmFjdGlvblR5cGUpIHtcblxuICAgIGNhc2UgQWRtaW5Db25zdGFudHMuQWN0aW9ucy5TQVZFOlxuICAgICAgaXNMb2FkaW5nID0gdHJ1ZTtcbiAgICAgIEFkbWluU3RvcmUuZW1pdENoYW5nZSgpO1xuICAgICAgYnJlYWs7XG5cbiAgICBjYXNlIEFkbWluQ29uc3RhbnRzLkFjdGlvbnMuUkVDRUlWRTpcbiAgICAgIHJlY2VpdmUoYWN0aW9uLnBheWxvYWQpO1xuICAgICAgaXNMb2FkaW5nID0gZmFsc2U7XG4gICAgICBBZG1pblN0b3JlLmVtaXRDaGFuZ2UoKTtcbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIC8vIG5vIG9wXG5cbiAgfVxuXG59KTtcblxuZXhwb3J0IGRlZmF1bHQgQWRtaW5TdG9yZTsiLCJpbXBvcnQgQWRtaW5BY3Rpb25zIGZyb20gJy4uL2FjdGlvbnMvQWRtaW5BY3Rpb25zLmpzJztcblxuZXhwb3J0IGRlZmF1bHQge1xuXG4gIC8qKlxuICAgKiBHZXQgaW1hZ2UgZmlsZSBmcm9tIGFuIGlucHV0IG9uIGNoYW5nZSBpbnZva2VkIGJ5IGlucHV0LiBUaGlzIGFjdGlvblxuICAgKiBzaW1wbHkgZXhlY3V0ZXMgdGhlIGZpbGUgQVBJIG1ldGhvZCB0byBnZXQgdGhlIGZpbGUuIFRoZSBkYXRhIHRoYXRcbiAgICogaXMgcmV0cmlldmVkIGlzIGRlbGVnYXRlZCB2aWEgdGhlIGByZWNlaXZlYCBtZXRob2QuXG4gICAqIEBwYXJhbSAge29iamVjdH0gZXZlbnQgQW4gZXZlbnQgb2JqZWN0LiBUaGlzIHNob3VsZCBiZSBhIGNoYW5nZVxuICAgKiAgICBldmVudCBmcm9tIGEgZmlsZSBpbnB1dC5cbiAgICogQHBhcmFtICB7b2JqZWN0fSBjb21wb25lbnQgQSBSZWFjdCBjb21wb25lbnQgY2xhc3MgbmFtZS5cbiAgICovXG4gIGdldEltYWdlRmlsZShldmVudCwgY29tcG9uZW50KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGxldCB0YXJnZXQgPSBldmVudC5jdXJyZW50VGFyZ2V0O1xuICAgIGxldCAkdGFyZ2V0ID0gJChldmVudC5jdXJyZW50VGFyZ2V0KTtcblxuICAgIGlmKHRhcmdldC5maWxlcyAmJiB0YXJnZXQuZmlsZXNbMF0pIHtcbiAgICAgIGlmKHRhcmdldC5maWxlc1swXS50eXBlLmluZGV4T2YoJ2ltYWdlJykgPT09IC0xKSB7XG4gICAgICAgIHNlbGYuaGFuZGxlUmVzcG9uc2UoeyAnZXJyb3InIDogJ0ludmFsaWQgZmlsZSB0eXBlLicgfSwgY29tcG9uZW50KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGxldCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXI7XG5cbiAgICAgICAgZmlsZVJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICBzZWxmLmhhbmRsZVJlc3BvbnNlKHtcbiAgICAgICAgICAgICdkYXRhJyA6IHtcbiAgICAgICAgICAgICAgJ3BpYycgOiB7XG4gICAgICAgICAgICAgICAgJ2Z1bGwnIDogZmlsZVJlYWRlci5yZXN1bHQsXG4gICAgICAgICAgICAgICAgJ3RodW1iJyA6IGZpbGVSZWFkZXIucmVzdWx0XG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICdpc1Vuc2F2ZWQnIDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0sIGNvbXBvbmVudCk7XG4gICAgICAgIH07XG4gICAgICAgIFxuICAgICAgICBmaWxlUmVhZGVyLnJlYWRBc0RhdGFVUkwodGFyZ2V0LmZpbGVzWzBdKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbiAgLyoqXG4gICAqIEhlbHBlciBmdW5jdGlvbiB0byByZWR1Y2UgcmVkdW5kYW5jeSBpbiB0aGlzIGZpbGUuXG4gICAqIEBwYXJhbSAge29iamVjdH0gcmVzcG9uc2UgRGF0YSBvYmplY3QgdG8gdHJhbnNtaXQgdG8gdGhlIHN0b3JlXG4gICAqIHZpYSB0aGUgYHJlY2VpdmVgIG1ldGhvZC5cbiAgICogQHBhcmFtICB7b2JqZWN0fSBjb21wb25lbnQgQSBSZWFjdCBjb21wb25lbnQgY2xhc3MgbmFtZS5cbiAgICovXG4gIGhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlLCBjb21wb25lbnQpIHtcbiAgICBpZihyZXNwb25zZS5lcnJvcikge1xuICAgICAgQWRtaW5BY3Rpb25zLnJlY2VpdmUoe1xuICAgICAgICAndHlwZScgOiAnZXJyb3InLFxuICAgICAgICAnY29tcG9uZW50JyA6IGNvbXBvbmVudCxcbiAgICAgICAgJ2JvZHknIDogcmVzcG9uc2UuZXJyb3JcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBBZG1pbkFjdGlvbnMucmVjZWl2ZSh7XG4gICAgICAgICdjb21wb25lbnQnIDogY29tcG9uZW50LFxuICAgICAgICAnZGF0YScgOiByZXNwb25zZS5kYXRhXG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxufTsiLCJpbXBvcnQgQWRtaW5BY3Rpb25zIGZyb20gJy4uL2FjdGlvbnMvQWRtaW5BY3Rpb25zLmpzJztcblxuZXhwb3J0IGRlZmF1bHQge1xuXG4gIC8qKlxuICAgKiBHZXQgZGF0YSBmcm9tIHZpYSBodHRwIEdFVCByZXF1ZXN0LiBUaGlzIGFjdGlvbiBzaW1wbHlcbiAgICogICAgZXhlY3V0ZXMgdGhlIHJlcXVlc3QuIFRoZSByZXNwb25zZSBpcyB0aGVuIGRlbGVnYXRlZCBcbiAgICogICAgdmlhIHRoZSBgcmVjZWl2ZWAgYWN0aW9uLlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IHVybCBBIFVSTCB0byBtYWtlIHRoZSBHRVQgcmVxdWVzdCB3aXRoLlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IGNvbXBvbmVudCBBIFJlYWN0IGNvbXBvbmVudCBjbGFzcyBuYW1lLlxuICAgKi9cbiAgZ2V0KHVybCwgY29tcG9uZW50KSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuXG4gICAgJC5hamF4KHtcbiAgICAgICd1cmwnOiB1cmwsXG4gICAgICAndHlwZSc6ICdnZXQnXG4gICAgfSkuZG9uZSgocmVzcG9uc2UpID0+IHtcbiAgICAgIHNlbGYuaGFuZGxlUmVzcG9uc2UoeydkYXRhJyA6IHJlc3BvbnNlfSwgY29tcG9uZW50KTtcbiAgICB9KS5lcnJvcigoeGhyLCBzdGF0dXMsIGVycm9yKSA9PiB7XG4gICAgICBzZWxmLmhhbmRsZVJlc3BvbnNlKHsneGhyJyA6IHhocn0sIGNvbXBvbmVudCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLyoqXG4gICAqIFNhdmUgZGF0YSBmcm9tIGEgc3VibWl0dGVkIGZvcm0sIHZpYSBodHRwIFBPU1QsIFBVVCwgb3IgREVMRVRFXG4gICAqICAgIHJlcXVlc3QuIFRoaXMgYWN0aW9uIHNpbXBseSBleGVjdXRlcyB0aGUgcmVxdWVzdC4gVGhlIHJlc3BvbnNlXG4gICAqICAgIGlzIHRoZW4gZGVsZWdhdGVkIHZpYSB0aGUgYHJlY2VpdmVgIGFjdGlvbi5cbiAgICogQHBhcmFtICB7b2JqZWN0fSBldmVudCBBbiBldmVudCBvYmplY3QuIFRoaXMgc2hvdWxkIGJlIGEgY2hhbmdlXG4gICAqICAgIGV2ZW50IGZyb20gYSBmaWxlIGlucHV0LlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IGNvbXBvbmVudCBBIFJlYWN0IGNvbXBvbmVudCBjbGFzcyBuYW1lLlxuICAgKi9cbiAgc2F2ZShldmVudCwgY29tcG9uZW50KSB7XG4gICAgbGV0IHNlbGYgPSB0aGlzO1xuICAgIGxldCAkdGhpcyA9ICQoZXZlbnQudGFyZ2V0KTtcbiAgICBsZXQgZm9ybURhdGEgPSBuZXcgRm9ybURhdGEoJHRoaXNbMF0pO1xuICAgIGxldCBtZXRob2QgPSAkdGhpcy5hdHRyKCdkYXRhLW1ldGhvZCcpO1xuXG4gICAgJC5hamF4KHtcbiAgICAgICd1cmwnOiAkdGhpcy5hdHRyKCdhY3Rpb24nKSxcbiAgICAgICd0eXBlJzogbWV0aG9kLFxuICAgICAgJ2RhdGEnOiBmb3JtRGF0YSxcbiAgICAgICdlbmN0eXBlJzogJHRoaXMuYXR0cignZW5jdHlwZScpLFxuICAgICAgJ3Byb2Nlc3NEYXRhJzogZmFsc2UsXG4gICAgICAnY29udGVudFR5cGUnOiBmYWxzZSBcbiAgICB9KS5kb25lKChyZXNwb25zZSkgPT4ge1xuICAgICAgcmVzcG9uc2UubWV0aG9kID0gbWV0aG9kLnRvTG93ZXJDYXNlKCk7XG4gICAgICBzZWxmLmhhbmRsZVJlc3BvbnNlKHJlc3BvbnNlLCBjb21wb25lbnQpO1xuICAgIH0pLmVycm9yKCh4aHIsIHN0YXR1cywgZXJyb3IpID0+IHtcbiAgICAgIHNlbGYuaGFuZGxlUmVzcG9uc2Uoeyd4aHInIDogeGhyfSwgY29tcG9uZW50KTtcbiAgICB9KTtcbiAgfSxcblxuICAvKipcbiAgICogSGVscGVyIGZ1bmN0aW9uIHRvIHJlZHVjZSByZWR1bmRhbmN5IGluIHRoaXMgZmlsZS5cbiAgICogQHBhcmFtICB7b2JqZWN0fSByZXNwb25zZSBEYXRhIG9iamVjdCB0byB0cmFuc21pdCB0byB0aGUgc3RvcmVcbiAgICogdmlhIHRoZSBgcmVjZWl2ZWAgbWV0aG9kLlxuICAgKiBAcGFyYW0gIHtvYmplY3R9IGNvbXBvbmVudCBBIFJlYWN0IGNvbXBvbmVudCBjbGFzcyBuYW1lLlxuICAgKi9cbiAgaGFuZGxlUmVzcG9uc2UocmVzcG9uc2UsIGNvbXBvbmVudCkge1xuICAgIGlmKHJlc3BvbnNlICYmIHJlc3BvbnNlLnhocikge1xuICAgICAgbGV0IG1lc3NhZ2UgPSB0aGlzLmdldEh0dHBFcnJvck1lc3NhZ2UocmVzcG9uc2UueGhyKTtcblxuICAgICAgQWRtaW5BY3Rpb25zLnJlY2VpdmUoe1xuICAgICAgICAndHlwZScgOiAnZXJyb3InLFxuICAgICAgICAnY29tcG9uZW50JyA6IGNvbXBvbmVudCxcbiAgICAgICAgJ2JvZHknIDogbWVzc2FnZVxuICAgICAgfSk7XG4gICAgfSBlbHNlIGlmKHJlc3BvbnNlKSB7XG4gICAgICBpZihyZXNwb25zZS5kYXRhICYmIHJlc3BvbnNlLmRhdGEubWVzc2FnZSAmJiByZXNwb25zZS5kYXRhLm1lc3NhZ2Uuc3VjY2Vzcykge1xuICAgICAgICBBZG1pbkFjdGlvbnMucmVjZWl2ZSh7XG4gICAgICAgICAgJ3R5cGUnIDogJ3N1Y2Nlc3MnLFxuICAgICAgICAgICdjb21wb25lbnQnIDogY29tcG9uZW50LFxuICAgICAgICAgICdib2R5JyA6IHJlc3BvbnNlLmRhdGEubWVzc2FnZS5zdWNjZXNzXG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmKHJlc3BvbnNlLm1ldGhvZCAmJiByZXNwb25zZS5tZXRob2QgPT09ICdkZWxldGUnICYmICFyZXNwb25zZS5kYXRhLnJlc3BvbnNlRGF0YSAmJiBjb21wb25lbnQudG9Mb3dlckNhc2UoKSA9PT0gJ2FkbWluYmlvY292ZXInKSB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXNwb25zZURhdGEgPSB7XG4gICAgICAgICAgICAncGljJyA6IGZhbHNlLFxuICAgICAgICAgICAgJ2lzVW5zYXZlZCcgOiBmYWxzZVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYocmVzcG9uc2UuZGF0YSAmJiByZXNwb25zZS5kYXRhLnJlc3BvbnNlRGF0YSkge1xuICAgICAgICByZXNwb25zZS5kYXRhLnJlc3BvbnNlRGF0YS5pc1Vuc2F2ZWQgPSBmYWxzZTtcbiAgICAgICAgXG4gICAgICAgIGlmKGNvbXBvbmVudC50b0xvd2VyQ2FzZSgpID09PSAnYWRtaW5iaW9jYXJkJyAmJiAhcmVzcG9uc2UuZGF0YS5yZXNwb25zZURhdGEucGljKSB7XG4gICAgICAgICAgcmVzcG9uc2UuZGF0YS5yZXNwb25zZURhdGEucGljID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIEFkbWluQWN0aW9ucy5yZWNlaXZlKHtcbiAgICAgICAgICAnY29tcG9uZW50JyA6IGNvbXBvbmVudCxcbiAgICAgICAgICAnZGF0YScgOiByZXNwb25zZS5kYXRhLnJlc3BvbnNlRGF0YVxuICAgICAgICB9KTtcbiAgICAgIH07XG4gICAgfVxuICB9LFxuXG4gIC8qKlxuICAgKiBHZXQgZXJyb3IgZ2VuZXJhdGVkIGJ5IGFuIGh0dHAgcmVxdWVzdCBhbmQgZm9ybXVsYXRlIGEgbWVzc2FnZS5cbiAgICogQHBhcmFtICB7b2JqZWN0fSB4aHIgT2JqZWN0IGdlbmVyYXRlZCBhZnRlciBodHRwIHJlcXVlc3QuXG4gICAqIEByZXR1cm4ge3N0cmluZyB8fCBmYWxzZX1cbiAgICovXG4gIGdldEh0dHBFcnJvck1lc3NhZ2UoeGhyKSB7XG4gICAgcmV0dXJuICgheGhyIHx8ICF4aHIucmVzcG9uc2VKU09OIHx8ICF4aHIucmVzcG9uc2VKU09OLmRhdGEgfHwgIXhoci5yZXNwb25zZUpTT04uZGF0YS5tZXNzYWdlIHx8ICF4aHIucmVzcG9uc2VKU09OLmRhdGEubWVzc2FnZS5lcnJvcilcbiAgICAgID8gKCdTb21ldGhpbmcgd2VudCB3cm9uZy4nKVxuICAgICAgOiB4aHIucmVzcG9uc2VKU09OLmRhdGEubWVzc2FnZS5lcnJvcjtcbiAgfVxuXG59OyJdfQ==
