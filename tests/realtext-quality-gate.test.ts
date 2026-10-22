import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

// Kurze 2026 belegte Web-Oberflächen: kein vollständiger Fremdtext.
// Quellenangaben und Zuordnung der Belege liegen im privaten Quellenarchiv.
const beobachtetePositive = [
  ["Westermann-Lizenz-Schüler","Einzellizenz für Schüler/-innen (1 Schuljahr)","Einzellizenz für Schüler (1 Schuljahr)"],
  ["Westermann-Lizenz-Lehrer","Kollegiumslizenz für Lehrer/-innen (Dauerlizenz)","Kollegiumslizenz für Lehrer (Dauerlizenz)"],
  ["Anmeldung-Teilnehmerzahl","Die Teilnehmer/innenzahl ist limitiert.","Die Teilnehmerzahl ist limitiert."],
  ["Anmeldung-Teilnehmer","Nur angemeldete Teilnehmer/innen werden zugelassen.","Nur angemeldete Teilnehmer werden zugelassen."],
  ["Schulportal","Anmeldung Schüler/innen, Lehrkräfte und Betriebe","Anmeldung Schüler, Lehrkräfte und Betriebe"]
] as const;

const beobachteteNegative = [
  ["Schülerverwaltung","Zentrale Schülerverwaltung"],
  ["Neutrale-Lehrkräfte","Lehrkräfte"]
] as const;

// Diese Sätze sind eigens konstruierte Belastungsproben, keine Web-Beobachtungen.
const konstruiertePositive = [
  ["W89-Forstaufseher","Die Forstaufseher:innen prüfen den Wald.","Die Forstaufseher prüfen den Wald."],
  ["W89-Immobilienschätzer","Immobilienschätzer:innen bewerten das Objekt.","Immobilienschätzer bewerten das Objekt."],
  ["W89-Vlogger","Vlogger:innen filmen die Veranstaltung.","Vlogger filmen die Veranstaltung."],
  ["W90-Betonierer","Die Betonierer:innen arbeiten am Bau.","Die Betonierer arbeiten am Bau."],
  ["W90-Softwareanalysten","Die Softwareanalyst:innen prüfen den Code.","Die Softwareanalysten prüfen den Code."],
  ["W90-Reifenvulkaniseure","Reifenvulkaniseur:innen reparieren Reifen.","Reifenvulkaniseure reparieren Reifen."],
  ["W91-Hotelportiers","Die Hotelportier:innen begrüßen die Gäste.","Die Hotelportiers begrüßen die Gäste."],
  ["W91-Konsuln","Die Konsul:innen beraten sich.","Die Konsuln beraten sich."],
  ["W91-Amtsvormünder","Die Amtsvormund:innen übernehmen Verantwortung.","Die Amtsvormünder übernehmen Verantwortung."],
  ["W91-Brigadegeneräle","Brigadegeneral:innen sind anwesend.","Brigadegeneräle sind anwesend."],
  ["W91-Bankkassiere","Die Bankkassier:innen prüfen die Bücher.","Die Bankkassiere prüfen die Bücher."],
  ["Basis-Nutzer","Die Nutzer:innen testen den Dienst.","Die Nutzer testen den Dienst."],
  ["Basis-Schüler","Schüler/-innen bewerben sich.","Schüler bewerben sich."],
  ["Basis-Lehrer","Der Treffpunkt für Lehrer/-innen ist geöffnet.","Der Treffpunkt für Lehrer ist geöffnet."]
] as const;

const konstruierteNegative = [
  ["General-Schutz","General:innen"],
  ["Stallknecht-Schutz","Stallknecht:innen"],
  ["Singular-Kundin","Die Kundin ruft an."],
  ["Gemischte-Nennung","Nutzerinnen und Benutzer"],
  ["Innenminister","Der Innenminister leitet das Treffen."],
  ["Innenstadt","Die Innenstadt ist autofrei."],
  ["Markenname-LinkedIn","LinkedIn ist ein Netzwerk."],
  ["Technik-AddIn","Das Wort AddIn steht in der Dokumentation."],
  ["Unmarkierte-Klasse","Die Lehrkräfte warten vor dem Raum."],
  ["Unmarkierte-Verwaltung","Die Schülerverwaltung ist geschlossen."],
  ["Unmarkierte-Dienstgrade","Der General und der Major treffen sich."],
  ["Semantik-Majorität","Das Wort Majorität hat eine andere Bedeutung."],
  ["Technik-LogIn","Das LogIn ist fehlgeschlagen."],
  ["Unmarkierter-Plural","Die Kundinnen warten."],
  ["Hebamme","Eine Hebamme begleitet die Geburt."],
  ["Unmarkierte-Personen","Der Vortrag ist für alle Besucher geöffnet."],
  ["Organisationskontext","Gemeint sind Menschen und Organisationen."],
  ["Ärzten-ohne-Marker","Es geht um die Ausbildung von Ärzten."]
] as const;

const optionen = { profile: "aggressive" as const };
const pruefe = (text: string) => transformText(text, defaultRules, optionen);

describe("Qualitätsgate: ganze Textverarbeitung auf kurzen Real-Web-Belegen", () => {
  it.each(beobachtetePositive)("%s: erkennt die belegte Markierung", (_id, eingabe, ziel) => {
    const ergebnis = pruefe(eingabe);
    expect(ergebnis.text).toBe(ziel);
    expect(ergebnis.replacements).toBeGreaterThan(0);
  });

  it.each(beobachteteNegative)("%s: erhält den belegten unmarkierten Ausdruck", (_id, eingabe) => {
    expect(pruefe(eingabe)).toEqual({ text: eingabe, replacements: 0 });
  });
});

describe("Qualitätsgate: konstruierte ESCO- und Fehlkorrektur-Grenzfälle", () => {
  it.each(konstruiertePositive)("%s: korrigiert den ganzen Satz", (_id, eingabe, ziel) => {
    const ergebnis = pruefe(eingabe);
    expect(ergebnis.text).toBe(ziel);
    expect(ergebnis.replacements).toBeGreaterThan(0);
  });

  it.each(konstruierteNegative)("%s: bleibt unverändert", (_id, eingabe) => {
    expect(pruefe(eingabe)).toEqual({ text: eingabe, replacements: 0 });
  });
});

describe("Getrennte Kennzahlen des begrenzten Qualitätsgates", () => {
  it("weist Anzahl, Treffer und unerwünschte Änderungen transparent aus", () => {
    const positive = [...beobachtetePositive, ...konstruiertePositive];
    const negative = [...beobachteteNegative, ...konstruierteNegative];
    const erkannte = positive.filter(([, eingabe, ziel]) => pruefe(eingabe).text === ziel).length;
    const ungewolltVeraendert = negative.filter(([, eingabe]) => pruefe(eingabe).text !== eingabe).length;

    // Unterschiedliche Grundgesamtheiten: keine repräsentative Web-Präzision.
    expect(beobachtetePositive).toHaveLength(5);
    expect(beobachteteNegative).toHaveLength(2);
    expect(konstruiertePositive).toHaveLength(14);
    expect(konstruierteNegative).toHaveLength(18);
    expect(erkannte).toBe(19);
    expect(ungewolltVeraendert).toBe(0);

    console.info(
      `REALTEXTE-QUALITÄT profil=aggressive belegtPositiv=${beobachtetePositive.length} ` +
      `belegtNegativ=${beobachteteNegative.length} konstruiertPositiv=${konstruiertePositive.length} ` +
      `konstruiertNegativ=${konstruierteNegative.length} korrektePositive=${erkannte} ` +
      `ungewollteAenderungen=${ungewolltVeraendert} gesamterProbenumfang=${positive.length + negative.length}`
    );
  });
});
