import type { Rule } from "../core/rule";
import { transformGenderedPlural } from "./gendered-plural";

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

export function mapKnownPlural(base: string): string | undefined {
  const normalizedBase = base.toLocaleLowerCase("de-DE");
  return safePluralSuffixes.some((suffix) => normalizedBase.endsWith(suffix))
    ? base
    : undefined;
}

export const knownPluralSeparatorsRule: Rule = {
  id: "plural.known-separator-innen",
  risk: "safe",

  apply(input) {
    return transformGenderedPlural(input, mapKnownPlural);
  }
};
