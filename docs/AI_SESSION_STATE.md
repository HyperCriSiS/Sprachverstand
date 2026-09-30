# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `8242fdbe13288208a74e30df06e8d5516fe281fc`
- Letzte Produktänderung: PR #252 „Lexikon: achtundfünfzigste Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 58
- PR #252: Kernprüfung, Gecko CI, Chromium CI, CodeQL, GitHub Advanced Security, beide Analyze-Jobs und Sammelcheck grün.
- Es gibt weiterhin keine generische Personen-Suffixregel. Neue Personenformen werden nur als explizit geprüfte, quellenneutrale Exact-Allow-Lists bzw. `exact`-Mappings übernommen.
- Die Groß-/Kleinschreibungslogik erhält nun bei Bindestrichkomposita jedes Segment separat, z. B. `Kfz-Schlosser:innen → Kfz-Schlosser` und `Rating-Analyst:innen → Rating-Analysten`.

## Abgeschlossene kldb-current-Blöcke

### `kldb-current-priority-1`

- 20 Kandidaten
- 20 angenommen
- 0 verworfen
- 0 offen
- vollständig in Welle 54 und 55 integriert
- letzter Integrations-PR: #243

### `kldb-current-priority-2`

- 50 Kandidaten
- 50 angenommen
- 0 verworfen
- 0 offen
- vollständig in Welle 56 integriert
- Integrations-PR: #247

### `kldb-current-priority-3`

- 50 Kandidaten
- 50 angenommen
- 0 verworfen
- 0 offen
- historisch noch mit BA-Paar- und externer Evidenz geprüft
- vollständig in Welle 57 integriert
- Integrations-PR: #249

### `kldb-current-priority-4`

- 222 Kandidaten
- 222 angenommen
- 0 verworfen
- 0 offen
- 0 Kandidaten benötigten externe Recherche
- vollständig mit `language_model_first` semantisch und morphologisch geprüft
- alle Kandidaten gehören zu bereits abgesicherten Kopfwortklassen: `Gehilfe`, `Schlosser`, `Drucker`, `Koch`, `Restaurator`, `Schreiner`, `Bauer`, `Analyst`, `Revisor` oder `Brauer`
- als quellenneutrale exakte Allow-List integriert; keine generische Suffixfreigabe
- 461 dedizierte Welle-58-Regressionen einschließlich Bindestrich-Großschreibung
- vollständig in Welle 58 integriert
- Integrations-PR: #252
- Merge-Commit: `8242fdbe13288208a74e30df06e8d5516fe281fc`

Der zuvor abgeschlossene Block `kldb-common-2026` bleibt unverändert bei 96 Kandidaten, davon 93 angenommen und 3 verworfen.

## Kandidatenprüfung

- Externe Web-Evidenz ist **keine Freigabevoraussetzung**. KldB, ESCO und andere Quellen dienen nur als Kandidatenlieferanten.
- Standard ist `language_model_first`: Kandidaten werden semantisch und morphologisch intern geprüft; eindeutige Formen dürfen ohne Wikidata-, Wikipedia-, Duden- oder DWDS-Recherche in die Produktprüfung gehen.
- Lokal vorhandene Paarinformationen dürfen als Hinweis genutzt werden, sind aber keine Pflicht.
- Externe Recherche wird nur für echte Grenzfälle, Mehrdeutigkeiten oder widersprüchliche Befunde zugeschaltet.
- Produktseitige Sicherheitsgrenzen bleiben exakte Freigabelisten bzw. Mappings, Positiv-/Negativregressionen und die vollständige CI.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-current-priority-4-summary.json`
3. `sprachverstand/derived/review/kldb-current-priority-4-manual-decisions.json`
4. `sprachverstand/sources/registry.json`

Private Rohquellen, URLs und Herkunftsmetadaten bleiben außerhalb des öffentlichen Produkt-Repositories.

## Quellenabdeckung und verbleibender Review-Pool

Importbaseline der aktuellen DKZ:

- 10.404 beobachtete eindeutige Kandidaten
- 8.409 bereits bekannt
- 1.995 ursprünglich unbekannt
- Coverage der Importbaseline: 80,82 %

Abgeschlossene Entscheidungen aus dem unbekannten Pool:

- `kldb-common-2026`: 96
- `kldb-current-priority-1`: 20
- `kldb-current-priority-2`: 50
- `kldb-current-priority-3`: 50
- `kldb-current-priority-4`: 222

Damit sind 438 der ursprünglich 1.995 unbekannten Kandidaten entschieden. Es verbleiben **1.557 noch nicht entschiedene Kandidaten**.

Der bisherige starke Personen-Suffixselektor ist ausgeschöpft:

- vor Priority 4 priorisierbar: 222
- in Priority 4 vollständig verarbeitet: 222
- danach mit demselben Selektor priorisierbar: **0**

## Nächste Arbeitseinheit

Nicht einfach `kldb-current-priority-5` mit demselben Selektor erzeugen. Als nächster Quellenblock:

1. Die verbleibenden 1.557 Kandidaten nach Wortbildungs- und Endgliedmustern gruppieren.
2. Eine breitere, aber weiterhin konservative Kandidatenauswahl definieren, die keine Personenbedeutung allein aus einem Suffix behauptet.
3. Bis zu 250 Kandidaten als nächsten reproduzierbaren Batch ableiten.
4. Den gesamten Batch intern semantisch und morphologisch prüfen.
5. Eindeutige Kandidaten ohne externe Webrecherche als exakte Produktfreigaben vorbereiten.
6. Nur echte Grenzfälle separat markieren und bei Bedarf gezielt extern nachprüfen.
7. Keine generische Suffixregel allein aus dem Batch ableiten.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Diese Git-Checkpoints haben Vorrang vor alten Chats, Projektdateien, Anhängen und historischen Formulierungen wie „als Nächstes“.
- Alte Teilstränge dürfen nicht allein deshalb fortgesetzt werden, weil eine frühere Datei mit einem offenen nächsten Schritt endet.
- Pale Moon ist derzeit kein aktiver Arbeitsstrang und wird nur wieder aufgenommen, wenn er ausdrücklich neu priorisiert wird.
- Der Chat-/Toolverlauf ist nicht der Projektzustand; der kanonische Zustand liegt in Git.
