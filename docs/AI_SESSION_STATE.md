# AI Session State

Stand: 2026-09-26  
Autorität: `main`

## Abgeschlossene Arbeitseinheit

- Die private KldB/DKZ-Quellenpipeline ist funktionsfähig; aktuell gibt es keinen technischen Blocker.
- `kldb-snapshot` und `kldb-current` wurden erfolgreich über `.github/workflows/source-ingest.yml` importiert.
- Die private Evidenzreview läuft über `.github/workflows/source-review.yml`.
- Die gemeinsame KldB/DKZ-Review umfasste ursprünglich 96 Kandidaten.
- PR #215 „Lexikon: vierundvierzigste konservative Ausbauwelle“ wurde gemergt.
- PR #217 „Lexikon: fünfundvierzigste konservative Ausbauwelle“ wurde gemergt.
- PR #219 „Lexikon: sechsundvierzigste konservative Ausbauwelle“ wurde gemergt.
- PR #221 „Lexikon: siebenundvierzigste konservative Ausbauwelle“ wurde gemergt.
- PR #223 „Lexikon: achtundvierzigste konservative Ausbauwelle“ wurde gemergt.
- PR #225 korrigierte anschließend zwei redundante manuelle Welle-48-Einträge; `Ethnologe` und `Gynäkologe` bleiben über das generierte Produktlexikon vollständig abgedeckt und gehören nicht zur 96er `kldb-common-2026`-Queue.
- Produktbaseline nach der Korrektur: `30aa8db38b2e0a61c17bc16968d0a5a1a2ac17e9`.
- Für PR #225 waren Kernprüfung, Gecko CI, Chromium CI, CodeQL und GitHub Advanced Security grün.
- Der korrigierte private Review-/Resume-Stand wurde über Generic-Datastore PR #20 gemergt; privater Merge-Commit: `407e60f696115436118c781ee7964ebfe42d5f9e`.
- Es wurde weiterhin bewusst **keine** generische `-log`- oder ähnliche Suffixregel ergänzt. Alle manuellen Übernahmen sind explizite Personenstämme mit exaktem Stammabgleich.

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
- Von den 96 gemeinsamen Review-Kandidaten sind jetzt:
  - 47 angenommen,
  - 3 verworfen,
  - 46 offen.
- Welle 44 übernahm:
  - Astrolog,
  - Dekorateur,
  - Indolog,
  - Kinesiolog,
  - Kryptolog,
  - Lotse,
  - Metallurge,
  - Museolog,
  - Politolog.
- Welle 45 übernahm:
  - Orthopäde,
  - Podologe,
  - Urologe,
  - Kardiologe,
  - Neurologe,
  - Hämatologe,
  - Gastroenterologe,
  - Immunologe,
  - Physiologe,
  - Pharmakologe.
- Welle 46 übernahm:
  - Bakteriologe,
  - Endokrinologe,
  - Entomologe,
  - Etymologe,
  - Gemmologe,
  - Genealoge,
  - Gerontologe,
  - Kriminologe,
  - Limnologe,
  - Ornithologe.
- Welle 47 übernahm:
  - Turkologe,
  - Toxikologe,
  - Radiologe,
  - Pneumologe,
  - Philologe,
  - Parasitologe,
  - Paläontologe,
  - Glaziologe,
  - Lichenologe,
  - Hungarologe.
- Welle 48 übernahm aus der gemeinsamen Review-Queue:
  - Dermatologe,
  - Epidemiologe,
  - Hydrologe,
  - Mineraloge,
  - Mykologe,
  - Nephrologe,
  - Klimatologe,
  - Histologe.
- `Ethnologe` und `Gynäkologe` sind unabhängig davon bereits über das generierte Produktlexikon abgedeckt.
- Bewusst verworfen bleiben:
  - Steuer,
  - Möller,
  - Polster.

## Private Autorität für Quellenarbeit

Für Quellen-, Evidenz- und Kandidatenarbeit anschließend lesen:

1. `HyperCriSiS/Generic-Datastore:sprachverstand/CURRENT-STATE.json`
2. `sprachverstand/derived/review/kldb-common-2026-summary.json`
3. `sprachverstand/derived/review/kldb-common-2026-manual-decisions.json`

Private Rohquellen, URLs und Herkunftsmetadaten bleiben vollständig außerhalb des öffentlichen Produkt-Repositories.

## Nächste Arbeitseinheit

1. Die verbleibenden 46 Kandidaten in kleinen manuellen Evidenzpaketen weiterprüfen.
2. Zuerst Kandidaten mit direkten Personen-/Berufstreffern priorisieren.
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
