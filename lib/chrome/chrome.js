var app = {};
app.parser = new window.DOMParser();
app.version = function () {return chrome.runtime.getManifest().version};

if (chrome.runtime.setUninstallURL) {
  var {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
}

app.storage = (function () {
  var objs = {};
  window.setTimeout(function () {
    chrome.storage.local.get(null, function (o) {
      objs = o;
      var script = document.createElement("script");
      script.src = "../common.js";
      document.body.appendChild(script);
    });
  }, 300);
  /*  */
  return {
    "read": function (id) {return objs[id]},
    "write": function (id, data) {
      var tmp = {};
      data = data + '';
      objs[id] = data;
      tmp[id] = data;
      chrome.storage.local.set(tmp, function () {});
    }
  }
})();

app.get = function (url, headers, data, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status >= 400 && xhr.status !== 500) callback('');
      else callback(xhr.responseText);
    }
  };
  /*  */
  xhr.open(data ? "POST" : "GET", url, true);
  for (var id in headers) xhr.setRequestHeader(id, headers[id]);
  if (data) {
    var arr = [];
    for (e in data) arr.push(e + "=" + data[e]);
    data = arr.join('&');
  }
  /*  */
  xhr.send(data ? data : '');
};

app.tab = {
  "open": function (url) {chrome.tabs.create({"url": url, "active": true})},
  "openOptions": function () {chrome.runtime.openOptionsPage(function () {})},
  "openGmail": function () {
    var gmailtab = false;
    chrome.tabs.query({}, function (tabs) {
      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab.url.indexOf("mail.google.") !== -1 || tab.url.indexOf("inbox.google.") !== -1) {
          chrome.tabs.reload(tab.id, function () {});
          chrome.tabs.update(tab.id, {"active": true}, function () {});
          gmailtab = true;
          break;
        }
      }
      /*  */
      if (!gmailtab) {
        var tmp = app.storage.read("gmail-inbox") === true || app.storage.read("gmail-inbox") === "true";
        var url = tmp ? "https://inbox.google.com/" : "https://mail.google.com/";
        chrome.tabs.create({"url": url});
      }
    });
  }
};

app.notification = function (title, text) {
  var notification = chrome.notifications.create('', {
    "title": title,
    "type": "basic",
    "message": text,
    "iconUrl": chrome.extension.getURL("data/icons/64.png")
  }, function () {});
  chrome.notifications.onClicked.addListener(function (e) {tab.open("chrome://flags/")});
};

app.play = (function () {
  var audio = new Audio();
  var canPlay = audio.canPlayType("audio/mpeg");
  audio.setAttribute("src", chrome.runtime.getURL("data/beep.ogg"));
  if (!canPlay) {
    audio = document.createElement("iframe");
    document.body.appendChild(audio);
  }
  /*  */
  return function (url) {
    if (canPlay) audio.play();
    else {
      audio.removeAttribute('src');
      audio.setAttribute('src', url);
    }
  }
})();

app.button = (function () {
  var callback;
  chrome.browserAction.onClicked.addListener(function (tab) {if (callback) callback()});
  /*  */
  return {
    set badgeFont (val) {},
    "onContext": function () {},
    "onCommand": function (c) {callback = c},
    set label (val) {chrome.browserAction.setTitle({"title": val})},
    set badge (val) {chrome.browserAction.setBadgeText({"text": (val ? val : '') + ''})},
    set badgeColor (val) {chrome.browserAction.setBadgeBackgroundColor({"color": (val ? val : "#FF0000")})}
  }
})();

app.popup = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'popup-to-background') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data, tabId) {
      chrome.runtime.sendMessage({"path": 'background-to-popup', "method": id, "data": data});
    }
  }
})();

app.options = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path === 'options-to-background') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data, tabId) {
      chrome.runtime.sendMessage({"path": 'background-to-options', "method": id, "data": data});
    }
  }
})();

var urls = [
  "*://*.gstatic.com/*", "*://gstatic.com/*",
  "*://*.apis.google.com/*", "*://apis.google.com/*",
  "*://*.mail.google.com/*", "*://mail.google.com/*",
  "*://*.accounts.google.com/*", "*://accounts.google.com/*",
  "*://*.accounts.youtube.com/*", "*://accounts.youtube.com/*"
];

chrome.webRequest.onBeforeRequest.addListener(function (info) {
  var flag_1 = info.tabId < 0;
  var flag_2 = info.type === "sub_frame";
  var flag_3 = info.url.indexOf("accounts.google.") !== -1;
  /*  */
  if (flag_1 && flag_2 && flag_3) {
    app.notification("Login", "Please login to your Gmail account first, then try again.");
    app.tab.open("https://mail.google.com/");
    return {"cancel": true};
  }
}, {"urls": urls}, ["blocking"]);


/*  Remove Fake User Agent */

/* chrome.webRequest.onBeforeSendHeaders.addListener(function (info) {
  if (info.tabId > -1) return;
  var headers = info.requestHeaders;
  for (var i = 0; i < headers.length; i++) {
    var name = headers[i].name.toLowerCase();
    if (name === 'user-agent') {
      headers[i].value = 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X) AppleWebKit/601.1 (KHTML, like Gecko) CriOS/47.0.2526.70 Mobile/13C71 Safari/601.1.46';
    }
  }
  return {"requestHeaders": headers};
}, {"urls": urls}, ["blocking", "requestHeaders"]); */

chrome.webRequest.onHeadersReceived.addListener(function (info) {
  if (info.tabId > -1) return;
  var headers = info.responseHeaders;
  for (var i = 0; i < headers.length; i++) {
    var name = headers[i].name.toLowerCase();
    if (name === 'x-frame-options' || name === 'frame-options') {
      headers.splice(i, 1);
      return {"responseHeaders": headers};
    }
  }
}, {"urls": urls}, ["blocking", "responseHeaders"]);
