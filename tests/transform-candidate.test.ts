import {expect, it} from "vitest";
import {isBuiltInTransformCandidate} from "../src/rules/transform-candidate";
import {defaultRules} from "../src/rules";
import {transformText} from "../src/core/transform-text";

it.each(["Nutzer:innen", "NutzerInnen", "Nutzer I nnen", "Prof.in", "ein LehrerIn",
  "eine NutzerIn", "Verbündete", "Kauffrau und Kaufmann", "Fachfrau/Fachmann",
  "Französ:innen", "Ninjas", "Prinzessinnen", "Dear Mitarbeitende", "Liebe Studierende",
  "Benutzungshandbuch", "der/die", "dessen/deren", "ihm/r", "jede/-r", "diese(r)",
  "Bekannte:r", "eine Neue*r", "Bewerbung (m/w/d)", "Nutzer∕innen"])(
  "admits every necessary candidate in %s", input => expect(isBuiltInTransformCandidate(input)).toBe(true));
it.each(["Neutraler Inhalt 17 / 3", "Normaler Text zur Verarbeitung", "Programmversion 12 / 4"])(
  "rejects neutral text only when the engine also leaves it intact: %s", input => {
    expect(transformText(input, defaultRules, {profile: "aggressive"}).replacements).toBe(0);
    expect(isBuiltInTransformCandidate(input)).toBe(false);
  });
