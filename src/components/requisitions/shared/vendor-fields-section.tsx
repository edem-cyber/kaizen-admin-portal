"use client";

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useListVendorsApiV1VendorsGet } from "@/lib/generated/kaizenAdmin/vendors-v1/vendors-v1";
import { extractItems } from "@/lib/list-response";
import type { Vendor } from "@/lib/generated/kaizenAdmin/models";
import type { VendorPolicyRules } from "./use-vendor-policy";

/**
 * Shape of the vendor_info fields the kaizenAdmin submits.
 * Kept deliberately loose so the Minimal and Complete forms can both
 * render identical vendor inputs without either needing to extend its
 * schema with every optional key.
 */
export interface VendorInfoLike {
  vendor_name?: string;
  vendor_id?: string;
  contact?: string;
  tax_id?: string;
  bank_name?: string;
  bank_account_number?: string;
}

interface VendorFieldsSectionProps {
  rules: VendorPolicyRules;
  value: VendorInfoLike | undefined;
  onChange: (next: VendorInfoLike) => void;
  disabled?: boolean;
  /** Count of quote documents currently attached (existing + pending). */
  attachedQuoteCount: number;
}

export function VendorFieldsSection({
  rules,
  value,
  onChange,
  disabled,
  attachedQuoteCount,
}: VendorFieldsSectionProps) {
  const safeValue: VendorInfoLike = value ?? {};

  // Only fetch the vendor directory when the form actually needs it.
  const needsVendorList = rules.onboardedOnly;
  const { data: vendorsData } = useListVendorsApiV1VendorsGet(
    {},
    { query: { enabled: needsVendorList } },
  );
  const vendors = useMemo<Vendor[]>(() => {
    return extractItems<Vendor>(vendorsData, "vendors");
  }, [vendorsData]);

  const setField = <K extends keyof VendorInfoLike>(
    key: K,
    v: VendorInfoLike[K],
  ) => {
    onChange({ ...safeValue, [key]: v });
  };

  const onSelectVendor = (id: string) => {
    const picked = vendors.find((v) => v.id === id);
    onChange({
      ...safeValue,
      vendor_id: id,
      vendor_name: picked?.company_name ?? safeValue.vendor_name,
    });
  };

  const quotesShort = rules.requireMultipleQuotes
    ? Math.max(0, rules.minQuoteCount - attachedQuoteCount)
    : 0;

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Vendor</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {rules.onboardedOnly
              ? "Pick from your onboarded vendor directory."
              : rules.allowNewVendor
                ? "Enter vendor details. You can onboard them formally later."
                : "Select a vendor."}
          </p>
        </div>
      </div>

      {!rules.soleSourcingAllowed && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            Sole sourcing isn&rsquo;t permitted for your organization. Attach quotes from
            multiple vendors; the single-vendor fields below are informational only.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rules.onboardedOnly ? (
          <div className="space-y-2 sm:col-span-2">
            <Label>Vendor (from directory)</Label>
            <Select
              value={safeValue.vendor_id || undefined}
              onValueChange={onSelectVendor}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent>
                {vendors.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-muted-foreground">
                    No vendors onboarded yet.
                  </div>
                ) : (
                  vendors.map((v) => (
                    <SelectItem key={v.id} value={v.id ?? ""}>
                      {v.company_name ?? v.id}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="vendor_name">Vendor name</Label>
            <Input
              id="vendor_name"
              placeholder="e.g. Acme Supplies"
              disabled={disabled}
              value={safeValue.vendor_name ?? ""}
              onChange={(e) => setField("vendor_name", e.target.value)}
            />
          </div>
        )}

        <div className={cn("space-y-2", rules.onboardedOnly && "sm:col-span-2")}>
          <Label htmlFor="vendor_contact">Contact (optional)</Label>
          <Input
            id="vendor_contact"
            placeholder="e.g. sales@acme.com"
            disabled={disabled}
            value={safeValue.contact ?? ""}
            onChange={(e) => setField("contact", e.target.value)}
          />
        </div>

        {rules.requireTaxId && (
          <div className="space-y-2">
            <Label htmlFor="vendor_tax_id">
              Tax ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="vendor_tax_id"
              placeholder="Vendor's tax identification number"
              disabled={disabled}
              value={safeValue.tax_id ?? ""}
              onChange={(e) => setField("tax_id", e.target.value)}
            />
          </div>
        )}

        {rules.requireBankDetails && (
          <>
            <div className="space-y-2">
              <Label htmlFor="vendor_bank_name">
                Bank name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vendor_bank_name"
                disabled={disabled}
                value={safeValue.bank_name ?? ""}
                onChange={(e) => setField("bank_name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor_bank_account">
                Account number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="vendor_bank_account"
                disabled={disabled}
                value={safeValue.bank_account_number ?? ""}
                onChange={(e) =>
                  setField("bank_account_number", e.target.value)
                }
              />
            </div>
          </>
        )}
      </div>

      {rules.requireMultipleQuotes && (
        <div
          className={cn(
            "rounded-md border p-3 text-xs flex items-start gap-2",
            quotesShort > 0
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900",
          )}
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>
            {quotesShort > 0
              ? `Attach ${quotesShort} more vendor quote${
                  quotesShort === 1 ? "" : "s"
                }. ${attachedQuoteCount} of ${rules.minQuoteCount} attached.`
              : `Required quote count met (${attachedQuoteCount} of ${rules.minQuoteCount}).`}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Pure validator used in form submit handlers. Returns an error message
 * if the current vendor state violates policy, else null.
 */
export function validateVendorAgainstPolicy(
  rules: VendorPolicyRules,
  value: VendorInfoLike | undefined,
  attachedQuoteCount: number,
): string | null {
  const v = value ?? {};
  if (rules.onboardedOnly && !v.vendor_id) {
    return "Select a vendor from the directory";
  }
  if (rules.requireTaxId && !v.tax_id?.trim()) {
    return "Vendor tax ID is required";
  }
  if (rules.requireBankDetails) {
    if (!v.bank_name?.trim() || !v.bank_account_number?.trim()) {
      return "Vendor bank name and account number are required";
    }
  }
  if (
    rules.requireMultipleQuotes &&
    attachedQuoteCount < rules.minQuoteCount
  ) {
    return `Attach at least ${rules.minQuoteCount} vendor quote${
      rules.minQuoteCount === 1 ? "" : "s"
    }`;
  }
  return null;
}
