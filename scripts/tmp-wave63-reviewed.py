#!/usr/bin/env python3
"""Erzeugt Welle 63 aus dem intern geprüften Priority-9-Batch."""

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
    / "kldb-current-priority-9-manual-decisions.json"
)

SUPPORTED_CLASSES = (
    "unchanged",
    "plural_e",
    "weak_e",
    "weak_en",
    "plural_en",
    "plural_s",
)


def expected(candidate: str, kind: str) -> dict[str, str]:
    if kind == "unchanged":
        return {
            "masculine": candidate,
            "feminine": candidate + "in",
            "plural": candidate,
            "obliqueSingular": candidate,
            "genitiveSingular": candidate + "s",
        }
    if kind == "plural_e":
        return {
            "masculine": candidate,
            "feminine": candidate + "in",
            "plural": candidate + "e",
            "obliqueSingular": candidate,
            "genitiveSingular": candidate + "s",
        }
    if kind == "weak_e":
        inflected = candidate + "en"
        return {
            "masculine": candidate + "e",
            "feminine": candidate + "in",
            "plural": inflected,
            "obliqueSingular": inflected,
            "genitiveSingular": inflected,
        }
    if kind == "weak_en":
        inflected = candidate + "en"
        return {
            "masculine": candidate,
            "feminine": candidate + "in",
            "plural": inflected,
            "obliqueSingular": inflected,
            "genitiveSingular": inflected,
        }
    if kind == "plural_en":
        return {
            "masculine": candidate,
            "feminine": candidate + "in",
            "plural": candidate + "en",
            "obliqueSingular": candidate,
            "genitiveSingular": candidate + "s",
        }
    if kind == "plural_s":
        return {
            "masculine": candidate,
            "feminine": candidate + "in",
            "plural": candidate + "s",
            "obliqueSingular": candidate,
            "genitiveSingular": candidate + "s",
        }
    raise RuntimeError(f"Nicht unterstützte Flexionsklasse: {kind}")


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
    if decisions.get("sourceId") != "kldb-current-priority-9":
        raise RuntimeError("Falscher Review-Block.")
    if decisions.get("reviewMode") != "language_model_first":
        raise RuntimeError("Priority 9 wurde nicht im Sprachmodell-Modus geprüft.")
    if decisions.get("rejected") or decisions.get("pending"):
        raise RuntimeError("Priority 9 ist nicht vollständig positiv entschieden.")

    accepted = decisions.get("accepted") or []
    if len(accepted) != 246:
        raise RuntimeError(
            f"Erwartet wurden 246 akzeptierte Kandidaten, erhalten: {len(accepted)}"
        )

    classes: dict[str, list[str]] = {kind: [] for kind in SUPPORTED_CLASSES}
    seen: set[str] = set()
    normalized_items: list[dict[str, str]] = []

    for item in accepted:
        candidate = item["candidate"]
        kind = item["class"]
        if candidate in seen:
            raise RuntimeError(f"Doppelter Kandidat: {candidate}")
        seen.add(candidate)
        if kind not in classes:
            raise RuntimeError(f"Nicht unterstützte Flexionsklasse: {kind}")

        expected_forms = expected(candidate, kind)
        for field, expected_value in expected_forms.items():
            if item.get(field) != expected_value:
                raise RuntimeError(
                    "Review-Form widerspricht der abgesicherten Flexion: "
                    f"{candidate} / {field}: {item.get(field)!r} != {expected_value!r}"
                )

        classes[kind].append(candidate)
        normalized_items.append(
            {"candidate": candidate, "class": kind, **expected_forms}
        )

    module = """import type { GeneratedPersonForms } from "./generated-person-lexicon";

// Quellenneutraler, exakt freigegebener Zusatzbestand aus Welle 63.
// Die Mengen sind reine Allow-Lists und erzeugen keine generische Suffixfreigabe.
"""
    module += render_set("unchangedForms", classes["unchanged"])
    module += render_set("pluralEForms", classes["plural_e"])
    module += render_set("weakEForms", classes["weak_e"])
    module += render_set("weakEnForms", classes["weak_en"])
    module += render_set("pluralEnForms", classes["plural_en"])
    module += render_set("pluralSForms", classes["plural_s"])
    module += """
export const reviewedPersonFormCountWave63 =
  unchangedForms.size +
  pluralEForms.size +
  weakEForms.size +
  weakEnForms.size +
  pluralEnForms.size +
  pluralSForms.size;

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

export function getReviewedPersonFormsWave63(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (unchangedForms.has(normalizedBase)) {
    return regularForms(normalizedBase, normalizedBase);
  }

  if (pluralEForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}e`);
  }

  if (weakEForms.has(normalizedBase)) {
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

  if (weakEnForms.has(normalizedBase)) {
    const inflected = `${normalizedBase}en`;
    return regularForms(normalizedBase, inflected, inflected, inflected);
  }

  if (pluralEnForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}en`);
  }

  if (pluralSForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}s`);
  }

  return undefined;
}
"""
    (ROOT / "src/rules/reviewed-person-forms-wave-63.ts").write_text(
        module, encoding="utf-8"
    )

    lexicon_path = ROOT / "src/rules/person-lexicon.ts"
    lexicon = lexicon_path.read_text(encoding="utf-8")
    import_anchor = (
        'import { getReviewedPersonFormsWave62 } '
        'from "./reviewed-person-forms-wave-62";\n'
    )
    import_line = (
        'import { getReviewedPersonFormsWave63 } '
        'from "./reviewed-person-forms-wave-63";\n'
    )
    if import_line not in lexicon:
        if import_anchor not in lexicon:
            raise RuntimeError("Import-Anker für Welle 63 fehlt.")
        lexicon = lexicon.replace(import_anchor, import_anchor + import_line, 1)

    lookup_anchor = "    getReviewedPersonFormsWave62(normalizedBase)\n"
    lookup_new = (
        "    getReviewedPersonFormsWave62(normalizedBase) ??\n"
        "    getReviewedPersonFormsWave63(normalizedBase)\n"
    )
    if "getReviewedPersonFormsWave63(normalizedBase)" not in lexicon:
        if lookup_anchor not in lexicon:
            raise RuntimeError("Lookup-Anker für Welle 63 fehlt.")
        lexicon = lexicon.replace(lookup_anchor, lookup_new, 1)

    lexicon_path.write_text(lexicon, encoding="utf-8")

    plural_cases = [
        [cap(item["candidate"]) + ":innen", cap(item["plural"])]
        for item in normalized_items
    ]
    pair_cases = [
        [
            cap(item["masculine"]),
            cap(item["feminine"]),
            cap(item["masculine"]),
        ]
        for item in normalized_items
    ]

    representative_cases: list[list[str]] = []
    for kind in SUPPORTED_CLASSES:
        item = next(item for item in normalized_items if item["class"] == kind)
        if kind in {"weak_e", "weak_en"}:
            grammatical_case = "dative"
            result = item["obliqueSingular"]
        else:
            grammatical_case = "genitive"
            result = item["genitiveSingular"]
        representative_cases.append(
            [item["candidate"], grammatical_case, result]
        )

    negative_cases = [
        "computervisualist",
        "eri-wart",
        "eutonist",
        "fennist",
        "mindermaschinenstricker",
        "modellist",
        "tapisserist",
        "verschmelzer",
        "wäscher",
        "bildmischer",
        "bohrer",
        "blechpresser",
        "bandstanzer",
        "bandwalzer",
        "drahtwickler",
        "branntweinbrenner",
        "briefsortierer",
        "offsetplattenkopierer",
        "devisenrechner",
        "geldzähler",
        "aluminiumspritzer",
        "vorroller",
        "tiefzieher",
        "fantasieperson",
    ]

    test = f"""import {{ describe, expect, it }} from "vitest";
import {{ mappedPluralSeparatorsRule }} from "../src/rules/mapped-plural-separators";
import {{
  mapMappedSingular,
  mapMappedSingularPair
}} from "../src/rules/person-lexicon";
import {{
  getReviewedPersonFormsWave63,
  reviewedPersonFormCountWave63
}} from "../src/rules/reviewed-person-forms-wave-63";

describe("dreiundsechzigste Lexikon-Ausbauwelle", () => {{
  it("enthält genau den intern geprüften Exaktbestand", () => {{
    expect(reviewedPersonFormCountWave63).toBe(246);
    for (const base of {json.dumps(negative_cases, ensure_ascii=False, indent=6)}) {{
      expect(getReviewedPersonFormsWave63(base), base).toBeUndefined();
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
{ts_rows(representative_cases)}
  ] as const)(
    "bildet die repräsentative Basis %s im Kasus %s korrekt ab",
    (base, grammaticalCase, expected) => {{
      expect(mapMappedSingular(base, grammaticalCase)).toBe(expected);
    }}
  );

  it.each([
    ["Color-Matcher:innen", "Color-Matcher"],
    ["Trick-Cutter:innen", "Trick-Cutter"],
    ["Umwelt-Zertifizierer:innen", "Umwelt-Zertifizierer"],
    ["UX-Researcher:innen", "UX-Researcher"]
  ])("erhält die Segmentgroßschreibung für %s", (input, expected) => {{
    expect(mappedPluralSeparatorsRule.apply(input)).toEqual({{
      text: expected,
      replacements: 1
    }});
  }});
}});
"""
    (ROOT / "tests/lexicon-person-forms-wave-63.test.ts").write_text(
        test, encoding="utf-8"
    )


if __name__ == "__main__":
    main()
