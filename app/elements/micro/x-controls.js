/**
`x-controls` is a wrapper for control buttons. By default it has the 
`transparent` class which should be removed on mouseover.
Close, maximize and other buttons at the top of columns are made using this
element and configured in default json model. example:

<x-controls ctrls="delete maximize"></x-controls>

See `Controls` behavior on how it is used in this app.
*/

Polymer({
  is: 'x-controls',
  extends: 'div',
  properties: {

    /**
    * 'space' seperated list of control element names that the parent element
    * should have. These names are important as they are also the name of the
    * method on the boss element that will be called on clicking/tapping.
    */
    ctrls: { type: String, observer: '_render' },
  },

  /**
  * ICON_MAP translates control element name to the icon to be displayed.
  */
  ICON_MAP: { // single instance
    maximize: 'maximize',
    delete: 'close',
  },

  created() {
    this.clss('ctrls transparent', true);
  },

  attached() {
    this._init();
    this.onclick = this.tap;
  },

  _init() {
    if(this.inited) return;
    this._render();
    this.inited = true;
  },

  tap(e) {
    __.eStop(e);
    let el = this.findMatchUp({ slctr: 'btn', attr: 'clss' }, e.target);
     // `boss` is the element on which control actions would be applied
    if(this.boss[el.tap]) this.boss[el.tap]();
  },

  _render() {
    while(this.firstChild) this.firstChild.remove();
    this.ctrls.split(' ').forEach(str => this.appendChild(this._make(str)));
  },

  _make(tap, icon = this.ICON_MAP[tap] || tap, size = 18) {
    let el = this.create('x-icon', { icon, size, tap });
    el.className = 'btn';
    return el;
  },

});
