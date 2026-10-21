import { describe, expect, it } from "vitest";
import { insertFragments, parseFragment, readFragments } from "../scripts/changelog-fragments.mjs";

const changelog = `# Changelog

## Unveröffentlicht

### Hinzugefügt

- Bestehender Eintrag.

### Behoben

- Älterer Fix.

## 0.6.6 (2026-08-02)

### Behoben

- Veröffentlicht.
`;

describe("Changelog-Fragmente", () => {
  it("liest Kategorie und Eintrag", () => {
    expect(parseFragment("neuer-fix.md", "kategorie: Behoben\n\n- Neuer Fix.\n"))
      .toEqual({ name: "neuer-fix.md", category: "Behoben", body: "- Neuer Fix." });
  });

  it.each([
    ["Neuer Fix.md", "kategorie: Behoben\n\n- Text"],
    ["fix.md", "Behoben\n\n- Text"],
    ["fix.md", "kategorie: Repariert\n\n- Text"],
    ["fix.md", "kategorie: Behoben\n\nText ohne Spiegelstrich"]
  ])("lehnt %s ab", (name, text) => expect(() => parseFragment(name, text)).toThrow());

  it("fügt oben in die passende Kategorie ein, nur unter „Unveröffentlicht“", () => {
    const result = insertFragments(changelog, [
      { name: "a.md", category: "Behoben", body: "- Neuer Fix." },
      { name: "b.md", category: "Behoben", body: "- Zweiter Fix." }
    ]);
    expect(result).toContain("### Behoben\n\n- Neuer Fix.\n- Zweiter Fix.\n- Älterer Fix.");
    expect(result).toContain("## 0.6.6 (2026-08-02)\n\n### Behoben\n\n- Veröffentlicht.");
  });

  it("legt fehlende Kategorien in der festen Reihenfolge an", () => {
    const result = insertFragments(changelog, [
      { name: "l.md", category: "Leistung", body: "- Schneller." },
      { name: "t.md", category: "Tests", body: "- Neuer Test." }
    ]);
    const unreleased = result.slice(0, result.indexOf("## 0.6.6"));
    expect(unreleased.indexOf("### Hinzugefügt")).toBeLessThan(unreleased.indexOf("### Leistung"));
    expect(unreleased.indexOf("### Leistung")).toBeLessThan(unreleased.indexOf("### Behoben"));
    expect(unreleased.indexOf("### Behoben")).toBeLessThan(unreleased.indexOf("### Tests"));
    expect(unreleased).toContain("### Tests\n\n- Neuer Test.");
  });

  it("hält die Fragmente im Repository gültig", async () => {
    await expect(readFragments("changes/unreleased")).resolves.toBeInstanceOf(Array);
  });
});
