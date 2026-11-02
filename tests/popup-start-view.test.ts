import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultSettings, normalizeSettings } from "../src/settings/defaults";

describe("Popup-Startansicht", () => {
  it("startet standardmäßig mit den Optionen und verwirft unbekannte Werte", () => {
    expect(defaultSettings.popupStartView).toBe("options");
    expect(normalizeSettings({ popupStartView: "unbekannt" }).popupStartView).toBe("options");
    expect(normalizeSettings({ popupStartView: "corrections" }).popupStartView).toBe("corrections");
  });

  it("behält Einstellungen aus Ständen vor der Startansicht", () => {
    const { popupStartView: _ignored, ...older } = {
      ...defaultSettings,
      processSubtitles: true
    };
    expect(normalizeSettings(older).processSubtitles).toBe(true);
    expect(normalizeSettings(older).popupStartView).toBe("options");
  });

  it("bietet die Auswahl in den Einstellungen", () => {
    const html = readFileSync("static/options/options.html", "utf8");
    expect(html).toContain('id="popup-start-view"');
  });
});
