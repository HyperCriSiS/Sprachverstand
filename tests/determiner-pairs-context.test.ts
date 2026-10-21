import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026 (CTX-01, CTX-02): Begleitwortpaare mit Leerraum,
// ausgeschriebenem „oder“ und voll ausgeschriebenen Formen, `zum/zur`,
// markierte Adjektive ohne Artikel und die Phrasengrenze bei „als“.
describe("Begleitwortpaare und Singularkontext", () => {
  it.each([
    // Leerraum um den Schrägstrich (CTX-02).
    ["der/ die Nutzer*in", "der Nutzer"],
    ["der / die Nutzer*in", "der Nutzer"],
    ["der /die Nutzer*in", "der Nutzer"],
    ["der / die Nutzer*in", "der Nutzer"],
    ["des/ der Nutzer*in", "des Nutzers"],
    ["stellt der/ die Teilnehmer:in vor", "stellt der Teilnehmer vor"],
    // Ausgeschriebenes „oder“.
    ["der oder die Nutzer*in", "der Nutzer"],
    ["die oder der Nutzer*in", "der Nutzer"],
    ["Mitteilung an den oder die Arbeitgeber:in", "Mitteilung an den Arbeitgeber"],
    ["eine oder einen Mitarbeiter*in", "einen Mitarbeiter"],
    // Voll ausgeschriebene Paare in beiden Reihenfolgen.
    ["eine/einen Sachbearbeiter/-in", "einen Sachbearbeiter"],
    ["Ihrer/Ihrem Leser/in", "Ihrem Leser"],
    ["zu deiner*deinem Antragsberater*in.", "zu deinem Antragsberater."],
    ["einer*einem Fachärzt*in", "einem Facharzt"],
    ["zu ihrer*ihrem vertrauten Therapeut*in", "zu ihrem vertrauten Therapeuten"],
    // Zusammengezogene Präpositionen mit Dativ.
    ["Ausbildung zum/zur Erzieher/-in", "Ausbildung zum Erzieher"],
    ["Ausbildung zur/zum Sozialpädagog*in", "Ausbildung zum Sozialpädagogen"],
    ["Weiterbildung zum*r Praxisanleiter*in", "Weiterbildung zum Praxisanleiter"],
    ["bis zur*m Fremdsprachenkorrespondent*in.", "bis zum Fremdsprachenkorrespondenten."],
    ["Ausbildung zum/zur Zahnärztlichen Assistent*in", "Ausbildung zum Zahnärztlichen Assistenten"],
    // Markiertes Adjektiv ohne Artikel: starker Nominativ.
    ["Medizinische/r Technologe/in für Radiologie", "Medizinischer Technologe für Radiologie"],
    ["Medizinische*r Technolog*in", "Medizinischer Technologe"],
    ["Umschulung als Technische/-r Objektmanager/-in", "Umschulung als Technischer Objektmanager"],
    ["Stelle als wissenschaftliche:r Mitarbeiter:in", "Stelle als wissenschaftlicher Mitarbeiter"],
    // „als“ beginnt eine neue Phrase (CTX-01).
    ["welche Benefits Sie als Mitarbeiter:in erwarten", "welche Benefits Sie als Mitarbeiter erwarten"],
    ["Ihre Angaben als Teilnehmer*in", "Ihre Angaben als Teilnehmer"],
    ["Ihre Angaben als Anmelder*in", "Ihre Angaben als Anmelder"],
    ["die Arbeit als Volontär*in im Referat", "die Arbeit als Volontär im Referat"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Kein markiertes Nomen: Paar bleibt.
    ["der / die Variablenbeschreibung", "der / die Variablenbeschreibung"],
    ["Bus oder die Bahn", "Bus oder die Bahn"],
    // Feminine und mehrdeutige Begleitwörter direkt vor dem Nomen.
    ["eine weitere Mitarbeiter:in", "eine weitere Mitarbeiter:in"],
    ["als eine weitere Mitarbeiter:in", "als eine weitere Mitarbeiter:in"],
    ["einer Patient*in", "einer Patient*in"],
    // Markierte Begleitwörter sind keine Adjektive.
    ["[4] Eine*r Beamt*in eines LKA,", "[4] Eine*r Beamt*in eines LKA,"],
    ["je eine:r Hundeführer:in", "je eine:r Hundeführer:in"],
    ["sprich mit deine*r Bürgermeister*in.", "sprich mit deine*r Bürgermeister*in."],
    ["die Rückfrage de*r Kolleg*in", "die Rückfrage de*r Kolleg*in"],
    // Kein Nominativ nach Präposition oder markiertem Wort.
    ["Ausbildung zur/zum Anästhesietechnische*r Assistent*in", "Ausbildung zur/zum Anästhesietechnische*r Assistent*in"],
    ["mit jede:r andere:r Kapitalist:in", "mit jede:r andere:r Kapitalist:in"],
    // Nicht auflösbares markiertes Adjektiv: Nomen nicht allein umwandeln.
    ["mit engagierte*n Mitarbeiter*in", "mit engagierte*n Mitarbeiter*in"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});
