var isActivate = false;
var handler = null;
var mode = '';
var interval = 1;
var tabId = null;
var groupId = null;
var windowId = null;

chrome.storage.local.get(['interval'], function(result) {
  interval = parseInt(result.key ?? 3);
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    switch (request.type) {
      case 'isActivate': sendResponse({ isActivate }); break;
      case 'interval': sendResponse({ interval }); break;
      case 'mode': sendResponse({ mode }); break;
      case 'start': sendResponse({ isActivate: start(request) }); break;
      case 'stop': sendResponse({ isActivate: stop(request) }); break;
      default: sendResponse({ type: request.type });
    }
  }
);

function start(request) {
  if (isActivate) {
    return true;
  }

  isActivate = true;
  mode = request.mode;
  interval = parseInt(request.interval);
  tabId = parseInt(request.tabId);
  groupId = parseInt(request.groupId);
  windowId = parseInt(request.windowId);

  chrome.storage.local.set({ interval: interval }, function() {});

  handler = setInterval(function () {
    tick();
  }, interval * 1000);

  var intervalText = '';
  if (interval >= 60) {
    intervalText = (interval / 60) + 'm';
  } else {
    intervalText = interval + 's';
  }

  chrome.action.setBadgeBackgroundColor({ color: '#008800' });
  chrome.action.setBadgeText({text: intervalText});

  return true;
}

function stop() {
  if (handler !== null) {
    clearInterval(handler);
    handler = null;
  }

  isActivate = false;

  chrome.action.setBadgeBackgroundColor({ color: '#880000' });
  chrome.action.setBadgeText({text: ""});

  return false;
}

async function tick() {
  var tabs = [];
  if (mode === 'pinned') {
    tabs = await getAllPinned(windowId);
    if (tabs.length === 0) {
      mode = 'window'
    }
  }

  if (mode === 'group') {
    tabs = await getAllInGroup(windowId, groupId);

    if (tabs.length === 0) {
      groupId = -1;
      mode = 'window'
    }
  }

  if (mode === 'window') {
    tabs = await getAllInWindow(windowId);
  }

  var found = null;
  for (var index = 0; index < tabs.length; index++) {
    if (tabs[index].id === tabId) {
      found = index;
      break;
    }
  }

  if (found === null) {
    this.stop();
  } else if (found === tabs.length - 1) {
    found = 0;
  } else {
    found++;
  }

  if (found !== null && tabs && tabs[found]) {
    tabId = tabs[found].id;
    chrome.tabs.update(tabId, {'active': true});
  }
}

function getAllInWindow(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ windowId: windowId }, function (result) {
      resolve(result);
    });
  });
}

function getAllInGroup(windowId, groupId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ windowId: windowId }, function (result) {
      resolve(result.filter(e => e.groupId === groupId));
    });
  });
}

function getAllPinned(windowId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ windowId: windowId }, function (result) {
      resolve(result.filter(e => e.pinned));
    });
  });
}