import type { Rule } from "../core/rule";
import { transformGenderedPlural } from "./gendered-plural";

type MatchMode = "exact" | "suffix";

interface PluralMapping {
  readonly stem: string;
  readonly plural: string;
  readonly match?: MatchMode;
}

const locale = "de-DE";

const pluralMappings: readonly PluralMapping[] = [
  { stem: "interessent", plural: "interessenten" },
  { stem: "hochschulabsolvent", plural: "hochschulabsolventen" },
  { stem: "absolvent", plural: "absolventen" },
  { stem: "doktorand", plural: "doktoranden" },
  { stem: "praktikant", plural: "praktikanten" },
  { stem: "präsident", plural: "präsidenten" },
  { stem: "lieferant", plural: "lieferanten" },
  { stem: "moderator", plural: "moderatoren" },
  { stem: "redakteur", plural: "redakteure" },
  { stem: "journalist", plural: "journalisten" },
  { stem: "architekt", plural: "architekten" },
  { stem: "ingenieur", plural: "ingenieure" },
  { stem: "professor", plural: "professoren" },
  { stem: "direktor", plural: "direktoren" },
  { stem: "funktionär", plural: "funktionäre" },
  { stem: "aktionär", plural: "aktionäre" },
  { stem: "sekretär", plural: "sekretäre" },
  { stem: "astronaut", plural: "astronauten" },
  { stem: "polizist", plural: "polizisten" },
  { stem: "tourist", plural: "touristen" },
  { stem: "migrant", plural: "migranten" },
  { stem: "mandant", plural: "mandanten" },
  { stem: "kandidat", plural: "kandidaten" },
  { stem: "diplomat", plural: "diplomaten" },
  { stem: "demokrat", plural: "demokraten" },
  { stem: "student", plural: "studenten" },
  { stem: "patient", plural: "patienten" },
  { stem: "experte", plural: "experten" },
  { stem: "expert", plural: "experten" },
  { stem: "soldat", plural: "soldaten" },
  { stem: "athlet", plural: "athleten" },
  { stem: "jurist", plural: "juristen" },
  { stem: "friseur", plural: "friseure" },
  { stem: "akteur", plural: "akteure" },
  { stem: "rektor", plural: "rektoren" },
  { stem: "pilot", plural: "piloten" },
  { stem: "kolleg", plural: "kollegen" },
  { stem: "autor", plural: "autoren" },
  { stem: "kund", plural: "kunden" },
  { stem: "ärzt", plural: "ärzte" },
  { stem: "bauer", plural: "bauern", match: "exact" as const }
].sort((left, right) => right.stem.length - left.stem.length);

function applyCase(source: string, replacement: string): string {
  const lowerSource = source.toLocaleLowerCase(locale);
  const upperSource = source.toLocaleUpperCase(locale);

  if (source === upperSource && source !== lowerSource) {
    return replacement.toLocaleUpperCase(locale);
  }

  const sourceCharacters = [...source];
  const firstSourceCharacter = sourceCharacters[0];
  const remainingSource = sourceCharacters.slice(1).join("");

  if (
    firstSourceCharacter &&
    firstSourceCharacter === firstSourceCharacter.toLocaleUpperCase(locale) &&
    remainingSource === remainingSource.toLocaleLowerCase(locale)
  ) {
    const replacementCharacters = [...replacement];
    const firstReplacementCharacter = replacementCharacters.shift();

    return firstReplacementCharacter
      ? firstReplacementCharacter.toLocaleUpperCase(locale) +
          replacementCharacters.join("")
      : replacement;
  }

  return replacement.toLocaleLowerCase(locale);
}

function mapPlural(base: string): string | undefined {
  const normalizedBase = base.toLocaleLowerCase(locale);

  for (const mapping of pluralMappings) {
    const matches =
      mapping.match === "exact"
        ? normalizedBase === mapping.stem
        : normalizedBase.endsWith(mapping.stem);

    if (!matches) {
      continue;
    }

    const sourceSuffix = base.slice(-mapping.stem.length);
    const prefix = base.slice(0, -mapping.stem.length);
    return prefix + applyCase(sourceSuffix, mapping.plural);
  }

  return undefined;
}

export const mappedPluralSeparatorsRule: Rule = {
  id: "plural.mapped-separator-innen",
  risk: "safe",

  apply(input) {
    return transformGenderedPlural(input, mapPlural);
  }
};
