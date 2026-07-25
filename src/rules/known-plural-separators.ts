import type { Rule } from "../core/rule";

const genderedPluralPattern =
  /(?<![\p{L}\p{M}])([\p{L}\p{M}’'-]+)(?:[:*_/·•])innen(?![\p{L}\p{M}])/giu;

/*
 * Nur Endungen, deren maskuline Pluralform unverändert bleibt. Das Lexikon
 * verhindert Verstümmelungen wie "Ärzt:innen" -> "Ärzt" oder
 * "Student:innen" -> "Student".
 */
const safePluralSuffixes = [
  "anbieter",
  "anwender",
  "arbeitgeber",
  "arbeitnehmer",
  "auftraggeber",
  "ausbilder",
  "benutzer",
  "besitzer",
  "besucher",
  "betreuer",
  "bewerber",
  "bewohner",
  "bürger",
  "darsteller",
  "entwickler",
  "eigentümer",
  "empfänger",
  "erfinder",
  "erzieher",
  "fahrer",
  "forscher",
  "förderer",
  "geber",
  "gewinner",
  "gründer",
  "händler",
  "helfer",
  "hersteller",
  "inhaber",
  "käufer",
  "künstler",
  "lehrer",
  "leser",
  "mieter",
  "mitarbeiter",
  "nutzer",
  "partner",
  "politiker",
  "redner",
  "richter",
  "rentner",
  "schüler",
  "sprecher",
  "teilnehmer",
  "trainer",
  "unternehmer",
  "veranstalter",
  "verbraucher",
  "vermieter",
  "verkäufer",
  "vertreter",
  "wähler",
  "zuschauer"
] as const;

function hasSafePluralSuffix(word: string): boolean {
  const normalizedWord = word.toLocaleLowerCase("de-DE");
  return safePluralSuffixes.some((suffix) => normalizedWord.endsWith(suffix));
}

export const knownPluralSeparatorsRule: Rule = {
  id: "plural.known-separator-innen",
  risk: "safe",

  apply(input) {
    let replacements = 0;

    const text = input.replace(
      genderedPluralPattern,
      (match: string, masculinePlural: string) => {
        if (!hasSafePluralSuffix(masculinePlural)) {
          return match;
        }

        replacements += 1;
        return masculinePlural;
      }
    );

    return { text, replacements };
  }
};
