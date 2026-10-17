# Begrenzte Auswahl der Ersetzungsübersicht

17.10.2026: Der Content-Script-Transport überträgt seit dem bestehenden
Protokoll höchstens 250 Ersetzungspaare. Bisher erzeugte der DOM-Prozessor
jedoch für jede Meldung eine Kopie und Sortierung aller unterschiedlichen
Paare; erst danach schnitt der Transport das Ergebnis ab.

`selectReplacementSummaries` ermittelt dasselbe sortierte Präfix mit einem
Max-Heap von höchstens K Einträgen. Nur die ausgewählten Einträge werden
kopiert und abschließend sortiert. Aufwand O(N log K), zusätzlicher Speicher
O(K). Der gesamte Index wird weiterhin durchsucht; dies ist kein harter
Zeitdeckel für beliebig große Seiten. Kleine Seiten verwenden im Prozessor
den bisherigen vollständigen Sortierpfad. Ohne explizite Grenze bleibt die
vollständige öffentliche Abfrage unverändert verfügbar. Die Meldungsoption
wird ausschließlich im Content-Script auf die bestehende Grenze 250 gesetzt.
Der zusätzliche defensive Schnitt unmittelbar vor dem Versand bleibt erhalten.

Zähler, Index, Regeln, Wiederherstellung und Rangfolge ändern sich nicht.
Grenze 0, ungültige Grenzen, exakte Sortierpräfixe bei 10.000 gemischten
Einträgen, unabhängige Ergebniskopien und begrenzte Meldungen bei unverändertem
Gesamtzähler sind regressionsgeprüft. Zwei zunächst rote Gesamttests deckten
den fehlenden defensiven Schnitt bei einer gemockten direkten Statusabfrage
und eine veraltete Quelltext-Erwartung auf; beides ist vor Abnahme korrigiert.

## Lokale Verifikation

- Vollsuite: 262 Dateien, 10.875 Tests erfolgreich.
- TypeScript, Chromium-/Firefox-Build und Veröffentlichungsaudit erfolgreich.
- Native Chromium- und Firefox-Smokes erfolgreich: statische/dynamische Texte,
  zugängliche Attribute, geschützter Code/Eingaben, native Inline-/große
  Einzeltext-Ranges und Wiederherstellung. Firefox nutzte einen freien lokalen
  Port, nachdem der Standardport vor Browserstart abgewiesen wurde.
- Synthetischer Helper-Vergleich: neun Messungen nach Aufwärmung, gleicher
  Eingabebestand und bytegleiches Sortierpräfix. Keine Zeitgrenze im Unit-Test.

| Unterschiedliche Einträge | Bisheriger Vollaufbau, Median | Begrenzte Auswahl, Median |
| --- | --- | --- |
| 20.000 | 5,2881 ms | 0,4100 ms |
| 50.000 | 16,6457 ms | 0,4659 ms |

Dies sind lokale synthetische Auswahlzeiten, keine native Videomessung oder
Aussage über jede Hardware. Kleine Bestände profitieren nicht vom Heap;
der Produktpfad vermeidet ihn, wenn bereits alle Einträge in die Meldung passen.
Die bisherigen Video-Fixtures verwenden nur wenige unterschiedliche Paare.
Diese Korrektur erklärt oder beseitigt deren historische rote Gegenbefunde
nicht nachweislich. Die gesamte Performanceabnahme aus #419 bleibt offen;
PR #451 bleibt Entwurf. Keine neuen Berechtigungen oder Abhängigkeiten.

## Identische Hintergrundmeldungen

Eine weitere reproduzierte unnötige Arbeit liegt in `updateTabState`: Zwei
vollständig identische, nacheinander abgeschlossene Meldungen lösten bisher
jeweils Session-Schreiben, zwei Badge-Aufrufe und zwei Broadcasts aus. Der
neue Erfolgsindex überspringt diese Arbeit nur, wenn Hostname, Gesamtzähler
und alle begrenzten Paare einschließlich Reihenfolge und Anzahl mit dem
aktuellen Speicherzustand und der letzten erfolgreichen Veröffentlichung
übereinstimmen. Der Vergleich ist auf die bestehende Meldungsgröße begrenzt.

Während laufender Veröffentlichungen wird nicht übersprungen. Fehler bei der
Persistenz oder Badge-Aktualisierung lassen einen erneuten Versuch zu;
Navigation und Tab-Schließen löschen die Erfolgskennung. Späte Ergebnisse
werden nicht als Erfolg eines anderen aktuellen Zustands gespeichert. Dies
bevorzugt bei Rennen gegebenenfalls zusätzliche Arbeit gegenüber verlorenen
Aktualisierungen. Fehlende Broadcast-Empfänger werden weiterhin wie bisher
behandelt, da normalerweise kein Popup geöffnet ist.

Verifikation: vollständige Suite 263 Dateien / 10.879 Tests vor einer weiteren
gezielten Parallelitätsregression, TypeScript, beide Builds, Audit und native
Chromium-/Firefox-Smokes erfolgreich. Die abschließend ergänzte Regression
prüft zusätzlich die Rückkehr zum alten Wert, während ein abweichender Zustand
noch veröffentlicht wird; alle sieben gezielten Hintergrundtests und TypeScript
bestehen. Kein zusätzlicher Timing- oder Videowirksamkeitsnachweis wird daraus
abgeleitet. Die historischen Browserwarte-Gegenbefunde bleiben offen.
