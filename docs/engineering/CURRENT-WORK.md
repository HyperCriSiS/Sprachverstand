# Aktueller Arbeitsstand

Stand: 2026-09-30
Autorität: `main`

Diese Datei ist der kompakte operative Übergabepunkt für unterbrochene oder in einem neuen Chat fortgesetzte Arbeit.

## Produktbaseline

- Moderne Produktlinie: `main`
- Letzte integrierte Lexikon-Ausbauwelle: **57**
- Letzter integrierter Produkt-PR: **#249 — siebenundfünfzigste konservative Ausbauwelle**
- Verifizierter Produktbaseline-Commit: `1fc46b0a9fd37f61e931178cc5489e152f30e25a`
- Aktuellen `main`-HEAD bei jeder Wiederaufnahme live ermitteln.

## Aktiver Arbeitsstrom

### Priorität 1 — KldB/DKZ-Kandidaten sprachmodellbasiert abarbeiten

Der Quellenimport ist abgeschlossen. Für die Produktfreigabe gilt keine externe Evidenzpflicht mehr:

1. Quellen liefern nur Kandidaten; ihre Herkunft hat kein Freigabegewicht.
2. Kandidaten werden in größeren Batches intern semantisch und morphologisch geprüft.
3. Eindeutige deutsche Personenformen können ohne Webrecherche weiterverarbeitet werden.
4. Lokal vorhandene Paarinformationen sind optionaler Hinweis, keine Voraussetzung.
5. Nur mehrdeutige, fachsprachlich ungewöhnliche oder widersprüchliche Fälle werden gezielt extern recherchiert.
6. Produktiv bleiben exakte Mappings, Positiv-/Negativregressionen und die vollständige CI die Sicherheitsgrenze; aus einem Batch wird keine generische Suffixregel abgeleitet.

Nächster Block: `kldb-current-priority-4`, bis zu 250 Kandidaten statt 50.

## Optionale private Ebene

Für Quellenimport, Kandidatengenerierung und Coverage darf `HyperCriSiS/Generic-Datastore` geladen werden. Private Rohquellen, URLs und Herkunftsmetadaten bleiben außerhalb des öffentlichen Produkt-Repositories. Herkunftsmetadaten dürfen die sprachliche Freigabeentscheidung nicht beeinflussen.

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `sprachverstand/CURRENT-STATE.json` im privaten Datastore lesen.
4. Sprachmodell-Review ist Standard; externe Evidenz nur bei echten Grenzfällen.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.
