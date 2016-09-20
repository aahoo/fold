/**
`x-bookmarker` bookmarks the current tab when opened in popup mode.
*/

Polymer({
  is: 'x-bookmarker',
  extends: 'a',
  hostAttributes: {
    class: 'label li inline',
  },
  behaviors: [Polymer.Behaviros.Signals],

  attached() {
    this.listen(this, 'signal-db-' + this.calcGid('recent'), 'bookmark');
    this.bookmark();
  },

  bookmark(e) {
    let gid = this.calcGid;
    const callback = (data) => {
      let parent = $$.db.get(gid(data.parentId));
      let path = [parent.title];
      if(!['0', '1', '2', '3'].has(parent.id))
        path.unshift('... / ' + $$.db.get(gid(parent.parentId)).title);
      this.textContent = path.join(' / ') + ' / ';
      if(this.parent) this.parent.modelsSplice(1, 1, {
        is: 'x-button',
        gid: gid(data.id),
      });
    };
    let lastBookmark = $$.db.get($$.db.get(gid('recent')).children[0]),
      lastFolder = $$.db.get(gid(lastBookmark.parentId));
    $$.chrome.tabs.getCurrentInfo((url, title) => {
      chrome.bookmarks.search({ url }, bookmarked => {
        if(bookmarked[0]) callback(bookmarked[0]);
        else if($$.app.env == 'popup' && !e)
          chrome.bookmarks.create({ parentId: lastFolder.id, title, url },
            callback);
        else callback(lastBookmark);
      });
    });
  },

  detached() {
    this.unlisten(this, 'signal-db-' + this.calcGid('recent'), 'bookmark');
  },

  calcGid(id) {
    return 'chrome.bookmarks.' + id;
  },

});
