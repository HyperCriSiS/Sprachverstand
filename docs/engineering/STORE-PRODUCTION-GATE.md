# Store-Produktionsfreigabe (Issue #331)

Die GitHub-Umgebung `store-production` existiert bislang nicht. Der Workflow
`store-publish.yml` verweigert deshalb eine echte Store-Einreichung, bis
ein Repository-Administrator sie mit wirksamen Schutzregeln konfiguriert.

## Einmalige Einrichtung

1. GitHub → Sprachverstand → Settings → Environments → New environment:
   `store-production` anlegen.
2. Unter `Settings → Collaborators` einen vertrauenswürdigen zweiten
   GitHub-Account mit mindestens Lesezugriff einladen und die Annahme
   abwarten. Stand 09.10.2026: ausschließlich `HyperCriSiS` ist Mitarbeiter.
   Anschließend `Required reviewers` aktivieren, die zweite Person auswählen
   und `Prevent self-review` einschalten.
3. `Allow administrators to bypass configured protection rules` deaktivieren.
   Unter `Deployment branches` nur geschützte Branches erlauben.
4. In `store-production` die unten benannten Environment-Secrets und
   Environment-Variablen einrichten. AMO-Zugang und Google-OIDC/
   Workload-Identity zuerst in ihren jeweiligen Entwicklerkonten herstellen.
   Geheimnisse niemals in Issues, Chat oder CI-Ausgaben kopieren.
5. Vor `Store Publish` eine gesonderte Release-Freigabe erteilen.
   Für `submit` sind ein stabiler Tag, Ziel, die exakte Bestätigungsphrase
   `STORE-SUBMIT:<Tag>:<Ziel>` und eine GitHub-Reviewer-Freigabe nötig.

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

Die technische Leseberechtigung dafür ist `actions: read`. Der tatsächliche Zugang zu AMO und Google kann damit ausdrücklich **nicht** nachgewiesen werden. Fehlender zweiter Reviewer, falsche Variablen und Berechtigungen müssen vor einem echten `submit` gesondert ausgeschlossen werden.

## Technische Schutzgrenzen

- Schon im Vorbereitungsjob fragt `submit` die GitHub-REST-API ab. Fehlende,
  nicht lesbare oder ungeschützte Umgebungen blockieren die Einreichung.
- Mindestens ein Required Reviewer, Selbstfreigabeverbot, abgeschalteter
  Admin-Bypass und Beschränkung auf geschützte Branches sind Pflicht.
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
