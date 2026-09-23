# Aktueller Arbeitsstand

Stand: 2026-09-23
Autorität: `main`

Diese Datei ist der kompakte operative Übergabepunkt für unterbrochene oder in einem neuen Chat fortgesetzte Arbeit. `ROADMAP.md` enthält strategische Ziele; Branches und Pull Requests dokumentieren ihr jeweiliges Änderungsdelta.

## Wiederaufnahmeprotokoll

1. Diese Datei immer aus `main` lesen.
2. Den aktuellen `main`-HEAD live lesen und die angegebene Produktbaseline sowie alle referenzierten Live-Refs gegen GitHub verifizieren.
3. Nur die hier als aktiv markierten Arbeitsströme fortsetzen, sofern der Nutzer nicht ausdrücklich umpriorisiert.
4. Nicht aus dem zuletzt aktualisierten Branch, PR, Chat oder Toolverlauf auf die aktive Arbeit schließen.
5. Optionale nicht öffentliche Zustände nur bei den unten definierten Aufgabenklassen auflösen.
6. Nach einem logisch abgeschlossenen Integrations- oder Entscheidungsstand diesen Checkpoint zeitnah aktualisieren.

## Produktbaseline

- Moderne Produktlinie: `main`
- Verifizierter Produktbaseline-Commit auf `main`: `af0db6c266e933920a00456c035569c107438f16`
- Aktueller öffentlicher Workflow-/Dokumentationsstand: `ace360dd9947749def73b5f7c083cae18d1dfa02`
- Bedeutung der Produktbaseline: letzter hier verifizierter Produkt-/Regelstand; reine CI-, Dokumentations- oder Managementänderungen dürfen den aktuellen `main`-HEAD darüber hinaus fortschreiben.
- Aktueller `main`-HEAD: bei jeder Wiederaufnahme live ermitteln.
- Letzte integrierte Lexikon-Ausbauwelle: **43**
- Letzter integrierter Produkt-PR: **#208 — KorAP-2026-II-Kurzformen**
- Pale Moon: technisch getrennte Produktlinie; **nicht aktiver Arbeitsstrom**, solange er hier nicht ausdrücklich genannt wird.

## Aktiver Arbeitsstrom

### Priorität 1 — KldB/DKZ über den öffentlichen Sprachverstand-Runner importieren

Die Runner-Architektur ist geklärt und umgesetzt:

- GitHub-Actions-Host ist **ausschließlich das öffentliche Repository `HyperCriSiS/Sprachverstand`**.
- Workflow: `.github/workflows/source-ingest.yml`
- Runner: GitHub-hosted `ubuntu-latest`
- Der private `Generic-Datastore` hält Quellen, Registry, Importskripte und Ergebnisse, aber **keinen eigenen Import-Workflow mehr**.
- Öffentlicher Testlauf `35918132129` erhielt sofort einen Runner und erreichte erfolgreich Checkout, Node.js 24 und `npm ci`.
- Der Lauf stoppte ausschließlich beim expliziten Auth-Check, weil das Actions-Secret `GENERIC_DATASTORE_TOKEN` noch fehlt.

### Einziger aktueller Blocker

Im öffentlichen Repository `HyperCriSiS/Sprachverstand` muss einmalig das Actions-Secret

`GENERIC_DATASTORE_TOKEN`

hinterlegt werden.

Erforderliche Berechtigung:

- Fine-grained Token
- Repository-Zugriff nur auf `HyperCriSiS/Generic-Datastore`
- `Contents: Read and write`
- keine unnötigen Zusatzrechte

Danach ohne weitere Architekturarbeit:

1. `kldb-snapshot` über den öffentlichen Workflow ausführen,
2. `kldb-current` ausführen,
3. private Manifeste, Kandidaten, Coverage und Unknown-Queues prüfen,
4. eindeutig abgesicherte Produktkandidaten erst in einer getrennten Produktarbeitseinheit übernehmen.

Keine privaten Rohdaten, Quell-URLs oder Herkunftsmetadaten dürfen in das öffentliche Repository oder in öffentliche Actions-Artefakte gelangen.

## Optionale nicht öffentliche Quellen-/Evidenzebene

Standard für normale Produktarbeit: **nicht laden**.

Für Quellenimport, Quellenaudit, Provenienz/Lizenzprüfung, Kandidatengenerierung sowie Coverage-/Evidenzauswertung ist die private Ebene relevant.

Bei autorisiertem Zugriff:

1. privaten stabilen Zustand `sprachverstand/CURRENT-STATE.json` lesen,
2. Registry und neuesten privaten Status lesen,
3. privaten Pipeline-Status gegen die öffentliche Produktbaseline abgleichen,
4. private Daten ausschließlich im `Generic-Datastore` halten.

Aktuell verifizierter privater `main` nach Host-Bereinigung: `94b9fa14c96985663d0da4855173a96eaf2a351c`.

## Staleness-Regel

Wenn diese Datei einem verifizierten Live-Zustand widerspricht, ist das dokumentierter Drift. Den Checkpoint zuerst mit dem Live-Zustand versöhnen; nicht raten.
