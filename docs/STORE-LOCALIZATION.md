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

Nach Abschluss der Übersetzungsphase verlangt der Validator exakt 51 Vollbeschreibungen. Die Dateimenge unter `store/listings/` muss exakt der Locale-Matrix aus `config/locales.json` entsprechen; fehlende oder zusätzliche Listing-Dateien führen zu einem Fehler.

## Plattform-Ausgaben

`npm run store:generate` erzeugt reproduzierbare Arbeitsdateien unter `store/generated/`:

- AMO-Metadaten für die aktuell von AMO unterstützte Schnittmenge der Sprachverstand-Locales,
- eine Chrome-Dashboard-Arbeitsdatei für alle 51 Locales,
- eine Edge-Arbeitsdatei für alle 51 Locales,
- eine Opera-Arbeitsdatei für alle 51 Locales.

Die erzeugten Dateien sind keine zusätzlichen Quellen. Änderungen werden ausschließlich in `_locales` und `store/listings` gepflegt und danach neu erzeugt.

Details stehen in `docs/STORE-EXPORTS.md`. Die Chrome-Web-Store-API-V2-Hilfe ist in `docs/CHROME-WEB-STORE-API.md` dokumentiert.
