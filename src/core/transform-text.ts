import {
  isRiskAllowed,
  type Rule,
  type RuleProfile,
  type TransformResult
} from "./rule";

export interface TransformOptions {
  readonly profile: RuleProfile;
  readonly disabledRuleIds?: ReadonlySet<string>;
  readonly protectedTerms?: readonly string[];
}

const protectedPatternSourceCache = new Map<string, string>();

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function createProtectedPattern(terms: readonly string[]): RegExp | undefined {
  const normalizedTerms = [
    ...new Set(terms.map((term) => term.trim()).filter(Boolean))
  ].sort((left, right) => right.length - left.length);

  if (normalizedTerms.length === 0) {
    return undefined;
  }

  const cacheKey = normalizedTerms.join("\u0000");
  let source = protectedPatternSourceCache.get(cacheKey);

  if (!source) {
    source = String.raw`(?<![\p{L}\p{M}\p{N}])(?:${normalizedTerms
      .map(escapeRegularExpression)
      .join("|")})(?![\p{L}\p{M}\p{N}])`;
    protectedPatternSourceCache.set(cacheKey, source);
  }

  return new RegExp(source, "giu");
}

function applyRules(
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

export function transformText(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): TransformResult {
  const protectedPattern = options.protectedTerms
    ? createProtectedPattern(options.protectedTerms)
    : undefined;

  if (!protectedPattern) {
    return applyRules(input, rules, options);
  }

  let cursor = 0;
  let text = "";
  let replacements = 0;

  for (const match of input.matchAll(protectedPattern)) {
    const index = match.index;
    const protectedText = match[0];

    const before = applyRules(input.slice(cursor, index), rules, options);
    text += before.text + protectedText;
    replacements += before.replacements;
    cursor = index + protectedText.length;
  }

  const after = applyRules(input.slice(cursor), rules, options);
  text += after.text;
  replacements += after.replacements;

  return { text, replacements };
}
