# Sprint 3 Report — PrepSheet

## Team

- Tikaharu Sharma
- Sampada Sharma
- Sahith Reddy Gopidi
- Akshay Jaidi

## Sprint Goal

Complete the remaining manager-facing frontend pages, improve reporting and dashboard workflows, add export and visualization features, and expand frontend unit test coverage across the major UI flows.

## Sprint 3 Work Completed

### Frontend Features and UI Completion

During Sprint 3, the frontend moved beyond the core CRUD flows and focused on manager-facing reporting, dashboard visibility, settings, and data comparison features.

Completed frontend work includes:

- Monthly Reports page completed and refined
  - monthly accountant-style report table
  - restaurant-based filtering
  - year/month filtering based on available sales data
  - daily detail popup for report rows
- Report export actions added
  - PDF export support
  - Excel/CSV-style export support through report export utilities
- Dashboard page completed with live sales data
  - summary cards for total, lunch, and dinner sales
  - month-over-month comparison data
  - sales trend chart for recent periods
  - restaurant-aware dashboard view
- Data Visualization page completed
  - restaurant comparison view
  - bar chart for total sales across restaurants
  - combined sales and people comparison chart
  - expenditure comparison chart across restaurants
  - summary table for multi-restaurant comparison
- Settings page completed
  - current password verification flow
  - new password update flow
  - password confirmation validation
  - logout/session clear after successful password change
- User feedback and alert handling improved across flows
  - success snackbars
  - backend error messaging
  - validation feedback on forms

### Sprint 3 Issues Completed

The following frontend issues were completed or substantially closed out during Sprint 3:

- FE: Create Dashboard Layout UI
- FE: Monthly Reports Page UI
- FE: Create CSV/PDF Export Buttons UI
- FE: Create Data Visualization (Charts) UI
- FE: Create User feedback and alerts component

In addition to the issue list above, the Settings page and supporting password-management flow were completed as part of the Sprint 3 frontend work.

## Frontend Unit Tests

Frontend unit testing was expanded in Sprint 3 using:

- Vitest
- React Testing Library

A total of 36 frontend unit tests are currently implemented across 9 test files.

### Unit Test Files

- `frontend/src/_tests_/auth.test.ts`
- `frontend/src/_tests_/guards.test.tsx`
- `frontend/src/_tests_/Login.test.tsx`
- `frontend/src/_tests_/SalesEntry.test.tsx`
- `frontend/src/_tests_/Restaurants.test.tsx`
- `frontend/src/_tests_/Users.test.tsx`
- `frontend/src/_tests_/Reports.test.tsx`
- `frontend/src/_tests_/Settings.test.tsx`
- `frontend/src/_tests_/DataVisualization.test.tsx`

### Unit Test Coverage Completed

**Authentication and route guards**
- auth session storage and clearing
- protected route redirect behavior
- role-based route guard behavior

**Login page**
- empty-field validation
- password visibility toggle
- failed login handling
- successful login session storage and navigation

**Sales Entry page**
- required-field validation
- expenditure row add/remove behavior
- successful sale submission flow
- duplicate-day/backend error handling

**Restaurants page**
- add restaurant flow
- edit restaurant flow
- delete restaurant flow

**Users page**
- create employee flow
- edit employee flow
- delete employee flow

**Reports page**
- monthly report table rendering
- restaurant filter refetch behavior
- available year/month filtering
- day detail popup rendering
- error state handling

**Settings page**
- current-password required validation
- password visibility toggle
- verification success flow
- verification failure flow
- password update success flow
- confirm-password mismatch validation

**Data Visualization page**
- loading state
- successful data rendering
- empty-state rendering
- API error-state rendering

## Test Results

Frontend unit tests currently pass successfully:

- Unit tests: 36/36 passing
- 9/9 frontend unit test files passing
- Frontend production build passes successfully

## Remaining / Deferred Work

The following items remain as future improvements:

- broader Cypress coverage across non-login workflows
- additional unit tests for dashboard components and export utilities
- UI polish for chart responsiveness and small-screen layouts
- cleanup of MUI/jsdom and Recharts test warnings
- further analytics refinement on the Data Visualization page

# Backend

### Input Validation & Length Limits

A centralized validation module was added to enforce strict input constraints across all handlers, preventing malformed or oversized data from reaching the database.

- **Name fields**: required, max 100 characters
- **Email**: required, max 254 characters, regex format validation
- **Password**: required, min 6 characters, max 72 characters (bcrypt limit)
- **Note**: optional, max 1,000 characters
- **Restaurant name**: required, max 100 characters
- **Date**: required, must match `YYYY-MM-DD` format
- **Expenditure title**: max 200 characters
- **Expenditure count**: max 50 per sale entry
- **Request body size**: max 1 MB enforced via middleware on all routes

All handlers (`Signup`, `Login`, `CreateEmployee`, `UpdateEmployee`, `ChangePassword`, `AddSale`, `AddRestaurant`, `UpdateRestaurant`) were updated to use the new validators.

### Rate Limiting on Authentication Endpoints

A per-IP rate limiter was added to protect login and signup endpoints from brute-force attacks.

- **Limit**: 10 requests per 15-minute window per IP address
- Returns HTTP `429 Too Many Requests` with a `Retry-After` header when exceeded
- Background goroutine cleans up expired entries every minute
- Applied to `/api/login` and `/api/signup`

### Manager-Scoped Sales Queries

Sales data access was scoped so managers only see sales from restaurants they own, improving data isolation in multi-manager deployments.

- `GetSales` (`/api/sales/all`) now filters by `restaurants.manager_id` matching the authenticated manager
- `GetMonthlyReport` (`/api/reports/monthly`) now JOINs on `restaurants` and filters by `manager_id`
- Employee-facing endpoints (`GetMySales`, `AddSale`) remain unchanged

---

## New Files

| File | Package | Purpose |
|------|---------|---------|
| `backend/handlers/validation.go` | handlers | Centralized input validation helpers (name, email, password, note, restaurant name, date) |
| `backend/handlers/validation_test.go` | handlers | 23 unit tests for all validation functions |
| `backend/middleware/ratelimit.go` | middleware | Per-IP rate limiter with configurable limit and time window |
| `backend/middleware/ratelimit_test.go` | middleware | 4 unit tests for rate limiter behavior |
| `backend/middleware/validation.go` | middleware | Request body size limiter middleware (1 MB max) |
| `backend/middleware/validation_test.go` | middleware | 3 unit tests for body size limiter |

---

## Modified Files

| File | Changes |
|------|---------|
| `backend/models/models.go` | Added `UpdateSaleRequest` struct |
| `backend/handlers/user.go` | Replaced manual validation with `ValidateName`, `ValidateEmail`, `ValidatePassword` calls in all user handlers |
| `backend/handlers/restaurant.go` | Replaced manual name checks with `ValidateRestaurantName` in `AddRestaurant`, `UpdateRestaurant` |
| `backend/handlers/sales.go` | Added full input validation in `AddSale`; scoped `GetSales` and `GetMonthlyReport` to manager's restaurants via `manager_id` JOIN |
| `backend/main.go` | Wired rate limiter on `/api/login` and `/api/signup`; wrapped all routes with `LimitBody` middleware |
| `backend/handlers/sales_test.go` | Updated test passwords to meet 6-char minimum; refactored `createTestEmployee` to return `(empID, mgrID)`; linked test restaurants to managers for scoped query tests |
| `backend/handlers/user_test.go` | Updated test passwords from `"pass"` to `"password"` to meet new validation rules |
| `frontend/vite.config.ts` | Added `server.proxy` configuration for `/api` → `http://localhost:8080` |
| `frontend/src/lib/api.ts` | Changed `API_BASE_URL` from `'http://localhost:8080/api'` to `'/api'` |

---

## Updated Project Structure

```
backend/
├── main.go                          # Entry point, route registration, rate limiter + body limiter wiring
├── go.mod
├── database/
│   └── database.go                  # SQLite init, schema (5 tables)
├── models/
│   └── models.go                    # All struct definitions (incl. UpdateSaleRequest)
├── handlers/
│   ├── user.go                      # Signup, Login, GetUsers, UpdateUserStatus, CreateEmployee, etc.
│   ├── sales.go                     # AddSale, GetSales (scoped), GetMySales, GetMonthlyReport (scoped)
│   ├── restaurant.go                # Restaurant CRUD, Assignment CRUD
│   ├── validation.go                # Input validation helpers (NEW)
│   ├── validation_test.go           # Validation unit tests — 23 tests (NEW)
│   ├── test_helpers_test.go         # Shared test DB setup/teardown
│   ├── user_test.go                 # User handler unit tests
│   ├── sales_test.go               # Sales handler unit tests
│   └── restaurant_test.go          # Restaurant & Assignment tests
└── middleware/
    ├── middleware.go                 # JWT auth middleware, CORS middleware
    ├── ratelimit.go                 # Per-IP rate limiter (NEW)
    ├── ratelimit_test.go            # Rate limiter tests — 4 tests (NEW)
    ├── validation.go                # Body size limiter (NEW)
    └── validation_test.go           # Body limiter tests — 3 tests (NEW)
```

---

## Unit Testing

### New Tests Added in Sprint 3

| Test File | Package | Tests | What's Covered |
|-----------|---------|-------|----------------|
| `handlers/validation_test.go` | handlers | 23 | `ValidateName` (valid, empty, whitespace, too long, exact max), `ValidateEmail` (valid formats, empty, invalid formats, too long), `ValidatePassword` (valid, empty, too short, min length, too long), `ValidateNote` (valid, empty, too long), `ValidateRestaurantName` (valid, empty, too long), `ValidateDate` (valid, empty, invalid formats) |
| `middleware/ratelimit_test.go` | middleware | 4 | Allows requests under limit, blocks with 429 over limit, per-IP independence, resets after window expiry |
| `middleware/validation_test.go` | middleware | 3 | Allows small request body, rejects oversized body, handles nil body gracefully |

### Updated Tests in Sprint 3

| Test File | Changes |
|-----------|---------|
| `handlers/sales_test.go` | Passwords updated to 6-char minimum; `createTestEmployee` returns `(empID, mgrID)` tuple; manager-scoped tests link restaurants via `manager_id`; added `linkRestaurantToManager` helper |
| `handlers/user_test.go` | Passwords updated from `"pass"` to `"password"` (3 locations) |

### Total Backend Test Count

| Package | Sprint 2 | Sprint 3 | Change |
|---------|----------|----------|--------|
| `handlers/` | 45 | 68 | +23 |
| `middleware/` | 8 | 15 | +7 |
| **Total** | **53** | **83** | **+30** |

### How to Run Tests

```bash
# All backend tests
cd backend
go test ./... -v

# Validation tests only
go test ./handlers/ -run "TestValidate" -v

# Rate limiter and body limiter tests
go test ./middleware/ -v

# Sales handler tests
go test ./handlers/ -run "TestAddSale|TestGetSales|TestGetMySales|TestGetMonthlyReport|TestUpdateSale|TestDeleteSale" -v
```

---

## API Changes

### Modified Endpoints

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/api/signup` | Now rate-limited (10 req/15min per IP); input validation enforced |
| POST | `/api/login` | Now rate-limited (10 req/15min per IP); input validation enforced |
| GET | `/api/sales/all` | Now scoped to manager's restaurants (`manager_id` filter) |
| GET | `/api/reports/monthly` | Now scoped to manager's restaurants (`manager_id` JOIN) |
| POST | `/api/sales` | Full input validation (date, restaurant name, note, expenditures) |
| POST | `/api/restaurants/add` | Restaurant name validation (max 100 chars) |
| PUT | `/api/restaurants/update` | Restaurant name validation (max 100 chars) |
| ALL | All routes | Body size limited to 1 MB |

---

## What Changed from Sprint 2 → Sprint 3

| Area | Sprint 2 | Sprint 3 |
|------|----------|----------|
| Input validation | None (raw request data) | Centralized validators on all handler inputs |
| Rate limiting | None | 10 req/15min per IP on auth endpoints |
| Body size limit | None | 1 MB max on all routes |
| Sales data scoping | Managers see all sales | Managers see only their restaurants' sales |
| Frontend API URL | Hardcoded `http://localhost:8080/api` | Relative `/api` with Vite proxy |
| Backend test count | 53 | 83 (+30 new tests) |
| Middleware files | 1 (`middleware.go`) | 3 (+`ratelimit.go`, +`validation.go`) |
| Handler files | 3 | 4 (+`validation.go`) |

