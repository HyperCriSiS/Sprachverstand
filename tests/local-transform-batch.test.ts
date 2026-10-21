import {afterEach, expect, it, vi} from "vitest";
import {isLocalTransformBatchRequest, isLocalTransformRequest} from "../src/core/local-transform-message";
import {transformTextLocally} from "../src/browser/local-transform";
import {transformTextWithSummary} from "../src/core/transform-text";
import {defaultRules} from "../src/rules";
import {domRuleMetadata} from "../src/rules/dom-metadata";

afterEach(() => {vi.useRealTimers(); vi.unstubAllGlobals();});
it("returns a caption response without waiting for a coalesced ordinary response", async () => {
  vi.useFakeTimers();
  let finishNormal!: () => void;
  const sendMessage = vi.fn((message: {requests: {input: string}[]}) => {
    const values = message.requests.map(entry => ({text: entry.input, replacements: 0, summaries: []}));
    return message.requests.some(entry => entry.input === "normal")
      ? new Promise(resolve => {finishNormal = () => resolve(values);}) : Promise.resolve(values);
  });
  vi.stubGlobal("browser", {runtime: {sendMessage}});
  const normal = transformTextLocally("normal", {profile: "aggressive"});
  let captionReady = false;
  const caption = transformTextLocally("caption", {profile: "aggressive"}, true)
    .then(value => {captionReady = true; return value;});
  await vi.advanceTimersByTimeAsync(0);
  try {expect(captionReady).toBe(true);} finally {
    finishNormal(); await Promise.all([normal, caption]);
  }
});
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
  await vi.advanceTimersByTimeAsync(0);
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
it("prioritizes a separate caption batch without changing callers' response order", async () => {
  vi.useFakeTimers();
  const sendMessage = vi.fn(async (message: {requests: {input: string}[]}) => message.requests.map(entry => ({text: entry.input, replacements: 0, summaries: []})));
  vi.stubGlobal("browser", {runtime: {sendMessage}});
  const pending = [transformTextLocally("normal", {profile: "aggressive"}),
    transformTextLocally("caption", {profile: "aggressive"}, true),
    transformTextLocally("other", {profile: "aggressive"})];
  await vi.advanceTimersByTimeAsync(8);
  expect(sendMessage.mock.calls[0]![0].requests.map(entry => entry.input)).toEqual(["caption"]);
  expect(sendMessage.mock.calls[1]![0].requests.map(entry => entry.input)).toEqual(["normal", "other"]);
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

it("dispatches fresh captions without the regular eight-millisecond wait and coalesces the same turn", async () => {
  vi.useFakeTimers();
  const sendMessage = vi.fn(async (message: {requests: {input: string}[]}) =>
    message.requests.map(entry => ({text: entry.input, replacements: 0, summaries: []})));
  vi.stubGlobal("browser", {runtime: {sendMessage}});
  const pending = [transformTextLocally("first caption", {profile: "aggressive"}, true),
    transformTextLocally("second caption", {profile: "aggressive"}, true)];
  await vi.advanceTimersByTimeAsync(0);
  expect(sendMessage).toHaveBeenCalledOnce();
  expect(sendMessage.mock.calls[0]![0].requests.map(entry => entry.input))
    .toEqual(["first caption", "second caption"]);
  await Promise.all(pending);
});

it("lets captions interrupt a pending regular batch timer without duplicate dispatch", async () => {
  vi.useFakeTimers();
  const sendMessage = vi.fn(async (message: {requests: {input: string}[]}) =>
    message.requests.map(entry => ({text: entry.input, replacements: 0, summaries: []})));
  vi.stubGlobal("browser", {runtime: {sendMessage}});
  const normal = transformTextLocally("normal", {profile: "aggressive"});
  await vi.advanceTimersByTimeAsync(3);
  expect(sendMessage).not.toHaveBeenCalled();
  const caption = transformTextLocally("caption", {profile: "aggressive"}, true);
  await vi.advanceTimersByTimeAsync(0);
  expect(sendMessage.mock.calls[0]![0].requests.map(entry => entry.input)).toEqual(["caption"]);
  expect(sendMessage.mock.calls[1]![0].requests.map(entry => entry.input)).toEqual(["normal"]);
  await Promise.all([normal, caption]);
  await vi.advanceTimersByTimeAsync(10);
  expect(sendMessage).toHaveBeenCalledTimes(2);
});

it("keeps caption dispatch bounded while both batch slots are occupied", async () => {
  vi.useFakeTimers();
  const sent: {inputs: string[]; resolve: (value: unknown) => void}[] = [];
  vi.stubGlobal("browser", {runtime: {sendMessage: (message: {requests: {input: string}[]}) =>
    new Promise(resolve => sent.push({inputs: message.requests.map(entry => entry.input), resolve}))}});
  const normal = Array.from({length: 65}, (_, index) =>
    transformTextLocally(String(index), {profile: "aggressive"}));
  await vi.advanceTimersByTimeAsync(8);
  const caption = transformTextLocally("caption", {profile: "aggressive"}, true);
  await vi.advanceTimersByTimeAsync(0);
  expect(sent).toHaveLength(2);
  const reply = (index: number) => sent[index]!.resolve(sent[index]!.inputs.map(text =>
    ({text, replacements: 0, summaries: []})));
  reply(0);
  await vi.advanceTimersByTimeAsync(0);
  expect(sent).toHaveLength(3);
  expect(sent[2]!.inputs).toEqual(["caption"]);
  reply(1); reply(2);
  await vi.advanceTimersByTimeAsync(0);
  expect(sent[3]!.inputs).toEqual(["64"]);
  reply(3);
  expect((await caption).text).toBe("caption");
  expect(await Promise.all(normal)).toHaveLength(65);
});
