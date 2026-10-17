import {readFileSync} from "node:fs";
import {afterEach, beforeEach, expect, it, vi} from "vitest";
import {defaultSettings} from "../src/settings/defaults";

const mocks = vi.hoisted(() => ({
  load: vi.fn(), save: vi.fn(), send: vi.fn(),
  addListener: vi.fn<(listener: (message: unknown) => void) => void>(),
  removeListener: vi.fn(), getMessage: vi.fn(() => "")
}));
vi.mock("../src/settings/storage", () => ({loadSettings: mocks.load, saveSettings: mocks.save}));
vi.mock("../src/browser/api", () => ({getExtensionApi: () => ({
  runtime: {sendMessage: mocks.send, onMessage: {addListener: mocks.addListener, removeListener: mocks.removeListener}},
  i18n: {getMessage: mocks.getMessage}
})}));

const html = readFileSync("static/options/options.html", "utf8");
let countResolvers: ((value: unknown) => void)[] = [];
beforeEach(() => {
  vi.useFakeTimers(); vi.resetModules(); vi.clearAllMocks();
  countResolvers = [];
  document.documentElement.innerHTML = html;
  mocks.load.mockResolvedValue(structuredClone(defaultSettings));
  mocks.save.mockResolvedValue(undefined);
  mocks.send.mockImplementation(() => new Promise(resolve => {countResolvers.push(resolve);}));
});
afterEach(async () => {
  mocks.send.mockResolvedValue(undefined);
  for (const resolve of countResolvers) resolve(undefined);
  await vi.advanceTimersByTimeAsync(0);
  window.dispatchEvent(new Event("unload"));
  vi.clearAllTimers(); vi.useRealTimers();
  document.documentElement.innerHTML = "<head></head><body></body>";
});

it("keeps saving available when the optional count request fails", async () => {
  mocks.send.mockRejectedValue(new Error("counter unavailable"));
  await import("../src/options");
  await vi.advanceTimersByTimeAsync(0);
  const submit = new Event("submit", {bubbles:true,cancelable:true});
  document.querySelector<HTMLFormElement>("#settings-form")!.dispatchEvent(submit);
  expect(submit.defaultPrevented).toBe(true);
  expect(mocks.save).toHaveBeenCalledTimes(1);
  expect(document.querySelector("#count")!.textContent).toBe("0");
});

it("keeps the newest count when refresh responses arrive out of order", async () => {
  await import("../src/options");
  await vi.advanceTimersByTimeAsync(0);
  countResolvers[0]!({tabId:17,text:"1"});
  await vi.advanceTimersByTimeAsync(0);
  document.querySelector<HTMLFormElement>("#settings-form")!.dispatchEvent(
    new Event("submit", {bubbles:true,cancelable:true}));
  await vi.advanceTimersByTimeAsync(401);
  expect(countResolvers).toHaveLength(5);
  countResolvers[4]!({tabId:17,text:"42"});
  await vi.advanceTimersByTimeAsync(0);
  countResolvers[1]!({tabId:17,text:"7"});
  await vi.advanceTimersByTimeAsync(0);
  expect(document.querySelector("#count")!.textContent).toBe("42");
});

it("keeps a live count update ahead of an older pending snapshot", async () => {
  await import("../src/options");
  await vi.advanceTimersByTimeAsync(0);
  countResolvers[0]!({tabId:17,text:"1"});
  await vi.advanceTimersByTimeAsync(0);
  document.querySelector<HTMLFormElement>("#settings-form")!.dispatchEvent(
    new Event("submit", {bubbles:true,cancelable:true}));
  await vi.advanceTimersByTimeAsync(401);
  mocks.addListener.mock.calls[0]![0]({type:"sprachverstand.count-updated",tabId:17,text:"99"});
  countResolvers[4]!({tabId:17,text:"42"});
  await vi.advanceTimersByTimeAsync(0);
  expect(document.querySelector("#count")!.textContent).toBe("99");
});

it("accepts a new inspected tab despite a late live update from the previous tab", async () => {
  await import("../src/options");
  await vi.advanceTimersByTimeAsync(0);
  countResolvers[0]!({tabId:17,text:"1"});
  await vi.advanceTimersByTimeAsync(0);
  document.querySelector<HTMLFormElement>("#settings-form")!.dispatchEvent(
    new Event("submit", {bubbles:true,cancelable:true}));
  await vi.advanceTimersByTimeAsync(401);
  const listener = mocks.addListener.mock.calls[0]![0];
  listener({type:"sprachverstand.count-updated",tabId:17,text:"99"});
  countResolvers[4]!({tabId:29,text:"42"});
  await vi.advanceTimersByTimeAsync(0);
  expect(document.querySelector("#count")!.textContent).toBe("42");
  listener({type:"sprachverstand.count-updated",tabId:29,text:"44"});
  expect(document.querySelector("#count")!.textContent).toBe("44");
});

it("saves a changed option while the inspected-tab count is still pending", async () => {
  await import("../src/options");
  await vi.advanceTimersByTimeAsync(0);
  expect(mocks.send).toHaveBeenCalledWith({type:"sprachverstand.get-inspected-count"});
  expect(document.querySelector<HTMLInputElement>("#enabled")!.checked).toBe(true);
  document.querySelector<HTMLInputElement>("#process-subtitles")!.checked = true;
  const submit = new Event("submit", {bubbles:true,cancelable:true});
  document.querySelector<HTMLFormElement>("#settings-form")!.dispatchEvent(submit);
  expect(submit.defaultPrevented).toBe(true);
  expect(mocks.save).toHaveBeenCalledWith(expect.objectContaining({processSubtitles:true}));
});
