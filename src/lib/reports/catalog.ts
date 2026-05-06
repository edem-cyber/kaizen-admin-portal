/**
 * Budget report catalog. Single source of truth for the Reports section
 * (sidebar → Reports → Budget Performance / Comparative Analysis /
 * Predictive Analysis → individual report).
 *
 * Each descriptor drives three things:
 *   1) Hub page — which card to show under which section
 *   2) Route page — which filter form to render and which endpoint to call
 *   3) Download helper — which format values are accepted and how to name
 *      the saved file
 *
 * Response shapes are not documented in the OpenAPI spec (all declared as
 * `?`). Renderers are a best guess — fall back to ReportRawJson if the
 * response doesn't match the expected shape.
 */

export type ReportCategory =
  | "utilization"
  | "detail"
  | "generated"
  | "comparative"
  | "predictive";

export type ReportSection =
  | "budget-performance"
  | "comparative-analysis"
  | "predictive-analysis";

export type RendererKind =
  | "table"
  | "chart-line"
  | "chart-bar"
  | "kpi-grid"
  | "hybrid"
  | "raw-json";

export type FilterType =
  | "fiscal-year"    // Select sourced from /budget/fiscal-years
  | "department"     // (Optional) Select sourced from org departments
  | "date"
  | "number"
  | "select"         // enum options provided inline
  | "toggle"
  | "text";

export interface FilterDefinition {
  name: string;            // query-param name or body field name
  label: string;           // UI label
  type: FilterType;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  default?: string | number | boolean;
  placeholder?: string;
  helperText?: string;
  min?: number;
  max?: number;
}

export interface ReportDescriptor {
  /** URL slug — stable identifier per report (never rename). */
  id: string;
  section: ReportSection;
  category: ReportCategory;
  title: string;
  description: string;
  method: "GET" | "POST";
  /** Template path with `{placeholder}` for path params if any. */
  path: string;
  /** Filter definitions — each rendered in the ReportRunner filter panel. */
  filters: FilterDefinition[];
  /** Renderer hint. If the live response doesn't match, ReportRunner
   *  falls back to "raw-json". */
  renderer: RendererKind;
  /** Whether the endpoint requires the org_id to be auto-injected. */
  injectsOrgId?: boolean;
}

const fiscalYearRequired: FilterDefinition = {
  name: "fiscal_year_id",
  label: "Fiscal Year",
  type: "fiscal-year",
  required: true,
};

const fiscalYearOptional: FilterDefinition = {
  name: "fiscal_year_id",
  label: "Fiscal Year",
  type: "fiscal-year",
  required: false,
};

const departmentOptional: FilterDefinition = {
  name: "department_id",
  label: "Department",
  type: "department",
  required: false,
  helperText: "Leave blank to include all departments.",
};

export const REPORTS: ReportDescriptor[] = [
  // ── Budget Performance ────────────────────────────────────────────────
  {
    id: "budget-utilization",
    section: "budget-performance",
    category: "utilization",
    title: "Budget Utilization",
    description:
      "Organization-wide view of budget consumption — committed, actual, and remaining amounts.",
    method: "GET",
    path: "/api/v1/budget/reports/budget-utilization",
    filters: [fiscalYearOptional, departmentOptional],
    renderer: "hybrid",
    injectsOrgId: true,
  },
  {
    id: "budget-utilization-by-line",
    section: "budget-performance",
    category: "utilization",
    title: "Utilization by Line Item",
    description:
      "Line-level utilization breakdown within each budget, including over-allocation flags.",
    method: "GET",
    path: "/api/v1/budget/reports/budget-utilization-by-line",
    filters: [fiscalYearRequired],
    renderer: "hybrid",
  },
  {
    id: "utilization-categories",
    section: "budget-performance",
    category: "utilization",
    title: "Utilization by Category",
    description:
      "Spending categorized by vendor / expense category, showing where budgets concentrate.",
    method: "GET",
    path: "/api/v1/budget/reports/utilization/categories",
    filters: [fiscalYearOptional, departmentOptional],
    renderer: "chart-bar",
    injectsOrgId: true,
  },
  {
    id: "utilization-departments",
    section: "budget-performance",
    category: "utilization",
    title: "Utilization by Department",
    description:
      "Department-level utilization as of a given date, side-by-side with budgeted totals.",
    method: "GET",
    path: "/api/v1/budget/reports/utilization/departments",
    filters: [
      fiscalYearOptional,
      {
        name: "as_of_date",
        label: "As of Date",
        type: "date",
        required: false,
        helperText: "Defaults to today if left blank.",
      },
    ],
    renderer: "table",
    injectsOrgId: true,
  },
  {
    id: "expenditure-details",
    section: "budget-performance",
    category: "detail",
    title: "Expenditure Details",
    description:
      "Line-level expenditure report with every transaction rolled up by budget.",
    method: "GET",
    path: "/api/v1/budget/reports/expenditure-details",
    filters: [fiscalYearRequired],
    renderer: "table",
  },
  {
    id: "budget-consumption",
    section: "budget-performance",
    category: "generated",
    title: "Budget Consumption",
    description:
      "Period-based consumption analysis with configurable reporting intervals.",
    method: "POST",
    path: "/api/v1/budget/reports/budget-consumption",
    filters: [
      fiscalYearOptional,
      departmentOptional,
      { name: "start_date", label: "Start Date", type: "date" },
      { name: "end_date", label: "End Date", type: "date" },
      {
        name: "report_period",
        label: "Report Period",
        type: "select",
        required: true,
        options: [
          { value: "weekly", label: "Weekly" },
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "yearly", label: "Yearly" },
        ],
        default: "monthly",
      },
    ],
    renderer: "chart-line",
    injectsOrgId: true,
  },
  {
    id: "budget-trend-analysis",
    section: "budget-performance",
    category: "generated",
    title: "Trend Analysis",
    description:
      "Multi-period trend comparison for budget consumption and growth.",
    method: "POST",
    path: "/api/v1/budget/reports/budget-trend-analysis",
    filters: [
      {
        name: "current_fiscal_year_id",
        label: "Current Fiscal Year",
        type: "fiscal-year",
        required: true,
      },
      {
        name: "comparison_periods",
        label: "Comparison Periods",
        type: "number",
        default: 3,
        min: 1,
        max: 12,
        helperText: "Number of prior periods to compare against.",
      },
      departmentOptional,
    ],
    renderer: "chart-line",
    injectsOrgId: true,
  },
  {
    id: "budget-vs-actual",
    section: "budget-performance",
    category: "generated",
    title: "Budget vs Actual",
    description:
      "Variance analysis comparing budgeted amounts to actual spend.",
    method: "POST",
    path: "/api/v1/budget/reports/budget-vs-actual",
    filters: [
      fiscalYearOptional,
      departmentOptional,
      { name: "start_date", label: "Start Date", type: "date" },
      { name: "end_date", label: "End Date", type: "date" },
      {
        name: "include_variance_analysis",
        label: "Include variance analysis",
        type: "toggle",
        default: true,
      },
      {
        name: "include_recommendations",
        label: "Include recommendations",
        type: "toggle",
        default: false,
      },
    ],
    renderer: "hybrid",
    injectsOrgId: true,
  },

  // ── Comparative Analysis ─────────────────────────────────────────────
  {
    id: "budget-efficiency",
    section: "comparative-analysis",
    category: "comparative",
    title: "Budget Efficiency",
    description:
      "Efficiency metrics comparing outcomes against budgeted resources.",
    method: "GET",
    path: "/api/v1/budget/reports/comparative/budget-efficiency",
    filters: [fiscalYearRequired],
    renderer: "kpi-grid",
  },
  {
    id: "budget-forecast",
    section: "comparative-analysis",
    category: "comparative",
    title: "Budget Forecast",
    description:
      "Projected spending through the end of the fiscal year based on current run-rate.",
    method: "GET",
    path: "/api/v1/budget/reports/comparative/budget-forecast",
    filters: [fiscalYearRequired],
    renderer: "chart-line",
  },
  {
    id: "cash-flow-impact",
    section: "comparative-analysis",
    category: "comparative",
    title: "Cash Flow Impact",
    description:
      "Projected monthly cash outflow and its impact on budget availability.",
    method: "GET",
    path: "/api/v1/budget/reports/comparative/cash-flow-impact",
    filters: [
      fiscalYearRequired,
      {
        name: "months_ahead",
        label: "Months Ahead",
        type: "number",
        default: 6,
        min: 1,
        max: 24,
      },
      {
        name: "include_details",
        label: "Include transaction details",
        type: "toggle",
        default: false,
      },
    ],
    renderer: "chart-bar",
  },
  {
    id: "period-growth-rate",
    section: "comparative-analysis",
    category: "comparative",
    title: "Period Growth Rate",
    description:
      "Period-over-period spending growth (or decline) by department.",
    method: "GET",
    path: "/api/v1/budget/reports/comparative/period-growth-rate",
    filters: [
      fiscalYearRequired,
      {
        name: "period_type",
        label: "Period Type",
        type: "select",
        options: [
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
          { value: "yearly", label: "Yearly" },
        ],
        default: "monthly",
      },
      departmentOptional,
    ],
    renderer: "chart-line",
  },
  {
    id: "seasonal-comparison",
    section: "comparative-analysis",
    category: "comparative",
    title: "Seasonal Comparison",
    description:
      "Year-over-year spend patterns by season or calendar period.",
    method: "GET",
    path: "/api/v1/budget/reports/comparative/seasonal-comparison",
    filters: [
      fiscalYearRequired,
      {
        name: "comparison_years",
        label: "Years to Compare",
        type: "number",
        default: 2,
        min: 1,
        max: 5,
      },
      {
        name: "period_type",
        label: "Period Type",
        type: "select",
        options: [
          { value: "monthly", label: "Monthly" },
          { value: "quarterly", label: "Quarterly" },
        ],
        default: "monthly",
      },
    ],
    renderer: "chart-line",
  },
  {
    id: "spend-concentration",
    section: "comparative-analysis",
    category: "comparative",
    title: "Spend Concentration",
    description:
      "Who and what drives the top spend — concentration analysis by group.",
    method: "GET",
    path: "/api/v1/budget/reports/comparative/spend-concentration",
    filters: [
      fiscalYearRequired,
      {
        name: "group_by",
        label: "Group By",
        type: "select",
        options: [
          { value: "department", label: "Department" },
          { value: "vendor", label: "Vendor" },
          { value: "category", label: "Category" },
        ],
        default: "department",
      },
    ],
    renderer: "chart-bar",
  },

  // ── Predictive Analysis ──────────────────────────────────────────────
  {
    id: "budget-reallocation",
    section: "predictive-analysis",
    category: "predictive",
    title: "Budget Reallocation Suggestions",
    description:
      "Recommendations for reallocating under-used budget to constrained areas.",
    method: "GET",
    path: "/api/v1/budget/reports/predictive/budget-reallocation",
    filters: [fiscalYearRequired],
    renderer: "table",
  },
  {
    id: "cash-burn-rate",
    section: "predictive-analysis",
    category: "predictive",
    title: "Cash Burn Rate",
    description:
      "Current burn rate and estimated runway based on recent trends.",
    method: "GET",
    path: "/api/v1/budget/reports/predictive/cash-burn-rate",
    filters: [fiscalYearRequired],
    renderer: "kpi-grid",
  },
  {
    id: "seasonal-budget-plan",
    section: "predictive-analysis",
    category: "predictive",
    title: "Seasonal Budget Plan",
    description:
      "Suggested budget distribution across seasons given historical data and a target total.",
    method: "GET",
    path: "/api/v1/budget/reports/predictive/seasonal-budget-plan",
    filters: [
      fiscalYearRequired,
      {
        name: "comparison_years",
        label: "Years to Compare",
        type: "number",
        default: 2,
        min: 1,
        max: 5,
      },
      {
        name: "target_total",
        label: "Target Total",
        type: "number",
        helperText: "Optional. Leave blank to use the fiscal-year total.",
      },
    ],
    renderer: "chart-bar",
  },
  {
    id: "vendor-price-trend",
    section: "predictive-analysis",
    category: "predictive",
    title: "Vendor Price Trend",
    description:
      "Predictive pricing trend for frequently-used vendors over time.",
    method: "GET",
    path: "/api/v1/budget/reports/predictive/vendor-price-trend",
    filters: [fiscalYearRequired],
    renderer: "chart-line",
  },
];

export function findReport(section: ReportSection, id: string) {
  return REPORTS.find((r) => r.section === section && r.id === id);
}

export function reportsBySection(section: ReportSection): ReportDescriptor[] {
  return REPORTS.filter((r) => r.section === section);
}

export const SECTION_META: Record<
  ReportSection,
  { title: string; description: string; path: string }
> = {
  "budget-performance": {
    title: "Budget Performance",
    description:
      "Utilization, expenditure, and consumption reports showing how budgets are used in practice.",
    path: "/reports/budget-performance",
  },
  "comparative-analysis": {
    title: "Comparative Analysis",
    description:
      "Year-over-year and period-over-period comparisons, growth rates, efficiency, and concentration.",
    path: "/reports/comparative-analysis",
  },
  "predictive-analysis": {
    title: "Predictive Analysis",
    description:
      "Forward-looking reports — burn rate, reallocation suggestions, and price-trend forecasts.",
    path: "/reports/predictive-analysis",
  },
};
