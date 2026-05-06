# Web App Screens (Final List)

## 🌐 Public (4)
1. Home / Landing → `/`
2. About → `/about`
3. Features → `/features`
4. Contact / Support → `/contact`

## 🔐 Auth (4)
5. Login → `/login`
6. Signup / Register → `/signup`
7. Account Confirmation → `/confirm-account?token=xxx` (email link)
8. Forgot / Reset Password → `/forgot-password`, `/reset-password?token=xxx`

## 📊 Protected App (19) — Dashboard layout
### Kaizen Admins
9. Kaizen Admins List → `/requisitions`
10. Kaizen Admin Detail → `/requisitions/[id]`
11. Create Kaizen Admin → `/requisitions/new`
12. Edit Kaizen Admin → `/requisitions/[id]/edit`

### Approvals
13. Pending Approvals → `/approvals`
14. Approval History → `/approvals/history`

### Budget
15. Budget Overview → `/budget` or `/analytics/budget`
16. Budget Management → `/budget/manage`
17. Budget Reports → `/budget/reports`

### Vendors
18. Vendors List → `/vendors`
19. Vendor Detail → `/vendors/[id]`
20. Vendor Management (admin) → `/vendors/manage`

### Committees
21. Committees → `/committees`
22. Committee Review → `/committees/[id]/reviews` (or `/requisitions/[id]/committee-review`)

### Configuration / Admin
23. Settings → `/settings`
24. Configuration History → `/settings/history`

### Discussions & Notifications
25. Discussion → `/requisitions/[id]/discussion` (or `/discussions/[id]`)
26. Notifications → `/notifications`

### Analytics
27. Analytics Dashboard → `/analytics`

## 🗂️ Route Outline
```
app/
├── page.tsx                  # Home (public)
├── about/page.tsx            # Public
├── features/page.tsx         # Public
├── contact/page.tsx          # Public
│
├── (auth)/
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── confirm-account/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
│
└── (dashboard)/              # Protected + sidebar
    ├── layout.tsx
    ├── dashboard/page.tsx
    ├── requisitions/
    │   ├── page.tsx
    │   ├── new/page.tsx
    │   └── [id]/
    │       ├── page.tsx
    │       ├── edit/page.tsx
    │       └── discussion/page.tsx
    ├── approvals/
    │   ├── page.tsx
    │   └── history/page.tsx
    ├── vendors/
    │   ├── page.tsx
    │   ├── [id]/page.tsx
    │   └── manage/page.tsx
    ├── budget/
    │   ├── page.tsx
    │   ├── manage/page.tsx
    │   └── reports/page.tsx
    ├── committees/
    │   ├── page.tsx
    │   └── [id]/reviews/page.tsx
    ├── settings/
    │   ├── page.tsx
    │   └── history/page.tsx
    ├── analytics/page.tsx
    └── notifications/page.tsx
```

## ✅ Quick Mapping to Hooks (examples)
- Login: `useLogin` (user/auth)
- Confirm Account: `useConfirmAccount` (user/auth)
- Kaizen Admins List: `useListKaizen AdminsApiV1Kaizen AdminsGet`
- Kaizen Admin Detail: `useGetKaizen AdminApiV1Kaizen AdminsKaizen AdminIdGet`
- Create Kaizen Admin: `useCreateKaizen AdminApiV1Kaizen AdminsPost`
- Pending Approvals: `useGetPendingApprovalsApiV1ApprovalsPendingGet`
- Vendors List: `useListVendorsApiV1VendorsGet`
- Budget Overview: `useListFiscalYearsApiV1BudgetFiscalYearsGet`, `useGetBudgetUtilizationReportApiV1BudgetReportsBudgetUtilizationGet`
- Settings: `useGetPolicyConfigurationApiV1ConfigurationOrganizationIdPolicyGet`


