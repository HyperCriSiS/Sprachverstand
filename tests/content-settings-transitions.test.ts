import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import {defaultSettings, type Settings} from "../src/settings/defaults";
import type {DomProcessorOptions} from "../src/core/dom-processor";
import type {ReplacementSummaryEntry} from "../src/core/replacement-summary";

const state = vi.hoisted(() => ({
  settings: undefined as Settings | undefined,
  listener: undefined as ((settings: Settings) => Promise<void>) | undefined,
  instances: [] as {options: DomProcessorOptions; start: ReturnType<typeof vi.fn>; stopBudgeted: ReturnType<typeof vi.fn>}[],
  summaries: [] as ReplacementSummaryEntry[],
  messageListener: undefined as ((message: unknown) => unknown) | undefined,
  restorations: [] as (() => void)[],
  sendMessage: vi.fn(async (_message: unknown) => undefined)
}));
vi.mock("../src/browser/api", () => ({getExtensionApi: () => ({runtime: {
  sendMessage: state.sendMessage, onMessage: {addListener: (listener: (message: unknown) => unknown) => {state.messageListener = listener;}}
}})}));
vi.mock("../src/core/dom-processor", () => ({DomProcessor: class {
  start = vi.fn();
  stopBudgeted = vi.fn(() => new Promise<void>(resolve => state.restorations.push(resolve)));
  constructor(_document: Document, readonly options: DomProcessorOptions) {
    state.instances.push(this);
  }
  getReplacementCount() {return 0;}
  getReplacementSummary() {return state.summaries;}
}}));
vi.mock("../src/rules", () => ({defaultRules: [{id: "test", risk: "safe", apply: (input: string) => ({text: input, replacements: 0})}]}));
vi.mock("../src/settings/storage", () => ({
  loadSettingsWithRetry: async () => state.settings,
  subscribeToSettings: (listener: (settings: Settings) => Promise<void>) => {state.listener = listener; return () => undefined;}
}));
async function settle() {for (let index = 0; index < 15; index += 1) await Promise.resolve();}
beforeEach(() => {
  vi.resetModules(); state.settings = {...defaultSettings, enabled: true, excludedDomains: []};
  state.listener = undefined; state.instances.length = 0; state.restorations.length = 0;
  state.sendMessage.mockClear();
  state.summaries.length = 0; state.messageListener = undefined;
});
afterEach(() => {for (const resolve of state.restorations) resolve(); vi.resetModules();});
describe("Einstellungswechsel während kooperativer Originalrückgabe", () => {
  it("startet ohne aktive Regeln oder eigene Ersetzungen keinen DOM-Beobachter", async () => {
    state.settings = {...state.settings!, enabledRuleGroupIds: [], customReplacements: []};
    await import("../src/content"); await settle();
    expect(state.instances).toHaveLength(0);
    expect(state.sendMessage).toHaveBeenLastCalledWith(expect.objectContaining({count: 0, replacements: []}));
  });
  it("restauriert vor dem Abschalten aller Regeln und kann sie wieder aktivieren", async () => {
    await import("../src/content"); await settle();
    const disabled = state.listener!({...state.settings!, enabledRuleGroupIds: [], customReplacements: []});
    await settle();
    expect(state.instances[0]!.stopBudgeted).toHaveBeenCalledOnce();
    state.restorations[0]!(); await disabled;
    expect(state.instances).toHaveLength(1);
    expect(state.sendMessage).toHaveBeenLastCalledWith(expect.objectContaining({count: 0, replacements: []}));
    await state.listener!(state.settings!);
    expect(state.instances).toHaveLength(2);
    expect(state.instances[1]!.start).toHaveBeenCalledOnce();
  });
  it("verarbeitet eigene Ersetzungen auch ohne aktive eingebaute Regelgruppen", async () => {
    state.settings = {...state.settings!, enabledRuleGroupIds: [],
      customReplacements: [{source: "Nutzer:innen", replacement: "Benutzer"}]};
    await import("../src/content"); await settle();
    expect(state.instances).toHaveLength(1);
    expect(state.instances[0]!.start).toHaveBeenCalledOnce();
    expect(state.instances[0]!.options.customReplacements).toEqual(state.settings.customReplacements);
  });
  it("begrenzt Meldungen vor dem Transport auf die bestehende Hintergrundgrenze", async () => {
    await import("../src/content"); await settle();
    state.summaries.push(...Array.from({length: 500}, (_, index) =>
      ({original: `Quelle ${index}`, replacement: `Ziel ${index}`, count: 1})));
    state.instances[0]!.options.onReplacementCountChange!(500, state.summaries);
    expect(state.sendMessage).toHaveBeenLastCalledWith(expect.objectContaining({
      count: 500, replacements: state.summaries.slice(0, 250)
    }));
    expect(state.messageListener!({type: "sprachverstand.get-current-replacement-state"}))
      .toEqual(expect.objectContaining({replacements: state.summaries.slice(0, 250)}));
    expect(state.summaries).toHaveLength(500);
  });
  it("wartet auf die Rückgabe und startet ausschließlich die neuesten Einstellungen", async () => {
    await import("../src/content"); await settle();
    expect(state.instances).toHaveLength(1);
    const first = state.listener!({...state.settings!, protectedTerms: ["erste"]});
    await settle();
    expect(state.instances[0]!.stopBudgeted).toHaveBeenCalledOnce();
    const latest = state.listener!({...state.settings!, protectedTerms: ["neueste"]});
    expect(state.instances).toHaveLength(1);
    state.restorations[0]!(); await Promise.all([first, latest]);
    expect(state.instances).toHaveLength(2);
    expect(state.instances[1]!.options.protectedTerms).toEqual(["neueste"]);
    expect(state.instances[1]!.start).toHaveBeenCalledOnce();
  });
  it("startet nach einem späteren Abschalten keinen überholten Verarbeitungsdurchlauf", async () => {
    await import("../src/content"); await settle();
    const first = state.listener!({...state.settings!, protectedTerms: ["erste"]}); await settle();
    const disabled = state.listener!({...state.settings!, enabled: false});
    state.restorations[0]!(); await Promise.all([first, disabled]);
    expect(state.instances).toHaveLength(1);
    expect(state.sendMessage).toHaveBeenLastCalledWith(expect.objectContaining({count: 0, replacements: []}));
  });
});
