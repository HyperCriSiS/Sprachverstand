import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { defaultRules } from "../src/rules";

let processor: DomProcessor | undefined;

function starten(processSubtitles = false): void {
  processor = new DomProcessor(document, {
    rules: defaultRules,
    profile: "aggressive",
    processAccessibleAttributes: false,
    processSubtitles
  });
  processor.start();
}

async function aktualisieren(): Promise<void> {
  await Promise.resolve();
  processor?.flush();
  await Promise.resolve();
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

describe("Audit DOM-11: Untertitelkontext und dynamische Klassifikation", () => {
  it("überspringt Untertitel auch nach 16 verschachtelten Inline-Elementen", async () => {
    const spans = "<span>".repeat(16);
    const ends = "</span>".repeat(16);
    document.body.innerHTML =
      '<div class="ytp-caption-window">' + spans + "Neue Nutzer:innen" + ends + "</div>";
    const container = document.querySelector("div")!;
    let deepest = container.querySelector("span")!;
    while (deepest.querySelector("span")) {
      deepest = deepest.querySelector("span")!;
    }
    const node = deepest.firstChild as Text;
    starten();
    expect(node.data).toBe("Neue Nutzer:innen");
    node.data = "Weitere Nutzer:innen";
    await aktualisieren();
    expect(node.data).toBe("Weitere Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(0);
  });

  it("korrigiert tief verschachtelte Captions bei aktivierter Option", () => {
    document.body.innerHTML =
      '<div class="ytp-caption-window">' +
      "<span>".repeat(15) + "Neue Nutzer:innen" + "</span>".repeat(15) +
      "</div>";
    starten(true);
    expect(document.querySelector("div")?.textContent).toBe("Neue Nutzer");
  });

  it("berücksichtigt Captionhosts bei einem offenen ShadowRoot", () => {
    const host = document.createElement("div");
    host.className = "ytp-caption-window";
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    root.append(document.createTextNode("Neue Nutzer:innen"));
    starten();
    expect(root.textContent).toBe("Neue Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(0);
  });

  it("verarbeitet normale ShadowRoots unverändert weiter", () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    root.append(document.createTextNode("Neue Nutzer:innen"));
    starten();
    expect(root.textContent).toBe("Neue Nutzer");
  });

  it("verarbeitet wiederverwendete Elemente nach Entfernen der Captionklasse", async () => {
    document.body.innerHTML =
      '<p><span class="ytp-caption-segment">Neue Nutzer:innen</span></p>';
    const span = document.querySelector("span")!;
    starten();
    expect(span.textContent).toBe("Neue Nutzer:innen");
    span.className = "article";
    await aktualisieren();
    expect(span.textContent).toBe("Neue Nutzer");
    expect(processor?.getReplacementCount()).toBe(1);
  });

  it("restauriert bereits veränderten Text bei neuer Captionklasse", async () => {
    document.body.innerHTML =
      '<p><span class="article">Neue Nutzer:innen</span></p>';
    const span = document.querySelector("span")!;
    starten();
    expect(span.textContent).toBe("Neue Nutzer");
    span.className = "ytp-caption-segment";
    await aktualisieren();
    expect(span.textContent).toBe("Neue Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(0);
  });

  it("wertet den Wechsel von data-purpose erneut aus", async () => {
    document.body.innerHTML =
      '<p><span data-purpose="captions-overlay">Neue Nutzer:innen</span></p>';
    const span = document.querySelector("span")!;
    starten();
    expect(span.textContent).toBe("Neue Nutzer:innen");
    span.removeAttribute("data-purpose");
    await aktualisieren();
    expect(span.textContent).toBe("Neue Nutzer");
  });

  it("restauriert beim Untertitelwechsel auch ShadowRoot-Text", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const root = host.attachShadow({ mode: "open" });
    root.append(document.createTextNode("Neue Nutzer:innen"));
    starten();
    expect(root.textContent).toBe("Neue Nutzer");
    host.className = "ytp-caption-window";
    await aktualisieren();
    expect(root.textContent).toBe("Neue Nutzer:innen");
    expect(processor?.getReplacementCount()).toBe(0);
  });
});
