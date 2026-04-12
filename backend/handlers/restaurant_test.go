package handlers

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"prepsheet-backend/database"
	"prepsheet-backend/models"
)

func TestGetRestaurants_Empty(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/restaurants", nil)
	rr := httptest.NewRecorder()
	GetRestaurants(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var restaurants []models.Restaurant
	json.NewDecoder(rr.Body).Decode(&restaurants)
	if len(restaurants) != 0 {
		t.Fatalf("expected 0 restaurants, got %d", len(restaurants))
	}
}

func TestAddRestaurant_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"name":"Test Restaurant"}`
	req := httptest.NewRequest(http.MethodPost, "/api/restaurants/add", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	AddRestaurant(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var restaurant models.Restaurant
	json.NewDecoder(rr.Body).Decode(&restaurant)
	if restaurant.Name != "Test Restaurant" {
		t.Fatalf("expected name 'Test Restaurant', got '%s'", restaurant.Name)
	}
	if restaurant.ID == 0 {
		t.Fatal("expected non-zero ID")
	}
}

func TestAddRestaurant_MethodNotAllowed(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/restaurants/add", nil)
	rr := httptest.NewRecorder()
	AddRestaurant(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestAddRestaurant_EmptyName(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"name":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/restaurants/add", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	AddRestaurant(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestAddRestaurant_Duplicate(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"name":"Unique Place"}`
	req := httptest.NewRequest(http.MethodPost, "/api/restaurants/add", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	AddRestaurant(httptest.NewRecorder(), req)

	// Duplicate
	req2 := httptest.NewRequest(http.MethodPost, "/api/restaurants/add", bytes.NewBufferString(body))
	req2.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	AddRestaurant(rr, req2)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409 for duplicate, got %d", rr.Code)
	}
}

func TestUpdateRestaurant_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	database.DB.Exec("INSERT INTO restaurants (name) VALUES (?)", "Old Name")

	body := `{"id":1,"name":"New Name"}`
	req := httptest.NewRequest(http.MethodPut, "/api/restaurants/update", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	UpdateRestaurant(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var restaurant models.Restaurant
	json.NewDecoder(rr.Body).Decode(&restaurant)
	if restaurant.Name != "New Name" {
		t.Fatalf("expected name 'New Name', got '%s'", restaurant.Name)
	}

	// Verify persisted
	req2 := httptest.NewRequest(http.MethodGet, "/api/restaurants", nil)
	rr2 := httptest.NewRecorder()
	GetRestaurants(rr2, req2)

	var restaurants []models.Restaurant
	json.NewDecoder(rr2.Body).Decode(&restaurants)
	if len(restaurants) != 1 || restaurants[0].Name != "New Name" {
		t.Fatalf("expected renamed restaurant, got %+v", restaurants)
	}
}

func TestUpdateRestaurant_MethodNotAllowed(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/restaurants/update", nil)
	rr := httptest.NewRecorder()
	UpdateRestaurant(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestUpdateRestaurant_MissingFields(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"id":0,"name":""}`
	req := httptest.NewRequest(http.MethodPut, "/api/restaurants/update", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	UpdateRestaurant(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestUpdateRestaurant_NotFound(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"id":999,"name":"Ghost"}`
	req := httptest.NewRequest(http.MethodPut, "/api/restaurants/update", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	UpdateRestaurant(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404, got %d", rr.Code)
	}
}

func TestUpdateRestaurant_DuplicateName(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	database.DB.Exec("INSERT INTO restaurants (name) VALUES (?)", "Alpha")
	database.DB.Exec("INSERT INTO restaurants (name) VALUES (?)", "Beta")

	// Try renaming Beta to Alpha
	body := `{"id":2,"name":"Alpha"}`
	req := httptest.NewRequest(http.MethodPut, "/api/restaurants/update", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	UpdateRestaurant(rr, req)

	if rr.Code != http.StatusConflict {
		t.Fatalf("expected 409 for duplicate name, got %d", rr.Code)
	}
}

func TestDeleteRestaurant_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	// Create a restaurant
	database.DB.Exec("INSERT INTO restaurants (name) VALUES (?)", "To Delete")

	req := httptest.NewRequest(http.MethodDelete, "/api/restaurants/delete?id=1", nil)
	rr := httptest.NewRecorder()
	DeleteRestaurant(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestDeleteRestaurant_MethodNotAllowed(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodPost, "/api/restaurants/delete?id=1", nil)
	rr := httptest.NewRecorder()
	DeleteRestaurant(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestDeleteRestaurant_MissingID(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodDelete, "/api/restaurants/delete", nil)
	rr := httptest.NewRecorder()
	DeleteRestaurant(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestGetRestaurants_WithData(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	database.DB.Exec("INSERT INTO restaurants (name) VALUES (?)", "Alpha")
	database.DB.Exec("INSERT INTO restaurants (name) VALUES (?)", "Beta")

	req := httptest.NewRequest(http.MethodGet, "/api/restaurants", nil)
	rr := httptest.NewRecorder()
	GetRestaurants(rr, req)

	var restaurants []models.Restaurant
	json.NewDecoder(rr.Body).Decode(&restaurants)
	if len(restaurants) != 2 {
		t.Fatalf("expected 2 restaurants, got %d", len(restaurants))
	}
	// Should be alphabetical
	if restaurants[0].Name != "Alpha" {
		t.Fatalf("expected first restaurant 'Alpha', got '%s'", restaurants[0].Name)
	}
}

// --- Assignment Tests ---

func setupAssignmentData(t *testing.T) {
	t.Helper()
	// Create a user and a restaurant for assignment tests
	database.DB.Exec("INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
		"Assign Emp", "assign@example.com", "hashed", "employee", "active")
	database.DB.Exec("INSERT INTO restaurants (name) VALUES (?)", "Assign Resto")
}

func TestGetAssignments_Empty(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/assignments", nil)
	rr := httptest.NewRecorder()
	GetAssignments(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var assignments []models.Assignment
	json.NewDecoder(rr.Body).Decode(&assignments)
	if len(assignments) != 0 {
		t.Fatalf("expected 0 assignments, got %d", len(assignments))
	}
}

func TestAddAssignment_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()
	setupAssignmentData(t)

	body := `{"restaurant_id":1,"employee_id":1,"status":"active"}`
	req := httptest.NewRequest(http.MethodPost, "/api/assignments/add", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	AddAssignment(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestAddAssignment_MethodNotAllowed(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/assignments/add", nil)
	rr := httptest.NewRecorder()
	AddAssignment(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestAddAssignment_MissingFields(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"restaurant_id":0,"employee_id":0}`
	req := httptest.NewRequest(http.MethodPost, "/api/assignments/add", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	AddAssignment(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestAddAssignment_DefaultStatus(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()
	setupAssignmentData(t)

	body := `{"restaurant_id":1,"employee_id":1}`
	req := httptest.NewRequest(http.MethodPost, "/api/assignments/add", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	AddAssignment(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected 201, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUpdateAssignment_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()
	setupAssignmentData(t)

	// Create an assignment first
	database.DB.Exec("INSERT INTO assignments (restaurant_id, employee_id, status) VALUES (?, ?, ?)", 1, 1, "active")

	body := `{"id":1,"restaurant_id":1,"employee_id":1,"status":"inactive"}`
	req := httptest.NewRequest(http.MethodPut, "/api/assignments/update", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	UpdateAssignment(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUpdateAssignment_MethodNotAllowed(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/assignments/update", nil)
	rr := httptest.NewRecorder()
	UpdateAssignment(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestDeleteAssignment_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()
	setupAssignmentData(t)

	database.DB.Exec("INSERT INTO assignments (restaurant_id, employee_id, status) VALUES (?, ?, ?)", 1, 1, "active")

	req := httptest.NewRequest(http.MethodDelete, "/api/assignments/delete?id=1", nil)
	rr := httptest.NewRecorder()
	DeleteAssignment(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestDeleteAssignment_MethodNotAllowed(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodPost, "/api/assignments/delete", nil)
	rr := httptest.NewRecorder()
	DeleteAssignment(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405, got %d", rr.Code)
	}
}

func TestDeleteAssignment_MissingID(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodDelete, "/api/assignments/delete", nil)
	rr := httptest.NewRecorder()
	DeleteAssignment(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400, got %d", rr.Code)
	}
}

func TestGetAssignments_WithData(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()
	setupAssignmentData(t)

	database.DB.Exec("INSERT INTO assignments (restaurant_id, employee_id, status) VALUES (?, ?, ?)", 1, 1, "active")

	req := httptest.NewRequest(http.MethodGet, "/api/assignments", nil)
	rr := httptest.NewRecorder()
	GetAssignments(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var assignments []models.Assignment
	json.NewDecoder(rr.Body).Decode(&assignments)
	if len(assignments) != 1 {
		t.Fatalf("expected 1 assignment, got %d", len(assignments))
	}
	if assignments[0].RestaurantName != "Assign Resto" {
		t.Fatalf("expected restaurant name 'Assign Resto', got '%s'", assignments[0].RestaurantName)
	}
	if assignments[0].EmployeeName != "Assign Emp" {
		t.Fatalf("expected employee name 'Assign Emp', got '%s'", assignments[0].EmployeeName)
	}
}
