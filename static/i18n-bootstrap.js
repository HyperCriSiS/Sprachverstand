(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  if (!api?.i18n || !api?.runtime) return;

  const uiLanguage = api.i18n.getUILanguage?.() || "de";
  const locale = uiLanguage.toLowerCase().startsWith("en") ? "en" : "de";
  document.documentElement.lang = locale;
  if (locale === "de") return;

  const normalize = (value) => value.replace(/\s+/g, " ").trim();
  const dynamicPatterns = [
    [/^(\d+) von (\d+) möglichen Ersetzungen geprüft\.$/, "replacementsChecked"],
    [/^(\d+) weitere Hinweise werden aus Platzgründen nicht angezeigt\.$/, "noticeMore"],
    [/^(\d+) Ersetzung im Testtext\.$/, "previewOneReplacement"],
    [/^(\d+) Ersetzungen im Testtext\.$/, "previewManyReplacements"],
    [/^Es sind höchstens (\d+) Domain-Ausschlüsse möglich\.$/, "maxExcludedDomains"],
    [/^Der Domain-Ausschluss „(.+)“ ist ungültig\.$/, "invalidExcludedDomain"],
    [/^Der Domain-Ausschluss „(.+)“ ist mehrfach beziehungsweise in gleichwertiger Schreibweise enthalten\.$/, "duplicateExcludedDomain"],
    [/^Alle Einstellungen einschließlich (\d+) Ausnahmen und (\d+) eigener Ersetzungen exportiert\.$/, "settingsExported"],
    [/^(\d+) Ausnahmen ergänzt, (\d+) Ersetzungen ergänzt, (\d+) Ersetzungen überschrieben, (\d+) Dubletten übersprungen\.$/, "importSummary"]
  ];

  function message(key, substitutions) {
    return api.i18n.getMessage(key, substitutions) || "";
  }

  function localizeExplicit(element) {
    const textKey = element.dataset?.i18n;
    if (textKey) {
      const translated = message(textKey);
      if (translated) element.textContent = translated;
    }

    for (const [attribute, dataKey] of [
      ["aria-label", "i18nAriaLabel"],
      ["aria-description", "i18nAriaDescription"],
      ["placeholder", "i18nPlaceholder"],
      ["title", "i18nTitle"]
    ]) {
      const key = element.dataset?.[dataKey];
      if (!key) continue;
      const translated = message(key);
      if (translated) element.setAttribute(attribute, translated);
    }
  }

  function localizeExplicitTree(root) {
    if (root instanceof Element) localizeExplicit(root);
    for (const element of root.querySelectorAll?.(
      "[data-i18n], [data-i18n-aria-label], [data-i18n-aria-description], [data-i18n-placeholder], [data-i18n-title]"
    ) ?? []) {
      localizeExplicit(element);
    }
  }

  async function start() {
    const response = await fetch(api.runtime.getURL("_locales/de/messages.json"));
    if (!response.ok) return;
    const german = await response.json();
    const keyByGermanMessage = new Map();

    for (const [key, entry] of Object.entries(german)) {
      if (typeof entry?.message === "string" && !entry.message.includes("$")) {
        keyByGermanMessage.set(normalize(entry.message), key);
      }
    }

    function translateDynamic(text) {
      for (const [pattern, key] of dynamicPatterns) {
        const match = text.match(pattern);
        if (!match) continue;
        return message(key, match.slice(1)) || text;
      }
      return text;
    }

    function translateTextNode(node) {
      const value = node.nodeValue;
      if (!value || !value.trim()) return;
      const leading = value.match(/^\s*/)?.[0] ?? "";
      const trailing = value.match(/\s*$/)?.[0] ?? "";
      const core = normalize(value);
      const key = keyByGermanMessage.get(core);
      const translated = key ? message(key) : translateDynamic(core);
      if (translated && translated !== core) {
        node.nodeValue = `${leading}${translated}${trailing}`;
      }
    }

    function translateTree(root) {
      localizeExplicitTree(root);
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        translateTextNode(node);
        node = walker.nextNode();
      }
    }

    translateTree(document.documentElement);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") translateTextNode(record.target);
        if (record.type === "attributes" && record.target instanceof Element) {
          localizeExplicit(record.target);
        }
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) translateTree(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
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

  void start();
})();
