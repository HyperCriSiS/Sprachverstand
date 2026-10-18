import {beforeEach, describe, expect, it, vi} from "vitest";
import {defaultSettings, type Settings} from "../src/settings/defaults";
import type {DomProcessorOptions} from "../src/core/dom-processor";

const state = vi.hoisted(() => ({
  runtimeId: "sprachverstand" as string | undefined,
  instances: [] as {options: DomProcessorOptions; stop: ReturnType<typeof vi.fn>}[],
  transform: vi.fn(async (_input: string) => {throw new Error("Extension context invalidated.");})
}));
vi.mock("../src/browser/api", () => ({getExtensionApi: () => ({runtime: {
  get id() {return state.runtimeId;},
  sendMessage: vi.fn(async () => undefined),
  onMessage: {addListener: () => undefined}
}})}));
vi.mock("../src/browser/local-transform", () => ({transformTextLocally: state.transform}));
vi.mock("../src/core/dom-processor", () => ({DomProcessor: class {
  start = vi.fn();
  stop = vi.fn();
  stopBudgeted = vi.fn(async () => undefined);
  constructor(_document: Document, readonly options: DomProcessorOptions) {
    state.instances.push(this);
  }
  getReplacementCount() {return 0;}
  getReplacementSummary() {return [];}
}}));
vi.mock("../src/settings/storage", () => ({
  subscribeToSettings: (listener: (settings: Settings) => Promise<void>) => {
    void listener({...defaultSettings, enabled: true, excludedDomains: []});
    return () => undefined;
  }
}));

async function settle() {for (let index = 0; index < 15; index += 1) await Promise.resolve();}

beforeEach(() => {
  vi.resetModules();
  state.instances.length = 0;
  state.transform.mockClear();
});

describe("Verwaistes Content-Script nach Erweiterungsupdate", () => {
  it("beendet die Verarbeitung ohne Wiederholungsschleife, wenn der Kontext fehlt", async () => {
    state.runtimeId = undefined;
    await import("../src/content"); await settle();
    const processor = state.instances[0]!;
    await expect(processor.options.transformText!("Lehrer:innen", {profile: "aggressive"}))
      .rejects.toThrow("Extension context invalidated.");
    expect(processor.stop).toHaveBeenCalledOnce();
    expect(processor.stop).toHaveBeenCalledWith();
  });

  it("lässt vorübergehende Hintergrundfehler bei gültigem Kontext weiterlaufen", async () => {
    state.runtimeId = "sprachverstand";
    await import("../src/content"); await settle();
    const processor = state.instances[0]!;
    await expect(processor.options.transformText!("Lehrer:innen", {profile: "aggressive"}))
      .rejects.toThrow();
    expect(processor.stop).not.toHaveBeenCalled();
  });
});
