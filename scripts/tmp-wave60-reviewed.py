#!/usr/bin/env python3
"""Erzeugt Welle 60 aus dem intern geprüften Priority-6-Batch."""

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
    / "kldb-current-priority-6-manual-decisions.json"
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
    if decisions.get("sourceId") != "kldb-current-priority-6":
        raise RuntimeError("Falscher Review-Block.")
    if decisions.get("reviewMode") != "language_model_first":
        raise RuntimeError("Priority 6 wurde nicht im Sprachmodellmodus geprüft.")
    if decisions.get("rejected") or decisions.get("pending"):
        raise RuntimeError("Priority 6 ist nicht vollständig positiv entschieden.")

    accepted = decisions.get("accepted") or []
    if len(accepted) != 250:
        raise RuntimeError(
            f"Erwartet wurden 250 akzeptierte Kandidaten, erhalten: {len(accepted)}"
        )

    classes: dict[str, list[str]] = {
        "unchanged": [],
        "weak_en": [],
        "plural_e": [],
        "loge": [],
    }
    seen: set[str] = set()

    for item in accepted:
        candidate = item["candidate"]
        kind = item["class"]
        if candidate in seen:
            raise RuntimeError(f"Doppelter Kandidat: {candidate}")
        if kind not in classes:
            raise RuntimeError(f"Unbekannte Flexionsklasse: {kind}")
        seen.add(candidate)
        classes[kind].append(candidate)

    expected_counts = {
        "unchanged": 157,
        "weak_en": 47,
        "plural_e": 26,
        "loge": 20,
    }
    actual_counts = {key: len(value) for key, value in classes.items()}
    if actual_counts != expected_counts:
        raise RuntimeError(f"Unerwartete Klassenverteilung: {actual_counts}")

    module = """import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 60.
// Die Mengen sind reine Allow-Lists und erzeugen keine generische Suffixfreigabe.
"""
    module += render_set("unchangedForms", classes["unchanged"])
    module += render_set("weakEnForms", classes["weak_en"])
    module += render_set("pluralEForms", classes["plural_e"])
    module += render_set("logeForms", classes["loge"])
    module += """
export const reviewedPersonFormCountWave60 =
  unchangedForms.size + weakEnForms.size + pluralEForms.size + logeForms.size;

function regularForms(
  base: string,
  plural: string,
  obliqueSingular = base,
  genitiveSingular = `${base}s`
): GeneratedPersonForms {
  return {
    plural,
    singular: base,
    feminineSingular: `${base}in`,
    obliqueSingular,
    genitiveSingular
  };
}

export function getReviewedPersonFormsWave60(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (unchangedForms.has(normalizedBase)) {
    return regularForms(normalizedBase, normalizedBase);
  }

  if (weakEnForms.has(normalizedBase)) {
    const inflected = `${normalizedBase}en`;
    return regularForms(normalizedBase, inflected, inflected, inflected);
  }

  if (pluralEForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}e`);
  }

  if (logeForms.has(normalizedBase)) {
    const singular = `${normalizedBase}e`;
    const inflected = `${normalizedBase}en`;
    return {
      plural: inflected,
      singular,
      feminineSingular: `${normalizedBase}in`,
      obliqueSingular: inflected,
      genitiveSingular: inflected
    };
  }

  return undefined;
}
"""
    (ROOT / "src/rules/reviewed-person-forms-wave-60.ts").write_text(
        module, encoding="utf-8"
    )

    lexicon_path = ROOT / "src/rules/person-lexicon.ts"
    lexicon = lexicon_path.read_text(encoding="utf-8")
    import_anchor = (
        'import { getReviewedPersonFormsWave59 } from "./reviewed-person-forms-wave-59";\n'
    )
    import_line = (
        'import { getReviewedPersonFormsWave60 } '
        'from "./reviewed-person-forms-wave-60";\n'
    )
    if import_line not in lexicon:
        if import_anchor not in lexicon:
            raise RuntimeError("Import-Anker in person-lexicon.ts fehlt.")
        lexicon = lexicon.replace(import_anchor, import_anchor + import_line, 1)

    old = """    getGeneratedPersonForms(normalizedBase) ??
    getReviewedPersonForms(normalizedBase) ??
    getReviewedPersonFormsWave59(normalizedBase)
"""
    new = """    getGeneratedPersonForms(normalizedBase) ??
    getReviewedPersonForms(normalizedBase) ??
    getReviewedPersonFormsWave59(normalizedBase) ??
    getReviewedPersonFormsWave60(normalizedBase)
"""
    if old not in lexicon:
        raise RuntimeError("Exakt-Lookup-Anker in person-lexicon.ts fehlt.")
    lexicon = lexicon.replace(old, new, 1)
    lexicon_path.write_text(lexicon, encoding="utf-8")

    plural_cases: list[list[str]] = []
    pair_cases: list[list[str]] = []
    case_cases: list[list[str]] = []
    class_seen: set[str] = set()

    for item in accepted:
        candidate = item["candidate"]
        plural_cases.append([cap(candidate) + ":innen", cap(item["plural"])])
        pair_cases.append(
            [cap(item["masculine"]), cap(item["feminine"]), cap(item["masculine"])]
        )

        kind = item["class"]
        if kind not in class_seen:
            class_seen.add(kind)
            if kind in {"weak_en", "loge"}:
                case_cases.append([candidate, "dative", item["obliqueSingular"]])
            else:
                case_cases.append([candidate, "genitive", item["genitiveSingular"]])

    test = f"""import {{ describe, expect, it }} from "vitest";
import {{ mappedPluralSeparatorsRule }} from "../src/rules/mapped-plural-separators";
import {{
  mapMappedSingular,
  mapMappedSingularPair
}} from "../src/rules/person-lexicon";
import {{
  getReviewedPersonFormsWave60,
  reviewedPersonFormCountWave60
}} from "../src/rules/reviewed-person-forms-wave-60";

describe("sechzigste Lexikon-Ausbauwelle", () => {{
  it("enthält genau den intern geprüften Exaktbestand", () => {{
    expect(reviewedPersonFormCountWave60).toBe(250);
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
      "fantasiewart"
    ]) {{
      expect(getReviewedPersonFormsWave60(base), base).toBeUndefined();
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
{ts_rows(case_cases)}
  ] as const)(
    "bildet die repräsentative Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {{
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }}
  );

  it.each([
    ["Diplom-Choreograph:innen", "Diplom-Choreographen"],
    ["Maschinen-Reviersteiger:innen", "Maschinen-Reviersteiger"],
    ["Multimedia-Konzeptionist:innen", "Multimedia-Konzeptionisten"],
    ["Repro-Bogenmontierer:innen", "Repro-Bogenmontierer"],
    ["Straßentunnelwart:innen", "Straßentunnelwarte"]
  ])("erhält die Segmentgroßschreibung für %s", (input, expected) => {{
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({{
      text: expected,
      replacements: 1
    }});
  }});
}});
"""
    (ROOT / "tests/lexicon-person-forms-wave-60.test.ts").write_text(
        test, encoding="utf-8"
    )


if __name__ == "__main__":
    main()
