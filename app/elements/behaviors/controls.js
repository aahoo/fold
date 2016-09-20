/**
This behavior generates control buttons (using `x-control` element) on
mouseenter and removes them on mouseleave. It is made as such to be more memory
efficient.
By default, `this` will be the wrapper for the controls element. set
`ctrlsWrapper` property of `this` element to specify a different wrapper.
*/

Polymer.Behaviros.Controls = {

  detached() {
    if(this.ctrlsEl) {
      this.unlisten(this.ctrlsWrapper, 'mouseenter', 'enter');
      this.unlisten(this.ctrlsWrapper, 'mouseleave', 'leave');
    }
  },

  initCtrls() {
    Polymer.RenderStatus.afterNextRender(this, function() {
      this.ctrlsWrapper = this.ctrlsWrapper || this;
      this.listen(this.ctrlsWrapper, 'mouseenter', 'enter');
      this.listen(this.ctrlsWrapper, 'mouseleave', 'leave');
    });
  },

  detachCtrls() {
    let el = this.ctrlsEl;
    if(this.ctrlsEl && this.ctrlsEl.clss('transparent')) {
      el.removeEventListener('transitionend', this.detachCtrls.bind(this), true);
      this.ctrlsEl.remove();
      delete this.ctrlsEl;
    }
  },

  enter(e) {
    __.eStop(e);
    if($$.mouse.wasDown || $$.drag.active) return;
    let el = this.ctrlsEl;
    if(!el) {
      this.ctrlsEl = this.create('x-controls');
      el = this.ctrlsEl;
      el.boss = this;
      el.ctrls = this.ctrls;
      el.addEventListener('transitionend', this.detachCtrls.bind(this), true);
      this.ctrlsWrapper.appendChild(el);
      el.offsetWidth;
    }
    el.clss('transparent', false);
  },

  leave(e) {
    __.eStop(e);
    if(this.ctrlsEl) this.ctrlsEl.clss('transparent', true);
  },

};
