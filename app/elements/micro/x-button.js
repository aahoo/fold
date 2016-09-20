/**
`x-button` is primarily used to display bookmarks in a list view i.e. icon with
label and button behaviors.
*/

Polymer({
  is: 'x-button',
  extends: 'a',
  properties: {
    class: { type: String, reflectToAttribute: true },
    draggable: { type: String, reflectToAttribute: true },
  },
  behaviors: [Polymer.Behaviros.Data],

  attached() {
    this.isRoot = $$.app.checkRoot(this);
    if(this.gid && this.model) this.dataInit(true);
  },

  dataObserver(data) {
    if(data) __.assignDeep(this, this.getDataModel(data));
  },

  getViewModel() {
    if(!this.clss('folder-button')) return {
      class: 'label btn li bookmark item bgicon',
      draggable: 'true',
    };
  },

  getDataModel(data) {
    let model = {
      textContent: (data.path ? data.path + ' / ' : '') + data.title,
    };
    if(data.url) {
      model.href = data.url;
      model.style = {
        backgroundImage: `url(chrome://favicon/size/16@2x/${data.url})`,
      };
    }
    return model;
  },

});
