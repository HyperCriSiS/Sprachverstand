import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const rule: Rule = {
  id: "test.detached-mutation-backlog",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return { text, replacements: text === input ? 0 : 1 };
  }
};

let processor: DomProcessor | undefined;

interface QueueInternals {
  readonly pendingNodes: Set<Node>;
  queue(node: Node): void;
  scheduleFlush(delayMs?: number): void;
}

afterEach(() => {
  vi.restoreAllMocks();
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

describe("DOM-Queue bei wiederholten Framework-Textaustauschen", () => {
  it("hält nur noch erreichbare neue Textknoten in der Warteschlange", async () => {
    const root = document.createElement("div");
    const spans: HTMLSpanElement[] = [];
    for (let index = 0; index < 80; index += 1) {
      const span = document.createElement("span");
      span.textContent = "Nutzer:innen " + index;
      root.append(span);
      spans.push(span);
    }
    document.body.append(root);
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      processAccessibleAttributes: false
    });
    processor.start();
    processor.flush();

    const internals = processor as unknown as QueueInternals;
    // Die Hintergrundverarbeitung absichtlich pausieren, damit die Menge
    // wartender Textknoten unter realistischer Mutationslast überprüfbar ist.
    vi.spyOn(internals, "scheduleFlush").mockImplementation(() => undefined);
    for (let tick = 0; tick < 40; tick += 1) {
      for (let offset = 0; offset < 16; offset += 1) {
        const index = (tick * 16 + offset) % spans.length;
        spans[index]!.textContent = "Nutzer:innen " + tick + "-" + offset;
      }
      await Promise.resolve();
    }
    expect(internals.pendingNodes.size).toBeGreaterThan(0);
    expect(internals.pendingNodes.size).toBeLessThanOrEqual(spans.length);
    for (const pending of internals.pendingNodes) {
      expect(pending.isConnected).toBe(true);
    }

    processor.flush();
    expect(spans.every((span) => span.textContent?.startsWith("Nutzer "))).toBe(true);
  });

  it("ignoriert bereits entfernte Knoten beim späteren Einreihen", () => {
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      processAccessibleAttributes: false
    });
    processor.start();
    const internals = processor as unknown as QueueInternals;
    const detached = document.createTextNode("Nutzer:innen");

    internals.queue(detached);
    expect(internals.pendingNodes.has(detached)).toBe(false);
    expect(detached.data).toBe("Nutzer:innen");
  });
});
