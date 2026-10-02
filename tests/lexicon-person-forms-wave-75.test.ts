import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave75,
  reviewedPersonFormCountWave75
} from "../src/rules/reviewed-person-forms-wave-75";

describe("fünfundsiebzigste Lexikon-Ausbauwelle", () => {
  it("enthält alle 51 intern geprüften Exaktmappings vollständig", () => {
    expect(reviewedPersonFormCountWave75).toBe(51);

    for (const [base, plural, oblique, genitive] of [
    ["betonbohrer", "betonbohrer", "betonbohrer", "betonbohrers"],
    ["bohrer", "bohrer", "bohrer", "bohrers"],
    ["brecher", "brecher", "brecher", "brechers"],
    ["brenner", "brenner", "brenner", "brenners"],
    ["cnc-bohrer", "cnc-bohrer", "cnc-bohrer", "cnc-bohrers"],
    ["devisenrechner", "devisenrechner", "devisenrechner", "devisenrechners"],
    ["fiaker", "fiaker", "fiaker", "fiakers"],
    ["gefriertrockner", "gefriertrockner", "gefriertrockner", "gefriertrockners"],
    ["gegenhalter", "gegenhalter", "gegenhalter", "gegenhalters"],
    ["geldzähler", "geldzähler", "geldzähler", "geldzählers"],
    ["geschirrspüler", "geschirrspüler", "geschirrspüler", "geschirrspülers"],
    ["getränkemixer", "getränkemixer", "getränkemixer", "getränkemixers"],
    ["griller", "griller", "griller", "grillers"],
    ["handbohrer", "handbohrer", "handbohrer", "handbohrers"],
    ["holztrockner", "holztrockner", "holztrockner", "holztrockners"],
    ["kabelbinder", "kabelbinder", "kabelbinder", "kabelbinders"],
    ["kernbohrer", "kernbohrer", "kernbohrer", "kernbohrers"],
    ["kopierer", "kopierer", "kopierer", "kopierers"],
    ["lader", "lader", "lader", "laders"],
    ["lastverteiler", "lastverteiler", "lastverteiler", "lastverteilers"],
    ["mindermaschinenstricker", "mindermaschinenstricker", "mindermaschinenstricker", "mindermaschinenstrickers"],
    ["mischer", "mischer", "mischer", "mischers"],
    ["mixer", "mixer", "mixer", "mixers"],
    ["nehmer", "nehmer", "nehmer", "nehmers"],
    ["pfahlrammer", "pfahlrammer", "pfahlrammer", "pfahlrammers"],
    ["pflasterrammer", "pflasterrammer", "pflasterrammer", "pflasterrammers"],
    ["planierer", "planierer", "planierer", "planierers"],
    ["rammer", "rammer", "rammer", "rammers"],
    ["reiber", "reiber", "reiber", "reibers"],
    ["roller", "roller", "roller", "rollers"],
    ["röster", "röster", "röster", "rösters"],
    ["schaber", "schaber", "schaber", "schabers"],
    ["schlacker", "schlacker", "schlacker", "schlackers"],
    ["sortierer", "sortierer", "sortierer", "sortierers"],
    ["spalter", "spalter", "spalter", "spalters"],
    ["spüler", "spüler", "spüler", "spülers"],
    ["stanzer", "stanzer", "stanzer", "stanzers"],
    ["steinbohrer", "steinbohrer", "steinbohrer", "steinbohrers"],
    ["stoßer", "stoßer", "stoßer", "stoßers"],
    ["tapetenkleber", "tapetenkleber", "tapetenkleber", "tapetenklebers"],
    ["verschmelzer", "verschmelzer", "verschmelzer", "verschmelzers"],
    ["vervielfältiger", "vervielfältiger", "vervielfältiger", "vervielfältigers"],
    ["walker", "walker", "walker", "walkers"],
    ["walzer", "walzer", "walzer", "walzers"],
    ["wickler", "wickler", "wickler", "wicklers"],
    ["wäscher", "wäscher", "wäscher", "wäschers"],
    ["zieher", "zieher", "zieher", "ziehers"],
    ["zwicker", "zwicker", "zwicker", "zwickers"],
    ["computervisualist", "computervisualisten", "computervisualisten", "computervisualisten"],
    ["modellist", "modellisten", "modellisten", "modellisten"],
    ["tapisserist", "tapisseristen", "tapisseristen", "tapisseristen"]
    ] as const) {
      expect(getReviewedPersonFormsWave75(base), base).toEqual({
        plural,
        singular: base,
        feminineSingular: `${base}in`,
        obliqueSingular: oblique,
        genitiveSingular: genitive
      });
    }
  });

  it("lässt verworfene und offene Restformen weiterhin außerhalb der Welle", () => {
    for (const base of [
      "commercialmanger",
      "euromaster",
      "geschirrviz",
      "ingenier",
      "liegerviz",
      "oralchirug",
      "reiher",
      "eri-wart",
      "eutonist",
      "fennist",
      "monitor",
      "printer",
      "vermessinger",
      "xerograf"
    ]) {
      expect(getReviewedPersonFormsWave75(base), base).toBeUndefined();
    }
  });

  it.each([
    ["Betonbohrer:innen", "Betonbohrer"],
    ["Computervisualist:innen", "Computervisualisten"],
    ["Fiaker:innen", "Fiaker"],
    ["Geschirrspüler:innen", "Geschirrspüler"],
    ["Modellist:innen", "Modellisten"],
    ["Tapisserist:innen", "Tapisseristen"],
    ["Walker:innen", "Walker"],
    ["Wickler:innen", "Wickler"],
    ["Wäscher:innen", "Wäscher"],
    ["Zwicker:innen", "Zwicker"]
  ])("ersetzt repräsentative geprüfte Plurale %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Betonbohrer", "Betonbohrerin", "Betonbohrer"],
    ["Computervisualist", "Computervisualistin", "Computervisualist"],
    ["Fiaker", "Fiakerin", "Fiaker"],
    ["Modellist", "Modellistin", "Modellist"],
    ["Tapisserist", "Tapisseristin", "Tapisserist"],
    ["Walker", "Walkerin", "Walker"],
    ["Wickler", "Wicklerin", "Wickler"],
    ["Wäscher", "Wäscherin", "Wäscher"]
  ])("erkennt repräsentative geprüfte Paare %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });

  it.each([
    ["betonbohrer", "nominative", "betonbohrer"],
    ["betonbohrer", "genitive", "betonbohrers"],
    ["computervisualist", "nominative", "computervisualist"],
    ["computervisualist", "genitive", "computervisualisten"],
    ["modellist", "nominative", "modellist"],
    ["modellist", "genitive", "modellisten"],
    ["tapisserist", "nominative", "tapisserist"],
    ["tapisserist", "genitive", "tapisseristen"],
    ["walker", "nominative", "walker"],
    ["walker", "genitive", "walkers"],
    ["wickler", "nominative", "wickler"],
    ["wickler", "genitive", "wicklers"]
  ] as const)(
    "bildet repräsentative Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }
  );
});
