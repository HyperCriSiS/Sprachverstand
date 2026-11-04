# Sprachverstand 0.9.0 für Thunderbird

Erste eigenständige Thunderbird-Veröffentlichung. Lokale Korrektur angezeigter
deutschsprachiger Mails mit denselben Regeln, persönlichen Ausnahmen und eigenen
Ersetzungen wie im Browser-Add-on.

- Vollständiges Popup mit Regelgruppen, Korrekturzähler und Ersetzungsübersicht.
- Erweiterte Einstellungen mit Vorschau und Sicherungsfunktionen.
- Darstellungskorrektur ohne Änderung der empfangenen Originalmail.
- Optional: tatsächlichen Entwurfstext beim Öffnen einer Antwort oder
  Weiterleitung einmal korrigieren. Standardmäßig aus; benötigt zusätzlich
  die erst beim Einschalten angeforderte Verfassen-Berechtigung.
- Untertiteloption in Thunderbird ausgeblendet; Website-Domainfilter sind
  keine Absenderfilter. Weiterleitungen als Anhang behalten den Originalanhang.
- Keine externen Sprachdienste, keine Telemetrie, kein Tracking.

## Installation

`sprachverstand-thunderbird-0.9.0.xpi` herunterladen und in Thunderbird unter
**Add-ons und Themes → Zahnrad → Add-on aus Datei installieren** auswählen.
Anschließend Nachrichten neu öffnen. Technische Mindestversion: Thunderbird 128.
Dies ist eine GitHub-Veröffentlichung, keine Veröffentlichung im Thunderbird-Store.

## Prüfstand und Grenzen

Die Nachrichtenanzeige wurde vom Nutzer praktisch erprobt. Die automatisierten
Tests umfassen HTML/Klartext, Regeln, Rücknahme, UI-Anbindung, Berechtigungen,
Einmaligkeit und Schutz zwischenzeitlicher Bearbeitungen.
Eine vollständige reale Thunderbird-Versionsmatrix und ein Versandtest der
optionalen Entwurfskorrektur bis zum Empfänger sind noch offen. Bereits als
bearbeitet markierte Entwürfe werden vorsorglich nicht automatisch geändert.
Keine Korrektur neuer Mails, laufender Eingaben oder unmittelbar vor dem Senden.

## Dateien

- XPI: installierbare Erweiterung.
- `sprachverstand-thunderbird-0.9.0-source.zip`: Quellcode und Build-Anleitung.
- `PROVENANCE.json`: Quellcommit, Tag, Werkzeugversionen und Paket-Prüfwerte.
- `SHA256SUMS`: Prüfsummen der Release-Dateien.

Datenschutz: [Thunderbird-Datenschutzerklärung](https://github.com/HyperCriSiS/Sprachverstand/blob/thunderbird/docs/THUNDERBIRD-PRIVACY.md).
