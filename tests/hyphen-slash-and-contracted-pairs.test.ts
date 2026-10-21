import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Webanalyse 21.10.2026.
describe("Bindestrich vor dem Schrägstrich-Marker", () => {
  it.each([
    ["Schüler-/innen an privaten Schulen", "Schüler an privaten Schulen"],
    ["Die Mitarbeiter-/innen beraten.", "Die Mitarbeiter beraten."],
    ["für Entdecker-/innen", "für Entdecker"],
    ["ein Fachinformatiker-/in", "ein Fachinformatiker"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Unbekannter Stamm und Ellipse in Komposita bleiben.
    ["Wagen-/innen", "Wagen-/innen"],
    ["Gesundheits- und Krankenpfleger/in", "Gesundheits- und Krankenpfleger"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Paare aus Kurz- und Langform der Präposition", () => {
  it.each([
    ["bezahlt vom:von der Arbeitgeber:in", "bezahlt vom Arbeitgeber"],
    ["aktiv von der:vom Arbeitgeber:in verlangen", "aktiv vom Arbeitgeber verlangen"],
    ["beim:bei der aktuellen Arbeitgeber:in", "beim aktuellen Arbeitgeber"],
    ["Ausbildung zum/zu der Erzieher*in", "Ausbildung zum Erzieher"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Begleitwortpaare mit Leerraum um Stern oder Doppelpunkt", () => {
  it.each([
    ["Ausbildung zum* zur Gärtner*in", "Ausbildung zum Gärtner"],
    ["der * die Nutzer*in", "der Nutzer"],
    ["der : die Nutzer*in", "der Nutzer"],
    ["der / die Nutzer*in", "der Nutzer"]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));

  it.each([
    // Doppelpunkt nach einem Wort ist kein Begleitwortpaar.
    ["Kontakt: die Lehrer*in", "Kontakt: die Lehrer*in"]
  ])("bleibt: %s", (input, expected) => expect(t(input)).toBe(expected));
});
