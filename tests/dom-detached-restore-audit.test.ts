import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const regel: Rule = {
  id: "test.detached-restore",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return { text, replacements: text === input ? 0 : 1 };
  }
};
let processor: DomProcessor | undefined;

function starten(): void {
  processor = new DomProcessor(document, {
    rules: [regel],
    profile: "conservative",
    processAccessibleAttributes: true
  });
  processor.start();
}

async function observerAbwarten(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  processor?.flush();
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

describe("Audit DOM-08: entfernte und recycelte DOM-Knoten", () => {
  it("stellt beim Detach das Original wieder her und beim Reinsert erneut um", async () => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "Nutzer:innen";
    document.body.append(paragraph);
    starten();

    expect(paragraph.textContent).toBe("Nutzer");
    paragraph.remove();
    await observerAbwarten();
    expect(paragraph.textContent).toBe("Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(0);

    document.body.append(paragraph);
    await observerAbwarten();
    expect(paragraph.textContent).toBe("Nutzer");
    processor?.stop({ restore: true });
    expect(paragraph.textContent).toBe("Nutzer:innen");
  });

  it("respektiert echte Änderungen am getrennten Knoten", async () => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "Nutzer:innen";
    document.body.append(paragraph);
    starten();
    paragraph.remove();
    await observerAbwarten();

    paragraph.textContent = "Extern neuer Text";
    document.body.append(paragraph);
    await observerAbwarten();
    expect(paragraph.textContent).toBe("Extern neuer Text");
  });

  it("restauriert getrennte Alt-/Title-Attribute und offene Shadow-Wurzeln", async () => {
    const host = document.createElement("div");
    host.title = "Nutzer:innen";
    const shadow = host.attachShadow({ mode: "open" });
    shadow.textContent = "Nutzer:innen";
    document.body.append(host);
    starten();
    expect(host.title).toBe("Nutzer");
    expect(shadow.textContent).toBe("Nutzer");

    host.remove();
    await observerAbwarten();
    expect(host.title).toBe("Nutzer:innen");
    expect(shadow.textContent).toBe("Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(0);

    document.body.append(host);
    await observerAbwarten();
    expect(host.title).toBe("Nutzer");
    expect(shadow.textContent).toBe("Nutzer");
  });
});
