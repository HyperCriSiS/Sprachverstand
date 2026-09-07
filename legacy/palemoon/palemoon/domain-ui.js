(function (global) {
  "use strict";

  var extensionApi = global.browser || global.chrome;

  function message(key, fallback) {
    if (
      extensionApi &&
      extensionApi.i18n &&
      typeof extensionApi.i18n.getMessage === "function"
    ) {
      return extensionApi.i18n.getMessage(key) || fallback;
    }
    return fallback;
  }

  function setText(selector, key, fallback) {
    var element = document.querySelector(selector);
    if (element) {
      element.textContent = message(key, fallback);
    }
  }

  // Die Einstellungsseite startet bewusst immer mit eingeklappten Bereichen.
  var sections = document.querySelectorAll("details.settings-section");
  for (var index = 0; index < sections.length; index += 1) {
    sections[index].open = false;
  }

  // Neue Domain-Beschriftungen bleiben auch ohne Übersetzung verständlich.
  setText(
    "#popup-domain-action-title",
    "popupDomainActionTitle",
    "Aktuelle Website zur Domainliste hinzufügen"
  );
  setText(
    "#popup-domain-action-description",
    "popupDomainActionDescription",
    "Zeigt im Popup eine Schaltfläche, um die aktuelle Website abhängig vom Arbeitsmodus zur Domainliste hinzuzufügen."
  );
  setText("#sync-domain-list-title", "syncDomainListTitle", "Domainliste");
  setText(
    "#sync-domain-list-description",
    "syncDomainListDescription",
    "Synchronisiert den Arbeitsmodus und die zugehörige Domainliste. Kann persönliche oder interne Domainnamen enthalten."
  );
})(this);
