/**
 * Basic animation functions for (horizontal) scrolling and smooth modalizing
 * of an element
 *
 * @module animation
 */

$$.animation = (function(window, parseDuration, Timer) {

  /**
   * Polyfill for requestAnimationFrame
   * @method requestFrame
   *
   * @returns requestAnimationFrame
   */
  let requestFrame = (function() {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  // let P = Math.pow;
  /**
   * A bunch of easing functions.
   * @method easeFunc
   *
   * @namespace easeFunc
   */
  let easeFunc = {
    // no easing, no acceleration
    // linear: t => t,
    // // accelerating from zero velocity
    // inQuad: t => t * t,
    // // decelerating to zero velocity
    outQuad: t => t * (2 - t),
    // // acceleration until halfway, then deceleration
    // inOutQuad: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
    // // accelerating from zero velocity
    // inCub: t => P(t, 3),
    // // decelerating to zero velocity
    // outCub: t => 1 + P(--t, 3),
    // // acceleration until halfway, then deceleration
    // inOutCub: t => t < .5 ? 4 * P(t, 3) : (t - 1) * P((2 * t - 2), 2) + 1,
    // // accelerating from zero velocity
    // inQuart: t => P(t, 4),
    // // decelerating to zero velocity
    // outQuart: t => 1 - P(--t, 4),
    // // acceleration until halfway, then deceleration
    // inOutQuart: t => t < .5 ? 8 * P(t, 4) : 1 - 8 * P(--t, 4),
    // // accelerating from zero velocity
    // inQuint: t => P(t, 5),
    // // decelerating to zero velocity
    // outQuint: t => 1 + P(--t, 5),
    // // acceleration until halfway, then deceleration
    // inOutQuint: t => t < .5 ? 16 * P(t, 5) : 1 + 16 * P(--t, 5),
  };

  //////////////////////////////////////////////////////////////////////////////

  const _animate = function(anim) {
    let _timer = Timer(end),
      _oldDuration;
    anim.active = null;

    function apply(fromStyle, style, fromClass, clss) {
      let el = anim.el;
      _oldDuration = el.style.transitionDuration;
      if(fromClass) el.clss(fromClass, true);
      if(fromStyle) Object.assign(el.style, fromStyle);
      let _duration = parseDuration(window.getComputedStyle(el).transitionDuration);
      if(fromStyle || fromClass) {
        el.style.transitionDuration = '0s';
        if(style || clss) el.offsetWidth;
      }
      if(fromClass) el.clss(fromClass, false);
      if(clss) el.clss(clss, true);
      if(style) Object.assign(el.style, style);
      el.style.transitionDuration = _oldDuration;
      // TODO(3) use event listeners instead
      _timer.refresh(_duration);
      return anim;
    }

    function play() {
      anim.active = true;
      return apply(anim.fromStyle, anim.style, anim.fromClass, anim.class);
    }

    function reverse() {
      anim.active = true;
      return apply(anim.style, anim.fromStyle, anim.class, anim.fromClass);
    }

    function end() {
      anim.active = false;
      anim.el.style.transitionDuration = _oldDuration;
      anim.callback && anim.callback();
    }

    return Object.assign(anim, { play, reverse, end });
  };

  /**
   * Takes an object and applies animation methods to it.
   * @method animate
   *
   * @param {object} anim Config object with the following properties:
   *         {object} [style],
   *          {array or string} [class],
   *          {object} el HTML Element
   *          {function} callback a callback function
   * @return {object} anim same config with added methods and props:
   *         {boolean} active,
   *         {function} apply
   *         {function} play
   *         {function} reverse
   *         {function} end
   */
  function animate(anim) {
    if(!anim.el) console.log('No element to animate!');
    if(anim.active === undefined) anim = _animate(anim);
    return anim;
  }

  let scrim = document.body.appendChild(document.createElement('div'));
  scrim.attr('hidden', true).id = 'scrim';
  let modalWrapper = scrim.appendChild(document.createElement('div'));
  modalWrapper.id = 'modal-wrapper';

  /**
   * Toggles smoothly between a modal state and normal state of an element.
   * @method modalize
   *
   * @param {object} el HTML Element
   * @param {object} anim see `animate` method
   * @param {object} callback HTML Element
   * @returns {object} anim object
   */
  function modalize(el, anim, callback) {
    anim = anim || {};
    if(!el) console.log('No element to modalize!');
    if(anim.active) return anim;
    anim = animate(anim);
    let rect;
    if(!anim.clone) {
      rect = el.getRect();
      Object.assign(anim, {
        el: modalWrapper,
        fromStyle: {
          left: rect.left + 'px',
          top: rect.top + 'px',
          width: rect.width + 'px',
          height: rect.height + 'px',
        },
        clone: el.cloneNode(),
        callback: null,
      });
      scrim.attr('hidden', false).clss('active', true);
      anim.play();
      scrim.onclick = function(e) {
        if(e.target == scrim) modalize(el, anim);
      };
      el.parentElement.replaceChild(!(anim.clone._init = null) && anim.clone, el);
      modalWrapper.appendChild(el);
      return anim;
    } else {
      anim.callback = function() {
        this.clone.parentElement.replaceChild(el, this.clone);
        delete this.clone;
        callback && callback();
        scrim.attr('hidden', true);
        scrim.onclick = null;
      };
      scrim.clss('active', false);
      return anim.reverse();
    }
  }

  /**
   * Toggles smoothly between maximized and normal state of an element.
   * @method toggleMax
   *
   * @param {object} el HTML Element
   * @param {object} anim see `animate` method
   * @param {object} callback HTML Element
   * @returns {object} anim object
   */
  function toggleMax(el, anim, callback) {
    anim = anim || {};
    if(!el) console.log('No element to toggleMax!');
    anim.class = 'maxed';
    return modalize(el, anim, callback);
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * For scrolling an HTML Element. Primarily used for horizontal scroll.
   * @method scroll
   *
   * @param {object} el scrollable HTML Element.
   * @param {number} duration in miliseconds.
   * @param {string} easing equation. see `easeFunc` for other options.
   * @param {string} [axis] 'x' for horizontal axis, 'y' for vertical axis.
   * @param {number or HTML Element} [to] HTML element or the target scrollX or
   *                  scrollY property of the element
   * @param {number} [delta=250] + or - number of pixels to scroll. Ignored if
   *                  to is specified.
   * @returns {object}
   */
  function scroll({ el, duration, easing = 'outQuad', axis, to, delta = 250 } = {},
    callback) {
    el = !el ? document.body :
      typeof el == 'string' ? document.querySelector(el) : el;
    axis = axis || (el.scrollWidth > el.clientWidth ? 'x' : 'y');
    let scrollProp = axis == 'x' ? 'scrollLeft' : 'scrollTop',
      currentPos = el[scrollProp],
      currentTime = 0;
    if(!to) to = currentPos + delta;
    if(typeof to != 'number') to = axis == 'x' ? el.offsetLeft : el.offsetTop;

    // add animation loop
    function tick() {
      currentTime += 1 / 60;
      let p = currentTime / (duration / 1000);
      let t = easeFunc[easing](p);

      if(p < 1) {
        requestFrame(tick);
        el[scrollProp] = currentPos + (to - currentPos) * t;
      } else {
        el[scrollProp] = to;
        callback && callback();
      }
    }
    // call it once to get started
    tick();
    return 'scrolling ...';
  }

  return { scroll, modalize, toggleMax };

}(window, __.parseDuration, __.Timer));
