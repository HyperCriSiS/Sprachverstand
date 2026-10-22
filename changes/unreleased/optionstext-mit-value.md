kategorie: Geändert

- Einträge in Auswahllisten (`<option>`) werden umgewandelt, wenn sie ein eigenes `value` haben: Gesendet wird dann der Wert, nicht der sichtbare Text. Optionen ohne `value` bleiben geschützt, weil ihr Text der Formularwert ist; wird `value` nachträglich entfernt, kehrt der Originaltext zurück.
