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
- Verifizierter Produktbaseline-Commit auf `main`: `38c82b08c950d9ff50a14d00869fb1fae1b80d7b`
- Bedeutung der Baseline: letzter hier verifizierter Produkt-/Regelstand; reine Dokumentations- oder Managementänderungen dürfen den aktuellen `main`-HEAD darüber hinaus fortschreiben.
- Aktueller `main`-HEAD: bei jeder Wiederaufnahme live ermitteln, nicht dauerhaft als selbstreferenzielle Sollbedingung in dieser Datei festschreiben.
- Letzte integrierte Lexikon-Ausbauwelle: **43**
- Letzter dazugehöriger Produkt-PR: **#207**
- Pale Moon: technisch getrennte Produktlinie; **nicht aktiver Arbeitsstrom**, solange er hier nicht ausdrücklich genannt wird.

## Aktive Produktarbeit

### PR #208 — Regeln: KorAP-2026-II-Kurzformen ergänzen

- Branch: `feat/korap-2026-ii-kurzformen`
- Basis: `main` bei `38c82b08c950d9ff50a14d00869fb1fae1b80d7b`
- Status: Draft, mergebar
- Verifizierter Head: `f025cb8a0606df905e1ca2f4bcea755cc0231f44`
- Prüfstand: alle 9 gemeldeten Checks erfolgreich
- Nächster Schritt: Inhalt gegen den aktuellen `main`-Stand abschließend prüfen, danach bei unverändert grünen Gates zur Integration vorbereiten.
- Keine Release- oder Store-Aktion als Teil dieses Arbeitsstroms.

## Optionale nicht öffentliche Quellen-/Evidenzebene

Standard: **nicht laden**.

Diese Ebene wird nur benötigt bei:

- Quellenimport oder Quellenaktualisierung,
- Quellenaudit,
- Provenienz- oder Lizenzprüfung,
- Kandidatengenerierung,
- Coverage-, Frequenz- oder Evidenzauswertung.

Wenn eine solche Aufgabe vorliegt und autorisierter Zugriff auf private Repositories vorhanden ist:

1. in den zugänglichen privaten Repositories nach einer Projektzuordnung zu `HyperCriSiS/Sprachverstand` suchen,
2. den dort ausgewiesenen stabilen Projektzustand `sprachverstand/CURRENT-STATE.json` lesen,
3. dessen Quellen-/Pipeline-Status gegen den aktuellen öffentlichen Produktstand abgleichen,
4. keine privaten Rohquellen, URLs, Herkunftsmetadaten oder geschützten Evidenzdaten in dieses öffentliche Repository kopieren.

Für Feature-, UI-, Bugfix-, Refactoring-, Browser-Kompatibilitäts-, Release- und allgemeine Wartungsaufgaben wird diese Ebene nicht automatisch aufgelöst.

## Staleness-Regel

Wenn diese Datei einem verifizierten Live-Zustand widerspricht, ist das ein dokumentierter Drift. Den Checkpoint zuerst mit dem Live-Zustand versöhnen; nicht raten, welcher alte Branch oder Chat gemeint war.
