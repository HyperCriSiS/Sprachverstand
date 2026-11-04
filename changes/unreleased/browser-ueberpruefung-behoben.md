kategorie: Behoben

- Chromium-Pakete verlangen jetzt Chrome 148: ältere Versionen erhielten vom
  Hintergrund keine Antworten und fragten jeden Text sekündlich neu an. Ein
  fehlschlagender lokaler Transformer wird je Text oder Attribut nur noch
  dreimal mit wachsendem Abstand wiederholt; aufgegebene Einträge kommen an die
  Reihe, sobald der Hintergrund wieder antwortet.
- Das Content-Script beantwortet die Zustandsabfrage des Hintergrunds als
  Promise; vorher kam die Antwort weder in Firefox noch in Chromium an. Nach
  einer Rückkehr aus dem Seitencache meldet es Zähler und Ersetzungen erneut.
- Der Titel des Browser-Tabs bleibt immer unverändert; bisher wurde er nur bei
  einer späteren Änderung durch die Seite umgewandelt.
- Bildbeschreibungen innerhalb von Eingabe-Widgets mit `role="textbox"`,
  `searchbox`, `combobox` oder `spinbutton` bleiben wie deren Text unverändert.
