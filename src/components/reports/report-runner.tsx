"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileSpreadsheet, Loader2, Play } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListFiscalYearsApiV1BudgetFiscalYearsGet } from "@/lib/generated/kaizenAdmin/budget-v1/budget-v1";
import { extractItems } from "@/lib/list-response";
import type { FilterDefinition, ReportDescriptor } from "@/lib/reports/catalog";
import {
  fetchReportJson,
  downloadReport,
  type ReportFormat,
} from "@/lib/reports/run-report";
import { toast } from "sonner";
import { extractErrorMessage } from "@/lib/api-error";
import { ReportRenderer } from "./renderers";
import Link from "next/link";

interface FiscalYearOption {
  id: string;
  year_code: string;
  year_name?: string;
  status?: string;
  is_active?: boolean;
}

function defaultFilterValues(defs: FilterDefinition[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of defs) {
    if (f.default !== undefined) out[f.name] = f.default;
  }
  return out;
}

interface ReportRunnerProps {
  descriptor: ReportDescriptor;
}

export function ReportRunner({ descriptor }: ReportRunnerProps) {
  const { user } = useAuth();
  const organizationId = user?.organizationId;

  const { data: fiscalYearsData, isLoading: isLoadingFY } =
    useListFiscalYearsApiV1BudgetFiscalYearsGet(
      { organization_id: organizationId ?? 0, limit: 50 },
      { query: { enabled: !!organizationId } },
    );

  const fiscalYears = useMemo<FiscalYearOption[]>(() => {
    return extractItems<FiscalYearOption>(fiscalYearsData, "fiscal_years").filter(
      (fy) => !!fy?.id,
    );
  }, [fiscalYearsData]);

  const activeFiscalYearId = useMemo(() => {
    const active = fiscalYears.find(
      (fy) => fy.is_active || fy.status === "active",
    );
    return active?.id ?? fiscalYears[0]?.id;
  }, [fiscalYears]);

  const [filters, setFilters] = useState<Record<string, unknown>>(() =>
    defaultFilterValues(descriptor.filters),
  );

  // Auto-populate required FY filter once fiscal years resolve
  const needsFY = descriptor.filters.some(
    (f) => f.type === "fiscal-year" && f.required,
  );
  const fyName =
    descriptor.filters.find((f) => f.type === "fiscal-year")?.name ?? "fiscal_year_id";
  if (
    activeFiscalYearId &&
    filters[fyName] === undefined
  ) {
    // one-shot populate; safe to set in render because it stabilizes after first call
    setFilters((prev) => ({ ...prev, [fyName]: activeFiscalYearId }));
  }

  const [result, setResult] = useState<unknown>(undefined);
  const [capabilityError, setCapabilityError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<ReportFormat | null>(null);

  const updateFilter = (name: string, value: unknown) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const hasRequiredMissing = descriptor.filters.some(
    (f) => f.required && (filters[f.name] === undefined || filters[f.name] === ""),
  );

  const run = async () => {
    setIsRunning(true);
    setCapabilityError(null);
    setResult(undefined);
    try {
      const data = await fetchReportJson({
        descriptor,
        filters: stripEmpty(filters),
        organizationId,
      });
      setResult(data);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      if (status === 403 && typeof detail === "string") {
        setCapabilityError(detail);
      } else {
        toast.error(extractErrorMessage(err, "Failed to run report"));
      }
    } finally {
      setIsRunning(false);
    }
  };

  const download = async (format: "pdf" | "xlsx") => {
    setDownloadingFormat(format);
    try {
      await downloadReport(
        {
          descriptor,
          filters: stripEmpty(filters),
          organizationId,
        },
        format,
      );
    } catch (err) {
      toast.error(extractErrorMessage(err, `Failed to download ${format.toUpperCase()}`));
    } finally {
      setDownloadingFormat(null);
    }
  };

  // No fiscal years configured → CTA (same pattern as kaizenAdmin form)
  if (!isLoadingFY && fiscalYears.length === 0 && needsFY) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No fiscal years configured. Create one in{" "}
          <Link
            href="/configuration/fiscal-year"
            className="font-medium text-primary underline"
          >
            Configuration → Fiscal Year
          </Link>{" "}
          before running this report.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardContent className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {descriptor.filters.map((f) => (
              <FilterField
                key={f.name}
                def={f}
                value={filters[f.name]}
                onChange={(v) => updateFilter(f.name, v)}
                fiscalYears={fiscalYears}
                isLoadingFY={isLoadingFY}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
            <Button
              onClick={run}
              disabled={isRunning || hasRequiredMissing}
            >
              {isRunning ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Report
            </Button>
            <Button
              variant="outline"
              onClick={() => download("pdf")}
              disabled={isRunning || !!downloadingFormat || hasRequiredMissing}
            >
              {downloadingFormat === "pdf" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => download("xlsx")}
              disabled={isRunning || !!downloadingFormat || hasRequiredMissing}
            >
              {downloadingFormat === "xlsx" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {isRunning && (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          <span className="text-sm">Generating report…</span>
        </div>
      )}

      {!isRunning && capabilityError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
          <p className="font-semibold mb-1">Report not available on your plan</p>
          <p className="text-amber-800">{capabilityError}</p>
          <p className="text-xs text-amber-700 mt-2">
            Contact your account administrator to enable the required capability.
          </p>
        </div>
      )}

      {!isRunning && !capabilityError && result !== undefined && (
        <ReportRenderer
          kind={descriptor.renderer}
          data={result}
          title={descriptor.title}
        />
      )}

      {!isRunning && !capabilityError && result === undefined && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Configure filters above and click <strong>Run Report</strong> to generate.
        </div>
      )}
    </div>
  );
}

function FilterField({
  def,
  value,
  onChange,
  fiscalYears,
  isLoadingFY,
}: {
  def: FilterDefinition;
  value: unknown;
  onChange: (v: unknown) => void;
  fiscalYears: FiscalYearOption[];
  isLoadingFY: boolean;
}) {
  const labelText = (
    <Label className="text-sm">
      {def.label}
      {def.required && <span className="text-destructive ml-1">*</span>}
    </Label>
  );

  if (def.type === "fiscal-year") {
    return (
      <div className="space-y-1.5">
        {labelText}
        <Select
          value={(value as string) || undefined}
          onValueChange={(v) => onChange(v)}
          disabled={isLoadingFY || fiscalYears.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoadingFY ? "Loading…" : "Select fiscal year"} />
          </SelectTrigger>
          <SelectContent>
            {fiscalYears.map((fy) => (
              <SelectItem key={fy.id} value={fy.id}>
                {fy.year_name ?? fy.year_code}
                {(fy.is_active || fy.status === "active") && " (Active)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {def.helperText && (
          <p className="text-xs text-muted-foreground">{def.helperText}</p>
        )}
      </div>
    );
  }

  if (def.type === "select") {
    return (
      <div className="space-y-1.5">
        {labelText}
        <Select
          value={(value as string) || undefined}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={def.placeholder ?? "Select…"} />
          </SelectTrigger>
          <SelectContent>
            {def.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {def.helperText && (
          <p className="text-xs text-muted-foreground">{def.helperText}</p>
        )}
      </div>
    );
  }

  if (def.type === "date") {
    return (
      <div className="space-y-1.5">
        {labelText}
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
        />
        {def.helperText && (
          <p className="text-xs text-muted-foreground">{def.helperText}</p>
        )}
      </div>
    );
  }

  if (def.type === "number") {
    return (
      <div className="space-y-1.5">
        {labelText}
        <Input
          type="number"
          min={def.min}
          max={def.max}
          value={(value as number) ?? ""}
          onChange={(e) => {
            const raw = e.target.value;
            onChange(raw === "" ? undefined : Number(raw));
          }}
          placeholder={def.placeholder}
        />
        {def.helperText && (
          <p className="text-xs text-muted-foreground">{def.helperText}</p>
        )}
      </div>
    );
  }

  if (def.type === "toggle") {
    return (
      <div className="flex items-center justify-between gap-4 pt-6">
        <div>
          {labelText}
          {def.helperText && (
            <p className="text-xs text-muted-foreground mt-1">{def.helperText}</p>
          )}
        </div>
        <Switch
          checked={!!value}
          onCheckedChange={(v) => onChange(v)}
        />
      </div>
    );
  }

  if (def.type === "department") {
    // TODO Phase B: wire to departments endpoint. For now a free-text input.
    return (
      <div className="space-y-1.5">
        {labelText}
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || undefined)}
          placeholder="Department ID (optional)"
        />
        {def.helperText && (
          <p className="text-xs text-muted-foreground">{def.helperText}</p>
        )}
      </div>
    );
  }

  // text fallback
  return (
    <div className="space-y-1.5">
      {labelText}
      <Input
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value || undefined)}
        placeholder={def.placeholder}
      />
    </div>
  );
}

function stripEmpty(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v;
  }
  return out;
}
