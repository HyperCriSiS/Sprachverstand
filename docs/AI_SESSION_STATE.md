# AI Session State

Stand: 2026-09-30  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `513ea3bedfe3e6b5af30f966e6c59545f58793cc`
- Letzte Produktänderung: PR #238 „Lexikon: vierundfünfzigste konservative Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 54
- PR #238: Kernprüfung, Gecko CI, Chromium CI, CodeQL, GitHub Advanced Security und Sammelcheck grün.
- Es wurde bewusst **keine** generische Suffixregel ergänzt. Neue Personenformen werden nur als explizite, geprüfte `exact`-Mappings übernommen.

Welle 54 übernahm sechs Kandidaten aus dem ersten `kldb-current`-Pilotbatch:

- Akrobat
- Aktienanalyst
- Aktuar
- Altbierbrauer
- Anatom
- Anästhesist

## Abgeschlossener KldB/DKZ-Reviewblock

Die gemeinsame Review-Queue `kldb-common-2026` ist vollständig abgeschlossen:

- 96 Kandidaten insgesamt
- 93 angenommen
- 3 verworfen
- 0 offen
- Status: `completed`

Die drei verworfenen Kandidaten bleiben:

- `steuer`
- `möller`
- `polster`

Hinweis zur früheren Welle 48:

- `Ethnologe` und `Gynäkologe` waren bereits über das generierte Produktlexikon abgedeckt.
- Die versehentliche Doppelzählung wurde mit PR #225 und dem privaten Korrektur-PR #20 behoben.
- Sie gehören nicht zu den 93 angenommenen Entscheidungen der 96er Review-Queue.

## Abgeschlossener kldb-current-Pilotblock

Die Queue `kldb-current-priority-1` ist vollständig manuell geprüft:

- 20 Kandidaten insgesamt
- 20 angenommen
- 0 verworfen
- 0 offen
- Status: `completed`
- Auswahl-Commit im privaten Datastore: `541a357338e2a229c95fdbe623113e30638a2d59`
- Evidenz-Commit: `71ffa13ef11ba5d3751d5af5a6ac6c394fdeb647`
- Privater Abschluss: Generic-Datastore PR #29
- Merge-Commit: `95f0b1009ac986e3b4f4b55cc02508a3fb5253f1`

Sechs der 20 Kandidaten sind bereits mit Welle 54 im Produkt. Die restlichen 14 sind für zwei kleine Produktwellen vorbereitet.

### Welle 55

Neun reguläre Drucker-/Schreiner-/Akquisiteur-Fälle:

- Adremadrucker
- Adressendrucker
- Akquisiteur
- Akustikschreiner
- Aluminiumdrucker
- Anilindrucker
- Antikschreiner
- Anzeigenakquisiteur
- Aquarelldrucker

### Welle 56

Fünf separat geprüfte Bauer-/Gehilfe-/Koch-Fälle:

- Ackerbauer / Ackerbäuerin
- Ackergehilfe / Ackergehilfin
- Alleinkoch / Alleinköchin
- Almbauer / Almbäuerin
- Anwaltsgehilfe / Anwaltsgehilfin

Für alle 20 Kandidaten liegt ein direkter Berufsbeleg im BA-Schlüsselverzeichnis 02/2026 vor. Die Flexion der Restfälle wurde zusätzlich anhand der lexikografisch belegten Kopfglieder Bauer/Bäuerin, Gehilfe/Gehilfin und Koch/Köchin abgesichert.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-current-priority-1-manual-decisions.json`
3. `sprachverstand/derived/review/kldb-current-priority-1-summary.json`
4. `sprachverstand/sources/registry.json`

Private Rohquellen, URLs und Herkunftsmetadaten bleiben außerhalb des öffentlichen Produkt-Repositories.

## Quellenabdeckung

KldB-Snapshot:

- 157 beobachtete eindeutige Kandidaten
- 61 bereits bekannt
- 96 ursprünglich unbekannt
- Coverage vor der manuellen Ausbauarbeit: 38,85 %

Aktuelle DKZ:

- 10.404 beobachtete eindeutige Kandidaten
- 8.409 bereits bekannt
- 1.995 unbekannt
- Coverage: 80,82 %

Die Coverage-Werte beschreiben den Importstand vor den manuellen Produktwellen. Die akzeptierten Review-Kandidaten werden nicht stillschweigend aus diesen historischen Importstatistiken herausgerechnet.

## Nächste Arbeitseinheit

1. Welle 55 mit den neun bereits vollständig geprüften Kandidaten als exakte Produktmappings integrieren.
2. Regressionstests für Plural, Singular/Kasus und explizite Singularpaare ergänzen.
3. Produkt-PR vollständig durch Kernprüfung, Gecko CI, Chromium CI, CodeQL und GitHub Advanced Security laufen lassen.
4. Danach Welle 56 mit den fünf separat geprüften Bauer-/Gehilfe-/Koch-Fällen integrieren.
5. Nach beiden Produktwellen den privaten Reviewstand mit Produkt-PRs und Merge-Commits verknüpfen.
6. Anschließend aus den verbleibenden `kldb-current`-Unbekannten den nächsten reproduzierbaren Priority-Batch ableiten.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat **zuerst diese Datei lesen**.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Diese Git-Checkpoints haben Vorrang vor alten Chats, Projektdateien, Anhängen und historischen Formulierungen wie „als Nächstes“.
- Alte Teilstränge dürfen nicht allein deshalb fortgesetzt werden, weil eine frühere Datei mit einem offenen nächsten Schritt endet.
- Pale Moon ist derzeit **kein aktiver Arbeitsstrang** und wird nur wieder aufgenommen, wenn er ausdrücklich neu priorisiert wird.
- Der Chat-/Toolverlauf ist nicht der Projektzustand; der kanonische Zustand liegt in Git.
