"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { extractErrorMessage } from "@/lib/api-error";
import {
  getPaymentHistory,
  recordPayment,
  type RecordPaymentRequest,
  type RecordPaymentResponse,
} from "@/lib/payments";

interface RecordPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kaizenAdminId: string;
  currency: string;
  /** If the parent already has the remaining amount, pass it in to skip the fetch. */
  amountRemaining?: string;
  onRecorded: (res: RecordPaymentResponse) => void;
}

const recordPaymentSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Amount is required")
    .refine((v) => {
      const n = Number(v);
      return Number.isFinite(n) && n > 0;
    }, "Enter a positive number"),
  payment_reference: z
    .string()
    .trim()
    .min(1, "Payment reference is required"),
  payment_date: z.string().optional().or(z.literal("")),
});

type RecordPaymentFormValues = z.infer<typeof recordPaymentSchema>;

function formatMoney(value: string | number, currency: string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return String(value);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
  }
}

export function RecordPaymentDialog({
  open,
  onOpenChange,
  kaizenAdminId,
  currency,
  amountRemaining,
  onRecorded,
}: RecordPaymentDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fetchedRemaining, setFetchedRemaining] = useState<string | null>(null);
  const [isLoadingRemaining, setIsLoadingRemaining] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentSchema),
    defaultValues: {
      amount: "",
      payment_reference: "",
      payment_date: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({ amount: "", payment_reference: "", payment_date: "" });
    if (amountRemaining !== undefined) {
      setFetchedRemaining(null);
      return;
    }
    let cancelled = false;
    setIsLoadingRemaining(true);
    getPaymentHistory(kaizenAdminId)
      .then((h) => {
        if (!cancelled) setFetchedRemaining(h.amount_remaining);
      })
      .catch(() => {
        // Non-fatal: the user can still submit; the backend validates.
      })
      .finally(() => {
        if (!cancelled) setIsLoadingRemaining(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, kaizenAdminId, amountRemaining, reset]);

  const remainingText = useMemo(() => {
    const value = amountRemaining ?? fetchedRemaining;
    if (value === null || value === undefined) return null;
    return formatMoney(value, currency);
  }, [amountRemaining, fetchedRemaining, currency]);

  const onValid = async (values: RecordPaymentFormValues) => {
    const payload: RecordPaymentRequest = {
      amount: Number(values.amount).toFixed(2),
      payment_reference: values.payment_reference.trim(),
    };
    if (values.payment_date) {
      payload.payment_date = new Date(values.payment_date).toISOString();
    }

    setIsSubmitting(true);
    try {
      const res = await recordPayment(kaizenAdminId, payload);
      toast.success(
        res.is_fully_paid
          ? "Payment recorded — kaizenAdmin is fully paid"
          : "Payment recorded",
      );
      onRecorded(res);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to record payment"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o && !isSubmitting) onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record a payment</DialogTitle>
          <DialogDescription>
            Log a payment against this kaizenAdmin.{" "}
            {isLoadingRemaining
              ? "Loading amount remaining…"
              : remainingText
                ? `Amount remaining: ${remainingText}.`
                : ""}{" "}
            Multi-line kaizenAdmins are apportioned automatically by budget line.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onValid)} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pay_amount">
              Amount ({currency}) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pay_amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              placeholder="0.00"
              disabled={isSubmitting}
              aria-invalid={!!errors.amount}
              className={cn(
                errors.amount &&
                  "border-destructive focus-visible:ring-destructive",
              )}
              {...register("amount")}
            />
            {errors.amount && (
              <p className="text-xs text-destructive">{errors.amount.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay_reference">
              Payment reference <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pay_reference"
              placeholder="e.g. INV-2026-0412, WIRE-APR-17"
              disabled={isSubmitting}
              aria-invalid={!!errors.payment_reference}
              className={cn(
                errors.payment_reference &&
                  "border-destructive focus-visible:ring-destructive",
              )}
              {...register("payment_reference")}
            />
            {errors.payment_reference ? (
              <p className="text-xs text-destructive">
                {errors.payment_reference.message}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Must be unique across payments for this kaizenAdmin.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pay_date">Payment date (optional)</Label>
            <Input
              id="pay_date"
              type="datetime-local"
              disabled={isSubmitting}
              {...register("payment_date")}
            />
            <p className="text-xs text-muted-foreground">
              Defaults to now if left blank.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Record Payment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
