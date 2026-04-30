# Sprint 4 Report — PrepSheet

## Team

- Tikaharu Sharma
- Sampada Sharma
- Sahith Reddy Gopidi
- Akshay Jaidi
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