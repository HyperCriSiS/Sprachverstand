from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEXICON = ROOT / "src/rules/person-lexicon.ts"
TEST = ROOT / "tests/lexicon-person-forms-wave-56.test.ts"
DATA = ROOT / "tmp-wave56-data.json"
WORKFLOW = ROOT / ".github/workflows/tmp-wave56-apply.yml"
SCRIPT = ROOT / "scripts/tmp-apply-wave56.py"

records = json.loads(DATA.read_text(encoding="utf-8"))

def cap(value: str) -> str:
    return value[:1].upper() + value[1:]

def entry(record: list[str]) -> str:
    stem, masculine, feminine, plural, kind = record
    if kind == "weak":
        return f'  {{ ...weak("{stem}", "{masculine}", "{plural}"), match: "exact" as const }},'
    return f'  {{ ...regular("{stem}", "{plural}", "{masculine}", "{masculine}s"), match: "exact" as const }},'

text = LEXICON.read_text(encoding="utf-8")
anchor = '  { ...weak("afrikanist"), match: "exact" as const },'
if '"archivrestaurator"' not in text:
    if anchor not in text:
        raise SystemExit("Einfügeanker im Personenlexikon nicht gefunden.")
    block = "\n".join(entry(record) for record in records)
    text = text.replace(anchor, block + "\n" + anchor, 1)
    LEXICON.write_text(text, encoding="utf-8")

plural_rows = "\n".join(
    f'    ["{cap(stem)}:innen", "{cap(plural)}"],'
    for stem, masculine, feminine, plural, kind in records
)
pair_rows = "\n".join(
    f'    ["{cap(masculine)}", "{cap(feminine)}", "{cap(masculine)}"],'
    for stem, masculine, feminine, plural, kind in records
)
case_rows = """    ["archivrestaurator", "genitive", "archivrestaurators"],
    ["auftragsakquisiteur", "genitive", "auftragsakquisiteurs"],
    ["aufzugschlosser", "genitive", "aufzugschlossers"],
    ["augenarztgehilf", "dative", "augenarztgehilfen"],
    ["bandagist", "accusative", "bandagisten"],
    ["bankenanalyst", "genitive", "bankenanalysten"],
    ["beilagenköch", "genitive", "beilagenkochs"],
    ["bierbrauer", "genitive", "bierbrauers"],
    ["bodenakrobat", "dative", "bodenakrobaten"],
    ["chefköch", "accusative", "chefkoch"],"""

test = f'''import {{ describe, expect, it }} from "vitest";
import {{ mappedPluralSeparatorsRule }} from "../src/rules/mapped-plural-separators";
import {{
  mapMappedSingular,
  mapMappedSingularPair
}} from "../src/rules/person-lexicon";

describe("sechsundfünfzigste konservative Lexikon-Ausbauwelle", () => {{
  it.each([
{plural_rows}
  ])("normalisiert den abgesicherten Personenstamm %s", (input, expected) => {{
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({{
      text: expected,
      replacements: 1
    }});
  }});

  it.each([
{pair_rows}
  ])("erkennt das abgesicherte Paar %s/%s", (masculine, feminine, expected) => {{
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  }});

  it.each([
{case_rows}
  ] as const)(
    "bildet %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {{
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }}
  );
}});
'''
TEST.write_text(test, encoding="utf-8")

for path in (DATA, WORKFLOW, SCRIPT):
    path.unlink(missing_ok=True)
