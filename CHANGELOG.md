# Changelog

Alle wesentlichen Änderungen an Sprachverstand werden in dieser Datei
dokumentiert.

## Unveröffentlicht

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
