import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("sechsunddreißigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Anglist:innen", "Anglisten"],
    ["Amerikanist*innen", "Amerikanisten"],
    ["Arabist_innen", "Arabisten"],
    ["Audiodeskriptor:innen", "Audiodeskriptoren"],
    ["Baltist*innen", "Baltisten"],
    ["Finnougrist:innen", "Finnougristen"]
  ])("normalisiert die aktuelle BERUFENET-Form %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["anglist", "anglisten"],
    ["amerikanist", "amerikanisten"],
    ["arabist", "arabisten"],
    ["baltist", "baltisten"],
    ["finnougrist", "finnougristen"]
  ])("bildet die schwache Flexion von %s korrekt ab", (stem, oblique) => {
    expect(mapMappedSingular(stem, "nominative")).toBe(stem);
    expect(mapMappedSingular(stem, "accusative")).toBe(oblique);
    expect(mapMappedSingular(stem, "dative")).toBe(oblique);
    expect(mapMappedSingular(stem, "genitive")).toBe(oblique);
  });

  it("bildet Audiodeskriptor regulär ab", () => {
    expect(mapMappedSingular("audiodeskriptor", "nominative")).toBe("audiodeskriptor");
    expect(mapMappedSingular("audiodeskriptor", "accusative")).toBe("audiodeskriptor");
    expect(mapMappedSingular("audiodeskriptor", "genitive")).toBe("audiodeskriptors");
  });

  it.each([
    ["Anglist", "Anglistin"],
    ["Amerikanist", "Amerikanistin"],
    ["Arabist", "Arabistin"],
    ["Audiodeskriptor", "Audiodeskriptorin"],
    ["Baltist", "Baltistin"],
    ["Finnougrist", "Finnougristin"]
  ])("erkennt das Singularpaar %s/%s", (masculine, feminine) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(masculine);
  });
});
