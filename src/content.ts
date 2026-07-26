import { getExtensionApi } from "./browser/api";
import { DomProcessor } from "./core/dom-processor";
import { defaultRules } from "./rules";
import { isDomainExcluded } from "./settings/domain";
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
    !isDomainExcluded(location.hostname, settings.excludedDomains)
  );
}

function reportReplacementCount(count: number): void {
  void getExtensionApi()
    .runtime.sendMessage({
      type: "sprachverstand.replacement-count",
      count
    })
    .catch(() => {
      // The background context can be unavailable briefly during extension reloads.
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
    profile: settings.profile,
    disabledRuleIds: new Set(settings.disabledRuleIds),
    onReplacementCountChange: reportReplacementCount
  } as const;

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
