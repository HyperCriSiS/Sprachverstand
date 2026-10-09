# Store-Produktionsfreigabe (Issue #331)

Die GitHub-Umgebung `store-production` existiert bislang nicht. Der Workflow
`store-publish.yml` verweigert deshalb eine echte Store-Einreichung, bis
ein Repository-Administrator sie mit wirksamen Schutzregeln konfiguriert.

## Einmalige Einrichtung

1. GitHub → Sprachverstand → Settings → Environments → New environment:
   `store-production` anlegen.
2. `Required reviewers` aktivieren, eine zweite berechtigte Person oder
   ein Team auswählen und `Prevent self-review` einschalten.
3. `Allow administrators to bypass configured protection rules` deaktivieren.
   Unter `Deployment branches` nur geschützte Branches erlauben.
4. AMO-Schlüssel, Add-on-ID, Google-OIDC/Workload-Identity und die
   Chrome-Web-Store-Variablen getrennt prüfen. Geheimnisse nicht protokollieren.
5. Vor `Store Publish` eine gesonderte Release-Freigabe erteilen.
   Für `submit` sind ein stabiler Tag, Ziel, die exakte Bestätigungsphrase
   `STORE-SUBMIT:<Tag>:<Ziel>` und eine GitHub-Reviewer-Freigabe nötig.

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
