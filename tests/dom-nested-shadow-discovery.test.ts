import { afterEach, describe, expect, it, vi } from "vitest";
import { DomProcessor } from "../src/core/dom-processor";
import { createRegexRule } from "../src/core/rule";
let processor: DomProcessor | undefined;
const rule = createRegexRule({ id: "test.nested-shadow-discovery", risk: "safe", pattern: /Nutzer:innen/gu, replace: () => "Nutzer" });
function start() {
  processor = new DomProcessor(document, { rules: [rule], profile: "conservative", processAccessibleAttributes: false });
  processor.start();
  processor.flush();
  return processor;
}
async function settle() {
  await Promise.resolve();
  processor?.flush();
  await Promise.resolve();
}
afterEach(() => {
  processor?.stop({ restore: true });
  processor = undefined;
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.useRealTimers();
});
describe("Budgetierte Suche nach späten verschachtelten ShadowRoots", () => {
  it("findet eine neue innere Root ohne Mutation im bereits beobachteten äußeren Baum", async () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    document.body.append(host);
    const outer = host.attachShadow({ mode: "open" }), innerHost = document.createElement("section");
    outer.append(innerHost);
    const dom = start();
    await settle();
    const inner = innerHost.attachShadow({ mode: "open" });
    inner.innerHTML = "<p>Neue Nutzer:innen</p><code>Nutzer:innen</code>";
    await settle();
    expect(inner.querySelector("p")?.textContent).toBe("Neue Nutzer:innen");
    await vi.advanceTimersByTimeAsync(1700);
    await settle();
    expect(inner.querySelector("p")?.textContent).toBe("Neue Nutzer");
    expect(inner.querySelector("code")?.textContent).toBe("Nutzer:innen");
    expect(dom.getReplacementCount()).toBe(1);
    inner.querySelector("p")!.textContent = "Weitere Nutzer:innen";
    await settle();
    expect(inner.querySelector("p")?.textContent).toBe("Weitere Nutzer");
    dom.stop({ restore: true });
    processor = undefined;
    expect(inner.querySelector("p")?.textContent).toBe("Weitere Nutzer:innen");
  });
  it("behält Schutzgrenzen und den Stop auch bei mehreren Ebenen bei", async () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    document.body.append(host);
    const outer = host.attachShadow({ mode: "open" }), middleHost = document.createElement("div");
    outer.append(middleHost);
    const middle = middleHost.attachShadow({ mode: "open" }), editor = document.createElement("section");
    editor.setAttribute("contenteditable", "true");
    middle.append(editor);
    const dom = start();
    const protectedRoot = editor.attachShadow({ mode: "open" });
    protectedRoot.textContent = "Nutzer:innen";
    await vi.advanceTimersByTimeAsync(1800);
    await settle();
    expect(protectedRoot.textContent).toBe("Nutzer:innen");
    expect(dom.getReplacementCount()).toBe(0);
    dom.stop({ restore: true });
    processor = undefined;
    const afterStop = document.createElement("div");
    middle.append(afterStop);
    afterStop.attachShadow({ mode: "open" }).textContent = "Nutzer:innen";
    await vi.advanceTimersByTimeAsync(1800);
    expect(afterStop.shadowRoot?.textContent).toBe("Nutzer:innen");
  });
  it("verteilt auch die Suche innerhalb einer bekannten großen Root auf begrenzte Scheiben", async () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    document.body.append(host);
    const outer = host.attachShadow({ mode: "open" });
    for (let i = 0; i < 1200; i++) outer.append(document.createElement("span"));
    const dom = start();
    await settle();
    vi.spyOn(dom as unknown as {now: () => number}, "now").mockReturnValue(100);
    const getter = vi.spyOn(Element.prototype, "shadowRoot", "get");
    await vi.advanceTimersByTimeAsync(1500);
    const first = getter.mock.calls.length;
    expect(first).toBeGreaterThan(100);
    expect(first).toBeLessThanOrEqual(256);
    await vi.advanceTimersByTimeAsync(64);
    expect(getter.mock.calls.length - first).toBeGreaterThan(100);
    expect(getter.mock.calls.length - first).toBeLessThanOrEqual(256);
    host.remove();
    await settle();
    const replacement = document.createElement("div");
    document.body.append(replacement);
    replacement.attachShadow({ mode: "open" }).textContent = "Nutzer:innen";
    await vi.advanceTimersByTimeAsync(1800);
    await settle();
    expect(replacement.shadowRoot?.textContent).toBe("Nutzer");
  });
  it("begrenzt auch das Zurückkehren aus einer tiefen Hierarchie bei grober Uhr", async () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    document.body.append(host);
    let parent = host.attachShadow({ mode: "open" });
    for (let depth = 0; depth < 160; depth++) {
      const nested = document.createElement("div");
      parent.appendChild(nested);
      parent = nested.attachShadow({ mode: "open" });
    }
    const dom = start();
    await settle();
    vi.spyOn(dom as unknown as {now: () => number}, "now").mockReturnValue(100);
    const next = vi.spyOn(TreeWalker.prototype, "nextNode");
    await vi.advanceTimersByTimeAsync(1500);
    expect(next).toHaveBeenCalledTimes(256);
    await vi.advanceTimersByTimeAsync(64);
    expect(next.mock.calls.length).toBeGreaterThan(256);
    expect(next.mock.calls.length).toBeLessThanOrEqual(512);
    dom.stop({ restore: true });
    processor = undefined;
    const stopped = next.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1800);
    expect(next).toHaveBeenCalledTimes(stopped);
  });
  it.each([false, true])("beachtet die Untertiteloption auch in einer späten inneren Root (%s)", async (processSubtitles) => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    host.className = "ytp-caption-window-container";
    document.body.append(host);
    const outer = host.attachShadow({ mode: "open" });
    const innerHost = document.createElement("section");
    outer.append(innerHost);
    processor = new DomProcessor(document, {
      rules: [rule], profile: "conservative", processSubtitles,
      processAccessibleAttributes: false
    });
    processor.start();
    await settle();
    const inner = innerHost.attachShadow({ mode: "open" });
    inner.textContent = "Nutzer:innen";
    await vi.advanceTimersByTimeAsync(1_800);
    await settle();
    expect(inner.textContent).toBe(processSubtitles ? "Nutzer" : "Nutzer:innen");
    processor.stop({ restore: true });
    processor = undefined;
    expect(inner.textContent).toBe("Nutzer:innen");
  });
});
