kategorie: Leistung

- Dynamisch eingefügter Text wird verarbeitet, bevor der Erstscan einer großen
  Seite endet. Ohne `scheduler.postTask` laufen die Zeitscheiben über einen
  Nachrichtenkanal statt über verschachtelte Timer; in Pale Moon war jede
  Scheibe dadurch auf einen Schritt gedrosselt. Eine Titeländerung reiht nicht
  mehr die ganze Seite neu ein.
