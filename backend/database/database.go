package database

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
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
	ensureIndexes()
	runMigrations()
	seedAdminUser()
	// Run migrations again so legacy rows can be backfilled with the now-seeded manager.
	runMigrations()
	log.Println("Database initialized successfully")
}

// ensureIndexes creates indexes on high-traffic query columns if they don't exist yet.
func ensureIndexes() {
	indexes := []struct {
		name string
		sql  string
	}{
		{
			"idx_sales_restaurant_date",
			"CREATE INDEX IF NOT EXISTS idx_sales_restaurant_date ON sales(restaurant_id, date)",
		},
		{
			"idx_sales_employee_date",
			"CREATE INDEX IF NOT EXISTS idx_sales_employee_date ON sales(employee_id, date)",
		},
		{
			"idx_users_role",
			"CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
		},
		{
			"idx_sales_unique_restaurant_date",
			"CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_unique_restaurant_date ON sales(restaurant_id, date)",
		},
	}
	for _, idx := range indexes {
		if _, err := DB.Exec(idx.sql); err != nil {
			log.Printf("Warning: failed to create index %s: %v", idx.name, err)
		}
	}
}

func seedAdminUser() {
	userName := os.Getenv("ADMIN_NAME")
	if userName == "" {
		userName = "admin"
	}
	userEmail := os.Getenv("ADMIN_EMAIL")
	if userEmail == "" {
		userEmail = "admin@example.com"
	}
	userPassword := os.Getenv("ADMIN_PASSWORD")
	if userPassword == "" {
		log.Println("WARNING: ADMIN_PASSWORD env var is not set. Using insecure default — set ADMIN_PASSWORD in production.")
		userPassword = "admin"
	}
	const userRole = "manager"

	var exists int
	err := DB.QueryRow("SELECT COUNT(*) FROM users WHERE name = ? OR email = ?", userName, userEmail).Scan(&exists)
	if err != nil {
		log.Printf("Failed to check admin user existence: %v", err)
		return
	}

	if exists > 0 {
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(userPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Failed to hash admin password: %v", err)
		return
	}

	_, err = DB.Exec("INSERT INTO users (name, email, password, role, status, manager_id) VALUES (?, ?, ?, ?, ?, ?)", userName, userEmail, string(hash), userRole, "active", nil)
	if err != nil {
		log.Printf("Failed to seed admin user: %v", err)
		return
	}

	log.Println("Admin user created: admin/admin")
}

// runMigrations handles schema changes for existing databases
func runMigrations() {
	if err := addUsersManagerIDColumnIfMissing(); err != nil {
		log.Printf("Migration warning (users.manager_id): %v", err)
	}

	if err := addRestaurantsManagerIDColumnIfMissing(); err != nil {
		log.Printf("Migration warning (restaurants.manager_id): %v", err)
	}

	if err := normalizeManagerUsers(); err != nil {
		log.Printf("Migration warning (normalize managers): %v", err)
	}

	if err := backfillRestaurantsManagerID(); err != nil {
		log.Printf("Migration warning (backfill restaurants.manager_id): %v", err)
	}

	if err := addSalesAuditColumnsIfMissing(); err != nil {
		log.Printf("Migration warning (sales audit columns): %v", err)
	}

	log.Println("Migrations completed")
}

func addSalesAuditColumnsIfMissing() error {
	hasUpdatedAt, err := columnExists("sales", "updated_at")
	if err != nil {
		return err
	}
	if !hasUpdatedAt {
		log.Println("Adding updated_at column to sales table...")
		if _, err := DB.Exec("ALTER TABLE sales ADD COLUMN updated_at DATETIME"); err != nil {
			return err
		}
	}

	hasUpdatedBy, err := columnExists("sales", "updated_by")
	if err != nil {
		return err
	}
	if !hasUpdatedBy {
		log.Println("Adding updated_by column to sales table...")
		if _, err := DB.Exec("ALTER TABLE sales ADD COLUMN updated_by INTEGER REFERENCES users(id)"); err != nil {
			return err
		}
	}
	return nil
}

func addUsersManagerIDColumnIfMissing() error {
	hasColumn, err := columnExists("users", "manager_id")
	if err != nil {
		return err
	}
	if hasColumn {
		return nil
	}

	log.Println("Adding manager_id column to users table...")
	_, err = DB.Exec("ALTER TABLE users ADD COLUMN manager_id INTEGER REFERENCES users(id)")
	return err
}

func addRestaurantsManagerIDColumnIfMissing() error {
	hasColumn, err := columnExists("restaurants", "manager_id")
	if err != nil {
		return err
	}
	if hasColumn {
		return nil
	}

	log.Println("Adding manager_id column to restaurants table...")
	_, err = DB.Exec("ALTER TABLE restaurants ADD COLUMN manager_id INTEGER REFERENCES users(id)")
	return err
}

func normalizeManagerUsers() error {
	// Managers should not point to another manager by manager_id.
	_, err := DB.Exec("UPDATE users SET manager_id = NULL WHERE role = 'manager' AND manager_id IS NOT NULL")
	return err
}

func backfillRestaurantsManagerID() error {
	hasColumn, err := columnExists("restaurants", "manager_id")
	if err != nil {
		return err
	}
	if !hasColumn {
		return nil
	}

	adminID, ok, err := getDefaultManagerID()
	if err != nil {
		return err
	}
	if !ok {
		// No manager exists yet. This pass can safely be retried after seedAdminUser.
		return nil
	}

	result, err := DB.Exec("UPDATE restaurants SET manager_id = ? WHERE manager_id IS NULL", adminID)
	if err != nil {
		return err
	}

	if rowsAffected, err := result.RowsAffected(); err == nil && rowsAffected > 0 {
		log.Printf("Backfilled manager_id for %d restaurant(s) using manager id %d", rowsAffected, adminID)
	}

	return nil
}

func getDefaultManagerID() (int, bool, error) {
	var managerID int
	err := DB.QueryRow("SELECT id FROM users WHERE role = 'manager' ORDER BY id LIMIT 1").Scan(&managerID)
	if err == sql.ErrNoRows {
		return 0, false, nil
	}
	if err != nil {
		return 0, false, err
	}
	return managerID, true, nil
}

func columnExists(tableName, columnName string) (bool, error) {
	rows, err := DB.Query(fmt.Sprintf("PRAGMA table_info(%s)", tableName))
	if err != nil {
		return false, err
	}
	defer rows.Close()

	for rows.Next() {
		var cid int
		var name string
		var typeName string
		var notNull int
		var defaultValue sql.NullString
		var pk int

		if err := rows.Scan(&cid, &name, &typeName, &notNull, &defaultValue, &pk); err != nil {
			return false, err
		}

		if name == columnName {
			return true, nil
		}
	}

	if err := rows.Err(); err != nil {
		return false, err
	}

	return false, nil
}

func createTables() {
	usersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL,
		email TEXT NOT NULL UNIQUE,
		password TEXT NOT NULL,
		role TEXT NOT NULL CHECK(role IN ('manager', 'employee')),
		manager_id INTEGER,
		status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (manager_id) REFERENCES users(id)
	);`

	restaurantsTable := `
	CREATE TABLE IF NOT EXISTS restaurants (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL UNIQUE,
		manager_id INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (manager_id) REFERENCES users(id)
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
		UNIQUE(restaurant_id, employee_id),
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
