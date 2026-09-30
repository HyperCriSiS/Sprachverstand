# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `ec0e7d904626d88d4307ec55f0565347536347c0`
- Letzte Produktänderung: PR #260 „Lexikon: zweiundsechzigste Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 62
- Welle 62 integriert 250 intern geprüfte exakte Personenbasen der regulären `-er`-Flexionsklasse.
- PR-CI sowie Post-Merge-CI einschließlich Kernprüfung, Gecko, Chromium, Sammelcheck und CodeQL sind grün.
- Es gibt weiterhin keine generische Personen-Suffixregel. Neue Personenformen werden nur über explizit geprüfte Exact-Allow-Lists bzw. `exact`-Mappings freigegeben.

## Abgeschlossene kldb-current-Blöcke

- `kldb-current-priority-1`: 20 angenommen, integriert bis Welle 55 / PR #243
- `kldb-current-priority-2`: 50 angenommen, Welle 56 / PR #247
- `kldb-current-priority-3`: 50 angenommen, Welle 57 / PR #249
- `kldb-current-priority-4`: 222 angenommen, Welle 58 / PR #252
- `kldb-current-priority-5`: 250 angenommen, Welle 59 / PR #254
- `kldb-current-priority-6`: 250 angenommen, Welle 60 / PR #256
- `kldb-current-priority-7`: 250 angenommen, Welle 61 / PR #258
- `kldb-current-priority-8`: 250 angenommen, Welle 62 / PR #260

### Priority 8 im Detail

- 250 Kandidaten
- 250 angenommen
- 0 verworfen
- 0 offen
- 0 externe Recherchefälle
- Flexionsklasse: 250 × `unchanged`
- Review-Modus: `language_model_first`
- Entscheidung: intern eindeutig als Personen-/Berufsbezeichnung; reguläre `-er`-Flexion mit unverändertem Plural
- neun bereits aus Priority 6 zurückgestellte Grenzfälle blieben ausgeschlossen
- mehrdeutige Geräte-/Sach-Endglieder wie `bohrer`, `presser`, `stanzer`, `walzer`, `wickler`, `brenner`, `sortierer`, `kopierer`, `rechner`, `zähler`, `mischer`, `spritzer`, `roller` und `tiefzieher` wurden nicht pauschal freigegeben
- Welle 62 enthält eine quellenneutrale Exact-Allow-List und 505 dedizierte Regressionen
- keine generische Suffixregel

Der zuvor abgeschlossene Block `kldb-common-2026` bleibt bei 96 Kandidaten, davon 93 angenommen und 3 verworfen.

## Kandidatenprüfung

- Externe Web-Evidenz ist **keine Freigabevoraussetzung**.
- Standard ist `language_model_first`: eindeutige Formen werden intern semantisch und morphologisch geprüft.
- Quellenherkunft und lokale Paarinformationen dürfen Hinweise liefern, haben aber kein Freigabegewicht.
- Externe Recherche wird nur für echte Grenzfälle, Mehrdeutigkeiten oder widersprüchliche Befunde zugeschaltet.
- Produktseitige Sicherheitsgrenzen bleiben exakte Allow-Lists bzw. Mappings, Positiv-/Negativregressionen und vollständige CI.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-current-priority-8-summary.json`
3. `sprachverstand/derived/review/kldb-current-priority-8-manual-decisions.json`
4. `sprachverstand/sources/registry.json`

## Quellenabdeckung und verbleibender Review-Pool

Importbaseline der aktuellen DKZ:

- 10.404 beobachtete eindeutige Kandidaten
- 8.409 bereits bekannt
- 1.995 ursprünglich unbekannt
- Coverage der Importbaseline: 80,82 %

Entschieden sind inzwischen **1.438 von 1.995** ursprünglich unbekannten Kandidaten. Es verbleiben **557 noch nicht entschiedene Kandidaten**.

## Nächste Arbeitseinheit

Als nächster Block:

1. Die verbleibenden 557 Kandidaten erneut nach Wortbildungs- und Endgliedmustern gruppieren.
2. Die neun zurückgestellten Priority-6-Grenzfälle separat belassen und nicht automatisch freigeben.
3. Mehrdeutige Geräte-/Sachklassen weiterhin nicht pauschal freigeben.
4. Einen konservativen `kldb-current-priority-9`-Batch von bis zu 250 intern eindeutig personenbezogenen Formen ableiten.
5. Den Batch vollständig semantisch und morphologisch intern prüfen.
6. Nur echte Grenzfälle gezielt extern nachprüfen.
7. Produktiv weiterhin ausschließlich exakte Freigaben plus Regressionen integrieren.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Git-Checkpoints haben Vorrang vor alten Chats, Anhängen und historischen „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
