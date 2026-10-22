import { describe, expect, it } from "vitest";
import { mappedPluralSeparatorsRule } from "../src/rules/mapped-plural-separators";
import {
  mapMappedSingular,
  mapMappedSingularPair
} from "../src/rules/person-lexicon";
import {
  getReviewedPersonFormsWave79,
  reviewedPersonFormCountWave79
} from "../src/rules/reviewed-person-forms-wave-79";

const cases = [
  ["abfallsortierer", "abfallsortierer", "abfallsortierer", "abfallsortiererin", "abfallsortierer", "abfallsortierers"],
  ["abwart", "abwarte", "abwart", "abwartin", "abwart", "abwarts"],
  ["akarolog", "akarologen", "akarologe", "akarologin", "akarologen", "akarologen"],
  ["algenkundler", "algenkundler", "algenkundler", "algenkundlerin", "algenkundler", "algenkundlers"],
  ["alphornbläser", "alphornbläser", "alphornbläser", "alphornbläserin", "alphornbläser", "alphornbläsers"],
  ["anthroposoph", "anthroposophen", "anthroposoph", "anthroposophin", "anthroposophen", "anthroposophen"],
  ["anti-nazi-widerstandskämpfer", "anti-nazi-widerstandskämpfer", "anti-nazi-widerstandskämpfer", "anti-nazi-widerstandskämpferin", "anti-nazi-widerstandskämpfer", "anti-nazi-widerstandskämpfers"],
  ["arachnolog", "arachnologen", "arachnologe", "arachnologin", "arachnologen", "arachnologen"],
  ["arbeitsagog", "arbeitsagogen", "arbeitsagoge", "arbeitsagogin", "arbeitsagogen", "arbeitsagogen"],
  ["arborist", "arboristen", "arborist", "arboristin", "arboristen", "arboristen"],
  ["asketiker", "asketiker", "asketiker", "asketikerin", "asketiker", "asketikers"],
  ["bahnbrecher", "bahnbrecher", "bahnbrecher", "bahnbrecherin", "bahnbrecher", "bahnbrechers"],
  ["bandoneonist", "bandoneonisten", "bandoneonist", "bandoneonistin", "bandoneonisten", "bandoneonisten"],
  ["bassgitarrist", "bassgitarristen", "bassgitarrist", "bassgitarristin", "bassgitarristen", "bassgitarristen"],
  ["bassklarinettist", "bassklarinettisten", "bassklarinettist", "bassklarinettistin", "bassklarinettisten", "bassklarinettisten"],
  ["berührer", "berührer", "berührer", "berührerin", "berührer", "berührers"],
  ["blockflötist", "blockflötisten", "blockflötist", "blockflötistin", "blockflötisten", "blockflötisten"],
  ["booktuber", "booktuber", "booktuber", "booktuberin", "booktuber", "booktubers"],
  ["brentler", "brentler", "brentler", "brentlerin", "brentler", "brentlers"],
  ["bundesstenograf", "bundesstenografen", "bundesstenograf", "bundesstenografin", "bundesstenografen", "bundesstenografen"],
  ["bundesstenograph", "bundesstenographen", "bundesstenograph", "bundesstenographin", "bundesstenographen", "bundesstenographen"],
  ["cnidariolog", "cnidariologen", "cnidariologe", "cnidariologin", "cnidariologen", "cnidariologen"],
  ["concertinist", "concertinisten", "concertinist", "concertinistin", "concertinisten", "concertinisten"],
  ["concholog", "conchologen", "conchologe", "conchologin", "conchologen", "conchologen"],
  ["contorsionist", "contorsionisten", "contorsionist", "contorsionistin", "contorsionisten", "contorsionisten"],
  ["contortionist", "contortionisten", "contortionist", "contortionistin", "contortionisten", "contortionisten"],
  ["cracker", "cracker", "cracker", "crackerin", "cracker", "crackers"],
  ["deutschdidaktiker", "deutschdidaktiker", "deutschdidaktiker", "deutschdidaktikerin", "deutschdidaktiker", "deutschdidaktikers"],
  ["dipterolog", "dipterologen", "dipterologe", "dipterologin", "dipterologen", "dipterologen"],
  ["dokumentalist", "dokumentalisten", "dokumentalist", "dokumentalistin", "dokumentalisten", "dokumentalisten"],
  ["driver", "driver", "driver", "driverin", "driver", "drivers"],
  ["drummer", "drummer", "drummer", "drummerin", "drummer", "drummers"],
  ["dudler", "dudler", "dudler", "dudlerin", "dudler", "dudlers"],
  ["e-bassist", "e-bassisten", "e-bassist", "e-bassistin", "e-bassisten", "e-bassisten"],
  ["eisenplastiker", "eisenplastiker", "eisenplastiker", "eisenplastikerin", "eisenplastiker", "eisenplastikers"],
  ["eishockeytorwart", "eishockeytorwarte", "eishockeytorwart", "eishockeytorwartin", "eishockeytorwart", "eishockeytorwarts"],
  ["energetiker", "energetiker", "energetiker", "energetikerin", "energetiker", "energetikers"],
  ["ethnobotaniker", "ethnobotaniker", "ethnobotaniker", "ethnobotanikerin", "ethnobotaniker", "ethnobotanikers"],
  ["fachdidaktiker", "fachdidaktiker", "fachdidaktiker", "fachdidaktikerin", "fachdidaktiker", "fachdidaktikers"],
  ["fernsehkolumnist", "fernsehkolumnisten", "fernsehkolumnist", "fernsehkolumnistin", "fernsehkolumnisten", "fernsehkolumnisten"],
  ["fernsehköch", "fernsehköche", "fernsehkoch", "fernsehköchin", "fernsehkoch", "fernsehkochs"],
  ["flexograph", "flexographen", "flexograph", "flexographin", "flexographen", "flexographen"],
  ["floss-kontributor", "floss-kontributoren", "floss-kontributor", "floss-kontributorin", "floss-kontributor", "floss-kontributors"],
  ["foss-kontributor", "foss-kontributoren", "foss-kontributor", "foss-kontributorin", "foss-kontributor", "foss-kontributors"],
  ["fotograph", "fotographen", "fotograph", "fotographin", "fotographen", "fotographen"],
  ["freiheitsrechtler", "freiheitsrechtler", "freiheitsrechtler", "freiheitsrechtlerin", "freiheitsrechtler", "freiheitsrechtlers"],
  ["gemahl", "gemahle", "gemahl", "gemahlin", "gemahl", "gemahls"],
  ["gemüsepflücker", "gemüsepflücker", "gemüsepflücker", "gemüsepflückerin", "gemüsepflücker", "gemüsepflückers"],
  ["gerichtsstenograf", "gerichtsstenografen", "gerichtsstenograf", "gerichtsstenografin", "gerichtsstenografen", "gerichtsstenografen"],
  ["geräteturner", "geräteturner", "geräteturner", "geräteturnerin", "geräteturner", "geräteturners"],
  ["giftmischer", "giftmischer", "giftmischer", "giftmischerin", "giftmischer", "giftmischers"],
  ["handbiker", "handbiker", "handbiker", "handbikerin", "handbiker", "handbikers"],
  ["hefner", "hefner", "hefner", "hefnerin", "hefner", "hefners"],
  ["heimatkundler", "heimatkundler", "heimatkundler", "heimatkundlerin", "heimatkundler", "heimatkundlers"],
  ["holocaustleugner", "holocaustleugner", "holocaustleugner", "holocaustleugnerin", "holocaustleugner", "holocaustleugners"],
  ["holograf", "holografen", "holograf", "holografin", "holografen", "holografen"],
  ["holzkundler", "holzkundler", "holzkundler", "holzkundlerin", "holzkundler", "holzkundlers"],
  ["humanenergetiker", "humanenergetiker", "humanenergetiker", "humanenergetikerin", "humanenergetiker", "humanenergetikers"],
  ["hymenopterolog", "hymenopterologen", "hymenopterologe", "hymenopterologin", "hymenopterologen", "hymenopterologen"],
  ["ideengeschichtler", "ideengeschichtler", "ideengeschichtler", "ideengeschichtlerin", "ideengeschichtler", "ideengeschichtlers"],
  ["informationsethiker", "informationsethiker", "informationsethiker", "informationsethikerin", "informationsethiker", "informationsethikers"],
  ["jazz-gitarrist", "jazz-gitarristen", "jazz-gitarrist", "jazz-gitarristin", "jazz-gitarristen", "jazz-gitarristen"],
  ["jazz-posaunist", "jazz-posaunisten", "jazz-posaunist", "jazz-posaunistin", "jazz-posaunisten", "jazz-posaunisten"],
  ["jazzposaunist", "jazzposaunisten", "jazzposaunist", "jazzposaunistin", "jazzposaunisten", "jazzposaunisten"],
  ["kabinenwart", "kabinenwarte", "kabinenwart", "kabinenwartin", "kabinenwart", "kabinenwarts"],
  ["kastlan", "kastlane", "kastlan", "kastlanin", "kastlan", "kastlans"],
  ["katalogisierer", "katalogisierer", "katalogisierer", "katalogisiererin", "katalogisierer", "katalogisierers"],
  ["keltist", "keltisten", "keltist", "keltistin", "keltisten", "keltisten"],
  ["klassizist", "klassizisten", "klassizist", "klassizistin", "klassizisten", "klassizisten"],
  ["klatschkolumnist", "klatschkolumnisten", "klatschkolumnist", "klatschkolumnistin", "klatschkolumnisten", "klatschkolumnisten"],
  ["kleinplastiker", "kleinplastiker", "kleinplastiker", "kleinplastikerin", "kleinplastiker", "kleinplastikers"],
  ["klimawissenschaftsleugner", "klimawissenschaftsleugner", "klimawissenschaftsleugner", "klimawissenschaftsleugnerin", "klimawissenschaftsleugner", "klimawissenschaftsleugners"],
  ["klingonist", "klingonisten", "klingonist", "klingonistin", "klingonisten", "klingonisten"],
  ["kodikolog", "kodikologen", "kodikologe", "kodikologin", "kodikologen", "kodikologen"],
  ["kolchosbäuer", "kolchosbauern", "kolchosbauer", "kolchosbäuerin", "kolchosbauern", "kolchosbauern"],
  ["kolchosebäuer", "kolchosebauern", "kolchosebauer", "kolchosebäuerin", "kolchosebauern", "kolchosebauern"],
  ["kombinierer", "kombinierer", "kombinierer", "kombiniererin", "kombinierer", "kombinierers"],
  ["kontorsionist", "kontorsionisten", "kontorsionist", "kontorsionistin", "kontorsionisten", "kontorsionisten"],
  ["krankenbehandler", "krankenbehandler", "krankenbehandler", "krankenbehandlerin", "krankenbehandler", "krankenbehandlers"],
  ["krippenschnitzer", "krippenschnitzer", "krippenschnitzer", "krippenschnitzerin", "krippenschnitzer", "krippenschnitzers"],
  ["kritzler", "kritzler", "kritzler", "kritzlerin", "kritzler", "kritzlers"],
  ["kulturolog", "kulturologen", "kulturologe", "kulturologin", "kulturologen", "kulturologen"],
  ["kunstgewerbler", "kunstgewerbler", "kunstgewerbler", "kunstgewerblerin", "kunstgewerbler", "kunstgewerblers"],
  ["kunstmäzen", "kunstmäzene", "kunstmäzen", "kunstmäzenin", "kunstmäzen", "kunstmäzens"],
  ["kunstpfeifer", "kunstpfeifer", "kunstpfeifer", "kunstpfeiferin", "kunstpfeifer", "kunstpfeifers"],
  ["küschner", "küschner", "küschner", "küschnerin", "küschner", "küschners"],
  ["lautenist", "lautenisten", "lautenist", "lautenistin", "lautenisten", "lautenisten"],
  ["liturgiker", "liturgiker", "liturgiker", "liturgikerin", "liturgiker", "liturgikers"],
  ["llullist", "llullisten", "llullist", "llullistin", "llullisten", "llullisten"],
  ["ludolog", "ludologen", "ludologe", "ludologin", "ludologen", "ludologen"],
  ["lullist", "lullisten", "lullist", "lullistin", "lullisten", "lullisten"],
  ["mandolinist", "mandolinisten", "mandolinist", "mandolinistin", "mandolinisten", "mandolinisten"],
  ["mehrkämpfer", "mehrkämpfer", "mehrkämpfer", "mehrkämpferin", "mehrkämpfer", "mehrkämpfers"],
  ["messerschlucker", "messerschlucker", "messerschlucker", "messerschluckerin", "messerschlucker", "messerschluckers"],
  ["metallplastiker", "metallplastiker", "metallplastiker", "metallplastikerin", "metallplastiker", "metallplastikers"],
  ["methodolog", "methodologen", "methodologe", "methodologin", "methodologen", "methodologen"],
  ["militärkartograph", "militärkartographen", "militärkartograph", "militärkartographin", "militärkartographen", "militärkartographen"],
  ["miniaturist", "miniaturisten", "miniaturist", "miniaturistin", "miniaturisten", "miniaturisten"],
  ["modestylist", "modestylisten", "modestylist", "modestylistin", "modestylisten", "modestylisten"],
  ["mudschahed", "mudschahedin", "mudschahed", "mudschahedin", "mudschahed", "mudschahed"],
  ["multiinstrumentalist", "multiinstrumentalisten", "multiinstrumentalist", "multiinstrumentalistin", "multiinstrumentalisten", "multiinstrumentalisten"],
  ["musikrezensent", "musikrezensenten", "musikrezensent", "musikrezensentin", "musikrezensenten", "musikrezensenten"],
  ["myriapodolog", "myriapodologen", "myriapodologe", "myriapodologin", "myriapodologen", "myriapodologen"],
  ["mäzenat", "mäzenaten", "mäzenat", "mäzenatin", "mäzenaten", "mäzenaten"],
  ["münzkundler", "münzkundler", "münzkundler", "münzkundlerin", "münzkundler", "münzkundlers"],
  ["nematolog", "nematologen", "nematologe", "nematologin", "nematologen", "nematologen"],
  ["notariatsgehilf", "notariatsgehilfen", "notariatsgehilfe", "notariatsgehilfin", "notariatsgehilfen", "notariatsgehilfen"],
  ["obstbaukundler", "obstbaukundler", "obstbaukundler", "obstbaukundlerin", "obstbaukundler", "obstbaukundlers"],
  ["oecotropholog", "oecotrophologen", "oecotrophologe", "oecotrophologin", "oecotrophologen", "oecotrophologen"],
  ["okulist", "okulisten", "okulist", "okulistin", "okulisten", "okulisten"],
  ["onomastiker", "onomastiker", "onomastiker", "onomastikerin", "onomastiker", "onomastikers"],
  ["ordenskundler", "ordenskundler", "ordenskundler", "ordenskundlerin", "ordenskundler", "ordenskundlers"],
  ["ortschronist", "ortschronisten", "ortschronist", "ortschronistin", "ortschronisten", "ortschronisten"],
  ["paläomammalog", "paläomammalog", "paläomammalog", "paläomammalogin", "paläomammalog", "paläomammalogs"],
  ["paläornitholog", "paläornithologen", "paläornithologe", "paläornithologin", "paläornithologen", "paläornithologen"],
  ["parlamentsstenograph", "parlamentsstenographen", "parlamentsstenograph", "parlamentsstenographin", "parlamentsstenographen", "parlamentsstenographen"],
  ["partisan", "partisanen", "partisan", "partisanin", "partisanen", "partisanen"],
  ["pedell", "pedelle", "pedell", "pedellin", "pedell", "pedells"],
  ["peertuber", "peertuber", "peertuber", "peertuberin", "peertuber", "peertubers"],
  ["pelzer", "pelzer", "pelzer", "pelzerin", "pelzer", "pelzers"],
  ["perkussionist", "perkussionisten", "perkussionist", "perkussionistin", "perkussionisten", "perkussionisten"],
  ["phalerist", "phaleristen", "phalerist", "phaleristin", "phaleristen", "phaleristen"],
  ["phykolog", "phykologen", "phykologe", "phykologin", "phykologen", "phykologen"],
  ["pianostimmer", "pianostimmer", "pianostimmer", "pianostimmerin", "pianostimmer", "pianostimmers"],
  ["piccoloflötist", "piccoloflötisten", "piccoloflötist", "piccoloflötistin", "piccoloflötisten", "piccoloflötisten"],
  ["pietist", "pietisten", "pietist", "pietistin", "pietisten", "pietisten"],
  ["polit-karikaturist", "polit-karikaturisten", "polit-karikaturist", "polit-karikaturistin", "polit-karikaturisten", "polit-karikaturisten"],
  ["portier", "portiers", "portier", "portierin", "portier", "portiers"],
  ["protistolog", "protistologen", "protistologe", "protistologin", "protistologen", "protistologen"],
  ["prädikant", "prädikanten", "prädikant", "prädikantin", "prädikanten", "prädikanten"],
  ["pröpst", "pröpste", "propst", "pröpstin", "propst", "propstes"],
  ["rancher", "rancher", "rancher", "rancherin", "rancher", "ranchers"],
  ["rangierer", "rangierer", "rangierer", "rangiererin", "rangierer", "rangierers"],
  ["reisebürogehilf", "reisebürogehilfen", "reisebürogehilfe", "reisebürogehilfin", "reisebürogehilfen", "reisebürogehilfen"],
  ["reißer", "reißer", "reißer", "reißerin", "reißer", "reißers"],
  ["remixer", "remixer", "remixer", "remixerin", "remixer", "remixers"],
  ["rennradler", "rennradler", "rennradler", "rennradlerin", "rennradler", "rennradlers"],
  ["republikanist", "republikanisten", "republikanist", "republikanistin", "republikanisten", "republikanisten"],
  ["reviewer", "reviewer", "reviewer", "reviewerin", "reviewer", "reviewers"],
  ["rhodolog", "rhodologen", "rhodologe", "rhodologin", "rhodologen", "rhodologen"],
  ["rock-gitarrist", "rock-gitarristen", "rock-gitarrist", "rock-gitarristin", "rock-gitarristen", "rock-gitarristen"],
  ["rockgitarrist", "rockgitarristen", "rockgitarrist", "rockgitarristin", "rockgitarristen", "rockgitarristen"],
  ["rollstuhlcurler", "rollstuhlcurler", "rollstuhlcurler", "rollstuhlcurlerin", "rollstuhlcurler", "rollstuhlcurlers"],
  ["rollstuhlfechter", "rollstuhlfechter", "rollstuhlfechter", "rollstuhlfechterin", "rollstuhlfechter", "rollstuhlfechters"],
  ["schikanierer", "schikanierer", "schikanierer", "schikaniererin", "schikanierer", "schikanierers"],
  ["schmierer", "schmierer", "schmierer", "schmiererin", "schmierer", "schmierers"],
  ["schoaleugner", "schoaleugner", "schoaleugner", "schoaleugnerin", "schoaleugner", "schoaleugners"],
  ["seiteneinsteiger", "seiteneinsteiger", "seiteneinsteiger", "seiteneinsteigerin", "seiteneinsteiger", "seiteneinsteigers"],
  ["semiolog", "semiologen", "semiologe", "semiologin", "semiologen", "semiologen"],
  ["sexkolumnist", "sexkolumnisten", "sexkolumnist", "sexkolumnistin", "sexkolumnisten", "sexkolumnisten"],
  ["sexolog", "sexologen", "sexologe", "sexologin", "sexologen", "sexologen"],
  ["shavianist", "shavianisten", "shavianist", "shavianistin", "shavianisten", "shavianisten"],
  ["siegelkundler", "siegelkundler", "siegelkundler", "siegelkundlerin", "siegelkundler", "siegelkundlers"],
  ["skater", "skater", "skater", "skaterin", "skater", "skaters"],
  ["sphragistiker", "sphragistiker", "sphragistiker", "sphragistikerin", "sphragistiker", "sphragistikers"],
  ["spongiolog", "spongiologen", "spongiologe", "spongiologin", "spongiologen", "spongiologen"],
  ["sport-cartoonist", "sport-cartoonisten", "sport-cartoonist", "sport-cartoonistin", "sport-cartoonisten", "sport-cartoonisten"],
  ["sportanalyst", "sportanalysten", "sportanalyst", "sportanalystin", "sportanalysten", "sportanalysten"],
  ["sportcartoonist", "sportcartoonisten", "sportcartoonist", "sportcartoonistin", "sportcartoonisten", "sportcartoonisten"],
  ["sportkolumnist", "sportkolumnisten", "sportkolumnist", "sportkolumnistin", "sportkolumnisten", "sportkolumnisten"],
  ["stierkampfrancher", "stierkampfrancher", "stierkampfrancher", "stierkampfrancherin", "stierkampfrancher", "stierkampfranchers"],
  ["stuckator", "stuckatoren", "stuckator", "stuckatorin", "stuckator", "stuckators"],
  ["stukkateur", "stukkateure", "stukkateur", "stukkateurin", "stukkateur", "stukkateurs"],
  ["stukkator", "stukkatoren", "stukkator", "stukkatorin", "stukkator", "stukkators"],
  ["subdiakon", "subdiakone", "subdiakon", "subdiakonin", "subdiakon", "subdiakons"],
  ["tamburinist", "tamburinisten", "tamburinist", "tamburinistin", "tamburinisten", "tamburinisten"],
  ["telegrafist", "telegrafisten", "telegrafist", "telegrafistin", "telegrafisten", "telegrafisten"],
  ["teqballballer", "teqballballer", "teqballballer", "teqballballerin", "teqballballer", "teqballballers"],
  ["tertiarier", "tertiarier", "tertiarier", "tertiarierin", "tertiarier", "tertiariers"],
  ["terziar", "terziaren", "terziar", "terziarin", "terziar", "terziars"],
  ["thaiboxer", "thaiboxer", "thaiboxer", "thaiboxerin", "thaiboxer", "thaiboxers"],
  ["tierrechtler", "tierrechtler", "tierrechtler", "tierrechtlerin", "tierrechtler", "tierrechtlers"],
  ["transliterator", "transliteratoren", "transliterator", "transliteratorin", "transliterator", "transliterators"],
  ["typograf", "typografen", "typograf", "typografin", "typografen", "typografen"],
  ["unterhalter", "unterhalter", "unterhalter", "unterhalterin", "unterhalter", "unterhalters"],
  ["urbanolog", "urbanologen", "urbanologe", "urbanologin", "urbanologen", "urbanologen"],
  ["verhandlungsstenograph", "verhandlungsstenographen", "verhandlungsstenograph", "verhandlungsstenographin", "verhandlungsstenographen", "verhandlungsstenographen"],
  ["verkehrszeichenaufsteller", "verkehrszeichenaufsteller", "verkehrszeichenaufsteller", "verkehrszeichenaufstellerin", "verkehrszeichenaufsteller", "verkehrszeichenaufstellers"],
  ["vexillograph", "vexillographen", "vexillograph", "vexillographin", "vexillographen", "vexillographen"],
  ["vibrafonist", "vibrafonisten", "vibrafonist", "vibrafonistin", "vibrafonisten", "vibrafonisten"],
  ["vibraphonist", "vibraphonisten", "vibraphonist", "vibraphonistin", "vibraphonisten", "vibraphonisten"],
  ["waschsalongehilf", "waschsalongehilfen", "waschsalongehilfe", "waschsalongehilfin", "waschsalongehilfen", "waschsalongehilfen"],
  ["wettervorhersager", "wettervorhersager", "wettervorhersager", "wettervorhersagerin", "wettervorhersager", "wettervorhersagers"],
  ["wikimedianer", "wikimedianer", "wikimedianer", "wikimedianerin", "wikimedianer", "wikimedianers"],
  ["wikisourceler", "wikisourceler", "wikisourceler", "wikisourcelerin", "wikisourceler", "wikisourcelers"],
  ["xylolog", "xylologen", "xylologe", "xylologin", "xylologen", "xylologen"],
  ["zusammensteller", "zusammensteller", "zusammensteller", "zusammenstellerin", "zusammensteller", "zusammenstellers"],
  ["ökofeminist", "ökofeministen", "ökofeminist", "ökofeministin", "ökofeministen", "ökofeministen"],
  ["ökumeniker", "ökumeniker", "ökumeniker", "ökumenikerin", "ökumeniker", "ökumenikers"]
] as const;

const rejectedCases = [
  "der",
  "fachmänn",
  "kanoniss",
  "militant",
  "tertiar",
  "vorsitzender"
] as const;

const representativePluralCases = [
  ["abfallsortierer", "abfallsortierer:innen", "abfallsortierer"],
  ["abwart", "abwart:innen", "abwarte"],
  ["akarolog", "akarolog:innen", "akarologen"],
  ["anthroposoph", "anthroposoph:innen", "anthroposophen"],
  ["fernsehköch", "fernsehköch:innen", "fernsehköche"],
  ["floss-kontributor", "floss-kontributor:innen", "floss-kontributoren"],
  ["kolchosbäuer", "kolchosbäuer:innen", "kolchosbauern"],
  ["mudschahed", "mudschahed:innen", "mudschahedin"],
  ["notariatsgehilf", "notariatsgehilf:innen", "notariatsgehilfen"],
  ["portier", "portier:innen", "portiers"],
  ["pröpst", "pröpst:innen", "pröpste"]
] as const;

const representativePairCases = [
  ["abfallsortierer", "abfallsortierer", "abfallsortiererin"],
  ["abwart", "abwart", "abwartin"],
  ["akarolog", "akarologe", "akarologin"],
  ["anthroposoph", "anthroposoph", "anthroposophin"],
  ["fernsehköch", "fernsehkoch", "fernsehköchin"],
  ["floss-kontributor", "floss-kontributor", "floss-kontributorin"],
  ["kolchosbäuer", "kolchosbauer", "kolchosbäuerin"],
  ["mudschahed", "mudschahed", "mudschahedin"],
  ["notariatsgehilf", "notariatsgehilfe", "notariatsgehilfin"],
  ["portier", "portier", "portierin"],
  ["pröpst", "propst", "pröpstin"]
] as const;

const representativeCaseForms = [
  ["abfallsortierer", "abfallsortierer", "abfallsortierer", "abfallsortierers"],
  ["abwart", "abwart", "abwart", "abwarts"],
  ["akarolog", "akarologe", "akarologen", "akarologen"],
  ["anthroposoph", "anthroposoph", "anthroposophen", "anthroposophen"],
  ["fernsehköch", "fernsehkoch", "fernsehkoch", "fernsehkochs"],
  ["floss-kontributor", "floss-kontributor", "floss-kontributor", "floss-kontributors"],
  ["kolchosbäuer", "kolchosbauer", "kolchosbauern", "kolchosbauern"],
  ["mudschahed", "mudschahed", "mudschahed", "mudschahed"],
  ["notariatsgehilf", "notariatsgehilfe", "notariatsgehilfen", "notariatsgehilfen"],
  ["portier", "portier", "portier", "portiers"],
  ["pröpst", "propst", "propst", "propstes"]
] as const;

describe("neunundsiebzigste Lexikon-Ausbauwelle", () => {
  it("enthält alle 189 vollständig geprüften Wikidata-Exaktmappings", () => {
    expect(reviewedPersonFormCountWave79).toBe(189);

    for (const [base, plural, singular, feminine, oblique, genitive] of cases) {
      expect(getReviewedPersonFormsWave79(base), base).toEqual({
        plural,
        singular,
        feminineSingular: feminine,
        obliqueSingular: oblique,
        genitiveSingular: genitive
      });
    }
  });

  it("hält die sechs verworfenen Wikidata-Kandidaten aus Welle 79 heraus", () => {
    for (const base of rejectedCases) {
      expect(getReviewedPersonFormsWave79(base), base).toBeUndefined();
    }
  });

  it.each(representativePluralCases)(
    "ersetzt einen repräsentativen Plural der Klasse für %s",
    (_base, input, expected) => {
      expect(mappedPluralSeparatorsRule.apply(input)).toEqual({
        text: expected,
        replacements: 1
      });
    }
  );

  it.each(representativePairCases)(
    "erkennt das repräsentative geprüfte Paar für %s",
    (_base, masculine, feminine) => {
      expect(mapMappedSingularPair(masculine, feminine)).toBe(masculine);
    }
  );

  it.each(representativeCaseForms)(
    "bildet die repräsentativen Kasusformen für %s korrekt ab",
    (base, nominative, oblique, genitive) => {
      expect(mapMappedSingular(base, "nominative")).toBe(nominative);
      expect(mapMappedSingular(base, "accusative")).toBe(oblique);
      expect(mapMappedSingular(base, "genitive")).toBe(genitive);
    }
  );
});
