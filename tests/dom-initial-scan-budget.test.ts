import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

let processor: DomProcessor | undefined;
let calls = 0;

const rule: Rule = {
  id: "test.initial-scan-budget",
  risk: "safe",
  apply(input) {
    calls += 1;
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return { text, replacements: text === input ? 0 : 1 };
  }
};

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  calls = 0;
  document.body.replaceChildren();
});

function start(): void {
  processor = new DomProcessor(document, {
    rules: [rule],
    profile: "conservative",
    processAccessibleAttributes: false
  });
  processor.start();
}

function appendParagraphs(target: ParentNode, count: number): void {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen";
    fragment.append(p);
  }
  target.appendChild(fragment);
}

describe("Initialscan: begrenzter synchroner Start", () => {
  it("verschiebt große Dokumente in die vorhandene budgetierte Warteschlange", () => {
    appendParagraphs(document.body, 300);
    start();

    expect(calls).toBe(0);
    expect(document.body.textContent).toContain("Nutzer:innen");
    processor?.flush();
    expect(calls).toBe(300);
    expect(document.body.textContent).not.toContain("Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(300);
  });

  it("behält die unmittelbare Verarbeitung sehr kleiner Seiten bei", () => {
    appendParagraphs(document.body, 3);
    start();
    expect(calls).toBe(3);
    expect(document.body.textContent).not.toContain("Nutzer:innen");
  });

  it("zählt Textknoten in offenen ShadowRoots beim Startbudget mit", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    appendParagraphs(root, 150);
    start();

    expect(calls).toBe(0);
    expect(root.textContent).toContain("Nutzer:innen");
    processor?.flush();
    expect(calls).toBe(150);
    expect(root.textContent).not.toContain("Nutzer:innen");
  });

  it("führt eine beim Stoppen verworfene Initialarbeit nicht nachträglich aus", async () => {
    appendParagraphs(document.body, 200);
    start();
    expect(calls).toBe(0);
    processor?.stop({ restore: true });
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    expect(calls).toBe(0);
    expect(document.body.textContent).toContain("Nutzer:innen");
  });
});
