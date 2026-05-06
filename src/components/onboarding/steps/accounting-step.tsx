"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useGetAccountingConfigurationApiV1ConfigurationOrganizationIdAccountingGet,
  useUpdateAccountingConfigurationApiV1ConfigurationOrganizationIdAccountingPut,
} from "@/lib/generated/kaizenAdmin/configuration-v1/configuration-v1";
import { extractErrorMessage } from "@/lib/api-error";
import type { IntroAnswers } from "@/lib/onboarding";

interface AccountingStepProps {
  organizationId: number;
  introAnswers: IntroAnswers | null;
  onComplete: () => void;
  onBack?: () => void;
  backLabel?: string;
}

const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "GHS", "NGN", "KES", "ZAR", "INR", "JPY", "CAD"];

const schema = z.object({
  default_currency: z
    .string()
    .trim()
    .length(3, "3-letter code required")
    .regex(/^[A-Z]{3}$/, "Use uppercase letters"),
});

type FormValues = z.infer<typeof schema>;

export function AccountingStep({
  organizationId,
  introAnswers,
  onComplete,
  onBack,
  backLabel,
}: AccountingStepProps) {
  const { data: existing, isLoading: isLoadingConfig } =
    useGetAccountingConfigurationApiV1ConfigurationOrganizationIdAccountingGet(
      organizationId,
      { query: { enabled: !!organizationId, retry: false } },
    );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutateAsync: updateConfig } =
    useUpdateAccountingConfigurationApiV1ConfigurationOrganizationIdAccountingPut();

  const seedCurrency =
    introAnswers?.default_currency ??
    (existing?.default_currency as string | undefined) ??
    "USD";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { default_currency: seedCurrency },
  });

  useEffect(() => {
    reset({ default_currency: seedCurrency });
  }, [seedCurrency, reset]);

  const selected = watch("default_currency");

  const onValid = async (values: FormValues) => {
    setIsSubmitting(true);
    const requireBudgetLines = !!introAnswers?.enforce_budgets;

    // Safe defaults per Minimum_Viable_Configuration.md. Always send
    // default_currency (even unchanged) so the backend flips updated_by
    // off the "system" sentinel — that's what clears no_default_currency.
    const payload = {
      default_currency: values.default_currency,
      supported_currencies: [values.default_currency],
      allow_multi_currency: false,
      require_budget_lines: requireBudgetLines,
      budget_mode: "offline",
      budget_utilization_mode: "offline",
      allow_budget_override: false,
      budget_warning_threshold: 80,
      budget_freeze_threshold: 100,
      require_cost_center: false,
      require_gl_account: false,
      require_project_code: false,
      purchase_order_mode: "offline",
      po_auto_release: false,
      po_number_prefix: "PO-",
      tax_inclusion: "excluded",
      default_tax_rate: 0,
    };

    try {
      // Always PUT — the backend seeds a default accounting_config for
      // every org on creation, so there's nothing to "create" from the
      // wizard. POSTing the second time was a 409/validation trap.
      await updateConfig({
        organizationId,
        data: payload as unknown as Parameters<typeof updateConfig>[0]["data"],
      });
      toast.success("Accounting configured");
      onComplete();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to save accounting configuration"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirm your default currency</CardTitle>
        <CardDescription>
          This is the currency kaizenAdmins and budgets are denominated in. You can add more
          currencies later from Configuration → Accounting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onValid)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default_currency">Default currency</Label>
            <Select
              value={selected}
              onValueChange={(v) =>
                setValue("default_currency", v.toUpperCase(), { shouldValidate: true })
              }
              disabled={isLoadingConfig || isSubmitting}
            >
              <SelectTrigger
                id="default_currency"
                aria-invalid={!!errors.default_currency}
                className={cn(
                  errors.default_currency &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              >
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {COMMON_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" {...register("default_currency")} />
            {errors.default_currency && (
              <p className="text-xs text-destructive">{errors.default_currency.message}</p>
            )}
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 text-xs text-muted-foreground">
            We&rsquo;ll also apply sensible defaults for tax, purchase orders, and budget
            thresholds. Override any of them later from Configuration.
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            {onBack ? (
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                disabled={isSubmitting}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                {backLabel ? `Back to ${backLabel}` : "Back"}
              </Button>
            ) : (
              <div />
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save &amp; continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
