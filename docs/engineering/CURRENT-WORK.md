# Aktueller Arbeitsstand

Stand: 2026-09-30
Autorität: `main`

Diese Datei ist der kompakte operative Übergabepunkt für unterbrochene oder in einem neuen Chat fortgesetzte Arbeit.

## Produktbaseline

- Moderne Produktlinie: `main`
- Letzte integrierte Lexikon-Ausbauwelle: **58**
- Letzter integrierter Produkt-PR: **#252 — achtundfünfzigste Ausbauwelle**
- Verifizierter Produktbaseline-Commit: `8242fdbe13288208a74e30df06e8d5516fe281fc`
- Welle 58 integriert 222 intern geprüfte exakte Personenbasen sowie segmentweise Groß-/Kleinschreibung für Bindestrichkomposita.
- CI von PR #252: Kernprüfung, Gecko, Chromium, CodeQL, GitHub Advanced Security, beide Analyze-Jobs und Sammelcheck grün.
- Aktuellen `main`-HEAD bei jeder Wiederaufnahme live ermitteln.

## Aktiver Arbeitsstrom

### Priorität 1 — verbleibende KldB/DKZ-Kandidaten sprachmodellbasiert erschließen

Der Quellenimport ist abgeschlossen. `kldb-current-priority-4` ist ebenfalls vollständig abgeschlossen und in Welle 58 integriert:

- 222 Kandidaten
- 222 angenommen
- 0 verworfen
- 0 offen
- 0 externe Grenzfälle

Von den ursprünglich 1.995 unbekannten Kandidaten sind inzwischen 438 entschieden; **1.557 bleiben offen**.

Der bisherige starke Personen-Suffixselektor ist vollständig ausgeschöpft und liefert für den Restbestand **0 weitere Kandidaten**. Deshalb darf nicht einfach derselbe Selektor als Priority 5 wiederverwendet werden.

Nächster Schritt:

1. Restbestand von 1.557 Kandidaten nach Wortbildungs- und Endgliedmustern analysieren.
2. Einen breiteren konservativen Selektor bzw. reproduzierbare Kandidatengruppen definieren.
3. Bis zu 250 Kandidaten als nächsten Batch ableiten.
4. Standardmäßig intern semantisch und morphologisch prüfen.
5. Externe Recherche nur für echte Mehrdeutigkeiten oder widersprüchliche Befunde.
6. Produktiv weiterhin nur exakte Freigaben plus Regressionen; keine generische Suffixregel aus einem Batch ableiten.

## Prüfprinzip

1. Quellen liefern nur Kandidaten; ihre Herkunft hat kein Freigabegewicht.
2. Eindeutige deutsche Personenformen können ohne Webrecherche weiterverarbeitet werden.
3. Lokal vorhandene Paarinformationen sind optionaler Hinweis, keine Voraussetzung.
4. Produktseitige Sicherheitsgrenzen sind exakte Allow-Lists bzw. Mappings, Positiv-/Negativregressionen und vollständige CI.
5. Bindestrichkomposita behalten die Groß-/Kleinschreibung ihrer einzelnen Segmente.

## Optionale private Ebene

Für Kandidatengenerierung und Coverage darf `HyperCriSiS/Generic-Datastore` geladen werden. Private Rohquellen, URLs und Herkunftsmetadaten bleiben außerhalb des öffentlichen Produkt-Repositories. Herkunftsmetadaten dürfen die sprachliche Freigabeentscheidung nicht beeinflussen.

Aktuell maßgeblich:

- `sprachverstand/CURRENT-STATE.json`
- `sprachverstand/derived/review/kldb-current-priority-4-summary.json`
- `sprachverstand/derived/review/kldb-current-priority-4-manual-decisions.json`

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `sprachverstand/CURRENT-STATE.json` im privaten Datastore lesen.
4. Sprachmodell-Review ist Standard; externe Evidenz nur bei echten Grenzfällen.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.
