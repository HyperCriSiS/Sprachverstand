import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

describe("Genitiv nach aufgelöstem Begleitwortpaar", () => {
  it.each([
    ["Die Unterschrift des:der Azubi ist nötig.", "Die Unterschrift des Azubis ist nötig."],
    ["eines:einer Azubi", "eines Azubis"],
    ["dieses:dieser Azubi", "dieses Azubis"],
    ["des:der Fan", "des Fans"],
    ["DES:DER AZUBI", "DES AZUBIS"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    ["der:die Azubi", "der Azubi"],
    ["dem:der Azubi", "dem Azubi"],
    ["des:der Angestellten", "des Angestellten"],
    ["des:der Mitarbeiter*in", "des Mitarbeiters"],
    // Unbekannte Nomen und bereits flektierte Formen bleiben unverändert.
    ["des:der Gast", "des Gast"],
    ["des:der Azubis", "des Azubis"],
    // Nur vom Paar aufgelöste Begleitwörter, nicht vorhandener Fließtext.
    ["des Azubi", "des Azubi"]
  ])("bleibt korrekt: %s", (input, expected) => expect(t(input)).toBe(expected));
});
