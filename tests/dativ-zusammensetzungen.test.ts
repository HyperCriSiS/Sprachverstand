import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gegenprüfung vom 25.10.2026: Dativlisten blieben bei Zusammensetzungen halb.
describe("Dativ bei zusammengesetzten Personennomen", () => {
  it.each([
    ["mit Humanmediziner*innen", "mit Humanmedizinern"],
    ["Wir arbeiten mit Humanmediziner*innen, Veterinärmediziner*innen und Umweltwissenschaftler*innen.",
      "Wir arbeiten mit Humanmedizinern, Veterinärmedizinern und Umweltwissenschaftlern."],
    ["Unser Team, bestehend aus Sportmediziner*innen und Osteopath*innen.", "Unser Team, bestehend aus Sportmedizinern und Osteopathen."],
    ["eine Jury aus Tiermediziner*innen und Vertreter*innen des Verbandes", "eine Jury aus Tiermedizinern und Vertretern des Verbandes"],
    ["Gemeinsam mit den Kunstvermittler*innen entwickelten sie Ideen.", "Gemeinsam mit den Kunstvermittlern entwickelten sie Ideen."],
    // Kein Dativ ohne Auslöser oder nach einem Verb in der Wortgruppe.
    ["Die Humanmediziner*innen kommen.", "Die Humanmediziner kommen."],
    ["Auf ihren Patrouillen nehmen Ranger*innen Anzeichen wahr.", "Auf ihren Patrouillen nehmen Ranger Anzeichen wahr."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
