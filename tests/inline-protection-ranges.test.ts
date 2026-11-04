import { afterEach, describe, expect, it } from "vitest";
import { collectInlineProtection } from "../src/core/inline-protection";

afterEach(() => document.body.replaceChildren());

describe("Inline-Schutzbereiche bei vielen und überlappenden Treffern", () => {
  it("findet Zitate auch in tief verschachtelten Inline-Elementen", () => {
    const paragraph = document.createElement("p");
    document.body.append(paragraph);
    let parent: Element = paragraph;
    for (let index = 0; index < 1200; index += 1) {
      const span = document.createElement("span");
      parent.append(span);
      parent = span;
    }
    const text = document.createTextNode("„Nutzer:innen“ und Expert:innen");
    parent.append(text);
    const ranges = collectInlineProtection(paragraph, new Set(["P"]),
      node => node.data, [], true);
    expect(ranges.get(text)).toEqual([{start: 0, end: "„Nutzer:innen“".length}]);
  });

  it.each(['<code>', '<span contenteditable="true">', '<span data-sprachverstand-ignore>',
    '<span aria-hidden="true">', '<span role="textbox">'])
    ("trennt Zitate an geschützten Teilbäumen: %s", opening => {
      const paragraph = document.createElement("p");
      paragraph.innerHTML = `„Nutzer:innen ${opening}<b>Expert:innen</b></${opening.startsWith('<code') ? 'code' : 'span'}>“ freie Nutzer:innen`;
      document.body.append(paragraph);
      const ranges = collectInlineProtection(paragraph, new Set(["P"]),
        node => node.data, [], true);
      expect(ranges.has(paragraph.querySelector('b')!.firstChild as Text)).toBe(false);
      expect(ranges.get(paragraph.firstChild as Text)).toEqual([]);
      expect(ranges.get(paragraph.lastChild as Text)).toEqual([]);
    });

  it("berücksichtigt geschützte Shadow-Hosts bei der Prüfung ihrer Nachfahren", () => {
    const host = document.createElement("div");
    host.setAttribute("contenteditable", "true");
    document.body.append(host);
    const root = host.attachShadow({mode: "open"});
    root.innerHTML = '<span>„Nutzer:innen“</span>';
    const ranges = collectInlineProtection(root, new Set(["P"]),
      node => node.data, [], true);
    expect(ranges.size).toBe(0);
  });
  it("vereinigt ein Zitat und eine über dessen Ende reichende persönliche Ausnahme", () => {
    const paragraph = document.createElement("p");
    paragraph.innerHTML = '„<b>Nutzer:innen</b> und <i>Expert:innen</i>“ und <span>Nutzer:innen</span>! freie Nutzer:innen';
    document.body.append(paragraph);
    const ranges = collectInlineProtection(paragraph, new Set(["P"]),
      node => node.data, ['Expert:innen“ und Nutzer:innen'], true);
    const texts = [...ranges.keys()];
    expect(texts).toHaveLength(7);
    for (const text of texts.slice(0, -1)) {
      expect(ranges.get(text), text.data).toEqual([{start: 0, end: text.length}]);
    }
    expect(ranges.get(texts[texts.length - 1]!)).toEqual([]);
  });

  it("ordnet viele kurze Zitate und überlappende Ausnahmen den richtigen Knoten zu", () => {
    const paragraph = document.createElement("p");
    const nodes: Text[] = [];
    for (let index = 0; index < 3000; index += 1) {
      const span = document.createElement("span");
      const text = document.createTextNode("«x»");
      span.append(text);
      paragraph.append(span);
      nodes.push(text);
    }
    const unprotected = document.createTextNode(" freie Nutzer:innen");
    paragraph.append(unprotected);
    document.body.append(paragraph);
    const ranges = collectInlineProtection(paragraph, new Set(["P"]),
      node => node.data, ["x"], true);
    expect(ranges.size).toBe(nodes.length + 1);
    for (const node of nodes) expect(ranges.get(node)).toEqual([{start: 0, end: 3}]);
    expect(ranges.get(unprotected)).toEqual([]);
  });
});
