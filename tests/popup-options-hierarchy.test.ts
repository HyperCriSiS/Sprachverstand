import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ruleGroupDefinitions } from "../src/rules/catalog";

const html = readFileSync("static/options/options.html", "utf8");
const css = readFileSync("static/options/options.css", "utf8");

describe("Popup-Konfiguration", () => {
  it("gruppiert die sichtbaren Regelgruppen direkt unter Was soll korrigiert werden", () => {
    const group = html.match(
      /<div class="popup-option-group">([\s\S]*?)<\/fieldset>\s*<\/div>/u
    )?.[1] ?? "";

    expect(group).toContain('data-popup-section="rule-groups"');
    expect(group).toMatch(/<legend\b[^>]*>Einzelne Regelgruppen im Popup<\/legend>/u);

    for (const ruleGroup of ruleGroupDefinitions) {
      expect(group).toContain(
        `data-popup-section="rule-group:${ruleGroup.id}"`
      );
    }
  });

  it("ordnet Was soll korrigiert werden als letzten Block des Popup-Menüs an", () => {
    const popupStart = html.indexOf('id="popup-sections"');
    const popupEnd = html.indexOf("</div>\n          </div>\n        </details>", popupStart);
    const popup = html.slice(popupStart, popupEnd);

    const countIndex = popup.indexOf('data-popup-section="count"');
    const activationIndex = popup.indexOf('data-popup-section="activation"');
    const textOptionsIndex = popup.indexOf('data-popup-section="text-options"');
    const openOptionsIndex = popup.indexOf('data-popup-section="open-options"');
    const parentIndex = popup.indexOf('data-popup-section="rule-groups"');
    const firstChildIndex = popup.indexOf(
      'data-popup-section="rule-group:plural-separators"'
    );

    expect(countIndex).toBeGreaterThanOrEqual(0);
    expect(activationIndex).toBeGreaterThan(countIndex);
    expect(textOptionsIndex).toBeGreaterThan(activationIndex);
    expect(openOptionsIndex).toBeGreaterThan(textOptionsIndex);
    expect(parentIndex).toBeGreaterThan(openOptionsIndex);
    expect(firstChildIndex).toBeGreaterThan(parentIndex);
  });

  it("lässt den letzten Regelgruppenblock ohne unteren Trenner auslaufen", () => {
    const groupRule = css.match(/\.popup-option-group\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
    expect(groupRule).toContain("border-bottom: 0");
  });

  it("zeigt auf der Einstellungsseite keinen Tab-Korrekturzähler mehr an", () => {
    expect(html).not.toContain("Korrekturen im aktuell aktiven Tab");
  });
});
