# AI Session State

Stand: 2026-09-23
Autorität: `main`

## Abgeschlossene Arbeitseinheit

- Die Quellenimport-Ausführung wurde vom privaten `Generic-Datastore` in das öffentliche Repository `HyperCriSiS/Sprachverstand` verlagert.
- PR #212 wurde gemergt; öffentlicher Workflow-/Dokumentationscommit: `ace360dd9947749def73b5f7c083cae18d1dfa02`.
- Neuer Workflow: `.github/workflows/source-ingest.yml`.
- Der Workflow nutzt GitHub-hosted `ubuntu-latest` im öffentlichen Repository und richtet Node.js 24 ein.
- Private Quellen, Registry, Importskripte, Rohdaten und Ergebnisse bleiben im `Generic-Datastore`.
- Es werden keine privaten Actions-Artefakte im öffentlichen Repository hochgeladen.
- Die private Quell-URL wird vor dem eigentlichen Import für öffentliche Logs maskiert.
- Öffentlicher Testlauf `35918132129` erhielt erfolgreich einen Runner und erreichte Checkout, Node.js-Setup sowie Produktabhängigkeiten.
- Der Test stoppte ausschließlich am fehlenden Actions-Secret `GENERIC_DATASTORE_TOKEN`.
- Der obsolete private Quellenimport-Workflow wurde aus dem `Generic-Datastore` entfernt.
- Privater Datastore-Checkpoint nach Bereinigung: `94b9fa14c96985663d0da4855173a96eaf2a351c`.

## Einziger aktueller Blocker

Einmalig im Repository `HyperCriSiS/Sprachverstand` das Actions-Secret `GENERIC_DATASTORE_TOKEN` hinterlegen.

Benötigt wird ein Fine-grained Token mit:

- Repository-Zugriff ausschließlich auf `HyperCriSiS/Generic-Datastore`
- `Contents: Read and write`

## Nächste Arbeitseinheit

Sobald das Secret vorhanden ist:

1. öffentlichen Workflow `Quellenimport` mit `kldb-snapshot` starten,
2. Ergebnis und privaten Commit prüfen,
3. `kldb-current` starten,
4. private Kandidaten-/Coverage-/Unknown-Ergebnisse auswerten,
5. nur eindeutig abgesicherte Fälle in einer getrennten Produktwelle übernehmen.

## Arbeitsweise

- Keine erneute Runner-Architekturdiskussion: Workflow-Host ist Sprachverstand.
- Private Repositories werden nicht als Actions-Host für diese Pipeline verwendet.
- Repository und CI gezielt abfragen.
- Private Quellenmetadaten bleiben vollständig außerhalb des öffentlichen Produkt-Repositories.
- Nach der nächsten abgeschlossenen Einheit diesen Checkpoint erneut aktualisieren.
