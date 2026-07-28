import type { Rule } from "../core/rule";
import { transformGenderedPlural } from "./gendered-plural";
import type { GrammaticalCase } from "./person-lexicon";

/*
 * Nur Endungen, deren maskuline Pluralform unverändert bleibt. Das Lexikon
 * verhindert Verstümmelungen wie "Ärzt:innen" -> "Ärzt" oder
 * "Student:innen" -> "Student".
 */
const safePluralSuffixes = [
  "abnehmer",
  "anfänger",
  "anbieter",
  "anleiter",
  "anwender",
  "anwohner",
  "apotheker",
  "arbeitgeber",
  "arbeitnehmer",
  "arbeiter",
  "auftraggeber",
  "ausbilder",
  "aussteller",
  "bäcker",
  "beobachter",
  "berater",
  "benutzer",
  "besitzer",
  "besteller",
  "besucher",
  "betreiber",
  "betreuer",
  "bewerber",
  "bewerter",
  "bewohner",
  "blogger",
  "buchhalter",
  "bürger",
  "darsteller",
  "dienstleister",
  "dolmetscher",
  "entwickler",
  "eigentümer",
  "empfänger",
  "erfinder",
  "erzieher",
  "facharbeiter",
  "fahrer",
  "förderer",
  "forscher",
  "führer",
  "gastgeber",
  "geber",
  "gegner",
  "geschäftsführer",
  "gesetzgeber",
  "gewinner",
  "gründer",
  "handwerker",
  "händler",
  "hausmeister",
  "helfer",
  "herausgeber",
  "hersteller",
  "inhaber",
  "informatiker",
  "interviewer",
  "jäger",
  "käufer",
  "künstler",
  "lehrer",
  "leiter",
  "leser",
  "makler",
  "manager",
  "mathematiker",
  "mechaniker",
  "meister",
  "mieter",
  "mitarbeiter",
  "musiker",
  "nutzer",
  "partner",
  "pfarrer",
  "pförtner",
  "physiker",
  "politiker",
  "programmierer",
  "prüfer",
  "redner",
  "richter",
  "rentner",
  "sachbearbeiter",
  "sanitäter",
  "schiedsrichter",
  "schüler",
  "schriftsteller",
  "spender",
  "sprecher",
  "steuerzahler",
  "teilnehmer",
  "trainer",
  "unternehmer",
  "unterstützer",
  "veranstalter",
  "verbraucher",
  "verfasser",
  "vermieter",
  "verkäufer",
  "versicherungsnehmer",
  "verwalter",
  "vertreter",
  "wähler",
  "wanderer",
  "wissenschaftler",
  "zimmerer",
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

export function mapKnownInflectedSingularPair(
  left: string,
  right: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  const candidates: readonly [string, string][] = [
    [left, right],
    [right, left]
  ];

  for (const [feminine, masculine] of candidates) {
    const normalizedFeminine = feminine.toLocaleLowerCase("de-DE");
    if (!normalizedFeminine.endsWith("in")) {
      continue;
    }

    const feminineBase = feminine.slice(0, -2);
    if (!isKnownBase(feminineBase)) {
      continue;
    }

    const expected = mapKnownSingular(feminineBase, grammaticalCase);
    if (
      expected &&
      expected.toLocaleLowerCase("de-DE") ===
        masculine.toLocaleLowerCase("de-DE")
    ) {
      return masculine;
    }
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
