import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const regel: Rule = {
  id: "test.attribute-removal",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return { text, replacements: text === input ? 0 : 1 };
  }
};

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

describe("Audit DOM-07: entfernte Zugänglichkeitsattribute freigeben", () => {
  it("entfernt verwaiste Zähler und Übersichten", async () => {
    const bild = document.createElement("img");
    bild.alt = "Nutzer:innen";
    document.body.append(bild);
    processor = new DomProcessor(document, {
      rules: [regel],
      profile: "conservative",
      processAccessibleAttributes: true
    });
    processor.start();
    expect(bild.alt).toBe("Nutzer");
    expect(processor.getReplacementCount()).toBe(1);
    expect(processor.getReplacementSummary()).toHaveLength(1);

    bild.removeAttribute("alt");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(bild.hasAttribute("alt")).toBe(false);
    expect(processor.getReplacementCount()).toBe(0);
    expect(processor.getReplacementSummary()).toEqual([]);

    bild.alt = "Neutrales Bild";
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(processor.getReplacementCount()).toBe(0);

    bild.alt = "Neue Nutzer:innen";
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(bild.alt).toBe("Neue Nutzer");
    expect(processor.getReplacementCount()).toBe(1);

    bild.remove();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(processor.getReplacementCount()).toBe(0);
    expect(processor.getReplacementSummary()).toEqual([]);
  });
});
