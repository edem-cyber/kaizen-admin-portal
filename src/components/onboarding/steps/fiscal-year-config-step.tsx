"use client";

import { useEffect, useState, useMemo } from "react";
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
import { format } from "date-fns";
import { ArrowLeft, CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  useCreateFiscalYearConfigApiV1BudgetFiscalYearConfigPost,
  useGetFiscalYearConfigApiV1BudgetFiscalYearConfigOrganizationIdGet,
  useUpdateFiscalYearConfigApiV1BudgetFiscalYearConfigConfigIdPut,
} from "@/lib/generated/requisition/budget-v1/budget-v1";
import { PeriodType } from "@/lib/generated/requisition/models";
import { extractErrorMessage } from "@/lib/api-error";
import type { IntroAnswers } from "@/lib/onboarding";

interface FiscalYearConfigStepProps {
  organizationId: number;
  introAnswers: IntroAnswers | null;
  onComplete: () => void;
  onBack?: () => void;
  backLabel?: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const schema = z.object({
  start_month: z.number().int().min(1).max(12),
  start_day: z.number().int().min(1).max(31),
  period_type: z.nativeEnum(PeriodType),
});

type FormValues = z.infer<typeof schema>;

/**
 * Given a start month+day, compute the natural end month+day as the day
 * BEFORE the start in the following year. e.g. FY starting Jan 1 ends
 * Dec 31; FY starting Apr 1 ends Mar 31.
 */
function computeEnd(startMonth: number, startDay: number): { endMonth: number; endDay: number } {
  // Day before start date, wrapping to previous month if needed.
  if (startDay > 1) {
    return { endMonth: startMonth, endDay: startDay - 1 };
  }
  const prevMonth = startMonth === 1 ? 12 : startMonth - 1;
  return { endMonth: prevMonth, endDay: DAYS_IN_MONTH[prevMonth - 1] };
}

export function FiscalYearConfigStep({
  organizationId,
  introAnswers,
  onComplete,
  onBack,
  backLabel,
}: FiscalYearConfigStepProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingConfig } =
    useGetFiscalYearConfigApiV1BudgetFiscalYearConfigOrganizationIdGet(
      organizationId,
      { query: { enabled: !!organizationId, retry: false } },
    );
  const existingConfigId = (existingConfig as { id?: string } | undefined)?.id;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      start_month: introAnswers?.fiscal_year_start_month ?? 1,
      start_day: introAnswers?.fiscal_year_start_day ?? 1,
      period_type: PeriodType.annual,
    },
  });

  // Seed the form from an existing config the first time it loads. Don't
  // overwrite user edits once they've started typing.
  useEffect(() => {
    if (!existingConfig || isDirty) return;
    const c = existingConfig as {
      start_month?: number;
      start_day?: number;
      period_type?: PeriodType;
    };
    reset({
      start_month: c.start_month ?? introAnswers?.fiscal_year_start_month ?? 1,
      start_day: c.start_day ?? introAnswers?.fiscal_year_start_day ?? 1,
      period_type: c.period_type ?? PeriodType.annual,
    });
  }, [existingConfig, isDirty, introAnswers, reset]);

  const startMonth = watch("start_month");
  const startDay = watch("start_day");
  const periodType = watch("period_type");

  const selectedDate = useMemo(() => {
    if (!startMonth || !startDay) return undefined;
    // We use the current year as a base, but the configuration only cares about Month/Day
    const d = new Date();
    d.setMonth(startMonth - 1);
    d.setDate(startDay);
    return d;
  }, [startMonth, startDay]);

  const end = computeEnd(startMonth, startDay);

  const { mutateAsync: createConfig } =
    useCreateFiscalYearConfigApiV1BudgetFiscalYearConfigPost();
  const { mutateAsync: updateConfig } =
    useUpdateFiscalYearConfigApiV1BudgetFiscalYearConfigConfigIdPut();

  const onValid = async (values: FormValues) => {
    setIsSubmitting(true);
    const endComputed = computeEnd(values.start_month, values.start_day);
    const basePayload = {
      start_month: values.start_month,
      start_day: values.start_day,
      end_month: endComputed.endMonth,
      end_day: endComputed.endDay,
      period_type: values.period_type,
      code_prefix: "FY",
      name_template: "Fiscal Year {year}",
      rollover_enabled: false,
      auto_create_enabled: false,
    };
    try {
      if (existingConfigId) {
        await updateConfig({
          configId: existingConfigId,
          data: basePayload,
        });
      } else {
        await createConfig({
          data: { organization_id: organizationId, ...basePayload },
        });
      }
      toast.success("Fiscal year configuration saved");
      onComplete();
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to save fiscal year config"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>When does your fiscal year run?</CardTitle>
        <CardDescription>
          This is a one-time setting. Every fiscal year instance you create later will inherit
          these dates and period type. You can change it from Configuration → Fiscal Year.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onValid)} className="space-y-6">
          <div className="space-y-2">
            <Label>Start date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    (errors.start_month || errors.start_day) &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setValue("start_month", date.getMonth() + 1, {
                        shouldValidate: true,
                      });
                      setValue("start_day", date.getDate(), {
                        shouldValidate: true,
                      });
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(errors.start_month || errors.start_day) && (
              <p className="text-xs text-destructive">
                {errors.start_month?.message || errors.start_day?.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Period type</Label>
            <Select
              value={periodType}
              onValueChange={(v) =>
                setValue("period_type", v as PeriodType, { shouldValidate: true })
              }
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PeriodType.annual}>Annual</SelectItem>
                <SelectItem value={PeriodType.quarterly}>Quarterly</SelectItem>
                <SelectItem value={PeriodType.monthly}>Monthly</SelectItem>
                <SelectItem value={PeriodType.semi_annual}>Semi-annual</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              How often your organization reviews budgets and rolls up spending.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            Your fiscal year will end on{" "}
            <span className="font-medium">
              {MONTHS[end.endMonth - 1]} {end.endDay}
            </span>
            .
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
