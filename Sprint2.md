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


