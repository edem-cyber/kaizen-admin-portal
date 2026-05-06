# Web App Screens - Based on API Features

## 🎯 Core Screens Needed (Based on APIs & Workflows)

### 🌐 Public Pages (4 screens)

1. **Home/Landing** → `/`
   - Public landing page
   - Features overview
   - Call-to-action to login/signup
   - No auth required

2. **About** → `/about`
   - About the platform
   - Company/organization info
   - No auth required

3. **Features** → `/features`
   - Feature showcase
   - Benefits overview
   - No auth required

4. **Contact/Support** → `/contact` or `/support`
   - Contact form
   - Support information
   - No auth required

### 🔐 Authentication (4 screens)

5. **Login** → `/login`
   - Email/password login
   - Hook: `useLogin` from `user/auth`

2. **Signup/Register** → `/signup`
   - User registration
   - Organization setup (if needed)
   - Hook: `useRegister` or signup hooks from `user/auth`

3. **Account Confirmation** → `/confirm-account?token=xxx` or `/verify-email?token=xxx`
   - Email/OTP confirmation after signup
   - Query param: token (from confirmation email)
   - Hook: `useConfirmAccount` from `user/auth`
   - Returns LoginResponse (auto-login after confirmation)

4. **Forgot/Reset Password** → `/forgot-password` & `/reset-password?token=xxx`
   - Password reset flow
   - Hooks: `useForgotPassword` (initiate), `useSetPassword` (reset with token)

### 📊 Main Application (Protected - Dashboard Layout)

#### Kaizen Admins (4 screens)

8. **Kaizen Admins List** → `/requisitions`
   - **Web advantage**: Table view with advanced filters, sorting, bulk actions
   - Filters: status, date range, department, category, priority
   - Search functionality
   - Hooks: `useListKaizen AdminsApiV1Kaizen AdminsGet`, `useSearchKaizen AdminsApiV1Kaizen AdminsSearchGet`
   - Statuses: draft, submitted, budget_validation, committee_review, approved, rejected, etc.

2. **Kaizen Admin Detail** → `/requisitions/[id]`
   - Full requisition view
   - Approval chain visualization
   - Documents, budget lines, vendor quotes
   - Discussion/comments section
   - Actions: approve, reject, return, cancel
   - Hooks: `useGetKaizen AdminApiV1Kaizen AdminsKaizen AdminIdGet`, `useGetApprovalChainApiV1Kaizen AdminsKaizen AdminIdApprovalChainGet`

3. **Create Kaizen Admin** → `/requisitions/new`

- **Web advantage**: Multi-step form, better file upload, budget line management
- Form sections: Basic info, Budget lines, Vendor info, Documents
- Budget validation in real-time
- Hook: `useCreateKaizen AdminApiV1Kaizen AdminsPost`

1. **Edit Kaizen Admin** → `/requisitions/[id]/edit`

- Edit draft requisitions
- Hook: `useUpdateKaizen AdminApiV1Kaizen AdminsKaizen AdminIdPut`

#### Approvals (2 screens)

12. **Pending Approvals** → `/approvals`

- **Web advantage**: Table with bulk approve/reject, filters
- List of pending approvals
- Quick actions: approve, reject, return for modification
- Filter by amount, department, priority
- Hook: `useGetPendingApprovalsApiV1ApprovalsPendingGet`

1. **Approval History** → `/approvals/history`

- Historical approvals
- Filter by date, status, approver
- Hook: `useGetApprovalHistoryApiV1ApprovalsHistoryGet`

#### Budget Management (3 screens)

14. **Budget Overview** → `/budget` or `/analytics/budget`

- **Web advantage**: Charts, tables, detailed reports
- Fiscal year summary
- Budget utilization charts
- Department/period breakdowns
- Hooks: `useListFiscalYearsApiV1BudgetFiscalYearsGet`, `useGetBudgetUtilizationReportApiV1BudgetReportsBudgetUtilizationGet`

1. **Budget Management** → `/budget/manage`
    - Create/edit budgets
    - Fiscal year management
    - Budget allocation rules
    - Spending limits
    - Hooks: `useListBudgetsApiV1BudgetBudgetsGet`, `useCreateBudgetApiV1BudgetBudgetsPost`

2. **Budget Reports** → `/budget/reports`
    - Budget vs Actual reports
    - Utilization by category/department
    - Trend analysis
    - Hooks: `useGenerateBudgetVsActualReportApiV1BudgetReportsBudgetVsActualGet`

#### Vendors (3 screens)

17. **Vendors List** → `/vendors`
    - **Web advantage**: Table with search, filters, bulk actions
    - Vendor list with performance metrics
    - Filter by category, status, rating
    - Search vendors
    - Hooks: `useListVendorsApiV1VendorsGet`, `useSearchVendorsApiV1VendorsSearchGet`

2. **Vendor Detail** → `/vendors/[id]`
    - Vendor profile
    - Performance metrics
    - Quote history
    - Onboarding status
    - Hooks: `useGetVendorApiV1VendorsVendorIdGet`, `useGetVendorPerformanceApiV1VendorsVendorIdPerformanceGet`

3. **Vendor Management** → `/vendors/manage` (Admin)
    - Create/edit vendors
    - Approve/suspend vendors
    - Manage vendor categories
    - Preferred vendor lists
    - Hooks: `useCreateVendorApiV1VendorsPost`, `useApproveVendorApiV1VendorsVendorIdApprovePost`

#### Committees (2 screens)

20. **Committees** → `/committees`
    - List of committees
    - Committee members
    - Hooks: `useListCommitteesApiV1CommitteesGet`

2. **Committee Review** → `/committees/[id]/reviews` or `/requisitions/[id]/committee-review`
    - Committee review details
    - Individual votes
    - Meeting notes
    - Hooks: `useListCommitteeReviewsApiV1CommitteesCommitteeIdReviewsGet`, `useSubmitCommitteeVoteApiV1CommitteesCommitteeIdReviewsReviewIdVotePost`

#### Configuration/Admin (2 screens)

22. **Settings** → `/settings`
    - **Web advantage**: Complex forms, tabs for different config sections
    - Organization configuration
    - Approval levels
    - Policy configuration
    - Accounting configuration
    - Budget line requirements
    - Hooks: `useGetPolicyConfigurationApiV1ConfigurationOrganizationIdPolicyGet`, `useGetApprovalLevelsApiV1ConfigurationApprovalLevelsGet`

2. **Configuration History** → `/settings/history`
    - Audit trail of config changes
    - Hook: `useGetConfigurationHistoryApiV1ConfigurationOrganizationIdHistoryGet`

#### Discussions & Notifications (2 screens)

24. **Discussion** → `/requisitions/[id]/discussion` (embedded in detail) or `/discussions/[id]`
    - Comments on requisitions
    - Threaded discussions
    - File attachments
    - Hooks: `useListCommentsApiV1DiscussionsCommentsGet`, `useCreateCommentApiV1DiscussionsCommentsPost`

2. **Notifications** → `/notifications`
    - Notification center
    - Mark as read, filter by type
    - Hook: `useListNotificationsApiV1NotificationsGet`

#### Analytics/Reports (1 screen)

26. **Analytics Dashboard** → `/analytics`
    - **Web advantage**: Rich charts, exportable reports
    - Budget utilization charts
    - Spending trends
    - Department comparisons
    - Export reports
    - Hooks: Various budget report hooks

## 📋 Summary: 27 Screens Total

### Public Pages: 4

### Auth Pages: 4

### Protected App Pages: 19

### By Priority

**Phase 1: Core MVP (11 screens)**

1. Home/Landing (public)
2. Login
3. Signup
4. Account Confirmation
5. Dashboard (overview)
6. Kaizen Admins List
7. Kaizen Admin Detail
8. Create Kaizen Admin
9. Pending Approvals
10. About (public)
11. Contact (public)

**Phase 2: Essential Features (6 screens)**
11. Edit Kaizen Admin
12. Vendors List
13. Vendor Detail
14. Budget Overview
15. Notifications
16. Discussion (on requisition detail)

**Phase 3: Advanced Features (6 screens)**
17. Approval History
18. Budget Management
19. Budget Reports
20. Vendor Management
21. Settings/Configuration
22. Analytics Dashboard

**Phase 4: Admin & Power Features (3 screens)**
23. Committees
24. Committee Review
25. Configuration History

**Phase 5: Public Pages Enhancement (1 screen)**
26. Features page

## 🎨 Web-Specific Advantages

1. **Tables over Lists**: Better for data-heavy views (requisitions, vendors, approvals)
2. **Advanced Filters**: Multi-select, date ranges, complex queries
3. **Bulk Actions**: Select multiple items, bulk approve/reject
4. **Rich Forms**: Multi-step wizards, better file uploads
5. **Charts & Reports**: Better visualization, exportable
6. **Admin Panels**: Complex configuration UIs
7. **Search**: Full-text search with filters
8. **Tabs**: Organize complex detail views

## 🔗 Route Structure

```
app/
├── page.tsx                      # Home/Landing (public)
├── about/page.tsx                # About (public)
├── features/page.tsx             # Features (public)
├── contact/page.tsx              # Contact/Support (public)
│
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── confirm-account/page.tsx      # Email/OTP confirmation
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
│
├── (dashboard)/
│   ├── layout.tsx                    # ✅ Exists
│   ├── dashboard/page.tsx            # ✅ Exists
│   │
│   ├── requisitions/
│   │   ├── page.tsx                  # List
│   │   ├── new/page.tsx              # Create
│   │   └── [id]/
│   │       ├── page.tsx              # Detail
│   │       ├── edit/page.tsx         # Edit
│   │       └── discussion/page.tsx   # Discussion
│   │
│   ├── approvals/
│   │   ├── page.tsx                  # Pending
│   │   └── history/page.tsx          # History
│   │
│   ├── vendors/
│   │   ├── page.tsx                  # List
│   │   ├── [id]/page.tsx             # Detail
│   │   └── manage/page.tsx           # Admin
│   │
│   ├── budget/
│   │   ├── page.tsx                  # Overview
│   │   ├── manage/page.tsx           # Management
│   │   └── reports/page.tsx          # Reports
│   │
│   ├── committees/
│   │   ├── page.tsx                  # List
│   │   └── [id]/reviews/page.tsx     # Reviews
│   │
│   ├── settings/
│   │   ├── page.tsx                  # Main settings
│   │   └── history/page.tsx          # Config history
│   │
│   ├── analytics/
│   │   └── page.tsx                  # Analytics dashboard
│   │
│   └── notifications/
│       └── page.tsx                  # Notifications
```

## 🎯 Key API Hooks by Screen

| Screen | Primary Hooks |
|--------|--------------|
| Home | None (static/public) |
| Login | `useLogin` (user/auth) |
| Signup | `useRegister` or signup hooks (user/auth) |
| Account Confirmation | `useConfirmAccount` (user/auth) - takes token from URL |
| Kaizen Admins List | `useListKaizen AdminsApiV1Kaizen AdminsGet`, `useSearchKaizen AdminsApiV1Kaizen AdminsSearchGet` |
| Kaizen Admin Detail | `useGetKaizen AdminApiV1Kaizen AdminsKaizen AdminIdGet`, `useGetApprovalChainApiV1Kaizen AdminsKaizen AdminIdApprovalChainGet` |
| Create Kaizen Admin | `useCreateKaizen AdminApiV1Kaizen AdminsPost` |
| Pending Approvals | `useGetPendingApprovalsApiV1ApprovalsPendingGet` |
| Approve/Reject | `useApproveKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdApprovePost`, `useRejectKaizen AdminApiV1ApprovalsKaizen AdminsKaizen AdminIdRejectPost` |
| Vendors List | `useListVendorsApiV1VendorsGet`, `useSearchVendorsApiV1VendorsSearchGet` |
| Budget Overview | `useListFiscalYearsApiV1BudgetFiscalYearsGet`, `useGetBudgetUtilizationReportApiV1BudgetReportsBudgetUtilizationGet` |
| Settings | `useGetPolicyConfigurationApiV1ConfigurationOrganizationIdPolicyGet`, `useGetApprovalLevelsApiV1ConfigurationApprovalLevelsGet` |
