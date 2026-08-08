import { DomProcessor } from "../core/dom-processor";
import { defaultRules } from "../rules";
import { disabledRuleIdsForGroups } from "../rules/catalog";
import type { Settings } from "../settings/defaults";

interface PaleMoonContentRuntime {
  apply(settings: Settings): void;
  stop(restore?: boolean): void;
  getReplacementCount(): number;
}

type PaleMoonContentGlobal = typeof globalThis & {
  SprachverstandPaleMoonContent?: PaleMoonContentRuntime;
  __sprachverstandReportCount?: (count: number) => void;
};

const runtimeGlobal = globalThis as PaleMoonContentGlobal;
let processor: DomProcessor | undefined;

function reportReplacementCount(count: number): void {
  runtimeGlobal.__sprachverstandReportCount?.(count);
}

function optionsFor(settings: Settings) {
  return {
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
}

const runtime: PaleMoonContentRuntime = {
  apply(settings) {
    const options = optionsFor(settings);

    if (processor) {
      processor.updateOptions(options);
      return;
    }

    processor = new DomProcessor(document, options);
    processor.start();
  },

  stop(restore = true) {
    processor?.stop({ restore });
    processor = undefined;
    reportReplacementCount(0);
  },

  getReplacementCount() {
    return processor?.getReplacementCount() ?? 0;
  }
};

runtimeGlobal.SprachverstandPaleMoonContent = runtime;
