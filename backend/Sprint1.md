# Sprint 1 - PrepSheet Backend

## User Stories

1. **As an employee**, I want to sign up for an account so that I can log into the system.
2. **As a manager**, I want to sign up for a manager account so that I can access management features.
3. **As a user (employee/manager)**, I want to log in with my credentials so that I can access the system securely.
4. **As an employee**, I want to add daily sales entries (item name, quantity, unit price, date) at the end of the day so that sales data is recorded.
5. **As an employee**, I want to view my own past sales entries so that I can verify what I have submitted.
6. **As a manager**, I want to view all sales entries (with optional date filters) so that I can monitor restaurant performance.
7. **As a manager**, I want to generate a monthly sales report so that I can use it for accounting and tax purposes.

---

## Issues Planned for Sprint 1

### Backend Issues
| Issue # | Title | Description |
|---------|-------|-------------|
| 1 | Set up Go project with SQLite | Initialize Go module, set up project structure, and configure SQLite database |
| 2 | Create database schema | Design and implement users and sales tables with proper constraints |
| 3 | Implement user signup API | POST `/api/signup` — register new employees and managers with hashed passwords |
| 4 | Implement user login API | POST `/api/login` — authenticate users and return JWT tokens |
| 5 | Implement JWT auth middleware | Protect routes by validating JWT tokens and injecting user context |
| 6 | Implement add sale entry API | POST `/api/sales` — allow employees to log daily sales |
| 7 | Implement view all sales API (manager) | GET `/api/sales/all` — allow managers to view all sales with date filters |
| 8 | Implement view own sales API (employee) | GET `/api/sales/my` — allow employees to view their own sales history |
| 9 | Implement monthly report API | GET `/api/reports/monthly` — aggregated monthly sales data for managers |

## Successfully Completed (Sprint 1)

- [x] **Issue 1**: Set up Go project with SQLite — project structure created, SQLite database configured
- [x] **Issue 2**: Create database schema — `users` and `sales` tables with foreign keys and constraints
- [x] **Issue 3**: Implement user signup API — POST `/api/signup` with bcrypt password hashing
- [x] **Issue 4**: Implement user login API — POST `/api/login` with JWT token generation
- [x] **Issue 5**: Implement JWT auth middleware — token validation, role and user context injection
- [x] **Issue 6**: Implement add sale entry API — POST `/api/sales` (employee only)
- [x] **Issue 7**: Implement view all sales API — GET `/api/sales/all` with date filtering (manager only)
- [x] **Issue 8**: Implement view own sales API — GET `/api/sales/my` (employee)
- [x] **Issue 9**: Implement monthly report API — GET `/api/reports/monthly` with month filter (manager only)


## API Endpoints Summary

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/signup` | No | — | Register a new user |
| POST | `/api/login` | No | — | Login and receive JWT |
| POST | `/api/sales` | Yes | Employee | Add a sales entry |
| GET | `/api/sales/my` | Yes | Employee | View own sales |
| GET | `/api/sales/all` | Yes | Manager | View all sales (optional: `?start_date=&end_date=`) |
| GET | `/api/reports/monthly` | Yes | Manager | Monthly report (optional: `?month=YYYY-MM`) |
| GET | `/api/health` | No | — | Health check |

---

## Tech Stack

- **Language**: Go (Golang)
- **Database**: SQLite (via `github.com/mattn/go-sqlite3`)
- **Authentication**: JWT (`github.com/golang-jwt/jwt/v5`)
- **Password Hashing**: bcrypt (`golang.org/x/crypto/bcrypt`)
- **Server**: Go standard library `net/http`

