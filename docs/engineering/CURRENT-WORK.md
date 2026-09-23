# Aktueller Arbeitsstand

Stand: 2026-09-23
Autorität: `main`

Diese Datei ist der kompakte operative Übergabepunkt für unterbrochene oder in einem neuen Chat fortgesetzte Arbeit. `ROADMAP.md` enthält strategische Ziele; Branches und Pull Requests dokumentieren ihr jeweiliges Änderungsdelta.

## Wiederaufnahmeprotokoll

1. Diese Datei immer aus `main` lesen.
2. Den aktuellen `main`-HEAD live lesen und die angegebene Produktbaseline sowie alle referenzierten Live-Refs gegen GitHub verifizieren.
3. Nur die hier als aktiv markierten Arbeitsströme fortsetzen, sofern der Nutzer nicht ausdrücklich umpriorisiert.
4. Nicht aus dem zuletzt aktualisierten Branch, PR, Chat oder Toolverlauf auf die aktive Arbeit schließen.
5. Optionale nicht öffentliche Zustände nur bei den unten definierten Aufgabenklassen auflösen.
6. Nach einem logisch abgeschlossenen Integrations- oder Entscheidungsstand diesen Checkpoint zeitnah aktualisieren.

## Produktbaseline

- Moderne Produktlinie: `main`
- Verifizierter Produktbaseline-Commit auf `main`: `af0db6c266e933920a00456c035569c107438f16`
- Bedeutung der Baseline: letzter hier verifizierter Produkt-/Regelstand; reine Dokumentations- oder Managementänderungen dürfen den aktuellen `main`-HEAD darüber hinaus fortschreiben.
- Aktueller `main`-HEAD: bei jeder Wiederaufnahme live ermitteln, nicht dauerhaft als selbstreferenzielle Sollbedingung in dieser Datei festschreiben.
- Letzte integrierte Lexikon-Ausbauwelle: **43**
- Letzter integrierter Produkt-PR: **#208 — KorAP-2026-II-Kurzformen**
- PR #208 wurde nach abschließendem Review und zusätzlichen Negativregressionen gemergt.
- Nach-Merge-CI und CodeQL auf `af0db6c…`: **grün**.
- Pale Moon: technisch getrennte Produktlinie; **nicht aktiver Arbeitsstrom**, solange er hier nicht ausdrücklich genannt wird.

## Aktiver Arbeitsstrom

### Priorität 1 — KldB/DKZ runnerunabhängig importieren und Kandidaten prüfen

Dieser Arbeitsstrom ist eine Quellen-/Evidenzaufgabe. Deshalb muss bei seiner Wiederaufnahme die unten beschriebene nicht öffentliche Ebene gezielt aufgelöst werden.

- Der private GitHub-Hosted-Runner scheitert weiterhin vor dem ersten Step; der Fehler liegt damit außerhalb des Importcodes.
- Die private Quellenebene besitzt inzwischen einen lokal ausführbaren, runnerunabhängigen KldB-/DKZ-Importpfad mit Registry-basierter Quellenauswahl, Manifest und Regressionstests.
- Nächster Schritt: KldB-Jahressnapshot und tagesaktuelles DKZ über diesen Pfad importieren.
- Danach: Kandidaten und Coverage gegen die Produktbaseline `af0db6c…` berechnen und konservativ prüfen.
- Produktänderungen aus diesen Ergebnissen erfolgen ausschließlich in einer getrennten Arbeitseinheit.
- Keine Rohquellen, privaten URLs oder Herkunftsmetadaten in dieses öffentliche Repository übernehmen.
- Keine Release- oder Store-Aktion als Teil dieses Arbeitsstroms.

## Optionale nicht öffentliche Quellen-/Evidenzebene

Standard für normale Produktarbeit: **nicht laden**.

Diese Ebene wird benötigt bei:

- Quellenimport oder Quellenaktualisierung,
- Quellenaudit,
- Provenienz- oder Lizenzprüfung,
- Kandidatengenerierung,
- Coverage-, Frequenz- oder Evidenzauswertung.

Für den aktuell aktiven Priorität-1-Quellenimport ist sie daher **aktiv relevant**.

Wenn autorisierter Zugriff auf private Repositories vorhanden ist:

1. in den zugänglichen privaten Repositories nach einer Projektzuordnung zu `HyperCriSiS/Sprachverstand` suchen,
2. den dort ausgewiesenen stabilen Projektzustand `sprachverstand/CURRENT-STATE.json` lesen,
3. anschließend dessen Quellenregistry und aktuellsten abgeleiteten Status lesen,
4. den privaten Pipeline-Status gegen die aktuelle öffentliche Produktbaseline abgleichen,
5. keine privaten Rohquellen, URLs, Herkunftsmetadaten oder geschützten Evidenzdaten in dieses öffentliche Repository kopieren.

Für Feature-, UI-, Bugfix-, Refactoring-, Browser-Kompatibilitäts-, Release- und allgemeine Wartungsaufgaben wird diese Ebene weiterhin nicht automatisch aufgelöst.

## Staleness-Regel

Wenn diese Datei einem verifizierten Live-Zustand widerspricht, ist das ein dokumentierter Drift. Den Checkpoint zuerst mit dem Live-Zustand versöhnen; nicht raten, welcher alte Branch oder Chat gemeint war.
