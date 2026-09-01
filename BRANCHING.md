# Branching workflow

## Zielbild

`main` ist die einzige dauerhafte Produkt- und Integrationslinie.

Der bisherige `dev`-Branch ist ein Übergangsbranch und soll nach vollständiger Konsolidierung nicht mehr als Basis für neue Arbeit verwendet werden. Bestehende Arbeiten, die noch davon abhängen, werden zuerst sauber nach `main` integriert bzw. auf `main` umgestellt.

Dauerhafte Modul-, Feature- oder `staging`-Branches sind nicht vorgesehen.

## Kurzlebige Arbeitsbranches

Pro logisch zusammengehöriger Änderung wird ein eigener Branch und in der Regel ein eigener Pull Request verwendet:

- `feature/<name>` — neue Funktion
- `fix/<name>` — Fehlerbehebung
- `refactor/<name>` — strukturelle Änderung
- `test/<name>` — größere Testarbeit
- `docs/<name>` — Dokumentation/Roadmap
- `chore/<name>` — CI, Dependencies, Build und Wartung
- `hotfix/<name>` — dringender Fix
- `release/<version>` — nur temporär zur Release-Stabilisierung

Neue Branches entstehen vom aktuellen `main`, werden nach `main` gemergt und anschließend gelöscht.

Gestapelte Pull Requests sind erlaubt, wenn eine noch nicht gemergte Änderung technisch von einer anderen abhängt. Sie bleiben temporär und sind kein Ersatz für permanente Modul-Branches.

## Roadmap

Die maßgebliche Roadmap bzw. Projektplanung liegt auf `main`. Änderungen daran können Teil eines Feature-/Docs-PRs sein; ein Planungsstand, der nur auf einem Nebenbranch existiert, gilt nicht als Source of Truth.

## Hygiene

- Ein Pull Request soll eine logisch zusammenhängende Änderung enthalten.
- Unabhängige UI-, Fix-, Dependency- und Feature-Arbeit nicht in einem Branch vermischen.
- Gemergte oder ersetzte Branches löschen.
- Releases mit Git-Tags markieren; Release-Branches nicht dauerhaft behalten.
