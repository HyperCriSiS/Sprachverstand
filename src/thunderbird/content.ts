import {DomProcessor} from "../core/dom-processor";
import {transformTextLocally} from "../browser/local-transform";
import {domRuleMetadata} from "../rules/dom-metadata";
import {isBuiltInTransformCandidate} from "../rules/transform-candidate";
import {disabledRuleIdsForGroups} from "../rules/catalog";
import {subscribeToSettings} from "../settings/storage";
import {sameDomSettings, snapshotDomSettings} from "../settings/dom-settings";
import type {Settings} from "../settings/defaults";
import {getExtensionApi} from "../browser/api";
import {maximumReportedReplacementSummaries, type ReplacementSummaryEntry} from "../core/replacement-summary";

let processor: DomProcessor | undefined;
let requested: Settings | undefined;
let generation = 0;
let transition = Promise.resolve();
const api = getExtensionApi();

function reportState(count: number, replacements: readonly ReplacementSummaryEntry[] = []): void {
  void api.runtime.sendMessage({type: "sprachverstand.replacement-state", count,
    replacements: replacements.slice(0, maximumReportedReplacementSummaries)})
    .catch(() => undefined);
}

const onMessage: Parameters<typeof api.runtime.onMessage.addListener>[0] = message => {
  if (!message || typeof message !== "object" ||
      (message as {type?: unknown}).type !== "sprachverstand.get-current-replacement-state") return undefined;
  return Promise.resolve({hostname: "", count: processor?.getReplacementCount() ?? 0,
    replacements: processor?.getReplacementSummary(maximumReportedReplacementSummaries) ?? []});
};
api.runtime.onMessage.addListener(onMessage);

function applySettings(settings: Settings): Promise<void> {
  if (sameDomSettings(requested, settings)) return transition;
  requested = snapshotDomSettings(settings);
  const current = ++generation;
  transition = transition.catch(() => undefined).then(async () => {
    if (current !== generation) return;
    const previous = processor;
    processor = undefined;
    await previous?.stopBudgeted();
    if (current !== generation) return;
    reportState(0);
    if (!settings.enabled) return;
    processor = new DomProcessor(document, {
      textTransformConcurrency: 128,
      // Share the already initialized local background engine between mails.
      transformText: transformTextLocally,
      isTransformCandidate: isBuiltInTransformCandidate,
      rules: domRuleMetadata,
      profile: "aggressive",
      disabledRuleIds: disabledRuleIdsForGroups(settings.enabledRuleGroupIds),
      protectedTerms: settings.protectedTerms,
      customReplacements: settings.customReplacements,
      processQuotedText: settings.processQuotedText,
      processAccessibleAttributes: settings.processAccessibleAttributes,
      processSubtitles: false,
      replacementSummaryLimit: maximumReportedReplacementSummaries,
      replacementNotificationIntervalMs: 100,
      onReplacementCountChange: reportState
    });
    processor.start();
  }).catch((error: unknown) => {
    if (current === generation) requested = undefined;
    throw error;
  });
  return transition;
}

const unsubscribe = subscribeToSettings(applySettings, {initial: true});
window.addEventListener("pagehide", () => {
  ++generation;
  unsubscribe();
  api.runtime.onMessage.removeListener(onMessage);
  processor?.stop();
  processor = undefined;
}, {once: true});
