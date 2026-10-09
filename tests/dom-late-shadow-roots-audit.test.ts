import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

const regel: Rule = {
  id: "test.audit-dom10",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    const replacements = (input.match(/Nutzer:innen/gu) ?? []).length;
    return { text, replacements };
  }
};

let processor: DomProcessor | undefined;

function starten(): DomProcessor {
  processor = new DomProcessor(document, {
    rules: [regel],
    profile: "conservative",
    processAccessibleAttributes: false
  });
  processor.start();
  return processor;
}

async function abwarten(
  bedingung: () => boolean,
  maximalMs = 5_000
): Promise<void> {
  const ende = Date.now() + maximalMs;
  while (Date.now() < ende) {
    await new Promise<void>((resolve) => setTimeout(resolve, 35));
    processor?.flush();
    if (bedingung()) {
      return;
    }
  }
  throw new Error("Späte ShadowRoot wurde nicht innerhalb der Frist verarbeitet.");
}

afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
});

describe("Audit DOM-10: nachträglich angehängte offene ShadowRoots", () => {
  it("entdeckt eine offene Root auf einem bereits vorhandenen normalen Host", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const dom = starten();

    const root = host.attachShadow({ mode: "open" });
    root.append(document.createTextNode("Neue Nutzer:innen"));
    expect(root.textContent).toBe("Neue Nutzer:innen");

    await abwarten(() => root.textContent === "Neue Nutzer");
    expect(dom.getReplacementCount()).toBe(1);
    dom.restoreAll();
    expect(root.textContent).toBe("Neue Nutzer:innen");
    expect(dom.getReplacementCount()).toBe(0);
  });

  it("entdeckt die Root nach einem verspäteten Custom-Element-Upgrade", async () => {
    const name = "sv-dom10-test-host";
    const host = document.createElement(name);
    document.body.append(host);
    starten();
    const root = host.attachShadow({ mode: "open" });
    root.textContent = "Nutzer:innen";
    await abwarten(() => root.textContent === "Nutzer");
    expect(root.textContent).toBe("Nutzer");
  });

  it("beobachtet weitere Änderungen nach der Discovery", async () => {
    const host = document.createElement("section");
    document.body.append(host);
    starten();
    const root = host.attachShadow({ mode: "open" });
    const node = document.createTextNode("Nutzer:innen");
    root.append(node);
    await abwarten(() => node.data === "Nutzer");
    node.data = "Weitere Nutzer:innen";
    await abwarten(() => node.data === "Weitere Nutzer");
    expect(processor?.getReplacementCount()).toBe(1);
  });

  it("überspringt ShadowRoots innerhalb geschützter Editoren", async () => {
    const host = document.createElement("div");
    host.setAttribute("contenteditable", "true");
    document.body.append(host);
    const dom = starten();
    const root = host.attachShadow({ mode: "open" });
    root.textContent = "Nutzer:innen";
    await new Promise<void>((resolve) => setTimeout(resolve, 1_750));
    dom.flush();
    expect(root.textContent).toBe("Nutzer:innen");
    expect(dom.getReplacementCount()).toBe(0);
  });

  it("ändert geschlossene ShadowRoots nicht und reagiert nach Stop nicht mehr", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const dom = starten();
    const closed = host.attachShadow({ mode: "closed" });
    closed.textContent = "Nutzer:innen";
    await new Promise<void>((resolve) => setTimeout(resolve, 1_750));
    dom.flush();
    expect(closed.textContent).toBe("Nutzer:innen");

    dom.stop({ restore: true });
    processor = undefined;
    const newHost = document.createElement("div");
    document.body.append(newHost);
    const nextRoot = newHost.attachShadow({ mode: "open" });
    nextRoot.textContent = "Nutzer:innen";
    await new Promise<void>((resolve) => setTimeout(resolve, 150));
    expect(nextRoot.textContent).toBe("Nutzer:innen");
  });
});
