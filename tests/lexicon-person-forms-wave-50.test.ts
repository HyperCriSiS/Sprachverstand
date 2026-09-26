import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";

describe("fünfzigste konservative Lexikon-Ausbauwelle", () => {
  it.each([
    ["Heilgehilf:innen", "Heilgehilfen"],
    ["Kosmetolog*innen", "Kosmetologen"],
    ["Motopäd_innen", "Motopäden"],
    ["Pantomim:innen", "Pantomimen"],
    ["Parfumeur:innen", "Parfumeure"],
    ["Planetolog:innen", "Planetologen"],
    ["Röntgenolog:innen", "Röntgenologen"],
    ["Sedimentolog:innen", "Sedimentologen"],
    ["Tibetolog:innen", "Tibetologen"],
    ["Ökotropholog:innen", "Ökotrophologen"]
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["heilgehilf", "genitive", "heilgehilfen"],
    ["kosmetolog", "dative", "kosmetologen"],
    ["motopäd", "accusative", "motopäden"],
    ["pantomim", "genitive", "pantomimen"],
    ["parfumeur", "genitive", "parfumeurs"],
    ["planetolog", "dative", "planetologen"],
    ["röntgenolog", "accusative", "röntgenologen"],
    ["sedimentolog", "genitive", "sedimentologen"],
    ["tibetolog", "dative", "tibetologen"],
    ["ökotropholog", "accusative", "ökotrophologen"]
  ] as const)("bildet %s im Kasus %s korrekt ab", (base, grammaticalCase, expected) => {
    expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
  });

  it.each([
    ["Heilgehilfe", "Heilgehilfin", "Heilgehilfe"],
    ["Kosmetologe", "Kosmetologin", "Kosmetologe"],
    ["Motopäde", "Motopädin", "Motopäde"],
    ["Pantomime", "Pantomimin", "Pantomime"],
    ["Parfumeur", "Parfumeurin", "Parfumeur"],
    ["Planetologe", "Planetologin", "Planetologe"],
    ["Röntgenologe", "Röntgenologin", "Röntgenologe"],
    ["Sedimentologe", "Sedimentologin", "Sedimentologe"],
    ["Tibetologe", "Tibetologin", "Tibetologe"],
    ["Ökotrophologe", "Ökotrophologin", "Ökotrophologe"]
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  });
});
