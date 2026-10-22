import {isLocalTransformBatchRequest, maximumLocalTransformBatchSize, type LocalTransformBatchRequest,
  type LocalTransformRequest} from "./local-transform-message";

type Options = LocalTransformRequest["options"];
type SharedOptions = Omit<Options, "leadingContext" | "protectedRanges">;
type Entry = Pick<LocalTransformRequest, "input"> & Pick<Options, "leadingContext" | "protectedRanges">;
export interface SharedLocalTransformBatchRequest {
  readonly type: "sprachverstand.transform-text-shared-batch";
  readonly sharedOptions: SharedOptions;
  readonly requests: readonly Entry[];
}
const sharedKinds: Record<keyof SharedOptions, "scalar" | "list" | "custom"> = {
  profile: "scalar", disabledRuleIds: "list", protectedTerms: "list",
  customReplacements: "custom", processQuotedText: "scalar"
};
const entryKeys = new Set(["input", "leadingContext", "protectedRanges"]);
const minimumSharedCharacters = 4096;

function sharedOptions(options: Options): SharedOptions {
  const {leadingContext: _leading, protectedRanges: _ranges, ...shared} = options;
  return shared;
}

function sameSharedOptions(left: SharedOptions, right: SharedOptions): boolean {
  if (Object.keys(right).some(key => !Object.hasOwn(sharedKinds, key))) return false;
  for (const key of Object.keys(sharedKinds) as (keyof SharedOptions)[]) {
    if (left[key] === right[key]) continue;
    if (sharedKinds[key] === "scalar" || left[key] === undefined || right[key] === undefined) return false;
    if (sharedKinds[key] === "custom") {
      const before = left.customReplacements!;
      const after = right.customReplacements!;
      if (before.length !== after.length || before.some((value, index) =>
        value.source !== after[index]?.source || value.replacement !== after[index]?.replacement)) return false;
    } else {
      const before = left[key] as readonly string[];
      const after = right[key] as readonly string[];
      if (before.length !== after.length || before.some((value, index) => value !== after[index])) return false;
    }
  }
  return true;
}

export function packLocalTransformBatch(requests: readonly LocalTransformRequest[]):
  LocalTransformBatchRequest | SharedLocalTransformBatchRequest {
  const legacy: LocalTransformBatchRequest = {type: "sprachverstand.transform-text-batch", requests};
  const first = requests[0];
  if (!first || requests.length < 2) return legacy;
  const shared = sharedOptions(first.options);
  const characters = (shared.protectedTerms ?? []).reduce((sum, value) => sum + value.length, 0) +
    (shared.customReplacements ?? []).reduce((sum, value) => sum + value.source.length + value.replacement.length, 0);
  // Small/default options retain their current cheap message representation.
  if (characters < minimumSharedCharacters || Object.keys(shared).some(key => !Object.hasOwn(sharedKinds, key)) ||
      requests.some(request => !sameSharedOptions(shared, sharedOptions(request.options)))) return legacy;
  return {type: "sprachverstand.transform-text-shared-batch", sharedOptions: shared,
    requests: requests.map(request => ({input: request.input,
      ...(request.options.leadingContext !== undefined ? {leadingContext: request.options.leadingContext} : {}),
      ...(request.options.protectedRanges !== undefined ? {protectedRanges: request.options.protectedRanges} : {})}))};
}

export function expandSharedLocalTransformBatch(value: unknown): LocalTransformBatchRequest | undefined {
  if (!value || typeof value !== "object") return undefined;
  const message = value as Partial<SharedLocalTransformBatchRequest>;
  const common = message.sharedOptions;
  if (message.type !== "sprachverstand.transform-text-shared-batch" || !common || typeof common !== "object" || Array.isArray(common) ||
      !Object.hasOwn(common, "profile") || Object.keys(common).some(key => !Object.hasOwn(sharedKinds, key)) ||
      !Array.isArray(message.requests) || message.requests.length === 0 || message.requests.length > maximumLocalTransformBatchSize) return undefined;
  for (let index = 0; index < message.requests.length; index += 1) {
    const entry = message.requests[index];
    if (!Object.hasOwn(message.requests, index) || !entry || typeof entry !== "object" ||
        Array.isArray(entry) || !Object.hasOwn(entry, "input") ||
        Object.keys(entry).some(key => !entryKeys.has(key))) return undefined;
  }
  const batch: LocalTransformBatchRequest = {type: "sprachverstand.transform-text-batch",
    requests: message.requests.map(entry => ({type: "sprachverstand.transform-large-text", input: entry.input,
      options: {...common,
        ...(entry.leadingContext !== undefined ? {leadingContext: entry.leadingContext} : {}),
        ...(entry.protectedRanges !== undefined ? {protectedRanges: entry.protectedRanges} : {})}}))};
  return isLocalTransformBatchRequest(batch) ? batch : undefined;
}
