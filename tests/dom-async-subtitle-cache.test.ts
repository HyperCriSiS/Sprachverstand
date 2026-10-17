import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor, type DomProcessorOptions} from "../src/core/dom-processor";
import type {DetailedTransformResult, TransformOptions} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
const options: DomProcessorOptions = {rules: [], profile: "aggressive", processSubtitles: true,
  processAccessibleAttributes: false};
const result = (input: string): DetailedTransformResult => ({
  text: input.replaceAll("Nutzer:innen", "Nutzer"), replacements: 1, summaries: []
});
async function drain() {
  for (let turn = 0; turn < 2; turn++) {
    for (let index = 0; index < 12; index++) await Promise.resolve();
    processor!.flush();
  }
}
function start(transformText: (input: string, options: TransformOptions) => Promise<DetailedTransformResult>) {
  document.body.innerHTML = '<div class="ytp-caption-segment">Nutzer:innen</div>';
  processor = new DomProcessor(document, {...options, transformText});
  processor.start(); processor.flush();
  return document.querySelector("div")!;
}
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined; document.body.replaceChildren();
});

it("reuses a completed async caption without another background request and preserves its count", async () => {
  const transform = vi.fn(async (input: string) => result(input));
  const caption = start(transform);
  await drain(); expect(caption.textContent).toBe("Nutzer");
  caption.textContent = "Nutzer:innen";
  await drain(); expect(caption.textContent).toBe("Nutzer");
  expect(transform).toHaveBeenCalledOnce();
  expect(processor!.getReplacementCount()).toBe(1);
  processor!.stop({restore: true}); expect(caption.textContent).toBe("Nutzer:innen");
});

it("does not share caption results with context-sensitive ordinary page text", async () => {
  const transform = vi.fn(async (input: string) => result(input));
  start(transform); await drain();
  const paragraph = document.createElement("p"); paragraph.textContent = "Nutzer:innen";
  document.body.append(paragraph); await drain();
  expect(paragraph.textContent).toBe("Nutzer"); expect(transform).toHaveBeenCalledTimes(2);
});

it("rejects late responses from old options without poisoning the new caption cache", async () => {
  let resolveOld!: (value: DetailedTransformResult) => void;
  let first = true;
  const transform = vi.fn(async (input: string, configuration: TransformOptions) => {
    if (first) {first = false; return new Promise<DetailedTransformResult>(resolve => {resolveOld = resolve;});}
    return {...result(input), text: configuration.profile === "conservative" ? "Aktuell" : "Alt"};
  });
  const caption = start(transform); await drain();
  processor!.updateOptions({...options, profile: "conservative", transformText: transform});
  await drain(); expect(caption.textContent).toBe("Aktuell");
  resolveOld({...result("Nutzer:innen"), text: "Veraltet"}); await drain();
  caption.textContent = "Nutzer:innen"; await drain();
  expect(caption.textContent).toBe("Aktuell"); expect(transform).toHaveBeenCalledTimes(2);
});

it("clears a completed caption result when its transform options change", async () => {
  const transform = vi.fn(async (input: string, configuration: TransformOptions) =>
    ({...result(input), text: configuration.profile === "conservative" ? "Aktuell" : "Alt"}));
  const caption = start(transform); await drain(); expect(caption.textContent).toBe("Alt");
  processor!.updateOptions({...options, profile: "conservative", transformText: transform});
  await drain(); expect(caption.textContent).toBe("Aktuell");
  caption.textContent = "Nutzer:innen"; await drain();
  expect(caption.textContent).toBe("Aktuell"); expect(transform).toHaveBeenCalledTimes(2);
});

it("does not retain oversized caption inputs", async () => {
  const transform = vi.fn(async (input: string) => result(input));
  const caption = start(transform); await drain();
  const input = "Nutzer:innen" + " ".repeat(8192);
  caption.textContent = input; await drain();
  caption.textContent = input; await drain();
  expect(transform).toHaveBeenCalledTimes(3);
});

it("does not retain an oversized expansion of a short caption", async () => {
  const transform = vi.fn(async (input: string) => ({...result(input), text: "Nutzer" + " ".repeat(8192)}));
  const caption = start(transform); await drain();
  caption.textContent = "Nutzer:innen"; await drain();
  expect(transform).toHaveBeenCalledTimes(2);
});

it("evicts older captions while retaining recent ones", async () => {
  const transform = vi.fn(async (input: string) => result(input));
  const caption = start(transform); await drain();
  for (let index = 0; index < 256; index++) {
    caption.textContent = "Nutzer:innen " + index; await drain();
  }
  caption.textContent = "Nutzer:innen"; await drain();
  expect(transform).toHaveBeenCalledTimes(258);
  caption.textContent = "Nutzer:innen 255"; await drain();
  expect(transform).toHaveBeenCalledTimes(258);
});

it("reuses an unchanged result without creating a replacement count", async () => {
  const transform = vi.fn(async (input: string) => ({text: input, replacements: 0, summaries: []}));
  const caption = start(transform); await drain();
  caption.textContent = "Nutzer:innen"; await drain();
  expect(transform).toHaveBeenCalledOnce(); expect(processor!.getReplacementCount()).toBe(0);
});

it("does not cache a response after the source text has been replaced", async () => {
  let resolveOld!: (value: DetailedTransformResult) => void;
  let first = true;
  const transform = vi.fn(async (input: string) => {
    if (first) {first = false; return new Promise<DetailedTransformResult>(resolve => {resolveOld = resolve;});}
    return result(input);
  });
  const caption = start(transform); await drain();
  caption.textContent = "Andere Nutzer:innen"; await drain();
  resolveOld(result("Nutzer:innen")); await drain();
  expect(caption.textContent).toBe("Andere Nutzer");
  caption.textContent = "Nutzer:innen"; await drain();
  expect(caption.textContent).toBe("Nutzer"); expect(transform).toHaveBeenCalledTimes(3);
});
