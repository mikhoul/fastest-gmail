var background = (function () {
  var _tmp = {};
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    for (var id in _tmp) {
      if (_tmp[id] && (typeof _tmp[id] === "function")) {
        if (request.path == 'background-to-popup') {
          if (request.method === id) _tmp[id](request.data);
        }
      }
    }
  });
  /*  */
  return {
    "receive": function (id, callback) {_tmp[id] = callback},
    "send": function (id, data) {chrome.runtime.sendMessage({"path": 'popup-to-background', "method": id, "data": data})}
  }
})();

background.receive("load", function (url) {
  var iframe = document.getElementById("popup-iframe");
  if (iframe.src === "about:blank") iframe.src = url;
});

background.receive("resize", function (o) {
  if (document.location.href.indexOf("panel.html") !== -1) {
    document.body.style.width = o.width + "px";
    document.body.style.height = o.height + "px";
    document.documentElement.style.width = o.width + "px";
    document.documentElement.style.height = o.height + "px";
  }
});

background.send("load");
background.send("resize");
