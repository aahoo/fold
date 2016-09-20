/**
Extends: Signals
This behavior is common to the components that need to fetch data from database.

*/

Polymer.Behaviros.DataImpl = {

  get data() {
    return this._data;
  },

  set data(newVal) {
    let oldVal = this._data;
    this._data = newVal;
    this.dataObserver(newVal, oldVal, 'data');
  },

  detached() {
    this.unlisten(this, 'signal-db-' + this.gid, '_fetchData');
  },

  dataInit(force) {
    if(!force && this.dataInited) return;
    // items at root do not need have data in DB, hence, manipulated directly
    if(!this.isRoot) {
      this.cut = this._cut;
      this.delete = this._delete;
    }
    Polymer.RenderStatus.afterNextRender(this, function() {
      if(!this.isAttached) return;
      this.listen(this, 'signal-db-' + this.gid, '_fetchData');
      if(this.getViewModel) __.assignDeep(this, this.getViewModel());
      this._fetchData();
    });
    this.dataInited = true;
  },

  _fetchData() {
    let data = $$.db.get(this.gid);
    // if the item is removed from DB, it should also be removed from the view
    data == 'none' ? this.parent.delete(this.model) : this.data = data;
  },

  /*
   * Cuts a model to be inserted somewhere else. The cutting of the models with
   * data are virtually done in the DB. This method exists to keep the
   * consistency with the models that has no data.
   *
   * @param {object} token a model object or Polymer element
   * @returns {object} a model object
   */
  _cut: function(token) {
    return token ? this.getModel(token) : this.model;
  },

 /*
  * Requests the DB to delete a model.
  *
  * @param {object} token a model object or Polymer element
  */
  _delete(token) {
    if(token) console.log('!deleting', token);
    else
      this.fire('db-request', {
        name: 'remove',
        data: { gid: this.gid },
      });
  },

};

Polymer.Behaviros.Data = [Polymer.Behaviros.Signals, Polymer.Behaviros.DataImpl];
