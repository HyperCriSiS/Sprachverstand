import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

async function abwarten(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  processor?.flush();
}
function starten(): DomProcessor {
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false
  });
  processor.start();
  return processor;
}
afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

describe("Audit DOM-03: Kontextinvalidierung bei dynamischem Kasuswechsel", () => {
  it("ändert Dativ nach Mutation des linken Textknotens wieder zu Plural", async () => {
    const p = document.createElement("p");
    p.innerHTML = "<span>Wir sprechen mit </span><b>Lehrer:innen</b>.";
    document.body.append(p);
    const dom = starten();
    const left = p.querySelector("span")?.firstChild as Text;
    const right = p.querySelector("b") as HTMLElement;

    expect(right.textContent).toBe("Lehrern");
    left.data = "Wir sehen ";
    await abwarten();
    expect(right.textContent).toBe("Lehrer");
    expect(dom.getReplacementCount()).toBe(1);

    left.data = "Wir sprechen mit ";
    await abwarten();
    expect(right.textContent).toBe("Lehrern");
    expect(dom.getReplacementCount()).toBe(1);
  });

  it("behandelt textContent-Neusetzen des Präfixelements", async () => {
    const p = document.createElement("p");
    p.innerHTML = "<span>Wir sprechen mit </span><b>Lehrer:innen</b>.";
    document.body.append(p);
    starten();
    expect(p.querySelector("b")?.textContent).toBe("Lehrern");

    const left = p.querySelector("span") as HTMLElement;
    left.textContent = "Wir sehen ";
    await abwarten();
    expect(p.querySelector("b")?.textContent).toBe("Lehrer");
  });

  it("verarbeitet auch den Wegfall des Präfixelements", async () => {
    const p = document.createElement("p");
    p.innerHTML = "<span>Wir sprechen mit </span><b>Lehrer:innen</b>.";
    document.body.append(p);
    starten();
    expect(p.querySelector("b")?.textContent).toBe("Lehrern");

    p.querySelector("span")?.remove();
    await abwarten();
    expect(p.querySelector("b")?.textContent).toBe("Lehrer");
  });

  it("verändert keine Inhalte über Block- und Ignoregrenzen hinweg", async () => {
    const wrapper = document.createElement("div");
    wrapper.innerHTML =
      "<p><span>Wir sprechen mit </span><b>Lehrer:innen</b></p>" +
      "<p><b>Lehrer:innen</b></p>";
    document.body.append(wrapper);
    starten();
    const rights = [...wrapper.querySelectorAll("b")];
    expect(rights.map((node) => node.textContent)).toEqual(["Lehrern", "Lehrer"]);
    (wrapper.querySelector("span") as HTMLElement).textContent = "Wir sehen ";
    await abwarten();
    expect(rights.map((node) => node.textContent)).toEqual(["Lehrer", "Lehrer"]);
  });
});