/**
`x-cards` is a basic wrapper to create cards.
The intro text after fresh installation is made using this element and
configured using the default json model.
*/

Polymer({
  is: 'x-card',
  extends: 'div',
  hostAttributes: {
    class: 'card li relative',
    draggable: 'true',
  },

  attached() {
    if(this.model) this.init(true);
  },

  init(force) {
    if(!force && this.inited) return;
    this.render();
    this.inited = true;
  },

  render() {
    while(this.firstChild) this.firstChild.remove();
    this.models.forEach(m => this.appendChild(this.create(m.tag, m)));
  },

});
