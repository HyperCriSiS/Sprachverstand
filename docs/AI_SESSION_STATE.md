# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `09179e6d8c384a170003c438966de80f8a9f8d3c`
- Letzte Produktänderung: PR #261 „DOM-Verarbeitung für dynamische Framework-Seiten härten“
- Abgeschlossene Lexikon-Ausbauwellen: 64
- PR #266: Kernprüfung, Gecko CI, Chromium CI, CodeQL, GitHub Advanced Security, beide Analyze-Jobs und Sammelcheck grün.
- Welle 64 integriert ausschließlich eine quellenneutrale Exact-Allow-List; es gibt weiterhin keine generische Personen-Suffixregel.
- PR #261 ist als Squash-Commit `09179e6d8c384a170003c438966de80f8a9f8d3c` auf `main` integriert.

## DOM-/Framework-Härtung (PR #261)

- Framework-Hydrierung: überlappende Mutation-Roots werden vor der Verarbeitung konsolidiert.
- Große dynamische Teilbäume werden mit einem Zeitbudget über mehrere Tasks verteilt.
- Eigene MutationObserver-Rückläufer werden unterdrückt; wiederholte externe Text-Rewrites erhalten einen kurzen Backoff.
- Entfernte Teilbäume und entfernte Elemente mit ausstehender Attributarbeit werden nicht weiterverarbeitet.
- Offene Shadow Roots werden beobachtet und verarbeitet; geschlossene Shadow Roots bleiben unangetastet.
- Regression `Technoliebhaber:innen` ist über die sichere `Liebhaber`-Pluralform abgedeckt.
- Deterministische Performance-Garantie: `overlapping-roots-1500` benötigt genau einen Root-Durchlauf statt zuvor 3.001.
- GitHub-Actions-Messung: Median dieses Hydrierungsfalls von 39,804 ms auf 20,457 ms reduziert (rund 49 %); absolute Zeitwerte dienen wegen Runner-Schwankungen nur der Beobachtung.
- PR-CI: Kernprüfung, Performance, Gecko CI, Chromium CI, Sammelcheck, GitHub Advanced Security und beide CodeQL/Analyze-Prüfungen grün.

## Abgeschlossene kldb-current-Blöcke

- `kldb-current-priority-1`: 20 angenommen, integriert bis Welle 55 / PR #243
- `kldb-current-priority-2`: 50 angenommen, Welle 56 / PR #247
- `kldb-current-priority-3`: 50 angenommen, Welle 57 / PR #249
- `kldb-current-priority-4`: 222 angenommen, Welle 58 / PR #252
- `kldb-current-priority-5`: 250 angenommen, Welle 59 / PR #254
- `kldb-current-priority-6`: 250 angenommen, Welle 60 / PR #256
- `kldb-current-priority-7`: 250 angenommen, Welle 61 / PR #258
- `kldb-current-priority-8`: 250 angenommen, Welle 62 / PR #260
- `kldb-current-priority-9`: 246 angenommen, Welle 63 / PR #264
- `kldb-current-priority-10`: 20 angenommen, Welle 64 / PR #266

### Priority 10 im Detail

- 20 Kandidaten
- 20 angenommen
- 0 verworfen
- 0 offen
- 0 externe Recherchefälle
- vollständig mit `language_model_first` geprüft
- Flexionsklassen:
  - `unchanged`: 18
  - `plural_e`: 2
- bewusst kleine Einzelfallwelle; kein künstliches Auffüllen
- bekannte Priority-6-Grenzfälle und mehrdeutige Geräte-/Sachklassen bleiben ausgeschlossen
- Welle 64 enthält eine Exact-Allow-List plus Positiv-, Negativ-, Paar-, Kasus- und Bindestrichregressionen
- Merge-Commit: `2f69a81991ce0c126878efe0f2ec553e35dbd3eb`

Der zuvor abgeschlossene Block `kldb-common-2026` bleibt bei 96 Kandidaten, davon 93 angenommen und 3 verworfen.

## Kandidatenprüfung

- Externe Web-Evidenz ist **keine Freigabevoraussetzung**.
- Standard ist `language_model_first`: eindeutige Formen werden intern semantisch und morphologisch geprüft.
- Quellenherkunft und lokale Paarinformationen dürfen Hinweise liefern, haben aber kein Freigabegewicht.
- Externe Recherche wird nur für echte Grenzfälle, Mehrdeutigkeiten oder widersprüchliche Befunde zugeschaltet.
- Produktseitige Sicherheitsgrenzen bleiben exakte Allow-Lists bzw. Mappings, Positiv-/Negativregressionen und vollständige CI.
- Ein Batch darf keine generische Suffixfreigabe implizieren.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-current-priority-10-summary.json`
3. `sprachverstand/derived/review/kldb-current-priority-10-manual-decisions.json`
4. `sprachverstand/sources/registry.json`

## Quellenabdeckung und verbleibender Review-Pool

Importbaseline der aktuellen DKZ:

- 10.404 beobachtete eindeutige Kandidaten
- 8.409 bereits bekannt
- 1.995 ursprünglich unbekannt
- Coverage der Importbaseline: 80,82 %

Entschieden sind inzwischen **1.704 von 1.995** ursprünglich unbekannten Kandidaten. Es verbleiben **291 noch nicht entschiedene Kandidaten**.

Der Restpool wird weiterhin stark von bewusst mehrdeutigen Maschinen-/Sach-Endgliedern dominiert, insbesondere `-bohrer`, `-presser`, `-stanzer`, `-walzer`, `-wickler`, `-brenner`, `-sortierer`, `-kopierer`, `-rechner`, `-mischer` und `-spritzer`.

Die neun bereits in Priority 6 zurückgestellten Grenzfälle bleiben weiterhin separat offen.

## Nächste Arbeitseinheit

1. Die verbleibenden 291 Kandidaten einzeln bzw. in kleinen semantisch klaren Gruppen prüfen.
2. Keine breite Suffixfreigabe über die dominierenden Geräte-/Sachklassen legen.
3. Nur intern eindeutige Personen-/Berufsbezeichnungen in einen möglichen `kldb-current-priority-11` aufnehmen; der Batch darf sehr klein sein.
4. Morphologisch ungewöhnliche oder semantisch mehrdeutige Formen zurückstellen.
5. Externe Recherche nur für echte Grenzfälle oder widersprüchliche Befunde.
6. Produktiv weiterhin ausschließlich exakte Freigaben plus Regressionen integrieren.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Git-Checkpoints haben Vorrang vor alten Chats, Anhängen und historischen „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
