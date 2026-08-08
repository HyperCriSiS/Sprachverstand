import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ruleGroupDefinitions } from "../src/rules/catalog";

const html = readFileSync("static/options/options.html", "utf8");

describe("Popup-Konfiguration", () => {
  it("gruppiert die sichtbaren Regelgruppen direkt unter Was soll korrigiert werden", () => {
    const group = html.match(
      /<div class="popup-option-group">([\s\S]*?)<\/fieldset>\s*<\/div>/u
    )?.[1] ?? "";

    expect(group).toContain('data-popup-section="rule-groups"');
    expect(group).toContain("<legend>Einzelne Regelgruppen im Popup</legend>");

    for (const ruleGroup of ruleGroupDefinitions) {
      expect(group).toContain(
        `data-popup-section="rule-group:${ruleGroup.id}"`
      );
    }
  });

  it("ordnet die abhängigen Regelgruppen vor den nächsten Popup-Bereichen an", () => {
    const parentIndex = html.indexOf('data-popup-section="rule-groups"');
    const firstChildIndex = html.indexOf('data-popup-section="rule-group:plural-separators"');
    const textOptionsIndex = html.indexOf('data-popup-section="text-options"');

    expect(parentIndex).toBeGreaterThanOrEqual(0);
    expect(firstChildIndex).toBeGreaterThan(parentIndex);
    expect(textOptionsIndex).toBeGreaterThan(firstChildIndex);
  });
});
