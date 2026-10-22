import { PaleMoonDomProcessor } from "./dom-processor";
import type { DetailedTransformResult, TransformOptions } from "../core/transform-text";
import { disabledRuleIdsForGroups } from "../rules/catalog";
import { domRuleMetadata } from "../rules/dom-metadata";
import { isBuiltInTransformCandidate } from "../rules/transform-candidate";
import type { Settings } from "../settings/defaults";
import type { ReplacementSummaryEntry } from "../core/replacement-summary";

interface PaleMoonContentRuntime {
  apply(settings: Settings): void;
  stop(restore?: boolean): void;
  getReplacementCount(): number;
  getReplacementSummary(): readonly ReplacementSummaryEntry[];
}

type PaleMoonContentGlobal = typeof globalThis & {
  SprachverstandPaleMoonContent?: PaleMoonContentRuntime;
  // Exported by the controller once per window: rules and lexicon are built
  // there a single time instead of being loaded into every page sandbox.
  __sprachverstandTransform?: (input: string, options: string) => string;
  __sprachverstandReplacementCount?: number;
};

const runtimeGlobal = globalThis as PaleMoonContentGlobal;
let processor: PaleMoonDomProcessor | undefined;

function reportReplacementCount(count: number): void {
  runtimeGlobal.__sprachverstandReplacementCount = Math.max(
    0,
    Math.trunc(count)
  );
}

function transformViaController(
  input: string,
  options: TransformOptions
): Promise<DetailedTransformResult> {
  const transform = runtimeGlobal.__sprachverstandTransform;
  if (!transform) {
    return Promise.reject(new Error("Pale-Moon-Regelmodul nicht verfügbar."));
  }
  const { disabledRuleIds, ...plainOptions } = options;
  try {
    return Promise.resolve(JSON.parse(transform(input, JSON.stringify({
      ...plainOptions,
      ...(disabledRuleIds ? { disabledRuleIds: [...disabledRuleIds] } : {})
    }))) as DetailedTransformResult);
  } catch (error) {
    return Promise.reject(error);
  }
}

function optionsFor(settings: Settings) {
  return {
    rules: domRuleMetadata,
    transformText: transformViaController,
    isTransformCandidate: isBuiltInTransformCandidate,
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
      reportReplacementCount(processor.getReplacementCount());
      return;
    }

    processor = new PaleMoonDomProcessor(document, options);
    processor.start();
    reportReplacementCount(processor.getReplacementCount());
  },

  stop(restore = true) {
    processor?.stop({ restore });
    processor = undefined;
    reportReplacementCount(0);
  },

  getReplacementCount() {
    return processor?.getReplacementCount() ?? 0;
  },

  getReplacementSummary() {
    return processor?.getReplacementSummary() ?? [];
  }
};

runtimeGlobal.SprachverstandPaleMoonContent = runtime;
runtimeGlobal.__sprachverstandReplacementCount = 0;
