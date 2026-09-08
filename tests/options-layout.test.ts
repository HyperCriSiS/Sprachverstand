import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("static/options/options.html", "utf8");
const css = readFileSync("static/options/options.css", "utf8");

describe("Einstellungsaufbau", () => {
  it("ordnet die Bereiche in der vorgesehenen Reihenfolge an", () => {
    const headings = [
      ...html.matchAll(/<summary\b[^>]*>\s*<h2\b[^>]*>([^<]+)<\/h2>[\s\S]*?<\/summary>/gu)
    ].map((match) => match[1]);

    expect(headings).toEqual([
      "Allgemein",
      "Popup-Menü",
      "Was soll korrigiert werden?",
      "Wo sollen zusätzliche Korrekturen gelten?",
      "Persönliche Ausnahmen",
      "Eigene Ersetzungen",
      "Ausgeschlossene Domains",
      "Einstellungen sichern und übertragen",
      "Browser-Synchronisierung"
    ]);
  });

  it("setzt den Domain-Arbeitsmodus direkt hinter die Domainüberschrift", () => {
    const summary =
      html.match(/<summary class="domain-list-summary">([\s\S]*?)<\/summary>/u)?.[1] ??
      "";
    expect(summary).toContain('id="domain-list-title"');
    expect(summary).toContain('id="domain-list-mode"');
    expect(summary.indexOf('id="domain-list-mode"')).toBeGreaterThan(
      summary.indexOf('id="domain-list-title"')
    );
  });

  it("bietet globale Schalter und einzeln aufklappbare Bereiche", () => {
    expect(html).toContain('id="expand-all-sections"');
    expect(html).toContain('id="collapse-all-sections"');
    expect(html.match(/<details\b[^>]*class="settings-section"[^>]*>/gu)).toHaveLength(9);
    expect(
      html.match(/<details\b(?=[^>]*class="settings-section")(?=[^>]*\bopen(?:="")?)[^>]*>/gu)
    ).toBeNull();
  });

  it("lässt unter der letzten Regelkarte keinen zusätzlichen Trenner stehen", () => {
    expect(css).toMatch(/\.rule-card:last-child\s*\{[^}]*border-bottom:\s*0;/u);
  });

  it("zeigt Speichern als alleinige vollbreite Hauptaktion vor den Bereichsschaltern", () => {
    const toolbarStart = html.indexOf('class="settings-toolbar"');
    const firstSectionStart = html.indexOf('<details class="settings-section"');
    const saveIndex = html.indexOf('id="save-settings"');
    const expandIndex = html.indexOf('id="expand-all-sections"');
    const collapseIndex = html.indexOf('id="collapse-all-sections"');

    expect(toolbarStart).toBeGreaterThanOrEqual(0);
    expect(firstSectionStart).toBeGreaterThan(toolbarStart);
    for (const buttonIndex of [saveIndex, expandIndex, collapseIndex]) {
      expect(buttonIndex).toBeGreaterThan(toolbarStart);
      expect(buttonIndex).toBeLessThan(firstSectionStart);
    }
    expect(html).not.toContain('id="reset"');
    expect(css).toMatch(/\.settings-save-button\s*\{[^}]*width:\s*100%;/u);
    expect(html).not.toContain('<div class="actions">');
  });

  it("zeigt im Seitenkopf nur Logo und Titel", () => {
    const header = html.match(/<header class="page-header">([\s\S]*?)<\/header>/u)?.[1] ?? "";
    expect(header).toMatch(/<h1\b[^>]*>Sprachverstand<\/h1>/u);
    expect(header).not.toContain("<p>");
  });
});
