export const platformDefaults = {
  launchCity: 'Dakar',
  launchCountry: 'Sénégal',
  currency: 'XOF',
  castingListingFeeXof: 2000,
  eligibleShootingDiscountPercent: 25,
} as const;

/** Computes a proposed shooting quote using integer XOF amounts. This is not a booking confirmation. */
export function calculateShootingQuote(referencePriceXof: number, discountPercent = platformDefaults.eligibleShootingDiscountPercent) {
  if (!Number.isSafeInteger(referencePriceXof) || referencePriceXof < 0) throw new Error('Le tarif de référence doit être un montant XOF entier positif.');
  if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) throw new Error('Le pourcentage de réduction doit être compris entre 0 et 100.');
  const discountXof = Math.round(referencePriceXof * discountPercent / 100);
  return { referencePriceXof, discountPercent, discountXof, proposedPriceXof: referencePriceXof - discountXof };
}
