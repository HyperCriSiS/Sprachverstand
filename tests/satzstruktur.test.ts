import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { listStartsNewClause } from "../src/rules/clause-structure";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gemeinsame Satzgliederkennung der Kasusregeln.
describe("Satzstruktur", () => {
  it("erkennt einen neuen Hauptsatz nach einer Liste", () => {
    expect(listStartsNewClause("Wir sehen den Wagen, ", " kommen später.")).toBe(true);
    expect(listStartsNewClause("Wir wollen mit Kindern, ", " arbeiten.")).toBe(false);
    expect(listStartsNewClause("Mit Kindern, ", " kommen später.")).toBe(false);
    expect(listStartsNewClause("Wir sehen, dass Kinder, ", " kommen.")).toBe(false);
  });

  it.each([
    // Alle Präpositionen eröffnen das Vorfeld, auch „Zu“
    ["Zu diesem Zweck entfernt die Operateur*in Teile.", "Zu diesem Zweck entfernt der Operateur Teile."],
    ["Die Eltern danken Lehrer:innen, Lehrer und Schüler sind schon da.",
      "Die Eltern danken Lehrern, Lehrer und Schüler sind schon da."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
