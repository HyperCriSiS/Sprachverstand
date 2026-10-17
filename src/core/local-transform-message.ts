import type {TransformOptions, DetailedTransformResult} from "./transform-text";
import type {CustomReplacement} from "../settings/defaults";

export interface LocalTransformRequest {
  readonly type: "sprachverstand.transform-large-text";
  readonly input: string;
  readonly options: Omit<TransformOptions, "disabledRuleIds"> & {
    readonly disabledRuleIds?: readonly string[];
  };
}
export const maximumLocalTransformBatchSize = 32;
export const maximumLocalTransformBatchCharacters = 65_536;
export const largeLocalTransformThreshold = 8_192;
export interface LocalTransformBatchRequest {
  readonly type: "sprachverstand.transform-text-batch";
  readonly requests: readonly LocalTransformRequest[];
}

function protectedRanges(value: unknown, length: number): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 8_192) return false;
  let end = 0;
  return value.every(range => {
    if (!range || !Number.isSafeInteger(range.start) || !Number.isSafeInteger(range.end) ||
        range.start < end || range.end < range.start || range.end > length) return false;
    end = range.end;
    return true;
  });
}
function stringList(value: unknown): boolean {
  return value === undefined || (Array.isArray(value) && value.every(entry => typeof entry === "string"));
}
export function isLocalTransformRequest(value: unknown): value is LocalTransformRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<LocalTransformRequest>;
  const options = request.options;
  return request.type === "sprachverstand.transform-large-text" &&
    typeof request.input === "string" && Boolean(options &&
      ["conservative", "standard", "aggressive"].includes(options.profile) &&
      stringList(options.disabledRuleIds) && stringList(options.protectedTerms) &&
      protectedRanges(options.protectedRanges, request.input.length) &&
      (options.leadingContext === undefined || typeof options.leadingContext === "string") &&
      (options.processQuotedText === undefined || typeof options.processQuotedText === "boolean") &&
      (options.customReplacements === undefined ||
        (Array.isArray(options.customReplacements) && options.customReplacements.every(entry => {
          const replacement = entry as Partial<CustomReplacement> | null;
          return replacement && typeof replacement.source === "string" &&
            typeof replacement.replacement === "string";
        }))));
}
export function isLocalTransformBatchRequest(value: unknown): value is LocalTransformBatchRequest {
  if (!value || typeof value !== "object") return false;
  const request = value as Partial<LocalTransformBatchRequest>;
  if (request.type !== "sprachverstand.transform-text-batch" || !Array.isArray(request.requests) ||
      request.requests.length === 0 || request.requests.length > maximumLocalTransformBatchSize ||
      !request.requests.every(isLocalTransformRequest)) return false;
  let characters = 0;
  for (const entry of request.requests) {
    if (entry.input.length >= largeLocalTransformThreshold) return false;
    characters += entry.input.length;
  }
  return characters <= maximumLocalTransformBatchCharacters;
}
export function isDetailedTransformResult(value: unknown): value is DetailedTransformResult {
  if (!value || typeof value !== "object") return false;
  const result = value as Partial<DetailedTransformResult>;
  return typeof result.text === "string" && Number.isSafeInteger(result.replacements) &&
    result.replacements! >= 0 && Array.isArray(result.summaries) &&
    result.summaries.every(entry => entry && typeof entry.original === "string" &&
      typeof entry.replacement === "string" && Number.isSafeInteger(entry.count) && entry.count > 0);
}
