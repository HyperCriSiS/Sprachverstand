import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {defaultRules} from "../src/rules";
import {isBuiltInTransformCandidate} from "../src/rules/transform-candidate";
import {transformTextWithSummary, type DetailedTransformResult, type TransformOptions} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.replaceChildren();
});
async function settle() {for (let index = 0; index < 20; index++) await Promise.resolve();}
async function fixture(nested = false) {
  const tasks: (() => void)[] = [];
  vi.stubGlobal("scheduler", {postTask: (work: () => unknown) => new Promise(resolve => {
    tasks.push(() => resolve(work()));
  })});
  const root = document.createElement("p"), lead = document.createTextNode("mit "); root.append(lead);
  const container = nested ? document.createElement("span") : root;
  if (nested) root.append(container);
  for (let index = 0; index < 2200; index++) container.append(document.createElement("span"));
  const target = document.createTextNode("Nutzer:innen"); root.append(target); document.body.append(root);
  let holdNext = false, release: (() => void) | undefined;
  const transform = vi.fn((input: string, options: TransformOptions) => {
    const result = transformTextWithSummary(input, defaultRules, options);
    if (!holdNext) return Promise.resolve(result);
    holdNext = false;
    return new Promise<DetailedTransformResult>(resolve => {release = () => resolve(result);});
  });
  processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive", processSubtitles: true,
    isTransformCandidate: isBuiltInTransformCandidate, transformText: transform});
  processor.start();
  const internal = processor as unknown as {now(): number; cancelRegularFlush(): void;
    pendingNodes: Set<Node>; pendingFollowingContexts: Map<object, unknown>;
    processTextNode(node: Text, subtitle?: boolean, budgeted?: boolean): void;
    flushRegularNodesBudgeted(): void};
  internal.cancelRegularFlush(); internal.pendingNodes.clear();
  vi.spyOn(internal, "now").mockReturnValue(0);
  const drain = async () => {
    for (let index = 0; index < 200; index++) {
      await settle(); const task = tasks.shift(); if (!task) break; task();
    }
    await settle();
  };
  internal.processTextNode(target, false, false); await drain();
  expect(target.data).toBe("Nutzern");
  internal.cancelRegularFlush(); internal.pendingNodes.clear(); tasks.length = 0;
  return {root, lead, target, internal, tasks, drain, transform,
    hold: () => {holdNext = true;}, release: () => {if (!release) throw new Error("No deferred reply"); release();}};
}

it("bounds observer context traversal and reevaluates the full distant context", async () => {
  const {lead, target, drain} = await fixture();
  const next = vi.spyOn(Node.prototype, "nextSibling", "get");
  lead.data = "für "; await settle();
  expect(next.mock.calls.length).toBeLessThanOrEqual(128);
  expect(target.data).toBe("Nutzern");
  await drain(); expect(target.data).toBe("Nutzer");
  processor!.stop({restore: true}); expect(target.data).toBe("Nutzer:innen"); expect(lead.data).toBe("für ");
});

it("bounds traversal inside a large following subtree", async () => {
  const {lead, target, drain} = await fixture(true);
  const next = vi.spyOn(TreeWalker.prototype, "nextNode");
  lead.data = "für "; await settle();
  expect(next.mock.calls.length).toBeLessThanOrEqual(128);
  await drain(); expect(target.data).toBe("Nutzer");
});

it("coalesces repeated character changes of the same pending anchor", async () => {
  const {lead, target, internal, drain} = await fixture();
  for (let index = 0; index < 40; index++) {
    lead.data = index % 2 ? "für " : "mit "; await settle();
    expect(internal.pendingFollowingContexts.size).toBeLessThanOrEqual(1);
  }
  await drain(); expect(target.data).toBe("Nutzer");
});

it("preserves a foreign target rewrite during partial invalidation", async () => {
  const {lead, target, drain} = await fixture();
  lead.data = "für "; await settle(); target.data = "Fremder aktueller Text";
  await drain(); processor!.stop({restore: true});
  expect(target.data).toBe("Fremder aktueller Text");
});

it("does not apply a stale normal reply ahead of pending context invalidation", async () => {
  const {lead, target, internal, hold, release, drain} = await fixture();
  hold(); target.data = "Nutzer:innen Neu";
  internal.processTextNode(target, false, false); await settle();
  lead.data = "für "; await settle(); release(); await settle();
  internal.flushRegularNodesBudgeted();
  expect(target.data).toBe("Nutzer:innen Neu");
  await drain(); expect(target.data).toBe("Nutzer Neu");
});

it("finishes a caption while a normal following-context walk is pending", async () => {
  const {lead, target, internal, drain} = await fixture();
  lead.data = "für "; await settle();
  const caption = document.createElement("div"); caption.className = "ytp-caption-segment";
  const text = document.createTextNode("Nutzer:innen"); caption.append(text); document.body.append(caption);
  internal.processTextNode(text, true, true); await settle();
  expect(text.data).toBe("Nutzer"); expect(target.data).toBe("Nutzern");
  await drain(); expect(target.data).toBe("Nutzer");
});

it("drops pending invalidation when stopping and restores owned text", async () => {
  const {lead, target, internal, drain} = await fixture();
  lead.data = "für "; await settle(); const stopped = processor!.stopBudgeted();
  expect(internal.pendingFollowingContexts.size).toBe(0);
  await drain(); await stopped;
  expect(target.data).toBe("Nutzer:innen"); expect(lead.data).toBe("für ");
});
