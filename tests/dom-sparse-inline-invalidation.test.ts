import {afterEach, describe, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {createRegexRule} from "../src/core/rule";
import {transformTextWithSummary} from "../src/core/transform-text";

let processor: DomProcessor | undefined;
const rule = createRegexRule({id: "test.sparse-inline", risk: "safe",
  pattern: /Nutzer:innen/gu, replace: () => "Nutzer"});
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); document.body.replaceChildren();
});
function fixture(count: number) {
  document.body.innerHTML = '<p id="root"><span id="opening"></span>' +
    '<b>Nutzer:innen </b>'.repeat(count) + '<span id="closing"></span>' +
    '<i>neutral </i>'.repeat(200) + '</p><p id="outside">Nutzer:innen</p>';
  processor = new DomProcessor(document, {rules: [rule], profile: "conservative",
    processQuotedText: false, processAccessibleAttributes: false});
  processor.start(); processor.flush();
  return document.querySelector("#root")!;
}
function addQuotes() {
  document.querySelector("#opening")!.append(document.createTextNode("„"));
  document.querySelector("#closing")!.append(document.createTextNode("“"));
}
async function settle() {for (let index = 0; index < 15; index++) await Promise.resolve();}
describe("Sparse tracked text in large inline protection boundaries", () => {
  it("invalidates cached protection without walking all neutral neighbor texts", async () => {
    const root = fixture(1);
    const walker = vi.spyOn(document, "createTreeWalker");
    addQuotes(); await Promise.resolve();
    expect(walker.mock.calls.some(call => call[0] === root && call[1] === NodeFilter.SHOW_TEXT)).toBe(false);
    processor!.flush();
    expect(root.querySelector("b")!.textContent).toBe("Nutzer:innen ");
    expect(document.querySelector("#outside")!.textContent).toBe("Nutzer");
    expect(processor!.getReplacementCount()).toBe(1);
  });
  it.each([1, 65])("preserves quote protection and originals with %s tracked nodes", async count => {
    const root = fixture(count);
    addQuotes(); await Promise.resolve(); processor!.flush();
    expect([...root.querySelectorAll("b")].every(node => node.textContent === "Nutzer:innen ")).toBe(true);
    expect(document.querySelector("#outside")!.textContent).toBe("Nutzer");
    expect(processor!.getReplacementCount()).toBe(1);
    processor!.stop({restore: true});
    expect(document.querySelector("#outside")!.textContent).toBe("Nutzer:innen");
  });
  it("rejects an outstanding unprotected response after a surrounding quote change", async () => {
    document.body.innerHTML = '<p id="root"><span id="opening"></span>' +
      '<b>Nutzer:innen</b><span id="closing"></span>' + '<i>neutral </i>'.repeat(200) + '</p>';
    let releaseFirst!: () => void;
    let first = true;
    processor = new DomProcessor(document, {rules: [rule], profile: "conservative",
      processQuotedText: false, processAccessibleAttributes: false,
      transformText: (input, options) => {
        const result = transformTextWithSummary(input, [rule], options);
        if (!first) return Promise.resolve(result);
        first = false;
        return new Promise(resolve => {releaseFirst = () => resolve(result);});
      }});
    processor.start(); processor.flush(); await settle();
    expect(releaseFirst).toBeTypeOf("function");
    addQuotes(); await Promise.resolve();
    releaseFirst();
    for (let index = 0; index < 4; index++) {await settle(); processor.flush();}
    expect(document.querySelector("b")!.textContent).toBe("Nutzer:innen");
    expect(processor.getReplacementCount()).toBe(0);
  });
  it("recomputes a custom protected term spanning multiple inline nodes", async () => {
    document.body.innerHTML = '<p><b>Nutzer:innen</b><i> Team</i><span> Nutzer:innen</span></p>';
    processor = new DomProcessor(document, {rules: [rule], profile: "conservative",
      protectedTerms: ["Nutzer:innen Team"], processAccessibleAttributes: false});
    processor.start(); processor.flush();
    expect(document.querySelector("b")!.textContent).toBe("Nutzer:innen");
    expect(document.querySelector("span")!.textContent).toBe(" Nutzer");
    document.querySelector("i")!.firstChild!.textContent = " Gruppe";
    await Promise.resolve(); processor.flush();
    expect(document.querySelector("b")!.textContent).toBe("Nutzer");
    expect(document.querySelector("span")!.textContent).toBe(" Nutzer");
    expect(processor.getReplacementCount()).toBe(2);
  });
});
