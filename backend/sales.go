package handlers

import (
	"encoding/json"
	"net/http"

	"prepsheet-backend/database"
	"prepsheet-backend/models"
)

// AddSale allows an employee to log a daily sales entry.
// Requires: employee role (enforced by middleware)
func AddSale(w http.ResponseWriter, r *http.Request) {
	// Get user info from context (set by auth middleware)
	userID := r.Context().Value("user_id").(int)
	role := r.Context().Value("role").(string)

	// Only employees can add sales
	if role != "employee" {
		http.Error(w, `{"error": "Only employees can add sales entries"}`, http.StatusForbidden)
		return
	}

	var req models.SaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Validate required fields
	if req.Date == "" || req.ItemName == "" || req.Quantity <= 0 || req.UnitPrice <= 0 {
		http.Error(w, `{"error": "Date, item_name, quantity (>0), and unit_price (>0) are required"}`, http.StatusBadRequest)
		return
	}

	totalPrice := float64(req.Quantity) * req.UnitPrice

	result, err := database.DB.Exec(
		`INSERT INTO sales (employee_id, date, item_name, quantity, unit_price, total_price, notes) 
		 VALUES (?, ?, ?, ?, ?, ?, ?)`,
		userID, req.Date, req.ItemName, req.Quantity, req.UnitPrice, totalPrice, req.Notes,
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to add sale entry"}`, http.StatusInternalServerError)
		return
	}

	saleID, _ := result.LastInsertId()

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":     "Sale entry added successfully",
		"sale_id":     saleID,
		"total_price": totalPrice,
	})
}

// GetSales allows a manager to view all sales entries. Supports optional date filters.
// Query params: ?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD
// Requires: manager role (enforced by middleware)
func GetSales(w http.ResponseWriter, r *http.Request) {
	role := r.Context().Value("role").(string)

	// Only managers can view all sales
	if role != "manager" {
		http.Error(w, `{"error": "Only managers can view sales"}`, http.StatusForbidden)
		return
	}

	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	var sales []models.Sale
	var err error

	query := `
		SELECT s.id, s.employee_id, s.date, s.item_name, s.quantity, 
		       s.unit_price, s.total_price, s.notes, s.created_at
		FROM sales s`

	if startDate != "" && endDate != "" {
		query += " WHERE s.date BETWEEN ? AND ? ORDER BY s.date DESC"
		sqlRows, qErr := database.DB.Query(query, startDate, endDate)
		if qErr != nil {
			http.Error(w, `{"error": "Failed to fetch sales"}`, http.StatusInternalServerError)
			return
		}
		defer sqlRows.Close()
		sales, err = scanSales(sqlRows)
	} else {
		query += " ORDER BY s.date DESC"
		sqlRows, qErr := database.DB.Query(query)
		if qErr != nil {
			http.Error(w, `{"error": "Failed to fetch sales"}`, http.StatusInternalServerError)
			return
		}
		defer sqlRows.Close()
		sales, err = scanSales(sqlRows)
	}

	if err != nil {
		http.Error(w, `{"error": "Failed to parse sales data"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

// GetMySales allows an employee to view their own sales entries.
func GetMySales(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	query := `
		SELECT id, employee_id, date, item_name, quantity, 
		       unit_price, total_price, notes, created_at
		FROM sales WHERE employee_id = ? ORDER BY date DESC`

	sqlRows, err := database.DB.Query(query, userID)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch sales"}`, http.StatusInternalServerError)
		return
	}
	defer sqlRows.Close()

	sales, err := scanSales(sqlRows)
	if err != nil {
		http.Error(w, `{"error": "Failed to parse sales data"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

// GetMonthlyReport returns aggregated monthly sales data for the manager.
// Query param: ?month=YYYY-MM
func GetMonthlyReport(w http.ResponseWriter, r *http.Request) {
	role := r.Context().Value("role").(string)

	if role != "manager" {
		http.Error(w, `{"error": "Only managers can view reports"}`, http.StatusForbidden)
		return
	}

	month := r.URL.Query().Get("month")

	var report models.MonthlySalesReport
	var query string
	var err error

	if month != "" {
		query = `
			SELECT COALESCE(strftime('%Y-%m', date), ?) as month,
			       COALESCE(SUM(total_price), 0) as total_sales,
			       COALESCE(SUM(quantity), 0) as total_items,
			       COUNT(*) as entry_count
			FROM sales
			WHERE strftime('%Y-%m', date) = ?`
		err = database.DB.QueryRow(query, month, month).Scan(
			&report.Month, &report.TotalSales, &report.TotalItems, &report.EntryCount,
		)
	} else {
		// Default to current month
		query = `
			SELECT COALESCE(strftime('%Y-%m', date), strftime('%Y-%m', 'now')) as month,
			       COALESCE(SUM(total_price), 0) as total_sales,
			       COALESCE(SUM(quantity), 0) as total_items,
			       COUNT(*) as entry_count
			FROM sales
			WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`
		err = database.DB.QueryRow(query).Scan(
			&report.Month, &report.TotalSales, &report.TotalItems, &report.EntryCount,
		)
	}

	if err != nil {
		http.Error(w, `{"error": "Failed to generate report"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}

// scanSales is a helper that scans SQL rows into Sale structs.
func scanSales(rows interface{ Next() bool; Scan(...interface{}) error }) ([]models.Sale, error) {
	var sales []models.Sale
	for rows.Next() {
		var sale models.Sale
		err := rows.Scan(
			&sale.ID, &sale.EmployeeID, &sale.Date, &sale.ItemName,
			&sale.Quantity, &sale.UnitPrice, &sale.TotalPrice,
			&sale.Notes, &sale.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		sales = append(sales, sale)
	}
	if sales == nil {
		sales = []models.Sale{} // return empty array instead of null
	}
	return sales, nil
}
