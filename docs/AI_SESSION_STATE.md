# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `1fc46b0a9fd37f61e931178cc5489e152f30e25a`
- Letzte Produktänderung: PR #249 „Lexikon: siebenundfünfzigste konservative Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 57
- PR #249: Kernprüfung, Gecko CI, Chromium CI, CodeQL, GitHub Advanced Security, beide Analyze-Jobs und Sammelcheck grün.
- Es gibt weiterhin keine generische Personen-Suffixregel. Neue Personenformen werden nur als explizite, geprüfte `exact`-Mappings übernommen.

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
- BA-Paar für jeden Kandidaten vorhanden
- externe Wikidata-/Wikipedia-Evidenz über den öffentlichen Quellenreview erzeugt
- Flexion ausschließlich über bereits abgesicherte Kopfwortklassen
- `Fraud-Analyst:innen` war historisch als mehrdeutiger Restfall eingefroren; Priority 3 liefert nun BA-Paar sowie exakte Wikidata- und Wikipedia-Evidenz, deshalb wurde diese alte Negativ-Regression gezielt aufgehoben.
- vollständig in Welle 57 integriert
- Integrations-PR: #249

Der zuvor abgeschlossene Block `kldb-common-2026` bleibt unverändert bei 96 Kandidaten, davon 93 angenommen und 3 verworfen.

## Kandidatenprüfung

- Externe Web-Evidenz ist **keine Freigabevoraussetzung mehr**. KldB, ESCO und andere Quellen dienen nur als Kandidatenlieferanten.
- Standard ist `language_model_first`: Kandidaten werden semantisch und morphologisch intern geprüft; eindeutige Formen dürfen ohne Wikidata-, Wikipedia-, Duden- oder DWDS-Recherche in die Produktprüfung gehen.
- Lokal vorhandene Paarinformationen dürfen als Hinweis genutzt werden, sind aber keine Pflicht.
- Externe Recherche wird nur noch für echte Grenzfälle, Mehrdeutigkeiten oder widersprüchliche Befunde zugeschaltet.
- Der Standardbatch für `kldb-current` wird von 50 auf 250 erhöht; die produktive Aufnahme bleibt durch exakte Mappings und Regressionstests abgesichert.

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

Abgeschlossene Entscheidungen aus dem unbekannten Pool:

- `kldb-current-priority-1`: 20
- `kldb-current-priority-2`: 50
- `kldb-current-priority-3`: 50

Zusammen mit den zuvor ausgeschlossenen 96 `kldb-common-2026`-Entscheidungen sind 216 Kandidaten entschieden. Im priorisierten `kldb-current`-Review-Pool verbleiben 1.779 noch nicht entschiedene Kandidaten.

## Nächste Arbeitseinheit

Als nächster Quellenblock:

1. `kldb-current-priority-4` mit bis zu 250 Kandidaten reproduzierbar ableiten und bereits entschiedene Kandidaten ausschließen.
2. Den gesamten Batch intern semantisch und morphologisch prüfen.
3. Eindeutige Kandidaten ohne externe Webrecherche für exakte Produkt-Mappings vorbereiten.
4. Nur echte Grenzfälle separat markieren und bei Bedarf gezielt extern nachprüfen.
5. Positiv-/Negativregressionen und die vollständige Produktprüfung ausführen.
6. Keine generische Suffixregel allein aus dem Batch ableiten.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat zuerst diese Datei lesen.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Diese Git-Checkpoints haben Vorrang vor alten Chats, Projektdateien, Anhängen und historischen Formulierungen wie „als Nächstes“.
- Alte Teilstränge dürfen nicht allein deshalb fortgesetzt werden, weil eine frühere Datei mit einem offenen nächsten Schritt endet.
- Pale Moon ist derzeit kein aktiver Arbeitsstrang und wird nur wieder aufgenommen, wenn er ausdrücklich neu priorisiert wird.
- Der Chat-/Toolverlauf ist nicht der Projektzustand; der kanonische Zustand liegt in Git.
