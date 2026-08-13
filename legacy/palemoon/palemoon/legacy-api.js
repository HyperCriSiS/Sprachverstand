(function (global) {
  "use strict";

  var Services = Components.utils.import(
    "resource://gre/modules/Services.jsm",
    {}
  ).Services;

  var LOCAL_PREFIX = "extensions.sprachverstand.storage.local.";
  var STORAGE_TOPIC = "sprachverstand-palemoon-storage-changed";
  var RUNTIME_TOPIC = "sprachverstand-palemoon-runtime-message";
  var storageListeners = [];
  var runtimeListeners = [];

  var themeObserver = null;
  var themeWindow = null;
  var themeRefreshTimer = null;

  function colorLuminance(color) {
    if (!color || color === "transparent") {
      return null;
    }

    var match = color.match(
      /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9.]+))?\s*\)/i
    );
    if (!match || (match[4] !== undefined && Number(match[4]) === 0)) {
      return null;
    }

    function channel(value) {
      var normalized = Number(value) / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : Math.pow((normalized + 0.055) / 1.055, 2.4);
    }

    return (
      0.2126 * channel(match[1]) +
      0.7152 * channel(match[2]) +
      0.0722 * channel(match[3])
    );
  }

  function toolbarUsesBrightText(toolbar) {
    if (!toolbar || !toolbar.hasAttribute("brighttext")) {
      return false;
    }

    return toolbar.getAttribute("brighttext") !== "false";
  }

  function isDarkPaleMoonTheme(browserWindow) {
    if (!browserWindow || !browserWindow.document) {
      return false;
    }

    var browserDocument = browserWindow.document;
    var navBar = browserDocument.getElementById("nav-bar");

    if (toolbarUsesBrightText(navBar)) {
      return true;
    }

    var brightToolbars = browserDocument.querySelectorAll("toolbar[brighttext]");
    for (var index = 0; index < brightToolbars.length; index += 1) {
      if (toolbarUsesBrightText(brightToolbars[index])) {
        return true;
      }
    }

    var colorTarget =
      navBar || browserDocument.getElementById("main-window") || browserDocument.documentElement;
    if (!colorTarget || typeof browserWindow.getComputedStyle !== "function") {
      return false;
    }

    var luminance = colorLuminance(
      browserWindow.getComputedStyle(colorTarget).backgroundColor
    );
    return luminance !== null && luminance < 0.35;
  }

  function ensurePaleMoonThemeStyles() {
    if (!global.document || !global.document.documentElement) {
      return;
    }

    var styleId = "sprachverstand-palemoon-theme";
    if (global.document.getElementById(styleId)) {
      return;
    }

    var style = global.document.createElement("style");
    style.id = styleId;
    style.textContent = [
      ':root[data-palemoon-theme="light"] { color-scheme: light; background: #ffffff; color: #202124; }',
      ':root[data-palemoon-theme="light"] body { background: #ffffff; color: #202124; }',
      ':root[data-palemoon-theme="light"] button, :root[data-palemoon-theme="light"] select, :root[data-palemoon-theme="light"] textarea, :root[data-palemoon-theme="light"] input[type="text"], :root[data-palemoon-theme="light"] input[type="url"] { border: 1px solid #c9c9cf; background: #ffffff; color: #202124; }',
      ':root[data-palemoon-theme="light"] a { color: #005fcc; }',
      ':root[data-palemoon-theme="dark"] { color-scheme: dark; background: #1c1b22; color: #f2f2f4; }',
      ':root[data-palemoon-theme="dark"] body { background: #1c1b22; color: #f2f2f4; }',
      ':root[data-palemoon-theme="dark"] button, :root[data-palemoon-theme="dark"] select, :root[data-palemoon-theme="dark"] textarea, :root[data-palemoon-theme="dark"] input[type="text"], :root[data-palemoon-theme="dark"] input[type="url"] { border: 1px solid #55535f; background: #302f37; color: #f2f2f4; }',
      ':root[data-palemoon-theme="dark"] button:hover { background: #3b3943; }',
      ':root[data-palemoon-theme="dark"] a { color: #8ab4f8; }',
      ':root[data-palemoon-theme="dark"] section, :root[data-palemoon-theme="dark"] .settings-section, :root[data-palemoon-theme="dark"] .settings-toolbar, :root[data-palemoon-theme="dark"] .diagnostics, :root[data-palemoon-theme="dark"] .import-summary { border-color: #55535f; }',
      ':root[data-palemoon-theme="dark"] section, :root[data-palemoon-theme="dark"] .settings-section, :root[data-palemoon-theme="dark"] .settings-toolbar, :root[data-palemoon-theme="dark"] .diagnostics, :root[data-palemoon-theme="dark"] .import-summary, :root[data-palemoon-theme="dark"] textarea[readonly] { background: #27262d; }',
      ':root[data-palemoon-theme="dark"] .settings-section > summary:hover { background: #3b3943; }',
      ':root[data-palemoon-theme="dark"] .actions { background: #1c1b22; }'
    ].join("\n");

    global.document.documentElement.appendChild(style);
  }

  function applyPaleMoonTheme() {
    if (!global.document || !global.document.documentElement) {
      return;
    }

    ensurePaleMoonThemeStyles();

    var browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
    var theme = isDarkPaleMoonTheme(browserWindow) ? "dark" : "light";
    global.document.documentElement.setAttribute("data-palemoon-theme", theme);
  }

  function scheduleThemeRefresh() {
    if (themeRefreshTimer !== null) {
      global.clearTimeout(themeRefreshTimer);
    }

    themeRefreshTimer = global.setTimeout(function () {
      themeRefreshTimer = null;
      applyPaleMoonTheme();
    }, 0);
  }

  function stopThemeSync() {
    if (themeObserver) {
      themeObserver.disconnect();
      themeObserver = null;
    }

    if (themeWindow) {
      themeWindow.removeEventListener("focus", scheduleThemeRefresh, false);
      themeWindow = null;
    }

    if (themeRefreshTimer !== null) {
      global.clearTimeout(themeRefreshTimer);
      themeRefreshTimer = null;
    }
  }

  function startThemeSync() {
    stopThemeSync();

    themeWindow = Services.wm.getMostRecentWindow("navigator:browser");
    applyPaleMoonTheme();

    if (!themeWindow || !themeWindow.document) {
      return;
    }

    themeWindow.addEventListener("focus", scheduleThemeRefresh, false);

    if (typeof global.MutationObserver !== "function") {
      return;
    }

    themeObserver = new global.MutationObserver(scheduleThemeRefresh);

    var browserDocument = themeWindow.document;
    var observedElements = [
      browserDocument.getElementById("main-window"),
      browserDocument.getElementById("nav-bar"),
      browserDocument.getElementById("TabsToolbar"),
      browserDocument.getElementById("PersonalToolbar")
    ];

    observedElements.forEach(function (element) {
      if (!element) {
        return;
      }

      themeObserver.observe(element, {
        attributes: true,
        attributeFilter: [
          "brighttext",
          "class",
          "style",
          "lwtheme",
          "lwthemetextcolor"
        ]
      });
    });
  }

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(value));
  }

  function prefName(key) {
    return LOCAL_PREFIX + key;
  }

  function sanitizeValue(key, value) {
    var copy = clone(value);
    if (
      key === "settings" &&
      copy &&
      typeof copy === "object" &&
      !Array.isArray(copy)
    ) {
      copy.syncCategoryIds = [];
    }
    return copy;
  }

  function readLocalValue(key) {
    var name = prefName(key);
    if (!Services.prefs.prefHasUserValue(name)) {
      return undefined;
    }

    try {
      return JSON.parse(Services.prefs.getCharPref(name));
    } catch (_error) {
      return undefined;
    }
  }

  function selectedKeys(keys) {
    if (typeof keys === "string") {
      return [keys];
    }
    if (Array.isArray(keys)) {
      return keys.slice();
    }
    if (keys && typeof keys === "object") {
      return Object.keys(keys);
    }
    return [];
  }

  function localGet(keys) {
    var result = {};
    var names = selectedKeys(keys);

    if (keys && typeof keys === "object" && !Array.isArray(keys)) {
      Object.keys(keys).forEach(function (key) {
        result[key] = clone(keys[key]);
      });
    }

    names.forEach(function (key) {
      var value = readLocalValue(key);
      if (value !== undefined) {
        result[key] = value;
      }
    });

    return Promise.resolve(result);
  }

  function notifyStorageChanges(changes) {
    if (!Object.keys(changes).length) {
      return;
    }
    Services.obs.notifyObservers(
      null,
      STORAGE_TOPIC,
      JSON.stringify({ areaName: "local", changes: changes })
    );
  }

  function localSet(items) {
    var changes = {};

    Object.keys(items).forEach(function (key) {
      var oldValue = readLocalValue(key);
      var newValue = sanitizeValue(key, items[key]);
      Services.prefs.setCharPref(prefName(key), JSON.stringify(newValue));
      changes[key] = { oldValue: oldValue, newValue: clone(newValue) };
    });

    notifyStorageChanges(changes);
    return Promise.resolve();
  }

  function localRemove(keys) {
    var changes = {};
    var names = typeof keys === "string" ? [keys] : keys;

    names.forEach(function (key) {
      var oldValue = readLocalValue(key);
      if (oldValue === undefined) {
        return;
      }
      Services.prefs.clearUserPref(prefName(key));
      changes[key] = { oldValue: oldValue };
    });

    notifyStorageChanges(changes);
    return Promise.resolve();
  }

  function mostRecentBridge() {
    var browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
    return browserWindow && browserWindow.SprachverstandPaleMoon
      ? browserWindow.SprachverstandPaleMoon
      : null;
  }

  var storageObserver = {
    observe: function (_subject, topic, data) {
      if (topic !== STORAGE_TOPIC) {
        return;
      }

      try {
        var message = JSON.parse(data);
        storageListeners.slice().forEach(function (listener) {
          listener(message.changes, message.areaName);
        });
      } catch (_error) {
        // Ignore malformed internal notifications.
      }
    }
  };

  var runtimeObserver = {
    observe: function (_subject, topic, data) {
      if (topic !== RUNTIME_TOPIC) {
        return;
      }

      try {
        var message = JSON.parse(data);
        runtimeListeners.slice().forEach(function (listener) {
          listener(message, {});
        });
      } catch (_error) {
        // Ignore malformed internal notifications.
      }
    }
  };

  Services.obs.addObserver(storageObserver, STORAGE_TOPIC, false);
  Services.obs.addObserver(runtimeObserver, RUNTIME_TOPIC, false);
  startThemeSync();

  global.addEventListener(
    "unload",
    function () {
      Services.obs.removeObserver(storageObserver, STORAGE_TOPIC);
      Services.obs.removeObserver(runtimeObserver, RUNTIME_TOPIC);
      stopThemeSync();
      storageListeners.length = 0;
      runtimeListeners.length = 0;
    },
    { once: true }
  );

  var localArea = {
    get: localGet,
    set: localSet,
    remove: localRemove
  };

  var syncArea = {
    get: function () {
      return Promise.resolve({});
    },
    set: function () {
      return Promise.resolve();
    },
    remove: function () {
      return Promise.resolve();
    }
  };

  global.browser = {
    storage: {
      local: localArea,
      sync: syncArea,
      onChanged: {
        addListener: function (listener) {
          if (storageListeners.indexOf(listener) === -1) {
            storageListeners.push(listener);
          }
        },
        removeListener: function (listener) {
          var index = storageListeners.indexOf(listener);
          if (index !== -1) {
            storageListeners.splice(index, 1);
          }
        }
      }
    },
    runtime: {
      openOptionsPage: function () {
        var bridge = mostRecentBridge();
        if (bridge) {
          bridge.openOptions();
        }
        return Promise.resolve();
      },
      sendMessage: function (message) {
        var bridge = mostRecentBridge();
        if (!bridge) {
          return Promise.reject(new Error("Kein Pale-Moon-Browserfenster verfügbar."));
        }
        try {
          return Promise.resolve(bridge.handleMessage(clone(message)));
        } catch (error) {
          return Promise.reject(error);
        }
      },
      onMessage: {
        addListener: function (listener) {
          if (runtimeListeners.indexOf(listener) === -1) {
            runtimeListeners.push(listener);
          }
        },
        removeListener: function (listener) {
          var index = runtimeListeners.indexOf(listener);
          if (index !== -1) {
            runtimeListeners.splice(index, 1);
          }
        }
      }
    },
    action: {
      setBadgeText: function () {
        return Promise.resolve();
      },
      getBadgeText: function (details) {
        var bridge = mostRecentBridge();
        return Promise.resolve(
          bridge ? bridge.getCountText(details && details.tabId) : ""
        );
      },
      setBadgeBackgroundColor: function () {
        return Promise.resolve();
      }
    },
    tabs: {
      query: function () {
        var bridge = mostRecentBridge();
        var tabId = bridge ? bridge.getActiveTabId() : undefined;
        return Promise.resolve(tabId === undefined ? [] : [{ id: tabId }]);
      },
      onRemoved: {
        addListener: function () {},
        removeListener: function () {}
      }
    }
  };

  if (global.document && /\/options\/options\.html$/.test(global.location.pathname)) {
    var syncContainer = global.document.getElementById("sync-categories");
    if (syncContainer) {
      var syncSection = syncContainer;
      while (syncSection && syncSection.localName !== "details") {
        syncSection = syncSection.parentElement;
      }
      if (syncSection) {
        syncSection.hidden = true;
      }
      Array.prototype.forEach.call(
        syncContainer.querySelectorAll("input[data-sync-category]"),
        function (input) {
          input.checked = false;
          input.disabled = true;
        }
      );
    }
  }
})(this);
