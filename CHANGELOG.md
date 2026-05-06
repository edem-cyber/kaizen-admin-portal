# Changelog

## [2026-05-05] - Admin Portal Restoration & UI Refinement

### Added
- **Offers Utility**: Re-integrated the **Price Distribution Calculator** into both the Create and Edit modals of the Offers module, allowing admins to derive unit prices from a total target price and team size.
- **Packages Restoration**: Recovered the full form structure and data binding for Packages, including missing fields like `orgTypeIds`, `maximumTeamSize`, and `discountId`.
- **Reactive Data Fetching**: Implemented `useGetServicePackage` and `useGetOffer` hooks to ensure "Get by ID" parity for all edit operations.

### Fixes & Refinement
- **UI Design**: Restored the cleaner, white-themed dialog design for both Packages and Offers modules, removing the dark background header as per user preference.
- **Packages Layout**: Removed the redundant "Top 4" summary grid to ensure a single, unified view that correctly responds to the grid/list toggle.
- **Pagination**: Standardized the `PaginationController` across all modules to always show result counts and consistent navigation controls.
- **Accessibility**: Resolved Radix UI warnings by ensuring all `DialogContent` components (including loading states) have a valid `DialogTitle`.
- **TypeScript**: Fixed DTO mapping errors to support `freeDays` trial settings via casting, maintaining functional requirements despite model mismatches.

### Previous Updates
- **Permissions Management:** Built a new permissions assignment interface within roles management.
- **Accounts Module Refactor:** Completely standardized `admin/accounts/page.tsx` for full CRUD operations.
- **Currency Formatting:** Implemented GHS currency fallback across all pricing modules.
- **Server-Side Search:** Migrated all registry modules to performant server-side search.
