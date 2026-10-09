import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { salutationParticiplesRule } from "../src/rules/salutation-participles";

describe("Audit LANG-01 und LANG-03: Partizip-Meaning-Preservation", () => {
  it.each([
    ["Eine Stu\u00addierende wartet.", "Eine Studentin wartet."],
    ["Die Stu\u00addierende arbeitet.", "Die Studentin arbeitet."],
    ["Eine Leh\u00adrende spricht.", "Eine Lehrerin spricht."]
  ])("bewahrt Singular bei Soft-Hyphen: %s", (input, expected) => {
    expect(transformText(input, defaultRules, { profile: "aggressive" }).text)
      .toBe(expected);
  });

  it.each([
    "Eine laut Lesende sitzt am Fenster.",
    "Die seit Stunden Forschende ist müde.",
    "Als Studierende bin ich im fünften Semester.",
    "Eine besonders engagierte Lehrende spricht.",
    "Liebe lesende Kinder, kommt bitte herein.",
    "Sehr geehrte studierende Eltern, herzlich willkommen.",
    "Sehr geehrte Studierende Eltern, herzlich willkommen."
  ])("verändert attributive oder singularische Partizipien nicht: %s", (input) => {
    expect(salutationParticiplesRule.apply(input).text).toBe(input);
    expect(transformText(input, defaultRules, { profile: "aggressive" }).text)
      .toBe(input);
  });

  it.each([
    ["Eine ", "Studierende wartet.", "Studentin wartet."],
    ["Die ", "Lehrende spricht.", "Lehrerin spricht."]
  ])("berücksichtigt linken Artikelkontext bei Segmentierung", (leading, input, expected) => {
    expect(salutationParticiplesRule.applyWithLeadingContext?.(input, leading).text)
      .toBe(expected);
  });
});
