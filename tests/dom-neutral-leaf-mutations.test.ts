import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor, type DomProcessorOptions} from "../src/core/dom-processor";
import type {Rule} from "../src/core/rule";

let processor: DomProcessor | undefined;
const rule: Rule = {id: "test.neutral-leaf", risk: "safe", apply(input) {
  return {text: input.replaceAll("Nutzer:innen", "Nutzer"), replacements: input.includes("Nutzer:innen") ? 1 : 0};
}};
function start(options: Partial<DomProcessorOptions> = {}) {
  vi.useFakeTimers(); document.body.innerHTML = '<div id="root"></div>';
  processor = new DomProcessor(document, {rules: [rule], profile: "aggressive",
    isTransformCandidate: input => input.includes("Nutzer:innen"), ...options});
  processor.start(); processor.flush();
  return document.querySelector("#root")!;
}
async function drain() {await Promise.resolve(); await vi.advanceTimersByTimeAsync(20);}
function markedBurst(root: Element, count = 300) {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index++) {
    const span = document.createElement("span"); span.textContent = "Nutzer:innen"; fragment.append(span);
  }
  root.append(fragment);
}
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  document.body.replaceChildren(); vi.restoreAllMocks(); vi.useRealTimers();
});

it("does not schedule traversals for a burst of unchanged neutral text leaves", async () => {
  const root = start(); const walkers = vi.spyOn(document, "createTreeWalker");
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 1000; index++) {
    const span = document.createElement("span"); span.textContent = "neutral " + index; fragment.append(span);
  }
  root.append(fragment); await drain();
  expect(root.childNodes).toHaveLength(1000); expect(walkers).not.toHaveBeenCalled();
});

it("still transforms accessible attributes on neutral text leaves", async () => {
  const root = start(); const span = document.createElement("span");
  span.textContent = "neutral"; span.setAttribute("aria-label", "Nutzer:innen");
  root.append(span); await drain();
  expect(span.textContent).toBe("neutral"); expect(span.getAttribute("aria-label")).toBe("Nutzer");
});

it("still discovers a shadow root on a neutral leaf host", async () => {
  const root = start(); const host = document.createElement("span"); host.textContent = "neutral";
  const shadow = host.attachShadow({mode: "open"}); shadow.textContent = "Nutzer:innen";
  root.append(host); await drain();
  expect(shadow.textContent).toBe("Nutzer");
});

it("does not skip nested candidates behind neutral sibling text", async () => {
  const root = start(); const span = document.createElement("span");
  span.append("neutral "); const nested = document.createElement("span"); nested.textContent = "Nutzer:innen";
  span.append(nested); root.append(span); await drain();
  expect(span.textContent).toBe("neutral Nutzer");
});

it("respects custom replacements even when the built-in candidate prefilter is negative", async () => {
  const root = start({isTransformCandidate: () => false,
    customReplacements: [{source: "neutral", replacement: "anders"}]});
  const span = document.createElement("span"); span.textContent = "neutral"; root.append(span);
  await drain(); expect(span.textContent).toBe("anders");
});

it("keeps skipping neutral text when an own replacement does not occur in it", async () => {
  const apply = vi.spyOn(rule, "apply");
  const root = start({customReplacements: [{source: "Kundschaft", replacement: "Kunden"}]});
  for (let index = 0; index < 50; index++) {
    const span = document.createElement("span"); span.textContent = `neutraler Absatz ${index}`; root.append(span);
  }
  const own = document.createElement("span"); own.textContent = "Die Kundschaft kommt."; root.append(own);
  await drain();
  // Only the text with the own source reaches the rules (its parts around
  // the replacement); no neutral paragraph does.
  expect(apply.mock.calls.some(([input]) => input.includes("neutraler"))).toBe(false);
  expect(own.textContent).toBe("Die Kunden kommt.");
});

it("drains deferred additions completely during explicit synchronous flush", async () => {
  const root = start(); markedBurst(root); await Promise.resolve();
  processor!.flush();
  expect([...root.children].every(node => node.textContent === "Nutzer")).toBe(true);
  expect(processor!.getReplacementCount()).toBe(300);
});

it("cancels deferred additions on stop and discovers them after restart", async () => {
  const root = start(); markedBurst(root); await Promise.resolve();
  processor!.stop({restore: true}); await vi.advanceTimersByTimeAsync(20);
  expect([...root.children].every(node => node.textContent === "Nutzer:innen")).toBe(true);
  processor!.start(); processor!.flush();
  expect([...root.children].every(node => node.textContent === "Nutzer")).toBe(true);
});

it("drops a detached addition batch and processes its subtree after reattachment", async () => {
  const root = start(); markedBurst(root); await Promise.resolve();
  root.remove(); await drain();
  expect([...root.children].every(node => node.textContent === "Nutzer:innen")).toBe(true);
  expect(processor!.getReplacementCount()).toBe(0);
  document.body.append(root); await Promise.resolve(); processor!.flush();
  expect([...root.children].every(node => node.textContent === "Nutzer")).toBe(true);
  expect(processor!.getReplacementCount()).toBe(300);
});

it("keeps traversal moving alongside pending additions when every first deadline has elapsed", async () => {
  const root = start(); let now = 0;
  vi.spyOn(processor as unknown as {now: () => number}, "now").mockImplementation(() => now += 5);
  markedBurst(root); await Promise.resolve(); await vi.advanceTimersByTimeAsync(100);
  expect(processor!.getReplacementCount()).toBeGreaterThan(0);
  expect(processor!.getReplacementCount()).toBeLessThan(300);
  await vi.advanceTimersByTimeAsync(2000);
  expect(processor!.getReplacementCount()).toBe(300);
});

it("prioritizes a fresh caption while a large regular addition batch is pending", async () => {
  const root = start({processSubtitles: true}); const callbacks: FrameRequestCallback[] = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {callbacks.push(callback); return callbacks.length;});
  const caption = document.createElement("div"); caption.className = "ytp-caption-segment";
  document.body.append(caption); await Promise.resolve(); processor!.flush(); callbacks.length = 0;
  markedBurst(root); caption.textContent = "Neue Nutzer:innen"; await Promise.resolve();
  callbacks.shift()?.(0);
  expect(caption.textContent).toBe("Neue Nutzer");
  expect([...root.children].every(node => node.textContent === "Nutzer:innen")).toBe(true);
  processor!.flush(); expect(processor!.getReplacementCount()).toBe(301);
});

it("keeps large additions to a caption container within the subtitle frame budget", async () => {
  const root = start({processSubtitles: true}); const callbacks: FrameRequestCallback[] = [];
  vi.spyOn(window, "requestAnimationFrame").mockImplementation(callback => {callbacks.push(callback); return callbacks.length;});
  root.className = "ytp-caption-segment"; markedBurst(root); await Promise.resolve();
  callbacks.shift()?.(0);
  const corrected = [...root.children].filter(node => node.textContent === "Nutzer").length;
  expect(corrected).toBeGreaterThan(0); expect(corrected).toBeLessThanOrEqual(12);
  for (let frame = 0; frame < 100 && callbacks.length; frame++) callbacks.shift()?.(0);
  expect(processor!.getReplacementCount()).toBe(300);
});
