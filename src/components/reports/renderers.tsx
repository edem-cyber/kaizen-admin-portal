"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RendererKind } from "@/lib/reports/catalog";

/**
 * Report renderers. Each accepts the parsed JSON response from a report
 * endpoint and renders it in an appropriate view. If the data doesn't
 * match the expected shape for a given renderer, the component falls
 * back to ReportRawJson.
 */

export function ReportRenderer({
  kind,
  data,
  title,
}: {
  kind: RendererKind;
  data: unknown;
  title: string;
}) {
  if (data === null || data === undefined) {
    return <EmptyState />;
  }
  switch (kind) {
    case "table":
      return <ReportTable data={data} />;
    case "kpi-grid":
      return <ReportKpiGrid data={data} />;
    case "hybrid":
      return <ReportHybrid data={data} />;
    case "chart-line":
      return <ReportLineChart data={data} title={title} />;
    case "chart-bar":
      return <ReportBarChart data={data} title={title} />;
    case "raw-json":
    default:
      return <ReportRawJson data={data} title={title} />;
  }
}

// ──────────────────────────────────────────────────────────────────────
//  ReportTable — best-effort flatten + render
// ──────────────────────────────────────────────────────────────────────

function findArrayPayload(data: unknown): Record<string, unknown>[] | null {
  if (Array.isArray(data)) return data as Record<string, unknown>[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    // Common keys where API stuffs the row-array
    for (const key of [
      "items",
      "rows",
      "details",
      "results",
      "data",
      "lines",
      "breakdown",
      "budget_lines",
      "departments",
      "categories",
      "entries",
    ]) {
      const v = obj[key];
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") {
        return v as Record<string, unknown>[];
      }
    }
    // Any top-level array of objects
    for (const v of Object.values(obj)) {
      if (Array.isArray(v) && v.length > 0 && typeof v[0] === "object") {
        return v as Record<string, unknown>[];
      }
    }
  }
  return null;
}

function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})/.test(s);
}

function formatScalar(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "string") {
    if (isIsoDate(v)) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) return d.toLocaleDateString();
    }
    return v;
  }
  return String(v);
}

/**
 * Render a single cell value. Primitives use formatScalar. Arrays of
 * objects are rendered as a vertical stack of sub-rows, showing each
 * object's primitive fields inline. Arrays of primitives are joined
 * with commas. Plain objects are rendered as key: value lines.
 */
function CellValue({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <span>—</span>;

  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-muted-foreground">—</span>;
    const firstIsObject = typeof value[0] === "object" && value[0] !== null;

    if (!firstIsObject) {
      return <span>{value.map((v) => formatScalar(v)).join(", ")}</span>;
    }

    return (
      <ul className="space-y-1.5 max-w-md">
        {(value as Record<string, unknown>[]).map((item, i) => {
          const primitiveEntries = Object.entries(item).filter(
            ([, v]) =>
              v !== null &&
              v !== undefined &&
              typeof v !== "object",
          );
          return (
            <li
              key={i}
              className="rounded border border-border/60 bg-muted/30 p-2 text-xs"
            >
              {primitiveEntries.map(([k, v]) => (
                <div key={k} className="flex gap-1">
                  <span className="font-medium text-muted-foreground">
                    {k.replace(/_/g, " ")}:
                  </span>
                  <span className="break-words">{formatScalar(v)}</span>
                </div>
              ))}
            </li>
          );
        })}
      </ul>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div className="space-y-0.5 text-xs">
        {entries.map(([k, v]) => (
          <div key={k} className="flex gap-1">
            <span className="font-medium text-muted-foreground">
              {k.replace(/_/g, " ")}:
            </span>
            <span>{formatScalar(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  return <span>{formatScalar(value)}</span>;
}

function formatCell(v: unknown): string {
  // Kept for backward compat (KpiGrid still uses it). Prefer CellValue.
  return formatScalar(v);
}

function ReportTable({ data }: { data: unknown }) {
  const rows = useMemo(() => findArrayPayload(data), [data]);

  if (!rows || rows.length === 0) {
    // No recognizable rows — show JSON fallback
    return <ReportRawJson data={data} title="Report output" />;
  }

  const columns = Object.keys(rows[0]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Report Output</CardTitle>
        <p className="text-xs text-muted-foreground">
          {rows.length} row{rows.length === 1 ? "" : "s"}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                {columns.map((c) => (
                  <th
                    key={c}
                    className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    {c.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b last:border-0 align-top">
                  {columns.map((c) => (
                    <td key={c} className="px-4 py-2">
                      <CellValue value={row[c]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ReportKpiGrid — best-effort extraction of numeric summary fields
// ──────────────────────────────────────────────────────────────────────

function findSummaryObject(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  // Preferred shapes
  for (const key of ["summary", "totals", "kpis", "metrics"]) {
    const v = obj[key];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return v as Record<string, unknown>;
    }
  }
  // Fall back to top-level scalar fields
  const scalars: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "number" || typeof v === "string") scalars[k] = v;
  }
  return Object.keys(scalars).length > 0 ? scalars : null;
}

function ReportKpiGrid({ data }: { data: unknown }) {
  const kpis = useMemo(() => findSummaryObject(data), [data]);

  if (!kpis) {
    return <ReportRawJson data={data} title="Report output" />;
  }

  const entries = Object.entries(kpis);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(([k, v]) => (
        <Card key={k} className="border-border/60">
          <CardContent className="p-4 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {k.replace(/_/g, " ")}
            </p>
            <p className="text-2xl font-bold">{formatCell(v)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ReportHybrid — summary block + table, both optional
// ──────────────────────────────────────────────────────────────────────

function ReportHybrid({ data }: { data: unknown }) {
  const kpis = useMemo(() => findSummaryObject(data), [data]);
  const rows = useMemo(() => findArrayPayload(data), [data]);

  if (!kpis && !rows) {
    return <ReportRawJson data={data} title="Report output" />;
  }

  return (
    <div className="space-y-6">
      {kpis && <ReportKpiGrid data={{ summary: kpis }} />}
      {rows && rows.length > 0 && <ReportTable data={rows} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  Chart renderers — best-effort column detection
// ──────────────────────────────────────────────────────────────────────

const CHART_COLORS = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#8b5cf6", // violet
];

/**
 * Given an array of row objects, pick a label column (first string column)
 * and up to 5 numeric columns for plotting. Returns null if the shape
 * doesn't support charting.
 */
function detectChartSeries(rows: Record<string, unknown>[]) {
  if (!rows || rows.length === 0) return null;
  const sample = rows[0];
  const keys = Object.keys(sample);

  const stringKey = keys.find(
    (k) => typeof sample[k] === "string" && !/id$|uuid$/i.test(k),
  );
  const numericKeys = keys.filter((k) => typeof sample[k] === "number");

  if (!stringKey || numericKeys.length === 0) return null;

  return {
    labelKey: stringKey,
    valueKeys: numericKeys.slice(0, 5),
  };
}

function ReportBarChart({ data, title }: { data: unknown; title: string }) {
  const rows = useMemo(() => findArrayPayload(data), [data]);
  const series = useMemo(() => (rows ? detectChartSeries(rows) : null), [rows]);

  if (!rows || !series) {
    return <ReportRawJson data={data} title={title} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {rows.length} row{rows.length === 1 ? "" : "s"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full">
            <ResponsiveContainer>
              <BarChart data={rows} margin={{ top: 16, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey={series.labelKey}
                  tick={{ fontSize: 11 }}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {series.valueKeys.map((k, i) => (
                  <Bar
                    key={k}
                    dataKey={k}
                    fill={CHART_COLORS[i % CHART_COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <ReportTable data={rows} />
    </div>
  );
}

function ReportLineChart({ data, title }: { data: unknown; title: string }) {
  const rows = useMemo(() => findArrayPayload(data), [data]);
  const series = useMemo(() => (rows ? detectChartSeries(rows) : null), [rows]);

  if (!rows || !series) {
    return <ReportRawJson data={data} title={title} />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {rows.length} row{rows.length === 1 ? "" : "s"}
          </p>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full">
            <ResponsiveContainer>
              <LineChart data={rows} margin={{ top: 16, right: 16, bottom: 24, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey={series.labelKey}
                  tick={{ fontSize: 11 }}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {series.valueKeys.map((k, i) => (
                  <Line
                    key={k}
                    type="monotone"
                    dataKey={k}
                    stroke={CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <ReportTable data={rows} />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ReportRawJson — fallback
// ──────────────────────────────────────────────────────────────────────

function ReportRawJson({ data, title }: { data: unknown; title: string }) {
  const text = useMemo(() => JSON.stringify(data, null, 2), [data]);
  const copy = () => {
    navigator.clipboard?.writeText(text).catch(() => {});
  };

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base">{title} — raw response</CardTitle>
        <button
          type="button"
          onClick={copy}
          className="text-xs text-primary hover:underline"
        >
          Copy JSON
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <pre className="max-h-[60vh] overflow-auto bg-muted/30 p-4 text-xs font-mono">
          {text}
        </pre>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
      Report returned no data for the selected filters.
    </div>
  );
}
