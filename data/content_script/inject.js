var setTimeoutInit, setTimeoutNotification;

var background = (function () {
  return {
    "send": function (id, data) {
      chrome.runtime.sendMessage({"path": 'popup-to-background', "method": id, "data": data});
    }
  }
})();

var init = function () {
  var protocol = document.location.protocol;
  if (protocol !== "http:" && protocol !== "https:") return;
  /*  */
  if (setTimeoutInit) window.clearTimeout(setTimeoutInit);
  setTimeoutInit = window.setTimeout(function () {
    var observer = new MutationObserver(function (e) {
      var cvcmsgbod = document.querySelector('div[id*="cvcmsgbod_"]');
      if (cvcmsgbod) {
        var height = window.getComputedStyle(cvcmsgbod).height;
        if (height) document.getElementById("views").style.height = height;
      }
      /*  */
      if (setTimeoutNotification) window.clearTimeout(setTimeoutNotification);
      setTimeoutNotification = window.setTimeout(function () {
        background.send("check-notifications");
        background.send("gmail-account-inbox", document.location.href);
      }, 3000);
    });
    /*  */
    var views = document.getElementById("views");
    var tltbt = document.getElementById('tltbt') || views;
    if (views) observer.observe(views, {"subtree": true, "childList": true});
    if (tltbt) {
      var compose = tltbt.querySelector("div[aria-label='Compose']") || tltbt.querySelector("div[aria-label='compose']");
      if (compose) {
        compose = compose.parentNode;
        var styleElement = function (elm, str, right) {
          compose.parentNode.appendChild(elm);
          /*  */
          elm.style.right = right;
          elm.classList.add("extra-gmail-class");
          elm.firstChild.setAttribute("aria-label", '');
          elm.firstChild.classList.add("extra-gmail-buttons");
          var tmp = "#7A7A7A url(" + chrome.runtime.getURL('') + "data/content_script/buttons/" + str + ".png)" + " no-repeat center center";
          elm.firstChild.firstChild.style.background = tmp;
          /*  */
          elm.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            background.send("open-" + str);
          }, true);
        };
        /*  */
        styleElement(compose.cloneNode(true), "gmail", "37px");
        styleElement(compose.cloneNode(true), "home", "105px");
        styleElement(compose.cloneNode(true), "setting", "71px");
        compose.firstChild.classList.add("extra-compose-class");
      }
      /*  */
      var refresh = tltbt.querySelector("div[aria-label='Refresh']") || tltbt.querySelector("div[aria-label='refresh']");
      if (refresh) {
        var reload = refresh.cloneNode(true);
        refresh.parentNode.appendChild(reload);
        reload.textContent = "Reload";
        reload.setAttribute("onclick", '');
        reload.setAttribute("aria-label", '');
        reload.setAttribute("class", 'extra-reload-class');
        /*  */
        reload.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          document.location.reload();
        }, true);
      }
    }
    /*  */
    window.addEventListener("click", function (e) {
      var attach = document.querySelector('div[aria-label="Attach a file"]') || document.querySelector('div[aria-label="attach a file"]');
      if (attach) {
        attach = attach.parentNode.parentNode.parentNode;
        if (!attach.contains(e.target)) attach.parentNode.removeChild(attach);
      }
    });
  }, 3000);
  /*  */
  var blpromo = document.querySelector('div[id="blpromo"]');
  if (blpromo) {
    var onclicks = blpromo.querySelectorAll('[onclick*="_e(event,"]');
    for (var i = 0; i < onclicks.length; i++) {
      var role = onclicks[i].getAttribute('role');
      var ariaLabel = onclicks[i].getAttribute('aria-label');
      if (!role && !ariaLabel) onclicks[i].click();
    }
  }
  /*  */
  var isppromo = document.querySelector('div[id="isppromo"]');
  if (isppromo) {
    var onclicks = isppromo.querySelectorAll('[onclick*="_e(event,"]');
    for (var i = 0; i < onclicks.length; i++) {
      var role = onclicks[i].getAttribute('role');
      var tabindex = onclicks[i].getAttribute('tabindex');
      if (!role && tabindex !== "0") onclicks[i].click();
    }
  }
  /*  */
  window.removeEventListener("load", init, false);
};

window.addEventListener("load", init, false);
document.addEventListener("DOMContentLoaded", function () {
  background.send("check-notifications");
}, false);
