# Sprachverstand – Prerelease testen

Diese Anleitung bündelt die technischen, sprachlichen und manuellen Prüfungen
für Release Candidates und andere Prereleases. Maßgeblich ist immer der Tag,
aus dem die beigefügten Pakete gebaut wurden.

## Enthaltene Pakete

- `sprachverstand-<release>-chromium.zip` für Chromium-basierte Browser
- `sprachverstand-<release>-edge.zip` nur, wenn der Edge-Build vom Chromium-Build abweicht
- `sprachverstand-<release>-opera.zip` nur, wenn der Opera-Build vom Chromium-Build abweicht
- `sprachverstand-<release>-firefox.xpi`
- `sprachverstand-<release>-source.zip`
- `SHA256SUMS.txt`
- `SOURCE_COMMIT.txt`
- `BETA-TEST.md`
- `AMO-SOURCE-INSTRUCTIONS.md`
- `EDGE-SUBMISSION.md`
- `OPERA-SUBMISSION.md`

## Prüfsummen und Commit kontrollieren

```bash
sha256sum -c SHA256SUMS.txt
```

Unter Windows können die Werte mit
`Get-FileHash -Algorithm SHA256 DATEINAME` verglichen werden.

Der Inhalt von `SOURCE_COMMIT.txt` muss mit dem Commit des getesteten Tags
übereinstimmen.

## Chromium / Chrome testen

1. `sprachverstand-<release>-chromium.zip` entpacken.
2. `chrome://extensions` öffnen.
3. Entwicklermodus aktivieren.
4. **Entpackte Erweiterung laden** wählen und den entpackten Ordner auswählen.
5. Popup, Optionsseite und dynamische Textänderungen testen.

## Firefox testen

1. `sprachverstand-<release>-firefox.xpi` herunterladen.
2. Für einen schnellen Test `about:debugging` öffnen und die entpackte XPI
   beziehungsweise deren `manifest.json` temporär laden.
3. Für einen realistischen Installationstest die signierte AMO-Version verwenden,
   sobald sie verfügbar ist.
4. Popup, Optionsseite und dynamische Textänderungen testen.

## Microsoft Edge testen

1. Falls `sprachverstand-<release>-edge.zip` im Release vorhanden ist, dieses
   verwenden. Andernfalls `sprachverstand-<release>-chromium.zip` entpacken.
2. `edge://extensions` öffnen.
3. Entwicklermodus aktivieren.
4. **Entpackte Erweiterung laden** wählen und den entpackten Ordner auswählen.
5. Popup, Optionsseite und dynamische Textänderungen testen.

## Opera testen

1. Falls `sprachverstand-<release>-opera.zip` im Release vorhanden ist, dieses
   verwenden. Andernfalls `sprachverstand-<release>-chromium.zip` entpacken.
2. `opera:extensions` öffnen.
3. Entwicklermodus aktivieren.
4. **Load unpacked extension** wählen und den entpackten Ordner auswählen.
5. Popup, Optionsseite und dynamische Textänderungen testen.

## Funktionsprüfung

Für alle Browser sollten mindestens folgende Punkte geprüft werden:

1. Erweiterung aktiviert: typische Formen wie `Nutzer:innen`, `Mitarbeiter*innen`
   und `NutzerInnen` werden entsprechend der aktiven Regeln ersetzt.
2. Erweiterung deaktiviert: vorgenommene Änderungen werden wiederhergestellt.
3. dynamisch nachgeladene Inhalte werden verarbeitet.
4. Seitenstatus und Korrekturzähler im Popup stimmen.
5. die Detailansicht zeigt die tatsächlich vorgenommenen Ersetzungen.
6. persönliche Regeln und geschützte Begriffe funktionieren.
7. Optionsänderungen werden ohne Browserneustart übernommen.
8. Untertiteloptionen beeinträchtigen normale Seitentexte nicht.

## Reale Webseiten

Die aktuelle manuelle Testmatrix steht in `docs/REAL-WORLD-TEST-MATRIX.md`.
Sie enthält unter anderem Kununu, StepStone, die Arbeitsagentur, DHL, YouTube,
GitHub, Wikipedia und taz.

## Fehler melden

Bei einem Fehler bitte Browser, Browserversion, Betriebssystem, betroffene URL,
aktivierte Regelgruppen und ein minimales reproduzierbares Beispiel angeben.
