import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import type {DetailedTransformResult} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
const frames: FrameRequestCallback[] = [];
const replies: Array<() => void> = [];
let clockMs = 0;
beforeEach(() => {
  clockMs = 0;
  vi.spyOn(window.performance, "now").mockImplementation(() => clockMs);
});
async function settle(): Promise<void> {
  for (let index = 0; index < 16; index++) await Promise.resolve();
}
function start(count: number): HTMLElement[] {
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.push(callback); return frames.length;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});
  const container = document.createElement("div");
  container.className = "subtitle-cue";
  const captions = Array.from({length: count}, (_, index) => {
    const span = document.createElement("span");
    span.textContent = `Nutzer:innen ${index}`; container.append(span); return span;
  });
  document.body.append(container);
  processor = new DomProcessor(document, {rules: [], profile: "aggressive",
    processSubtitles: true, processAccessibleAttributes: false,
    transformText: input => new Promise<DetailedTransformResult>(resolve => {
      replies.push(() => resolve({text: input.replace("Nutzer:innen", "Nutzer"),
        replacements: input.includes("Nutzer:innen") ? 1 : 0, summaries: []}));
    })});
  processor.start(); processor.flush();
  return captions;
}
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  document.body.replaceChildren(); frames.length = 0; replies.length = 0;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it("applies a ready caption without waiting for another animation frame", async () => {
  const [caption] = start(1);
  await settle(); replies.shift()!(); await settle();
  expect(caption!.textContent).toBe("Nutzer 0");
  expect(processor!.getReplacementCount()).toBe(1);
});

it("bounds ready replies between frames and completes the remainder on later frames", async () => {
  const captions = start(30);
  await settle(); replies.splice(0).forEach(reply => reply()); await settle();
  const changed = () => captions.filter(caption => !caption.textContent!.includes(":innen")).length;
  expect(changed()).toBeGreaterThan(0);
  expect(changed()).toBeLessThanOrEqual(12);
  for (let index = 0; index < 40 && changed() < 30; index++) {
    frames.shift()?.(index * 16); await settle();
  }
  expect(changed()).toBe(30);
  expect(processor!.getReplacementCount()).toBe(30);
});

it("does not apply a reply after the processor has stopped", async () => {
  const [caption] = start(1);
  await settle(); replies.shift()!(); processor!.stop({restore: true}); await settle();
  expect(caption!.textContent).toBe("Nutzer:innen 0");
  expect(processor!.getReplacementCount()).toBe(0);
});

it("shares the frame budget across separately arriving replies", async () => {
  const captions = start(20);
  await settle();
  for (const reply of replies.splice(0)) {reply(); await settle();}
  const changed = captions.filter(caption => caption.textContent!.startsWith("Nutzer ")).length;
  expect(changed).toBeGreaterThan(0);
  expect(changed).toBeLessThanOrEqual(12);
  for (let index = 0; index < 40 && processor!.getReplacementCount() < 20; index++) {
    frames.shift()?.(index * 16); await settle();
  }
  expect(processor!.getReplacementCount()).toBe(20);
});

it.each(["childList", "characterData"])("dispatches a single %s cue before the first animation frame", async mutation => {
  start(0);
  const caption = document.querySelector("div")!;
  if (mutation === "characterData") {
    caption.textContent = "neutral"; await settle();
    replies.splice(0).forEach(reply => reply()); await settle();
    caption.firstChild!.textContent = "Nutzer:innen neu";
  } else caption.textContent = "Nutzer:innen neu";
  await settle();
  expect(replies).toHaveLength(1);
  replies.shift()!(); await settle();
  expect(caption.textContent).toBe("Nutzer neu");
  expect(processor!.getReplacementCount()).toBe(1);
});

it("yields after an expensive ready edit instead of draining the reply batch", async () => {
  const replaceData = CharacterData.prototype.replaceData;
  vi.spyOn(CharacterData.prototype, "replaceData").mockImplementation(function (
    this: CharacterData, offset: number, count: number, data: string
  ) {
    clockMs += 3;
    replaceData.call(this, offset, count, data);
  });
  const captions = start(20);
  await settle(); replies.splice(0).forEach(reply => reply()); await settle();
  expect(captions.filter(caption => caption.textContent!.startsWith("Nutzer "))).toHaveLength(1);
  for (let index = 0; index < 40 && processor!.getReplacementCount() < 20; index++) {
    frames.shift()?.(index * 16); await settle();
  }
  expect(processor!.getReplacementCount()).toBe(20);
});
