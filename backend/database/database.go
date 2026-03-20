package database

import (
	"database/sql"
	"log"

	_ "modernc.org/sqlite"
)

var DB *sql.DB

// InitDB initializes the SQLite database and creates the required tables.
func InitDB() {
	var err error
	DB, err = sql.Open("sqlite", "./prepsheet.db")
	if err != nil {
		log.Fatal("Failed to open database:", err)
	}

	// Enable WAL mode for better concurrent read performance
	_, err = DB.Exec("PRAGMA journal_mode=WAL;")
	if err != nil {
		log.Fatal("Failed to set WAL mode:", err)
	}

	// Enable foreign keys
	_, err = DB.Exec("PRAGMA foreign_keys=ON;")
	if err != nil {
		log.Fatal("Failed to enable foreign keys:", err)
	}

	createTables()
	log.Println("Database initialized successfully")
}

func createTables() {
	usersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		role TEXT NOT NULL CHECK(role IN ('manager', 'employee')),
		status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	restaurantsTable := `
	CREATE TABLE IF NOT EXISTS restaurants (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);`

	salesTable := `
	CREATE TABLE IF NOT EXISTS sales (
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
	);`

	expendituresTable := `
	CREATE TABLE IF NOT EXISTS expenditures (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sale_id INTEGER NOT NULL,
		title TEXT NOT NULL,
		amount REAL NOT NULL DEFAULT 0,
		FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
	);`

	assignmentsTable := `
	CREATE TABLE IF NOT EXISTS assignments (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		restaurant_id INTEGER NOT NULL,
		employee_id INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
		FOREIGN KEY (employee_id) REFERENCES users(id)
	);`

	tables := []struct {
		name string
		sql  string
	}{
		{"users", usersTable},
		{"restaurants", restaurantsTable},
		{"sales", salesTable},
		{"expenditures", expendituresTable},
		{"assignments", assignmentsTable},
	}

	for _, t := range tables {
		_, err := DB.Exec(t.sql)
		if err != nil {
			log.Fatalf("Failed to create %s table: %v", t.name, err)
		}
	}
}
