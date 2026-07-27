<p align="center">
  <img src="static/icons/icon128.png" width="128" height="128" alt="Sprachverstand-Logo">
</p>

<h1 align="center">Sprachverstand</h1>

<p align="center"><strong>Macht Webseiten adäquat lesbar.</strong></p>

<p align="center">
  Eine datenschutzfreundliche Browser-Erweiterung, die gegenderte Schreibweisen
  auf dem eigenen Gerät in klassische deutsche Rechtschreibung umwandelt.
</p>

## Was ist Sprachverstand?

Sprachverstand verarbeitet den Text einer Webseite direkt im Browser. Formen wie
`Nutzer:innen`, `Mitarbeiter*innen`, `NutzerInnen`, Doppelnennungen und ausgewählte
Partizipformen werden nach kontrollierten Regeln normalisiert.

Die ursprüngliche Webseite bleibt unverändert. Die Anpassung ist ausschließlich
für den Nutzer sichtbar, lässt sich jederzeit abschalten und wird ohne Neuladen
rückgängig gemacht.

Sprachverstand ist keine Vorgabe dafür, wie andere schreiben sollen. Es gibt
Menschen die Kontrolle darüber zurück, wie Texte auf ihrem eigenen Gerät
angezeigt und vorgelesen werden.

## Warum kann das hilfreich sein?

Genderzeichen, ungewohnte Wortformen und häufige Doppelnennungen können den
visuellen oder gesprochenen Lesefluss unterbrechen. Bei längeren Texten kann das
die konzentrierte Aufnahme unnötig anstrengend machen, besonders dann, wenn
eine Sprachausgabe Satzzeichen vorliest, verschluckt oder als zusätzliche Pause
wiedergibt.

Für blinde und sehbehinderte Menschen ist das nicht nur eine Geschmacksfrage.
Der Deutsche Blinden- und Sehbehindertenverband weist darauf hin, dass
Kurzformen mit Sternchen, Unterstrich und Doppelpunkt für viele Nutzer
problematisch sind. Je nach Screenreader und persönlicher Konfiguration werden
die Zeichen unterschiedlich behandelt. Auch in Braille können zusätzliche
Ankündigungszeichen den Lesefluss behindern.

Die Forschung zur allgemeinen Lesbarkeit ist nicht einheitlich:
Eine Studie von 2025 fand bei Studenten keine langsamere Worterkennung, bei älteren
Nichtstudenten jedoch anfängliche Verzögerungen, die mit zunehmender Gewöhnung
rasch zurückgingen. Sprachverstand behauptet deshalb nicht, dass gegenderte
Sprache grundsätzlich unverständlich sei. Die Erweiterung bietet eine
individuelle Lösung für Menschen, die Texte in einer anderen Form leichter
lesen oder hören können.

Quellen:

- [Deutscher Blinden- und Sehbehindertenverband: Gendern](https://www.dbsv.org/gendern.html)
- [Zacharski, Kruppa & Ferstl (2025): The Readability of the Non-Binary Gender Star in German](https://doi.org/10.32872/spb.13719)

## Beispiele

| Original | Darstellung mit Sprachverstand |
|---|---|
| `Nutzer:innen` | `Nutzer` |
| `Mitarbeiter*innen` | `Mitarbeiter` |
| `NutzerInnen` | `Nutzer` |
| `Nutzerinnen und Nutzer` | `Nutzer` |
| `jede:r Nutzer:in` | `jeder Nutzer` |
| `Student*innen` | `Studenten` |
| `Studierende` | `Studenten` |
| `Arbeitnehmende` | `Arbeitnehmer` |
| `Juden_Jüdinnen` | `Juden` |
| `Gegner*innenschaft` | `Gegnerschaft` |

Die Regeln berücksichtigen bekannte Flexionen und zusammengesetzte Wörter, etwa
`Ärzt:innen → Ärzte`, `Nutzer:innenkonto → Nutzerkonto` oder
`mit Ärztinnen und Ärzten → mit Ärzten`.

Ausdrücklich weibliche Formen wie `Politikerinnen` oder `Professorin` bleiben
unverändert. Terminologische Schreibweisen wie `trans* Personen`,
`inter* Personen`, `Inter*feindlichkeit` und `Inter*diskriminierung` werden
ebenfalls nicht als Genderendung behandelt.

Eine ausgelassene Ersetzung ist besser als eine falsche. Unbekannte oder
mehrdeutige Formen bleiben deshalb unangetastet.

## Funktionen

- Verarbeitung direkt beim Laden der Webseite
- dynamisch nachgeladene Inhalte werden unmittelbar korrigiert
- vollständige Wiederherstellung beim Ausschalten, ohne Aktualisierung der Seite
- einzeln aktivierbare Regelgruppen
- Korrekturzähler für den aktuellen Tab
- persönliche Ausnahmen für Wörter und vollständige Phrasen
- Ausschluss einzelner Domains
- optionaler Schutz von Texten in Anführungszeichen
- optionale Verarbeitung zugänglicher Attribute wie `alt`, `aria-label`,
  `aria-description` und `title`
- Schutz von Eingabefeldern, Editoren, Quellcode, URLs und technischen Daten

## Einstellungen

Im Popup kann Sprachverstand global ein- und ausgeschaltet werden. Außerdem
lassen sich die Regelgruppen einzeln steuern, beispielsweise:

- Genderzeichen und Binnen-I
- Doppelnennungen
- Singularformen mit oder ohne Artikel
- Pronomen- und Possessivpaare
- Titelabkürzungen
- ausgewählte neutrale Partizipformen
- optionale Umschreibungen
- optionale Geschlechtszusätze in Stellenanzeigen wie `(m/w/d)`

In den erweiterten Einstellungen stehen persönliche Ausnahmen,
Domain-Ausschlüsse, der Schutz zitierter Schreibweisen und die Verarbeitung
zugänglicher Attribute zur Verfügung.

## Datenschutz

Sprachverstand verarbeitet Webseiten ausschließlich lokal im Browser.

- keine Übertragung von Seitentexten
- kein Cloud-Dienst und keine externe Sprach-API
- keine Analyse des Browserverlaufs
- kein Tracking und keine Telemetrie
- keine Veränderung der aufgerufenen Webseite oder ihrer Serverdaten außer den jeweiligen Textstellen

Persönliche Ausnahmen und Einstellungen werden nur im Browser gespeichert.

## Unterstützte Browser

- Firefox für Desktop
- Firefox für Android
- Chromium-basierte Desktop-Browser

Google Chrome für Android unterstützt keine regulären Browser-Erweiterungen und
ist deshalb kein Veröffentlichungsziel.

## Projektstatus

Sprachverstand befindet sich in aktiver Entwicklung. Die Regel-Engine ist
bewusst konservativ aufgebaut und wird mit automatisierten Unit-, DOM-,
Performance- und Regressionstests abgesichert.

Store-Veröffentlichungen folgen nach Abschluss der öffentlichen Testphase.

## Entwicklung

Voraussetzungen:

- Node.js 24 oder neuer
- npm

```bash
npm install
npm run check
```

Browser-Builds werden anschließend unter `dist/chromium/` und `dist/firefox/`
erstellt.

Weitere Hinweise stehen in [`docs/BETA-TEST.md`](docs/BETA-TEST.md). Änderungen
und bekannte Grenzen werden im [`CHANGELOG.md`](CHANGELOG.md) dokumentiert.

## Lizenz

Die endgültige Open-Source-Lizenz wird vor der öffentlichen Veröffentlichung
festgelegt.
