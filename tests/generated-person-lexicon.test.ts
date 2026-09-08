import { describe, expect, it } from "vitest";
import { generatedPersonFormCount } from "../src/rules/generated-person-lexicon";
import {
  mapMappedInflectedSingularPair,
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import { mapMappedPlural } from "../src/rules/mapped-plural-separators";

const representativePluralCases = [
  ["abbrecher", "abbrecher"],
  ["abiturient", "abiturienten"],
  ["admiral", "admirale"],
  ["agitator", "agitatoren"],
  ["clown", "clowns"],
  ["brit", "briten"],
  ["gött", "götter"],
  ["hünd", "hunde"],
  ["hörer", "hörer"],
  ["sänger", "sänger"],
  ["schauspieler", "schauspieler"],
  ["texter", "texter"]
] as const;

describe("Generierter Personenwortschatz im Produktpfad", () => {
  it("enthält die vollständig verifizierte Ausbauwelle", () => {
    expect(generatedPersonFormCount).toBe(1057);

    for (const [base, plural] of representativePluralCases) {
      expect(mapMappedPlural(base), base).toBe(plural);
    }
  });

  it("erhält die Schreibweise des erkannten Stamms", () => {
    expect(mapMappedPlural("Sänger")).toBe("Sänger");
    expect(mapMappedPlural("SÄNGER")).toBe("SÄNGER");
    expect(mapMappedSingular("GÖTT", "nominative")).toBe("GOTT");
  });

  it("nutzt generierte Vollformen auch im Singular", () => {
    expect(mapMappedSingular("brit", "nominative")).toBe("brite");
    expect(mapMappedSingular("brit", "dative")).toBe("briten");
    expect(mapMappedSingular("gött", "genitive")).toBe("gottes");
  });

  it("erkennt generierte direkte Singularpaare ohne lineare Lexikonsuche", () => {
    expect(mapMappedSingularPair("Brite", "Britin")).toBe("Brite");
    expect(mapMappedSingularPair("Britin", "Brite")).toBe("Brite");
    expect(mapMappedSingularPair("Sänger", "Sängerin")).toBe("Sänger");
  });

  it("erkennt auch flektierte Singularpaare aus dem generierten Bestand", () => {
    expect(
      mapMappedInflectedSingularPair("Britin", "Briten", "dative")
    ).toBe("Briten");
    expect(
      mapMappedInflectedSingularPair("Göttin", "Gottes", "genitive")
    ).toBe("Gottes");
  });
});
