import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { knownPluralSeparatorsRule } from "../src/rules/known-plural-separators";

function flushDom(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("DomProcessor", () => {
  it("verarbeitet normale Textknoten und schützt sensible Bereiche", () => {
    document.body.innerHTML = `
      <p id="normal">Hallo Nutzer:innen</p>
      <code id="code">Nutzer:innen</code>
      <textarea id="textarea">Nutzer:innen</textarea>
      <div id="editor" contenteditable="true">Nutzer:innen</div>
      <div id="ignored" data-sprachverstand-ignore>Nutzer:innen</div>
    `;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    expect(document.querySelector("#normal")?.textContent).toBe("Hallo Nutzer");
    expect(document.querySelector("#code")?.textContent).toBe("Nutzer:innen");
    expect(document.querySelector("#textarea")?.textContent).toBe("Nutzer:innen");
    expect(document.querySelector("#editor")?.textContent).toBe("Nutzer:innen");
    expect(document.querySelector("#ignored")?.textContent).toBe("Nutzer:innen");
  });

  it("verarbeitet ausschließlich freigegebene zugängliche Attribute", () => {
    document.body.innerHTML = `
      <img id="image" alt="Nutzer:innen im Bild" aria-label="Nutzer:innen" title="Nutzer:innen" data-label="Nutzer:innen">
      <button id="button" aria-description="Nutzer:innen auswählen" title="Nutzer:innen auswählen" data-label="Nutzer:innen">Nutzer:innen</button>
    `;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    const image = document.querySelector("#image");
    const button = document.querySelector("#button");

    expect(image?.getAttribute("alt")).toBe("Nutzer im Bild");
    expect(image?.getAttribute("aria-label")).toBe("Nutzer");
    expect(image?.getAttribute("title")).toBe("Nutzer");
    expect(image?.getAttribute("data-label")).toBe("Nutzer:innen");
    expect(button?.getAttribute("aria-description")).toBe("Nutzer auswählen");
    expect(button?.getAttribute("title")).toBe("Nutzer auswählen");
    expect(button?.getAttribute("data-label")).toBe("Nutzer:innen");
    expect(button?.textContent).toBe("Nutzer");
  });

  it("schützt ignorierte, versteckte, editierbare und technische Attribute", () => {
    document.body.innerHTML = `
      <img id="technical" alt="https://example.org/Nutzer:innen">
      <div id="ignored" data-sprachverstand-ignore aria-label="Nutzer:innen"></div>
      <div id="hidden" aria-hidden="true" title="Nutzer:innen"></div>
      <div id="editor" contenteditable="true" aria-label="Nutzer:innen"></div>
      <code id="code" title="Nutzer:innen"></code>
    `;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    expect(document.querySelector("#technical")?.getAttribute("alt")).toBe(
      "https://example.org/Nutzer:innen"
    );
    expect(document.querySelector("#ignored")?.getAttribute("aria-label")).toBe(
      "Nutzer:innen"
    );
    expect(document.querySelector("#hidden")?.getAttribute("title")).toBe(
      "Nutzer:innen"
    );
    expect(document.querySelector("#editor")?.getAttribute("aria-label")).toBe(
      "Nutzer:innen"
    );
    expect(document.querySelector("#code")?.getAttribute("title")).toBe(
      "Nutzer:innen"
    );
  });

  it("verarbeitet dynamisch hinzugefügte Inhalte und Attribute", async () => {
    document.body.innerHTML = `<div id="host"></div>`;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    const paragraph = document.createElement("p");
    paragraph.textContent = "Neue Nutzer:innen";
    paragraph.setAttribute("aria-label", "Neue Nutzer:innen");
    document.querySelector("#host")?.append(paragraph);

    await flushDom();

    expect(paragraph.textContent).toBe("Neue Nutzer");
    expect(paragraph.getAttribute("aria-label")).toBe("Neue Nutzer");
  });

  it("reagiert auf geänderte bestehende Textknoten", async () => {
    document.body.innerHTML = `<p id="target">Neutral</p>`;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    const target = document.querySelector("#target")?.firstChild as Text;
    target.data = "Nutzer:innen";

    await flushDom();

    expect(target.data).toBe("Nutzer");
  });

  it("reagiert gezielt auf spätere Attributänderungen", async () => {
    document.body.innerHTML = `<img id="target" alt="neutral">`;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    const target = document.querySelector("#target") as Element;
    target.setAttribute("alt", "Nutzer:innen");

    await flushDom();

    expect(target.getAttribute("alt")).toBe("Nutzer");
  });

  it("stellt eigene Text- und Attributänderungen beim Abschalten zurück", () => {
    document.body.innerHTML = `
      <p id="text">Hallo Nutzer:innen</p>
      <img id="image" alt="Nutzer:innen im Bild">
    `;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);
    processor.stop();

    expect(document.querySelector("#text")?.textContent).toBe("Hallo Nutzer:innen");
    expect(document.querySelector("#image")?.getAttribute("alt")).toBe(
      "Nutzer:innen im Bild"
    );
  });

  it("überschreibt beim Zurücksetzen keine späteren Seitenänderungen", () => {
    document.body.innerHTML = `<p id="target">Nutzer:innen</p>`;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    const target = document.querySelector("#target") as HTMLParagraphElement;
    target.textContent = "Von der Seite ersetzt";
    processor.stop();

    expect(target.textContent).toBe("Von der Seite ersetzt");
  });

  it("meldet die aktuelle Zahl und setzt sie beim Wiederherstellen auf null", () => {
    document.body.innerHTML = `
      <p>Nutzer:innen und Besucher:innen</p>
      <img alt="Helfer:innen">
    `;
    const onCountChanged = vi.fn();

    const processor = new DomProcessor(
      [knownPluralSeparatorsRule],
      { onCountChanged }
    );
    processor.start(document.body);

    expect(processor.getReplacementCount()).toBe(3);
    expect(onCountChanged).toHaveBeenLastCalledWith(3);

    processor.stop();
    expect(processor.getReplacementCount()).toBe(0);
    expect(onCountChanged).toHaveBeenLastCalledWith(0);
  });

  it("kann zugängliche Attribute unabhängig vom sichtbaren Text abschalten", () => {
    document.body.innerHTML = `
      <p id="text">Nutzer:innen</p>
      <img id="image" alt="Nutzer:innen">
    `;

    const processor = new DomProcessor([knownPluralSeparatorsRule], {
      processAccessibleAttributes: false
    });
    processor.start(document.body);

    expect(document.querySelector("#text")?.textContent).toBe("Nutzer");
    expect(document.querySelector("#image")?.getAttribute("alt")).toBe(
      "Nutzer:innen"
    );
  });

  it("kann direkt zitierte Schreibweisen von der Verarbeitung ausnehmen", () => {
    document.body.innerHTML = `<p>„Nutzer:innen“ und Besucher:innen</p>`;

    const processor = new DomProcessor([knownPluralSeparatorsRule], {
      processQuotedText: false
    });
    processor.start(document.body);

    expect(document.body.textContent).toContain("„Nutzer:innen“ und Besucher");
  });

  it("überspringt erkannte Untertitel standardmäßig, aber nicht den restlichen Player", () => {
    document.body.innerHTML = `
      <div class="video-player">
        <span id="subtitle" class="ytp-caption-segment">Nutzer:innen sprechen</span>
        <button id="control">Nutzer:innen</button>
      </div>
    `;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    expect(document.querySelector("#subtitle")?.textContent).toBe(
      "Nutzer:innen sprechen"
    );
    expect(document.querySelector("#control")?.textContent).toBe("Nutzer");
  });

  it("verwechselt normale Unterzeilen und Bildunterschriften nicht mit Video-Untertiteln", () => {
    document.body.innerHTML = `
      <article>
        <p id="subtitle" class="subtitle">Nutzer:innen im Untertitel</p>
        <figcaption id="caption">Besucher:innen im Bild</figcaption>
      </article>
    `;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    expect(document.querySelector("#subtitle")?.textContent).toBe(
      "Nutzer im Untertitel"
    );
    expect(document.querySelector("#caption")?.textContent).toBe(
      "Besucher im Bild"
    );
  });

  it("korrigiert Untertitel nur nach ausdrücklicher Aktivierung", () => {
    document.body.innerHTML = `
      <div class="video-player">
        <span id="subtitle" class="ytp-caption-segment">Nutzer:innen sprechen</span>
      </div>
    `;

    const processor = new DomProcessor([knownPluralSeparatorsRule], {
      processSubtitles: true
    });
    processor.start(document.body);

    expect(document.querySelector("#subtitle")?.textContent).toBe(
      "Nutzer sprechen"
    );
  });

  it("verarbeitet Anreden auch über getrennte Inline-Textknoten", () => {
    document.body.innerHTML = `
      <p>
        <strong id="salutation">Liebe</strong>
        <span id="target"> Nutzerinnen und Nutzer</span>
      </p>
    `;

    const processor = new DomProcessor([knownPluralSeparatorsRule]);
    processor.start(document.body);

    expect(document.querySelector("#target")?.textContent).toBe(" Nutzer");
  });
});
