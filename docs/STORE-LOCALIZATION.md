# Store-Lokalisierung

Die Storetexte werden getrennt von den 161 WebExtension-i18n-Nachrichten gepflegt. Dadurch bleibt die Laufzeitoberfläche stabil, während Store-Beschreibungen unabhängig erweitert und geprüft werden können.

## Quellen

- `static/_locales/<locale>/messages.json` → `extensionDescription` ist zugleich die store-taugliche Kurzbeschreibung.
- `store/listings/<locale>.json` → vollständige Store-Beschreibung für die jeweilige Sprache.
- `docs/STORE-LISTING-DE.md` bleibt die fachliche Referenz für Datenschutz-, Berechtigungs- und Veröffentlichungsangaben.

Der Produktname **Sprachverstand** wird in keiner Sprache übersetzt. Alle Storetexte müssen deutlich machen, dass Sprachverstand deutschsprachige Webseitentexte verarbeitet und keine Webseiten übersetzt.

## Regeln

1. Die Kurzbeschreibung darf höchstens 132 Zeichen lang sein.
2. Eine vollständige Beschreibung darf erst als fertig gelten, wenn eine gleichnamige JSON-Datei unter `store/listings/` vorhanden ist.
3. Deutsche Beispiele wie `Nutzer:innen` und `Mitarbeiter*innen` bleiben in allen Sprachen unverändert, weil sie die tatsächlich verarbeiteten Schreibweisen zeigen.
4. Die Funktionsbeschreibung muss mit dem deutschen Referenztext übereinstimmen. Lokalisierungen dürfen keine zusätzlichen Funktionen versprechen.
5. Datenschutzangaben müssen lokale Verarbeitung, fehlendes Tracking und die nur optionale Browser-Synchronisierung korrekt wiedergeben.
6. Globale Screenshots werden standardmäßig wiederverwendet. Lokalisierte Screenshots werden nur erstellt, wenn ein konkreter Nutzen erkennbar ist.
7. Store-spezifische Formulartexte zu Berechtigungen und Datenschutz bleiben getrennt von den allgemeinen Vollbeschreibungen.

## Prüfung

`npm run validate:store` prüft:

- alle 51 `extensionDescription`-Texte gegen das 132-Zeichen-Limit,
- dass Store-Dateien nur für konfigurierte Locales existieren,
- Dateiname, Locale und Produktname,
- eine Mindestlänge für vollständige Beschreibungen,
- gemeinsame deutsche Beispiel- und Technikmarker,
- dass keine HTML-Tags in die Storebeschreibung geraten.

Während der Übersetzungsphase dürfen Vollbeschreibungen schrittweise ergänzt werden. Der Validator meldet deshalb den aktuellen Stand als `X/51`, ohne fehlende Vollbeschreibungen vor Abschluss der Roadmap als Fehler zu behandeln.
