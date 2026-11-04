import {describe, expect, it, vi} from "vitest";
import {defaultSettings} from "../src/settings/defaults";
import {transformComposeBody} from "../src/thunderbird/compose-transform";
import {connectComposeCorrection} from "../src/thunderbird/compose-background";
import {composeSettingKey, type ComposeDetails, type ThunderbirdComposeApi} from "../src/thunderbird/compose-api";
import type {MessageListener} from "../src/browser/api";

vi.mock("../src/settings/storage", () => ({loadSettings: async () => defaultSettings}));

describe("one-time reply/forward body correction", () => {
  it("corrects actual plain text, retaining newlines and user rules", () => {
    expect(transformComposeBody({type: "reply", isPlainText: true, plainTextBody: "Hallo\nDie Nutzer:innen lesen."}, defaultSettings))
      .toEqual({plainTextBody: "Hallo\nDie Nutzer lesen."});
    expect(transformComposeBody({type: "forward", isPlainText: true, plainTextBody: "Nutzer:innen Test"},
      {...defaultSettings, protectedTerms: ["Nutzer:innen"], customReplacements: [{source: "Test", replacement: "Probe"}]}))
      .toEqual({plainTextBody: "Nutzer:innen Probe"});
  });

  it("preserves HTML markup, link targets, embedded images and technical text", () => {
    const body = '<html><body><blockquote><p>Die <b>Nutzer:innen</b> lesen.</p><a href="https://example.org/Nutzer:innen">Link</a><img src="cid:bild"><code>Nutzer:innen</code></blockquote></body></html>';
    const result = transformComposeBody({type: "forward", isPlainText: false, body}, defaultSettings);
    expect(result?.body).toContain('<b>Nutzer</b>');
    expect(result?.body).toContain('href="https://example.org/Nutzer:innen"');
    expect(result?.body).toContain('src="cid:bild"');
    expect(result?.body).toContain('<code>Nutzer:innen</code>');
    expect(result?.body).toContain('<blockquote>');
  });

  it("does not change new messages, drafts, redirects, edited bodies or a disabled extension", () => {
    for (const type of ["new", "draft", "redirect", undefined]) {
      expect(transformComposeBody({...(type ? {type} : {}), isPlainText: true, plainTextBody: "Nutzer:innen"}, defaultSettings)).toBeUndefined();
    }
    expect(transformComposeBody({type: "reply", isModified: true, isPlainText: true, plainTextBody: "Nutzer:innen"}, defaultSettings)).toBeUndefined();
    expect(transformComposeBody({type: "reply", isPlainText: true, plainTextBody: "Nutzer:innen"}, {...defaultSettings, enabled: false})).toBeUndefined();
    expect(transformComposeBody({type: "reply", isPlainText: false, body: "<p>Hallo</p>"}, defaultSettings)).toBeUndefined();
  });
});

function setup(active = true, granted = true) {
  let listener: MessageListener;
  const body: ComposeDetails = {type: "reply", isPlainText: true, plainTextBody: "Nutzer:innen"};
  const api = {
    runtime: {onMessage: {addListener: (value: MessageListener) => {listener = value;}}},
    storage: {local: {get: vi.fn().mockResolvedValue({[composeSettingKey]: active})}, onChanged: {addListener: vi.fn()}},
    permissions: {contains: vi.fn().mockResolvedValue(granted), onAdded: {addListener: vi.fn()}, onRemoved: {addListener: vi.fn()}},
    scripting: {compose: {getRegisteredScripts: vi.fn().mockResolvedValue([]), registerScripts: vi.fn().mockResolvedValue(undefined), unregisterScripts: vi.fn().mockResolvedValue(undefined)}},
    compose: {getComposeDetails: vi.fn().mockResolvedValue(body), setComposeDetails: vi.fn().mockResolvedValue(undefined)},
    tabs: {onRemoved: {addListener: vi.fn()}}
  };
  connectComposeCorrection(api as unknown as ThunderbirdComposeApi);
  return {api, message: () => listener!({type: "sprachverstand.compose-ready"}, {tab: {id: 7}})};
}

describe("compose registration and application", () => {
  it("is off by default and never touches compose without permission", async () => {
    for (const [active, granted] of [[false, true], [true, false]]) {
      const {api, message} = setup(active, granted);
      await message();
      expect(api.compose.getComposeDetails).not.toHaveBeenCalled();
      expect(api.compose.setComposeDetails).not.toHaveBeenCalled();
      expect(api.scripting.compose.registerScripts).not.toHaveBeenCalled();
    }
  });
  it("updates only the body once without touching recipients, subject or attachments", async () => {
    const {api, message} = setup();
    await message();
    await message();
    expect(api.compose.setComposeDetails).toHaveBeenCalledExactlyOnceWith(7, {plainTextBody: "Nutzer"});
    await vi.waitFor(() => expect(api.scripting.compose.registerScripts).toHaveBeenCalledOnce());
  });
  it("does not overwrite edits made while settings and body were being read", async () => {
    const {api, message} = setup();
    api.compose.getComposeDetails.mockResolvedValueOnce({type: "reply", isPlainText: true, plainTextBody: "Nutzer:innen"})
      .mockResolvedValueOnce({type: "reply", isPlainText: true, plainTextBody: "Mein neuer Text"});
    await message();
    expect(api.compose.setComposeDetails).not.toHaveBeenCalled();
  });
  it("writes corrected HTML into the actual compose API body, independently of display processing", async () => {
    const {api, message} = setup();
    let actualBody = '<html><body><p>Die Nutzer:innen lesen.</p></body></html>';
    api.compose.getComposeDetails.mockImplementation(async () => ({type: "forward", isPlainText: false, body: actualBody}));
    api.compose.setComposeDetails.mockImplementation(async (_tabId: number, patch: {body?: string}) => {
      actualBody = patch.body!;
    });
    await message();
    expect(actualBody).toContain("Die Nutzer lesen.");
    expect(actualBody).not.toContain("Nutzer:innen");
    const original = actualBody;
    await message();
    expect(actualBody).toBe(original);
    expect(api.compose.setComposeDetails).toHaveBeenCalledOnce();
  });
  it("unregisters compose processing when the local option is switched off", async () => {
    const {api} = setup();
    await vi.waitFor(() => expect(api.scripting.compose.registerScripts).toHaveBeenCalledOnce());
    api.storage.local.get.mockResolvedValue({[composeSettingKey]: false});
    api.scripting.compose.getRegisteredScripts.mockResolvedValue([{id: "sprachverstand-compose-on-open"}]);
    api.storage.onChanged.addListener.mock.calls[0]![0]({[composeSettingKey]: {newValue: false}}, "local");
    await vi.waitFor(() => expect(api.scripting.compose.unregisterScripts).toHaveBeenCalledWith({ids: ["sprachverstand-compose-on-open"]}));
  });
});
