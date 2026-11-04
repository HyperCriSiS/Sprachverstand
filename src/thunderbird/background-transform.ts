import type {ExtensionApi} from "../browser/api";
import {isLocalTransformRequest, isLocalTransformBatchRequest, type LocalTransformRequest} from "../core/local-transform-message";
import {expandSharedLocalTransformBatch} from "../core/shared-local-transform-batch";
import {transformTextWithSummary} from "../core/transform-text";
import {aggregateReplacementSummaries} from "../core/replacement-summary";
import {defaultRules} from "../rules";

export function connectBackgroundTransform(api: ExtensionApi): void {
  function transform(request: LocalTransformRequest) {
    const {disabledRuleIds, ...options} = request.options;
    const result = transformTextWithSummary(request.input, defaultRules, {
      ...options, ...(disabledRuleIds ? {disabledRuleIds: new Set(disabledRuleIds)} : {})
    });
    return {...result, summaries: aggregateReplacementSummaries(result.summaries)};
  }
  api.runtime.onMessage.addListener((message, sender) => {
    if (sender.tab?.id === undefined) return undefined;
    const batch = isLocalTransformBatchRequest(message) ? message : expandSharedLocalTransformBatch(message);
    if (batch) return Promise.resolve(batch.requests.map(transform));
    if (isLocalTransformRequest(message)) return Promise.resolve(transform(message));
    return undefined;
  });
}
