import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const runner = readFileSync("scripts/controlled-interaction-performance.mjs", "utf8");

describe("Fail-Closed-Diagnose für dynamische Textmutationen", () => {
  it("misst Recovery ausschließlich nach einem real fehlenden Erweiterungs-Ergebnis", () => {
    expect(runner).toContain('if (modus === "extension" && dynamicAfterSettle !== "Nutzer")');
    expect(runner).toContain('console.log("INTERAKTION-RECOVERY "');
    expect(runner).toContain("recoveryProbe = { before, after, results }");
    // Die ursprünglichen Messwerte werden vor den mutierenden Proben erfasst.
    expect(runner.indexOf("const details = await js(id,")).toBeLessThan(
      runner.indexOf("let recoveryProbe = null;")
    );
    expect(runner).toContain("dynamicAfterSettle,");
    expect(runner).toContain("recoveryProbe");
  });

  it("trennt Zeichenmutation, Kindknotentausch, neuen Unterbaum und statischen Text", () => {
    expect(runner).toContain('target.firstChild.data = "Nutzer:innen Diagnose Zeichen"');
    expect(runner).toContain('other.textContent = "Nutzer:innen Diagnose Austausch"');
    expect(runner).toContain('statisch.textContent = "Nutzer:innen Diagnose statisch"');
    expect(runner).toContain('added.id = "recovery-new-target"');
    expect(runner).toContain("uncorrectedCount:");
    expect(runner).toContain("targetProtected:");
  });

  it("behält die harte Fehlerentscheidung aus der originalen Messung bei", () => {
    expect(runner).toContain("const fehlerhafte = paare.map");
    expect(runner).toContain('throw new Error("Ungültige A/B-Paare: "');
    expect(runner).not.toContain('if (recoveryProbe) dynamicAfterSettle = "Nutzer"');
  });
});