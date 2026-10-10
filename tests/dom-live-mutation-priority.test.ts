import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const rule: Rule = {
  id: "test.dynamic-mutation-priority",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return { text, replacements: text === input ? 0 : 1 };
  }
};

let processor: DomProcessor | undefined;

interface SchedulerInternals {
  activeTraversal: unknown;
  createTraversal(root: Node): unknown;
  processTraversalStep(state: unknown): boolean;
  queue(root: Node): void;
  now(): number;
  flushRegularNodesBudgeted(): void;
}

afterEach(() => {
  vi.restoreAllMocks();
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

function createLargeTree(): HTMLElement {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 300; index += 1) {
    const paragraph = document.createElement("p");
    paragraph.textContent = "Neutraler Absatz " + index;
    fragment.append(paragraph);
  }
  const live = document.createElement("div");
  live.textContent = "Nutzer:innen dynamisch";
  fragment.append(live);
  document.body.append(fragment);
  return live;
}

describe("Faire Verarbeitung laufender DOM-Mutationen", () => {
  it("korrigiert neuen Text auch während einer noch aktiven großen Traversierung", () => {
    const live = createLargeTree();
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      processAccessibleAttributes: false
    });
    processor.start();

    const internals = processor as unknown as SchedulerInternals;
    internals.activeTraversal = internals.createTraversal(document.body);
    const traverse = vi.spyOn(internals, "processTraversalStep")
      .mockImplementation(() => false);
    let clock = 0;
    vi.spyOn(internals, "now").mockImplementation(() => ++clock);

    // Die bereits laufende Traversierung ist absichtlich blockiert:
    // bisher wurden direkte Textmutationen erst nach ihrem Ende bearbeitet.
    const liveText = live.firstChild as Text;
    internals.queue(liveText);
    internals.flushRegularNodesBudgeted();

    expect(liveText.data).toBe("Nutzer dynamisch");
    expect(traverse).toHaveBeenCalled();
  });

  it("lässt den laufenden TreeWalker bei vielen frischen Textänderungen weiterarbeiten", () => {
    const live = createLargeTree();
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      processAccessibleAttributes: false
    });
    processor.start();

    const internals = processor as unknown as SchedulerInternals;
    internals.activeTraversal = internals.createTraversal(document.body);
    const traverse = vi.spyOn(internals, "processTraversalStep")
      .mockImplementation(() => false);
    const nodes: Text[] = [];
    for (let index = 0; index < 30; index += 1) {
      const span = document.createElement("span");
      span.textContent = "Nutzer:innen " + index;
      live.append(span);
      const node = span.firstChild as Text;
      nodes.push(node);
      internals.queue(node);
    }

    // Genügend simulierter Zeitspielraum für mehr als acht Korrekturen.
    // Der Prioritätsdeckel muss trotzdem Traversierungsarbeit ermöglichen.
    let clock = 0;
    vi.spyOn(internals, "now").mockImplementation(() => {
      clock += 0.15;
      return clock;
    });
    internals.flushRegularNodesBudgeted();

    expect(nodes.filter((node) => node.data.startsWith("Nutzer ")).length)
      .toBeGreaterThan(0);
    expect(traverse).toHaveBeenCalled();
  });
});
