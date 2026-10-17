import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {defaultRules} from "../src/rules";
import {isBuiltInTransformCandidate} from "../src/rules/transform-candidate";
import {transformTextWithSummary, type TransformOptions} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); document.body.replaceChildren();
});
async function settle() {for (let index = 0; index < 20; index++) await Promise.resolve();}
function fixture(near = false, following = false, nested = false) {
  const tasks: (() => void)[] = [];
  const postTask = vi.fn((work: () => unknown) => new Promise(resolve => {
    tasks.push(() => resolve(work()));
  }));
  vi.stubGlobal("scheduler", {postTask});
  const root = document.createElement("p");
  const lead = document.createTextNode(following ? "" : near ? "Neutraler Anfang " : "mit "); root.append(lead);
  const container = nested ? document.createElement("span") : root;
  if (nested) root.append(container);
  const target = document.createTextNode(following ? "Mitarbeitende" : "Nutzer:innen");
  if (following) root.prepend(target);
  for (let index = 0; index < 2200; index++) container.append(document.createElement("span"));
  const neighbor = document.createTextNode(following ? " Eltern" : "mit ");
  if (near || following) root.append(neighbor);
  if (!following) root.append(target);
  document.body.append(root);
  const transform = vi.fn(async (input: string, options: TransformOptions) =>
    transformTextWithSummary(input, defaultRules, options));
  processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive", processSubtitles: true,
    isTransformCandidate: isBuiltInTransformCandidate, transformText: transform});
  processor.start();
  const internal = processor as unknown as {now(): number; cancelRegularFlush(): void;
    pendingNodes: Set<Node>; processTextNode(node: Text, subtitle?: boolean, budgeted?: boolean): void};
  internal.cancelRegularFlush(); internal.pendingNodes.clear();
  vi.spyOn(internal, "now").mockReturnValue(0);
  internal.processTextNode(target, false, true);
  const drain = async () => {
    for (let index = 0; index < 100; index++) {
      await settle();
      const task = tasks.shift(); if (!task) break;
      task();
    }
    await settle();
  };
  return {root, lead, neighbor, target, transform, tasks, postTask, internal, drain};
}

it("yields large preceding context before sending a request and retains complete dative context", async () => {
  const {target, transform, tasks, drain} = fixture();
  await settle(); expect(transform).not.toHaveBeenCalled();
  // The canceled initial scan and one context slice cannot traverse all
  // neighbors or send an incomplete context to the transformation function.
  tasks.shift()!(); await settle(); tasks.shift()!(); await settle();
  expect(transform).not.toHaveBeenCalled(); expect(target.data).toBe("Nutzer:innen");
  await drain();
  expect(transform).toHaveBeenCalledWith("Nutzer:innen", expect.objectContaining({leadingContext: "mit "}), false);
  expect(target.data).toBe("Nutzern");
  processor!.stop({restore: true}); expect(target.data).toBe("Nutzer:innen");
});

it("slices a large preceding subtree as well as a long sibling list", async () => {
  const {target, transform, drain} = fixture(false, false, true);
  await settle(); expect(transform).not.toHaveBeenCalled();
  await drain(); expect(target.data).toBe("Nutzern");
});

it("drops context preparation after stopping before any transform request", async () => {
  const {target, transform, drain} = fixture();
  await settle(); const stopped = processor!.stopBudgeted();
  await drain(); await stopped;
  expect(transform).not.toHaveBeenCalled(); expect(target.data).toBe("Nutzer:innen");
});

it("preserves a foreign text change made during preparation", async () => {
  const {target, transform, drain} = fixture();
  await settle(); target.data = "Fremder aktueller Inhalt";
  await drain();
  expect(target.data).toBe("Fremder aktueller Inhalt"); expect(transform).not.toHaveBeenCalled();
});

it("releases a canceled context iterator before its queued request starts", async () => {
  const {target, transform, drain} = fixture();
  const internal = processor as unknown as {
    pendingContextPreparations: Map<Text, unknown>; forgetTrackedText(node: Text): void;
  };
  expect(internal.pendingContextPreparations.has(target)).toBe(true);
  internal.forgetTrackedText(target);
  expect(internal.pendingContextPreparations.has(target)).toBe(false);
  await drain(); expect(transform).not.toHaveBeenCalled();
});

it("discards an already-read context prefix when its boundary changes", async () => {
  const {neighbor, target, transform, drain} = fixture(true);
  await settle(); neighbor.data = "für ";
  await drain();
  expect(target.data).toBe("Nutzer");
  expect(transform.mock.calls.every(([, options]) => !options.leadingContext?.endsWith("mit "))).toBe(true);
  expect(transform.mock.calls.some(([, options]) => options.leadingContext?.endsWith("für "))).toBe(true);
});

it("discards preparation after an ancestor becomes an editor", async () => {
  const {target, transform, drain} = fixture();
  await settle(); document.body.setAttribute("contenteditable", "true");
  try {
    await drain(); expect(target.data).toBe("Nutzer:innen"); expect(transform).not.toHaveBeenCalled();
  } finally {document.body.removeAttribute("contenteditable");}
});

it("retains following-noun protection beyond many empty inline neighbors", async () => {
  const {target, transform, drain} = fixture(false, true);
  await settle(); expect(transform).not.toHaveBeenCalled();
  await drain(); expect(target.data).toBe("Mitarbeitende");
  expect(transform).toHaveBeenCalled(); expect(processor!.getReplacementCount()).toBe(0);
});

it("applies a caption while ordinary context preparation is still waiting", async () => {
  const {target, internal, drain} = fixture();
  const caption = document.createElement("div"); caption.className = "ytp-caption-segment";
  const text = document.createTextNode("Nutzer:innen"); caption.append(text); document.body.append(caption);
  internal.processTextNode(text, true, true); await settle();
  expect(text.data).toBe("Nutzer"); expect(target.data).toBe("Nutzer:innen");
  await drain(); expect(target.data).toBe("Nutzern");
});

it("discards preparation from a previous options generation", async () => {
  const {target, transform, drain} = fixture(); await settle();
  processor!.updateOptions({rules: [], profile: "aggressive", isTransformCandidate: () => false});
  await drain();
  expect(transform).not.toHaveBeenCalled(); expect(target.data).toBe("Nutzer:innen");
});

it("finishes context preparation through timers when the scheduler is unavailable", async () => {
  vi.useFakeTimers(); const {target, tasks} = fixture(); await settle();
  vi.unstubAllGlobals();
  while (tasks.length) {tasks.shift()!(); await settle();}
  await vi.advanceTimersByTimeAsync(50);
  expect(target.data).toBe("Nutzern");
});

it("falls back to a timer after a context task is rejected", async () => {
  vi.useFakeTimers(); const {target, postTask, drain} = fixture();
  postTask.mockImplementationOnce(() => Promise.reject(new Error("context task unavailable")));
  await settle(); await vi.advanceTimersByTimeAsync(5); await drain();
  expect(target.data).toBe("Nutzern");
});
