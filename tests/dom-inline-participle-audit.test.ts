import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

function transformieren(html: string): string {
  document.body.innerHTML = html;
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false
  });
  processor.start();
  return document.querySelector("p")?.textContent ?? "";
}

describe("Audit DOM-01: Partizip mit Inline-Markup", () => {
  it.each([
    ["<p>Mitarbeitende <b>Eltern</b> helfen.</p>", "Mitarbeitende Eltern helfen."],
    ["<p><span>Mitarbeitende </span><b>Eltern</b> helfen.</p>", "Mitarbeitende Eltern helfen."],
    ["<p>Studierende <strong>Kinder</strong> spielen.</p>", "Studierende Kinder spielen."],
    ["<p>Lehrende <i>Personen</i> lernen.</p>", "Lehrende Personen lernen."],
    ["<p>Die <b>Mitarbeitende</b> wartet.</p>", "Die Mitarbeiterin wartet."],
    ["<p>Eine <b>Studierende</b> wartet.</p>", "Eine Studentin wartet."],
    ["<p>Eine <span><i>Lehrende</i></span> spricht.</p>", "Eine Lehrerin spricht."]
  ])("bewahrt Kontextsemantik über Elementgrenzen", (html, expected) => {
    expect(transformieren(html)).toBe(expected);
  });

  it("behält bei geschütztem rechten Nachbarn die isolierte Entscheidung", () => {
    expect(transformieren(
      '<p>Mitarbeitende <span aria-hidden="true">Eltern</span> helfen.</p>'
    )).toBe("Mitarbeiter Eltern helfen.");
  });

  it("transformiert weiterhin unzweideutige reguläre Vorkommen", () => {
    expect(transformieren("<p>Die Mitarbeitenden arbeiten.</p>"))
      .toBe("Die Mitarbeiter arbeiten.");
  });
});
