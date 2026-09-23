# AI Session State

Stand: 2026-09-23
Autorität: `main`

## Abgeschlossene Arbeitseinheit

- Die private KldB-/DKZ-Importkette wurde gezielt gegen den dokumentierten Runner-Blocker geprüft.
- Ein erneuter Dispatch bestätigte: Der private GitHub-Hosted-Runner wird weiterhin nicht zugewiesen und kein Repository-Step startet.
- Beim Review wurden zwei bislang verdeckte Pipelinefehler gefunden und in der privaten Quellenebene korrigiert:
  - der KldB-Jahressnapshot war im Workflow nicht an dieselbe Quelle wie die private Registry gebunden;
  - das Importmanifest wurde mit einer nicht unterstützten Positionsargument-Schnittstelle aufgerufen.
- Zusätzlich wurde ein runnerunabhängiger lokaler Importpfad für KldB und DKZ ergänzt. Er nutzt die private Registry als URL-Autorität, unterstützt lokal bereitgestellte XLSX-Dateien und führt Normalisierung, Kandidatenbildung, Coverage, Unknown-Queue und SHA-256-Manifest zusammen.
- 9 gezielte Regressionstests sowie die Python-Kompilierungsprüfung waren erfolgreich.
- Keine öffentliche Produkt-, Release- oder Store-Änderung.

## Nächste Arbeitseinheit

**Priorität-1-Quellenimport KldB/DKZ tatsächlich ausführen.**

1. `docs/engineering/CURRENT-WORK.md` aus `main` lesen und `main` live verifizieren.
2. Den privaten stabilen Zustand `sprachverstand/CURRENT-STATE.json`, die Registry und den neuesten privaten Status lesen.
3. KldB-Jahressnapshot und tagesaktuelles DKZ mit dem dort dokumentierten runnerunabhängigen Importpfad ausführen.
4. Private Manifeste, Kandidaten- und Coverage-Ergebnisse auf Plausibilität und Reproduzierbarkeit prüfen.
5. Unknown-Queues gegen die Produktbaseline `af0db6c…` auswerten.
6. Nur eindeutig abgesicherte Produktkandidaten in einer getrennten Produktarbeitseinheit übernehmen.

## Arbeitsweise

- Repository und CI gezielt abfragen; keine Voll-Repo-Scans.
- CI-Zusammenfassungen zuerst, Logs nur bei fehlgeschlagenen Jobs.
- Private Quellenmetadaten bleiben außerhalb des öffentlichen Produkt-Repositories.
- Nach der nächsten größeren abgeschlossenen Einheit diesen Checkpoint wieder kompakt aktualisieren.
