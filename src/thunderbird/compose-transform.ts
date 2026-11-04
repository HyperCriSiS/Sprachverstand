import {DomProcessor} from "../core/dom-processor";
import {transformText} from "../core/transform-text";
import {defaultRules} from "../rules";
import {disabledRuleIdsForGroups} from "../rules/catalog";
import type {Settings} from "../settings/defaults";
import type {ComposeDetails} from "./compose-api";

export function transformComposeBody(details: ComposeDetails, settings: Settings): {body?: string; plainTextBody?: string} | undefined {
  if (!settings.enabled || details.isModified || (details.type !== "reply" && details.type !== "forward")) return;
  const options = {profile: "aggressive" as const,
    disabledRuleIds: disabledRuleIdsForGroups(settings.enabledRuleGroupIds),
    protectedTerms: settings.protectedTerms, customReplacements: settings.customReplacements,
    processQuotedText: settings.processQuotedText};
  if (details.isPlainText === true) {
    if (typeof details.plainTextBody !== "string") return;
    const result = transformText(details.plainTextBody, defaultRules, options);
    return result.text === details.plainTextBody ? undefined : {plainTextBody: result.text};
  }
  if (details.isPlainText !== false || typeof details.body !== "string") return;
  // Parse an inert copy. Never run the display observer inside the live editor.
  const doc = new DOMParser().parseFromString(details.body, "text/html");
  const processor = new DomProcessor(doc, {...options, rules: defaultRules,
    processAccessibleAttributes: settings.processAccessibleAttributes, processSubtitles: false});
  try {
    processor.start();
    processor.flush();
    if (!processor.getReplacementCount()) return;
    return {body: doc.documentElement.outerHTML};
  } finally {
    processor.stop({restore: false});
  }
}
