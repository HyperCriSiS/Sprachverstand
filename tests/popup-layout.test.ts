import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  defaultSettings,
  defaultVisiblePopupSectionIds,
  normalizeSettings
} from "../src/settings/defaults";

const popupHtml = readFileSync("static/popup/popup.html", "utf8");

describe("Popup-Anzeige", () => {
  it("behält die bisher sichtbaren Bereiche als Standard bei", () => {
    expect(defaultSettings.visiblePopupSectionIds).toEqual(
      defaultVisiblePopupSectionIds
    );
    expect(defaultVisiblePopupSectionIds).toEqual([
      "count",
      "activation",
      "rule-groups",
      "open-options"
    ]);
    expect(defaultVisiblePopupSectionIds).not.toContain("text-options");
  });

  it("übernimmt nur bekannte Popup-Bereiche", () => {
    const settings = normalizeSettings({
      visiblePopupSectionIds: [
        "count",
        "text-options",
        "unbekannt",
        "count"
      ]
    });

    expect(settings.visiblePopupSectionIds).toEqual([
      "count",
      "text-options"
    ]);
  });

  it("enthält alle konfigurierbaren Popup-Bereiche im Markup", () => {
    for (const id of [
      "count",
      "activation",
      "rule-groups",
      "text-options",
      "open-options"
    ]) {
      expect(popupHtml).toContain(`data-popup-section="${id}"`);
    }
  });

  it("stellt die Optionen aus Wo soll korrigiert werden im Popup bereit", () => {
    expect(popupHtml).toContain('id="process-accessible-attributes"');
    expect(popupHtml).toContain('id="process-quoted-text"');
    expect(popupHtml).toContain('id="process-subtitles"');
  });
});
