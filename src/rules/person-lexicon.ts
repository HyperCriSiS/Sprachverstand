export type GrammaticalCase =
  | "nominative"
  | "accusative"
  | "dative"
  | "genitive";

type MatchMode = "exact" | "suffix";

interface PersonForms {
  readonly stem: string;
  readonly plural: string;
  readonly singular?: string;
  readonly obliqueSingular?: string;
  readonly genitiveSingular?: string;
  readonly compoundPlural?: string;
  readonly match?: MatchMode;
}

const locale = "de-DE";

function weak(
  stem: string,
  singular = stem,
  obliqueSingular = `${stem}en`
): PersonForms {
  return {
    stem,
    singular,
    obliqueSingular,
    plural: obliqueSingular
  };
}

function regular(
  stem: string,
  plural: string,
  singular = stem,
  genitiveSingular?: string
): PersonForms {
  return genitiveSingular === undefined
    ? { stem, singular, plural }
    : { stem, singular, genitiveSingular, plural };
}

const personForms: readonly PersonForms[] = [
  weak("hochschulabsolvent"),
  weak("interessent"),
  weak("absolvent"),
  weak("doktorand"),
  weak("praktikant"),
  weak("präsident"),
  weak("lieferant"),
  regular("moderator", "moderatoren"),
  regular("redakteur", "redakteure"),
  weak("journalist"),
  weak("architekt"),
  regular("ingenieur", "ingenieure"),
  regular("professor", "professoren"),
  regular("direktor", "direktoren"),
  regular("funktionär", "funktionäre"),
  regular("aktionär", "aktionäre"),
  regular("sekretär", "sekretäre"),
  weak("astronaut"),
  weak("polizist"),
  weak("aktivist"),
  weak("tourist"),
  weak("migrant"),
  weak("mandant"),
  weak("kandidat"),
  weak("diplomat"),
  weak("demokrat"),
  weak("student"),
  weak("patient"),
  weak("experte", "experte", "experten"),
  weak("expert", "experte", "experten"),
  weak("soldat"),
  weak("athlet"),
  weak("jurist"),
  regular("friseur", "friseure"),
  regular("akteur", "akteure"),
  regular("rektor", "rektoren"),
  weak("pilot"),
  weak("kolleg", "kollege", "kollegen"),
  regular("autor", "autoren"),
  weak("kund", "kunde", "kunden"),
  { stem: "mutter", plural: "mütter" },
  { stem: "tochter", plural: "töchter" },
  { stem: "bruder", plural: "brüder" },
  { stem: "vater", plural: "väter" },
  regular("ärzt", "ärzte", "arzt", "arztes"),
  {
    stem: "bauer",
    singular: "bauer",
    obliqueSingular: "bauern",
    plural: "bauern",
    compoundPlural: "bauer",
    match: "exact" as const
  }
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

function applyMapping(
  base: string,
  mapping: PersonForms,
  replacement: string
): string {
  const sourceSuffix = base.slice(-mapping.stem.length);
  const prefix = base.slice(0, -mapping.stem.length);
  return prefix + applyCase(sourceSuffix, replacement);
}

function findSingularMapping(base: string): PersonForms | undefined {
  const normalizedBase = base.toLocaleLowerCase(locale);

  return personForms.find((mapping) =>
    mapping.match === "exact"
      ? normalizedBase === mapping.stem
      : normalizedBase.endsWith(mapping.stem)
  );
}

export function mapMappedPlural(base: string): string | undefined {
  const normalizedBase = base.toLocaleLowerCase(locale);

  for (const mapping of personForms) {
    if (mapping.match !== "exact" && normalizedBase.endsWith(mapping.stem)) {
      return applyMapping(base, mapping, mapping.plural);
    }

    if (normalizedBase === mapping.stem) {
      return applyMapping(base, mapping, mapping.plural);
    }

    if (
      mapping.compoundPlural &&
      normalizedBase.length > mapping.stem.length &&
      normalizedBase.endsWith(mapping.stem)
    ) {
      return applyMapping(base, mapping, mapping.compoundPlural);
    }
  }

  return undefined;
}

export function mapMappedSingular(
  base: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  const mapping = findSingularMapping(base);

  if (!mapping?.singular) {
    return undefined;
  }

  let replacement: string;

  if (grammaticalCase === "nominative") {
    replacement = mapping.singular;
  } else if (grammaticalCase === "genitive") {
    replacement =
      mapping.genitiveSingular ??
      mapping.obliqueSingular ??
      `${mapping.singular}s`;
  } else {
    replacement = mapping.obliqueSingular ?? mapping.singular;
  }

  return applyMapping(base, mapping, replacement);
}
