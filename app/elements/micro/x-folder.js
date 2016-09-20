/**
`x-folder` is primarily used to display bookmark folders. It is also reponsible
for managing and mediating its children e.g. to move, insert or delete.
*/

Polymer({
  is: 'x-folder',
  extends: 'div',
  behaviors: [Polymer.Behaviros.Data],
  hostAttributes: {
    class: 'relative flex-none li folder',
    draggable: 'true',
  },
  properties: {
    /**
    * state of a folder can be 'middle', 'closed', or 'opened'. 'middle' state
    * is not implemented yet.
    */
    state: { type: String, reflectToAttribute: true, observer: 'render' },

    /**
    * the child models in a folder.
    */
    models: { type: Array, observer: 'notifyStore' },
  },

  attached() {
    this.isRoot = $$.app.checkRoot(this);
    this.onclick = this.tap;
    if(this.isRoot && this.gid) {
      this.type = $$.app.calcType(this.gid);
      this.listen(this, 'signal-db-' + this.type, '_fetchData');
    }
    this.init(true);
  },

  detached() {
    if(this.isRoot) this.unlisten(this, 'signal-db-' + this.type, '_fetchData');
  },

  init(force) {
    if(!force && this.inited) return;
    // selfModel is the model that represents this folder.
    let selfModel = {
      is: 'x-button',
      class: 'label btn li folder-button delegate',
    };
    if(this.gid) selfModel.gid = this.gid;
    else selfModel.textContent = this.title;
    if(!this.self) {
      this.self = this.make(selfModel);
      // this.self.parent = this;
      this.insertBefore(this.self, this.firstChild);
    }
    if(this.gid) this.dataInit(true);
    else this.render();
    this.inited = true;
  },

  dataObserver(data) {
    if(data) this.clss(data.type == 'app.folder' ? 'app' : 'bookmark', true);
    this.modelsRendered = false;
    this.render();
  },

  tap(e) {
    if(__.ePrevent(e) || !e.target.clss('delegate')) return;
    __.eStop(e);
    let s = this.state;
    if(s == 'empty') return;
    this.state = (s == 'closed' || s == 'middle') ? 'opened' : 'closed';
  },

  render(state, oldState, prop) {
    if(!this.isAttached) return;
    if(this.state === undefined) {
      this.state = this.computeState();
      return;
    }
    if(prop) // called from state observer due to change in state
      this.notifyStore(state, oldState, prop);
    state = this.state;
    if(!this.modelsRendered && (state == 'opened' || state == 'middle')) {
      if(this.gid && this.data) this.models = this.computeModels();
      if(this.models && this.models[0]) {
        this.modelsRender();
        this.modelsRendered = true;
      }
    }
  },

  /**
   * Computes the state of the folder. It is especially necessary for cases that
   * the folder is emptied and needs to refresh its state.
   *
   * @returns {string} state of the folder
   */
  computeState() {
    let s = this.state,
      models = this.data ? this.data.children : this.models;
    return !models || !models.length ? 'empty' :
      !s || s == 'empty' ? 'closed' : s;
  },

  /**
   * Based on the data fetched from DB, this methods computes the child models
   * of a folder
   *
   * @returns {array} array of child model objects
   */
  computeModels() {
    return this.data.children.map(gid => {
      let cData = $$.db.get(gid);
      let model = (this.models || []).find(m => m.gid === cData.gid);
      if(!model) model = { is: $$.app.computeIs(cData), gid: cData.gid };
      return model;
    });
  },

  /**
   * Inserts a model making it the child of this folder
   *
   * @param {object} token a model object or Polymer element
   * @param {object} o options determining insertion point
   */
  insert(token, o = {} /* object options */ ) {
    if(token) this.move(this.getModel(token),
      (isNaN(o.index) ? this.getIdx(o.before) : o.index)); // - folder item
  },

  /**
   * Appends a model to children models
   *
   * @param {object} token a model object or Polymer element
   */
  append(token) {
    if(token && arguments.length == 1) this.move(this.getModel(token));
    else log('Append should have one argument but given', arguments.length, '!');
  },

  /**
   * Request DB to move a model to this folder. Used by `insert` and `append`.
   *
   * @param {object} model
   * @param {number} index
   */
  move(model, index) {
    this.fire('db-request', {
      name: 'move',
      data: {
        gid: model.gid,
        dest: { parentId: this.gid, index },
      }
    });
  },

});
