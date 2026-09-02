# Store-Automatisierung

Dieses Dokument beschreibt den sicheren Veröffentlichungsweg für Mozilla Add-ons (AMO) und den Chrome Web Store. Zugangsdaten werden nicht im Repository gespeichert.

## Release-Notes als zentrale Quelle

Nutzerorientierte Store-Release-Notes liegen unter:

- `store/release-notes/<version>.json`
- `store/release-notes/current.json` verweist auf die aktuell vorbereitete stabile Version.

Jede Release-Datei enthält exakt die 51 Store-Locales. Aus dieser Quelle erzeugen die Skripte automatisch:

- 29 lokalisierte AMO-Release-Notes (`store/generated/amo-release-notes.json`),
- AMO-Metadaten,
- Chrome-Dashboard-Texte für 51 Locales mit einem Abschnitt „Neu in …“ vor der normalen Beschreibung,
- Edge-/Opera-Arbeitslisten.

Der Release-Workflow erzeugt diese Dateien für die Version des Tags und hängt sie als prüfsummenabgesicherte GitHub-Release-Artefakte an. Fehlen Release-Notes für eine stabile Version, darf der Release nicht erfolgreich durchlaufen.

Die Store-Notes sind bewusst nicht identisch mit dem automatisch erzeugten GitHub-Changelog: Sie enthalten nur nutzerrelevante Änderungen und keine internen CI-, Dependabot- oder Infrastrukturdetails.

## GitHub-Environment `store-production`

Für echte Store-Einreichungen wird ein GitHub-Environment namens `store-production` verwendet.

Empfohlene Einstellungen unter **Settings → Environments → store-production**:

1. Deployment-Branches auf `main` begrenzen.
2. Falls ein zweiter vertrauenswürdiger Reviewer verfügbar ist: Required Reviewer aktivieren und Self-Review verhindern.
3. AMO-Zugangsdaten nur als Environment-Secrets speichern, niemals als Repository-Datei.
4. Nicht geheime IDs als Environment-Variablen speichern.

Der Workflow `.github/workflows/store-publish.yml` darf nur von `main` gestartet werden. Die Jobs mit Store-Zugriff checken ebenfalls ausschließlich `main` aus. Die eigentlichen Browserpakete und Release-Notes werden dagegen aus dem ausgewählten, bereits veröffentlichten GitHub-Release geladen und anhand von `SHA256SUMS.txt` geprüft. Dadurch werden Store-Secrets nicht an Code aus einem beliebigen Tag weitergereicht.

Store-Einreichungen akzeptieren nur stabile Tags wie `v0.7.2`. RC-/Beta-Tags werden im `submit`-Modus abgewiesen.

## Mozilla Add-ons (AMO)

### Zugangsdaten anlegen

Mozilla verwendet für die externe API einen API-Key und ein Secret. Daraus wird pro API-Aufruf ein kurzlebiges HS256-JWT erzeugt.

1. Im AMO Developer Hub die **API Credentials** öffnen und einen API-Key samt Secret erzeugen.
2. In GitHub unter **Settings → Environments → store-production** folgende Secrets anlegen:
   - `AMO_API_KEY`
   - `AMO_API_SECRET`
3. Als Environment-Variable anlegen:
   - `AMO_ADDON_ID` = GUID, Slug oder numerische AMO-ID von Sprachverstand.

Das Secret wird nur im Store-Job als Umgebungsvariable verfügbar. `scripts/amo-api-v5.mjs` erzeugt für jeden Request ein neues JWT mit zufälliger `jti` und 60 Sekunden Laufzeit. Das JWT wird weder auf Platte geschrieben noch als Workflow-Artefakt gespeichert.

### Automatisierter AMO-Ablauf

Der Workflow erledigt bei `target=amo` und `mode=submit`:

1. Authentifizierung gegen das AMO-Profil prüfen.
2. Firefox-XPI aus dem GitHub-Release laden und SHA-256 prüfen.
3. XPI als `listed` zu AMO hochladen.
4. AMO-Validierung pollen und bei Fehler abbrechen.
5. Erkannte XPI-Version gegen den Release-Tag prüfen.
6. Neue AMO-Version anlegen und das reproduzierbare Source-ZIP mitsenden.
7. `AGPL-3.0-only` als Lizenz setzen.
8. Die 29 lokalisierten Release-Notes aus dem GitHub-Release-Artefakt per Version-PATCH setzen.

Lokale Diagnosebefehle:

```bash
npm run amo:profile
npm run amo:notes -- 0.7.2 store/generated/amo-release-notes.json
npm run amo:submit -- firefox.xpi source.zip 0.7.2 store/generated/amo-release-notes.json
```

`amo:notes` ist zugleich der Recovery-Pfad, falls eine Version angelegt wurde, aber das nachfolgende Setzen der Release-Notes durch einen transienten API-Fehler scheitert.

## Chrome Web Store

### Bevorzugte Authentifizierung: GitHub OIDC + Google Workload Identity Federation

Für Google werden bewusst **keine langfristigen JSON-Service-Account-Keys** in GitHub gespeichert. GitHub stellt dem Workflow ein OIDC-Token aus; Google Workload Identity Federation tauscht es gegen ein kurzlebiges Access-Token für ein dediziertes Service Account.

### Google Cloud vorbereiten

1. Google-Cloud-Projekt auswählen oder anlegen.
2. **Chrome Web Store API** aktivieren. Für WIF außerdem die von Google vorausgesetzten IAM-/Security-Token-Service-/Service-Account-Credentials-APIs aktivieren.
3. Ein dediziertes Service Account anlegen. Für den Chrome Web Store selbst braucht es zunächst keine allgemeine Projektrolle.
4. Im **Chrome Web Store Developer Dashboard → Account** die E-Mail dieses Service Accounts zum Publisher-Konto hinzufügen. Google erlaubt derzeit nur ein Service Account pro Publisher-Konto.
5. Einen Workload Identity Pool und einen OIDC-Provider für GitHub anlegen. Issuer: `https://token.actions.githubusercontent.com/`
6. Mindestens folgende Claims mappen:
   - `google.subject=assertion.sub`
   - `attribute.repository_id=assertion.repository_id`
   - `attribute.repository_owner_id=assertion.repository_owner_id`
   - `attribute.ref=assertion.ref`
   - `attribute.environment=assertion.environment`
   - `attribute.workflow_ref=assertion.workflow_ref`
7. Den Provider mit einer Attribute Condition auf **dieses Repository, `main`, `store-production` und den Store-Workflow** begrenzen. Dabei die unveränderlichen numerischen `repository_id`/`repository_owner_id` verwenden, nicht nur Namen. Sinngemäß:

```text
assertion.repository_id == '<REPOSITORY_ID>' &&
assertion.repository_owner_id == '<OWNER_ID>' &&
assertion.ref == 'refs/heads/main' &&
assertion.environment == 'store-production' &&
assertion.workflow_ref == 'HyperCriSiS/Sprachverstand/.github/workflows/store-publish.yml@refs/heads/main'
```

8. Dem Workload-Identity-Principal auf dem Service Account `roles/iam.workloadIdentityUser` geben, damit der Workflow das Service Account impersonieren und ein kurzlebiges OAuth-Access-Token beziehen kann.

### GitHub-Variablen

Unter **Settings → Environments → store-production → Environment variables**:

- `GCP_WORKLOAD_IDENTITY_PROVIDER` – vollständiger Provider-Name, z. B. `projects/123456789/locations/global/workloadIdentityPools/github/providers/sprachverstand`
- `GCP_SERVICE_ACCOUNT` – E-Mail des Service Accounts
- `CWS_PUBLISHER_ID` – Publisher-ID aus dem Chrome Developer Dashboard
- `CWS_EXTENSION_ID` – ID der bereits angelegten Erweiterung

Für Google ist bei dieser Konfiguration **kein Secret notwendig**. Der Workflow besitzt nur für den Chrome-Job `id-token: write`. `google-github-actions/auth` wird auf einen vollständigen Commit-SHA gepinnt und erzeugt ein Access-Token mit 15 Minuten Laufzeit und ausschließlich dem Scope `https://www.googleapis.com/auth/chromewebstore`.

### Was die Chrome-Web-Store-API automatisiert

`scripts/chrome-web-store-v2.mjs` unterstützt:

```bash
npm run cws:status
npm run cws:upload -- paket.zip
npm run cws:wait
npm run cws:publish
npm run cws:cancel
npm run cws:rollout -- 25
```

Der Store-Workflow übernimmt automatisch:

1. Chromium-ZIP aus dem GitHub-Release laden und SHA-256 prüfen.
2. Kurzlebiges Google-Access-Token per OIDC/WIF beziehen.
3. Paket über Chrome Web Store API v2 hochladen.
4. Asynchronen Uploadstatus bis `SUCCEEDED` pollen.
5. Bei Uploadfehlern abbrechen.
6. Revision mit `publish` zur Veröffentlichung/Überprüfung einreichen.

Zusätzlich sind Statusabfrage, Abbruch einer aktiven Einreichung und ein prozentualer Rollout vorhanden. Der Rollout-Endpunkt ist laut Google nur für Erweiterungen mit mehr als 10.000 aktiven Nutzern in den letzten sieben Tagen verfügbar und kann den Prozentsatz nur erhöhen.

### Was Google derzeit nicht über unseren API-Pfad pflegt

Die Chrome Web Store API v2 bietet die Paket-/Status-/Publish-Endpunkte, aber keinen von uns verwendbaren versionsbezogenen `release_notes`-Endpunkt wie AMO und keinen Listing-Metadaten-Pfad in diesem Publishing-Workflow. Deshalb werden die lokalisierten „Neu in …“-Texte automatisch in die 51 fertigen Langbeschreibungen eingebaut und als `chrome-dashboard.html`/CSV erzeugt. Diese Listing-Texte werden anschließend im Developer Dashboard übernommen; kein Browser-Scraping und keine undokumentierte API wird verwendet.

## Workflow verwenden

Unter **Actions → Store Publish → Run workflow**:

1. Workflow von `main` starten.
2. stabilen Tag eintragen, z. B. `v0.7.2`.
3. `target`: `amo`, `chrome` oder `both`.
4. zuerst `mode=validate` ausführen. Dabei werden Release-Notes und Release-Artefakte geprüft, ohne Store-Zugangsdaten zu verwenden.
5. danach `mode=submit` starten. Erst die Store-Jobs referenzieren `store-production` und erhalten nach dessen Schutzregeln Zugriff auf AMO-Secrets beziehungsweise Google OIDC.

Die Store-Einreichung bleibt absichtlich ein separater, geschützter Schritt nach dem GitHub-Release. Dadurch führt ein normaler Tag oder GitHub-Release nicht unbeaufsichtigt zu einer externen Store-Veröffentlichung. Wenn dieser Ablauf einmal mit echten Zugangsdaten bewiesen ist, kann eine spätere Roadmap-Stufe stabile Releases automatisch in diesen geschützten Store-Pfad weiterreichen.
