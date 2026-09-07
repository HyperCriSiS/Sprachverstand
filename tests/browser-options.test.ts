import { describe, expect, it, vi } from "vitest";
import {
  openOptionsPageInForeground,
  parseOptionsPageTabId
} from "../src/browser/options";

describe("Optionsseite", () => {
  it("übergibt den Ursprungstab und öffnet danach die native Optionsseite", async () => {
    const calls: string[] = [];
    const sendMessage = vi.fn(async () => {
      calls.push("inspected-tab");
      return undefined;
    });
    const openOptionsPage = vi.fn(async () => {
      calls.push("open-options");
    });
    const query = vi.fn(async () => [{ id: 17 }]);

    await openOptionsPageInForeground({
      runtime: { sendMessage, openOptionsPage },
      tabs: { query }
    });

    expect(query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true
    });
    expect(sendMessage).toHaveBeenCalledWith({
      type: "sprachverstand.set-inspected-tab",
      tabId: 17
    });
    expect(openOptionsPage).toHaveBeenCalledTimes(1);
    expect(calls).toEqual(["inspected-tab", "open-options"]);
  });

  it("öffnet ohne gültigen aktiven Tab trotzdem die Optionsseite", async () => {
    const sendMessage = vi.fn(async () => undefined);
    const openOptionsPage = vi.fn(async () => undefined);
    const query = vi.fn(async () => [{}]);

    await openOptionsPageInForeground({
      runtime: { sendMessage, openOptionsPage },
      tabs: { query }
    });

    expect(sendMessage).not.toHaveBeenCalled();
    expect(openOptionsPage).toHaveBeenCalledTimes(1);
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
