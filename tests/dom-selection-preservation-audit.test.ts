import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

function auswahl(start: Text, startOffset: number, end: Text, endOffset: number): Selection {
  const range = document.createRange();
  range.setStart(start, startOffset);
  range.setEnd(end, endOffset);
  const selection = document.getSelection();
  if (!selection) {
    throw new Error("DOM-Selection fehlt.");
  }
  selection.removeAllRanges();
  selection.addRange(range);
  return selection;
}

function starten(): void {
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false
  });
  processor.start();
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.getSelection()?.removeAllRanges();
  document.body.replaceChildren();
});

describe("Audit DOM-12: laufende Textauswahl schützen", () => {
  it("bewahrt eine Auswahl im unveränderten Präfix", () => {
    document.body.innerHTML = "<p>Hallo Nutzer:innen und Freunde.</p>";
    const node = document.querySelector("p")!.firstChild as Text;
    const selection = auswahl(node, 0, node, 5);
    starten();
    expect(node.data).toBe("Hallo Nutzer und Freunde.");
    expect(selection.toString()).toBe("Hallo");
  });

  it("verschiebt die Auswahlposition im unveränderten Suffix korrekt", () => {
    document.body.innerHTML = "<p>Hallo Nutzer:innen und Freunde.</p>";
    const node = document.querySelector("p")!.firstChild as Text;
    const begin = node.data.indexOf("Freunde");
    const selection = auswahl(node, begin, node, begin + "Freunde".length);
    starten();
    expect(node.data).toBe("Hallo Nutzer und Freunde.");
    expect(selection.toString()).toBe("Freunde");
  });

  it("bewahrt die Auswahl zwischen zwei getrennten Ersetzungen", () => {
    document.body.innerHTML = "<p>Hallo Nutzer:innen und Lehrer:innen heute.</p>";
    const node = document.querySelector("p")!.firstChild as Text;
    const begin = node.data.indexOf(" und ");
    const selection = auswahl(node, begin, node, begin + " und ".length);
    starten();
    expect(node.data).toBe("Hallo Nutzer und Lehrer heute.");
    expect(selection.toString()).toBe(" und ");
  });

  it("bewahrt eine Auswahl über mehrere HTML-Textknoten", () => {
    document.body.innerHTML =
      "<p><span>Hallo </span><b>Nutzer:innen</b><i> und Freunde.</i></p>";
    const paragraph = document.querySelector("p")!;
    const first = paragraph.querySelector("span")!.firstChild as Text;
    const last = paragraph.querySelector("i")!.firstChild as Text;
    const selection = auswahl(first, 0, last, last.data.length);
    starten();
    expect(paragraph.textContent).toBe("Hallo Nutzer und Freunde.");
    expect(selection.toString()).toBe("Hallo Nutzer und Freunde.");
  });

  it("bewahrt das Präfix auch während der Wiederherstellung", () => {
    document.body.innerHTML = "<p>Hallo Nutzer:innen und Freunde.</p>";
    const node = document.querySelector("p")!.firstChild as Text;
    starten();
    const selection = auswahl(node, 0, node, 5);
    processor?.stop({ restore: true });
    processor = undefined;
    expect(node.data).toBe("Hallo Nutzer:innen und Freunde.");
    expect(selection.toString()).toBe("Hallo");
  });

  it("verwendet nach dynamischer Neuauswertung weiterhin den lokalen Edit", async () => {
    document.body.innerHTML = "<p>Hallo Nutzer:innen und Freunde.</p>";
    const node = document.querySelector("p")!.firstChild as Text;
    starten();
    node.data = "Hallo Lehrer:innen und Freunde.";
    const selection = auswahl(node, 0, node, 5);
    await Promise.resolve();
    processor?.flush();
    expect(node.data).toBe("Hallo Lehrer und Freunde.");
    expect(selection.toString()).toBe("Hallo");
  });
});
