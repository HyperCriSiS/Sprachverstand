import { describe, expect, it } from "vitest";
import { transformGenderedPlural } from "../../src/rules/gendered-plural";

const mapBase = (base: string): string | undefined =>
  base.toLowerCase() === "nutzer" ? "Nutzer" : undefined;

describe("Audit LANG-09: Plural-Kontext ohne Präfixquadratik", () => {
  it("schützt explizite gemischte Artikelpaare auch mit längeren Abständen", () => {
    for (const input of [
      "der:die Nutzer:innen bleiben",
      "der:die     Nutzer:innen bleiben",
      "Die:der\tNutzer:innen bleiben",
      "Vorher die:der \n Nutzer:innen bleiben",
      "der:die die:der Nutzer:innen bleiben"
    ]) {
      expect(transformGenderedPlural(input, mapBase).text).toBe(input);
    }
  });

  it("normalisiert gewöhnliche Marker unabhängig von vorangestellten Wörtern", () => {
    expect(transformGenderedPlural(
      "Die Nutzer:innen treffen weitere Nutzer:innen.",
      mapBase
    ).text).toBe("Die Nutzer treffen weitere Nutzer.");
  });

  it("verarbeitet einen langen Einzelstring ohne wiederholte Präfixscans", () => {
    const input = "Nutzer:innen arbeiten gemeinsam. ".repeat(31_250);
    const result = transformGenderedPlural(input, mapBase);
    expect(result.replacements).toBe(31_250);
    expect(result.text).not.toContain("Nutzer:innen");
  }, 3_000);

  it("scannt auch bei erfolglosen Mappern nicht jeden vorherigen Text erneut", () => {
    const input = "Nutzer:innen arbeiten gemeinsam. ".repeat(31_250);
    const result = transformGenderedPlural(input, () => undefined);
    expect(result.replacements).toBe(0);
    expect(result.text).toBe(input);
  }, 3_000);
});
