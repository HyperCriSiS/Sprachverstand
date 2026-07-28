import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../../src/rules/mapped-plural-separators";

describe("mappedPluralSeparatorsRule", () => {
  it.each([
    ["Ärzt:innen", "Ärzte"],
    ["Ärzt/-innen", "Ärzte"],
    ["Student*innen", "Studenten"],
    ["Kolleg_innen", "Kollegen"],
    ["Kund/innen", "Kunden"],
    ["Autor·innen", "Autoren"],
    ["Moderator•innen", "Moderatoren"],
    ["Aktivist.innen", "Aktivisten"],
    ["Journalist’innen", "Journalisten"],
    ["Architekt‘innen", "Architekten"],
    ["Lieferant:innen", "Lieferanten"],
    ["Praktikant:innen", "Praktikanten"],
    ["Doktorand:innen", "Doktoranden"],
    ["Patient:innen", "Patienten"],
    ["Journalist:innen", "Journalisten"],
    ["Architekt:innen", "Architekten"],
    ["Ingenieur:innen", "Ingenieure"],
    ["Professor:innen", "Professoren"],
    ["Aktionär:innen", "Aktionäre"],
    ["Friseur:innen", "Friseure"],
    ["Akteur:innen", "Akteure"],
    ["Bauer:innen", "Bauern"],
    ["Messebauer*innen", "Messebauer"],
    ["Modellbauer:innen", "Modellbauer"],
    ["Erbauer:innen", "Erbauer"],
    ["Mutter:innen", "Mütter"],
    ["Tochter:innen", "Töchter"],
    ["Bruder:innen", "Brüder"],
    ["Vater:innen", "Väter"],
    ["Dirigent*innen", "Dirigenten"],
    ["Dozent*innen", "Dozenten"],
    ["Solist*innenraum", "Solistenraum"],
    ["Professor*innenschaft", "Professorenschaft"],
    ["Jüd*innen", "Juden"],
    ["Anwält:innen", "Anwälte"],
    ["Gäst:innen", "Gäste"],
    ["Pädagog:innen", "Pädagogen"],
    ["Psycholog:innen", "Psychologen"],
    ["Therapeut:innen", "Therapeuten"],
    ["Produzent:innen", "Produzenten"],
    ["Zeug:innen", "Zeugen"],
    ["Bot:innen", "Boten"],
    ["Genoss:innen", "Genossen"],
    ["Bischöf:innen", "Bischöfe"],
    ["Köch:innen", "Köche"],
    ["Beamt:innen", "Beamte"],
    ["Vorständ:innen", "Vorstände"],
    ["Minister:innen", "Minister"],
    ["Lehrling:innen", "Lehrlinge"],
    ["Zeitzeug:innen", "Zeitzeugen"],
    ["Bibliothekar:innen", "Bibliothekare"],
    ["Fotograf:innen", "Fotografen"]
  ])("wandelt %s in %s um", (input, expected) => {
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: expected,
      replacements: 1
    });
  });

  it("unterstützt zusammengesetzte Wörter und Komposita", () => {
    const result = mappedPluralSeparatorsRule.apply(
      "Tierärzt:innen, Werkstudent*innen, Stammkund_innen, " +
        "Koautor/innen, Co-Moderator:innen, Ärzt:innenkammer, " +
        "Mutter:inneninitiative und Messebauer*innenverband"
    );

    expect(result).toEqual({
      text:
        "Tierärzte, Werkstudenten, Stammkunden, Koautoren, " +
        "Co-Moderatoren, Ärztekammer, Mütterinitiative und " +
        "Messebauerverband",
      replacements: 8
    });
  });

  it("erhält vollständige Großschreibung", () => {
    expect(mappedPluralSeparatorsRule.apply("TIERÄRZT:INNEN")).toEqual({
      text: "TIERÄRZTE",
      replacements: 1
    });
  });

  it("verändert keine nicht hinterlegten Formen", () => {
    const input = "Schwester:innen, Cousine:innen und Robot:innen";

    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
