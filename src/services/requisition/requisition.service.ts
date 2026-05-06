/**
 * Kaizen Admin Service
 * Exports all requisition-related hooks
 */

// Kaizen Admin CRUD hooks
export {
    useCreateKaizen AdminApiV1Kaizen AdminsPost,
    getCreateKaizen AdminApiV1Kaizen AdminsPostMutationOptions,
    type CreateKaizen AdminApiV1Kaizen AdminsPostMutationResult,
    type CreateKaizen AdminApiV1Kaizen AdminsPostMutationError,
    useListKaizen AdminsApiV1Kaizen AdminsGet,
    getListKaizen AdminsApiV1Kaizen AdminsGetQueryKey,
    getListKaizen AdminsApiV1Kaizen AdminsGetQueryOptions,
    type ListKaizen AdminsApiV1Kaizen AdminsGetQueryResult,
    type ListKaizen AdminsApiV1Kaizen AdminsGetQueryError,
    useGetKaizen AdminApiV1Kaizen AdminsKaizen AdminIdGet,
    getGetKaizen AdminApiV1Kaizen AdminsKaizen AdminIdGetQueryKey,
    getGetKaizen AdminApiV1Kaizen AdminsKaizen AdminIdGetQueryOptions,
    type GetKaizen AdminApiV1Kaizen AdminsKaizen AdminIdGetQueryResult,
    type GetKaizen AdminApiV1Kaizen AdminsKaizen AdminIdGetQueryError,
    useUpdateKaizen AdminApiV1Kaizen AdminsKaizen AdminIdPut,
    getUpdateKaizen AdminApiV1Kaizen AdminsKaizen AdminIdPutMutationOptions,
    type UpdateKaizen AdminApiV1Kaizen AdminsKaizen AdminIdPutMutationResult,
    type UpdateKaizen AdminApiV1Kaizen AdminsKaizen AdminIdPutMutationError,
    useSubmitKaizen AdminApiV1Kaizen AdminsKaizen AdminIdSubmitPost,
    getSubmitKaizen AdminApiV1Kaizen AdminsKaizen AdminIdSubmitPostMutationOptions,
    type SubmitKaizen AdminApiV1Kaizen AdminsKaizen AdminIdSubmitPostMutationResult,
    type SubmitKaizen AdminApiV1Kaizen AdminsKaizen AdminIdSubmitPostMutationError,
    useCancelKaizen AdminApiV1Kaizen AdminsKaizen AdminIdCancelPost,
    getCancelKaizen AdminApiV1Kaizen AdminsKaizen AdminIdCancelPostMutationOptions,
    type CancelKaizen AdminApiV1Kaizen AdminsKaizen AdminIdCancelPostMutationResult,
    type CancelKaizen AdminApiV1Kaizen AdminsKaizen AdminIdCancelPostMutationError,

    // Draft requisitions
    useListDraftKaizen AdminsApiV1Kaizen AdminsDraftsGet,
    getListDraftKaizen AdminsApiV1Kaizen AdminsDraftsGetQueryKey,
    getListDraftKaizen AdminsApiV1Kaizen AdminsDraftsGetQueryOptions,
    type ListDraftKaizen AdminsApiV1Kaizen AdminsDraftsGetQueryResult,
    type ListDraftKaizen AdminsApiV1Kaizen AdminsDraftsGetQueryError,

    // My requisitions
    useListMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGet,
    getListMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGetQueryKey,
    getListMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGetQueryOptions,
    type ListMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGetQueryResult,
    type ListMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGetQueryError,

    // Counts
    useGetKaizen AdminCountsApiV1Kaizen AdminsCountsGet,
    getGetKaizen AdminCountsApiV1Kaizen AdminsCountsGetQueryKey,
    getGetKaizen AdminCountsApiV1Kaizen AdminsCountsGetQueryOptions,
    type GetKaizen AdminCountsApiV1Kaizen AdminsCountsGetQueryResult,
    type GetKaizen AdminCountsApiV1Kaizen AdminsCountsGetQueryError,

    // Search
    useSearchKaizen AdminsApiV1Kaizen AdminsSearchGet,
    getSearchKaizen AdminsApiV1Kaizen AdminsSearchGetQueryKey,
    getSearchKaizen AdminsApiV1Kaizen AdminsSearchGetQueryOptions,
    type SearchKaizen AdminsApiV1Kaizen AdminsSearchGetQueryResult,
    type SearchKaizen AdminsApiV1Kaizen AdminsSearchGetQueryError,

    // Status
    useGetKaizen AdminStatusApiV1Kaizen AdminsKaizen AdminIdStatusGet,
    getGetKaizen AdminStatusApiV1Kaizen AdminsKaizen AdminIdStatusGetQueryKey,
    getGetKaizen AdminStatusApiV1Kaizen AdminsKaizen AdminIdStatusGetQueryOptions,
    type GetKaizen AdminStatusApiV1Kaizen AdminsKaizen AdminIdStatusGetQueryResult,
    type GetKaizen AdminStatusApiV1Kaizen AdminsKaizen AdminIdStatusGetQueryError,

    // Approval Chain
    useGetApprovalChainApiV1Kaizen AdminsKaizen AdminIdApprovalChainGet,
    getGetApprovalChainApiV1Kaizen AdminsKaizen AdminIdApprovalChainGetQueryKey,
    getGetApprovalChainApiV1Kaizen AdminsKaizen AdminIdApprovalChainGetQueryOptions,
    type GetApprovalChainApiV1Kaizen AdminsKaizen AdminIdApprovalChainGetQueryResult,
    type GetApprovalChainApiV1Kaizen AdminsKaizen AdminIdApprovalChainGetQueryError,

    // Document upload
    useUploadDocumentApiV1Kaizen AdminsKaizen AdminIdDocumentsPost,
    getUploadDocumentApiV1Kaizen AdminsKaizen AdminIdDocumentsPostMutationOptions,
    type UploadDocumentApiV1Kaizen AdminsKaizen AdminIdDocumentsPostMutationResult,
    type UploadDocumentApiV1Kaizen AdminsKaizen AdminIdDocumentsPostMutationError,
} from "@/lib/generated/requisition/requisitions-v1/requisitions-v1";

// Approval hooks
export {
    useApproveKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdApprovePost,
    getApproveKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdApprovePostMutationOptions,
    type ApproveKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdApprovePostMutationResult,
    type ApproveKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdApprovePostMutationError,
    useRejectKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdRejectPost,
    getRejectKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdRejectPostMutationOptions,
    type RejectKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdRejectPostMutationResult,
    type RejectKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdRejectPostMutationError,
    useReturnForModificationApiV1ApprovalsKaizen AdminsKaizen AdminIdReturnPost,
    getReturnForModificationApiV1ApprovalsKaizen AdminsKaizen AdminIdReturnPostMutationOptions,
    type ReturnForModificationApiV1ApprovalsKaizen AdminsKaizen AdminIdReturnPostMutationResult,
    type ReturnForModificationApiV1ApprovalsKaizen AdminsKaizen AdminIdReturnPostMutationError,
    useGetPendingApprovalsApiV1ApprovalsPendingGet,
    getGetPendingApprovalsApiV1ApprovalsPendingGetQueryKey,
    getGetPendingApprovalsApiV1ApprovalsPendingGetQueryOptions,
    type GetPendingApprovalsApiV1ApprovalsPendingGetQueryResult,
    type GetPendingApprovalsApiV1ApprovalsPendingGetQueryError,
    useGetApprovalHistoryApiV1ApprovalsHistoryGet,
    getGetApprovalHistoryApiV1ApprovalsHistoryGetQueryKey,
    getGetApprovalHistoryApiV1ApprovalsHistoryGetQueryOptions,
    type GetApprovalHistoryApiV1ApprovalsHistoryGetQueryResult,
    type GetApprovalHistoryApiV1ApprovalsHistoryGetQueryError,
    useDelegateApprovalApiV1ApprovalsDelegatePost,
    getDelegateApprovalApiV1ApprovalsDelegatePostMutationOptions,
    type DelegateApprovalApiV1ApprovalsDelegatePostMutationResult,
    type DelegateApprovalApiV1ApprovalsDelegatePostMutationError,
} from "@/lib/generated/requisition/approvals-v1/approvals-v1";

// Re-export types
export type {
    Kaizen Admin,
    Kaizen AdminCreate,
    Kaizen AdminUpdate,
    Kaizen AdminResponse,
    Kaizen AdminSearchResponse,
    Kaizen AdminCountsResponse,
    BudgetLine,
    BudgetLineCreate,
    Document,
    ApprovalLevel,
    ApprovalLevelCreate,
    ApprovalLevelListResponse,
    ApprovalDecision,
    ApprovalStep,
    BudgetResponse,
    BudgetCreate,
    BudgetUpdate,
    BudgetStatus,
    BudgetPeriodResponse,
    HTTPValidationError,
    ListKaizen AdminsApiV1Kaizen AdminsGetParams,
    SearchKaizen AdminsApiV1Kaizen AdminsSearchGetParams,
    GetKaizen AdminCountsApiV1Kaizen AdminsCountsGetParams,
    ListMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGetParams,
    ListDraftKaizen AdminsApiV1Kaizen AdminsDraftsGetParams,
} from "./types";
