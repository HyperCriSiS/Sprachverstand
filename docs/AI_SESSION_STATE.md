# AI Session State

Stand: 2026-09-23
Autorität: `main`

## Abgeschlossene Arbeitseinheit

- PR #208 (`Regeln: KorAP-2026-II-Kurzformen ergänzen`) wurde gegen den aktuellen `main`-Stand erneut geprüft, aktualisiert und gemergt.
- Beim Review wurden zwei zusätzliche Randfälle gefunden und vor dem Merge abgesichert:
  - die Sonderregel `Kaufmann/frau` ist jetzt auf ein eigenständiges Token begrenzt und normalisiert keine Bindestrich-Komposita beziehungsweise angehängten Tokenbestandteile;
  - der Kontextschutz erkennt Klammermarker wie `(IN)` und `(-IN)` auch in Großschreibung, ohne normales kleingeschriebenes `...in` pauschal als Binnen-I zu behandeln.
- Finaler Produkt-Commit: `af0db6c266e933920a00456c035569c107438f16`.
- Nach-Merge-CI: erfolgreich.
- Nach-Merge-CodeQL: erfolgreich.
- Keine Release- oder Store-Aktion.

## Nächste Arbeitseinheit

**Priorität-1-Quellenimport KldB/DKZ.**

1. `docs/engineering/CURRENT-WORK.md` aus `main` lesen und `main` live verifizieren.
2. Da dies eine Quellen-/Evidenzaufgabe ist, den privaten stabilen Zustand `sprachverstand/CURRENT-STATE.json` auflösen.
3. Private Quellenregistry und neuesten privaten Status lesen.
4. Den dort dokumentierten Import-Blocker gezielt prüfen.
5. Entweder die Runner-Ausführung zuverlässig reparieren oder eine runnerunabhängige Importstrecke verwenden.
6. Erst danach Kandidaten gegen die aktuelle Produktbaseline berechnen und in einer getrennten, konservativen Produktarbeitseinheit prüfen.

## Arbeitsweise

- Repository und CI gezielt abfragen; keine Voll-Repo-Scans.
- CI-Zusammenfassungen zuerst, Logs nur bei fehlgeschlagenen Jobs.
- Private Quellenmetadaten bleiben außerhalb des öffentlichen Produkt-Repositories.
- Nach der nächsten größeren abgeschlossenen Einheit diesen Checkpoint wieder kompakt aktualisieren.
