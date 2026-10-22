import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {createRegexRule} from "../src/core/rule";

let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: true});
  processor = undefined;
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe("Einzelne Tokenänderungen vor der budgetierten Editplanung", () => {
  it("erzeugt bei bereits wiederhergestelltem Text keine eigene DOM-Mutation", () => {
    const p = document.createElement("p"), text = document.createTextNode("Unveränderter Inhalt");
    p.append(text); document.body.append(p);
    processor = new DomProcessor(document, {rules: [], profile: "conservative"});
    processor.start();
    const observer = new MutationObserver(() => undefined);
    observer.observe(p, {subtree: true, childList: true, characterData: true});
    try {
      (processor as unknown as {restoreText(node: Text, original: string, budgeted: boolean): boolean})
        .restoreText(text, text.data, true);
      expect(observer.takeRecords()).toHaveLength(0);
      expect(p.firstChild).toBe(text);
    } finally {observer.disconnect();}
  });

  it("bewahrt Ranges und Originale bei Korrektur und budgetierter Rückgabe eines langen Absatzes", async () => {
    vi.useFakeTimers();
    const prefix = "Unveränderter Text. ".repeat(200);
    const suffix = " Weiterer Inhalt. ".repeat(200);
    const initial = prefix + "Nutzer:innen" + suffix;
    const p = document.createElement("p"), text = document.createTextNode(initial);
    p.append(text); document.body.append(p);
    const before = document.createRange(), after = document.createRange();
    before.setStart(text, 0); before.setEnd(text, 13);
    after.setStart(text, initial.length - 8); after.setEnd(text, initial.length);
    const beforeValue = before.toString(), afterValue = after.toString();
    processor = new DomProcessor(document, {rules: [createRegexRule({id: "test.single-token",
      risk: "safe", pattern: /Nutzer:innen/gu, replace: () => "Nutzer"})], profile: "conservative"});
    const internal = processor as unknown as {deferTextEdits: (...args: unknown[]) => boolean};
    const planning = vi.spyOn(internal, "deferTextEdits");
    processor.start();
    await vi.advanceTimersByTimeAsync(100);
    expect(text.data).toBe(prefix + "Nutzer" + suffix);
    expect(processor.getReplacementCount()).toBe(1);
    expect(planning).not.toHaveBeenCalled();
    expect(before.toString()).toBe(beforeValue); expect(after.toString()).toBe(afterValue);
    expect(before.startContainer).toBe(text); expect(after.startContainer).toBe(text);
    const stopped = processor.stopBudgeted();
    await vi.advanceTimersByTimeAsync(100); await stopped;
    expect(text.data).toBe(initial);
    expect(before.toString()).toBe(beforeValue); expect(after.toString()).toBe(afterValue);
    expect(p.childNodes).toHaveLength(1);
  });

  it("plant weiterhin viele Wortänderungen, auch wenn eine einzige Regelersetzung sie erzeugt", () => {
    const initial = "Nutzer:innen ".repeat(300), expected = "Nutzer ".repeat(300);
    const p = document.createElement("p"), text = document.createTextNode(initial);
    p.append(text); document.body.append(p);
    processor = new DomProcessor(document, {rules: [createRegexRule({id: "test.one-match-many-tokens",
      risk: "safe", pattern: /(?:Nutzer:innen ){300}/gu, replace: () => expected})], profile: "conservative"});
    const internal = processor as unknown as {now: () => number; flushRegularNodesBudgeted: () => void;
      pendingTextEdits: Map<Text, unknown>};
    let clock = 0; vi.spyOn(internal, "now").mockImplementation(() => clock++);
    processor.start();
    for (let index = 0; index < 4; index++) internal.flushRegularNodesBudgeted();
    expect(internal.pendingTextEdits.has(text)).toBe(true);
    expect(text.data).not.toBe(expected);
    processor.flush();
    expect(text.data).toBe(expected);
    expect(processor.getReplacementCount()).toBe(1);
    processor.stop({restore: true}); expect(text.data).toBe(initial);
  });
});
