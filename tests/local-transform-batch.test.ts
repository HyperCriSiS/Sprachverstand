import {afterEach, expect, it, vi} from "vitest";
import {isLocalTransformBatchRequest, isLocalTransformRequest} from "../src/core/local-transform-message";
import {transformTextLocally} from "../src/browser/local-transform";
import {transformTextWithSummary} from "../src/core/transform-text";
import {defaultRules} from "../src/rules";
import {domRuleMetadata} from "../src/rules/dom-metadata";

afterEach(() => {vi.useRealTimers(); vi.unstubAllGlobals();});
const request = (input: string) => ({type: "sprachverstand.transform-large-text", input, options: {profile: "aggressive"}});
it("keeps lightweight DOM metadata equivalent to full rule metadata", () => {
  const metadata = (rules: typeof defaultRules) => rules.map(rule => ({id: rule.id, risk: rule.risk,
    context: Boolean(rule.applyWithLeadingContext), candidate: rule.leadingContextCandidate?.toString(),
    whitespace: rule.leadingContextRequiresTrailingWhitespace}));
  expect(metadata(domRuleMetadata)).toEqual(metadata(defaultRules));
});
it("validates batch sizes, aggregate characters and protected offsets", () => {
  const batch = (requests: unknown[]) => ({type: "sprachverstand.transform-text-batch", requests});
  expect(isLocalTransformBatchRequest(batch([request("Nutzer:innen")]))).toBe(true);
  expect(isLocalTransformBatchRequest(batch([]))).toBe(false);
  expect(isLocalTransformBatchRequest(batch(Array(33).fill(request("A"))))).toBe(false);
  expect(isLocalTransformBatchRequest(batch([request("A".repeat(8192))]))).toBe(false);
  expect(isLocalTransformBatchRequest(batch(Array(9).fill(request("A".repeat(8191)))))).toBe(false);
  for (const ranges of [[{start: -1, end: 2}], [{start: 0, end: 20}],
    [{start: 3, end: 4}, {start: 2, end: 3}], [{start: 1.5, end: 2}]]) {
    expect(isLocalTransformRequest({...request("Text"), options: {profile: "aggressive", protectedRanges: ranges}})).toBe(false);
  }
});
it("preserves protected inline spans while transforming surrounding text and summaries", () => {
  const input = "Nutzer:innen Nutzer:innen Nutzer:innen";
  const result = transformTextWithSummary(input, defaultRules, {profile: "aggressive", protectedRanges: [{start: 13, end: 25}]});
  expect(result.text).toBe("Nutzer Nutzer:innen Nutzer");
  expect(result.replacements).toBe(2);
  expect(result.summaries.reduce((sum, entry) => sum + entry.count, 0)).toBe(2);
});
it("coalesces small requests and preserves response order", async () => {
  vi.useFakeTimers();
  const sendMessage = vi.fn(async (message: {requests: {input: string}[]}) => message.requests.map(entry => ({text: entry.input + "!", replacements: 0, summaries: []})));
  vi.stubGlobal("browser", {runtime: {sendMessage}});
  const pending = [transformTextLocally("A", {profile: "aggressive"}), transformTextLocally("B", {profile: "standard"})];
  expect(sendMessage).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(8);
  expect((await Promise.all(pending)).map(entry => entry.text)).toEqual(["A!", "B!"]);
  expect(sendMessage).toHaveBeenCalledOnce();
});
it("rejects incomplete batch responses rather than applying mismatched results", async () => {
  vi.useFakeTimers();
  vi.stubGlobal("browser", {runtime: {sendMessage: vi.fn(async () => [])}});
  const pending = transformTextLocally("A", {profile: "aggressive"});
  const assertion = expect(pending).rejects.toThrow("Batchantwort");
  await vi.advanceTimersByTimeAsync(8); await assertion;
});
it("prioritizes captions inside a batch without changing callers' response order", async () => {
  vi.useFakeTimers();
  const sendMessage = vi.fn(async (message: {requests: {input: string}[]}) => message.requests.map(entry => ({text: entry.input, replacements: 0, summaries: []})));
  vi.stubGlobal("browser", {runtime: {sendMessage}});
  const pending = [transformTextLocally("normal", {profile: "aggressive"}),
    transformTextLocally("caption", {profile: "aggressive"}, true),
    transformTextLocally("other", {profile: "aggressive"})];
  await vi.advanceTimersByTimeAsync(8);
  expect(sendMessage.mock.calls[0]![0].requests.map(entry => entry.input)).toEqual(["caption", "normal", "other"]);
  expect((await Promise.all(pending)).map(entry => entry.text)).toEqual(["normal", "caption", "other"]);
});
it("bounds simultaneous batches and drains queued requests after a reply", async () => {
  vi.useFakeTimers();
  const sent: {inputs: string[]; resolve: (value: unknown) => void}[] = [];
  const sendMessage = vi.fn((message: {requests: {input: string}[]}) => new Promise(resolve => {
    sent.push({inputs: message.requests.map(entry => entry.input), resolve});
  }));
  vi.stubGlobal("browser", {runtime: {sendMessage}});
  const pending = Array.from({length: 65}, (_, index) => transformTextLocally(String(index), {profile: "aggressive"}));
  await vi.advanceTimersByTimeAsync(8); expect(sent.length).toBe(2);
  const reply = (index: number) => sent[index]!.resolve(sent[index]!.inputs.map(text => ({text, replacements: 0, summaries: []})));
  reply(0); await vi.advanceTimersByTimeAsync(0); expect(sent.length).toBe(3);
  expect(sent[2]!.inputs).toEqual(["64"]); reply(1); reply(2);
  expect((await Promise.all(pending)).map(entry => entry.text)).toEqual(Array.from({length: 65}, (_, index) => String(index)));
});
