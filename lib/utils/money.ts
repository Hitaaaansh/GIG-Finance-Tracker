// ─── Money Utilities ──────────────────────────────────────────────────────────
// All internal values are in paise (integer). 1 INR = 100 paise.
// Use these helpers for display and input conversion.

/** Convert rupees (float) to paise (integer) */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Convert paise (integer) to rupees (float) */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Format paise as Indian rupee string: ₹1,23,456 */
export function formatINR(paise: number): string {
  const rupees = paiseToRupees(paise);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

/** Format paise as compact Indian amount: ₹1.2L or ₹45K */
export function formatINRCompact(paise: number): string {
  const r = paiseToRupees(paise);
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000) return `₹${(r / 1000).toFixed(1)}K`;
  return formatINR(paise);
}

/** Round paise up to the nearest whole rupee (for required-per-day planning) */
export function roundUpToRupee(paise: number): number {
  return Math.ceil(paise / 100) * 100;
}

/** Parse a rupee string input ("1234.50" or "1,234") to paise. Returns null if invalid. */
export function parseRupeeInput(input: string): number | null {
  const cleaned = input.replace(/,/g, "").trim();
  const val = parseFloat(cleaned);
  if (isNaN(val) || val <= 0) return null;
  return rupeesToPaise(val);
}
