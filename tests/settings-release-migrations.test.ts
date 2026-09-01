import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  currentSettingsRevision,
  defaultVisiblePopupSectionIds,
  normalizeSettings
} from "../src/settings/defaults";

function releaseFixture(version: string): unknown {
  return JSON.parse(
    readFileSync(`tests/fixtures/settings/${version}.json`, "utf8")
  );
}

describe("Settings-Migration veröffentlichter Versionen", () => {
  it("migriert einen v0.6.7-Zustand auf die aktuelle Struktur", () => {
    const settings = normalizeSettings(releaseFixture("v0.6.7"));

    expect(settings).toMatchObject({
      settingsRevision: currentSettingsRevision,
      enabled: false,
      excludedDomains: ["example.org", "localhost"],
      enabledRuleGroupIds: [
        "plural-separators",
        "unmarked-singular",
        "special-gender-forms"
      ],
      protectedTerms: ["Nutzer:innen", "trans* Personen"],
      customReplacements: [
        { source: "Teilnehmende", replacement: "Teilnehmer" }
      ],
      processAccessibleAttributes: false,
      processQuotedText: true,
      processSubtitles: false,
      syncCategoryIds: ["activation", "protected-terms"]
    });
    expect(settings.visiblePopupSectionIds).toEqual(
      defaultVisiblePopupSectionIds
    );
  });

  it("bewahrt die mit v0.7.0 eingeführte Untertiteloption", () => {
    const settings = normalizeSettings(releaseFixture("v0.7.0"));

    expect(settings).toMatchObject({
      settingsRevision: currentSettingsRevision,
      enabled: true,
      excludedDomains: ["sub.example.org"],
      enabledRuleGroupIds: ["plural-separators", "plural-binnen-i"],
      protectedTerms: ["Sonderbegriff"],
      customReplacements: [
        { source: "Studierende", replacement: "Studenten" }
      ],
      processAccessibleAttributes: true,
      processQuotedText: false,
      processSubtitles: true,
      syncCategoryIds: ["text-options"]
    });
    expect(settings.visiblePopupSectionIds).toEqual(
      defaultVisiblePopupSectionIds
    );
  });

  it("bewahrt die mit v0.7.1 gespeicherte Popup-Auswahl exakt", () => {
    const settings = normalizeSettings(releaseFixture("v0.7.1"));

    expect(settings).toMatchObject({
      settingsRevision: currentSettingsRevision,
      enabled: true,
      excludedDomains: ["example.net"],
      enabledRuleGroupIds: ["plural-separators"],
      processAccessibleAttributes: false,
      processQuotedText: false,
      processSubtitles: false,
      syncCategoryIds: []
    });
    expect(settings.visiblePopupSectionIds).toEqual([
      "count",
      "activation",
      "rule-groups",
      "rule-group:plural-separators",
      "open-options"
    ]);
  });
});
