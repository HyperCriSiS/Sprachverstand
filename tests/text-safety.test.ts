import { describe, expect, it } from "vitest";
import {
  isProbablyTechnicalText,
  shouldProcessAccessibleAttribute,
  shouldProcessTextNode
} from "../src/core/text-safety";

describe("isProbablyTechnicalText", () => {
  it("erkennt URLs, E-Mail-Adressen und technische Blöcke", () => {
    expect(isProbablyTechnicalText("https://example.org/test")).toBe(true);
    expect(isProbablyTechnicalText("name@example.org")).toBe(true);
    expect(
      isProbablyTechnicalText("Siehe https://example.org/Nutzer:innen")
    ).toBe(true);
    expect(
      isProbablyTechnicalText("Kontakt: name@example.org")
    ).toBe(true);
    expect(
      isProbablyTechnicalText("0123456789abcdef0123456789abcdef")
    ).toBe(true);
  });

  it("akzeptiert normalen Fließtext", () => {
    expect(
      isProbablyTechnicalText("Die Nutzer:innen lesen diesen Absatz.")
    ).toBe(false);
  });
});

describe("shouldProcessTextNode", () => {
  it("akzeptiert normalen Absatztext", () => {
    document.body.innerHTML = "<p>Hallo Nutzer:innen</p>";
    const node = document.querySelector("p")?.firstChild as Text;

    expect(shouldProcessTextNode(node)).toBe(true);
  });

  it("akzeptiert sichtbaren Text in Schaltflächen", () => {
    document.body.innerHTML = `
      <button type="button">
        <span>Hallo Nutzer:innen</span>
      </button>
    `;
    const node = document.querySelector("span")?.firstChild as Text;

    expect(shouldProcessTextNode(node)).toBe(true);
  });

  it("ignoriert Eingaben, Code und Editoren", () => {
    document.body.innerHTML = `
      <input value="Nutzer:innen">
      <code>Nutzer:innen</code>
      <div contenteditable="true">Nutzer:innen</div>
    `;

    const codeNode = document.querySelector("code")?.firstChild as Text;
    const editorNode =
      document.querySelector("[contenteditable]")?.firstChild as Text;

    expect(shouldProcessTextNode(codeNode)).toBe(false);
    expect(shouldProcessTextNode(editorNode)).toBe(false);
  });
});

describe("shouldProcessAccessibleAttribute", () => {
  it("akzeptiert ausschließlich freigegebene Textattribute", () => {
    const image = document.createElement("img");
    image.alt = "Nutzer:innen im Bild";
    document.body.append(image);

    expect(
      shouldProcessAccessibleAttribute(image, "alt", image.alt)
    ).toBe(true);
    expect(
      shouldProcessAccessibleAttribute(image, "data-label", "Nutzer:innen")
    ).toBe(false);
  });

  it("ignoriert technische und bewusst ausgeschlossene Attribute", () => {
    document.body.innerHTML = `
      <div data-sprachverstand-ignore aria-label="Nutzer:innen"></div>
      <div aria-hidden="true" title="Nutzer:innen"></div>
      <code title="Nutzer:innen"></code>
      <img alt="https://example.org/Nutzer:innen">
    `;

    const ignored = document.querySelector(
      "[data-sprachverstand-ignore]"
    ) as Element;
    const hidden = document.querySelector("[aria-hidden]") as Element;
    const code = document.querySelector("code") as Element;
    const image = document.querySelector("img") as HTMLImageElement;

    expect(
      shouldProcessAccessibleAttribute(ignored, "aria-label", "Nutzer:innen")
    ).toBe(false);
    expect(
      shouldProcessAccessibleAttribute(hidden, "title", "Nutzer:innen")
    ).toBe(false);
    expect(
      shouldProcessAccessibleAttribute(code, "title", "Nutzer:innen")
    ).toBe(false);
    expect(
      shouldProcessAccessibleAttribute(image, "alt", image.alt)
    ).toBe(false);
  });
});
