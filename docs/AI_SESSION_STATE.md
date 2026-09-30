# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `3741d7083bcb6138554b35dcf95a2baee45b4f91`
- Letzte Produktänderung: PR #247 „Lexikon: sechsundfünfzigste konservative Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 56
- PR #247: Kernprüfung, Gecko CI, Chromium CI, CodeQL, GitHub Advanced Security, beide Analyze-Jobs und Sammelcheck grün.
- Es gibt weiterhin keine generische Personen-Suffixregel. Neue Personenformen werden nur als explizite, geprüfte `exact`-Mappings übernommen.

## Abgeschlossene kldb-current-Blöcke

### `kldb-current-priority-1`

- 20 Kandidaten
- 20 angenommen
- 0 verworfen
- 0 offen
- vollständig öffentlich integriert:
  - Welle 54: erste 6 Kandidaten
  - Welle 55: restliche 14 Kandidaten
- letzter Integrations-PR: #243

### `kldb-current-priority-2`

- 50 Kandidaten
- 50 angenommen
- 0 verworfen
- 0 offen
- für jeden Kandidaten liegt BA-Paarevidenz vor
- Flexion wurde anhand der jeweiligen Kopfwortklasse geprüft
- vollständig öffentlich integriert:
  - Welle 56: 50 exakte Mappings
- Integrations-PR: #247

Der zuvor abgeschlossene Block `kldb-common-2026` bleibt unverändert bei 96 Kandidaten, davon 93 angenommen und 3 verworfen.

## Quellenreview-Infrastruktur

- PR #244 unterstützt validierte generische Queues nach dem Muster `kldb-current-priority-N`.
- PR #245 fragt Wikidata- und Wikipedia-Evidenz parallel ab.
- Der Abstand zwischen Kandidaten bleibt je externem Dienst bei mindestens 2 Sekunden.
- Beide Evidenzprozesse müssen erfolgreich enden; Retry/Backoff und manuelle Freigabepolitik bleiben erhalten.
- Größere Batches werden nicht automatisch freigegeben.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. die dort referenzierte aktuelle Review-Zusammenfassung
3. die dort referenzierten manuellen Entscheidungen
4. `sprachverstand/sources/registry.json`

Private Rohquellen, URLs und Herkunftsmetadaten bleiben außerhalb des öffentlichen Produkt-Repositories.

## Quellenabdeckung und verbleibender Review-Pool

Importbaseline der aktuellen DKZ:

- 10.404 beobachtete eindeutige Kandidaten
- 8.409 bereits bekannt
- 1.995 ursprünglich unbekannt
- Coverage der Importbaseline: 80,82 %

Aus diesem unbekannten Pool sind inzwischen abgeschlossen:

- `kldb-current-priority-1`: 20 Entscheidungen
- `kldb-current-priority-2`: 50 Entscheidungen

Nach Ausschluss der zuvor bereits entschiedenen `kldb-common-2026`-Fälle und dieser beiden Priority-Batches verbleiben im priorisierten `kldb-current`-Review-Pool 1.829 noch nicht entschiedene Kandidaten.

## Nächste Arbeitseinheit

Als nächster Quellenblock:

1. `kldb-current-priority-3` mit standardmäßig 50 Kandidaten reproduzierbar ableiten.
2. Bereits entschiedene Kandidaten aus `kldb-common-2026`, Priority 1 und Priority 2 ausschließen.
3. BA-Paarevidenz sowie externe Wikidata-/Wikipedia-Evidenz erzeugen.
4. Alle Kandidaten einzeln semantisch und morphologisch prüfen.
5. Nur eindeutig abgesicherte Kandidaten als weitere konservative Produktwelle übernehmen.
6. Keine generische Suffixregel aus dem Batch ableiten.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Diese Git-Checkpoints haben Vorrang vor alten Chats, Projektdateien, Anhängen und historischen Formulierungen wie „als Nächstes“.
- Alte Teilstränge dürfen nicht allein deshalb fortgesetzt werden, weil eine frühere Datei mit einem offenen nächsten Schritt endet.
- Pale Moon ist derzeit kein aktiver Arbeitsstrang und wird nur wieder aufgenommen, wenn er ausdrücklich neu priorisiert wird.
- Der Chat-/Toolverlauf ist nicht der Projektzustand; der kanonische Zustand liegt in Git.
