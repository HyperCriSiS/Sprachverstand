import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { createRegexRule } from "../src/core/rule";
import { defaultRules } from "../src/rules";

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
  return spy.mock.calls.filter((args: unknown[]) =>
    args[0] === wurzel && args[1] === NodeFilter.SHOW_TEXT
  ).length;
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("Inline-Schutzkontext bei MutationObserver-Mischlast", () => {
  it("vereinigt überlappende Laufwege und erreicht den Kontext hinter der letzten Mutation", async () => {
    const {elemente} = anlegen(128);
    for (let index = 0; index < 47; index++) elemente[index]!.textContent = "Normaler Text " + index + " ";
    elemente[47]!.textContent = "mit ";
    processor = new DomProcessor(document, {profile: "aggressive", rules: defaultRules,
      processAccessibleAttributes: false});
    processor.start(); processor.flush(); await Promise.resolve();
    expect(elemente[48]!.textContent).toBe("Nutzern 48");
    const nextSibling = vi.spyOn(Node.prototype, "nextSibling", "get");
    for (let index = 0; index < 47; index++) elemente[index]!.textContent = "Aktueller Text " + index + " ";
    elemente[47]!.textContent = "für ";
    await Promise.resolve();
    expect(nextSibling.mock.calls.length).toBeLessThan(400);
    processor.flush();
    expect(elemente[48]!.textContent).toBe("Nutzer 48");
    expect(processor.getReplacementCount()).toBe(80);
  });
  it("transformiert unveränderte Nachbarn ohne wirksamen Dativkontext nicht erneut", async () => {
    const {elemente} = anlegen(128);
    const apply = vi.fn((text: string) => ({text, replacements: 0}));
    processor = new DomProcessor(document, {profile: "aggressive",
      rules: [...defaultRules, {id: "test.transform-count", risk: "safe", apply}],
      processAccessibleAttributes: false});
    processor.start(); processor.flush(); await Promise.resolve();
    apply.mockClear();
    for (let index = 0; index < 48; index++) {
      elemente[index]!.textContent = "Nutzer:innen " + (index + 10);
    }
    await Promise.resolve(); processor.flush(); await Promise.resolve();
    expect(apply).toHaveBeenCalledTimes(48);
    expect(processor.getReplacementCount()).toBe(128);
    for (let index = 0; index < 128; index++) {
      expect(elemente[index]!.textContent).toBe("Nutzer " + (index < 48 ? index + 10 : index));
    }
  });
  it("prüft überlappende grammatische Nachbarfenster nur einmal pro Textknoten", async () => {
    const {elemente} = anlegen(128);
    const candidate = /^Nutzer/u;
    const unchanged = (input: string) => ({text: input, replacements: 0});
    processor = new DomProcessor(document, {profile: "conservative", rules: [{
      id: "test.neighbor-windows", risk: "safe", leadingContextCandidate: candidate,
      apply: unchanged, applyWithLeadingContext: unchanged
    }], processAccessibleAttributes: false});
    processor.start(); processor.flush();
    await Promise.resolve();
    const check = vi.spyOn(candidate, "test");
    for (let index = 0; index < 48; index++) {
      elemente[index]!.textContent = "Nutzer:innen " + (index + 10);
    }
    await Promise.resolve();
    // Complete the sliced neighbor work before counting its checks, without
    // also running the separate transformation queue.
    const context = processor as unknown as {processFollowingContextStep(): boolean};
    while (context.processFollowingContextStep()) { /* Complete this observer batch. */ }
    expect(check.mock.calls.length).toBeGreaterThan(48);
    expect(check.mock.calls.length).toBeLessThanOrEqual(64);
  });
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
    const { elemente } = anlegen(60);
    starten(["Nutzer"]);
    elemente[0]!.textContent = "Weitere Nutzer:innen";
    elemente[1]!.textContent = "Andere Nutzer:innen";
    await Promise.resolve();
    processor!.flush();
    expect(elemente[0]!.textContent).toBe("Weitere Nutzer:innen");
    expect(elemente[1]!.textContent).toBe("Andere Nutzer:innen");
    for (let index = 2; index < elemente.length; index++) {
      expect(elemente[index]!.textContent).toBe("Nutzer:innen " + index);
    }
    expect(processor!.getReplacementCount()).toBe(0);
  });
});
