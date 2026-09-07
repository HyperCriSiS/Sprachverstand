# Branching workflow

## Zielbild

`main` ist die einzige dauerhafte Produkt- und Integrationslinie für die modernen WebExtension-Ziele.

Der frühere `dev`-Branch ist nicht mehr Bestandteil des Entwicklungsworkflows und darf weder als Basis für neue Arbeit noch als Ziel für Pull Requests verwendet werden.

Die einzige bewusst dauerhafte Ausnahme ist `palemoon`. Dieser Branch enthält den technisch getrennten Goanna-/Legacy-Port und wird unabhängig von `main` gebaut und geprüft. Änderungen am Pale-Moon-Port entstehen von `palemoon` und werden wieder nach `palemoon` integriert.

Weitere dauerhafte Modul-, Feature- oder `staging`-Branches sind nicht vorgesehen.

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

Neue moderne Arbeitsbranches entstehen vom aktuellen `main`, werden nach `main` gemergt und anschließend gelöscht. Pale-Moon-spezifische Arbeitsbranches entstehen entsprechend vom aktuellen `palemoon`-Stand und werden wieder dorthin gemergt.

Gestapelte Pull Requests sind erlaubt, wenn eine noch nicht gemergte Änderung technisch von einer anderen abhängt. Sie bleiben temporär und sind kein Ersatz für permanente Modul-Branches.

## Dokumentationsautorität

Die maßgebliche Roadmap, Projektplanung und sonstige projektglobale Ist-Dokumentation liegt auf `main`. Dazu zählen insbesondere globaler Status und Prioritäten, gemeinsame Architektur-/API-Dokumentation sowie allgemeine Release-, Prozess- und Managementregeln.

Arbeitsbranches dokumentieren ihr eigenes Delta statt einen unabhängigen globalen Projektstand zu pflegen. Änderungen an kanonischen Dokumenten innerhalb eines Arbeitsbranches gelten bis zum Merge nur als vorgeschlagene Änderung und müssen vor dem Merge mit dem aktuellen `main` abgeglichen werden. Ein Planungsstand, der nur auf einem Nebenbranch existiert, ist keine Source of Truth.

`palemoon` darf Pale-Moon-spezifische Implementierungs-, Portierungs-, Kompatibilitäts- und Releaseinformationen eigenständig führen, sofern sie ausschließlich diesen technisch getrennten Port betreffen. Projektübergreifende Planung und gemeinsamer Ist-Zustand bleiben auf `main` autoritativ.

Details: `docs/engineering/PROJECT-PLAYBOOK.md`.

## Hygiene

- Ein Pull Request soll eine logisch zusammenhängende Änderung enthalten.
- Unabhängige UI-, Fix-, Dependency- und Feature-Arbeit nicht in einem Branch vermischen.
- Gemergte oder ersetzte Arbeitsbranches löschen.
- `main` und `palemoon` nicht als temporäre Experimentierzweige verwenden.
- Releases mit Git-Tags markieren; Release-Branches nicht dauerhaft behalten.
