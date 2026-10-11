export const accessibleAttributeNames = [
  "alt",
  "aria-label",
  "aria-description",
  "title"
] as const;

export type AccessibleAttributeName =
  (typeof accessibleAttributeNames)[number];

const accessibleAttributeNameSet = new Set<string>(accessibleAttributeNames);

const excludedTags = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "TEXTAREA",
  "INPUT",
  "SELECT",
  "OPTION",
  "CODE",
  "PRE",
  "KBD",
  "SAMP",
  "VAR",
  "SVG",
  "MATH",
  "CANVAS",
  "IFRAME",
  "OBJECT",
  "EMBED"
]);

const excludedAttributeTags = new Set([
  "SCRIPT",
  "STYLE",
  "NOSCRIPT",
  "TEMPLATE",
  "CODE",
  "PRE",
  "KBD",
  "SAMP",
  "VAR",
  "IFRAME",
  "OBJECT",
  "EMBED"
]);

const excludedRoles = new Set([
  "textbox",
  "searchbox",
  "combobox",
  "spinbutton"
]);

const urlPattern = /(?:(?:https?|ftp|data):\/\/|www\.)\S+/iu;
// A match can always include the complete non-space/non-@ run before @.
// Starting within that same run only repeated failing searches quadratically.
const emailPattern = /(?<![^\s@])[^\s@]+@[^\s@]+\.[^\s@]+/u;
const technicalPunctuationCharacter = /[^\p{L}\p{N}]/u;
const base64Pattern = /^(?:[A-Za-z0-9+/]{4}){12,}(?:==|=)?$/u;
const longHexPattern = /^(?:0x)?[A-Fa-f0-9]{32,}$/u;
const compactJsonKeyPattern = /"[^"]+"\s*:/u;
const compactJsonArrayStartPattern = /^\[\s*\{/u;
const compactJsonArrayEndPattern = /\}\s*\]$/u;

function isCompactJson(text: string): boolean {
  // Check delimiters before looking for a key. The former greedy whole-text
  // expression rescanned every possible key when the final brace was absent.
  return (text.startsWith("{") && text.endsWith("}") && compactJsonKeyPattern.test(text)) ||
    (compactJsonArrayStartPattern.test(text) && compactJsonArrayEndPattern.test(text));
}

function isContentEditable(element: Element): boolean {
  const value = element.getAttribute("contenteditable");
  // Das HTML-Attribut ist ein ASCII-case-insensitives Schlüsselwort.
  const normalized = value?.toLowerCase();
  return normalized === "" || normalized === "true" || normalized === "plaintext-only";
}

// Bei offenem Shadow-DOM gehört auch der Host zur Schutzkette.
function parentElementOrShadowHost(element: Element): Element | null {
  if (element.parentElement) {
    return element.parentElement;
  }
  const root = element.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

function hasCommonExcludedAncestor(
  element: Element | null,
  excludedTagNames: ReadonlySet<string>
): boolean {
  let current = element;

  while (current) {
    if (excludedTagNames.has(current.tagName)) {
      return true;
    }

    if (isContentEditable(current)) {
      return true;
    }

    if (current.hasAttribute("data-sprachverstand-ignore")) {
      return true;
    }

    if (current.getAttribute("aria-hidden")?.toLowerCase() === "true") {
      return true;
    }

    current = parentElementOrShadowHost(current);
  }

  return false;
}

// Textknoten unmittelbar unter einem ShadowRoot besitzen kein parentElement.
// Der Host muss trotzdem wie jeder andere Vorfahr geschützt werden.
function textParentOrShadowHost(node: Text): Element | null {
  if (node.parentElement) {
    return node.parentElement;
  }
  const root = node.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

function isDocumentEditor(document: Document): boolean {
  return document.designMode?.toLowerCase() === "on";
}

// For a traversal that has already established the ancestor protection.
export function hasOwnTextProtection(element: Element): boolean {
  if (excludedTags.has(element.tagName) || isContentEditable(element) ||
      element.hasAttribute("data-sprachverstand-ignore") ||
      element.getAttribute("aria-hidden")?.toLowerCase() === "true") return true;
  const role = element.getAttribute("role")?.toLowerCase();
  return Boolean(role && excludedRoles.has(role));
}

function hasExcludedTextAncestor(element: Element | null,
  cache?: WeakMap<Element, boolean>): boolean {
  let current = element;
  const visited: Element[] | undefined = cache ? [] : undefined;
  let protectedText = false;
  while (current) {
    const cached = cache?.get(current);
    if (cached !== undefined) {protectedText = cached; break;}
    visited?.push(current);
    if (hasOwnTextProtection(current)) {protectedText = true; break;}
    current = parentElementOrShadowHost(current);
  }
  if (visited) for (const ancestor of visited) cache!.set(ancestor, protectedText);
  return protectedText;
}

// Zur Bestimmung durchgängiger sicherer Inline-Kontexte ohne technische Textheuristik.
export function isProtectedTextSubtree(element: Element): boolean {
  return isDocumentEditor(element.ownerDocument) || hasExcludedTextAncestor(element);
}

export function isProbablyTechnicalText(input: string): boolean {
  const text = input.trim();

  if (text.length < 2) {
    return true;
  }

  if (
    ((text.includes("/") || text.includes(".")) && urlPattern.test(text)) ||
    (text.includes("@") && emailPattern.test(text)) ||
    (text.length >= 48 && base64Pattern.test(text)) ||
    (text.length >= 32 && longHexPattern.test(text)) ||
    isCompactJson(text)
  ) {
    return true;
  }

  if (text.length >= 24 && !/\s/u.test(text)) {
    let punctuationCount = 0;
    for (const character of text) {
      if (technicalPunctuationCharacter.test(character)) {
        punctuationCount += 1;
        if (punctuationCount / text.length > 0.35) return true;
      }
    }
  }

  return false;
}

export function shouldProcessTextNode(node: Text,
  cache?: WeakMap<Element, boolean>): boolean {
  return node.isConnected && !hasTextNodeProtection(node, cache) &&
    !isProbablyTechnicalText(node.data);
}

export function hasTextNodeProtection(node: Text,
  cache?: WeakMap<Element, boolean>): boolean {
  return isDocumentEditor(node.ownerDocument) ||
    hasExcludedTextAncestor(textParentOrShadowHost(node), cache);
}

export function shouldProcessAccessibleAttribute(
  element: Element,
  attributeName: string,
  value: string
): attributeName is AccessibleAttributeName {
  if (!accessibleAttributeNameSet.has(attributeName)) {
    return false;
  }

  if (!element.isConnected || isDocumentEditor(element.ownerDocument)) {
    return false;
  }

  if (hasCommonExcludedAncestor(element, excludedAttributeTags)) {
    return false;
  }

  return !isProbablyTechnicalText(value);
}
