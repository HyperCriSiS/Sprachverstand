import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop();
  processor = undefined;
  document.body.innerHTML = "";
});

describe("DomProcessor Initialscan", () => {
  it("verarbeitet einen großen Start-DOM genau einmal pro Textknoten", async () => {
    const textNodeCount = 4_000;
    let ruleCalls = 0;
    const rule: Rule = {
      id: "test.initial-scan-counting",
      risk: "safe",
      apply(input) {
        ruleCalls += 1;
        const text = input.replaceAll("Nutzer:innen", "Nutzer");
        return {
          text,
          replacements: text === input ? 0 : 1
        };
      }
    };

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < textNodeCount; index += 1) {
      const paragraph = document.createElement("p");
      paragraph.textContent = `Nutzer:innen ${index}`;
      fragment.append(paragraph);
    }
    document.body.append(fragment);

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      processAccessibleAttributes: false
    });
    processor.start();

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();

    expect(ruleCalls).toBe(textNodeCount);
    expect(processor.getReplacementCount()).toBe(textNodeCount);
    expect(document.body.textContent).not.toContain("Nutzer:innen");
    expect(document.querySelector("p")?.textContent).toBe("Nutzer 0");
    expect(document.querySelectorAll("p")[textNodeCount - 1]?.textContent).toBe(
      `Nutzer ${textNodeCount - 1}`
    );
  });
});
