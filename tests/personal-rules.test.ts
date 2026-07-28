import { describe, expect, it } from "vitest";
import {
  analyzeCustomReplacementConflicts,
  createPersonalRulesDocument,
  formatCustomReplacementsText,
  mergePersonalRules,
  parseCustomReplacementsText,
  parsePersonalRulesDocument,
  parseProtectedTermsText,
  personalRulesFormat,
  personalRulesFormatVersion,
  stringifyPersonalRulesDocument
} from "../src/settings/personal-rules";

describe("Persönliche Regeln", () => {
  it("entfernt Ausnahmen-Dubletten unabhängig von der Schreibung", () => {
    expect(parseProtectedTermsText("Nutzer:innen\nnutzer:innen\nMeine Phrase\n"))
      .toEqual(["Nutzer:innen", "Meine Phrase"]);
  });

  it("liest beide Trenner und erkennt identische Dubletten", () => {
    const result = parseCustomReplacementsText(
      "Sonderform => Ziel\nZusatz → \nSonderform => Ziel"
    );
    expect(result.replacements).toEqual([
      { source: "Sonderform", replacement: "Ziel" },
      { source: "Zusatz", replacement: "" }
    ]);
    expect(result.notices[0]?.code).toBe("duplicate");
    expect(formatCustomReplacementsText(result.replacements)).toBe(
      "Sonderform => Ziel\nZusatz => "
    );
  });

  it("weist widersprüchliche Ziele zurück", () => {
    expect(() => parseCustomReplacementsText(
      "Sonderform => Ziel\nSonderform => Anderes Ziel"
    )).toThrow(/widersprüchliche Ersetzungen/u);
  });

  it("erkennt Konfliktarten", () => {
    const notices = analyzeCustomReplacementConflicts(
      [
        { source: "Gleich", replacement: "Gleich" },
        { source: "Entfernen", replacement: "" },
        { source: "Geschützt", replacement: "Ziel" },
        { source: "A", replacement: "B" },
        { source: "B", replacement: "C" },
        { source: "Nutzer", replacement: "Leser" },
        { source: "Nutzerkonto", replacement: "Konto" },
        { source: "Name", replacement: "Bezeichnung" },
        { source: "name", replacement: "Bezeichnung klein" },
        { source: "Nutzer:innen", replacement: "Mitglied" }
      ],
      ["geschützt"],
      (source) => source === "Nutzer:innen" ? "Nutzer" : source
    );
    expect(new Set(notices.map((notice) => notice.code))).toEqual(new Set([
      "no-op", "deletion", "protected", "chain", "overlap",
      "case-variant", "built-in-overlap"
    ]));
  });

  it("exportiert und importiert das versionierte JSON verlustfrei", () => {
    const document = createPersonalRulesDocument({
      protectedTerms: ["Nutzer:innen"],
      customReplacements: [
        { source: "Sonderform", replacement: "Gewünschte Form" }
      ]
    }, "2026-07-28T18:30:00.000Z");
    expect(parsePersonalRulesDocument(
      stringifyPersonalRulesDocument(document)
    )).toEqual({
      format: personalRulesFormat,
      version: personalRulesFormatVersion,
      exportedAt: "2026-07-28T18:30:00.000Z",
      protectedTerms: ["Nutzer:innen"],
      customReplacements: [
        { source: "Sonderform", replacement: "Gewünschte Form" }
      ]
    });
  });

  it("weist fremde und zukünftige Formate zurück", () => {
    const exportedAt = new Date().toISOString();
    expect(() => parsePersonalRulesDocument(JSON.stringify({
      format: "anderes-format", version: 1, exportedAt,
      protectedTerms: [], customReplacements: []
    }))).toThrow(/kein Export persönlicher Sprachverstand-Regeln/u);
    expect(() => parsePersonalRulesDocument(JSON.stringify({
      format: personalRulesFormat, version: 99, exportedAt,
      protectedTerms: [], customReplacements: []
    }))).toThrow(/wird nicht unterstützt/u);
  });

  it("führt Importe nach gewählter Konfliktstrategie zusammen", () => {
    const existing = {
      protectedTerms: ["Ausnahme"],
      customReplacements: [{ source: "A", replacement: "Alt" }]
    };
    const imported = {
      protectedTerms: ["ausnahme", "Weitere Ausnahme"],
      customReplacements: [
        { source: "A", replacement: "Neu" },
        { source: "B", replacement: "Ziel" }
      ]
    };
    const keep = mergePersonalRules(existing, imported, "keep-existing");
    expect(keep.protectedTerms).toEqual(["Ausnahme", "Weitere Ausnahme"]);
    expect(keep.customReplacements).toEqual([
      { source: "A", replacement: "Alt" },
      { source: "B", replacement: "Ziel" }
    ]);
    expect(keep.conflicts).toHaveLength(1);

    const prefer = mergePersonalRules(existing, imported, "prefer-imported");
    expect(prefer.customReplacements[0]).toEqual({
      source: "A", replacement: "Neu"
    });
    expect(prefer.replacedCustomReplacements).toBe(1);

    const replace = mergePersonalRules(existing, imported, "replace");
    expect(replace.protectedTerms).toEqual(imported.protectedTerms);
    expect(replace.customReplacements).toEqual(imported.customReplacements);
  });
});
