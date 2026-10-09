import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

function transformieren(html: string): string {
  document.body.innerHTML = html;
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false
  });
  processor.start();
  return document.querySelector("p")?.textContent ?? "";
}

describe("Audit DOM-01: Partizip mit Inline-Markup", () => {
  it.each([
    ["<p>Mitarbeitende <b>Eltern</b> helfen.</p>", "Mitarbeitende Eltern helfen."],
    ["<p><span>Mitarbeitende </span><b>Eltern</b> helfen.</p>", "Mitarbeitende Eltern helfen."],
    ["<p>Studierende <strong>Kinder</strong> spielen.</p>", "Studierende Kinder spielen."],
    ["<p>Lehrende <i>Personen</i> lernen.</p>", "Lehrende Personen lernen."],
    ["<p>Die <b>Mitarbeitende</b> wartet.</p>", "Die Mitarbeiterin wartet."],
    ["<p>Eine <b>Studierende</b> wartet.</p>", "Eine Studentin wartet."],
    ["<p>Eine <span><i>Lehrende</i></span> spricht.</p>", "Eine Lehrerin spricht."]
  ])("bewahrt Kontextsemantik über Elementgrenzen", (html, expected) => {
    expect(transformieren(html)).toBe(expected);
  });

  it("behält bei geschütztem rechten Nachbarn die isolierte Entscheidung", () => {
    expect(transformieren(
      '<p>Mitarbeitende <span aria-hidden="true">Eltern</span> helfen.</p>'
    )).toBe("Mitarbeiter Eltern helfen.");
  });

  it("transformiert weiterhin unzweideutige reguläre Vorkommen", () => {
    expect(transformieren("<p>Die Mitarbeitenden arbeiten.</p>"))
      .toBe("Die Mitarbeiter arbeiten.");
  });
  it("erkennt rechts ein über zwei Inline-Elemente verteiltes Substantiv", () => {
    expect(transformieren("<p>Mitarbeitende <em>E</em><strong>ltern</strong> helfen.</p>"))
      .toBe("Mitarbeitende Eltern helfen.");
  });

  it("bewertet ein Partizip nach Einfügen und Entfernen eines rechten Nomens neu", async () => {
    document.body.innerHTML = "<p>Mitarbeitende </p>";
    const paragraph = document.querySelector("p")!;
    processor = new DomProcessor(document, {
      rules: defaultRules, profile: "aggressive", processAccessibleAttributes: false
    });
    processor.start();
    expect(paragraph.textContent).toBe("Mitarbeiter ");
    expect(processor.getReplacementCount()).toBe(1);

    const noun = document.createElement("strong");
    noun.textContent = "Eltern";
    paragraph.append(noun);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Mitarbeitende Eltern");
    expect(processor.getReplacementCount()).toBe(0);

    noun.remove();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Mitarbeiter ");
    expect(processor.getReplacementCount()).toBe(1);
  });

  it("reagiert auf Text- und Schutzstatuswechsel beim rechten Inline-Nomen", async () => {
    document.body.innerHTML = "<p>Mitarbeitende <strong>Eltern</strong></p>";
    const paragraph = document.querySelector("p")!;
    const noun = paragraph.querySelector("strong")!;
    processor = new DomProcessor(document, {
      rules: defaultRules, profile: "aggressive", processAccessibleAttributes: false
    });
    processor.start();
    expect(paragraph.textContent).toBe("Mitarbeitende Eltern");

    noun.firstChild!.textContent = "helfen";
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Mitarbeiter helfen");

    noun.firstChild!.textContent = "Eltern";
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Mitarbeitende Eltern");

    noun.setAttribute("aria-hidden", "true");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Mitarbeiter Eltern");

    noun.removeAttribute("aria-hidden");
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Mitarbeitende Eltern");
  });

  it("überschreitet bei rechter DOM-Änderung keine Blockgrenze", async () => {
    document.body.innerHTML = "<p>Mitarbeitende </p><p>Eltern</p>";
    const first = document.querySelector("p")!;
    processor = new DomProcessor(document, {
      rules: defaultRules, profile: "aggressive", processAccessibleAttributes: false
    });
    processor.start();
    expect(first.textContent).toBe("Mitarbeiter ");
    document.querySelectorAll("p")[1]!.textContent = "Lehrende Eltern";
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(first.textContent).toBe("Mitarbeiter ");
  });


  it.each([
    ["<p>Mitarbeitende<strong>n</strong> arbeiten.</p>", "Mitarbeitenden arbeiten."],
    ["<p><em>Mitarbeitende</em>n arbeiten.</p>", "Mitarbeitenden arbeiten."],
    ["<p><span>Un</span><strong>Mitarbeitende</strong> arbeiten.</p>", "UnMitarbeitende arbeiten."],
    ["<p><em>U</em><strong>Mitarbeitende</strong> arbeiten.</p>", "UMitarbeitende arbeiten."],
    ["<p>Mitarbeitende <em>Eltern</em> warten.</p>", "Mitarbeitende Eltern warten."],
    ["<p>Mitarbeitende. <em>Eltern</em> warten.</p>", "Mitarbeiter. Eltern warten."]
  ])("verhindert Teilwortkorrekturen an Inline-Grenzen", (html, expected) => {
    expect(transformieren(html)).toBe(expected);
  });

  it("bewertet eine angehängte Endung und deren Entfernen erneut", async () => {
    document.body.innerHTML = "<p>Mitarbeitende</p>";
    const paragraph = document.querySelector("p")!;
    processor = new DomProcessor(document, {
      rules: defaultRules, profile: "aggressive", processAccessibleAttributes: false
    });
    processor.start();
    expect(paragraph.textContent).toBe("Mitarbeiter");

    const suffix = document.createElement("em");
    suffix.textContent = "n";
    paragraph.append(suffix);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Mitarbeitenden");
    expect(processor.getReplacementCount()).toBe(0);

    suffix.remove();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Mitarbeiter");
    expect(processor.getReplacementCount()).toBe(1);
  });

  it("bewertet einen neu vorangestellten Wortteil erneut", async () => {
    document.body.innerHTML = "<p><strong>Mitarbeitende</strong></p>";
    const paragraph = document.querySelector("p")!;
    processor = new DomProcessor(document, {
      rules: defaultRules, profile: "aggressive", processAccessibleAttributes: false
    });
    processor.start();
    expect(paragraph.textContent).toBe("Mitarbeiter");

    const prefix = document.createElement("em");
    prefix.textContent = "Un";
    paragraph.prepend(prefix);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("UnMitarbeitende");
    expect(processor.getReplacementCount()).toBe(0);

    prefix.remove();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Mitarbeiter");
    expect(processor.getReplacementCount()).toBe(1);
  });

  it.each([
    ["<p>Die<em> </em><strong>Mitarbeitende</strong> wartet.</p>", "Die Mitarbeiterin wartet."],
    ["<p>Eine<i> </i><strong>Studierende</strong> wartet.</p>", "Eine Studentin wartet."],
    ["<p>Die<span>\u00a0</span><strong>Mitarbeitende</strong> wartet.</p>", "Die\u00a0Mitarbeiterin wartet."]
  ])("berücksichtigt reine Leerraumknoten als Inline-Wortgrenze", (html, expected) => {
    expect(transformieren(html)).toBe(expected);
  });

  it("bewertet eine dynamisch eingefügte Wortgrenze auf beiden Seiten neu", async () => {
    document.body.innerHTML = "<p>Die<strong>Mitarbeitende</strong> wartet.</p>";
    const paragraph = document.querySelector("p")!;
    const participle = paragraph.querySelector("strong")!;
    processor = new DomProcessor(document, {
      rules: defaultRules, profile: "aggressive", processAccessibleAttributes: false
    });
    processor.start();
    expect(paragraph.textContent).toBe("DieMitarbeitende wartet.");

    const space = document.createElement("em");
    space.textContent = " ";
    paragraph.insertBefore(space, participle);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("Die Mitarbeiterin wartet.");

    space.remove();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    processor.flush();
    expect(paragraph.textContent).toBe("DieMitarbeitende wartet.");
  });

});