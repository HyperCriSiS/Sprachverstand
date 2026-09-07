import { describe, expect, it, vi } from "vitest";
import {
  openOptionsPageInForeground,
  parseOptionsPageTabId
} from "../src/browser/options";

describe("Optionsseite", () => {
  it("übergibt den Ursprungstab und öffnet danach einen aktiven Options-Tab", async () => {
    const calls: string[] = [];
    const sendMessage = vi.fn(async () => {
      calls.push("inspected-tab");
      return undefined;
    });
    const getURL = vi.fn((path: string) => `moz-extension://sprachverstand/${path}`);
    const query = vi.fn(async () => [{ id: 17 }]);
    const create = vi.fn(async () => { calls.push("create-tab"); return { id: 31 }; });
    const update = vi.fn(async () => { calls.push("activate-tab"); return { id: 31 }; });

    await openOptionsPageInForeground({
      runtime: { sendMessage, getURL },
      tabs: { query, create, update }
    });

    expect(query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "sprachverstand.set-inspected-tab",
      tabId: 17
    });
    expect(create).toHaveBeenCalledWith({
      url: "moz-extension://sprachverstand/options/options.html?tabId=17",
      active: true
    });
    expect(update).toHaveBeenCalledWith(31, { active: true });
    expect(calls).toEqual(["inspected-tab", "create-tab", "activate-tab"]);
  });

  it("öffnet ohne gültigen aktiven Tab trotzdem einen aktiven Options-Tab", async () => {
    const sendMessage = vi.fn(async () => undefined);
    const getURL = vi.fn((path: string) => `moz-extension://sprachverstand/${path}`);
    const query = vi.fn(async () => [{}]);
    const create = vi.fn(async () => ({ id: 31 }));
    const update = vi.fn(async () => ({ id: 31 }));

    await openOptionsPageInForeground({
      runtime: { sendMessage, getURL },
      tabs: { query, create, update }
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(create).toHaveBeenCalledWith({
      url: "moz-extension://sprachverstand/options/options.html",
      active: true
    });
    expect(update).toHaveBeenCalledWith(31, { active: true });
  });

  it("liest nur gültige Tab-IDs aus Options-URLs und Querystrings", () => {
    expect(
      parseOptionsPageTabId(
        "moz-extension://sprachverstand/options/options.html?tabId=17"
      )
    ).toBe(17);
    expect(parseOptionsPageTabId("?foo=bar&tabId=0")).toBe(0);
    expect(parseOptionsPageTabId(undefined)).toBeUndefined();
    expect(parseOptionsPageTabId("?tabId=-1")).toBeUndefined();
    expect(parseOptionsPageTabId("?tabId=1.5")).toBeUndefined();
    expect(parseOptionsPageTabId("?tabId=abc")).toBeUndefined();
    expect(parseOptionsPageTabId("keine-url")).toBeUndefined();
  });
});
