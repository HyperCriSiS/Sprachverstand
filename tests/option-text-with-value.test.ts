import {afterEach, describe, expect, it} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {defaultRules} from "../src/rules";

let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: false}); processor = undefined; document.body.replaceChildren();
});

function start(): void {
  processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive"});
  processor.start(); processor.flush();
}

// Optionen mit eigenem `value` senden ihren Wert, nicht ihren Text: nur die
// Beschriftung wird umgewandelt. Ohne `value` ist der Text der gesendete
// Wert und bleibt geschützt (Realseitentest 22.10.2026).
describe("Optionstext", () => {
  it("wandelt die Beschriftung einer Option mit value um, der Wert bleibt", () => {
    document.body.innerHTML = '<select><option value="a">Alle Lehrer*innen</option>' +
      '<option value="b" selected>Unsere Kolleg:innen</option></select>';
    start();
    const select = document.querySelector("select")!;
    expect([...select.options].map((option) => option.textContent)).toEqual(["Alle Lehrer", "Unsere Kollegen"]);
    expect(select.value).toBe("b");
  });

  it("lässt Optionen ohne value unverändert, weil ihr Text gesendet wird", () => {
    document.body.innerHTML = '<form><select name="gruppe"><option>Alle Lehrer*innen</option></select></form>';
    start();
    const form = document.querySelector("form")!;
    expect(document.querySelector("option")!.textContent).toBe("Alle Lehrer*innen");
    expect(new FormData(form).get("gruppe")).toBe("Alle Lehrer*innen");
  });

  it("stellt den Originaltext wieder her, wenn value nachträglich entfernt wird", async () => {
    document.body.innerHTML = '<select><option value="a">Alle Lehrer*innen</option></select>';
    start();
    const option = document.querySelector("option")!;
    expect(option.textContent).toBe("Alle Lehrer");
    option.removeAttribute("value");
    await new Promise((resolve) => setTimeout(resolve, 0));
    processor!.flush();
    expect(option.textContent).toBe("Alle Lehrer*innen");
  });

  it("verarbeitet keine value-Änderungen an Eingabefeldern", async () => {
    document.body.innerHTML = '<p>Alle Lehrer*innen</p><input value="Lehrer*innen">';
    start();
    const input = document.querySelector("input")!;
    input.setAttribute("value", "Kolleg:innen");
    await new Promise((resolve) => setTimeout(resolve, 0));
    processor!.flush();
    expect(input.getAttribute("value")).toBe("Kolleg:innen");
    expect(document.querySelector("p")!.textContent).toBe("Alle Lehrer");
  });
});
