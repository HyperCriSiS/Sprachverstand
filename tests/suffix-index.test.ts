import {describe, expect, it} from "vitest";
import {createSuffixLookup} from "../src/rules/suffix-index";
import {additionalPersonPluralRule, additionalPersonSingularRule} from "../src/rules/additional-person-forms";

describe("Suffixindex", () => {
  it("bewahrt Treffer, Fehlversuche und Großschreibung nach der Verdrängung zwischengespeicherter Wortstämme", () => {
    for (const rule of [additionalPersonPluralRule, additionalPersonSingularRule]) {
      const examples = ["Nutzer:innen", "Oberbürgermeister:innen", "UnbekanntesWort:innen", "Nachtarbeiter:innen",
        "Nutzer:in", "Oberbürgermeister:in", "NUTZER:INNEN"];
      const expected = examples.map(input => rule.apply(input));
      for (let index = 0; index < 300; index++) {
        const base = "Unbelegt" + String.fromCharCode(65 + Math.floor(index / 26), 65 + index % 26) + "wort";
        expect(rule.apply(base + ":innen").text).toBe(base + ":innen");
        expect(rule.apply(base + ":in").text).toBe(base + ":in");
      }
      expect(examples.map(input => rule.apply(input))).toEqual(expected);
    }
  });
  it("behält den längsten Treffer, Gleichstandsreihenfolge und Exaktgrenzen bei", () => {
    const entries = [
      {stem: "bürgermeister", exact: true},
      {stem: "meister", exact: true},
      {stem: "meister", exact: false},
      {stem: "er", exact: false}
    ];
    const lookup = createSuffixLookup(entries, entry => entry.stem, entry => entry.exact);
    expect(lookup("bürgermeister")).toBe(entries[0]);
    expect(lookup("meister")).toBe(entries[1]);
    expect(lookup("oberbürgermeister")).toBe(entries[2]);
    expect(lookup("leser")).toBe(entries[3]);
    expect(lookup("gast")).toBeUndefined();
  });

  it("entspricht der bisherigen sortierten Suche auch für Unicode und lange Komposita", () => {
    const stems = ["arbeiter", "schichtarbeiter", "bürger", "meister", "ärzt", "in", "er", "", "𝔘ber"];
    const entries = stems.flatMap(stem => [{stem, exact: true}, {stem, exact: false}])
      .sort((left, right) => right.stem.length - left.stem.length);
    const lookup = createSuffixLookup(entries, entry => entry.stem, entry => entry.exact);
    let seed = 19;
    for (let index = 0; index < 2000; index += 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const stem = stems[seed % stems.length]!;
      const input = index % 3 === 0 ? stem : "𝔘ber".repeat(index % 30) + stem;
      expect(lookup(input)).toBe(entries.find(entry => entry.exact
        ? input === entry.stem : input.endsWith(entry.stem)));
    }
  });
});
