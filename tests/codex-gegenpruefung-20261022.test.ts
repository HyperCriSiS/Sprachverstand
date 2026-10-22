import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Unabhängige Gegenprüfung vom 22.10.2026 auf main `ed9edd0`.
describe("Fehlumwandlungen aus der Gegenprüfung", () => {
  it.each([
    // Regression aus #479: Verb am Satzanfang ist kein Nomen vor Genitiv-der.
    ["Ist der Lehrer*in schon da?", "Ist der Lehrer schon da?"],
    ["Hat der Patient*in Schmerzen?", "Hat der Patient Schmerzen?"],
    ["Kann der Ärzt:in helfen?", "Kann der Arzt helfen?"],
    ["Das Projekt der Künstler*in.", "Das Projekt des Künstlers."],
    // Relativpronomen folgt dem umgewandelten Singular (Regression aus #489).
    ["Jedes Lab wird von einer Künstler:in oder Technolog:in begleitet, deren Praxis dominante Internetinfrastrukturen herausfordert.",
      "Jedes Lab wird von einem Künstler oder Technologen begleitet, dessen Praxis dominante Internetinfrastrukturen herausfordert."],
    ["mit der Lehrer*in, die gewonnen hat", "mit dem Lehrer, der gewonnen hat"],
    ["mit der Kolleg:in, die wir kennen", "mit dem Kollegen, den wir kennen"],
    ["mit einer Ärzt:in, der wir vertrauen", "mit einem Arzt, dem wir vertrauen"],
    ["Dazu kommt ein:e Projektleiter:in, die meist keine Führung hat", "Dazu kommt ein Projektleiter, der meist keine Führung hat"],
    // Dativ vor einem Verb wie „obliegen“, kein Genitiv.
    ["deren technische Erfordernisse und Umsetzung der Antragsteller:in obliegen",
      "deren technische Erfordernisse und Umsetzung dem Antragsteller obliegen"],
    // Koordination nach bereits aufgelöstem erstem Glied.
    ["Diese Doppelposition Studierende_r und Mitarbeiter_in ist etwas Besonderes.",
      "Diese Doppelposition Student und Mitarbeiter ist etwas Besonderes."],
    // Lexikon.
    ["Wenn Sie auf der Suche nach einem:r Dachdecker:in oder einem:r Nageldesigner:in sind",
      "Wenn Sie auf der Suche nach einem Dachdecker oder einem Nageldesigner sind"],
    ["Status: Beamter/in bzw. Tarifbeschäftigte/r", "Status: Beamter bzw. Tarifbeschäftigter"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Der Relativsatz gehört zur Stelle, nicht zur Berufsbezeichnung.
    ["Die Ausbildung zum/zur Krankenpflegehelfer/in, die wir Dir anbieten, dauert",
      "Die Ausbildung zum Krankenpflegehelfer, die wir Dir anbieten, dauert"],
    // Beide Lesarten möglich: Pronomen bleibt.
    ["mit der Lehrer*in, die Fragen beantwortet", "mit dem Lehrer, die Fragen beantwortet"],
    // `es` kann Objekt sein: der Relativ ist Subjekt.
    ["als Praktikant:in beschäftigen, die es sich leisten kann", "als Praktikant beschäftigen, die es sich leisten kann"]
  ])("lässt das Relativpronomen in %s stehen", (input, expected) => expect(t(input)).toBe(expected));
});

let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: false}); processor = undefined; document.body.replaceChildren();
});

function dom(html: string): string {
  document.body.innerHTML = html;
  processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive"});
  processor.start(); processor.flush();
  return document.body.textContent ?? "";
}

describe("Singular am Anfang eines Inline-Elements", () => {
  it("ändert das Begleitwort im vorigen Textknoten mit", () => {
    expect(dom("<p>Wir sprechen mit der <em>Patient*in</em> heute.</p>")).toBe("Wir sprechen mit dem Patienten heute.");
    expect(dom("<p>Projekt der <em>Künstler*in</em></p>")).toBe("Projekt des Künstlers");
    expect(dom("<p>Gespräch mit der <b>neuen Kolleg*in</b>.</p>")).toBe("Gespräch mit dem neuen Kollegen.");
  });

  it("wandelt nicht halb um, wenn das Begleitwort mehrdeutig ist", () => {
    expect(dom("<p>Die <a href=\"#\">Lehrer*in</a> kommt.</p>")).toBe("Die Lehrer*in kommt.");
  });

  it("stellt beide Textknoten wieder her", () => {
    const html = "<p>Das Projekt der <em>Künstler*in</em> ist neu.</p>";
    expect(dom(html)).toBe("Das Projekt des Künstlers ist neu.");
    processor?.stop({restore: true}); processor = undefined;
    expect(document.body.innerHTML).toBe(html);
  });

  it("nutzt das Begleitwort davor, wenn es unverändert bleiben kann", () => {
    expect(dom("<p>Wir sprechen mit dem <em>Patient*in</em> heute.</p>")).toBe("Wir sprechen mit dem Patienten heute.");
    expect(dom("<p>Alle <b>Lehrer*innen</b> kommen.</p>")).toBe("Alle Lehrer kommen.");
  });
});
