import { describe, expect, it, vi } from "vitest";
import { openOptionsPageInForeground } from "../src/browser/options";

describe("Optionsseite", () => {
  it("öffnet die erweiterten Einstellungen ausdrücklich im Vordergrund", async () => {
    const getURL = vi.fn(
      (path: string) => `moz-extension://sprachverstand/${path}`
    );
    const create = vi.fn(async () => ({ id: 42 }));

    await openOptionsPageInForeground({
      runtime: { getURL },
      tabs: { create }
    });

    expect(getURL).toHaveBeenCalledWith("options/options.html");
    expect(create).toHaveBeenCalledWith({
      url: "moz-extension://sprachverstand/options/options.html",
      active: true
    });
  });
});
