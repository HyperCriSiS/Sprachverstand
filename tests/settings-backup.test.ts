import { describe, expect, it } from "vitest";
import {
  currentSettingsRevision,
  defaultSettings,
  type Settings
} from "../src/settings/defaults";
import {
  createSettingsBackupDocument,
  mergeImportedSettings,
  parseSettingsBackupDocument,
  settingsBackupFormat,
  settingsBackupFormatVersion,
  stringifySettingsBackupDocument
} from "../src/settings/settings-backup";

function sampleSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    ...defaultSettings,
    enabled: false,
    excludedDomains: ["example.org"],
    enabledRuleGroupIds: ["plural-separators", "unmarked-singular"],
    protectedTerms: ["Nutzer:innen"],
    customReplacements: [
      { source: "Sonderform", replacement: "Gewünschte Form" }
    ],
    processAccessibleAttributes: false,
    processQuotedText: false,
    syncCategoryIds: ["activation", "protected-terms"],
    ...overrides
  };
}

describe("Einstellungssicherung", () => {
  it("exportiert und importiert den vollständigen Einstellungsstand verlustfrei", () => {
    const settings = sampleSettings();
    const document = createSettingsBackupDocument(
      settings,
      "2026-07-28T18:30:00.000Z"
    );
    const parsed = parseSettingsBackupDocument(
      stringifySettingsBackupDocument(document)
    );

    expect(parsed).toEqual({
      format: settingsBackupFormat,
      version: settingsBackupFormatVersion,
      exportedAt: "2026-07-28T18:30:00.000Z",
      settings: {
        ...settings,
        settingsRevision: currentSettingsRevision
      }
    });
  });

  it("weist fremde und zukünftige Sicherungsformate zurück", () => {
    const exportedAt = new Date().toISOString();
    expect(() =>
      parseSettingsBackupDocument(
        JSON.stringify({
          format: "anderes-format",
          version: 1,
          exportedAt,
          settings: sampleSettings()
        })
      )
    ).toThrow(/keine Sprachverstand-Einstellungssicherung/u);

    expect(() =>
      parseSettingsBackupDocument(
        JSON.stringify({
          format: settingsBackupFormat,
          version: 99,
          exportedAt,
          settings: sampleSettings()
        })
      )
    ).toThrow(/wird nicht unterstützt/u);
  });

  it("weist unvollständige oder typwidrige Einstellungsobjekte zurück", () => {
    const document = createSettingsBackupDocument(sampleSettings());
    expect(() =>
      parseSettingsBackupDocument(
        JSON.stringify({
          ...document,
          settings: {
            ...document.settings,
            enabled: "ja"
          }
        })
      )
    ).toThrow(/Aktivierungsstatus/u);
  });

  it("übernimmt allgemeine Einstellungen bei jeder Importstrategie", () => {
    const existing = sampleSettings({
      enabled: true,
      excludedDomains: ["old.example"],
      enabledRuleGroupIds: ["plural-binnen-i"],
      processAccessibleAttributes: true,
      processQuotedText: true,
      protectedTerms: ["Vorhanden"],
      customReplacements: [{ source: "A", replacement: "Alt" }]
    });
    const imported = sampleSettings({
      enabled: false,
      excludedDomains: ["new.example"],
      enabledRuleGroupIds: ["plural-separators"],
      processAccessibleAttributes: false,
      processQuotedText: false,
    syncCategoryIds: ["activation", "protected-terms"],
      protectedTerms: ["Importiert"],
      customReplacements: [{ source: "A", replacement: "Neu" }]
    });

    for (const mode of [
      "keep-existing",
      "prefer-imported",
      "replace"
    ] as const) {
      const result = mergeImportedSettings(existing, imported, mode);
      expect(result.settings.enabled).toBe(false);
      expect(result.settings.excludedDomains).toEqual(["new.example"]);
      expect(result.settings.enabledRuleGroupIds).toEqual([
        "plural-separators"
      ]);
      expect(result.settings.processAccessibleAttributes).toBe(false);
      expect(result.settings.processQuotedText).toBe(false);
    }
  });

  it("verwendet die gewählte Strategie nur für persönliche Listen", () => {
    const existing = sampleSettings({
      protectedTerms: ["Vorhanden"],
      customReplacements: [{ source: "A", replacement: "Alt" }]
    });
    const imported = sampleSettings({
      protectedTerms: ["Importiert"],
      customReplacements: [
        { source: "A", replacement: "Neu" },
        { source: "B", replacement: "Ziel" }
      ]
    });

    const keep = mergeImportedSettings(existing, imported, "keep-existing");
    expect(keep.settings.protectedTerms).toEqual([
      "Vorhanden",
      "Importiert"
    ]);
    expect(keep.settings.customReplacements).toEqual([
      { source: "A", replacement: "Alt" },
      { source: "B", replacement: "Ziel" }
    ]);
    expect(keep.conflicts).toHaveLength(1);

    const prefer = mergeImportedSettings(
      existing,
      imported,
      "prefer-imported"
    );
    expect(prefer.settings.customReplacements[0]).toEqual({
      source: "A",
      replacement: "Neu"
    });

    const replace = mergeImportedSettings(existing, imported, "replace");
    expect(replace.settings.protectedTerms).toEqual(["Importiert"]);
    expect(replace.settings.customReplacements).toEqual(
      imported.customReplacements
    );
  });
  it("weist zukünftige Einstellungsrevisionen zurück", () => {
    const document = createSettingsBackupDocument(sampleSettings());
    expect(() =>
      parseSettingsBackupDocument(
        JSON.stringify({
          ...document,
          settings: {
            ...document.settings,
            settingsRevision: currentSettingsRevision + 1
          }
        })
      )
    ).toThrow(/neuer als die unterstützte Revision/u);
  });

  it("weist ungültige oder überlange persönliche Daten vollständig zurück", () => {
    const document = createSettingsBackupDocument(sampleSettings());
    expect(() =>
      parseSettingsBackupDocument(
        JSON.stringify({
          ...document,
          settings: {
            ...document.settings,
            excludedDomains: ["keine gültige Domain"]
          }
        })
      )
    ).toThrow(/Domain-Ausschluss/u);

    expect(() =>
      parseSettingsBackupDocument(
        JSON.stringify({
          ...document,
          settings: {
            ...document.settings,
            protectedTerms: ["x".repeat(81)]
          }
        })
      )
    ).toThrow(/80 Zeichen/u);

    expect(() =>
      parseSettingsBackupDocument(
        JSON.stringify({
          ...document,
          settings: {
            ...document.settings,
            customReplacements: [
              { source: "Doppelt", replacement: "A" },
              { source: "Doppelt", replacement: "B" }
            ]
          }
        })
      )
    ).toThrow(/mehrfach enthalten/u);
  });

  it("weist unbekannte Felder und Synchronisierungskategorien zurück", () => {
    const document = createSettingsBackupDocument(sampleSettings());
    expect(() =>
      parseSettingsBackupDocument(
        JSON.stringify({ ...document, unbekannt: true })
      )
    ).toThrow(/unbekannte Felder/u);

    expect(() =>
      parseSettingsBackupDocument(
        JSON.stringify({
          ...document,
          settings: {
            ...document.settings,
            syncCategoryIds: ["unbekannt"]
          }
        })
      )
    ).toThrow(/Synchronisierungskategorie/u);
  });

});
