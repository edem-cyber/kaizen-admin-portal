# Configuration Endpoints

Per-setting endpoint inventory for the Configuration screen (`/configuration`).
Sections follow the order rendered on the Configuration landing page. For each
persisted setting, the endpoint, HTTP method, and the payload/query field it
maps to are listed.

Read-only list endpoints are not enumerated. Client-side-only UI state
(search, sort, filter toggles) is excluded.

---

## 1. Approval Levels

Route: `/configuration/approval-levels`

- **Create an approval level**
  - Endpoint: `/api/v1/configuration/approval-levels`
  - Method: `POST`
  - Payload fields: `level_name`, `sequence_order`, `threshold_min`, `threshold_max`, `approval_type`, `role`, `role_id`, `user_id`, `user_name`, `description`, `is_active`, `requires_all`, `same_department_required`, `secondary_approval_type`, `secondary_role`, `secondary_role_id`, `secondary_user_id`, `secondary_user_name`, `secondary_budget_category`, `organization_id`

- **Edit an approval level**
  - Endpoint: `/api/v1/configuration/approval-levels/{levelId}`
  - Method: `PUT`
  - Payload fields: `level_name`, `sequence_order`, `threshold_min`, `threshold_max`, `approval_type`, `role`, `role_id`, `user_id`, `user_name`, `description`, `is_active`, `requires_all`, `same_department_required`, `secondary_approval_type`, `secondary_role`, `secondary_role_id`, `secondary_user_id`, `secondary_user_name`, `secondary_budget_category`

- **Delete an approval level**
  - Endpoint: `/api/v1/configuration/approval-levels/{levelId}`
  - Method: `DELETE`

---

## 2. Default Approvers

Route: `/configuration/default-approvers`

- **Create the default fallback approver**
  - Endpoint: `/api/v1/configuration/organizations/{organizationId}/default-approver`
  - Method: `POST`
  - Payload fields: `approval_type`, `role`, `user_id`, `user_name`, `description`

- **Update the default fallback approver**
  - Endpoint: `/api/v1/configuration/organizations/{organizationId}/default-approver/{approverId}`
  - Method: `PUT`
  - Payload fields: `approval_type`, `role`, `user_id`, `user_name`, `description`, `is_active`

- **Remove the default approver**
  - Endpoint: `/api/v1/configuration/organizations/{organizationId}/default-approver/{approverId}`
  - Method: `DELETE`

---

## 3. Committees

Route: `/configuration/committees`

### Committee Settings (organization-wide)

- **Use committee review**
  - Endpoint: `/api/v1/configuration/{organizationId}/committee-settings`
  - Method: `PATCH`
  - Payload field: `uses_committee_review`

- **Committee review threshold**
  - Endpoint: `/api/v1/configuration/{organizationId}/committee-settings`
  - Method: `PATCH`
  - Payload field: `committee_review_threshold`

- **Committee type**
  - Endpoint: `/api/v1/configuration/{organizationId}/committee-settings`
  - Method: `PATCH`
  - Payload field: `committee_type`

- **Use post-committee approval**
  - Endpoint: `/api/v1/configuration/{organizationId}/committee-settings`
  - Method: `PATCH`
  - Payload field: `uses_post_committee_approval`

- **Post-committee threshold**
  - Endpoint: `/api/v1/configuration/{organizationId}/committee-settings`
  - Method: `PATCH`
  - Payload field: `post_committee_threshold`

### Committees (CRUD)

- **Create a committee**
  - Endpoint: `/api/v1/committees`
  - Method: `POST`
  - Payload fields: `name`, `committee_type`, `description`, `chairperson_id`, `quorum`, `meeting_frequency`, `members`, `organization_id`

- **Edit a committee**
  - Endpoint: `/api/v1/committees/{committeeId}`
  - Method: `PATCH`
  - Payload fields: `name`, `committee_type`, `description`, `chairperson_id`, `quorum`, `meeting_frequency`, `is_active`

- **Update committee members**
  - Endpoint: `/api/v1/committees/{committeeId}/members`
  - Method: `PATCH`
  - Payload fields: `add_members`, `remove_members`

- **Delete a committee**
  - Endpoint: `/api/v1/committees/{committeeId}`
  - Method: `DELETE`

---

## 4. Budget Rules

Route: `/configuration/budget-rules`

All fields on this page are persisted via the organization accounting-config
endpoint.

- **Budget source (where to read budget totals)**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `budget_mode`

- **Utilization source (where consumption is measured)**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `budget_utilization_mode`

- **Require budget lines**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `require_budget_lines`

- **Allow budget override**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `allow_budget_override`

- **Warning threshold (%)**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `budget_warning_threshold`

- **Freeze threshold (%)**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `budget_freeze_threshold`

- **Require cost center**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `require_cost_center`

- **Require GL account**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `require_gl_account`

- **Require project code**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `require_project_code`

---

## 5. Budgets

Route: `/configuration/budgets`

- **Create a budget**
  - Endpoint: `/api/v1/budget/budgets`
  - Method: `POST`
  - Payload fields: `organization_id`, `fiscal_year_id`, `budget_code`, `budget_name`, `description`, `total_budget`, `currency_code`, `cost_center`, `project_code`, `allow_overrun`, `overrun_percentage`, `require_approval_on_overrun`, `auto_approve_threshold`

- **Edit a budget**
  - Endpoint: `/api/v1/budget/budgets/{budgetId}`
  - Method: `PUT`
  - Payload fields: `budget_name`, `description`, `total_budget`, `allow_overrun`, `overrun_percentage`, `require_approval_on_overrun`, `auto_approve_threshold`

- **Delete a budget**
  - Endpoint: `/api/v1/budget/budgets/{budgetId}`
  - Method: `DELETE`

- **Change budget status**
  - Endpoint: `/api/v1/budget/budgets/{budgetId}/status`
  - Method: `PATCH`
  - Payload fields: `status`, `reason`

- **Import budgets (bulk Excel/CSV upload)**
  - Endpoint: `/api/v1/configuration/{organizationId}/budget/upload`
  - Method: `POST` (multipart)
  - Payload: `file`

---

## 6. Allocation Rules

Route: `/configuration/allocation-rules`

- **Create an allocation rule**
  - Endpoint: `/api/v1/budget/allocation-rules`
  - Method: `POST`
  - Payload fields: `organization_id`, `fiscal_year_id`, `rule_name`, `description`, `period_type`, `department_id`, `allocation_percentages`, `enforce_strict_allocation`, `allow_period_reallocation`

- **Edit an allocation rule**
  - Endpoint: `/api/v1/budget/allocation-rules/{ruleId}`
  - Method: `PATCH`
  - Payload fields: `rule_name`, `description`, `period_type`, `department_id`, `allocation_percentages`, `enforce_strict_allocation`, `allow_period_reallocation`

- **Delete an allocation rule**
  - Endpoint: `/api/v1/budget/allocation-rules/{ruleId}`
  - Method: `DELETE`

---

## 7. Accounting

Route: `/configuration/accounting`

All accounting fields persist to the same organization accounting-config
endpoint as Budget Rules.

### ERP integration

- **Budget ERP endpoint**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `budget_erp_endpoint`

- **Utilization ERP endpoint**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `utilization_erp_endpoint`

- **Purchase order ERP endpoint**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `po_erp_endpoint`

- **Budget sync frequency (hours)**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `budget_sync_frequency_hours`

- **Test ERP connection**
  - Endpoint: `/api/v1/configuration/{organizationId}/erp-test`
  - Method: `POST`
  - Query params: `connection_type`, `endpoint`

### Purchase orders

- **PO source (local or ERP-issued)**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `purchase_order_mode`

- **PO number prefix**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `po_number_prefix`

- **Auto-release POs on approval**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `po_auto_release`

### Tax

- **Budget amounts include / exclude tax**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `tax_inclusion`

- **Default tax rate (%)**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `default_tax_rate`

### Currency

- **Default currency**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `default_currency`

- **Allow multi-currency**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `allow_multi_currency`

- **Supported currencies (add or remove)**
  - Endpoint: `/api/v1/configuration/{organizationId}/accounting`
  - Method: `POST` / `PUT`
  - Payload field: `supported_currencies` (array)

---

## 8. Workflow

Route: `/configuration/workflow`

Currently a read-only visualization — no writable settings.

- **Visualize workflow**
  - Endpoint: `/api/v1/workflow/visualize`
  - Method: `GET`

---

## 9. Policy

Route: `/configuration/policy`

All policy fields persist to the organization policy endpoint.

- **Sole sourcing permitted**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `sole_sourcing_permitted`

- **Vendor policy (onboarded-only / allow new / three-quotes-required)**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `vendor_policy`

- **Minimum vendor quotes**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `minimum_vendor_quotes`

- **Quote validity (days)**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `quote_validity_days`

- **Onboarded-only threshold**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `onboarded_vendor_threshold`

- **Competitive bidding threshold**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `competitive_bidding_threshold`

- **Require vendor tax ID**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `require_vendor_tax_id`

- **Require vendor bank details**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `require_vendor_bank_details`

- **Vendor approval required**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `vendor_approval_required`

- **Apply policies to goods**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `apply_to_goods`

- **Apply policies to services**
  - Endpoint: `/api/v1/configuration/{organizationId}/policy`
  - Method: `POST` / `PUT`
  - Payload field: `apply_to_services`

---

## 10. Fiscal Year

Route: `/configuration/fiscal-year`

### Fiscal Year Configuration (organization-wide singleton)

All fields on this sub-page write to the same endpoint:

- **Create**: `POST /api/v1/budget/fiscal-year-config`
- **Update**: `PUT /api/v1/budget/fiscal-year-config/{configId}`

Payload fields (sent on create and/or update):

- **Start month / start day** → `start_month`, `start_day`
- **End month / end day** → `end_month`, `end_day`
- **Period type (monthly, quarterly, semi-annual, annual, custom)** → `period_type`
- **Code prefix (auto-generation)** → `code_prefix`
- **Name template (`{year}` placeholder)** → `name_template`
- **Enable rollover** → `rollover_enabled`
- **Rollover type (none / percentage / fixed amount / full / conditional)** → `rollover_type`
- **Auto-create enabled** → `auto_create_enabled`
- **Months ahead for auto-create** → `auto_create_months_ahead`

### Fiscal Years (CRUD)

- **Create a fiscal year**
  - Endpoint: `/api/v1/budget/fiscal-years`
  - Method: `POST`
  - Payload fields: `organization_id`, `year_code`, `year_name`, `start_date`, `end_date`, `period_type`

- **Activate a fiscal year**
  - Endpoint: `/api/v1/budget/fiscal-years/{fiscalYearId}/activate`
  - Method: `POST`
