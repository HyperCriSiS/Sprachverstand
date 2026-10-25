import { describe, expect, it } from "vitest";
import { transformText } from "../src/core/transform-text";
import { defaultRules } from "../src/rules";

const t = (input: string) => transformText(input, defaultRules, { profile: "aggressive" }).text;

// Gemeinsame Listenerkennung: das regierende Wort vor dem ersten Listenglied.
describe("Dativlisten über den Listen-Scanner", () => {
  it.each([
    // Attribute in Listengliedern
    ["Zusammenarbeit zwischen Berater*innen aus der Praxis und Wissenschaftler*innen.",
      "Zusammenarbeit zwischen Beratern aus der Praxis und Wissenschaftlern."],
    ["Interviews mit Richter*innen, Polizist*innen, Vertreter*innen des Zollkriminalamtes, Mitarbeiter*innen von Fachberatungsstellen.",
      "Interviews mit Richtern, Polizisten, Vertretern des Zollkriminalamtes, Mitarbeitern von Fachberatungsstellen."],
    ["mit rund 90 Netzwerkpartner*innen am Vormittag und etwa 140 Mitarbeiter*innen am Abend.",
      "mit rund 90 Netzwerkpartnern am Vormittag und etwa 140 Mitarbeitern am Abend."],
    ["zwischen Designer*innen auf der einen Seite und Künstler*innen auf der anderen Seite",
      "zwischen Designern auf der einen Seite und Künstlern auf der anderen Seite"],
    // Mengen, Wortteile und Doppelpunktformen
    ["Mit über 70 Athlet*innen und 20 Trainer:innen aus ganz Österreich.", "Mit über 70 Athleten und 20 Trainern aus ganz Österreich."],
    ["Brücke zwischen Anwender*innen, Software- und Systementwickler*innen und Verantwortlichen.",
      "Brücke zwischen Anwendern, Software- und Systementwicklern und Verantwortlichen."],
    ["Ein Team aus Wildhüter:innen, Wildbiolog:innen und Tierärzt:innen wird die Bisons betreuen.",
      "Ein Team aus Wildhütern, Wildbiologen und Tierärzten wird die Bisons betreuen."],
    // Präpositionalobjekt als Listenanfang
    ["Verschiedene Teams von Wissenschaftler*innen, Umweltschützer*innen wie auch Kritiker*innen finden sich zusammen.",
      "Verschiedene Teams von Wissenschaftlern, Umweltschützern wie auch Kritikern finden sich zusammen."],
    ["Zeit mit Familie oder Freund*innen", "Zeit mit Familie oder Freunden"],
    // Kein Dativ
    ["Vorteile für Unternehmen, Verbraucher*innen und die Umwelt.", "Vorteile für Unternehmen, Verbraucher und die Umwelt."],
    ["Eine Ausstellung mit dem Ziel, jugendliche Besucher*innen zu sensibilisieren.",
      "Eine Ausstellung mit dem Ziel, jugendliche Besucher zu sensibilisieren."],
    ["Plätze nach Maßgabe der vorhandenen Ausbildungskapazitäten und geeigneten Bewerber*innen.",
      "Plätze nach Maßgabe der vorhandenen Ausbildungskapazitäten und geeigneten Bewerber."],
    ["Lehrer werden zu Schulbegleitern, IT-Techniker*innen absolvieren eine Schulung.",
      "Lehrer werden zu Schulbegleitern, IT-Techniker absolvieren eine Schulung."],
    ["Grazer reisten nach Pécs, und Pécser*innen kamen nach Graz.", "Grazer reisten nach Pécs, und Pécser kamen nach Graz."],
    ["jedes Jahr, von Haus zu Haus, zwei Bewohner*innen der Siedlung", "jedes Jahr, von Haus zu Haus, zwei Bewohner der Siedlung"],
    // Sachen sind keine Personen (N35)
    ["Anbieter von Haustechnik und Fertigteilhäusern, EnergieberaterInnen, Energieausweis-AusstellerInnen etc.",
      "Anbieter von Haustechnik und Fertigteilhäusern, Energieberater, Energieausweis-Aussteller etc."],
    // Neuer Satz nach der Liste, auch mit Objekt (N35)
    ["Wir danken Lehrern, Lehrer:innen und Schüler:innen geben Bücher ab.", "Wir danken Lehrern, Lehrer und Schüler geben Bücher ab."],
    ["Wir danken Lehrern, Lehrer:innen und Schüler:innen helfen Kindern.", "Wir danken Lehrern, Lehrer und Schüler helfen Kindern."],
    // Adverbien sind keine finiten Verben (N41)
    ["Wir danken Lehrern, Lehrer:innen und Schüler:innen erneut.", "Wir danken Lehrern, Lehrern und Schülern erneut."],
    ["Wir danken Lehrern, Lehrer:innen und Schüler:innen sofort.", "Wir danken Lehrern, Lehrern und Schülern sofort."],
    ["Wir danken Lehrern, Lehrer:innen und Schüler:innen unbedingt.", "Wir danken Lehrern, Lehrern und Schülern unbedingt."],
    ["Wir danken Lehrern, Lehrer:innen und Schüler:innen stellenweise.", "Wir danken Lehrern, Lehrern und Schülern stellenweise."]
  ])("%s", (input, expected) => expect(t(input)).toBe(expected));
});
