import {expect, it} from "vitest";
import {packLocalTransformBatch, expandSharedLocalTransformBatch} from "../src/core/shared-local-transform-batch";
import {isLocalTransformBatchRequest, type LocalTransformRequest} from "../src/core/local-transform-message";
import {transformTextWithSummary} from "../src/core/transform-text";
import {defaultRules} from "../src/rules";

const options = () => ({profile: "aggressive" as const, processQuotedText: false,
  protectedTerms: Array.from({length: 100}, (_, i) => "Schutz" + i + "x".repeat(70)),
  customReplacements: [{source: "Begriff", replacement: "Wort"}]});
const request = (input = "Nutzer:innen", extra: Partial<LocalTransformRequest["options"]> = {}): LocalTransformRequest =>
  ({type: "sprachverstand.transform-large-text", input, options: {...options(), ...extra}});
const wire = (value: unknown) => JSON.parse(JSON.stringify(value)) as unknown;

it("roundtrips separately created equal settings and per-text context through JSON", () => {
  const original = [request("Nutzer:innen", {leadingContext: "mit "}),
    request("Nutzer:innen", {protectedRanges: [{start: 0, end: 12}]}), request("Begriff")];
  const packed = packLocalTransformBatch(original);
  expect(packed.type).toBe("sprachverstand.transform-text-shared-batch");
  const expanded = expandSharedLocalTransformBatch(wire(packed));
  expect(expanded?.requests).toEqual(original);
  expect(isLocalTransformBatchRequest(expanded)).toBe(true);
  const results = expanded!.requests.map(entry => transformTextWithSummary(entry.input, defaultRules, {
    ...entry.options, disabledRuleIds: new Set(entry.options.disabledRuleIds)}));
  expect(results.map(result => result.text)).toEqual(["Nutzern", "Nutzer:innen", "Wort"]);
});

it.each<Partial<LocalTransformRequest["options"]>>([
  {profile: "standard"}, {processQuotedText: true}, {disabledRuleIds: ["plural.marked-dative-context"]},
  {protectedTerms: ["different"]}, {customReplacements: [{source: "Begriff", replacement: "anders"}]}
])("keeps different settings in the legacy representation: %j", (different) => {
  const original = [request(), request("Nutzer:innen", different)];
  const packed = packLocalTransformBatch(original);
  expect(packed).toEqual({type: "sprachverstand.transform-text-batch", requests: original});
});

it("keeps small, single and empty batches unchanged", () => {
  for (const requests of [[], [request()], [request("A", {protectedTerms: []}), request("B", {protectedTerms: []})]]) {
    expect(packLocalTransformBatch(requests).type).toBe("sprachverstand.transform-text-batch");
  }
});

it("preserves disabled-rule lists and list order", () => {
  const original = [request("A", {disabledRuleIds: ["a", "b"]}), request("B", {disabledRuleIds: ["a", "b"]})];
  expect(expandSharedLocalTransformBatch(wire(packLocalTransformBatch(original)))?.requests).toEqual(original);
  expect(packLocalTransformBatch([original[0]!, request("B", {disabledRuleIds: ["b", "a"]})]).type)
    .toBe("sprachverstand.transform-text-batch");
});

it("rejects unknown shared fields and entry overrides", () => {
  const valid = {type: "sprachverstand.transform-text-shared-batch", sharedOptions: {profile: "aggressive"},
    requests: [{input: "Nutzer:innen"}]};
  expect(expandSharedLocalTransformBatch(valid)).toBeDefined();
  for (const sharedOptions of [{profile: "aggressive", leadingContext: "mit "},
    {profile: "aggressive", protectedRanges: []}, {profile: "unknown"},
    {profile: "aggressive", protectedTerms: [42]}, {profile: "aggressive", customReplacements: [null]}]) {
    expect(expandSharedLocalTransformBatch({...valid, sharedOptions})).toBeUndefined();
  }
  for (const entry of [{input: "A", profile: "standard"}, {input: "A", options: {}}, [],
    {input: 42}, {input: "A", leadingContext: 42}, {input: "A", protectedRanges: [{start: 0, end: 2}]}]) {
    expect(expandSharedLocalTransformBatch({...valid, requests: [entry]})).toBeUndefined();
  }
});

it("retains request count, individual size and aggregate input limits", () => {
  const valid = {type: "sprachverstand.transform-text-shared-batch", sharedOptions: {profile: "aggressive"},
    requests: [{input: "A"}]};
  for (const requests of [[], Array(33).fill({input: "A"}), [{input: "A".repeat(8192)}],
    Array(9).fill({input: "A".repeat(8191)}), [null], Array(2)]) {
    expect(expandSharedLocalTransformBatch({...valid, requests})).toBeUndefined();
  }
});

it("does not accept inherited profile or input fields", () => {
  expect(expandSharedLocalTransformBatch({type: "sprachverstand.transform-text-shared-batch",
    sharedOptions: Object.create({profile: "aggressive"}), requests: [{input: "A"}]})).toBeUndefined();
  expect(expandSharedLocalTransformBatch({type: "sprachverstand.transform-text-shared-batch",
    sharedOptions: {profile: "aggressive"}, requests: [Object.create({input: "A"})]})).toBeUndefined();
});
