"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { PaymentTerms } from "@/lib/generated/requisition/models";
import { useListVendorsApiV1VendorsGet } from "@/lib/generated/requisition/vendors-v1/vendors-v1";
import { extractItems } from "@/lib/list-response";
import type { Vendor } from "@/lib/generated/requisition/models";
import type { VendorQuote, VendorQuoteCreate } from "@/lib/vendor-quotes";

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const quoteSchema = z.object({
  vendor_id: z.string().min(1, "Vendor is required"),
  quote_number: z.string().optional(),
  quote_date: z.string().optional(),
  valid_until: z.string().min(1, "Valid-until date is required"),
  quantity: z.number({ error: "Quantity is required" }).int("Must be a whole number").min(1, "Must be ≥ 1"),
  unit_price: z.number({ error: "Unit price is required" }).min(0, "Cannot be negative"),
  tax_amount: z.number().min(0).optional(),
  shipping_cost: z.number().min(0).optional(),
  other_costs: z.number().min(0).optional(),
  total_amount: z.number({ error: "Total is required" }).min(0),
  currency: z.string().optional(),
  payment_terms: z.nativeEnum(PaymentTerms, { error: "Payment terms required" }),
  delivery_lead_time: z.string().min(1, "Lead time is required"),
  warranty_terms: z.string().optional(),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface QuoteFormProps {
  requisitionId: string;
  /** Existing quote for edit mode. Omit for create. */
  initialData?: VendorQuote;
  /** Default currency to pre-fill on create. */
  defaultCurrency?: string;
  isSubmitting?: boolean;
  onSubmit: (payload: VendorQuoteCreate) => void;
  onCancel: () => void;
}

export function QuoteForm({
  requisitionId,
  initialData,
  defaultCurrency,
  isSubmitting,
  onSubmit,
  onCancel,
}: QuoteFormProps) {
  const isEdit = !!initialData;

  const { data: vendorsData, isLoading: vendorsLoading } =
    useListVendorsApiV1VendorsGet({
      vendor_status: "active" as never,
    });
  const vendors = extractItems<Vendor>(vendorsData, "vendors");

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: initialData
      ? {
          vendor_id: initialData.vendor_id,
          quote_number: initialData.quote_number ?? "",
          quote_date: initialData.quote_date?.slice(0, 10) ?? todayIso(),
          valid_until: initialData.valid_until?.slice(0, 10) ?? addDaysIso(30),
          quantity: Number(initialData.quantity),
          unit_price: Number(initialData.unit_price),
          tax_amount: Number(initialData.tax_amount ?? 0),
          shipping_cost: Number(initialData.shipping_cost ?? 0),
          other_costs: Number(initialData.other_costs ?? 0),
          total_amount: Number(initialData.total_amount),
          currency: initialData.currency ?? defaultCurrency ?? "USD",
          payment_terms: initialData.payment_terms as PaymentTerms,
          delivery_lead_time: initialData.delivery_lead_time,
          warranty_terms: initialData.warranty_terms ?? "",
        }
      : {
          vendor_id: "",
          quote_number: "",
          quote_date: todayIso(),
          valid_until: addDaysIso(30),
          quantity: 1,
          unit_price: 0,
          tax_amount: 0,
          shipping_cost: 0,
          other_costs: 0,
          total_amount: 0,
          currency: defaultCurrency ?? "USD",
          payment_terms: PaymentTerms.net_30,
          delivery_lead_time: "",
          warranty_terms: "",
        },
  });

  const qty = form.watch("quantity");
  const price = form.watch("unit_price");
  const tax = form.watch("tax_amount") ?? 0;
  const ship = form.watch("shipping_cost") ?? 0;
  const other = form.watch("other_costs") ?? 0;

  const subtotal = useMemo(() => {
    const q = Number(qty) || 0;
    const p = Number(price) || 0;
    return q * p;
  }, [qty, price]);

  const suggestedTotal = useMemo(() => {
    return subtotal + Number(tax) + Number(ship) + Number(other);
  }, [subtotal, tax, ship, other]);

  // Auto-sync total_amount to the computed suggestion whenever subtotal or
  // add-on costs change — but only if the user hasn't manually diverged.
  const currentTotal = form.watch("total_amount");
  useEffect(() => {
    // Only auto-update if the current total equals the "old" suggested value
    // (i.e. user hasn't overridden). First mount: align to suggestion.
    if (!isEdit) {
      form.setValue("total_amount", suggestedTotal, { shouldValidate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedTotal]);

  const currency = form.watch("currency") || defaultCurrency || "USD";
  const totalMismatch = currentTotal !== undefined && Math.abs(currentTotal - suggestedTotal) > 0.009;

  const submit = (values: QuoteFormValues) => {
    const payload: VendorQuoteCreate = {
      vendor_id: values.vendor_id,
      requisition_id: requisitionId,
      quote_number: values.quote_number?.trim() || undefined,
      quote_date: values.quote_date || undefined,
      valid_until: values.valid_until,
      quantity: values.quantity,
      unit_price: values.unit_price,
      subtotal,
      tax_amount: values.tax_amount,
      shipping_cost: values.shipping_cost,
      other_costs: values.other_costs,
      total_amount: values.total_amount,
      currency: values.currency?.trim() || undefined,
      payment_terms: values.payment_terms,
      delivery_lead_time: values.delivery_lead_time.trim(),
      warranty_terms: values.warranty_terms?.trim() || undefined,
    };
    onSubmit(payload);
  };

  // No active vendors: block creation with a helpful message
  if (!isEdit && !vendorsLoading && vendors.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground space-y-3">
        <p>
          No active vendors found. You need at least one active vendor before
          creating a quote.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/vendors">Go to Vendors</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5">
      <div className="space-y-1.5">
        <Label>
          Vendor <span className="text-destructive">*</span>
        </Label>
        <Select
          value={form.watch("vendor_id") || undefined}
          onValueChange={(v) => form.setValue("vendor_id", v, { shouldValidate: true })}
          disabled={isEdit || vendorsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={vendorsLoading ? "Loading vendors…" : "Select vendor"} />
          </SelectTrigger>
          <SelectContent>
            {vendors.map((v) => (
              <SelectItem key={v.id} value={v.id!}>
                {v.company_name}
                {v.email_address ? ` · ${v.email_address}` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.vendor_id && (
          <p className="text-xs text-destructive">{form.formState.errors.vendor_id.message}</p>
        )}
        {isEdit && (
          <p className="text-xs text-muted-foreground">
            The vendor cannot be changed after the quote is created.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Quote Number</Label>
          <Input {...form.register("quote_number")} placeholder="Q-2026-001" />
        </div>
        <div className="space-y-1.5">
          <Label>Quote Date</Label>
          <Input type="date" {...form.register("quote_date")} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>
            Valid Until <span className="text-destructive">*</span>
          </Label>
          <Input type="date" {...form.register("valid_until")} />
          {form.formState.errors.valid_until && (
            <p className="text-xs text-destructive">{form.formState.errors.valid_until.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Currency</Label>
          <Input
            {...form.register("currency")}
            maxLength={3}
            onChange={(e) =>
              form.setValue("currency", e.target.value.toUpperCase(), { shouldValidate: true })
            }
            placeholder="USD"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>
            Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            type="number"
            step="1"
            min="1"
            {...form.register("quantity", { valueAsNumber: true })}
          />
          {form.formState.errors.quantity && (
            <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>
            Unit Price <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-bold text-muted-foreground">
              {currency}
            </span>
            <Input
              type="number"
              step="0.01"
              min="0"
              className="pl-12"
              {...form.register("unit_price", { valueAsNumber: true })}
            />
          </div>
          {form.formState.errors.unit_price && (
            <p className="text-xs text-destructive">{form.formState.errors.unit_price.message}</p>
          )}
        </div>
      </div>

      <div className="rounded-md border bg-muted/30 p-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal (qty × unit price)</span>
          <span className="font-semibold">
            {currency} {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Tax</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...form.register("tax_amount", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Shipping</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...form.register("shipping_cost", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Other Costs</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            {...form.register("other_costs", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>
          Total Amount <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-bold text-muted-foreground">
            {currency}
          </span>
          <Input
            type="number"
            step="0.01"
            min="0"
            className="pl-12"
            {...form.register("total_amount", { valueAsNumber: true })}
          />
        </div>
        {totalMismatch && (
          <p className="text-xs text-amber-600">
            Adjusted from suggested {currency}{" "}
            {suggestedTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        )}
        {form.formState.errors.total_amount && (
          <p className="text-xs text-destructive">{form.formState.errors.total_amount.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>
            Payment Terms <span className="text-destructive">*</span>
          </Label>
          <Select
            value={form.watch("payment_terms") || undefined}
            onValueChange={(v) =>
              form.setValue("payment_terms", v as PaymentTerms, { shouldValidate: true })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select terms" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(PaymentTerms).map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, " ").toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>
            Delivery Lead Time <span className="text-destructive">*</span>
          </Label>
          <Input {...form.register("delivery_lead_time")} placeholder="2-3 weeks" />
          {form.formState.errors.delivery_lead_time && (
            <p className="text-xs text-destructive">
              {form.formState.errors.delivery_lead_time.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Warranty Terms</Label>
        <Textarea
          rows={2}
          {...form.register("warranty_terms")}
          placeholder="e.g. 1 year manufacturer warranty"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? "Save Changes" : "Add Quote"}
        </Button>
      </div>
    </form>
  );
}
