"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  useCreateBudgetApiV1BudgetBudgetsPost,
  useListFiscalYearsApiV1BudgetFiscalYearsGet,
} from "@/lib/generated/requisition/budget-v1/budget-v1";
import { extractErrorMessage } from "@/lib/api-error";
import { extractItems } from "@/lib/list-response";
import type { IntroAnswers } from "@/lib/onboarding";

interface BudgetStepProps {
  organizationId: number;
  introAnswers: IntroAnswers | null;
  onComplete: () => void;
  onBack?: () => void;
  backLabel?: string;
}

interface FiscalYearOption {
  id: string;
  year_code?: string;
  year_name?: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

const schema = z.object({
  fiscal_year_id: z.string().min(1, "Select a fiscal year"),
  budget_code: z.string().trim().min(1, "Code is required"),
  budget_name: z.string().trim().min(1, "Name is required"),
  total_budget: z
    .string()
    .trim()
    .regex(/^\d+(\.\d+)?$/, "Enter a valid non-negative amount"),
});

type FormValues = z.infer<typeof schema>;

export function BudgetStep({
  organizationId,
  introAnswers,
  onComplete,
  onBack,
  backLabel,
}: BudgetStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: fiscalYearsData } = useListFiscalYearsApiV1BudgetFiscalYearsGet(
    { organization_id: organizationId, limit: 50 },
    { query: { enabled: !!organizationId } },
  );

  const fiscalYears = useMemo<FiscalYearOption[]>(() => {
    return extractItems<FiscalYearOption>(fiscalYearsData, "fiscal_years").filter(
      (fy) => !!fy?.id,
    );
  }, [fiscalYearsData]);

  const activeFy =
    fiscalYears.find((fy) => fy.is_active) ?? fiscalYears[0] ?? null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fiscal_year_id: activeFy?.id ?? "",
      budget_code: "GENERAL",
      budget_name: "General Budget",
      total_budget: "",
    },
  });

  const fiscalYearId = watch("fiscal_year_id");

  const { mutateAsync } = useCreateBudgetApiV1BudgetBudgetsPost();

  const onValid = async (values: FormValues) => {
    setIsSubmitting(true);
    const currency = introAnswers?.default_currency ?? "USD";
    try {
      await mutateAsync({
        data: {
          organization_id: organizationId,
          fiscal_year_id: values.fiscal_year_id,
          budget_code: values.budget_code.trim(),
          budget_name: values.budget_name.trim(),
          total_budget: values.total_budget,
          currency_code: currency,
          allow_overrun: false,
          overrun_percentage: 0,
          require_approval_on_overrun: true,
        },
      });
      toast.success("Budget created");
      onComplete();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to create budget"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your first budget</CardTitle>
        <CardDescription>
          One budget is enough to start — you can add more (per department, per project, etc.)
          later from Configuration → Budgets.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onValid)} className="space-y-6">
          <div className="space-y-2">
            <Label>Fiscal year</Label>
            <Select
              value={fiscalYearId || undefined}
              onValueChange={(v) =>
                setValue("fiscal_year_id", v, { shouldValidate: true })
              }
              disabled={isSubmitting || fiscalYears.length === 0}
            >
              <SelectTrigger
                aria-invalid={!!errors.fiscal_year_id}
                className={cn(
                  errors.fiscal_year_id &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              >
                <SelectValue placeholder="Select a fiscal year" />
              </SelectTrigger>
              <SelectContent>
                {fiscalYears.map((fy) => (
                  <SelectItem key={fy.id} value={fy.id}>
                    {fy.year_name ?? fy.year_code ?? fy.id}
                    {fy.is_active && (
                      <span className="text-xs text-muted-foreground ml-1">
                        (active)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.fiscal_year_id && (
              <p className="text-xs text-destructive">{errors.fiscal_year_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget_code">Code</Label>
              <Input
                id="budget_code"
                disabled={isSubmitting}
                {...register("budget_code")}
                aria-invalid={!!errors.budget_code}
                className={cn(
                  errors.budget_code &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.budget_code && (
                <p className="text-xs text-destructive">{errors.budget_code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="budget_name">Name</Label>
              <Input
                id="budget_name"
                disabled={isSubmitting}
                {...register("budget_name")}
                aria-invalid={!!errors.budget_name}
                className={cn(
                  errors.budget_name &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.budget_name && (
                <p className="text-xs text-destructive">{errors.budget_name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total_budget">
              Total budget ({introAnswers?.default_currency ?? "USD"})
            </Label>
            <Input
              id="total_budget"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="0.00"
              disabled={isSubmitting}
              {...register("total_budget")}
              aria-invalid={!!errors.total_budget}
              className={cn(
                errors.total_budget &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {errors.total_budget && (
              <p className="text-xs text-destructive">{errors.total_budget.message}</p>
            )}
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
              Create budget
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
