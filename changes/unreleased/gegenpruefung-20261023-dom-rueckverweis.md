kategorie: Behoben

- Ändert eine Seite ein Nomen, dessen Begleitwort im vorangehenden Text
  mitumgewandelt wurde („Das Projekt des <em>Künstlers</em>“), wird das
  Begleitwort zurückgesetzt und mit dem neuen Nomen neu berechnet. Bisher
  blieb „des“ stehen und das neue Nomen markiert („des Lehrer*in“).
- Ein Begleitwort in geschütztem Text (`<code>`, editierbare Bereiche) wird
  nicht gelesen, verhindert aber, dass das folgende Nomen allein umgewandelt
  wird, wenn sich das Begleitwort dafür ändern müsste („Das Projekt
  <code>der </code><em>Künstler*in</em>“ bleibt).
- „jede Kund*in … in ihrer Sprache“ wird zu „jeder Kunde … in seiner
  Sprache“, „jede Teilnehmer*in ihren Ort, ihre Rolle“ zu „jeder Teilnehmer
  seinen Ort, seine Rolle“. Nur im selben Teilsatz und nur, wenn davor kein
  anderer möglicher Besitzer steht („Die Firmen beraten jede Kund*in in
  ihren Filialen“ bleibt).
- Pluralreparatur prüft Dativauslöser erst, wenn einer in der Nähe steht.
