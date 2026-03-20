package handlers

import (
	"encoding/json"
	"net/http"

	"prepsheet-backend/database"
	"prepsheet-backend/models"
)

// AddSale allows an employee to log a daily sales entry.
func AddSale(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	role := r.Context().Value("role").(string)

	if role != "employee" {
		http.Error(w, `{"error": "Only employees can add sales entries"}`, http.StatusForbidden)
		return
	}

	var req models.SaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Date == "" || req.Restaurant == "" {
		http.Error(w, `{"error": "Date and restaurant are required"}`, http.StatusBadRequest)
		return
	}

	// Look up restaurant by name, create if not found
	var restaurantID int
	err := database.DB.QueryRow("SELECT id FROM restaurants WHERE name = ?", req.Restaurant).Scan(&restaurantID)
	if err != nil {
		result, insertErr := database.DB.Exec("INSERT INTO restaurants (name) VALUES (?)", req.Restaurant)
		if insertErr != nil {
			http.Error(w, `{"error": "Failed to find or create restaurant"}`, http.StatusInternalServerError)
			return
		}
		id, _ := result.LastInsertId()
		restaurantID = int(id)
	}

	// Insert the sale
	result, err := database.DB.Exec(
		`INSERT INTO sales (employee_id, restaurant_id, date, lunch_head_count, lunch_sale,
		 dinner_head_count, dinner_sale, credit_sale, reji_money, note)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		userID, restaurantID, req.Date,
		req.LunchHeadCount, req.LunchSale,
		req.DinnerHeadCount, req.DinnerSale,
		req.CreditSale, req.RejiMoney, req.Note,
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to add sale entry"}`, http.StatusInternalServerError)
		return
	}

	saleID, _ := result.LastInsertId()

	// Insert expenditures
	for _, exp := range req.Expenditures {
		_, err := database.DB.Exec(
			"INSERT INTO expenditures (sale_id, title, amount) VALUES (?, ?, ?)",
			saleID, exp.Title, exp.Amount,
		)
		if err != nil {
			http.Error(w, `{"error": "Failed to add expenditure"}`, http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Sale entry added successfully",
		"sale_id": saleID,
	})
}

// GetSales allows a manager to view all sales entries with optional date filters.
func GetSales(w http.ResponseWriter, r *http.Request) {
	role := r.Context().Value("role").(string)

	if role != "manager" {
		http.Error(w, `{"error": "Only managers can view all sales"}`, http.StatusForbidden)
		return
	}

	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	query := `
		SELECT s.id, s.employee_id, s.restaurant_id, r.name, s.date,
		       s.lunch_head_count, s.lunch_sale, s.dinner_head_count, s.dinner_sale,
		       s.credit_sale, s.reji_money, COALESCE(s.note, ''), s.created_at
		FROM sales s
		JOIN restaurants r ON s.restaurant_id = r.id`

	var args []interface{}
	if startDate != "" && endDate != "" {
		query += " WHERE s.date BETWEEN ? AND ?"
		args = append(args, startDate, endDate)
	}
	query += " ORDER BY s.date DESC"

	rows, err := database.DB.Query(query, args...)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch sales"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	sales, err := scanSales(rows)
	if err != nil {
		http.Error(w, `{"error": "Failed to parse sales data"}`, http.StatusInternalServerError)
		return
	}

	// Load expenditures for each sale
	for i := range sales {
		sales[i].Expenditures, _ = getExpenditures(sales[i].ID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

// GetMySales allows an employee to view their own sales entries.
func GetMySales(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	query := `
		SELECT s.id, s.employee_id, s.restaurant_id, r.name, s.date,
		       s.lunch_head_count, s.lunch_sale, s.dinner_head_count, s.dinner_sale,
		       s.credit_sale, s.reji_money, COALESCE(s.note, ''), s.created_at
		FROM sales s
		JOIN restaurants r ON s.restaurant_id = r.id
		WHERE s.employee_id = ?
		ORDER BY s.date DESC`

	rows, err := database.DB.Query(query, userID)
	if err != nil {
		http.Error(w, `{"error": "Failed to fetch sales"}`, http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	sales, err := scanSales(rows)
	if err != nil {
		http.Error(w, `{"error": "Failed to parse sales data"}`, http.StatusInternalServerError)
		return
	}

	for i := range sales {
		sales[i].Expenditures, _ = getExpenditures(sales[i].ID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

// GetMonthlyReport returns aggregated monthly sales data.
func GetMonthlyReport(w http.ResponseWriter, r *http.Request) {
	role := r.Context().Value("role").(string)

	if role != "manager" {
		http.Error(w, `{"error": "Only managers can view reports"}`, http.StatusForbidden)
		return
	}

	month := r.URL.Query().Get("month")

	var report models.MonthlySalesReport
	var err error

	if month != "" {
		query := `
			SELECT COALESCE(strftime('%Y-%m', date), ?) as month,
			       COALESCE(SUM(lunch_sale + dinner_sale), 0) as total_sales,
			       COALESCE(SUM(lunch_sale), 0) as total_lunch,
			       COALESCE(SUM(dinner_sale), 0) as total_dinner,
			       COUNT(*) as entry_count
			FROM sales
			WHERE strftime('%Y-%m', date) = ?`
		err = database.DB.QueryRow(query, month, month).Scan(
			&report.Month, &report.TotalSales, &report.TotalLunch, &report.TotalDinner, &report.EntryCount,
		)
	} else {
		query := `
			SELECT COALESCE(strftime('%Y-%m', date), strftime('%Y-%m', 'now')) as month,
			       COALESCE(SUM(lunch_sale + dinner_sale), 0) as total_sales,
			       COALESCE(SUM(lunch_sale), 0) as total_lunch,
			       COALESCE(SUM(dinner_sale), 0) as total_dinner,
			       COUNT(*) as entry_count
			FROM sales
			WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')`
		err = database.DB.QueryRow(query).Scan(
			&report.Month, &report.TotalSales, &report.TotalLunch, &report.TotalDinner, &report.EntryCount,
		)
	}

	if err != nil {
		http.Error(w, `{"error": "Failed to generate report"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}

// scanSales scans SQL rows into Sale structs.
func scanSales(rows interface {
	Next() bool
	Scan(...interface{}) error
}) ([]models.Sale, error) {
	var sales []models.Sale
	for rows.Next() {
		var sale models.Sale
		err := rows.Scan(
			&sale.ID, &sale.EmployeeID, &sale.RestaurantID, &sale.RestaurantName,
			&sale.Date, &sale.LunchHeadCount, &sale.LunchSale,
			&sale.DinnerHeadCount, &sale.DinnerSale,
			&sale.CreditSale, &sale.RejiMoney, &sale.Note, &sale.CreatedAt,
		)
		if err != nil {
			return nil, err
		}
		sales = append(sales, sale)
	}
	if sales == nil {
		sales = []models.Sale{}
	}
	return sales, nil
}

// getExpenditures fetches expenditures for a given sale ID.
func getExpenditures(saleID int) ([]models.Expenditure, error) {
	rows, err := database.DB.Query("SELECT id, sale_id, title, amount FROM expenditures WHERE sale_id = ?", saleID)
	if err != nil {
		return []models.Expenditure{}, err
	}
	defer rows.Close()

	var expenditures []models.Expenditure
	for rows.Next() {
		var exp models.Expenditure
		if err := rows.Scan(&exp.ID, &exp.SaleID, &exp.Title, &exp.Amount); err != nil {
			return nil, err
		}
		expenditures = append(expenditures, exp)
	}
	if expenditures == nil {
		expenditures = []models.Expenditure{}
	}
	return expenditures, nil
}
