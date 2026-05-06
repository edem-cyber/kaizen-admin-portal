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
    useAddPropertyMananagementClientOrg,
    useUpdateClientOrganization,
    useRemoveClientOrganization,
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
    type CreatePropertyManagementClientOrgDto,
    type CheckOrganizationExistsResultDto,
    type CheckParams,
    type GetOrganizationsParams,
    type GetOrganizationsRegistryParams,
    type SearchOrganizationsParams,
    type Pagination as OrgPagination,
} from "./org";

// Kaizen Admin Service (includes approvals)
export {
    // Kaizen Admin hooks
    useCreateKaizen AdminApiV1Kaizen AdminsPost,
    useListKaizen AdminsApiV1Kaizen AdminsGet,
    useGetKaizen AdminApiV1Kaizen AdminsKaizen AdminIdGet,
    useUpdateKaizen AdminApiV1Kaizen AdminsKaizen AdminIdPut,
    useSubmitKaizen AdminApiV1Kaizen AdminsKaizen AdminIdSubmitPost,
    useCancelKaizen AdminApiV1Kaizen AdminsKaizen AdminIdCancelPost,
    useListDraftKaizen AdminsApiV1Kaizen AdminsDraftsGet,
    useListMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGet,
    useGetKaizen AdminCountsApiV1Kaizen AdminsCountsGet,
    useSearchKaizen AdminsApiV1Kaizen AdminsSearchGet,
    useGetKaizen AdminStatusApiV1Kaizen AdminsKaizen AdminIdStatusGet,
    useGetApprovalChainApiV1Kaizen AdminsKaizen AdminIdApprovalChainGet,
    useUploadDocumentApiV1Kaizen AdminsKaizen AdminIdDocumentsPost,

    // Approval hooks
    useApproveKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdApprovePost,
    useRejectKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdRejectPost,
    useReturnForModificationApiV1ApprovalsKaizen AdminsKaizen AdminIdReturnPost,
    useGetPendingApprovalsApiV1ApprovalsPendingGet,
    useGetApprovalHistoryApiV1ApprovalsHistoryGet,
    useDelegateApprovalApiV1ApprovalsDelegatePost,

    // Kaizen Admin types
    type Kaizen Admin,
    type Kaizen AdminCreate,
    type Kaizen AdminUpdate,
    type Kaizen AdminResponse,
    type Kaizen AdminSearchResponse,
    type Kaizen AdminCountsResponse,
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
    type ListKaizen AdminsApiV1Kaizen AdminsGetParams,
    type SearchKaizen AdminsApiV1Kaizen AdminsSearchGetParams,
    type GetKaizen AdminCountsApiV1Kaizen AdminsCountsGetParams,
    type ListMyKaizen AdminsApiV1Kaizen AdminsMyKaizen AdminsGetParams,
    type ListDraftKaizen AdminsApiV1Kaizen AdminsDraftsGetParams,
} from "./requisition";