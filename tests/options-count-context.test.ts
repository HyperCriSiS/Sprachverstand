import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const backgroundSource = readFileSync("src/background.ts", "utf8");
const optionsSource = readFileSync("src/options.ts", "utf8");

describe("Options-Zähler", () => {
  it("leitet den Ursprungstab stateless aus der Sender-URL ab", () => {
    expect(backgroundSource).toContain("parseOptionsPageTabId(sender.url)");
    expect(backgroundSource).not.toContain("inspectedTabId");
    expect(backgroundSource).not.toContain("lastCountedTabId");
    expect(backgroundSource).not.toContain("sprachverstand.set-inspected-tab");
  });

  it("fragt nach einem Worker-Neustart den Content-Script-Zustand live ab", () => {
    expect(backgroundSource).toContain("const live = await readLiveReplacementState(tabId)");
    expect(backgroundSource).toContain("statesByTab.set(tabId, live)");
  });

  it("bedient das bestehende Options-Protokoll weiterhin kompatibel", () => {
    expect(optionsSource).toContain("sprachverstand.get-inspected-count");
    expect(optionsSource).toContain("sprachverstand.count-updated");
    expect(backgroundSource).toContain("sprachverstand.get-inspected-count");
    expect(backgroundSource).toContain("sprachverstand.count-updated");
  });
});
