# Chrome Web Store API V2

Sprachverstand verwendet für automatisierbare Chrome-Store-Schritte ausschließlich die aktuelle Chrome Web Store API V2.

Die API deckt **Paket-Upload, Statusabfrage und Veröffentlichung** ab. Store-Eintrag, Datenschutzformular und Sichtbarkeit bleiben Aufgaben im Chrome Web Store Developer Dashboard. Die API V2 kann außerdem keine neuen Store-Einträge anlegen.

## Voraussetzungen

Im Chrome Web Store Developer Dashboard werden benötigt:

- Publisher-ID
- ID der bereits angelegten Erweiterung

Für OAuth werden entweder ein bereits gültiges Zugriffstoken oder die Daten zum Erneuern eines Zugriffstokens benötigt.

Die Skripte lesen ausschließlich Umgebungsvariablen. Zugangsdaten dürfen nicht in das Repository geschrieben werden.

### Erforderliche Variablen

Immer:

```text
CWS_PUBLISHER_ID
CWS_EXTENSION_ID
```

Variante A – vorhandenes Zugriffstoken:

```text
CWS_ACCESS_TOKEN
```

Variante B – automatische Token-Erneuerung:

```text
CWS_CLIENT_ID
CWS_CLIENT_SECRET
CWS_REFRESH_TOKEN
```

## Befehle

Status des Store-Eintrags abrufen:

```bash
npm run cws:status
```

Ein bereits gebautes Chromium-ZIP hochladen:

```bash
npm run cws:upload -- artifacts/sprachverstand-chromium-0.7.2.zip
```

Die hochgeladene Version zur Prüfung und Veröffentlichung einreichen:

```bash
npm run cws:publish
```

`status` verwendet `GET ...:fetchStatus`. `upload` und `publish` verwenden die POST-Endpunkte der API V2.

## Bewusste Grenzen

Das Skript:

- legt keinen neuen Chrome-Web-Store-Eintrag an,
- ändert keine Sichtbarkeit,
- schreibt keine Langbeschreibung oder Screenshots in das Dashboard,
- veröffentlicht nichts automatisch während normaler GitHub-Actions-Läufe.

Die 51 lokalisierten Langbeschreibungen können mit `npm run store:generate` als `store/generated/chrome-dashboard.csv` erzeugt werden. Diese CSV ist eine Arbeitsdatei für die manuelle Übertragung und **kein offizielles Chrome-Importformat**.

Eine spätere GitHub-Actions-Anbindung kann auf denselben Befehlen aufbauen. Dafür müssen die OAuth-Daten als GitHub-Secrets hinterlegt werden.
