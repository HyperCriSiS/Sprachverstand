# Architektur

## Leitlinien

1. **Konservativ vor vollständig:** Eine ausgelassene Ersetzung ist besser als
   eine beschädigte Webseite oder ein verfälschter Inhalt.
2. **Keine periodischen Komplettscans:** Nach dem ersten Durchlauf verarbeitet
   ein `MutationObserver` nur geänderte oder neu eingefügte Knoten.
3. **Keine unnötigen Berechtigungen:** Version 0.1.0 benötigt ausschließlich
   `storage`.
4. **Keine Hintergrundlogik ohne Bedarf:** Das Add-on funktioniert vollständig
   als Content-Script mit Popup und Einstellungsseite.
5. **Regeln bleiben DOM-unabhängig:** Die Regel-Engine verarbeitet ausschließlich
   Zeichenketten und lässt sich isoliert testen.
6. **Herkunft gehört nicht in Laufzeitobjekte:** Recherchequellen werden in
   Dokumentation und Git-Historie geführt.

## Datenfluss

```text
Webseite
  -> Sicherheitsprüfung des Textknotens
  -> aktive Regeln gemäß Profil
  -> transformierter Text
  -> Ersetzung im bestehenden Textknoten
```

## Risikoprofile

- `conservative`: nur Regeln mit Risiko `safe`
- `standard`: Regeln mit Risiko `safe` und `contextual`
- `aggressive`: alle Regeln einschließlich `aggressive`

## Verzeichnisstruktur

```text
src/
├── browser/       Browser-API-Abstraktion
├── core/          Regel-Engine und DOM-Verarbeitung
├── rules/         unabhängige Sprachregeln
├── settings/      Speicherung und Domain-Logik
├── content.ts     Einstieg auf Webseiten
├── popup.ts       schnelles Ein-/Ausschalten
└── options.ts     dauerhafte Einstellungen
```
