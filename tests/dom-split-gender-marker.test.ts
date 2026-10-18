import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { transformTextWithSummary } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

function start(html: string, asynchronous = false): HTMLElement {
  document.body.innerHTML = html;
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false,
    ...(asynchronous ? {
      transformText: (input, options) =>
        Promise.resolve(transformTextWithSummary(input, defaultRules, options))
    } : {})
  });
  processor.start();
  processor.flush();
  return document.querySelector("p")!;
}

describe("DOM-01: über Inline-Elemente getrennte Genderformen", () => {
  it.each([
    ["<p>Alle Lehrer<em>:innen</em> kommen.</p>", "Alle Lehrer kommen."],
    ["<p>Alle <a href=\"#\">Lehrer</a>:innen kommen.</p>", "Alle Lehrer kommen."],
    ["<p>Alle Mitarbeiter<b>Innen</b> kommen.</p>", "Alle Mitarbeiter kommen."],
    ["<p>Liebe <strong>Kolleg</strong>:innen,</p>", "Liebe Kollegen,"],
    ["<p>Alle Lehrer<wbr>*innen kommen.</p>", "Alle Lehrer kommen."],
    ["<p>Alle Lehrer<span>*</span>innen kommen.</p>", "Alle Lehrer kommen."],
    ["<p>Alle Lehrer*<b>innen</b> kommen.</p>", "Alle Lehrer kommen."],
    ["<p>Liebe Kolleg<span>:</span>innen,</p>", "Liebe Kollegen,"]
  ])("%s", (html, expected) => {
    expect(start(html).textContent).toBe(expected);
  });

  it("ändert nur den Markerteil und behält die Elementstruktur", () => {
    const p = start("<p>Liebe <strong>Kolleg</strong>:innen,</p>");
    expect(p.querySelector("strong")!.textContent).toBe("Kolleg");
    expect(p.lastChild!.textContent).toBe("en,");
  });

  it.each([
    // Umlautwechsel: der Stamm im Nachbarelement müsste sich ändern.
    ["<p>Alle Bäuer<em>:innen</em> kommen.</p>", "Alle Bäuer:innen kommen."],
    ["<p>Der Garten<b>Innenhof</b> ist offen.</p>", "Der GartenInnenhof ist offen."],
    ["<p>Alle Lehrer <em>:innen</em> kommen.</p>", "Alle Lehrer :innen kommen."],
    ["<p>Alle Bäuer<span>*</span>innen kommen.</p>", "Alle Bäuer*innen kommen."],
    ["<p>Die Tür öffnet nach <b>innen</b>.</p>", "Die Tür öffnet nach innen."]
  ])("bleibt konservativ: %s", (html, expected) => {
    expect(start(html).textContent).toBe(expected);
  });

  it("stellt Original und Markup vollständig wieder her", () => {
    const html = "<p>Liebe <strong>Kolleg</strong>:innen, <a href=\"#\">Lehrer</a>:innen und " +
      "Ärzt<span>*</span>innen, Forscher*<b>innen</b>,</p>";
    start(html);
    processor!.stop({ restore: true });
    processor = undefined;
    expect(document.body.innerHTML).toBe(html);
  });

  it("bewertet neu, wenn sich der Stamm davor ändert", async () => {
    const p = start("<p>Alle <a href=\"#\">Lehrer</a>:innen kommen.</p>");
    expect(p.textContent).toBe("Alle Lehrer kommen.");
    p.querySelector("a")!.textContent = "Kolleg";
    await new Promise(resolve => setTimeout(resolve, 0));
    processor!.flush();
    expect(p.textContent).toBe("Alle Kollegen kommen.");
  });

  it("funktioniert über den asynchronen Hintergrundpfad", async () => {
    const p = start("<p>Liebe <strong>Kolleg</strong>:innen,</p>", true);
    for (let index = 0; index < 20 && p.textContent !== "Liebe Kollegen,"; index++) {
      await new Promise(resolve => setTimeout(resolve, 5));
      processor!.flush();
    }
    expect(p.textContent).toBe("Liebe Kollegen,");
  });

  it("entfernt keinen Marker aus einem geschützten Element", () => {
    const p = start("<p>Alle Lehrer<code>*</code>innen kommen.</p>");
    expect(p.querySelector("code")!.textContent).toBe("*");
    expect(p.textContent).toBe("Alle Lehrer*innen kommen.");
  });

  it("entfernt den getrennten Marker auch über den asynchronen Pfad", async () => {
    const p = start("<p>Alle Lehrer<span>*</span>innen kommen.</p>", true);
    for (let index = 0; index < 20 && p.textContent !== "Alle Lehrer kommen."; index++) {
      await new Promise(resolve => setTimeout(resolve, 5));
      processor!.flush();
    }
    expect(p.textContent).toBe("Alle Lehrer kommen.");
  });

  it("erkennt den Dativauslöser in einem vorangehenden Element", () => {
    expect(start("<p>Mit <em>allen</em> Lehrer*innen sprechen.</p>").textContent)
      .toBe("Mit allen Lehrern sprechen.");
  });
});
