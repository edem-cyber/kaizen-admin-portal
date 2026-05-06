"use client";

import { useEffect, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X, Wand2 } from "lucide-react";
import { PeriodType } from "@/lib/generated/kaizenAdmin/models";
import type { BudgetAllocationRuleResponse } from "@/lib/generated/kaizenAdmin/models";

const PERIOD_TEMPLATES: Record<string, string[]> = {
  [PeriodType.monthly]: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
  [PeriodType.quarterly]: ["Q1", "Q2", "Q3", "Q4"],
  [PeriodType.semi_annual]: ["H1", "H2"],
  [PeriodType.annual]: ["Full Year"],
  [PeriodType.custom]: [],
};

const allocationRuleSchema = z
  .object({
    rule_name: z.string().trim().min(1, "Name is required"),
    description: z.string().optional().or(z.literal("")),
    period_type: z.nativeEnum(PeriodType),
    department_id: z
      .number({ error: "Enter a number" })
      .int()
      .min(1, "Must be a positive integer")
      .optional()
      .nullable(),
    allocations: z.array(
      z.object({
        label: z.string().trim().min(1, "Required"),
        percentage: z
          .number({ error: "Enter a number" })
          .min(0, "0 or greater")
          .max(100, "Cannot exceed 100"),
      }),
    ),
    enforce_strict_allocation: z.boolean(),
    allow_period_reallocation: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.allocations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocations"],
        message: "Add at least one allocation row",
      });
    }
    const labels = data.allocations.map((a) => a.label.trim());
    const duplicates = labels.filter((l, i) => labels.indexOf(l) !== i);
    if (duplicates.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["allocations"],
        message: "Duplicate period labels — each row needs a unique label",
      });
    }
  });

type AllocationRuleFormValues = z.infer<typeof allocationRuleSchema>;

export interface AllocationRuleFormSubmit {
  rule_name: string;
  description: string | null;
  period_type: PeriodType;
  department_id: number | null;
  allocation_percentages: Record<string, number>;
  enforce_strict_allocation: boolean;
  allow_period_reallocation: boolean;
}

function toFormValues(
  rule?: Partial<BudgetAllocationRuleResponse>,
): AllocationRuleFormValues {
  const percentages = rule?.allocation_percentages as
    | Record<string, number>
    | undefined;
  return {
    rule_name: rule?.rule_name ?? "",
    description: (rule?.description as string) ?? "",
    period_type: (rule?.period_type as PeriodType) ?? PeriodType.quarterly,
    department_id: (rule?.department_id as number | null | undefined) ?? null,
    allocations: percentages
      ? Object.entries(percentages).map(([label, percentage]) => ({
          label,
          percentage: Number(percentage),
        }))
      : [],
    enforce_strict_allocation: rule?.enforce_strict_allocation ?? false,
    allow_period_reallocation: rule?.allow_period_reallocation ?? false,
  };
}

interface AllocationRuleFormProps {
  initialData?: Partial<BudgetAllocationRuleResponse>;
  onSubmit: (data: AllocationRuleFormSubmit) => void;
  onCancel: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function AllocationRuleForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = "Save",
}: AllocationRuleFormProps) {
  const defaultValues = useMemo(() => toFormValues(initialData), [initialData]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    getValues,
    formState: { errors },
  } = useForm<AllocationRuleFormValues>({
    resolver: zodResolver(allocationRuleSchema),
    defaultValues,
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "allocations",
  });

  const periodType = watch("period_type");
  const enforceStrict = watch("enforce_strict_allocation");
  const allowReallocation = watch("allow_period_reallocation");
  const allocations = watch("allocations");

  const total = useMemo(
    () =>
      allocations.reduce((sum, a) => sum + (Number(a.percentage) || 0), 0),
    [allocations],
  );

  // On first mount of an empty create form, pre-populate allocations based on
  // the default period type so admins start with sensible rows.
  useEffect(() => {
    if (allocations.length === 0) {
      const template = PERIOD_TEMPLATES[periodType] ?? [];
      if (template.length === 0) return;
      const evenPct = Number((100 / template.length).toFixed(2));
      replace(template.map((label) => ({ label, percentage: evenPct })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyTemplate = () => {
    const template = PERIOD_TEMPLATES[periodType] ?? [];
    if (template.length === 0) {
      return;
    }
    const evenPct = Number((100 / template.length).toFixed(2));
    replace(template.map((label) => ({ label, percentage: evenPct })));
  };

  const distributeEvenly = () => {
    const current = getValues("allocations");
    if (current.length === 0) return;
    const evenPct = Number((100 / current.length).toFixed(2));
    replace(current.map((a) => ({ ...a, percentage: evenPct })));
  };

  const submit = (values: AllocationRuleFormValues) => {
    const allocation_percentages = values.allocations.reduce<
      Record<string, number>
    >((acc, row) => {
      acc[row.label.trim()] = Number(row.percentage);
      return acc;
    }, {});

    onSubmit({
      rule_name: values.rule_name.trim(),
      description: values.description?.trim() || null,
      period_type: values.period_type,
      department_id: values.department_id ?? null,
      allocation_percentages,
      enforce_strict_allocation: values.enforce_strict_allocation,
      allow_period_reallocation: values.allow_period_reallocation,
    });
  };

  const totalColor =
    Math.abs(total - 100) < 0.01
      ? "text-emerald-600"
      : total > 100
        ? "text-destructive"
        : "text-amber-600";

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6 pt-6">
      <div className="space-y-2">
        <Label htmlFor="rule_name">Rule name</Label>
        <Input
          id="rule_name"
          placeholder="e.g. Q1-heavy marketing spend"
          {...register("rule_name")}
        />
        {errors.rule_name && (
          <p className="text-xs text-destructive">{errors.rule_name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={2}
          placeholder="Why does budget split this way?"
          {...register("description")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Period type</Label>
          <Select
            value={periodType}
            onValueChange={(v) =>
              setValue("period_type", v as PeriodType, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PeriodType.monthly}>Monthly</SelectItem>
              <SelectItem value={PeriodType.quarterly}>Quarterly</SelectItem>
              <SelectItem value={PeriodType.semi_annual}>Semi-annual</SelectItem>
              <SelectItem value={PeriodType.annual}>Annual</SelectItem>
              <SelectItem value={PeriodType.custom}>Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department_id">Department ID (optional)</Label>
          <Input
            id="department_id"
            type="number"
            min={1}
            placeholder="Leave blank for org-wide"
            {...register("department_id", {
              setValueAs: (v) =>
                v === "" || v == null ? null : Number(v),
            })}
          />
          {errors.department_id && (
            <p className="text-xs text-destructive">{errors.department_id.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label>Allocation percentages</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={applyTemplate}
              disabled={PERIOD_TEMPLATES[periodType]?.length === 0}
            >
              <Wand2 className="h-3.5 w-3.5 mr-1.5" />
              Use template
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={distributeEvenly}
              disabled={fields.length === 0}
            >
              Distribute evenly
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border/60 divide-y">
          {fields.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No allocation rows yet. Add one, or use the template above.
            </div>
          ) : (
            fields.map((field, index) => (
              <div
                key={field.id}
                className="grid grid-cols-[1fr_120px_40px] items-center gap-3 p-3"
              >
                <Input
                  placeholder="Label (e.g. Q1)"
                  {...register(`allocations.${index}.label`)}
                />
                <div className="relative">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={0.01}
                    className="pr-7"
                    placeholder="0"
                    {...register(`allocations.${index}.percentage`, {
                      valueAsNumber: true,
                    })}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(index)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove row ${index + 1}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ label: "", percentage: 0 })}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add row
          </Button>
          <div className="text-sm">
            Total: <span className={`font-medium ${totalColor}`}>{total.toFixed(2)}%</span>
            {Math.abs(total - 100) >= 0.01 && (
              <span className="text-xs text-muted-foreground ml-2">
                (should equal 100%)
              </span>
            )}
          </div>
        </div>

        {errors.allocations?.root && (
          <p className="text-xs text-destructive">
            {errors.allocations.root.message}
          </p>
        )}
        {errors.allocations && !errors.allocations.root && (
          <p className="text-xs text-destructive">
            Fix the errors in the allocation rows above.
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-lg border border-border/60 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="enforce_strict_allocation" className="text-sm font-medium">
              Enforce strict allocation
            </Label>
            <p className="text-xs text-muted-foreground">
              Block kaizenAdmins that exceed the allocated amount for any period.
            </p>
          </div>
          <Switch
            id="enforce_strict_allocation"
            checked={enforceStrict}
            onCheckedChange={(v) =>
              setValue("enforce_strict_allocation", v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="allow_period_reallocation" className="text-sm font-medium">
              Allow period reallocation
            </Label>
            <p className="text-xs text-muted-foreground">
              Let unused budget from one period flow into later periods.
            </p>
          </div>
          <Switch
            id="allow_period_reallocation"
            checked={allowReallocation}
            onCheckedChange={(v) =>
              setValue("allow_period_reallocation", v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
