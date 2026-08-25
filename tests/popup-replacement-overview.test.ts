import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const popupHtml = readFileSync("static/popup/popup.html", "utf8");
const popupCss = readFileSync("static/popup/popup.css", "utf8");

describe("Popup-Ersetzungsübersicht", () => {
  it("hält Marke links und Status getrennt rechts im Kopf", () => {
    expect(popupHtml).toContain('class="brand-lockup"');
    expect(popupHtml).toContain('id="state" class="status-badge"');
    expect(popupCss).toMatch(/\.brand-header\s*\{[\s\S]*?justify-content:\s*space-between/u);
    expect(popupCss).toMatch(/\.brand-lockup\s*\{[\s\S]*?justify-content:\s*flex-start/u);
  });

  it("bietet die Seitenkarte und eine eigene Detailansicht", () => {
    expect(popupHtml).toContain('id="open-replacements"');
    expect(popupHtml).toContain('id="details-view"');
    expect(popupHtml).toContain('id="replacement-list"');
    expect(popupHtml).toContain('id="close-replacements"');
    expect(popupHtml).toContain("Diese Seite");
    expect(popupHtml).toContain("unterschiedliche Ersetzungen");
  });

  it("trennt den Zurück-Pfeil sichtbar vom Text", () => {
    expect(popupCss).toMatch(/\.back-button\s*\{[\s\S]*?display:\s*inline-flex/u);
    expect(popupCss).toMatch(/\.back-button\s*\{[\s\S]*?gap:\s*4px/u);
  });
});
