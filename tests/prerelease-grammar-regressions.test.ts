import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

const korrigiere = (text: string) => transformText(text, defaultRules, { profile: "aggressive" });

describe("Pre-Release: reale Sprach- und Flexionsgrenzen", () => {
  it("erhält unentscheidbare gemischte Singularartikel mit Plural vollständig", () => {
    const text = "Der:die Stellvertreter:innen haben abgestimmt.";
    expect(korrigiere(text)).toEqual({ text, replacements: 0 });
  });

  it.each([
    ["Notfallsanitäter/-in (m/w/d)", "Notfallsanitäter"],
    ["Pflegefachassistent/-in (m/w/d)", "Pflegefachassistent"]
  ])("korrigiert eine belegte Stellenanzeigen-Singularform", (original, erwartung) => {
    expect(korrigiere(original).text).toBe(erwartung);
  });

  it.each([
    ["Instandhalter:innen", "Instandhalter"],
    ["Maschinenbediener:innen", "Maschinenbediener"],
    ["mit Instandhalter:innen", "mit Instandhaltern"],
    ["mit Maschinenbediener:innen", "mit Maschinenbedienern"]
  ])("erkennt neue exakte Berufsbasen und ihre Dativformen", (original, erwartung) => {
    expect(korrigiere(original).text).toBe(erwartung);
  });

  it("flektiert alle drei Elemente einer eindeutig dativischen Aufzählung", () => {
    expect(korrigiere("mit Lehrer*innen, Forscher*innen und Ärzt*innen"))
      .toEqual({ text: "mit Lehrern, Forschern und Ärzten", replacements: 3 });
  });

  it("verändert eine Aufzählung ohne erkennbaren Dativauslöser nicht in einen künstlichen Dativ", () => {
    expect(korrigiere("Lehrer*innen, Forscher*innen und Ärzt*innen").text)
      .toBe("Lehrer, Forscher und Ärzte");
  });

  it("berücksichtigt einen Dativauslöser über Inline-Markup hinweg", () => {
    document.body.innerHTML = "<p>mit <strong>Lehrer*innen</strong> sprechen</p>";
    const processor = new DomProcessor(document, { rules: defaultRules, profile: "aggressive" });
    try {
      processor.start();
      expect(document.querySelector("strong")?.textContent).toBe("Lehrern");
    } finally {
      processor.stop({ restore: true });
      document.body.innerHTML = "";
    }
  });
});
