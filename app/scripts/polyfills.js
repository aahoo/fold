// extending Element prototype

/**
 * check if element has a attr or set an attribute.
 *
 * @method clss
 * @param {String or Array} name attribute name
 * @param {*any} value
 * @param {HTMLElement=} el Defaults to `this`.
 */

Element.prototype.attr = function(name, value, el) {
  el = el || this;
  if(value === undefined) {
    value = el.getAttribute(name);
    if(value === '') value = true;
    return value;
  } else {
    Polymer.Base.serializeValueToAttribute(value, name, el);
    return el;
  }
};

/**
 * check if element has a class or add/remove/toggle class(es).
 *
 * @method clss
 * @param {String or Array} classes CSS class name
 * @param {String or Boolean} fn the method to trigger on classList.
 *    'add' == '+' == true ; 'remove' == '-' == false; 'toggle' == '!'.
 *    when unspecified, returns true or false depending on exsitence of class
 * @param {HTMLElement=} el Defaults to `this`.
 */
Element.prototype.clss = function(classes, fn, el) {
  el = el || this;
  if(fn === undefined || fn === '') return el.classList.contains(classes);
  switch(fn) {
    case true:
    case '+':
      fn = 'add';
      break;
    case false:
    case '-':
      fn = 'remove';
      break;
    case '!':
      fn = 'toggle';
      break;
  }
  if(typeof classes == 'string') classes = classes.split(' ');
  for(var i = 0; i < classes.length; i++) el.classList[fn](classes[i]);
  return el;
};

////////////////////////////////////////////////////////////////////////////////

// Object //

// assign

if (typeof Object.assign != 'function') {
  Object.assign = function(target) {
    'use strict';
    if (target == null) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    target = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var source = arguments[index];
      if (source != null) {
        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }
    }
    return target;
  };
}

////////////////////////////////////////////////////////////////////////////////

// Array //

// has / includes
Array.prototype.has = Array.prototype.includes || function(item) {
  return this.indexOf(item) >= 0;
};

// remove
Array.prototype.remove = Array.prototype.remove || function(item) {
  var index = this.indexOf(item);
  if(index >= 0) this.splice(index, 1);
  return this;
};

// find
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}
