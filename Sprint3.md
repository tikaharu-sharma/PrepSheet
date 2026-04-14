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
