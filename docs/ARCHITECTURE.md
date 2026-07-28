# Architektur

## Leitlinien

1. **Kontrolliert vor pauschal:** Eine ausgelassene Ersetzung ist besser als
   eine beschädigte Webseite oder ein verfälschter Inhalt.
2. **Sichtbare Markierungen werden erkannt:** Binnen-I, Separatoren und andere
   ausdrücklich unterstützte Formen werden nicht mit normalen Feminina
   gleichgesetzt. Wo Artikel oder Kasus mehrdeutig sind, entscheidet ein
   geprüfter Kontext oder die Form bleibt stehen.
3. **Keine periodischen Komplettscans:** Nach dem ersten Durchlauf verarbeitet
   ein `MutationObserver` nur geänderte oder neu eingefügte Knoten und gezielt
   beobachtete Attribute.
4. **Keine unnötigen Berechtigungen:** Die Erweiterung benötigt ausschließlich
   `storage`.
5. **Regeln bleiben DOM-unabhängig:** Die Regel-Engine verarbeitet
   Zeichenketten und lässt sich isoliert testen.
6. **Lexikon statt breiter Rückfallregel:** Unregelmäßige Flexionen,
   substantivierte Adjektive und Sonderformen werden über kuratierte Bestände
   abgedeckt.
7. **Herkunft gehört nicht in Laufzeitobjekte:** Recherchequellen werden in
   Dokumentation, Testkatalog und Git-Historie geführt.
8. **Attribute nur per Positivliste:** Verarbeitet werden ausschließlich `alt`,
   `aria-label`, `aria-description` und `title`.
9. **Persönliche Daten bleiben lokal:** Ausnahmen und eigene Ersetzungen liegen
   in `storage.local`; Seitentexte werden nicht gesammelt oder übertragen.

## Datenfluss

```text
Webseite
  -> Sicherheitsprüfung des Textknotens oder freigegebenen Attributs
  -> Schutz persönlicher Ausnahmen
  -> eigene wörtliche Ersetzungen
  -> aktive eingebaute Regeln
  -> transformierter Text
  -> reversible Ersetzung im bestehenden Textknoten oder Attribut
```

Eigene Ersetzungen werden case-sensitive, mit Wortgrenzen und ohne Regex
angewendet. Ihr Ergebnis wird nicht erneut durch weitere eigene oder eingebaute
Regeln geschickt. Dadurch entstehen keine unübersichtlichen Ersetzungsketten.
Persönliche Ausnahmen besitzen immer Vorrang.

Beim ersten Durchlauf werden sichtbare Textknoten und freigegebene Attribute
verarbeitet. Danach beobachtet der `MutationObserver`:

- neue Unterbäume über `childList`
- geänderte Textknoten über `characterData`
- ausschließlich freigegebene Attribute über `attributeFilter`

Andere Attribute wie `value`, `placeholder`, `data-*`, IDs und URLs werden weder
gescannt noch beobachtet. Ignorierte, versteckte, editierbare und technische
Bereiche bleiben ausgeschlossen.

## Rückgängigmachen

Für jeden veränderten Textknoten beziehungsweise jedes Attribut werden
Originalwert, erzeugter Wert und Anzahl der Ersetzungen gespeichert. Beim
Abschalten wird nur zurückgesetzt, wenn der aktuelle Wert noch exakt dem von
Sprachverstand erzeugten Wert entspricht. Nachträgliche Änderungen der Webseite
werden dadurch nicht überschrieben.

## Sprachbestände

- `known-plural-separators.ts`: sichere Personenbezeichnungen mit unverändertem
  maskulinem Plural
- `person-lexicon.ts`: Singular, Plural, oblique Formen, Genitiv, Komposita und
  unregelmäßige Flexionen
- `substantivized-adjectives.ts`: geprüfte substantivierte Adjektive und
  passende Deklinationsmuster
- `special-gender-forms.ts`: einzelne ausdrücklich zugeordnete Sonderformen
- `data/flexion-regression-cases.json`: quellenbezogene Positiv- und
  Negativfälle

Das Aufnahmeverfahren ist in [`LEXICON.md`](LEXICON.md) beschrieben.

## Risikoprofile

Intern unterstützt die Regel-Engine weiterhin:

- `conservative`: nur Regeln mit Risiko `safe`
- `standard`: Regeln mit Risiko `safe` und `contextual`
- `aggressive`: alle Regeln einschließlich `aggressive`

Die Oberfläche verwendet statt abstrakter Profile konkrete Regelgruppen. Das
Content-Script aktiviert intern alle Risikostufen und schaltet die vom Nutzer
abgewählten Regel-IDs gezielt aus.

## Hintergrundkontext

Der Hintergrundprozess verarbeitet keine Sprache und keine Seitentexte. Er
verwaltet ausschließlich den Korrekturzähler und das Badge pro Tab.

## Verzeichnisstruktur

```text
src/
├── browser/       Browser-API-Abstraktion und Badge-Hilfen
├── core/          Regel-Engine, Sicherheitslogik und DOM-Verarbeitung
├── rules/         unabhängige Sprachregeln und Flexionsbestände
├── settings/      Speicherung und Domain-Logik
├── content.ts     Einstieg auf Webseiten
├── background.ts  Tab-Zähler und Badge
├── popup.ts       schnelles Ein-/Ausschalten
└── options.ts     dauerhafte Einstellungen

data/              kuratierte Kataloge und Regressionen
static/legal/       lokale Lizenz- und Quelltexthinweise
```
