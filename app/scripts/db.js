/**
 * This section will be replaced with a proper database most likely couchdb.
 * @module db
 * @memberof $$
 */

(function(_, _chrome, calcType, Timer, fire, parseJSON, env, workspace) {

  const __data__ = Object.create(null);
  workspace = workspace || 'home';
  let saveTimer,
    model = load(workspace + 'Model');

  function requestHandler(e) {
    let action = e.detail.name,
      info = e.detail.data,
      path = info.gid.split('.');
    switch(path[0]) {
      case 'chrome':
        switch(path[1]) {
          case 'bookmarks':
            switch(action) {
              case 'move':
                _chrome.bookmarks.move(info);
                break;
              case 'remove':
                _chrome.bookmarks.remove(info);
                break;
              case 'delete':
                _chrome.bookmarks.delete(info);
                break;
                // default:
            }
            break;
            // default:
        }
        break;
        // default:
    }
  }

  function store(/*e*/) {
    saveTimer.refresh(100);
  }

  function get(gid) {
    if(!gid) return console.log('!no gid specified.');
    let data = _.get(__data__, gid);
    return data !== undefined ? data :
      _.get(__data__, calcType(gid)) ? 'none' : null;
  }

  function set(gid, item) {
    _.set(__data__, gid, item);
  }

  function remove(gid) {
    set(gid, undefined);
    fire('signal', { name: 'db-' + gid });
  }

  function save(key, value, raw) {
    console.log('saving', key); // TODO(production) uncomment
    try {
      if(value === null || value === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, raw ? value : JSON.stringify(value));
      }
    } catch(ex) {
      // Happens in Safari incognito mode
      this.errorMessage = ex.message;
      console.error('localStorage could not be saved.', ex);
    }
  }
  /**
   * loads value from local storage
   * @param {string=} key
   */
  function load(key) {
    return parseJSON(window.localStorage.getItem(key));
  }

  // a   url (naming it a, beacause it will be reused to store callbacks)
  // xhr placeholder to avoid using var, not to be used
  function ajaxRequest(a, xhr) {
    xhr = new XMLHttpRequest();

    // Open url
    xhr.open('GET', a);

    // Reuse a to store callbacks
    a = [];

    // onSuccess handler
    // onError   handler
    // cb, data  placeholder to avoid using var, should not be used
    xhr.onreadystatechange = xhr.then = function(onSuccess, onError, cb, data) {

      // Test if onSuccess is a function
      if(onSuccess && onSuccess.call) a = [, onSuccess, onError];

      // Test if request is complete
      if(xhr.readyState == 4) {

        // index will be:
        // 0 if undefined
        // 1 if status is between 200 and 399
        // 2 if status is over
        cb = a[0 | xhr.status / 200];

        // Safari doesn't support xhr.responseType = 'json'
        // so the response is parsed
        if(cb) {
          try {
            data = JSON.parse(xhr.responseText);
          } catch(e) {
            data = null;
          }
          cb(data, xhr);
        }
      }
    };

    // Send
    xhr.send();

    // Return request
    return xhr;
  }

  // initialize

  _chrome.bookmarks.init();
  _chrome.management.init();
  _chrome.sessions.init();
  _chrome.topSites.init();
  let xhr;
  if(model) {
    set('model', model);
    saveTimer = Timer(save, null, workspace + 'Model', model); // reduces number of saves
  } else {
    xhr = ajaxRequest('../default-model.json');
    xhr.onload = e => {
      model = parseJSON(e.target.response);
      console.log('model reseted!');
      set('model', model);
      saveTimer = Timer(save, 1000, workspace + 'Model', model);
      let root = document.getElementById('root');
      root && root.init && root.init();
    };
  }

  document.addEventListener('db-request', requestHandler);
  document.addEventListener('store-db', store);

  Object.assign($$.db, {get, set, remove });

}(_, $$.chrome, $$.app.calcType, __.Timer, __.fire, __.parseJSON,$$.app.env,
  $$.app.workspace));
