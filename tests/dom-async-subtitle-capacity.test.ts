import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import type {DetailedTransformResult, TransformOptions} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
const result = (input: string): DetailedTransformResult => ({
  text: input.replaceAll("Nutzer:innen", "Nutzer"), replacements: 1, summaries: []
});
async function drain() {
  for (let turn = 0; turn < 3; turn++) {
    for (let index = 0; index < 12; index++) await Promise.resolve();
    processor!.flush();
  }
}
function start(transformText: (input: string, options: TransformOptions, subtitle?: boolean) => Promise<DetailedTransformResult>) {
  document.body.innerHTML = '<p>Nutzer:innen im normalen Text</p>'.repeat(40);
  processor = new DomProcessor(document, {rules: [], profile: "aggressive", processSubtitles: true,
    processAccessibleAttributes: false, transformText});
  processor.start(); processor.flush();
}
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined; document.body.replaceChildren();
});

it("starts a fresh caption while ordinary text requests are still outstanding", async () => {
  const transform = vi.fn((input: string, _options: TransformOptions, subtitle?: boolean) =>
    subtitle ? Promise.resolve(result(input)) : new Promise<DetailedTransformResult>(() => {}));
  start(transform); await drain();
  const caption = document.createElement("div"); caption.className = "ytp-caption-segment";
  caption.textContent = "Nutzer:innen im Untertitel"; document.body.append(caption);
  await drain();
  expect(caption.textContent).toBe("Nutzer im Untertitel");
  expect(transform.mock.calls.filter(call => call[2])).toHaveLength(1);
  expect(processor!.getReplacementCount()).toBe(1);
});

it("keeps the shared concurrency bound for a burst of outstanding captions", async () => {
  let active = 0, maximum = 0;
  const resolveNormal: Array<() => void> = [];
  const transform = vi.fn((input: string, _options: TransformOptions, subtitle?: boolean) => {
    active++; maximum = Math.max(maximum, active);
    return new Promise<DetailedTransformResult>(resolve => {
      if (!subtitle) resolveNormal.push(() => {active--; resolve(result(input));});
    });
  });
  start(transform); await drain();
  for (let index = 0; index < 40; index++) {
    const caption = document.createElement("div"); caption.className = "ytp-caption-segment";
    caption.textContent = "Nutzer:innen im Untertitel " + index; document.body.append(caption);
  }
  await drain();
  expect(transform.mock.calls.some(call => call[2])).toBe(true);
  expect(maximum).toBeLessThanOrEqual(32);
  resolveNormal.splice(0).forEach(resolve => resolve()); await drain();
  expect(maximum).toBeLessThanOrEqual(32);
  expect(transform.mock.calls.filter(call => call[2])).toHaveLength(32);
});

it("drains all ordinary texts after slow requests finish and restores both paths", async () => {
  let slow = true;
  const finish: Array<() => void> = [];
  start((input, _options, subtitle) => !subtitle && slow
    ? new Promise<DetailedTransformResult>(resolve => {finish.push(() => resolve(result(input)));})
    : Promise.resolve(result(input)));
  await drain();
  const caption = document.createElement("div"); caption.className = "ytp-caption-segment";
  caption.textContent = "Nutzer:innen im Untertitel"; document.body.append(caption);
  await drain(); expect(caption.textContent).toBe("Nutzer im Untertitel");
  slow = false; finish.splice(0).forEach(resolve => resolve()); await drain();
  expect([...document.querySelectorAll("p")].every(node => node.textContent === "Nutzer im normalen Text")).toBe(true);
  expect(processor!.getReplacementCount()).toBe(41);
  processor!.stop({restore: true});
  expect(caption.textContent).toBe("Nutzer:innen im Untertitel");
  expect([...document.querySelectorAll("p")].every(node => node.textContent === "Nutzer:innen im normalen Text")).toBe(true);
});
