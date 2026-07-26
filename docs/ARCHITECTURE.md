# Architektur

## Leitlinien

1. **Konservativ vor vollständig:** Eine ausgelassene Ersetzung ist besser als
   eine beschädigte Webseite oder ein verfälschter Inhalt.
2. **Keine periodischen Komplettscans:** Nach dem ersten Durchlauf verarbeitet
   ein `MutationObserver` nur geänderte oder neu eingefügte Knoten und gezielt
   beobachtete Attribute.
3. **Keine unnötigen Berechtigungen:** Die Erweiterung benötigt ausschließlich
   `storage`.
4. **Keine Hintergrundlogik ohne Bedarf:** Das Add-on funktioniert vollständig
   als Content-Script mit Popup und Einstellungsseite.
5. **Regeln bleiben DOM-unabhängig:** Die Regel-Engine verarbeitet ausschließlich
   Zeichenketten und lässt sich isoliert testen.
6. **Herkunft gehört nicht in Laufzeitobjekte:** Recherchequellen werden in
   Dokumentation und Git-Historie geführt.
7. **Attribute nur per Positivliste:** Verarbeitet werden ausschließlich `alt`,
   `aria-label`, `aria-description` und `title`.

## Datenfluss

```text
Webseite
  -> Sicherheitsprüfung des Textknotens oder freigegebenen Attributs
  -> aktive Regeln gemäß Profil
  -> transformierter Text
  -> Ersetzung im bestehenden Textknoten oder Attribut
```

Beim ersten Durchlauf werden sichtbare Textknoten und freigegebene Attribute
verarbeitet. Danach beobachtet der `MutationObserver`:

- neue Unterbäume über `childList`
- geänderte Textknoten über `characterData`
- ausschließlich freigegebene Attribute über `attributeFilter`

Andere Attribute wie `value`, `placeholder`, `data-*`, IDs und URLs werden weder
gescannt noch beobachtet. Ignorierte, versteckte, editierbare und technische
Bereiche bleiben ausgeschlossen.

## Risikoprofile

- `conservative`: nur Regeln mit Risiko `safe`
- `standard`: Regeln mit Risiko `safe` und `contextual`
- `aggressive`: alle Regeln einschließlich `aggressive`

## Verzeichnisstruktur

```text
src/
├── browser/       Browser-API-Abstraktion
├── core/          Regel-Engine, Sicherheitslogik und DOM-Verarbeitung
├── rules/         unabhängige Sprachregeln
├── settings/      Speicherung und Domain-Logik
├── content.ts     Einstieg auf Webseiten
├── popup.ts       schnelles Ein-/Ausschalten
└── options.ts     dauerhafte Einstellungen
```
