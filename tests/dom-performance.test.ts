import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop();
  processor = undefined;
  document.body.innerHTML = "";
});

describe("DomProcessor Änderungsumfang", () => {
  it("scannt bei einer Textänderung nicht erneut die vollständige Seite", async () => {
    let ruleCalls = 0;
    const rule: Rule = {
      id: "test.counting-text",
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
    for (let index = 0; index < 1_000; index += 1) {
      const paragraph = document.createElement("p");
      paragraph.textContent = `Neutraler Absatz ${index}`;
      fragment.append(paragraph);
    }
    document.body.append(fragment);

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    ruleCalls = 0;
    const target = document.querySelectorAll("p")[500]?.firstChild as Text;
    target.data = "Neue Nutzer:innen";

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();

    expect(target.data).toBe("Neue Nutzer");
    expect(ruleCalls).toBeLessThanOrEqual(2);
  });

  it("verarbeitet bei einer Attributänderung nur das betroffene Attribut", async () => {
    let ruleCalls = 0;
    const rule: Rule = {
      id: "test.counting-attribute",
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
    for (let index = 0; index < 1_000; index += 1) {
      const element = document.createElement("div");
      element.title = `Neutraler Hinweis ${index}`;
      fragment.append(element);
    }
    document.body.append(fragment);

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    ruleCalls = 0;
    const target = document.querySelectorAll("div")[500] as HTMLDivElement;
    target.title = "Nutzer:innen anzeigen";

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();

    expect(target.title).toBe("Nutzer anzeigen");
    expect(ruleCalls).toBeLessThanOrEqual(2);
  });
});
