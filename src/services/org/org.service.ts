/**
 * Organization Service
 * Exports all org-related hooks and types
 */

// Organization hooks
export {
    // CRUD
    useGetOrganizations,
    getGetOrganizationsQueryKey,
    getGetOrganizationsQueryOptions,
    type GetOrganizationsQueryResult,
    type GetOrganizationsQueryError,
    useGetOrganization,
    getGetOrganizationQueryKey,
    getGetOrganizationQueryOptions,
    type GetOrganizationQueryResult,
    type GetOrganizationQueryError,
    useAddOrganization,
    getAddOrganizationMutationOptions,
    type AddOrganizationMutationResult,
    type AddOrganizationMutationError,
    useUpdateOrganization,
    getUpdateOrganizationMutationOptions,
    type UpdateOrganizationMutationResult,
    type UpdateOrganizationMutationError,
    useRemoveOrganization,
    getRemoveOrganizationMutationOptions,
    type RemoveOrganizationMutationResult,
    type RemoveOrganizationMutationError,

    // Self signup
    useOrganizationSelfSignup,
    getOrganizationSelfSignupMutationOptions,
    type OrganizationSelfSignupMutationResult,
    type OrganizationSelfSignupMutationError,

    // Own organization
    useUpdateOwnOrganization,
    getUpdateOwnOrganizationMutationOptions,
    type UpdateOwnOrganizationMutationResult,
    type UpdateOwnOrganizationMutationError,

    /*
    // Client organizations
    useAddPropertyMananagementClientOrg,
    getAddPropertyMananagementClientOrgMutationOptions,
    type AddPropertyMananagementClientOrgMutationResult,
    type AddPropertyMananagementClientOrgMutationError,
    useUpdateClientOrganization,
    getUpdateClientOrganizationMutationOptions,
    type UpdateClientOrganizationMutationResult,
    type UpdateClientOrganizationMutationError,
    useRemoveClientOrganization,
    getRemoveClientOrganizationMutationOptions,
    type RemoveClientOrganizationMutationResult,
    type RemoveClientOrganizationMutationError,
    */

    // Check organization exists
    useCheck,
    getCheckQueryKey,
    getCheckQueryOptions,
    type CheckQueryResult,
    type CheckQueryError,

    // Search
    useSearchOrganizations,
    getSearchOrganizationsQueryKey,
    getSearchOrganizationsQueryOptions,
    type SearchOrganizationsQueryResult,
    type SearchOrganizationsQueryError,

    // Registry
    useGetOrganizationsRegistry,
    getGetOrganizationsRegistryQueryKey,
    getGetOrganizationsRegistryQueryOptions,
    type GetOrganizationsRegistryQueryResult,
    type GetOrganizationsRegistryQueryError,
} from "@/lib/generated/org/organizations/organizations";

// Country hooks
export {
    useGetCountries,
    getGetCountriesQueryKey,
    getGetCountriesQueryOptions,
    type GetCountriesQueryResult,
    type GetCountriesQueryError,
    useAddCountry,
    getAddCountryMutationOptions,
    type AddCountryMutationResult,
    type AddCountryMutationError,
    useUpdateCountry,
    getUpdateCountryMutationOptions,
    type UpdateCountryMutationResult,
    type UpdateCountryMutationError,
} from "@/lib/generated/org/countries/countries";

// Project hooks
export {
    useGetProjects,
    getGetProjectsQueryKey,
    getGetProjectsQueryOptions,
    type GetProjectsQueryResult,
    type GetProjectsQueryError,
    useAddProject,
    getAddProjectMutationOptions,
    type AddProjectMutationResult,
    type AddProjectMutationError,
    useUpdateProject,
    getUpdateProjectMutationOptions,
    type UpdateProjectMutationResult,
    type UpdateProjectMutationError,
} from "@/lib/generated/org/projects/projects";

// Organization Group hooks
export {
    useGetOrganizationGroups,
    getGetOrganizationGroupsQueryKey,
    getGetOrganizationGroupsQueryOptions,
    type GetOrganizationGroupsQueryResult,
    type GetOrganizationGroupsQueryError,
    useAddOrganizationGroup,
    getAddOrganizationGroupMutationOptions,
    type AddOrganizationGroupMutationResult,
    type AddOrganizationGroupMutationError,
    useUpdateOrganizationGroup,
    getUpdateOrganizationGroupMutationOptions,
    type UpdateOrganizationGroupMutationResult,
    type UpdateOrganizationGroupMutationError,
} from "@/lib/generated/org/organization-groups/organization-groups";

// Organization Type hooks
export {
    useGetOrganizationTypes,
    getGetOrganizationTypesQueryKey,
    getGetOrganizationTypesQueryOptions,
    type GetOrganizationTypesQueryResult,
    type GetOrganizationTypesQueryError,
    useAddOrganizationType,
    getAddOrganizationTypeMutationOptions,
    type AddOrganizationTypeMutationResult,
    type AddOrganizationTypeMutationError,
    useUpdateOrganizationType,
    getUpdateOrganizationTypeMutationOptions,
    type UpdateOrganizationTypeMutationResult,
    type UpdateOrganizationTypeMutationError,
} from "@/lib/generated/org/organization-types/organization-types";

// Organization Config hooks
export {
    useGetOrganizationConfig,
    getGetOrganizationConfigQueryKey,
    getGetOrganizationConfigQueryOptions,
    type GetOrganizationConfigQueryResult,
    type GetOrganizationConfigQueryError,
    useAddOrUpdateOrganizationConfig,
    getAddOrUpdateOrganizationConfigMutationOptions,
    type AddOrUpdateOrganizationConfigMutationResult,
    type AddOrUpdateOrganizationConfigMutationError,
} from "@/lib/generated/org/organization-configs/organization-configs";

// Re-export types
export type {
    OrganizationDto,
    CreateOrganizationDto,
    UpdateOrganizationDto,
    UpdateOwnOrganizationDto,
    OrganizationStatus,
    SpaceType,
    OrganizationConfig,
    CreateOrUpdateOrganizationConfigDto,
    OrganizationGroup,
    CreateOrganizationGroupDto,
    UpdateOrganizationGroupDto,
    OrganizationType,
    CreateOrganizationTypeDto,
    UpdateOrganizationTypeDto,
    SubscriptionType,
    Project,
    CreateProjectDto,
    UpdateProjectDto,
    Country,
    CreateCountryDto,
    UpdateCountryDto,
    CreatePropertyManagementClientOrgDto,
    CheckOrganizationExistsResultDto,
    CheckParams,
    ApiErrorResponse,
    ApiSuccessResponseOrganizationDto,
    ApiSuccessResponseOrganizationDtoArray,
    GetOrganizationsParams,
    GetOrganizationsRegistryParams,
    SearchOrganizationsParams,
    GetCountriesParams,
    GetProjectsParams,
    GetOrganizationGroupsParams,
    GetOrganizationTypesParams,
    Pagination,
} from "./types";
