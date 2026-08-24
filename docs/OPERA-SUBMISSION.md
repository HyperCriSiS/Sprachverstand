# Opera Add-ons – Einreichung

**Stand: 25. August 2026**

Diese Datei ist die operative Checkliste für die erste Veröffentlichung von
Sprachverstand bei Opera Add-ons. Das Release-Artefakt wird als
`sprachverstand-<release>-opera.zip` erzeugt.

Offizielle Referenzen:

- https://help.opera.com/en/extensions/
- https://help.opera.com/en/extensions/testing/
- https://help.opera.com/en/extensions/publishing-guidelines/
- https://addons.opera.com/

Die aktuelle Opera-Version basiert auf Chromium. Opera bezeichnet Manifest V3
als neuen Standard und hat angekündigt, den eigenen Erweiterungs-Store auf MV3
auszurichten. Die öffentlich erreichbaren technischen Hilfeseiten enthalten
teilweise noch ältere Manifest-V2-Beispiele; für Sprachverstand wird deshalb
bewusst der aktuelle Chromium-/MV3-Pfad verwendet.

## Technischer Stand

- Manifest V3
- Hintergrundlogik als Service Worker
- einzige Erweiterungsberechtigung: `storage`
- Content-Script auf `<all_urls>` für die lokale Kernfunktion
- keine Opera-spezifische API erforderlich
- keine extern geladenen Skripte
- kein Remote-Code
- kein Tracking und keine Telemetrie
- deutsche und englische Lokalisierung
- eigenes Opera-Artefakt
- CI prüft, dass Opera und Chromium außerhalb von `manifest.json` bytegleich
  gebaut werden

## Empfohlene Store-Angaben

**Name:** Sprachverstand

**Kategorie:** Barrierefreiheit

**Support:** https://github.com/HyperCriSiS/Sprachverstand/issues

**Projektseite:** https://github.com/HyperCriSiS/Sprachverstand

**Datenschutz:** https://github.com/HyperCriSiS/Sprachverstand/blob/main/PRIVACY.md

**Lizenz:** AGPL-3.0-only

### Deutsch – Zusammenfassung

> Passt gegenderte deutsche Webseitentexte lokal im Browser an persönliche Lesegewohnheiten an.

### Deutsch – Beschreibung

Sprachverstand passt gegenderte Schreibweisen in deutschsprachigen Webseiten
direkt im Browser an persönliche Lesegewohnheiten an.

Formen wie „Nutzer:innen“, „Mitarbeiter*innen“, „NutzerInnen“,
Doppelnennungen, substantivierte Adjektive und ausgewählte Partizipformen werden
nach kontrollierten Regeln angepasst. Regelgruppen lassen sich einzeln
aktivieren oder deaktivieren.

Die Webseite selbst bleibt unverändert. Sprachverstand verändert ausschließlich
die lokale Darstellung. Beim Ausschalten werden die vorgenommenen Änderungen
ohne Neuladen zurückgesetzt.

Zusätzlich gibt es persönliche Ausnahmen, eigene wörtliche Ersetzungen,
Live-Vorschau und Konflikthinweise, JSON-Import und -Export, optionale
Browser-Synchronisierung pro Datenkategorie, Domain-Ausschlüsse, optionale
Untertitelkorrektur und die optionale Verarbeitung zugänglicher Textattribute.

Webseitentexte werden ausschließlich lokal verarbeitet. Sprachverstand sendet
keine Webseitentexte oder Browserverläufe an den Entwickler, verwendet keine
eigene Cloud, keine externe Sprach-API, kein Tracking, keine Telemetrie und
keine Werbung.

### Englisch – Summary

> Normalizes selected gendered forms in German website text locally in Opera, with configurable rules and no tracking.

### Englisch – Description

Sprachverstand normalizes selected gendered forms in German website text
directly in Opera. It is intended for readers who prefer conventional
grammatical forms and for learners of German who find the gender colon, gender
asterisk, Binnen-I or double forms harder to parse.

Rule groups are configurable. The extension also includes personal exceptions,
literal custom replacements, JSON backup and restore, optional per-category
browser synchronization, domain exclusions, optional subtitle handling and
optional accessible-text attributes.

All website-text processing happens locally. No website text, browsing history
or usage data is sent to the developer. Sprachverstand uses no external language
service, tracking, telemetry or advertising.

## Screenshots

Opera empfiehlt Screenshots mit 612×408 Pixeln; 800×600 Pixel dürfen nicht
überschritten werden. Die offiziellen Richtlinien empfehlen außerdem eine
saubere Standard-Oberfläche ohne andere Erweiterungen und einen weißen
Hintergrund.

Vorgesehener Satz:

1. Popup mit Korrekturzähler im Opera-Browser
2. Detailansicht der tatsächlichen Ersetzungen
3. erweiterte Einstellungen mit Regelgruppen

Mindestens ein Screenshot soll die Erweiterung in Aktion und einer ihre
Position beziehungsweise Oberfläche im Browser zeigen.

## Manueller Opera-Test

Opera verlangt ausdrücklich gründliche Tests und empfiehlt Windows und macOS
sowie niedrige und hohe Bandbreite.

1. `sprachverstand-<release>-opera.zip` entpacken.
2. `opera:extensions` öffnen.
3. Entwicklermodus aktivieren.
4. **Load unpacked extension** wählen und den entpackten Ordner laden.
5. Popup und Optionsseite prüfen.
6. GitHub-README von Sprachverstand öffnen und den Abschnitt
   **Direkt ausprobieren** kontrollieren.
7. Erweiterung ausschalten: alle Änderungen müssen ohne Seiten-Reload
   zurückgenommen werden.
8. wieder einschalten und dynamisch nachgeladene Inhalte prüfen.
9. reale Testmatrix stichprobenartig ausführen, insbesondere Kununu, taz,
   YouTube und die große Wikipedia-Nvidia-GPU-Liste.
10. mindestens einen Durchlauf mit gedrosselter Verbindung durchführen.

## Paket für die Store-Einreichung

Die aktuelle öffentliche Opera-Dokumentation beschreibt die Einreichung über das
**Upload Extensions**-Formular, nennt auf der Publishing-Seite aber kein
eindeutiges aktuelles Dateiformat. Das bereitgestellte ZIP ist deshalb das
reproduzierbare Release- und Testartefakt. Falls das aktuelle Upload-Formular
beim Einreichen ein von Opera gepacktes CRX verlangt, denselben geprüften
`dist/opera`-Inhalt in Opera über **Pack Extension** paketieren. Es dürfen dabei
keine Quell- oder Funktionsänderungen gegenüber dem geprüften ZIP erfolgen.

## Vor der Einreichung

- [ ] neuestes `sprachverstand-<release>-opera.zip` verwenden
- [ ] SHA256 mit `SHA256SUMS.txt` prüfen
- [ ] entpackte Version in aktuellem Opera Stable testen
- [ ] mindestens zusätzlich Windows oder macOS gegenprüfen
- [ ] einen Test mit gedrosselter Verbindung durchführen
- [ ] reale Testmatrix stichprobenartig abarbeiten
- [ ] Kategorie **Barrierefreiheit** wählen
- [ ] deutsche und englische Zusammenfassung/Beschreibung eintragen
- [ ] aktuelle Screenshots im Opera-Format hochladen
- [ ] Support-, Projekt- und Datenschutzlinks prüfen
- [ ] Lizenz als AGPL-3.0-only angeben
- [ ] Store-Formular vor dem Absenden vollständig gegen diese Datei prüfen
