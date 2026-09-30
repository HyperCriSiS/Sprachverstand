import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import { mapMappedSingularPair } from "../src/rules/person-lexicon";

describe("Bindestrich-Großschreibung in Welle 58", () => {
  // Jedes Bindestrichsegment behält seine eigene Groß-/Kleinschreibung.
  it.each([
    ["Kfz-Schlosser:innen", "Kfz-Schlosser"],
    ["Lkw-Schlosser:innen", "Lkw-Schlosser"],
    ["Pkw-Schlosser:innen", "Pkw-Schlosser"],
    ["Rating-Analyst:innen", "Rating-Analysten"]
  ])("erhält die Segmentgroßschreibung für %s", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it.each([
    ["Kfz-Schlosser", "Kfz-Schlosserin"],
    ["Rating-Analyst", "Rating-Analystin"]
  ])("erkennt korrekt geschriebenes Bindestrichpaar %s/%s", (masculine, feminine) => {
    expect(mapMappedSingularPair(masculine, feminine)).toBe(masculine);
  });
});
