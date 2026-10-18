import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {createRegexRule} from "../src/core/rule";
import {domRuleMetadata} from "../src/rules/dom-metadata";
import {defaultRules} from "../src/rules";
import {transformTextWithSummary} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  document.body.replaceChildren();
});
async function settle() {for (let index = 0; index < 15; index++) await Promise.resolve();}
function clock(work: () => number) {
  vi.spyOn(processor as unknown as {now: () => number}, "now").mockImplementation(work);
}
function queuedProcessor(count: number) {
  const tasks: (() => void)[] = [];
  vi.stubGlobal("scheduler", {postTask: async (work: () => void) => {tasks.push(work);}});
  document.body.innerHTML = '<p>Nutzer:innen</p>'.repeat(count);
  const candidate = vi.fn((input: string) => input.includes("Nutzer:innen"));
  processor = new DomProcessor(document, {rules: domRuleMetadata, profile: "aggressive",
    processAccessibleAttributes: false, isTransformCandidate: candidate,
    transformText: async (input, options) => transformTextWithSummary(input, defaultRules, options)});
  return {tasks, candidate};
}
function restoredProcessor(count: number) {
  vi.useFakeTimers();
  document.body.innerHTML = '<p>Nutzer:innen</p>'.repeat(count);
  processor = new DomProcessor(document, {profile: "conservative", rules: [createRegexRule({
    id: "test.clock", risk: "safe", pattern: /Nutzer:innen/gu, replace: () => "Nutzer"
  })], processAccessibleAttributes: false});
  processor.start(); processor.flush();
  expect(processor.getReplacementCount()).toBe(count);
}
describe("DOM work with delayed or coarse clocks", () => {
  it("keeps asynchronous traversal and results moving even when the first deadline has elapsed", async () => {
    const {tasks} = queuedProcessor(64);
    let now = 0; clock(() => now += 2);
    processor!.start();
    for (let index = 0; index < 1_000 && processor!.getReplacementCount() < 64; index++) {
      tasks.shift()?.(); await settle();
    }
    expect(processor!.getReplacementCount()).toBe(64);
    expect([...document.querySelectorAll("p")].every(node => node.textContent === "Nutzer")).toBe(true);
  });
  it("yields a large traversal when its clock stays on the same coarse timestamp", async () => {
    const {tasks, candidate} = queuedProcessor(512);
    clock(() => 100);
    processor!.start(); tasks.shift()?.(); await settle();
    expect(candidate.mock.calls.length).toBeGreaterThan(0);
    expect(candidate.mock.calls.length).toBeLessThan(512);
    for (let index = 0; index < 100 && processor!.getReplacementCount() < 512; index++) {
      tasks.shift()?.(); await settle();
    }
    expect(processor!.getReplacementCount()).toBe(512);
  });
  it("restores originals despite a deadline passed before its first work unit", async () => {
    restoredProcessor(200);
    let now = 0; clock(() => now += 5);
    const stopped = processor!.stopBudgeted();
    const restored = [...document.querySelectorAll("p")].filter(node => node.textContent === "Nutzer:innen");
    expect(restored.length).toBeGreaterThan(0);
    expect(restored.length).toBeLessThan(200);
    await vi.runAllTimersAsync(); await stopped;
    expect([...document.querySelectorAll("p")].every(node => node.textContent === "Nutzer:innen")).toBe(true);
  });
  it("yields restoration on coarse timestamps and still restores every original", async () => {
    restoredProcessor(512); clock(() => 100);
    const stopped = processor!.stopBudgeted();
    const restored = [...document.querySelectorAll("p")].filter(node => node.textContent === "Nutzer:innen");
    expect(restored.length).toBeGreaterThan(0);
    expect(restored.length).toBeLessThan(512);
    await vi.runAllTimersAsync(); await stopped;
    expect([...document.querySelectorAll("p")].every(node => node.textContent === "Nutzer:innen")).toBe(true);
  });
  it("discovers a late shadow root even when the first discovery deadline has elapsed", async () => {
    const {tasks} = queuedProcessor(0);
    document.body.innerHTML = '<div>neutral</div>';
    processor!.start();
    const shadow = document.querySelector("div")!.attachShadow({mode: "open"});
    shadow.innerHTML = '<span>Nutzer:innen</span>';
    let now = 0; clock(() => now += 3);
    const internal = processor as unknown as {discoverLateShadowRoots: () => void};
    for (let index = 0; index < 12; index++) internal.discoverLateShadowRoots();
    for (let index = 0; index < 100 && shadow.textContent !== "Nutzer"; index++) {
      tasks.shift()?.(); await settle();
    }
    expect(shadow.textContent).toBe("Nutzer");
  });
});
