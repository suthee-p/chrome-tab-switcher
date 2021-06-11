document.addEventListener('DOMContentLoaded', function() {
  var currentTab = null;
  var isGroup = false;
  var isPin = false;
  var isActivate = false;
  var interval = 5;
  var mode = '';

  async function prepareUI() {
    currentTab = await getCurrentTab();
    if (!currentTab) {
      // TODO:
      return;
    }

    if (currentTab.groupId > -1) {
      isGroup = true;
    }
    isPin = currentTab.pinned;

    isActivate = await getIsActivate();
    interval = parseInt(await getInterval());
    mode = await getMode();

    // update UI
    document.getElementById('btn-toggle').textContent = isActivate ? 'Stop' : 'Start';
    document.getElementById('select-interval').value = interval;

    let select = document.getElementById('select-scope');
    select.innerHTML = '<option value="window">Current Window</option>';
    var modes = ['window'];

    if (isGroup) {
      var opt = document.createElement('option');
      opt.value = 'group'
      opt.appendChild( document.createTextNode('Current Group') );
      select.appendChild(opt);
      modes.push('group');
    }

    if (isPin) {
      var opt = document.createElement('option');
      opt.value = 'pinned'
      opt.appendChild( document.createTextNode('Pinned Only') );
      select.appendChild(opt);
      modes.push('pinned');
    }

    for (var index = 0; index < modes.length; index++) {
      if (modes[index] === mode) {
        document.getElementById('select-scope').options[index].selected = true;
      }
    }
  }
  
  function getCurrentTab() {
    return new Promise((resolve, reject) => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (result) {
        resolve(result ? result[0] : null);
      });
    });
  }

  function getIsActivate() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "isActivate" }, function(response) {
        resolve(response.isActivate);
      });
    });
  }

  function getInterval() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "interval" }, function(response) {
        resolve(response.interval);
      });
    });
  }

  function getMode() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "mode" }, function(response) {
        resolve(response.mode);
      });
    });
  }

  function start(params) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: "start",
        mode: document.getElementById('select-scope').value,
        interval: Math.max(1, parseInt(document.getElementById('select-interval').value)),
        tabId: currentTab.id,
        groupId: currentTab.groupId,
        windowId: currentTab.windowId,
      }, function(response) {
        resolve(response.isActivate);
      });
    });
  }

  function stop(params) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: "stop" }, function(response) {
        resolve(response.isActivate);
      });
    });
  }
  
  prepareUI();

  document.getElementById('btn-toggle').addEventListener('click', async function() {
    if (isActivate) {
      isActivate = await stop();
    } else {
      isActivate = await start({ interval: 3000 });
    }

    document.getElementById('btn-toggle').textContent = isActivate ? 'Stop' : 'Start';
  }, false);
}, false);