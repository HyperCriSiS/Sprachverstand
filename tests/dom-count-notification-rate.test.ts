import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {defaultRules} from "../src/rules";

let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.useRealTimers(); document.body.replaceChildren();
});
describe("Begrenzte Statusmelderate", () => {
  it("meldet gebündelt den neuesten Stand und hält direkte Abfragen aktuell", async () => {
    vi.useFakeTimers(); document.body.innerHTML = "<p>Nutzer:innen</p>";
    const report = vi.fn();
    processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive",
      replacementNotificationIntervalMs: 100, onReplacementCountChange: report});
    processor.start();
    expect(processor.getReplacementCount()).toBe(1);
    expect(report).not.toHaveBeenCalled();
    const p = document.createElement("p"); p.textContent = "Nutzer:innen"; document.body.append(p);
    await Promise.resolve(); processor.flush();
    expect(processor.getReplacementCount()).toBe(2);
    expect(processor.getReplacementSummary()).toEqual([
      {original: "Nutzer:innen", replacement: "Nutzer", count: 2}
    ]);
    await vi.advanceTimersByTimeAsync(99); expect(report).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(report).toHaveBeenCalledOnce();
    expect(report).toHaveBeenLastCalledWith(2, processor.getReplacementSummary());
  });
  it("meldet einen Stop sofort und verwirft überholte positive Meldungen", async () => {
    vi.useFakeTimers(); document.body.innerHTML = "<p>Nutzer:innen</p>";
    const report = vi.fn();
    processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive",
      replacementNotificationIntervalMs: 100, onReplacementCountChange: report});
    processor.start(); processor.stop({restore: true}); await Promise.resolve();
    expect(report).toHaveBeenCalledOnce(); expect(report).toHaveBeenLastCalledWith(0, []);
    await vi.advanceTimersByTimeAsync(500);
    expect(report).toHaveBeenCalledOnce();
  });
});
