import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026 (CMP-01): Bindestrich-Komposita, deren Kopf nur im
// exakten Lexikon steht, blieben stehen; suffixbasiert bekannte Köpfe
// (`PV-Expert*innen`) funktionierten schon.
describe("Bindestrich-Komposita mit bekanntem Personenkopf", () => {
  it.each([
    ["US-Amerikaner*innen", "US-Amerikaner"],
    ["mit US-Amerikaner*innen", "mit US-Amerikanern"],
    ["Exil-IranerInnen", "Exil-Iraner"],
    ["NS-Zeitzeug:innen", "NS-Zeitzeugen"],
    ["AfD-Sympathisant*innen", "AfD-Sympathisanten"],
    ["Pay-TV-Seher:innen", "Pay-TV-Seher"],
    ["Kakao-Bäuer*innen", "Kakao-Bauern"],
    ["Sparkassen-Revisor:in", "Sparkassen-Revisor"],
    ["Stadtnatur-Lots*in", "Stadtnatur-Lotse"],
    ["Ist mein/e Wunsch-Nachfolger/in", "Ist mein Wunsch-Nachfolger"],
    ["Hockey-InstruktorInnen-Ausbildung", "Hockey-Instruktoren-Ausbildung"],
    // Bisher schon unterstützte Fälle bleiben.
    ["PV-Expert*innen", "PV-Experten"],
    ["EU-Bürger*innen", "EU-Bürger"],
    ["Expert*innen-Workshops", "Experten-Workshops"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Kleingeschriebener Teil nach dem Bindestrich ist eine Worttrennung.
    ["Bilanzbuch-halter/in", "Bilanzbuch-halter/in"],
    ["Arbeit-nehmerInnen", "Arbeit-nehmerInnen"],
    // Unbekannter Kopf und Marken bleiben.
    ["Projekt-Wizard*innen", "Projekt-Wizard*innen"],
    ["InteGREATer:in", "InteGREATer:in"],
    // Mehrdeutiger Singularartikel schützt weiterhin.
    ["eine US-Amerikaner*in", "eine US-Amerikaner*in"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});
