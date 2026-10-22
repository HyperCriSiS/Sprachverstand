import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

function pruefen(html: string): string {
  document.body.innerHTML = html;
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false
  });
  processor.start();
  return document.querySelector("b")?.textContent ?? "";
}

describe("Audit DOM-04: ausgeschlossene Inlinebereiche nie als grammatischen Kontext lesen", () => {
  it("verwendet sichtbaren Inlinekontext weiterhin für Dativflexion", () => {
    expect(pruefen("<p><span>Wir sprechen mit </span><b>Lehrer:innen</b></p>"))
      .toBe("Lehrern");
  });

  it.each([
    '<span aria-hidden="true">mit </span>',
    '<span data-sprachverstand-ignore>mit </span>',
    '<code>mit </code>',
    '<span role="textbox">mit </span>',
    '<span><span aria-hidden="true">mit </span></span>',
    '<span><code>mit </code></span>'
  ])("lässt %s nicht in die Dativentscheidung einfließen", (protectedPrefix) => {
    expect(pruefen(`<p>${protectedPrefix}<b>Lehrer:innen</b></p>`))
      .toBe("Lehrer");
  });

  it("überspringt beim Kontextsammeln keine verbotene Zwischenregion", () => {
    expect(pruefen(
      '<p><span>Wir sprechen mit </span><span aria-hidden="true">Hinweis</span><b>Lehrer:innen</b></p>'
    )).toBe("Lehrer");
  });

  it("achtet auf eine Blockgrenze zwischen Präfix und Kandidat", () => {
    expect(pruefen("<div><p>mit </p><p><b>Lehrer:innen</b></p></div>"))
      .toBe("Lehrer");
  });
});
