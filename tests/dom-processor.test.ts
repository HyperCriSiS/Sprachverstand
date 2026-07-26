import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { createRegexRule } from "../src/core/rule";

const rule = createRegexRule({
  id: "test.separator",
  risk: "safe",
  pattern: /Nutzer:innen/gu,
  replace: () => "Nutzer"
});

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop();
  processor = undefined;
  document.body.innerHTML = "";
});

describe("DomProcessor", () => {
  it("verarbeitet normale Textknoten und schützt sensible Bereiche", () => {
    document.body.innerHTML = `
      <p>Nutzer:innen lesen.</p>
      <code>Nutzer:innen</code>
      <div contenteditable="true">Nutzer:innen</div>
    `;

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    expect(document.querySelector("p")?.textContent).toBe("Nutzer lesen.");
    expect(document.querySelector("code")?.textContent).toBe("Nutzer:innen");
    expect(
      document.querySelector("[contenteditable]")?.textContent
    ).toBe("Nutzer:innen");
  });

  it("verarbeitet ausschließlich freigegebene zugängliche Attribute", () => {
    document.body.innerHTML = `
      <img alt="Nutzer:innen im Team">
      <button
        aria-label="Nutzer:innen öffnen"
        aria-description="Nutzer:innen verwalten"
        title="Nutzer:innen auswählen"
        data-label="Nutzer:innen"
      >Nutzer:innen</button>
    `;

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    const image = document.querySelector("img");
    const button = document.querySelector("button");

    expect(image?.getAttribute("alt")).toBe("Nutzer im Team");
    expect(button?.getAttribute("aria-label")).toBe("Nutzer öffnen");
    expect(button?.getAttribute("aria-description")).toBe("Nutzer verwalten");
    expect(button?.getAttribute("title")).toBe("Nutzer auswählen");
    expect(button?.getAttribute("data-label")).toBe("Nutzer:innen");
    expect(button?.textContent).toBe("Nutzer:innen");
  });

  it("schützt ignorierte, versteckte, editierbare und technische Attribute", () => {
    document.body.innerHTML = `
      <div data-sprachverstand-ignore aria-label="Nutzer:innen"></div>
      <div aria-hidden="true" title="Nutzer:innen"></div>
      <div contenteditable="true" aria-description="Nutzer:innen"></div>
      <code title="Nutzer:innen"></code>
      <img alt="https://example.test/Nutzer:innen">
    `;

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    expect(
      document.querySelector("[data-sprachverstand-ignore]")?.getAttribute(
        "aria-label"
      )
    ).toBe("Nutzer:innen");
    expect(document.querySelector("[aria-hidden]")?.getAttribute("title")).toBe(
      "Nutzer:innen"
    );
    expect(
      document.querySelector("[contenteditable]")?.getAttribute(
        "aria-description"
      )
    ).toBe("Nutzer:innen");
    expect(document.querySelector("code")?.getAttribute("title")).toBe(
      "Nutzer:innen"
    );
    expect(document.querySelector("img")?.getAttribute("alt")).toBe(
      "https://example.test/Nutzer:innen"
    );
  });

  it("verarbeitet dynamisch hinzugefügte Inhalte und Attribute", async () => {
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    const paragraph = document.createElement("p");
    paragraph.textContent = "Neue Nutzer:innen";
    paragraph.setAttribute("title", "Nutzer:innen anzeigen");
    document.body.append(paragraph);

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();

    expect(paragraph.textContent).toBe("Neue Nutzer");
    expect(paragraph.getAttribute("title")).toBe("Nutzer anzeigen");
  });

  it("reagiert auf geänderte bestehende Textknoten", async () => {
    const paragraph = document.createElement("p");
    paragraph.textContent = "Unverändert";
    document.body.append(paragraph);

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    const textNode = paragraph.firstChild as Text;
    textNode.data = "Nutzer:innen";

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();

    expect(textNode.data).toBe("Nutzer");
  });

  it("reagiert gezielt auf spätere Attributänderungen", async () => {
    const image = document.createElement("img");
    image.alt = "Unverändert";
    image.setAttribute("data-label", "Unverändert");
    document.body.append(image);

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    image.alt = "Nutzer:innen im Bild";
    image.title = "Nutzer:innen anzeigen";
    image.setAttribute("data-label", "Nutzer:innen");

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();

    expect(image.alt).toBe("Nutzer im Bild");
    expect(image.title).toBe("Nutzer anzeigen");
    expect(image.getAttribute("data-label")).toBe("Nutzer:innen");
  });

  it("stellt eigene Text- und Attributänderungen beim Abschalten zurück", () => {
    document.body.innerHTML = `
      <p>Nutzer:innen lesen.</p>
      <img alt="Nutzer:innen im Team">
    `;

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    expect(document.querySelector("p")?.textContent).toBe("Nutzer lesen.");
    expect(document.querySelector("img")?.getAttribute("alt")).toBe(
      "Nutzer im Team"
    );

    processor.stop({ restore: true });

    expect(document.querySelector("p")?.textContent).toBe(
      "Nutzer:innen lesen."
    );
    expect(document.querySelector("img")?.getAttribute("alt")).toBe(
      "Nutzer:innen im Team"
    );
  });

  it("überschreibt beim Zurücksetzen keine späteren Seitenänderungen", () => {
    document.body.innerHTML = `<p>Nutzer:innen lesen.</p>`;

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    const paragraph = document.querySelector("p") as HTMLParagraphElement;
    paragraph.firstChild!.textContent = "Die Webseite hat den Inhalt geändert.";

    processor.stop({ restore: true });

    expect(paragraph.textContent).toBe("Die Webseite hat den Inhalt geändert.");
  });

  it("meldet die aktuelle Zahl und setzt sie beim Wiederherstellen auf null", async () => {
    document.body.innerHTML = `
      <p>Nutzer:innen lesen.</p>
      <img alt="Nutzer:innen im Team">
    `;
    const counts: number[] = [];

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      onReplacementCountChange: (count) => counts.push(count)
    });
    processor.start();
    await Promise.resolve();

    expect(processor.getReplacementCount()).toBe(2);
    expect(counts.at(-1)).toBe(2);

    processor.stop({ restore: true });
    await Promise.resolve();

    expect(processor.getReplacementCount()).toBe(0);
    expect(counts.at(-1)).toBe(0);
  });
});
