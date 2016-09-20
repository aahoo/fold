'use strict';

(function(document, env, open, ePrevent) {

  document.body.id = env;

  // Handle click on a link if the link points to a chrome: or file: or
  // chrome-extension: url

  document.addEventListener('click', function(e) {
    let el = e.target;
    if(ePrevent(e) || el.nodeType != Node.ELEMENT_NODE ||
      !el.matches('A, A *')) return;
    while(el.tagName != 'A') el = el.parentElement;
    let badProt = ['file:', 'chrome:', 'chrome-extension:'].has(el.protocol);
    if(!(badProt || env == 'popup' || [0, 1].has(e.button))) return;
    ePrevent(e, true);
    if(el.matches('.item.li'))
      open({ url: el.href, active: env == 'popup' }, e.button == 1, callback);

    function callback() {
      if(env == 'popup' && el.matches('.item.li')) window.close();
    }
  });

}(document, $$.app.env, $$.chrome.tabs.open, __.ePrevent));

////////////////////////////////////////////////////////////////////////////////

/**
 * Keeps track of mouse button state. The state of the button is also reset on
 * dragend.
 * @memberof $$
 * 
 * @module mouse
 */

$$.mouse = (function(Timer) {

  var mouse = { wasDown: false };

  let timer = Timer(resetMouse);

  function setMouse() {
    mouse.wasDown = true;
    timer.refresh(5000);
  }

  function resetMouse() {
    mouse.wasDown = false;
    timer && timer.clear();
  }

  document.addEventListener('mousedown', setMouse);
  document.addEventListener('mouseup', resetMouse);

  return mouse;

}(__.Timer));
