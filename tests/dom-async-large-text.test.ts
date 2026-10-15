import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {createRegexRule} from "../src/core/rule";
import {transformTextWithSummary, type DetailedTransformResult} from "../src/core/transform-text";

const rule = createRegexRule({id: "test.large", risk: "safe",
  pattern: /Nutzer:innen/gu, replace: () => "Nutzer"});
const original = "Nutzer:innen und ".repeat(600);
let processor: DomProcessor | undefined;
async function setup() {
  const paragraph = document.createElement("p");
  const text = document.createTextNode(original); paragraph.append(text); document.body.append(paragraph);
  let resolve!: (result: DetailedTransformResult) => void;
  let reject!: (error: Error) => void;
  const transform = vi.fn(() => new Promise<DetailedTransformResult>((yes, no) => {resolve = yes; reject = no;}));
  processor = new DomProcessor(document, {rules: [rule], profile: "conservative", transformLargeText: transform});
  processor.start();
  const internal = processor as unknown as {now: () => number; flushRegularNodesBudgeted: () => void};
  let now = 0; vi.spyOn(internal, "now").mockImplementation(() => now++);
  const slice = () => internal.flushRegularNodesBudgeted();
  for (let index = 0; index < 4; index += 1) slice();
  await Promise.resolve(); await Promise.resolve();
  expect(transform).toHaveBeenCalledOnce();
  expect(text.data).toBe(original);
  return {text, paragraph, slice, transform, resolve: () => resolve(transformTextWithSummary(original, [rule], {profile: "conservative"})), reject: () => reject(new Error("Hintergrund neu gestartet"))};
}
async function settle(): Promise<void> {
  for (let index = 0; index < 5; index += 1) await Promise.resolve();
}
afterEach(() => {processor?.stop({restore: true}); processor = undefined; vi.restoreAllMocks(); document.body.replaceChildren();});
describe("Lokale asynchrone Transformation großer Textknoten", () => {
  it("blockiert nach einem Hintergrundausfall nicht mit einer unbegrenzten lokalen Transformation", async () => {
    const hugeOriginal = "Nutzer:innen und ".repeat(5_000);
    const paragraph = document.createElement("p"); paragraph.textContent = hugeOriginal;
    document.body.append(paragraph);
    const replace = vi.fn(() => "Nutzer");
    const localRule = createRegexRule({id: "test.failure", risk: "safe", pattern: /Nutzer:innen/gu, replace});
    const transform = vi.fn(async () => {throw new Error("Hintergrund nicht erreichbar");});
    processor = new DomProcessor(document, {rules: [localRule], profile: "conservative", transformLargeText: transform});
    const internal = processor as unknown as {now: () => number; flushRegularNodesBudgeted: () => void};
    let now = 0;
    // Expire each slice deliberately: traversal may need several turns before
    // the request starts, independently of machine load or timer resolution.
    vi.spyOn(internal, "now").mockImplementation(() => now += 5);
    processor.start();
    for (let index = 0; index < 16; index += 1) internal.flushRegularNodesBudgeted();
    await settle(); await settle();
    expect(transform).toHaveBeenCalledOnce(); expect(replace).not.toHaveBeenCalled();
    expect(paragraph.textContent).toBe(hugeOriginal); expect(processor.getReplacementCount()).toBe(0);
  });
  it("verarbeitet große Untertitel im Hintergrund und erhält deren Zitatvertrag", async () => {
    const paragraph = document.createElement("p"); paragraph.className = "ytp-caption-segment";
    const text = document.createTextNode(original); paragraph.append(text); document.body.append(paragraph);
    let resolve!: (result: DetailedTransformResult) => void;
    const transform = vi.fn(() => new Promise<DetailedTransformResult>(yes => {resolve = yes;}));
    processor = new DomProcessor(document, {rules: [rule], profile: "conservative",
      processSubtitles: true, processQuotedText: false, transformLargeText: transform});
    processor.start();
    const internal = processor as unknown as {flushSubtitleNodes: (budgeted: boolean) => void;
      flushRegularNodesBudgeted: () => void};
    internal.flushRegularNodesBudgeted(); internal.flushSubtitleNodes(true); await settle();
    expect(transform).toHaveBeenCalledOnce();
    expect(transform.mock.calls[0]).toEqual([original, expect.objectContaining({processQuotedText: false})]);
    expect(text.data).toBe(original);
    resolve(transformTextWithSummary(original, [rule], {profile: "conservative"}));
    await settle(); processor.flush();
    expect(text.data).toBe("Nutzer und ".repeat(600));
    expect(processor.getReplacementCount()).toBe(600);
  });
  it("verwirft eine große Untertitelantwort nach einer neuen sichtbaren Zeile", async () => {
    const {text, paragraph, resolve} = await setup();
    paragraph.className = "ytp-caption-segment"; text.data = "Aktuelle Untertitelzeile";
    resolve(); await settle(); processor!.flush();
    expect(text.data).toBe("Aktuelle Untertitelzeile");
    expect(processor!.getReplacementCount()).toBe(0);
  });
  it("beginnt höchstens zwei große Anfragen gleichzeitig und setzt danach die Warteschlange fort", async () => {
    const {slice, transform, resolve} = await setup();
    for (let index = 0; index < 2; index += 1) {
      const paragraph = document.createElement("p"); paragraph.textContent = original; document.body.append(paragraph);
    }
    await settle();
    for (let index = 0; index < 15; index += 1) slice();
    await settle();
    expect(transform).toHaveBeenCalledTimes(2);
    resolve(); await settle(); await settle();
    expect(transform).toHaveBeenCalledTimes(3);
    processor!.flush();
    expect(processor!.getReplacementCount()).toBe(1800);
    for (const paragraph of document.querySelectorAll("p")) expect(paragraph.textContent).toBe("Nutzer und ".repeat(600));
  });
  it("übernimmt ein aktuelles Ergebnis und schreibt es anschließend vollständig zurück", async () => {
    const {text, resolve} = await setup(); resolve(); await settle(); processor!.flush();
    expect(text.data).toBe("Nutzer und ".repeat(600));
    expect(processor!.getReplacementCount()).toBe(600);
    processor!.stop({restore: true}); processor = undefined;
    expect(text.data).toBe(original);
  });
  it("verwirft Antworten nach fremden Textänderungen", async () => {
    const {text, resolve} = await setup(); text.data = "Neue Inhalte der Webseite";
    resolve(); await settle(); processor!.flush();
    expect(text.data).toBe("Neue Inhalte der Webseite");
    expect(processor!.getReplacementCount()).toBe(0);
  });
  it("verwirft Antworten nach dem Abschalten", async () => {
    const {text, resolve} = await setup(); processor!.stop({restore: true}); resolve(); await settle();
    expect(text.data).toBe(original); expect(processor!.getReplacementCount()).toBe(0);
  });
  it("verwirft Antworten aus vorherigen Einstellungen", async () => {
    const {text, resolve} = await setup();
    processor!.updateOptions({rules: [], profile: "conservative"}); resolve(); await settle(); processor!.flush();
    expect(text.data).toBe(original); expect(processor!.getReplacementCount()).toBe(0);
  });
  it("übernimmt kein verspätetes Ergebnis in einen Editor", async () => {
    const {text, paragraph, resolve} = await setup(); paragraph.setAttribute("contenteditable", "true");
    resolve(); await settle(); processor!.flush();
    expect(text.data).toBe(original); expect(processor!.getReplacementCount()).toBe(0);
  });
  it("verarbeitet bei einem vorübergehend fehlenden Hintergrund dieselben Regeln lokal", async () => {
    const {text, reject} = await setup(); reject(); await settle(); processor!.flush();
    expect(text.data).toBe("Nutzer und ".repeat(600)); expect(processor!.getReplacementCount()).toBe(600);
  });
  it("lässt einen expliziten synchronen Flush eine ausstehende Transformation abschließen", async () => {
    const {text, resolve} = await setup(); processor!.flush();
    expect(text.data).toBe("Nutzer und ".repeat(600)); resolve(); await settle();
    expect(processor!.getReplacementCount()).toBe(600);
  });
});
