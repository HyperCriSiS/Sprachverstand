import { getExtensionApi } from "./browser/api";
import {transformTextLocally} from "./browser/local-transform";
import { DomProcessor } from "./core/dom-processor";
import {domRuleMetadata} from "./rules/dom-metadata";
import {isBuiltInTransformCandidate} from "./rules/transform-candidate";
import {maximumReportedReplacementSummaries} from "./core/replacement-summary";
import { disabledRuleIdsForGroups } from "./rules/catalog";
import { shouldProcessDomain } from "./settings/domain";
import type { Settings } from "./settings/defaults";
import { subscribeToSettings } from "./settings/storage";
import {sameDomSettings, snapshotDomSettings} from "./settings/dom-settings";

let processor: DomProcessor | undefined;
let settingsTransition: Promise<void> = Promise.resolve();
let settingsGeneration = 0;
let requestedSettings: Settings | undefined;

interface GetCurrentReplacementStateMessage {
  readonly type: "sprachverstand.get-current-replacement-state";
}

function isGetCurrentReplacementStateMessage(
  message: unknown
): message is GetCurrentReplacementStateMessage {
  return (
    Boolean(message) &&
    typeof message === "object" &&
    (message as Partial<GetCurrentReplacementStateMessage>).type ===
      "sprachverstand.get-current-replacement-state"
  );
}

function shouldRun(settings: Settings, disabledRuleIds: ReadonlySet<string>): boolean {
  return (
    settings.enabled &&
    (settings.customReplacements.length > 0 ||
      domRuleMetadata.some(rule => !disabledRuleIds.has(rule.id))) &&
    shouldProcessDomain(
      location.hostname,
      settings.excludedDomains,
      settings.domainListMode
    )
  );
}

function reportReplacementState(
  count: number,
  replacements: readonly {
    readonly original: string;
    readonly replacement: string;
    readonly count: number;
  }[] = []
): void {
  void getExtensionApi()
    .runtime.sendMessage({
      type: "sprachverstand.replacement-state",
      hostname: location.hostname,
      count,
      replacements: replacements.slice(0, maximumReportedReplacementSummaries)
    })
    .catch(() => {
      // Der Hintergrundkontext kann während eines Erweiterungs-Reloads kurz fehlen.
    });
}

function applySettings(settings: Settings): Promise<void> {
  if (sameDomSettings(requestedSettings, settings)) return settingsTransition;
  requestedSettings = snapshotDomSettings(settings);
  const generation = ++settingsGeneration;
  settingsTransition = settingsTransition.catch(() => undefined).then(async () => {
    if (generation !== settingsGeneration) return;
    if (processor) {
      const previous = processor;
      processor = undefined;
      await previous.stopBudgeted();
    }
    if (generation !== settingsGeneration) return;
    const disabledRuleIds = disabledRuleIdsForGroups(settings.enabledRuleGroupIds);
    if (!shouldRun(settings, disabledRuleIds)) {
      reportReplacementState(0);
      return;
    }

    processor = new DomProcessor(document, {
      transformText: transformTextLocally,
      isTransformCandidate: isBuiltInTransformCandidate,
      replacementNotificationIntervalMs: 100,
      replacementSummaryLimit: maximumReportedReplacementSummaries,
      rules: domRuleMetadata,
      profile: "aggressive",
      disabledRuleIds,
      protectedTerms: settings.protectedTerms,
      customReplacements: settings.customReplacements,
      processAccessibleAttributes: settings.processAccessibleAttributes,
      processQuotedText: settings.processQuotedText,
      processSubtitles: settings.processSubtitles,
      onReplacementCountChange: reportReplacementState
    });
    processor.start();
  }).catch((error: unknown) => {
    if (generation === settingsGeneration) requestedSettings = undefined;
    throw error;
  });
  return settingsTransition;
}

async function start(): Promise<void> {
  reportReplacementState(0);
  subscribeToSettings(applySettings, { initial: true });
}

getExtensionApi().runtime.onMessage.addListener((message) => {
  if (!isGetCurrentReplacementStateMessage(message)) {
    return undefined;
  }

  return {
    hostname: location.hostname,
    count: processor?.getReplacementCount() ?? 0,
    replacements: processor?.getReplacementSummary(maximumReportedReplacementSummaries).slice(0, maximumReportedReplacementSummaries) ?? []
  };
});

void start().catch((error: unknown) => {
  console.error("Sprachverstand konnte nicht gestartet werden.", error);
});
