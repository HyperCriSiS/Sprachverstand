# Sprachverstand 0.5.5 – Beta 10

Beta 10 korrigiert die Symbolauslieferung und ergänzt direkt prüfbare
Live-Beispiele auf der GitHub-Startseite.

## Änderungen

- freigegebenes SV-Monogramm als statische PNG-Dateien in 32, 48 und 128 Pixeln
- dasselbe Symbol in Browserleiste, Popup, Einstellungen und README
- keine automatische Neugenerierung der Icons beim Build
- vollständige Prüfung von PNG-Signatur, Blockgrenzen, CRC32, Abmessungen und
  Dateiende vor der Veröffentlichung
- direkt verarbeitbarer Live-Test unter der geschützten Vergleichstabelle der
  README
- aktualisierte Beta-Testanleitung

## Pakete

- Chromium-ZIP zur Installation als entpackte Erweiterung
- Firefox-XPI für temporäre Desktop- und Android-Tests
- vollständiges Quellcodearchiv
- SHA-256-Prüfsummen
- Beta-Testanleitung

## Noch besonders zu testen

- Sichtbarkeit und Schärfe des Symbols in Browserleiste, Popup und Einstellungen
- README-Live-Test auf GitHub
- Firefox für Android auf einem echten Gerät
- Popup und Einstellungen auf mehreren Displaygrößen
- Screenreader auf Desktop und Android
- DHL-Anmeldung, Mediatheken, rebuy und andere Single-Page-Anwendungen
- große Nachrichtenseiten sowie React-, Angular- und Vue-Seiten

Bekannte Sicherheitsgrenzen und konkrete Testfälle stehen in `BETA-TEST.md`.
