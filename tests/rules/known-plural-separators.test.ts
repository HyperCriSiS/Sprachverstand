import { describe, expect, it } from "vitest";
import { knownPluralSeparatorsRule } from "../../src/rules/known-plural-separators";
import {
  sourceAuditPluralRule,
  sourceAuditSingularRule
} from "../../src/rules/source-audit-person-forms";

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

describe("sourceAuditPluralRule", () => {
  it.each([
    ["Follower*innen", "Follower"],
    ["Proband:innen", "Probanden"],
    ["Kommunikator:innen", "Kommunikatoren"],
    ["Auditor_innen", "Auditoren"],
    ["Köch:innen", "Köche"],
    ["Arzt:innen", "Ärzte"],
    ["Matros/innen", "Matrosen"],
    ["Rezeptionist·innen", "Rezeptionisten"],
    ["Online-FollowerInnen", "Online-Follower"],
    ["Follower*innenzahl", "Followerzahl"]
  ])("normalisiert den quellengeprüften Plural %s", (input, expected) => {
    expect(sourceAuditPluralRule.apply(input)).toEqual({
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

    expect(sourceAuditPluralRule.apply(input)).toEqual({
      text: expected,
      replacements: 26
    });
  });

  it("verarbeitet sichtbar getrennte Lehrbeispiele der geprüften Quellen", () => {
    expect(
      sourceAuditPluralRule.apply(
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
    expect(sourceAuditPluralRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});

describe("sourceAuditSingularRule", () => {
  it.each([
    ["Follower*in", "Follower"],
    ["Proband:in", "Proband"],
    ["Kommunikator*in", "Kommunikator"],
    ["Köch*in", "Koch"],
    ["Arzt/in", "Arzt"],
    ["Matros_in", "Matrose"]
  ])("normalisiert den quellengeprüften Singular %s", (input, expected) => {
    expect(sourceAuditSingularRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("schützt normale Feminina, Binnen-I-Singularformen und unbekannte Markerformen", () => {
    const input =
      "Followerin, Köchin, eine FollowerIn, LogopädIn und Fantasiefigur*in";
    expect(sourceAuditSingularRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
