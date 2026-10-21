import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const backgroundSource = readFileSync("src/background.ts", "utf8");
const optionsSource = readFileSync("src/options.ts", "utf8");
const browserOptionsSource = readFileSync("src/browser/options.ts", "utf8");

describe("Options-Zähler", () => {
  it("übergibt den Ursprungstab und öffnet die Optionsseite sichtbar als aktiven Tab", () => {
    expect(browserOptionsSource).toContain("sprachverstand.set-inspected-tab");
    expect(browserOptionsSource).toContain("api.tabs.create({");
    expect(browserOptionsSource).toContain("active: true");
    expect(browserOptionsSource).not.toContain("api.runtime.openOptionsPage()");
    expect(backgroundSource).toContain("isSetInspectedTabMessage(message)");
    expect(backgroundSource).toContain("inspectedTabId = message.tabId");
    expect(backgroundSource).toContain(
      "inspectedTabId ?? parseOptionsPageTabId(sender.url)"
    );
    expect(backgroundSource).not.toContain("lastCountedTabId");
  });

  it("stellt vollständige Ersetzungsdetails nach einem Background-Neustart aus storage.session wieder her", () => {
    expect(backgroundSource).toContain("sprachverstand.runtime-state.");
    expect(backgroundSource).toContain("api.storage.session");
    expect(backgroundSource).toContain("readCachedTabState(tabId)");
    expect(backgroundSource).toContain("persistTabState(tabId, state)");
  });

  it("bedient das bestehende Options-Protokoll weiterhin kompatibel", () => {
    expect(optionsSource).toContain("sprachverstand.get-inspected-count");
    expect(optionsSource).toContain("sprachverstand.count-updated");
    expect(backgroundSource).toContain("sprachverstand.get-inspected-count");
    expect(backgroundSource).toContain("sprachverstand.count-updated");
  });
});
