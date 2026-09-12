export interface NationalityPersonForms {
  readonly stem: string;
  readonly plural: string;
  readonly singular: string;
  readonly obliqueSingular?: string;
  readonly genitiveSingular?: string;
  readonly match: "exact";
}

function unchanged(stem: string): NationalityPersonForms {
  return {
    stem,
    singular: stem,
    genitiveSingular: `${stem}s`,
    plural: stem,
    match: "exact"
  };
}

function weak(
  stem: string,
  singular: string,
  obliqueSingular: string
): NationalityPersonForms {
  return {
    stem,
    singular,
    obliqueSingular,
    genitiveSingular: obliqueSingular,
    plural: obliqueSingular,
    match: "exact"
  };
}

/*
 * Quellenneutraler Produktbestand für amtlich bzw. lexikalisch eindeutig
 * bestimmte Staatsangehörigenbezeichnungen. Herkunfts- und Prüfdaten bleiben
 * außerhalb des ausgelieferten Add-ons.
 */
export const nationalityPersonForms: readonly NationalityPersonForms[] = [
  unchanged("andorraner"),
  unchanged("angolaner"),
  unchanged("antiguaner"),
  unchanged("äquatorialguineer"),
  unchanged("äthiopier"),
  unchanged("caboverdier"),
  unchanged("costa-ricaner"),
  unchanged("ivorer"),
  unchanged("dominicaner"),
  unchanged("dominikaner"),
  unchanged("dschibutier"),
  unchanged("ecuadorianer"),
  unchanged("salvadorianer"),
  unchanged("eritreer"),
  unchanged("eswatiner"),
  unchanged("fidschianer"),
  unchanged("gabuner"),
  unchanged("gambier"),
  unchanged("ghanaer"),
  unchanged("grenader"),
  unchanged("guineer"),
  unchanged("guinea-bissauer"),
  unchanged("guyaner"),
  unchanged("haitianer"),
  unchanged("honduraner"),
  unchanged("jamaikaner"),
  unchanged("jordanier"),
  unchanged("kambodschaner"),
  unchanged("kameruner"),
  unchanged("katarer"),
  unchanged("kenianer"),
  unchanged("kiribatier"),
  unchanged("isländer"),
  unchanged("italiener"),
  unchanged("japaner"),
  unchanged("kanadier"),
  unchanged("kolumbianer"),
  unchanged("komorer"),
  unchanged("kubaner"),
  unchanged("kuwaiter"),
  unchanged("lesother"),
  unchanged("liberianer"),
  unchanged("libyer"),
  unchanged("liechtensteiner"),
  unchanged("malawier"),
  unchanged("malaysier"),
  unchanged("malediver"),
  unchanged("malier"),
  unchanged("marshaller"),
  unchanged("mauretanier"),
  unchanged("mauritier"),
  unchanged("mexikaner"),
  unchanged("mikronesier"),
  unchanged("mosambikaner"),
  unchanged("namibier"),
  unchanged("neuseeländer"),
  unchanged("nicaraguaner"),
  unchanged("niederländer"),
  unchanged("nigrer"),
  unchanged("nigerianer"),
  unchanged("niueaner"),
  unchanged("norweger"),
  unchanged("omaner"),
  unchanged("österreicher"),
  unchanged("palauer"),
  unchanged("panamaer"),
  unchanged("papua-neuguineer"),
  unchanged("paraguayer"),
  unchanged("peruaner"),
  unchanged("ruander"),
  unchanged("salomoner"),
  unchanged("sambier"),
  unchanged("samoaner"),
  unchanged("saudi-araber"),
  unchanged("seycheller"),
  unchanged("sierra-leoner"),
  unchanged("simbabwer"),
  unchanged("singapurer"),
  unchanged("somalier"),
  unchanged("spanier"),
  unchanged("sri-lanker"),
  unchanged("lucianer"),
  unchanged("vincenter"),
  unchanged("südafrikaner"),
  unchanged("surinamer"),
  unchanged("syrier"),
  unchanged("tansanier"),
  unchanged("togoer"),
  unchanged("tongaer"),
  unchanged("tschader"),
  unchanged("tuvaluer"),
  unchanged("ugander"),
  unchanged("ukrainer"),
  unchanged("uruguayer"),
  unchanged("vanuatuer"),
  unchanged("venezolaner"),
  unchanged("zentralafrikaner"),
  unchanged("zyprer"),
  unchanged("schweizer"),
  unchanged("syrer"),
  unchanged("são-toméer"),
  unchanged("malteser"),
  weak("jemenit", "jemenit", "jemeniten"),
  weak("laot", "laote", "laoten"),
  weak("libanes", "libanese", "libanesen"),
  weak("madagass", "madagasse", "madagassen"),
  weak("monegass", "monegasse", "monegassen"),
  weak("san-marines", "san-marinese", "san-marinesen"),
  weak("senegales", "senegalese", "senegalesen"),
  weak("sudanes", "sudanese", "sudanesen"),
  weak("südsudanes", "südsudanese", "südsudanesen"),
  weak("vietnames", "vietnamese", "vietnamesen"),
  weak("guatemaltek", "guatemalteke", "guatemalteken"),
  weak("kongoles", "kongolese", "kongolesen"),
  weak("schott", "schotte", "schotten")
];
