kategorie: Behoben

- Entfernt oder ersetzt eine Seite das Nomen samt Inline-Element (etwa durch
  `<strong>Gemeinde</strong>`), wird das dafür geänderte Begleitwort sofort
  zurückgesetzt („Das Projekt der Gemeinde“ statt „des Gemeinde“).
- Ein geschützter Artikel mit eigenem Leerraumknoten davor
  (`<code>der</code> <em>Künstler*in</em>`) verhindert die Umwandlung des
  Nomens allein ebenfalls.
