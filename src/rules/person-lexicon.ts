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
  readonly feminineSingular?: string;
  readonly compoundFeminineSingular?: string;
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
  weak("psychotherapeut"),
  regular("administrator", "administratoren"),
  regular("bibliothekar", "bibliothekare"),
  regular("parlamentarier", "parlamentarier"),
  regular("unteroffizier", "unteroffiziere"),
  regular("supervisor", "supervisoren"),
  regular("koordinator", "koordinatoren"),
  regular("organisator", "organisatoren"),
  regular("kommissar", "kommissare"),
  regular("kontrolleur", "kontrolleure"),
  regular("investor", "investoren"),
  regular("inspektor", "inspektoren"),
  regular("moderator", "moderatoren"),
  regular("redakteur", "redakteure"),
  regular("ingenieur", "ingenieure"),
  regular("professor", "professoren"),
  regular("direktor", "direktoren"),
  regular("funktionär", "funktionäre"),
  regular("aktionär", "aktionäre"),
  regular("sekretär", "sekretäre"),
  regular("millionär", "millionäre"),
  regular("pensionär", "pensionäre"),
  regular("regisseur", "regisseure"),
  regular("sponsor", "sponsoren"),
  regular("mentor", "mentoren"),
  regular("lektor", "lektoren"),
  regular("rektor", "rektoren"),
  regular("offizier", "offiziere"),
  regular("minister", "minister"),
  regular("kanzler", "kanzler"),
  regular("techniker", "techniker"),
  regular("übersetzer", "übersetzer"),
  regular("lehrling", "lehrlinge", "lehrling", "lehrlings"),
  regular("akteur", "akteure"),
  regular("friseur", "friseure"),
  regular("frisör", "frisöre"),
  regular("notar", "notare"),
  regular("volontär", "volontäre"),
  regular("revolutionär", "revolutionäre"),
  regular("pastor", "pastoren", "pastor", "pastors"),
  regular("autor", "autoren"),
  regular("freund", "freunde", "freund", "freundes"),
  regular("könig", "könige", "könig", "königs"),
  regular("chef", "chefs", "chef", "chefs"),
  regular("wirt", "wirte", "wirt", "wirts"),
  weak("interessent"),
  weak("abonnent"),
  weak("adressat"),
  weak("absolvent"),
  weak("doktorand"),
  weak("praktikant"),
  weak("präsident"),
  weak("lieferant"),
  weak("demonstrant"),
  weak("diskutant"),
  weak("dissident"),
  weak("produzent"),
  weak("referent"),
  weak("respondent"),
  weak("konsument"),
  weak("konkurrent"),
  weak("korrespondent"),
  weak("assistent"),
  weak("agent"),
  weak("informant"),
  weak("laborant"),
  weak("klient"),
  weak("journalist"),
  weak("komponist"),
  weak("fotograf"),
  weak("philosoph"),
  weak("prophet"),
  weak("protestant"),
  weak("chirurg"),
  weak("architekt"),
  weak("therapeut"),
  weak("astronaut"),
  weak("polizist"),
  weak("kapitalist"),
  weak("sozialist"),
  weak("spezialist"),
  weak("terrorist"),
  weak("aktivist"),
  weak("tourist"),
  weak("migrant"),
  weak("mandant"),
  weak("kandidat"),
  weak("diplomat"),
  weak("demokrat"),
  weak("veteran"),
  weak("student"),
  weak("patient"),
  weak("experte", "experte", "experten"),
  weak("expert", "experte", "experten"),
  weak("soldat"),
  weak("athlet"),
  weak("jurist"),
  weak("pilot"),
  weak("poet"),
  weak("herr", "herr", "herrn"),
  weak("narr"),
  weak("prinz"),
  weak("held"),
  weak("mensch"),
  weak("nachbar", "nachbar", "nachbarn"),
  weak("kolleg", "kollege", "kollegen"),
  weak("pädagog", "pädagoge", "pädagogen"),
  weak("psycholog", "psychologe", "psychologen"),
  weak("biolog", "biologe", "biologen"),
  weak("soziolog", "soziologe", "soziologen"),
  weak("theolog", "theologe", "theologen"),
  weak("geolog", "geologe", "geologen"),
  weak("archäolog", "archäologe", "archäologen"),
  weak("anthropolog", "anthropologe", "anthropologen"),
  weak("ökolog", "ökologe", "ökologen"),
  weak("zoolog", "zoologe", "zoologen"),
  {
    ...weak("zeitzeug", "zeitzeuge", "zeitzeugen"),
    match: "exact" as const
  },
  {
    ...weak("augenzeug", "augenzeuge", "augenzeugen"),
    match: "exact" as const
  },
  { ...weak("zeug", "zeuge", "zeugen"), match: "exact" as const },
  { ...weak("postbot", "postbote", "postboten"), match: "exact" as const },
  { ...weak("bot", "bote", "boten"), match: "exact" as const },
  { ...weak("miterb", "miterbe", "miterben"), match: "exact" as const },
  { ...weak("erb", "erbe", "erben"), match: "exact" as const },
  { ...weak("lai", "laie", "laien"), match: "exact" as const },
  weak("genoss", "genosse", "genossen"),
  weak("insass", "insasse", "insassen"),
  weak("kund", "kunde", "kunden"),
  {
    stem: "beamt",
    singular: "beamter",
    feminineSingular: "beamtin",
    obliqueSingular: "beamten",
    genitiveSingular: "beamten",
    plural: "beamte"
  },
  {
    stem: "vorständ",
    singular: "vorstand",
    feminineSingular: "vorständin",
    genitiveSingular: "vorstandes",
    plural: "vorstände"
  },
  {
    stem: "männ",
    singular: "mann",
    feminineSingular: "männin",
    genitiveSingular: "mannes",
    plural: "männer",
    match: "exact" as const
  },
  { stem: "kaufleut", plural: "kaufleute", match: "exact" as const },
  { stem: "köch", plural: "köche", match: "exact" as const },
  {
    stem: "anwält",
    singular: "anwalt",
    feminineSingular: "anwältin",
    genitiveSingular: "anwalts",
    plural: "anwälte"
  },
  {
    stem: "gäst",
    singular: "gast",
    feminineSingular: "gästin",
    genitiveSingular: "gastes",
    plural: "gäste"
  },
  {
    stem: "bischöf",
    singular: "bischof",
    feminineSingular: "bischöfin",
    genitiveSingular: "bischofs",
    plural: "bischöfe"
  },
  {
    stem: "rät",
    singular: "rat",
    feminineSingular: "rätin",
    genitiveSingular: "rates",
    plural: "räte"
  },
  {
    stem: "koch",
    singular: "koch",
    feminineSingular: "köchin",
    genitiveSingular: "koches",
    plural: "köche"
  },
  { stem: "mutter", plural: "mütter" },
  { stem: "tochter", plural: "töchter" },
  { stem: "bruder", plural: "brüder" },
  { stem: "vater", plural: "väter" },
  regular("ärzt", "ärzte", "arzt", "arztes"),
  { stem: "bäuer", plural: "bauern", match: "exact" as const },
  {
    stem: "bauer",
    singular: "bauer",
    feminineSingular: "bäuerin",
    compoundFeminineSingular: "bauerin",
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

function hasMatchingPrefixes(
  masculine: string,
  feminine: string,
  masculineSuffix: string,
  feminineSuffix: string
): boolean {
  const normalizedMasculine = masculine.toLocaleLowerCase(locale);
  const normalizedFeminine = feminine.toLocaleLowerCase(locale);

  if (
    !normalizedMasculine.endsWith(masculineSuffix) ||
    !normalizedFeminine.endsWith(feminineSuffix)
  ) {
    return false;
  }

  return (
    normalizedMasculine.slice(0, -masculineSuffix.length) ===
    normalizedFeminine.slice(0, -feminineSuffix.length)
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

export function mapMappedSingularPair(
  left: string,
  right: string
): string | undefined {
  for (const mapping of personForms) {
    if (!mapping.singular) {
      continue;
    }

    const feminine = mapping.feminineSingular ?? `${mapping.stem}in`;
    const direct = hasMatchingPrefixes(
      left,
      right,
      mapping.singular,
      feminine
    );
    const reverse = hasMatchingPrefixes(
      right,
      left,
      mapping.singular,
      feminine
    );

    if (mapping.match !== "exact" || left.length === mapping.singular.length) {
      if (direct) {
        return left;
      }
    }

    if (mapping.match !== "exact" || right.length === mapping.singular.length) {
      if (reverse) {
        return right;
      }
    }

    if (!mapping.compoundFeminineSingular) {
      continue;
    }

    if (
      hasMatchingPrefixes(
        left,
        right,
        mapping.singular,
        mapping.compoundFeminineSingular
      )
    ) {
      return left;
    }

    if (
      hasMatchingPrefixes(
        right,
        left,
        mapping.singular,
        mapping.compoundFeminineSingular
      )
    ) {
      return right;
    }
  }

  return undefined;
}
export function mapMappedInflectedSingularPair(
  left: string,
  right: string,
  grammaticalCase: GrammaticalCase
): string | undefined {
  for (const mapping of personForms) {
    if (!mapping.singular) {
      continue;
    }

    const masculine =
      grammaticalCase === "nominative"
        ? mapping.singular
        : grammaticalCase === "genitive"
          ? mapping.genitiveSingular ??
            mapping.obliqueSingular ??
            `${mapping.singular}s`
          : mapping.obliqueSingular ?? mapping.singular;
    const feminine = mapping.feminineSingular ?? `${mapping.stem}in`;

    if (hasMatchingPrefixes(left, right, feminine, masculine)) {
      return right;
    }
    if (hasMatchingPrefixes(right, left, feminine, masculine)) {
      return left;
    }

    if (!mapping.compoundFeminineSingular) {
      continue;
    }
    if (
      hasMatchingPrefixes(
        left,
        right,
        mapping.compoundFeminineSingular,
        masculine
      )
    ) {
      return right;
    }
    if (
      hasMatchingPrefixes(
        right,
        left,
        mapping.compoundFeminineSingular,
        masculine
      )
    ) {
      return left;
    }
  }

  return undefined;
}

