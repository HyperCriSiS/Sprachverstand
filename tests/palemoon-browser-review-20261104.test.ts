import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { transformTextWithSummary } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";
import { domRuleMetadata } from "../src/rules/dom-metadata";
import { isBuiltInTransformCandidate } from "../src/rules/transform-candidate";

// Der Pale-Moon-Port verwendet den Kernprozessor; große Seiten laufen über
// dessen eingereihten Erstscan in Zeitscheiben. Diese Tests führen die
// Befunde der Browser-Überprüfung durch genau diesen Pfad.
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
    processAccessibleAttributes: true,
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
  vi.useRealTimers();
});

describe("Pale Moon: Browser-Überprüfung 04.11.2026 im eingereihten Erstscan", () => {
  it("lässt den Dokumenttitel unverändert", async () => {
    document.head.innerHTML = "<title>Mitarbeiter:innen gesucht</title>";
    starten("<p>Alle Mitarbeiter:innen</p>");
    await abwarten(() => document.querySelector("p")!.textContent === "Alle Mitarbeiter");
    expect(document.querySelector("p")!.textContent).toBe("Alle Mitarbeiter");
    expect(document.title).toBe("Mitarbeiter:innen gesucht");
    document.title = "Neue Mitarbeiter:innen gesucht";
    await abwarten(() => false, 4);
    expect(document.title).toBe("Neue Mitarbeiter:innen gesucht");
  });

  it("schützt Attribute unter einer Editor-Rolle", async () => {
    starten(
      '<div role="textbox"><img alt="Mitarbeiter:innen"></div>' +
      '<img id="frei" alt="Lehrer:innen">'
    );
    await abwarten(() => document.getElementById("frei")!.getAttribute("alt") === "Lehrer");
    expect(document.getElementById("frei")!.getAttribute("alt")).toBe("Lehrer");
    expect(document.querySelector("[role='textbox'] img")!.getAttribute("alt")).toBe("Mitarbeiter:innen");
  });

  it("gibt einen dauerhaft fehlschlagenden Transformer auf und reiht nach Erfolg wieder ein", async () => {
    vi.useFakeTimers();
    let verfuegbar = false;
    let aufrufe = 0;
    starten("<p>Alle Mitarbeiter:innen</p>", {
      processAccessibleAttributes: false,
      transformText: (input, transformOptions) => {
        aufrufe++;
        return verfuegbar
          ? Promise.resolve(transformTextWithSummary(input, defaultRules, transformOptions))
          : Promise.reject(new Error("Pale-Moon-Regelmodul nicht verfügbar."));
      }
    });
    for (let index = 0; index < 40; index++) {
      await vi.advanceTimersByTimeAsync(1_000);
      processor!.flush();
    }
    // Ein Erstversuch und drei Wiederholungen, danach Ruhe.
    expect(aufrufe).toBe(4);
    expect(document.querySelector("p")!.textContent).toBe("Alle Mitarbeiter:innen");

    verfuegbar = true;
    const neu = document.createElement("p");
    neu.textContent = "Alle Lehrer:innen";
    document.body.append(neu);
    for (let index = 0; index < 5; index++) {
      await vi.advanceTimersByTimeAsync(10);
      processor!.flush();
    }
    expect(neu.textContent).toBe("Alle Lehrer");
    expect(document.querySelector("p")!.textContent).toBe("Alle Mitarbeiter");
  });

  it("entfernt getrennte Marker nach einem Vortext mit eigener Korrektur", async () => {
    starten("<p>Liebe Kolleg*innen und Lehrer*<b>innen</b>, kommt.</p>", {
      processAccessibleAttributes: false
    });
    const absatz = document.querySelector("p")!;
    await abwarten(() => absatz.textContent === "Liebe Kollegen und Lehrer, kommt.");
    expect(absatz.textContent).toBe("Liebe Kollegen und Lehrer, kommt.");
    processor!.stop({ restore: true });
    processor = undefined;
    expect(absatz.innerHTML).toBe("Liebe Kolleg*innen und Lehrer*<b>innen</b>, kommt.");
  });

  it("paart Zitate über geschützte Inline-Elemente hinweg", async () => {
    starten(
      "<p>„Alle <code>git</code> Nutzer*innen“ kamen.</p><p>Alle Schüler*innen lesen.</p>",
      { processAccessibleAttributes: false, processQuotedText: false }
    );
    const [zitat, frei] = document.querySelectorAll("p");
    await abwarten(() => frei!.textContent === "Alle Schüler lesen.");
    expect(frei!.textContent).toBe("Alle Schüler lesen.");
    expect(zitat!.textContent).toBe("„Alle git Nutzer*innen“ kamen.");
  });
});

describe("Pale Moon: Zeitscheiben des Erstscans", () => {
  it("verarbeitet eingefügten Text, bevor der Erstscan einer großen Seite endet", async () => {
    // Ohne Nachrichtenkanal laufen die Scheiben über Timer: zwischen zwei
    // Warteschritten unten genau eine mit höchstens 128 Schritten, während
    // der Erstscan über zehn davon braucht.
    const view = document.defaultView as Window & { MessageChannel?: unknown };
    const kanal = view.MessageChannel;
    view.MessageChannel = undefined;
    try {
      const absaetze = Array.from({ length: 600 }, () => "<p>Alle Lehrer:innen</p>").join("");
      starten(absaetze, { processAccessibleAttributes: false });
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
      starten("<p>Alle Lehrer:innen</p>", { processAccessibleAttributes: false });
      expect(gesendet.length).toBe(1);
      expect(timer).not.toHaveBeenCalledWith(expect.any(Function), 0);
      kanal.port1.onmessage?.({});
      // Die erste Scheibe lief und hat die nächste über denselben Kanal angefordert.
      expect(gesendet.length).toBe(2);
    } finally {
      timer.mockRestore();
      view.MessageChannel = vorher;
    }
  });
});
