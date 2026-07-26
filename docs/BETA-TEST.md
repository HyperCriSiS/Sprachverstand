# Sprachverstand 0.3.0 – Beta 1 testen

Diese Beta ist für manuelle Funktions-, Kompatibilitäts- und Fehlertreffertests
gedacht. Sie ist noch nicht für den Browser-Store signiert.

## Enthaltene Pakete

- `sprachverstand-0.3.0-beta.1-chromium.zip`
- `sprachverstand-0.3.0-beta.1-firefox.xpi`
- `sprachverstand-0.3.0-beta.1-source.zip`
- `SHA256SUMS.txt`

## Chromium installieren

1. Das Chromium-ZIP entpacken.
2. `chrome://extensions` beziehungsweise die Erweiterungsseite des Browsers
   öffnen.
3. Den Entwicklermodus aktivieren.
4. **Entpackte Erweiterung laden** wählen.
5. Den entpackten Ordner auswählen.

## Firefox installieren

Die XPI ist noch nicht von Mozilla signiert und kann deshalb in einem normalen
Firefox-Profil nicht dauerhaft installiert werden.

1. `about:debugging#/runtime/this-firefox` öffnen.
2. **Temporäres Add-on laden** wählen.
3. Die Datei `sprachverstand-0.3.0-beta.1-firefox.xpi` auswählen.

Alternativ kann der entpackte Firefox-Build über dessen `manifest.json` geladen
werden. Nach einem Neustart muss eine temporäre Erweiterung erneut geladen
werden.

## Lokale Testseite starten

Im Repository:

```bash
python -m http.server 8080
```

Danach öffnen:

```text
http://127.0.0.1:8080/tests/manual/beta-fixture.html
```

Die Testseite enthält sichtbaren Text, zugängliche Attribute, geschützte
Bereiche und nachträglich eingefügte Inhalte.

## Erwartete Ergebnisse

### Sichtbarer Text

```text
Nutzer:innen sprechen mit Ärztinnen und Ärzten.
→ Nutzer sprechen mit Ärzten.

Jede:r Student:in kennt eine:n Koautor:in.
→ Jeder Student kennt einen Koautor.
```

`Die Kundin ruft an` muss unverändert bleiben.

### Zugängliche Attribute

Mit den Entwicklerwerkzeugen prüfen:

```text
alt="Nutzer:innen betrachten das Bild"
→ alt="Nutzer betrachten das Bild"

aria-label="Nutzer:innen informieren"
→ aria-label="Nutzer informieren"

title="Ärzt:innen anzeigen"
→ title="Ärzte anzeigen"
```

`data-label="Nutzer:innen"` muss unverändert bleiben.

### Geschützte Inhalte

Unverändert bleiben müssen:

- `code` und `pre`
- `contenteditable`
- `textarea` und Eingabefelder
- Elemente mit `data-sprachverstand-ignore`
- Elemente mit `aria-hidden="true"`
- `LinkedIn`, `LogIn`, `Innen- und Außendienst`, `gewinnen`, `ersinnen`

### Dynamische Inhalte

Nach etwa einer Sekunde werden ein neuer Absatz, ein `aria-label` und ein
`title` eingefügt beziehungsweise geändert. Diese Inhalte müssen ohne Neuladen
der Seite normalisiert werden. Das gleichzeitig gesetzte `data-label` muss
unverändert bleiben.

## Reale Seitentests

Besonders wichtig sind:

1. DHL-Anmeldung: Anmeldung, Eingaben und Schaltflächen dürfen nicht beschädigt
   werden.
2. ARD und andere Mediatheken: nachgeladene Listen und Dialoge prüfen.
3. rebuy und andere Single-Page-Anwendungen: Navigation ohne vollständiges
   Neuladen prüfen.
4. Große Nachrichtenseiten: Scrollen, Nachladen und CPU-Auslastung beobachten.
5. React-, Angular- und Vue-Seiten: Dialoge, Tabs und dynamische Beschriftungen
   prüfen.
6. Webseiten mit Screenreader: `alt`, `aria-label`, `aria-description` und
   `title` kontrollieren.

## Fehler melden

Eine Meldung sollte enthalten:

- Browser und genaue Version
- Betriebssystem
- betroffene Adresse
- ursprünglicher Text oder Attributwert
- erzeugtes Ergebnis
- erwartetes Ergebnis
- reproduzierbare Schritte
- Angabe, ob Eingabe, Editor, dynamischer Inhalt oder zugängliches Attribut
  betroffen ist

Keine Zugangsdaten, privaten Nachrichten oder persönlichen Inhalte in eine
Meldung kopieren.
