import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

let processor: DomProcessor | undefined;

const rule: Rule = {
  id: "test.subtitle-frame-budget",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return { text, replacements: text === input ? 0 : 1 };
  }
};

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

function start(): void {
  processor = new DomProcessor(document, {
    rules: [rule],
    profile: "conservative",
    processSubtitles: true,
    processAccessibleAttributes: false
  });
  processor.start();
}

function createCaptions(count: number): HTMLDivElement {
  const container = document.createElement("div");
  container.className = "ytp-caption-window";
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < count; index += 1) {
    const span = document.createElement("span");
    span.textContent = "Nutzer:innen";
    fragment.append(span);
  }
  container.append(fragment);
  document.body.append(container);
  return container;
}

describe("Untertitel: harte Arbeitsgrenze für dynamische Cues", () => {
  it("durchläuft große neue Caption-Unterbäume nicht im MutationObserver und verteilt sie über Frames", async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    start();

    const container = createCaptions(120);
    await Promise.resolve();
    expect(callbacks).toHaveLength(1);
    expect(container.textContent).toContain("Nutzer:innen");
    expect(container.querySelectorAll("span").length).toBe(120);

    callbacks.shift()?.(0);
    const afterOneFrame = [...container.querySelectorAll("span")]
      .filter((span) => span.textContent === "Nutzer").length;
    expect(afterOneFrame).toBeGreaterThan(0);
    expect(afterOneFrame).toBeLessThanOrEqual(12);
    expect(afterOneFrame).toBeLessThan(120);

    let additionalFrames = 0;
    while (callbacks.length > 0 && additionalFrames < 120) {
      callbacks.shift()?.(0);
      additionalFrames += 1;
    }
    expect(additionalFrames).toBeGreaterThan(0);
    expect(container.textContent).not.toContain("Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(120);
    expect(callbacks).toHaveLength(0);
  });

  it("verarbeitet ausstehende Cues bei explizitem flush vollständig", async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    start();

    const container = createCaptions(80);
    await Promise.resolve();
    expect(container.textContent).toContain("Nutzer:innen");
    processor?.flush();
    expect(container.textContent).not.toContain("Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(80);
  });

  it("verwirft offene Caption-Arbeit beim Stoppen und restauriert bereits veränderte Cues", async () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    vi.stubGlobal("cancelAnimationFrame", () => {});
    start();

    const container = createCaptions(80);
    await Promise.resolve();
    callbacks.shift()?.(0);
    expect(container.textContent).toContain("Nutzer");
    processor?.stop({ restore: true });
    expect(container.textContent).not.toContain("Nutzer</");
    expect([...container.querySelectorAll("span")].every(
      (span) => span.textContent === "Nutzer:innen"
    )).toBe(true);
    callbacks.shift()?.(0);
    expect(processor?.getReplacementCount()).toBe(0);
  });
});
