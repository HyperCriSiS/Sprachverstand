import { afterEach, describe, expect, it } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import type { Rule } from "../src/core/rule";

let processor: DomProcessor | undefined;

const rule: Rule = {
  id: "test.framework-resilience",
  risk: "safe",
  apply(input) {
    const text = input.replaceAll("Nutzer:innen", "Nutzer");
    return {
      text,
      replacements: text === input ? 0 : 1
    };
  }
};

function queueNode(target: DomProcessor, node: Node): void {
  (
    target as unknown as { queue(node: Node): void }
  ).queue(node);
}

afterEach(() => {
  processor?.stop();
  processor = undefined;
  document.body.replaceChildren();
});

describe("DomProcessor Framework-Resilienz", () => {
  it("fasst überlappende Mutations-Roots vor der Verarbeitung zusammen", () => {
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      processAccessibleAttributes: false
    });

    let rootCalls = 0;
    const originalProcessRoot = processor.processRoot.bind(processor);
    processor.processRoot = (root) => {
      rootCalls += 1;
      originalProcessRoot(root);
    };
    processor.start();
    rootCalls = 0;

    const section = document.createElement("section");
    for (let index = 0; index < 200; index += 1) {
      const span = document.createElement("span");
      span.textContent = `Nutzer:innen ${index}`;
      section.append(span);
    }
    document.body.append(section);

    queueNode(processor, section);
    for (const span of section.querySelectorAll("span")) {
      queueNode(processor, span);
      if (span.firstChild) {
        queueNode(processor, span.firstChild);
      }
    }

    processor.flush();

    expect(rootCalls).toBe(1);
    expect(processor.getReplacementCount()).toBe(200);
    expect(section.textContent).not.toContain("Nutzer:innen");
  });

  it("teilt große dynamische Teilbäume auf mehrere Tasks auf", async () => {
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      processAccessibleAttributes: false
    });
    processor.start();

    const section = document.createElement("section");
    for (let index = 0; index < 4_000; index += 1) {
      const paragraph = document.createElement("p");
      paragraph.textContent = `Nutzer:innen ${index}`;
      section.append(paragraph);
    }
    document.body.append(section);
    queueNode(processor, section);

    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const afterFirstTask = processor.getReplacementCount();
    expect(afterFirstTask).toBeGreaterThan(0);
    expect(afterFirstTask).toBeLessThan(4_000);

    processor.flush();
    expect(processor.getReplacementCount()).toBe(4_000);
    expect(section.textContent).not.toContain("Nutzer:innen");
  });

  it("bricht eine laufende Traversierung ab, wenn der Teilbaum entfernt wird", async () => {
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      processAccessibleAttributes: false
    });
    processor.start();

    const section = document.createElement("section");
    for (let index = 0; index < 4_000; index += 1) {
      const paragraph = document.createElement("p");
      paragraph.textContent = `Nutzer:innen ${index}`;
      section.append(paragraph);
    }
    document.body.append(section);
    queueNode(processor, section);

    await new Promise((resolve) => window.setTimeout(resolve, 0));

    const beforeRemoval = processor.getReplacementCount();
    expect(beforeRemoval).toBeGreaterThan(0);
    expect(beforeRemoval).toBeLessThan(4_000);

    section.remove();
    await new Promise((resolve) => window.setTimeout(resolve, 20));
    processor.flush();

    expect(processor.getReplacementCount()).toBe(0);
  });

  it("verarbeitet keine ausstehenden Attribute entfernter Elemente", async () => {
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    const element = document.createElement("button");
    document.body.append(element);
    element.setAttribute("aria-label", "Nutzer:innen öffnen");
    element.remove();

    await new Promise((resolve) => window.setTimeout(resolve, 20));
    processor.flush();

    expect(processor.getReplacementCount()).toBe(0);
    expect(element.getAttribute("aria-label")).toBe("Nutzer:innen öffnen");
  });

  it("unterdrückt eigene MutationObserver-Rückläufer", async () => {
    let ruleCalls = 0;
    const countingRule: Rule = {
      id: "test.self-mutation-filter",
      risk: "safe",
      apply(input) {
        ruleCalls += 1;
        const text = input.replaceAll("Nutzer:innen", "Nutzer");
        return {
          text,
          replacements: text === input ? 0 : 1
        };
      }
    };

    document.body.innerHTML = "<p>Nutzer:innen</p>";
    processor = new DomProcessor(document, {
      rules: [countingRule],
      profile: "conservative",
      processAccessibleAttributes: false
    });
    processor.start();

    await new Promise((resolve) => window.setTimeout(resolve, 10));

    expect(document.querySelector("p")?.textContent).toBe("Nutzer");
    expect(ruleCalls).toBe(1);
  });

  it("setzt bei wiederholten Framework-Rewrites einen kurzen Backoff", async () => {
    document.body.innerHTML = "<p>Nutzer:innen</p>";
    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative",
      processAccessibleAttributes: false
    });
    processor.start();

    const textNode = document.querySelector("p")?.firstChild as Text;
    const internals = processor as unknown as {
      noteExternalTextRewrite(node: Text): void;
      getBackoffRemaining(node: Node): number;
    };

    for (let index = 0; index < 5; index += 1) {
      internals.noteExternalTextRewrite(textNode);
    }
    expect(internals.getBackoffRemaining(textNode)).toBeGreaterThan(0);

    textNode.data = "Nutzer:innen";
    queueNode(processor, textNode);
    await new Promise((resolve) => window.setTimeout(resolve, 0));

    expect(textNode.data).toBe("Nutzer:innen");

    processor.flush();
    expect(textNode.data).toBe("Nutzer");
  });

  it("verarbeitet vorhandene und dynamisch eingefügte offene Shadow Roots", async () => {
    const initialHost = document.createElement("div");
    const initialShadow = initialHost.attachShadow({ mode: "open" });
    initialShadow.innerHTML = "<p>Nutzer:innen im Shadow DOM</p>";
    document.body.append(initialHost);

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    expect(initialShadow.textContent).toContain("Nutzer im Shadow DOM");

    const dynamicHost = document.createElement("section");
    const dynamicShadow = dynamicHost.attachShadow({ mode: "open" });
    dynamicShadow.innerHTML = "<p>Nutzer:innen dynamisch</p>";
    document.body.append(dynamicHost);

    await new Promise((resolve) => window.setTimeout(resolve, 20));
    processor.flush();

    expect(dynamicShadow.textContent).toContain("Nutzer dynamisch");

    const paragraph = dynamicShadow.querySelector("p") as HTMLParagraphElement;
    paragraph.textContent = "Neue Nutzer:innen";
    await new Promise((resolve) => window.setTimeout(resolve, 20));
    processor.flush();

    expect(paragraph.textContent).toBe("Neue Nutzer");
  });

  it("greift nicht in geschlossene Shadow Roots ein", () => {
    const host = document.createElement("div");
    const shadow = host.attachShadow({ mode: "closed" });
    shadow.innerHTML = "<p>Nutzer:innen geschützt</p>";
    document.body.append(host);

    processor = new DomProcessor(document, {
      rules: [rule],
      profile: "conservative"
    });
    processor.start();

    expect(shadow.textContent).toContain("Nutzer:innen geschützt");
  });
});
