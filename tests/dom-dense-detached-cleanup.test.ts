import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import type {Rule} from "../src/core/rule";

const rule: Rule = {id:"test.dense-detached", risk:"safe", apply(input) {
  const text = input.replaceAll("Nutzer:innen", "Nutzer");
  return {text, replacements:text === input ? 0 : 1};
}};
let processor: DomProcessor | undefined;

function fixture(shadow = false) {
  const root = document.createElement("section");
  root.title = "Nutzer:innen title";
  const container = shadow ? root.attachShadow({mode:"open"}) : root;
  const nodes: Text[] = [];
  for (let index = 0; index < 256; index++) {
    const span = document.createElement("span");
    const node = document.createTextNode("Nutzer:innen " + index);
    span.append(node); container.append(span); nodes.push(node);
  }
  const captionElement = document.createElement("div");
  captionElement.className = "ytp-caption-segment";
  const caption = document.createTextNode("Nutzer:innen caption");
  captionElement.append(caption);
  document.body.append(root, captionElement);
  processor = new DomProcessor(document, {rules:[rule], profile:"aggressive",
    processQuotedText:true, processAccessibleAttributes:true, processSubtitles:true});
  processor.start(); processor.flush();
  return {root, container, nodes, caption};
}

afterEach(() => {
  processor?.stop({restore:true}); processor = undefined;
  vi.restoreAllMocks(); document.body.replaceChildren();
});

describe("Budgetierte Entfernung dicht korrigierter Teilbäume", () => {
  it("begrenzt die synchrone Arbeit und restauriert vollständig samt gleichzeitigem Cue", async () => {
    const {root, nodes, caption} = fixture(); await Promise.resolve();
    root.remove(); caption.data = "Nutzer:innen neuer Cue";
    await Promise.resolve();
    expect(processor!.getReplacementCount()).toBeGreaterThan(1);
    const clock = vi.spyOn(performance, "now").mockReturnValue(0);
    try {
      (processor as unknown as {flushRegularNodesBudgeted(): void}).flushRegularNodesBudgeted();
    } finally {clock.mockRestore();}
    const restored = nodes.filter((node, index) => node.data === "Nutzer:innen " + index).length;
    expect(restored).toBeGreaterThan(0);
    expect(restored).toBeLessThanOrEqual(128);
    processor!.flush();
    expect(nodes.every((node, index) => node.data === "Nutzer:innen " + index)).toBe(true);
    expect(root.title).toBe("Nutzer:innen title");
    expect(caption.data).toBe("Nutzer neuer Cue");
    expect(processor!.getReplacementCount()).toBe(1);
  });

  it("vergisst auch auseinandergerissene Nachkommen ohne Abhängigkeit vom alten DOM-Baum", async () => {
    const {root, nodes} = fixture(); await Promise.resolve();
    root.remove(); await Promise.resolve();
    root.replaceChildren();
    processor!.flush();
    expect(nodes.every((node, index) => node.data === "Nutzer:innen " + index)).toBe(true);
    expect(processor!.getReplacementCount()).toBe(1);
  });

  it("lässt normale neue Texte während der dichten Bereinigung weiterlaufen", async () => {
    const {root, nodes} = fixture(); await Promise.resolve();
    root.remove(); await Promise.resolve();
    const paragraph = document.createElement("p"); paragraph.textContent = "Nutzer:innen neu";
    document.body.append(paragraph); await Promise.resolve();
    const clock = vi.spyOn(performance, "now").mockReturnValue(0);
    try {
      (processor as unknown as {flushRegularNodesBudgeted(): void}).flushRegularNodesBudgeted();
    } finally {clock.mockRestore();}
    expect(paragraph.textContent).toBe("Nutzer neu");
    expect(nodes.some((node, index) => node.data === "Nutzer " + index)).toBe(true);
    processor!.flush();
    expect(nodes.every((node, index) => node.data === "Nutzer:innen " + index)).toBe(true);
    expect(processor!.getReplacementCount()).toBe(2);
  });

  it("behält Originale und Ownership bei Reinsert vor der Bereinigung", async () => {
    const {root, nodes} = fixture(); await Promise.resolve();
    root.remove(); await Promise.resolve();
    document.body.append(root); await Promise.resolve();
    processor!.flush();
    expect(nodes.every((node, index) => node.data === "Nutzer " + index)).toBe(true);
    expect(processor!.getReplacementCount()).toBe(258);
    processor!.stop({restore:true});
    expect(nodes.every((node, index) => node.data === "Nutzer:innen " + index)).toBe(true);
  });

  it("lässt echte externe Änderungen an abgetrennten Texten und Attributen bestehen", async () => {
    const {root, nodes} = fixture(); await Promise.resolve();
    root.remove(); await Promise.resolve();
    nodes[0]!.data = "Extern neuer Text"; root.title = "Extern neuer Titel";
    processor!.flush();
    expect(nodes[0]!.data).toBe("Extern neuer Text");
    expect(root.title).toBe("Extern neuer Titel");
    expect(nodes.slice(1).every((node, index) => node.data === "Nutzer:innen " + (index + 1))).toBe(true);
    expect(processor!.getReplacementCount()).toBe(1);
  });

  it("restauriert dichte offene Shadow-Wurzeln", async () => {
    const {root, nodes} = fixture(true); await Promise.resolve();
    root.remove(); await Promise.resolve(); processor!.flush();
    expect(nodes.every((node, index) => node.data === "Nutzer:innen " + index)).toBe(true);
    expect(root.title).toBe("Nutzer:innen title");
    expect(processor!.getReplacementCount()).toBe(1);
  });

  it("übernimmt ausstehende abgetrennte Originale in StopBudgeted", async () => {
    const {root, nodes} = fixture(); await Promise.resolve();
    root.remove(); await Promise.resolve();
    await processor!.stopBudgeted();
    expect(nodes.every((node, index) => node.data === "Nutzer:innen " + index)).toBe(true);
    expect(root.title).toBe("Nutzer:innen title");
    expect(processor!.getReplacementCount()).toBe(0);
  });

  it("begrenzt auch große Removed-NodeLists und erhält den verbundenen Attribut-Owner", async () => {
    const {root, nodes} = fixture(); await Promise.resolve();
    root.replaceChildren(); await Promise.resolve();
    expect(processor!.getReplacementCount()).toBeGreaterThan(2);
    processor!.flush();
    expect(nodes.every((node, index) => node.data === "Nutzer:innen " + index)).toBe(true);
    expect(root.title).toBe("Nutzer title");
    expect(processor!.getReplacementCount()).toBe(2);
  });

  it("holt weitere Entfernungen nach bereits besuchten Ownership-Einträgen nach", async () => {
    const {root, nodes} = fixture();
    const second = document.createElement("section");
    const elements = Array.from({length:256}, (_, index) => {
      const span = document.createElement("span"); span.title = "Nutzer:innen attr " + index;
      span.textContent = "neutral"; second.append(span); return span;
    });
    document.body.append(second); await Promise.resolve(); processor!.flush(); await Promise.resolve();
    root.remove(); await Promise.resolve();
    const clock = vi.spyOn(performance, "now").mockReturnValue(0);
    try {
      for (let slice = 0; slice < 3; slice++) {
        (processor as unknown as {flushRegularNodesBudgeted(): void}).flushRegularNodesBudgeted();
      }
    } finally {clock.mockRestore();}
    second.remove(); await Promise.resolve(); processor!.flush();
    expect(nodes.every((node, index) => node.data === "Nutzer:innen " + index)).toBe(true);
    expect(elements.every((element, index) => element.title === "Nutzer:innen attr " + index)).toBe(true);
    expect(processor!.getReplacementCount()).toBe(1);
  });

  it("wendet während der Bereinigung keine verspäteten Text- oder Attributantworten in fremden Dokumenten an", async () => {
    const {root, nodes} = fixture(); await Promise.resolve();
    const responses: (() => void)[] = [];
    processor!.updateOptions({rules:[rule], profile:"aggressive", processSubtitles:true,
      processAccessibleAttributes:true, processQuotedText:true,
      transformText:input => new Promise(resolve => responses.push(() => resolve({
        text:input.replaceAll("Nutzer:innen", "Nutzer"), replacements:1, summaries:[]
      })))});
    processor!.flush();
    for (let turn = 0; turn < 6; turn++) await Promise.resolve();
    expect(responses.length).toBeGreaterThan(1);
    const foreign = document.implementation.createHTMLDocument("foreign");
    foreign.body.append(root); await Promise.resolve();
    const observer = new MutationObserver(() => undefined);
    observer.observe(root, {subtree:true, characterData:true, attributes:true});
    for (const respond of responses.reverse()) respond();
    for (let turn = 0; turn < 8; turn++) await Promise.resolve();
    const clock = vi.spyOn(performance, "now").mockReturnValue(0);
    try {
      (processor as unknown as {flushRegularNodesBudgeted(): void}).flushRegularNodesBudgeted();
    } finally {clock.mockRestore();}
    expect(observer.takeRecords()).toHaveLength(0);
    observer.disconnect();
    processor!.flush();
    expect(nodes.every((node, index) => node.data === "Nutzer:innen " + index)).toBe(true);
    expect(root.title).toBe("Nutzer:innen title");
  });
});
