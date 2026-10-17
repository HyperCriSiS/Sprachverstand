import {afterEach, expect, it, vi} from "vitest";
import {DomProcessor} from "../src/core/dom-processor";
import {defaultRules} from "../src/rules";

let processor: DomProcessor | undefined;
afterEach(() => {
  processor?.stop({restore: true}); processor = undefined;
  vi.restoreAllMocks(); document.body.replaceChildren();
});
function fixture(boundary?: string) {
  const root = document.createElement("p");
  const lead = document.createElement("span"); lead.textContent = "mit "; root.append(lead);
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < 1000; index++) fragment.append(document.createElement("span"));
  if (boundary) fragment.append(document.createElement(boundary));
  root.append(fragment);
  const target = document.createTextNode("Neutraler Text"); root.append(target); document.body.append(root);
  processor = new DomProcessor(document, {rules: defaultRules, profile: "aggressive"});
  processor.start(); processor.flush();
  return {lead, target};
}

it("keeps dative context across empty inline neighbors without allocating a walker for every leaf", async () => {
  const {target} = fixture();
  const walkers = vi.spyOn(document, "createTreeWalker");
  target.data = "Nutzer:innen"; await Promise.resolve(); processor!.flush();
  expect(target.data).toBe("Nutzern");
  expect(walkers.mock.calls.length).toBeLessThan(20);
  processor!.stop({restore: true}); expect(target.data).toBe("Nutzer:innen");
});

it("reevaluates a changed preceding context through empty neighbors without per-leaf walkers", async () => {
  const {lead, target} = fixture();
  target.data = "Nutzer:innen"; await Promise.resolve(); processor!.flush();
  expect(target.data).toBe("Nutzern");
  const walkers = vi.spyOn(document, "createTreeWalker");
  lead.firstChild!.textContent = "für "; await Promise.resolve(); processor!.flush();
  expect(target.data).toBe("Nutzer");
  expect(walkers.mock.calls.length).toBeLessThan(20);
  processor!.stop({restore: true}); expect(target.data).toBe("Nutzer:innen");
});

it.each(["div", "section", "blockquote"])("preserves an empty %s as a grammar boundary", async boundary => {
  const {target} = fixture(boundary);
  target.data = "Nutzer:innen"; await Promise.resolve(); processor!.flush();
  expect(target.data).toBe("Nutzer");
});

it("retains the protection of a nonempty code neighbor", async () => {
  const {lead, target} = fixture();
  const code = document.createElement("code"); code.textContent = "mit "; lead.replaceWith(code);
  target.data = "Nutzer:innen"; await Promise.resolve(); processor!.flush();
  expect(target.data).toBe("Nutzer"); expect(code.textContent).toBe("mit ");
});
