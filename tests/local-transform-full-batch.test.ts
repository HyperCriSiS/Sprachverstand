import {afterEach, beforeEach, expect, it, vi} from "vitest";

interface Batch {readonly requests: readonly {readonly input: string}[];}
const options = {profile:"aggressive"} as const;
const values = (batch: Batch) => batch.requests.map(entry =>
  ({text:entry.input + "!", replacements:0, summaries:[]}));
beforeEach(() => {vi.resetModules(); vi.useFakeTimers();});
afterEach(() => {vi.useRealTimers(); vi.unstubAllGlobals();});

it("sends a full ordinary batch in the current turn without the collection delay", async () => {
  const sendMessage = vi.fn(async (message: Batch) => values(message));
  vi.stubGlobal("browser", {runtime:{sendMessage}});
  const {transformTextLocally} = await import("../src/browser/local-transform");
  const pending = Array.from({length:32}, (_,i) => transformTextLocally("text"+i,options));
  expect(sendMessage).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(0);
  expect(sendMessage).toHaveBeenCalledOnce();
  expect(sendMessage.mock.calls[0]![0].requests).toHaveLength(32);
  expect((await Promise.all(pending)).map(r => r.text))
    .toEqual(Array.from({length:32},(_,i) => "text"+i+"!"));
  expect(vi.getTimerCount()).toBe(0);
});

it("retains the collection window for a batch below capacity", async () => {
  const sendMessage = vi.fn(async (message: Batch) => values(message));
  vi.stubGlobal("browser", {runtime:{sendMessage}});
  const {transformTextLocally} = await import("../src/browser/local-transform");
  const pending = Array.from({length:31},(_,i) => transformTextLocally("small"+i,options));
  await vi.advanceTimersByTimeAsync(7);
  expect(sendMessage).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  await Promise.all(pending);
  expect(sendMessage).toHaveBeenCalledOnce();
  expect(sendMessage.mock.calls[0]![0].requests).toHaveLength(31);
});

it("keeps the aggregate character limit when a full request queue is dispatched early", async () => {
  const sendMessage = vi.fn(async (message: Batch) => values(message));
  vi.stubGlobal("browser", {runtime:{sendMessage}});
  const {transformTextLocally} = await import("../src/browser/local-transform");
  const pending = Array.from({length:32},() => transformTextLocally("A".repeat(8191),options));
  await vi.advanceTimersByTimeAsync(0); await Promise.all(pending);
  expect(sendMessage).toHaveBeenCalledTimes(4);
  for(const [message] of sendMessage.mock.calls){
    expect(message.requests).toHaveLength(8);
    expect(message.requests.reduce((n,r)=>n+r.input.length,0)).toBeLessThanOrEqual(65536);
  }
});

it("keeps two ordinary batches in flight and drains a queued full batch in order", async () => {
  const finish: (() => void)[] = [];
  const sendMessage = vi.fn((message: Batch) => new Promise(resolve => {
    finish.push(() => resolve(values(message)));
  }));
  vi.stubGlobal("browser", {runtime:{sendMessage}});
  const {transformTextLocally} = await import("../src/browser/local-transform");
  const pending = Array.from({length:96},(_,i) => transformTextLocally("busy"+i,options));
  await vi.advanceTimersByTimeAsync(0);
  expect(sendMessage).toHaveBeenCalledTimes(2);
  finish[0]!(); await vi.advanceTimersByTimeAsync(0);
  expect(sendMessage).toHaveBeenCalledTimes(3);
  finish[1]!(); finish[2]!(); await Promise.all(pending);
  expect(sendMessage.mock.calls.flatMap(([message]) => message.requests.map(r=>r.input)))
    .toEqual(Array.from({length:96},(_,i) => "busy"+i));
  expect(vi.getTimerCount()).toBe(0);
});

it("preserves a separate caption batch ahead of a full ordinary batch", async () => {
  const sendMessage = vi.fn(async (message: Batch) => values(message));
  vi.stubGlobal("browser", {runtime:{sendMessage}});
  const {transformTextLocally} = await import("../src/browser/local-transform");
  const pending = Array.from({length:32},(_,i) => transformTextLocally("normal"+i,options));
  pending.push(transformTextLocally("caption",options,true));
  await vi.advanceTimersByTimeAsync(0); await Promise.all(pending);
  expect(sendMessage.mock.calls[0]![0].requests.map(r=>r.input)).toEqual(["caption"]);
  expect(sendMessage.mock.calls[1]![0].requests).toHaveLength(32);
  await vi.advanceTimersByTimeAsync(8);
  expect(sendMessage).toHaveBeenCalledTimes(2);
});

it("recovers from an incomplete full response without stranding the next small batch", async () => {
  const sendMessage = vi.fn(async (message: Batch) => values(message))
    .mockResolvedValueOnce([]);
  vi.stubGlobal("browser", {runtime:{sendMessage}});
  const {transformTextLocally} = await import("../src/browser/local-transform");
  const pending = Array.from({length:32},(_,i) => transformTextLocally("invalid"+i,options));
  const assertions = pending.map(p => expect(p).rejects.toThrow("Batchantwort"));
  await vi.advanceTimersByTimeAsync(0); await Promise.all(assertions);
  const next = transformTextLocally("next",options);
  await vi.advanceTimersByTimeAsync(0);
  expect(sendMessage).toHaveBeenCalledOnce();
  await vi.advanceTimersByTimeAsync(8);
  expect((await next).text).toBe("next!");
  expect(sendMessage).toHaveBeenCalledTimes(2);
});
