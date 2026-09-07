(function (global) {
  "use strict";

  var api = global.browser || global.chrome;
  if (!api || !api.i18n) {
    return;
  }

  var uiLanguage =
    typeof api.i18n.getUILanguage === "function"
      ? api.i18n.getUILanguage() || "de"
      : "de";
  var normalizedLanguage = String(uiLanguage).replace(/_/g, "-");
  var baseLanguage = normalizedLanguage.toLowerCase().split("-")[0];
  var rtlLanguages = { ar: true, fa: true, he: true };

  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = rtlLanguages[baseLanguage] ? "rtl" : "ltr";

  var localizationAttributes = [
    ["aria-label", "i18nAriaLabel"],
    ["aria-description", "i18nAriaDescription"],
    ["placeholder", "i18nPlaceholder"],
    ["title", "i18nTitle"]
  ];

  function message(key) {
    return api.i18n.getMessage(key) || "";
  }

  function dataValue(element, dataKey) {
    return element.dataset ? element.dataset[dataKey] : undefined;
  }

  function localizeElement(element) {
    var textKey = dataValue(element, "i18n");
    if (textKey) {
      var translatedText = message(textKey);
      if (translatedText) {
        element.textContent = translatedText;
      }
    }

    localizationAttributes.forEach(function (entry) {
      var attribute = entry[0];
      var dataKey = entry[1];
      var key = dataValue(element, dataKey);
      if (!key) {
        return;
      }
      var translated = message(key);
      if (translated) {
        element.setAttribute(attribute, translated);
      }
    });
  }

  function localizeTree(root) {
    if (root && root.nodeType === Node.ELEMENT_NODE) {
      localizeElement(root);
    }

    if (!root || typeof root.querySelectorAll !== "function") {
      return;
    }

    Array.prototype.forEach.call(root.querySelectorAll("*"), localizeElement);
  }

  function start() {
    localizeTree(document.documentElement);

    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        if (
          record.type === "attributes" &&
          record.target &&
          record.target.nodeType === Node.ELEMENT_NODE
        ) {
          localizeElement(record.target);
        }

        Array.prototype.forEach.call(record.addedNodes || [], function (node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            localizeTree(node);
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: [
        "data-i18n",
        "data-i18n-aria-label",
        "data-i18n-aria-description",
        "data-i18n-placeholder",
        "data-i18n-title"
      ]
    });
  }

  start();
})(this);
