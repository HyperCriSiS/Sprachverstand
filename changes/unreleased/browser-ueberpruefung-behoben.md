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
- Sehr lange Inline-Abschnitte (über 16 000 Zeichen ohne Blockelement, etwa
  Chat- oder Forenbeiträge aus vielen Spans) werden auch dann korrigiert, wenn
  Zitatschutz oder persönliche Ausnahmen aktiv sind; bisher blieb dort alles
  unverändert.
- Ein über ein Inline-Element getrennter Marker (`Lehrer*<b>innen</b>`) wird
  auch dann umgewandelt, wenn der Text davor bereits eine eigene Korrektur
  trägt oder seine Antwort aus dem Hintergrund später eintrifft als die des
  Markers.
- Zitate bleiben über geschützte Inline-Elemente (`<code>`, `aria-hidden`) und
  technische Textknoten (Links, E-Mail-Adressen) hinweg zusammen; bisher endete
  der Zitatschutz an solchen Elementen.
- Persönliche Ausnahmen aus mehreren Wörtern greifen auch mit geschütztem
  Leerzeichen oder einem Zeilenumbruch (`<br>`) zwischen den Wörtern.
- Zollzeichen (`24"`) öffnen oder schließen kein Zitat mehr, ein einzelnes
  „““ nach einem Wort gilt als schließendes Zeichen, und ein geöffnetes „„“
  ohne schließendes Zeichen schützt bis zum Ende des Textabschnitts.
- Eine synchronisierte Regelgruppenliste eines Geräts mit älterer Version
  schaltet neue Standardgruppen nicht mehr überall ab: Die Liste trägt jetzt
  die schreibende Revision, und das lesende Gerät wendet seine Migrationen an.
  Synchronisierte Textoptionen ohne ein neueres Feld behalten dafür den
  lokalen Wert statt des Standards.
- Überschreitet eine synchronisierte Kategorie das sichere Größenlimit, werden
  die Einstellungen trotzdem lokal gespeichert; nur diese Kategorie bleibt auf
  anderen Geräten auf ihrem bisherigen Stand, und die Einstellungsseite nennt
  die Kategorie und die Größe.
- Nach einer fehlgeschlagenen Browser-Synchronisierung bietet das Gerät seinen
  lokalen Stand beim nächsten Laden erneut an, statt Änderungen anderer Geräte
  bis zum nächsten manuellen Speichern zu ignorieren. Jedes Speichern schreibt
  nur noch geänderte Synchronisierungsschlüssel.
- Ein mit zerlegten Umlauten (NFD) geschriebenes Wort erhält nur noch seine
  eigenen Codeeinheiten zurück; ein gleiches, bereits komponiertes Wort im
  selben Text blieb bisher nicht byteidentisch.
