// Polymer.log = true // TODO(production) comment

Polymer.Behaviros = {};

////////////////////////////////////////////////////////////////////////////////

// a dirty fix :D. The Polymer dom method is short-circuited.

Polymer.dom = function(el) {
  return el || document;
};

////////////////////////////////////////////////////////////////////////////////

// more utilities

Polymer.Base._addFeature({

  /**
   * Traverses the DOM tree upward to find a matching element.
   *
   * @method findMatchUp
   * @param {string or object} cfg crtieria for the match which can be a simple
   *        string that would be fed directly to the `matches` method of an HTML
   *        Element or it can be an object with `attr` and `slctr` property in
   *        which case `attr` can be 'clss' or 'attr' and the `slctr` would be a
   *        string.  E.g.
   *        this.findMatchUp({ attr: 'clss', slctr: 'btn' }, myEl)
   * @returns {HTML Element}
   */
  findMatchUp(cfg, el) {
    el = el || this;
    var attr, slctr = cfg;
    if(typeof slctr != 'string') {
      attr = cfg.attr;
      slctr = cfg.slctr;
    }
    return el == window || el == document ? null :
      (attr ? el[attr](slctr) : el.matches(slctr)) ?
      el :
      Polymer.Base.findMatchUp(cfg, el.parentElement);
  },

  /**
   * a shorthand for `getClientRects` method of HTML Element
   *
   * @method getRect
   */
  getRect(el) {
    return(el || this).getClientRects()[0];
  },

});

////////////////////////////////////////////////////////////////////////////////

// items

Polymer.Base._addFeature({

  /**
   * Creates a Polymer Element from a given model with data binding enabled. See
   * the readme file to learn more about data binding.
   *
   * @method make
   * @param {object} a model object
   * @returns {HTML Element} created Polymer Element
   */
  make(model) {
    var item = this.create(model.is);
    if(!item) return;
    item.__bind(model);
    return item;
  },

  __bind(model) {
    this.mixin(this, model);
    this.__data__ = this.mixin(model, this.__data__);
    this.model = model;
    if(this.binded) this.binded();
  },

  /**
   * Returns/creates the models array that contains child models.
   *
   * @method modelsGet
   * @returns {array} models array
   */
  modelsGet() {
    if(!this.models) this.models = [];
    return this.models;
  },

  /**
   * Returns/creates the items array that contains child elements.
   *
   * @method itemsGet
   * @returns {array} items array
   */
  itemsGet() {
    if(!this.items) this.items = [];
    return this.items;
  },

  /**
   * Flushes the items array as well as the associated elements from the DOM
   *
   * @method itemsReset
   * @returns {array} items array
   */
  itemsReset() {
    var item;
    if(this.items)
      while(this.items.length) {
        item = this.items.pop();
        item.parent = null;
        item.remove();
      }
    else
      this.items = [];
    return this.items;
  },

  /**
   * Returns the index of a given model or item
   *
   * @method getIdx
   * @param {object} token a model or an item
   * @returns {number}
   */
  getIdx(token) {
    var index = this.models.indexOf(token);
    index = index >= 0 ? index :
      Polymer.isInstance(token) ? this.models.indexOf(token.model) :
      typeof token == 'number' ? token :
      !isNaN(token) ? parseInt(token, 10) :
      this.models.length;
    return index < 0 ? this.models.length : index;
  },

  /**
   * Always returns a model for a given token whether it be a model or an item.
   *
   * @method getModel
   * @param {object} token a model or an item
   * @returns {object}
   */
  getModel(token) {
    return Polymer.isInstance(token) ? token.model : token;
  },

  /**
   * Renders all the models.
   *
   * @method modelsRender
   * @param {object} [models=this.models]
   */
  modelsRender(models) {
    if(models) this.models = models;
    else models = this.modelsGet();
    if(models.length) {
      var items = this.itemsReset();
      for(var i = 0, item; i < models.length; i++) {
        item = this.make(models[i]);
        item.parent = this;
        items.push(item);
        this.appendChild(item);
      }
    }
  },

  /**
   * `modelsPush` appends one or more models to the models array and creates
   * corresponding items and pushes them to the items array. The items are also
   * added to the DOM.
   * The arguments and return value match that of `Array.prototype.push`
   *
   * @method modelsPush
   * @param {...any} var_args models to push onto array.
   * @return {number} New length of the array.
   */
  modelsPush() {
    var models = this.modelsGet(),
      items = this.itemsGet();
    if(arguments.length) {
      models.push.apply(models, arguments);
      for(var i = 0, item; i < arguments.length; i++) {
        item = this.make(arguments[i]);
        item.parent = this;
        items.push(item);
        this.appendChild(item);
      }
      this._notifyChange('models', 'models-changed', models);
    }
    return models.length;
  },

  /**
   * Starting from the start index specified, removes 0 or more models
   * from the models array and inserts 0 or more new itms in their place while
   * keeping items array and DOM in synchronization.
   * The arguments and return value match that of `Array.prototype.splice`.
   *
   * @method modelsSplice
   * @param {number} start Index from which to start removing/inserting.
   * @param {number} deleteCount Number of items to remove.
   * @param {...any} var_args Items to insert into array.
   * @return {Array} Array of removed items.
   */
  modelsSplice(start) {
    // var info = {};
    var models = this.modelsGet(),
      items = this.itemsGet(),
      itemsWrapper = this.itemsWrapper || this;
    // Normalize fancy native splice handling of crazy start values
    start = start < 0 ?
      models.length - Math.floor(-start) :
      start = Math.floor(start);
    if(!start) start = 0;
    var item,
      ret = models.splice.apply(models, arguments),
      deleteCount = ret.length,
      addedCount = Math.max(arguments.length - 2, 0);
    for(var i = 0; i < deleteCount; i++) {
      item = items[start + i];
      if(item) {
        delete item.parent;
        item.remove();
      }
    }
    var args,
      newItems = [];
    for(i = start; i < start + addedCount; i++) {
      item = this.make(models[i]);
      item.parent = this;
      newItems.push(item);
    }
    args = [start, deleteCount].concat(newItems);
    var beforeEl = items[start + deleteCount];
    items.splice.apply(items, args);
    while(newItems.length)
      itemsWrapper.insertBefore(newItems.shift(), beforeEl || null); // null = appendChild
    if(addedCount || ret.length)
      this._notifyChange('models', 'models-changed', models);
    return ret;
  },

  // convenience methods

  /**
   * clones a model
   *
   * @method copy
   * @param {object} [token=this.model] a model or an item with model property
   * @return {object} the cloned model
   */
  copy(token) {
    return _.cloneDeep(this.getModel(token || this.model));
  },

  /**
   * cuts a model from its parent and returns it
   *
   * @method cut
   * @param {object} [token=this.model] a model or an item with model property
   * @return {object} the cut model
   */
  cut(token) {
    var model = token === undefined ? this.model : this.getModel(token);
    this.delete();
    return model;
  },

  /**
   * cuts a model from its parent and returns it
   *
   * @method cut
   * @param {object} token a model or an item with model property
   * @return {object} cloned model
   */
  append( /* any number of type [model] or [item] */ ) {
    if(Polymer.isInstance(arguments[0]))
      for(var i = 0, models = []; i < arguments.length; i++)
        models.push(arguments[i].model);
    this.modelsPush.apply(this, models || arguments);
  },

  /**
   * inserts a model
   *
   * @method insert
   * @param {object} token a model or an item with model property
   * @param {object} o options for insertion
   * {number} o.index index to insert to
   * {model or item} o.before a model or an item with model property to insert
   *                 before. if o.index is specified, this will be igonred.
   * {boolean} o.copy if true, the model will be cloned.
   */
  insert(token, o /* object options */ ) {
    if(!token) return;
    o = o || {};
    var model = this.getModel(token);
    var index = typeof o.index == 'number' ? o.index : this.getIdx(o.before);
    if(o.copy) model = this.copy(model); // TODO(2) works for items without data
    this.modelsSplice(index, o.deleteCount || 0, model);
  },

  /**
   * deletes a model
   *
   * @method delete
   * @param {object} [token=this.model] a model or an item with model property
   */
  delete(token) {
    if(token === undefined) this.parent.delete(this.model);
    else this.modelsSplice(this.getIdx(token), 1);
  },

  /**
   * Notifies the database to store the changes made to an element property.
   * The first four arguments are similar to that of the Polymer's `observer`
   * method.
   *
   * @method notifyStore
   * @param {any} value current value of a property
   * @param {any} old value current value of a property
   * @param {string} name of a property of an element
   * @param {string} type of the property
   * @param {any} changes not develped yet
   */
  notifyStore(value, oldValue, property, type, changes) {
    this.fire('store-' + (type === undefined ? 'db' : type), {
      property,
      value,
      oldValue,
      changes,
      el: this
    }, {
      cancelable: false,
      _useCache: true,
      node: document
    });
  },

});

////////////////////////////////////////////////////////////////////////////////

// __

__.copyOwn = Polymer.Base.copyOwnProperty; // (propertyName, source, target)

// @extend (target, source)
// @mixin (target, source)

['mixin', 'extend', 'create'].forEach(function(method) {
  __[method] = Polymer.Base[method];
});
