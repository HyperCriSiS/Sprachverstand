# Changelog

Alle wesentlichen Änderungen an Sprachverstand werden in dieser Datei
dokumentiert.

## Unveröffentlicht

## 0.4.0 – Beta 2 (2026-07-26)

### Hinzugefügt

- Sieben konkrete, einzeln aktivierbare Regelgruppen ersetzen die abstrakten
  Profilnamen. Jede Gruppe enthält eine verständliche Beschreibung und ein
  Beispiel.
- Persönliche literale Ausnahmen schützen einzelne Wörter oder vollständige
  Phrasen über exakte Grenzen.
- Die Verarbeitung zugänglicher Attribute lässt sich separat ein- und
  ausschalten.
- Firefox für Android wird über `gecko_android` als Mobilziel ausgewiesen und
  durch `web-ext lint` gegen die festgelegte Mindestversion geprüft.
- Die Einstellungsseite ist für 360 × 640 dp, Touch-Bedienung und Safe Areas
  ausgelegt.
- Persönliche Ausnahmen werden lokal getrennt von den synchronisierbaren
  Grundeinstellungen gespeichert.
- Der Popup-Zähler kann den Badge-Wert auch nach einem Neustart des
  Chromium-Service-Workers wieder auslesen.

### Geändert

- Die früheren Profile `Konservativ`, `Standard` und `Aggressiv` wurden aus der
  Oberfläche entfernt. Alle aktuellen produktiven Regeln waren als `safe`
  eingestuft und unterschieden sich dadurch bislang nicht.
- Alte Einstellungen mit `disabledRuleIds` werden automatisch auf die neuen
  Regelgruppen migriert.
- Beta-Artefakte tragen den Zusatz `beta.2`.

### Mobil und Datenschutz

- Firefox erklärt im Manifest ausdrücklich, dass keine Daten gesammelt oder
  übertragen werden.
- Google Chrome für Android bleibt ausgeschlossen, da dieser Browser keine
  Erweiterungen unterstützt.

## 0.3.0 – Beta 1 (2026-07-26)

### Hinzugefügt

- Explizit gegenderte Singularphrasen werden normalisiert, wenn Artikel und
  Kasus eindeutig markiert sind, etwa `jede:r Nutzer:in` zu `jeder Nutzer`.
- Genitivformen werden lexikalisch korrekt gebildet, etwa `des:der Nutzer:in`
  zu `des Nutzers`, `des:der Student:in` zu `des Studenten` und
  `des:der Ärzt:in` zu `des Arztes`.
- Schwach deklinierte Personenbezeichnungen werden im Akkusativ und Dativ
  korrekt flektiert, etwa `eine:n Student:in` zu `einen Studenten`.
- Separator- und Binnen-I-Schreibweisen verwenden ein gemeinsames zentrales
  Lexikon für Singular- und Pluralformen.
- Punkt sowie typografische Apostrophe werden als Genderseparatoren erkannt.
- Natürlich feminine Familienformen wie `Mutter:in` werden ohne Änderung des
  grammatischen Geschlechts normalisiert.
- Explizite Singular-Doppelformen wie `Kunde/Kundin`, `Arzt und Ärztin` und
  `Tierärztin/Tierarzt` werden nur bei lexikalisch identischer Personenform
  zusammengeführt.
- Possessivartikel mit eindeutigem Kasus werden gemeinsam mit dem Substantiv
  normalisiert, etwa `mein:e Nutzer:in` zu `mein Nutzer` und
  `eure:n Pilot:in` zu `euren Piloten`.
- Explizite Pronomen- und Possessivpaare wie `er:sie`, `ihm:ihr` und
  `seines:ihres` werden auf die maskuline Form reduziert.
- Zugängliche Textattribute `alt`, `aria-label`, `aria-description` und `title`
  werden mit denselben sicheren Regeln wie sichtbare Textknoten verarbeitet.
- Der `MutationObserver` reagiert gezielt auf spätere Änderungen der
  freigegebenen zugänglichen Attribute.
- Die CI erzeugt geprüfte Chromium-, Firefox-XPI- und Quellcode-Pakete mit
  SHA-256-Prüfsummen.
- Eine lokale Beta-Testseite deckt sichtbare Texte, zugängliche Attribute,
  geschützte Bereiche und dynamische Mutationen ab.
- Änderungsumfang-Regressionen stellen sicher, dass einzelne Mutationen keinen
  erneuten Komplettscan großer Seiten auslösen.

### Korrigiert

- Genderformen am Anfang zusammengesetzter Wörter werden normalisiert, etwa
  `Nutzer:innenkonto` zu `Nutzerkonto` und `Ärzt:innenkammer` zu `Ärztekammer`.
- `Mutter:innen` und `MutterInnen` werden zu `Mütter`; entsprechende Formen für
  Tochter, Bruder und Vater wurden ebenfalls ergänzt.
- Doppelnennungen im Dativ behalten ihre Flexion, etwa
  `mit Ärztinnen und Ärzten` zu `mit Ärzten`.
- `Bauer:innen` wird zu `Bauern`, während Komposita wie
  `Messebauer*innen` korrekt zu `Messebauer` werden.
- Historische Fehlertreffer wie `Innen- und Außendienst`, `LogIn`, `AddIn`,
  `PlugIn` und `DriveIn` sind als Regressionen geschützt.

### Sicherheit

- Andere Attribute wie `value`, `placeholder`, `data-*`, IDs und URLs werden
  nicht verändert.
- Ignorierte, versteckte, editierbare und technische Attributinhalte bleiben
  unberührt.
- Ausdrücklich weibliche Personenbezeichnungen werden nicht pauschal verändert.
- Unbekannte oder mehrdeutige Formen bleiben unverändert.

## 0.2.0

### Hinzugefügt

- Manifest-V3-Builds für Firefox und Chromium
- modulare TypeScript-Regel-Engine
- sichere DOM-Verarbeitung mit `MutationObserver`
- Schutz für Eingaben, Editoren, Code und technische Inhalte
- Popup, Einstellungsseite und Domain-Ausschlüsse
- GitHub-Actions-CI für Typecheck, Tests und Builds
- konservative Pluralregeln für Genderseparatoren
- explizites Flexionslexikon für unregelmäßige Pluralformen
- Binnen-I-Unterstützung im Plural
- lexikalisch geprüfte Doppelnennungen im Grundkasus
- zentraler Regressionstest-Katalog

### Sicherheit

- keine periodischen Komplettscans
- keine unnötigen Berechtigungen
- keine Veränderung unbekannter oder mehrdeutiger Formen
- singuläre und flektierte Konstruktionen bleiben ohne sicheren Kontext
  unverändert

## 0.1.0

- technisches Grundgerüst ohne produktive Sprachregeln
