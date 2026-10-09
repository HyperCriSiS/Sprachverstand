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
const subtitleAriaMarker = /(?:untertitel|subtitles?|closed captions?)/iu;
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
    return subtitleDataMarker.test(value);
  }
  return attributeName === "aria-label" && subtitleAriaMarker.test(value);
}

export function isSubtitleContainer(element: Element): boolean {
  const identifiers = identifierText(element);
  if (subtitleIdentifierMarker.test(identifiers)) {
    return true;
  }

  for (const attributeName of subtitleDataAttributeNames) {
    const value = element.getAttribute(attributeName);
    if (value && subtitleDataMarker.test(value)) {
        return true;
    }
  }

  const ariaLabel = element.getAttribute("aria-label");
  return Boolean(ariaLabel && subtitleAriaMarker.test(ariaLabel));
}

/**
 * Erkennt bewusst nur typische Untertitel-Overlays. Allgemeine Klassen wie
 * `subtitle` oder `caption` werden nicht allein ausgewertet, weil sie auf
 * Nachrichtenseiten häufig normale Unterzeilen und Bildunterschriften meinen.
 */
// Tief verschachtelte Untertitel und offene ShadowRoots behalten den Hostkontext.
export function isSubtitleContent(node: Node): boolean {
  const hostOf = (current: Node): Element | null => {
    const root = current.getRootNode();
    return root instanceof ShadowRoot ? root.host : null;
  };
  let element: Element | null =
    node instanceof Element ? node : node.parentElement ?? hostOf(node);

  while (element) {
    if (isSubtitleContainer(element)) {
      return true;
    }
    if (element.tagName === "BODY" || element.tagName === "HTML") {
      return false;
    }
    const current: Element = element;
    element = current.parentElement ?? hostOf(current);
  }
  return false;
}