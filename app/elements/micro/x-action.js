/**
`x-action` is used to create action buttons such as the 'menu' button.
Following properties should be assigned to an `x-action` element:

@property icon name of the icon for which an `x-icon` element will be created,
@property action an object with format:
{
  selector: String css selector to identify an element to perform an action on,
  tap: String name of the method to call when the element is tapped,
  tapArgs: Array of arguments to be passed to the ontap method,
  drop: String method name to call when dropped on an element or be dropped upon
        by an element
}

Label for this element can be given like a regular anchor element.

In this app, `x-action`s are configured in default json model.
*/

Polymer({
  is: 'x-action',
  extends: 'a',
  hostAttributes: {
    class: 'action li inline btn label',
    draggable: 'true',
  },

  attached() {
    if(this.model) this.init(true);
    this.onclick = this.tap;
  },

  init(force) {
    if(!force && this.inited) return;
    if(!this.iconEl) {
      this.iconEl = this.create('x-icon', { icon: this.icon, size: 18 });
      this.insertBefore(this.iconEl, this.firstChild);
    }
    this.inited = true;
  },

  tap(e) {
    __.eStop(e);
    let a = this.action,
      el = a.selector == 'this' ? this : document.querySelector(a.selector);
    if(!el) return;
    if(typeof a.tap == 'string') el[a.tap](...(a.tapArgs || []));
    else if(Array.isArray(a.tap))
      a.tap.forEach(i => el[i.tap](...(i.tapArgs || [])));
  },

});
