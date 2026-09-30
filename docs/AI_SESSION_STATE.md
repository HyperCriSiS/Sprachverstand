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

## Aktiver kldb-current-Reviewblock

Aktive Queue: `kldb-current-priority-1`

- 20 Kandidaten insgesamt
- 15 angenommen
- 0 verworfen
- 5 offen
- Status: `in_progress`
- Auswahl-Commit im privaten Datastore: `541a357338e2a229c95fdbe623113e30638a2d59`
- Evidenz-Commit: `71ffa13ef11ba5d3751d5af5a6ac6c394fdeb647`
- Letzter privater Review-Abschluss: Generic-Datastore PR #28
- Merge-Commit: `e3a7781d684f0d21e05308d92f8fd1ec446a26a5`

Neun weitere Kandidaten sind semantisch und morphologisch geprüft und für Welle 55 vorbereitet:

- Adremadrucker
- Adressendrucker
- Akquisiteur
- Akustikschreiner
- Aluminiumdrucker
- Anilindrucker
- Antikschreiner
- Anzeigenakquisiteur
- Aquarelldrucker

Die fünf verbleibenden Fälle bleiben bewusst separat offen:

- `ackerbäuer`
- `ackergehilf`
- `alleinköch`
- `almbäuer`
- `anwaltsgehilf`

Für alle fünf liegt ein direkter Berufsbeleg im BA-Schlüsselverzeichnis 02/2026 vor. Offen ist nur noch die konservative Einzelprüfung der zusammengesetzten Bauer-/Gehilfe-/Koch-Flexion.

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
4. Nach Merge privaten Reviewstand mit Produkt-PR und Merge-Commit verknüpfen.
5. Danach die fünf verbleibenden Umlaut-/Schwachflexionsfälle einzeln prüfen.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat **zuerst diese Datei lesen**.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Diese Git-Checkpoints haben Vorrang vor alten Chats, Projektdateien, Anhängen und historischen Formulierungen wie „als Nächstes“.
- Alte Teilstränge dürfen nicht allein deshalb fortgesetzt werden, weil eine frühere Datei mit einem offenen nächsten Schritt endet.
- Pale Moon ist derzeit **kein aktiver Arbeitsstrang** und wird nur wieder aufgenommen, wenn er ausdrücklich neu priorisiert wird.
- Der Chat-/Toolverlauf ist nicht der Projektzustand; der kanonische Zustand liegt in Git.
