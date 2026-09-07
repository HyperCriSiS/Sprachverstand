import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const backgroundSource = readFileSync("src/background.ts", "utf8");
const optionsSource = readFileSync("src/options.ts", "utf8");
const browserOptionsSource = readFileSync("src/browser/options.ts", "utf8");

describe("Options-Zähler", () => {
  it("übergibt den Ursprungstab vor dem nativen Öffnen der Optionsseite", () => {
    expect(browserOptionsSource).toContain("sprachverstand.set-inspected-tab");
    expect(browserOptionsSource).toContain("api.runtime.openOptionsPage()");
    expect(backgroundSource).toContain("isSetInspectedTabMessage(message)");
    expect(backgroundSource).toContain("inspectedTabId = message.tabId");
    expect(backgroundSource).toContain(
      "inspectedTabId ?? parseOptionsPageTabId(sender.url)"
    );
    expect(backgroundSource).not.toContain("lastCountedTabId");
  });

  it("fragt nach einem Worker-Neustart den Content-Script-Zustand live ab und erhält vollständige Cache-Daten", () => {
    expect(backgroundSource).toContain(
      "const live = await readLiveReplacementState(tabId)"
    );
    expect(backgroundSource).toContain(
      "const merged = mergeCompatibleState(live, cached)"
    );
    expect(backgroundSource).toContain("statesByTab.set(tabId, merged)");
  });

  it("bedient das bestehende Options-Protokoll weiterhin kompatibel", () => {
    expect(optionsSource).toContain("sprachverstand.get-inspected-count");
    expect(optionsSource).toContain("sprachverstand.count-updated");
    expect(backgroundSource).toContain("sprachverstand.get-inspected-count");
    expect(backgroundSource).toContain("sprachverstand.count-updated");
  });
});
