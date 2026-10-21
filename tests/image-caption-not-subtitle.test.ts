import {afterEach, describe, expect, it} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {isSubtitleContainer} from "../src/core/subtitles";
import {defaultRules} from "../src/rules";

let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: false}); processor = undefined; document.body.replaceChildren();
});

// Webanalyse 21.10.2026, bechtle.com: Bildunterschriften mit
// `data-testid="image-caption"` galten als Video-Untertitel und blieben bei
// ausgeschalteter Untertitelverarbeitung unverändert.
describe("Bildunterschriften sind keine Untertitel", () => {
  it.each(["image-caption", "image-animation-caption", "img_caption", "photo-caption", "picture caption", "figure-caption"])(
    "%s", (value) => {
      const element = document.createElement("div");
      element.setAttribute("data-testid", value);
      expect(isSubtitleContainer(element)).toBe(false);
    });

  it.each(["captions-overlay", "player-timedtext", "caption-window", "video-subtitle"])(
    "%s bleibt Untertitel", (value) => {
      const element = document.createElement("div");
      element.setAttribute("data-purpose", value);
      expect(isSubtitleContainer(element)).toBe(true);
    });

  it("wandelt den Text einer Bildunterschrift beim Initialscan um", () => {
    document.body.innerHTML = '<div data-testid="image-caption"><a href="/karriere/schueler">' +
      '<div class="h3">Schüler:innen.</div></a></div>';
    processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive"});
    processor.start(); processor.flush();
    expect(document.body.textContent).toBe("Schüler.");
  });
});
