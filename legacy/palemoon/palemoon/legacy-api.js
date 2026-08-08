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

  global.addEventListener(
    "unload",
    function () {
      Services.obs.removeObserver(storageObserver, STORAGE_TOPIC);
      Services.obs.removeObserver(runtimeObserver, RUNTIME_TOPIC);
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
