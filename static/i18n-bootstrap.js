(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  if (!api?.i18n) return;

  const uiLanguage = api.i18n.getUILanguage?.() || "de";
  const normalizedLanguage = uiLanguage.replace(/_/g, "-");
  const baseLanguage = normalizedLanguage.toLowerCase().split("-")[0];
  const rtlLanguages = new Set(["ar", "fa", "he"]);
  document.documentElement.lang = normalizedLanguage;
  document.documentElement.dir = rtlLanguages.has(baseLanguage) ? "rtl" : "ltr";

  const localizationAttributes = [
    ["aria-label", "i18nAriaLabel"],
    ["aria-description", "i18nAriaDescription"],
    ["placeholder", "i18nPlaceholder"],
    ["title", "i18nTitle"]
  ];

  function message(key) {
    return api.i18n.getMessage(key) || "";
  }

  function localizeElement(element) {
    const textKey = element.dataset?.i18n;
    if (textKey) {
      const translated = message(textKey);
      if (translated) element.textContent = translated;
    }

    for (const [attribute, dataKey] of localizationAttributes) {
      const key = element.dataset?.[dataKey];
      if (!key) continue;
      const translated = message(key);
      if (translated) element.setAttribute(attribute, translated);
    }
  }

  function localizeTree(root) {
    if (root instanceof Element) {
      localizeElement(root);
    }
    for (const element of root.querySelectorAll?.("*") ?? []) {
      localizeElement(element);
    }
  }

  function start() {
    localizeTree(document.documentElement);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "attributes" && record.target instanceof Element) {
          localizeElement(record.target);
        }
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            localizeTree(node);
          }
        }
      }
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
})();
