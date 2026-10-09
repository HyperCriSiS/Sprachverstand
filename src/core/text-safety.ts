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
const emailPattern = /[^\s@]+@[^\s@]+\.[^\s@]+/u;
const base64Pattern = /^(?:[A-Za-z0-9+/]{4}){12,}(?:==|=)?$/u;
const longHexPattern = /^(?:0x)?[A-Fa-f0-9]{32,}$/u;
const compactJsonPattern = /^(?:\{.*"[^"]+"\s*:.*\}|\[\s*\{.*\}\s*\])$/su;

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

function hasExcludedTextAncestor(element: Element | null): boolean {
  let current = element;

  while (current) {
    if (excludedTags.has(current.tagName)) {
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

    const role = current.getAttribute("role")?.toLowerCase();
    if (role && excludedRoles.has(role)) {
      return true;
    }

    current = parentElementOrShadowHost(current);
  }

  return false;
}

export function isProbablyTechnicalText(input: string): boolean {
  const text = input.trim();

  if (text.length < 2) {
    return true;
  }

  if (
    urlPattern.test(text) ||
    emailPattern.test(text) ||
    base64Pattern.test(text) ||
    longHexPattern.test(text) ||
    compactJsonPattern.test(text)
  ) {
    return true;
  }

  if (!/\s/u.test(text) && text.length >= 24) {
    const punctuationCount = [...text].filter((character) =>
      /[^\p{L}\p{N}]/u.test(character)
    ).length;

    if (punctuationCount / text.length > 0.35) {
      return true;
    }
  }

  return false;
}

export function shouldProcessTextNode(node: Text): boolean {
  if (!node.isConnected || isDocumentEditor(node.ownerDocument)) {
    return false;
  }

  if (hasExcludedTextAncestor(textParentOrShadowHost(node))) {
    return false;
  }

  return !isProbablyTechnicalText(node.data);
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