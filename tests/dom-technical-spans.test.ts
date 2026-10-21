import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { transformTextWithSummary } from "../src/core/transform-text";
import { isTechnicalTextNodeValue, technicalSpanRanges } from "../src/core/text-safety";
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
  return document.body.firstElementChild as HTMLElement;
}

// Webanalyse 21.10.2026 (DOM-01): Eine URL oder E-Mail-Adresse schützte den
// ganzen Textknoten; auf fünf Domains blieben dadurch normale Sätze stehen.
describe("URL und E-Mail schützen nur ihre eigene Spanne", () => {
  it.each([
    ["<p>Nutzer*innen lesen auf https://example.org/nutzer:innen weiter.</p>",
      "Nutzer lesen auf https://example.org/nutzer:innen weiter."],
    ["<p>Alle Lehrer*innen schreiben an lehrer:innen@schule.de oder anrufen.</p>",
      "Alle Lehrer schreiben an lehrer:innen@schule.de oder anrufen."],
    ["<p>Unterstützer:innen finden alles unter www.example.org/spender:innen und hier.</p>",
      "Unterstützer finden alles unter www.example.org/spender:innen und hier."]
  ])("%s", (html, expected) => {
    expect(start(html).textContent).toBe(expected);
  });

  it("gilt auch für die asynchrone Verarbeitung", async () => {
    const p = start("<p>Patient:innen erreichen uns unter https://klinik.example/patient:innen gut.</p>", true);
    await new Promise((resolve) => setTimeout(resolve, 20));
    processor!.flush();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(p.textContent).toBe("Patienten erreichen uns unter https://klinik.example/patient:innen gut.");
  });

  it("stellt beim Ausschalten exakt wieder her", () => {
    const original = "Nutzer*innen lesen auf https://example.org/nutzer:innen weiter.";
    const p = start(`<p>${original}</p>`);
    processor!.stop({ restore: true });
    processor = undefined;
    expect(p.textContent).toBe(original);
  });

  it.each([
    // Nur Technik ohne natürlichen Text bleibt vollständig geschützt.
    "<p>https://example.org/Lehrer*innen</p>",
    "<p>lehrer:innen@schule.de</p>",
    "<p>Siehe https://example.org/Lehrer*innen</p>",
    // Geschützte Elemente bleiben unberührt.
    "<p><code>Nutzer*innen lesen auf https://example.org/</code></p>"
  ])("bleibt: %s", (html) => {
    const element = start(html);
    const before = new DOMParser().parseFromString(html, "text/html").body.textContent;
    expect(element.textContent).toBe(before);
  });
});

describe("Hilfsfunktionen", () => {
  it("findet URL- und E-Mail-Spannen", () => {
    const text = "Mail an a@b.de oder https://x.org/y heute";
    expect(technicalSpanRanges(text).map(({start, end}) => text.slice(start, end)))
      .toEqual(["a@b.de", "https://x.org/y"]);
  });

  it("wertet nur reine Technik als technischen Knoten", () => {
    expect(isTechnicalTextNodeValue("https://example.org/a")).toBe(true);
    expect(isTechnicalTextNodeValue("Siehe https://example.org/a")).toBe(true);
    expect(isTechnicalTextNodeValue("Nutzer*innen lesen auf https://example.org/a")).toBe(false);
    expect(isTechnicalTextNodeValue("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJzdWIiOiIxMjM0NTY3")).toBe(true);
  });
});
