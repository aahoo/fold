/**
 * Namespace for variety of module to handle Chrome-related features
 * @namespace chrome
 */

$$.chrome = {};

/**
 * Handles all the functions related to chrome.tabs category
 * @module tabs
 */
$$.chrome.tabs = {

  /**
   * Fetches the information about the currently active tab and passes them to
   * the callback function.
   * @method getCurrentInfo
   *
   * @param {function} callback called with the `url` and `title` of the current
   * tab
   */
  getCurrentInfo: function(callback) {
    chrome.tabs.query({ 'active': true, 'currentWindow': true },
      tabs => callback(tabs[0].url, tabs[0].title));
  },

  /**
   * Opens special links.
   * @method open
   *
   * @param {object} o options
   * @param {boolean} newtab if true opens the link in newtab
   * @param {function} callback
   */
  open: function(o = {}, newtab, callback) {
    newtab ?
      chrome.tabs.create(o, callback) :
      chrome.tabs.query({ active: true },
        tab => chrome.tabs.update(tab.id, o, callback));
  },

};

// chrome.bookmarks

$$.chrome.bookmarks = $$.chrome.bookmarks || {};

(function($$, _, db, calcId, fire) {

  let calcGid = id => 'chrome.bookmarks' + (id === 0 || id ? '.' + id : '');

  function init() {
    sync('0', true);
    listeners();
  }

  function listeners() {
    chrome.bookmarks.onCreated.addListener((id, node) => sync(node.parentId, true));
    chrome.bookmarks.onRemoved.addListener((id, i) => {
      removeTree([calcGid(id)]);
      sync(i.parentId, true);
    });
    chrome.bookmarks.onMoved.addListener((id, i) => {
      sync(id);
      if(i.parentId !== i.oldParentId) sync(i.parentId);
      sync(i.oldParentId);
    });
    chrome.bookmarks.onChanged.addListener((id /*, i*/ ) => sync(id));
  }

  function sync(id, syncRecent) {
    chrome.bookmarks.getSubTree(id, tree => {
      if(id === '0') {
        db.set(calcGid(), {}); // resetting the db
        tree[0].title = 'Bookmarks';
        // console.log('bookmarks loaded.'); TODO(production) uncomment
      }
      _.forOwn(toMap(tree), i => db.set(i.gid, i));
      fire('signal', { name: 'db-' + calcGid(id) });
      if(syncRecent) {
        chrome.bookmarks.getRecent(10, re => {
          let _map = toMap([{
            id: 'recent',
            title: 'Recent Bookmarks',
            children: re,
          }]);
          let old = db.get(calcGid('recent')).children;
          if(!old || (old && old.join('') !== re.map(b => b.gid).join(''))) {
            _.forOwn(_map, i => db.set(i.gid, i));
            fire('signal', { name: 'db-' + calcGid('recent') });
          }
        });
      }
    });
    return true;
  }

  function move(info) {
    let parentId = calcId(info.dest.parentId);
    if(isNaN(parentId)) return;
    chrome.bookmarks.move(calcId(info.gid), { parentId, index: info.dest.index });
  }

  function remove(info) {
    let isFolder = db.get(info.gid).children; // folder
    chrome.bookmarks['remove' + (isFolder ? 'Tree' : '')](calcId(info.gid));
  }

  // function remove(info) {
  //   chrome.bookmarks.search({ title: 'Bin' }, results => {
  //     let bin = results.find(i => i.parentId == '2'),
  //       id = calcId(info.gid),
  //       parentId = db.get(info.gid).parentId;
  //
  //     if(bin) {
  //       if(calcGid(bin.id) == info.gid || bin.id == parentId)
  //         chrome.bookmarks.removeTree(bin.id);
  //       else {
  //         parentId = bin.id;
  //         chrome.bookmarks.move(id, { parentId });
  //       }
  //     } else {
  //       chrome.bookmarks.create({ title: 'Bin' }, bin => {
  //         let callback = () => chrome.bookmarks.move(id, { parentId: bin.id });
  //         // a delay is needed so that the folder has enough time for rendering
  //         window.setTimeout(callback, 50);
  //       });
  //     }
  //   });
  // }

  function toMap(tree) {
    return __.treeToMap(tree, {
      preProcess: child => child.gid = calcGid(child.id),
      postProcess: (child/*, parent*/) => {
        child.children = child.children.map(child => child.gid);
        // if(parent) parent.hasChildFolder = true;
      },
    });
  }

  function removeTree(gids) {
    if(!gids) return;
    gids.forEach(gid => {
      removeTree(db.get(gid).children);
      db.remove(gid);
    });
  }

  Object.assign($$, { init, move, remove });

}($$.chrome.bookmarks, _, $$.db, $$.app.calcId, __.fire));

// chrome.management

$$.chrome.management = $$.chrome.management || {};

(function($$, db, fire) {

  let calcGid = id => 'chrome.management' + (id === 0 || id ? '.' + id : '');

  function init() {
    sync('all');
    listeners();
  }

  function listeners() {
    chrome.management.onInstalled.addListener(sync);
    chrome.management.onUninstalled.addListener(sync);
    chrome.management.onEnabled.addListener(sync);
    chrome.management.onDisabled.addListener(sync);
  }

  function sync(token) {
    let id = token === undefined ? 'all' :
      token.id !== undefined ? token.id :
      token;
    // if(id == 'all') {
    chrome.management.getAll(function(all) {
      // let extensions = result.filter(i => i.type == 'extension');
      let isApp = i => i.type != 'extension' && i.type != 'theme';
      all.unshift({
        id: 'ahfgeienlihckogmohjhadlkjgocpleb',
        name: 'Chrome Web Store',
        shortName: 'Web Store',
        isApp: true,
        enabled: true,
        appLaunchUrl: 'https://chrome.google.com/webstore',
        type: 'hosted_app',
        icons: [16, 32, 64, 128].map(s => ({
          size: s,
          url: `chrome://extension-icon/ahfgeienlihckogmohjhadlkjgocpleb/${s}/1`
        })),
      });
      all.forEach(i => i.gid = calcGid(i.id));
      all.push({
        id: 'disabled_apps',
        gid: calcGid('disabled_apps'),
        name: 'Disabled Chrome Apps',
        title: 'Disabled',
        isApp: true,
        enabled: true,
        type: 'app.folder',
        children: all.filter(i => isApp(i) && !i.enabled).map(a => a.gid),
      });
      all.push({
        id: 'apps',
        gid: calcGid('apps'),
        name: 'Chrome Apps',
        title: 'Apps',
        isApp: true,
        enabled: true,
        type: 'app.folder',
        children: all.filter(i => isApp(i) && i.enabled).map(a => a.gid),
      });
      db.set(calcGid(), {}); // resetting the db
      all.forEach(i => db.set(i.gid, i));
      fire('signal', { name: 'db-' + calcGid() });
      if(id != 'all') fire('signal', { name: 'db-' + calcGid(id) });
      // console.log('extensions loaded.'); TODO(production) uncomment
    });
    // }
    return true;
  }

  Object.assign($$, { init });

}($$.chrome.management, $$.db, __.fire));

// chrome.sessions

$$.chrome.sessions = $$.chrome.sessions || {};

(function($$, _, db, fire) {

  let calcGid = id => 'chrome.sessions' + (id === 0 || id ? '.' + id : '');

  function init() {
    sync();
    listeners();
  }

  function listeners() {
    chrome.sessions.onChanged.addListener(syncRecentlyClosed);
  }

  function sync() {
    syncDevices();
    syncRecentlyClosed();
  }

  // get devices
  function syncDevices() {
    chrome.sessions.getDevices({ /* maxResults: 10 */ }, devices => {
      let all = [],
        root = [];
      if(devices.length == 1)
        root = getTabs(devices[0].sessions.slice(0, 10), 'devices.');
      else devices.forEach((d, idx) => {
        let tabs = getTabs(d.sessions.slice(0, 10), 'devices.');
        all.push(...tabs);
        root.push({
          gid: calcGid('devices.' + d.deviceName + idx),
          title: d.deviceName,
          children: tabs.map(t => t.gid),
        });
        delete d.sessions;
      });
      all.push(...root, {
        gid: calcGid('devices.folder'),
        title: 'Devices',
        children: root.map(d => d.gid),
      });
      db.set(calcGid('devices'), {}); // resetting the db
      all.forEach(i => db.set(i.gid, i));
      fire('signal', { name: 'db-' + calcGid('devices') });
    });
  }

  // get recently closed tabs
  function syncRecentlyClosed() {
    chrome.sessions.getRecentlyClosed({ /* maxResults: 25 */ }, sessions => {
      let all = getTabs(sessions.slice(0, 10), 'closed.');
      all.push({
        gid: calcGid('closed.folder'),
        title: 'Recently Closed',
        children: all.map(c => c.gid),
      });
      db.set(calcGid('closed'), {}); // resetting the db
      all.forEach(i => db.set(i.gid, i));
      fire('signal', { name: 'db-' + calcGid('closed') });
    });
  }

  function getTabs(sessions, id) {
    let allTabs = [];
    sessions.forEach(s => {
      let tabs = s.tab ? [s.tab] : s.window.tabs;
      allTabs.push(..._.each(tabs, t => {
        t.gid = calcGid(id +
          `s${t.sessionId}_w${t.windowId}_t${t.index}`);
      }));
    });
    return allTabs;
  }

  Object.assign($$, { init });

}($$.chrome.sessions, _, $$.db, __.fire));

// chrome.topSites

$$.chrome.topSites = $$.chrome.topSites || {};

(function($$, db, fire) {

  let calcGid = id => 'chrome.topSites' + (id === 0 || id ? '.' + id : '');

  function init() {
    sync();
  }

  function sync() {
    if(!chrome.topSites) return;
    chrome.topSites.get(top => {
      db.set(calcGid(), {}); // resetting the db
      top.forEach((i, index) => {
        i.gid = calcGid(index);
        db.set(i.gid, i);
      });
      db.set(calcGid('folder'), {
        gid: calcGid('folder'),
        title: 'Most Visited',
        children: top.slice(0, 10).map(i => i.gid),
      });
      fire('signal', { name: 'db-' + calcGid() });
    });
  }

  Object.assign($$, { init });

}($$.chrome.topSites, $$.db, __.fire));
