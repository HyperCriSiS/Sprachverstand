import { expect, it } from "vitest";
import { defaultSettings, type Settings } from "../src/settings/defaults";
import { sameDomSettings, snapshotDomSettings } from "../src/settings/dom-settings";

it.each<Partial<Settings>>([
  {enabled: false}, {excludedDomains: ["example.test"]}, {domainListMode: "include"},
  {enabledRuleGroupIds: []}, {protectedTerms: ["Nutzer:innen"]},
  {customReplacements: [{source: "Person", replacement: "Mensch"}]},
  {processAccessibleAttributes: false}, {processQuotedText: false}, {processSubtitles: true}
])("detects every processing setting change: %j", (change) => {
  expect(sameDomSettings(defaultSettings, {...defaultSettings, ...change})).toBe(false);
});

it("ignores storage revision, synchronization and popup presentation", () => {
  expect(sameDomSettings(defaultSettings, {...defaultSettings,
    settingsRevision: 999, syncCategoryIds: ["activation"], visiblePopupSectionIds: []})).toBe(true);
  expect(sameDomSettings(undefined, defaultSettings)).toBe(false);
});

it("preserves list order and every custom replacement field", () => {
  const settings = {...defaultSettings, protectedTerms: ["A", "B"],
    customReplacements: [{source: "A", replacement: "B"}]};
  expect(sameDomSettings(settings, {...settings, protectedTerms: ["B", "A"]})).toBe(false);
  expect(sameDomSettings(settings, {...settings,
    customReplacements: [{source: "A", replacement: "C"}]})).toBe(false);
  expect(sameDomSettings(settings, {...settings,
    customReplacements: [{source: "C", replacement: "B"}]})).toBe(false);
});

it("retains a snapshot when the incoming lists or entries are subsequently mutated", () => {
  const incoming = {...defaultSettings, excludedDomains: ["a.test"],
    enabledRuleGroupIds: ["plural-separators"], protectedTerms: ["A"],
    customReplacements: [{source: "A", replacement: "B"}]};
  const snapshot = snapshotDomSettings(incoming);
  expect(sameDomSettings(snapshot, incoming)).toBe(true);
  incoming.excludedDomains.push("b.test");
  incoming.enabledRuleGroupIds.push("plural-binnen-i");
  incoming.protectedTerms.push("B");
  incoming.customReplacements[0]!.replacement = "C";
  expect(snapshot.excludedDomains).toEqual(["a.test"]);
  expect(snapshot.enabledRuleGroupIds).toEqual(["plural-separators"]);
  expect(snapshot.protectedTerms).toEqual(["A"]);
  expect(snapshot.customReplacements).toEqual([{source: "A", replacement: "B"}]);
  expect(sameDomSettings(snapshot, incoming)).toBe(false);
});
