import { describe, expect, it } from "vitest";
import {
  isProbablyTechnicalText,
  shouldProcessTextNode
} from "../src/core/text-safety";

describe("isProbablyTechnicalText", () => {
  it("erkennt URLs, E-Mail-Adressen und technische Blöcke", () => {
    expect(isProbablyTechnicalText("https://example.org/test")).toBe(true);
    expect(isProbablyTechnicalText("name@example.org")).toBe(true);
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
