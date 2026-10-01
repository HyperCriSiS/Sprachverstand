import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave70,
  reviewedPersonFormCountWave70
} from "../src/rules/reviewed-person-forms-wave-70";

describe("siebzigste Lexikon-Ausbauwelle", () => {
  it("enthält genau den intern geprüften Exaktbestand", () => {
    expect(reviewedPersonFormCountWave70).toBe(8);

    for (const base of [
      "bohrer",
      "presser",
      "stanzer",
      "walzer",
      "wickler",
      "sortierer",
      "mischer",
      "kopierer",
      "computervisualist",
      "eri-wart",
      "eutonist",
      "fennist",
      "mindermaschinenstricker",
      "modellist",
      "tapisserist",
      "verschmelzer",
      "wäscher"
    ]) {
      expect(getReviewedPersonFormsWave70(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Branntweinbrenner:innen", "Branntweinbrenner"],
    ["Likörbrenner:innen", "Likörbrenner"],
    ["Schnapsbrenner:innen", "Schnapsbrenner"],
    ["Silberschläger:innen", "Silberschläger"],
    ["Strichätzer:innen", "Strichätzer"],
    ["Zementbrenner:innen", "Zementbrenner"],
    ["Ziegelbrenner:innen", "Ziegelbrenner"],
    ["Zigarrenroller:innen", "Zigarrenroller"]
  ])("ersetzt den geprüften Plural %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Branntweinbrenner", "Branntweinbrennerin", "Branntweinbrenner"],
    ["Likörbrenner", "Likörbrennerin", "Likörbrenner"],
    ["Schnapsbrenner", "Schnapsbrennerin", "Schnapsbrenner"],
    ["Silberschläger", "Silberschlägerin", "Silberschläger"],
    ["Strichätzer", "Strichätzerin", "Strichätzer"],
    ["Zementbrenner", "Zementbrennerin", "Zementbrenner"],
    ["Ziegelbrenner", "Ziegelbrennerin", "Ziegelbrenner"],
    ["Zigarrenroller", "Zigarrenrollerin", "Zigarrenroller"]
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["branntweinbrenner", "nominative", "branntweinbrenner"],
    ["branntweinbrenner", "genitive", "branntweinbrenners"],
    ["likörbrenner", "nominative", "likörbrenner"],
    ["likörbrenner", "genitive", "likörbrenners"],
    ["schnapsbrenner", "nominative", "schnapsbrenner"],
    ["schnapsbrenner", "genitive", "schnapsbrenners"],
    ["silberschläger", "nominative", "silberschläger"],
    ["silberschläger", "genitive", "silberschlägers"],
    ["strichätzer", "nominative", "strichätzer"],
    ["strichätzer", "genitive", "strichätzers"],
    ["zementbrenner", "nominative", "zementbrenner"],
    ["zementbrenner", "genitive", "zementbrenners"],
    ["ziegelbrenner", "nominative", "ziegelbrenner"],
    ["ziegelbrenner", "genitive", "ziegelbrenners"],
    ["zigarrenroller", "nominative", "zigarrenroller"],
    ["zigarrenroller", "genitive", "zigarrenrollers"]
  ] as const)(
    "bildet die Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
