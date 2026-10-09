import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

// Unabhängig im Web beobachtete kurze Textoberflächen, Stand 09.10.2026.
// Quellen-URLs, Abrufzeitpunkte und Herkunftsnachweise bleiben im privaten Prüfbericht.
// Die Auswahl ist gezielt und NICHT repräsentativ für das gesamte Web.
const positive = [
  ["p01a","Hinweise für aktive Teilnehmer:innen","Hinweise für aktive Teilnehmer"],
  ["p01b","Referent:innen-Verzeichnis","Referenten-Verzeichnis"],
  ["p02a","Student:innen","Studenten"],
  ["p02b","Referent:innen","Referenten"],
  ["p02c","Presse-Vertreter:innen","Presse-Vertreter"],
  ["p03a","Fragen der Teilnehmer:innen","Fragen der Teilnehmer"],
  ["p03b","mit den Referent:innen","mit den Referenten"],
  ["p04a","Die Folien der gematik-Referent:innen","Die Folien der gematik-Referenten"],
  ["p04b","Bei externen Referent:innen","Bei externen Referenten"],
  ["p05a","Die Referent*innen","Die Referenten"],
  ["p05b","Erfahrene Expert*innen","Erfahrene Experten"],
  ["p06a","Stimmen unserer Teilnehmer*innen","Stimmen unserer Teilnehmer"],
  ["p07a","Wissenschaftler*innen am Fraunhofer IAO","Wissenschaftler am Fraunhofer IAO"],
  ["p07b","mit erfahrenen Forscher*innen","mit erfahrenen Forschern"],
  ["p08a","Viele Verbraucher:innen","Viele Verbraucher"],
  ["p08b","Finanzberater:innen","Finanzberater"],
  ["p08c","Verkäufer:innen Produkte","Verkäufer Produkte"],
  ["p08d","Vermittler:innen ihnen","Vermittler ihnen"],
  ["p08e","Verbraucher:innen wenden sich","Verbraucher wenden sich"],
  ["p09a","Wissenschaftliche Mitarbeiter:innen","Wissenschaftliche Mitarbeiter"],
  ["p09b","Mitarbeiter:innen in Technik und Verwaltung","Mitarbeiter in Technik und Verwaltung"],
  ["p10a","unserer Wissenschaftler*innen","unserer Wissenschaftler"],
  ["p10b","Wir suchen Forscher*innen","Wir suchen Forscher"],
  ["p10c","neue Kolleg*innen","neue Kollegen"],
  ["p11a","Berufsalltag unserer Forscher*innen","Berufsalltag unserer Forscher"],
  ["p11b","Wissenschaftler*innen des Instituts","Wissenschaftler des Instituts"],
  ["p12a","den Forscher*innen und Expert*innen des Instituts","den Forschern und Experten des Instituts"],
  ["p12b","mit den Betreuer*innen","mit den Betreuern"],
  ["p13a","Viele Verbraucher:innen suchen Unterstützung","Viele Verbraucher suchen Unterstützung"],
  ["p13b","persönlichen Betreuer:innen","persönlichen Betreuern"],
  ["p14a","die Berater:innen","die Berater"],
  ["p14b","Verbraucher:innen berichten","Verbraucher berichten"]
] as const;

const negative = [
  ["n01a","Ansprechpartnerin"],
  ["n01b","Kongress"],
  ["n02a","Ausstellende"],
  ["n02b","Wissenschaft"],
  ["n03a","Teilnehmenden"],
  ["n03b","Anmeldebestätigung"],
  ["n04a","die Teilnehmenden"],
  ["n04b","Anmeldeformular"],
  ["n05a","Kinder- und Jugendunterkünfte"],
  ["n05b","Führungskräfte"],
  ["n06a","Psychotherapie"],
  ["n06b","Erwachsenenalter"],
  ["n07a","Wissenschaft"],
  ["n07b","Verwaltung und IT"],
  ["n08a","Bankberater und Versicherungsvertreter"],
  ["n08b","die Sparenden"],
  ["n09a","Studierende"],
  ["n09b","Fachbereichsrat"],
  ["n10a","Verwaltung und Technik"],
  ["n10b","Instandhaltung"],
  ["n11a","Schülerinnen"],
  ["n11b","Mädchen"],
  ["n12a","Studierende"],
  ["n12b","Praktikumsplätze"],
  ["n13a","Handelssystem"],
  ["n14a","Software AnyDesk"]
] as const;

const prüfe = (text: string) =>
  transformText(text, defaultRules, { profile: "aggressive" });

describe("Erweiterte Real-Web-Stichprobe: beobachtete Positivfälle", () => {
  it.each(positive)("%s: normalisiert exakt zum annotierten Ziel", (_id, eingabe, ziel) => {
    const ausgabe = prüfe(eingabe);
    expect(ausgabe.text).toBe(ziel);
    expect(ausgabe.replacements).toBeGreaterThan(0);
  });
});

describe("Erweiterte Real-Web-Stichprobe: beobachtete Negativfälle", () => {
  it.each(negative)("%s: verändert unmarkierte Oberfläche nicht", (_id, eingabe) => {
    expect(prüfe(eingabe)).toEqual({ text: eingabe, replacements: 0 });
  });
});

describe("Messgrenzen: getrennte Zähler und reproduzierbarer Umfang", () => {
  it("zeigt Umfang und vermeidet Stichproben-Dopplungen", () => {
    expect(positive).toHaveLength(32);
    expect(negative).toHaveLength(26);
    expect(new Set(positive.map(([id]) => id)).size).toBe(positive.length);
    expect(new Set(negative.map(([id]) => id)).size).toBe(negative.length);

    const richtigePositivfälle = positive.filter(([, eingabe, ziel]) =>
      prüfe(eingabe).text === ziel).length;
    const ungewollteÄnderungen = negative.filter(([, eingabe]) =>
      prüfe(eingabe).text !== eingabe).length;

    expect(richtigePositivfälle).toBe(positive.length);
    expect(ungewollteÄnderungen).toBe(0);
    console.info(
      `REAL-WEB-STICHPROBE profil=aggressive beobachtetePositive=${positive.length} ` +
      `korrekt=${richtigePositivfälle} beobachteteNegative=${negative.length} ` +
      `ungewollteAenderungen=${ungewollteÄnderungen}`
    );
  });
});
