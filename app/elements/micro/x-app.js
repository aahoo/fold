/**
Chrome apps are discontinued and hence will be removed from here.
*/

Polymer({
  is: 'x-app',
  extends: 'a',
  behaviors: [Polymer.Behaviros.Data],
  hostAttributes: {
    class: 'app item li bgicon label btn',
    draggable: 'true',
    ctrls: '',
  },

  attached() {
    this.isRoot = $$.app.checkRoot(this);
    if(this.model) this.dataInit(true);
    this.onclick = this.tap;
  },

  dataObserver(data) {
    if(data) __.assignDeep(this, this.getDataModel(data));
  },

  tap(e) {
    if(__.ePrevent(e)) return;
    let url = this.data.appLaunchUrl;
    if(url && this.data.launchType === 'OPEN_AS_REGULAR_TAB') return; // @app.js
    __.ePrevent(e, true);
    chrome.management.launchApp(this.data.id);
    if($$.app.env == 'popup') window.close();
  },

  getDataModel(data) {
    let url = data.icons.find(i => i.size >= 24).url +
      (data.enabled ? '' : '?grayscale=true');
    return {
      gid: data.gid,
      href: data.appLaunchUrl || undefined,
      textContent: data.shortName.replace('Google ', ''),
      style: {
        backgroundImage: `url(${url})`,
      },
    };
  },

});
