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
Sinne der AGPL-3.0-only. Die zusätzlich ausgelieferte Datei
`SOURCE_COMMIT.txt` enthält den Git-Commit, aus dem XPI und Quellarchiv erzeugt
wurden.
