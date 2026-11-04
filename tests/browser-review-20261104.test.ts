import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";
import { domRuleMetadata } from "../src/rules/dom-metadata";
import { isBuiltInTransformCandidate } from "../src/rules/transform-candidate";

let processor: DomProcessor | undefined;

function starten(options: Partial<ConstructorParameters<typeof DomProcessor>[1]> = {}): DomProcessor {
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: true,
    processSubtitles: false,
    ...options
  });
  processor.start();
  return processor;
}

async function aktualisieren(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  processor?.flush();
  await Promise.resolve();
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
  document.head.replaceChildren();
  vi.useRealTimers();
});

describe("Browser-Überprüfung 04.11.2026", () => {
  it("lässt den Dokumenttitel beim Start und bei späterer Änderung unverändert", async () => {
    document.head.innerHTML = "<title>Mitarbeiter:innen gesucht</title>";
    document.body.innerHTML = "<p>Alle Mitarbeiter:innen</p>";
    starten();
    await aktualisieren();
    expect(document.body.textContent).toBe("Alle Mitarbeiter");
    expect(document.title).toBe("Mitarbeiter:innen gesucht");
    document.title = "Neue Mitarbeiter:innen gesucht";
    await aktualisieren();
    expect(document.title).toBe("Neue Mitarbeiter:innen gesucht");
    expect(processor?.getReplacementCount()).toBe(1);
  });

  it("lässt den sichtbaren Spiegel eines Editors unter aria-hidden unverändert", async () => {
    // Monaco: the visible lines are aria-hidden, the real input is a textarea.
    document.body.innerHTML =
      '<div class="monaco-editor"><textarea class="inputarea">Alle Mitarbeiter:innen</textarea>' +
      '<div class="view-lines" aria-hidden="true" role="presentation"><div class="view-line">' +
      "<span>Alle Mitarbeiter:innen</span></div></div></div>" +
      "<p>Alle Lehrer:innen</p>";
    starten();
    await aktualisieren();
    expect(document.querySelector(".view-line")?.textContent).toBe("Alle Mitarbeiter:innen");
    expect(document.querySelector("textarea")?.value).toBe("Alle Mitarbeiter:innen");
    expect(document.querySelector("p")?.textContent).toBe("Alle Lehrer");
  });

  it("schützt zugängliche Attribute unter einer Editor-Rolle wie den Text", async () => {
    document.body.innerHTML =
      '<div role="textbox"><span>Alle Mitarbeiter:innen</span><img alt="Mitarbeiter:innen"></div>' +
      '<div role="combobox"><img title="Lehrer:innen"></div>';
    starten();
    await aktualisieren();
    expect(document.querySelector("span")?.textContent).toBe("Alle Mitarbeiter:innen");
    expect(document.querySelector("img")?.getAttribute("alt")).toBe("Mitarbeiter:innen");
    expect(document.querySelector("[role='combobox'] img")?.getAttribute("title")).toBe("Lehrer:innen");
    expect(processor?.getReplacementCount()).toBe(0);
  });

  it("reiht bei Klassenwechseln ohne Markeränderung in Untertiteln keinen Aufräumlauf ein", async () => {
    const parts: string[] = [];
    for (let index = 0; index < 100; index += 1) parts.push(`<p>Absatz ${index} mit Mitarbeiter:innen</p>`);
    document.body.innerHTML = parts.join("") +
      '<div><span class="ytp-caption-segment">Hallo Nutzer:innen</span></div>';
    const current = starten();
    await aktualisieren();
    expect(current.getReplacementCount()).toBe(100);
    const segment = document.querySelector(".ytp-caption-segment")!;
    const internals = current as unknown as {
      detachedCleanup?: unknown;
      isSubtitleContent: (node: Node) => boolean;
    };
    let classifications = 0;
    const original = internals.isSubtitleContent;
    internals.isSubtitleContent = function (this: unknown, node: Node) {
      classifications += 1;
      return original.call(this, node);
    };
    segment.setAttribute("class", "ytp-caption-segment ytp-caption-segment-visible");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    expect(internals.detachedCleanup).toBeUndefined();
    expect(classifications).toBe(0);
    expect(segment.textContent).toBe("Hallo Nutzer:innen");

    // Removing the marker still reclassifies the element and converts it.
    segment.setAttribute("class", "plain");
    await aktualisieren();
    expect(segment.textContent).toBe("Hallo Nutzer");
  });

  it("gibt einen dauerhaft fehlschlagenden Transformer nach wenigen Versuchen auf", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    let calls = 0;
    const transformText = () => {
      calls += 1;
      return Promise.reject(new Error("Ungültiges lokales Transformationsergebnis."));
    };
    document.body.innerHTML = "<p>Alle Mitarbeiter:innen</p>";
    processor = new DomProcessor(document, {
      rules: domRuleMetadata,
      profile: "aggressive",
      isTransformCandidate: isBuiltInTransformCandidate,
      transformText,
      processAccessibleAttributes: false,
      processSubtitles: false
    });
    processor.start();
    for (let tick = 0; tick < 300; tick += 1) await vi.advanceTimersByTimeAsync(100);
    // First attempt plus retries after 1, 2 and 4 seconds, then nothing more.
    expect(calls).toBe(4);
    expect(document.querySelector("p")?.textContent).toBe("Alle Mitarbeiter:innen");
  });

  it("setzt die Fehlversuche nach einer erfolgreichen Antwort zurück", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    let failing = true;
    let calls = 0;
    const transformText = (input: string) => {
      calls += 1;
      if (failing) return Promise.reject(new Error("vorübergehend"));
      return Promise.resolve({ text: input.replace("Mitarbeiter:innen", "Mitarbeiter"), replacements: 1,
        summaries: [{ original: "Mitarbeiter:innen", replacement: "Mitarbeiter", count: 1 }] });
    };
    document.body.innerHTML = "<p>Alle Mitarbeiter:innen</p>";
    processor = new DomProcessor(document, {
      rules: domRuleMetadata,
      profile: "aggressive",
      isTransformCandidate: isBuiltInTransformCandidate,
      transformText,
      processAccessibleAttributes: false,
      processSubtitles: false
    });
    processor.start();
    for (let tick = 0; tick < 15; tick += 1) await vi.advanceTimersByTimeAsync(100);
    expect(calls).toBe(2);
    failing = false;
    for (let tick = 0; tick < 25; tick += 1) await vi.advanceTimersByTimeAsync(100);
    expect(calls).toBe(3);
    expect(document.querySelector("p")?.textContent).toBe("Alle Mitarbeiter");

    // After the success the same node has three fresh retries again.
    failing = true;
    document.querySelector("p")!.firstChild!.textContent = "Neue Mitarbeiter:innen";
    for (let tick = 0; tick < 300; tick += 1) await vi.advanceTimersByTimeAsync(100);
    expect(calls).toBe(3 + 4);
  });

  it("reiht aufgegebene Texte wieder ein, sobald eine andere Antwort gelingt", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    let failing = true;
    const transformText = (input: string) => failing
      ? Promise.reject(new Error("Hintergrund antwortet nicht"))
      : Promise.resolve({ text: input.replace("Mitarbeiter:innen", "Mitarbeiter"), replacements: 1,
        summaries: [{ original: "Mitarbeiter:innen", replacement: "Mitarbeiter", count: 1 }] });
    document.body.innerHTML = "<p id='a'>Erste Mitarbeiter:innen</p>";
    processor = new DomProcessor(document, {
      rules: domRuleMetadata,
      profile: "aggressive",
      isTransformCandidate: isBuiltInTransformCandidate,
      transformText,
      processAccessibleAttributes: false,
      processSubtitles: false
    });
    processor.start();
    for (let tick = 0; tick < 100; tick += 1) await vi.advanceTimersByTimeAsync(100);
    expect(document.getElementById("a")?.textContent).toBe("Erste Mitarbeiter:innen");

    failing = false;
    const late = document.createElement("p");
    late.textContent = "Späte Mitarbeiter:innen";
    document.body.append(late);
    for (let tick = 0; tick < 30; tick += 1) await vi.advanceTimersByTimeAsync(100);
    expect(late.textContent).toBe("Späte Mitarbeiter");
    expect(document.getElementById("a")?.textContent).toBe("Erste Mitarbeiter");
  });

  it("zählt Fehlversuche je Attribut, nicht je Element", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
    const calls = new Map<string, number>();
    const transformText = (input: string) => {
      calls.set(input, (calls.get(input) ?? 0) + 1);
      return Promise.reject(new Error("vorübergehend"));
    };
    document.body.innerHTML = '<img alt="Alt Mitarbeiter:innen" title="Titel Mitarbeiter:innen">';
    processor = new DomProcessor(document, {
      rules: domRuleMetadata,
      profile: "aggressive",
      isTransformCandidate: isBuiltInTransformCandidate,
      transformText,
      processAccessibleAttributes: true,
      processSubtitles: false
    });
    processor.start();
    for (let tick = 0; tick < 300; tick += 1) await vi.advanceTimersByTimeAsync(100);
    expect(calls.get("Alt Mitarbeiter:innen")).toBe(4);
    expect(calls.get("Titel Mitarbeiter:innen")).toBe(4);
  });
});
