export interface NationalityPersonForms {
  readonly stem: string;
  readonly plural: string;
  readonly singular: string;
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
  unchanged("malier")
];
