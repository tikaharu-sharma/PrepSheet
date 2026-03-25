package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"prepsheet-backend/models"
)

// withEmployeeContext adds employee auth context values to a request.
func withEmployeeContext(r *http.Request, userID int) *http.Request {
	ctx := context.WithValue(r.Context(), "user_id", userID)  //nolint:staticcheck
	ctx = context.WithValue(ctx, "name", "Test Employee")     //nolint:staticcheck
	ctx = context.WithValue(ctx, "email", "emp@example.com")  //nolint:staticcheck
	ctx = context.WithValue(ctx, "role", "employee")           //nolint:staticcheck
	return r.WithContext(ctx)
}

// withManagerContext adds manager auth context values to a request.
func withManagerContext(r *http.Request, userID int) *http.Request {
	ctx := context.WithValue(r.Context(), "user_id", userID)   //nolint:staticcheck
	ctx = context.WithValue(ctx, "name", "Test Manager")       //nolint:staticcheck
	ctx = context.WithValue(ctx, "email", "mgr@example.com")   //nolint:staticcheck
	ctx = context.WithValue(ctx, "role", "manager")             //nolint:staticcheck
	return r.WithContext(ctx)
}

// createTestEmployee creates a user and restaurant for sale tests, returns user ID.
func createTestEmployee(t *testing.T) int {
	t.Helper()
	body := `{"name":"Sale Emp","email":"saleemp@example.com","password":"pass","role":"employee"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	Signup(rr, req)
	if rr.Code != http.StatusCreated {
		t.Fatalf("failed to create test employee: %d %s", rr.Code, rr.Body.String())
	}
	var resp map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&resp)
	return int(resp["user_id"].(float64))
}

func TestAddSale_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	empID := createTestEmployee(t)

	saleBody := `{
		"date":"2025-01-15",
		"restaurant":"Pizza Palace",
		"lunch_head_count":50,
		"lunch_sale":500.00,
		"dinner_head_count":80,
		"dinner_sale":900.00,
		"credit_sale":100.00,
		"reji_money":1200.00,
		"expenditures":[{"title":"Supplies","amount":50.00}],
		"note":"Good day"
	}`
	req := httptest.NewRequest(http.MethodPost, "/api/sales", bytes.NewBufferString(saleBody))
	req.Header.Set("Content-Type", "application/json")
	req = withEmployeeContext(req, empID)
	rr := httptest.NewRecorder()

	AddSale(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["sale_id"] == nil {
		t.Fatal("expected sale_id in response")
	}
}

func TestAddSale_ManagerForbidden(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"date":"2025-01-15","restaurant":"Test"}`
	req := httptest.NewRequest(http.MethodPost, "/api/sales", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req = withManagerContext(req, 1)
	rr := httptest.NewRecorder()

	AddSale(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected status 403, got %d", rr.Code)
	}
}

func TestAddSale_MissingFields(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	empID := createTestEmployee(t)

	body := `{"date":"","restaurant":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/sales", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req = withEmployeeContext(req, empID)
	rr := httptest.NewRecorder()

	AddSale(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

func TestAddSale_WithMultipleExpenditures(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	empID := createTestEmployee(t)

	saleBody := `{
		"date":"2025-01-16",
		"restaurant":"Burger Barn",
		"lunch_head_count":30,
		"lunch_sale":300.00,
		"dinner_head_count":40,
		"dinner_sale":450.00,
		"credit_sale":50.00,
		"reji_money":650.00,
		"expenditures":[
			{"title":"Meat","amount":100.00},
			{"title":"Vegetables","amount":30.00},
			{"title":"Cleaning","amount":20.00}
		],
		"note":""
	}`
	req := httptest.NewRequest(http.MethodPost, "/api/sales", bytes.NewBufferString(saleBody))
	req.Header.Set("Content-Type", "application/json")
	req = withEmployeeContext(req, empID)
	rr := httptest.NewRecorder()

	AddSale(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestGetSales_ManagerOnly(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	// Employee should be forbidden
	req := httptest.NewRequest(http.MethodGet, "/api/sales/all", nil)
	req = withEmployeeContext(req, 1)
	rr := httptest.NewRecorder()
	GetSales(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403 for employee, got %d", rr.Code)
	}
}

func TestGetSales_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	empID := createTestEmployee(t)

	// Add a sale
	saleBody := `{"date":"2025-01-15","restaurant":"Sushi Spot","lunch_head_count":20,"lunch_sale":200,"dinner_head_count":30,"dinner_sale":350,"credit_sale":10,"reji_money":500,"expenditures":[],"note":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/sales", bytes.NewBufferString(saleBody))
	req.Header.Set("Content-Type", "application/json")
	req = withEmployeeContext(req, empID)
	AddSale(httptest.NewRecorder(), req)

	// Get all sales as manager
	req2 := httptest.NewRequest(http.MethodGet, "/api/sales/all", nil)
	req2 = withManagerContext(req2, 99)
	rr := httptest.NewRecorder()
	GetSales(rr, req2)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var sales []models.Sale
	json.NewDecoder(rr.Body).Decode(&sales)
	if len(sales) != 1 {
		t.Fatalf("expected 1 sale, got %d", len(sales))
	}
	if sales[0].RestaurantName != "Sushi Spot" {
		t.Fatalf("expected restaurant_name 'Sushi Spot', got '%s'", sales[0].RestaurantName)
	}
}

func TestGetSales_WithDateFilter(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	empID := createTestEmployee(t)

	// Add sales on different dates
	for _, date := range []string{"2025-01-10", "2025-02-15", "2025-03-20"} {
		body := `{"date":"` + date + `","restaurant":"Resto","lunch_head_count":10,"lunch_sale":100,"dinner_head_count":10,"dinner_sale":100,"credit_sale":0,"reji_money":200,"expenditures":[],"note":""}`
		req := httptest.NewRequest(http.MethodPost, "/api/sales", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		req = withEmployeeContext(req, empID)
		AddSale(httptest.NewRecorder(), req)
	}

	// Filter by date range
	req := httptest.NewRequest(http.MethodGet, "/api/sales/all?start_date=2025-02-01&end_date=2025-02-28", nil)
	req = withManagerContext(req, 99)
	rr := httptest.NewRecorder()
	GetSales(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var sales []models.Sale
	json.NewDecoder(rr.Body).Decode(&sales)
	if len(sales) != 1 {
		t.Fatalf("expected 1 sale in date range, got %d", len(sales))
	}
}

func TestGetMySales_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	empID := createTestEmployee(t)

	// Add a sale
	body := `{"date":"2025-01-20","restaurant":"My Place","lunch_head_count":5,"lunch_sale":50,"dinner_head_count":10,"dinner_sale":120,"credit_sale":0,"reji_money":170,"expenditures":[],"note":"test"}`
	req := httptest.NewRequest(http.MethodPost, "/api/sales", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	req = withEmployeeContext(req, empID)
	AddSale(httptest.NewRecorder(), req)

	// Get my sales
	req2 := httptest.NewRequest(http.MethodGet, "/api/sales/my", nil)
	req2 = withEmployeeContext(req2, empID)
	rr := httptest.NewRecorder()
	GetMySales(rr, req2)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var sales []models.Sale
	json.NewDecoder(rr.Body).Decode(&sales)
	if len(sales) != 1 {
		t.Fatalf("expected 1 sale, got %d", len(sales))
	}
	if sales[0].Note != "test" {
		t.Fatalf("expected note 'test', got '%s'", sales[0].Note)
	}
}

func TestGetMySales_Empty(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	empID := createTestEmployee(t)

	req := httptest.NewRequest(http.MethodGet, "/api/sales/my", nil)
	req = withEmployeeContext(req, empID)
	rr := httptest.NewRecorder()
	GetMySales(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}

	var sales []models.Sale
	json.NewDecoder(rr.Body).Decode(&sales)
	if len(sales) != 0 {
		t.Fatalf("expected 0 sales, got %d", len(sales))
	}
}

func TestGetMonthlyReport_ManagerOnly(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/reports/monthly", nil)
	req = withEmployeeContext(req, 1)
	rr := httptest.NewRecorder()
	GetMonthlyReport(rr, req)

	if rr.Code != http.StatusForbidden {
		t.Fatalf("expected 403, got %d", rr.Code)
	}
}

func TestGetMonthlyReport_WithData(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	empID := createTestEmployee(t)

	// Add sales in same month
	for i := 0; i < 3; i++ {
		body := `{"date":"2025-03-15","restaurant":"Report Resto","lunch_head_count":10,"lunch_sale":100,"dinner_head_count":20,"dinner_sale":200,"credit_sale":0,"reji_money":300,"expenditures":[],"note":""}`
		req := httptest.NewRequest(http.MethodPost, "/api/sales", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		req = withEmployeeContext(req, empID)
		AddSale(httptest.NewRecorder(), req)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/reports/monthly?month=2025-03", nil)
	req = withManagerContext(req, 99)
	rr := httptest.NewRecorder()
	GetMonthlyReport(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d: %s", rr.Code, rr.Body.String())
	}

	var report models.MonthlySalesReport
	json.NewDecoder(rr.Body).Decode(&report)

	if report.EntryCount != 3 {
		t.Fatalf("expected 3 entries, got %d", report.EntryCount)
	}
	if report.TotalLunch != 300 {
		t.Fatalf("expected total_lunch 300, got %f", report.TotalLunch)
	}
	if report.TotalDinner != 600 {
		t.Fatalf("expected total_dinner 600, got %f", report.TotalDinner)
	}
	if report.TotalSales != 900 {
		t.Fatalf("expected total_sales 900, got %f", report.TotalSales)
	}
}

func TestGetSales_WithExpenditures(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	empID := createTestEmployee(t)

	saleBody := `{"date":"2025-04-01","restaurant":"Exp Place","lunch_head_count":10,"lunch_sale":100,"dinner_head_count":20,"dinner_sale":200,"credit_sale":0,"reji_money":250,"expenditures":[{"title":"Gas","amount":25},{"title":"Paper","amount":10}],"note":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/sales", bytes.NewBufferString(saleBody))
	req.Header.Set("Content-Type", "application/json")
	req = withEmployeeContext(req, empID)
	AddSale(httptest.NewRecorder(), req)

	// Get all sales as manager and verify expenditures loaded
	req2 := httptest.NewRequest(http.MethodGet, "/api/sales/all", nil)
	req2 = withManagerContext(req2, 99)
	rr := httptest.NewRecorder()
	GetSales(rr, req2)

	var sales []models.Sale
	json.NewDecoder(rr.Body).Decode(&sales)

	if len(sales) != 1 {
		t.Fatalf("expected 1 sale, got %d", len(sales))
	}
	if len(sales[0].Expenditures) != 2 {
		t.Fatalf("expected 2 expenditures, got %d", len(sales[0].Expenditures))
	}
}
