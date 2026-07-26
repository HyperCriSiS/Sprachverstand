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
    example: "Nutzer:innen → Nutzer · Ärzt*innen → Ärzte",
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
    example: "NutzerInnen → Nutzer · ÄrztInnen → Ärzte",
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
    example: "er:sie → er · seines:ihres → seines",
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
    .filter((group) =>
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
