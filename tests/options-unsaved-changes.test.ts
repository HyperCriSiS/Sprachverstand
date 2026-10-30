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


function leave(): Event {
  const event = new Event("beforeunload", {cancelable: true});
  window.dispatchEvent(event);
  return event;
}

it("warns before leaving with unsaved changes and clears after saving or reverting", async () => {
  await import("../src/options");
  await vi.advanceTimersByTimeAsync(0);
  const button = document.querySelector<HTMLButtonElement>("#save-settings")!;
  const hint = button.querySelector<HTMLElement>(".unsaved-hint")!;
  const quoted = document.querySelector<HTMLInputElement>("#process-quoted-text")!;
  expect(leave().defaultPrevented).toBe(false);
  expect(hint.hidden).toBe(true);

  // Change, then revert: no longer unsaved.
  quoted.checked = !quoted.checked;
  quoted.dispatchEvent(new Event("change", {bubbles: true}));
  await vi.advanceTimersByTimeAsync(150);
  expect(hint.hidden).toBe(false);
  expect(button.classList.contains("has-unsaved")).toBe(true);
  expect(leave().defaultPrevented).toBe(true);
  quoted.checked = !quoted.checked;
  quoted.dispatchEvent(new Event("change", {bubbles: true}));
  await vi.advanceTimersByTimeAsync(150);
  expect(hint.hidden).toBe(true);
  expect(leave().defaultPrevented).toBe(false);

  // Change and save.
  quoted.checked = !quoted.checked;
  quoted.dispatchEvent(new Event("change", {bubbles: true}));
  // The warning does not wait for the delayed hint update.
  expect(leave().defaultPrevented).toBe(true);
  document.querySelector<HTMLFormElement>("#settings-form")!.dispatchEvent(
    new Event("submit", {bubbles: true, cancelable: true}));
  await vi.advanceTimersByTimeAsync(0);
  expect(hint.hidden).toBe(true);
  expect(button.classList.contains("has-unsaved")).toBe(false);
  expect(leave().defaultPrevented).toBe(false);
});
