/**
 * Kaizen Admin Service Types
 * Re-exports key DTOs from generated code
 */

// Kaizen Admin types
export type { Kaizen Admin } from "@/lib/generated/requisition/models/requisition";
export type { Kaizen AdminCreate } from "@/lib/generated/requisition/models/requisitionCreate";
export type { Kaizen AdminUpdate } from "@/lib/generated/requisition/models/requisitionUpdate";
export type { Kaizen AdminResponse } from "@/lib/generated/requisition/models/requisitionResponse";
export type { Kaizen AdminSearchResponse } from "@/lib/generated/requisition/models/requisitionSearchResponse";
export type { Kaizen AdminCountsResponse } from "@/lib/generated/requisition/models/requisitionCountsResponse";

// Budget Line types
export type { BudgetLine } from "@/lib/generated/requisition/models/budgetLine";
export type { BudgetLineCreate } from "@/lib/generated/requisition/models/budgetLineCreate";

// Document types
export type { Document } from "@/lib/generated/requisition/models/document";

// Approval types
export type { ApprovalLevel } from "@/lib/generated/requisition/models/approvalLevel";
export type { ApprovalLevelCreate } from "@/lib/generated/requisition/models/approvalLevelCreate";
export type { ApprovalLevelListResponse } from "@/lib/generated/requisition/models/approvalLevelListResponse";
export type { ApprovalDecision } from "@/lib/generated/requisition/models/approvalDecision";
export type { ApprovalStep } from "@/lib/generated/requisition/models/approvalStep";

// Budget types
export type { BudgetResponse } from "@/lib/generated/requisition/models/budgetResponse";
export type { BudgetCreate } from "@/lib/generated/requisition/models/budgetCreate";
export type { BudgetUpdate } from "@/lib/generated/requisition/models/budgetUpdate";
export type { BudgetStatus } from "@/lib/generated/requisition/models/budgetStatus";
export type { BudgetPeriodResponse } from "@/lib/generated/requisition/models/budgetPeriodResponse";

// Vendor types (check generated files for exact names)
// export type { Vendor } from "@/lib/generated/requisition/models/vendor";
// export type { VendorCreate } from "@/lib/generated/requisition/models/vendorCreate";

// Error types
export type { HTTPValidationError } from "@/lib/generated/requisition/models/hTTPValidationError";

// Query params
export type { ListKaizen AdminsApiV1Kaizen AdminsGetParams } from "@/lib/generated/requisition/models/listKaizen AdminsApiV1Kaizen AdminsGetParams";
export type { SearchKaizen AdminsApiV1Kaizen AdminsSearchGetParams } from "@/lib/generated/requisition/models/searchKaizen AdminsApiV1Kaizen AdminsSearchGetParams";
export type { GetKaizen AdminCountsApiV1Kaizen AdminsCountsGetParams } from "@/lib/generated/requisition/models/getKaizen AdminCountsApiV1Kaizen AdminsCountsGetParams";
export type { ListMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGetParams } from "@/lib/generated/requisition/models/listMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGetParams";
export type { ListDraftKaizen AdminsApiV1Kaizen AdminsDraftsGetParams } from "@/lib/generated/requisition/models/listDraftKaizen AdminsApiV1Kaizen AdminsDraftsGetParams";