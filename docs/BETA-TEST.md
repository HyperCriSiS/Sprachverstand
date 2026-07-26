# Sprachverstand 0.4.1 – Beta 3 testen

Diese Beta ergänzt reversible Seitenänderungen, Live-Counter, konkrete
Regelgruppen, persönliche Ausnahmen und die mobile Firefox-Oberfläche.

## Enthaltene Pakete

- `sprachverstand-0.4.1-beta.3-chromium.zip`
- `sprachverstand-0.4.1-beta.3-firefox.xpi`
- `sprachverstand-0.4.1-beta.3-source.zip`
- `SHA256SUMS.txt`

## Prüfsummen kontrollieren

```bash
sha256sum -c SHA256SUMS.txt
```

Unter Windows können die Werte mit
`Get-FileHash -Algorithm SHA256 DATEINAME` verglichen werden.

## Desktop installieren

### Chromium

1. Chromium-ZIP entpacken.
2. `chrome://extensions` öffnen.
3. Entwicklermodus aktivieren.
4. **Entpackte Erweiterung laden** wählen.
5. Den entpackten Ordner auswählen.

### Firefox

1. `about:debugging#/runtime/this-firefox` öffnen.
2. **Temporäres Add-on laden** wählen.
3. Die Firefox-XPI oder `dist/firefox/manifest.json` auswählen.

## Firefox für Android testen

Google Chrome auf Android unterstützt keine Erweiterungen. Das verbindliche
Mobilziel ist Firefox für Android ab Version 142.

Mit aktiviertem USB-Debugging, ADB und einem verbundenen Android-Gerät:

```bash
npm install
npm run build:firefox
npx web-ext run \
  --source-dir dist/firefox \
  --target=firefox-android
```

Bei mehreren Geräten oder Firefox-Varianten können zusätzlich
`--android-device` und `--firefox-apk=org.mozilla.firefox` angegeben werden.

Auf dem Gerät prüfen:

- Popup vollständig sichtbar und ohne horizontales Scrollen
- Schalter und Schaltflächen gut per Touch bedienbar
- Optionsseite im normalen Tab
- Regelkarten auf ungefähr 360 × 640 dp
- Bildschirmtastatur verdeckt Speichern nicht dauerhaft
- Systemhelligkeit und Dunkelmodus
- Zurück-Navigation aus der Optionsseite
- Counter im Popup, falls das Android-Menü kein Badge am Symbol zeigt

## Funktionsprüfungen

### Sofortiges An- und Ausschalten

1. Eine Seite mit erkannten Formen öffnen.
2. Sprachverstand ausschalten.
3. Der ursprüngliche Text muss ohne Reload zurückkehren.
4. Wieder einschalten.
5. Der Text muss erneut korrigiert werden.

Hat die Webseite einen Wert nach der Korrektur selbst verändert, darf
Sprachverstand diese spätere Änderung beim Ausschalten nicht überschreiben.

### Live-Counter

- Das Badge am Symbol zeigt die Zahl erkannter Korrekturen pro Tab.
- Im Popup steht dieselbe Zahl als Text.
- Null wird im Badge ausgeblendet.
- Werte über 999 erscheinen als `999+`.
- Beim Ausschalten fällt der Wert auf null.
- Entfernte dynamische Inhalte dürfen nicht dauerhaft weitergezählt werden.

Der Counter zählt korrigierte Fundstellen. Eine zusammengeführte Doppelnennung
ist daher eine Korrektur, nicht zwingend die Zahl aller beteiligten Wörter.

### Regelgruppen

Jede der acht Gruppen einzeln deaktivieren und prüfen, dass nur die zugehörigen
Formen auf den Ursprungszustand zurückgesetzt werden. Die anderen Gruppen müssen
aktiv bleiben.

### Persönliche Ausnahmen

Als persönliche Ausnahme eintragen:

```text
Nutzer:innen
```

Danach gilt:

```text
Nutzer:innen       → bleibt unverändert
Nutzer:innenkonto  → wird weiterhin zu Nutzerkonto
```

Für das Kompositum muss bei Bedarf die vollständige Form separat eingetragen
werden. Phrasen funktionieren entsprechend vollständig und ohne reguläre
Ausdrücke.

Die Ausnahmen werden lokal gespeichert und nicht über Browser-Sync übertragen.

### Zugängliche Attribute

Die Option für `alt`, `aria-label`, `aria-description` und `title` ausschalten.
Sichtbarer Text muss weiterhin korrigiert werden, diese Attribute aber nicht.

## Lokale Testseite

```bash
python -m http.server 8080
```

Danach öffnen:

```text
http://127.0.0.1:8080/tests/manual/beta-fixture.html
```

### Popup-Breite

Das Popup muss auf Desktop und Android als normal lesbares Bedienfeld erscheinen.
Ein nur wenige Millimeter breiter Streifen ist ein Fehler.

### Anreden und Schrägstrich-Bindestrich

```text
Sehr geehrte Mitarbeitende → Sehr geehrte Mitarbeiter
Liebe Teilnehmende → Liebe Teilnehmer
Sehr geehrte Nutzende unserer Produkte → Sehr geehrte Nutzer unserer Produkte
„Mitarbeiter/-innen“ → „Mitarbeiter“
```

Unverändert bleiben müssen:

```text
Sehr geehrte Persönlichkeiten
Liebes Kollegium
Die Mitarbeitenden arbeiten.
```

## Reale Seitentests

Besonders wichtig bleiben:

1. DHL-Anmeldung
2. ARD und andere Mediatheken
3. rebuy und weitere Single-Page-Anwendungen
4. große Nachrichtenseiten
5. React-, Angular- und Vue-Seiten
6. Screenreader-Test der zugänglichen Attribute
7. dieselben kritischen Wege in Firefox für Android

## Fehler melden

Eine Meldung sollte Browser, Version, Betriebssystem, Adresse, Ausgangstext,
Ergebnis, Erwartung und reproduzierbare Schritte enthalten. Keine Zugangsdaten,
privaten Nachrichten oder persönlichen Inhalte mitsenden.
