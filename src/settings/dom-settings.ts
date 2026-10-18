import type { Settings } from "./defaults";

// Listing every setting makes additions require an explicit decision about
// whether they alter content processing.
const kinds: Record<keyof Settings, "scalar" | "list" | "custom" | "ignored"> = {
  settingsRevision: "ignored",
  enabled: "scalar",
  excludedDomains: "list",
  domainListMode: "scalar",
  enabledRuleGroupIds: "list",
  protectedTerms: "list",
  customReplacements: "custom",
  processAccessibleAttributes: "scalar",
  processQuotedText: "scalar",
  processSubtitles: "scalar",
  syncCategoryIds: "ignored",
  visiblePopupSectionIds: "ignored"
};

export function sameDomSettings(previous: Settings | undefined, next: Settings): boolean {
  if (!previous) return false;
  for (const key of Object.keys(kinds) as (keyof Settings)[]) {
    switch (kinds[key]) {
      case "ignored": break;
      case "scalar":
        if (previous[key] !== next[key]) return false;
        break;
      case "list": {
        const before = previous[key] as readonly string[];
        const after = next[key] as readonly string[];
        if (before.length !== after.length || before.some((value, index) => value !== after[index])) return false;
        break;
      }
      case "custom":
        if (previous.customReplacements.length !== next.customReplacements.length ||
            previous.customReplacements.some((value, index) =>
              value.source !== next.customReplacements[index]?.source ||
              value.replacement !== next.customReplacements[index]?.replacement)) return false;
        break;
    }
  }
  return true;
}

export function snapshotDomSettings(settings: Settings): Settings {
  return {...settings, excludedDomains: [...settings.excludedDomains],
    enabledRuleGroupIds: [...settings.enabledRuleGroupIds], protectedTerms: [...settings.protectedTerms],
    customReplacements: settings.customReplacements.map(value => ({...value}))};
}
