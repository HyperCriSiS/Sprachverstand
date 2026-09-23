# Quellenimport über den öffentlichen Sprachverstand-Runner

Der Quellenimport wird im **öffentlichen Repository `HyperCriSiS/Sprachverstand`** ausgeführt. Dadurch nutzt er das GitHub-Hosted-Runner-Kontingent des öffentlichen Repositories. Der private `Generic-Datastore` bleibt ausschließlich Speicher- und Zustandsquelle für nicht öffentliche Recherche-, Quellen- und Evidenzdaten.

## Zugriff auf den privaten Datastore

Im Repository `HyperCriSiS/Sprachverstand` wird einmalig das Actions-Secret

`GENERIC_DATASTORE_TOKEN`

benötigt.

Das Token soll fein begrenzt sein:

- Repository-Zugriff ausschließlich auf `HyperCriSiS/Generic-Datastore`
- Repository permission `Contents: Read and write`
- keine zusätzlichen Berechtigungen, sofern GitHub sie nicht technisch erzwingt

Der normale `GITHUB_TOKEN` von Sprachverstand reicht nicht aus, weil er auf das Repository beschränkt ist, in dem der Workflow läuft.

## Ablauf

Der manuell gestartete Workflow `.github/workflows/source-ingest.yml`:

1. checkt den öffentlichen Sprachverstand-Stand aus,
2. richtet Node.js 24 ein und installiert die Produktabhängigkeiten,
3. checkt den privaten Datastore mit `GENERIC_DATASTORE_TOKEN` in `datastore/` aus,
4. installiert und prüft die privaten Importskripte,
5. maskiert die aus der privaten Registry gelesene Quell-URL für öffentliche Workflow-Logs,
6. führt den privaten KldB-/DKZ-Import gegen die aktuelle öffentliche Produkt-Runtime aus,
7. erlaubt Änderungen ausschließlich unter `sprachverstand/raw/`, `sprachverstand/normalized/` und `sprachverstand/derived/`,
8. committed und pusht die privaten Ergebnisse direkt nach `Generic-Datastore/main`.

Es werden **keine privaten Rohdaten als Actions-Artefakt** im öffentlichen Repository hochgeladen.

## Start

GitHub → `Sprachverstand` → Actions → `Quellenimport` → `Run workflow`.

Aktuell unterstützte Quellen:

- `kldb-snapshot`
- `kldb-current`

Weitere private Quellen werden erst ergänzt, wenn deren bestehende Importstrecke denselben Schutz gegen öffentliche Logs und Artefakte erfüllt.
