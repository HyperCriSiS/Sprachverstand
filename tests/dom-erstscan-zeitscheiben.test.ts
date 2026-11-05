import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { transformTextWithSummary } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { domRuleMetadata } from "../src/rules/dom-metadata";
import { isBuiltInTransformCandidate } from "../src/rules/transform-candidate";

// Große Seiten laufen über den eingereihten Erstscan in Zeitscheiben. Die
// Befunde stammen aus der Pale-Moon-Browserprüfung vom 04.11.2026, der Pfad
// ist in allen Browsern derselbe.
const fuellung = `<div>${"<i></i>".repeat(1_600)}</div>`;

let processor: DomProcessor | undefined;

function starten(
  html: string,
  options: Partial<ConstructorParameters<typeof DomProcessor>[1]> = {}
): DomProcessor {
  document.body.innerHTML = html + fuellung;
  processor = new DomProcessor(document, {
    rules: domRuleMetadata,
    isTransformCandidate: isBuiltInTransformCandidate,
    transformText: (input, transformOptions) =>
      Promise.resolve(transformTextWithSummary(input, defaultRules, transformOptions)),
    profile: "aggressive",
    processAccessibleAttributes: false,
    processSubtitles: false,
    ...options
  });
  processor.start();
  return processor;
}

async function abwarten(fertig: () => boolean, runden = 80): Promise<void> {
  for (let index = 0; index < runden && !fertig(); index++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    processor?.flush();
  }
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
  document.head.replaceChildren();
});

describe("Zeitscheiben des Erstscans", () => {
  it("verarbeitet eingefügten Text, bevor der Erstscan einer großen Seite endet", async () => {
    // Ohne Nachrichtenkanal laufen die Scheiben über Timer: zwischen zwei
    // Warteschritten unten genau eine mit höchstens 128 Schritten, während
    // der Erstscan über zehn davon braucht.
    const view = document.defaultView as Window & { MessageChannel?: unknown };
    const kanal = view.MessageChannel;
    view.MessageChannel = undefined;
    try {
      const absaetze = Array.from({ length: 600 }, () => "<p>Alle Lehrer:innen</p>").join("");
      starten(absaetze);
      const letzter = document.body.querySelector("p:nth-of-type(600)")!;
      const neu = document.createElement("p");
      neu.textContent = "Alle Kolleg*innen";
      document.body.append(neu);

      let scheiben = 0;
      while (neu.textContent !== "Alle Kollegen" && scheiben < 50) {
        await new Promise((resolve) => setTimeout(resolve, 0));
        scheiben++;
      }
      expect(neu.textContent).toBe("Alle Kollegen");
      expect(letzter.textContent).toBe("Alle Lehrer:innen");

      await abwarten(() => letzter.textContent === "Alle Lehrer");
      expect(letzter.textContent).toBe("Alle Lehrer");
      expect(processor!.getReplacementCount()).toBe(601);
    } finally {
      view.MessageChannel = kanal;
    }
  });

  it("plant Zeitscheiben ohne Aufgabenplaner über einen Nachrichtenkanal statt über Timer", () => {
    const view = document.defaultView as Window & { MessageChannel?: unknown };
    const gesendet: unknown[] = [];
    const kanal = {
      port1: { onmessage: undefined as ((event: unknown) => void) | undefined },
      port2: { postMessage: (value: unknown) => gesendet.push(value) }
    };
    const vorher = view.MessageChannel;
    view.MessageChannel = function () { return kanal; };
    const timer = vi.spyOn(view, "setTimeout");
    try {
      starten("<p>Alle Lehrer:innen</p>");
      expect(gesendet.length).toBe(1);
      expect(timer).not.toHaveBeenCalledWith(expect.any(Function), 0);
      kanal.port1.onmessage?.({});
      // Die erste Scheibe lief und hat die nächste über denselben Kanal angefordert.
      expect(gesendet.length).toBe(2);
      // Nach stop() darf die noch ausstehende Nachricht keinen Handler mehr
      // treffen: in Pale Moon wäre die Sandbox dann schon abgeräumt.
      processor!.stop({ restore: true });
      processor = undefined;
      expect(kanal.port1.onmessage).toBeNull();
    } finally {
      timer.mockRestore();
      view.MessageChannel = vorher;
    }
  });

  it("entfernt getrennte Marker nach einem Vortext mit eigener Korrektur", async () => {
    starten("<p>Liebe Kolleg*innen und Lehrer*<b>innen</b>, kommt.</p>");
    const absatz = document.querySelector("p")!;
    await abwarten(() => absatz.textContent === "Liebe Kollegen und Lehrer, kommt.");
    expect(absatz.textContent).toBe("Liebe Kollegen und Lehrer, kommt.");
    processor!.stop({ restore: true });
    processor = undefined;
    expect(absatz.innerHTML).toBe("Liebe Kolleg*innen und Lehrer*<b>innen</b>, kommt.");
  });

  it("reiht nach einer Titeländerung nur den Dokumentkopf neu ein", async () => {
    // Ohne HEAD als Blockgrenze reichte die Inline-Grenze eines neu angelegten
    // Titels bis zur Dokumentwurzel: die ganze Seite wurde neu eingereiht, alle
    // korrigierten Texte galten als kontextschmutzig und liefen erneut durch
    // den Erstscan.
    expect(document.head.querySelector("title")).toBeNull();
    starten("<p>Alle Mitarbeiter:innen</p>", { processQuotedText: false });
    await abwarten(() => document.querySelector("p")!.textContent === "Alle Mitarbeiter");
    const eingereiht = vi.spyOn(processor as unknown as { queue(root: Node): void }, "queue");
    document.title = "Neue Mitarbeiter:innen gesucht";
    await abwarten(() => false, 4);
    expect(eingereiht).toHaveBeenCalled();
    for (const [wurzel] of eingereiht.mock.calls) {
      expect(document.head.contains(wurzel)).toBe(true);
    }
  });
});
