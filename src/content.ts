import { getExtensionApi } from "./browser/api";
import { DomProcessor } from "./core/dom-processor";
import { defaultRules } from "./rules";
import { disabledRuleIdsForGroups } from "./rules/catalog";
import { shouldProcessDomain } from "./settings/domain";
import type { Settings } from "./settings/defaults";
import {
  loadSettings,
  subscribeToSettings
} from "./settings/storage";

let processor: DomProcessor | undefined;

function shouldRun(settings: Settings): boolean {
  return (
    settings.enabled &&
    defaultRules.length > 0 &&
    shouldProcessDomain(
      location.hostname,
      settings.excludedDomains,
      settings.domainListMode
    )
  );
}

function reportReplacementCount(count: number): void {
  void getExtensionApi()
    .runtime.sendMessage({
      type: "sprachverstand.replacement-count",
      hostname: location.hostname,
      count
    })
    .catch(() => {
      // Der Hintergrundkontext kann während eines Erweiterungs-Reloads kurz fehlen.
    });
}

function applySettings(settings: Settings): void {
  if (!shouldRun(settings)) {
    processor?.stop({ restore: true });
    processor = undefined;
    reportReplacementCount(0);
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
    onReplacementCountChange: reportReplacementCount
  };

  if (processor) {
    processor.updateOptions(options);
    return;
  }

  processor = new DomProcessor(document, options);
  processor.start();
}

async function start(): Promise<void> {
  reportReplacementCount(0);
  applySettings(await loadSettings());
  subscribeToSettings(applySettings);
}

void start().catch((error: unknown) => {
  console.error("Sprachverstand konnte nicht gestartet werden.", error);
});
