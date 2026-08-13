<p align="center">
  <img src="docs/assets/sprachverstand-logo.png" width="144" height="144" alt="Sprachverstand-Logo">
</p>

<h1 align="center">Sprachverstand</h1>

<p align="center"><strong>Macht Webseiten leichter lesbar.</strong></p>

<p align="center">
  Eine datenschutzfreundliche Browser-Erweiterung, die gegenderte Schreibweisen
  auf dem eigenen Gerät in herkömmliche deutsche Personenbezeichnungen umwandelt.
</p>


<p align="center">
  <a href="https://addons.mozilla.org/firefox/addon/sprachverstand/"><img src="https://img.shields.io/badge/Firefox-Add--on-FF7139?logo=firefoxbrowser&logoColor=white" alt="Firefox Add-on"></a>&nbsp;
  <a href="https://github.com/HyperCriSiS/Sprachverstand/releases/latest"><img src="https://img.shields.io/github/v/release/HyperCriSiS/Sprachverstand?label=Release" alt="GitHub Release"></a>&nbsp;
  <a href="https://github.com/HyperCriSiS/Sprachverstand/actions/workflows/ci.yml"><img src="https://github.com/HyperCriSiS/Sprachverstand/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI"></a>&nbsp;
  <a href="LICENSE"><img src="https://img.shields.io/github/license/HyperCriSiS/Sprachverstand" alt="License"></a>
</p>


## Was ist Sprachverstand?

Sprachverstand verarbeitet den Text einer Webseite direkt im Browser. Formen wie
`Nutzer:innen`, `Mitarbeiter*innen`, `NutzerInnen`, Doppelnennungen und ausgewählte
Partizipformen werden nach kontrollierten Regeln normalisiert.

Die Webseite und ihre Serverdaten bleiben unverändert. Sprachverstand passt nur
die lokale Darstellung im Browser an. Die Verarbeitung lässt sich jederzeit
abschalten und wird ohne Neuladen rückgängig gemacht.

Sprachverstand gibt
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
| `NutzerIn` | `Nutzer` |
| `eine NutzerIn` | `ein Nutzer` |
| `Nutzerinnen und Nutzer` | `Nutzer` |
| `jede:r Nutzer:in` | `jeder Nutzer` |
| `Student*innen` | `Studenten` |
| `Studierende` | `Studenten` |
| `Arbeitnehmende` | `Arbeitnehmer` |
| `Gegner*innenschaft` | `Gegnerschaft` |
| `Erwachsene:r` | `Erwachsener` |
| `Rom*nja` | `Roma` |
| `Studentys` | `Studenten` |

### Direkt ausprobieren

Die Vergleichstabelle bleibt absichtlich unverändert, weil ihre Beispiele als
Quellcode formatiert sind. Der folgende Text ist normaler Seiteninhalt und wird
bei aktiviertem Sprachverstand direkt auf dieser GitHub-Seite angepasst:

> Unsere Mitarbeiter*innen begrüßen neue Nutzer:innen und Student*innen.
> Jede:r Nutzer:in erhält ein eigenes Nutzer:innenkonto. Studierende und
> Arbeitnehmende finden dort weitere Informationen.

### Grenzen und Sicherheit

Sprachverstand berücksichtigt bekannte Flexionen, zusammengesetzte Wörter,
markierte Binnen-I-Singularformen und ausgewählte substantivierte Adjektive.
Bei Formen wie `eine NutzerIn` wird der Kasus aus sicheren Satz-, Verb- oder
Präpositionskontexten bestimmt. Reicht der Kontext nicht aus, bleibt die Phrase
unangetastet statt einen grammatisch falschen Artikel zu erzeugen.

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
- eigene literale Ersetzungen, getrennt von Ausnahmen und ohne Regex
- Live-Vorschau für noch nicht gespeicherte persönliche Regeln
- Konflikthinweise für Dubletten, Überschneidungen, Ersetzungsketten und blockierende Ausnahmen
- versionierter JSON-Import und -Export des vollständigen Einstellungsstands
- optionale Browser-Synchronisierung, für jede Datenkategorie einzeln wählbar und standardmäßig vollständig deaktiviert
- Ausschluss einzelner Domains
- optionaler Schutz von Texten in Anführungszeichen
- optionale Untertitelkorrektur; standardmäßig werden erkannte
  Untertitel-Overlays vollständig übersprungen
- optionale Verarbeitung zugänglicher Attribute wie `alt`, `aria-label`,
  `aria-description` und `title`
- Schutz von Eingabefeldern, Editoren, Quellcode, URLs und technischen Daten

## Einstellungen

Im Popup kann Sprachverstand global ein- und ausgeschaltet werden. Außerdem
lassen sich die Regelgruppen einzeln steuern, beispielsweise:

- Genderzeichen und Binnen-I
- Doppelnennungen
- Singularformen mit oder ohne Artikel
- substantivierte Adjektive
- weitere sichtbare Sonderformen
- Pronomen- und Possessivpaare
- Titelabkürzungen
- ausgewählte neutrale Partizipformen
- optionale Umschreibungen
- optionale Geschlechtszusätze in Stellenanzeigen wie `(m/w/d)`
- Untertitel verarbeiten

In den erweiterten Einstellungen stehen persönliche Ausnahmen, eigene
literale Ersetzungen, Domain-Ausschlüsse, der Schutz zitierter Schreibweisen,
die optionale Untertitelkorrektur und die Verarbeitung zugänglicher Attribute
zur Verfügung. Die Untertitelkorrektur ist standardmäßig deaktiviert. Eigene
Ersetzungen sind case-sensitive, werden genau einmal ausgeführt und
standardmäßig ausschließlich lokal gespeichert. Ausnahmen haben Vorrang. In
einem eigenen Bereich kann für Aktivierungsstatus, Regelgruppen,
Domain-Ausschlüsse, Textoptionen, Ausnahmen und eigene Ersetzungen jeweils
getrennt gewählt werden, ob die Kategorie zusätzlich über den
Synchronisierungsdienst des Browsers übertragen wird. Die Auswahl ist
standardmäßig vollständig deaktiviert. Sobald mindestens eine Kategorie
aktiviert wird, synchronisiert der Browser auch diese Auswahl, damit dieselben
Kategorien auf weiteren angemeldeten Geräten geladen werden können.

**Speichern** und **Zurücksetzen** befinden sich oben in derselben Werkzeugleiste
wie **Alle öffnen** und **Alle schließen**. Alle Einstellungsbereiche lassen sich
einzeln oder gemeinsam öffnen und schließen.

Vor dem Speichern können persönliche Regeln an einem frei eingegebenen Testtext
geprüft werden. Die Einstellungsseite weist auf wirkungslose Einträge,
widersprüchliche Ziele, blockierende Ausnahmen, Groß-/Kleinschreibungsvarianten,
Überschneidungen und nicht ausgeführte Ersetzungsketten hin.

Der vollständige Einstellungsstand einschließlich Aktivierung, Regelgruppen, Domain-Ausschlüssen, Zitat- und Attributoptionen, Ausnahmen, eigenen Ersetzungen und Synchronisierungsauswahl lässt sich als versionierte JSON-Datei sichern und wieder einlesen.
Ein Import wird zunächst nur in das Formular übernommen und erst nach dem
Speichern aktiv.

## Datenschutz

Sprachverstand verarbeitet Webseiten ausschließlich lokal im Browser.

- keine Übertragung von Seitentexten
- kein eigener Cloud-Dienst und keine externe Sprach-API
- keine Analyse des Browserverlaufs
- kein Tracking und keine Telemetrie
- keine Veränderung der aufgerufenen Webseite oder ihrer Serverdaten

Alle Einstellungen werden standardmäßig lokal im Browser gespeichert. Nur ausdrücklich ausgewählte Kategorien werden zusätzlich über `storage.sync` an den Synchronisierungsdienst des verwendeten Browsers übergeben. Sprachverstand betreibt keinen eigenen Synchronisierungsserver und überträgt keine Webseitentexte oder Browserverläufe. Import- und Exportdateien werden ausschließlich nach einer bewussten Nutzeraktion lokal gelesen oder erzeugt. Die vollständigen Angaben
stehen in der [Datenschutzerklärung](PRIVACY.md).

## Unterstützte Browser

- Firefox für Desktop
- Firefox für Android
- Chromium-basierte Desktop-Browser

Google Chrome für Android unterstützt keine regulären Browser-Erweiterungen und
ist deshalb kein Veröffentlichungsziel.

## Projektstatus

Sprachverstand 0.6.1 RC2 ist der abschließend geprüfte
Veröffentlichungskandidat für die öffentliche Freigabe des Repositorys und die
Einreichung bei Firefox Add-ons. Die Regel-Engine ist bewusst konservativ
aufgebaut und wird mit automatisierten Unit-, DOM-, Performance- und
Regressionstests abgesichert.

Die versionierten deutschen Storetexte stehen in
[`docs/STORE-LISTING-DE.md`](docs/STORE-LISTING-DE.md).

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
und bekannte Grenzen werden im [`CHANGELOG.md`](CHANGELOG.md) dokumentiert. Das
Verfahren zur Erweiterung und Absicherung des Flexionsbestands ist in
[`docs/LEXICON.md`](docs/LEXICON.md) beschrieben. Das JSON-Format der
Einstellungssicherung ist in
[`docs/SETTINGS-BACKUP-FORMAT.md`](docs/SETTINGS-BACKUP-FORMAT.md) dokumentiert.
Hinweise für Beiträge stehen in [`CONTRIBUTING.md`](CONTRIBUTING.md).

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

Der Quelltext steht unter der **GNU Affero General Public License Version 3,
ausschließlich Version 3** (`AGPL-3.0-only`). Die vollständigen Bedingungen
stehen in [`LICENSE`](LICENSE).

Veränderte und weitergegebene Fassungen müssen die Copyleft-Bedingungen der
AGPL einhalten. Bei einer veränderten netzwerkfähigen Fassung muss der
entsprechende Quelltext auch den über das Netzwerk interagierenden Nutzern
angeboten werden.

Der Name **Sprachverstand**, das SV-Logo und andere Herkunftskennzeichen werden
nicht durch die Softwarelizenz freigegeben. Regeln für offizielle Pakete,
Namensnennung und Forks stehen in [`TRADEMARKS.md`](TRADEMARKS.md). Das Programm
wird ohne Gewährleistung bereitgestellt; Einzelheiten stehen in
[`NOTICE`](NOTICE) und `LICENSE`.
