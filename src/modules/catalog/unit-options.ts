export const UNIT_OPTIONS = [
  "Tablet",
  "Capsule",
  "Strip",
  "Box",
  "Piece",
  "Bottle",
  "Tube",
  "Pack",
  "Sachet",
  "Vial",
  "Ampoule",
  "Millilitre",
  "Litre",
  "Gram",
  "Kilogram",
] as const;

export type UnitOption = (typeof UNIT_OPTIONS)[number];
