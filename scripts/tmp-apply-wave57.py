from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEXICON = ROOT / "src/rules/person-lexicon.ts"
TEST = ROOT / "tests/lexicon-person-forms-wave-57.test.ts"
WORKFLOW = ROOT / ".github/workflows/tmp-wave57-apply.yml"
SCRIPT = ROOT / "scripts/tmp-apply-wave57.py"

records = json.loads("[[\"digitaldrucker\",\"digitaldrucker\",\"digitaldrucker\",\"digitaldruckers\",\"regular\"],[\"diplom-restaurator\",\"diplom-restaurator\",\"diplom-restauratoren\",\"diplom-restaurators\",\"regular\"],[\"diätköch\",\"diätkoch\",\"diätköche\",\"diätkochs\",\"regular\"],[\"drahtschlosser\",\"drahtschlosser\",\"drahtschlosser\",\"drahtschlossers\",\"regular\"],[\"drahtseilakrobat\",\"drahtseilakrobat\",\"drahtseilakrobaten\",null,\"weak\"],[\"drucker\",\"drucker\",\"drucker\",\"druckers\",\"regular\"],[\"druckereirevisor\",\"druckereirevisor\",\"druckereirevisoren\",\"druckereirevisors\",\"regular\"],[\"dv-revisor\",\"dv-revisor\",\"dv-revisoren\",\"dv-revisors\",\"regular\"],[\"edv-revisor\",\"edv-revisor\",\"edv-revisoren\",\"edv-revisors\",\"regular\"],[\"einfarbenoffsetdrucker\",\"einfarbenoffsetdrucker\",\"einfarbenoffsetdrucker\",\"einfarbenoffsetdruckers\",\"regular\"],[\"eisenbahnschlosser\",\"eisenbahnschlosser\",\"eisenbahnschlosser\",\"eisenbahnschlossers\",\"regular\"],[\"eisenbauschlosser\",\"eisenbauschlosser\",\"eisenbauschlosser\",\"eisenbauschlossers\",\"regular\"],[\"eisenmöbelschlosser\",\"eisenmöbelschlosser\",\"eisenmöbelschlosser\",\"eisenmöbelschlossers\",\"regular\"],[\"elektrofahrzeugschlosser\",\"elektrofahrzeugschlosser\",\"elektrofahrzeugschlosser\",\"elektrofahrzeugschlossers\",\"regular\"],[\"elektrosignalschlosser\",\"elektrosignalschlosser\",\"elektrosignalschlosser\",\"elektrosignalschlossers\",\"regular\"],[\"fachgehilf\",\"fachgehilfe\",\"fachgehilfen\",null,\"weak\"],[\"fahrzeugschlosser\",\"fahrzeugschlosser\",\"fahrzeugschlosser\",\"fahrzeugschlossers\",\"regular\"],[\"fehleranalyst\",\"fehleranalyst\",\"fehleranalysten\",null,\"weak\"],[\"feinblechschlosser\",\"feinblechschlosser\",\"feinblechschlosser\",\"feinblechschlossers\",\"regular\"],[\"feldgemüsebäuer\",\"feldgemüsebauer\",\"feldgemüsebauern\",null,\"bauer\"],[\"fensterschreiner\",\"fensterschreiner\",\"fensterschreiner\",\"fensterschreiners\",\"regular\"],[\"fernmelderevisor\",\"fernmelderevisor\",\"fernmelderevisoren\",\"fernmelderevisors\",\"regular\"],[\"filmlichtdrucker\",\"filmlichtdrucker\",\"filmlichtdrucker\",\"filmlichtdruckers\",\"regular\"],[\"filmrestaurator\",\"filmrestaurator\",\"filmrestauratoren\",\"filmrestaurators\",\"regular\"],[\"finanzanalyst\",\"finanzanalyst\",\"finanzanalysten\",null,\"weak\"],[\"fischergehilf\",\"fischergehilfe\",\"fischergehilfen\",null,\"weak\"],[\"fischköch\",\"fischkoch\",\"fischköche\",\"fischkochs\",\"regular\"],[\"fischzuchtgehilf\",\"fischzuchtgehilfe\",\"fischzuchtgehilfen\",null,\"weak\"],[\"flachdrucker\",\"flachdrucker\",\"flachdrucker\",\"flachdruckers\",\"regular\"],[\"fleischergehilf\",\"fleischergehilfe\",\"fleischergehilfen\",null,\"weak\"],[\"flexodrucker\",\"flexodrucker\",\"flexodrucker\",\"flexodruckers\",\"regular\"],[\"foliendrucker\",\"foliendrucker\",\"foliendrucker\",\"foliendruckers\",\"regular\"],[\"fondsanalyst\",\"fondsanalyst\",\"fondsanalysten\",null,\"weak\"],[\"fotomatongehilf\",\"fotomatongehilfe\",\"fotomatongehilfen\",null,\"weak\"],[\"fotorestaurator\",\"fotorestaurator\",\"fotorestauratoren\",\"fotorestaurators\",\"regular\"],[\"fraud-analyst\",\"fraud-analyst\",\"fraud-analysten\",null,\"weak\"],[\"funkgehilf\",\"funkgehilfe\",\"funkgehilfen\",null,\"weak\"],[\"fährgehilf\",\"fährgehilfe\",\"fährgehilfen\",null,\"weak\"],[\"gasthofgehilf\",\"gasthofgehilfe\",\"gasthofgehilfen\",null,\"weak\"],[\"gaststättengehilf\",\"gaststättengehilfe\",\"gaststättengehilfen\",null,\"weak\"],[\"geflügelzuchtgehilf\",\"geflügelzuchtgehilfe\",\"geflügelzuchtgehilfen\",null,\"weak\"],[\"gemälderestaurator\",\"gemälderestaurator\",\"gemälderestauratoren\",\"gemälderestaurators\",\"regular\"],[\"gemüsebäuer\",\"gemüsebauer\",\"gemüsebauern\",null,\"bauer\"],[\"gestellbauschlosser\",\"gestellbauschlosser\",\"gestellbauschlosser\",\"gestellbauschlossers\",\"regular\"],[\"gestütsgehilf\",\"gestütsgehilfe\",\"gestütsgehilfen\",null,\"weak\"],[\"getriebeschlosser\",\"getriebeschlosser\",\"getriebeschlosser\",\"getriebeschlossers\",\"regular\"],[\"gewerbegehilf\",\"gewerbegehilfe\",\"gewerbegehilfen\",null,\"weak\"],[\"glasbedrucker\",\"glasbedrucker\",\"glasbedrucker\",\"glasbedruckers\",\"regular\"],[\"goldschmiedegehilf\",\"goldschmiedegehilfe\",\"goldschmiedegehilfen\",null,\"weak\"],[\"grafikrestaurator\",\"grafikrestaurator\",\"grafikrestauratoren\",\"grafikrestaurators\",\"regular\"]]")

def cap(value: str) -> str:
    return value[:1].upper() + value[1:]

def entry(record: list[object]) -> str:
    stem, masculine, plural, genitive, kind = record
    if kind == "weak":
        return f'  {{ ...weak("{stem}", "{masculine}", "{plural}"), match: "exact" as const }},'
    if kind == "bauer":
        feminine = f"{stem}in"
        return (
            "  {\n"
            f'    stem: "{stem}",\n'
            f'    singular: "{masculine}",\n'
            f'    feminineSingular: "{feminine}",\n'
            f'    obliqueSingular: "{plural}",\n'
            f'    genitiveSingular: "{plural}",\n'
            f'    plural: "{plural}",\n'
            '    match: "exact" as const\n'
            "  },"
        )
    return f'  {{ ...regular("{stem}", "{plural}", "{masculine}", "{genitive}"), match: "exact" as const }},'

text = LEXICON.read_text(encoding="utf-8")
anchor = '  { ...weak("afrikanist"), match: "exact" as const },'
if '"digitaldrucker"' not in text:
    if anchor not in text:
        raise SystemExit("Einfügeanker im Personenlexikon nicht gefunden.")
    block = "\n".join(entry(record) for record in records)
    text = text.replace(anchor, block + "\n" + anchor, 1)
    LEXICON.write_text(text, encoding="utf-8")

plural_rows = "\n".join(
    f'    ["{cap(stem)}:innen", "{cap(plural)}"],'
    for stem, masculine, plural, genitive, kind in records
)
pair_rows = "\n".join(
    f'    ["{cap(masculine)}", "{cap(stem + "in")}", "{cap(masculine)}"],'
    for stem, masculine, plural, genitive, kind in records
)
case_rows = []
for stem, masculine, plural, genitive, kind in records:
    if kind in {"weak", "bauer"}:
        grammatical_case = "dative"
        expected = plural
    else:
        grammatical_case = "genitive"
        expected = genitive
    case_rows.append(
        f'    ["{stem}", "{grammatical_case}", "{expected}"],'
    )
case_rows_text = "\n".join(case_rows)

inflected_rows = """    ["Feldgemüsebäuerin", "Feldgemüsebauern", "dative", "Feldgemüsebauern"],
    ["Fachgehilfin", "Fachgehilfen", "accusative", "Fachgehilfen"],
    ["Diätköchin", "Diätkochs", "genitive", "Diätkochs"],
    ["Gemüsebäuerin", "Gemüsebauern", "genitive", "Gemüsebauern"],
    ["Fischköchin", "Fischkochs", "genitive", "Fischkochs"],"""

test = f'''import {{ describe, expect, it }} from "vitest";
import {{ mappedPluralSeparatorsRule }} from "../src/rules/mapped-plural-separators";
import {{
  mapMappedInflectedSingularPair,
  mapMappedSingular,
  mapMappedSingularPair
}} from "../src/rules/person-lexicon";

describe("siebenundfünfzigste konservative Lexikon-Ausbauwelle", () => {{
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
{case_rows_text}
  ] as const)(
    "bildet %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {{
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }}
  );

  it.each([
{inflected_rows}
  ] as const)(
    "erkennt das flektierte Paar %s/%s im Kasus %s",
    (feminine, masculine, grammaticalCase, expected) => {{
      expect(
        mapMappedInflectedSingularPair(feminine, masculine, grammaticalCase)
      ).toBe(expected);
    }}
  );
}});
'''
TEST.write_text(test, encoding="utf-8")

for path in (WORKFLOW, SCRIPT):
    path.unlink(missing_ok=True)
