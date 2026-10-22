import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { isDetailedTransformResult } from "../src/core/local-transform-message";
import { splitContextResult } from "../src/core/leading-context-edit";
import { transformText, transformTextWithSummary, type TransformOptions } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { domRuleMetadata } from "../src/rules/dom-metadata";

describe("Aufteilung von Kontext und Eingabe", () => {
  it.each([
    ["Das Projekt der ", "Künstler*in ist neu.", "Das Projekt des Künstlers ist neu.",
      {removed: "der ", inserted: "des "}, "Künstlers ist neu."],
    ["mit der ", "neuen Kolleg*in", "mit dem neuen Kollegen",
      {removed: "der ", inserted: "dem "}, "neuen Kollegen"],
    // Ein Paar im Kontext wird zu einem Wort.
    ["mit der oder die ", "Kolleg*in", "mit dem Kollegen",
      {removed: "der oder die ", inserted: "dem "}, "Kollegen"]
  ])("%s|%s", (context, input, output, edit, text) => {
    expect(splitContextResult(context, input, output)).toEqual({edit, text});
  });

  it("lehnt Änderungen weit vorne im Kontext ab", () => {
    expect(splitContextResult("Die Lehrer*innen und viele andere hier sagen ", "Hallo", "Die Lehrer und viele andere hier sagen Hallo"))
      .toBeUndefined();
  });
});

describe("Kontextänderung im Ergebnis", () => {
  const options = {profile: "aggressive" as const, leadingContext: "Das Projekt der "};

  it("meldet die Änderung des Begleitworts", () => {
    const result = transformTextWithSummary("Künstler*in", defaultRules, options);
    expect(result.text).toBe("Künstlers");
    expect(result.leadingContextEdit).toEqual({removed: "der ", inserted: "des "});
    expect(isDetailedTransformResult(result)).toBe(true);
  });

  it("schützt ohne Möglichkeit zur Kontextänderung wie bisher", () => {
    expect(transformText("Künstler*in", defaultRules, options).text).toBe("Künstler*in");
  });

  it("verwirft ungültige Kontextänderungen aus Nachrichten", () => {
    expect(isDetailedTransformResult({text: "a", replacements: 1, summaries: [],
      leadingContextEdit: {removed: "", inserted: "x"}})).toBe(false);
  });
});

describe("Kontextänderung bei Umwandlung im Hintergrund", () => {
  let processor: DomProcessor | undefined;
  afterEach(() => {
    processor?.stop({restore: false}); processor = undefined; document.body.replaceChildren();
  });
  async function drain() {
    for (let turn = 0; turn < 3; turn++) {
      for (let index = 0; index < 12; index++) await Promise.resolve();
      processor!.flush();
    }
  }
  function start(html: string, before?: () => void) {
    document.body.innerHTML = html;
    processor = new DomProcessor(document, {rules: domRuleMetadata, profile: "aggressive",
      processAccessibleAttributes: false,
      transformText: async (input: string, options: TransformOptions) => {
        before?.();
        return transformTextWithSummary(input, defaultRules, options);
      }});
    processor.start(); processor.flush();
  }

  it("ändert das Begleitwort mit dem Ergebnis aus dem Hintergrund", async () => {
    start("<p>Das Projekt der <em>Künstler*in</em> ist neu.</p>");
    await drain();
    expect(document.body.textContent).toBe("Das Projekt des Künstlers ist neu.");
  });

  it("verwirft das Ergebnis, wenn sich das Begleitwort inzwischen geändert hat", async () => {
    start("<p>Das Projekt der <em>Künstler*in</em> ist neu.</p>", () => {
      document.querySelector("p")!.firstChild!.textContent = "Das Projekt mit ";
    });
    await drain();
    expect(document.body.textContent).not.toContain("Künstlers");
  });
});
