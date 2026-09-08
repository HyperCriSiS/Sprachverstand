import json
import base64
import gzip
from pathlib import Path

PAYLOAD = "".join(
    (Path(__file__).parent / f"tmp-domain-toggle-payload-{index}.txt").read_text(encoding="ascii")
    for index in range(1, 5)
)



T = json.loads(gzip.decompress(base64.b64decode(PAYLOAD)).decode("utf-8"))

keys = [
    "whereCorrect", "popupDomainActionTitle", "popupDomainActionDescription",
    "removeCurrentWebsiteExclusion", "removeCurrentWebsiteInclusion",
    "currentWebsiteExcluded", "currentWebsiteExclusionRemoved",
    "currentWebsiteIncluded", "currentWebsiteInclusionRemoved"
]

root = Path.cwd()
locale_root = root / "static" / "_locales"
files = {p.parent.name: p for p in locale_root.glob("*/messages.json")}
if set(files) != set(T):
    raise SystemExit(f"Locale-Mismatch: missing={set(T)-set(files)}, extra={set(files)-set(T)}")

for code, values in T.items():
    if len(values) != len(keys):
        raise SystemExit(f"{code}: falsche Anzahl Übersetzungen")
    p = files[code]
    data = json.loads(p.read_text(encoding="utf-8"))
    data.pop("currentWebsiteAlreadyInDomainList", None)
    for key, value in zip(keys, values):
        data[key] = {"message": value}
    p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    p = root / path
    text = p.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Erwarteter Text fehlt in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


def replace_all(path: str, old: str, new: str) -> None:
    p = root / path
    text = p.read_text(encoding="utf-8")
    if old not in text:
        raise SystemExit(f"Erwarteter Text fehlt in {path}: {old[:120]!r}")
    p.write_text(text.replace(old, new), encoding="utf-8")


replace_once("src/popup.ts", 'import { isDomainListed } from "./settings/domain";', 'import { isDomainListed, toggleDomainListing } from "./settings/domain";')
replace_once("src/popup.ts", 'const domainActionButton =\n  requiredElement<HTMLButtonElement>("#add-current-domain");\n', 'const domainActionButton =\n  requiredElement<HTMLButtonElement>("#add-current-domain");\nconst domainActionStatus =\n  requiredElement<HTMLOutputElement>("#domain-action-status");\n')
replace_once("src/popup.ts", 'let runtimeStateRevision = 0;\n', 'let runtimeStateRevision = 0;\nlet domainActionStatusTimer: number | undefined;\n')
replace_once("src/popup.ts", '''function renderDomainAction(): void {
  const listed =
    currentHostname.length > 0 &&
    isDomainListed(currentHostname, settings.excludedDomains);

  domainActionButton.disabled = !currentHostname || listed;
  domainActionButton.textContent = listed
    ? t(
        "currentWebsiteAlreadyInDomainList",
        undefined,
        "Website bereits in der Domainliste"
      )
    : settings.domainListMode === "include"
      ? t("includeCurrentWebsite", undefined, "Diese Website einschließen")
      : t("excludeCurrentWebsite", undefined, "Diese Website ausschließen");
}
''', '''function renderDomainAction(): void {
  const listed =
    currentHostname.length > 0 &&
    isDomainListed(currentHostname, settings.excludedDomains);

  domainActionButton.disabled = !currentHostname;
  domainActionButton.textContent = listed
    ? settings.domainListMode === "include"
      ? t(
          "removeCurrentWebsiteInclusion",
          undefined,
          "Einschluss aufheben"
        )
      : t(
          "removeCurrentWebsiteExclusion",
          undefined,
          "Ausschluss aufheben"
        )
    : settings.domainListMode === "include"
      ? t("includeCurrentWebsite", undefined, "Diese Website einschließen")
      : t("excludeCurrentWebsite", undefined, "Diese Website ausschließen");
}

function showDomainActionStatus(key: string, fallback: string): void {
  if (domainActionStatusTimer !== undefined) {
    window.clearTimeout(domainActionStatusTimer);
  }

  domainActionStatus.textContent = t(key, undefined, fallback);
  domainActionStatusTimer = window.setTimeout(() => {
    domainActionStatus.textContent = "";
    domainActionStatusTimer = undefined;
  }, 1600);
}
''')
replace_once("src/popup.ts", '''  domainActionButton.addEventListener("click", () => {
    if (
      !currentHostname ||
      isDomainListed(currentHostname, settings.excludedDomains)
    ) {
      return;
    }

    settings = {
      ...settings,
      excludedDomains: [...settings.excludedDomains, currentHostname]
    };
    void saveSettings(settings);
    render();
  });
''', '''  domainActionButton.addEventListener("click", () => {
    if (!currentHostname) {
      return;
    }

    const listed = isDomainListed(currentHostname, settings.excludedDomains);
    const domainListMode = settings.domainListMode;

    settings = {
      ...settings,
      excludedDomains: toggleDomainListing(
        currentHostname,
        settings.excludedDomains
      )
    };
    void saveSettings(settings);
    render();

    if (listed) {
      if (domainListMode === "include") {
        showDomainActionStatus(
          "currentWebsiteInclusionRemoved",
          "Einschluss aufgehoben"
        );
      } else {
        showDomainActionStatus(
          "currentWebsiteExclusionRemoved",
          "Ausschluss aufgehoben"
        );
      }
    } else if (domainListMode === "include") {
      showDomainActionStatus(
        "currentWebsiteIncluded",
        "Website eingeschlossen"
      );
    } else {
      showDomainActionStatus(
        "currentWebsiteExcluded",
        "Website ausgeschlossen"
      );
    }
  });
''')
replace_once("src/settings/domain.ts", '''export function isDomainExcluded(
  hostname: string,
  patterns: readonly string[]
): boolean {
''', '''export function toggleDomainListing(
  hostname: string,
  patterns: readonly string[]
): string[] {
  const normalizedHostname = normalizeDomainPattern(hostname);

  if (!normalizedHostname) {
    return [...patterns];
  }

  if (isDomainListed(normalizedHostname, patterns)) {
    return patterns.filter(
      (pattern) => !isDomainListed(normalizedHostname, [pattern])
    );
  }

  return [...patterns, normalizedHostname];
}

export function isDomainExcluded(
  hostname: string,
  patterns: readonly string[]
): boolean {
''')
replace_once("static/popup/popup.html", '</div>\n<section class="rules-panel popup-section" data-popup-section="rule-groups">', '</div>\n<output aria-live="polite" class="domain-action-status popup-section" data-popup-section="domain-action" id="domain-action-status"></output>\n<section class="rules-panel popup-section" data-popup-section="rule-groups">')
replace_all("static/popup/popup.html", '<h2 data-i18n="whereCorrect">Wo soll korrigiert werden?</h2>', '<h2 data-i18n="whereCorrect">Wo sollen zusätzliche Korrekturen gelten?</h2>')

popup_css = root / "static" / "popup" / "popup.css"
css = popup_css.read_text(encoding="utf-8")
if ".domain-action-status {" in css:
    raise SystemExit("Domain-Status-CSS ist bereits vorhanden.")
css += """
.domain-action-status {
  display: block;
  margin: -4px 0 2px;
  min-height: 16px;
  text-align: right;
  font-size: 11px;
  opacity: 0.72;
}

.domain-action-status:empty {
  display: none;
}
"""
popup_css.write_text(css, encoding="utf-8")

replace_all("static/options/options.html", '<strong data-i18n="whereCorrect">Wo soll korrigiert werden?</strong>', '<strong data-i18n="whereCorrect">Wo sollen zusätzliche Korrekturen gelten?</strong>')
replace_all("static/options/options.html", '<h2 data-i18n="whereCorrect">Wo soll korrigiert werden?</h2>', '<h2 data-i18n="whereCorrect">Wo sollen zusätzliche Korrekturen gelten?</h2>')
replace_all("static/options/options.html", 'Aktuelle Website zur Domainliste hinzufügen', 'Aktuelle Website in der Domainliste umschalten')
replace_all("static/options/options.html", 'Zeigt im Popup eine Schaltfläche, um die aktuelle Website abhängig vom Arbeitsmodus zur Domainliste hinzuzufügen.', 'Zeigt im Popup eine Schaltfläche, um die aktuelle Website abhängig vom Arbeitsmodus zur Domainliste hinzuzufügen oder daraus zu entfernen.')
replace_once("tests/settings.test.ts", 'import { shouldProcessDomain } from "../src/settings/domain";', 'import { shouldProcessDomain, toggleDomainListing } from "../src/settings/domain";')
replace_once("tests/settings.test.ts", '  it("unterstützt Ausschluss- und Einschlussmodus mit Unterdomains", () => {\n', '''  it("schaltet die aktuelle Domain inklusive wirksamer Oberdomains um", () => {
    expect(toggleDomainListing("www.example.org", [])).toEqual([
      "www.example.org"
    ]);
    expect(toggleDomainListing("www.example.org", ["example.org"])).toEqual([]);
    expect(
      toggleDomainListing("www.example.org", [
        "example.org",
        "www.example.org",
        "other.example"
      ])
    ).toEqual(["other.example"]);
  });

  it("unterstützt Ausschluss- und Einschlussmodus mit Unterdomains", () => {
''')
replace_once("tests/popup-layout.test.ts", '''  it("bietet die aktuelle Website als separat ausblendbare Domain-Aktion an", () => {
    expect(popupHtml).toContain('id="add-current-domain"');
    expect(popupHtml).toContain('data-popup-section="domain-action"');
''', '''  it("bietet die aktuelle Website als separat ausblendbare Domain-Aktion an", () => {
    expect(popupHtml).toContain('id="add-current-domain"');
    expect(popupHtml).toContain('id="domain-action-status"');
    expect(popupHtml).toContain('aria-live="polite"');
    expect(popupHtml).toContain('data-popup-section="domain-action"');
''')
replace_all("tests/popup-layout.test.ts", "stellt die Optionen aus Wo soll korrigiert werden im Popup bereit", "stellt die Optionen für zusätzliche Korrekturen im Popup bereit")
replace_all("tests/popup-layout.test.ts", "zeigt bei Wo soll korrigiert werden keine Zeilentrenner", "zeigt bei zusätzlichen Korrekturen keine Zeilentrenner")
replace_all("tests/i18n.test.ts", "toHaveLength(165)", "toHaveLength(170)")
replace_all("scripts/validate-locales.mjs", "referenceKeys.length === 165", "referenceKeys.length === 170")
replace_all("scripts/validate-locales.mjs", "exakt 165 Nachrichten enthalten", "exakt 170 Nachrichten enthalten")

print("Domain-Toggle-Patch und 51 Locale-Aktualisierungen angewendet.")
