import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { createRegexRule } from "../src/core/rule";
import * as inlineProtection from "../src/core/inline-protection";

let processor: DomProcessor | undefined;
const rule = createRegexRule({id: "test.cache-transfer", risk: "safe",
  pattern: /Nutzer:innen/gu, replace: () => "Nutzer"});
function start(): void {
  processor = new DomProcessor(document, {rules: [rule], profile: "conservative",
    processQuotedText: false, processAccessibleAttributes: false});
  processor.start(); processor.flush();
}
async function flush(): Promise<void> {
  await Promise.resolve(); processor?.flush(); await Promise.resolve();
}
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); document.body.replaceChildren();
});

describe("Inline-Schutzcache bei einfachen Textknotenwechseln", () => {
  it("übernimmt gleichlangen unzitierten Kontext ohne erneuten Blockscan", async () => {
    const paragraph = document.createElement("p");
    const spans: HTMLSpanElement[] = [];
    for (let index = 0; index < 128; index += 1) {
      const span = document.createElement("span"); span.textContent = "Nutzer:innen 00";
      paragraph.append(span); spans.push(span);
    }
    document.body.append(paragraph); start();
    const collect = vi.spyOn(inlineProtection, "collectInlineProtection");
    for (const span of spans.slice(0, 48)) span.textContent = "Nutzer:innen 01";
    await flush();
    for (const span of spans.slice(0, 48)) expect(span.textContent).toBe("Nutzer 01");
    expect(collect).not.toHaveBeenCalled();
  });

  it.each([false, true])("invalidiert Zitatänderungen im selben Batch, Reihenfolge %s", async reverse => {
    document.body.innerHTML = '<p><span>„</span><b>Nutzer:innen 00</b><i>“</i> und Nutzer:innen</p>';
    start();
    const opening = document.querySelector("span")!.firstChild as Text;
    const target = document.querySelector("b")!;
    const changeQuote = () => {opening.data = "";};
    const changeTarget = () => {target.textContent = "Nutzer:innen 01";};
    if (reverse) {changeQuote(); changeTarget();} else {changeTarget(); changeQuote();}
    await flush();
    expect(target.textContent).toBe("Nutzer 01");
    expect(processor?.getReplacementCount()).toBe(2);
  });

  it("bewahrt den vollen Zitatschutz bei gleichlangen Inhaltsänderungen", async () => {
    document.body.innerHTML = '<p>„<b>Nutzer:innen 00</b>“ und Nutzer:innen</p>';
    start();
    const target = document.querySelector("b")!;
    target.textContent = "Nutzer:innen 01";
    await flush();
    expect(target.textContent).toBe("Nutzer:innen 01");
    expect(processor?.getReplacementCount()).toBe(1);
  });

  it("übernimmt keinen Schutz über einen Wechsel der technischen Textgrenze", async () => {
    document.body.innerHTML = '<p><span>Nutzer:innen 0</span> und Nutzer:innen</p>';
    start();
    const collect = vi.spyOn(inlineProtection, "collectInlineProtection");
    const target = document.querySelector("span")!;
    expect("https://x.test").toHaveLength("Nutzer:innen 0".length);
    target.textContent = "https://x.test";
    await flush();
    expect(target.textContent).toBe("https://x.test");
    expect(collect).toHaveBeenCalled();
  });

  it("berechnet nach Unterschreiten der Oversize-Grenze den Schutz neu", async () => {
    const paragraph = document.createElement("p"); const target = document.createElement("span");
    target.textContent = "Nutzer:innen " + "neutral ".repeat(2200);
    paragraph.append(target); document.body.append(paragraph); start();
    expect(target.textContent).toContain("Nutzer:innen");
    target.textContent = "Nutzer:innen 0";
    await flush();
    expect(target.textContent).toBe("Nutzer 0");
  });
});
