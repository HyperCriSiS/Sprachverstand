import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor, type DomProcessorOptions} from "../src/core/dom-processor";
import type {Rule} from "../src/core/rule";
import {transformTextWithSummary, type DetailedTransformResult} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
const rule: Rule = {id: "test.removed-leaf", risk: "safe", apply(input) {
  return {text: input.replaceAll("Nutzer:innen", "Nutzer"), replacements: input.includes("Nutzer:innen") ? 1 : 0};
}};
function start(options: Partial<DomProcessorOptions> = {}) {
  document.body.innerHTML = '<div id="root"></div><p>Nutzer:innen</p>';
  processor = new DomProcessor(document, {rules: [rule], profile: "aggressive",
    isTransformCandidate: input => input.includes("Nutzer:innen"), ...options});
  processor.start(); processor.flush();
  return document.querySelector("#root")!;
}
async function flush() {await Promise.resolve(); processor!.flush();}
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); document.body.replaceChildren();
});

it("does not search unrelated tracked descendants for each removed text leaf", async () => {
  const root = start(); const fragment = document.createDocumentFragment();
  for (let index = 0; index < 1000; index++) {
    const span = document.createElement("span"); span.textContent = "neutral"; fragment.append(span);
  }
  root.append(fragment); await flush();
  const contains = vi.spyOn(Node.prototype, "contains");
  root.replaceChildren(); await flush();
  expect(contains.mock.calls.length).toBeLessThan(100);
  expect(processor!.getReplacementCount()).toBe(1);
  expect(document.querySelector("p")!.textContent).toBe("Nutzer");
});

it("restores a removed leaf's own text and keeps unrelated counts", async () => {
  const root = start(); const span = document.createElement("span"); span.textContent = "Nutzer:innen";
  root.append(span); await flush(); expect(processor!.getReplacementCount()).toBe(2);
  span.remove(); await flush();
  expect(span.textContent).toBe("Nutzer:innen"); expect(processor!.getReplacementCount()).toBe(1);
});

it("retains restoration of tracked accessible attributes on a text leaf", async () => {
  const root = start(); const span = document.createElement("span");
  span.textContent = "neutral"; span.setAttribute("aria-label", "Nutzer:innen");
  root.append(span); await flush(); expect(span.getAttribute("aria-label")).toBe("Nutzer");
  span.remove(); await flush();
  expect(span.getAttribute("aria-label")).toBe("Nutzer:innen");
  expect(processor!.getReplacementCount()).toBe(1);
});

it("does not skip a removed leaf host's tracked shadow descendants", async () => {
  const root = start(); const span = document.createElement("span"); span.textContent = "neutral";
  const shadow = span.attachShadow({mode: "open"}); shadow.textContent = "Nutzer:innen";
  root.append(span); await flush(); expect(shadow.textContent).toBe("Nutzer");
  span.remove(); await flush();
  expect(shadow.textContent).toBe("Nutzer:innen"); expect(processor!.getReplacementCount()).toBe(1);
});

it("restores owned text when its leaf is moved into a different document", async () => {
  const root = start(); const span = document.createElement("span"); span.textContent = "Nutzer:innen";
  root.append(span); await flush();
  const foreign = document.implementation.createHTMLDocument("other"); foreign.body.append(span);
  await flush(); expect(span.textContent).toBe("Nutzer:innen");
  expect(processor!.getReplacementCount()).toBe(1);
});

it("avoids per-leaf ownership lookups for a sparse bulk removal", async () => {
  const root = start(); const fragment = document.createDocumentFragment();
  for (let index = 0; index < 1000; index++) {
    const span = document.createElement("span"); span.textContent = "neutral"; fragment.append(span);
  }
  root.append(fragment); await flush();
  const pending = processor as unknown as {pendingTextTransforms: Map<Text, unknown>};
  const lookups = vi.spyOn(pending.pendingTextTransforms, "get");
  root.replaceChildren(); await flush();
  expect(lookups.mock.calls.length).toBeLessThan(100);
  expect(processor!.getReplacementCount()).toBe(1);
});

it("restores the one owned tail in a large otherwise neutral removal", async () => {
  const root = start(); const fragment = document.createDocumentFragment();
  for (let index = 0; index < 500; index++) {
    const span = document.createElement("span"); span.textContent = "neutral"; fragment.append(span);
  }
  const tail = document.createElement("span"); tail.textContent = "Nutzer:innen";
  fragment.append(tail); root.append(fragment); await flush();
  expect(processor!.getReplacementCount()).toBe(2);
  root.replaceChildren(); await flush();
  expect(tail.textContent).toBe("Nutzer:innen"); expect(processor!.getReplacementCount()).toBe(1);
});

it("discards an exactly removed deferred addition instead of revisiting all detached nodes", async () => {
  const root = start(); const fragment = document.createDocumentFragment();
  for (let index = 0; index < 500; index++) {
    const span = document.createElement("span"); span.textContent = "Nutzer:innen"; fragment.append(span);
  }
  root.append(fragment); await Promise.resolve();
  const connected = vi.spyOn(Node.prototype, "isConnected", "get");
  root.replaceChildren(); await flush();
  expect(connected.mock.calls.length).toBeLessThan(100);
  expect(processor!.getReplacementCount()).toBe(1);
});

it("keeps a moved middle node when the deferred batch is only partially removed", async () => {
  const root = start(); const fragment = document.createDocumentFragment();
  for (let index = 0; index < 300; index++) {
    const span = document.createElement("span"); span.textContent = "Nutzer:innen"; fragment.append(span);
  }
  root.append(fragment); await Promise.resolve();
  const target = document.createElement("div"); document.body.append(target);
  const moved = root.children[150]!; target.append(moved); root.replaceChildren(); await flush();
  expect(moved.textContent).toBe("Nutzer"); expect(processor!.getReplacementCount()).toBe(2);
});

it("retains the general removal path when many owned entries are present", async () => {
  const root = start(); const leaves: HTMLSpanElement[] = [];
  for (let index = 0; index < 130; index++) {
    const span = document.createElement("span"); span.textContent = "Nutzer:innen"; root.append(span); leaves.push(span);
  }
  await flush(); expect(processor!.getReplacementCount()).toBe(131);
  root.replaceChildren(); await flush();
  expect(leaves.every(span => span.textContent === "Nutzer:innen")).toBe(true);
  expect(processor!.getReplacementCount()).toBe(1);
});

it("shares the synchronous removal limit across individual records from different parents", async () => {
  const root = start();
  const leaves = Array.from({length: 512}, () => {
    const parent = document.createElement("div"), leaf = document.createElement("p");
    leaf.textContent = "Nutzer:innen"; parent.append(leaf); root.append(parent); return leaf;
  });
  await flush(); await Promise.resolve();
  const clock = vi.spyOn(performance, "now").mockReturnValue(0);
  try {
    for (const leaf of leaves) leaf.remove();
    await Promise.resolve();
    const restored = leaves.filter(leaf => leaf.textContent === "Nutzer:innen").length;
    expect(restored).toBeLessThanOrEqual(128);
  } finally {clock.mockRestore();}
  processor!.flush();
  expect(leaves.every(leaf => leaf.textContent === "Nutzer:innen")).toBe(true);
  expect(processor!.getReplacementCount()).toBe(1);
});

it("yields after an expensive restoration and preserves reinserted and rewritten leaves", async () => {
  const root = start();
  const leaves = Array.from({length: 260}, () => {
    const leaf = document.createElement("p"); leaf.textContent = "Nutzer:innen"; root.append(leaf); return leaf;
  });
  await flush(); await Promise.resolve();
  let elapsed = 0;
  const clock = vi.spyOn(performance, "now").mockImplementation(() => elapsed);
  const replaceData = Text.prototype.replaceData;
  const writes = vi.spyOn(Text.prototype, "replaceData").mockImplementation(function(this: Text, offset, count, value) {
    elapsed += 2;
    return replaceData.call(this, offset, count, value);
  });
  try {
    for (const leaf of leaves) leaf.remove();
    await Promise.resolve();
    (processor as unknown as {processStructuralMutationStep(): boolean}).processStructuralMutationStep();
    expect(leaves.filter(leaf => leaf.textContent === "Nutzer:innen")).toHaveLength(1);
  } finally {writes.mockRestore(); clock.mockRestore();}
  root.append(leaves[259]!);
  leaves[258]!.firstChild!.textContent = "page-owned rewrite";
  await flush();
  expect(leaves[259]!.textContent).toBe("Nutzer");
  expect(leaves[258]!.textContent).toBe("page-owned rewrite");
  expect(leaves.slice(0, 258).every(leaf => leaf.textContent === "Nutzer:innen")).toBe(true);
  expect(processor!.getReplacementCount()).toBe(2);
});

it("handles a new caption before completing a large structural removal batch", async () => {
  const root = start({processSubtitles: true});
  const leaves = Array.from({length: 300}, () => {
    const leaf = document.createElement("p"); leaf.textContent = "Nutzer:innen"; root.append(leaf); return leaf;
  });
  const caption = document.createElement("div"); caption.className = "ytp-caption-segment";
  caption.textContent = "Nutzer:innen caption"; document.body.append(caption);
  await flush(); await Promise.resolve();
  for (const leaf of leaves) leaf.remove();
  caption.textContent = "Nutzer:innen next caption";
  await Promise.resolve();
  (processor as unknown as {flushSubtitleNodes(budgeted: boolean): void}).flushSubtitleNodes(true);
  expect(caption.textContent).toBe("Nutzer next caption");
  expect(leaves.some(leaf => leaf.textContent === "Nutzer")).toBe(true);
  processor!.flush();
  expect(leaves.every(leaf => leaf.textContent === "Nutzer:innen")).toBe(true);
  expect(processor!.getReplacementCount()).toBe(2);
});

it("restores originals on stop and discards a deferred structural batch before restart", async () => {
  const root = start();
  const leaves = Array.from({length: 300}, () => {
    const leaf = document.createElement("p"); leaf.textContent = "Nutzer:innen"; root.append(leaf); return leaf;
  });
  await flush(); await Promise.resolve();
  for (const leaf of leaves) leaf.remove();
  await Promise.resolve();
  processor!.stop({restore: true});
  expect(leaves.every(leaf => leaf.textContent === "Nutzer:innen")).toBe(true);
  root.append(leaves[299]!);
  processor!.start(); await flush();
  expect(leaves[299]!.textContent).toBe("Nutzer");
  expect(processor!.getReplacementCount()).toBe(2);
});

it("invalidates newly quoted context before applying an already pending ordinary reply", async () => {
  const noise = document.createElement("div"), paragraph = document.createElement("p");
  const leaves = Array.from({length: 200}, () => {
    const leaf = document.createElement("p"); leaf.textContent = "neutral"; noise.append(leaf); return leaf;
  });
  const left = document.createElement("span"), right = document.createElement("span");
  const text = document.createTextNode("Nutzer:innen");
  left.textContent = " "; right.textContent = " "; paragraph.append(left, text, right);
  document.body.append(noise, paragraph);
  let release: (() => void) | undefined;
  processor = new DomProcessor(document, {rules: [rule], profile: "aggressive", processQuotedText: false,
    isTransformCandidate: input => input.includes("Nutzer:innen"), transformText: (input, options) => {
      const result = transformTextWithSummary(input, [rule], options);
      if (release) return Promise.resolve(result);
      return new Promise<DetailedTransformResult>(resolve => {release = () => resolve(result);});
    }});
  processor.start(); processor.flush();
  for (let turn = 0; turn < 20; turn++) await Promise.resolve();
  expect(release).toBeDefined();
  for (const leaf of leaves) leaf.textContent = "changed neutral";
  left.textContent = "„"; right.textContent = "“";
  await Promise.resolve(); release!();
  for (let turn = 0; turn < 20; turn++) await Promise.resolve();
  let now = 0;
  const clock = vi.spyOn(performance, "now").mockImplementation(() => now++);
  try {
    for (let slice = 0; slice < 6; slice++) {
      (processor as unknown as {flushRegularNodesBudgeted(): void}).flushRegularNodesBudgeted();
      expect(text.data).toBe("Nutzer:innen");
    }
  } finally {clock.mockRestore();}
  processor.flush();
  for (let turn = 0; turn < 20; turn++) await Promise.resolve();
  processor.flush();
  expect(paragraph.textContent).toBe("„Nutzer:innen“");
  expect(processor.getReplacementCount()).toBe(0);
});
