export type RuleRisk = "safe" | "contextual" | "aggressive";
export type RuleProfile = "conservative" | "standard" | "aggressive";

export interface TransformResult {
  readonly text: string;
  readonly replacements: number;
}

export interface Rule {
  readonly id: string;
  readonly risk: RuleRisk;
  readonly leadingContextCandidate?: RegExp;
  apply(input: string): TransformResult;
  applyWithLeadingContext?(
    input: string,
    leadingContext: string
  ): TransformResult;
}

export interface RegexRuleDefinition {
  readonly id: string;
  readonly risk: RuleRisk;
  readonly pattern: RegExp;
  readonly replace: (...arguments_: unknown[]) => string;
}

export function createRegexRule(definition: RegexRuleDefinition): Rule {
  const flags = definition.pattern.flags.includes("g")
    ? definition.pattern.flags
    : `${definition.pattern.flags}g`;

  return {
    id: definition.id,
    risk: definition.risk,
    apply(input: string): TransformResult {
      let replacements = 0;
      const pattern = new RegExp(definition.pattern.source, flags);

      const text = input.replace(pattern, (...arguments_: unknown[]) => {
        replacements += 1;
        return definition.replace(...arguments_);
      });

      return { text, replacements };
    }
  };
}

export function isRiskAllowed(
  risk: RuleRisk,
  profile: RuleProfile
): boolean {
  if (profile === "aggressive") {
    return true;
  }

  if (profile === "standard") {
    return risk !== "aggressive";
  }

  return risk === "safe";
}
