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
const maximumAncestorDepth = 12;
const knownSubtitleElements = new WeakSet<Element>();
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

export function isSubtitleContainer(element: Element): boolean {
  if (knownSubtitleElements.has(element)) {
    return true;
  }

  const identifiers = identifierText(element);
  if (subtitleIdentifierMarker.test(identifiers)) {
    knownSubtitleElements.add(element);
    return true;
  }

  for (const attributeName of subtitleDataAttributeNames) {
    const value = element.getAttribute(attributeName);
    if (value && subtitleDataMarker.test(value)) {
      knownSubtitleElements.add(element);
      return true;
    }
  }

  const ariaLabel = element.getAttribute("aria-label");
  const subtitle = Boolean(ariaLabel && subtitleAriaMarker.test(ariaLabel));
  if (subtitle) {
    knownSubtitleElements.add(element);
  }
  return subtitle;
}

/**
 * Erkennt bewusst nur typische Untertitel-Overlays. Allgemeine Klassen wie
 * `subtitle` oder `caption` werden nicht allein ausgewertet, weil sie auf
 * Nachrichtenseiten häufig normale Unterzeilen und Bildunterschriften meinen.
 */
export function isSubtitleContent(node: Node): boolean {
  let element =
    node.nodeType === Node.ELEMENT_NODE
      ? (node as Element)
      : node.parentElement;

  for (let depth = 0; element && depth < maximumAncestorDepth; depth += 1) {
    if (isSubtitleContainer(element)) {
      return true;
    }

    if (element.tagName === "BODY" || element.tagName === "HTML") {
      break;
    }
    element = element.parentElement;
  }

  return false;
}
