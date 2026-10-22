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
  it("wandelt nicht halb um, wenn das Begleitwort im vorigen Textknoten anders lauten müsste", () => {
    expect(dom("<p>Wir sprechen mit der <em>Patient*in</em> heute.</p>")).toBe("Wir sprechen mit der Patient*in heute.");
    expect(dom("<p>Die <a href=\"#\">Lehrer*in</a> kommt.</p>")).toBe("Die Lehrer*in kommt.");
    expect(dom("<p>Projekt der <em>Künstler*in</em></p>")).toBe("Projekt der Künstler*in");
  });

  it("nutzt das Begleitwort davor, wenn es unverändert bleiben kann", () => {
    expect(dom("<p>Wir sprechen mit dem <em>Patient*in</em> heute.</p>")).toBe("Wir sprechen mit dem Patienten heute.");
    expect(dom("<p>Alle <b>Lehrer*innen</b> kommen.</p>")).toBe("Alle Lehrer kommen.");
  });
});

// Eigenkreationen und Gruppennamen werden wie Personenbezeichnungen
// umgewandelt (Nutzerentscheidung 22.10.2026); die Schreibung bleibt.
describe("Eigenkreationen", () => {
  it.each([
    ["Werde jetzt InteGREATer:in", "Werde jetzt InteGREATer"],
    ["InteGREATer:innen sind Vorbilder", "InteGREATer sind Vorbilder"],
    ["die RosaLila PantherInnen", "die RosaLila Panther"],
    ["DünenPat:innen - wir tun was!", "DünenPaten - wir tun was!"],
    ["Von Landwirten zu LandVirt:innen", "Von Landwirten zu LandVirten"],
    ["Die Brandenburg:innen damals und heute", "Die Brandenburger damals und heute"],
    // Normale Feminina bleiben.
    ["Drei Pantherinnen im Zoo", "Drei Pantherinnen im Zoo"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

// Satzbau entscheidet den Fall bei mehrdeutigem Begleitwort.
describe("Kasus aus dem Satzbau", () => {
  it.each([
    // Subjekt nach Verb an zweiter Stelle.
    ["In der Praxis findet die Ärzt*in kaum Zeit.", "In der Praxis findet der Arzt kaum Zeit."],
    ["Dann griff die Referent*in das Thema auf.", "Dann griff der Referent das Thema auf."],
    // Subjekt nach Relativpronomen im Dativ/Akkusativ oder nach Präposition.
    ["der Datenraum, über den die Patient*in verfügen kann", "der Datenraum, über den der Patient verfügen kann"],
    ["Der Schlauch, den die Ärzt*in legt", "Der Schlauch, den der Arzt legt"],
    // Genitiv `einer` nach Nomen, Dativ nach Präposition.
    ["mit dem Comic einer Autor*in", "mit dem Comic eines Autors"],
    ["Mit einer erfahrenen Mitarbeiter:in", "Mit einem erfahrenen Mitarbeiter"],
    ["Laut der Ärzt*in ist das so.", "Laut dem Arzt ist das so."],
    // Verb mit Dativobjekt vor `der`.
    ["Wir danken der Patient*in, die half.", "Wir danken dem Patienten, der half."],
    ["Sie folgt der neuen Trainer*in.", "Sie folgt dem neuen Trainer."],
    // Präposition legt den Fall eines Nominativpaars fest.
    ["Gespräch mit der oder die Kolleg*in.", "Gespräch mit dem Kollegen."],
    ["Gespräch mit der/die Kolleg*in.", "Gespräch mit dem Kollegen."],
    ["Ein Brief für der oder die neue Kolleg*in.", "Ein Brief für den neuen Kollegen."],
    ["Der oder die Kolleg*in kommt.", "Der Kollege kommt."],
    // Überschrift ohne Trennung vor dem Fließtext.
    ["Ihre Arbeitgeber:in Das Diakoniewerk ist groß.", "Ihr Arbeitgeber Das Diakoniewerk ist groß."],
    ["Werden Sie unsere Freund*in!", "Werden Sie unser Freund!"],
    // Subjektpronomen vergeben das Subjekt: Objekt im Akkusativ, mit Kopula Nominativ.
    ["Werden Sie die Ärzt*in anrufen?", "Werden Sie den Arzt anrufen?"],
    ["Rufen Sie die Ärzt*in an.", "Rufen Sie den Arzt an."],
    ["Wenn Sie die Ärzt*in sehen, grüßen Sie.", "Wenn Sie den Arzt sehen, grüßen Sie."],
    ["Sind Sie die Ärzt*in?", "Sind Sie der Arzt?"],
    ["Wenn Sie die Ärzt*in sind, melden Sie sich.", "Wenn Sie der Arzt sind, melden Sie sich."],
    ["Wollen Sie eine Ärzt*in werden?", "Wollen Sie ein Arzt werden?"],
    // Vorangestelltes Subjekt und Verb mit typischem Personenobjekt.
    ["Das Projekt unterstützt die Künstler*in.", "Das Projekt unterstützt den Künstler."],
    ["Der Verein fördert eine junge Künstler*in.", "Der Verein fördert einen jungen Künstler."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Bei Verben wie „leiten“ ist die Person meist selbst Subjekt.
    "Das Projekt leitet die Künstler*in.",
    // Relativpronomen im Nominativ kann Subjekt sein.
    "Die Stadt, der die Künstler*in hilft",
    // Nebensatz ohne Komma: Subjekt offen.
    "Ich glaube dass die Ärzt*in kommt.",
    // Pronomen vor Dativobjekt ist kein Genitivbezug.
    "Geben Sie der Ärzt*in Bescheid.",
    "Sie gibt einer Ärzt*in das Buch."
  ])("bleibt: %s", (input) => expect(t(input)).toBe(input));
});
