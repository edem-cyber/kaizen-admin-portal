<!--
This document is a manual-QA tracking catalog. Each test case is a discrete verification
step. Update the Status column as tests are executed.

Legend:
- Status: blank = not started; P = pass; F = fail; B = blocked; S = skipped
- Tester: initials of person who ran the test
- Date: YYYY-MM-DD of execution
- Notes: short observation, bug ticket ID, or workaround

Types: functional | validation | navigation | state | permission | responsive | visual
Priority: critical | high | medium | low
-->

# REQUISITION WEB APP - COMPREHENSIVE TEST COVERAGE CATALOG

## AUTH SCREENS

### LOGIN PAGE
**Route:** `/login`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| LOGIN-01 | Email/Username Input | Enter valid username → "Next" button enabled | functional | high |  |  |  |  |
| LOGIN-02 | Username Validation | Enter username < 3 chars → error shown; ≥ 3 chars → enable Next | validation | high |  |  |  |  |
| LOGIN-03 | Account Check Step | Click Next → API checks account existence; shows password field if found | functional | critical |  |  |  |  |
| LOGIN-04 | Account Not Found | Enter non-existent username → error "Account not found. Please sign up." | functional | high |  |  |  |  |
| LOGIN-05 | Password Field | Password field not visible until Next clicked; auto-focus when shown | state | medium |  |  |  |  |
| LOGIN-06 | Show/Hide Password | Click eye icon → toggle between text and masked password | functional | medium |  |  |  |  |
| LOGIN-07 | Change Username Link | Click "Change username" → return to step 1, clear username | navigation | medium |  |  |  |  |
| LOGIN-08 | Forgot Password Link | Click "Forgot password?" → navigate to /forgot-password | navigation | high |  |  |  |  |
| LOGIN-09 | Valid Login | Submit correct credentials → success toast, redirect to /admin | functional | critical |  |  |  |  |
| LOGIN-10 | Invalid Credentials | Submit wrong password → error shown inline | functional | critical |  |  |  |  |
| LOGIN-11 | Loading State - Step 1 | While checking account → Next button shows spinner, disabled | state | medium |  |  |  |  |
| LOGIN-12 | Loading State - Step 2 | While submitting credentials → Sign in button shows spinner, disabled | state | medium |  |  |  |  |
| LOGIN-13 | Admin Redirect | Login with platform admin account → redirect to /admin instead of /admin | permission | high |  |  |  |  |
| LOGIN-14 | Development Mode Buttons | Dev mode visible in development env only with test accounts | functional | low |  |  |  |  |
| LOGIN-15 | Dev Skip Login | Click "Skip Login" in dev mode → login bypassed, redirect to /admin | functional | low |  |  |  |  |
| LOGIN-16 | Authenticated User Redirect | Already logged in user visits /login → redirect to /admin | navigation | high |  |  |  |  |
| LOGIN-17 | Responsive Design | At 375px: form stacks vertically, logo visible, buttons full-width | responsive | medium |  |  |  |  |
| LOGIN-18 | Error Persistence | Error message displayed across both steps if session error | state | low |  |  |  |  |

### SIGNUP PAGE
**Route:** `/signup`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| SIGNUP-01 | First Name Input | Enter first name → field accepts text | functional | high |  |  |  |  |
| SIGNUP-02 | Last Name Input | Enter last name → field accepts text | functional | high |  |  |  |  |
| SIGNUP-03 | Email Input | Enter email → field validates on submit | functional | high |  |  |  |  |
| SIGNUP-04 | Username Input | Username ≥ 3 chars → debounce 500ms, check availability | functional | critical |  |  |  |  |
| SIGNUP-05 | Username Availability | Username taken → red X icon, error text "Username is already taken" | validation | critical |  |  |  |  |
| SIGNUP-06 | Username Available | Username free → green checkmark, success text "Username is available" | validation | critical |  |  |  |  |
| SIGNUP-07 | Username Loading State | While checking → spinner icon shown | state | medium |  |  |  |  |
| SIGNUP-08 | Organization Name Input | Org name ≥ 3 chars → debounce 500ms, check availability | functional | critical |  |  |  |  |
| SIGNUP-09 | Org Name Availability | Org name taken → error shown; unique → success icon shown | validation | critical |  |  |  |  |
| SIGNUP-10 | Address Input | Address required → validation error if empty on submit | validation | high |  |  |  |  |
| SIGNUP-11 | City/Region Optional | City and region optional but can be filled | functional | low |  |  |  |  |
| SIGNUP-12 | Country Select | Select country → dropdown populated from API | functional | high |  |  |  |  |
| SIGNUP-13 | Country Required | No country selected → error "Please select a country" | validation | critical |  |  |  |  |
| SIGNUP-14 | Terms Checkbox | Uncheck terms → Submit button disabled | validation | critical |  |  |  |  |
| SIGNUP-15 | Terms Checked | Check terms → Submit button enabled | functional | high |  |  |  |  |
| SIGNUP-16 | Terms Links | Links to /terms and /privacy are clickable | navigation | low |  |  |  |  |
| SIGNUP-17 | Form Submission Success | All fields filled, terms checked → POST to org signup endpoint | functional | critical |  |  |  |  |
| SIGNUP-18 | Submission Failure | API error on submit → error message displayed | functional | high |  |  |  |  |
| SIGNUP-19 | Submit Loading State | While creating account → Submit button disabled, shows spinner | state | medium |  |  |  |  |
| SIGNUP-20 | Redirect on Success | After successful signup → navigate to /login with success toast | navigation | critical |  |  |  |  |
| SIGNUP-21 | Already Authenticated | Logged-in user visits /signup → redirect to /admin | navigation | high |  |  |  |  |
| SIGNUP-22 | Dev Auto-fill | In dev mode: form pre-populated with dummy data for testing | functional | low |  |  |  |  |
| SIGNUP-23 | Responsive Layout | At 375px: 2-col fields stack to 1, full-width inputs | responsive | medium |  |  |  |  |

### FORGOT PASSWORD PAGE
**Route:** `/forgot-password`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| FP-01 | Username Input | Enter username or email → field accepts text | functional | high |  |  |  |  |
| FP-02 | Submit Button | Click "Send reset link" → API POST with username | functional | high |  |  |  |  |
| FP-03 | Valid Submission | Correct username → success page shown | functional | critical |  |  |  |  |
| FP-04 | Success Message | After submission → "Check your inbox" page with email confirmation note | state | critical |  |  |  |  |
| FP-05 | Back to Login Link | On success page → "Back to login" link navigates to /login | navigation | high |  |  |  |  |
| FP-06 | API Error | API returns error → error message shown inline | functional | high |  |  |  |  |
| FP-07 | Loading State | While sending reset link → button disabled, shows loading indicator | state | medium |  |  |  |  |
| FP-08 | Authenticated Redirect | Logged-in user visits page → redirect to /admin | navigation | high |  |  |  |  |

### RESET PASSWORD PAGE
**Route:** `/reset-password`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| RP-01 | Token Validation | Valid reset token in URL → form displayed | functional | critical |  |  |  |  |
| RP-02 | Invalid Token | Missing or expired token → error page shown | functional | critical |  |  |  |  |
| RP-03 | Password Input | Enter password → validates against password requirements | validation | high |  |  |  |  |
| RP-04 | Show/Hide Password | Toggle password visibility → text ↔ masked | functional | medium |  |  |  |  |
| RP-05 | Password Requirements | Display password guidelines (length, special chars, etc.) | validation | high |  |  |  |  |
| RP-06 | Submit Reset | Click "Reset password" → POST with token and new password | functional | critical |  |  |  |  |
| RP-07 | Reset Success | Password updated → success message, redirect to /login | functional | critical |  |  |  |  |
| RP-08 | Reset Failure | API error during reset → error shown | functional | high |  |  |  |  |

### OTP CONFIRMATION PAGE
**Route:** `/otp-confirmation?code=TOKEN&username=USERNAME`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| OTP-01 | Invalid Link | No code param → error page "Invalid Link" | state | critical |  |  |  |  |
| OTP-02 | Password Input | Enter password to set account password | functional | high |  |  |  |  |
| OTP-03 | Password Guidelines | Display password strength rules | validation | medium |  |  |  |  |
| OTP-04 | Show/Hide Password | Toggle visibility → text ↔ masked | functional | medium |  |  |  |  |
| OTP-05 | Confirm Button | Click "Confirm" → POST with token and password | functional | critical |  |  |  |  |
| OTP-06 | Confirmation Success | Valid token and password → logged in, redirect to /admin | functional | critical |  |  |  |  |
| OTP-07 | Confirmation Failure | API error → error message shown | functional | high |  |  |  |  |
| OTP-08 | Username Display | Display "Confirm account for {username}" in header | state | low |  |  |  |  |

### PRICING PAGE
**Route:** `/pricing`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| PRICING-01 | Plan Cards Display | Pricing plans listed with features | functional | high |  |  |  |  |
| PRICING-02 | Select Plan Button | Click plan button → action (navigate or trigger signup) | navigation | high |  |  |  |  |
| PRICING-03 | Feature List | Each plan shows list of included features | functional | medium |  |  |  |  |
| PRICING-04 | Pricing Tiers | Display 3+ pricing tiers with monthly/annual toggle | functional | medium |  |  |  |  |

### TERMS PAGE
**Route:** `/terms`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| TERMS-01 | Content Load | Terms of service content displays | functional | low |  |  |  |  |
| TERMS-02 | Back Navigation | Link to return to previous page or home | navigation | low |  |  |  |  |

### PRIVACY PAGE
**Route:** `/privacy`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| PRIVACY-01 | Content Load | Privacy policy content displays | functional | low |  |  |  |  |
| PRIVACY-02 | Back Navigation | Link to return or close | navigation | low |  |  |  |  |

### PAYMENT SUCCESS PAGE
**Route:** `/payment-success`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| PAYSUCCESS-01 | Success Message | Payment confirmation message displayed | functional | high |  |  |  |  |
| PAYSUCCESS-02 | Order Details | Order/transaction details shown | functional | high |  |  |  |  |
| PAYSUCCESS-03 | Next Action Button | Button to continue (e.g., "Go to Dashboard") | navigation | high |  |  |  |  |

---

## DASHBOARD SCREENS

### DASHBOARD HOME
**Route:** `/admin`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| DASH-01 | User Greeting | Greeting displays correct time of day (Good morning/afternoon/evening) | state | low |  |  |  |  |
| DASH-02 | KPI Cards - Active Kaizen Admins | Card shows total requisition count | functional | high |  |  |  |  |
| DASH-03 | KPI Cards - Pending Approval | Card shows submitted requisition count | functional | high |  |  |  |  |
| DASH-04 | KPI Cards - Total Approved | Card shows approved requisition count | functional | high |  |  |  |  |
| DASH-05 | KPI Cards - Monthly Spend | Card shows total spend in GHS | functional | high |  |  |  |  |
| DASH-06 | KPI Cards Loading | While fetching data → skeleton loaders shown | state | medium |  |  |  |  |
| DASH-07 | New Kaizen Admin Button | Click → navigate to /requisitions/new | navigation | critical |  |  |  |  |
| DASH-08 | Review Approvals Button | Click → navigate to /approvals | navigation | high |  |  |  |  |
| DASH-09 | Recent Kaizen Admins List | Shows last 5 requisitions with title, requester, amount, status | functional | high |  |  |  |  |
| DASH-10 | Recent Kaizen Admins - Click | Click requisition → navigate to /requisitions/{id} | navigation | high |  |  |  |  |
| DASH-11 | Recent Kaizen Admins - Empty | No requisitions → empty state with "Create Kaizen Admin" button | state | medium |  |  |  |  |
| DASH-12 | Status Distribution Chart | Shows approved/pending/rejected/draft breakdown | functional | medium |  |  |  |  |
| DASH-13 | View All Kaizen Admins | "View All" link → navigate to /requisitions | navigation | high |  |  |  |  |
| DASH-14 | Responsive Layout | At 375px: KPI cards stack 1-col, recent list stacks | responsive | medium |  |  |  |  |
| DASH-15 | Loading Timeout | Data takes > 30s → show loading state or error | state | low |  |  |  |  |

### REQUISITIONS LIST
**Route:** `/requisitions`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| REQLIST-01 | Page Header | "My Kaizen Admins" title and description | functional | low |  |  |  |  |
| REQLIST-02 | New Kaizen Admin Button | Click → navigate to /requisitions/new | navigation | critical |  |  |  |  |
| REQLIST-03 | Tab Navigation | Tabs: All, Draft, Pending, Approved, Rejected | functional | high |  |  |  |  |
| REQLIST-04 | Tab Filtering | Click tab → filter list by status | functional | high |  |  |  |  |
| REQLIST-05 | Search Input | Type title, number, or ID → filter results in real-time | functional | high |  |  |  |  |
| REQLIST-06 | Clear Filters | Clear search + reset tab to "All" → show full list | functional | high |  |  |  |  |
| REQLIST-07 | Kaizen Admin Card Display | Each card shows title, ID, requester, amount, status, date | functional | high |  |  |  |  |
| REQLIST-08 | Card Click Navigation | Click card → navigate to /requisitions/{id} | navigation | critical |  |  |  |  |
| REQLIST-09 | Empty State - No Data | No requisitions matching filters → empty state with CTA | state | medium |  |  |  |  |
| REQLIST-10 | Empty State - Error | Failed to load → error message with retry option | state | medium |  |  |  |  |
| REQLIST-11 | Loading Skeleton | While loading → skeleton card placeholders shown | state | medium |  |  |  |  |
| REQLIST-12 | Tab Count Badges | "Pending" tab shows count of pending requisitions | functional | low |  |  |  |  |
| REQLIST-13 | Responsive Design | At 375px: cards full-width; 5 tabs (all/draft/pending/approved/rejected) fit via grid-cols-5 with short labels | responsive | medium |  |  |  |  |

### CREATE REQUISITION
**Route:** `/requisitions/new`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| REQCREATE-01 | Load Page | Config loads (accounting, fiscal years, budgets) → form displays | functional | critical |  |  |  |  |
| REQCREATE-02 | Back Button | Click → navigate to /requisitions | navigation | high |  |  |  |  |
| REQCREATE-03 | Form Title Input | Enter title ≥ 3 chars | functional | high |  |  |  |  |
| REQCREATE-04 | Form Description Input | Enter description (required) | functional | high |  |  |  |  |
| REQCREATE-05 | Form Justification Input | Enter justification ≥ 10 chars (required) | functional | high |  |  |  |  |
| REQCREATE-06 | Priority Select | Select: Low / Normal / High / Urgent | functional | high |  |  |  |  |
| REQCREATE-07 | Category Select | Select vendor category → populated from API | functional | high |  |  |  |  |
| REQCREATE-08 | Delivery Date Picker | Select future date → date format YYYY-MM-DD stored | functional | high |  |  |  |  |
| REQCREATE-09 | Budget Line - Add | Click "Add Line" → new budget line row added | functional | high |  |  |  |  |
| REQCREATE-10 | Budget Line - Select Budget | Click budget dropdown → filter by fiscal year if FY selected | functional | critical |  |  |  |  |
| REQCREATE-11 | Budget Line - FY Required | No fiscal year selected → error "Fiscal year is required" | validation | critical |  |  |  |  |
| REQCREATE-12 | Budget Line - Amount Validation | Amount ≤ 0 → error "Amount must be greater than 0" | validation | critical |  |  |  |  |
| REQCREATE-13 | Budget Line - Available Amount | Show available amount after budget selection | state | high |  |  |  |  |
| REQCREATE-14 | Budget Line - Amount Warning | If amount > available → warning "Exceeds available budget" | validation | high |  |  |  |  |
| REQCREATE-15 | Budget Line - Cost Center | Select cost center (or default to GENERAL) | functional | high |  |  |  |  |
| REQCREATE-16 | Budget Line - Currency | Currency inherited from budget or org default | state | medium |  |  |  |  |
| REQCREATE-17 | Budget Line - Delete | Click delete icon → line removed. Button disabled when only 1 line remains (no confirm). | functional | high |  |  |  |  |
| REQCREATE-18 | Total Amount Auto-calc | Sum all line amounts → display total at bottom | state | high |  |  |  |  |
| REQCREATE-19 | Attachment Upload - Select | Click "Add Attachment" → file picker opens | functional | high |  |  |  |  |
| REQCREATE-20 | Attachment Upload - Multiple | Select 1+ files → all listed before submit | functional | high |  |  |  |  |
| REQCREATE-21 | Attachment Upload - Type | Accept common doc types (pdf, docx, xlsx, etc.) | functional | medium |  |  |  |  |
| REQCREATE-22 | File Input Reset | After a file is picked, the `<input type="file">` value is cleared so the same file can be re-added | functional | medium |  |  |  |  |
| REQCREATE-23 | Attachment Remove Before Submit | Click X on file preview → remove from upload list | functional | high |  |  |  |  |
| REQCREATE-24 | Vendor Info - Optional | Vendor name and contact optional fields | functional | low |  |  |  |  |
| REQCREATE-25 | Submit Button | Click "Submit Kaizen Admin" → POST requisition + sequentially upload attachments | functional | critical |  |  |  |  |
| REQCREATE-26 | Submit Validation | Missing title/description/justification → show errors | validation | critical |  |  |  |  |
| REQCREATE-27 | Submit Loading State | While creating → button disabled, shows spinner | state | medium |  |  |  |  |
| REQCREATE-28 | Upload In-Progress Label | While uploading → Submit button label shows "Uploading attachments…" | state | medium |  |  |  |  |
| REQCREATE-29 | Upload Failure Handling | Kaizen Admin already created, 1+ uploads fail → per-file error toast, navigate to detail anyway (no rollback) | functional | high |  |  |  |  |
| REQCREATE-30 | Submit Success | Kaizen Admin created → success toast, redirect to /requisitions/{id} | functional | critical |  |  |  |  |
| REQCREATE-31 | Submit Failure | API error on create → error message shown | functional | high |  |  |  |  |
| REQCREATE-32 | Cancel Button | Click Cancel → immediately navigate to /requisitions (no unsaved-change guard exists) | functional | medium |  |  |  |  |
| REQCREATE-33 | Config Loading State | While loading → spinner with "Loading organization defaults…" | state | medium |  |  |  |  |
| REQCREATE-34 | Fiscal Year Filtering | If FY selected → budget dropdown filtered to that FY | functional | critical |  |  |  |  |
| REQCREATE-35 | Empty Fiscal-Year CTA | No fiscal years configured → budget allocation section shows CTA link to /configuration/fiscal-year, submit disabled | functional | critical |  |  |  |  |
| REQCREATE-36 | Responsive Design | At 375px: form fields single-column, buttons stack | responsive | medium |  |  |  |  |
| REQCREATE-37 | Validation Error Toast | Click Submit with invalid fields → toast surfaces first error (e.g. "Line 1: Fiscal year is required"); form does not silently block | validation | critical |  |  |  |  |
| REQCREATE-38 | Submit Disabled - No FY | When no fiscal years exist → Submit Kaizen Admin button is disabled | state | critical |  |  |  |  |
| REQCREATE-39 | Empty FY CTA Link | CTA link in empty-FY state navigates to /configuration/fiscal-year | navigation | high |  |  |  |  |

### REQUISITION DETAIL
**Route:** `/requisitions/{id}`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| REQDETAIL-01 | Load Page | Fetch requisition data → display details | functional | critical |  |  |  |  |
| REQDETAIL-02 | Back Button | If from /approvals → "Back" returns to /approvals; else /requisitions | navigation | high |  |  |  |  |
| REQDETAIL-03 | Status Badge | Display requisition status (Draft/Submitted/Approved/Rejected/Cancelled) | functional | high |  |  |  |  |
| REQDETAIL-04 | Priority Badge | If Urgent → show "Urgent" badge in red | functional | high |  |  |  |  |
| REQDETAIL-05 | Req Number | Display requisition number in small monospace font | functional | low |  |  |  |  |
| REQDETAIL-06 | Title | Display large requisition title | functional | high |  |  |  |  |
| REQDETAIL-07 | Requester Info | Show requester name and avatar | functional | high |  |  |  |  |
| REQDETAIL-08 | Created Date | Display creation date/time | functional | low |  |  |  |  |
| REQDETAIL-09 | Total Amount | Display total in currency format (GHS) | functional | high |  |  |  |  |
| REQDETAIL-10 | Approval Workflow Stepper | Show all approval stages: submitted → approved/rejected | functional | critical |  |  |  |  |
| REQDETAIL-11 | Tabs - Overview | Display description, justification, logistics | functional | high |  |  |  |  |
| REQDETAIL-12 | Tabs - Items | Table of budget lines: description, budget code, amount | functional | high |  |  |  |  |
| REQDETAIL-13 | Tabs - Documents | Grid of attached documents with download buttons | functional | high |  |  |  |  |
| REQDETAIL-14 | Tabs - Quotes | "Coming soon" placeholder for vendor quotes | functional | low |  |  |  |  |
| REQDETAIL-15 | Tabs - History | Timeline of approvals with approver name, date, comments | functional | high |  |  |  |  |
| REQDETAIL-16 | Tabs - Discussion | Load discussion chat interface | functional | high |  |  |  |  |
| REQDETAIL-17 | Document Download | Click download icon on doc → file downloads | functional | high |  |  |  |  |
| REQDETAIL-18 | Empty Documents | No attachments → "No documents attached" message | state | low |  |  |  |  |
| REQDETAIL-19 | Edit Button - Draft Only | Draft requisition → "Edit" button visible and clickable | permission | critical |  |  |  |  |
| REQDETAIL-20 | Edit Button - Other Status | Non-draft → Edit button hidden | permission | critical |  |  |  |  |
| REQDETAIL-21 | Edit Navigation | Click Edit → navigate to /requisitions/{id}/edit | navigation | high |  |  |  |  |
| REQDETAIL-22 | Submit Button - Draft Only | Draft status + requester owns it → "Submit" button visible | permission | critical |  |  |  |  |
| REQDETAIL-23 | Submit Action | Click Submit → confirmation, POST submit endpoint, toast success | functional | critical |  |  |  |  |
| REQDETAIL-24 | Submit Loading | While submitting → button disabled, spinner shown | state | medium |  |  |  |  |
| REQDETAIL-25 | Cancel Button - Draft Only | Draft requisition → "Cancel" button visible | permission | critical |  |  |  |  |
| REQDETAIL-26 | Cancel Dialog | Click Cancel → confirmation dialog with reason textarea (optional) | functional | high |  |  |  |  |
| REQDETAIL-27 | Cancel Confirmation | Confirm cancel → POST cancel endpoint with reason | functional | critical |  |  |  |  |
| REQDETAIL-28 | Cancel Success | Kaizen Admin cancelled → status updates, toast shown | functional | critical |  |  |  |  |
| REQDETAIL-29 | Not Found Error | Invalid {id} → "Kaizen Admin Not Found" error page | state | high |  |  |  |  |
| REQDETAIL-30 | Loading State | While fetching → spinner with "Loading requisition details…" | state | medium |  |  |  |  |
| REQDETAIL-31 | Floating Action Bar | Draft/submitted req → sticky bar at bottom with action buttons | state | high |  |  |  |  |
| REQDETAIL-32 | Action Bar - Mobile | At 375px: action bar width 95%, centered | responsive | medium |  |  |  |  |
| REQDETAIL-33 | Responsive Tab Icons | At 375px: tab labels hidden, icons only; show on sm+ | responsive | medium |  |  |  |  |
| REQDETAIL-34 | Docs Tab Data Source | Docs tab loads from /api/v1/documents/requisitions/{id}/documents (not the stale embedded supporting_documents field) | functional | critical |  |  |  |  |
| REQDETAIL-35 | Cancel Dialog - Dismiss | Click "Keep requisition" → dialog closes, no API call, requisition unchanged | functional | high |  |  |  |  |
| REQDETAIL-36 | Cancel Dialog - Empty Reason | Submit cancel with empty reason → payload sent with reason = "Cancelled by user" (default) | functional | high |  |  |  |  |
| REQDETAIL-37 | Cancel Dialog - Non-dismissible While Pending | While mutation in-flight → clicking outside does not close dialog | state | medium |  |  |  |  |

### EDIT REQUISITION
**Route:** `/requisitions/{id}/edit`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| REQEDIT-01 | Load Page | Fetch requisition + attachments → pre-fill form | functional | critical |  |  |  |  |
| REQEDIT-02 | Back Button | Click → navigate to /requisitions/{id} | navigation | high |  |  |  |  |
| REQEDIT-03 | Form Pre-fill | All fields (title, description, budget lines) pre-populated | state | critical |  |  |  |  |
| REQEDIT-04 | Edit Field - Title | Modify title → field accepts changes | functional | high |  |  |  |  |
| REQEDIT-05 | Edit Field - Description | Modify description → field accepts changes | functional | high |  |  |  |  |
| REQEDIT-06 | Edit Budget Lines | Modify amount, budget, cost center → changes accepted | functional | high |  |  |  |  |
| REQEDIT-07 | Add New Budget Line | Click "Add Line" → new empty line added | functional | high |  |  |  |  |
| REQEDIT-08 | Delete Budget Line | Click delete → line removed if > 1 line | functional | high |  |  |  |  |
| REQEDIT-09 | Existing Attachments | Previously uploaded files listed with download + delete buttons | functional | high |  |  |  |  |
| REQEDIT-10 | Delete Attachment | Click delete on attachment → mark for deletion | functional | high |  |  |  |  |
| REQEDIT-11 | Add New Attachments | Click "Add Attachment" → file picker, add to upload queue | functional | high |  |  |  |  |
| REQEDIT-12 | Save Sequence | On save: PUT update → then sequentially delete marked attachments → then sequentially upload new files → navigate to detail | functional | critical |  |  |  |  |
| REQEDIT-13 | Upload Partial Failure | 1 attachment fails → error shown for that file, others uploaded | functional | high |  |  |  |  |
| REQEDIT-14 | Submit Changes | Click "Save Changes" → POST update + attachment operations | functional | critical |  |  |  |  |
| REQEDIT-15 | Submit Loading | While saving → button disabled, spinner shown | state | medium |  |  |  |  |
| REQEDIT-16 | Submit Success | Changes saved → success toast, redirect to /requisitions/{id} | functional | critical |  |  |  |  |
| REQEDIT-17 | Submit Failure | API error → error message shown | functional | high |  |  |  |  |
| REQEDIT-18 | Cancel Edit | Click Cancel → confirm, navigate to detail page | functional | medium |  |  |  |  |
| REQEDIT-19 | Not Found | Invalid {id} → error page with back link | state | high |  |  |  |  |
| REQEDIT-20 | Responsive Design | At 375px: form single-column, attachments grid stacks | responsive | medium |  |  |  |  |
| REQEDIT-21 | Attachment Delete Toggle | Click trash on existing attachment → marked for deletion (strikethrough). Click again → un-marked (restored) | functional | high |  |  |  |  |
| REQEDIT-22 | Attachment Download | Click download on existing attachment → auth-aware blob fetch, file saves locally | functional | high |  |  |  |  |
| REQEDIT-23 | No Existing Attachments State | Kaizen Admin with zero documents → attachments card shows only the add-new picker, no existing-files section | state | medium |  |  |  |  |
| REQEDIT-24 | Cache Invalidation Post-Save | After save with attachment changes → documents list query invalidated so detail Docs tab reflects updates | functional | high |  |  |  |  |

### DISCUSSION PAGE
**Route:** `/requisitions/{id}/discussion`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| DISC-01 | Load Page | Fetch discussions list → auto-select first thread | functional | critical |  |  |  |  |
| DISC-02 | Back Button | Click → navigate to /requisitions/{id} | navigation | high |  |  |  |  |
| DISC-03 | Threads Sidebar (Desktop) | Show all discussion threads in left sidebar | functional | high |  |  |  |  |
| DISC-04 | Threads Sheet (Mobile) | At 375px: hamburger menu opens sheet with threads | responsive | critical |  |  |  |  |
| DISC-05 | Select Thread | Click thread → load comments for that thread | functional | critical |  |  |  |  |
| DISC-06 | Thread List - Empty | No threads → "No discussions yet" message | state | medium |  |  |  |  |
| DISC-07 | Thread Title Display | Thread title or "Discussion" if untitled | functional | high |  |  |  |  |
| DISC-08 | Thread Metadata | Show comment count, last comment preview, last comment time | functional | high |  |  |  |  |
| DISC-09 | Pinned Thread Icon | Pinned thread shows pin icon in sidebar | functional | low |  |  |  |  |
| DISC-10 | Create New Thread Button | Click "New" button → dialog opens | functional | high |  |  |  |  |
| DISC-11 | New Thread Dialog - Title | Enter optional title for thread | functional | high |  |  |  |  |
| DISC-12 | New Thread Dialog - Comment | Enter first comment (required) | validation | high |  |  |  |  |
| DISC-13 | Create Thread Submit | Click "Create Thread" → POST discussion, select thread | functional | critical |  |  |  |  |
| DISC-14 | Create Thread Validation | Empty first comment → error "Add a first comment…" | validation | high |  |  |  |  |
| DISC-15 | New Thread Loading | While creating → button disabled, spinner shown | state | medium |  |  |  |  |
| DISC-16 | Comments List | Load threaded comments for selected thread | functional | critical |  |  |  |  |
| DISC-17 | Comment Display - Author | Show author name and avatar | functional | high |  |  |  |  |
| DISC-18 | Comment Display - Content | Display comment text with newlines preserved | functional | high |  |  |  |  |
| DISC-19 | Comment Display - Type Badge | Question/Answer/Suggestion icons colored by type | functional | high |  |  |  |  |
| DISC-20 | Comment Display - Timestamp | Show relative time (e.g., "2m ago", "1d ago") | functional | high |  |  |  |  |
| DISC-21 | Comment Display - Resolved | If marked resolved → show "Resolved" badge | functional | medium |  |  |  |  |
| DISC-22 | Reactions Button | Hover comment → "React" button shows | functional | high |  |  |  |  |
| DISC-23 | Reaction Types | Click React → dropdown: Like, Helpful, Agree | functional | high |  |  |  |  |
| DISC-24 | Reaction Display | After reacting → reaction pill with count shown | functional | high |  |  |  |  |
| DISC-25 | Reply Button | Hover comment → "Reply" button shows (if have permission) | functional | high |  |  |  |  |
| DISC-26 | Reply to Comment | Click Reply → reply input focuses, "Replying to {name}" shown | functional | high |  |  |  |  |
| DISC-27 | Delete Comment Button | Own comment + have permission → "Delete" button shows on hover | permission | high |  |  |  |  |
| DISC-28 | Delete Confirmation | Click Delete → confirm dialog, "Comment deleted" toast | functional | high |  |  |  |  |
| DISC-29 | Comment Input - Placeholder | "Write a message..." or "Write a reply..." if replying | state | low |  |  |  |  |
| DISC-30 | Comment Input - Type Tag | Dropdown in input to tag comment type | functional | high |  |  |  |  |
| DISC-31 | Comment Type Select | Composer menu offers Comment / Question / Suggestion only. Answer type is not user-postable (renders if set server-side) | functional | high |  |  |  |  |
| DISC-32 | Comment Send - Keyboard | Shift+Enter for newline, Enter to send | functional | medium |  |  |  |  |
| DISC-33 | Comment Send - Button | Click send button → POST comment, clear input | functional | critical |  |  |  |  |
| DISC-34 | Comment Validation | Empty comment → send button disabled, Submit disallowed | validation | high |  |  |  |  |
| DISC-35 | Nested Replies | Replies indented under parent comment | functional | high |  |  |  |  |
| DISC-36 | Reply Threading | Reply to reply → nested 2+ levels | functional | medium |  |  |  |  |
| DISC-37 | Auto-scroll | New comments → scroll to bottom automatically | functional | high |  |  |  |  |
| DISC-38 | Read-only Access | No discuss_write permission → input area shows "read-only access" message | permission | critical |  |  |  |  |
| DISC-39 | Empty Thread | No comments yet → "Start the conversation" empty state | state | medium |  |  |  |  |
| DISC-40 | Comment Send Loading | While posting → send button disabled, spinner shown | state | medium |  |  |  |  |
| DISC-41 | Comment Failure | API error → "Failed to post comment" toast | functional | high |  |  |  |  |
| DISC-42 | Mobile Layout - 375px | Single column, threads in hamburger menu, chat full-width | responsive | critical |  |  |  |  |
| DISC-43 | Desktop Layout | Sidebar + chat area side-by-side | responsive | high |  |  |  |  |
| DISC-44 | Mobile Sheet Auto-close | On mobile, selecting a thread in the Sheet drawer → Sheet closes automatically | functional | high |  |  |  |  |
| DISC-45 | Comment Type Reset After Send | After a comment is successfully posted → type selector resets to "comment" for the next message | state | medium |  |  |  |  |
| DISC-46 | Icon-Only Type Selector | Type selector is a small icon button inside the composer (bottom-right of textarea), not a full-width row | visual | medium |  |  |  |  |

### APPROVALS LIST
**Route:** `/approvals`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| APPROVALS-01 | Page Header | "Approvals" title, description | functional | low |  |  |  |  |
| APPROVALS-02 | Tab Navigation | Tabs: Pending (with count badge), History | functional | high |  |  |  |  |
| APPROVALS-03 | Search Input | Search by title, requester, or requisition number | functional | high |  |  |  |  |
| APPROVALS-04 | Pending Tab - Empty | No pending approvals → "All caught up!" with checkmark | state | medium |  |  |  |  |
| APPROVALS-05 | Pending Tab - Loading | While loading → skeleton loaders shown | state | medium |  |  |  |  |
| APPROVALS-06 | Pending Tab - List | Display approval cards with requisition details | functional | high |  |  |  |  |
| APPROVALS-07 | History Tab - Empty | No history → "No history found" message | state | medium |  |  |  |  |
| APPROVALS-08 | History Tab - List | Display historical approvals/rejections | functional | high |  |  |  |  |
| APPROVALS-09 | Approval Card - Title | Kaizen Admin title displayed | functional | high |  |  |  |  |
| APPROVALS-10 | Approval Card - Requester | Requester name shown | functional | high |  |  |  |  |
| APPROVALS-11 | Approval Card - Amount | Total amount in GHS | functional | high |  |  |  |  |
| APPROVALS-12 | Approval Card - Priority | Priority badge (if Urgent) | functional | medium |  |  |  |  |
| APPROVALS-13 | Approval Card - Documents | Attachment count shown | functional | medium |  |  |  |  |
| APPROVALS-14 | Approval Card - Approval Step | Current approval level name displayed | functional | high |  |  |  |  |
| APPROVALS-15 | Approval Card Click | Click card → navigate to /requisitions/{id}?from=approvals | navigation | critical |  |  |  |  |
| APPROVALS-16 | Approval Actions - Approve | Button to approve requisition | permission | critical |  |  |  |  |
| APPROVALS-17 | Approval Actions - Reject | Button to reject requisition | permission | critical |  |  |  |  |
| APPROVALS-18 | Approval Actions - Return | Button to return for modification | permission | critical |  |  |  |  |
| APPROVALS-19 | Search Filtering | Type in search → filter pending list | functional | high |  |  |  |  |
| APPROVALS-20 | Filter Persistence | Search remains on tab switch | state | low |  |  |  |  |
| APPROVALS-21 | Clear Filters | Clear search → show full list | functional | low |  |  |  |  |
| APPROVALS-22 | Loading Error | Failed to load → error message with refresh button | state | high |  |  |  |  |
| APPROVALS-23 | Responsive Design | At 375px: approval cards full-width, actions stack | responsive | medium |  |  |  |  |

### APPROVAL ACTION DIALOG
**Part of Approval Card**

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| APPACTION-01 | Approve Dialog - Open | Click "Approve" → dialog opens with req title | functional | critical |  |  |  |  |
| APPACTION-02 | Approve Dialog - Comments | Optional comments field → text accepted | functional | high |  |  |  |  |
| APPACTION-03 | Approve Dialog - Submit | Click "Approve" → POST approve endpoint with optional comments | functional | critical |  |  |  |  |
| APPACTION-04 | Approve Success | Kaizen Admin approved → success toast, card removed from pending | functional | critical |  |  |  |  |
| APPACTION-05 | Approve Loading | While submitting → button disabled | state | medium |  |  |  |  |
| APPACTION-06 | Reject Dialog - Open | Click "Reject" → dialog opens | functional | critical |  |  |  |  |
| APPACTION-07 | Reject Dialog - Reason | Reason field required → validation error if empty | validation | critical |  |  |  |  |
| APPACTION-08 | Reject Dialog - Submit | Click "Reject" → POST reject endpoint with reason | functional | critical |  |  |  |  |
| APPACTION-09 | Reject Success | Kaizen Admin rejected → success toast, card removed | functional | critical |  |  |  |  |
| APPACTION-10 | Reject Loading | While submitting → button disabled | state | medium |  |  |  |  |
| APPACTION-11 | Return Dialog - Open | Click "Return" → dialog opens | functional | critical |  |  |  |  |
| APPACTION-12 | Return Dialog - Changes | "What needs to change?" field required | validation | critical |  |  |  |  |
| APPACTION-13 | Return Dialog - Submit | Click "Return" → POST return endpoint with reason | functional | critical |  |  |  |  |
| APPACTION-14 | Return Success | Kaizen Admin returned → success toast, card removed, requester notified | functional | critical |  |  |  |  |
| APPACTION-15 | Return Loading | While submitting → button disabled | state | medium |  |  |  |  |
| APPACTION-16 | Action Failure | API error during action → error toast shown | functional | high |  |  |  |  |
| APPACTION-17 | Dialog Cancel | Click outside or Cancel button → close without action | functional | high |  |  |  |  |
| APPACTION-18 | Action Optimistic Update | After action → lists immediately refresh | functional | high |  |  |  |  |
| APPACTION-19 | Open Discussion Menu Item | Approval card kebab menu → "Open Discussion" link navigates to /requisitions/{id}/discussion | navigation | medium |  |  |  |  |
| APPACTION-20 | Pending Response Shape | Pending approval card reads flat keys: title, requester, requisition_number, total_amount | functional | critical |  |  |  |  |
| APPACTION-21 | History Response Shape | History approval card reads flat keys: requisition_title, requester_name, decided_at, comments | functional | critical |  |  |  |  |

### APPROVALS HISTORY
**Route:** `/approvals/history`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| APPHIST-01 | Page Load | Fetch approval history via /api/v1/approvals/history → render list | functional | critical |  |  |  |  |
| APPHIST-02 | Empty State | No history → empty-state message | state | medium |  |  |  |  |
| APPHIST-03 | Loading State | While fetching → skeleton placeholders | state | medium |  |  |  |  |
| APPHIST-04 | History Card Display | Each card shows requisition_title, requester_name, decided_at, decision, comments | functional | high |  |  |  |  |
| APPHIST-05 | Decision Badge | Approved → green; Rejected → red; Returned → amber | visual | high |  |  |  |  |
| APPHIST-06 | Card Click | Click card → navigate to /requisitions/{id}?from=approvals | navigation | high |  |  |  |  |
| APPHIST-07 | Search / Filter | If search/filter controls exist → filter history rows | functional | medium |  |  |  |  |
| APPHIST-08 | Flat Response Shape | Card reads flat keys (requisition_title, requester_name), not nested approval.requisition.* | functional | critical |  |  |  |  |
| APPHIST-09 | Responsive Design | At 375px: cards full-width, metadata stacks | responsive | medium |  |  |  |  |


### VENDORS LIST
**Route:** `/vendors`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| VENDORS-01 | Page Header | "Vendors" title and description | functional | low |  |  |  |  |
| VENDORS-02 | Add Vendor Button | Click (if have permission) → sheet opens with form | permission | critical |  |  |  |  |
| VENDORS-03 | Search Input | Type vendor name → filter results | functional | high |  |  |  |  |
| VENDORS-04 | Status Filter | Dropdown: All Statuses / Active / Pending / Suspended / etc. | functional | high |  |  |  |  |
| VENDORS-05 | Filter Clear | Click X on status filter → reset to "All Statuses" | functional | low |  |  |  |  |
| VENDORS-06 | Vendor Card Grid | Display vendors as cards (3-column layout on desktop) | functional | high |  |  |  |  |
| VENDORS-07 | Vendor Card - Name | Vendor company name displayed | functional | high |  |  |  |  |
| VENDORS-08 | Vendor Card - Status | Status badge with appropriate color | functional | high |  |  |  |  |
| VENDORS-09 | Vendor Card - Category | Primary category shown | functional | high |  |  |  |  |
| VENDORS-10 | Vendor Card - Contact | Email and phone numbers shown | functional | medium |  |  |  |  |
| VENDORS-11 | Vendor Card Click | Click card → navigate to /vendors/{id} | navigation | critical |  |  |  |  |
| VENDORS-12 | Empty State - No Vendors | No vendors in org → "No Vendors Found" with CTA | state | medium |  |  |  |  |
| VENDORS-13 | Empty State - No Results | Search/filter returns nothing → empty state with clear option | state | medium |  |  |  |  |
| VENDORS-14 | Loading State | While fetching → skeleton loaders shown | state | medium |  |  |  |  |
| VENDORS-15 | Error State | Failed to load → error message with retry button | state | high |  |  |  |  |
| VENDORS-16 | Vendor Categories - Tags | Show 2 top categories, "+X more" if more than 2 | functional | low |  |  |  |  |
| VENDORS-17 | Add Vendor - Permission | No vendor_write permission → Add button hidden | permission | critical |  |  |  |  |
| VENDORS-18 | Responsive Design | At 375px: 1-column card grid, full-width cards | responsive | medium |  |  |  |  |

### VENDOR DETAIL
**Route:** `/vendors/{id}`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| VENDORDETAIL-01 | Load Vendor | Fetch vendor data → display profile | functional | critical |  |  |  |  |
| VENDORDETAIL-02 | Vendor Name | Display company name as title | functional | high |  |  |  |  |
| VENDORDETAIL-03 | Vendor Status | Display status badge | functional | high |  |  |  |  |
| VENDORDETAIL-04 | Vendor Contact | Email, phone number displayed | functional | high |  |  |  |  |
| VENDORDETAIL-05 | Vendor Categories | List all vendor categories | functional | high |  |  |  |  |
| VENDORDETAIL-06 | Vendor Address | Address displayed | functional | medium |  |  |  |  |
| VENDORDETAIL-07 | Edit Button (if owner) | If user has vendor_write permission → Edit button visible | permission | critical |  |  |  |  |
| VENDORDETAIL-08 | Edit Navigation | Click Edit → navigate to /vendors/{id}/edit or open edit sheet | navigation | high |  |  |  |  |
| VENDORDETAIL-09 | Back Button | Click → navigate to /vendors | navigation | high |  |  |  |  |
| VENDORDETAIL-10 | Not Found | Invalid {id} → error page | state | high |  |  |  |  |
| VENDORDETAIL-11 | Responsive Design | At 375px: single-column layout | responsive | medium |  |  |  |  |

### VENDOR FORM (Create/Edit Sheet)
**Surface:** Sheet opened from `/vendors` (Add Vendor) or `/vendors/{id}` (Edit). Single form component serves both flows.

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| VENDORFORM-01 | Form Pre-fill (Edit) | Open sheet from existing vendor → all fields pre-populated | functional | critical |  |  |  |  |
| VENDORFORM-02 | Empty Form (Create) | Open sheet from Add button → fields blank | state | high |  |  |  |  |
| VENDORFORM-03 | Tabs Layout | TabsList renders 4 tabs (general / contact / banking / attachments or similar) | functional | high |  |  |  |  |
| VENDORFORM-04 | Mobile Tab Layout | At 375px: TabsList is grid-cols-2 (wraps to 2 rows), not 4 | responsive | high |  |  |  |  |
| VENDORFORM-05 | Name & Code | Company name and code fields required; validation error if empty | validation | critical |  |  |  |  |
| VENDORFORM-06 | Email / Phone / Website | Free-text fields with icon prefix; email validated on submit | validation | high |  |  |  |  |
| VENDORFORM-07 | Address Multi-field | Street / City / State / Country / Postal — all captured | functional | high |  |  |  |  |
| VENDORFORM-08 | Designation Select | Dropdown (not free text) for designation | functional | medium |  |  |  |  |
| VENDORFORM-09 | Payment Terms Select | Dropdown (not free text) for payment terms | functional | medium |  |  |  |  |
| VENDORFORM-10 | Preferred Ordering Method | Select dropdown (options include Email, Portal, EDI, etc.); value submitted on save | functional | high |  |  |  |  |
| VENDORFORM-11 | Certifications Chip Editor | Input + "Add" button; pressing Add creates a chip; chips removable with X | functional | high |  |  |  |  |
| VENDORFORM-12 | Certifications Persist | Chips present at save time are included in the certifications payload | functional | critical |  |  |  |  |
| VENDORFORM-13 | Supporting Documents Picker | File input accepts multiple files; each appears as a row below the input | functional | high |  |  |  |  |
| VENDORFORM-14 | Supporting Documents Remove | Click X on a pending file → removed from upload queue | functional | high |  |  |  |  |
| VENDORFORM-15 | Upload-Before-Save Sequence | On submit: each selected file POSTed to /api/v1/documents/upload (multipart), resulting URLs attached to vendor before vendor create/update fires | functional | critical |  |  |  |  |
| VENDORFORM-16 | Upload Failure Handling | A file fails upload → toast with filename, vendor save still proceeds without that attachment | functional | high |  |  |  |  |
| VENDORFORM-17 | Submit Create | Click Save on new vendor → POST /vendors, success toast, sheet closes, list refreshes | functional | critical |  |  |  |  |
| VENDORFORM-18 | Submit Edit | Click Save on existing vendor → PUT /vendors/{id}, success toast, sheet closes | functional | critical |  |  |  |  |
| VENDORFORM-19 | Submit Failure | API error on submit → error message visible; sheet remains open | functional | high |  |  |  |  |
| VENDORFORM-20 | Cancel Button | Click Cancel → sheet closes, unsaved changes discarded (no guard) | functional | medium |  |  |  |  |
| VENDORFORM-21 | Vendor Approve Action (Detail) | On /vendors/{id}: Approve button calls useApproveVendorApi…Approve endpoint, not a generic PUT with status | functional | critical |  |  |  |  |
| VENDORFORM-22 | Approve Notes Dialog | Click Approve → dialog prompts for optional approval notes → POST with notes included | functional | high |  |  |  |  |


### USERS LIST
**Route:** `/users`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| USERS-01 | Page Header | "Team Members" title, description | functional | low |  |  |  |  |
| USERS-02 | Add User Button | Click → sheet opens with user form | functional | critical |  |  |  |  |
| USERS-03 | Stats Cards | Total, Active, Pending user counts displayed | functional | high |  |  |  |  |
| USERS-04 | Search Input | Type name or email → filter users | functional | high |  |  |  |  |
| USERS-05 | Status Buttons | Filter buttons: All, Active, Pending, Inactive | functional | high |  |  |  |  |
| USERS-06 | Users Grouped by Role | Users sorted and grouped by organization role | functional | high |  |  |  |  |
| USERS-07 | User Row - Name | First name + last name displayed | functional | high |  |  |  |  |
| USERS-08 | User Row - Email | Email or username shown | functional | high |  |  |  |  |
| USERS-09 | User Row - Status Badge | Status badge with appropriate color | functional | high |  |  |  |  |
| USERS-10 | User Actions Menu | Click "..." → Edit / Remove options | functional | high |  |  |  |  |
| USERS-11 | User Edit | Click Edit → sheet opens with form | functional | high |  |  |  |  |
| USERS-12 | User Delete | Click Remove → confirmation dialog | functional | critical |  |  |  |  |
| USERS-13 | Pagination | More than 10 users → pagination controls shown | functional | high |  |  |  |  |
| USERS-14 | Empty State | No users → "No Team Members Found" with CTA | state | medium |  |  |  |  |
| USERS-15 | Loading State | While loading → skeleton loaders shown | state | medium |  |  |  |  |
| USERS-16 | Error State | Failed to load → error message with retry | state | high |  |  |  |  |
| USERS-17 | Search Debounce | Typing → API search called with debounce | functional | high |  |  |  |  |
| USERS-18 | Responsive Design | At 375px: 1-column layout, actions in dropdown | responsive | medium |  |  |  |  |

### BUDGET TRACKING
**Route:** `/budget`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| BUDGET-01 | Page Header | "Budget" title | functional | low |  |  |  |  |
| BUDGET-02 | Fiscal Year Filter | Dropdown to select fiscal year | functional | critical |  |  |  |  |
| BUDGET-03 | Budget Summary | Total budgets, allocated, committed, available displayed | functional | high |  |  |  |  |
| BUDGET-04 | Budget List - Table | Table: Code, Name, Total, Committed, Actual, Available, % Utilization | functional | high |  |  |  |  |
| BUDGET-05 | Budget Rows - Clickable | Click row → navigate to detail or show details panel | navigation | high |  |  |  |  |
| BUDGET-06 | Budget Utilization Progress | Visual progress bar showing utilization % | functional | high |  |  |  |  |
| BUDGET-07 | Budget Status Badge | Active / Frozen / Closed status shown | functional | high |  |  |  |  |
| BUDGET-08 | Sorting - Column Headers | Click column header → sort ascending/descending | functional | high |  |  |  |  |
| BUDGET-09 | Filtering - Search | Search by budget code or name | functional | high |  |  |  |  |
| BUDGET-10 | Pagination | Many budgets → pagination controls shown | functional | high |  |  |  |  |
| BUDGET-11 | Empty State | No budgets for FY → "No budgets" message | state | medium |  |  |  |  |
| BUDGET-12 | Loading State | While fetching → skeleton loaders shown | state | medium |  |  |  |  |
| BUDGET-13 | Error State | Failed to load → error message with retry | state | high |  |  |  |  |
| BUDGET-14 | Responsive Design | At 375px: table horizontal scroll, limited columns | responsive | medium |  |  |  |  |

### NOTIFICATIONS
**Route:** `/notifications`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| NOTIF-01 | Notification List | Display all notifications for the current user, newest first | functional | high |  |  |  |  |
| NOTIF-02 | Item - Type Icon | Icon or colored dot varies by notification type (approval / requisition / comment / system) | functional | high |  |  |  |  |
| NOTIF-03 | Item - Message | Short title + description of the event | functional | high |  |  |  |  |
| NOTIF-04 | Item - Timestamp | Relative time (e.g., "2h ago") or absolute date | functional | high |  |  |  |  |
| NOTIF-05 | Click to Navigate | Click notification → route to the subject (requisition detail, approval page, etc.) | navigation | high |  |  |  |  |
| NOTIF-08 | Real-time SSE | New notifications arrive via EventSource without a page refresh | functional | critical |  |  |  |  |
| NOTIF-09 | Empty State | No notifications → empty-state message | state | low |  |  |  |  |
| NOTIF-10 | Responsive Design | At 375px: full-width list, touch-friendly rows | responsive | low |  |  |  |  |


### ANALYTICS
**Route:** `/analytics`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ANALYTICS-01 | Page Header | "Analytics" title renders | functional | low |  |  |  |  |
| ANALYTICS-02 | Kaizen Admin Statistics Block | "Kaizen Admin Statistics" section renders (current implementation is a simple KPI block, not a chart suite) | functional | high |  |  |  |  |
| ANALYTICS-03 | KPI Values | Any numeric KPIs present on the page show real org data (not hardcoded) | functional | high |  |  |  |  |
| ANALYTICS-04 | Permission Gating | Users without analytics permission cannot access route | permission | high |  |  |  |  |
| ANALYTICS-05 | Responsive Design | Page content adapts cleanly at 375px (grid stacks to 1 column) | responsive | medium |  |  |  |  |


### SETTINGS
**Route:** `/settings`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| SETTINGS-01 | Page Load | Page renders with Tabs: Profile / Security / Organization / Billing | functional | high |  |  |  |  |
| SETTINGS-02 | Default Tab | "Profile" tab active by default | state | medium |  |  |  |  |
| SETTINGS-03 | Tab Switching | Click each tab → content swaps; active tab persists | functional | high |  |  |  |  |
| SETTINGS-04 | Profile Tab Content | Profile tab renders user name, email, avatar, and any profile edit controls that exist | functional | high |  |  |  |  |
| SETTINGS-05 | Security Tab Content | Security tab renders current security controls (e.g. password change link/form) | functional | high |  |  |  |  |
| SETTINGS-06 | Organization Tab Content | Organization tab renders org-level info including Team Management block | functional | high |  |  |  |  |
| SETTINGS-07 | Billing Tab Content | Billing tab renders "Manage Your Subscription" block + billing details that exist | functional | high |  |  |  |  |
| SETTINGS-08 | Permission Gating | Non-admin roles see only tabs they have permission for (verify per role) | permission | high |  |  |  |  |
| SETTINGS-09 | Responsive Design | At 375px: tabs wrap or scroll; content stacks single-column | responsive | medium |  |  |  |  |


### SUBSCRIPTION SETTINGS
**Route:** `/settings/subscription`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| SUBSETTINGS-01 | Current Plan | Display current subscription plan | functional | high |  |  |  |  |
| SUBSETTINGS-02 | Plan Details | Features included, limits, billing cycle | functional | high |  |  |  |  |
| SUBSETTINGS-03 | Billing History | Table of past invoices with download links | functional | high |  |  |  |  |
| SUBSETTINGS-04 | Upgrade/Downgrade | Link to change plan (if allowed) | functional | high |  |  |  |  |
| SUBSETTINGS-05 | Cancel Subscription | Link/button to cancel subscription | functional | high |  |  |  |  |
| SUBSETTINGS-06 | Responsive Design | At 375px: tables scroll horizontally | responsive | medium |  |  |  |  |

### SUBSCRIPTION PAGE (Org Level)
**Route:** `/subscription`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| SUB-01 | Plan Pricing Cards | Display available plans with pricing | functional | high |  |  |  |  |
| SUB-02 | Plan Selection | Click "Select Plan" → trigger purchase flow | functional | high |  |  |  |  |
| SUB-03 | Feature Comparison | Table showing features across plans | functional | high |  |  |  |  |
| SUB-04 | Current Plan Badge | "Current Plan" badge on active plan | state | high |  |  |  |  |
| SUB-05 | Responsive Design | Cards stack 1-column at 375px | responsive | medium |  |  |  |  |

---

## CONFIGURATION SCREENS

### CONFIGURATION HUB
**Route:** `/configuration`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| CONFIG-01 | Page Header | "Configuration" title, description | functional | low |  |  |  |  |
| CONFIG-02 | Section Cards Grid | 10 configuration sections displayed | functional | high |  |  |  |  |
| CONFIG-03 | Section Card Hover | Hover → shadow/scale effect, ArrowUpRight icon animates | visual | low |  |  |  |  |
| CONFIG-04a | Nav — Approval Levels | Click card → navigate to /configuration/approval-levels | navigation | critical |  |  |  |  |
| CONFIG-04b | Nav — Default Approvers | Click card → navigate to /configuration/default-approvers | navigation | critical |  |  |  |  |
| CONFIG-04c | Nav — Committees | Click card → navigate to /configuration/committees | navigation | critical |  |  |  |  |
| CONFIG-04d | Nav — Budget Rules | Click card → navigate to /configuration/budget-rules | navigation | critical |  |  |  |  |
| CONFIG-04e | Nav — Budgets | Click card → navigate to /configuration/budgets | navigation | critical |  |  |  |  |
| CONFIG-04f | Nav — Allocation Rules | Click card → navigate to /configuration/allocation-rules | navigation | critical |  |  |  |  |
| CONFIG-04g | Nav — Accounting | Click card → navigate to /configuration/accounting | navigation | critical |  |  |  |  |
| CONFIG-04h | Nav — Workflow | Click card → navigate to /configuration/workflow | navigation | critical |  |  |  |  |
| CONFIG-04i | Nav — Policy | Click card → navigate to /configuration/policy | navigation | critical |  |  |  |  |
| CONFIG-04j | Nav — Fiscal Year | Click card → navigate to /configuration/fiscal-year | navigation | critical |  |  |  |  |
| CONFIG-05 | Icon Symbols | Each section has distinct icon | visual | low |  |  |  |  |
| CONFIG-06 | Section Descriptions | Each card has concise description | functional | low |  |  |  |  |
| CONFIG-07 | Responsive Grid | At 375px: 1-column, at 768px: 2-column, at 1024px: 3-column | responsive | medium |  |  |  |  |

The following 10 configuration subsections follow similar patterns (list → create/edit dialog/sheet):

### APPROVAL LEVELS
**Route:** `/configuration/approval-levels`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| AL-01 | List Approval Levels | Display all approval levels for org | functional | high |  |  |  |  |
| AL-02 | Add Level | Click "Add" → form/dialog opens | functional | high |  |  |  |  |
| AL-03 | Level Name | Enter level name (e.g., "Manager", "Finance") | functional | high |  |  |  |  |
| AL-04 | Approval Threshold | Set amount threshold for this level | functional | critical |  |  |  |  |
| AL-05 | Approvers Selection | Multi-select or add approvers by role | functional | critical |  |  |  |  |
| AL-06 | Submit Level | Click Save → POST approval level | functional | critical |  |  |  |  |
| AL-07 | Edit Level | Click Edit → form opens, modify and save | functional | high |  |  |  |  |
| AL-08 | Delete Level | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| AL-09 | Order/Sequence | Approval levels follow order | functional | high |  |  |  |  |
| AL-10 | Empty State | No levels → "No approval levels configured" | state | low |  |  |  |  |

### DEFAULT APPROVERS
**Route:** `/configuration/default-approvers`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| DA-01 | List Default Approvers | Display fallback approvers | functional | high |  |  |  |  |
| DA-02 | Add Approver | Click "Add" → user/role selector | functional | high |  |  |  |  |
| DA-03 | Select Approver | Multi-select users who can approve | functional | critical |  |  |  |  |
| DA-04 | Submit Approvers | Click Save → update default approvers | functional | critical |  |  |  |  |
| DA-05 | Edit Approvers | Modify selection and save | functional | high |  |  |  |  |
| DA-06 | Remove Approver | Click remove → confirma and delete | functional | high |  |  |  |  |

### COMMITTEES
**Route:** `/configuration/committees`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| COMM-01 | List Committees | Display all committees | functional | high |  |  |  |  |
| COMM-02 | Add Committee | Click "Add" → form opens | functional | high |  |  |  |  |
| COMM-03 | Committee Name | Enter committee name | functional | high |  |  |  |  |
| COMM-04 | Committee Members | Add/remove committee members | functional | critical |  |  |  |  |
| COMM-05 | Voting Rules | Select voting method (unanimous, majority, etc.) | functional | high |  |  |  |  |
| COMM-06 | Submit Committee | Click Save → POST committee | functional | critical |  |  |  |  |
| COMM-07 | Edit Committee | Modify name/members/rules → save | functional | high |  |  |  |  |
| COMM-08 | Delete Committee | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| COMM-09 | Member Count | Show number of members on card | functional | low |  |  |  |  |

### BUDGET RULES
**Route:** `/configuration/budget-rules`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| BR-01 | List Budget Rules | Display all budget validation rules | functional | high |  |  |  |  |
| BR-02 | Add Rule | Click "Add" → form opens | functional | high |  |  |  |  |
| BR-03 | Rule Name | Enter rule name | functional | high |  |  |  |  |
| BR-04 | Budget Code | Select or enter budget code to apply rule | functional | critical |  |  |  |  |
| BR-05 | Rule Condition | Set condition (e.g., "Amount > X", "Category = Y") | functional | critical |  |  |  |  |
| BR-06 | Rule Action | Select action if violated (approve, warn, block) | functional | critical |  |  |  |  |
| BR-07 | Submit Rule | Click Save → POST rule | functional | critical |  |  |  |  |
| BR-08 | Edit Rule | Modify and save | functional | high |  |  |  |  |
| BR-09 | Delete Rule | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| BR-10 | Rule Status | Enable/disable rule toggle | functional | high |  |  |  |  |

### BUDGETS
**Route:** `/configuration/budgets`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| BUDS-01 | List Budgets | Display all budgets with status, FY, amount | functional | high |  |  |  |  |
| BUDS-02 | Add Budget | Click "Add" → form opens | functional | critical |  |  |  |  |
| BUDS-03 | Budget Code | Enter unique budget code | validation | critical |  |  |  |  |
| BUDS-04 | Budget Name | Enter budget name | functional | critical |  |  |  |  |
| BUDS-05 | Total Amount | Enter total budget amount | functional | critical |  |  |  |  |
| BUDS-06 | Currency | Select currency | functional | high |  |  |  |  |
| BUDS-07 | Fiscal Year | Select fiscal year (if applicable) | functional | critical |  |  |  |  |
| BUDS-08 | Cost Center | Assign to cost center | functional | high |  |  |  |  |
| BUDS-09 | Overrun Tolerance | Set % tolerance for budget overruns | functional | high |  |  |  |  |
| BUDS-10 | Submit Budget | Click Save → POST budget | functional | critical |  |  |  |  |
| BUDS-11 | Edit Budget | Modify and save | functional | high |  |  |  |  |
| BUDS-12 | Delete Budget | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| BUDS-13 | Upload Budgets | Click "Upload" → file picker, bulk CSV import | functional | high |  |  |  |  |
| BUDS-14 | Upload Template | Download CSV template → fill and upload | functional | high |  |  |  |  |
| BUDS-15 | Budget Status Badge | Draft / Active / Frozen / Closed / Archived | functional | high |  |  |  |  |
| BUDS-16 | Budget Utilization | Show % used, warning if > threshold | functional | high |  |  |  |  |

### ALLOCATION RULES
**Route:** `/configuration/allocation-rules`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ALLOC-01 | List Rules | Display budget allocation rules | functional | high |  |  |  |  |
| ALLOC-02 | Add Rule | Click "Add" → form opens | functional | high |  |  |  |  |
| ALLOC-03 | Budget Selection | Select budget to allocate | functional | critical |  |  |  |  |
| ALLOC-04 | Period Type | Select period (Monthly, Quarterly, Annual) | functional | critical |  |  |  |  |
| ALLOC-05 | Split Percentages | Enter % allocation per period/department | functional | critical |  |  |  |  |
| ALLOC-06 | Departments | Multi-select departments to allocate to | functional | critical |  |  |  |  |
| ALLOC-07 | Submit Rule | Click Save → POST allocation rule | functional | critical |  |  |  |  |
| ALLOC-08 | Edit Rule | Modify and save | functional | high |  |  |  |  |
| ALLOC-09 | Delete Rule | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| ALLOC-10 | Validation | % total must equal 100% → error if not | validation | critical |  |  |  |  |

### ACCOUNTING
**Route:** `/configuration/accounting`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ACC-01 | ERP Integration Status | Display connected ERP system name | state | high |  |  |  |  |
| ACC-02 | Default Currency | Select org default currency | functional | critical |  |  |  |  |
| ACC-03 | Supported Currencies | List of accepted currencies | functional | high |  |  |  |  |
| ACC-04 | Tax Configuration | Enter tax rates (if applicable) | functional | high |  |  |  |  |
| ACC-05 | PO Generation | Toggle PO auto-generation on requisition approval | functional | high |  |  |  |  |
| ACC-06 | Payment Terms | Set default payment terms | functional | high |  |  |  |  |
| ACC-07 | Accounting Codes Mapping | Map budget codes to GL accounts | functional | high |  |  |  |  |
| ACC-08 | Save Configuration | Click Save → update accounting config | functional | critical |  |  |  |  |
| ACC-09 | Test Connection | Button to test ERP connectivity | functional | high |  |  |  |  |

### WORKFLOW
**Route:** `/configuration/workflow`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| WF-01 | Workflow Steps | Display current workflow stages in order | functional | high |  |  |  |  |
| WF-02 | Add Step | Click "Add Step" → dialog opens | functional | high |  |  |  |  |
| WF-03 | Step Name | Enter step name (e.g., "Budget Check", "Approval") | functional | critical |  |  |  |  |
| WF-04 | Trigger Conditions | Set conditions that trigger this step | functional | critical |  |  |  |  |
| WF-05 | Automatic Actions | Set automation (auto-approve if < threshold, etc.) | functional | high |  |  |  |  |
| WF-06 | Manual Actions | Define manual actions (approve, reject, return) | functional | high |  |  |  |  |
| WF-07 | Timeout Config | Set timeout before escalation | functional | high |  |  |  |  |
| WF-08 | Reorder Steps | Drag to reorder workflow steps | functional | high |  |  |  |  |
| WF-09 | Submit Workflow | Click Save → POST workflow definition | functional | critical |  |  |  |  |
| WF-10 | Validate Workflow | At least 1 step required → error if none | validation | critical |  |  |  |  |

### POLICY
**Route:** `/configuration/policy`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| POL-01 | Vendor Quote Policy | Toggle require vendor quotes | functional | high |  |  |  |  |
| POL-02 | Quote Threshold | Set minimum amount requiring 2+ quotes | functional | critical |  |  |  |  |
| POL-03 | Competitive Bidding | Set minimum bidders required | functional | high |  |  |  |  |
| POL-04 | Vendor Approval | Toggle require vendor approval before requisition | functional | high |  |  |  |  |
| POL-05 | Blacklist Policy | Toggle vendor blacklist enforcement | functional | high |  |  |  |  |
| POL-06 | Payment Terms Policy | Set standard payment terms requirements | functional | high |  |  |  |  |
| POL-07 | Attachment Requirements | Specify required attachment types | functional | high |  |  |  |  |
| POL-08 | Save Policy | Click Save → update org policy | functional | critical |  |  |  |  |

### FISCAL YEAR
**Route:** `/configuration/fiscal-year`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| FY-01 | Config Form | Display fiscal year configuration settings | functional | high |  |  |  |  |
| FY-02 | Start Month | Select fiscal year start month (1-12) | functional | critical |  |  |  |  |
| FY-03 | Start Day | Select day of month (1-31) | functional | critical |  |  |  |  |
| FY-04 | End Month | Select end month | functional | critical |  |  |  |  |
| FY-05 | End Day | Select end day | functional | critical |  |  |  |  |
| FY-06 | Period Type | Select: Monthly, Quarterly, Annual | functional | critical |  |  |  |  |
| FY-07 | Code Prefix | Enter FY code prefix (e.g., "FY") | functional | high |  |  |  |  |
| FY-08 | Name Template | Template for FY naming (e.g., "FY {year}") | functional | high |  |  |  |  |
| FY-09 | Rollover Config | Toggle budget rollover to next FY | functional | high |  |  |  |  |
| FY-10 | Rollover Type | Select: Carryforward, Fresh, Percentage | functional | high |  |  |  |  |
| FY-11 | Auto-create Config | Toggle auto-create new FYs | functional | high |  |  |  |  |
| FY-12 | Auto-create Months | Specify months ahead to auto-create | functional | high |  |  |  |  |
| FY-13 | Save Config | Click Save → POST fiscal year config | functional | critical |  |  |  |  |
| FY-14 | Fiscal Years List | Table of all FYs with status | functional | high |  |  |  |  |
| FY-15 | Activate FY | Click "Activate" button on FY row | functional | critical |  |  |  |  |
| FY-16 | Create New FY | Manual button to create new fiscal year | functional | high |  |  |  |  |
| FY-17 | FY Status Badge | Active / Inactive / Closed status shown | functional | high |  |  |  |  |
| FY-18 | Validation | Start date < end date → error if not | validation | critical |  |  |  |  |

---

## ADMIN SCREENS

### ADMIN DASHBOARD
**Route:** `/admin`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMINDASH-01 | Page Header | "Dashboard" title, welcome message | functional | low |  |  |  |  |
| ADMINDASH-02 | Date Display | Current date shown (e.g., "Monday, April 19, 2026") | state | low |  |  |  |  |
| ADMINDASH-03 | Total Users KPI | Card shows total user count | functional | high |  |  |  |  |
| ADMINDASH-04 | Organizations KPI | Card shows total org count | functional | high |  |  |  |  |
| ADMINDASH-05 | Active Users KPI | Card shows active users in last 30 days | functional | high |  |  |  |  |
| ADMINDASH-06 | Roles KPI | Card shows total roles | functional | high |  |  |  |  |
| ADMINDASH-07 | KPI Loading State | While loading → skeleton loaders shown | state | medium |  |  |  |  |
| ADMINDASH-08 | Quick Actions | Buttons for Manage Users, Accounts, Roles, Settings | functional | high |  |  |  |  |
| ADMINDASH-09 | Quick Action Navigation | Click action → navigate to /admin/X | navigation | high |  |  |  |  |
| ADMINDASH-10 | Recent Users List | Show 5 recent users with status | functional | high |  |  |  |  |
| ADMINDASH-11 | Recent Orgs List | Show 5 recent organizations | functional | high |  |  |  |  |
| ADMINDASH-12 | View All Links | "View All" links to users and accounts pages | navigation | high |  |  |  |  |

### ADMIN ACCOUNTS (ORGANIZATIONS)
**Route:** `/admin/accounts`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMACCTS-01 | List Accounts | Display all organizations | functional | high |  |  |  |  |
| ADMACCTS-02 | Account Card - Name | Organization name displayed | functional | high |  |  |  |  |
| ADMACCTS-03 | Account Card - Type | Organization type shown | functional | medium |  |  |  |  |
| ADMACCTS-04 | Account Card - Status | Active / Suspended / Archived status | functional | high |  |  |  |  |
| ADMACCTS-05 | Account Card Click | Click → view account details or open edit | navigation | high |  |  |  |  |
| ADMACCTS-06 | Search Accounts | Type org name → filter results | functional | high |  |  |  |  |
| ADMACCTS-07 | Filter by Status | Dropdown to filter by account status | functional | high |  |  |  |  |
| ADMACCTS-08 | Empty State | No accounts → "No Accounts Found" | state | low |  |  |  |  |
| ADMACCTS-09 | Responsive Design | At 375px: card grid 1-column | responsive | medium |  |  |  |  |

### ADMIN USERS
**Route:** `/admin/users`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMINUSERS-01 | List Users | Display all users across all orgs | functional | high |  |  |  |  |
| ADMINUSERS-02 | User Row - Name | First + last name displayed | functional | high |  |  |  |  |
| ADMINUSERS-03 | User Row - Org | Organization user belongs to | functional | high |  |  |  |  |
| ADMINUSERS-04 | User Row - Status | User status badge | functional | high |  |  |  |  |
| ADMINUSERS-05 | User Row - Created | Account creation date | functional | low |  |  |  |  |
| ADMINUSERS-06 | Search Users | Type name/email/org → filter | functional | high |  |  |  |  |
| ADMINUSERS-07 | Filter by Status | Dropdown to filter by user status | functional | high |  |  |  |  |
| ADMINUSERS-08 | User Actions | Click "..." → Disable/Deactivate/Delete options | permission | critical |  |  |  |  |
| ADMINUSERS-09 | Disable User | Click Disable → confirmation, user deactivated | functional | critical |  |  |  |  |
| ADMINUSERS-10 | Pagination | Many users → pagination controls | functional | high |  |  |  |  |
| ADMINUSERS-11 | Empty State | No users → "No Users Found" | state | low |  |  |  |  |
| ADMINUSERS-12 | Responsive Design | At 375px: table horizontal scroll | responsive | medium |  |  |  |  |

### ADMIN BILLING
**Route:** `/admin/billing`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMBILL-01 | Billing Dashboard | Display revenue/usage overview | functional | high |  |  |  |  |
| ADMBILL-02 | Invoices List | Table of all invoices | functional | high |  |  |  |  |
| ADMBILL-03 | Invoice - Org | Organization name | functional | high |  |  |  |  |
| ADMBILL-04 | Invoice - Amount | Invoice amount and currency | functional | high |  |  |  |  |
| ADMBILL-05 | Invoice - Status | Paid / Pending / Overdue status | functional | high |  |  |  |  |
| ADMBILL-06 | Invoice - Date | Invoice date | functional | high |  |  |  |  |
| ADMBILL-07 | Filter by Status | Dropdown to filter invoices | functional | high |  |  |  |  |
| ADMBILL-08 | Download Invoice | Click → PDF download | functional | high |  |  |  |  |
| ADMBILL-09 | Search Invoices | Search by org name or invoice number | functional | high |  |  |  |  |

### ADMIN ROLES
**Route:** `/admin/roles`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMROLES-01 | List Roles | Display all platform and org roles | functional | high |  |  |  |  |
| ADMROLES-02 | Add Role | Click "Add" → form opens | functional | high |  |  |  |  |
| ADMROLES-03 | Role Name | Enter role name (e.g., "Finance Manager") | functional | high |  |  |  |  |
| ADMROLES-04 | Role Permissions | Multi-select permissions for role | functional | critical |  |  |  |  |
| ADMROLES-05 | Permission Scope | Select permission scope (Organization / Platform) | functional | critical |  |  |  |  |
| ADMROLES-06 | Submit Role | Click Save → POST role | functional | critical |  |  |  |  |
| ADMROLES-07 | Edit Role | Click Edit → modify permissions → save | functional | high |  |  |  |  |
| ADMROLES-08 | Delete Role | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| ADMROLES-09 | Role - User Count | Show number of users with role | functional | low |  |  |  |  |
| ADMROLES-10 | Permissions List | Expandable list of available permissions | functional | high |  |  |  |  |

### ADMIN PAYMENT CONFIG
**Route:** `/admin/payment-config`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMPAY-01 | Payment Methods | List configured payment methods | functional | high |  |  |  |  |
| ADMPAY-02 | Add Payment Method | Click "Add" → form opens | functional | high |  |  |  |  |
| ADMPAY-03 | Select Provider | Dropdown: Stripe, PayPal, M-Pesa, etc. | functional | critical |  |  |  |  |
| ADMPAY-04 | API Keys | Enter API key/secret (masked display) | functional | critical |  |  |  |  |
| ADMPAY-05 | Test Connection | Button to verify credentials | functional | high |  |  |  |  |
| ADMPAY-06 | Submit Config | Click Save → save payment method | functional | critical |  |  |  |  |
| ADMPAY-07 | Delete Method | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| ADMPAY-08 | Default Method | Mark payment method as default | functional | high |  |  |  |  |
| ADMPAY-09 | Webhook Config | Webhook URL and setup instructions | functional | high |  |  |  |  |

### ADMIN SUBSCRIPTIONS
**Route:** `/admin/subscriptions`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMSUB-01 | List Subscriptions | Display all org subscriptions | functional | high |  |  |  |  |
| ADMSUB-02 | Sub - Org | Organization name | functional | high |  |  |  |  |
| ADMSUB-03 | Sub - Plan | Current plan name | functional | high |  |  |  |  |
| ADMSUB-04 | Sub - Status | Active / Paused / Cancelled / Expired | functional | high |  |  |  |  |
| ADMSUB-05 | Sub - Start/End Date | Subscription period dates | functional | high |  |  |  |  |
| ADMSUB-06 | Sub - Price | Monthly/annual price | functional | high |  |  |  |  |
| ADMSUB-07 | Filter by Status | Dropdown to filter | functional | high |  |  |  |  |
| ADMSUB-08 | Search | Search by org name | functional | high |  |  |  |  |
| ADMSUB-09 | Modify Subscription | Click Edit → change plan or dates | functional | high |  |  |  |  |
| ADMSUB-10 | Cancel Subscription | Click Cancel → confirmation, cancel | functional | critical |  |  |  |  |
| ADMSUB-11 | Pagination | Many subs → pagination | functional | high |  |  |  |  |

### ADMIN PACKAGES (SUBSCRIPTION PLANS)
**Route:** `/admin/packages`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMPKG-01 | List Packages | Display all subscription plans | functional | high |  |  |  |  |
| ADMPKG-02 | Package Name | Plan name (e.g., "Starter", "Pro", "Enterprise") | functional | high |  |  |  |  |
| ADMPKG-03 | Package Price | Monthly and annual pricing | functional | high |  |  |  |  |
| ADMPKG-04 | Package Features | List of included features | functional | high |  |  |  |  |
| ADMPKG-05 | Add Package | Click "Add" → form opens | functional | high |  |  |  |  |
| ADMPKG-06 | Edit Package | Click Edit → modify details → save | functional | high |  |  |  |  |
| ADMPKG-07 | Delete Package | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| ADMPKG-08 | Package Status | Active / Inactive toggle | functional | high |  |  |  |  |
| ADMPKG-09 | User Limit | Set max users per package | functional | high |  |  |  |  |
| ADMPKG-10 | API Rate Limits | Set API rate limits per package | functional | high |  |  |  |  |

### ADMIN DISCOUNTS
**Route:** `/admin/discounts`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMDISC-01 | List Discounts | Display all active discounts | functional | high |  |  |  |  |
| ADMDISC-02 | Add Discount | Click "Add" → form opens | functional | high |  |  |  |  |
| ADMDISC-03 | Discount Code | Enter unique code | validation | critical |  |  |  |  |
| ADMDISC-04 | Discount Type | Percentage or Fixed amount | functional | critical |  |  |  |  |
| ADMDISC-05 | Discount Value | Enter discount amount/% | functional | critical |  |  |  |  |
| ADMDISC-06 | Valid Period | Set start and end dates | functional | high |  |  |  |  |
| ADMDISC-07 | Usage Limit | Max uses or usage per customer | functional | high |  |  |  |  |
| ADMDISC-08 | Submit Discount | Click Save → POST discount | functional | critical |  |  |  |  |
| ADMDISC-09 | Edit Discount | Modify and save | functional | high |  |  |  |  |
| ADMDISC-10 | Delete Discount | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| ADMDISC-11 | Disable Discount | Toggle active/inactive | functional | high |  |  |  |  |
| ADMDISC-12 | Search Discounts | Search by code | functional | high |  |  |  |  |

### ADMIN OFFERS
**Route:** `/admin/offers`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMOFFERS-01 | List Offers | Display all service offers | functional | high |  |  |  |  |
| ADMOFFERS-02 | Add Offer | Click "Add" → form opens | functional | high |  |  |  |  |
| ADMOFFERS-03 | Offer Name | Enter offer name (required) | validation | critical |  |  |  |  |
| ADMOFFERS-04 | Offer Code | Enter unique code; "Generate" button creates random code | functional | critical |  |  |  |  |
| ADMOFFERS-05 | Service Tier | Select Low / Medium / High | functional | critical |  |  |  |  |
| ADMOFFERS-06 | Unit Price | Enter unit price with currency prefix | functional | critical |  |  |  |  |
| ADMOFFERS-07 | Price Calculator | Toggle "Calculate from total price" → derive unit price from users × total | functional | medium |  |  |  |  |
| ADMOFFERS-08 | Description | Enter offer description | functional | medium |  |  |  |  |
| ADMOFFERS-09 | Submit Offer | Click Save → POST offer | functional | critical |  |  |  |  |
| ADMOFFERS-10 | Edit Offer | Click Edit → pre-fill form, save updates | functional | high |  |  |  |  |
| ADMOFFERS-11 | Delete Offer | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| ADMOFFERS-12 | Search Offers | Search by name or code | functional | medium |  |  |  |  |


### ADMIN SERVICE CATEGORIES
**Route:** `/admin/service-categories`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMCAT-01 | List Categories | Display all vendor service categories | functional | high |  |  |  |  |
| ADMCAT-02 | Add Category | Click "Add" → form opens | functional | high |  |  |  |  |
| ADMCAT-03 | Category Name | Enter category name | functional | critical |  |  |  |  |
| ADMCAT-04 | Category Code | Enter unique code | validation | critical |  |  |  |  |
| ADMCAT-05 | Description | Enter description | functional | high |  |  |  |  |
| ADMCAT-06 | Parent Category | Select parent if subcategory | functional | high |  |  |  |  |
| ADMCAT-07 | Status | Active / Inactive toggle | functional | high |  |  |  |  |
| ADMCAT-08 | Submit Category | Click Save → POST category | functional | critical |  |  |  |  |
| ADMCAT-09 | Edit Category | Modify and save | functional | high |  |  |  |  |
| ADMCAT-10 | Delete Category | Click Delete → confirmation, remove | functional | high |  |  |  |  |
| ADMCAT-11 | Reorder Categories | Drag to organize category tree | functional | medium |  |  |  |  |

### ADMIN SETTINGS
**Route:** `/admin/settings`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ADMSETTINGS-01 | Platform Config | General platform settings | functional | high |  |  |  |  |
| ADMSETTINGS-02 | Enable/Disable Features | Toggles for platform features | functional | high |  |  |  |  |
| ADMSETTINGS-03 | Email Configuration | SMTP settings for email sending | functional | high |  |  |  |  |
| ADMSETTINGS-04 | Logo Upload | Upload platform logo | functional | high |  |  |  |  |
| ADMSETTINGS-05 | Branding | Set platform colors/branding | functional | high |  |  |  |  |
| ADMSETTINGS-06 | Support Email | Configure support contact email | functional | high |  |  |  |  |
| ADMSETTINGS-07 | Save Settings | Click Save → update config | functional | critical |  |  |  |  |
| ADMSETTINGS-08 | Success Toast | "Settings saved" message | functional | critical |  |  |  |  |

---

## APPLICATION SHELL

### SIDEBAR NAVIGATION
**Component:** `AppSidebar`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| SIDEBAR-01 | Menu Items | Display: Dashboard, Kaizen Admins, Approvals, Vendors, Discussions, Users, Settings | functional | high |  |  |  |  |
| SIDEBAR-02 | Active Route Highlight | Current route highlighted in sidebar | state | high |  |  |  |  |
| SIDEBAR-03 | Menu Click Navigation | Click menu item → navigate to route | navigation | critical |  |  |  |  |
| SIDEBAR-04 | Collapse/Expand | Sidebar toggle on mobile/desktop | functional | high |  |  |  |  |
| SIDEBAR-05 | Icons | Each menu item has icon | visual | low |  |  |  |  |
| SIDEBAR-06 | Nested Items | Settings has subitems (Subscription) | functional | high |  |  |  |  |
| SIDEBAR-07 | From Approvals Context | Navigating requisition from approvals → keep Approvals highlighted | state | high |  |  |  |  |
| SIDEBAR-08 | Mobile Responsive | At 375px: sidebar collapsible, hamburger menu | responsive | critical |  |  |  |  |
| SIDEBAR-09 | Sticky Header | Logo/branding visible when collapsed | visual | low |  |  |  |  |
| SIDEBAR-10 | Mobile Trigger | At 375px, SidebarTrigger (hamburger) opens/closes the sidebar drawer | responsive | critical |  |  |  |  |

### HEADER/TOPBAR
**Component:** Part of `DashboardLayout`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| HEADER-01 | Logo | Clickable logo navigates to /admin | navigation | high |  |  |  |  |
| HEADER-02 | Breadcrumbs | Show page hierarchy (if applicable) | functional | high |  |  |  |  |
| HEADER-03 | Currency Selector | Dropdown to change display currency | functional | high |  |  |  |  |
| HEADER-04 | Notification Bell | Icon with unread count badge | functional | high |  |  |  |  |
| HEADER-05 | Notification Bell Click | Click → open notification panel/navigate to /notifications | navigation | high |  |  |  |  |
| HEADER-06 | User Menu | Avatar + name click → dropdown menu | functional | high |  |  |  |  |
| HEADER-07 | User Menu - Profile | Link to user profile/settings | navigation | high |  |  |  |  |
| HEADER-08 | User Menu - Logout | Click → confirm logout, navigate to /login | navigation | critical |  |  |  |  |
| HEADER-09 | App Switcher | Button to switch between apps (if multi-app) | functional | medium |  |  |  |  |
| HEADER-10 | Mode Toggle | Dark/light mode toggle (if supported) | functional | low |  |  |  |  |
| HEADER-11 | Responsive Design | At 375px: header items rearrange, icons inline | responsive | medium |  |  |  |  |

### APP SWITCHER
**Component:** `AppSwitcher`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| APPSW-01 | Switcher Button | Button/icon to open app menu | functional | high |  |  |  |  |
| APPSW-02 | App List | Display available apps (Kaizen Admins, HR, Finance, etc.) | functional | high |  |  |  |  |
| APPSW-03 | Current App Badge | Badge on current app | state | low |  |  |  |  |
| APPSW-04 | App Click | Click app → navigate to that app's home | navigation | critical |  |  |  |  |
| APPSW-05 | Responsive Design | At 375px: switcher accessible in header | responsive | medium |  |  |  |  |

### USER DROPDOWN
**Component:** Part of Header

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| USERDROP-01 | User Avatar | Display user profile picture | functional | high |  |  |  |  |
| USERDROP-02 | User Name | Show user full name | functional | high |  |  |  |  |
| USERDROP-03 | Dropdown Menu | Click avatar → menu appears | functional | high |  |  |  |  |
| USERDROP-04 | Profile Link | Click "Profile" → navigate to settings or profile page | navigation | high |  |  |  |  |
| USERDROP-05 | Logout Link | Click "Logout" → confirmation, logout, redirect to /login | functional | critical |  |  |  |  |
| USERDROP-06 | Account Details | Show email/username in menu | functional | low |  |  |  |  |

---

---

## PUBLIC PAGES

### ABOUT PAGE
**Route:** `/about`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ABOUT-01 | Page Load | /about renders without auth | functional | high |  |  |  |  |
| ABOUT-02 | Public Layout | PublicPageLayout shell renders (top nav, footer) | functional | high |  |  |  |  |
| ABOUT-03 | Content Blocks | Narrative sections (mission / team / etc.) render | functional | medium |  |  |  |  |
| ABOUT-04 | CTA Links | Any sign-up / login CTAs navigate correctly | navigation | medium |  |  |  |  |
| ABOUT-05 | Responsive Design | At 375px: content single-column, nav collapses | responsive | medium |  |  |  |  |

### CONTACT PAGE
**Route:** `/contact`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| CONTACT-01 | Page Load | /contact renders without auth | functional | high |  |  |  |  |
| CONTACT-02 | Contact Form | Fields render (name, email, message); required marked | functional | high |  |  |  |  |
| CONTACT-03 | Form Validation | Missing required field → inline error | validation | high |  |  |  |  |
| CONTACT-04 | Submit | Click Submit → POST contact endpoint (or mailto), success confirmation shown | functional | critical |  |  |  |  |
| CONTACT-05 | Submit Failure | API error → error message surfaced | functional | high |  |  |  |  |
| CONTACT-06 | Responsive Design | At 375px: form full-width single-column | responsive | medium |  |  |  |  |

### FEATURES PAGE
**Route:** `/features`

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| FEATURES-01 | Page Load | /features renders without auth | functional | high |  |  |  |  |
| FEATURES-02 | Feature Grid | Features displayed as cards or sections | functional | high |  |  |  |  |
| FEATURES-03 | CTA Links | "Get Started" / "Sign Up" buttons route correctly | navigation | medium |  |  |  |  |
| FEATURES-04 | Responsive Design | At 375px: grid stacks to 1 column | responsive | medium |  |  |  |  |


## CROSS-CUTTING TEST SCENARIOS

### PERMISSION-BASED VISIBILITY
**Applies to all screens with role-based access**

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| PERM-01 | Kaizen Admin Create | Non-requester role → "New Kaizen Admin" button hidden | permission | critical |  |  |  |  |
| PERM-02 | Kaizen Admin Edit | Non-owner or wrong status → Edit button hidden | permission | critical |  |  |  |  |
| PERM-03 | Kaizen Admin Cancel | Non-owner or wrong status → Cancel button hidden | permission | critical |  |  |  |  |
| PERM-04 | Kaizen Admin Submit | Non-owner or wrong status → Submit button hidden | permission | critical |  |  |  |  |
| PERM-05 | Approvals View | No approval_read permission → /approvals forbidden or empty | permission | critical |  |  |  |  |
| PERM-06 | Approval Actions | No approval_write permission → action buttons hidden | permission | critical |  |  |  |  |
| PERM-07 | Vendors Create | No vendor_write permission → Add Vendor button hidden | permission | critical |  |  |  |  |
| PERM-08 | Discussion Write | No discussions_write permission → comment input shows "read-only" | permission | critical |  |  |  |  |
| PERM-09 | Discussion Delete | Own comment + discussions_delete permission → Delete button shows | permission | high |  |  |  |  |
| PERM-10 | Configuration Access | No config_write permission → configuration pages read-only | permission | critical |  |  |  |  |
| PERM-11 | Users Access | No users_admin permission → /users forbidden | permission | critical |  |  |  |  |
| PERM-12 | Vendors Access | No vendors_read permission → /vendors forbidden | permission | high |  |  |  |  |

### ERROR HANDLING & EDGE CASES

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| ERROR-01 | Network Timeout | Request takes > 30s → show timeout error | state | medium |  |  |  |  |
| ERROR-02 | 404 Resource | Invalid requisition ID → 404 error page | state | high |  |  |  |  |
| ERROR-03 | 403 Forbidden | No permission to view resource → 403 error page | state | critical |  |  |  |  |
| ERROR-04 | API Error 5xx | Server error → error toast with "Try again" button | state | high |  |  |  |  |
| ERROR-05 | Validation Error | Form validation fails → individual field errors shown | validation | critical |  |  |  |  |
| ERROR-07 | Session Expired | Token expires during action → redirect to login | state | critical |  |  |  |  |
| ERROR-09 | File Upload Failed | Upload 1 file → fails → show error for that file, continue upload | functional | high |  |  |  |  |

### RESPONSIVE DESIGN BREAKPOINTS

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| RESP-01 | Mobile 375px | Single-column layouts, vertical stacking | responsive | critical |  |  |  |  |
| RESP-02 | Tablet 768px | Two-column layouts, sidebar collapsible | responsive | critical |  |  |  |  |
| RESP-03 | Desktop 1024px+ | Three+ columns, sidebar always visible | responsive | critical |  |  |  |  |
| RESP-04 | Table Horizontal Scroll | Large tables scroll horizontally on mobile | responsive | high |  |  |  |  |
| RESP-05 | Modal Responsive | Modal 95% width on mobile, centered | responsive | high |  |  |  |  |
| RESP-06 | Button Sizing | Touch targets ≥ 44px on mobile | responsive | medium |  |  |  |  |
| RESP-07 | Form Field Width | Input fields 100% width on mobile | responsive | medium |  |  |  |  |
| RESP-08 | Dialog/Sheet | Use Sheet on mobile (bottom drawer), Dialog on desktop | responsive | high |  |  |  |  |
| RESP-09 | Drawer Slide Animation | Mobile drawer slides from side smoothly | visual | low |  |  |  |  |
| RESP-10 | Tap Target Spacing | 8px+ gap between interactive elements on mobile | responsive | medium |  |  |  |  |

### LOADING & SKELETON STATES

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| LOAD-01 | Skeleton Loaders | While fetching data → skeleton placeholders shown | state | high |  |  |  |  |
| LOAD-02 | Loading Spinner | Loading indicator for forms/buttons → spinner shown | state | high |  |  |  |  |
| LOAD-03 | Upload In-Progress State | File upload running → submitting button label reflects "Uploading…" (no discrete progress bar) | state | medium |  |  |  |  |
| LOAD-04 | Disabled Buttons | While loading → submit buttons disabled | state | high |  |  |  |  |
| LOAD-05 | Loading Toast | Long operations → toast with progress | state | medium |  |  |  |  |
| LOAD-06 | Skeleton Animation | Pulse animation on skeleton loaders | visual | low |  |  |  |  |

### UNDO/CANCEL WORKFLOWS

| Test ID | Area/Component | Test Description | Type | Priority | Status | Tester | Date | Notes |
|---------|----------------|------------------|------|----------|--------|--------|------|-------|
| UNDO-01 | Unsaved Changes | Form has unsaved changes → confirm dialog on back | functional | high |  |  |  |  |
| UNDO-02 | Cancel Confirmation | Click Cancel → "Are you sure?" dialog if changes made | functional | high |  |  |  |  |
| UNDO-03 | Discard Changes | Confirm discard → navigate away without saving | functional | high |  |  |  |  |
| UNDO-04 | Cancel Kaizen Admin | Confirm cancel → confirm reason dialog (optional) | functional | critical |  |  |  |  |
| UNDO-05 | Cancel with Reason | Optional reason field → text saved on cancel | functional | high |  |  |  |  |

---
