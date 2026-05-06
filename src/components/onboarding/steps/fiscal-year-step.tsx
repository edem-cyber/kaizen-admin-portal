"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useCreateFiscalYearApiV1BudgetFiscalYearsPost,
  useGetFiscalYearConfigApiV1BudgetFiscalYearConfigOrganizationIdGet,
} from "@/lib/generated/requisition/budget-v1/budget-v1";
import { PeriodType } from "@/lib/generated/requisition/models";
import { extractErrorMessage } from "@/lib/api-error";

interface FiscalYearStepProps {
  organizationId: number;
  onComplete: () => void;
  onBack?: () => void;
  backLabel?: string;
}

const schema = z.object({
  year_code: z.string().trim().min(1, "Code is required").max(32),
  year_name: z.string().trim().min(1, "Name is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
});

type FormValues = z.infer<typeof schema>;

function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

/**
 * Pick the fiscal year that contains today's date, derived from the
 * org's FY config (start_month/start_day). If today is before this
 * year's start, we want the FY that started last calendar year.
 */
function inferFiscalYear(
  startMonth: number,
  startDay: number,
  endMonth: number,
  endDay: number,
): { startDate: Date; endDate: Date; startYear: number } {
  const today = new Date();
  const thisYearStart = new Date(today.getFullYear(), startMonth - 1, startDay);
  const startYear =
    today >= thisYearStart ? today.getFullYear() : today.getFullYear() - 1;

  const startDate = new Date(startYear, startMonth - 1, startDay);
  // End date is either later in the same year (e.g. Jan→Dec) or in the
  // following year (e.g. Apr→Mar).
  const endYear = endMonth >= startMonth ? startYear : startYear + 1;
  const endDate = new Date(endYear, endMonth - 1, endDay);
  return { startDate, endDate, startYear };
}

export function FiscalYearStep({
  organizationId,
  onComplete,
  onBack,
  backLabel,
}: FiscalYearStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: config } =
    useGetFiscalYearConfigApiV1BudgetFiscalYearConfigOrganizationIdGet(
      organizationId,
      { query: { enabled: !!organizationId } },
    );

  const defaults = useMemo(() => {
    const c = config as {
      start_month?: number;
      start_day?: number;
      end_month?: number;
      end_day?: number;
      period_type?: PeriodType;
      code_prefix?: string;
      name_template?: string;
    } | undefined;
    const startMonth = c?.start_month ?? 1;
    const startDay = c?.start_day ?? 1;
    const endMonth = c?.end_month ?? 12;
    const endDay = c?.end_day ?? 31;
    const inferred = inferFiscalYear(startMonth, startDay, endMonth, endDay);
    const codePrefix = c?.code_prefix ?? "FY";
    const nameTemplate = c?.name_template ?? "Fiscal Year {year}";
    return {
      year_code: `${codePrefix}${inferred.startYear}`,
      year_name: nameTemplate.replace("{year}", String(inferred.startYear)),
      start_date: toIsoDate(inferred.startDate),
      end_date: toIsoDate(inferred.endDate),
    };
  }, [config]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  });

  // Re-seed from inferred defaults only while the user hasn't edited the
  // form. Once they start typing, keep their values.
  useEffect(() => {
    if (isDirty) return;
    reset(defaults);
  }, [defaults, isDirty, reset]);

  const { mutateAsync } = useCreateFiscalYearApiV1BudgetFiscalYearsPost();

  const onValid = async (values: FormValues) => {
    const periodType =
      (config as { period_type?: PeriodType } | undefined)?.period_type ??
      PeriodType.annual;
    setIsSubmitting(true);
    try {
      await mutateAsync({
        data: {
          organization_id: organizationId,
          year_code: values.year_code.trim(),
          year_name: values.year_name.trim(),
          start_date: values.start_date,
          end_date: values.end_date,
          period_type: periodType,
        },
      });
      toast.success("Fiscal year created");
      onComplete();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to create fiscal year"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create this fiscal year</CardTitle>
        <CardDescription>
          We pre-filled the dates from your fiscal year configuration. The new fiscal year will
          auto-activate if today&rsquo;s date falls within its range.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onValid)} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year_code">Year code</Label>
              <Input
                id="year_code"
                disabled={isSubmitting}
                {...register("year_code")}
                aria-invalid={!!errors.year_code}
                className={cn(
                  errors.year_code &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.year_code && (
                <p className="text-xs text-destructive">{errors.year_code.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="year_name">Year name</Label>
              <Input
                id="year_name"
                disabled={isSubmitting}
                {...register("year_name")}
                aria-invalid={!!errors.year_name}
                className={cn(
                  errors.year_name &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.year_name && (
                <p className="text-xs text-destructive">{errors.year_name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Start date</Label>
              <Input
                id="start_date"
                type="date"
                disabled={isSubmitting}
                {...register("start_date")}
                aria-invalid={!!errors.start_date}
                className={cn(
                  errors.start_date &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.start_date && (
                <p className="text-xs text-destructive">{errors.start_date.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End date</Label>
              <Input
                id="end_date"
                type="date"
                disabled={isSubmitting}
                {...register("end_date")}
                aria-invalid={!!errors.end_date}
                className={cn(
                  errors.end_date &&
                    "border-destructive focus-visible:ring-destructive",
                )}
              />
              {errors.end_date && (
                <p className="text-xs text-destructive">{errors.end_date.message}</p>
              )}
            </div>
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
              Create fiscal year
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
