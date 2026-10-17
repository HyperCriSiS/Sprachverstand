import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {createRegexRule} from "../src/core/rule";

let processor: DomProcessor | undefined;
const original = "Nutzer:innen und ".repeat(5_000);
function setup(initial = original, replacement = "Nutzer") {
  document.body.replaceChildren(); const p = document.createElement("p");
  const text = document.createTextNode(initial); p.append(text); document.body.append(p);
  processor = new DomProcessor(document, {rules: [createRegexRule({id: "test.prepare", risk: "safe",
    pattern: /Nutzer:innen/gu, replace: () => replacement})], profile: "aggressive", processQuotedText: true});
  processor.start();
  const internal = processor as unknown as {now: () => number; flushRegularNodesBudgeted: () => void;
    pendingTextEdits: Map<Text, {preparing?: unknown}>};
  let now = 0; vi.spyOn(internal, "now").mockImplementation(() => now++);
  for (let index = 0; index < 4; index++) internal.flushRegularNodesBudgeted();
  expect(internal.pendingTextEdits.get(text)?.preparing).toBeDefined();
  expect(text.data).toBe(initial);
  return {text, p, plans: internal.pendingTextEdits, slice: () => internal.flushRegularNodesBudgeted()};
}
afterEach(() => {processor?.stop({restore: true}); processor = undefined; vi.restoreAllMocks(); document.body.replaceChildren();});
describe("Inkrementelle Vorbereitung großer Editpläne", () => {
  it("beginnt mit einem unveränderten Text und erhält Ranges bei vollständiger Rückschreibung", () => {
    const {text, p, plans} = setup();
    const rotations = vi.spyOn(plans, "delete");
    // Migrated suffix Ranges are verified in both native browser smokes;
    // jsdom 30 normalize() loses Ranges moved into a temporary sibling.
    const range = document.createRange(), offset = original.indexOf("und");
    range.setStart(text, offset); range.setEnd(text, offset + 3);
    processor!.flush();
    expect(rotations.mock.calls.length).toBeLessThan(1_000);
    expect(text.data).toBe("Nutzer und ".repeat(5_000));
    expect(processor!.getReplacementCount()).toBe(5_000);
    expect(range.toString()).toBe("und"); expect(range.startContainer).toBe(text);
    expect(p.childNodes).toHaveLength(1);
    processor!.stop({restore: true});
    expect(text.data).toBe(original); expect(range.toString()).toBe("und");
  });
  it("verwirft die Vorbereitung nach einer fremden Änderung", () => {
    const {text, slice} = setup(); text.data = "Fremder neuer Inhalt";
    slice(); processor!.flush();
    expect(text.data).toBe("Fremder neuer Inhalt"); expect(processor!.getReplacementCount()).toBe(0);
  });
  it("gibt bei einem Editorwechsel während der Vorbereitung unveränderte Originale zurück", () => {
    const {text, p, slice} = setup(); p.contentEditable = "true"; p.setAttribute("contenteditable", "true");
    slice(); processor!.flush();
    expect(text.data).toBe(original); expect(processor!.getReplacementCount()).toBe(0);
  });
  it("bewahrt den bisherigen Fallback bei geänderten Tokengrenzen", () => {
    const {text} = setup(original, "Nutzer Rolle"); processor!.flush();
    expect(text.data).toBe("Nutzer Rolle und ".repeat(5_000));
    expect(processor!.getReplacementCount()).toBe(5_000);
  });
  it("beendet auch einen großen Plan mit nur einer geänderten Stelle", () => {
    const initial = "alpha ".repeat(12_000) + "Nutzer:innen";
    const {text} = setup(initial); processor!.flush();
    expect(text.data).toBe("alpha ".repeat(12_000) + "Nutzer");
    expect(processor!.getReplacementCount()).toBe(1);
  });
});
