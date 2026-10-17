import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {createRegexRule} from "../src/core/rule";
import {transformTextWithSummary, type TransformOptions} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
const rule = createRegexRule({id: "test.protection-preparation", risk: "safe",
  pattern: /Nutzer:innen/gu, replace: () => "Nutzer"});
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.replaceChildren();
});
async function settle() {for (let index = 0; index < 15; index++) await Promise.resolve();}
function setup(quoted = false) {
  const tasks: (() => void)[] = [];
  vi.stubGlobal("scheduler", {postTask: async (work: () => void) => {tasks.push(work);}});
  document.body.innerHTML = '<p id="root"><b id="opening">' + (quoted ? "„" : "") +
    '</b><b id="target">Nutzer:innen</b>' + '<span>neutral </span>'.repeat(1_200) +
    '<b>' + (quoted ? "“" : "") + '</b></p><p id="outside">Nutzer:innen</p><p id="other">neutral</p>';
  const transform = vi.fn(async (input: string, options: TransformOptions) => transformTextWithSummary(input, [rule], options));
  processor = new DomProcessor(document, {rules: [rule], profile: "conservative",
    processQuotedText: false, processAccessibleAttributes: false, transformText: transform});
  vi.spyOn(processor as unknown as {now: () => number}, "now").mockReturnValue(100);
  processor.start();
  return {tasks, transform, target: document.querySelector("#target")!};
}
async function drain(tasks: (() => void)[]) {
  for (let index = 0; index < 500 && tasks.length; index++) {tasks.shift()!(); await settle();}
  expect(tasks).toHaveLength(0);
}
describe("Cooperative preparation of large inline protection contexts", () => {
  it("keeps originals intact until a complete context is ready, then processes every candidate", async () => {
    const {tasks, transform, target} = setup();
    tasks.shift()!(); await settle();
    expect(target.textContent).toBe("Nutzer:innen");
    expect(transform).not.toHaveBeenCalled();
    await drain(tasks);
    expect(target.textContent).toBe("Nutzer");
    expect(document.querySelector("#outside")!.textContent).toBe("Nutzer");
    expect(processor!.getReplacementCount()).toBe(2);
  });
  it("preserves quotes across thousands of inline nodes", async () => {
    const {tasks, target} = setup(true); await drain(tasks);
    expect(target.textContent).toBe("Nutzer:innen");
    expect(document.querySelector("#outside")!.textContent).toBe("Nutzer");
    expect(processor!.getReplacementCount()).toBe(1);
  });
  it("discards a partial context after a surrounding quote mutation", async () => {
    const {tasks, target} = setup(true);
    tasks.shift()!(); await settle();
    document.querySelector("#opening")!.textContent = ""; await settle();
    await drain(tasks);
    expect(target.textContent).toBe("Nutzer");
    expect(processor!.getReplacementCount()).toBe(2);
  });
  it("finishes preparation despite invalidation of a different boundary", async () => {
    const {tasks, target} = setup();
    for (let index = 0; index < 200 && target.textContent !== "Nutzer"; index++) {
      tasks.shift()?.();
      document.querySelector("#other")!.textContent = "neutral " + index;
      await settle();
    }
    expect(target.textContent).toBe("Nutzer");
    await drain(tasks);
    expect(target.textContent).toBe("Nutzer");
    expect(processor!.getReplacementCount()).toBe(2);
  });
  it("cancels preparation on stop and cannot apply later queued work", async () => {
    const {tasks, transform, target} = setup();
    tasks.shift()!(); await settle(); processor!.stop({restore: true});
    await drain(tasks);
    expect(transform).not.toHaveBeenCalled();
    expect(target.textContent).toBe("Nutzer:innen");
    expect(processor!.getReplacementCount()).toBe(0);
  });
  it("keeps explicit synchronous flush complete", async () => {
    const {tasks, target} = setup(true);
    tasks.shift()!(); await settle(); processor!.flush();
    await drain(tasks); processor!.flush();
    expect(target.textContent).toBe("Nutzer:innen");
    expect(document.querySelector("#outside")!.textContent).toBe("Nutzer");
    expect(processor!.getReplacementCount()).toBe(1);
  });
  it("rechecks oversized protection after a length-changing text replacement", async () => {
    const {tasks, target} = setup(); await drain(tasks);
    document.querySelector("#root span")!.textContent = "neutral ".repeat(2_000);
    await settle(); await drain(tasks);
    expect(target.textContent).toBe("Nutzer:innen");
    expect(document.querySelector("#outside")!.textContent).toBe("Nutzer");
    expect(processor!.getReplacementCount()).toBe(1);
  });
  it("rechecks a completed context after detached mutation and reattachment", async () => {
    const {tasks, target} = setup(); await drain(tasks);
    const root = document.querySelector("#root")!;
    root.remove(); await settle();
    root.querySelector("#opening")!.textContent = "„";
    root.querySelector("b:last-child")!.textContent = "“";
    document.body.append(root); await settle(); await drain(tasks);
    expect(target.textContent).toBe("Nutzer:innen");
    expect(processor!.getReplacementCount()).toBe(1);
  });
});
