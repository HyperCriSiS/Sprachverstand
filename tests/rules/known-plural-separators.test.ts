import { describe, expect, it } from "vitest";
import { knownPluralSeparatorsRule } from "../../src/rules/known-plural-separators";
import {
  additionalPersonPluralRule,
  additionalPersonSingularRule
} from "../../src/rules/additional-person-forms";

const validatedSupplementalForms = [
  { singular: "Abenteurer", plural: "Abenteurer" },
  { singular: "Alleinverdiener", plural: "Alleinverdiener" },
  { singular: "Altenpfleger", plural: "Altenpfleger" },
  { singular: "Amateur", plural: "Amateure" },
  { singular: "Anforderer", plural: "Anforderer" },
  { singular: "Anhänger", plural: "Anhänger" },
  { singular: "Anteilseigner", plural: "Anteilseigner" },
  { singular: "Antragsteller", plural: "Antragsteller" },
  { singular: "Anwärter", plural: "Anwärter" },
  { singular: "Auftragnehmer", plural: "Auftragnehmer" },
  { singular: "Augenoptiker", plural: "Augenoptiker" },
  { singular: "Ausländer", plural: "Ausländer" },
  { singular: "Außenseiter", plural: "Außenseiter" },
  { singular: "Aussteiger", plural: "Aussteiger" },
  { singular: "Befrager", plural: "Befrager" },
  { singular: "Befürworter", plural: "Befürworter" },
  { singular: "Beisitzer", plural: "Beisitzer" },
  { singular: "Berliner", plural: "Berliner" },
  { singular: "Bestatter", plural: "Bestatter" },
  { singular: "Betrüger", plural: "Betrüger" },
  { singular: "Bewahrer", plural: "Bewahrer" },
  { singular: "Bezieher", plural: "Bezieher" },
  { singular: "Bieter", plural: "Bieter" },
  { singular: "Botschafter", plural: "Botschafter" },
  { singular: "Bürokrat", plural: "Bürokraten" },
  { singular: "Chauffeur", plural: "Chauffeure" },
  { singular: "Chemiker", plural: "Chemiker" },
  { singular: "Coach", plural: "Coaches" },
  { singular: "Dekan", plural: "Dekane" },
  { singular: "Detektiv", plural: "Detektive" },
  { singular: "Diabetiker", plural: "Diabetiker" },
  { singular: "Dichter", plural: "Dichter" },
  { singular: "Dieb", plural: "Diebe" },
  { singular: "Doppelgänger", plural: "Doppelgänger" },
  { singular: "Editor", plural: "Editoren" },
  { singular: "Ehrenamtler", plural: "Ehrenamtler" },
  { singular: "Einbrecher", plural: "Einbrecher" },
  { singular: "Eigner", plural: "Eigner" },
  { singular: "Einwohner", plural: "Einwohner" },
  { singular: "Einzelgänger", plural: "Einzelgänger" },
  { singular: "Elektriker", plural: "Elektriker" },
  { singular: "Elektroniker", plural: "Elektroniker" },
  { singular: "Erbauer", plural: "Erbauer" },
  { singular: "Erblasser", plural: "Erblasser" },
  { singular: "Favorit", plural: "Favoriten" },
  { singular: "Fahrzeughalter", plural: "Fahrzeughalter" },
  { singular: "Feind", plural: "Feinde" },
  { singular: "Förster", plural: "Förster" },
  { singular: "Fußgänger", plural: "Fußgänger" },
  { singular: "Gesellschafter", plural: "Gesellschafter" },
  { singular: "Gestalter", plural: "Gestalter" },
  { singular: "Gläubiger", plural: "Gläubiger" },
  { singular: "Herrscher", plural: "Herrscher" },
  { singular: "Inspekteur", plural: "Inspekteure" },
  { singular: "Kläger", plural: "Kläger" },
  { singular: "Kontrahent", plural: "Kontrahenten" },
  { singular: "Krankenpfleger", plural: "Krankenpfleger" },
  { singular: "Kritiker", plural: "Kritiker" },
  { singular: "Läufer", plural: "Läufer" },
  { singular: "Masseur", plural: "Masseure" },
  { singular: "Muslim", plural: "Muslime" },
  { singular: "Nachahmer", plural: "Nachahmer" },
  { singular: "Nachfolger", plural: "Nachfolger" },
  { singular: "Peiniger", plural: "Peiniger" },
  { singular: "Pfleger", plural: "Pfleger" },
  { singular: "Prediger", plural: "Prediger" },
  { singular: "Priester", plural: "Priester" },
  { singular: "Rassist", plural: "Rassisten" },
  { singular: "Schlepper", plural: "Schlepper" },
  { singular: "Schmied", plural: "Schmiede" },
  { singular: "Schulabbrecher", plural: "Schulabbrecher" },
  { singular: "Schulabgänger", plural: "Schulabgänger" },
  { singular: "Schuldner", plural: "Schuldner" },
  { singular: "Seelsorger", plural: "Seelsorger" },
  { singular: "Späher", plural: "Späher" },
  { singular: "Spion", plural: "Spione" },
  { singular: "Stakeholder", plural: "Stakeholder" },
  { singular: "Steinmetz", plural: "Steinmetze" },
  { singular: "Störer", plural: "Störer" },
  { singular: "Supporter", plural: "Supporter" },
  { singular: "Tänzer", plural: "Tänzer" },
  { singular: "Tierschützer", plural: "Tierschützer" },
  { singular: "Unterzeichner", plural: "Unterzeichner" },
  { singular: "Urheber", plural: "Urheber" },
  { singular: "Urlauber", plural: "Urlauber" },
  { singular: "User", plural: "User" },
  { singular: "Veganer", plural: "Veganer" },
  { singular: "Vegetarier", plural: "Vegetarier" },
  { singular: "Verbrecher", plural: "Verbrecher" },
  { singular: "Verteidiger", plural: "Verteidiger" }
] as const;

describe("knownPluralSeparatorsRule", () => {
  it("entfernt verbreitete Separatoren bei sicheren Pluralformen", () => {
    const result = knownPluralSeparatorsRule.apply(
      "Nutzer:innen, Mitarbeiter*innen, Schüler_innen, Bürger/innen, " +
        "Lehrer·innen, Fahrer•innen, Entwickler.innen, " +
        "US-Bürger’innen, Zuschauer‘innen und „Mitarbeiter/-innen“"
    );

    expect(result).toEqual({
      text:
        "Nutzer, Mitarbeiter, Schüler, Bürger, Lehrer, Fahrer, " +
        "Entwickler, US-Bürger, Zuschauer und „Mitarbeiter“",
      replacements: 10
    });
  });

  it("erhält Großschreibung und zusammengesetzte Wörter", () => {
    const result = knownPluralSeparatorsRule.apply(
      "NUTZER:INNEN, Online-Nutzer:innen, Nutzer:innenkonto und " +
        "Mitarbeiter*innenportal"
    );

    expect(result).toEqual({
      text: "NUTZER, Online-Nutzer, Nutzerkonto und Mitarbeiterportal",
      replacements: 4
    });
  });

  it.each([
    ["Gegner*innenschaft", "Gegnerschaft"],
    ["Pförtner*innen", "Pförtner"],
    ["Spender*innen", "Spender"],
    ["Tonmeister*innen", "Tonmeister"]
  ])("normalisiert den geprüften sicheren Fall %s", (input, expected) => {
    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("lässt morphologisch unsichere Wörter unverändert", () => {
    const input =
      "Ärzt:innen, Student:innen, Kolleg:innen, Kund:innen, " +
      "Mutter:innen, Bauer:innen, Autor:innen, Moderator:innen und " +
      "Lieferant:innen";

    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it("verändert keine normalen Wörter oder bloßen Femininformen", () => {
    const input =
      "Nutzerinnen gewinnen innen, während andere etwas ersinnen.";

    expect(knownPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it("korrigiert die vollständige Sternchen-Pluralform im Satz", () => {
    expect(knownPluralSeparatorsRule.apply("zehn Zuhörer*innen")).toEqual({
      text: "zehn Zuhörer",
      replacements: 1
    });
  });
});

describe("additionalPersonPluralRule", () => {
  it.each(validatedSupplementalForms)(
    "normalisiert $singular als einzeln geprüften Plural",
    ({ singular, plural }) => {
      expect(additionalPersonPluralRule.apply(`${singular}:innen`)).toEqual({
        text: plural,
        replacements: 1
      });
    }
  );

  it.each([
    ["Follower*innen", "Follower"],
    ["Praktiker*innen", "Praktiker"],
    ["Mediziner*innen", "Mediziner"],
    ["Proband:innen", "Probanden"],
    ["Kommunikator:innen", "Kommunikatoren"],
    ["Auditor_innen", "Auditoren"],
    ["Köch:innen", "Köche"],
    ["Arzt:innen", "Ärzte"],
    ["Matros/innen", "Matrosen"],
    ["Rezeptionist·innen", "Rezeptionisten"],
    ["Online-FollowerInnen", "Online-Follower"],
    ["Follower*innenzahl", "Followerzahl"]
  ])("normalisiert den einzeln geprüften Plural %s", (input, expected) => {
    expect(additionalPersonPluralRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("deckt den vollständigen A-bis-Z-Abgleich repräsentativ ab", () => {
    const input =
      "Akademiker*innen, Babysitter*innen, Coder*innen, Diktator:innen, " +
      "Evaluator:innen, Follower*innen, Gymnasiast:innen, Historiker*innen, " +
      "Illustrator:innen, Juror:innen, Kommunikator:innen, Logopäd:innen, " +
      "Matros:innen, Nachrücker*innen, Operateur:innen, Proband:innen, " +
      "Quereinsteiger*innen, Rezeptionist:innen, Streamer*innen, Tutor:innen, " +
      "Überbringer*innen, Visionär:innen, Wikipedianer*innen, " +
      "Xylophonspieler*innen, Youtuber*innen und Zivilist:innen";
    const expected =
      "Akademiker, Babysitter, Coder, Diktatoren, Evaluatoren, Follower, " +
      "Gymnasiasten, Historiker, Illustratoren, Juroren, Kommunikatoren, " +
      "Logopäden, Matrosen, Nachrücker, Operateure, Probanden, " +
      "Quereinsteiger, Rezeptionisten, Streamer, Tutoren, Überbringer, " +
      "Visionäre, Wikipedianer, Xylophonspieler, Youtuber und Zivilisten";

    expect(additionalPersonPluralRule.apply(input)).toEqual({
      text: expected,
      replacements: 26
    });
  });

  it("verarbeitet sichtbar getrennte Schreibweisen", () => {
    expect(
      additionalPersonPluralRule.apply(
        "Leser _ innen, Leser I nnen, Student + innen und Professor+innen"
      )
    ).toEqual({
      text: "Leser, Leser, Studenten und Professoren",
      replacements: 4
    });
  });

  it("lässt normale Wörter, Medio-Punkte und unbekannte Plusformen unverändert", () => {
    const input =
      "Followerinnen, kommunikatorisch, Geschlechts·merkmale und Zahl + innen";
    expect(additionalPersonPluralRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});

describe("additionalPersonSingularRule", () => {
  it.each(validatedSupplementalForms)(
    "normalisiert $singular als einzeln geprüften Singular",
    ({ singular }) => {
      expect(additionalPersonSingularRule.apply(`${singular}:in`)).toEqual({
        text: singular,
        replacements: 1
      });
    }
  );

  it.each(validatedSupplementalForms)(
    "normalisiert $singular als einzeln geprüften Binnen-I-Singular",
    ({ singular }) => {
      expect(additionalPersonSingularRule.apply(`${singular}In`)).toEqual({
        text: singular,
        replacements: 1
      });
    }
  );

  it.each([
    ["Follower*in", "Follower"],
    ["Proband:in", "Proband"],
    ["Kommunikator*in", "Kommunikator"],
    ["Köch*in", "Koch"],
    ["Arzt/in", "Arzt"],
    ["Matros_in", "Matrose"]
  ])("normalisiert den einzeln geprüften Singular %s", (input, expected) => {
    expect(additionalPersonSingularRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("schützt normale Feminina und unbekannte Markerformen", () => {
    const input =
      "Followerin, Köchin, Fantasiefigur*in und FantasiefigurIn";
    expect(additionalPersonSingularRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it.each([
    "eine:n neue Verteidiger:in",
    "die neue Verteidiger:in",
    "eine:n neue VerteidigerIn",
    "die neue VerteidigerIn"
  ])("vermeidet eine grammatisch unvollständige Teilkorrektur bei %s", (input) => {
    expect(additionalPersonSingularRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it.each([
    ["Pat*innenschaft", "Patenschaft"],
    ["Themenpat*in", "Themenpate"]
  ])("normalisiert das geprüfte Kompositum %s", (input, expected) => {
    const rule = input.includes("innenschaft")
      ? additionalPersonPluralRule
      : additionalPersonSingularRule;
    expect(rule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });
});
