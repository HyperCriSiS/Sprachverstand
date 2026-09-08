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
    for (const id of [
      "count",
      "activation",
      "rule-groups",
      "domain-action",
      "open-options"
    ]) {
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

  it("blendet die neue Domain-Aktion bei bestehenden Installationen standardmäßig ein", () => {
    const settings = normalizeSettings({
      settingsRevision: 9,
      visiblePopupSectionIds: ["count", "activation", "rule-groups"]
    });

    expect(settings.visiblePopupSectionIds).toContain("domain-action");
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

  it("ordnet Aktivierungs-Checkbox links wie die Regelgruppen und die Domain-Aktion rechts an", () => {
    expect(popupHtml).toContain('class="activation-domain-row"');
    expect(popupHtml).toMatch(
      /<label class="switch-row popup-section"[\s\S]*?<input id="enabled" type="checkbox"\/?>([\s\S]*?)<span data-i18n="extensionActive">Erweiterung aktiv<\/span>[\s\S]*?<\/label>/u
    );
    expect(popupHtml).toContain('id="add-current-domain"');
    const rowBlock =
      popupCss.match(/\.activation-domain-row\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
    const switchBlock =
      popupCss.match(/\.switch-row\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
    const domainBlock =
      popupCss.match(/\.domain-action-button\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
    expect(rowBlock).toContain("display: flex");
    expect(rowBlock).toContain("align-items: center");
    expect(switchBlock).toContain("justify-content: flex-start");
    expect(domainBlock).toContain("margin-left: auto");
    expect(domainBlock).not.toContain("position: absolute");
  });

  it("bietet die aktuelle Website als separat ausblendbare Domain-Aktion an", () => {
    expect(popupHtml).toContain('id="add-current-domain"');
    expect(popupHtml).toContain('id="domain-action-status"');
    expect(popupHtml).toContain('aria-live="polite"');
    expect(popupHtml).toContain('data-popup-section="domain-action"');
  });

  it("bietet für die Popup-Regelgruppen die Schnellwahl Alle und Keine an", () => {
    expect(optionsHtml).toContain('id="select-all-popup-rules"');
    expect(optionsHtml).toContain('id="select-no-popup-rules"');
  });

  it("stellt die Optionen für zusätzliche Korrekturen im Popup bereit", () => {
    expect(popupHtml).toContain('id="process-accessible-attributes"');
    expect(popupHtml).toContain('id="process-quoted-text"');
    expect(popupHtml).toContain('id="process-subtitles"');
  });

  it("hält Desktop-Popups intrinsisch breit und nutzt Touch-Viewport responsiv", () => {
    const desktopBlock =
      popupCss.match(/html,\s*body\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
    const touchBlock =
      popupCss.match(
        /@media \(hover: none\) and \(pointer: coarse\)\s*\{[\s\S]*?html,\s*body\s*\{([\s\S]*?)\}/u
      )?.[1] ?? "";

    expect(desktopBlock).toContain("width: 384px");
    expect(desktopBlock).toContain("min-width: 384px");
    expect(desktopBlock).not.toContain("100vw");
    expect(touchBlock).toContain("width: 100%");
    expect(touchBlock).toContain("min-width: 0");
    expect(touchBlock).not.toContain("100vw");
    expect(popupCss).not.toContain("max-width: 100vw");
  });

  it("verwendet nur den äußeren Popup-Scrollbereich", () => {
    const popupRulesBlock =
      popupCss.match(/\.popup-rules\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
    expect(popupRulesBlock).not.toContain("overflow-y");
    expect(popupRulesBlock).not.toContain("max-height");
  });

  it("zeigt bei zusätzlichen Korrekturen keine Zeilentrenner", () => {
    const optionRowBlock =
      popupCss.match(/\.popup-option-row\s*\{([\s\S]*?)\}/u)?.[1] ?? "";
    expect(optionRowBlock).not.toContain("border");
  });
});
