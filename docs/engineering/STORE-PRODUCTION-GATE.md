# Store-Produktionsfreigabe (Issue #331)

Sprachverstand ist ein Einzelentwickler-Projekt. Ein zweiter GitHub-Reviewer
wird **nicht** erzwungen. Store-Uploads werden trotzdem niemals durch einen
Tag, Push, Pull Request oder ein GitHub-Release ausgelöst, sondern nur durch
die ausdrückliche manuelle Aktion `Store Publish` (`workflow_dispatch`).

## Einmalige Einrichtung für einen Einzelentwickler

1. GitHub → Sprachverstand → Settings → Environments → New environment:
   `store-production` erstellen.
2. **Keine Required Reviewers** aktivieren; vorhandene Required-Reviewer-Regeln
   entfernen. Ein zweiter Account oder Collaborator ist nicht erforderlich.
3. `Allow administrators to bypass configured protection rules` deaktivieren.
   Unter `Deployment branches` **Protected branches only** einstellen
   (das bestehende `main`-Ruleset schützt `main`).
4. In `store-production` die unten genannten Secrets und Variablen hinterlegen.
   Für AMO beziehungsweise Google zuerst die jeweiligen Entwicklerzugänge
   konfigurieren, aber keine Geheimnisse in Logs, Issues oder Chat veröffentlichen.
5. Den ausschließlich lesenden manuellen Workflow
   **Store-Produktionsschutz prüfen** auf `main` erfolgreich ausführen.

## Strikte Freigabetrennung

- **Git-Tag**: Der bestehende `release.yml` kann einen öffentlichen
  **GitHub-Release mit ZIP/XPI-Archiven** automatisch erstellen. Das ist **kein**
  Store-Upload.
- **Store Publish**: besitzt ausschließlich `workflow_dispatch`, standardmäßig
  `mode: validate`. Es gibt **keinen** automatischen Store-Publisher bei Tags.
- **Store submit**: Nur manuell auf dem geschützten `main`, durch den
  Repository-Eigentümer selbst gestartet. Zusätzliche Prüfungen: stabiles
  Tag, Ziel `amo`/`chrome`/`both`, exakte Bestätigung
  `STORE-SUBMIT:<Tag>:<Ziel>`, vollständige Release-Artefakte mit SHA-256
  und erneut validiertes `store-production` ohne Reviewer-Zwang.
- `submit` greift nach diesen Prüfungen auf die erforderlichen
  AMO-/Google-Zugangsdaten zu. Diese Aktion kann **wirklich veröffentlichen**.
  Deswegen nie ohne zusätzliche ausdrückliche Produktfreigabe auslösen.
- Kein GitHub-Reviewer-Approval-Dialog notwendig; GitHubs optionales
  Reviewergate ist in dieser Einzelentwickler-Konfiguration bewusst aus.
- Die geforderte Einmal-Bestätigungsphrase ist keine zweite unabhängige Person
  und kein Ersatz für den Schutz Deines GitHub-Kontos.

## Konkret einzutragende Werte

**Environment-Secrets** (GitHub: Settings → Environments → store-production → Environment secrets):

- `AMO_API_KEY`: Mozilla-API-JWT-Issuer (kein Passwort des Entwicklerkontos).
- `AMO_API_SECRET`: zugehöriges Mozilla-API-JWT-Secret.

**Environment-Variablen** (GitHub: Settings → Environments → store-production → Environment variables):

- `AMO_ADDON_ID`: dauerhafte ID des bereits existierenden Firefox-Add-ons, mit `manifests/firefox.json` und AMO abgleichen.
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: vollständiger Google-Cloud-Provider-Ressourcenname (mit numerischer Projektnummer, Pool und Provider).
- `GCP_SERVICE_ACCOUNT`: E-Mail des dem Chrome-Web-Store-Publisher zugeordneten Google-Dienstkontos.
- `CWS_PUBLISHER_ID`: Publisher-ID des Chrome-Web-Store-Developer-Dashboards.
- `CWS_EXTENSION_ID`: bestehende Erweiterungs-ID des Chrome-Web-Stores.

Für Google: Chrome Web Store API V2 im Cloud-Projekt aktivieren, das Dienstkonto im Chrome-Web-Store-Entwicklerdashboard freigeben und GitHub OIDC über einen Workload-Identity-Pool/Provider einrichten. Die Federation auf `HyperCriSiS/Sprachverstand` und den vorgesehenen geschützten Freigabekontext einschränken. Für die Dienstkonto-Impersonation den erforderlichen `roles/iam.workloadIdentityUser`-Zugriff nur für die gebundene Identität konfigurieren. **Keine langlebige JSON-Schlüsseldatei in GitHub hinterlegen.**

## Sichere Eigenprüfung ohne Release-Tag

Nach dem Anlegen der Umgebung GitHub → Actions → **Store-Produktionsschutz prüfen** → **Run workflow** auf `main` starten. Der manuelle Workflow führt ausschließlich eine API-Leseabfrage der Environment-Einstellungen und den bestehenden Fail-Closed-Validator aus. Es werden weder Store-Secrets geladen noch Tags, GitHub-Releases oder Store-Uploads ausgeführt.

Die technische Leseberechtigung dafür ist `actions: read`. Der tatsächliche Zugang zu AMO und Google kann damit ausdrücklich **nicht** nachgewiesen werden. Fehlende Zugangsdaten oder Berechtigungen bleiben vor `submit` gesondert zu prüfen.

## Technische Schutzgrenzen

- Schon im Vorbereitungsjob fragt `submit` die GitHub-REST-API ab. Fehlende,
  nicht lesbare oder ungeschützte Umgebungen blockieren die Einreichung.
- **Keine Required Reviewer**, abgeschalteter Admin-Bypass und
  Beschränkung auf geschützte Branches sind für den Einzelentwickler-Modus Pflicht.
- Nur der Repository-Eigentümer darf den `submit`-Workflow starten
  beziehungsweise wiederholen, auch mit exakt passender Bestätigungsphrase.
- Beide Publisherjobs kontrollieren die Umgebung nach der GitHub-Freigabe
  unmittelbar vor dem Zugriff auf AMO-Secrets beziehungsweise Google-OIDC.
- `mode: validate` und der manuelle Release-Preflight bleiben unabhängig
  von Produktionszugängen nutzbar und veröffentlichen nichts.
- Vorhandensein und Berechtigungen von Store-Zugängen sind mit den
  verfügbaren Repository-Rechten weiterhin nicht bestätigt.

**Offen:** tatsächliche Konfiguration durch einen Administrator, Konto-
und API-Prüfung, separate Veröffentlichungsfreigabe und Store-Annahme.
Pale Moon bleibt unverändert.

Hilfreiche Einstiegsseiten: https://github.com/HyperCriSiS/Sprachverstand/settings/environments,
https://addons.mozilla.org/de/developers/addon/api/key/,
https://developer.chrome.com/docs/webstore/service-accounts,
https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines.

## Betrieb ohne zweiten Account

In einem persönlichen GitHub-Repository würde eine Collaborator-Einladung
auch Schreibrechte ermöglichen. Deshalb bleibt das Repository bewusst
ein Einzelentwickler-Projekt ohne künstlich eingeladenen Reviewer.

Das manuelle Store-Gate ist eine Sicherheitsentscheidung für **dieses Projekt**:
GitHub-Konto mit Passkey/2FA schützen und die `submit`-Bestätigung nur für
die wirklich beabsichtigte Store-Veröffentlichung geben.
