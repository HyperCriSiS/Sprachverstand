import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {domRuleMetadata} from "../src/rules/dom-metadata";
import {defaultRules} from "../src/rules";
import {isBuiltInTransformCandidate} from "../src/rules/transform-candidate";
import {transformTextWithSummary, type DetailedTransformResult, type TransformOptions} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
afterEach(() => {processor?.stop({restore: true}); processor = undefined; document.body.replaceChildren(); vi.useRealTimers();});
async function settle() {for (let index = 0; index < 12; index++) await Promise.resolve();}
function start(transform: (input: string, options: TransformOptions) => Promise<DetailedTransformResult>, subtitles = false) {
  processor = new DomProcessor(document, {rules: domRuleMetadata, profile: "aggressive", transformText: transform,
    isTransformCandidate: isBuiltInTransformCandidate, processSubtitles: subtitles});
  processor.start(); processor.flush();
}
const actual = async (input: string, options: TransformOptions) => transformTextWithSummary(input, defaultRules, options);
it("applies small text and accessible attributes only during a DOM slice and restores live ranges", async () => {
  document.body.innerHTML = '<p aria-label="Nutzer:innen">Nutzer:innen</p>';
  const paragraph = document.querySelector("p")!; const text = paragraph.firstChild as Text;
  const range = document.createRange(); range.setStart(text, 0); range.setEnd(text, text.length);
  start(actual); expect(text.data).toBe("Nutzer:innen");
  await settle(); expect(text.data).toBe("Nutzer:innen"); processor!.flush();
  expect(text.data).toBe("Nutzer"); expect(range.toString()).toBe("Nutzer");
  expect(paragraph.getAttribute("aria-label")).toBe("Nutzer"); expect(processor!.getReplacementCount()).toBe(2);
  processor!.restoreAll(); expect(text.data).toBe("Nutzer:innen");
  expect(range.toString()).toBe("Nutzer");
});
it.each(["changed", "protected", "stopped"])("discards stale responses after %s", async mode => {
  document.body.innerHTML = '<p>Nutzer:innen</p>'; const paragraph = document.querySelector("p")!;
  let resolve!: (result: DetailedTransformResult) => void;
  start(() => new Promise(yes => {resolve = yes;})); await settle();
  if (mode === "changed") paragraph.textContent = "Aktuelle Zeile";
  if (mode === "protected") paragraph.setAttribute("contenteditable", "true");
  if (mode === "stopped") processor!.stop();
  resolve(await actual("Nutzer:innen", {profile: "aggressive"})); await settle(); processor!.flush();
  expect(paragraph.textContent).toBe(mode === "changed" ? "Aktuelle Zeile" : "Nutzer:innen");
  expect(processor!.getReplacementCount()).toBe(0);
});
it("retains split inline protection and caption behavior", async () => {
  document.body.innerHTML = '<p><code>Nutzer:innen</code> Nutzer:innen</p><div class="ytp-caption-segment">Nutzer:innen</div>';
  start(actual, true); await settle(); processor!.flush(); await settle(); processor!.flush();
  expect(document.querySelector("code")!.textContent).toBe("Nutzer:innen");
  expect(document.querySelector("p")!.textContent).toBe("Nutzer:innen Nutzer");
  expect(document.querySelector("div")!.textContent).toBe("Nutzer");
});
it("retries after a local background failure without calling metadata rules", async () => {
  vi.useFakeTimers(); document.body.innerHTML = '<p>Nutzer:innen</p>';
  let first = true;
  const transform = vi.fn(async (input: string, options: TransformOptions) => {
    if (first) {first = false; throw new Error("background restarted");} return actual(input, options);
  });
  start(transform); await settle(); processor!.flush();
  expect(document.querySelector("p")!.textContent).toBe("Nutzer:innen");
  await vi.advanceTimersByTimeAsync(1100); processor!.flush(); await settle(); processor!.flush();
  expect(document.querySelector("p")!.textContent).toBe("Nutzer"); expect(transform).toHaveBeenCalledTimes(2);
});
it("reevaluates split dative context from the saved original", async () => {
  document.body.innerHTML = '<p><span>mit </span><span>Nutzer:innen</span></p>';
  start(actual); await settle(); processor!.flush();
  expect(document.querySelector("p")!.textContent).toBe("mit Nutzern");
  document.querySelector("span")!.textContent = "für ";
  await settle(); processor!.flush(); await settle(); processor!.flush();
  expect(document.querySelector("p")!.textContent).toBe("für Nutzer");
  expect(processor!.getReplacementCount()).toBe(1);
});
it("keeps the original available when a context reevaluation fails and retries", async () => {
  vi.useFakeTimers();
  document.body.innerHTML = '<p><span>mit </span><span>Nutzer:innen</span></p>';
  let fail = false;
  start(async (input, options) => {
    if (fail) {fail = false; throw new Error("background restarted");}
    return actual(input, options);
  });
  await settle(); processor!.flush(); expect(document.querySelector("p")!.textContent).toBe("mit Nutzern");
  fail = true; document.querySelector("span")!.textContent = "für ";
  await settle(); processor!.flush(); await settle(); processor!.flush();
  expect(document.querySelector("p")!.textContent).toBe("für Nutzer:innen");
  expect(processor!.getReplacementCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(1100); processor!.flush(); await settle(); processor!.flush();
  expect(document.querySelector("p")!.textContent).toBe("für Nutzer");
  expect(processor!.getReplacementCount()).toBe(1);
});
it("invalidates pending accessible values after an editor transition", async () => {
  document.body.innerHTML = '<p aria-label="Nutzer:innen">Normaler Text</p>';
  let resolve!: (result: DetailedTransformResult) => void;
  start((input, options) => input === "Nutzer:innen"
    ? new Promise(yes => {resolve = yes;}) : actual(input, options)); await settle();
  document.querySelector("p")!.setAttribute("contenteditable", "true");
  resolve(await actual("Nutzer:innen", {profile: "aggressive"})); await settle(); processor!.flush();
  expect(document.querySelector("p")!.getAttribute("aria-label")).toBe("Nutzer:innen");
});
it("releases old concurrency slots when the same processor is restarted", async () => {
  document.body.innerHTML = '<p>Nutzer:innen</p>'.repeat(40);
  const stuck = vi.fn(() => new Promise<DetailedTransformResult>(() => {}));
  start(stuck); await settle(); expect(stuck).toHaveBeenCalledTimes(32);
  processor!.updateOptions({rules: domRuleMetadata, profile: "aggressive", transformText: actual});
  processor!.flush(); await settle(); processor!.flush(); await settle(); processor!.flush();
  expect([...document.querySelectorAll("p")].every(paragraph => paragraph.textContent === "Nutzer")).toBe(true);
});
