# Sprint 4 Report — PrepSheet

## Team

- Tikaharu Sharma
- Sampada Sharma
- Sahith Reddy Gopidi
- Akshay Jaidi

# Frontend

## Sprint Goal

Complete the remaining frontend integrations, improve usability across manager and employee workflows, and add automated test coverage for newly implemented UI behavior.

---

## Sprint 4 Work Completed

### 1. Login Page Redesign and UX Improvements

The login page was redesigned into a polished two-column layout with updated branding, clearer copy, and better responsiveness. Validation and interaction handling were also improved so the form now gives immediate feedback for empty fields, supports password visibility toggling, clears stale values after failed login attempts, and navigates correctly after successful authentication.

- **Files:** `frontend/src/pages/Login.tsx`, `frontend/src/_tests_/Login.test.tsx`, `frontend/cypress/e2e/login.spec.ts`

### 2. Dashboard Filters, Summary View, and Trend Visualization

The dashboard was upgraded from a static view into a restaurant-aware reporting surface. It now:

- loads sales for the selected restaurant
- derives available year/month filter options from real sales data
- shows current-month summary cards with comparison against the previous month
- renders a 7-month sales trend chart
- handles loading, empty-data, and API-error states cleanly

The dashboard data logic was also extracted into reusable helpers so the date-period and aggregation behavior could be unit tested independently.

- **Files:** `frontend/src/pages/Dashboard.tsx`, `frontend/src/lib/dashboardUtils.ts`, `frontend/src/components/dashboard/*`

### 3. Reports Page Filtering and Export Improvements

The reports page was updated to match the dashboard’s restaurant-aware filtering model. Managers can now view only valid years and months for the selected restaurant, inspect day-level report details, and use the report export functionality more reliably. Error handling and test coverage were added around the updated reporting flow.

- **Files:** `frontend/src/pages/Reports.tsx`, `frontend/src/lib/monthlyReportExport.ts`, `frontend/src/_tests_/Reports.test.tsx`

### 4. Responsive Navigation and Sidebar Collapse

The application shell was refined for desktop and mobile usage. The sidebar now supports collapse/expand behavior on larger screens, responsive drawer behavior on smaller screens, and layout fixes that prevent content breakage across screen sizes. Navbar and sidebar behavior were adjusted so authenticated navigation remains usable across all pages.

- **Files:** `frontend/src/components/AppLayout.tsx`, `frontend/src/components/Sidebar.tsx`, `frontend/src/components/Navbar.tsx`

### 5. Restaurants and Users Management Integration

The manager-facing administration pages were completed and tested:

- Restaurants page supports create, rename, and delete flows against the backend API
- Users page supports employee creation, editing, deletion, restaurant assignment, and search filtering
- role-based access and authenticated page flow were verified through tests

- **Files:** `frontend/src/pages/Restaurants.tsx`, `frontend/src/pages/Users.tsx`, `frontend/src/features/*`, `frontend/src/_tests_/Restaurants.test.tsx`, `frontend/src/_tests_/Users.test.tsx`, `frontend/src/_tests_/guards.test.tsx`

### 6. Settings Password Change Flow

The settings page now includes a multi-step password change flow for managers. It verifies the current password before allowing the update, validates new-password confirmation, handles failure states, and logs the user out after a successful password change so the new credentials take effect cleanly.

- **Files:** `frontend/src/pages/Settings.tsx`, `frontend/src/_tests_/Settings.test.tsx`

### 7. Data Visualization and Sales Entry Stability

The frontend now includes a data visualization page for comparing restaurant sales data, alongside continued stabilization of the sales-entry workflow. Validation, dynamic expenditure rows, success handling, and backend error display were all covered with automated tests to ensure the entry flow remains dependable.

- **Files:** `frontend/src/pages/DataVisualization.tsx`, `frontend/src/pages/SalesEntry.tsx`, `frontend/src/_tests_/DataVisualization.test.tsx`, `frontend/src/_tests_/SalesEntry.test.tsx`

### 8. Frontend Test Expansion

Frontend automated coverage was expanded substantially during Sprint 4. New tests now cover:

- login form behavior
- route guards and auth session helpers
- dashboard helper utilities
- dashboard rendering after authenticated data load
- reports filtering and report-detail interactions
- sales entry validation and submission behavior
- users and restaurants CRUD interactions
- password change behavior
- Cypress login smoke and interaction flows

This work ensures new UI behavior introduced in Sprint 4 is backed by repeatable automated checks.

---

## Frontend Unit Tests

All frontend unit tests pass. Total: **46 tests** across **11** test files.

### `frontend/src/_tests_/Dashboard.test.tsx` — 1 test

- `renders dashboard content for a logged-in restaurant after sales load`

### `frontend/src/_tests_/DataVisualization.test.tsx` — 4 tests

- `shows loading state initially`
- `renders data correctly after fetch`
- `shows empty state when no data`
- `shows error state when API fails`

### `frontend/src/_tests_/Login.test.tsx` — 4 tests

- `shows a validation error when email and password are empty`
- `toggles password visibility`
- `clears both inputs and shows an error when login fails`
- `stores the session and navigates home when login succeeds`

### `frontend/src/_tests_/Reports.test.tsx` — 5 tests

- `renders the monthly grid with the accountant-style columns`
- `refetches reports for a selected restaurant`
- `shows only available years and months for the selected restaurant`
- `opens a day detail popup when a report date is clicked`
- `shows an error state when report loading fails`

### `frontend/src/_tests_/Restaurants.test.tsx` — 3 tests

- `adds a restaurant from the dialog`
- `opens edit mode with the existing restaurant name and saves the update`
- `deletes a restaurant after confirmation`

### `frontend/src/_tests_/SalesEntry.test.tsx` — 4 tests

- `shows validation errors for missing required sales fields`
- `adds and removes an expenditure row`
- `submits a valid sales entry and shows a success message`
- `shows backend submit errors such as duplicate-day conflicts`

### `frontend/src/_tests_/Settings.test.tsx` — 6 tests

- `shows validation error when current password is empty`
- `toggles password visibility`
- `moves to change step when verification succeeds`
- `shows error when verification fails`
- `successfully changes password and navigates to login`
- `shows mismatch error for new passwords`

### `frontend/src/_tests_/Users.test.tsx` — 5 tests

- `creates a new employee with selected restaurants`
- `edits an employee and submits the updated fields`
- `deletes an employee after confirmation`
- `assigns a restaurant to an employee`
- `filters employees using search input`

### `frontend/src/_tests_/auth.test.ts` — 2 tests

- `stores the token and user session`
- `clears auth and cached restaurant state on logout`

### `frontend/src/_tests_/dashboardUtils.test.ts` — 7 tests

- `returns correct start and end date`
- `shifts forward correctly`
- `shifts backward across year`
- `returns sorted unique months`
- `returns first period if current month not included`
- `sums sales correctly`
- `handles empty array`

### `frontend/src/_tests_/guards.test.tsx` — 5 tests

- `RequireAuth redirects unauthenticated users to login`
- `RequireAuth renders protected routes for authenticated users`
- `RequireRole redirects unauthenticated users to login`
- `RequireRole redirects authenticated users with the wrong role to home`
- `RequireRole renders the route for allowed roles`

---

## Cypress Tests

Frontend end-to-end coverage currently includes **7 Cypress tests** in `frontend/cypress/e2e/login.spec.ts`.

- `should display login form correctly`
- `should show error if fields are empty`
- `allows typing in the input fields`
- `toggles password visibility`
- `toggles password visibility back and forth`
- `shows error for invalid credentials`
- `submits form when fields are filled`

---

## Frontend Test Results

```
frontend unit tests: 11 files passed, 46 tests passed
frontend Cypress tests: 7 tests implemented
```

All frontend unit tests pass. The Cypress suite for login behavior is included in the repository and can be run with `npm run cypress:run` from `frontend/`.

---

# Backend 
## Sprint Goal

Harden the backend with security improvements, performance optimizations, and an audit trail. Fix all pre-existing backend test failures to achieve a fully green test suite.

---

## Sprint 4 Work Completed

### 1. JWT Secret from Environment Variable

The JWT signing key is no longer hardcoded in source code. It is now loaded from the `JWT_SECRET` environment variable at startup. If the variable is not set, the server falls back to the legacy default and logs a warning. This prevents accidental exposure of the signing key in version control.

- **File:** `backend/handlers/user.go`
- **Env var:** `JWT_SECRET`

### 2. CORS Origin from Environment Variable

The `Access-Control-Allow-Origin` header is now set dynamically from the `FRONTEND_URL` environment variable instead of a hardcoded `*` wildcard. The default value is `http://localhost:5173` for local development. This limits cross-origin access to the known frontend origin in production.

- **File:** `backend/middleware/middleware.go`
- **Env var:** `FRONTEND_URL`

### 3. Admin Seed Credentials from Environment Variables

The default admin user created at first startup no longer uses hardcoded `admin`/`admin` credentials. Name, email, and password are each read from environment variables with fallback values and a startup warning when defaults are used.

- **File:** `backend/database/database.go`
- **Env vars:** `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`

### 4. N+1 Query Eliminated in Sales Handlers

`GetSales` and `GetMySales` previously executed one SQL query per sale row to fetch associated expenditures. A new `getExpendituresForSales(saleIDs []int)` helper fetches all expenditures for a result set in a single `WHERE sale_id IN (...)` query and returns a `map[int][]models.Expenditure`. Both handlers now call this helper after scanning their sales rows.

- **File:** `backend/handlers/sales.go`

### 5. Database Indexes Added

`ensureIndexes()` is called during `InitDB()` and creates the following indexes using `IF NOT EXISTS`:

| Index | Table / Columns | Purpose |
|---|---|---|
| `idx_sales_restaurant_date` | `sales(restaurant_id, date)` | Manager sales queries filtered by restaurant and date range |
| `idx_sales_employee_date` | `sales(employee_id, date)` | Employee "my sales" queries filtered by date |
| `idx_users_role` | `users(role)` | Employee listing queries filtering by role |
| `idx_sales_unique_restaurant_date` | `sales(restaurant_id, date)` UNIQUE | Enforces one sales entry per restaurant per day |

- **File:** `backend/database/database.go`

### 6. Unique Constraint on Sales (restaurant_id, date)

The unique index `idx_sales_unique_restaurant_date` enforces at the database level that no two sales entries can share the same restaurant and date. This supplements the application-level duplicate check already present in `AddSale` and `UpdateSale`.

- **File:** `backend/database/database.go`

### 7. Rate Limiting on All Authenticated API Routes

All 26 authenticated routes are now wrapped with a second rate limiter (`apiLimiter`) set at 100 requests per minute per IP. The existing stricter `authLimiter` (10 requests per 15 minutes) remains on `/api/signup` and `/api/login`. This prevents API abuse by authenticated users without affecting normal usage patterns.

- **File:** `backend/main.go`

### 8. Sales Audit Trail (updated_at / updated_by)

Two audit columns were added to the `sales` table:

- `updated_at DATETIME` — set to `CURRENT_TIMESTAMP` whenever a sale is updated
- `updated_by INTEGER REFERENCES users(id)` — stores the user ID of the person who last edited the sale

A database migration (`addSalesAuditColumnsIfMissing`) adds these columns to existing databases without disrupting production data. Both fields are included in the `Sale` model and returned in API responses.

- **Files:** `backend/database/database.go`, `backend/handlers/sales.go`, `backend/models/models.go`

### 9. Full Test Suite Repair

All 20 pre-existing backend test failures were diagnosed and fixed. Root causes were:

- Handlers added manager-scoping (requiring a `user_id` in request context) after the original tests were written, leaving tests without auth context
- `TestLogin_InactiveUser` called `UpdateUserStatus` without the manager auth context it now requires
- `GetUsers`, `GetRestaurants`, `GetAssignments`, and related mutation handlers scope results to the logged-in manager, requiring test data to be linked by `manager_id`

Fixes applied:
- Added `setupManagerUser(t *testing.T) int` helper in `test_helpers_test.go`
- Updated all 15 restaurant/assignment tests to inject manager auth context via `requestWithUserID`
- Updated 5 user handler tests with manager context and direct DB inserts scoped to the manager
- `TestLogin_InactiveUser` deactivates the user via `database.DB.Exec` directly, bypassing the handler auth requirement

- **Files:** `backend/handlers/test_helpers_test.go`, `backend/handlers/restaurant_test.go`, `backend/handlers/user_test.go`

---

## Backend Unit Tests

All backend tests pass. Total: **80 tests** across 4 test files.

### `backend/handlers/validation_test.go` — 23 tests

**ValidateName**
- `TestValidateName_Valid`
- `TestValidateName_Empty`
- `TestValidateName_WhitespaceOnly`
- `TestValidateName_TooLong`
- `TestValidateName_ExactMax`

**ValidateEmail**
- `TestValidateEmail_Valid`
- `TestValidateEmail_Empty`
- `TestValidateEmail_InvalidFormat`
- `TestValidateEmail_TooLong`

**ValidatePassword**
- `TestValidatePassword_Valid`
- `TestValidatePassword_Empty`
- `TestValidatePassword_TooShort`
- `TestValidatePassword_MinLength`
- `TestValidatePassword_TooLong`

**ValidateNote**
- `TestValidateNote_Valid`
- `TestValidateNote_Empty`
- `TestValidateNote_TooLong`

**ValidateRestaurantName**
- `TestValidateRestaurantName_Valid`
- `TestValidateRestaurantName_Empty`
- `TestValidateRestaurantName_TooLong`

**ValidateDate**
- `TestValidateDate_Valid`
- `TestValidateDate_Empty`
- `TestValidateDate_InvalidFormat`

---

### `backend/handlers/user_test.go` — 19 tests

**Signup**
- `TestSignup_Success`
- `TestSignup_MethodNotAllowed`
- `TestSignup_MissingFields`
- `TestSignup_DuplicateEmail`
- `TestSignup_DefaultRole`

**Login**
- `TestLogin_Success`
- `TestLogin_MethodNotAllowed`
- `TestLogin_WrongPassword`
- `TestLogin_NonexistentUser`
- `TestLogin_InactiveUser`
- `TestLogin_MissingFields`

**GetUsers**
- `TestGetUsers_Empty`
- `TestGetUsers_WithData`

**UpdateUserStatus**
- `TestUpdateUserStatus_Success`
- `TestUpdateUserStatus_MethodNotAllowed`
- `TestUpdateUserStatus_InvalidStatus`

**VerifyPassword / ChangePassword**
- `TestVerifyPassword_Success`
- `TestChangePassword_Success`
- `TestChangePassword_WrongCurrentPassword`

---

### `backend/handlers/restaurant_test.go` — 20 tests

**GetRestaurants**
- `TestGetRestaurants_Empty`
- `TestGetRestaurants_WithData`

**AddRestaurant**
- `TestAddRestaurant_Success`
- `TestAddRestaurant_MethodNotAllowed`
- `TestAddRestaurant_EmptyName`
- `TestAddRestaurant_Duplicate`

**DeleteRestaurant**
- `TestDeleteRestaurant_Success`
- `TestDeleteRestaurant_MethodNotAllowed`
- `TestDeleteRestaurant_MissingID`

**GetAssignments**
- `TestGetAssignments_Empty`
- `TestGetAssignments_WithData`

**AddAssignment**
- `TestAddAssignment_Success`
- `TestAddAssignment_MethodNotAllowed`
- `TestAddAssignment_MissingFields`
- `TestAddAssignment_DefaultStatus`

**UpdateAssignment**
- `TestUpdateAssignment_Success`
- `TestUpdateAssignment_MethodNotAllowed`

**DeleteAssignment**
- `TestDeleteAssignment_Success`
- `TestDeleteAssignment_MethodNotAllowed`
- `TestDeleteAssignment_MissingID`

---

### `backend/handlers/sales_test.go` — 22 tests

**AddSale**
- `TestAddSale_Success`
- `TestAddSale_ManagerForbidden`
- `TestAddSale_MissingFields`
- `TestAddSale_WithMultipleExpenditures`

**GetSales**
- `TestGetSales_ManagerOnly`
- `TestGetSales_Success`
- `TestGetSales_WithDateFilter`
- `TestGetSales_WithExpenditures`

**GetMySales**
- `TestGetMySales_Success`
- `TestGetMySales_Empty`
- `TestGetMySales_WithDateFilter`
- `TestGetMySales_WithRestaurantFilter`

**GetMonthlyReport**
- `TestGetMonthlyReport_ManagerOnly`
- `TestGetMonthlyReport_WithData`

**UpdateSale**
- `TestUpdateSale_Success`
- `TestUpdateSale_NotOwner`
- `TestUpdateSale_ManagerForbidden`

**DeleteSale**
- `TestDeleteSale_Success`
- `TestDeleteSale_NotOwner`
- `TestDeleteSale_ManagerCanDeleteAny`
- `TestDeleteSale_NotFound`
- `TestDeleteSale_MissingID`

---

### `backend/middleware/ratelimit_test.go` — 4 tests

- `TestRateLimiter_AllowsUnderLimit`
- `TestRateLimiter_BlocksOverLimit`
- `TestRateLimiter_DifferentIPsIndependent`
- `TestRateLimiter_ResetsAfterWindow`

---

### `backend/middleware/validation_test.go` — (existing, unchanged)

Middleware body-size limit validation tests.

---

## Test Results

```
ok  prepsheet-backend/handlers    3.469s
ok  prepsheet-backend/middleware  (cached)
```

All tests pass. No failures.

---

## Backend API Documentation

All routes require a valid JWT bearer token in the `Authorization` header unless marked **Public**. Authenticated routes are scoped: managers only see their own restaurants, employees, and assignments.

All authenticated routes are rate-limited to **100 requests/minute per IP**.  
Auth routes (`/api/signup`, `/api/login`) are rate-limited to **10 requests/15 minutes per IP**.  
All routes enforce a **1 MB request body limit**.

---

### Auth

#### `POST /api/signup` — Public
Register a new user account.

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "manager | employee"
}
```

**Responses:**
| Status | Meaning |
|---|---|
| 201 | User created. Returns `{ "message": "...", "user_id": int }` |
| 400 | Validation failure (name/email/password rules) |
| 405 | Method not allowed |
| 409 | Email already registered |

---

#### `POST /api/login` — Public
Authenticate and receive a JWT token.

**Request body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Responses:**
| Status | Meaning |
|---|---|
| 200 | Returns `{ "token", "user_id", "name", "email", "role" }` |
| 400 | Missing fields or input too long |
| 401 | Invalid credentials |
| 403 | Account is inactive |
| 405 | Method not allowed |

---

### Restaurants

#### `GET /api/restaurants` — Auth required
- **Manager:** returns restaurants they own
- **Employee:** returns restaurants they are actively assigned to

**Response:** `200` — array of `{ id, name, created_at }`

---

#### `POST /api/restaurants/add` — Manager only
Create a new restaurant.

**Request body:** `{ "name": "string" }`

**Responses:**
| Status | Meaning |
|---|---|
| 201 | Restaurant created. Returns `{ id, name, created_at }` |
| 400 | Name missing or invalid |
| 403 | Caller is not a manager |
| 409 | Restaurant name already exists |

---

#### `PUT /api/restaurants/update` — Manager only
Rename a restaurant the caller owns.

**Request body:** `{ "id": int, "name": "string" }`

**Responses:**
| Status | Meaning |
|---|---|
| 200 | Returns updated `{ id, name, created_at }` |
| 400 | Missing/invalid fields |
| 403 | Restaurant not owned by caller |
| 409 | New name already exists |

---

#### `DELETE /api/restaurants/delete?id={id}` — Manager only
Delete a restaurant the caller owns.

**Responses:**
| Status | Meaning |
|---|---|
| 200 | `{ "message": "Restaurant deleted" }` |
| 400 | ID not provided |
| 403 | Restaurant not owned by caller |

---

### Sales

#### `POST /api/sales` — Employee only
Submit a daily sales entry.

**Request body:**
```json
{
  "date": "YYYY-MM-DD",
  "restaurant_id": int,
  "lunch_head_count": int,
  "lunch_sale": float,
  "dinner_head_count": int,
  "dinner_sale": float,
  "credit_sale": float,
  "reji_money": float,
  "note": "string",
  "expenditures": [{ "title": "string", "amount": float }]
}
```

**Responses:**
| Status | Meaning |
|---|---|
| 201 | Returns `{ "message": "...", "sale_id": int }` |
| 400 | Validation failure |
| 403 | Caller is a manager, or not assigned to restaurant |
| 409 | Entry for this restaurant/date already exists |

---

#### `GET /api/sales/all` — Manager only
Retrieve all sales for the manager's restaurants.

**Query params (optional):** `start_date`, `end_date` (YYYY-MM-DD), `restaurant_id`

**Response:** `200` — array of sale objects including `updated_at`, `updated_by`, and nested `expenditures`

---

#### `GET /api/sales/my` — Employee only
Retrieve the authenticated employee's own sales entries.

**Query params (optional):** `start_date`, `end_date` (YYYY-MM-DD), `restaurant_id`

**Response:** `200` — array of sale objects

---

#### `PUT /api/sales/update` — Employee only (own entries)
Update an existing sales entry. Only the entry owner may edit; managers cannot.

Sets `updated_at = CURRENT_TIMESTAMP` and `updated_by = <caller user_id>`.

**Request body:** full sale object including `id`

**Responses:**
| Status | Meaning |
|---|---|
| 200 | Sale updated |
| 403 | Not the entry owner, or caller is a manager |
| 409 | Update would create a duplicate restaurant/date |

---

#### `DELETE /api/sales/delete?id={id}` — Employee or Manager
- Employee may delete their own entries only
- Manager may delete any entry for their restaurants

**Responses:**
| Status | Meaning |
|---|---|
| 200 | `{ "message": "Sale entry deleted" }` |
| 400 | Missing ID |
| 403 | Employee does not own entry |
| 404 | Entry not found |

---

### Reports

#### `GET /api/reports/monthly` — Manager only
Returns a monthly aggregated report for a manager's restaurants.

**Query params:** `year` (int), `month` (int), `restaurant_id` (optional)

**Response:** `200` — array of daily totals per restaurant with head counts, sales totals, and expenditure breakdowns

---

### Users

#### `GET /api/users` — Manager only
Returns all employees created by the logged-in manager, with their assigned restaurants.

**Response:** `200` — array of `{ id, name, email, status, created_at, restaurants[] }`

---

#### `POST /api/users/create` — Manager only
Create a new employee under the logged-in manager.

**Request body:**
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "status": "active | inactive",
  "restaurants": [int]
}
```

**Responses:**
| Status | Meaning |
|---|---|
| 201 | Returns `{ "message": "...", "id": int }` |
| 400 | Validation failure |
| 403 | Caller is not a manager |
| 409 | Email already exists |

---

#### `PUT /api/users/update` — Manager only
Update an employee's name, email, and optionally password.

**Request body:** `{ "user_id": int, "name": string, "email": string, "password": string (optional) }`

**Responses:**
| Status | Meaning |
|---|---|
| 200 | Employee updated |
| 403 | Employee not owned by caller |
| 409 | Email conflict |

---

#### `DELETE /api/users/delete?id={id}` — Manager only
Delete an employee owned by the caller.

**Responses:**
| Status | Meaning |
|---|---|
| 200 | Employee deleted |
| 403 | Employee not owned by caller |

---

#### `PUT /api/users/status` — Manager only
Activate or deactivate an employee.

**Request body:** `{ "user_id": int, "status": "active | inactive" }`

**Responses:**
| Status | Meaning |
|---|---|
| 200 | `{ "message": "Employee status updated" }` |
| 400 | Invalid status value |
| 403 | Employee not owned by caller |

---

#### `POST /api/users/verify-password` — Auth required
Verify the authenticated user's current password (used before allowing a password change).

**Request body:** `{ "current_password": "string" }`

**Responses:**
| Status | Meaning |
|---|---|
| 200 | `{ "message": "Current password verified" }` |
| 400 | Missing password |
| 401 | Incorrect password |

---

#### `PUT /api/users/change-password` — Auth required
Change the authenticated user's password.

**Request body:** `{ "current_password": "string", "new_password": "string" }`

**Responses:**
| Status | Meaning |
|---|---|
| 200 | `{ "message": "Password updated successfully" }` |
| 400 | Validation failure or new equals current |
| 401 | Current password incorrect |

---

### Assignments

#### `GET /api/assignments` — Manager only
Returns all restaurant-employee assignments for the caller's restaurants.

**Response:** `200` — array of `{ id, restaurant_id, restaurant_name, employee_id, employee_name, employee_email, status }`

---

#### `POST /api/assignments/add` — Manager only
Assign an employee to a restaurant.

**Request body:** `{ "restaurant_id": int, "employee_id": int, "status": "active | inactive" }`

**Responses:**
| Status | Meaning |
|---|---|
| 201 | Returns `{ "message": "Assignment created", "id": int }` |
| 400 | Missing fields |
| 403 | Restaurant or employee not owned by caller |
| 409 | Already assigned |

---

#### `PUT /api/assignments/update` — Manager only
Update an assignment's status.

**Request body:** `{ "id": int, "restaurant_id": int, "employee_id": int, "status": "active | inactive" }`

**Responses:**
| Status | Meaning |
|---|---|
| 200 | `{ "message": "Assignment updated" }` |
| 400 | Missing/invalid fields |
| 403 | Assignment not owned by caller |

---

#### `DELETE /api/assignments/delete?id={id}` — Manager only
Delete an assignment for a caller-owned restaurant.

**Responses:**
| Status | Meaning |
|---|---|
| 200 | `{ "message": "Assignment deleted" }` |
| 400 | Missing ID |
| 403 | Assignment not owned by caller |

---

### Health Check

#### `GET /api/health` — Public
Returns server status.

**Response:** `200` — `{ "status": "ok", "service": "PrepSheet Backend" }`
