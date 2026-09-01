import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

async function readStaticPage(name: "popup" | "options"): Promise<string> {
  return readFile(`static/${name}/${name}.html`, "utf8");
}

function hasTagWithAttributes(
  html: string,
  tagName: string,
  attributes: Record<string, string>
): boolean {
  const tags = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gu")) ?? [];
  return tags.some((tag) =>
    Object.entries(attributes).every(([name, value]) =>
      tag.includes(`${name}="${value}"`)
    )
  );
}

describe("accessibility preflight", () => {
  it("keeps a single primary heading and a declared document language", async () => {
    for (const page of ["popup", "options"] as const) {
      const html = await readStaticPage(page);
      expect(html).toMatch(/<html\s+lang="de">/);
      expect((html.match(/<h1\b/g) ?? []).length).toBe(1);
      expect(hasTagWithAttributes(html, "meta", { name: "viewport" })).toBe(true);
    }
  });

  it("provides polite live regions for changing status information", async () => {
    const [popup, options] = await Promise.all([
      readStaticPage("popup"),
      readStaticPage("options")
    ]);

    expect(popup).toContain('aria-live="polite"');
    expect(
      hasTagWithAttributes(options, "output", {
        id: "status",
        form: "settings-form",
        "aria-live": "polite"
      })
    ).toBe(true);
    expect(
      hasTagWithAttributes(options, "div", {
        id: "custom-replacement-feedback",
        class: "diagnostics",
        "aria-live": "polite"
      })
    ).toBe(true);
    expect(
      hasTagWithAttributes(options, "div", {
        id: "import-summary",
        "aria-live": "polite"
      })
    ).toBe(true);
  });

  it("keeps static checkbox controls inside labels", async () => {
    for (const page of ["popup", "options"] as const) {
      const html = await readStaticPage(page);
      const checkboxCount = (html.match(/<input[^>]+type="checkbox"[^>]*>/g) ?? []).length;
      const labeledCheckboxCount = (
        html.match(/<label\b[^>]*>[\s\S]*?<input[^>]+type="checkbox"[^>]*>[\s\S]*?<\/label>/g) ?? []
      ).length;

      expect(checkboxCount, `${page}: expected checkbox controls`).toBeGreaterThan(0);
      expect(labeledCheckboxCount, `${page}: every static checkbox should have a label`).toBe(checkboxCount);
    }
  });

  it("keeps text-entry controls associated with labels", async () => {
    const options = await readStaticPage("options");
    for (const id of [
      "protected-terms",
      "custom-replacements",
      "custom-preview-input",
      "custom-preview-output",
      "excluded-domains",
      "personal-rules-import-mode"
    ]) {
      const controlPattern = new RegExp(`<(?:textarea|select)[^>]+id="${id}"[\\s\\S]*?<\\/(?:textarea|select)>`);
      expect(options, `missing control: ${id}`).toMatch(controlPattern);
      const labelPattern = new RegExp(`<label\\b[^>]*>[\\s\\S]*?id="${id}"[\\s\\S]*?<\\/label>`);
      expect(options, `control is not wrapped by a label: ${id}`).toMatch(labelPattern);
    }
  });

  it("keeps dynamically generated popup rule checkboxes labeled", async () => {
    const popupSource = await readFile("src/popup.ts", "utf8");
    expect(popupSource).toContain('document.createElement("label")');
    expect(popupSource).toContain('document.createElement("input")');
    expect(popupSource).toContain('input.type = "checkbox"');
    expect(popupSource).toContain("label.append(input, content)");
  });

  it("keeps decorative brand icons out of the accessibility tree", async () => {
    for (const page of ["popup", "options"] as const) {
      const html = await readStaticPage(page);
      expect(html).toMatch(/<img[^>]+alt=""[^>]*>/);
    }
  });
});
