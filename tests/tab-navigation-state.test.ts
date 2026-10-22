import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const apiSource = readFileSync("src/browser/api.ts", "utf8");
const backgroundSource = readFileSync("src/background.ts", "utf8");

describe("Tab-Navigation", () => {
  it("bildet tabs.onUpdated ohne URL-Zugriff im API-Vertrag ab", () => {
    expect(apiSource).toContain("readonly onUpdated");
    expect(apiSource).toContain('status?: "loading" | "complete"');
  });

  it("verwirft Cache und Badge beim Beginn einer Navigation", () => {
    expect(backgroundSource).toContain("api.tabs.onUpdated.addListener");
    expect(backgroundSource).toContain('changeInfo.status === "loading"');
    expect(backgroundSource).toContain("statesByTab.delete(tabId)");
    expect(backgroundSource).toContain('setBadgeText({ text: "", tabId })');
  });

  it("meldet nach dem Reset einen leeren Zustand an offene Oberflächen", () => {
    expect(backgroundSource).toContain("await notifyStateUpdate(tabId, {");
    expect(backgroundSource).toContain("count: 0");
    expect(backgroundSource).toContain("replacements: []");
  });
});
