# Beiträge zu Sprachverstand

Beiträge sind willkommen, sofern Herkunft, Lizenz und Testbarkeit eindeutig
bleiben.

## Lizenz der Beiträge

Mit dem Einreichen eines Beitrags bestätigst Du, dass Du ihn unter
`AGPL-3.0-only` zur Verfügung stellen darfst und dass er als Bestandteil von
Sprachverstand unter dieser Lizenz veröffentlicht werden darf.

Der Name **Sprachverstand**, das SV-Logo und andere Herkunftskennzeichen sind
nicht Teil dieser Lizenzfreigabe. Es gilt [`TRADEMARKS.md`](TRADEMARKS.md).

## Developer Certificate of Origin

Commits sollen mit `git commit -s` signiert werden. Die `Signed-off-by`-Zeile
bestätigt das [Developer Certificate of Origin 1.1](https://developercertificate.org/):
Du hast den Beitrag selbst erstellt oder darfst ihn unter der Projektlizenz
weitergeben.

## Sprachregeln und Daten

Neue Sprachregeln benötigen:

1. nachvollziehbare Positivbeispiele,
2. naheliegende Negativ- und Fehlertreffer,
3. korrekte Flexion für die betroffenen Kasus und Numeri,
4. Berücksichtigung von Großschreibung und Komposita,
5. eine Einordnung in eine sichtbare Regelgruppe,
6. automatisierte Tests.

Vollständige fremde Wörterbücher, Regelbestände, Regexsammlungen oder
lizenzrechtlich unklare Datensätze dürfen nicht ohne vorherige Prüfung
importiert werden. Einzelne allgemeinsprachliche Flexionsangaben werden in der
projektspezifischen Datenstruktur eigenständig modelliert.

Das Verfahren ist ausführlicher in [`docs/LEXICON.md`](docs/LEXICON.md)
beschrieben.

## Technische Prüfung

Vor einem Pull Request:

```bash
npm install
npm run check
```

Pull Requests sollten Problem, gewünschtes Verhalten, Sicherheitsgrenzen und
neue Tests knapp beschreiben.
