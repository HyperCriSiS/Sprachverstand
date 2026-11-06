# Outlook-Add-in

Portierung der Thunderbird-Ausgabe auf das Office-Add-in-Modell. Stand: Entwicklung,
nicht veröffentlicht, noch nicht in einem echten Outlook geprüft.

## Aufbau

- `npm run build:outlook` baut nach `dist/outlook/`. Mit
  `-- --base-url https://example.org/sprachverstand/` werden alle URLs im Manifest
  auf den späteren HTTPS-Speicherort gesetzt (Standard: `https://localhost:3000/`).
- `manifests/outlook.xml` ist die Manifestvorlage (Add-in-only-Manifest, damit
  auch Outlook für Mac und mobil laden können).
- `src/outlook/extension-shim.ts` stellt im Seitenbereich die WebExtension-API
  bereit, die Popup und Einstellungsseite nutzen. Beide Seiten laufen dadurch
  unverändert. `storage.sync` und `storage.local` liegen in den
  Roaming-Einstellungen des Postfachs (gemeinsam rund 32 KB) und gelten damit für
  alle Outlook-Clients dieses Postfachs.
- `src/outlook/reader.ts` entspricht dem Nachrichtenskript der Thunderbird-Ausgabe.
- `src/outlook/launchevent.ts` entspricht `compose-background.ts` der
  Thunderbird-Ausgabe.

## Verhalten

| Thunderbird | Outlook |
| --- | --- |
| Nachricht wird beim Anzeigen umgewandelt | Seitenbereich anheften. Bei jeder ausgewählten Nachricht ersetzt das Add-in die Anzeige über `item.display.body.setAsync`. Die Nachricht im Postfach bleibt unverändert. |
| Symbol mit Zähler, Popup mit Ersetzungsliste | Schaltfläche „Sprachverstand“ in der Leseansicht öffnet den Seitenbereich mit demselben Popup. Ein Zähler am Symbol ist in Outlook nicht möglich. |
| Einstellungsseite in eigenem Tab | Einstellungsseite im selben Seitenbereich, „Zurück“ führt zum Popup. |
| Antworten und Weiterleitungen beim Öffnen korrigieren (optional) | Gleiche Option, über das Ereignis `OnNewMessageCompose`. Der ganze Verlauf wird umgewandelt (`bodyMode: FullBody`). |

## Einschränkungen

- `item.display.body` ist bei Microsoft noch Vorschau („Do not use this API in a
  production environment“). Fehlt die API, zeigt der Seitenbereich die
  umgewandelte Nachricht stattdessen oberhalb der Einstellungen an.
- Die Leseansicht wird nur umgewandelt, solange der Seitenbereich offen und
  angeheftet ist. Outlook bietet kein allgemeines Ereignis beim Öffnen einer
  Nachricht.
- Ereignisgesteuerte Add-ins starten nur nach Bereitstellung durch einen Admin oder
  mit einem unbeschränkten Eintrag im Microsoft Marketplace.
- Klassisches Outlook für Windows führt Ereignisse ohne DOM aus. Dort werden
  HTML-Antworten nicht korrigiert, nur Nur-Text.
- Eingebettete Bilder (`cid:`) in der ersetzten Anzeige sind ungeprüft.
- Die Domain-Schaltfläche im Popup bleibt wie in Thunderbird deaktiviert sichtbar.

## Lokal testen

1. `npm run build:outlook`
2. `dist/outlook/` per HTTPS unter `https://localhost:3000/` bereitstellen.
3. In Outlook im Web unter „Add-Ins abrufen“ → „Meine Add-Ins“ →
   „Benutzerdefiniertes Add-In hinzufügen“ die Datei `dist/outlook/manifest.xml`
   hochladen.
4. Eine Nachricht mit Genderzeichen öffnen, „Sprachverstand“ wählen, Seitenbereich
   anheften und weitere Nachrichten auswählen.
