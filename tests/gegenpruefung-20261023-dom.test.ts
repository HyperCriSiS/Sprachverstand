import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { transformTextWithSummary, type TransformOptions } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { domRuleMetadata } from "../src/rules/dom-metadata";

// Unabhängige Gegenprüfung von Codex, 23.10.2026 (artifacts/gegenpruefung-20261023).
let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: false}); processor = undefined; document.body.replaceChildren();
});

function start(html: string): HTMLElement {
  document.body.innerHTML = html;
  processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive",
    processAccessibleAttributes: false});
  processor.start(); processor.flush();
  return document.querySelector("p")!;
}

async function settle(): Promise<void> {
  for (let turn = 0; turn < 3; turn++) {
    for (let index = 0; index < 12; index++) await Promise.resolve();
    processor!.flush();
  }
}

describe("Begleitwort und Nomen nach Seitenänderungen (N14)", () => {
  it("rechnet nach geändertem Nomen beide neu", async () => {
    const paragraph = start("<p>Das Projekt der <em>Künstler*in</em> ist neu.</p>");
    expect(paragraph.textContent).toBe("Das Projekt des Künstlers ist neu.");
    paragraph.querySelector("em")!.firstChild!.textContent = "Lehrer*in";
    await settle();
    expect(paragraph.textContent).toBe("Das Projekt des Lehrers ist neu.");
    processor!.stop({restore: true});
    expect(paragraph.innerHTML).toBe("Das Projekt der <em>Lehrer*in</em> ist neu.");
  });

  it("rechnet nach ausgetauschtem Inline-Element beide neu", async () => {
    const paragraph = start("<p>Das Projekt der <em>Künstler*in</em> ist neu.</p>");
    const strong = document.createElement("strong");
    strong.textContent = "Lehrer*in";
    paragraph.querySelector("em")!.replaceWith(strong);
    await settle();
    expect(paragraph.innerHTML).toBe("Das Projekt des <strong>Lehrers</strong> ist neu.");
  });

  it("rechnet auch mit Umwandlung im Hintergrund beide neu", async () => {
    document.body.innerHTML = "<p>Das Projekt der <em>Künstler*in</em> ist neu.</p>";
    processor = new DomProcessor(document, {rules: domRuleMetadata, profile: "aggressive",
      processAccessibleAttributes: false,
      transformText: async (input: string, options: TransformOptions) =>
        transformTextWithSummary(input, defaultRules, options)});
    processor.start(); processor.flush();
    await settle();
    const paragraph = document.querySelector("p")!;
    expect(paragraph.textContent).toBe("Das Projekt des Künstlers ist neu.");
    paragraph.querySelector("em")!.firstChild!.textContent = "Lehrer*in";
    await settle();
    expect(paragraph.textContent).toBe("Das Projekt des Lehrers ist neu.");
  });

  it("nimmt das Begleitwort zurück, wenn das Nomen keines mehr braucht", async () => {
    const paragraph = start("<p>Das Projekt der <em>Künstler*in</em> ist neu.</p>");
    paragraph.querySelector("em")!.firstChild!.textContent = "Gemeinde";
    await settle();
    expect(paragraph.textContent).toBe("Das Projekt der Gemeinde ist neu.");
  });
});

describe("Geschütztes Begleitwort (V03)", () => {
  it.each([
    "<p>Das Projekt <code>der </code><em>Künstler*in</em> ist neu.</p>",
    "<p>Das Projekt <span contenteditable=\"true\">der </span><em>Künstler*in</em> ist neu.</p>"
  ])("bleibt: %s", (html) => {
    const paragraph = start(html);
    expect(paragraph.outerHTML).toBe(html);
  });
});
