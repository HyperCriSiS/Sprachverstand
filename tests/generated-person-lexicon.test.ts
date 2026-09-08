import { describe, expect, it } from "vitest";
import {
  generatedPersonFormCount,
  getGeneratedPersonForms
} from "../src/rules/generated-person-lexicon";
import {
  mapMappedInflectedSingularPair,
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import { mapMappedPlural } from "../src/rules/mapped-plural-separators";

const representativePluralCases = [
  ["abenteurer", "abenteurer"],
  ["abiturient", "abiturienten"],
  ["admiral", "admirale"],
  ["clown", "clowns"],
  ["brit", "briten"],
  ["hörer", "hörer"],
  ["psychiater", "psychiater"],
  ["sänger", "sänger"],
  ["schauspieler", "schauspieler"],
  ["texter", "texter"]
] as const;

// Dieser Produktvertrag wird bewusst mit main synchron gehalten, damit Pale Moon
// denselben konservativ freigegebenen Personenwortschatz wie die modernen Builds nutzt.
describe("Generierter Personenwortschatz im Produktpfad", () => {
  it("enthält ausschließlich die konservativ freigegebene Ausbauwelle", () => {
    expect(generatedPersonFormCount).toBe(1029);

    for (const [base, plural] of representativePluralCases) {
      expect(mapMappedPlural(base), base).toBe(plural);
    }
  });

  it("schließt bekannte Scheintreffer aus dem generierten Bestand aus", () => {
    for (const base of ["alphabet", "oktober", "torwärt", "wolf", "hünd"]) {
      expect(getGeneratedPersonForms(base), base).toBeUndefined();
    }
  });

  it("erhält die Schreibweise des erkannten Stamms", () => {
    expect(mapMappedPlural("Sänger")).toBe("Sänger");
    expect(mapMappedPlural("SÄNGER")).toBe("SÄNGER");
    expect(mapMappedPlural("PSYCHIATER")).toBe("PSYCHIATER");
  });

  it("nutzt generierte Vollformen auch im Singular", () => {
    expect(mapMappedSingular("brit", "nominative")).toBe("brite");
    expect(mapMappedSingular("brit", "dative")).toBe("briten");
    expect(mapMappedSingular("analphabet", "genitive")).toBe("analphabeten");
  });

  it("erkennt generierte direkte Singularpaare ohne lineare Lexikonsuche", () => {
    expect(mapMappedSingularPair("Brite", "Britin")).toBe("Brite");
    expect(mapMappedSingularPair("Britin", "Brite")).toBe("Brite");
    expect(mapMappedSingularPair("Sänger", "Sängerin")).toBe("Sänger");
    expect(mapMappedSingularPair("Psychiater", "Psychiaterin")).toBe(
      "Psychiater"
    );
  });

  it("erkennt auch flektierte Singularpaare aus dem generierten Bestand", () => {
    expect(
      mapMappedInflectedSingularPair("Britin", "Briten", "dative")
    ).toBe("Briten");
    expect(
      mapMappedInflectedSingularPair(
        "Analphabetin",
        "Analphabeten",
        "genitive"
      )
    ).toBe("Analphabeten");
  });
});
