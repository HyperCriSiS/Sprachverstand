import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {domRuleMetadata} from "../src/rules/dom-metadata";
import {defaultRules} from "../src/rules";
import {transformTextWithSummary} from "../src/core/transform-text";
let processor: DomProcessor | undefined;
afterEach(() => {processor?.stop({restore: true}); processor = undefined; document.body.replaceChildren(); vi.unstubAllGlobals();});
async function settle() {for (let index = 0; index < 15; index++) await Promise.resolve();}
it("cancels queued background tasks when stopped", async () => {
  const tasks: (() => void)[] = [];
  const postTask = vi.fn(async (work: () => void) => {tasks.push(work);});
  vi.stubGlobal("scheduler", {postTask});
  document.body.innerHTML = '<span>Nutzer:innen</span>'.repeat(128);
  const transform = vi.fn(async (input: string) => ({text: input, replacements: 0, summaries: []}));
  processor = new DomProcessor(document, {rules: domRuleMetadata, profile: "aggressive", transformText: transform});
  processor.start(); expect(postTask).toHaveBeenCalledWith(expect.any(Function), {priority: "background"});
  processor.stop(); tasks.forEach(work => work()); await settle();
  expect(transform).not.toHaveBeenCalled();
});
it("finishes every inline node while removing its shared temporary boundary", async () => {
  const tasks: (() => void)[] = [];
  vi.stubGlobal("scheduler", {postTask: async (work: () => void) => {tasks.push(work);}});
  document.body.innerHTML = '<div>' + '<span>Nutzer:innen</span>'.repeat(128) + '</div>';
  const root = document.querySelector("div")!;
  const records: MutationRecord[] = [];
  const observer = new MutationObserver(batch => records.push(...batch));
  observer.observe(root, {childList: true, subtree: true});
  processor = new DomProcessor(document, {rules: domRuleMetadata, profile: "aggressive",
    transformText: async (input, options) => transformTextWithSummary(input, defaultRules, options)});
  processor.start();
  for (let index = 0; index < 100 && processor.getReplacementCount() < 128; index++) {
    tasks.shift()?.(); await settle();
  }
  observer.disconnect();
  expect(processor.getReplacementCount()).toBe(128);
  expect(root.childNodes.length).toBe(128);
  expect([...root.children].every(span => span.textContent === "Nutzer")).toBe(true);
  expect(records.length).toBeLessThan(128);
});
