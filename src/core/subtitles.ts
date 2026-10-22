const subtitleIdentifierMarkers = [
  "ytp-caption",
  "caption-window",
  "caption-segment",
  "captions-container",
  "captions-overlay",
  "captions-text",
  "subtitle-container",
  "subtitle-overlay",
  "subtitle-renderer",
  "subtitle-cue",
  "timedtext",
  "text-track-container",
  "text-track-display",
  "cue-window",
  "atvwebplayersdk-captions",
  "dss-subtitle",
  "jw-text-track",
  "plyr__captions",
  "shaka-text-container",
  "vp-captions"
] as const;

const subtitleDataAttributeNames = [
  "data-purpose",
  "data-testid",
  "data-uia"
] as const;

const subtitleDataMarker = /(?:caption|timedtext|text-track|cue-(?:text|window)|(?:player|video)[-_ ]*subtitle|subtitle[-_ ]*(?:cue|overlay|container|renderer))/iu;
// `data-testid="image-caption"` (bechtle.com) is a picture caption, not a
// player overlay: with subtitle processing off its text stayed unconverted.
const imageCaptionMarker = /(?:image|img|photo|picture|figure|teaser|bild)[\w -]*caption/iu;
const subtitleAriaMarker = /(?:untertitel|subtitles?|closed captions?)/iu;

function isSubtitleDataValue(value: string): boolean {
  return subtitleDataMarker.test(value) && !imageCaptionMarker.test(value);
}
export const subtitleClassifierAttributeNames = [
  "class",
  "id",
  "data-purpose",
  "data-testid",
  "data-uia",
  "aria-label"
] as const;
const escapedIdentifierMarkers = subtitleIdentifierMarkers.map((marker) =>
  marker.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")
);
const subtitleIdentifierMarker = new RegExp(
  `(?:${escapedIdentifierMarkers.join("|")})`,
  "u"
);

function identifierText(element: Element): string {
  return `${element.id} ${element.getAttribute("class") ?? ""}`.toLowerCase();
}

// Nur einschlägige Klassifikationsattribute lösen einen erneuten DOM-Scan aus.
export function matchesSubtitleMarker(
  attributeName: string,
  value: string | null
): boolean {
  if (!value) {
    return false;
  }
  if (attributeName === "class" || attributeName === "id") {
    return subtitleIdentifierMarker.test(value.toLowerCase());
  }
  if (subtitleDataAttributeNames.some((name) => name === attributeName)) {
    return isSubtitleDataValue(value);
  }
  return attributeName === "aria-label" && subtitleAriaMarker.test(value);
}

export function isSubtitleContainer(element: Element): boolean {
  // Every marker lives in an attribute; most text containers have none.
  if (!element.hasAttributes()) {
    return false;
  }
  const identifiers = identifierText(element);
  if (subtitleIdentifierMarker.test(identifiers)) {
    return true;
  }

  for (const attributeName of subtitleDataAttributeNames) {
    const value = element.getAttribute(attributeName);
    if (value && isSubtitleDataValue(value)) {
        return true;
    }
  }

  const ariaLabel = element.getAttribute("aria-label");
  return Boolean(ariaLabel && subtitleAriaMarker.test(ariaLabel));
}

function shadowHostOf(current: Node): Element | null {
  const root = current.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

/**
 * Erkennt bewusst nur typische Untertitel-Overlays. Allgemeine Klassen wie
 * `subtitle` oder `caption` werden nicht allein ausgewertet, weil sie auf
 * Nachrichtenseiten häufig normale Unterzeilen und Bildunterschriften meinen.
 */
// Tief verschachtelte Untertitel und offene ShadowRoots behalten den Hostkontext.
export function isSubtitleContent(node: Node,
  cache?: WeakMap<Element, boolean>): boolean {
  let element: Element | null =
    node instanceof Element ? node : node.parentElement ?? shadowHostOf(node);
  if (!element) return false;
  const hit = cache?.get(element);
  if (hit !== undefined) return hit;
  const visited: Element[] | undefined = cache ? [] : undefined;
  let subtitle = false;

  while (element) {
    const cached = cache?.get(element);
    if (cached !== undefined) {subtitle = cached; break;}
    visited?.push(element);
    if (isSubtitleContainer(element)) {
      subtitle = true;
      break;
    }
    if (element.tagName === "BODY" || element.tagName === "HTML") {
      break;
    }
    const current: Element = element;
    element = current.parentElement ?? shadowHostOf(current);
  }
  if (visited) for (const ancestor of visited) cache!.set(ancestor, subtitle);
  return subtitle;
}
