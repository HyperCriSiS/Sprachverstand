# AI Session State

Stand: 2026-09-26  
Autorität: `main`

## Kanonischer Produktstand

- Öffentliches Repository: `HyperCriSiS/Sprachverstand`
- Produktbaseline: `b75a9f2e91fe0a6926a8069dc9f56467dc22f89f`
- Letzte Produktänderung: PR #235 „Lexikon: dreiundfünfzigste konservative Ausbauwelle“
- Abgeschlossene Lexikon-Ausbauwellen: 53
- PR #235: Kernprüfung, Gecko CI, Chromium CI, CodeQL, GitHub Advanced Security und Sammelcheck grün.
- Es wurde bewusst **keine** generische `-log`- oder ähnliche Suffixregel ergänzt. Neue Personenformen werden nur als explizite, geprüfte `exact`-Mappings übernommen.

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

Welle 53 schloss die letzten sechs Fälle ab:

- Fernheiler
- Gerontagoge
- Oecologe
- Paradontologe
- Wirtschaftsmalaiologe
- Wirtschaftssinologe

Auch ungewohnte beobachtete Schreibungen werden nur dann exakt abgebildet, wenn sie durch die Quellen als Personen-/Berufsbezeichnung gestützt sind. Sprachverstand nimmt dabei keine stillschweigende Rechtschreibnormalisierung vor.

Hinweis zur früheren Welle 48:

- `Ethnologe` und `Gynäkologe` waren bereits über das generierte Produktlexikon abgedeckt.
- Die versehentliche Doppelzählung wurde mit PR #225 und dem privaten Korrektur-PR #20 behoben.
- Sie gehören nicht zu den 93 angenommenen Entscheidungen der 96er Review-Queue.

## Privater Quellenstand

Privates Repository: `HyperCriSiS/Generic-Datastore`

Kanonische Dateien für Quellenarbeit:

1. `sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-common-2026-manual-decisions.json`
3. `sprachverstand/derived/review/kldb-common-2026-summary.json`
4. `sprachverstand/sources/registry.json`

Letzter privater Abschluss:

- Generic-Datastore PR #25
- Merge-Commit: `09e4cea9e5dd587ee772774263edf0de2a1fe19c`
- Reviewstatus: `completed`
- Kein technischer Blocker

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

## Nächste Arbeitseinheit

Der Block `kldb-common-2026` ist beendet.

Als nächste Quellenarbeit:

1. Die 1.995 noch unbekannten Kandidaten aus `kldb-current` priorisieren.
2. Daraus einen neuen, kleinen und reproduzierbaren Review-Batch ableiten.
3. Kandidaten vor Produktänderungen gegen manuelles **und** generiertes Personenlexikon prüfen.
4. Semantik und Flexion separat belegen.
5. Nur eindeutig abgesicherte Teilmengen als weitere konservative Lexikonwellen übernehmen.
6. Mehrdeutige oder nicht belegte Fälle offen lassen oder explizit verwerfen.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat **zuerst diese Datei lesen**.
- Bei Quellenarbeit danach `CURRENT-STATE.json` und die dort referenzierten privaten Review-Dateien lesen.
- Diese Git-Checkpoints haben Vorrang vor alten Chats, Projektdateien, Anhängen und historischen Formulierungen wie „als Nächstes“.
- Alte Teilstränge dürfen nicht allein deshalb fortgesetzt werden, weil eine frühere Datei mit einem offenen nächsten Schritt endet.
- Pale Moon ist derzeit **kein aktiver Arbeitsstrang** und wird nur wieder aufgenommen, wenn er ausdrücklich neu priorisiert wird.
- Der Chat-/Toolverlauf ist nicht der Projektzustand; der kanonische Zustand liegt in Git.
