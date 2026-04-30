# PrepSheet

PrepSheet is a web-based restaurant sales management system for managers and employees. Employees can submit daily sales entries for their assigned restaurants, while managers can review reports, manage restaurants, manage employees, and monitor sales trends.

## Team Members

- Tikaharu Sharma (Frontend)
- Sampada Sharma (Frontend)
- Sahith Reddy Gopidi (Backend)
- Akshay Jaidi (Backend)

## What the Application Does

PrepSheet supports two user roles.

`manager`
- Log in and access the dashboard
- Create, edit, and delete restaurants
- Create, edit, delete, and search employees
- Assign employees to restaurants
- View monthly reports
- View sales data visualizations
- Change password in settings

`employee`
- Log in and access the dashboard
- Submit daily sales entries for assigned restaurants
- View dashboard and report data for their own scope

## Tech Stack

- Frontend: React, TypeScript, Vite, Material UI, Recharts
- Backend: Go, `net/http`
- Database: SQLite
- Testing: Vitest, Testing Library, Cypress, Go test

## Project Structure

```text
PrepSheet/
├── frontend/   # React + Vite client
├── backend/    # Go API + SQLite database
└── README.md
```

## Requirements

To run the project locally, install:

- Node.js and npm
- Go

## Environment and Default Ports

The app currently expects these local URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8080`

Important implementation detail:

- The frontend API base URL is currently hardcoded to `http://localhost:8080/api` in `frontend/src/lib/api.ts`.
- Cypress is configured to use `http://localhost:5173`.

## Optional Environment Variables

The backend can run without custom environment variables, but these are supported:

- `JWT_SECRET`
  Used to sign JWTs. If unset, the backend falls back to a development default.
- `ADMIN_NAME`
  Seeded default manager username.
- `ADMIN_EMAIL`
  Seeded default manager email.
- `ADMIN_PASSWORD`
  Seeded default manager password.

If these are not set, the backend seeds a default manager account with:

- Name: `admin`
- Email: `admin@example.com`
- Password: `admin`

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd PrepSheet
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Install backend dependencies

Go dependencies are managed automatically through `go.mod` and `go.sum`.

## Running the Application

Run the backend and frontend in separate terminals.

### Terminal 1: Start the backend

Run this from the `backend/` directory:

```bash
cd backend
go run .
```

Expected result:

- The API starts on `http://localhost:8080`
- SQLite database file `prepsheet.db` is created in `backend/` if it does not already exist
- Required tables and indexes are created automatically
- A default manager account is seeded if one does not already exist

### Terminal 2: Start the frontend

```bash
cd frontend
npm run dev
```

Expected result:

- The frontend starts on `http://localhost:5173`

## How to Use the Application

### Manager flow

1. Open `http://localhost:5173`
2. Log in with the seeded manager account or another manager account
3. Create restaurants
4. Create employees
5. Assign employees to restaurants
6. Review dashboard summaries, reports, and visualizations
7. Update password from the Settings page if needed

### Employee flow

1. Log in with an employee account created by a manager
2. Open the Sales Entry page
3. Select an assigned restaurant
4. Enter date, lunch and dinner sales, counts, expenditures, and notes
5. Submit the daily sales record
6. Review dashboard and report pages for allowed data

## Main Application Pages

- `/login`  
  Authentication page for managers and employees
- `/home`  
  Dashboard with monthly summaries and trend charts
- `/sales-entry`  
  Sales submission form
- `/reports`  
  Monthly reporting page
- `/users`  
  Manager-only employee management page
- `/restaurants`  
  Manager-only restaurant management page
- `/visualization`  
  Manager-only sales visualization page
- `/settings`  
  Manager-only password change page

## Authentication and Access Control

- JWT-based authentication is used for protected API routes.
- Frontend route guards restrict access based on login state and role.
- Manager-only pages are hidden from employees.
- Employees can only submit and view data within their allowed scope.

## Database Notes

- SQLite is used as the local database.
- The database file is created automatically when the backend starts.
- Current default path: `backend/prepsheet.db` when running the backend from the `backend/` directory.
- The backend also runs startup migrations for legacy schema updates.

## Running Tests

### Frontend unit tests

```bash
cd frontend
npm test
```

### Frontend Cypress tests

Make sure both frontend and backend are already running, then:

```bash
cd frontend
npm run cypress:run
```

For interactive Cypress:

```bash
cd frontend
npm run cypress:open
```

### Frontend production build

```bash
cd frontend
npm run build
```

### Backend tests

```bash
cd backend
go test ./...
```

## Troubleshooting

### Blank page after login

Check that:

- the backend is running on `http://localhost:8080`
- the frontend is running on `http://localhost:5173`
- both dependencies were installed successfully

### Login fails

Check that:

- the backend started successfully
- the SQLite database was created
- the seeded admin credentials are correct
- the account is active

### Port conflict

If port `5173` or `8080` is already in use, stop the other process using that port before starting PrepSheet. The current frontend code assumes the backend stays on `localhost:8080`.

## Notes for Grading / Demo

For a clean local demo:

1. Start the backend from `backend/`
2. Start the frontend from `frontend/`
3. Log in with the manager account
4. Create at least one restaurant
5. Create at least one employee
6. Assign that employee to a restaurant
7. Submit sales entries and show dashboard/report behavior

