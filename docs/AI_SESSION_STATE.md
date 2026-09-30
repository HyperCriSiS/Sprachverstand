# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `7ff05d9c75ecf76fdf1018fca3fc330c28f38930`
- Letzte Produktänderung: PR #264 „Lexikon: dreiundsechzigste Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 63
- PR #264: Kernprüfung, Gecko CI, Chromium CI, CodeQL, GitHub Advanced Security, beide Analyze-Jobs und Sammelcheck grün.
- Post-Merge auf `main`: vollständige CI und CodeQL grün.
- Es gibt weiterhin keine generische Personen-Suffixregel. Neue Personenformen werden ausschließlich als explizit geprüfte Exact-Allow-Lists bzw. `exact`-Mappings übernommen.

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

### Priority 9 im Detail

- 246 Kandidaten
- 246 angenommen
- 0 verworfen
- 0 offen
- 0 externe Recherchefälle
- vollständig mit `language_model_first` geprüft
- explizite Flexionsklassen:
  - `unchanged`: 140
  - `plural_e`: 66
  - `weak_e`: 13
  - `weak_en`: 13
  - `plural_en`: 12
  - `plural_s`: 2
- der Batch wurde bewusst bei 246 beendet statt mit schwächeren Kandidaten auf 250 aufgefüllt
- `bildmischer` wurde bei der Validierung wieder entfernt, weil die Form unter die bewusst ausgeschlossene mehrdeutige Sach-/Geräteklasse `-mischer` fällt
- die neun bereits in Priority 6 zurückgestellten Grenzfälle blieben ausgeschlossen
- Welle 63 enthält eine quellenneutrale Exact-Allow-List und 503 dedizierte Regressionen
- keine generische Suffixregel
- Merge-Commit: `7ff05d9c75ecf76fdf1018fca3fc330c28f38930`

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
2. `sprachverstand/derived/review/kldb-current-priority-9-summary.json`
3. `sprachverstand/derived/review/kldb-current-priority-9-manual-decisions.json`
4. `sprachverstand/sources/registry.json`

## Quellenabdeckung und verbleibender Review-Pool

Importbaseline der aktuellen DKZ:

- 10.404 beobachtete eindeutige Kandidaten
- 8.409 bereits bekannt
- 1.995 ursprünglich unbekannt
- Coverage der Importbaseline: 80,82 %

Entschieden sind inzwischen **1.684 von 1.995** ursprünglich unbekannten Kandidaten. Es verbleiben **311 noch nicht entschiedene Kandidaten**.

Der Restpool wird stark von bewusst mehrdeutigen Maschinen-/Sach-Endgliedern dominiert, insbesondere `-bohrer`, `-presser`, `-stanzer`, `-walzer`, `-wickler`, `-brenner`, `-sortierer`, `-kopierer`, `-rechner`, `-mischer` und `-spritzer`.

Die neun bereits in Priority 6 zurückgestellten Grenzfälle bleiben weiterhin separat offen.

## Nächste Arbeitseinheit

Als nächster Block:

1. Die verbleibenden 311 Kandidaten als Einzelfälle bzw. kleine semantisch klare Gruppen prüfen.
2. Keinen weiteren breiten Suffixselektor über die dominierenden Geräte-/Sachklassen legen.
3. Nur explizit eindeutige Personen-/Berufsbezeichnungen als `kldb-current-priority-10` aufnehmen; der Batch darf deutlich kleiner als 250 sein.
4. Ungewöhnliche oder morphologisch unsichere Formen zurückstellen statt den Batch künstlich aufzufüllen.
5. Nur echte Grenzfälle bei Bedarf extern nachprüfen.
6. Produktiv weiterhin ausschließlich exakte Freigaben plus Regressionen integrieren.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Git-Checkpoints haben Vorrang vor alten Chats, Anhängen und historischen „als Nächstes“-Formulierungen.
- Nach einer größeren abgeschlossenen Einheit diesen Checkpoint aktualisieren.
