/**
 * Return the "(incl. tax)" / "(excl. tax)" suffix to append to amount
 * labels per KaizenAdmin_Form_Selection.md §"Accounting fine-grained
 * rules". Matches the generated TaxInclusion enum values ("included"
 * / "excluded") exactly, with a case-insensitive fallback for
 * resilience. Returns empty string for null/undefined/unrecognised
 * values so unknown future enum additions degrade silently.
 */
export function taxInclusionSuffix(taxInclusion?: string | null): string {
  if (!taxInclusion) return "";
  const v = taxInclusion.toLowerCase();
  if (v === "included" || v === "inclusive") return " (incl. tax)";
  if (v === "excluded" || v === "exclusive") return " (excl. tax)";
  return "";
}
