'use strict';

// initializing Polymer

window.Polymer = { dom: 'shadow', lazyRegister: true };

/**
 * Namespace that holds everything expect utils and Polymer and frequently used
 * libraries such as lodash.
 * @namespace $$
 */

const $$ = {
  // animation, // animation.js
  // app, // below
  // chrome, // chrome.js
  // mouse, // app.js
  // drag, // drag.js
  db: {}, // db.js // chrome.js depends on db but is executed before db
};

$$.app = {

  env: location.hash.substring(1),

  /**
   * checks whether an item is at the root level, i.e. child of `x-layout`
   * with 'grid' class
   *
   * @param {HTML element} el
   * @returns true if at root level or false/null
   */
  checkRoot(el) {
    let parent = (el || this).parentElement;
    return parent ? parent.clss('grid') : null;
  },

  /**
   * Extracts and returns the type of a model from its gid (global id)
   *
   * @param {string} gid
   * @returns {string} type
   */
  calcType(gid) {
    return gid && gid.substr(0, gid.lastIndexOf('.'));
  },

  /**
   * Extracts and returns the id of a model from its gid (global id)
   *
   * @param {string} gid
   * @returns {string} id
   */
  calcId(gid) {
    let path = gid.split('.');
    return gid && path[path.length - 1];
  },

  /**
   * Computes the `is` of a polymer element from the given data.
   *
   * @param {object} data
   * @returns {string} is
   */
  computeIs(data) {
    if(data.children) return 'x-folder';
    let path = data.gid.split('.');
    switch(path[0]) {
      case 'chrome':
        switch(path[1]) {
          case 'management':
            if(data.type == 'extension') return 'x-extension';
            else if(data.type == 'theme') return 'x-theme';
            else return 'x-app';
          default:
            return 'x-button';
        }
        // break;
      default:
        console.log('could not compute "is" from data');
    }
  }

};
