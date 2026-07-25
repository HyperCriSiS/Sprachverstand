import {
  isRiskAllowed,
  type Rule,
  type RuleProfile,
  type TransformResult
} from "./rule";

export interface TransformOptions {
  readonly profile: RuleProfile;
  readonly disabledRuleIds?: ReadonlySet<string>;
}

export function transformText(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): TransformResult {
  let text = input;
  let replacements = 0;

  for (const rule of rules) {
    if (options.disabledRuleIds?.has(rule.id)) {
      continue;
    }

    if (!isRiskAllowed(rule.risk, options.profile)) {
      continue;
    }

    const result = rule.apply(text);
    text = result.text;
    replacements += result.replacements;
  }

  return { text, replacements };
}
