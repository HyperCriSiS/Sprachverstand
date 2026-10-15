import {getExtensionApi} from "./api";
import {isDetailedTransformResult, largeLocalTransformThreshold,
  maximumLocalTransformBatchSize, maximumLocalTransformBatchCharacters,
  type LocalTransformRequest} from "../core/local-transform-message";
import {packLocalTransformBatch} from "../core/shared-local-transform-batch";
import type {TransformOptions, DetailedTransformResult} from "../core/transform-text";

function requestFor(input: string, options: TransformOptions): LocalTransformRequest {
  const {disabledRuleIds, ...plainOptions} = options;
  return {
    type: "sprachverstand.transform-large-text", input,
    options: {...plainOptions, ...(disabledRuleIds
      ? {disabledRuleIds: [...disabledRuleIds]} : {})}
  };
}

function checkedResult(result: unknown): DetailedTransformResult {
  if (!isDetailedTransformResult(result)) throw new Error("Ungültiges lokales Transformationsergebnis.");
  return result;
}

export async function transformLargeTextLocally(input: string,
  options: TransformOptions): Promise<DetailedTransformResult> {
  return checkedResult(await getExtensionApi().runtime.sendMessage(requestFor(input, options)));
}

interface PendingTransform {
  readonly request: LocalTransformRequest;
  readonly resolve: (value: DetailedTransformResult) => void;
  readonly reject: (error: unknown) => void;
}
const smallRequests: PendingTransform[] = [];
const subtitleRequests: PendingTransform[] = [];
const largeRequests: PendingTransform[] = [];
let batchTimer: ReturnType<typeof setTimeout> | undefined;
let subtitleDispatchScheduled = false;
let fullBatchDispatchScheduled = false;
let activeBatches = 0;
let activeLargeRequests = 0;

function complete(entry: PendingTransform, value: unknown): void {
  try {entry.resolve(checkedResult(value));} catch (error) {entry.reject(error);}
}

function dispatchLarge(): void {
  while (activeLargeRequests < 2 && largeRequests.length) {
    const entry = largeRequests.shift()!;
    activeLargeRequests++;
    void Promise.resolve().then(() => getExtensionApi().runtime.sendMessage(entry.request))
      .then(value => complete(entry, value), entry.reject).finally(() => {
        activeLargeRequests--; dispatchLarge();
      });
  }
}

function dispatchBatches(): void {
  while (activeBatches < 2 && (smallRequests.length || subtitleRequests.length)) {
    const entries: PendingTransform[] = [];
    let characters = 0;
    // A batch response arrives only after all entries have finished. Keep
    // captions in their own batch so ordinary text cannot hold their result.
    const queue = subtitleRequests.length ? subtitleRequests : smallRequests;
    while (queue.length && entries.length < maximumLocalTransformBatchSize) {
      const next = queue[0]!;
      if (entries.length && characters + next.request.input.length > maximumLocalTransformBatchCharacters) break;
      entries.push(queue.shift()!); characters += next.request.input.length;
    }
    const request = packLocalTransformBatch(entries.map(entry => entry.request));
    activeBatches++;
    void Promise.resolve().then(() => getExtensionApi().runtime.sendMessage(request)).then(values => {
      if (!Array.isArray(values) || values.length !== entries.length) {
        for (const entry of entries) entry.reject(new Error("Ungültige lokale Batchantwort."));
        return;
      }
      entries.forEach((entry, index) => complete(entry, values[index]));
    }, error => entries.forEach(entry => entry.reject(error))).finally(() => {
      activeBatches--; dispatchBatches();
    });
  }
}

export function transformTextLocally(input: string,
  options: TransformOptions, subtitle = false): Promise<DetailedTransformResult> {
  return new Promise((resolve, reject) => {
    const entry = {request: requestFor(input, options), resolve, reject};
    if (input.length >= largeLocalTransformThreshold) {
      largeRequests.push(entry); dispatchLarge(); return;
    }
    (subtitle ? subtitleRequests : smallRequests).push(entry);
    // Coalesce cues from the same turn in their own batch, without the regular
    // text batching window. The shared concurrency limit still applies.
    if (subtitle && !subtitleDispatchScheduled) {
      subtitleDispatchScheduled = true;
      queueMicrotask(() => {
        subtitleDispatchScheduled = false;
        if (batchTimer !== undefined) {
          clearTimeout(batchTimer);
          batchTimer = undefined;
        }
        dispatchBatches();
      });
    }
    // The DOM processor reserves one of its 32 requests for captions when
    // subtitles are enabled. Send its 31-request ordinary window without
    // waiting for a request that cannot enter. Same-turn packing still accepts
    // 32 entries, and caption priority and the two-batch limit remain intact.
    if (!subtitle && smallRequests.length >= maximumLocalTransformBatchSize - 1 &&
        !fullBatchDispatchScheduled && !subtitleDispatchScheduled) {
      fullBatchDispatchScheduled = true;
      queueMicrotask(() => {
        fullBatchDispatchScheduled = false;
        if (batchTimer !== undefined) {
          clearTimeout(batchTimer);
          batchTimer = undefined;
        }
        dispatchBatches();
      });
    }
    if (batchTimer !== undefined || subtitleDispatchScheduled || fullBatchDispatchScheduled) return;
    batchTimer = setTimeout(() => {batchTimer = undefined; dispatchBatches();}, 8);
  });
}
