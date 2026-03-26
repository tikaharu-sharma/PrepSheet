# Sprint 2 Report — PrepSheet

## Team

- Tikaharu Sharma
- Sampada Sharma
- Sahith Reddy Gopidi
- Akshay Jaidi

## Sprint Goal

Build on the Sprint 1 frontend foundation by integrating the frontend with the backend, implementing manager/employee workflows, and adding frontend testing through Cypress and unit tests.

## Sprint 2 Work Completed

### Frontend-Backend Integration

During Sprint 2, the frontend was integrated with the backend APIs so that major features now use real data instead of placeholder UI behavior.

Completed frontend integration work includes:

- Real login connected to backend authentication
- Role-based navigation for manager and employee users
- Restaurant management connected to backend
  - view restaurants
  - add restaurants
  - edit restaurants
  - delete restaurants
- User management connected to backend
  - create employee accounts
  - edit employee data
  - delete employee accounts
  - assign employees to restaurants
- Sales entry connected to backend
  - save daily sales to the database
  - validate required fields
  - optional expenditures and notes supported
  - duplicate sale entries for the same restaurant/day blocked
- Reports page connected to backend
  - monthly report summary
  - daily sales records
  - restaurant-based filtering
  - employee-scoped visibility for assigned restaurants
- Dashboard updated to display actual data from the reporting/sales backend instead of placeholder values

### Frontend Features Completed

The following frontend issues planned earlier are now completed:

- FE-01: Implement Login Page UI
- FE: Create Sales Entry Form UI
- FE: Create User Management Table UI
- FE: Create Main App Layout
- FE: Create Dashboard Layout UI
- FE: Implement Role-Based Navigation UI
- FE: Create Multi-Restaurant Switcher UI

In addition to the original UI work, these pages were integrated with backend logic during Sprint 2 and now use live application data.

## Frontend Testing

### Cypress Test

A simple Cypress test was added for the login page to satisfy the Sprint 2 Cypress requirement.

Current Cypress coverage includes:
- login form renders correctly
- error shown when required fields are empty
- user can type into login inputs
- password visibility toggle works

### Frontend Unit Tests

Frontend unit testing was added using:
- Vitest
- React Testing Library

A total of 24 frontend unit tests were implemented across 7 test files.

#### Unit test files

- `src/lib/auth.test.ts`
- `src/features/guards.test.tsx`
- `src/pages/Login.test.tsx`
- `src/pages/SalesEntry.test.tsx`
- `src/pages/Restaurants.test.tsx`
- `src/pages/Users.test.tsx`
- `src/pages/Reports.test.tsx`

#### Unit test coverage

**Authentication / session**
- stores auth token and user session correctly
- clears auth session and cached local state on logout
- route protection redirects unauthenticated users correctly
- role guard redirects unauthorized users correctly

**Login page**
- shows validation error when fields are empty
- toggles password visibility
- clears both fields after failed login
- stores session and navigates on successful login

**Sales Entry page**
- validates required sales fields
- allows adding and removing expenditure rows
- shows success message after valid submission
- shows backend error for duplicate sale entry

**Restaurants page**
- add restaurant flow
- edit restaurant flow
- delete restaurant flow

**Users page**
- create employee flow
- edit employee flow
- delete employee flow

**Reports page**
- renders monthly totals correctly
- computes/displays total sale values
- refetches based on selected restaurant
- shows error state when report loading fails

### Test Results

Frontend tests currently pass successfully:

- Cypress login test runs successfully
- Unit tests: 24/24 passing
- Frontend production build passes successfully

## Remaining / Deferred Work

The following frontend work is still incomplete or deferred:

- export reports functionality
- more advanced dashboard visualizations/charts
- broader Cypress coverage across more user flows
- additional unit test coverage for remaining utility and UI paths
- polishing test warnings from MUI menu/select behavior in jsdom
- further UI/UX cleanup and optimization


## Sprint 2 Backend Report
### Planned Issues

| Issue # | Title | Type |
|---------|-------|------|
| #13 | Restructure Go project into packages | Refactor |
| #14 | Redesign database schema for frontend alignment | Refactor |
| #15 | Update users table (email, name, status) | Feature |
| #16 | Redesign sales table with lunch/dinner columns | Feature |
| #17 | Create restaurants table and CRUD endpoints | Feature |
| #18 | Create expenditures table linked to sales | Feature |
| #19 | Create assignments table and CRUD endpoints | Feature |
| #20 | Update signup/login to use email | Feature |
| #21 | Add user management endpoints | Feature |
| #22 | Update monthly report to aggregate lunch/dinner | Feature |

---

### Completed Issues

| Issue # | Description |
|---------|-------------|
| #13 | Reorganized flat Go files into `database/`, `models/`, `handlers/`, `middleware/` packages |
| #14 | Redesigned all 2 existing tables, added 3 new tables (5 total) |
| #15 | Users table now has `name`, `email` (unique), `status` fields |
| #16 | Sales table redesigned with `lunch_head_count`, `lunch_sale`, `dinner_head_count`, `dinner_sale`, `credit_sale`, `reji_money`, `restaurant_id`, `note` |
| #17 | Restaurants table created with full CRUD API endpoints |
| #18 | Expenditures table created with cascading delete linked to sales |
| #19 | Assignments table created with CRUD API for restaurant-employee mapping |
| #20 | Signup accepts `name`/`email`/`password`/`role`; Login uses `email`/`password` |
| #21 | GET `/api/users` and PUT `/api/users/status` endpoints added |
| #22 | Monthly report now returns `total_lunch`, `total_dinner`, and combined `total_sales` |

---

### Project Structure (After Sprint 2)

```
backend/
├── main.go                          # Entry point, route registration
├── go.mod                           # Go module definition
├── go.sum                           # Dependency checksums
├── database/
│   └── database.go                  # SQLite init, schema (5 tables)
├── models/
│   └── models.go                    # All struct definitions
├── handlers/
│   ├── user.go                      # Signup, Login, GetUsers, UpdateUserStatus
│   ├── sales.go                     # AddSale, GetSales, GetMySales, GetMonthlyReport
│   ├── restaurant.go                # Restaurant CRUD, Assignment CRUD
│   ├── test_helpers_test.go         # Shared test DB setup/teardown
│   ├── user_test.go                 # User handler unit tests (13 tests)
│   ├── sales_test.go               # Sales handler unit tests (12 tests)
│   └── restaurant_test.go          # Restaurant & Assignment tests (20 tests)
└── middleware/
    ├── middleware.go                 # JWT auth middleware, CORS middleware
    └── middleware_test.go           # Middleware unit tests (8 tests)
```

---

### Database Schema

#### `users`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL |
| email | TEXT | NOT NULL, UNIQUE |
| password | TEXT | NOT NULL (bcrypt hashed) |
| role | TEXT | NOT NULL, CHECK('manager','employee') |
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK('active','inactive') |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### `restaurants`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| name | TEXT | NOT NULL, UNIQUE |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### `sales`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| employee_id | INTEGER | NOT NULL, FK → users(id) |
| restaurant_id | INTEGER | NOT NULL, FK → restaurants(id) |
| date | TEXT | NOT NULL |
| lunch_head_count | INTEGER | NOT NULL, DEFAULT 0 |
| lunch_sale | REAL | NOT NULL, DEFAULT 0 |
| dinner_head_count | INTEGER | NOT NULL, DEFAULT 0 |
| dinner_sale | REAL | NOT NULL, DEFAULT 0 |
| credit_sale | REAL | NOT NULL, DEFAULT 0 |
| reji_money | REAL | NOT NULL, DEFAULT 0 |
| note | TEXT | nullable |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

#### `expenditures`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| sale_id | INTEGER | NOT NULL, FK → sales(id) ON DELETE CASCADE |
| title | TEXT | NOT NULL |
| amount | REAL | NOT NULL, DEFAULT 0 |

#### `assignments`
| Column | Type | Constraints |
|--------|------|-------------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT |
| restaurant_id | INTEGER | NOT NULL, FK → restaurants(id) |
| employee_id | INTEGER | NOT NULL, FK → users(id) |
| status | TEXT | NOT NULL, DEFAULT 'active', CHECK('active','inactive') |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP |

---

### API Endpoints Summary

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/signup` | No | — | Register a new user (name, email, password, role) |
| POST | `/api/login` | No | — | Login with email/password, receive JWT |
| GET | `/api/health` | No | — | Health check |
| GET | `/api/restaurants` | Yes | Any | List all restaurants |
| POST | `/api/restaurants/add` | Yes | Any | Add a new restaurant |
| DELETE | `/api/restaurants/delete?id=` | Yes | Any | Delete a restaurant |
| POST | `/api/sales` | Yes | Employee | Submit a daily sales entry with expenditures |
| GET | `/api/sales/my` | Yes | Employee | View own sales history |
| GET | `/api/sales/all` | Yes | Manager | View all sales (optional `?start_date=&end_date=`) |
| GET | `/api/reports/monthly` | Yes | Manager | Monthly report (optional `?month=YYYY-MM`) |
| GET | `/api/users` | Yes | Any | List all users |
| PUT | `/api/users/status` | Yes | Any | Activate/deactivate a user account |
| GET | `/api/assignments` | Yes | Any | List all restaurant-employee assignments |
| POST | `/api/assignments/add` | Yes | Any | Create a new assignment |
| PUT | `/api/assignments/update` | Yes | Any | Update an existing assignment |
| DELETE | `/api/assignments/delete?id=` | Yes | Any | Remove an assignment |

---

### Tech Stack

- **Language**: Go (Golang)
- **Database**: SQLite (via `modernc.org/sqlite`)
- **Authentication**: JWT (`github.com/golang-jwt/jwt/v5`)
- **Password Hashing**: bcrypt (`golang.org/x/crypto/bcrypt`)
- **Server**: Go standard library `net/http`
- **Frontend**: React + TypeScript + Vite + Material UI

---

### What Changed from Sprint 1 → Sprint 2

| Area | Sprint 1 | Sprint 2 |
|------|----------|----------|
| Project layout | All `.go` files in `backend/` root | Proper `database/`, `models/`, `handlers/`, `middleware/` packages |
| Users table | `username` only | `name`, `email`, `status` fields added |
| Login field | `username` + password | `email` + password (matches frontend) |
| Sales table | `item_name`, `quantity`, `unit_price`, `total_price` | `lunch_head_count`, `lunch_sale`, `dinner_head_count`, `dinner_sale`, `credit_sale`, `reji_money` |
| Restaurants | Not in backend | New table + full CRUD API |
| Expenditures | Not in backend | New table linked to sales (cascade delete) |
| Assignments | Not in backend | New table + full CRUD API |
| User management | Not in backend | GET users + activate/deactivate |
| Monthly report | Summed `total_price` and `quantity` | Sums lunch/dinner sales separately |
| Tables total | 2 (users, sales) | 5 (users, restaurants, sales, expenditures, assignments) |
| API endpoints | 7 | 16 |

---

### Files Changed in Sprint 2

| File | Action | Details |
|------|--------|---------|
| `backend/database/database.go` | Moved from `backend/database.go` & rewritten | New schema with 5 tables, foreign keys, cascading deletes |
| `backend/models/models.go` | Moved from `backend/user.go` & rewritten | 12 struct types matching all frontend interfaces |
| `backend/handlers/sales.go` | Moved from `backend/sales.go` & rewritten | New sale columns, expenditure insertion, restaurant lookup |
| `backend/handlers/user.go` | **New file** | Signup (email-based), Login, GetUsers, UpdateUserStatus |
| `backend/handlers/restaurant.go` | **New file** | Restaurant CRUD + Assignment CRUD (6 handlers) |
| `backend/middleware/middleware.go` | Moved from `backend/auth.go` & updated | JWT claims now include `name` and `email` |
| `backend/main.go` | Updated | 16 route registrations (was 7) |
| `README.md` | Updated | Sprint 2 report added |
| `backend/handlers/test_helpers_test.go` | **New file** | Shared test setup: in-memory SQLite DB with all 5 tables |
| `backend/handlers/user_test.go` | **New file** | 13 unit tests for Signup, Login, GetUsers, UpdateUserStatus |
| `backend/handlers/sales_test.go` | **New file** | 12 unit tests for AddSale, GetSales, GetMySales, GetMonthlyReport |
| `backend/handlers/restaurant_test.go` | **New file** | 20 unit tests for Restaurant CRUD + Assignment CRUD |
| `backend/middleware/middleware_test.go` | **New file** | 8 unit tests for AuthMiddleware + CORSMiddleware |

---

### Unit Testing

All backend handlers and middleware are covered by **48 unit tests** using Go's built-in `testing` package with `net/http/httptest` for HTTP handler testing. Tests use an **in-memory SQLite database** so no external database is needed.

#### Test Summary

| Test File | Package | Tests | What's Covered |
|-----------|---------|-------|----------------|
| `handlers/test_helpers_test.go` | handlers | — | Shared `setupTestDB()` / `teardownTestDB()` with in-memory SQLite |
| `handlers/user_test.go` | handlers | 13 | Signup (success, method not allowed, missing fields, duplicate email, default role), Login (success, method not allowed, wrong password, nonexistent user, inactive user, missing fields), GetUsers (empty, with data), UpdateUserStatus (success, method not allowed, invalid status) |
| `handlers/sales_test.go` | handlers | 12 | AddSale (success, manager forbidden, missing fields, multiple expenditures), GetSales (manager only, success, date filter, with expenditures), GetMySales (success, empty), GetMonthlyReport (manager only, with data) |
| `handlers/restaurant_test.go` | handlers | 20 | GetRestaurants (empty, with data), AddRestaurant (success, method not allowed, empty name, duplicate), DeleteRestaurant (success, method not allowed, missing ID), GetAssignments (empty, with data), AddAssignment (success, method not allowed, missing fields, default status), UpdateAssignment (success, method not allowed), DeleteAssignment (success, method not allowed, missing ID) |
| `middleware/middleware_test.go` | middleware | 8 | AuthMiddleware (valid token, missing header, invalid format, invalid token, expired token, wrong signing key), CORSMiddleware (headers, preflight OPTIONS) |

#### How to Run Tests

```bash
# Navigate to the backend directory
cd backend

# Run all tests with verbose output
go test ./... -v

# Run only handler tests
go test ./handlers -v

# Run only middleware tests
go test ./middleware -v

# Run a specific test by name
go test ./handlers -run TestLogin -v

# Run tests without cache
go test ./... -v -count=1
```

#### Test Results (All Passing)

```
ok   prepsheet-backend/handlers    3.352s   (40 tests)
ok   prepsheet-backend/middleware   2.238s   (8 tests)
```

