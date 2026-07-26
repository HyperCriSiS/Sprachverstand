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
  "BUTTON",
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
  return value === "" || value === "true" || value === "plaintext-only";
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

    if (current.getAttribute("aria-hidden") === "true") {
      return true;
    }

    current = current.parentElement;
  }

  return false;
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

    if (current.getAttribute("aria-hidden") === "true") {
      return true;
    }

    const role = current.getAttribute("role")?.toLowerCase();
    if (role && excludedRoles.has(role)) {
      return true;
    }

    current = current.parentElement;
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
  if (!node.isConnected) {
    return false;
  }

  if (hasExcludedTextAncestor(node.parentElement)) {
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

  if (!element.isConnected) {
    return false;
  }

  if (hasCommonExcludedAncestor(element, excludedAttributeTags)) {
    return false;
  }

  return !isProbablyTechnicalText(value);
}
