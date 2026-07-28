export interface RuleGroupDefinition {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly example: string;
  readonly ruleIds: readonly string[];
  readonly defaultEnabled: boolean;
}

export const ruleGroupDefinitions: readonly RuleGroupDefinition[] = [
  {
    id: "plural-separators",
    label: "Genderzeichen im Plural",
    description:
      "Doppelpunkt, Sternchen, Unterstrich, Schrägstrich, Punkt und typografische Trennzeichen.",
    example: "Nutzer:innen → Nutzer",
    ruleIds: [
      "plural.known-separator-innen",
      "plural.mapped-separator-innen"
    ],
    defaultEnabled: true
  },
  {
    id: "plural-binnen-i",
    label: "Binnen-I im Plural",
    description: "Großes I innerhalb bekannter Personenbezeichnungen.",
    example: "NutzerInnen → Nutzer",
    ruleIds: ["plural.binnen-i"],
    defaultEnabled: true
  },
  {
    id: "plural-double-forms",
    label: "Doppelnennungen im Plural",
    description:
      "Weibliche und männliche Pluralform werden zu einer gemeinsamen Form zusammengeführt.",
    example: "Nutzerinnen und Nutzer → Nutzer",
    ruleIds: ["plural.double-forms"],
    defaultEnabled: true
  },
  {
    id: "singular-explicit-context",
    label: "Gegenderte Singularformen mit Artikel",
    description:
      "Eindeutig markierte Artikel, Determinierer und Possessivartikel einschließlich Kasusflexion.",
    example: "jede:r Nutzer:in → jeder Nutzer",
    ruleIds: ["singular.explicit-context"],
    defaultEnabled: true
  },
  {
    id: "unmarked-singular",
    label: "Sichtbar markierte Singularformen",
    description:
      "Genderzeichen und Binnen-I werden bei bekannten Personenbezeichnungen normalisiert; mehrdeutige Artikelkontexte bleiben geschützt.",
    example: "NutzerIn → Nutzer",
    ruleIds: ["singular.unmarked-marker"],
    defaultEnabled: true
  },
  {
    id: "substantivized-adjectives",
    label: "Substantivierte Adjektive",
    description:
      "Sichtbar markierte Formen wie Erwachsene:r und Beschäftigte:n werden lexikonbasiert flektiert.",
    example: "Erwachsene:r → Erwachsener",
    ruleIds: ["adjective.substantivized-markers"],
    defaultEnabled: true
  },
  {
    id: "special-gender-forms",
    label: "Weitere sichtbare Genderformen",
    description:
      "Einzeln geprüfte Sonderformen wie Rom*nja, Sinti*zze und Studentys.",
    example: "Studentys → Studenten",
    ruleIds: ["special.visible-gender-forms"],
    defaultEnabled: true
  },
  {
    id: "singular-double-forms",
    label: "Doppelnennungen im Singular",
    description:
      "Explizit genannte weibliche und männliche Singularform derselben Personenbezeichnung.",
    example: "Kunde/Kundin → Kunde",
    ruleIds: ["singular.explicit-double-form"],
    defaultEnabled: true
  },
  {
    id: "explicit-pronouns",
    label: "Explizite Pronomen- und Possessivpaare",
    description:
      "Nur sichtbar gegenderte Paarformen; normale weibliche Pronomen bleiben unverändert.",
    example: "er:sie → er",
    ruleIds: ["pronoun.explicit-pairs"],
    defaultEnabled: true
  },
  {
    id: "natural-family-forms",
    label: "Künstlich gegenderte Familienformen",
    description:
      "Natürlich feminine Familienwörter behalten ihr grammatisches Geschlecht.",
    example: "Mutter:in → Mutter",
    ruleIds: ["singular.natural-family-forms"],
    defaultEnabled: true
  },
  {
    id: "title-abbreviations",
    label: "Gegenderte Titelabkürzungen",
    description:
      "Schreibt Prof.in und Dr.in je nach Kontext aus oder führt sie auf den normalen Titel zurück.",
    example: "Prof.in Anna Müller → Prof. Anna Müller",
    ruleIds: ["title.gendered-abbreviations"],
    defaultEnabled: true
  },
  {
    id: "salutation-participles",
    label: "Neutrale Partizipformen",
    description:
      "Ersetzt ausgewählte Personenbezeichnungen wie Studierende, Lesende und Arbeitnehmende; eindeutige Anreden werden weiterhin vollständig erkannt.",
    example: "Studierende → Studenten",
    ruleIds: ["salutation.participial-forms"],
    defaultEnabled: true
  },
  {
    id: "neutral-person-terms",
    label: "Kontextgebundene Umschreibungen",
    description:
      "Ersetzt nur einzeln geprüfte Umschreibungen und feste Wendungen. Weitere Kontexte werden im Projektkatalog gesammelt.",
    example: "Benutzungshandbuch → Benutzerhandbuch",
    ruleIds: ["neutral.person-terms"],
    defaultEnabled: false
  },
  {
    id: "job-ad-suffixes",
    label: "Geschlechtszusätze in Stellenanzeigen",
    description:
      "Entfernt verbreitete Zusätze wie (m/w/d).",
    example: "Erzieher (m/w/d) → Erzieher",
    ruleIds: ["job-ad.gender-suffixes"],
    defaultEnabled: false
  }
] as const;

export const defaultEnabledRuleGroupIds: readonly string[] =
  ruleGroupDefinitions
    .filter((group) => group.defaultEnabled)
    .map((group) => group.id);

const knownRuleGroupIds = new Set(
  ruleGroupDefinitions.map((group) => group.id)
);

export function normalizeEnabledRuleGroupIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...defaultEnabledRuleGroupIds];
  }

  return [
    ...new Set(
      value.filter(
        (entry): entry is string =>
          typeof entry === "string" && knownRuleGroupIds.has(entry)
      )
    )
  ];
}

export function enabledGroupsFromLegacyDisabledRuleIds(
  disabledRuleIds: readonly string[]
): string[] {
  const disabled = new Set(disabledRuleIds);

  return ruleGroupDefinitions
    .filter(
      (group) =>
        group.defaultEnabled &&
        group.ruleIds.every((ruleId) => !disabled.has(ruleId))
    )
    .map((group) => group.id);
}

export function disabledRuleIdsForGroups(
  enabledRuleGroupIds: readonly string[]
): Set<string> {
  const enabled = new Set(enabledRuleGroupIds);
  const disabledRuleIds = new Set<string>();

  for (const group of ruleGroupDefinitions) {
    if (enabled.has(group.id)) {
      continue;
    }

    for (const ruleId of group.ruleIds) {
      disabledRuleIds.add(ruleId);
    }
  }

  return disabledRuleIds;
}
