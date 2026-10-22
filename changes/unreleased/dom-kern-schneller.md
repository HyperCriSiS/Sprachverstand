kategorie: Leistung

- Schnellere Textänderung im DOM-Kern: Die Prüfung vor der Bereichs-erhaltenden Änderung legt keine Kinderlisten (`childNodes`, `children`) mehr pro Textknoten an, und Elemente ohne Attribute überspringen die Untertitelprüfung. Synchroner Initialscan in Chrome 155 um 22–31 %, in Firefox 158 um 14–41 % schneller.
