export type GrammaticalCase = "nominative" | "accusative" | "dative";

type MatchMode = "exact" | "suffix";

interface PersonForms {
  readonly stem: string;
  readonly plural: string;
  readonly singular?: string;
  readonly obliqueSingular?: string;
  readonly match?: MatchMode;
}

const locale = "de-DE";

const personForms: readonly PersonForms[] = [
  { stem: "hochschulabsolvent", singular: "hochschulabsolvent", obliqueSingular: "hochschulabsolventen", plural: "hochschulabsolventen" },
  { stem: "interessent", singular: "interessent", obliqueSingular: "interessenten", plural: "interessenten" },
  { stem: "absolvent", singular: "absolvent", obliqueSingular: "absolventen", plural: "absolventen" },
  { stem: "doktorand", singular: "doktorand", obliqueSingular: "doktoranden", plural: "doktoranden" },
  { stem: "praktikant", singular: "praktikant", obliqueSingular: "praktikanten", plural: "praktikanten" },
  { stem: "präsident", singular: "präsident", obliqueSingular: "präsidenten", plural: "präsidenten" },
  { stem: "lieferant", singular: "lieferant", obliqueSingular: "lieferanten", plural: "lieferanten" },
  { stem: "moderator", singular: "moderator", plural: "moderatoren" },
  { stem: "redakteur", singular: "redakteur", plural: "redakteure" },
  { stem: "journalist", singular: "journalist", obliqueSingular: "journalisten", plural: "journalisten" },
  { stem: "architekt", singular: "architekt", obliqueSingular: "architekten", plural: "architekten" },
  { stem: "ingenieur", singular: "ingenieur", plural: "ingenieure" },
  { stem: "professor", singular: "professor", plural: "professoren" },
  { stem: "direktor", singular: "direktor", plural: "direktoren" },
  { stem: "funktionär", singular: "funktionär", plural: "funktionäre" },
  { stem: "aktionär", singular: "aktionär", plural: "aktionäre" },
  { stem: "sekretär", singular: "sekretär", plural: "sekretäre" },
  { stem: "astronaut", singular: "astronaut", obliqueSingular: "astronauten", plural: "astronauten" },
  { stem: "polizist", singular: "polizist", obliqueSingular: "polizisten", plural: "polizisten" },
  { stem: "tourist", singular: "tourist", obliqueSingular: "touristen", plural: "touristen" },
  { stem: "migrant", singular: "migrant", obliqueSingular: "migranten", plural: "migranten" },
  { stem: "mandant", singular: "mandant", obliqueSingular: "mandanten", plural: "mandanten" },
  { stem: "kandidat", singular: "kandidat", obliqueSingular: "kandidaten", plural: "kandidaten" },
  { stem: "diplomat", singular: "diplomat", obliqueSingular: "diplomaten", plural: "diplomaten" },
  { stem: "demokrat", singular: "demokrat", obliqueSingular: "demokraten", plural: "demokraten" },
  { stem: "student", singular: "student", obliqueSingular: "studenten", plural: "studenten" },
  { stem: "patient", singular: "patient", obliqueSingular: "patienten", plural: "patienten" },
  { stem: "experte", singular: "experte", obliqueSingular: "experten", plural: "experten" },
  { stem: "expert", singular: "experte", obliqueSingular: "experten", plural: "experten" },
  { stem: "soldat", singular: "soldat", obliqueSingular: "soldaten", plural: "soldaten" },
  { stem: "athlet", singular: "athlet", obliqueSingular: "athleten", plural: "athleten" },
  { stem: "jurist", singular: "jurist", obliqueSingular: "juristen", plural: "juristen" },
  { stem: "friseur", singular: "friseur", plural: "friseure" },
  { stem: "akteur", singular: "akteur", plural: "akteure" },
  { stem: "rektor", singular: "rektor", plural: "rektoren" },
  { stem: "pilot", singular: "pilot", obliqueSingular: "piloten", plural: "piloten" },
  { stem: "kolleg", singular: "kollege", obliqueSingular: "kollegen", plural: "kollegen" },
  { stem: "autor", singular: "autor", plural: "autoren" },
  { stem: "kund", singular: "kunde", obliqueSingular: "kunden", plural: "kunden" },
  { stem: "mutter", plural: "mütter" },
  { stem: "tochter", plural: "töchter" },
  { stem: "bruder", plural: "brüder" },
  { stem: "vater", plural: "väter" },
  { stem: "ärzt", singular: "arzt", plural: "ärzte" },
  { stem: "bauer", singular: "bauer", obliqueSingular: "bauern", plural: "bauern", match: "exact" }
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
      ? firstReplacementCharacter.toLocaleUpperCase(locale) + replacementCharacters.join("")
      : replacement;
  }

  return replacement.toLocaleLowerCase(locale);
}

function findMapping(base: string): PersonForms | undefined {
  const normalizedBase = base.toLocaleLowerCase(locale);

  return personForms.find((mapping) =>
    mapping.match === "exact"
      ? normalizedBase === mapping.stem
      : normalizedBase.endsWith(mapping.stem)
  );
}

function applyMapping(base: string, mapping: PersonForms, replacement: string): string {
  const sourceSuffix = base.slice(-mapping.stem.length);
  const prefix = base.slice(0, -mapping.stem.length);
  return prefix + applyCase(sourceSuffix, replacement);
}

export function mapMappedPlural(base: string): string | undefined {
  const mapping = findMapping(base);
  return mapping ? applyMapping(base, mapping, mapping.plural) : undefined;
}

export function mapMappedSingular(
  base: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  const mapping = findMapping(base);

  if (!mapping?.singular) {
    return undefined;
  }

  const replacement =
    grammaticalCase === "nominative"
      ? mapping.singular
      : mapping.obliqueSingular ?? mapping.singular;

  return applyMapping(base, mapping, replacement);
}
