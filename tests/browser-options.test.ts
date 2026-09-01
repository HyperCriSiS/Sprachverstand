import { describe, expect, it, vi } from "vitest";
import {
  openOptionsPageInForeground,
  parseOptionsPageTabId
} from "../src/browser/options";

describe("Optionsseite", () => {
  it("öffnet die Einstellungen ausdrücklich im Vordergrund", async () => {
    const getURL = vi.fn(
      (path: string) => `moz-extension://sprachverstand/${path}`
    );
    const create = vi.fn(async () => ({ id: 42 }));

    await openOptionsPageInForeground(
      {
        runtime: { getURL },
        tabs: { create }
      },
      17
    );

    expect(getURL).toHaveBeenCalledWith("options/options.html");
    expect(create).toHaveBeenCalledWith({
      url: "moz-extension://sprachverstand/options/options.html?tabId=17",
      active: true
    });
  });

  it("öffnet die Einstellungen ohne erfundenen Tab-Kontext", async () => {
    const getURL = vi.fn(
      (path: string) => `moz-extension://sprachverstand/${path}`
    );
    const create = vi.fn(async () => ({ id: 42 }));

    await openOptionsPageInForeground({
      runtime: { getURL },
      tabs: { create }
    });

    expect(create).toHaveBeenCalledWith({
      url: "moz-extension://sprachverstand/options/options.html",
      active: true
    });
  });

  it("liest nur gültige Tab-IDs aus der Options-URL", () => {
    expect(parseOptionsPageTabId("?tabId=17")).toBe(17);
    expect(parseOptionsPageTabId("?foo=bar&tabId=0")).toBe(0);
    expect(parseOptionsPageTabId("")).toBeUndefined();
    expect(parseOptionsPageTabId("?tabId=-1")).toBeUndefined();
    expect(parseOptionsPageTabId("?tabId=1.5")).toBeUndefined();
    expect(parseOptionsPageTabId("?tabId=abc")).toBeUndefined();
  });
});
