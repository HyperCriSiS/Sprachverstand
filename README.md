<p align="center">
  <img src="docs/assets/sprachverstand-logo.png" width="144" height="144" alt="Sprachverstand-Logo">
</p>

<h1 align="center">Sprachverstand</h1>

<p align="center"><strong>Gendern von Webseiten entfernen. Lokal in deinem Browser.</strong></p>

<p align="center">
  Gendersternchen, Gender-Doppelpunkte und Binnen-I in herkömmliche deutsche
  Personenbezeichnungen umwandeln. Du bestimmst, wie du liest.
</p>

<p align="center">
  <a href="https://addons.mozilla.org/firefox/addon/sprachverstand/">Für Firefox installieren</a>
  · <a href="https://chromewebstore.google.com/detail/sprachverstand/pldojodppdcomlljcgpeeelleomieeii">Für Chrome installieren</a>
  · <a href="https://github.com/HyperCriSiS/Sprachverstand/releases">Weitere Browser und Downloads</a>
</p>

<p align="center">
  <a href="https://github.com/HyperCriSiS/Sprachverstand/releases/latest"><img src="https://img.shields.io/github/v/release/HyperCriSiS/Sprachverstand?label=Release" alt="GitHub Release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/github/license/HyperCriSiS/Sprachverstand" alt="Lizenz"></a>
</p>

Sprachverstand entfernt Gendern aus deutschsprachigen Webseitentexten direkt auf deinem Gerät.
Die Erweiterung erkennt unterstützte Schreibweisen und wandelt sie nach deinen
Einstellungen um. Auch dynamisch nachgeladene Texte werden verarbeitet.
Die Regelgruppen lassen sich einzeln ein- und ausschalten; dazu gehören auch
Doppelnennungen und ausgewählte Partizipformen wie „Studierende“.


## So liest sich das mit Sprachverstand

| Auf der Webseite | Mit Sprachverstand |
|---|---|
| `Nutzer:innen` | `Nutzer` |
| `Mitarbeiter*innen` | `Mitarbeiter` |
| `NutzerInnen` | `Nutzer` |
| `jede:r Nutzer:in` | `jeder Nutzer` |
| `Nutzerinnen und Nutzer` | `Nutzer` |
| `Student*innen` | `Studenten` |
| `Studierende` | `Studenten` |


## Dein Browser. Deine Sprache.

- **Lokal und privat:** Die Sprachverarbeitung braucht keine externen Dienste.
  Webseitentexte werden nicht übertragen. Kein Tracking, keine Telemetrie und
  keine Werbung.
- **Sofort rückgängig:** Beim Ausschalten stellt Sprachverstand den ursprünglichen
  Text auf offenen Seiten ohne Neuladen wieder her.
- **Nach deinen Vorstellungen:** Wähle Regelgruppen, schließe einzelne Webseiten
  aus und ergänze persönliche Ausnahmen oder eigene Ersetzungen.
- **Vorher ausprobieren:** Prüfe eigene Regeln in der Live-Vorschau. Hinweise auf
  Konflikte helfen dir vor dem Speichern.
- **Optional auch Untertitel:** Verarbeite erkannte Untertitel, wenn die Webseite
  sie als Text bereitstellt. Die Funktion ist standardmäßig ausgeschaltet;
  fest ins Video eingebrannte Untertitel können nicht verändert werden.

## Installieren und loslesen

1. Installiere Sprachverstand aus dem
   [Firefox-Add-on-Store](https://addons.mozilla.org/firefox/addon/sprachverstand/)
   oder dem
   [Chrome Web Store](https://chromewebstore.google.com/detail/sprachverstand/pldojodppdcomlljcgpeeelleomieeii).
2. Öffne eine deutschsprachige Webseite. Unterstützte Schreibweisen werden
   automatisch angepasst.
3. Über das Erweiterungssymbol kannst du Sprachverstand ausschalten, Regelgruppen
   wählen und die Einstellungen öffnen.

Firefox für Android wird ebenfalls unterstützt. Downloads für weitere Browser
findest du unter [Releases](https://github.com/HyperCriSiS/Sprachverstand/releases).
Diese README beschreibt den aktuellen Entwicklungsstand. Welche Funktionen die
veröffentlichte Version enthält, erfährst du in den Versionshinweisen des
jeweiligen Stores.

## Was wird verändert – und was bleibt stehen?

Sprachverstand verarbeitet Genderzeichen wie Sternchen, Doppelpunkt und
Unterstrich, Binnen-I, Doppelnennungen sowie weitere unterstützte Formen.
Du kannst die Regelgruppen einzeln steuern.

Weibliche Bezeichnungen ohne Genderzeichen wie `Professorin` oder `Politikerinnen`
bleiben erhalten. Eingabefelder, Editoren, Quellcode, URLs und technische Daten
sind von der regulären Verarbeitung ausgeschlossen. Für Texte in Anführungszeichen
kannst du zusätzlich einen Schutz aktivieren.

Die deutsche Sprache hat viele Mehrdeutigkeiten. Wenn eine ausreichend sichere
Ersetzung nicht möglich ist, bleibt die betreffende Form stehen. Auch seltene
Wörter und besondere Webseiten können noch zu fehlenden oder falschen
Ersetzungen führen.

Du hast einen solchen Fall gefunden? Melde ihn gern als
[GitHub-Issue](https://github.com/HyperCriSiS/Sprachverstand/issues).
Ein kurzer Beispielsatz mit gewünschtem Ergebnis und, sofern öffentlich, ein
Link zur betroffenen Seite helfen bei der Prüfung. Bitte veröffentliche dabei
keine privaten Texte oder persönlichen Daten.

## Persönliche Einstellungen

In den erweiterten Einstellungen kannst du Wort- und Phrasenausnahmen sowie
eigene Ersetzungen anlegen. Ausnahmen haben Vorrang. Eigene Ersetzungen
unterscheiden Groß- und Kleinschreibung und werden genau einmal ausgeführt.
Eine Live-Vorschau und Konflikthinweise helfen beim Prüfen.

Du kannst einzelne Domains ausschließen und optional zugängliche Beschriftungen
wie `alt`, `aria-label`, `aria-description` und `title` verarbeiten lassen.
Die Untertitelkorrektur ist ebenfalls optional und standardmäßig deaktiviert.

Deinen vollständigen Einstellungsstand kannst du lokal als JSON-Datei sichern
und wieder einlesen. Ein Import wird erst nach dem Speichern aktiv.

## Datenschutz

Webseitentexte werden ausschließlich lokal im Browser verarbeitet. Sprachverstand
betreibt keinen eigenen Cloud-Dienst und verwendet keine externe Sprach-API.
Es gibt kein Tracking, keine Telemetrie, keine Werbung und keine Nutzerprofile.
Die Änderungen betreffen die Darstellung auf deinem Gerät; Serverdaten der
besuchten Webseite werden nicht verändert.

Deine Einstellungen bleiben standardmäßig lokal. Wenn du möchtest, kannst du
bestimmte Einstellungskategorien über den Synchronisierungsdienst deines Browsers
auf weitere Geräte übertragen. Diese Funktion ist standardmäßig vollständig
ausgeschaltet. Webseitentexte und Browserverläufe werden dabei nicht übertragen.
Details stehen in der [Datenschutzerklärung](PRIVACY.md).

## Unterstützte Browser

Die Browser-Unterstützung ist nach den zugrunde liegenden Engines gegliedert:
<div align="center">

<h3>Gecko</h3>

<p>
  <a href="https://addons.mozilla.org/firefox/addon/sprachverstand/"><img src="https://img.shields.io/badge/Firefox-FF7139?logo=firefoxbrowser&logoColor=white" alt="Firefox"></a>
  <a href="https://addons.mozilla.org/firefox/addon/sprachverstand/"><img src="https://img.shields.io/badge/Waterfox-5D5FEF?logo=firefoxbrowser&logoColor=white" alt="Waterfox"></a>
  <a href="https://addons.mozilla.org/firefox/addon/sprachverstand/"><img src="https://img.shields.io/badge/LibreWolf-00ACFF?logo=librewolf&logoColor=white" alt="LibreWolf"></a>
  <a href="https://addons.mozilla.org/firefox/addon/sprachverstand/"><img src="https://img.shields.io/badge/Zen%20Browser-111111?logo=zenbrowser&logoColor=white" alt="Zen Browser"></a>
  <a href="https://addons.mozilla.org/firefox/addon/sprachverstand/"><img src="https://img.shields.io/badge/Floorp-58A6FF?logo=floorp&logoColor=white" alt="Floorp"></a>
</p>

<p>
  <a href="https://github.com/HyperCriSiS/Sprachverstand/actions/workflows/ci.yml?query=branch%3Amain"><img src="https://img.shields.io/github/check-runs/HyperCriSiS/Sprachverstand/main?nameFilter=Gecko%20CI&label=Gecko%20CI&logo=githubactions&logoColor=white" alt="Gecko CI"></a>
</p>

<h3>Blink / Chromium</h3>

<p>
  <a href="https://chromewebstore.google.com/detail/sprachverstand/pldojodppdcomlljcgpeeelleomieeii"><img src="https://img.shields.io/badge/Google%20Chrome-4285F4?logo=googlechrome&logoColor=white" alt="Google Chrome"></a>
  <a href="https://chromewebstore.google.com/detail/sprachverstand/pldojodppdcomlljcgpeeelleomieeii"><img src="https://img.shields.io/badge/Chromium-4285F4?logo=chromium&logoColor=white" alt="Chromium"></a>
  <a href="https://github.com/HyperCriSiS/Sprachverstand/releases"><img src="https://img.shields.io/badge/Microsoft%20Edge-0078D7?logo=microsoftedge&logoColor=white" alt="Microsoft Edge"></a>
  <a href="https://chromewebstore.google.com/detail/sprachverstand/pldojodppdcomlljcgpeeelleomieeii"><img src="https://img.shields.io/badge/Opera-FF1B2D?logo=opera&logoColor=white" alt="Opera"></a>
  <a href="https://chromewebstore.google.com/detail/sprachverstand/pldojodppdcomlljcgpeeelleomieeii"><img src="https://img.shields.io/badge/Brave-FB542B?logo=brave&logoColor=white" alt="Brave"></a>
  <a href="https://chromewebstore.google.com/detail/sprachverstand/pldojodppdcomlljcgpeeelleomieeii"><img src="https://img.shields.io/badge/Vivaldi-EF3939?logo=vivaldi&logoColor=white" alt="Vivaldi"></a>
  <a href="https://chromewebstore.google.com/detail/sprachverstand/pldojodppdcomlljcgpeeelleomieeii"><img src="https://img.shields.io/badge/Arc-FCBFBD?logo=arc&logoColor=black" alt="Arc"></a>
</p>

<p>
  <a href="https://github.com/HyperCriSiS/Sprachverstand/actions/workflows/ci.yml?query=branch%3Amain"><img src="https://img.shields.io/github/check-runs/HyperCriSiS/Sprachverstand/main?nameFilter=Chromium%20CI&label=Chromium%20CI&logo=githubactions&logoColor=white" alt="Chromium CI"></a>
</p>

<h3>Goanna</h3>

<p>
  <a href="https://github.com/HyperCriSiS/Sprachverstand/releases"><img src="https://img.shields.io/badge/Pale%20Moon-8A9BB8" alt="Pale Moon"></a>
</p>

<p>
  <a href="https://github.com/HyperCriSiS/Sprachverstand/actions/workflows/ci.yml?query=branch%3Apalemoon"><img src="https://img.shields.io/github/check-runs/HyperCriSiS/Sprachverstand/palemoon?nameFilter=check&label=Goanna%20CI&logo=githubactions&logoColor=white" alt="Goanna CI"></a>
</p>

</div>

Firefox und Chromium bilden die Basis für die jeweiligen Browserfamilien. Die
aufgeführten Browser verwenden den entsprechenden Erweiterungs-Build; nicht jeder
Browser wird separat getestet. Pale Moon erhält einen eigenständig gepflegten Port.

Google Chrome für Android unterstützt keine regulären Browser-Erweiterungen und
ist deshalb kein Veröffentlichungsziel. Browser ohne eigenes Store-Paket nutzen
den geprüften Basis-Build ihrer jeweiligen Engine.

## Projektstatus

Sprachverstand wird für Gecko, Blink/Chromium und Goanna getrennt geprüft.
Die README zeigt deshalb für jede regulär gebaute Engine einen eigenen CI-Status.
Die Regel-Engine ist bewusst konservativ aufgebaut und wird mit automatisierten
Unit-, DOM-, Performance-, Browserziel- und Regressionstests abgesichert.

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

Browser-Builds werden anschließend unter `dist/chromium/`, `dist/edge/`,
`dist/opera/` und `dist/firefox/` erstellt. Edge und Opera verwenden bewusst
dieselbe geprüfte Chromium-Payload; die CI kontrolliert deren Bytegleichheit
außerhalb des Manifests.

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
