import type { PolicyConfiguration } from "@/lib/generated/kaizenAdmin/models";

/**
 * Threshold semantics (for both competitive_bidding_threshold and
 * onboarded_vendor_threshold):
 *   - null / undefined → disabled (no amount-driven escalation)
 *   - 0 → always enforced (fires at any amount ≥ 0)
 *   - positive number → fires when totalAmount crosses the threshold
 *
 * Using `typeof t === "number"` as the guard accepts 0 and rejects
 * null/undefined, which matches the intended semantics.
 */
function thresholdFires(
  threshold: number | null | undefined,
  totalAmount: number,
): boolean {
  return typeof threshold === "number" && totalAmount >= threshold;
}

export interface VendorPolicyRules {
  /** Restrict vendor selection to the onboarded vendor directory. */
  onboardedOnly: boolean;
  /** Allow the user to type a new vendor name without going through onboarding. */
  allowNewVendor: boolean;
  /** Require the user to attach ≥ `minQuoteCount` quote documents. */
  requireMultipleQuotes: boolean;
  /** Number of quote attachments required. 0 when not enforced. */
  minQuoteCount: number;
  /** Show + require vendor tax id on vendor_info. */
  requireTaxId: boolean;
  /** Show + require vendor bank details on vendor_info. */
  requireBankDetails: boolean;
  /** When false, the user cannot use a single-vendor path — must rely on quote uploads. */
  soleSourcingAllowed: boolean;
  /** Informational — whether the vendor policy applies to goods. */
  appliesToGoods: boolean;
  /** Informational — whether the vendor policy applies to services. */
  appliesToServices: boolean;
}

/**
 * Compute the concrete UI rules from an OrganizationConfiguration's
 * policy_config, per KaizenAdmin_Form_Selection.md §"Policy config".
 *
 * Defaults to permissive rules (allow_new vendor, no quote count, no tax
 * id / bank details required) when policyConfig is missing — matches the
 * doc's graceful-fallback guidance.
 */
export function computeVendorPolicyRules(
  policyConfig: PolicyConfiguration | null | undefined,
): VendorPolicyRules {
  if (!policyConfig) {
    return {
      onboardedOnly: false,
      allowNewVendor: true,
      requireMultipleQuotes: false,
      minQuoteCount: 0,
      requireTaxId: false,
      requireBankDetails: false,
      soleSourcingAllowed: true,
      appliesToGoods: true,
      appliesToServices: true,
    };
  }

  const vendorPolicy =
    (policyConfig.vendor_policy as string | undefined) ?? "allow_new";
  const minQuotes = Number(policyConfig.minimum_vendor_quotes ?? 0) || 0;
  const threeQuotesRequired = vendorPolicy === "three_quotes_required";

  return {
    onboardedOnly:
      vendorPolicy === "onboarded_only" || threeQuotesRequired,
    allowNewVendor: vendorPolicy === "allow_new",
    requireMultipleQuotes: threeQuotesRequired || minQuotes > 0,
    minQuoteCount: threeQuotesRequired ? Math.max(3, minQuotes) : minQuotes,
    requireTaxId: !!policyConfig.require_vendor_tax_id,
    requireBankDetails: !!policyConfig.require_vendor_bank_details,
    soleSourcingAllowed:
      (policyConfig.sole_sourcing_permitted as boolean | undefined) ?? true,
    appliesToGoods:
      (policyConfig.apply_to_goods as boolean | undefined) ?? true,
    appliesToServices:
      (policyConfig.apply_to_services as boolean | undefined) ?? true,
  };
}

/**
 * Amount-driven escalation of vendor policy rules. Tightens — never
 * loosens — the base rules based on runtime totalAmount.
 *
 *   - competitive_bidding_threshold fires → force multi-quote with a
 *     minimum of 2 (or the configured `minimum_vendor_quotes` if higher,
 *     or the base rule's count if higher).
 *   - onboarded_vendor_threshold fires → force onboardedOnly and
 *     disallow new-vendor free-text entry.
 *
 * When both fire, their effects compose (AND logic). Base restrictions
 * like requireTaxId / requireBankDetails / soleSourcingAllowed are
 * preserved via spread.
 */
export function applyAmountThresholds(
  baseRules: VendorPolicyRules,
  totalAmount: number,
  policyConfig: PolicyConfiguration | null | undefined,
): VendorPolicyRules {
  if (!policyConfig) return baseRules;

  let rules = baseRules;

  if (thresholdFires(policyConfig.competitive_bidding_threshold, totalAmount)) {
    const configuredMin = Number(policyConfig.minimum_vendor_quotes ?? 0) || 0;
    rules = {
      ...rules,
      requireMultipleQuotes: true,
      minQuoteCount: Math.max(2, rules.minQuoteCount, configuredMin),
    };
  }

  if (thresholdFires(policyConfig.onboarded_vendor_threshold, totalAmount)) {
    rules = {
      ...rules,
      onboardedOnly: true,
      allowNewVendor: false,
    };
  }

  return rules;
}
