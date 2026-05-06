/**
 * Services Index
 * Main entry point for all API services
 */

// User Service (includes auth)
export {
    // Auth hooks
    useLogin,
    useRefreshToken,
    useRevokeRefreshToken,
    useForgotPassword,
    useSetNewPassword,
    useConfirmAccount,
    useResendAccountConfirmationNotification,
    useRotatePasswordAfterExpiry,
    useGetUserOrgPasswordPolicy,

    // Auth mutation options
    getLoginMutationOptions,
    getRefreshTokenMutationOptions,
    getRevokeRefreshTokenMutationOptions,
    getForgotPasswordMutationOptions,
    getSetNewPasswordMutationOptions,
    getConfirmAccountMutationOptions,
    getResendAccountConfirmationNotificationMutationOptions,
    getRotatePasswordAfterExpiryMutationOptions,
    getGetUserOrgPasswordPolicyQueryOptions,

    // Auth types
    type LoginMutationResult,
    type LoginMutationError,
    type RefreshTokenMutationResult,
    type RefreshTokenMutationError,
    type RevokeRefreshTokenMutationResult,
    type RevokeRefreshTokenMutationError,
    type ForgotPasswordMutationResult,
    type ForgotPasswordMutationError,
    type SetNewPasswordMutationResult,
    type SetNewPasswordMutationError,
    type ConfirmAccountMutationResult,
    type ConfirmAccountMutationError,
    type ResendAccountConfirmationNotificationMutationResult,
    type ResendAccountConfirmationNotificationMutationError,
    type RotatePasswordAfterExpiryMutationResult,
    type RotatePasswordAfterExpiryMutationError,
    type GetUserOrgPasswordPolicyQueryResult,
    type GetUserOrgPasswordPolicyQueryError,

    // User hooks
    useGetUsers,
    useGetUser,
    useAddUser,
    useUpdateUser,
    useRemoveUser,
    useGetSelf,
    useUpdateSelf,
    useChangePassword,
    useUpdateUsername,
    useSearchUsers,
    useAccountCheck,
    useGetCountReport,
    useGroupCountByDate,
    useAggregateActiveUsersByDate,
    useReactivateUser,
    useOverwriteUserPassword,
    useSubscriberUserSignup,
    useAddHostIndividualCustomer,

    // User types
    type UserDto,
    type CreateUserDto,
    type UpdateUserDto,
    type UpdateSelfDto,
    type ChangePasswordDto,
    type UpdateUsernameDto,
    type AccountCheckResponse,
    type LoginDto,
    type LoginResponse,
    type AuthTokenPair,
    type InitiatePasswordResetDto,
    type SetPasswordDto,
    type UserConfirmationDto,
    type ResendUserConfirmationDto,
    type RotatePasswordDto,
    type PasswordPolicyPublicDto,
} from "./user";

// Organization Service
export {
    // Organization hooks
    useGetOrganizations,
    useGetOrganization,
    useAddOrganization,
    useUpdateOrganization,
    useRemoveOrganization,
    useOrganizationSelfSignup,
    useUpdateOwnOrganization,
    // useAddPropertyMananagementClientOrg,
    // useUpdateClientOrganization,
    // useRemoveClientOrganization,
    useCheck,
    useSearchOrganizations,
    useGetOrganizationsRegistry,

    // Country hooks
    useGetCountries,
    useAddCountry,
    useUpdateCountry,

    // Project hooks
    useGetProjects,
    useAddProject,
    useUpdateProject,

    // Organization Group hooks
    useGetOrganizationGroups,
    useAddOrganizationGroup,
    useUpdateOrganizationGroup,

    // Organization Type hooks
    useGetOrganizationTypes,
    useAddOrganizationType,
    useUpdateOrganizationType,

    // Organization Config hooks
    useGetOrganizationConfig,
    useAddOrUpdateOrganizationConfig,

    // Organization types (with alias to avoid conflicts)
    type OrganizationDto as OrgOrganizationDto,
    type CreateOrganizationDto,
    type UpdateOrganizationDto,
    type UpdateOwnOrganizationDto,
    type OrganizationStatus as OrgOrganizationStatus,
    type SpaceType,
    type OrganizationConfig,
    type CreateOrUpdateOrganizationConfigDto,
    type OrganizationGroup,
    type CreateOrganizationGroupDto,
    type UpdateOrganizationGroupDto,
    type OrganizationType,
    type CreateOrganizationTypeDto,
    type UpdateOrganizationTypeDto,
    type SubscriptionType,
    type Project,
    type CreateProjectDto,
    type UpdateProjectDto,
    type Country,
    type CreateCountryDto,
    type UpdateCountryDto,
    // type CreatePropertyManagementClientOrgDto,
    type CheckOrganizationExistsResultDto,
    type CheckParams,
    type GetOrganizationsParams,
    type GetOrganizationsRegistryParams,
    type SearchOrganizationsParams,
    type Pagination as OrgPagination,
} from "./org";

// KaizenAdmin Service (includes approvals)
export {
    // KaizenAdmin hooks
    useCreateKaizenAdminApiV1KaizenAdminsPost,
    useListKaizenAdminsApiV1KaizenAdminsGet,
    useGetKaizenAdminApiV1KaizenAdminsKaizenAdminIdGet,
    useUpdateKaizenAdminApiV1KaizenAdminsKaizenAdminIdPut,
    useSubmitKaizenAdminApiV1KaizenAdminsKaizenAdminIdSubmitPost,
    useCancelKaizenAdminApiV1KaizenAdminsKaizenAdminIdCancelPost,
    useListDraftKaizenAdminsApiV1KaizenAdminsDraftsGet,
    useListMyKaizenAdminsApiV1KaizenAdminsMyKaizenAdminsGet,
    useGetKaizenAdminCountsApiV1KaizenAdminsCountsGet,
    useSearchKaizenAdminsApiV1KaizenAdminsSearchGet,
    useGetKaizenAdminStatusApiV1KaizenAdminsKaizenAdminIdStatusGet,
    useGetApprovalChainApiV1KaizenAdminsKaizenAdminIdApprovalChainGet,
    useUploadDocumentApiV1KaizenAdminsKaizenAdminIdDocumentsPost,

    // Approval hooks
    useApproveKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdApprovePost,
    useRejectKaizenAdminApiV1ApprovalsKaizenAdminsKaizenAdminIdRejectPost,
    useReturnForModificationApiV1ApprovalsKaizenAdminsKaizenAdminIdReturnPost,
    useGetPendingApprovalsApiV1ApprovalsPendingGet,
    useGetApprovalHistoryApiV1ApprovalsHistoryGet,
    useDelegateApprovalApiV1ApprovalsDelegatePost,

    // KaizenAdmin types
    type KaizenAdmin,
    type KaizenAdminCreate,
    type KaizenAdminUpdate,
    type KaizenAdminResponse,
    type KaizenAdminSearchResponse,
    type KaizenAdminCountsResponse,
    type BudgetLine,
    type BudgetLineCreate,
    type Document,
    type ApprovalLevel,
    type ApprovalLevelCreate,
    type ApprovalLevelListResponse,
    type ApprovalDecision,
    type ApprovalStep,
    type BudgetResponse,
    type BudgetCreate,
    type BudgetUpdate,
    type BudgetStatus,
    type BudgetPeriodResponse,
    type HTTPValidationError,
    type ListKaizenAdminsApiV1KaizenAdminsGetParams,
    type SearchKaizenAdminsApiV1KaizenAdminsSearchGetParams,
    type GetKaizenAdminCountsApiV1KaizenAdminsCountsGetParams,
    type ListMyKaizenAdminsApiV1KaizenAdminsMyKaizenAdminsGetParams,
    type ListDraftKaizenAdminsApiV1KaizenAdminsDraftsGetParams,
} from "./kaizenAdmin";