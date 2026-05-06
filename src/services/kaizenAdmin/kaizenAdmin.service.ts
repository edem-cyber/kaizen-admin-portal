/**
 * KaizenAdmin Service
 * Exports all kaizenAdmin-related hooks
 */

// KaizenAdmin CRUD hooks
export {
    useCreateKaizenAdminApiV1KaizenAdminsPost,
    getCreateKaizenAdminApiV1KaizenAdminsPostMutationOptions,
    type CreateKaizenAdminApiV1KaizenAdminsPostMutationResult,
    type CreateKaizenAdminApiV1KaizenAdminsPostMutationError,
    useListKaizenAdminsApiV1KaizenAdminsGet,
    getListKaizenAdminsApiV1KaizenAdminsGetQueryKey,
    getListKaizenAdminsApiV1KaizenAdminsGetQueryOptions,
    type ListKaizenAdminsApiV1KaizenAdminsGetQueryResult,
    type ListKaizenAdminsApiV1KaizenAdminsGetQueryError,
    useGetKaizenAdminApiV1KaizenAdminsKaizenAdminIdGet,
    getGetKaizenAdminApiV1KaizenAdminsKaizenAdminIdGetQueryKey,
    getGetKaizenAdminApiV1KaizenAdminsKaizenAdminIdGetQueryOptions,
    type GetKaizenAdminApiV1KaizenAdminsKaizenAdminIdGetQueryResult,
    type GetKaizenAdminApiV1KaizenAdminsKaizenAdminIdGetQueryError,
    useUpdateKaizenAdminApiV1KaizenAdminsKaizenAdminIdPut,
    getUpdateKaizenAdminApiV1KaizenAdminsKaizenAdminIdPutMutationOptions,
    type UpdateKaizenAdminApiV1KaizenAdminsKaizenAdminIdPutMutationResult,
    type UpdateKaizenAdminApiV1KaizenAdminsKaizenAdminIdPutMutationError,
    useSubmitKaizenAdminApiV1KaizenAdminsKaizenAdminIdSubmitPost,
    getSubmitKaizenAdminApiV1KaizenAdminsKaizenAdminIdSubmitPostMutationOptions,
    type SubmitKaizenAdminApiV1KaizenAdminsKaizenAdminIdSubmitPostMutationResult,
    type SubmitKaizenAdminApiV1KaizenAdminsKaizenAdminIdSubmitPostMutationError,
    useCancelKaizenAdminApiV1KaizenAdminsKaizenAdminIdCancelPost,
    getCancelKaizenAdminApiV1KaizenAdminsKaizenAdminIdCancelPostMutationOptions,
    type CancelKaizenAdminApiV1KaizenAdminsKaizenAdminIdCancelPostMutationResult,
    type CancelKaizenAdminApiV1KaizenAdminsKaizenAdminIdCancelPostMutationError,

    // Draft kaizenAdmins
    useListDraftKaizenAdminsApiV1KaizenAdminsDraftsGet,
    getListDraftKaizenAdminsApiV1KaizenAdminsDraftsGetQueryKey,
    getListDraftKaizenAdminsApiV1KaizenAdminsDraftsGetQueryOptions,
    type ListDraftKaizenAdminsApiV1KaizenAdminsDraftsGetQueryResult,
    type ListDraftKaizenAdminsApiV1KaizenAdminsDraftsGetQueryError,

    // My kaizenAdmins
    useListMyKaizenAdminsApiV1KaizenAdminsMyKaizenAdminsGet,
    getListMyKaizenAdminsApiV1KaizenAdminsMyKaizenAdminsGetQueryKey,
    getListMyKaizenAdminsApiV1KaizenAdminsMyKaizenAdminsGetQueryOptions,
    type ListMyKaizenAdminsApiV1KaizenAdminsMyKaizenAdminsGetQueryResult,
    type ListMyKaizenAdminsApiV1KaizenAdminsMyKaizenAdminsGetQueryError,

    // Counts
    useGetKaizenAdminCountsApiV1KaizenAdminsCountsGet,
    getGetKaizenAdminCountsApiV1KaizenAdminsCountsGetQueryKey,
    getGetKaizenAdminCountsApiV1KaizenAdminsCountsGetQueryOptions,
    type GetKaizenAdminCountsApiV1KaizenAdminsCountsGetQueryResult,
    type GetKaizenAdminCountsApiV1KaizenAdminsCountsGetQueryError,

    // Search
    useSearchKaizenAdminsApiV1KaizenAdminsSearchGet,
    getSearchKaizenAdminsApiV1KaizenAdminsSearchGetQueryKey,
    getSearchKaizenAdminsApiV1KaizenAdminsSearchGetQueryOptions,
    type SearchKaizenAdminsApiV1KaizenAdminsSearchGetQueryResult,
    type SearchKaizenAdminsApiV1KaizenAdminsSearchGetQueryError,

    // Status
    useGetKaizenAdminStatusApiV1KaizenAdminsKaizenAdminIdStatusGet,
    getGetKaizenAdminStatusApiV1KaizenAdminsKaizenAdminIdStatusGetQueryKey,
    getGetKaizenAdminStatusApiV1KaizenAdminsKaizenAdminIdStatusGetQueryOptions,
    type GetKaizenAdminStatusApiV1KaizenAdminsKaizenAdminIdStatusGetQueryResult,
    type GetKaizenAdminStatusApiV1KaizenAdminsKaizenAdminIdStatusGetQueryError,

    // Approval Chain
    useGetApprovalChainApiV1KaizenAdminsKaizenAdminIdApprovalChainGet,
    getGetApprovalChainApiV1KaizenAdminsKaizenAdminIdApprovalChainGetQueryKey,
    getGetApprovalChainApiV1KaizenAdminsKaizenAdminIdApprovalChainGetQueryOptions,
    type GetApprovalChainApiV1KaizenAdminsKaizenAdminIdApprovalChainGetQueryResult,
    type GetApprovalChainApiV1KaizenAdminsKaizenAdminIdApprovalChainGetQueryError,

    // Document upload
    useUploadDocumentApiV1KaizenAdminsKaizenAdminIdDocumentsPost,
    getUploadDocumentApiV1KaizenAdminsKaizenAdminIdDocumentsPostMutationOptions,
    type UploadDocumentApiV1KaizenAdminsKaizenAdminIdDocumentsPostMutationResult,
    type UploadDocumentApiV1KaizenAdminsKaizenAdminIdDocumentsPostMutationError,
} from "@/lib/generated/kaizenAdmin/kaizenAdmins-v1/kaizenAdmins-v1";

// Approval hooks
export {
    useApproveKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdApprovePost,
    getApproveKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdApprovePostMutationOptions,
    type ApproveKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdApprovePostMutationResult,
    type ApproveKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdApprovePostMutationError,
    useRejectKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdRejectPost,
    getRejectKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdRejectPostMutationOptions,
    type RejectKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdRejectPostMutationResult,
    type RejectKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdRejectPostMutationError,
    useReturnForModificationApiV1ApprovalsKaizenAdminsKaizenAdminIdReturnPost,
    getReturnForModificationApiV1ApprovalsKaizenAdminsKaizenAdminIdReturnPostMutationOptions,
    type ReturnForModificationApiV1ApprovalsKaizenAdminsKaizenAdminIdReturnPostMutationResult,
    type ReturnForModificationApiV1ApprovalsKaizenAdminsKaizenAdminIdReturnPostMutationError,
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
} from "@/lib/generated/kaizenAdmin/approvals-v1/approvals-v1";

// Re-export types
export type {
    KaizenAdmin,
    KaizenAdminCreate,
    KaizenAdminUpdate,
    KaizenAdminResponse,
    KaizenAdminSearchResponse,
    KaizenAdminCountsResponse,
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
    ListKaizenAdminsApiV1KaizenAdminsGetParams,
    SearchKaizenAdminsApiV1KaizenAdminsSearchGetParams,
    GetKaizenAdminCountsApiV1KaizenAdminsCountsGetParams,
    ListMyKaizenAdminsApiV1KaizenAdminsMyKaizenAdminsGetParams,
    ListDraftKaizenAdminsApiV1KaizenAdminsDraftsGetParams,
} from "./types";
