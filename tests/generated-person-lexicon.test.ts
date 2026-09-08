import { describe, expect, it } from "vitest";
import { generatedPersonFormCount } from "../src/rules/generated-person-lexicon";
import { mapMappedPlural } from "../src/rules/mapped-plural-separators";

const generatedPluralCases = [
  ["abenteurer", "abenteurer"],
  ["abiturient", "abiturienten"],
  ["absender", "absender"],
  ["admiral", "admirale"],
  ["afrikaner", "afrikaner"],
  ["akademiker", "akademiker"],
  ["allergiker", "allergiker"],
  ["allgemeinmediziner", "allgemeinmediziner"],
  ["alphabet", "alphabeten"],
  ["altenpfleger", "altenpfleger"],
  ["amateur", "amateure"],
  ["amerikaner", "amerikaner"],
  ["analphabet", "analphabeten"],
  ["analyst", "analysten"],
  ["angler", "angler"],
  ["angreifer", "angreifer"],
  ["anhalter", "anhalter"],
  ["anhänger", "anhänger"],
  ["anleger", "anleger"],
  ["kellner", "kellner"]
] as const;

describe("Generierter Personenwortschatz im Produktpfad", () => {
  it("enthält die erste verifizierte Produktwelle vollständig", () => {
    expect(generatedPersonFormCount).toBe(generatedPluralCases.length);

    for (const [base, plural] of generatedPluralCases) {
      expect(mapMappedPlural(base), base).toBe(plural);
    }
  });

  it("erhält die Schreibweise des erkannten Stamms", () => {
    expect(mapMappedPlural("Analyst")).toBe("Analysten");
    expect(mapMappedPlural("ANALYST")).toBe("ANALYSTEN");
  });
});
