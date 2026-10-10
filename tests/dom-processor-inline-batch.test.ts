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

function starten(protectedTerms: string[] = []): void {
  processor = new DomProcessor(document, {
    rules: [regel],
    profile: "conservative",
    processAccessibleAttributes: false,
    processQuotedText: false,
    protectedTerms
  });
  processor.start();
  processor.flush();
}

function wurzelTraversierungen(
  spy: ReturnType<typeof vi.spyOn>,
  wurzel: Node
): number {
  return spy.mock.calls.filter(([node, show]) =>
    node === wurzel && show === NodeFilter.SHOW_TEXT
  ).length;
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("Inline-Schutzkontext bei MutationObserver-Mischlast", () => {
  it("ersetzt gewöhnliche Textknoten, ohne ihren gesamten Inline-Block erneut zu scannen", async () => {
    const { wurzel, elemente } = anlegen(480);
    elemente[400]!.textContent = "„Nutzer:innen“";
    starten();
    const walker = vi.spyOn(document, "createTreeWalker");

    for (let i = 0; i < 48; i++) {
      elemente[i]!.textContent = "Neue Nutzer:innen " + i;
    }
    await Promise.resolve();

    expect(wurzelTraversierungen(walker, wurzel)).toBe(0);
    processor?.flush();
    for (let i = 0; i < 48; i++) {
      expect(elemente[i]?.textContent).toBe("Neue Nutzer " + i);
    }
    // Nicht veränderte Zitate bleiben auch bei einfacher Textneuverteilung geschützt.
    expect(elemente[400]?.textContent).toBe("„Nutzer:innen“");
  });

  it("kombiniert viele Änderungen mit neuen Anführungszeichen zu einer Traversierung", async () => {
    const { wurzel, elemente } = anlegen(480);
    starten();
    const walker = vi.spyOn(document, "createTreeWalker");

    elemente[0]!.textContent = "„Neue Nutzer:innen“";
    for (let i = 1; i < 48; i++) {
      elemente[i]!.textContent = "Weitere Nutzer:innen " + i;
    }
    await Promise.resolve();
    const anzahl = wurzelTraversierungen(walker, wurzel);
    expect(anzahl).toBeGreaterThanOrEqual(1);
    expect(anzahl).toBeLessThanOrEqual(2);

    processor?.flush();
    expect(elemente[0]?.textContent).toBe("„Neue Nutzer:innen“");
    for (let i = 1; i < 48; i++) {
      expect(elemente[i]?.textContent).toBe("Weitere Nutzer " + i);
    }
  });

  it("trennt unabhängige Schutzblöcke und invalidiert spätere Zitatänderungen erneut", async () => {
    const links = anlegen(120);
    const rechts = anlegen(120);
    starten();
    const walker = vi.spyOn(document, "createTreeWalker");

    for (let i = 0; i < 36; i++) {
      links.elemente[i]!.textContent = i === 0 ? "„Weitere Nutzer:innen“" : "Weitere Nutzer:innen " + i;
      rechts.elemente[i]!.textContent = i === 0 ? "„Andere Nutzer:innen“" : "Andere Nutzer:innen " + i;
    }
    await Promise.resolve();
    expect(wurzelTraversierungen(walker, links.wurzel)).toBe(1);
    expect(wurzelTraversierungen(walker, rechts.wurzel)).toBe(1);

    processor?.flush();
    expect(links.elemente[0]?.textContent).toBe("„Weitere Nutzer:innen“");
    expect(rechts.elemente[1]?.textContent).toBe("Andere Nutzer 1");

    walker.mockClear();
    links.elemente[0]!.textContent = "„Erneute Nutzer:innen“";
    await Promise.resolve();
    expect(wurzelTraversierungen(walker, links.wurzel)).toBe(1);
    processor?.flush();
    expect(links.elemente[0]?.textContent).toBe("„Erneute Nutzer:innen“");
  });

  it("behält bei benutzerdefinierten Schutzbegriffen den vollen Kontextabgleich bei", async () => {
    const { wurzel, elemente } = anlegen(60);
    starten(["Nutzer"]);
    const walker = vi.spyOn(document, "createTreeWalker");
    elemente[0]!.textContent = "Weitere Nutzer:innen";
    elemente[1]!.textContent = "Andere Nutzer:innen";
    await Promise.resolve();
    expect(wurzelTraversierungen(walker, wurzel)).toBe(1);
  });
});
