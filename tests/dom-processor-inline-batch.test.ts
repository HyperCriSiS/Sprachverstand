import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { createRegexRule } from "../src/core/rule";

const regel = createRegexRule({
  id: "test.inline-observer-batch",
  risk: "safe",
  pattern: /Nutzer:innen/gu,
  replace: () => "Nutzer"
});
let processor: DomProcessor | undefined;

function anlegen(anzahl: number): {wurzel: HTMLDivElement; elemente: HTMLSpanElement[]} {
  const wurzel = document.createElement("div");
  const fragment = document.createDocumentFragment();
  const elemente: HTMLSpanElement[] = [];
  for (let i = 0; i < anzahl; i++) {
    const span = document.createElement("span");
    span.textContent = "Nutzer:innen " + i;
    fragment.appendChild(span);
    elemente.push(span);
  }
  wurzel.appendChild(fragment);
  document.body.appendChild(wurzel);
  return { wurzel, elemente };
}

function starten(): void {
  processor = new DomProcessor(document, {
    rules: [regel],
    profile: "conservative",
    processAccessibleAttributes: false,
    processQuotedText: false
  });
  processor.start();
  processor.flush();
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("Inline-Schutzkontext bei MutationObserver-Mischlast", () => {
  it("invalidiert denselben gemeinsamen Inline-Block nur einmal pro Mutation-Batch", async () => {
    const { wurzel, elemente } = anlegen(480);
    starten();
    const walker = vi.spyOn(document, "createTreeWalker");

    for (let i = 0; i < 48; i++) {
      elemente[i]!.textContent = "Neue Nutzer:innen " + i;
    }
    await Promise.resolve();

    const anzahl = walker.mock.calls.filter(([root, show]) =>
      root === wurzel && show === NodeFilter.SHOW_TEXT
    ).length;
    expect(anzahl).toBeGreaterThanOrEqual(1);
    expect(anzahl).toBeLessThanOrEqual(2);

    processor?.flush();
    for (let i = 0; i < 48; i++) {
      expect(elemente[i]?.textContent).toBe("Neue Nutzer " + i);
    }
  });

  it("trennt unabhängige Blöcke und invalidiert später erneut", async () => {
    const links = anlegen(120);
    const rechts = anlegen(120);
    starten();
    const walker = vi.spyOn(document, "createTreeWalker");

    for (let i = 0; i < 36; i++) {
      links.elemente[i]!.textContent = "Weitere Nutzer:innen " + i;
      rechts.elemente[i]!.textContent = "Andere Nutzer:innen " + i;
    }
    await Promise.resolve();
    const treffer = (root: Node) => walker.mock.calls.filter(([node, show]) =>
      node === root && show === NodeFilter.SHOW_TEXT
    ).length;

    expect(treffer(links.wurzel)).toBeGreaterThanOrEqual(1);
    expect(treffer(links.wurzel)).toBeLessThanOrEqual(2);
    expect(treffer(rechts.wurzel)).toBeGreaterThanOrEqual(1);
    expect(treffer(rechts.wurzel)).toBeLessThanOrEqual(2);

    processor?.flush();
    expect(links.elemente[0]?.textContent).toBe("Weitere Nutzer 0");
    expect(rechts.elemente[0]?.textContent).toBe("Andere Nutzer 0");

    walker.mockClear();
    links.elemente[0]!.textContent = "Erneute Nutzer:innen";
    await Promise.resolve();
    expect(treffer(links.wurzel)).toBeGreaterThanOrEqual(1);
    processor?.flush();
    expect(links.elemente[0]?.textContent).toBe("Erneute Nutzer");
  });
});
