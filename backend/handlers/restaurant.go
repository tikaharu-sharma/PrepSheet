package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"prepsheet-backend/database"
	"prepsheet-backend/models"
)

// GetRestaurants returns restaurants owned by the logged-in manager
func GetRestaurants(w http.ResponseWriter, r *http.Request) {
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

	// Determine if requester is a manager
	var role string
	err := database.DB.QueryRow("SELECT role FROM users WHERE id = ?", managerID).Scan(&role)
	if err != nil {
		http.Error(w, `{"error": "User not found"}`, http.StatusUnauthorized)
		return
	}

	// If manager, get their restaurants; otherwise return empty
	var rows *sql.Rows
	if role == "manager" {
		rows, err = database.DB.Query("SELECT id, name FROM restaurants WHERE manager_id = ? ORDER BY name", managerID)
	} else {
		// Employees can only see actively assigned restaurants.
		rows, err = database.DB.Query(
			"SELECT DISTINCT r.id, r.name FROM restaurants r JOIN assignments a ON r.id = a.restaurant_id WHERE a.employee_id = ? AND a.status = 'active' ORDER BY r.name",
			managerID,
		)
	}

	if err != nil {
		http.Error(w, `{"error": "Failed to fetch restaurants"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var restaurants []models.Restaurant
	for rows.Next() {
		var restaurant models.Restaurant
		if err := rows.Scan(&restaurant.ID, &restaurant.Name); err != nil {
			http.Error(w, `{"error": "Failed to parse restaurant data"}`, http.StatusInternalServerError)
			return
		}
		restaurants = append(restaurants, restaurant)
	}
	if restaurants == nil {
		restaurants = []models.Restaurant{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(restaurants)
}

// AddRestaurant creates a new restaurant owned by the logged-in manager
func AddRestaurant(w http.ResponseWriter, r *http.Request) {
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
		http.Error(w, `{"error": "Only managers can create restaurants"}`, http.StatusForbidden)
		return
	}

	var req struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Name == "" {
		http.Error(w, `{"error": "Restaurant name is required"}`, http.StatusBadRequest)
		return
	}

	result, err := database.DB.Exec("INSERT INTO restaurants (name, manager_id) VALUES (?, ?)", req.Name, managerID)
	if err != nil {
		http.Error(w, `{"error": "Restaurant already exists or creation failed"}`, http.StatusConflict)
		return
	}

	id, _ := result.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(models.Restaurant{ID: int(id), Name: req.Name})
}

// UpdateRestaurant updates a restaurant name by ID (manager-owned).
func UpdateRestaurant(w http.ResponseWriter, r *http.Request) {
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

	var req struct {
		ID   int    `json:"id"`
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.ID == 0 || req.Name == "" {
		http.Error(w, `{"error": "Restaurant ID and name are required"}`, http.StatusBadRequest)
		return
	}

	// Verify restaurant belongs to this manager
	var restManagerID int
	err := database.DB.QueryRow("SELECT manager_id FROM restaurants WHERE id = ?", req.ID).Scan(&restManagerID)
	if err != nil || restManagerID != managerID {
		http.Error(w, `{"error": "Restaurant not found or does not belong to this manager"}`, http.StatusForbidden)
		return
	}

	_, err = database.DB.Exec("UPDATE restaurants SET name = ? WHERE id = ?", req.Name, req.ID)
	if err != nil {
		lowerErr := strings.ToLower(err.Error())
		if strings.Contains(lowerErr, "unique") || strings.Contains(lowerErr, "constraint") {
			http.Error(w, `{"error": "Restaurant name already exists"}`, http.StatusConflict)
			return
		}
		http.Error(w, fmt.Sprintf(`{"error": "Failed to update restaurant: %s"}`, strings.ReplaceAll(err.Error(), `"`, `\\"`)), http.StatusInternalServerError)
		return
	}

	var restaurant models.Restaurant
	if err = database.DB.QueryRow("SELECT id, name FROM restaurants WHERE id = ?", req.ID).Scan(&restaurant.ID, &restaurant.Name); err != nil {
		http.Error(w, `{"error": "Failed to fetch updated restaurant"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(restaurant)
}

// DeleteRestaurant removes a restaurant by ID (manager-owned).
func DeleteRestaurant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	// Get manager ID from context
	managerID, ok := r.Context().Value("user_id").(int)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, `{"error": "Restaurant ID is required"}`, http.StatusBadRequest)
		return
	}

	// Verify restaurant belongs to this manager
	var restManagerID int
	err := database.DB.QueryRow("SELECT manager_id FROM restaurants WHERE id = ?", id).Scan(&restManagerID)
	if err != nil || restManagerID != managerID {
		http.Error(w, `{"error": "Restaurant not found or does not belong to this manager"}`, http.StatusForbidden)
		return
	}

	_, err = database.DB.Exec("DELETE FROM restaurants WHERE id = ?", id)
	if err != nil {
		http.Error(w, `{"error": "Failed to delete restaurant"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Restaurant deleted"})
}

// GetAssignments returns assignments for restaurants owned by the logged-in manager
func GetAssignments(w http.ResponseWriter, r *http.Request) {
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
		http.Error(w, `{"error": "Only managers can view assignments"}`, http.StatusForbidden)
		return
	}

	query := `
		SELECT a.id, a.restaurant_id, r.name, a.employee_id, u.name, u.email, a.status
		FROM assignments a
		JOIN restaurants r ON a.restaurant_id = r.id
		JOIN users u ON a.employee_id = u.id
		WHERE r.manager_id = ?
		ORDER BY r.name`

	rows, err := database.DB.Query(query, managerID)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch assignments"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var assignments []models.Assignment
	for rows.Next() {
		var a models.Assignment
		if err := rows.Scan(&a.ID, &a.RestaurantID, &a.RestaurantName, &a.EmployeeID, &a.EmployeeName, &a.EmployeeEmail, &a.Status); err != nil {
			http.Error(w, `{"error": "Failed to parse assignment data"}`, http.StatusInternalServerError)
			return
		}
		assignments = append(assignments, a)
	}
	if assignments == nil {
		assignments = []models.Assignment{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(assignments)
}

// AddAssignment creates a new restaurant-employee assignment (manager-scoped).
func AddAssignment(w http.ResponseWriter, r *http.Request) {
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
		http.Error(w, `{"error": "Only managers can create assignments"}`, http.StatusForbidden)
		return
	}

	var req models.AssignmentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.RestaurantID == 0 || req.EmployeeID == 0 {
		http.Error(w, `{"error": "Restaurant ID and employee ID are required"}`, http.StatusBadRequest)
		return
	}

	// Verify restaurant belongs to this manager
	var restManagerID int
	err = database.DB.QueryRow("SELECT manager_id FROM restaurants WHERE id = ?", req.RestaurantID).Scan(&restManagerID)
	if err != nil || restManagerID != managerID {
		http.Error(w, `{"error": "Restaurant not found or does not belong to this manager"}`, http.StatusForbidden)
		return
	}

	// Verify employee belongs to this manager
	var empManagerID *int
	err = database.DB.QueryRow("SELECT manager_id FROM users WHERE id = ? AND role = 'employee'", req.EmployeeID).Scan(&empManagerID)
	if err != nil || empManagerID == nil || *empManagerID != managerID {
		http.Error(w, `{"error": "Employee not found or does not belong to this manager"}`, http.StatusForbidden)
		return
	}

	if req.Status == "" {
		req.Status = "active"
	}

	result, err := database.DB.Exec(
		"INSERT INTO assignments (restaurant_id, employee_id, status) VALUES (?, ?, ?)",
		req.RestaurantID, req.EmployeeID, req.Status,
	)
	if err != nil {
		// Check if it's a duplicate assignment error
		if strings.Contains(err.Error(), "UNIQUE") {
			http.Error(w, `{"error": "Employee is already assigned to this restaurant"}`, http.StatusConflict)
			return
		}
		http.Error(w, `{"error": "Failed to create assignment"}`, http.StatusInternalServerError)
		return
	}

	id, _ := result.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Assignment created",
		"id":      id,
	})
}

// UpdateAssignment updates an assignment's status for a manager-owned restaurant.
func UpdateAssignment(w http.ResponseWriter, r *http.Request) {
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
		http.Error(w, `{"error": "Only managers can update assignments"}`, http.StatusForbidden)
		return
	}

	var req struct {
		ID           int    `json:"id"`
		RestaurantID int    `json:"restaurant_id"`
		EmployeeID   int    `json:"employee_id"`
		Status       string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.ID == 0 || req.RestaurantID == 0 || req.EmployeeID == 0 {
		http.Error(w, `{"error": "Assignment ID, restaurant ID, and employee ID are required"}`, http.StatusBadRequest)
		return
	}

	if req.Status != "active" && req.Status != "inactive" {
		http.Error(w, `{"error": "Status must be 'active' or 'inactive'"}`, http.StatusBadRequest)
		return
	}

	var ownerID int
	err = database.DB.QueryRow(
		`SELECT r.manager_id
		 FROM assignments a
		 JOIN restaurants r ON a.restaurant_id = r.id
		 WHERE a.id = ? AND a.restaurant_id = ? AND a.employee_id = ?`,
		req.ID,
		req.RestaurantID,
		req.EmployeeID,
	).Scan(&ownerID)
	if err != nil || ownerID != managerID {
		http.Error(w, `{"error": "Assignment not found or does not belong to this manager"}`, http.StatusForbidden)
		return
	}

	_, err = database.DB.Exec("UPDATE assignments SET status = ? WHERE id = ?", req.Status, req.ID)
	if err != nil {
		http.Error(w, `{"error": "Failed to update assignment"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Assignment updated"})
}

// DeleteAssignment removes an assignment by ID (manager-scoped).
func DeleteAssignment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
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
		http.Error(w, `{"error": "Only managers can delete assignments"}`, http.StatusForbidden)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, `{"error": "Assignment ID is required"}`, http.StatusBadRequest)
		return
	}

	// Verify assignment belongs to a restaurant owned by this manager
	var restManagerID int
	err = database.DB.QueryRow(
		"SELECT r.manager_id FROM assignments a JOIN restaurants r ON a.restaurant_id = r.id WHERE a.id = ?",
		id,
	).Scan(&restManagerID)
	if err != nil || restManagerID != managerID {
		http.Error(w, `{"error": "Assignment not found or does not belong to this manager"}`, http.StatusForbidden)
		return
	}

	_, err = database.DB.Exec("DELETE FROM assignments WHERE id = ?", id)
	if err != nil {
		http.Error(w, `{"error": "Failed to delete assignment"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Assignment deleted"})
}
