/**
`x-layout` is used to create the layout elements. Layouts are configured in the
default json model in this app. They do not have any data stored in the DB.
*/

'use strict';

Polymer({
  is: 'x-layout',
  extends: 'div',
  properties: {
    class: { type: String, reflectToAttribute: true, observer: 'notifyStore' },

    /**
    * the child models in a layout element.
    */
    models: { type: Array, observer: 'notifyStore' },
  },
  listeners: {
    'models-changed': 'modelsObserver',
  },
  behaviors: [Polymer.Behaviros.Controls],

  attached() {
    this.init(true);
  },

  init(force) {
    if(!force && this.inited) return;
    let model;
    if(this.id == 'root' && !this.model) {
      model = $$.db.get('model.root');
      model && this.__bind(model);
    }
    this.ctrls && this.initCtrls();
    Polymer.RenderStatus.afterNextRender(this, function() {
      if(this.clss('scroll-x')) this.onwheel = this.wheel;
      if(this.clss('column')) {
        this.onclick = this.tap;
        this.columnize = this.toggleMax;
        this.maximize = this.toggleMax;
        this.onmousedown = this.mousedown;
        this.onmouseup = this.mouseup;
      }
    });
    this.modelsRender();
    this.offsetWidth;
    this.inited = true;
  },

  modelsObserver( /* e, detail */ ) {
    this.notifyStore(this.models, undefined, 'models', 'db');
  },

  /**
   * Hanldes tap/click event.
   */
  tap(e) {
    if(!__.ePrevent(e) && e.target == this && e.button != 1)
      this.maxAnim && this.maxAnim.clone ?
      this.toggleMax() : this.clss('collapse', 'toggle');
  },

  /**
   * Prevents campus scroller showing up on middle mouse click.
   */
  mousedown(e) {
    if(!__.ePrevent(e) && e.target == this && e.button == 1) return false;
  },

  /**
   * Toggles between normal and maximized state on middle mouse click.
   */
  mouseup(e) {
    if(!__.ePrevent(e) && e.target == this && e.button == 1) this.toggleMax();
  },

  /**
   * Scrolls horizontally on mouse wheel for bar type layouts.
   */
  wheel(e) {
    if(!__.ePrevent(e) && this.scrollWidth > this.clientWidth &&
      (this.clss('bar') || e.target == this))
      $$.animation.scroll({ el: this, duration: 200, delta: e.deltaY * 2 });
  },

  /**
   * Toggles between normal and maximized state.
   *
   * @param {function} callback
   */
  toggleMax(callback) {
    this.maxAnim = $$.animation.toggleMax(this, this.maxAnim, callback);
  },

  /**
   * creates a new empty layout from this layout and inserts it before this element
   */
  new() {
    let model = this.copy();
    delete model.models;
    this.parent.insert(model, { before: this.model });
  },

});
