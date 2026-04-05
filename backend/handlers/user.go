package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"prepsheet-backend/database"
	"prepsheet-backend/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// JWTSecret is the signing key for JWT tokens.
var JWTSecret = []byte("prepsheet-secret-key-change-in-production")

func getStoredPasswordHash(userID int) (string, error) {
	var passwordHash string
	err := database.DB.QueryRow("SELECT password FROM users WHERE id = ?", userID).Scan(&passwordHash)
	return passwordHash, err
}

// Signup registers a new user.
func Signup(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Email == "" || req.Password == "" {
		http.Error(w, `{"error": "Name, email, and password are required"}`, http.StatusBadRequest)
		return
	}

	if req.Role != "manager" && req.Role != "employee" {
		req.Role = "employee"
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"error": "Failed to hash password"}`, http.StatusInternalServerError)
		return
	}

	result, err := database.DB.Exec(
		"INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
		req.Name, req.Email, string(hashedPassword), req.Role,
	)
	if err != nil {
		http.Error(w, `{"error": "Email already exists or registration failed"}`, http.StatusConflict)
		return
	}

	userID, _ := result.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "User registered successfully",
		"user_id": userID,
	})
}

// Login authenticates a user and returns a JWT token.
func Login(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, `{"error": "Email/Username and password are required"}`, http.StatusBadRequest)
		return
	}

	var user models.User
	err := database.DB.QueryRow(
		"SELECT id, name, email, password, role, status FROM users WHERE email = ? OR name = ?",
		req.Email,
		req.Email,
	).Scan(&user.ID, &user.Name, &user.Email, &user.Password, &user.Role, &user.Status)
	if err != nil {
		http.Error(w, `{"error": "Invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	if user.Status != "active" {
		http.Error(w, `{"error": "Account is inactive"}`, http.StatusForbidden)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		http.Error(w, `{"error": "Invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": user.ID,
		"name":    user.Name,
		"email":   user.Email,
		"role":    user.Role,
		"exp":     time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(JWTSecret)
	if err != nil {
		http.Error(w, `{"error": "Failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.LoginResponse{
		Token:  tokenString,
		UserID: user.ID,
		Name:   user.Name,
		Email:  user.Email,
		Role:   user.Role,
	})
}

// VerifyPassword checks whether the authenticated user's current password is correct.
func VerifyPassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.VerifyPasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.CurrentPassword == "" {
		http.Error(w, `{"error": "Current password is required"}`, http.StatusBadRequest)
		return
	}

	passwordHash, err := getStoredPasswordHash(userID)
	if err != nil {
		http.Error(w, `{"error": "User not found"}`, http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.CurrentPassword)); err != nil {
		http.Error(w, `{"error": "Current password is incorrect"}`, http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Current password verified"})
}

// ChangePassword updates the authenticated user's password after verifying the current password.
func ChangePassword(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	userID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req models.ChangePasswordRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.CurrentPassword == "" || req.NewPassword == "" {
		http.Error(w, `{"error": "Current password and new password are required"}`, http.StatusBadRequest)
		return
	}

	if req.CurrentPassword == req.NewPassword {
		http.Error(w, `{"error": "New password must be different from the current password"}`, http.StatusBadRequest)
		return
	}

	passwordHash, err := getStoredPasswordHash(userID)
	if err != nil {
		http.Error(w, `{"error": "User not found"}`, http.StatusUnauthorized)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.CurrentPassword)); err != nil {
		http.Error(w, `{"error": "Current password is incorrect"}`, http.StatusUnauthorized)
		return
	}

	newPasswordHash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"error": "Failed to hash password"}`, http.StatusInternalServerError)
		return
	}

	_, err = database.DB.Exec("UPDATE users SET password = ? WHERE id = ?", string(newPasswordHash), userID)
	if err != nil {
		http.Error(w, `{"error": "Failed to update password"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Password updated successfully"})
}

// GetUsers returns employees managed by the logged-in manager, optionally with their assigned restaurants
func GetUsers(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Get manager ID from context
	managerID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if requester is a manager
	var role string
	err := database.DB.QueryRow("SELECT role FROM users WHERE id = ?", managerID).Scan(&role)
	if err != nil || role != "manager" {
		http.Error(w, `{"error": "Only managers can view employees"}`, http.StatusForbidden)
		return
	}

	// Query employees created by this manager
	rows, err := database.DB.Query(
		"SELECT id, name, email, status, created_at FROM users WHERE role = 'employee' AND manager_id = ? ORDER BY name",
		managerID,
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch employees"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var employees []models.EmployeeWithRestaurants
	for rows.Next() {
		var emp models.EmployeeWithRestaurants
		if err := rows.Scan(&emp.ID, &emp.Name, &emp.Email, &emp.Status, &emp.CreatedAt); err != nil {
			http.Error(w, `{"error": "Failed to parse employee data"}`, http.StatusInternalServerError)
			return
		}

		// Get assigned restaurants for this employee
		restRows, err := database.DB.Query(
			`SELECT r.id, r.name FROM assignments a
			 JOIN restaurants r ON a.restaurant_id = r.id
			 WHERE a.employee_id = ? AND r.manager_id = ?
			 ORDER BY r.name`,
			emp.ID,
			managerID,
		)
		if err == nil {
			emp.Restaurants = []models.Restaurant{}
			for restRows.Next() {
				var rest models.Restaurant
				if err := restRows.Scan(&rest.ID, &rest.Name); err == nil {
					emp.Restaurants = append(emp.Restaurants, rest)
				}
			}
			restRows.Close() // Close immediately after using, not with defer
		}

		employees = append(employees, emp)
	}

	if employees == nil {
		employees = []models.EmployeeWithRestaurants{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(employees)
}

// UpdateUserStatus toggles a user's active/inactive status.
func UpdateUserStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Get manager ID from context
	managerID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if requester is a manager
	var role string
	err := database.DB.QueryRow("SELECT role FROM users WHERE id = ?", managerID).Scan(&role)
	if err != nil || role != "manager" {
		http.Error(w, `{"error": "Only managers can update employee status"}`, http.StatusForbidden)
		return
	}

	var req models.UpdateEmployeeStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Status != "active" && req.Status != "inactive" {
		http.Error(w, `{"error": "Status must be 'active' or 'inactive'"}`, http.StatusBadRequest)
		return
	}

	// Verify the employee belongs to this manager
	var empManagerID *int
	err = database.DB.QueryRow("SELECT manager_id FROM users WHERE id = ? AND role = 'employee'", req.UserID).Scan(&empManagerID)
	if err != nil || empManagerID == nil || *empManagerID != managerID {
		http.Error(w, `{"error": "Employee not found or does not belong to this manager"}`, http.StatusForbidden)
		return
	}

	_, err = database.DB.Exec("UPDATE users SET status = ? WHERE id = ?", req.Status, req.UserID)
	if err != nil {
		http.Error(w, `{"error": "Failed to update employee status"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Employee status updated"})
}

// CreateEmployee creates a new employee under the logged-in manager
func CreateEmployee(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Get manager ID from context
	managerID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Check if requester is a manager
	var role string
	err := database.DB.QueryRow("SELECT role FROM users WHERE id = ?", managerID).Scan(&role)
	if err != nil || role != "manager" {
		http.Error(w, `{"error": "Only managers can create employees"}`, http.StatusForbidden)
		return
	}

	var req models.CreateEmployeeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Email == "" || req.Password == "" {
		http.Error(w, `{"error": "Name, email, and password are required"}`, http.StatusBadRequest)
		return
	}

	if req.Status != "active" && req.Status != "inactive" {
		req.Status = "active"
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, `{"error": "Failed to hash password"}`, http.StatusInternalServerError)
		return
	}

	result, err := database.DB.Exec(
		"INSERT INTO users (name, email, password, role, manager_id, status) VALUES (?, ?, ?, ?, ?, ?)",
		req.Name,
		req.Email,
		string(hashedPassword),
		"employee",
		managerID,
		req.Status,
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to create employee"}`, http.StatusConflict)
		return
	}

	employeeID, _ := result.LastInsertId()

	// Assign to provided restaurants if any
	if len(req.Restaurants) > 0 {
		for _, restaurantID := range req.Restaurants {
			// Verify restaurant belongs to this manager
			var restManagerID int
			err := database.DB.QueryRow("SELECT manager_id FROM restaurants WHERE id = ?", restaurantID).Scan(&restManagerID)
			if err != nil || restManagerID != managerID {
				continue // Skip restaurants that don't belong to this manager
			}

			// Create assignment (ignore if duplicate)
			database.DB.Exec(
				"INSERT OR IGNORE INTO assignments (restaurant_id, employee_id, status) VALUES (?, ?, 'active')",
				restaurantID,
				employeeID,
			)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Employee created successfully",
		"id":      employeeID,
	})
}

// UpdateEmployee updates employee name/email and optionally password.
func UpdateEmployee(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	managerID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var role string
	err := database.DB.QueryRow("SELECT role FROM users WHERE id = ?", managerID).Scan(&role)
	if err != nil || role != "manager" {
		http.Error(w, `{"error": "Only managers can update employees"}`, http.StatusForbidden)
		return
	}

	var req models.UpdateEmployeeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.UserID == 0 || req.Name == "" || req.Email == "" {
		http.Error(w, `{"error": "User ID, name, and email are required"}`, http.StatusBadRequest)
		return
	}

	var empManagerID int
	err = database.DB.QueryRow(
		"SELECT manager_id FROM users WHERE id = ? AND role = 'employee'",
		req.UserID,
	).Scan(&empManagerID)
	if err != nil || empManagerID != managerID {
		http.Error(w, `{"error": "Employee not found or does not belong to this manager"}`, http.StatusForbidden)
		return
	}

	if req.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, `{"error": "Failed to hash password"}`, http.StatusInternalServerError)
			return
		}

		_, err = database.DB.Exec(
			"UPDATE users SET name = ?, email = ?, password = ? WHERE id = ? AND role = 'employee'",
			req.Name, req.Email, string(hashedPassword), req.UserID,
		)
		if err != nil {
			http.Error(w, `{"error": "Failed to update employee"}`, http.StatusConflict)
			return
		}
	} else {
		_, err = database.DB.Exec(
			"UPDATE users SET name = ?, email = ? WHERE id = ? AND role = 'employee'",
			req.Name, req.Email, req.UserID,
		)
		if err != nil {
			http.Error(w, `{"error": "Failed to update employee"}`, http.StatusConflict)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Employee updated successfully"})
}

// DeleteEmployee removes an employee that belongs to the logged-in manager.
func DeleteEmployee(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	managerID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var role string
	err := database.DB.QueryRow("SELECT role FROM users WHERE id = ?", managerID).Scan(&role)
	if err != nil || role != "manager" {
		http.Error(w, `{"error": "Only managers can delete employees"}`, http.StatusForbidden)
		return
	}

	idParam := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idParam)
	if err != nil || id <= 0 {
		http.Error(w, `{"error": "Valid employee ID is required"}`, http.StatusBadRequest)
		return
	}

	var empManagerID int
	err = database.DB.QueryRow(
		"SELECT manager_id FROM users WHERE id = ? AND role = 'employee'",
		id,
	).Scan(&empManagerID)
	if err != nil || empManagerID != managerID {
		http.Error(w, `{"error": "Employee not found or does not belong to this manager"}`, http.StatusForbidden)
		return
	}

	var salesCount int
	err = database.DB.QueryRow("SELECT COUNT(*) FROM sales WHERE employee_id = ?", id).Scan(&salesCount)
	if err != nil {
		http.Error(w, `{"error": "Failed to validate employee deletion"}`, http.StatusInternalServerError)
		return
	}
	if salesCount > 0 {
		http.Error(w, `{"error": "Cannot delete employee with existing sales entries"}`, http.StatusConflict)
		return
	}

	tx, err := database.DB.Begin()
	if err != nil {
		http.Error(w, `{"error": "Failed to start transaction"}`, http.StatusInternalServerError)
		return
	}
	defer tx.Rollback()

	if _, err := tx.Exec("DELETE FROM assignments WHERE employee_id = ?", id); err != nil {
		http.Error(w, `{"error": "Failed to delete employee assignments"}`, http.StatusInternalServerError)
		return
	}

	result, err := tx.Exec("DELETE FROM users WHERE id = ? AND role = 'employee'", id)
	if err != nil {
		http.Error(w, `{"error": "Failed to delete employee"}`, http.StatusInternalServerError)
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil || rowsAffected == 0 {
		http.Error(w, `{"error": "Employee not found"}`, http.StatusNotFound)
		return
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, `{"error": "Failed to commit employee deletion"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Employee deleted successfully"})
}
