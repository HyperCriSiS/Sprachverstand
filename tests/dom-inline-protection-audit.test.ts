import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

function starten(
  html: string,
  options: { processQuotedText?: boolean; protectedTerms?: readonly string[] }
): HTMLElement {
  document.body.innerHTML = html;
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false,
    ...options
  });
  processor.start();
  const paragraph = document.querySelector("p");
  if (!paragraph) {
    throw new Error("Testabsatz fehlt.");
  }
  return paragraph;
}

async function mutationVerarbeiten(): Promise<void> {
  await Promise.resolve();
  processor?.flush();
  await Promise.resolve();
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

describe("Audit DOM-06: Schutz über Inline-Elementgrenzen", () => {
  it("bewahrt Zitate über strong und normalisiert nur außerhalb", () => {
    const paragraph = starten(
      "<p>Sie schrieb „<strong>Lehrer:innen</strong> bleiben“ und Lehrer:innen sprechen.</p>",
      { processQuotedText: false }
    );
    expect(paragraph.textContent).toBe(
      "Sie schrieb „Lehrer:innen bleiben“ und Lehrer sprechen."
    );
    expect(paragraph.querySelector("strong")?.textContent).toBe("Lehrer:innen");
    expect(processor?.getReplacementCount()).toBe(1);
  });

  it("bewahrt ASCII-Zitate über getrennte Spans", () => {
    const paragraph = starten(
      '<p>Er sagte "<span>Lehrer:innen</span> und <b>Expert:innen</b>" – Lehrer:innen.</p>',
      { processQuotedText: false }
    );
    expect(paragraph.textContent).toBe(
      'Er sagte "Lehrer:innen und Expert:innen" – Lehrer.'
    );
    expect(processor?.getReplacementCount()).toBe(1);
  });

  it("erkennt geschützte Mehrwortbegriffe über verschiedene Textknoten", () => {
    const paragraph = starten(
      "<p><span>Lehrer:innen und </span><b>Expert:innen</b> sprechen mit Lehrer:innen.</p>",
      { protectedTerms: ["Lehrer:innen und Expert:innen"] }
    );
    expect(paragraph.textContent).toBe(
      "Lehrer:innen und Expert:innen sprechen mit Lehrern."
    );
    expect(processor?.getReplacementCount()).toBe(1);
  });

  it("schützt eine Mehrwortphrase auch bei verschachteltem Inline-Markup", () => {
    const paragraph = starten(
      "<p><span>Lehrer:innen </span><i><b>und Expert:innen</b></i> – Lehrer:innen.</p>",
      { protectedTerms: ["Lehrer:innen und Expert:innen"] }
    );
    expect(paragraph.textContent).toBe(
      "Lehrer:innen und Expert:innen – Lehrer."
    );
  });

  it("überschreitet keine technischen oder geschützten Elemente", () => {
    const paragraph = starten(
      '<p>„<code>Zitat</code><b>Lehrer:innen</b>“ <span aria-hidden="true">Lehrer:innen</span> und Lehrer:innen.</p>',
      { processQuotedText: false }
    );
    expect(paragraph.querySelector("code")?.textContent).toBe("Zitat");
    expect(paragraph.querySelector('[aria-hidden="true"]')?.textContent).toBe("Lehrer:innen");
    expect(paragraph.querySelector("b")?.textContent).toBe("Lehrer");
  });

  it("wertet nach externem Entfernen eines Zitatöffners erneut aus", async () => {
    const paragraph = starten(
      "<p>„<b>Lehrer:innen</b>“ – Lehrer:innen.</p>",
      { processQuotedText: false }
    );
    expect(paragraph.querySelector("b")?.textContent).toBe("Lehrer:innen");
    paragraph.firstChild!.textContent = "";
    await mutationVerarbeiten();
    expect(paragraph.querySelector("b")?.textContent).toBe("Lehrer");
    expect(processor?.getReplacementCount()).toBe(2);
    processor?.restoreAll();
    expect(paragraph.querySelector("b")?.textContent).toBe("Lehrer:innen");
    expect(processor?.getReplacementCount()).toBe(0);
  });

  it("aktualisiert Mehrwortschutz nach DOM-Änderungen", async () => {
    const paragraph = starten(
      "<p><span>Lehrer:innen und </span><b>Expert:innen</b> – Lehrer:innen.</p>",
      { protectedTerms: ["Lehrer:innen und Expert:innen"] }
    );
    expect(paragraph.querySelector("b")?.textContent).toBe("Expert:innen");
    paragraph.querySelector("span")!.textContent = "Andere und ";
    await mutationVerarbeiten();
    expect(paragraph.querySelector("b")?.textContent).toBe("Experten");
    expect(processor?.getReplacementCount()).toBe(2);
  });

  it("schützt nicht über zwei Blockgrenzen hinweg", () => {
    document.body.innerHTML =
      "<div><p>„<span>Lehrer:innen</span></p><p><b>Expert:innen</b>“</p></div>";
    processor = new DomProcessor(document, {
      rules: defaultRules,
      profile: "aggressive",
      processAccessibleAttributes: false,
      processQuotedText: false
    });
    processor.start();
    expect(document.querySelector("span")?.textContent).toBe("Lehrer");
    expect(document.querySelector("b")?.textContent).toBe("Experten");
  });

  it("behält Text und Markup bei Stopp mit Restore bei", () => {
    const paragraph = starten(
      "<p>„<strong>Lehrer:innen</strong>“ und <em>Lehrer:innen</em></p>",
      { processQuotedText: false }
    );
    const before = '<p>„<strong>Lehrer:innen</strong>“ und <em>Lehrer:innen</em></p>';
    expect(processor?.getReplacementCount()).toBe(1);
    processor?.stop({ restore: true });
    processor = undefined;
    expect(paragraph.outerHTML).toBe(before);
  });
});
