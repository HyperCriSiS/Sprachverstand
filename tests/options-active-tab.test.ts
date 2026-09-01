import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const popupSource = readFileSync("src/popup.ts", "utf8");
const optionsSource = readFileSync("src/options.ts", "utf8");
const backgroundSource = readFileSync("src/background.ts", "utf8");

describe("Tab-Kontext der Einstellungsseite", () => {
  it("übergibt den aktiven Popup-Tab ausdrücklich an die Einstellungsseite", () => {
    expect(popupSource).toContain(
      "openOptionsPageInForeground(api, activeTabId)"
    );
  });

  it("fragt den Zustand genau dieses Tabs ab und hört auf aktuelle Statusmeldungen", () => {
    expect(optionsSource).toContain(
      "parseOptionsPageTabId(window.location.search)"
    );
    expect(optionsSource).toContain(
      'type: "sprachverstand.get-replacement-state"'
    );
    expect(optionsSource).toContain(
      'candidate.type === "sprachverstand.state-updated"'
    );
    expect(optionsSource).not.toContain("sprachverstand.get-inspected-count");
    expect(optionsSource).not.toContain("sprachverstand.count-updated");
  });

  it("enthält keinen globalen Inspector-Zustand mehr im Background", () => {
    expect(backgroundSource).not.toContain("sprachverstand.set-inspected-tab");
    expect(backgroundSource).not.toContain("sprachverstand.get-inspected-count");
    expect(backgroundSource).not.toContain("inspectedTabId");
    expect(backgroundSource).not.toContain("lastCountedTabId");
  });
});
