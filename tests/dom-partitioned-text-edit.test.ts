import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;
function fixture(value: string): {span: HTMLSpanElement; text: Text} {
  const paragraph = document.createElement("p");
  const span = document.createElement("span");
  const text = document.createTextNode(value);
  span.append(text);
  paragraph.append(span);
  for (let index = 0; index < 127; index += 1) {
    const sibling = document.createElement("span");
    sibling.textContent = "neutral ";
    paragraph.append(sibling);
  }
  document.body.append(paragraph);
  return {span, text};
}
function start(): void {
  processor = new DomProcessor(document, {rules: defaultRules,
    profile: "aggressive", processAccessibleAttributes: false});
  processor.start();
  processor.flush();
}
afterEach(() => {
  processor?.stop({restore: true});
  processor = undefined;
  document.getSelection()?.removeAllRanges();
  document.body.replaceChildren();
  vi.useRealTimers();
});

describe("Lokale Textänderungen in großen Inline-Blöcken", () => {
  it("erzeugt beim temporären Geschwisterknoten keinen zweiten CharacterData-Schreibvorgang", async () => {
    const {text, span} = fixture("Hallo Nutzer:innen und Freunde.");
    const changes: MutationRecord[] = [];
    const observer = new MutationObserver(records => changes.push(...records));
    observer.observe(span, {subtree: true, childList: true, characterData: true});
    start(); await Promise.resolve(); observer.disconnect();
    expect(changes.filter(record => record.type === "characterData" && record.target === text)).toHaveLength(1);
    expect(span.childNodes).toHaveLength(1);
  });
  it.each([
    ["Hallo Nutzer:innen und Freunde.", "Hallo Nutzer und Freunde.", "Hallo"],
    ["Hallo Nutzer:innen und Freunde.", "Hallo Nutzer und Freunde.", "Freunde"],
    ["Nutzer:innen und Lehrer:innen heute.", "Nutzer und Lehrer heute.", " und "],
    ["Nutzer:innen\u00a0und Lehrer:innen", "Nutzer\u00a0und Lehrer", "und"]
  ])("bewahrt Text und Knotenidentität in %s für %s: %s", (original, transformed) => {
    const {span, text} = fixture(original);
    // Native Range migration is covered by live-browser-smoke.mjs.
    // jsdom 30 normalize() iterates the destination's live Ranges rather
    // than the merged sibling's, losing Ranges moved there by splitText().
    start();
    expect(span.firstChild).toBe(text);
    expect(span.childNodes).toHaveLength(1);
    expect(text.data).toBe(transformed);
    processor?.stop({restore: true});
    processor = undefined;
    expect(text.data).toBe(original);
    expect(span.firstChild).toBe(text);
    expect(span.childNodes).toHaveLength(1);
  });

  it("führt vorbestehende benachbarte Textknoten nicht zusammen", () => {
    const {span, text} = fixture("Hallo Nutzer:innen und ");
    const sibling = document.createTextNode("Freunde.");
    span.append(sibling);
    start();
    expect(span.childNodes).toHaveLength(2);
    expect(span.firstChild).toBe(text);
    expect(span.lastChild).toBe(sibling);
    expect(span.textContent).toBe("Hallo Nutzer und Freunde.");
  });

  it("ignoriert eigene temporäre Knoten und verarbeitet fremde spätere Textwechsel", async () => {
    vi.useFakeTimers();
    const {span, text} = fixture("Hallo Nutzer:innen und Freunde.");
    start();
    await vi.advanceTimersByTimeAsync(25);
    expect(processor?.getReplacementCount()).toBe(1);
    span.textContent = "Hallo Lehrer:innen und Freunde.";
    await vi.advanceTimersByTimeAsync(25);
    expect(span.textContent).toBe("Hallo Lehrer und Freunde.");
    expect(span.childNodes).toHaveLength(1);
    expect(text.data).toBe("Hallo Nutzer:innen und Freunde.");
    expect(processor?.getReplacementCount()).toBe(1);
    expect(processor?.getReplacementSummary()).toEqual([
      {original: "Lehrer:innen", replacement: "Lehrer", count: 1}
    ]);
  });

  it("verarbeitet temporäre Knoten erneut, wenn ein Seiten-Observer sie wiederverwendet", async () => {
    const {text} = fixture("Hallo Nutzer:innen und Freunde.");
    const removed: Text[] = [];
    const observer = new MutationObserver(records => {
      for (const record of records) for (const node of record.addedNodes) {
        if (node instanceof Text && node !== text && !node.isConnected) removed.push(node);
      }
    });
    observer.observe(document.body, {subtree: true, childList: true});
    start();
    await Promise.resolve();
    observer.disconnect();
    expect(removed.length).toBeGreaterThan(0);
    const recycled = removed[0]!;
    recycled.data = "Nutzer:innen außerhalb";
    const paragraph = document.createElement("p");
    paragraph.append(recycled);
    document.body.append(paragraph);
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(recycled.data).toBe("Nutzer außerhalb");
    expect(processor?.getReplacementCount()).toBe(2);
    paragraph.remove();
    await new Promise(resolve => setTimeout(resolve, 25));
    expect(recycled.data).toBe("Nutzer:innen außerhalb");
    expect(processor?.getReplacementCount()).toBe(1);
  });
});
