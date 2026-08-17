(() => {
  const api = globalThis.browser ?? globalThis.chrome;
  if (!api?.i18n || !api?.runtime) return;

  const uiLanguage = api.i18n.getUILanguage?.() || "de";
  document.documentElement.lang = uiLanguage.split("-")[0] || "de";
  if (uiLanguage.toLowerCase().startsWith("de")) return;

  const dynamicPatterns = [
    [/^(\d+) von (\d+) möglichen Ersetzungen geprüft\.$/, "replacementsChecked"],
    [/^(\d+) weitere Hinweise werden aus Platzgründen nicht angezeigt\.$/, "noticeMore"],
    [/^(\d+) Ersetzung im Testtext\.$/, "previewOneReplacement"],
    [/^(\d+) Ersetzungen im Testtext\.$/, "previewManyReplacements"]
  ];

  function translatedDynamic(text) {
    for (const [pattern, key] of dynamicPatterns) {
      const match = text.match(pattern);
      if (!match) continue;
      return api.i18n.getMessage(key, match.slice(1)) || text;
    }
    return text;
  }

  async function start() {
    const response = await fetch(api.runtime.getURL("_locales/de/messages.json"));
    if (!response.ok) return;
    const german = await response.json();
    const keyByGermanMessage = new Map();
    for (const [key, entry] of Object.entries(german)) {
      if (typeof entry?.message === "string" && !entry.message.includes("$")) {
        keyByGermanMessage.set(entry.message, key);
      }
    }

    function translateExact(text) {
      const key = keyByGermanMessage.get(text);
      if (key) return api.i18n.getMessage(key) || text;
      return translatedDynamic(text);
    }

    function translateTextNode(node) {
      const value = node.nodeValue;
      if (!value || !value.trim()) return;
      const leading = value.match(/^\s*/)?.[0] ?? "";
      const trailing = value.match(/\s*$/)?.[0] ?? "";
      const core = value.slice(leading.length, value.length - trailing.length);
      const translated = translateExact(core);
      if (translated !== core) node.nodeValue = `${leading}${translated}${trailing}`;
    }

    function translateElement(element) {
      for (const attr of ["aria-label", "aria-description", "placeholder", "title"]) {
        const value = element.getAttribute?.(attr);
        if (!value) continue;
        const translated = translateExact(value);
        if (translated !== value) element.setAttribute(attr, translated);
      }
      for (const child of element.childNodes ?? []) {
        if (child.nodeType === Node.TEXT_NODE) translateTextNode(child);
        else if (child.nodeType === Node.ELEMENT_NODE) translateElement(child);
      }
    }

    translateElement(document.documentElement);

    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "characterData") translateTextNode(record.target);
        if (record.type === "attributes" && record.target instanceof Element) {
          translateElement(record.target);
        }
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.TEXT_NODE) translateTextNode(node);
          else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node);
        }
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["aria-label", "aria-description", "placeholder", "title"]
    });
  }

  void start();
})();
