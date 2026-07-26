import { describe, expect, it } from "vitest";
import { titleAbbreviationsRule } from "../../src/rules/title-abbreviations";

describe("titleAbbreviationsRule", () => {
  it("kürzt gegenderte Titel vor Namen neutral ab", () => {
    expect(
      titleAbbreviationsRule.apply(
        "Prof.in Anna Müller und Dr.in Eva Schmidt sowie Prof.in Dr.in Lea Weber"
      )
    ).toEqual({
      text:
        "Prof. Anna Müller und Dr. Eva Schmidt sowie Prof. Dr. Lea Weber",
      replacements: 4
    });
  });

  it("schreibt gegenderte Titel mit weiblichem Artikel aus", () => {
    expect(
      titleAbbreviationsRule.apply(
        "die Prof.in, eine Dr.in und mit der Prof:in sowie zur Dr*in"
      )
    ).toEqual({
      text:
        "die Professorin, eine Doktorin und mit der Professorin sowie zur Doktorin",
      replacements: 4
    });
  });

  it("schreibt alleinstehende Kurzformen aus", () => {
    expect(
      titleAbbreviationsRule.apply(
        "Sie ist Prof.in. Ihre Kollegin ist Dr_in."
      )
    ).toEqual({
      text: "Sie ist Professorin. Ihre Kollegin ist Doktorin.",
      replacements: 2
    });
  });

  it("erhält Groß- und Kleinschreibung", () => {
    expect(titleAbbreviationsRule.apply("PROF.IN ANNA und prof.in")).toEqual({
      text: "PROF. ANNA und professorin",
      replacements: 2
    });
  });

  it("lässt Vollformen, Pluralkürzel und normale Titel unverändert", () => {
    const input =
      "Professorin Müller, Doktorin Schmidt, Prof.innen, Dr.innen, Prof. Weber und Dr. König";

    expect(titleAbbreviationsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });

  it("verändert keine ähnlichen Wörter", () => {
    const input = "Profil, Profit, DriveIn und AddIn bleiben unverändert.";

    expect(titleAbbreviationsRule.apply(input)).toEqual({
      text: input,
      replacements: 0
    });
  });
});
