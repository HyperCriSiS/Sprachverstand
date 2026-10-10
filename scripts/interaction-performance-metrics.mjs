// Auswertung vollständig lokaler Chromium-A/B-Interaktionen ohne Leistungs-Freigabeschwellen.
export const messfelder = Object.freeze([
  "rafP95Ms", "rafMaximumMs", "rafGapsOver120",
  "longTaskTotalMs", "longTaskMaximumMs", "longTaskCount",
  "clickNextFrameMs", "inputNextFrameMs", "interactionCount",
  "mutationTicks"
]);

export function median(werte) {
  const zahlen = werte.filter(Number.isFinite).sort((a, b) => a - b);
  if (zahlen.length === 0) return null;
  const mitte = Math.floor(zahlen.length / 2);
  return zahlen.length % 2
    ? zahlen[mitte]
    : (zahlen[mitte - 1] + zahlen[mitte]) / 2;
}

export function pruefePaar(paar) {
  const basis = paar?.baseline;
  const erweiterung = paar?.extension;
  if (basis?.status !== "ok" || erweiterung?.status !== "ok") {
    return { ok: false, grund: "Mindestens eine Browser-Sitzung fehlgeschlagen." };
  }
  if (basis.staticText !== "Nutzer:innen" || erweiterung.staticText !== "Nutzer") {
    return { ok: false, grund: "Erweiterungsaktivierung nicht eindeutig bestätigt." };
  }
  if (basis.dynamicText !== "Nutzer:innen" || erweiterung.dynamicText !== "Nutzer") {
    return { ok: false, grund: "Dynamische DOM-Ersetzung fehlt." };
  }
  if (!basis.protectedOk || !erweiterung.protectedOk) {
    return { ok: false, grund: "Geschützte Eingabe oder Code verändert." };
  }
  if (basis.interactionCount < 2 || erweiterung.interactionCount < 2 ||
    basis.mutationTicks < 40 || erweiterung.mutationTicks < 40) {
    return { ok: false, grund: "Interaktions- oder Mutationslast nicht vollständig." };
  }
  if (basis.rafCount < 50 || erweiterung.rafCount < 50) {
    return { ok: false, grund: "Zu wenige tatsächliche Animation-Frames erfasst." };
  }
  // Negative Dauern entlarven unpassende rAF-Zeitstempel oder unvollständige Events.
  const reaktionszeiten = [
    basis.clickNextFrameMs, basis.inputNextFrameMs,
    erweiterung.clickNextFrameMs, erweiterung.inputNextFrameMs
  ];
  if (!reaktionszeiten.every((wert) => Number.isFinite(wert) && wert >= 0)) {
    return { ok: false, grund: "Ungültige oder negative Interaktionsreaktionsdauer." };
  }
  return { ok: true };
}

export function zusammenfassung(paare) {
  const gueltig = paare.filter((paar) => pruefePaar(paar).ok);
  const medianDifferenz = (feld) => median(gueltig.map((paar) => {
    const basis = paar.baseline?.[feld];
    const erweiterung = paar.extension?.[feld];
    return Number.isFinite(basis) && Number.isFinite(erweiterung)
      ? erweiterung - basis : NaN;
  }));
  return {
    angefordert: paare.length,
    gueltig: gueltig.length,
    phasen: Object.fromEntries(messfelder.map((feld) => [
      feld, { deltaMedian: medianDifferenz(feld) }
    ])),
    // Eine fehlende native Longtask-API wird niemals als „0 ms“ ausgegeben.
    longTaskPaareMessbar: gueltig.filter((paar) =>
      paar.baseline.longTaskSupported && paar.extension.longTaskSupported
    ).length
  };
}