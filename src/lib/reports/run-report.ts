import { requisitionRequest } from "@/lib/api-client";
import type { ReportDescriptor } from "./catalog";

/**
 * Known format query-param values accepted by budget report endpoints.
 * Spec declares `format` with default "json" but no enum; these values
 * were confirmed at runtime during Phase A implementation.
 */
export type ReportFormat = "json" | "pdf" | "xlsx";

export interface RunReportOptions {
  descriptor: ReportDescriptor;
  filters: Record<string, unknown>;
  organizationId?: number;
}

/**
 * Build the query params + body the endpoint expects given the user's
 * filter values. GET endpoints put everything in query; POST endpoints
 * put body fields in the JSON body (except `format` which stays a query
 * param on the URL).
 */
function splitFilters(desc: ReportDescriptor, filters: Record<string, unknown>) {
  if (desc.method === "GET") {
    return { query: { ...filters }, body: undefined };
  }
  // POST — everything in filters goes into the body, except `format`
  // which the caller tacks on as a query param separately.
  return { query: {}, body: { ...filters } };
}

/**
 * Inject organization_id into either query or body depending on the
 * method. GET endpoints take it as a query param; POST endpoints expect
 * it in the JSON body.
 */
function injectOrgId(
  descriptor: ReportDescriptor,
  query: Record<string, unknown>,
  body: Record<string, unknown> | undefined,
  organizationId?: number,
) {
  if (!descriptor.injectsOrgId || organizationId === undefined) {
    return { query, body };
  }
  if (descriptor.method === "POST") {
    return {
      query,
      body: { ...(body ?? {}), organization_id: organizationId },
    };
  }
  return {
    query: { ...query, organization_id: organizationId },
    body,
  };
}

/**
 * Fetch the report as parsed JSON. Uses the shared axios mutator so the
 * auth interceptor attaches the Bearer token.
 */
export async function fetchReportJson(opts: RunReportOptions): Promise<unknown> {
  const { descriptor, filters, organizationId } = opts;
  const split = splitFilters(descriptor, filters);
  const { query, body } = injectOrgId(descriptor, split.query, split.body, organizationId);

  return requisitionRequest<unknown>({
    url: descriptor.path,
    method: descriptor.method,
    params: { ...query, format: "json" },
    data: body,
  });
}

/**
 * Download the report as a PDF or Excel blob and trigger a browser save.
 * Filename format: `<report-slug>-<YYYY-MM-DD>.<ext>`.
 */
export async function downloadReport(
  opts: RunReportOptions,
  format: Exclude<ReportFormat, "json">,
): Promise<void> {
  const { descriptor, filters, organizationId } = opts;
  const split = splitFilters(descriptor, filters);
  const { query, body } = injectOrgId(descriptor, split.query, split.body, organizationId);

  const blob = await requisitionRequest<Blob>({
    url: descriptor.path,
    method: descriptor.method,
    params: { ...query, format },
    data: body,
    responseType: "blob",
  });

  const today = new Date().toISOString().slice(0, 10);
  const filename = `${descriptor.id}-${today}.${format === "xlsx" ? "xlsx" : "pdf"}`;

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
