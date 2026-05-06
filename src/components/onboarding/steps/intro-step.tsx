"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  saveIntroAnswers,
  type IntroAnswers,
} from "@/lib/onboarding";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface IntroStepProps {
  organizationId: number;
  initialAnswers: IntroAnswers | null;
  onComplete: (answers: IntroAnswers) => void;
}

// A small starter list of common currencies. The accounting step later
// uses the org's configured `supported_currencies` for refinement; here
// we just need something sensible up front.
const COMMON_CURRENCIES = ["USD", "EUR", "GBP", "GHS", "NGN", "KES", "ZAR", "INR", "JPY", "CAD"];

const introSchema = z.object({
  default_currency: z
    .string()
    .trim()
    .length(3, "Enter a 3-letter ISO code")
    .regex(/^[A-Z]{3}$/, "Use uppercase letters"),
  fiscal_year_start_month: z
    .number({ error: "Select a month" })
    .int()
    .min(1)
    .max(12),
  fiscal_year_start_day: z
    .number({ error: "Enter a valid day" })
    .int()
    .min(1)
    .max(31),
  enforce_budgets: z.boolean(),
  use_committees: z.boolean(),
});

type IntroFormValues = z.infer<typeof introSchema>;

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function IntroStep({ organizationId, initialAnswers, onComplete }: IntroStepProps) {
  const defaults = useMemo<IntroFormValues>(
    () => ({
      default_currency: initialAnswers?.default_currency ?? "USD",
      fiscal_year_start_month: initialAnswers?.fiscal_year_start_month ?? 1,
      fiscal_year_start_day: initialAnswers?.fiscal_year_start_day ?? 1,
      enforce_budgets: initialAnswers?.enforce_budgets ?? false,
      use_committees: initialAnswers?.use_committees ?? false,
    }),
    [initialAnswers],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<IntroFormValues>({
    resolver: zodResolver(introSchema),
    defaultValues: defaults,
  });

  const currency = watch("default_currency");
  const startMonth = watch("fiscal_year_start_month");
  const startDay = watch("fiscal_year_start_day");
  const enforceBudgets = watch("enforce_budgets");
  const useCommittees = watch("use_committees");

  const selectedDate = useMemo(() => {
    if (!startMonth || !startDay) return undefined;
    // We use the current year as a base, but the configuration only cares about Month/Day
    const d = new Date();
    d.setMonth(startMonth - 1);
    d.setDate(startDay);
    return d;
  }, [startMonth, startDay]);

  const onValid = (values: IntroFormValues) => {
    saveIntroAnswers(organizationId, values);
    onComplete(values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tell us about your organization</CardTitle>
        <CardDescription>
          These answers seed sensible defaults for the rest of the wizard. You can change any of
          them later from Configuration.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onValid)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="default_currency">What currency will your organization transact and budget in?</Label>
            <Select
              value={currency}
              onValueChange={(v) =>
                setValue("default_currency", v.toUpperCase(), { shouldValidate: true })
              }
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
            {errors.default_currency && (
              <p className="text-xs text-destructive">{errors.default_currency.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Fiscal year start date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground",
                    (errors.fiscal_year_start_month || errors.fiscal_year_start_day) &&
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
                      setValue("fiscal_year_start_month", date.getMonth() + 1, {
                        shouldValidate: true,
                      });
                      setValue("fiscal_year_start_day", date.getDate(), {
                        shouldValidate: true,
                      });
                    }
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {(errors.fiscal_year_start_month || errors.fiscal_year_start_day) && (
              <p className="text-xs text-destructive">
                {errors.fiscal_year_start_month?.message || errors.fiscal_year_start_day?.message}
              </p>
            )}
          </div>

          <div className="rounded-lg border p-4 flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="enforce_budgets" className="text-sm font-medium">
                Enforce budget checks on requisitions?
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Requires each requisition to reference a budget line. We&rsquo;ll walk you
                through creating a fiscal year and one budget during setup.
              </p>
            </div>
            <Switch
              id="enforce_budgets"
              checked={enforceBudgets}
              onCheckedChange={(v) =>
                setValue("enforce_budgets", v, { shouldDirty: true, shouldValidate: true })
              }
            />
          </div>

          <div className="rounded-lg border p-4 flex items-start justify-between gap-4">
            <div>
              <Label htmlFor="use_committees" className="text-sm font-medium">
                Use a committee to review large purchases?
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                If off, every requisition goes straight to the assigned approver. You can turn
                this on later from Configuration.
              </p>
            </div>
            <Switch
              id="use_committees"
              checked={useCommittees}
              onCheckedChange={(v) =>
                setValue("use_committees", v, { shouldDirty: true, shouldValidate: true })
              }
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
