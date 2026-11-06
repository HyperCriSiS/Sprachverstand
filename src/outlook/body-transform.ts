import {DomProcessor} from "../core/dom-processor";
import {transformTextWithSummary} from "../core/transform-text";
import {aggregateReplacementSummaries, maximumReportedReplacementSummaries,
  type ReplacementSummaryEntry} from "../core/replacement-summary";
import {defaultRules} from "../rules";
import {disabledRuleIdsForGroups} from "../rules/catalog";
import type {Settings} from "../settings/defaults";
import {transformHtmlWithoutDom} from "./html-text";

export interface BodyResult {
  readonly body: string;
  readonly count: number;
  readonly replacements: readonly ReplacementSummaryEntry[];
}

// Wandelt einen Nachrichtentext wie die Thunderbird-Ausgabe um: HTML in einer
// inerten Kopie über den DOM-Kern, ohne DOM (Ereignisse im klassischen
// Outlook) abschnittsweise, Nur-Text direkt über die Regel-Engine.
export function transformBody(body: string, html: boolean, settings: Settings): BodyResult {
  const options = {profile: "aggressive" as const,
    disabledRuleIds: disabledRuleIdsForGroups(settings.enabledRuleGroupIds),
    protectedTerms: settings.protectedTerms, customReplacements: settings.customReplacements,
    processQuotedText: settings.processQuotedText};
  const summarize = (summaries: readonly ReplacementSummaryEntry[]) =>
    aggregateReplacementSummaries(summaries).slice(0, maximumReportedReplacementSummaries);
  if (!html) {
    const result = transformTextWithSummary(body, defaultRules, options);
    return {body: result.text, count: result.replacements, replacements: summarize(result.summaries)};
  }
  if (typeof DOMParser === "undefined") {
    const result = transformHtmlWithoutDom(body, text => transformTextWithSummary(text, defaultRules, options));
    return {body: result.body, count: result.count, replacements: summarize(result.summaries)};
  }
  const doc = new DOMParser().parseFromString(body, "text/html");
  const processor = new DomProcessor(doc, {...options, rules: defaultRules,
    processAccessibleAttributes: settings.processAccessibleAttributes, processSubtitles: false});
  try {
    processor.start();
    processor.flush();
    const count = processor.getReplacementCount();
    return {body: count ? doc.documentElement.outerHTML : body, count,
      replacements: processor.getReplacementSummary(maximumReportedReplacementSummaries)};
  } finally {
    processor.stop({restore: false});
  }
}
