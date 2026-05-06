/**
 * Organization Service Types
 * Re-exports all DTOs from generated code for easy access
 */

// Organization types
export type { OrganizationDto } from "@/lib/generated/org/models/organizationDto";
export type { CreateOrganizationDto } from "@/lib/generated/org/models/createOrganizationDto";
export type { UpdateOrganizationDto } from "@/lib/generated/org/models/updateOrganizationDto";
export type { UpdateOwnOrganizationDto } from "@/lib/generated/org/models/updateOwnOrganizationDto";
export type { OrganizationStatus } from "@/lib/generated/org/models/organizationStatus";
export type { SpaceType } from "@/lib/generated/org/models/spaceType";

// Organization Config
export type { OrganizationConfig } from "@/lib/generated/org/models/organizationConfig";
export type { CreateOrUpdateOrganizationConfigDto } from "@/lib/generated/org/models/createOrUpdateOrganizationConfigDto";
export type { GenericOrganizationConfigDto } from "@/lib/generated/org/models/genericOrganizationConfigDto";

// Organization Group
export type { OrganizationGroup } from "@/lib/generated/org/models/organizationGroup";
export type { CreateOrganizationGroupDto } from "@/lib/generated/org/models/createOrganizationGroupDto";
export type { UpdateOrganizationGroupDto } from "@/lib/generated/org/models/updateOrganizationGroupDto";

// Organization Type
export type { OrganizationType } from "@/lib/generated/org/models/organizationType";
export type { CreateOrganizationTypeDto } from "@/lib/generated/org/models/createOrganizationTypeDto";
export type { UpdateOrganizationTypeDto } from "@/lib/generated/org/models/updateOrganizationTypeDto";
export type { SubscriptionType } from "@/lib/generated/org/models/subscriptionType";

// Project
export type { Project } from "@/lib/generated/org/models/project";
export type { CreateProjectDto } from "@/lib/generated/org/models/createProjectDto";
export type { UpdateProjectDto } from "@/lib/generated/org/models/updateProjectDto";

// Country
export type { Country } from "@/lib/generated/org/models/country";
export type { CreateCountryDto } from "@/lib/generated/org/models/createCountryDto";
export type { UpdateCountryDto } from "@/lib/generated/org/models/updateCountryDto";

// Property Management
export type { CreatePropertyManagementClientOrgDto } from "@/lib/generated/org/models/createPropertyManagementClientOrgDto";

// Check Organization
export type { CheckOrganizationExistsResultDto } from "@/lib/generated/org/models/checkOrganizationExistsResultDto";
export type { CheckParams } from "@/lib/generated/org/models/checkParams";

// Response wrappers
export type { ApiErrorResponse } from "@/lib/generated/org/models/apiErrorResponse";
export type { ApiSuccessResponseOrganizationDto } from "@/lib/generated/org/models/apiSuccessResponseOrganizationDto";
export type { ApiSuccessResponseOrganizationDtoArray } from "@/lib/generated/org/models/apiSuccessResponseOrganizationDtoArray";
export type { ApiSuccessResponseCheckOrganizationExistsResultDto } from "@/lib/generated/org/models/apiSuccessResponseCheckOrganizationExistsResultDto";
export type { ApiSuccessResponseCountry } from "@/lib/generated/org/models/apiSuccessResponseCountry";
export type { ApiSuccessResponseCountryArray } from "@/lib/generated/org/models/apiSuccessResponseCountryArray";
export type { ApiSuccessResponseProject } from "@/lib/generated/org/models/apiSuccessResponseProject";
export type { ApiSuccessResponseProjectArray } from "@/lib/generated/org/models/apiSuccessResponseProjectArray";
export type { ApiSuccessResponseOrganizationGroup } from "@/lib/generated/org/models/apiSuccessResponseOrganizationGroup";
export type { ApiSuccessResponseOrganizationGroupArray } from "@/lib/generated/org/models/apiSuccessResponseOrganizationGroupArray";
export type { ApiSuccessResponseOrganizationType } from "@/lib/generated/org/models/apiSuccessResponseOrganizationType";
export type { ApiSuccessResponseOrganizationTypeArray } from "@/lib/generated/org/models/apiSuccessResponseOrganizationTypeArray";
export type { ApiSuccessResponseOrganizationConfig } from "@/lib/generated/org/models/apiSuccessResponseOrganizationConfig";

// Query params
export type { GetOrganizationsParams } from "@/lib/generated/org/models/getOrganizationsParams";
export type { GetOrganizationsRegistryParams } from "@/lib/generated/org/models/getOrganizationsRegistryParams";
export type { SearchOrganizationsParams } from "@/lib/generated/org/models/searchOrganizationsParams";
export type { GetCountriesParams } from "@/lib/generated/org/models/getCountriesParams";
export type { GetProjectsParams } from "@/lib/generated/org/models/getProjectsParams";
export type { GetOrganizationGroupsParams } from "@/lib/generated/org/models/getOrganizationGroupsParams";
export type { GetOrganizationTypesParams } from "@/lib/generated/org/models/getOrganizationTypesParams";

// Order by types
export type { OrganizationOrderBy } from "@/lib/generated/org/models/organizationOrderBy";
export type { CountryOrderBy } from "@/lib/generated/org/models/countryOrderBy";
export type { ProjectOrderBy } from "@/lib/generated/org/models/projectOrderBy";
export type { OrganizationGroupOrderBy } from "@/lib/generated/org/models/organizationGroupOrderBy";
export type { OrganizationTypeOrderBy } from "@/lib/generated/org/models/organizationTypeOrderBy";

// Misc
export type { Pagination } from "@/lib/generated/org/models/pagination";
