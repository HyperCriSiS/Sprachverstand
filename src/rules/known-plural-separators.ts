import type { Rule } from "../core/rule";
import { transformGenderedPlural } from "./gendered-plural";
import type { GrammaticalCase } from "./person-lexicon";

/*
 * Nur Endungen, deren maskuline Pluralform unverändert bleibt. Das Lexikon
 * verhindert Verstümmelungen wie "Ärzt:innen" -> "Ärzt" oder
 * "Student:innen" -> "Student".
 */
const safePluralSuffixes = [
  "anfänger",
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
  "gegner",
  "gewinner",
  "gründer",
  "handwerker",
  "händler",
  "helfer",
  "hersteller",
  "inhaber",
  "käufer",
  "künstler",
  "lehrer",
  "leser",
  "makler",
  "meister",
  "mieter",
  "mitarbeiter",
  "nutzer",
  "partner",
  "pförtner",
  "politiker",
  "redner",
  "richter",
  "rentner",
  "schüler",
  "spender",
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
  "zuhörer",
  "zuschauer"
] as const;

function isKnownBase(base: string): boolean {
  const normalizedBase = base.toLocaleLowerCase("de-DE");
  return safePluralSuffixes.some((suffix) => normalizedBase.endsWith(suffix));
}

export function mapKnownPlural(base: string): string | undefined {
  return isKnownBase(base) ? base : undefined;
}

export function mapKnownSingular(
  base: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  if (!isKnownBase(base)) {
    return undefined;
  }

  if (grammaticalCase !== "genitive") {
    return base;
  }

  const lowerBase = base.toLocaleLowerCase("de-DE");
  const upperBase = base.toLocaleUpperCase("de-DE");
  const suffix = base === upperBase && base !== lowerBase ? "S" : "s";
  return base + suffix;
}

export function mapKnownSingularPair(
  left: string,
  right: string
): string | undefined {
  const normalizedLeft = left.toLocaleLowerCase("de-DE");
  const normalizedRight = right.toLocaleLowerCase("de-DE");

  if (isKnownBase(left) && normalizedRight === `${normalizedLeft}in`) {
    return left;
  }

  if (isKnownBase(right) && normalizedLeft === `${normalizedRight}in`) {
    return right;
  }

  return undefined;
}

export const knownPluralSeparatorsRule: Rule = {
  id: "plural.known-separator-innen",
  risk: "safe",

  apply(input) {
    return transformGenderedPlural(input, mapKnownPlural);
  }
};
