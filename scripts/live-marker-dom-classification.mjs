// Diagnose für sichtbare Gender-Marker nach ihren tatsächlichen DOM-Textknoten.
// Bewusst unabhängig von der Produktregel-Engine; nur für begrenzte Live-Tests.
export function classifyVisibleMarkerNodes(documentRef, options = {}) {
  const checkLayout = options.checkLayout !== false;
  const patterns = [
    { id: "separator-innen", expression: /[\p{L}\p{N}]+(?:[:*_·])innen\b/giu },
    { id: "binnen-i", expression: /\b[\p{Ll}]+Innen\b/gu }
  ];
  const excludedTags = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "TEXTAREA",
    "INPUT", "SELECT", "OPTION", "CODE", "PRE", "KBD", "SAMP",
    "VAR", "SVG", "MATH", "CANVAS", "IFRAME", "OBJECT", "EMBED"
  ]);
  const excludedRoles = new Set(["textbox", "searchbox", "combobox", "spinbutton"]);
  const result = {
    matchedTextNodeOccurrences: 0,
    excludedOccurrences: 0,
    otherOccurrences: 0,
    reasons: {},
    samples: []
  };
  const root = documentRef.body || documentRef.documentElement;
  if (!root) return result;
  const walker = documentRef.createTreeWalker(
    root,
    documentRef.defaultView.NodeFilter.SHOW_TEXT
  );
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const parent = node.parentElement;
    if (!parent || parent.closest("[hidden]")) continue;
    const candidates = [];
    for (const { id, expression } of patterns) {
      for (const match of node.data.matchAll(expression)) {
        candidates.push({ id, index: match.index, word: match[0] });
      }
    }
    if (candidates.length === 0) continue;

    let reason = "other";
    for (let element = parent; element; element = element.parentElement) {
      if (excludedTags.has(element.tagName)) {
        reason = ["CODE", "PRE", "KBD", "SAMP", "VAR"].includes(element.tagName)
          ? "code"
          : "excluded-tag";
        break;
      }
      const editable = element.getAttribute("contenteditable");
      if (editable === "" || editable === "true" || editable === "plaintext-only") {
        reason = "editor";
        break;
      }
      if (element.hasAttribute("data-sprachverstand-ignore")) {
        reason = "ignore";
        break;
      }
      if (element.getAttribute("aria-hidden") === "true") {
        reason = "aria-hidden";
        break;
      }
      if (excludedRoles.has(element.getAttribute("role")?.toLowerCase())) {
        reason = "excluded-role";
        break;
      }
    }

    for (const { id, index, word } of candidates) {
      if (checkLayout && typeof documentRef.createRange === "function") {
        const range = documentRef.createRange();
        range.setStart(node, index);
        range.setEnd(node, index + word.length);
        const rects = typeof range.getClientRects === "function"
          ? range.getClientRects()
          : null;
        if (rects && rects.length === 0) continue;
      }
      result.matchedTextNodeOccurrences += 1;
      result.reasons[reason] = (result.reasons[reason] || 0) + 1;
      if (reason === "other") result.otherOccurrences += 1;
      else result.excludedOccurrences += 1;
      if (result.samples.length < 12) {
        result.samples.push({ id, word: word.slice(0, 64), reason });
      }
    }
  }
  return result;
}
