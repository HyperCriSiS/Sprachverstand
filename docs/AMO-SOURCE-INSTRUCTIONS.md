# Build-Anleitung für die Mozilla-Prüfung

Diese Datei ist für die Quellcodeeinreichung bei Firefox Add-ons bestimmt.
Sprachverstand wird aus TypeScript mit esbuild gebündelt. Das eingereichte XPI
ist vor der Prüfung und Signierung durch Mozilla absichtlich unsigniert.

## Voraussetzungen

- Betriebssystem: Ubuntu 24.04 oder vergleichbare Linux-Umgebung
- Node.js 24
- npm aus der Node.js-Installation
- Programme `zip`, `unzip` und `sha256sum` nur für die Paketprüfung

Es werden keine globalen npm-Pakete benötigt.

## Reproduzierbare Installation

Im Wurzelverzeichnis des eingereichten Quellarchivs:

```bash
npm ci --no-audit --no-fund
```

`package-lock.json` legt sämtliche npm-Abhängigkeiten fest. Während des Builds
wird kein Quelltext aus dem Netzwerk geladen und kein Remote-Code eingebunden.

## Firefox-Build

```bash
npm run build:firefox
```

Das Ergebnis liegt unter:

```text
dist/firefox/
```

Die für AMO hochgeladene XPI-Datei wird aus genau diesem Verzeichnis erzeugt:

```bash
cd dist/firefox
zip -qr ../../sprachverstand-firefox.xpi .
```

## Vollständige Prüfung

```bash
npm run check
```

Dieser Befehl führt aus:

- Prüfung auf typische Geheimnisse und temporäre Dateien
- TypeScript-Prüfung
- vollständige Vitest-Suite
- Chromium- und Firefox-Build
- PNG-Signatur-, CRC-, Größen- und Dateiendeprüfung
- `web-ext lint` mit Fehlern bei Warnungen

## Wichtige Dateien

- `scripts/build.mjs` – Buildablauf und Manifestversion
- `src/` – vollständiger TypeScript-Quelltext
- `static/` – unveränderte statische Oberfläche und Symbole
- `manifests/firefox.json` – Firefox-Quellmanifest
- `package.json` und `package-lock.json` – Werkzeuge und feste Versionen

Es gibt keine automatisch generierten oder ausgelassenen proprietären
Quellbestandteile. Das eingereichte Quellarchiv ist der bevorzugte Quelltext im
Sinne der AGPL-3.0-only.

## Provenienz des Release-Quellarchivs

Das Release-Quellarchiv beginnt mit `git archive` des in `SOURCE_COMMIT.txt`
genannten Commits. Die eigentlichen Quelldateien stammen damit aus genau diesem
Git-Baum. Damit die aus dem Release-Tag abgeleitete Versionsnummer ohne einen
zusätzlichen Vorbereitungsschritt reproduziert werden kann, ersetzt der
Release-Workflow anschließend ausschließlich die Versionsfelder in diesen sechs
bereits vorhandenen Dateien durch die Release-Version:

- `package.json`
- `package-lock.json`
- `manifests/chromium.json`
- `manifests/edge.json`
- `manifests/opera.json`
- `manifests/firefox.json`

Zusätzlich werden zwei reine Provenienzdateien in das Quellarchiv aufgenommen:

- `SOURCE_COMMIT.txt` – exakter Git-Commit des Ausgangsbaums
- `RELEASE_PROVENANCE.txt` – Tag, Commit, Build-Version und die oben beschriebene
  Release-Vorbereitung

Andere Quelldateien werden vor dem Packen nicht verändert. Deshalb kann das bei
Mozilla eingereichte Source-ZIP direkt mit `npm ci` und `npm run build:firefox`
gebaut werden, auch wenn die Versionsfelder des rohen Git-Tags von der
Release-Version abweichen.
