import {
  isRiskAllowed,
  type Rule,
  type RuleProfile,
  type TransformResult
} from "./rule";
import type { CustomReplacement } from "../settings/defaults";
import {
  loanwordPersonFormsRuleId,
  setLoanwordPersonFormsEnabled
} from "../rules/loanword-person-forms";
import {
  summarizeReplacements,
  type ReplacementSummaryEntry
} from "./replacement-summary";
import { collectLeadingContextEdit, type LeadingContextEdit } from "./leading-context-edit";

export interface DetailedTransformResult extends TransformResult {
  readonly summaries: readonly ReplacementSummaryEntry[];
  // The result assumes this edit of the end of `leadingContext`; a caller
  // that cannot apply it must discard the result.
  readonly leadingContextEdit?: LeadingContextEdit;
}

export interface TransformOptions {
  readonly profile: RuleProfile;
  readonly disabledRuleIds?: ReadonlySet<string>;
  readonly protectedTerms?: readonly string[];
  readonly customReplacements?: readonly CustomReplacement[];
  readonly processQuotedText?: boolean;
  readonly leadingContext?: string;
  readonly protectedRanges?: readonly {readonly start: number; readonly end: number}[];
}

const protectedPatternSourceCache = new Map<string, string>();
const customPatternSourceCache = new Map<string, string>();
const maximumPatternSourceCacheEntries = 128;

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

  const cacheKey = JSON.stringify(normalizedValues);
  let source = cache.get(cacheKey);

  if (!source) {
    source = String.raw`(?<![\p{L}\p{M}\p{N}])(?:${normalizedValues
      .map(escapeRegularExpression)
      .join("|")})(?![\p{L}\p{M}\p{N}])`;
    if (cache.size >= maximumPatternSourceCacheEntries) {
      const oldestKey = cache.keys().next().value;
      if (oldestKey !== undefined) cache.delete(oldestKey);
    }
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
    const tokenContext = softHyphenContextSuffix(input, index, leadingContext);
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

function softHyphenContextSuffix(
  input: string,
  end: number,
  leadingContext?: string
): string {
  // Only 120 non-soft-hyphen UTF-16 units can affect the next token.
  // Removing soft hyphens from the entire prefix per token was quadratic.
  let cursor = end;
  let length = 0;
  while (cursor > 0 && length < 120) {
    cursor -= 1;
    if (input[cursor] !== "\u00ad") length += 1;
  }
  const suffix = input.slice(cursor, end).replaceAll("\u00ad", "");
  return length === 120 ? suffix :
    ((leadingContext ?? "").replaceAll("\u00ad", "") + suffix).slice(-120);
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
  const missingClosings = new Set<string>();

  for (let index = 0; index < input.length; index += 1) {
    const opening = input[index];
    const closing = opening ? pairedQuotes.get(opening) : undefined;
    if (!closing || missingClosings.has(closing)) {
      continue;
    }

    const closingIndex = input.indexOf(closing, index + 1);
    if (closingIndex < 0) {
      missingClosings.add(closing);
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

// A gender marker that continues a word from the preceding inline text,
// e.g. `Lehrer<em>:innen</em>` or `Mitarbeiter<b>Innen</b>`.
const splitMarkerStartPattern =
  /^(?:[:*_·•/∕⁄／]-?innen(?![\p{L}\p{M}])|\(-?innen\)|Innen(?![\p{Ll}\p{M}]))/u;
// `Lehrer*<b>innen</b>` / `Lehrer<span>*</span>innen`: the marker ends the
// preceding text. The DOM removes that marker together with this result.
const splitSuffixStartPattern = /^innen(?![\p{L}\p{M}])/u;
const contextStemPattern = /(?<![\p{L}\p{M}’'-])[\p{L}\p{M}]{2,}$/u;
const contextStemMarkerPattern = /(?<![\p{L}\p{M}’'-])([\p{L}\p{M}]{2,})([:*_·•/∕⁄／]-?)$/u;

export function startsWithSplitGenderMarker(input: string): boolean {
  return splitMarkerStartPattern.test(input) || splitSuffixStartPattern.test(input);
}

export function startsWithSplitGenderSuffix(input: string): boolean {
  return splitSuffixStartPattern.test(input);
}

// The whole word is transformed, but only this text's own part changes:
// the result must keep the preceding stem unchanged, otherwise (e.g. an
// umlaut change) the split word is left alone.
function transformSplitWord(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): DetailedTransformResult | undefined {
  const leading = options.leadingContext;
  if (!leading) return undefined;
  let stem: string | undefined;
  let marker = "";
  if (splitMarkerStartPattern.test(input)) {
    stem = contextStemPattern.exec(leading)?.[0];
  } else if (splitSuffixStartPattern.test(input)) {
    const match = contextStemMarkerPattern.exec(leading);
    if (match) [, stem, marker] = match as unknown as [string, string, string];
  }
  if (!stem) return undefined;
  const rest = leading.slice(0, -(stem.length + marker.length));
  const {leadingContext: _leading, ...plainOptions} = options;
  const combined = transformTextCoreUnsplit(stem + marker + input, rules,
    rest ? {...plainOptions, leadingContext: rest} : plainOptions);
  if (combined.replacements === 0 || !combined.text.startsWith(stem) ||
      (marker && combined.text.startsWith(stem + marker))) return undefined;
  return {...combined, text: combined.text.slice(stem.length)};
}

// Decomposed umlauts (`Schüler:innen`, NFD) never match the lexicon.
// Only words that carry a gender marker and a combining mark are composed
// (NFC) for the rules; everything else keeps its exact code units, and a
// composed word the rules left alone gets its original form back.
const combiningMarkedWord = /[\p{L}\p{M}’'*:_·•/()-]*\p{M}[\p{L}\p{M}’'*:_·•/()-]*/gu;
const genderMarkerInWord = /[:*_·•/(]|\p{Ll}In/u;

function transformTextCore(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): DetailedTransformResult {
  if (/\p{M}/u.test(input)) {
    const originals = new Map<string, string>();
    const composed = input.replace(combiningMarkedWord, (word: string) => {
      if (!genderMarkerInWord.test(word)) return word;
      const nfc = word.normalize("NFC");
      if (nfc !== word) originals.set(nfc, word);
      return nfc;
    });
    if (originals.size > 0) {
      const result = transformTextCoreSplit(composed, rules, options);
      if (result.replacements === 0) return transformTextCoreSplit(input, rules, options);
      let text = result.text;
      for (const [nfc, original] of originals) text = text.replaceAll(nfc, original);
      return {...result, text};
    }
  }
  return transformTextCoreSplit(input, rules, options);
}

function transformTextCoreSplit(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): DetailedTransformResult {
  return transformSplitWord(input, rules, options) ??
    transformTextCoreUnsplit(input, rules, options);
}

function transformTextCoreUnsplit(
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
  const {result, edit} = collectLeadingContextEdit(options.leadingContext,
    () => transformTextWithSummaryUnedited(input, rules, options));
  return edit ? {...result, leadingContextEdit: edit} : result;
}

function transformTextWithSummaryUnedited(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): DetailedTransformResult {
  // The loanword lexicon is data for all rules; its group switches it
  // through the id of its marker rule.
  setLoanwordPersonFormsEnabled(
    !options.disabledRuleIds?.has(loanwordPersonFormsRuleId)
  );
  if (options.protectedRanges?.length) {
    const {protectedRanges, leadingContext, ...plainOptions} = options;
    let cursor = 0;
    let text = "";
    let replacements = 0;
    const summaries: ReplacementSummaryEntry[] = [];
    const append = (end: number): void => {
      if (end <= cursor) return;
      const result = transformTextCore(input.slice(cursor, end), rules, {
        ...plainOptions, ...(cursor === 0 && leadingContext ? {leadingContext} : {})
      });
      text += result.text; replacements += result.replacements;
      summaries.push(...result.summaries);
    };
    for (const range of protectedRanges) {
      append(range.start);
      text += input.slice(range.start, range.end);
      cursor = range.end;
    }
    append(input.length);
    return {text, replacements, summaries};
  }
  return transformTextCore(input, rules, options);
}

export function transformText(
  input: string,
  rules: readonly Rule[],
  options: TransformOptions
): TransformResult {
  // A plain text result has no context to rewrite.
  const result = transformTextWithSummaryUnedited(input, rules, options);

  return {
    text: result.text,
    replacements: result.replacements
  };
}
