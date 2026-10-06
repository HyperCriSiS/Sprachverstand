# Aktueller Arbeitsstand

Stand: 2026-10-07
Autorität: `main`

## Produktbaseline

- Moderne Produktlinie: `main`
- Letzte integrierte Lexikon-Ausbauwelle: **79**
- Letzter integrierter Produkt-PR: **#290 — neunundsiebzigste Ausbauwelle**
- Produktbaseline nach Welle 79: `4b8c75f38ecf2ebfa585914755a154e9e3e1e937`
- PR #292 „Wikipedia-Realnutzung im Quellenimport aktivieren“ ist gemergt; Workflow-/Checkpoint-Stand danach liegt auf `main`.
- Keine generische Personen-Suffixregel; neue Lexikoneinträge bleiben exakte Allow-Lists bzw. Mappings.

## Aktiver Arbeitsstrom

### Priorität 1 — Wikipedia-Realnutzung

Der erste produktive Wikipedia-Realnutzungslauf ist abgeschlossen:

- Workflow Run #18 / Run-ID `37541905780`: erfolgreich
- Privater Import-Commit: `626148693b1f9fbdd27d225df2f88d9a61660c84`
- 530 Wikipedia-Seiten transient gelesen
- 225 beobachtete Basen / 578 relevante Vorkommen
- 182 Basen bereits bekannt
- 43 Unknowns
- eindeutige Coverage: **80,89 %**
- vorkommensgewichtete Coverage: **89,97 %**

Der komplette 43er-Unknownpool wurde als `wikipedia-real-usage-priority-1` geprüft:

- Privater Review-Commit: `f94bec9f5863459fdb1c195e13cb7a8cdc868016`
- 43 geprüft
- 14 angenommen
- 29 verworfen
- 0 offen
- Klassen der angenommenen Formen: 7 `unchanged`, 4 `weak_en`, 1 `weak_e`, 1 `plural_e`, 1 `plural_en`
- Keine generische Suffixregel.

Die 14 für Welle 80 freigegebenen Basen sind:

`fachschaftler`, `titelhalter`, `baron`, `bergkamerad`, `diplomgeograph`,
`ehrensenator`, `familienernährer`, `fcsp-teqballer`, `föderalist`, `knüpfer`,
`stadtzürcher`, `superintendent`, `teufel`, `uigur`.

Nicht als neue Lexeme behandelt werden insbesondere `Bürgermeisters/in`,
`Athleten*innen` und `Physikingenieure/innen`; das sind Flexions-/Oberflächenfälle
bereits bekannter Lexeme. Parser-, Marken-, Titel-, Eigennamen- und Englisch-Artefakte
wurden verworfen.

## Nächster Schritt

1. Welle 80 aus den 14 freigegebenen Exact-Mappings auf einem kurzlebigen Arbeitsbranch implementieren.
2. Positive Plural-, Singularpaar- und Kasusregressionen ergänzen; verworfene Kandidaten als Negativschutz prüfen.
3. Pull Request nach `main` erstellen und vollständige CI abwarten.
4. Nach Merge Wikipedia-Coverage neu vermessen.
5. Die vier separaten Flexions-/Fehlformfälle nur dann als Produktfix angehen, wenn eine sichere, eng begrenzte Regel möglich ist.
6. Danach bei Bedarf die nächsten offenen Quellen aus der Registry bearbeiten.

## Prüfprinzip

1. Quellen liefern nur Kandidaten; ihre Herkunft hat kein Freigabegewicht.
2. Sprachmodell-Review ist Standard; externe Evidenz nur bei echten Grenzfällen.
3. Produktseitig nur sichere Exact-Mappings bzw. eng begrenzte Regeln.
4. Positive, negative, Paar- und Kasusregressionen beibehalten.
5. Keine breite oder generische Personen-Suffixfreigabe hinzufügen.

## Optionale private Ebene

Für diesen Arbeitsstrom maßgeblich:

- `sprachverstand/CURRENT-STATE.json`
- `sprachverstand/derived/review/wikipedia-real-usage-priority-1-summary.json`
- `sprachverstand/derived/review/wikipedia-real-usage-priority-1-manual-decisions.json`

## Wiederaufnahmeprotokoll

1. Diese Datei aus `main` lesen.
2. Aktuellen `main`-HEAD live verifizieren.
3. Bei Quellenarbeit zusätzlich `sprachverstand/CURRENT-STATE.json` im privaten Datastore lesen.
4. Git-Checkpoints haben Vorrang vor alten Chats.
5. Nach einer abgeschlossenen größeren Einheit diesen Checkpoint aktualisieren.
