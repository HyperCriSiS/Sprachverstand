(function (global) {
  "use strict";

  var Services = Components.utils.import(
    "resource://gre/modules/Services.jsm",
    {}
  ).Services;

  var STORAGE_TOPIC = "sprachverstand-palemoon-storage-changed";
  var SYNC_PAYLOAD_PREF = "extensions.sprachverstand.storage.sync.payload";
  var SYNC_CONTROL_PREF = "services.sync.prefs.sync." + SYNC_PAYLOAD_PREF;
  var localeCache = {};
  var writingSyncPayload = false;

  function clone(value) {
    if (value === undefined) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(value));
  }

  function uiLanguage() {
    try {
      if (
        Services.locale &&
        typeof Services.locale.getAppLocaleAsLangTag === "function"
      ) {
        return Services.locale.getAppLocaleAsLangTag() || "de";
      }
    } catch (_error) {}

    try {
      return Services.prefs.getCharPref("general.useragent.locale") || "de";
    } catch (_error) {
      return "de";
    }
  }

  function localeCandidates(language) {
    var normalized = String(language || "de").replace(/-/g, "_");
    var base = normalized.split("_")[0].toLowerCase();
    var candidates = [normalized, base, "de"];
    var result = [];

    candidates.forEach(function (candidate) {
      if (candidate && result.indexOf(candidate) === -1) {
        result.push(candidate);
      }
    });
    return result;
  }

  function readLocale(locale) {
    if (Object.prototype.hasOwnProperty.call(localeCache, locale)) {
      return localeCache[locale];
    }

    try {
      var request = new global.XMLHttpRequest();
      request.open(
        "GET",
        "chrome://sprachverstand/content/_locales/" + locale + "/messages.json",
        false
      );
      request.overrideMimeType("application/json");
      request.send(null);
      if ((request.status === 0 || request.status < 400) && request.responseText) {
        localeCache[locale] = JSON.parse(request.responseText);
        return localeCache[locale];
      }
    } catch (_error) {}

    localeCache[locale] = null;
    return null;
  }

  function selectedMessages() {
    var candidates = localeCandidates(uiLanguage());
    for (var index = 0; index < candidates.length; index += 1) {
      var messages = readLocale(candidates[index]);
      if (messages) {
        return messages;
      }
    }
    return {};
  }

  function substitutionValues(substitutions) {
    if (substitutions === undefined) {
      return [];
    }
    return Array.isArray(substitutions)
      ? substitutions.map(String)
      : [String(substitutions)];
  }

  function escapeRegularExpression(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getMessage(messageName, substitutions) {
    var messages = selectedMessages();
    var fallbackMessages = readLocale("de") || {};
    var entry = messages[messageName] || fallbackMessages[messageName];
    if (!entry || typeof entry.message !== "string") {
      return "";
    }

    var values = substitutionValues(substitutions);
    var message = entry.message;
    var placeholders = entry.placeholders || {};

    Object.keys(placeholders).forEach(function (name) {
      var content = String(placeholders[name].content || "").replace(
        /\$(\d+)/g,
        function (_match, number) {
          return values[Number(number) - 1] || "";
        }
      );
      message = message.replace(
        new RegExp("\\$" + escapeRegularExpression(name) + "\\$", "gi"),
        content
      );
    });

    message = message.replace(/\$(\d+)/g, function (_match, number) {
      return values[Number(number) - 1] || "";
    });
    return message.replace(/\$\$/g, "$");
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

  function readSyncPayload() {
    if (!Services.prefs.prefHasUserValue(SYNC_PAYLOAD_PREF)) {
      return {};
    }

    try {
      var parsed = JSON.parse(Services.prefs.getCharPref(SYNC_PAYLOAD_PREF));
      return parsed && typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : {};
    } catch (_error) {
      return {};
    }
  }

  function syncGet(keys) {
    var payload = readSyncPayload();
    if (keys === undefined || keys === null) {
      return Promise.resolve(clone(payload));
    }

    var result = {};
    if (keys && typeof keys === "object" && !Array.isArray(keys)) {
      Object.keys(keys).forEach(function (key) {
        result[key] = clone(keys[key]);
      });
    }

    selectedKeys(keys).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(payload, key)) {
        result[key] = clone(payload[key]);
      }
    });
    return Promise.resolve(result);
  }

  function diffPayload(previous, next) {
    var changes = {};
    var names = Object.keys(previous).concat(Object.keys(next));
    names.forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        return;
      }
      var oldValue = previous[key];
      var newValue = next[key];
      if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
        return;
      }
      changes[key] = {};
      if (oldValue !== undefined) {
        changes[key].oldValue = clone(oldValue);
      }
      if (newValue !== undefined) {
        changes[key].newValue = clone(newValue);
      }
    });
    return changes;
  }

  function notifySyncChanges(changes) {
    if (!Object.keys(changes).length) {
      return;
    }
    Services.obs.notifyObservers(
      null,
      STORAGE_TOPIC,
      JSON.stringify({ areaName: "sync", changes: changes })
    );
  }

  var lastSyncPayload = readSyncPayload();

  function writeSyncPayload(nextPayload) {
    var previous = lastSyncPayload;
    var changes = diffPayload(previous, nextPayload);
    writingSyncPayload = true;
    try {
      Services.prefs.setBoolPref(SYNC_CONTROL_PREF, true);
      Services.prefs.setCharPref(SYNC_PAYLOAD_PREF, JSON.stringify(nextPayload));
      lastSyncPayload = clone(nextPayload);
    } finally {
      writingSyncPayload = false;
    }
    notifySyncChanges(changes);
  }

  function syncSet(items) {
    var next = clone(readSyncPayload());
    Object.keys(items).forEach(function (key) {
      next[key] = clone(items[key]);
    });
    writeSyncPayload(next);
    return Promise.resolve();
  }

  function syncRemove(keys) {
    var next = clone(readSyncPayload());
    var names = typeof keys === "string" ? [keys] : keys;
    names.forEach(function (key) {
      delete next[key];
    });
    writeSyncPayload(next);
    return Promise.resolve();
  }

  var syncPreferenceObserver = {
    observe: function (_subject, topic, data) {
      if (
        topic !== "nsPref:changed" ||
        data !== SYNC_PAYLOAD_PREF ||
        writingSyncPayload
      ) {
        return;
      }

      var next = readSyncPayload();
      var changes = diffPayload(lastSyncPayload, next);
      lastSyncPayload = clone(next);
      notifySyncChanges(changes);
    }
  };

  if (!global.browser) {
    return;
  }

  global.browser.i18n = {
    getMessage: getMessage,
    getUILanguage: function () {
      return uiLanguage().replace(/_/g, "-");
    }
  };

  global.browser.storage.sync = {
    get: syncGet,
    set: syncSet,
    remove: syncRemove
  };

  global.browser.runtime.getURL = function (resourcePath) {
    return (
      "chrome://sprachverstand/content/" +
      String(resourcePath || "").replace(/^\/+/, "")
    );
  };

  Services.prefs.addObserver(SYNC_PAYLOAD_PREF, syncPreferenceObserver, false);

  if (global.document && /\/options\/options\.html$/.test(global.location.pathname)) {
    var syncContainer = global.document.getElementById("sync-categories");
    if (syncContainer) {
      var syncSection = syncContainer;
      while (syncSection && syncSection.localName !== "details") {
        syncSection = syncSection.parentElement;
      }
      if (syncSection) {
        syncSection.hidden = false;
      }
      Array.prototype.forEach.call(
        syncContainer.querySelectorAll("input[data-sync-category]"),
        function (input) {
          input.disabled = false;
        }
      );
    }
  }

  global.addEventListener(
    "unload",
    function () {
      Services.prefs.removeObserver(SYNC_PAYLOAD_PREF, syncPreferenceObserver);
    },
    { once: true }
  );
})(this);
