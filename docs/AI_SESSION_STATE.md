# AI Session State

Stand: 2026-09-25  
Autorität: `main`

## Abgeschlossene Arbeitseinheit

- Der frühere Blocker `GENERIC_DATASTORE_TOKEN` ist erledigt. Der öffentliche Quellenimport kann auf den privaten `HyperCriSiS/Generic-Datastore` zugreifen.
- `kldb-snapshot` und `kldb-current` wurden erfolgreich über `.github/workflows/source-ingest.yml` importiert.
- Die neue private Quellenreview läuft über `.github/workflows/source-review.yml`.
- Zwei isolierte Fehler der Review-Pipeline wurden im privaten Datastore behoben:
  - veraltete Wikidata-Resilienztests an den aktuellen `hole_json()`-Vertrag angepasst,
  - Wikipedia-Titelsuche von deaktiviertem `srwhat=title` auf CirrusSearch-`intitle:` umgestellt.
- Öffentlicher Review-Lauf `36168435763` war vollständig erfolgreich und schrieb die Evidenz privat fest.
- Die gemeinsame KldB/DKZ-Review umfasste 96 Kandidaten:
  - 9 semantisch und morphologisch abgesichert,
  - 3 Scheinbelege verworfen,
  - 84 weiterhin offen.
- Es wurde bewusst **keine** generische `-log`- oder ähnliche Suffixregel ergänzt. Die Übernahmen bleiben auf explizite Personenstämme mit exaktem Stammabgleich begrenzt.
- PR #215 „Lexikon: vierundvierzigste konservative Ausbauwelle“ wurde gemergt.
- Produktbaseline nach PR #215: `93b260566f53eb8e1753d4b8acd2697f8a75568d`.
- Kernprüfung, Gecko CI, Chromium CI und CodeQL waren für PR #215 grün.
- Der private Review-/Resume-Stand wurde über Generic-Datastore PR #15 gemergt; privater Merge-Commit: `d542d40093b33ce7d0265dc317b4a35bbf6f7c20`.

## Aktueller Quellenstand

- KldB-Snapshot:
  - 157 beobachtete eindeutige Kandidaten,
  - 61 bereits bekannt,
  - 96 zunächst unbekannt,
  - Coverage 38,85 %.
- Aktuelle DKZ:
  - 10.404 beobachtete eindeutige Kandidaten,
  - 8.409 bereits bekannt,
  - 1.995 unbekannt,
  - Coverage 80,82 %.
- Von den 96 gemeinsamen Review-Kandidaten wurden in Welle 44 übernommen:
  - Astrolog,
  - Dekorateur,
  - Indolog,
  - Kinesiolog,
  - Kryptolog,
  - Lotse,
  - Metallurge,
  - Museolog,
  - Politolog.
- Bewusst verworfen wurden:
  - Steuer,
  - Möller,
  - Polster.
- 84 Kandidaten bleiben für weitere manuelle Evidenzprüfung offen.
- Es gibt aktuell keinen technischen Blocker.

## Private Autorität für Quellenarbeit

Für Quellen-, Evidenz- und Kandidatenarbeit anschließend lesen:

1. `HyperCriSiS/Generic-Datastore:sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-common-2026-summary.json`
3. `sprachverstand/derived/review/kldb-common-2026-manual-decisions.json`

Private Rohquellen, URLs und Herkunftsmetadaten bleiben vollständig außerhalb des öffentlichen Produkt-Repositories.

## Nächste Arbeitseinheit

1. Die verbleibenden 84 Kandidaten in kleinen manuellen Evidenzpaketen weiterprüfen.
2. Zuerst Kandidaten mit belastbaren Personen-/Berufstreffern priorisieren.
3. Für jeden Übernahmekandidaten Semantik und Flexion separat absichern.
4. Nur eindeutig abgesicherte Teilmengen in weiteren konservativen Lexikonwellen übernehmen.
5. Mehrdeutige oder nicht belegte Fälle offen lassen oder explizit verwerfen.
6. Nach jeder größeren abgeschlossenen Einheit diesen Checkpoint und den privaten `CURRENT-STATE.json` aktualisieren.

## Verbindliche Wiederaufnahme-Regel

- Bei einem neuen Sprachverstand-Chat **zuerst diese Datei lesen**.
- Bei Quellenarbeit danach den privaten `CURRENT-STATE.json` und die dort referenzierten Review-Dateien lesen.
- Diese Checkpoints haben Vorrang vor alten Chats, Projektdateien, Anhängen und historischen Formulierungen wie „als Nächstes“.
- Alte Teilstränge dürfen nicht allein deshalb fortgesetzt werden, weil eine frühere Datei mit einem offenen nächsten Schritt endet.
- Pale Moon ist derzeit **kein aktiver Arbeitsstrang** und wird nur wieder aufgenommen, wenn er ausdrücklich neu priorisiert wird.
- Der Chat-/Toolverlauf ist nicht der Projektzustand; der kanonische Zustand liegt in Git.
