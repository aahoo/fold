window.log = console.log;

/**
 * Namespace for utility functions.
 * @namespace __
 */

window.__ = (function() {

  /**
   * Convenience method for preventing default on DOM event object. Either
   * returns `defaultPrevented` property or calls `preventDefault`.
   *
   * @method ePrevent
   * @param {object} e DOM event object
   * @param {boolean} value if value is truthy, calls `e.preventDefault` method
   * @returns {boolean} if no value is provided returns `e.defaultPrevented`.
   */
  function ePrevent(e, value) {
    if(value === undefined) return e.defaultPrevented ||
      (e.detail.sourceEvent && e.detail.sourceEvent.defaultPrevented);
    else if(value && e && e.preventDefault) e.preventDefault();
  }

  /**
   * Convenience method for stopping propagation of DOM event object.
   *
   * @method eStop
   * @param {object} e DOM event object
   * @returns {object} same event object that was fed as a parameter
   */
  function eStop(e) {
    e && e.stopPropagation && e.stopPropagation();
    return e;
  }

  function _getEvent(type, bubbles, cancelable, useCache) {
    var event = useCache && this && this.__eventCache[type];
    if(!event || ((event.bubbles != bubbles) ||
        (event.cancelable != cancelable))) {
      event = new Event(type, {
        bubbles: Boolean(bubbles),
        cancelable: cancelable
      });
    }
    return event;
  }

  /**
   * Dispatches a custom event with an optional detail value.
   *
   * @method fire
   * @param {String} type Name of event type.
   * @param {*=} detail Detail value containing event-specific payload.
   * @param {Object=} options Object specifying options.  These may include:
   *  `bubbles` (boolean, defaults to `true`),
   *  `cancelable` (boolean, defaults to false), and
   *  `node` on which to fire the event (HTMLElement, defaults to `this`).
   * @returns {CustomEvent} The new event that was fired.
   */
  function fire(type, detail, options) {

    // NOTE: We optionally cache event objects for efficiency during high
    // freq. opts. This option cannot be used for events which may have
    // `stopPropagation` called on them. On Chrome and Safari (but not FF)
    // if `stopPropagation` is called, the event cannot be reused. It does not
    // dispatch again.
    options = options || {};
    var node = options.node || (this && this != window ? this : document);
    detail = (detail === null || detail === undefined) ? {} : detail;
    var bubbles = options.bubbles === undefined ? true : options.bubbles;
    var cancelable = Boolean(options.cancelable);
    var useCache = options._useCache;
    var event = _getEvent(type, bubbles, cancelable, useCache);
    event.detail = detail;
    if(useCache && this.__eventCache) {
      this.__eventCache[type] = null;
    }
    node.dispatchEvent(event);
    if(useCache) {
      if(!this.__eventCache) this.__eventCache = {};
      this.__eventCache[type] = event;
    }
    return event;
  }

  /**
   * `JSON.parse` with exception handling
   *
   * @method parseJSON
   * @param {String} value.
   * @returns {object} parsed object.
   */
  function parseJSON(value) {
    try { // parse value as JSON
      value = JSON.parse(value);
    } catch(x) {
      this.errorMessage = 'Could not parse local storage value';
      console.error('Could not parse local storage value', value);
      value = null;
    }
    return value;
  }

  /**
   * Extracts time duration and returns as a number.
   *
   * @method parseDuration
   * @param {String} str duration in '#ms' or '#s' format.
   * @returns {number} duration in miliseconds
   */
  function parseDuration(str) {
    let unit = str.indexOf('ms') > 0 ? 'ms' : 's';
    return parseFloat(str.split(unit)[0]) * (unit == 's' ? 1000 : 1);
  }

  /**
   * Extracts time duration and returns as a number.
   *
   * @method treeToMap
   * @param {Object} root reference to the root of the tree
   * @param {Object} cfg TODO(3) complete later
   * @param {Object} childrenProp name of property that pertains to 'children'
   * @returns {Object} flattened tree as a map object
   */
  function treeToMap(root, cfg, childrenProp) {
    childrenProp = childrenProp || 'children';
    let map = Object.create(null);
    let flatten = (children, parent) => {
      children.forEach(child => {
        if(cfg.preProcess) cfg.preProcess(child, parent);
        map[child.id] = child;
        let children = child[childrenProp];
        if(children) {
          flatten(children, child);
          if(cfg.postProcess) cfg.postProcess(child, parent);
        }
      });
    };
    flatten(root);
    return map;
  }

  /**
   * Deep assigns properties from source to target Object
   *
   * @method assignDeep
   * @param {Object} target
   * @param {Object} src
   */
  function assignDeep(target, src) {
    for(var k in src)
      target[k] === undefined ? target[k] = src[k] :
      Array.isArray(src[k]) ? src[k].forEach((v, i) => target[k][i] = v) :
      typeof src[k] == 'object' ? assignDeep(target[k], src[k]) :
      target[k] = src[k];
    return target;
  }

  /**
   * Convenience method for `HTMLElement.compareDocumentPosition`.
   *
   * @method domOrder
   * @param {HTMLElement} n1
   * @param {HTMLElement} n2
   * @returns {String} '1in2', '2in1', '1>2', '2>1'
   */
  function domOrder(n1, n2) {
    n2 = n2 || this;
    var result =
      /* beautify preserve:start */
    n2.compareDocumentPosition(n1) & n1.DOCUMENT_POSITION_CONTAINED_BY ? '1in2' :
    n2.compareDocumentPosition(n1) & n1.DOCUMENT_POSITION_CONTAINS     ? '2in1' :
    n2.compareDocumentPosition(n1) & n1.DOCUMENT_POSITION_FOLLOWING    ? '1>2'  :
    n2.compareDocumentPosition(n1) & n1.DOCUMENT_POSITION_PRECEDING    ? '2>1'  :
    'other';
    /* beautify preserve:end */
    return result;
  }

  /**
   * A class to create timer objects.
   * @class Timer
   *
   * @constructor
   *
   * @param {function} callback
   * @param {number} [delay] if not specified, timer will not start.
   */

  const Timer = function(callback, delay) {
    let _timeoutID,
      timer = {
        delay,
        callback,
        params: Array.prototype.slice.call(arguments, 2),
        active: false,
      };

    function _callback() {
      timer.active = false;
      callback.apply(callback, timer.params);
    }

    function set() {
      timer.active = true;
      return _timeoutID = window.setTimeout(_callback, timer.delay);
    }

    function clear() {
      if(typeof _timeoutID !== 'number') return;
      window.clearTimeout(_timeoutID);
      timer.active = false;
      _timeoutID = null;
    }

    function refresh(newDelay) {
      if(newDelay) timer.delay = newDelay;
      clear();
      set();
    }

    if(typeof delay == 'number') set();
    return Object.assign(timer, {set, clear, refresh });
  };

  // export

  return {
    assignDeep,
    treeToMap,
    parseJSON,
    parseDuration,
    Timer,
    // convenience
    ePrevent,
    eStop,
    domOrder,
    fire,
  };

}());
