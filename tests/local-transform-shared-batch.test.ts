import {afterEach, expect, it, vi} from "vitest";
import {transformTextLocally} from "../src/browser/local-transform";

afterEach(() => {vi.useRealTimers(); vi.unstubAllGlobals();});

it("does not repeat large shared settings for every short text in a batch", async () => {
  vi.useFakeTimers();
  const sendMessage = vi.fn(async (message: {requests: readonly {input: string}[]}) =>
    message.requests.map(request => ({text: request.input, replacements: 0, summaries: []})));
  vi.stubGlobal("browser", {runtime: {sendMessage}});
  const options = {profile: "aggressive" as const,
    protectedTerms: Array.from({length: 100}, (_, i) => "Schutz" + i + "x".repeat(70)),
    customReplacements: Array.from({length: 100}, (_, i) => ({source: "Q" + i + "x".repeat(115),
      replacement: "R" + i + "y".repeat(195)}))};
  const pending = Array.from({length: 32}, (_, i) => transformTextLocally("Nutzer:innen " + i, options));
  await vi.advanceTimersByTimeAsync(8);
  await Promise.all(pending);
  expect(sendMessage).toHaveBeenCalledOnce();
  expect(JSON.stringify(sendMessage.mock.calls[0]?.[0]).length).toBeLessThan(60_000);
});
