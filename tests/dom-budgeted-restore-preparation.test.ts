import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import type {Rule} from "../src/core/rule";

const rule: Rule = {id: "test.restore-preparation", risk: "safe", apply(input) {
  const text = input.replaceAll("Nutzer:innen", "Nutzer");
  return {text, replacements: text === input ? 0 : 1};
}};
let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); vi.useRealTimers(); document.body.replaceChildren();
});

function fixture() {
  const nodes: HTMLParagraphElement[] = [];
  for (let index = 0; index < 512; index++) {
    const node = document.createElement("p");
    node.textContent = "Nutzer:innen " + index;
    node.title = "Nutzer:innen title " + index;
    nodes.push(node); document.body.append(node);
  }
  processor = new DomProcessor(document, {rules: [rule], profile: "aggressive",
    processAccessibleAttributes: true});
  processor.start(); processor.flush();
  expect(processor.getReplacementCount()).toBe(1024);
  return nodes;
}

it("reads tracked originals within the slice budget rather than copying all maps before yielding", async () => {
  vi.useFakeTimers(); const nodes = fixture();
  const internal = processor as unknown as {now(): number; textChanges: Map<Text, unknown>;
    attributeChanges: Map<Element, Map<string, unknown>>};
  const captured = internal.textChanges;
  const iterator = captured[Symbol.iterator].bind(captured);
  let inspected = 0;
  vi.spyOn(captured, Symbol.iterator).mockImplementation(function* () {
    for (const entry of iterator()) {inspected++; yield entry;}
    return undefined;
  });
  const attributeIterator = internal.attributeChanges[Symbol.iterator].bind(internal.attributeChanges);
  let inspectedAttributes = 0;
  vi.spyOn(internal.attributeChanges, Symbol.iterator).mockImplementation(function* () {
    for (const entry of attributeIterator()) {inspectedAttributes++; yield entry;}
    return undefined;
  });
  const clock = vi.spyOn(internal, "now").mockReturnValue(0);
  const stopped = processor!.stopBudgeted(); clock.mockRestore();
  expect(inspected).toBeGreaterThan(0);
  expect(inspected).toBeLessThanOrEqual(128);
  expect(inspectedAttributes).toBe(0);
  expect(nodes.filter(node => node.textContent!.startsWith("Nutzer:innen"))).toHaveLength(inspected);
  expect(nodes.every(node => node.title.startsWith("Nutzer title"))).toBe(true);
  await vi.runAllTimersAsync(); await stopped;
  expect(nodes.every((node, index) => node.textContent === "Nutzer:innen " + index &&
    node.title === "Nutzer:innen title " + index)).toBe(true);
  expect(processor!.getReplacementCount()).toBe(0);
});

it("preserves foreign text and attribute changes while originals are restored lazily", async () => {
  vi.useFakeTimers(); const nodes = fixture();
  const stopped = processor!.stopBudgeted();
  const tail = nodes.at(-1)!;
  tail.textContent = "Fremder Text"; tail.title = "Fremder Titel";
  await vi.runAllTimersAsync(); await stopped;
  expect(tail.textContent).toBe("Fremder Text"); expect(tail.title).toBe("Fremder Titel");
  expect(nodes.slice(0, -1).every((node, index) => node.textContent === "Nutzer:innen " + index &&
    node.title === "Nutzer:innen title " + index)).toBe(true);
});

it("finishes the transferred originals before restarting with fresh tracking", async () => {
  vi.useFakeTimers(); const nodes = fixture();
  const stopped = processor!.stopBudgeted();
  processor!.start(); processor!.flush(); await stopped;
  expect(nodes.every((node, index) => node.textContent === "Nutzer " + index &&
    node.title === "Nutzer title " + index)).toBe(true);
  expect(processor!.getReplacementCount()).toBe(1024);
  processor!.stop({restore: true});
  expect(nodes.every((node, index) => node.textContent === "Nutzer:innen " + index &&
    node.title === "Nutzer:innen title " + index)).toBe(true);
});

it("keeps partial restoration edits when a designMode restore is stopped", async () => {
  vi.useFakeTimers();
  const original = "Nutzer:innen und ".repeat(300);
  const paragraph = document.createElement("p"); paragraph.textContent = original;
  document.body.append(paragraph);
  processor = new DomProcessor(document, {rules: [rule], profile: "aggressive", processQuotedText: true});
  processor.start(); processor.flush();
  const text = paragraph.firstChild as Text;
  const range = document.createRange(); const offset = text.data.lastIndexOf("und");
  range.setStart(text, offset); range.setEnd(text, offset + 3);
  const internal = processor as unknown as {now(): number; syncDesignModeTransition(): void;
    pendingTextEdits: Map<Text, unknown>};
  let now = 0; vi.spyOn(internal, "now").mockImplementation(() => now++);
  document.designMode = "on";
  try {
    internal.syncDesignModeTransition();
    expect(internal.pendingTextEdits.size).toBe(1);
    const stopped = processor.stopBudgeted();
    await vi.runAllTimersAsync(); await stopped;
    expect(text.data).toBe(original); expect(range.toString()).toBe("und");
    expect(range.startContainer).toBe(text); expect(processor.getReplacementCount()).toBe(0);
  } finally {document.designMode = "off";}
});
