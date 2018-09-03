var config = {};

config.welcome = {
  "timeout": 3000,
  "url": "https://github.com/mikhoul/fastest-gmail",
  get version () {return app.storage.read("version")},
  set version (val) {app.storage.write("version", val)}
};

config.interval = {
  get time () {return +app.storage.read("interval") || 300},
  set time (val) {
    val = +val;
    if (val < 60) val = 60;
    app.storage.write("interval", val);
  }
};

config.badge = {
  set color (val) {app.storage.write("badge-color", val)},
  get color () {return app.storage.read("badge-color") || "#FF0000"}
};

config.popup = {
  set unload (val) {app.storage.write('unload', val)},
  set startup (val) {app.storage.write('startup', val)},
  set show (val) {app.storage.write('popup-show', val)},
  get width () {return +app.storage.read('width') || 600},
  get unload () {return app.storage.read('unload') === "false" ? false : true},
  get startup () {return app.storage.read('startup') === "true" ? true : false},
  get show () {return (app.storage.read('popup-show') === "true" ? true : false)},
  set width (val) {
    val = +val;
    if (val < 330) val = 330;
    app.storage.write('width', val);
  },
  get height () {return +app.storage.read('height') || 500},
  set height (val) {
    val = +val;
    if (val < 400) val = 400;
    app.storage.write('height', val);
  }
};

config.gmail = {
  set label (val) {
    val = val.trim().split(/\s*\,\s*/).map(function (key) {return key.toLowerCase().replace(/\s+/g, '-')}).join(', ');
    app.storage.write("gmail-label", val);
  },
  set url (val) {app.storage.write("gmail-url", val)},
  set beep (val) {app.storage.write("gmail-beep", val)},
  set inbox (val) {app.storage.write("gmail-inbox", val)},
  get label () {return app.storage.read("gmail-label") || ''},
  set notification (val) {app.storage.write("gmail-notification", val)},
  get desktopCount () {return +app.storage.read("gmail-desktop-count") || 3},
  get beep () {return app.storage.read("gmail-beep") === "true" ? true : false},
  get url () {return app.storage.read("gmail-url") || "https://mail.google.com/mail/mu/"},
  get inbox () {return app.storage.read("gmail-inbox") === "true" ? true : false},
  get notification () {return app.storage.read("gmail-notification") === "false" ? false : true},
  set desktopCount (val) {
    val = +val;
    if (val < 1) val = 1;
    app.storage.write("gmail-desktop-count", val);
  }
};

config.get = function (name) {return name.split(".").reduce(function (p, c) {return p[c]}, config)};

config.set = function (name, value) {
  function set(name, value, scope) {
    name = name.split(".");
    if (name.length > 1) {
      set.call((scope || this)[name.shift()], name.join("."), value)
    } else this[name[0]] = value;
  }
  set(name, value, config);
};
