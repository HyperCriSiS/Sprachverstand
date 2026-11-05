import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { transformTextWithSummary, type DetailedTransformResult, type TransformOptions } from "../src/core/transform-text";
import { collectQuoteRanges } from "../src/core/quote-ranges";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

function starten(
  html: string,
  options: Partial<ConstructorParameters<typeof DomProcessor>[1]> = {}
): HTMLElement {
  document.body.innerHTML = html;
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false,
    ...options
  });
  processor.start();
  processor.flush();
  return document.body;
}

async function abwarten(fertig: () => boolean, runden = 40): Promise<void> {
  for (let index = 0; index < runden && !fertig(); index++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    processor?.flush();
  }
}

// Requests are answered only when the test releases them, by input text.
function steuerbarerTransformer() {
  const offen = new Map<string, { resolve: (value: DetailedTransformResult) => void; options: TransformOptions }>();
  const transformText = (input: string, options: TransformOptions) =>
    new Promise<DetailedTransformResult>((resolve) => {
      offen.set(input, { resolve, options });
    });
  const freigeben = (input: string): void => {
    const eintrag = offen.get(input);
    if (!eintrag) throw new Error(`Kein offener Request für ${JSON.stringify(input)}`);
    offen.delete(input);
    eintrag.resolve(transformTextWithSummary(input, defaultRules, eintrag.options));
  };
  return { transformText, freigeben, offen };
}

describe("Browser-Überprüfung 04.11.2026, Runde 2: Schutzbereiche über Knotengrenzen", () => {
  it("verarbeitet einen sehr langen Inline-Lauf auch mit Schutzbegriff (B1)", async () => {
    const spans = Array.from({ length: 700 }, (_, index) =>
      `<span>Alle Lehrer*innen kommen ${index}. </span>`).join("");
    const body = starten(`<div>${spans}<span>Peter kommt.</span></div><p>Alle Lehrer*innen bleiben.</p>`,
      { protectedTerms: ["Peter"] });
    await abwarten(() => !body.querySelector("div")!.textContent!.includes("*innen"));
    const div = body.querySelector("div")!;
    expect(div.textContent!.length).toBeGreaterThan(16_384);
    expect(div.textContent).not.toContain("*innen");
    expect(div.textContent).toContain("Peter kommt.");
    expect(body.querySelector("p")!.textContent).toBe("Alle Lehrer bleiben.");
    expect(processor!.getReplacementCount()).toBe(701);
  });

  it("paart Zitate über geschützte Inline-Elemente und technische Knoten hinweg (B5)", () => {
    const body = starten(
      "<p>„Alle <code>git</code> Nutzer*innen“ kamen.</p>" +
      "<p>„Siehe <a>www.schule.de</a> für alle Lehrer*innen“ sagte er. Alle Schüler*innen lesen.</p>",
      { processQuotedText: false }
    );
    const [erster, zweiter] = body.querySelectorAll("p");
    expect(erster!.textContent).toBe("„Alle git Nutzer*innen“ kamen.");
    expect(zweiter!.textContent).toBe("„Siehe www.schule.de für alle Lehrer*innen“ sagte er. Alle Schüler lesen.");
  });

  it("schützt Mehrwortbegriffe auch mit geschütztem Leerzeichen und Zeilenumbruch (B6)", () => {
    const body = starten(
      "<p>Frau Anna Lehrer*innen und Anna<br>Lehrer*innen und Frau <b>Anna</b> Lehrer*innen, aber Lehrer*innen.</p>",
      { protectedTerms: ["Anna Lehrer*innen"] }
    );
    expect(body.querySelector("p")!.textContent)
      .toBe("Frau Anna Lehrer*innen und AnnaLehrer*innen und Frau Anna Lehrer*innen, aber Lehrer.");
    expect(transformTextWithSummary("Anna Lehrer*innen und Lehrer*innen", defaultRules,
      { profile: "aggressive", protectedTerms: ["Anna Lehrer*innen"] }).text)
      .toBe("Anna Lehrer*innen und Lehrer");
  });

  it.each([
    // Zollzeichen öffnen und schließen kein Zitat.
    ['Der 24" Monitor für Lehrer*innen und der 27" Monitor.', 'Der 24" Monitor für Lehrer und der 27" Monitor.'],
    // Ein einzelnes „““ nach einem Wort ist ein schließendes Zeichen.
    ["Der Begriff“ ist gut und Lehrer*innen sagen es.", "Der Begriff“ ist gut und Lehrer sagen es."],
    // Englische Zitate bleiben geschützt.
    ["Sie sagten “Lehrer*innen” und Lehrer*innen.", "Sie sagten “Lehrer*innen” und Lehrer."],
    // Ein offenes „ schützt bis zum Ende des Textes.
    ["„Liebe Lehrer*innen, wir danken allen Schüler*innen", "„Liebe Lehrer*innen, wir danken allen Schüler*innen"],
    ["Alle Lehrer*innen sagten: „Liebe Schüler*innen,", "Alle Lehrer sagten: „Liebe Schüler*innen,"]
  ])("bewertet Anführungszeichen nach Kontext (B7): %s", (eingabe, erwartet) => {
    expect(transformTextWithSummary(eingabe, defaultRules, { profile: "aggressive", processQuotedText: false }).text)
      .toBe(erwartet);
  });

  it("verwendet dieselben Zitatspannen im Inline-Lauf (B7)", () => {
    const body = starten(
      "<p>Der 24\" <b>Monitor</b> für Lehrer*innen.</p><p>„Liebe <b>Lehrer*innen</b>,</p><p>„wir danken allen <i>Schüler*innen</i>.“</p>",
      { processQuotedText: false }
    );
    const absaetze = [...body.querySelectorAll("p")].map((p) => p.textContent);
    expect(absaetze).toEqual([
      "Der 24\" Monitor für Lehrer.",
      "„Liebe Lehrer*innen,",
      "„wir danken allen Schüler*innen.“"
    ]);
    expect(collectQuoteRanges("a „b“ c")).toEqual([{ start: 2, end: 5 }]);
  });
});

describe("Browser-Überprüfung 04.11.2026, Runde 2: getrennte Marker (B2)", () => {
  it("entfernt den Marker auch aus einem Vortext mit eigener Änderung", () => {
    const body = starten("<p>Liebe Kolleg*innen und Lehrer*<b>innen</b>, kommt.</p>");
    expect(body.querySelector("p")!.textContent).toBe("Liebe Kollegen und Lehrer, kommt.");
    expect(processor!.getReplacementCount()).toBe(2);
    processor!.stop({ restore: true });
    processor = undefined;
    expect(body.innerHTML).toBe("<p>Liebe Kolleg*innen und Lehrer*<b>innen</b>, kommt.</p>");
  });

  it("entfernt den Marker über den asynchronen Pfad aus einem Vortext mit eigener Änderung", async () => {
    const body = starten("<p>Liebe Kolleg*innen und Lehrer*<b>innen</b>, kommt.</p>", {
      transformText: (input, options) => Promise.resolve(transformTextWithSummary(input, defaultRules, options))
    });
    await abwarten(() => body.textContent === "Liebe Kollegen und Lehrer, kommt.");
    expect(body.querySelector("p")!.textContent).toBe("Liebe Kollegen und Lehrer, kommt.");
  });

  it("wartet auf den Vortext, wenn dessen Antwort nach der des Markers kommt", async () => {
    const steuerung = steuerbarerTransformer();
    const body = starten("<p>Alle Lehrer*<b>innen</b> kommen.</p>", { transformText: steuerung.transformText });
    await abwarten(() => steuerung.offen.size >= 2, 10);
    expect([...steuerung.offen.keys()]).toContain("Alle Lehrer*");
    steuerung.freigeben("innen");
    await abwarten(() => false, 3);
    expect(body.textContent).toBe("Alle Lehrer*innen kommen.");
    // The stem's answer arrives; the marker text is asked again and answered.
    for (let runde = 0; runde < 20 && body.textContent !== "Alle Lehrer kommen."; runde++) {
      for (const key of [...steuerung.offen.keys()]) steuerung.freigeben(key);
      await abwarten(() => false, 2);
    }
    expect(body.textContent).toBe("Alle Lehrer kommen.");
    expect(processor!.getReplacementCount()).toBe(1);
  });
});

describe("Browser-Überprüfung 04.11.2026, Runde 2: zerlegte Umlaute (V3)", () => {
  it("gibt nur dem zerlegten Wort seine Codeeinheiten zurück, nicht einem gleichen komponierten", () => {
    const nfc = "Künstler:in";
    const nfd = nfc.normalize("NFD");
    const eingabe = `Die ${nfc} und die ${nfd} und alle Lehrer*innen.`;
    const ausgabe = transformTextWithSummary(eingabe, defaultRules, { profile: "aggressive" }).text;
    expect(ausgabe).toBe(`Die ${nfc} und die ${nfd} und alle Lehrer.`);
    const umgekehrt = transformTextWithSummary(`Die ${nfd} und die ${nfc} und alle Lehrer*innen.`, defaultRules,
      { profile: "aggressive" }).text;
    expect(umgekehrt).toBe(`Die ${nfd} und die ${nfc} und alle Lehrer.`);
  });
});
