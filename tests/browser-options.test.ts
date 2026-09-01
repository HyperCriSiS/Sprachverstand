import { describe, expect, it, vi } from "vitest";
import {
  openOptionsPageInForeground,
  parseOptionsPageTabId
} from "../src/browser/options";

describe("Optionsseite", () => {
  it("öffnet die Einstellungen mit dem aktiven Ursprungstab im Vordergrund", async () => {
    const getURL = vi.fn(
      (path: string) => `moz-extension://sprachverstand/${path}`
    );
    const create = vi.fn(async () => ({ id: 42 }));
    const query = vi.fn(async () => [{ id: 17 }]);

    await openOptionsPageInForeground({
      runtime: { getURL },
      tabs: { create, query }
    });

    expect(query).toHaveBeenCalledWith({
      active: true,
      currentWindow: true
    });
    expect(getURL).toHaveBeenCalledWith("options/options.html");
    expect(create).toHaveBeenCalledWith({
      url: "moz-extension://sprachverstand/options/options.html?tabId=17",
      active: true
    });
  });

  it("erfindet ohne gültigen aktiven Tab keinen Kontext", async () => {
    const getURL = vi.fn(
      (path: string) => `moz-extension://sprachverstand/${path}`
    );
    const create = vi.fn(async () => ({ id: 42 }));
    const query = vi.fn(async () => [{}]);

    await openOptionsPageInForeground({
      runtime: { getURL },
      tabs: { create, query }
    });

    expect(create).toHaveBeenCalledWith({
      url: "moz-extension://sprachverstand/options/options.html",
      active: true
    });
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
