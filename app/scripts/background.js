/**
This code is not used yet.
*/

'use strict';

// TODO(some day) badge might be useful
// chrome.browserAction.setBadgeText({ text: '1' });

console.log('background.js! Event Page for Browser Action');

function updateIcon(tabId, state) {
  state ?
    chrome.pageAction.setIcon({
      tabId: tabId,
      path: { 19: 'images/icon-19.png', 38: 'images/icon-38.png' }
    }) :
    chrome.pageAction.setIcon({
      tabId: tabId,
      path: { 19: 'images/icon-grey-19.png', 38: 'images/icon-grey-38.png' }
    });
}

function getCurrentTab(cb) {
  chrome.tabs.query({ 'active': true, 'currentWindow': true }, tabs => cb(tabs[0]));
}

function isBookmarked(tab) {
  if(!tab) return;
  // chrome.pageAction.show(tab.id);
  chrome.bookmarks.search({ url: tab.url }, r => updateIcon(tab.id, r.length > 0));
}

// chrome.runtime.onStartup.addListener(function() {
// });

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  isBookmarked(tab);
});

chrome.tabs.onActivated.addListener((/*info*/) => {
  getCurrentTab(isBookmarked);
});

chrome.bookmarks.onCreated.addListener((/*id, node*/) => {
  getCurrentTab(isBookmarked);
});

chrome.bookmarks.onRemoved.addListener((/*id, removeInfo*/) => {
  getCurrentTab(isBookmarked);
});

chrome.bookmarks.onChanged.addListener((/*id, changeInfo*/) => {
  getCurrentTab(isBookmarked);
});
