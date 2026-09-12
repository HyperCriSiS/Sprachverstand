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
  unchanged("fidschianer")
];
