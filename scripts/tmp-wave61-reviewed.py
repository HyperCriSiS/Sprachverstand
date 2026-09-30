#!/usr/bin/env python3
"""Erzeugt Welle 61 aus dem intern geprüften Priority-7-Batch."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DECISIONS = (
    ROOT
    / "datastore"
    / "sprachverstand"
    / "derived"
    / "review"
    / "kldb-current-priority-7-manual-decisions.json"
)


def render_set(name: str, values: list[str]) -> str:
    body = ",\n".join(
        f"  {json.dumps(value, ensure_ascii=False)}" for value in sorted(values)
    )
    return f"const {name}: ReadonlySet<string> = new Set([\n{body}\n]);\n"


def cap(value: str) -> str:
    return value[:1].upper() + value[1:]


def ts_rows(rows: list[list[str]]) -> str:
    return ",\n".join(
        "    [" + ", ".join(json.dumps(value, ensure_ascii=False) for value in row) + "]"
        for row in rows
    )


def main() -> None:
    decisions = json.loads(DECISIONS.read_text(encoding="utf-8"))
    if decisions.get("sourceId") != "kldb-current-priority-7":
        raise RuntimeError("Falscher Review-Block.")
    if decisions.get("reviewMode") != "language_model_first":
        raise RuntimeError("Priority 7 wurde nicht im Sprachmodellmodus geprüft.")
    if decisions.get("rejected") or decisions.get("pending"):
        raise RuntimeError("Priority 7 ist nicht vollständig positiv entschieden.")

    accepted = decisions.get("accepted") or []
    if len(accepted) != 250:
        raise RuntimeError(
            f"Erwartet wurden 250 akzeptierte Kandidaten, erhalten: {len(accepted)}"
        )
    if any(item.get("class") != "unchanged" for item in accepted):
        raise RuntimeError("Priority 7 enthält unerwartete Flexionsklassen.")

    selected = [item["candidate"] for item in accepted]
    if len(set(selected)) != len(selected):
        raise RuntimeError("Priority 7 enthält doppelte Kandidaten.")

    module = """import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 61.
// Die Menge ist eine reine Allow-List und erzeugt keine generische Suffixfreigabe.
"""
    module += render_set("unchangedForms", selected)
    module += """
export const reviewedPersonFormCountWave61 = unchangedForms.size;

export function getReviewedPersonFormsWave61(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (!unchangedForms.has(normalizedBase)) {
    return undefined;
  }

  return {
    plural: normalizedBase,
    singular: normalizedBase,
    feminineSingular: `${normalizedBase}in`,
    obliqueSingular: normalizedBase,
    genitiveSingular: `${normalizedBase}s`
  };
}
"""
    (ROOT / "src/rules/reviewed-person-forms-wave-61.ts").write_text(
        module, encoding="utf-8"
    )

    lexicon_path = ROOT / "src/rules/person-lexicon.ts"
    lexicon = lexicon_path.read_text(encoding="utf-8")
    import_anchor = (
        'import { getReviewedPersonFormsWave60 } from "./reviewed-person-forms-wave-60";\n'
    )
    import_line = (
        'import { getReviewedPersonFormsWave61 } '
        'from "./reviewed-person-forms-wave-61";\n'
    )
    if import_line not in lexicon:
        if import_anchor not in lexicon:
            raise RuntimeError("Import-Anker in person-lexicon.ts fehlt.")
        lexicon = lexicon.replace(import_anchor, import_anchor + import_line, 1)

    old = """    getGeneratedPersonForms(normalizedBase) ??
    getReviewedPersonForms(normalizedBase) ??
    getReviewedPersonFormsWave59(normalizedBase) ??
    getReviewedPersonFormsWave60(normalizedBase)
"""
    new = """    getGeneratedPersonForms(normalizedBase) ??
    getReviewedPersonForms(normalizedBase) ??
    getReviewedPersonFormsWave59(normalizedBase) ??
    getReviewedPersonFormsWave60(normalizedBase) ??
    getReviewedPersonFormsWave61(normalizedBase)
"""
    if old not in lexicon:
        raise RuntimeError("Exakt-Lookup-Anker in person-lexicon.ts fehlt.")
    lexicon = lexicon.replace(old, new, 1)
    lexicon_path.write_text(lexicon, encoding="utf-8")

    plural_cases: list[list[str]] = []
    pair_cases: list[list[str]] = []
    for item in accepted:
        candidate = item["candidate"]
        plural_cases.append([cap(candidate) + ":innen", cap(item["plural"])])
        pair_cases.append(
            [cap(item["masculine"]), cap(item["feminine"]), cap(item["masculine"])]
        )

    test = f"""import {{ describe, expect, it }} from "vitest";
import {{ mappedPluralSeparatorsRule }} from "../src/rules/mapped-plural-separators";
import {{
  mapMappedSingular,
  mapMappedSingularPair
}} from "../src/rules/person-lexicon";
import {{
  getReviewedPersonFormsWave61,
  reviewedPersonFormCountWave61
}} from "../src/rules/reviewed-person-forms-wave-61";

describe("einundsechzigste Lexikon-Ausbauwelle", () => {{
  it("enthält genau den intern geprüften Exaktbestand", () => {{
    expect(reviewedPersonFormCountWave61).toBe(250);
    for (const base of [
      "computervisualist",
      "eri-wart",
      "eutonist",
      "fennist",
      "mindermaschinenstricker",
      "modellist",
      "tapisserist",
      "verschmelzer",
      "wäscher",
      "kabelbinder",
      "gummikleber",
      "röster",
      "fantasiepacker"
    ]) {{
      expect(getReviewedPersonFormsWave61(base), base).toBeUndefined();
    }}
  }});

  it.each([
{ts_rows(plural_cases)}
  ])("normalisiert den intern geprüften Personenstamm %s", (input, expected) => {{
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({{
      text: expected,
      replacements: 1
    }});
  }});

  it.each([
{ts_rows(pair_cases)}
  ])("erkennt das intern geprüfte Paar %s/%s", (masculine, feminine, expected) => {{
    expect(mapMappedSingularPair(masculine, feminine)).toBe(expected);
  }});

  it.each([
    ["abpacker", "genitive", "abpackers"],
    ["böttcher", "genitive", "böttchers"],
    ["fürsorger", "genitive", "fürsorgers"],
    ["trichinenschauer", "genitive", "trichinenschauers"]
  ] as const)(
    "bildet die repräsentative Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {{
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }}
  );
}});
"""
    (ROOT / "tests/lexicon-person-forms-wave-61.test.ts").write_text(
        test, encoding="utf-8"
    )


if __name__ == "__main__":
    main()
