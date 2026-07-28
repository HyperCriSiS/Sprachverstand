<p align="center">
  <img src="docs/assets/sprachverstand-logo.png" width="144" height="144" alt="Sprachverstand-Logo">
</p>

<h1 align="center">Sprachverstand</h1>

<p align="center"><strong>Macht Webseiten leichter lesbar.</strong></p>

<p align="center">
  Eine datenschutzfreundliche Browser-Erweiterung, die gegenderte Schreibweisen
  auf dem eigenen Gerät in herkömmliche deutsche Personenbezeichnungen umwandelt.
</p>

## Was ist Sprachverstand?

Sprachverstand verarbeitet den Text einer Webseite direkt im Browser. Formen wie
`Nutzer:innen`, `Mitarbeiter*innen`, `NutzerInnen`, Doppelnennungen und ausgewählte
Partizipformen werden nach kontrollierten Regeln normalisiert.

Die Webseite und ihre Serverdaten bleiben unverändert. Sprachverstand passt nur
die lokale Darstellung im Browser an. Die Verarbeitung lässt sich jederzeit
abschalten und wird ohne Neuladen rückgängig gemacht.

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

Die Forschung zur allgemeinen Lesbarkeit ist nicht einheitlich: Eine Studie von
2025 fand bei Studenten keine langsamere Worterkennung, bei älteren
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

### Direkt ausprobieren

Die Vergleichstabelle bleibt absichtlich unverändert, weil ihre Beispiele als
Quellcode formatiert sind. Der folgende Text ist normaler Seiteninhalt und wird
bei aktiviertem Sprachverstand direkt auf dieser GitHub-Seite angepasst:

> Unsere Mitarbeiter*innen begrüßen neue Nutzer:innen und Student*innen.
> Jede:r Nutzer:in erhält ein eigenes Nutzer:innenkonto. Studierende und
> Arbeitnehmende finden dort weitere Informationen.

### Grenzen und Sicherheit

Sprachverstand berücksichtigt bekannte Flexionen und zusammengesetzte Wörter.
Ausdrücklich weibliche Formen wie `Politikerinnen` oder `Professorin` bleiben
unverändert. Terminologische Schreibweisen wie `trans* Personen`,
`inter* Personen`, `Inter*feindlichkeit` und `Inter*diskriminierung` werden
nicht als Genderendung behandelt.

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
- keine Veränderung der aufgerufenen Webseite oder ihrer Serverdaten

Persönliche Ausnahmen und Einstellungen werden nur im Browser gespeichert.

## Unterstützte Browser

- Firefox für Desktop
- Firefox für Android
- Chromium-basierte Desktop-Browser

Google Chrome für Android unterstützt keine regulären Browser-Erweiterungen und
ist deshalb kein Veröffentlichungsziel.

## Projektstatus

Sprachverstand befindet sich in aktiver Beta-Entwicklung. Die Regel-Engine ist
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

## Entwicklungsmodell

- `main` enthält den stabilen, geprüften Stand.
- `dev` ist der gemeinsame Entwicklungszweig.
- Separate Feature-Branches werden nur für größere, riskante oder parallel
  bearbeitete Änderungen verwendet und nach dem Merge wieder gelöscht.

## Dank und Herkunft

Bei der Entwicklung wurden öffentlich dokumentierte Anwendungsfälle,
Grenzfälle und Erfahrungen anderer Projekte berücksichtigt. Unser Dank gilt den
Entwicklern und Mitwirkenden von:

- [gendersprache-korrigieren](https://github.com/brilliance-richter-huh/gendersprache-korrigieren)
- [no-gender](https://github.com/sternth/no-gender)
- [rggl](https://github.com/motsiw/rggl)

Sprachverstand ist eine eigenständige Neuimplementierung. Es wurden keine
Codebestandteile oder fremden Regexketten übernommen. Details zur fachlichen
Abgrenzung stehen in [`UPSTREAMS.md`](UPSTREAMS.md).

## Lizenz

Die endgültige Open-Source-Lizenz wird vor der öffentlichen Veröffentlichung
festgelegt.
