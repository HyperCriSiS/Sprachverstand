import {
  isRiskAllowed,
  type Rule,
  type RuleProfile,
  type TransformResult
} from "./rule";
import type { CustomReplacement } from "../settings/defaults";
import {
  summarizeReplacements,
  type ReplacementSummaryEntry
} from "./replacement-summary";

interface DetailedTransformResult extends TransformResult {
  readonly summaries: readonly ReplacementSummaryEntry[];
}

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

function applyBuiltInRulesPlain(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions,
  leadingContext?: string
): DetailedTransformResult {
  let text = input;
  let replacements = 0;
  const summaries: ReplacementSummaryEntry[] = [];

  for (const rule of rules) {
    if (options.disabledRuleIds?.has(rule.id)) {
      continue;
    }

    if (!isRiskAllowed(rule.risk, options.profile)) {
      continue;
    }

    const before = text;
    const result =
      leadingContext && rule.applyWithLeadingContext
        ? rule.applyWithLeadingContext(text, leadingContext)
        : rule.apply(text);

    if (result.replacements > 0 && result.text !== before) {
      summaries.push(
        ...summarizeReplacements(before, result.text, result.replacements)
      );
    }

    text = result.text;
    replacements += result.replacements;
  }

  return { text, replacements, summaries };
}

// Weiche Trennstellen werden nur in noch ungeschützten ORIGINALsegmenten
// behandelt. Benutzerdefinierte Ersetzungsziele und persönliche Ausnahmen
// gelangen damit niemals in einen späteren Regeldurchlauf.
function applyBuiltInRules(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions,
  leadingContext?: string
): DetailedTransformResult {
  if (!input.includes("\u00ad")) {
    return applyBuiltInRulesPlain(input, rules, options, leadingContext);
  }

  let cursor = 0;
  let text = "";
  let replacements = 0;
  const summaries: ReplacementSummaryEntry[] = [];

  for (const match of input.matchAll(/\S*\u00ad\S*/gu)) {
    const index = match.index;
    const originalToken = match[0];
    const before = applyBuiltInRulesPlain(
      input.slice(cursor, index),
      rules,
      options,
      cursor === 0 ? leadingContext : undefined
    );
    text += before.text;
    replacements += before.replacements;
    summaries.push(...before.summaries);

    const normalizedToken = originalToken.replaceAll("\u00ad", "");
    const tokenContext = `${leadingContext ?? ""}${input.slice(0, index)}`
      .replaceAll("\u00ad", "")
      .slice(-120);
    const result = applyBuiltInRulesPlain(
      normalizedToken,
      rules,
      options,
      tokenContext || undefined
    );

    // Nur eine echte, sichere Korrektur entfernt die originale Trennstelle.
    if (result.replacements > 0 && result.text !== normalizedToken) {
      text += result.text;
      replacements += result.replacements;
      summaries.push(...result.summaries);
    } else {
      text += originalToken;
    }
    cursor = index + originalToken.length;
  }

  const after = applyBuiltInRulesPlain(input.slice(cursor), rules, options);
  text += after.text;
  replacements += after.replacements;
  summaries.push(...after.summaries);
  return { text, replacements, summaries };
}

function applyRulesAndCustomReplacements(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions,
  leadingContext?: string
): DetailedTransformResult {
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
  const summaries: ReplacementSummaryEntry[] = [];

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
    summaries.push(...before.summaries);
    if (replacement !== undefined && replacement !== source) {
      summaries.push({ original: source, replacement, count: 1 });
    }
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
  summaries.push(...after.summaries);

  return { text, replacements, summaries };
}

function applyRulesWithProtectedTerms(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions,
  protectedPattern: RegExp | undefined,
  leadingContext?: string
): DetailedTransformResult {
  if (!protectedPattern) {
    return applyRulesAndCustomReplacements(input, rules, options, leadingContext);
  }

  let cursor = 0;
  let text = "";
  let replacements = 0;
  const summaries: ReplacementSummaryEntry[] = [];

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
    summaries.push(...before.summaries);
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
  summaries.push(...after.summaries);

  return { text, replacements, summaries };
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
): DetailedTransformResult {
  let cursor = 0;
  let text = "";
  let replacements = 0;
  const summaries: ReplacementSummaryEntry[] = [];

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
    summaries.push(...before.summaries);
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
  summaries.push(...after.summaries);

  return { text, replacements, summaries };
}

function transformTextCore(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): DetailedTransformResult {
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

export function transformTextWithSummary(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): DetailedTransformResult {
  return transformTextCore(input, rules, options);
}

export function transformText(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): TransformResult {
  const result = transformTextWithSummary(input, rules, options);

  return {
    text: result.text,
    replacements: result.replacements
  };
}