var CIT = config.interval.time;
var badgelabel = 'Gmail Notifier + (Inbox Overview) \n';
var timerid, emailids = [], count = 0, desktopCount = 0;
var setBadgeColor = function () {app.button.badgeColor = config.badge.color};

window.setTimeout(function () {
  var version = config.welcome.version;
  if (!version) {
    app.tab.open(config.welcome.url + '?v=' + app.version() + "&type=install");
    config.welcome.version = app.version();
  }
}, config.welcome.timeout);

var getcount = function (txt) {
  var valid = function (id) {
    for (var i = 0; i < emailids.length; i++) {
      if (emailids[i] === id) return false;
    }
    return true;
  };
  /*  */
  badgelabel = 'Gmail Notifier + (Inbox Overview) \n';
  var feed = app.parser.parseFromString(txt, 'text/xml');
  if (feed) {
    var entry = feed.querySelectorAll("entry");
    for (var i = 0; i < entry.length; i++) {
      var id = entry[i].getElementsByTagName("id");
      if (id.length) {
        id = id[0].textContent;
        var author = entry[i].getElementsByTagName("author")[0];
        var title = entry[i].getElementsByTagName("title")[0].textContent;
        var text = entry[i].getElementsByTagName("summary")[0].textContent;
        var name = author ? author.getElementsByTagName("name")[0].textContent : "No Author";
        if (i < 20) badgelabel = badgelabel + ' \n' + (i + 1) + '. ' + name + ' - ' + (title ? title.substr(0, 50) : text.substr(0, 50));
        app.button.label = badgelabel;
        /*  */
        if (valid(id)) {
          emailids.push(id);
          if (desktopCount < config.gmail.desktopCount) {
            if (config.gmail.notification) app.notification((name + ' - ' + title), text);
            if (config.gmail.beep) app.play();
            desktopCount++;
          }
        }
      }
    }
  }
  var fullcount = 0;
  var arr = feed.getElementsByTagName("fullcount");
  if (arr && arr.length) {
    var tmp = arr[0].textContent;
    if (tmp) fullcount = parseInt(tmp) || 0;
  }
  /*  */
  return fullcount;
};

var check = function () {
  var gmailurl = [], gmailurl_valid = [];
  var feed = "https://mail.google.com/mail/u/0/feed/atom";
  var action = function (e, callback) {
    app.get(e, {}, null, function (itm) {
      if (itm) {
        itm = itm.toLowerCase();
        var flag = itm.indexOf("unauthorized") === -1 && itm.indexOf("error") === -1;
        if (flag) gmailurl_valid.push(itm);
      }
      if (gmailurl.length > 0) action(gmailurl.shift());
      else callback(gmailurl_valid);
    });
  };
  /*  */
  gmailurl.push(feed + '?rand=' + Math.round(Math.random() * 100000000));
  var labels = config.gmail.label.split(',').map(function (label) {return label.trim()}).filter(function (label) {return label});
  labels.forEach(function (e, i) {gmailurl.push(feed + '/' + e.toLowerCase().replace(/\ +/g, '-') + '?rand=' + Math.round(Math.random() * 100000000))});
  /*  */
  action(gmailurl.shift(), function (arr) {
    if (arr.length === 0) CIT = 1800; /* 30 min, if not logged-in */
    var notificationCount = arr.map(getcount).reduce(function (p, c) {return p + c}, 0);
    if (notificationCount !== count) {
      count = notificationCount;
      if (count <= 0) count = '';
      if (count > 999) count = '999+';
      app.button.badge = count + '';
      app.button.label = badgelabel;
      if (config.popup.show === false) app.popup.send("reload-ui");
    }
    desktopCount = 0;
  });
  /*  */
  if (timerid) window.clearTimeout(timerid);
  timerid = window.setTimeout(check, 1000 * CIT);
};

app.popup.receive("check-notifications", function () {
  CIT = config.interval.time;
  check();
});

app.popup.receive("gmail-account-inbox", function (url) {
  var flag = [];
  url = url.toLowerCase();
  flag.push(url.indexOf('inbox') !== -1 && url.indexOf('inbox/') === -1);
  flag.push(url.indexOf('starred') !== -1 && url.indexOf('starred/') === -1);
  flag.push(url.indexOf('archives') !== -1 && url.indexOf('archives/') === -1);
  flag.push(url.indexOf('important') !== -1 && url.indexOf('important/') === -1);
  flag.push(url.indexOf('all%20mail') !== -1 && url.indexOf('all%20mail/') === -1);
  flag.push(url.indexOf('sent%20mail') !== -1 && url.indexOf('sent%20mail/') === -1);
  flag.push(url.indexOf('from%20circles') !== -1 && url.indexOf('from%20circles/') === -1);
  flag.push(url.indexOf('smartlabel_personal') !== -1 && url.indexOf('smartlabel_personal/') === -1);
  for (var i = 0; i < flag.length; i++) {
    if (flag[i]) {
      config.gmail.url = url;
      break;
    }
  }
});

app.options.receive("changed", function (o) {
  config.set(o.pref, o.value);
  app.options.send("set", {"pref": o.pref, "value": config.get(o.pref)});
  setBadgeColor();
});

window.setTimeout(check, 300);
window.setTimeout(setBadgeColor, 300);
app.popup.receive("open-gmail", app.tab.openGmail);
app.popup.receive("open-setting", app.tab.openOptions);
if (config.popup.startup) app.popup.send("load", config.gmail.url);
app.popup.receive("open-home", function () {app.tab.open(config.welcome.url)});
app.popup.receive("load", function () {app.popup.send("load", config.gmail.url)});
app.popup.receive("panel-height", function () {app.popup.send("panel-height", config.popup.height)});
app.options.receive("get", function (pref) {app.options.send("set", {"pref": pref, "value": config.get(pref)})});
app.popup.receive("resize", function () {app.popup.send("resize", {"width": config.popup.width, "height": config.popup.height})});
