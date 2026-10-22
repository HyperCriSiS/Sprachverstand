// A marked singular at the start of an inline element whose article lives in
// the preceding text (`Das Projekt der <em>Künstler*in</em>`). A rule may
// convert the whole phrase („des Künstlers“) when the caller can rewrite the
// end of that preceding text; the change is reported as a context edit.
export interface LeadingContextEdit {
  // The exact end of the leading context to replace, and its replacement.
  readonly removed: string;
  readonly inserted: string;
}

// Only the article and up to three attributes may change; anything larger is
// not one phrase across an inline boundary.
const maximumEditedContextTokens = 4;
export const maximumLeadingContextEditLength = 120;

// One synchronous transform at a time: the caller opens a sink for the
// context it can rewrite, rules claim at most one edit of exactly that
// context, and the caller reads it back. Nested transforms with a derived
// context (split words, soft-hyphen tokens) never match and keep the old
// behaviour.
let sink: {context: string; edit?: LeadingContextEdit} | undefined;

export function collectLeadingContextEdit<T>(
  context: string | undefined, run: () => T
): {result: T; edit?: LeadingContextEdit} {
  const previous = sink;
  sink = context ? {context} : undefined;
  try {
    const result = run();
    const edit = sink?.edit;
    return edit ? {result, edit} : {result};
  } finally {
    sink = previous;
  }
}

function claimLeadingContextEdit(context: string, edit: LeadingContextEdit): boolean {
  if (!sink || sink.context !== context || sink.edit) return false;
  sink.edit = edit;
  return true;
}

function tokens(value: string): string[] {
  return value === "" ? [] : value.split(/(?<=\s)(?=\S)/u);
}

// `rule(context + input)` changed the context. Splits the result into a new
// context end and a new input along whitespace tokens: the changed span is
// aligned to token boundaries, and the input keeps as many trailing tokens of
// it as it had (`der oder die ` + `Kolleg*in` → `dem ` + `Kollegen`).
export function splitContextResult(
  context: string, input: string, output: string
): {edit: LeadingContextEdit; text: string} | undefined {
  const original = context + input;
  let start = 0;
  while (start < context.length && context[start] === output[start]) start += 1;
  while (start > 0 && !/\s/u.test(context[start - 1]!)) start -= 1;
  let suffix = 0;
  while (suffix < input.length && suffix < output.length - start &&
    original[original.length - 1 - suffix] === output[output.length - 1 - suffix]) suffix += 1;
  let end = original.length - suffix;
  while (end < original.length && !/\s/u.test(original[end]!)) end += 1;
  if (end <= context.length) return undefined;
  const outputEnd = output.length - (original.length - end);
  if (outputEnd < start) return undefined;
  const contextTokens = tokens(context.slice(start));
  const inputTokens = tokens(input.slice(0, end - context.length));
  const changed = tokens(output.slice(start, outputEnd));
  const kept = changed.length - inputTokens.length;
  if (contextTokens.length > maximumEditedContextTokens || kept < 0 || kept > contextTokens.length) {
    return undefined;
  }
  const inserted = changed.slice(0, kept).join("");
  if (inserted !== "" && !/\s$/u.test(inserted)) return undefined;
  const text = changed.slice(kept).join("") + input.slice(end - context.length);
  if (context.slice(0, start) + inserted + text !== output) return undefined;
  return {edit: {removed: context.slice(start), inserted}, text};
}

// For rules: the result for `input` when the rule rewrote the context too,
// provided the caller accepts that edit.
export function acceptContextResult(
  context: string, input: string, output: string
): string | undefined {
  const split = splitContextResult(context, input, output);
  if (!split || !claimLeadingContextEdit(context, split.edit)) return undefined;
  return split.text;
}

export function isLeadingContextEdit(value: unknown): value is LeadingContextEdit {
  if (!value || typeof value !== "object") return false;
  const edit = value as Partial<LeadingContextEdit>;
  return typeof edit.removed === "string" && typeof edit.inserted === "string" &&
    edit.removed.length > 0 && edit.removed.length <= maximumLeadingContextEditLength &&
    edit.inserted.length <= maximumLeadingContextEditLength;
}
