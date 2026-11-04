import {describe, expect, it, vi} from "vitest";
import type {ExtensionApi, MessageListener} from "../src/browser/api";
import {connectMessageUi} from "../src/thunderbird/message-ui";

function setup() {
  let listener: MessageListener;
  const api = {
    runtime: {onMessage: {addListener: (value: MessageListener) => {listener = value;}}, sendMessage: vi.fn().mockResolvedValue(undefined)},
    tabs: {sendMessage: vi.fn().mockResolvedValue({count: 2, replacements: [{original: "Nutzer:innen", replacement: "Nutzer", count: 2}]}),
      onRemoved: {addListener: vi.fn()}, onUpdated: {addListener: vi.fn()}},
    action: {setBadgeText: vi.fn().mockResolvedValue(undefined), setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined)}
  };
  connectMessageUi(api as unknown as ExtensionApi);
  return {api, message: (value: unknown, sender = {}) => listener!(value, sender)};
}

describe("Thunderbird shared UI bridge", () => {
  it("reads live corrections without storage or hostname/author inference", async () => {
    const {api, message} = setup();
    const result = await message({type: "sprachverstand.get-replacement-state", tabId: 7});
    expect(api.tabs.sendMessage).toHaveBeenCalledWith(7, {type: "sprachverstand.get-current-replacement-state"});
    expect(result).toMatchObject({count: 2, hostname: "", replacements: [{original: "Nutzer:innen", replacement: "Nutzer", count: 2}]});
    api.tabs.sendMessage.mockRejectedValueOnce(new Error("closed"));
    expect(await message({type: "sprachverstand.get-replacement-state", tabId: 7})).toMatchObject({count: 0, replacements: []});
  });

  it("routes the options counter to the tab in its URL", async () => {
    const {api, message} = setup();
    await message({type: "sprachverstand.set-inspected-tab", tabId: 8});
    await message({type: "sprachverstand.get-inspected-count"}, {url: "moz-extension://test/options/options.html?tabId=7"});
    expect(api.tabs.sendMessage).toHaveBeenLastCalledWith(7, expect.anything());
  });

  it("publishes count and details for the shared popup and badge", async () => {
    const {api, message} = setup();
    const replacements = [{original: "Nutzer:innen", replacement: "Nutzer", count: 2}];
    await message({type: "sprachverstand.replacement-state", count: 2, replacements}, {tab: {id: 7}});
    expect(api.action.setBadgeText).toHaveBeenCalledWith({tabId: 7, text: "2"});
    expect(api.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({type: "sprachverstand.state-updated", tabId: 7, count: 2, replacements}));
    await message({type: "sprachverstand.replacement-state", count: 99, replacements});
    expect(api.action.setBadgeText).toHaveBeenCalledTimes(1);
  });

  it("clears the displayed counter on navigation and forgets closed inspected tabs", async () => {
    const {api, message} = setup();
    await message({type: "sprachverstand.set-inspected-tab", tabId: 7});
    const update = api.tabs.onUpdated.addListener.mock.calls[0]![0];
    update(7, {status: "loading"});
    expect(api.action.setBadgeText).toHaveBeenCalledWith({tabId: 7, text: ""});
    expect(api.runtime.sendMessage).toHaveBeenCalledWith(expect.objectContaining({tabId: 7, count: 0, replacements: []}));
    api.tabs.onRemoved.addListener.mock.calls[0]![0](7);
    expect(await message({type: "sprachverstand.get-inspected-count"})).toEqual({text: "0"});
    expect(api.tabs.sendMessage).not.toHaveBeenCalled();
  });

  it("ignores malformed requests and clears invalid live responses", async () => {
    const {api, message} = setup();
    for (const value of [null, {}, {type: "sprachverstand.get-replacement-state", tabId: -1},
      {type: "sprachverstand.replacement-state", count: NaN, replacements: []}]) {
      expect(await message(value)).toBeUndefined();
    }
    expect(api.tabs.sendMessage).not.toHaveBeenCalled();
    expect(api.action.setBadgeText).not.toHaveBeenCalled();
    api.tabs.sendMessage.mockResolvedValueOnce({count: Infinity, replacements: []});
    expect(await message({type: "sprachverstand.get-replacement-state", tabId: 7})).toMatchObject({count: 0, replacements: []});
  });
});
