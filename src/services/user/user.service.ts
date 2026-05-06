/**
 * User Management Service
 * Exports all user-related hooks and types
 */

// Re-export all generated user hooks
export {
    // Account check (username availability)
    useAccountCheck,
    getAccountCheckQueryKey,
    getAccountCheckQueryOptions,
    type AccountCheckQueryResult,
    type AccountCheckQueryError,

    // User CRUD
    useGetUsers,
    getGetUsersQueryKey,
    getGetUsersQueryOptions,
    type GetUsersQueryResult,
    type GetUsersQueryError,
    useGetUser,
    getGetUserQueryKey,
    getGetUserQueryOptions,
    type GetUserQueryResult,
    type GetUserQueryError,
    useAddUser,
    getAddUserMutationOptions,
    type AddUserMutationResult,
    type AddUserMutationError,
    useUpdateUser,
    getUpdateUserMutationOptions,
    type UpdateUserMutationResult,
    type UpdateUserMutationError,
    useRemoveUser,
    getRemoveUserMutationOptions,
    type RemoveUserMutationResult,
    type RemoveUserMutationError,

    // Self user operations
    useGetSelf,
    getGetSelfQueryKey,
    getGetSelfQueryOptions,
    type GetSelfQueryResult,
    type GetSelfQueryError,
    useUpdateSelf,
    getUpdateSelfMutationOptions,
    type UpdateSelfMutationResult,
    type UpdateSelfMutationError,
    useChangePassword,
    getChangePasswordMutationOptions,
    type ChangePasswordMutationResult,
    type ChangePasswordMutationError,
    useUpdateUsername,
    getUpdateUsernameMutationOptions,
    type UpdateUsernameMutationResult,
    type UpdateUsernameMutationError,

    // Search
    useSearchUsers,
    getSearchUsersQueryKey,
    getSearchUsersQueryOptions,
    type SearchUsersQueryResult,
    type SearchUsersQueryError,

    // Count/Stats
    useGetCountReport,
    getGetCountReportQueryKey,
    getGetCountReportQueryOptions,
    type GetCountReportQueryResult,
    type GetCountReportQueryError,
    useGroupCountByDate,
    getGroupCountByDateQueryKey,
    getGroupCountByDateQueryOptions,
    type GroupCountByDateQueryResult,
    type GroupCountByDateQueryError,
    useAggregateActiveUsersByDate,
    getAggregateActiveUsersByDateQueryKey,
    getAggregateActiveUsersByDateQueryOptions,
    type AggregateActiveUsersByDateQueryResult,
    type AggregateActiveUsersByDateQueryError,

    // Reactivation
    useReactivateUser,
    getReactivateUserMutationOptions,
    type ReactivateUserMutationResult,
    type ReactivateUserMutationError,

    // Password overwrite
    useOverwriteUserPassword,
    getOverwriteUserPasswordMutationOptions,
    type OverwriteUserPasswordMutationResult,
    type OverwriteUserPasswordMutationError,

    // Subscriber signup
    useSubscriberUserSignup,
    getSubscriberUserSignupMutationOptions,
    type SubscriberUserSignupMutationResult,
    type SubscriberUserSignupMutationError,

    // Host individual customer
    useAddHostIndividualCustomer,
    getAddHostIndividualCustomerMutationOptions,
    type AddHostIndividualCustomerMutationResult,
    type AddHostIndividualCustomerMutationError,
} from "@/lib/generated/user/users/users";

// Re-export types
export type {
    UserDto,
    CreateUserDto,
    UpdateUserDto,
    UpdateSelfDto,
    ChangePasswordDto,
    UpdateUsernameDto,
    ReactivateUserDto,
    SubscriberUserSignupDto,
    AccountCheckParams,
    AccountCheckResponse,
    GetUsersParams,
    SearchUsersParams,
    ApiSuccessResponseUserDto,
    ApiSuccessResponseUserDtoArray,
    ApiSuccessResponseAccountCheckResponse,
    ApiSuccessResponseCountNumber,
    ApiErrorResponse,
} from "./types";
