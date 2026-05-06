/**
 * User Authentication Service
 * Exports all auth-related hooks and provides convenience wrappers
 */

// Re-export all generated auth hooks
export {
    // Login
    useLogin,
    getLoginMutationOptions,
    type LoginMutationResult,
    type LoginMutationError,

    // Token refresh
    useRefreshToken,
    getRefreshTokenMutationOptions,
    type RefreshTokenMutationResult,
    type RefreshTokenMutationError,

    // Logout (revoke refresh token)
    useRevokeRefreshToken,
    getRevokeRefreshTokenMutationOptions,
    type RevokeRefreshTokenMutationResult,
    type RevokeRefreshTokenMutationError,

    // Password reset
    useForgotPassword,
    getForgotPasswordMutationOptions,
    type ForgotPasswordMutationResult,
    type ForgotPasswordMutationError,
    useSetNewPassword,
    getSetNewPasswordMutationOptions,
    type SetNewPasswordMutationResult,
    type SetNewPasswordMutationError,

    // Account confirmation
    useConfirmAccount,
    getConfirmAccountMutationOptions,
    type ConfirmAccountMutationResult,
    type ConfirmAccountMutationError,
    useResendAccountConfirmationNotification,
    getResendAccountConfirmationNotificationMutationOptions,
    type ResendAccountConfirmationNotificationMutationResult,
    type ResendAccountConfirmationNotificationMutationError,

    // Password rotation
    useRotatePasswordAfterExpiry,
    getRotatePasswordAfterExpiryMutationOptions,
    type RotatePasswordAfterExpiryMutationResult,
    type RotatePasswordAfterExpiryMutationError,

    // Password policy
    useGetUserOrgPasswordPolicy,
    getGetUserOrgPasswordPolicyQueryKey,
    getGetUserOrgPasswordPolicyQueryOptions,
    type GetUserOrgPasswordPolicyQueryResult,
    type GetUserOrgPasswordPolicyQueryError,
} from "@/lib/generated/user/auth/auth";

// Re-export types
export type {
    LoginDto,
    LoginResponse,
    AuthTokenPair,
    InitiatePasswordResetDto,
    SetPasswordDto,
    UserConfirmationDto,
    ResendUserConfirmationDto,
    RotatePasswordDto,
    PasswordPolicyPublicDto,
    ApiErrorResponse,
} from "./types";
