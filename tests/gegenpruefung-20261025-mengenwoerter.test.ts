import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 25.10.2026.
describe("Mengenwort nach Artikel oder Possessiv ist kein Dativauslöser (N25)", () => {
  it.each([
    ["Die vielen LehrerInnen kommen.", "Die vielen Lehrer kommen."],
    ["Unsere wenigen LehrerInnen kommen.", "Unsere wenigen Lehrer kommen."],
    ["Die sehr vielen Lehrer:innen kommen.", "Die sehr vielen Lehrer kommen."],
    ["Die wirklich wenigen Lehrer:innen kommen.", "Die wirklich wenigen Lehrer kommen."],
    ["Alle beiden Lehrer:innen kommen.", "Alle beiden Lehrer kommen."],
    ["Diese mehreren Lehrer:innen kommen.", "Diese mehreren Lehrer kommen."],
    ["als die Vorstöße ihrer wenigen lauten Gegner*innen.", "als die Vorstöße ihrer wenigen lauten Gegner."],
    ["Michael Hauk und seine vielen HelferInnen sorgten dafür.", "Michael Hauk und seine vielen Helfer sorgten dafür."],
    ["Nicht nur für die Menschen und vielen MitarbeiterInnen im Ort.", "Nicht nur für die Menschen und vielen Mitarbeiter im Ort."],
    ["Dank unserer vielen Ehrenamtler:innen können wir öffnen.", "Dank unserer vielen Ehrenamtler können wir öffnen."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});

describe("Mengenwort bleibt Dativauslöser (N25)", () => {
  it.each([
    ["Mit vielen Lehrer:innen.", "Mit vielen Lehrern."],
    ["Wir danken vielen Lehrer:innen.", "Wir danken vielen Lehrern."],
    ["mit der Schule und vielen Lehrer:innen.", "mit der Schule und vielen Lehrern."],
    ["mit den Kindern und vielen Lehrer:innen.", "mit den Kindern und vielen Lehrern."],
    ["Dort mussten sich die beiden den topgesetzten Niederländer:innen geschlagen geben.",
      "Dort mussten sich die beiden den topgesetzten Niederländern geschlagen geben."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
