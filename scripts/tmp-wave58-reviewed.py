#!/usr/bin/env python3
"""Erzeugt Welle 58 aus dem intern geprüften Priority-4-Batch."""

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
    / "kldb-current-priority-4-manual-decisions.json"
)


def expected(candidate: str) -> tuple[str, str, str, str]:
    if candidate.endswith("gehilf"):
        return "gehilf", candidate + "e", candidate + "in", candidate + "en"
    if candidate.endswith("köch"):
        masculine = candidate[:-4] + "koch"
        return "koech", masculine, candidate + "in", candidate + "e"
    if candidate.endswith("bäuer"):
        masculine = candidate[:-5] + "bauer"
        return "baeuer", masculine, candidate + "in", candidate[:-5] + "bauern"
    if candidate.endswith("analyst"):
        return "weak_en", candidate, candidate + "in", candidate + "en"
    if candidate.endswith(("revisor", "restaurator")):
        return "plural_en", candidate, candidate + "in", candidate + "en"
    if candidate.endswith(("schlosser", "schreiner", "drucker", "brauer")):
        return "unchanged", candidate, candidate + "in", candidate
    raise RuntimeError(f"Nicht abgesicherte Kopfwortklasse: {candidate}")


def render_set(name: str, values: list[str]) -> str:
    body = ",\n".join(
        f"  {json.dumps(value, ensure_ascii=False)}" for value in sorted(values)
    )
    return f"const {name}: ReadonlySet<string> = new Set([\n{body}\n]);\n"


def cap(value: str) -> str:
    return value[:1].upper() + value[1:]


def ts_rows(rows: list[list[str]]) -> str:
    return ",\n".join(
        "    [" + ", ".join(json.dumps(v, ensure_ascii=False) for v in row) + "]"
        for row in rows
    )


def main() -> None:
    decisions = json.loads(DECISIONS.read_text(encoding="utf-8"))
    if decisions.get("sourceId") != "kldb-current-priority-4":
        raise RuntimeError("Falscher Review-Block.")
    if decisions.get("reviewMode") != "language_model_first":
        raise RuntimeError("Priority 4 wurde nicht im neuen Review-Modus geprüft.")
    if decisions.get("rejected") or decisions.get("pending"):
        raise RuntimeError("Priority 4 ist nicht vollständig positiv entschieden.")

    accepted = decisions.get("accepted") or []
    if len(accepted) != 222:
        raise RuntimeError(
            f"Erwartet wurden 222 akzeptierte Kandidaten, erhalten: {len(accepted)}"
        )

    classes: dict[str, list[str]] = {
        "unchanged": [],
        "weak_en": [],
        "plural_en": [],
        "gehilf": [],
        "koech": [],
        "baeuer": [],
    }
    seen: set[str] = set()

    for item in accepted:
        candidate = item["candidate"]
        if candidate in seen:
            raise RuntimeError(f"Doppelter Kandidat: {candidate}")
        seen.add(candidate)
        kind, masculine, feminine, plural = expected(candidate)
        if (
            item.get("masculine") != masculine
            or item.get("feminine") != feminine
            or item.get("plural") != plural
        ):
            raise RuntimeError(
                f"Review-Formen widersprechen der abgesicherten Flexion: {candidate}"
            )
        classes[kind].append(candidate)

    module = """import type { GeneratedPersonForms } from "./generated-person-lexicon";


// Quellenneutraler, exakt freigegebener Zusatzbestand.
// Die Mengen sind Allow-Lists: Ableitungen gelten nur nach exaktem Basistreffer.
"""
    module += render_set("unchangedForms", classes["unchanged"])
    module += render_set("weakEnForms", classes["weak_en"])
    module += render_set("pluralEnForms", classes["plural_en"])
    module += render_set("gehilfForms", classes["gehilf"])
    module += render_set("koechForms", classes["koech"])
    module += render_set("baeuerForms", classes["baeuer"])
    module += """
export const reviewedPersonFormCount =
  unchangedForms.size +
  weakEnForms.size +
  pluralEnForms.size +
  gehilfForms.size +
  koechForms.size +
  baeuerForms.size;

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

export function getReviewedPersonForms(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  if (unchangedForms.has(normalizedBase)) {
    return regularForms(normalizedBase, normalizedBase);
  }
  if (weakEnForms.has(normalizedBase)) {
    const inflected = `${normalizedBase}en`;
    return regularForms(normalizedBase, inflected, inflected, inflected);
  }
  if (pluralEnForms.has(normalizedBase)) {
    return regularForms(normalizedBase, `${normalizedBase}en`);
  }
  if (gehilfForms.has(normalizedBase)) {
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
  if (koechForms.has(normalizedBase)) {
    const singular = `${normalizedBase.slice(0, -4)}koch`;
    return {
      plural: `${normalizedBase}e`,
      singular,
      feminineSingular: `${normalizedBase}in`,
      obliqueSingular: singular,
      genitiveSingular: `${singular}s`
    };
  }
  if (baeuerForms.has(normalizedBase)) {
    const prefix = normalizedBase.slice(0, -5);
    const singular = `${prefix}bauer`;
    const inflected = `${prefix}bauern`;
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
    (ROOT / "src/rules/reviewed-person-forms.ts").write_text(
        module, encoding="utf-8"
    )

    lexicon_path = ROOT / "src/rules/person-lexicon.ts"
    lexicon = lexicon_path.read_text(encoding="utf-8")
    import_anchor = (
        'import { nationalityPersonForms } from "./nationality-person-forms";\n'
    )
    import_line = (
        'import { getReviewedPersonForms } from "./reviewed-person-forms";\n'
    )
    if import_line not in lexicon:
        if import_anchor not in lexicon:
            raise RuntimeError("Import-Anker in person-lexicon.ts fehlt.")
        lexicon = lexicon.replace(import_anchor, import_anchor + import_line, 1)

    lexicon = lexicon.replace("getGeneratedPersonForms(", "getExactPersonForms(")
    helper_anchor = 'const locale = "de-DE";\n'
    helper = """const locale = "de-DE";

function getExactPersonForms(
  normalizedBase: string
): GeneratedPersonForms | undefined {
  return (
    getGeneratedPersonForms(normalizedBase) ??
    getReviewedPersonForms(normalizedBase)
  );
}
"""
    if "function getExactPersonForms(" not in lexicon:
        if helper_anchor not in lexicon:
            raise RuntimeError("Helper-Anker in person-lexicon.ts fehlt.")
        lexicon = lexicon.replace(helper_anchor, helper, 1)

    lexicon = lexicon.replace(
        "return (\n    getExactPersonForms(normalizedBase) ??",
        "return (\n    getGeneratedPersonForms(normalizedBase) ??",
        1,
    )
    if lexicon.count("getExactPersonForms(") < 5:
        raise RuntimeError(
            "Nicht alle Produktpfade verwenden den kombinierten Exakt-Lookup."
        )
    lexicon_path.write_text(lexicon, encoding="utf-8")

    plural_cases: list[list[str]] = []
    pair_cases: list[list[str]] = []
    case_cases: list[list[str]] = []
    inflected_cases: list[list[str]] = []
    seen_kinds: set[str] = set()
    inflected_kinds: set[str] = set()

    for item in accepted:
        candidate = item["candidate"]
        kind, masculine, feminine, plural = expected(candidate)
        plural_cases.append([cap(candidate) + ":innen", cap(plural)])
        pair_cases.append([cap(masculine), cap(feminine), cap(masculine)])

        if kind not in seen_kinds:
            seen_kinds.add(kind)
            if kind in {"weak_en", "gehilf"}:
                case_cases.append([candidate, "dative", candidate + "en"])
            elif kind == "baeuer":
                case_cases.append(
                    [candidate, "dative", candidate[:-5] + "bauern"]
                )
            else:
                case_cases.append([candidate, "genitive", masculine + "s"])

        if kind in {"gehilf", "koech", "baeuer", "weak_en"} and kind not in inflected_kinds:
            inflected_kinds.add(kind)
            if kind == "gehilf":
                case, inflected = "dative", candidate + "en"
            elif kind == "koech":
                case, inflected = "genitive", masculine + "s"
            elif kind == "baeuer":
                case, inflected = "dative", candidate[:-5] + "bauern"
            else:
                case, inflected = "dative", candidate + "en"
            inflected_cases.append(
                [cap(feminine), cap(inflected), case, cap(inflected)]
            )

    test = f"""import {{ describe, expect, it }} from "vitest";
import {{ mappedPluralSeparatorsRule }} from "../src/rules/mapped-plural-separators";
import {{
  mapMappedInflectedSingularPair,
  mapMappedSingular,
  mapMappedSingularPair
}} from "../src/rules/person-lexicon";
import {{
  getReviewedPersonForms,
  reviewedPersonFormCount
}} from "../src/rules/reviewed-person-forms";

describe("achtundfünfzigste Lexikon-Ausbauwelle", () => {{
  it("enthält genau den intern geprüften Exaktbestand", () => {{
    expect(reviewedPersonFormCount).toBe(222);
    for (const base of ["robot", "alphabet", "oktober", "fantasieanalyst"]) {{
      expect(getReviewedPersonForms(base), base).toBeUndefined();
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
{ts_rows(inflected_cases)}
  ] as const)(
    "erkennt das flektierte Paar %s/%s im Kasus %s",
    (feminine, masculine, grammaticalCase, expected) => {{
      expect(
        mapMappedInflectedSingularPair(feminine, masculine, grammaticalCase)
      ).toBe(expected);
    }}
  );
}});
"""
    (ROOT / "tests/lexicon-person-forms-wave-58.test.ts").write_text(
        test, encoding="utf-8"
    )


if __name__ == "__main__":
    main()
