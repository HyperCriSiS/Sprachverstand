import { describe, expect, it } from "vitest";
import { messfelder, median, pruefePaar, zusammenfassung } from "../scripts/interaction-performance-metrics.mjs";

function lauf(erweitert: boolean, zusatz = 0) {
  return {
    status: "ok",
    staticText: erweitert ? "Nutzer" : "Nutzer:innen",
    dynamicText: erweitert ? "Nutzer" : "Nutzer:innen",
    protectedOk: true,
    interactionCount: 2,
    mutationTicks: 100,
    rafCount: 190,
    longTaskSupported: true,
    rafP95Ms: 17 + zusatz,
    rafMaximumMs: 30 + zusatz,
    longTaskTotalMs: 50 + zusatz
  };
}

describe("Kontrollierte Interaktions- und Longtask-Diagnose", () => {
  it("berechnet ungerade und gerade Mediane ohne Leere als Nullleistung darzustellen", () => {
    expect(median([100, 12, 20])).toBe(20);
    expect(median([8, 4, 12, 16])).toBe(10);
    expect(median([])).toBeNull();
    expect(median([NaN, 5])).toBe(5);
  });

  it("verlangt echte aktive Erweiterung und unveränderte Eingaben", () => {
    expect(pruefePaar({ baseline: lauf(false), extension: lauf(true) }).ok).toBe(true);
    expect(pruefePaar({ baseline: lauf(false), extension: lauf(false) }).ok).toBe(false);
    expect(pruefePaar({ baseline: lauf(false), extension: { ...lauf(true), protectedOk: false } }).ok).toBe(false);
    expect(pruefePaar({ baseline: lauf(false), extension: { ...lauf(true), rafCount: 0 } }).ok).toBe(false);
  });

  it("ignoriert fehlgeschlagene Paare und mittelt keine Ausgangssitzung ein", () => {
    const paare = [
      { baseline: lauf(false), extension: lauf(true, 80) },
      { baseline: lauf(false), extension: lauf(true, 4) },
      { baseline: lauf(false), extension: lauf(true, 8) },
      { baseline: lauf(false), extension: { ...lauf(true, 999), status: "error" } }
    ];
    const ausgabe = zusammenfassung(paare);
    expect(ausgabe.angefordert).toBe(4);
    expect(ausgabe.gueltig).toBe(3);
    expect(ausgabe.phasen.rafP95Ms?.deltaMedian).toBe(8);
    expect(ausgabe.phasen.longTaskTotalMs?.deltaMedian).toBe(8);
  });

  it("kennzeichnet nicht ermittelte Messwerte ausdrücklich als null", () => {
    const ergebnis = zusammenfassung([]);
    expect(ergebnis.gueltig).toBe(0);
    for (const name of messfelder) {
      expect(ergebnis.phasen[name]?.deltaMedian).toBeNull();
    }
    expect(ergebnis.longTaskPaareMessbar).toBe(0);
  });
});
