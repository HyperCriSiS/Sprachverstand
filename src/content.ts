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

function applySettings(settings: Settings): void {
  if (!shouldRun(settings)) {
    processor?.stop();
    processor = undefined;
    return;
  }

  const options = {
    rules: defaultRules,
    profile: settings.profile,
    disabledRuleIds: new Set(settings.disabledRuleIds)
  } as const;

  if (processor) {
    processor.updateOptions(options);
    return;
  }

  processor = new DomProcessor(document, options);
  processor.start();
}

async function start(): Promise<void> {
  applySettings(await loadSettings());
  subscribeToSettings(applySettings);
}

void start().catch((error: unknown) => {
  console.error("Sprachverstand konnte nicht gestartet werden.", error);
});

