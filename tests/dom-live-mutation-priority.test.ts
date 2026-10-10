import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const regel: Rule = {
  id: "test.queue-priority-under-load",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return { text, replacements: text === input ? 0 : 1 };
  }
};
let processor: DomProcessor | undefined;

interface Internals {
  readonly pendingNodes: Set<Node>;
  activeTraversal: unknown;
  createTraversal(root: Node): unknown;
  processTraversalStep(state: unknown): boolean;
  queue(node: Node): void;
  flushRegularNodesBudgeted(): void;
  now(): number;
}

afterEach(() => {
  vi.restoreAllMocks();
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

function testStart(): Internals {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 300; index += 1) {
    const p = document.createElement("p");
    p.textContent = "Neutraler Text " + index;
    fragment.append(p);
  }
  document.body.append(fragment);
  processor = new DomProcessor(document, {
    rules: [regel],
    profile: "conservative",
    processAccessibleAttributes: false
  });
  processor.start();
  return processor as unknown as Internals;
}

describe("Live-Textpriorität vor großem DOM-Backlog", () => {
  it("arbeitet frische Textmutationen trotz älterem noch nicht gestarteten Body-Scan ab", () => {
    const internals = testStart();
    const live = document.createElement("span");
    live.textContent = "Nutzer:innen aktuell";
    document.body.append(live);
    const text = live.firstChild as Text;
    internals.queue(text);

    let time = 0;
    vi.spyOn(internals, "now").mockImplementation(() => ++time);
    internals.flushRegularNodesBudgeted();
    expect(text.data).toBe("Nutzer aktuell");
  });

  it("lässt einen langen laufenden TreeWalker auch bei vielen neuen Texten vorankommen", () => {
    const internals = testStart();
    internals.activeTraversal = internals.createTraversal(document.body);
    const walker = vi.spyOn(internals, "processTraversalStep")
      .mockImplementation(() => false);
    const texts: Text[] = [];
    for (let index = 0; index < 30; index += 1) {
      const span = document.createElement("span");
      span.textContent = "Nutzer:innen " + index;
      document.body.append(span);
      const text = span.firstChild as Text;
      internals.queue(text);
      texts.push(text);
    }

    let time = 0;
    vi.spyOn(internals, "now").mockImplementation(() => {
      time += 0.12;
      return time;
    });
    internals.flushRegularNodesBudgeted();
    expect(texts.some((node) => node.data.startsWith("Nutzer "))).toBe(true);
    expect(walker).toHaveBeenCalled();
  });
});
