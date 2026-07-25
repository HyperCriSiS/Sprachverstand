# Auswertung der Altprojekte

Diese Datei ist die Arbeitsmatrix für bekannte Fehlerfälle, Issues und Pull
Requests. Sie beeinflusst den ausgelieferten Code nicht.

## Bereits durch die neue Architektur gelöst

| Quelle | Eintrag | Entscheidung | Umsetzung |
|---|---|---|---|
| gendersprache-korrigieren | #7 unerwünschte Parcel-Verbindungen | neu gelöst | moderner Produktions-Build ohne Parcel-Laufzeit |
| gendersprache-korrigieren | #19 Änderungen in `code` und `pre` | neu gelöst | zentrale DOM-Sicherheitsprüfung |
| gendersprache-korrigieren | #31 dynamische Seiten und SPA | neu gelöst | `MutationObserver` für neue und geänderte Textknoten |
| no-gender | #1 springender Cursor in Editoren | neu gelöst | Eingaben und `contenteditable` werden ausgeschlossen |
| no-gender | #8 beschädigte Base64-Inhalte | neu gelöst | technische Textknoten werden nicht verarbeitet |

## Erste Regelphase

| Quelle | Eintrag | Entscheidung | Umsetzung |
|---|---|---|---|
| beide | Doppelpunkt, Stern, Unterstrich und Schrägstrich | neu implementieren | zunächst nur geprüft sichere Pluralformen |
| no-gender | #3 falsche Änderung von „gewinnen“ | Regressionstest | darf niemals verändert werden |
| no-gender | #29 falsche Änderung von „ersinnen“ | Regressionstest | darf niemals verändert werden |
| gendersprache-korrigieren | #14 falsche Änderung bei „Rot-Rot“ | Regressionstest | später in gemeinsamen Negativkatalog aufnehmen |

## Noch zu bewerten

- Binnen-I
- unregelmäßige Pluralformen wie `Ärzt:innen`, `Student:innen` und `Kund:innen`
- Doppelnennungen
- Pronomen und Artikel
- Partizipialformen
- neue Anführungszeichen- und Apostrophvarianten
- Sonderformen wie `Studentys`, `Rom*nja` und `Sinti*zze`
- Webseitenbezogene Fehlerfälle wie DHL und LinkedIn

## Entscheidungswerte

- `neu implementieren`
- `als Regressionstest übernehmen`
- `bereits gelöst`
- `zu riskant`
- `nicht relevant`
- `verwerfen`

Konkreter Fremdcode wird nicht unbesehen kopiert oder per Cherry-Pick übernommen.
