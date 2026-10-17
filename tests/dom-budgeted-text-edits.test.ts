import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {createRegexRule} from "../src/core/rule";

const rule = createRegexRule({id: "test.budgeted", risk: "safe",
  pattern: /Nutzer:innen/gu, replace: () => "Nutzer"});
const original = "Nutzer:innen und ".repeat(300);
let processor: DomProcessor | undefined;
function setup(initial = original, processQuotedText = true): {text: Text; paragraph: HTMLParagraphElement; slice: () => void} {
  const paragraph = document.createElement("p");
  const text = document.createTextNode(initial);
  paragraph.append(text); document.body.append(paragraph);
  processor = new DomProcessor(document, {rules: [rule], profile: "conservative", processQuotedText});
  processor.start();
  const internal = processor as unknown as {now: () => number; flushRegularNodesBudgeted: () => void};
  let now = 0;
  vi.spyOn(internal, "now").mockImplementation(() => now++);
  const slice = () => internal.flushRegularNodesBudgeted();
  for (let index = 0; index < 4; index += 1) slice();
  expect(text.data).not.toBe(initial);
  expect(text.data).toContain("Nutzer:innen");
  expect(processor.getReplacementCount()).toBe(0);
  return {text, paragraph, slice};
}
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); vi.useRealTimers(); document.body.replaceChildren();
  document.designMode = "off";
});
describe("Budgetierte Rückschreibung großer Textknoten", () => {
  it("gibt beim automatischen DesignMode-Wechsel große Texte kooperativ zurück", async () => {
    vi.useFakeTimers();
    const {text} = setup(); processor!.flush();
    document.designMode = "on";
    (processor as unknown as {syncDesignModeTransition: () => void}).syncDesignModeTransition();
    expect(text.data).not.toBe(original);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(text.data).toBe(original);
    expect(processor!.getReplacementCount()).toBe(0);
    document.designMode = "off";
    (processor as unknown as {syncDesignModeTransition: () => void}).syncDesignModeTransition();
    processor!.flush();
    expect(text.data).toBe("Nutzer und ".repeat(300));
  });
  it("beendet vor Benutzereingaben auch eine kooperative DesignMode-Rückgabe", () => {
    const {text, paragraph} = setup(); processor!.flush();
    document.designMode = "on";
    (processor as unknown as {syncDesignModeTransition: () => void}).syncDesignModeTransition();
    expect(text.data).not.toBe(original);
    paragraph.dispatchEvent(new Event("beforeinput", {bubbles: true}));
    expect(text.data).toBe(original);
  });
  it("stoppt während einer DesignMode-Rückgabe und verliert keine Teiloriginale", async () => {
    vi.useFakeTimers();
    const {text} = setup(); processor!.flush();
    document.designMode = "on";
    (processor as unknown as {syncDesignModeTransition: () => void}).syncDesignModeTransition();
    const stopped = processor!.stopBudgeted();
    expect(text.data).not.toBe(original);
    await vi.runAllTimersAsync(); await stopped;
    expect(text.data).toBe(original);
    document.designMode = "off";
    text.data = "Nutzer:innen bleiben nach dem Stop";
    await vi.runAllTimersAsync();
    expect(text.data).toBe("Nutzer:innen bleiben nach dem Stop");
  });
  it("verwirft laufende Änderungen, wenn ein neues Anführungszeichen den Text schützt", async () => {
    const initial = "„" + original;
    const {text, paragraph} = setup(initial, false);
    paragraph.append(document.createTextNode("“"));
    await Promise.resolve(); processor!.flush();
    expect(text.data).toBe(initial);
    expect(processor!.getReplacementCount()).toBe(0);
  });
  it("restauriert bei spätem Zitatschutz viele Teiländerungen in kurzen Schritten", async () => {
    const initial = "„" + original;
    const {text, paragraph, slice} = setup(initial, false);
    for (let index = 0; index < 90; index += 1) slice();
    expect(text.data).toContain("Nutzer:innen");
    paragraph.append(document.createTextNode("“"));
    await Promise.resolve(); slice();
    expect(text.data).not.toBe(initial);
    processor!.flush();
    expect(text.data).toBe(initial);
    expect(processor!.getReplacementCount()).toBe(0);
  });
  it("liest für viele eigene Observer-Records nur einmal den vollständigen Text", async () => {
    const {text, slice} = setup();
    for (let index = 0; index < 10; index += 1) slice();
    const reads = vi.spyOn(text, "data", "get");
    await Promise.resolve();
    expect(reads.mock.calls.length).toBeLessThanOrEqual(1);
    reads.mockRestore();
    processor!.flush();
    expect(text.data).toBe("Nutzer und ".repeat(300));
  });
  it("arbeitet in kurzen Schritten und beendet einen expliziten Flush vollständig", async () => {
    const {text, paragraph} = setup();
    await Promise.resolve();
    processor!.flush();
    expect(text.data).toBe("Nutzer und ".repeat(300));
    expect(paragraph.firstChild).toBe(text);
    expect(paragraph.childNodes).toHaveLength(1);
    expect(processor!.getReplacementCount()).toBe(300);
    expect(processor!.getReplacementSummary()).toEqual([
      {original: "Nutzer:innen", replacement: "Nutzer", count: 300}
    ]);
  });
  it("überschreibt keine fremde Änderung während einer Teilrückschreibung", () => {
    const {text, slice} = setup();
    text.data = "Neue Inhalte der Webseite";
    slice(); processor!.flush();
    expect(text.data).toBe("Neue Inhalte der Webseite");
    expect(processor!.getReplacementCount()).toBe(0);
  });
  it("restauriert bei einem Editorwechsel bereits ausgeführte Teiländerungen", () => {
    const {text, paragraph, slice} = setup();
    paragraph.setAttribute("contenteditable", "true");
    slice(); processor!.flush();
    expect(text.data).toBe(original);
    expect(processor!.getReplacementCount()).toBe(0);
  });
  it("restauriert eine Teilrückschreibung beim Abschalten", () => {
    const {text} = setup();
    processor!.stop({restore: true}); processor = undefined;
    expect(text.data).toBe(original);
  });
  it("gibt entfernte und später wiederverwendete Knoten im Original zurück", async () => {
    const {text, paragraph} = setup();
    paragraph.remove(); await Promise.resolve();
    expect(text.data).toBe(original);
    document.body.append(paragraph); await Promise.resolve();
    processor!.flush();
    expect(text.data).toBe("Nutzer und ".repeat(300));
    expect(processor!.getReplacementCount()).toBe(300);
  });
  it("restauriert viele entfernte Änderungen kooperativ und erhält neue Ranges im Cache", async () => {
    const {text, paragraph, slice} = setup(); processor!.flush();
    paragraph.remove();
    const range = document.createRange(); const offset = text.data.lastIndexOf("und");
    range.setStart(text, offset); range.setEnd(text, offset + 3);
    await Promise.resolve();
    expect(processor!.getReplacementCount()).toBe(0);
    expect(text.data).not.toBe(original);
    for (let index = 0; index < 500 && text.data !== original; index += 1) slice();
    expect(text.data).toBe(original);
    expect(range.toString()).toBe("und");
    expect(range.startContainer).toBe(text);
  });
  it("verliert das Original nicht bei Wiederverwendung während der Rückgabe", async () => {
    const {text, paragraph, slice} = setup(); processor!.flush();
    paragraph.remove(); await Promise.resolve(); slice();
    document.body.append(paragraph); await Promise.resolve();
    processor!.flush();
    expect(text.data).toBe("Nutzer und ".repeat(300));
    expect(processor!.getReplacementCount()).toBe(300);
    processor!.stop({restore: true}); processor = undefined;
    expect(text.data).toBe(original);
  });
  it("übernimmt keine fremde Änderung beim Restaurieren eines entfernten Knotens", async () => {
    const {text, paragraph, slice} = setup(); processor!.flush();
    paragraph.remove(); await Promise.resolve();
    text.data = "Ein neuer Cacheinhalt der Webseite"; slice(); processor!.flush();
    expect(text.data).toBe("Ein neuer Cacheinhalt der Webseite");
    expect(processor!.getReplacementCount()).toBe(0);
  });
  it("schaltet große Texte kooperativ ab und bewahrt dabei unabhängige Ranges", async () => {
    vi.useFakeTimers();
    const {text} = setup(); processor!.flush();
    const range = document.createRange(); const offset = text.data.lastIndexOf("und");
    range.setStart(text, offset); range.setEnd(text, offset + 3);
    const stopped = processor!.stopBudgeted();
    expect(text.data).not.toBe(original);
    await vi.runAllTimersAsync(); await stopped;
    expect(text.data).toBe(original);
    expect(range.toString()).toBe("und"); expect(range.startContainer).toBe(text);
    expect(processor!.getReplacementCount()).toBe(0);
    expect(processor!.getReplacementSummary()).toEqual([]);
  });
  it("überschreibt keine fremde Änderung beim kooperativen Abschalten", async () => {
    vi.useFakeTimers();
    const {text} = setup(); processor!.flush(); const stopped = processor!.stopBudgeted();
    text.data = "Fremder Inhalt beim Abschalten";
    await vi.runAllTimersAsync(); await stopped;
    expect(text.data).toBe("Fremder Inhalt beim Abschalten");
  });
  it("beendet eine kooperative Rückgabe bei einem ausdrücklich synchronen Stop", async () => {
    vi.useFakeTimers();
    const {text} = setup(); processor!.flush(); const stopped = processor!.stopBudgeted();
    processor!.stop({restore: true});
    expect(text.data).toBe(original);
    text.data = "Spätere Inhalte";
    await vi.runAllTimersAsync(); await stopped;
    expect(text.data).toBe("Spätere Inhalte");
  });
  it("beendet die Originalrückgabe vor einem erneuten Start", async () => {
    vi.useFakeTimers();
    const {text} = setup(); processor!.flush(); const stopped = processor!.stopBudgeted();
    processor!.start(); processor!.flush(); await stopped;
    expect(text.data).toBe("Nutzer und ".repeat(300));
    expect(processor!.getReplacementCount()).toBe(300);
    processor!.stop({restore: true}); processor = undefined;
    expect(text.data).toBe(original);
  });
});
