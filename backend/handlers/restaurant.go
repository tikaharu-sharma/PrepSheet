package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"prepsheet-backend/database"
	"prepsheet-backend/models"
)

// GetRestaurants returns all restaurants.
func GetRestaurants(w http.ResponseWriter, r *http.Request) {
	rows, err := database.DB.Query("SELECT id, name FROM restaurants ORDER BY name")
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch restaurants"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var restaurants []models.Restaurant
	for rows.Next() {
		var r models.Restaurant
		if err := rows.Scan(&r.ID, &r.Name); err != nil {
			http.Error(w, `{"error": "Failed to parse restaurant data"}`, http.StatusInternalServerError)
			return
		}
		restaurants = append(restaurants, r)
	}
	if restaurants == nil {
		restaurants = []models.Restaurant{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(restaurants)
}

// AddRestaurant creates a new restaurant.
func AddRestaurant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
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

	result, err := database.DB.Exec("INSERT INTO restaurants (name) VALUES (?)", req.Name)
	if err != nil {
		http.Error(w, `{"error": "Restaurant already exists or creation failed"}`, http.StatusConflict)
		return
	}

	id, _ := result.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(models.Restaurant{ID: int(id), Name: req.Name})
}
// UpdateRestaurant updates a restaurant name by ID.
func UpdateRestaurant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
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

	_, err := database.DB.Exec("UPDATE restaurants SET name = ? WHERE id = ?", req.Name, req.ID)
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
// DeleteRestaurant removes a restaurant by ID.
func DeleteRestaurant(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, `{"error": "Restaurant ID is required"}`, http.StatusBadRequest)
		return
	}

	_, err := database.DB.Exec("DELETE FROM restaurants WHERE id = ?", id)
	if err != nil {
		http.Error(w, `{"error": "Failed to delete restaurant"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Restaurant deleted"})
}

// GetAssignments returns all restaurant-employee assignments.
func GetAssignments(w http.ResponseWriter, r *http.Request) {
	query := `
		SELECT a.id, a.restaurant_id, r.name, a.employee_id, u.name, u.email, a.status
		FROM assignments a
		JOIN restaurants r ON a.restaurant_id = r.id
		JOIN users u ON a.employee_id = u.id
		ORDER BY r.name`

	rows, err := database.DB.Query(query)
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

// AddAssignment creates a new restaurant-employee assignment.
func AddAssignment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
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

	if req.Status == "" {
		req.Status = "active"
	}

	result, err := database.DB.Exec(
		"INSERT INTO assignments (restaurant_id, employee_id, status) VALUES (?, ?, ?)",
		req.RestaurantID, req.EmployeeID, req.Status,
	)
	if err != nil {
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

// UpdateAssignment modifies an existing assignment.
func UpdateAssignment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
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

	_, err := database.DB.Exec(
		"UPDATE assignments SET restaurant_id = ?, employee_id = ?, status = ? WHERE id = ?",
		req.RestaurantID, req.EmployeeID, req.Status, req.ID,
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to update assignment"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Assignment updated"})
}

// DeleteAssignment removes an assignment by ID.
func DeleteAssignment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, `{"error": "Method not allowed"}`, http.StatusMethodNotAllowed)
		return
	}

	id := r.URL.Query().Get("id")
	if id == "" {
		http.Error(w, `{"error": "Assignment ID is required"}`, http.StatusBadRequest)
		return
	}

	_, err := database.DB.Exec("DELETE FROM assignments WHERE id = ?", id)
	if err != nil {
		http.Error(w, `{"error": "Failed to delete assignment"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "Assignment deleted"})
}
