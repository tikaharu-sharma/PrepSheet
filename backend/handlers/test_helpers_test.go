package handlers

import (
	"database/sql"
	"log"

	"prepsheet-backend/database"

	_ "modernc.org/sqlite"
)

// setupTestDB creates an in-memory SQLite database for testing.
func setupTestDB() {
	var err error
	database.DB, err = sql.Open("sqlite", ":memory:")
	if err != nil {
		log.Fatal("Failed to open test database:", err)
	}

	database.DB.Exec("PRAGMA foreign_keys=ON;")

	tables := []string{
		`CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT NOT NULL UNIQUE,
			password TEXT NOT NULL,
			role TEXT NOT NULL CHECK(role IN ('manager', 'employee')),
			manager_id INTEGER,
			status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS restaurants (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL UNIQUE,
			manager_id INTEGER,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);`,
		`CREATE TABLE IF NOT EXISTS sales (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			employee_id INTEGER NOT NULL,
			restaurant_id INTEGER NOT NULL,
			date TEXT NOT NULL,
			lunch_head_count INTEGER NOT NULL DEFAULT 0,
			lunch_sale REAL NOT NULL DEFAULT 0,
			dinner_head_count INTEGER NOT NULL DEFAULT 0,
			dinner_sale REAL NOT NULL DEFAULT 0,
			credit_sale REAL NOT NULL DEFAULT 0,
			reji_money REAL NOT NULL DEFAULT 0,
			note TEXT,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (employee_id) REFERENCES users(id),
			FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
		);`,
		`CREATE TABLE IF NOT EXISTS expenditures (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			sale_id INTEGER NOT NULL,
			title TEXT NOT NULL,
			amount REAL NOT NULL DEFAULT 0,
			FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
		);`,
		`CREATE TABLE IF NOT EXISTS assignments (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			restaurant_id INTEGER NOT NULL,
			employee_id INTEGER NOT NULL,
			status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
			FOREIGN KEY (employee_id) REFERENCES users(id)
		);`,
	}

	for _, t := range tables {
		_, err := database.DB.Exec(t)
		if err != nil {
			log.Fatalf("Failed to create test table: %v", err)
		}
	}
}

// teardownTestDB closes the test database connection.
func teardownTestDB() {
	if database.DB != nil {
		database.DB.Close()
	}
}
