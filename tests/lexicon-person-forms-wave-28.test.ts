import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingular } from "../src/rules/person-lexicon";

describe("achtundzwanzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Marshaller:innen", "Marshaller"],
    ["Mauretanier:innen", "Mauretanier"],
    ["Mauritier:innen", "Mauritier"],
    ["Mexikaner:innen", "Mexikaner"],
    ["Mikronesier:innen", "Mikronesier"],
    ["Moldauer:innen", "Moldauer"],
    ["Mosambikaner:innen", "Mosambikaner"],
    ["Namibier:innen", "Namibier"],
    ["Neuseeländer:innen", "Neuseeländer"],
    ["Nicaraguaner:innen", "Nicaraguaner"],
    ["Niederländer:innen", "Niederländer"],
    ["Nigerer:innen", "Nigerer"],
    ["Nigerianer:innen", "Nigerianer"],
    ["Niueaner:innen", "Niueaner"],
    ["Norweger:innen", "Norweger"],
    ["Omaner:innen", "Omaner"],
    ["Österreicher:innen", "Österreicher"],
    ["Palauer:innen", "Palauer"],
    ["Panamaer:innen", "Panamaer"],
    ["Papua-Neuguineer:innen", "Papua-Neuguineer"],
    ["Paraguayer:innen", "Paraguayer"],
    ["Peruaner:innen", "Peruaner"],
    ["Ruander:innen", "Ruander"],
    ["Salomoner:innen", "Salomoner"],
    ["Sambier:innen", "Sambier"],
    ["Samoaner:innen", "Samoaner"],
    ["Saudi-Araber:innen", "Saudi-Araber"],
    ["Seycheller:innen", "Seycheller"],
    ["Sierra-Leoner:innen", "Sierra-Leoner"],
    ["Simbabwer:innen", "Simbabwer"],
    ["Singapurer:innen", "Singapurer"],
    ["Somalier:innen", "Somalier"],
    ["Papua-Neuguineer*innen", "Papua-Neuguineer"],
    ["Saudi-Araber_innen", "Saudi-Araber"]
  ])("deckt eine amtlich bestimmte Personenform ab: %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["marshaller", "marshallers"],
    ["mauretanier", "mauretaniers"],
    ["mauritier", "mauritiers"],
    ["mexikaner", "mexikaners"],
    ["mikronesier", "mikronesiers"],
    ["moldauer", "moldauers"],
    ["mosambikaner", "mosambikaners"],
    ["namibier", "namibiers"],
    ["neuseeländer", "neuseeländers"],
    ["nicaraguaner", "nicaraguaners"],
    ["niederländer", "niederländers"],
    ["nigerer", "nigerers"],
    ["nigerianer", "nigerianers"],
    ["niueaner", "niueaners"],
    ["norweger", "norwegers"],
    ["omaner", "omaners"],
    ["österreicher", "österreichers"],
    ["palauer", "palauers"],
    ["panamaer", "panamaers"],
    ["papua-neuguineer", "papua-neuguineers"],
    ["paraguayer", "paraguayers"],
    ["peruaner", "peruaners"],
    ["ruander", "ruanders"],
    ["salomoner", "salomoners"],
    ["sambier", "sambiers"],
    ["samoaner", "samoaners"],
    ["saudi-araber", "saudi-arabers"],
    ["seycheller", "seychellers"],
    ["sierra-leoner", "sierra-leoners"],
    ["simbabwer", "simbabwers"],
    ["singapurer", "singapurers"],
    ["somalier", "somaliers"]
  ] as const)("stellt den Genitiv bereit: %s", (base, expected) => {
    expect(mapMappedSingular(base, "genitive")).toBe(expected);
  });
});
