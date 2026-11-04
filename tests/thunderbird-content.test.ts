import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {defaultSettings, type Settings} from "../src/settings/defaults";

const subscription = vi.hoisted(() => ({listener: undefined as ((settings: Settings) => void | Promise<void>) | undefined, unsubscribe: vi.fn()}));
vi.mock("../src/settings/storage", () => ({
  subscribeToSettings: (listener: (settings: Settings) => void | Promise<void>) => {
    subscription.listener = listener;
    return subscription.unsubscribe;
  }
}));

beforeEach(() => {
  vi.resetModules();
  subscription.unsubscribe.mockClear();
});
afterEach(() => {
  window.dispatchEvent(new Event("pagehide"));
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
});

async function mount() {
  const runtime = {sendMessage: vi.fn().mockResolvedValue(undefined), onMessage: {addListener: vi.fn(), removeListener: vi.fn()}};
  vi.stubGlobal("browser", {runtime});
  await import("../src/thunderbird/content");
  return runtime;
}

it("transforms a displayed message locally, protects inputs and restores on disable", async () => {
  document.body.innerHTML = '<p>Die Nutzer:innen lesen.</p><textarea>Nutzer:innen</textarea><div contenteditable="true">Nutzer:innen</div>';
  const runtime = {sendMessage: vi.fn().mockResolvedValue(undefined), onMessage: {addListener: vi.fn(), removeListener: vi.fn()}};
  vi.stubGlobal("browser", {runtime});
  await import("../src/thunderbird/content");
  try {
    await subscription.listener!({...defaultSettings, enabled: true});
    await expect.poll(() => document.querySelector("p")!.textContent).toBe("Die Nutzer lesen.");
    expect(document.querySelector("textarea")!.value).toBe("Nutzer:innen");
    expect(document.querySelector("[contenteditable]")!.textContent).toBe("Nutzer:innen");
    const listener = runtime.onMessage.addListener.mock.calls[0]![0];
    const state = await listener({type: "sprachverstand.get-current-replacement-state"});
    expect(state.count).toBeGreaterThan(0);
    expect(state.replacements).toEqual(expect.arrayContaining([expect.objectContaining({original: "Nutzer:innen", replacement: "Nutzer"})]));
    await subscription.listener!({...defaultSettings, enabled: false});
    expect(document.querySelector("p")!.textContent).toBe("Die Nutzer:innen lesen.");
    expect((await listener({type: "sprachverstand.get-current-replacement-state"})).count).toBe(0);
  } finally {
    window.dispatchEvent(new Event("pagehide"));
    document.body.innerHTML = "";
    vi.unstubAllGlobals();
  }
  expect(subscription.unsubscribe).toHaveBeenCalledOnce();
});

it("processes dynamically inserted message text and restores it, preserving links", async () => {
  document.body.innerHTML = '<p>Die Nutzer:innen lesen.</p><a href="https://example.org/Nutzer:innen">Link</a>';
  const originalHref = document.querySelector("a")!.getAttribute("href");
  await mount();
  await subscription.listener!({...defaultSettings, enabled: true});
  const paragraph = document.createElement("p");
  paragraph.textContent = "Die Mitarbeiter*innen lesen.";
  document.body.append(paragraph);
  await expect.poll(() => paragraph.textContent).toBe("Die Mitarbeiter lesen.");
  expect(document.querySelector("a")!.getAttribute("href")).toBe(originalHref);
  await subscription.listener!({...defaultSettings, enabled: false});
  expect(paragraph.textContent).toBe("Die Mitarbeiter*innen lesen.");
});

it("applies custom replacements and protected terms from the shared options", async () => {
  document.body.innerHTML = '<p>Nutzer:innen lesen Beispieltext.</p>';
  await mount();
  await subscription.listener!({...defaultSettings, enabled: true,
    protectedTerms: ["Nutzer:innen"], customReplacements: [{source: "Beispieltext", replacement: "Testtext"}]});
  await expect.poll(() => document.querySelector("p")!.textContent).toBe("Nutzer:innen lesen Testtext.");
  await subscription.listener!({...defaultSettings, enabled: false});
  expect(document.querySelector("p")!.textContent).toBe("Nutzer:innen lesen Beispieltext.");
});

it("honors the last settings change during rapid toggling and releases the runtime listener", async () => {
  document.body.innerHTML = '<p>Die Nutzer:innen lesen.</p>';
  const runtime = await mount();
  await Promise.all([
    subscription.listener!({...defaultSettings, enabled: true}),
    subscription.listener!({...defaultSettings, enabled: false}),
    subscription.listener!({...defaultSettings, enabled: true}),
    subscription.listener!({...defaultSettings, enabled: false})
  ]);
  expect(document.querySelector("p")!.textContent).toBe("Die Nutzer:innen lesen.");
  window.dispatchEvent(new Event("pagehide"));
  expect(runtime.onMessage.removeListener).toHaveBeenCalledWith(runtime.onMessage.addListener.mock.calls[0]![0]);
  expect(subscription.unsubscribe).toHaveBeenCalledOnce();
});

it("keeps web-video subtitle processing off even with imported browser settings", async () => {
  document.body.innerHTML = '<p>Die Nutzer:innen lesen.</p><div class="ytp-caption-segment">Nutzer:innen</div>';
  await mount();
  await subscription.listener!({...defaultSettings, enabled: true, processSubtitles: true});
  await expect.poll(() => document.querySelector("p")!.textContent).toBe("Die Nutzer lesen.");
  expect(document.querySelector(".ytp-caption-segment")!.textContent).toBe("Nutzer:innen");
});
