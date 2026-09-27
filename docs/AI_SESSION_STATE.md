# AI Session State

Stand: 2026-09-27  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `513ea3bedfe3e6b5af30f966e6c59545f58793cc`
- Letzte Produktänderung: PR #238 „Lexikon: vierundfünfzigste konservative Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 54
- PR #238: Kernprüfung, Gecko CI, Chromium CI, CodeQL, GitHub Advanced Security und Sammelcheck grün.
- Es wurde weiterhin **keine** generische `-log`- oder ähnliche Suffixregel ergänzt. Neue Personenformen werden nur als explizite, geprüfte `exact`-Mappings übernommen.

## Abgeschlossener KldB/DKZ-Common-Block

Die Review-Queue `kldb-common-2026` bleibt vollständig abgeschlossen:

- 96 Kandidaten insgesamt
- 93 angenommen
- 3 verworfen
- 0 offen
- Status: `completed`
- Letzte Produktwelle dieses Blocks: Welle 53 / PR #235

Die drei verworfenen Kandidaten bleiben `steuer`, `möller` und `polster`.

## Aktiver kldb-current-Pilotreview

Aus den 1.995 in `kldb-current` als unbekannt geführten Kandidaten wurden zunächst die 96 bereits im Common-Block entschiedenen Fälle abgezogen. Damit blieben 1.899 wirklich neue Kandidaten.

Der erste reproduzierbare Priorisierungsbatch wurde konservativ gebildet:

- nur Kandidaten mit stark personenkennzeichnenden Endgliedern,
- innerhalb dieser Klasse alphabetische Reihenfolge,
- 342 priorisierbare Kandidaten,
- Pilotbatch: erste 20 Kandidaten.
- Selektionscommit im privaten Datastore: `541a357338e2a229c95fdbe623113e30638a2d59`

Der öffentliche Review-Workflow wurde mit PR #237 um priorisierte `kldb-current`-Queues erweitert:

- Merge-Commit: `03f6f5eb57ff2df5d497a26cfef02faae5d2d6d4`
- Reviewlauf: `36313347985`
- Ergebnis: erfolgreich
- Privater Evidenzcommit: `71ffa13ef11ba5d3751d5af5a6ac6c394fdeb647`
- Keine automatische Freigabe.

Aktueller Pilotstand:

- 20 Kandidaten insgesamt
- 6 angenommen und in Welle 54 übernommen
- 0 verworfen
- 14 offen
- Status: `in_progress`

Welle 54 übernahm:

- Akrobat
- Aktienanalyst
- Aktuar
- Altbierbrauer
- Anatom
- Anästhesist

Für alle 14 verbleibenden Pilotkandidaten liegt bereits ein direkter Berufsbeleg im BA-Schlüsselverzeichnis Stand 02/2026 vor. Vor einer Produktübernahme wird die Flexion des jeweiligen Endglieds weiterhin einzeln abgesichert.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für die aktive Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-current-priority-1-summary.json`
3. `sprachverstand/derived/review/kldb-current-priority-1-manual-decisions.json`
4. `sprachverstand/derived/candidates/kldb-current-priority-1-selection.json`
5. `sprachverstand/sources/registry.json`

Letzter privater Checkpoint:

- Generic-Datastore PR #27
- Merge-Commit: `8893eef15a924565d5c3099bd95f8da85113f06d`
- Aktiver Review: `kldb-current-priority-1`
- Kein technischer Blocker

Private Rohquellen, URLs und Herkunftsmetadaten bleiben außerhalb des öffentlichen Produkt-Repositories.

## Quellenabdeckung

Aktuelle DKZ-Baseline vor der neuen Pilotarbeit:

- 10.404 beobachtete eindeutige Kandidaten
- 8.409 bereits bekannt
- 1.995 als unbekannt geführt
- Coverage: 80,82 %

Die Coverage wird erst nach einem neuen reproduzierbaren Coverage-Lauf aktualisiert; die sechs neuen Produktmappings werden nicht manuell in die Prozentzahl hineingerechnet.

## Nächste Arbeitseinheit

Den aktiven Pilotbatch `kldb-current-priority-1` abschließen:

1. Die 14 verbleibenden Kandidaten weiterprüfen.
2. Semantik ist durch direkten BA-Berufsbeleg bereits abgesichert.
3. Flexion anhand der Endglieder `Bauer`, `Gehilfe`, `Drucker`, `Akquisiteur`, `Schreiner` und `Koch` einzeln verifizieren.
4. Nur vollständig abgesicherte Teilmengen in weitere konservative Produktwellen übernehmen.
5. Danach die 20er Pilotreview abschließen und erst anschließend den nächsten reproduzierbaren `kldb-current`-Batch ableiten.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat **zuerst diese Datei lesen**.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten aktiven Review-Dateien lesen.
- Diese Git-Checkpoints haben Vorrang vor alten Chats, Projektdateien, Anhängen und historischen Formulierungen wie „als Nächstes“.
- Alte Teilstränge dürfen nicht allein deshalb fortgesetzt werden, weil eine frühere Datei mit einem offenen nächsten Schritt endet.
- Pale Moon ist derzeit **kein aktiver Arbeitsstrang** und wird nur wieder aufgenommen, wenn er ausdrücklich neu priorisiert wird.
- Der Chat-/Toolverlauf ist nicht der Projektzustand; der kanonische Zustand liegt in Git.
