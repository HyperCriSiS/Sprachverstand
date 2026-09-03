(() => {
  const extensionApi = globalThis.browser ?? globalThis.chrome;

  const message = (key, fallback) =>
    extensionApi?.i18n?.getMessage?.(key) || fallback;

  const setText = (selector, key, fallback) => {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = message(key, fallback);
    }
  };

  // Neue Domain-Beschriftungen bleiben auch ohne bereits ausgelieferte Übersetzung verständlich.
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
})();
