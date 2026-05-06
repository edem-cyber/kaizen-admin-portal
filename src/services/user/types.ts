/**
 * User Service Types
 * Re-exports all DTOs from generated code for easy access
 */

// Auth types
export type { LoginDto } from '@/lib/generated/user/models/loginDto';
export type { LoginResponse } from '@/lib/generated/user/models/loginResponse';
export type { AuthTokenPair } from '@/lib/generated/user/models/authTokenPair';
export type { InitiatePasswordResetDto } from '@/lib/generated/user/models/initiatePasswordResetDto';
export type { SetPasswordDto } from '@/lib/generated/user/models/setPasswordDto';
export type { UserConfirmationDto } from '@/lib/generated/user/models/userConfirmationDto';
export type { ResendUserConfirmationDto } from '@/lib/generated/user/models/resendUserConfirmationDto';
export type { RotatePasswordDto } from '@/lib/generated/user/models/rotatePasswordDto';
export type { PasswordPolicyPublicDto } from '@/lib/generated/user/models/passwordPolicyPublicDto';

// User types
export type { UserDto } from '@/lib/generated/user/models/userDto';
export type { CreateUserDto } from '@/lib/generated/user/models/createUserDto';
export type { UpdateUserDto } from '@/lib/generated/user/models/updateUserDto';
export type { UpdateSelfDto } from '@/lib/generated/user/models/updateSelfDto';
export type { ChangePasswordDto } from '@/lib/generated/user/models/changePasswordDto';
export type { UpdateUsernameDto } from '@/lib/generated/user/models/updateUsernameDto';
export type { ReactivateUserDto } from '@/lib/generated/user/models/reactivateUserDto';
export type { SubscriberUserSignupDto } from '@/lib/generated/user/models/subscriberUserSignupDto';

// Account check
export type { AccountCheckParams } from '@/lib/generated/user/models/accountCheckParams';
export type { AccountCheckResponse } from '@/lib/generated/user/models/accountCheckResponse';

// Organization Role types
export type { OrganizationRole } from '@/lib/generated/user/models/organizationRole';
export type { CreateOrganizationRoleDto } from '@/lib/generated/user/models/createOrganizationRoleDto';
export type { UpdateOrganizationRoleDto } from '@/lib/generated/user/models/updateOrganizationRoleDto';
export type { QueryOrganizationRoleDto } from '@/lib/generated/user/models/queryOrganizationRoleDto';

// Permission types
export type { Permission } from '@/lib/generated/user/models/permission';
export type { PermissionGroup } from '@/lib/generated/user/models/permissionGroup';
export type { PermissionGroupDto } from '@/lib/generated/user/models/permissionGroupDto';
export type { CreatePermissionGroupDto } from '@/lib/generated/user/models/createPermissionGroupDto';
export type { UpdatePermissionGroupDto } from '@/lib/generated/user/models/updatePermissionGroupDto';
export type { CreatePermissionDto } from '@/lib/generated/user/models/createPermissionDto';
export type { UpdatePermissionDto } from '@/lib/generated/user/models/updatePermissionDto';

// Password Policy types
export type { PasswordPolicy } from '@/lib/generated/user/models/passwordPolicy';
export type { SetPasswordPolicyDto } from '@/lib/generated/user/models/setPasswordPolicyDto';

// User Status types
export type { UserStatus } from '@/lib/generated/user/models/userStatus';
export type { CreateUserStatusDto } from '@/lib/generated/user/models/createUserStatusDto';

// Response wrapper types
export type { ApiErrorResponse } from '@/lib/generated/user/models/apiErrorResponse';
export type { ApiSuccessResponseUserDto } from '@/lib/generated/user/models/apiSuccessResponseUserDto';
export type { ApiSuccessResponseUserDtoArray } from '@/lib/generated/user/models/apiSuccessResponseUserDtoArray';
export type { ApiSuccessResponseAccountCheckResponse } from '@/lib/generated/user/models/apiSuccessResponseAccountCheckResponse';
export type { ApiSuccessResponsePasswordPolicyPublicDto } from '@/lib/generated/user/models/apiSuccessResponsePasswordPolicyPublicDto';
export type { ApiSuccessResponseCountNumber } from '@/lib/generated/user/models/apiSuccessResponseCountNumber';

// Query params
export type { GetUsersParams } from '@/lib/generated/user/models/getUsersParams';
export type { SearchUsersParams } from '@/lib/generated/user/models/searchUsersParams';
export type { GetOrganizationRolesParams } from '@/lib/generated/user/models/getOrganizationRolesParams';
export type { GetPermissionsParams } from '@/lib/generated/user/models/getPermissionsParams';
export type { GetPermissionGroupsParams } from '@/lib/generated/user/models/getPermissionGroupsParams';
export type { GetUserStatusesParams } from '@/lib/generated/user/models/getUserStatusesParams';

// Organization (embedded in user)
export type { OrganizationDto } from '@/lib/generated/user/models/organizationDto';
export type { OrganizationStatus } from '@/lib/generated/user/models/organizationStatus';

// Misc
export type { Pagination } from '@/lib/generated/user/models/pagination';