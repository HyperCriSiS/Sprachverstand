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

  it("verarbeitet dynamisch hinzugefügte Inhalte", async () => {
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    const paragraph = document.createElement("p");
    paragraph.textContent = "Neue Nutzer:innen";
    document.body.append(paragraph);

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    processor.flush();

    expect(paragraph.textContent).toBe("Neue Nutzer");
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
});
