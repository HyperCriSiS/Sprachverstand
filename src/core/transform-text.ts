import {
  isRiskAllowed,
  type Rule,
  type RuleProfile,
  type TransformResult
} from "./rule";
import type { CustomReplacement } from "../settings/defaults";

export interface TransformOptions {
  readonly profile: RuleProfile;
  readonly disabledRuleIds?: ReadonlySet<string>;
  readonly protectedTerms?: readonly string[];
  readonly customReplacements?: readonly CustomReplacement[];
  readonly processQuotedText?: boolean;
  readonly leadingContext?: string;
}

const protectedPatternSourceCache = new Map<string, string>();
const customPatternSourceCache = new Map<string, string>();

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

function createLiteralPattern(
  values: readonly string[],
  cache: Map<string, string>,
  flags: string
): RegExp | undefined {
  const normalizedValues = [
    ...new Set(values.map((value) => value.trim()).filter(Boolean))
  ].sort((left, right) => right.length - left.length);

  if (normalizedValues.length === 0) {
    return undefined;
  }

  const cacheKey = normalizedValues.join("\u0000");
  let source = cache.get(cacheKey);

  if (!source) {
    source = String.raw`(?<![\p{L}\p{M}\p{N}])(?:${normalizedValues
      .map(escapeRegularExpression)
      .join("|")})(?![\p{L}\p{M}\p{N}])`;
    cache.set(cacheKey, source);
  }

  return new RegExp(source, flags);
}

function createProtectedPattern(terms: readonly string[]): RegExp | undefined {
  return createLiteralPattern(terms, protectedPatternSourceCache, "giu");
}

function createCustomReplacementPattern(
  replacements: readonly CustomReplacement[]
): RegExp | undefined {
  return createLiteralPattern(
    replacements.map((entry) => entry.source),
    customPatternSourceCache,
    "gu"
  );
}

function applyBuiltInRules(
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

function applyRulesAndCustomReplacements(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions,
  leadingContext?: string
): TransformResult {
  const customReplacements = options.customReplacements ?? [];
  const customPattern = createCustomReplacementPattern(customReplacements);
  if (!customPattern) {
    return applyBuiltInRules(input, rules, options, leadingContext);
  }

  const replacementMap = new Map(
    customReplacements.map((entry) => [entry.source, entry.replacement])
  );
  let cursor = 0;
  let text = "";
  let replacements = 0;

  for (const match of input.matchAll(customPattern)) {
    const index = match.index;
    const source = match[0];
    const before = applyBuiltInRules(
      input.slice(cursor, index),
      rules,
      options,
      cursor === 0 ? leadingContext : undefined
    );
    const replacement = replacementMap.get(source);

    text += before.text + (replacement ?? source);
    replacements += before.replacements + (replacement === undefined ? 0 : 1);
    cursor = index + source.length;
  }

  const after = applyBuiltInRules(
    input.slice(cursor),
    rules,
    options,
    cursor === 0 ? leadingContext : undefined
  );
  text += after.text;
  replacements += after.replacements;

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
    return applyRulesAndCustomReplacements(input, rules, options, leadingContext);
  }

  let cursor = 0;
  let text = "";
  let replacements = 0;

  for (const match of input.matchAll(protectedPattern)) {
    const index = match.index;
    const protectedText = match[0];

    const before = applyRulesAndCustomReplacements(
      input.slice(cursor, index),
      rules,
      options,
      cursor === 0 ? leadingContext : undefined
    );
    text += before.text + protectedText;
    replacements += before.replacements;
    cursor = index + protectedText.length;
  }

  const after = applyRulesAndCustomReplacements(
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
