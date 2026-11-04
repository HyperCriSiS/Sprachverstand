import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const einfacheRegel: Rule = {
  id: "test.audit-editor-shadow",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return { text, replacements: text === input ? 0 : 1 };
  }
};

let processor: DomProcessor | undefined;

function starten(): DomProcessor {
  processor = new DomProcessor(document, {
    rules: [einfacheRegel],
    profile: "conservative",
    processAccessibleAttributes: true
  });
  processor.start();
  return processor;
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.designMode = "off";
  document.body.replaceChildren();
});

describe("Audit: Editor- und Shadow-Schutz", () => {
  it("lässt in DesignMode vorhandenen sowie neu eingegebenen Text unverändert", async () => {
    document.designMode = "on";
    const paragraph = document.createElement("p");
    paragraph.textContent = "Nutzer:innen schreiben";
    document.body.append(paragraph);

    starten();
    expect(paragraph.textContent).toBe("Nutzer:innen schreiben");

    const neuerText = document.createTextNode(" Neue Nutzer:innen");
    paragraph.append(neuerText);
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    processor?.flush();

    expect(neuerText.data).toBe(" Neue Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(0);
  });

  it("transformiert im DesignMode auch zugängliche Attribute nicht", () => {
    document.designMode = "on";
    const element = document.createElement("button");
    element.setAttribute("aria-label", "Nutzer:innen öffnen");
    document.body.append(element);

    starten();
    expect(element.getAttribute("aria-label")).toBe("Nutzer:innen öffnen");
    expect(processor?.getReplacementCount()).toBe(0);
  });

  for (const [name, attribute, value] of [
    ["Ignore", "data-sprachverstand-ignore", ""],
    ["Editor", "contenteditable", "true"],
    ["ARIA", "aria-hidden", "true"]
  ] as const) {
    it(`schützt direkte Shadow-Textknoten bei ${name}-Host`, () => {
      const host = document.createElement("div");
      host.setAttribute(attribute, value);
      const shadow = host.attachShadow({ mode: "open" });
      const text = document.createTextNode("Nutzer:innen schreiben");
      shadow.append(text);
      document.body.append(host);

      starten();
      expect(text.data).toBe("Nutzer:innen schreiben");
      expect(processor?.getReplacementCount()).toBe(0);
    });
  }

  it("verarbeitet weiterhin ungeschützte direkte Shadow-Textknoten", () => {
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "open" });
    const text = document.createTextNode("Nutzer:innen schreiben");
    shadow.append(text);
    document.body.append(host);

    starten();
    expect(text.data).toBe("Nutzer schreiben");
    expect(processor?.getReplacementCount()).toBe(1);
  });
});
