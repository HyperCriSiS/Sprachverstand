import { getExtensionApi } from "./browser/api";
import { DomProcessor } from "./core/dom-processor";
import { defaultRules } from "./rules";
import { disabledRuleIdsForGroups } from "./rules/catalog";
import { isDomainExcluded } from "./settings/domain";
import type { Settings } from "./settings/defaults";
import {
  loadSettingsWithRetry,
  subscribeToSettings
} from "./settings/storage";

let processor: DomProcessor | undefined;

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

function shouldRun(settings: Settings): boolean {
  return (
    settings.enabled &&
    defaultRules.length > 0 &&
    !isDomainExcluded(location.hostname, settings.excludedDomains)
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
      count,
      replacements
    })
    .catch(() => {
      // Der Hintergrundkontext kann während eines Erweiterungs-Reloads kurz fehlen.
    });
}

function applySettings(settings: Settings): void {
  if (!shouldRun(settings)) {
    processor?.stop({ restore: true });
    processor = undefined;
    reportReplacementState(0);
    return;
  }

  const options = {
    rules: defaultRules,
    profile: "aggressive" as const,
    disabledRuleIds: disabledRuleIdsForGroups(settings.enabledRuleGroupIds),
    protectedTerms: settings.protectedTerms,
    customReplacements: settings.customReplacements,
    processAccessibleAttributes: settings.processAccessibleAttributes,
    processQuotedText: settings.processQuotedText,
    processSubtitles: settings.processSubtitles,
    onReplacementCountChange: reportReplacementState
  };

  if (processor) {
    processor.updateOptions(options);
    return;
  }

  processor = new DomProcessor(document, options);
  processor.start();
}

async function start(): Promise<void> {
  reportReplacementState(0);
  applySettings(await loadSettingsWithRetry());
  subscribeToSettings(applySettings);
}

getExtensionApi().runtime.onMessage.addListener((message) => {
  if (!isGetCurrentReplacementStateMessage(message)) {
    return undefined;
  }

  return {
    count: processor?.getReplacementCount() ?? 0,
    replacements: processor?.getReplacementSummary() ?? []
  };
});

void start().catch((error: unknown) => {
  console.error("Sprachverstand konnte nicht gestartet werden.", error);
});
