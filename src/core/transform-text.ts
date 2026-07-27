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
  readonly processQuotedText?: boolean;
  readonly leadingContext?: string;
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
  options: TransformOptions,
  leadingContext?: string
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

    const result =
      leadingContext && rule.applyWithLeadingContext
        ? rule.applyWithLeadingContext(text, leadingContext)
        : rule.apply(text);
    text = result.text;
    replacements += result.replacements;
  }

  return { text, replacements };
}

function applyRulesWithProtectedTerms(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions,
  protectedPattern: RegExp | undefined,
  leadingContext?: string
): TransformResult {
  if (!protectedPattern) {
    return applyRules(input, rules, options, leadingContext);
  }

  let cursor = 0;
  let text = "";
  let replacements = 0;

  for (const match of input.matchAll(protectedPattern)) {
    const index = match.index;
    const protectedText = match[0];

    const before = applyRules(
      input.slice(cursor, index),
      rules,
      options,
      cursor === 0 ? leadingContext : undefined
    );
    text += before.text + protectedText;
    replacements += before.replacements;
    cursor = index + protectedText.length;
  }

  const after = applyRules(
    input.slice(cursor),
    rules,
    options,
    cursor === 0 ? leadingContext : undefined
  );
  text += after.text;
  replacements += after.replacements;

  return { text, replacements };
}

const pairedQuotes = new Map<string, string>([
  ["„", "“"],
  ["“", "”"],
  ["‚", "‘"],
  ["«", "»"],
  ["‹", "›"],
  ['"', '"']
]);

function applyRulesOutsideQuotes(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions,
  protectedPattern: RegExp | undefined,
  leadingContext?: string
): TransformResult {
  let cursor = 0;
  let text = "";
  let replacements = 0;

  for (let index = 0; index < input.length; index += 1) {
    const opening = input[index];
    const closing = opening ? pairedQuotes.get(opening) : undefined;
    if (!closing) {
      continue;
    }

    const closingIndex = input.indexOf(closing, index + 1);
    if (closingIndex < 0) {
      continue;
    }

    const before = applyRulesWithProtectedTerms(
      input.slice(cursor, index),
      rules,
      options,
      protectedPattern,
      cursor === 0 ? leadingContext : undefined
    );
    text += before.text + input.slice(index, closingIndex + 1);
    replacements += before.replacements;
    cursor = closingIndex + 1;
    index = closingIndex;
  }

  const after = applyRulesWithProtectedTerms(
    input.slice(cursor),
    rules,
    options,
    protectedPattern,
    cursor === 0 ? leadingContext : undefined
  );
  text += after.text;
  replacements += after.replacements;

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

  return options.processQuotedText === false
    ? applyRulesOutsideQuotes(
        input,
        rules,
        options,
        protectedPattern,
        options.leadingContext
      )
    : applyRulesWithProtectedTerms(
        input,
        rules,
        options,
        protectedPattern,
        options.leadingContext
      );
}
