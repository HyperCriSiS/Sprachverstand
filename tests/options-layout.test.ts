import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("static/options/options.html", "utf8");

describe("Einstellungsaufbau", () => {
  it("ordnet die Bereiche in der vorgesehenen Reihenfolge an", () => {
    const headings = [
      ...html.matchAll(/<summary><h2>([^<]+)<\/h2><\/summary>/gu)
    ].map((match) => match[1]);

    expect(headings).toEqual([
      "Allgemein",
      "Was soll korrigiert werden?",
      "Wo soll korrigiert werden?",
      "Persönliche Ausnahmen",
      "Eigene Ersetzungen",
      "Ausgeschlossene Domains",
      "Einstellungen sichern und übertragen",
      "Browser-Synchronisierung"
    ]);
  });

  it("bietet globale Schalter und einzeln aufklappbare Bereiche", () => {
    expect(html).toContain('id="expand-all-sections"');
    expect(html).toContain('id="collapse-all-sections"');
    expect(html.match(/<details class="settings-section"/gu)).toHaveLength(8);
    expect(html.match(/<details class="settings-section" open>/gu)).toHaveLength(2);
  });
});
