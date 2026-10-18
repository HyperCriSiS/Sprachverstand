import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {createRegexRule} from "../src/core/rule";

const rule = createRegexRule({id: "test.scope", risk: "safe",
  pattern: /Nutzer:innen/gu, replace: () => "Nutzer"});
let processor: DomProcessor | undefined;
let customElementNumber = 0;
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  document.body.replaceChildren(); vi.useRealTimers(); vi.restoreAllMocks();
});

describe("text safety during one synchronous DOM slice", () => {
  it.each(["protection", "subtitles"])("honors synchronous custom-element changes to %s", async kind => {
    vi.useFakeTimers();
    let reacted = false;
    class ChangingLabel extends HTMLElement {
      static get observedAttributes() {return ["aria-label"];}
      attributeChangedCallback(_name: string, _old: string, value: string) {
        if (value !== "Nutzer" || !this.parentElement) return;
        reacted = true;
        this.parentElement.setAttribute(kind === "protection"
          ? "data-sprachverstand-ignore" : "class", kind === "protection"
          ? "" : "subtitle-container");
      }
    }
    const tag = "changing-label-" + ++customElementNumber;
    customElements.define(tag, ChangingLabel);
    const root = document.createElement("div");
    const first = document.createElement("span"); first.textContent = "Nutzer:innen";
    const label = document.createElement(tag); label.setAttribute("aria-label", "Nutzer:innen");
    root.append(first, label);
    const protectedTexts = new Set<Text>();
    for (let index = 0; index < 100; index++) {
      const span = document.createElement("span"); const text = document.createTextNode("Nutzer:innen");
      span.append(text); root.append(span); protectedTexts.add(text);
    }
    document.body.append(root);
    const forbiddenWrites: MutationRecord[] = [];
    const observer = new MutationObserver(records => forbiddenWrites.push(...records.filter(record =>
      record.type === "characterData" && protectedTexts.has(record.target as Text))));
    observer.observe(root, {subtree: true, characterData: true});
    processor = new DomProcessor(document, {rules: [rule], profile: "conservative",
      processQuotedText: true, processSubtitles: false});
    processor.start();
    await vi.advanceTimersByTimeAsync(100);
    expect(reacted).toBe(true);
    expect(forbiddenWrites).toHaveLength(0);
    for (const text of protectedTexts) expect(text.data).toBe("Nutzer:innen");
    observer.disconnect();
  });

  it("rechecks ancestors in subsequent mutation batches", async () => {
    vi.useFakeTimers();
    const root = document.createElement("div");
    root.innerHTML = "<span>Nutzer:innen</span>";
    document.body.append(root);
    processor = new DomProcessor(document, {rules: [rule], profile: "conservative"});
    processor.start();
    expect(root.textContent).toBe("Nutzer");
    root.setAttribute("role", "textbox");
    root.firstElementChild!.textContent = "Nutzer:innen";
    await vi.advanceTimersByTimeAsync(100);
    expect(root.textContent).toBe("Nutzer:innen");
    root.removeAttribute("role");
    await vi.advanceTimersByTimeAsync(100);
    expect(root.textContent).toBe("Nutzer");
  });
});
