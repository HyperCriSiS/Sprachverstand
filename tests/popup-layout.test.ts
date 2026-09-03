import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ruleGroupDefinitions } from "../src/rules/catalog";
import {
  currentSettingsRevision,
  defaultSettings,
  defaultVisiblePopupSectionIds,
  popupRuleGroupSectionId,
  normalizeSettings
} from "../src/settings/defaults";

const popupHtml = readFileSync("static/popup/popup.html", "utf8");
const popupCss = readFileSync("static/popup/popup.css", "utf8");
const optionsHtml = readFileSync("static/options/options.html", "utf8");

describe("Popup-Anzeige", () => {
  it("behält die bisher sichtbaren Bereiche und alle Regelgruppen als Standard bei", () => {
    expect(defaultSettings.visiblePopupSectionIds).toEqual(
      defaultVisiblePopupSectionIds
    );
    for (const id of ["count", "activation", "rule-groups", "domain-action", "open-options"]) {
      expect(defaultVisiblePopupSectionIds).toContain(id);
    }
    expect(defaultVisiblePopupSectionIds).not.toContain("text-options");
    for (const group of ruleGroupDefinitions) {
      expect(defaultVisiblePopupSectionIds).toContain(
        popupRuleGroupSectionId(group.id)
      );
    }
  });

  it("übernimmt nur bekannte Popup-Bereiche", () => {
    const settings = normalizeSettings({
      settingsRevision: currentSettingsRevision,
      visiblePopupSectionIds: [
        "count",
        "text-options",
        "rule-group:plural-separators",
        "unbekannt",
        "rule-group:unbekannt",
        "count"
      ]
    });

    expect(settings.visiblePopupSectionIds).toEqual([
      "count",
      "text-options",
      "rule-group:plural-separators"
    ]);
  });

  it("ergänzt beim Upgrade alle Regelgruppen als sichtbar", () => {
    const settings = normalizeSettings({
      settingsRevision: 8,
      visiblePopupSectionIds: ["count", "activation", "rule-groups"]
    });

    for (const group of ruleGroupDefinitions) {
      expect(settings.visiblePopupSectionIds).toContain(
        popupRuleGroupSectionId(group.id)
      );
    }
  });

  it("enthält alle konfigurierbaren Popup-Bereiche im Markup", () => {
    for (const id of [
      "count",
      "activation",
      "rule-groups",
      "text-options",
      "domain-action",
      "open-options"
    ]) {
      expect(popupHtml).toContain(`data-popup-section="${id}"`);
    }
  });

  it("bietet jede Regelgruppe einzeln für die Popup-Anzeige an", () => {
    for (const group of ruleGroupDefinitions) {
      expect(optionsHtml).toContain(
        `data-popup-section="${popupRuleGroupSectionId(group.id)}"`
      );
    }
  });

  it("stellt die aktuelle Website als separat ausblendbare Domain-Aktion bereit", () => {
    expect(popupHtml).toContain('id="add-current-domain"');
    expect(popupHtml).toContain('data-popup-section="domain-action"');
    expect(optionsHtml).toContain('data-popup-section="domain-action"');
  });

  it("bietet Alle und Keine für die im Popup sichtbaren Regelgruppen", () => {
    expect(optionsHtml).toContain('id="select-all-popup-rules"');
    expect(optionsHtml).toContain('id="select-no-popup-rules"');
  });

  it("stellt die Optionen aus Wo soll korrigiert werden im Popup bereit", () => {
    expect(popupHtml).toContain('id="process-accessible-attributes"');
    expect(popupHtml).toContain('id="process-quoted-text"');
    expect(popupHtml).toContain('id="process-subtitles"');
  });

  it("verwendet nur den äußeren Popup-Scrollbereich", () => {
    const popupRulesBlock =
      popupCss.match(/\.popup-rules\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
    expect(popupRulesBlock).not.toContain("overflow-y");
    expect(popupRulesBlock).not.toContain("max-height");
  });

  it("zeigt bei Wo soll korrigiert werden keine Zeilentrenner", () => {
    const optionRowBlock =
      popupCss.match(/\.popup-option-row\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
    expect(optionRowBlock).not.toContain("border");
  });
});
