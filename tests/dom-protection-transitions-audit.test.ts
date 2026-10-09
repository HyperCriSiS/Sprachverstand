import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const regel: Rule = {
  id: "test.audit-dom09",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return { text, replacements: text === input ? 0 : 1 };
  }
};
let processor: DomProcessor | undefined;
function starten(attribute = true): DomProcessor {
  processor = new DomProcessor(document, {
    rules: [regel],
    profile: "conservative",
    processAccessibleAttributes: attribute
  });
  processor.start();
  return processor;
}
async function abwarten(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  processor?.flush();
}
afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.designMode = "off";
  document.body.replaceChildren();
});

describe("Audit DOM-09: dynamischer Schutzstatus", () => {
  it.each([
    ["aria-hidden", "true"],
    ["data-sprachverstand-ignore", ""],
    ["contenteditable", "true"],
    ["role", "textbox"]
  ])("verarbeitet beim Entfernen von %s neu", async (attribute, value) => {
    const p = document.createElement("p");
    p.setAttribute(attribute, value);
    p.textContent = "Nutzer:innen";
    document.body.append(p);
    const dom = starten();
    expect(p.textContent).toBe("Nutzer:innen");
    p.removeAttribute(attribute);
    await abwarten();
    expect(p.textContent).toBe("Nutzer");
    expect(dom.getReplacementCount()).toBe(1);
  });

  it.each([
    ["aria-hidden", "true"],
    ["contenteditable", "true"],
    ["data-sprachverstand-ignore", ""],
    ["role", "textbox"]
  ])("stellt Original und Zähler bei neuem %s wieder her", async (attribute, value) => {
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen";
    document.body.append(p);
    const dom = starten();
    expect(p.textContent).toBe("Nutzer");
    p.setAttribute(attribute, value);
    await abwarten();
    expect(p.textContent).toBe("Nutzer:innen");
    expect(dom.getReplacementCount()).toBe(0);
    expect(dom.getReplacementSummary()).toEqual([]);
  });

  it("schützt neue Editoren auch ohne Attributverarbeitung", async () => {
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen";
    document.body.append(p);
    const dom = starten(false);
    p.setAttribute("contenteditable", "plaintext-only");
    await abwarten();
    expect(p.textContent).toBe("Nutzer:innen");
    expect(dom.getReplacementCount()).toBe(0);
    p.removeAttribute("contenteditable");
    await abwarten();
    expect(p.textContent).toBe("Nutzer");
  });

  it("stellt eigenen Text und Aria-Attribute beim Editorwechsel wieder her", async () => {
    const p = document.createElement("p");
    p.setAttribute("aria-label", "Nutzer:innen lesen");
    p.textContent = "Nutzer:innen";
    document.body.append(p);
    const dom = starten();
    expect(dom.getReplacementCount()).toBe(2);
    p.setAttribute("contenteditable", "true");
    await abwarten();
    expect(p.textContent).toBe("Nutzer:innen");
    expect(p.getAttribute("aria-label")).toBe("Nutzer:innen lesen");
    expect(dom.getReplacementCount()).toBe(0);
  });

  it("stellt beim Verschieben in einen bestehenden Editor das Original wieder her", async () => {
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen";
    const editor = document.createElement("div");
    editor.setAttribute("contenteditable", "true");
    document.body.append(p, editor);
    const dom = starten();
    expect(p.textContent).toBe("Nutzer");
    editor.append(p);
    await abwarten();
    expect(p.textContent).toBe("Nutzer:innen");
    expect(dom.getReplacementCount()).toBe(0);
  });

  it("überschreibt keine bereits extern veränderten Editordaten", async () => {
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen";
    document.body.append(p);
    starten();
    p.textContent = "Vollständig neuer Text";
    p.setAttribute("contenteditable", "true");
    await abwarten();
    expect(p.textContent).toBe("Vollständig neuer Text");
  });

  it("restauriert vor der ersten designMode-Benutzereingabe", () => {
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen";
    document.body.append(p);
    const dom = starten();
    expect(p.textContent).toBe("Nutzer");
    document.designMode = "on";
    p.dispatchEvent(new Event("beforeinput", { bubbles: true }));
    expect(p.textContent).toBe("Nutzer:innen");
    expect(dom.getReplacementCount()).toBe(0);
  });
  it("korrigiert nach designMode-Off ohne Mutation erneut", async () => {
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen";
    document.body.append(p);
    const dom = starten();
    expect(p.textContent).toBe("Nutzer");

    document.designMode = "on";
    p.dispatchEvent(new Event("beforeinput", { bubbles: true }));
    expect(p.textContent).toBe("Nutzer:innen");
    expect(dom.getReplacementCount()).toBe(0);

    document.designMode = "off";
    // Kein Eingabe-, Änderungs- oder anderes DOM-Ereignis auslösen.
    await vi.waitFor(() => {
      expect(p.textContent).toBe("Nutzer");
      expect(dom.getReplacementCount()).toBe(1);
    }, { timeout: 4_500 });
  });

  it("korrigiert nach Verlassen eines bereits aktiven DesignMode", async () => {
    document.designMode = "on";
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen";
    document.body.append(p);
    const dom = starten();
    expect(p.textContent).toBe("Nutzer:innen");

    document.designMode = "off";
    await vi.waitFor(() => {
      expect(p.textContent).toBe("Nutzer");
      expect(dom.getReplacementCount()).toBe(1);
    }, { timeout: 4_500 });
  });

  it("übernimmt externe Texte nach DesignMode-Off, statt alte Fassungen zurückzuholen", async () => {
    const p = document.createElement("p");
    p.textContent = "Nutzer:innen";
    document.body.append(p);
    const dom = starten();
    document.designMode = "on";
    p.dispatchEvent(new Event("beforeinput", { bubbles: true }));
    p.textContent = "Neue Nutzer:innen";
    await abwarten();
    expect(p.textContent).toBe("Neue Nutzer:innen");

    document.designMode = "off";
    await vi.waitFor(() => {
      expect(p.textContent).toBe("Neue Nutzer");
      expect(dom.getReplacementCount()).toBe(1);
    }, { timeout: 4_500 });
  });

});