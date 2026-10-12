import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import type {Rule} from "../src/core/rule";

let processor: DomProcessor | undefined;
const rule: Rule = {id: "test.removed-leaf", risk: "safe", apply(input) {
  return {text: input.replaceAll("Nutzer:innen", "Nutzer"), replacements: input.includes("Nutzer:innen") ? 1 : 0};
}};
function start() {
  document.body.innerHTML = '<div id="root"></div><p>Nutzer:innen</p>';
  processor = new DomProcessor(document, {rules: [rule], profile: "aggressive",
    isTransformCandidate: input => input.includes("Nutzer:innen")});
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
