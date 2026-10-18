import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import type {Rule} from "../src/core/rule";

const rule: Rule = {id: "test.restore-task", risk: "safe", apply(input) {
  const text = input.replaceAll("Nutzer:innen", "Nutzer");
  return {text, replacements: text === input ? 0 : 1};
}};
let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); document.body.replaceChildren();
});
function fixture() {
  const nodes = Array.from({length: 512}, (_, index) => {
    const paragraph = document.createElement("p"); paragraph.textContent = "Nutzer:innen " + index;
    document.body.append(paragraph); return paragraph;
  });
  processor = new DomProcessor(document, {rules: [rule], profile: "aggressive"});
  processor.start(); processor.flush();
  vi.spyOn(processor as unknown as {now(): number}, "now").mockReturnValue(0);
  return nodes;
}

it("continues restoration in bounded background tasks while yielding between slices", async () => {
  const nodes = fixture(); const tasks: (() => void)[] = [];
  const postTask = vi.fn(async (work: () => void) => {tasks.push(work);});
  vi.stubGlobal("scheduler", {postTask});
  const stopped = processor!.stopBudgeted();
  expect(postTask).toHaveBeenCalledWith(expect.any(Function), {priority: "background"});
  let restored = nodes.filter(node => node.textContent!.startsWith("Nutzer:innen")).length;
  expect(restored).toBe(128);
  for (let index = 0; tasks.length && index < 20; index++) {
    expect(tasks).toHaveLength(1); tasks.shift()!();
    const next = nodes.filter(node => node.textContent!.startsWith("Nutzer:innen")).length;
    expect(next - restored).toBeLessThanOrEqual(128); restored = next;
  }
  await stopped;
  expect(restored).toBe(512); expect(tasks).toHaveLength(0);
});

it("invalidates posted callbacks after an explicit synchronous stop", async () => {
  const nodes = fixture(); const tasks: (() => void)[] = [];
  vi.stubGlobal("scheduler", {postTask: async (work: () => void) => {tasks.push(work);}});
  const stopped = processor!.stopBudgeted();
  expect(tasks).toHaveLength(1);
  processor!.stop({restore: true}); await stopped;
  nodes.at(-1)!.textContent = "Fremder Inhalt nach Stop";
  tasks.forEach(work => work());
  expect(nodes.at(-1)!.textContent).toBe("Fremder Inhalt nach Stop");
  expect(processor!.getReplacementCount()).toBe(0);
});

it("falls back to timers when posting a background restoration task fails", async () => {
  vi.useFakeTimers(); const nodes = fixture();
  const postTask = vi.fn(async () => {throw new Error("scheduler unavailable");});
  vi.stubGlobal("scheduler", {postTask});
  const stopped = processor!.stopBudgeted();
  await vi.runAllTimersAsync(); await stopped;
  expect(postTask).toHaveBeenCalled();
  expect(nodes.every((node, index) => node.textContent === "Nutzer:innen " + index)).toBe(true);
});

it("does not schedule a stale timer if posting fails after synchronous completion", async () => {
  vi.useFakeTimers(); const nodes = fixture();
  let reject!: (error: Error) => void;
  vi.stubGlobal("scheduler", {postTask: () => new Promise((_resolve, no) => {reject = no;})});
  const stopped = processor!.stopBudgeted(); processor!.stop({restore: true}); await stopped;
  nodes.at(-1)!.textContent = "Fremder Inhalt";
  reject(new Error("late failure")); await Promise.resolve();
  await vi.runAllTimersAsync();
  expect(nodes.at(-1)!.textContent).toBe("Fremder Inhalt");
  expect(vi.getTimerCount()).toBe(0);
});
