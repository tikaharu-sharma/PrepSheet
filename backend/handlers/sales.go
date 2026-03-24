package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"prepsheet-backend/database"
	"prepsheet-backend/models"
)

// AddSale allows an authenticated employee or manager to log a daily sales entry.
func AddSale(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	role := r.Context().Value("role").(string)

	if role != "employee" && role != "manager" {
		http.Error(w, `{"error": "Only employees and managers can add sales entries"}`, http.StatusForbidden)
		return
	}

	var req models.SaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Date == "" || (req.RestaurantID == 0 && strings.TrimSpace(req.Restaurant) == "") {
		http.Error(w, `{"error": "Date and restaurant are required"}`, http.StatusBadRequest)
		return
	}

	for _, exp := range req.Expenditures {
		hasTitle := strings.TrimSpace(exp.Title) != ""
		hasAmount := exp.Amount != 0
		if hasTitle != hasAmount {
			http.Error(w, `{"error": "Each expenditure must include both title and amount"}`, http.StatusBadRequest)
			return
		}
		if !hasTitle && !hasAmount {
			http.Error(w, `{"error": "Empty expenditure rows are not allowed"}`, http.StatusBadRequest)
			return
		}
	}

	if req.LunchHeadCount < 0 || req.DinnerHeadCount < 0 || req.LunchSale < 0 || req.DinnerSale < 0 || req.CreditSale < 0 || req.RejiMoney < 0 {
		http.Error(w, `{"error": "Sales values cannot be negative"}`, http.StatusBadRequest)
		return
	}

	var restaurantID int
	var err error
	if role == "manager" {
		if req.RestaurantID != 0 {
			err = database.DB.QueryRow(
				`SELECT id
				 FROM restaurants
				 WHERE manager_id = ?
				   AND id = ?
				 LIMIT 1`,
				userID,
				req.RestaurantID,
			).Scan(&restaurantID)
		} else {
			err = database.DB.QueryRow(
				`SELECT id
				 FROM restaurants
				 WHERE manager_id = ?
				   AND name = ?
				 LIMIT 1`,
				userID,
				req.Restaurant,
			).Scan(&restaurantID)
		}
	} else {
		// Employees may only log sales for restaurants assigned to them.
		if req.RestaurantID != 0 {
			err = database.DB.QueryRow(
				`SELECT r.id
				 FROM restaurants r
				 JOIN assignments a ON a.restaurant_id = r.id
				 WHERE a.employee_id = ?
				   AND a.status = 'active'
				   AND r.id = ?
				 LIMIT 1`,
				userID,
				req.RestaurantID,
			).Scan(&restaurantID)
		} else {
			err = database.DB.QueryRow(
				`SELECT r.id
				 FROM restaurants r
				 JOIN assignments a ON a.restaurant_id = r.id
				 WHERE a.employee_id = ?
				   AND a.status = 'active'
				   AND r.name = ?
				 LIMIT 1`,
				userID,
				req.Restaurant,
			).Scan(&restaurantID)
		}
	}
	if err == sql.ErrNoRows {
		if role == "manager" {
			http.Error(w, `{"error": "You do not manage the selected restaurant"}`, http.StatusForbidden)
			return
		}
		http.Error(w, `{"error": "You are not assigned to the selected restaurant"}`, http.StatusForbidden)
		return
	}
	if err != nil {
		http.Error(w, `{"error": "Failed to validate restaurant assignment"}`, http.StatusInternalServerError)
		return
	}

	var existingSaleID int
	err = database.DB.QueryRow(
		`SELECT id
		 FROM sales
		 WHERE restaurant_id = ?
		   AND date = ?
		 LIMIT 1`,
		restaurantID,
		req.Date,
	).Scan(&existingSaleID)
	if err != nil && err != sql.ErrNoRows {
		http.Error(w, `{"error": "Failed to validate existing sales entry"}`, http.StatusInternalServerError)
		return
	}
	if err == nil {
		http.Error(w, `{"error": "A sales entry for this restaurant and date already exists"}`, http.StatusConflict)
		return
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

// GetSales returns sales entries scoped to the authenticated user's allowed restaurants.
func GetSales(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	role := r.Context().Value("role").(string)

	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	restaurantIDParam := r.URL.Query().Get("restaurant_id")

	query := `
		SELECT DISTINCT s.id, s.employee_id, s.restaurant_id, r.name, s.date,
		       s.lunch_head_count, s.lunch_sale, s.dinner_head_count, s.dinner_sale,
		       s.credit_sale, s.reji_money, COALESCE(s.note, ''), s.created_at
		FROM sales s
		JOIN restaurants r ON s.restaurant_id = r.id`

	var args []interface{}
	if role == "manager" {
		query += " WHERE r.manager_id = ?"
		args = append(args, userID)
	} else {
		query += `
			JOIN assignments a ON a.restaurant_id = r.id
		WHERE a.employee_id = ?
		  AND a.status = 'active'`
		args = append(args, userID)
	}
	if startDate != "" && endDate != "" {
		query += " AND s.date BETWEEN ? AND ?"
		args = append(args, startDate, endDate)
	}
	if restaurantIDParam != "" {
		restaurantID, err := strconv.Atoi(restaurantIDParam)
		if err != nil {
			http.Error(w, `{"error": "Invalid restaurant_id"}`, http.StatusBadRequest)
			return
		}
		query += " AND s.restaurant_id = ?"
		args = append(args, restaurantID)
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

// GetMonthlyReport returns aggregated monthly sales data scoped to allowed restaurants.
func GetMonthlyReport(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	role := r.Context().Value("role").(string)

	month := r.URL.Query().Get("month")
	restaurantIDParam := r.URL.Query().Get("restaurant_id")
	var restaurantID int
	var err error
	if restaurantIDParam != "" {
		restaurantID, err = strconv.Atoi(restaurantIDParam)
		if err != nil {
			http.Error(w, `{"error": "Invalid restaurant_id"}`, http.StatusBadRequest)
			return
		}
	}

	var report models.MonthlySalesReport

	query := `
		SELECT COALESCE(strftime('%Y-%m', s.date), COALESCE(?, strftime('%Y-%m', 'now'))) as month,
		       COALESCE(SUM(s.lunch_sale + s.dinner_sale), 0) as total_sales,
		       COALESCE(SUM(s.lunch_sale), 0) as total_lunch,
		       COALESCE(SUM(s.dinner_sale), 0) as total_dinner,
		       COUNT(DISTINCT s.id) as entry_count
		FROM sales s
		JOIN restaurants r ON r.id = s.restaurant_id`

	args := []interface{}{month}
	if role == "manager" {
		query += " WHERE r.manager_id = ?"
		args = append(args, userID)
	} else {
		query += `
			JOIN assignments a ON a.restaurant_id = r.id
		WHERE a.employee_id = ?
		  AND a.status = 'active'`
		args = append(args, userID)
	}
	if month != "" {
		query += " AND strftime('%Y-%m', s.date) = ?"
		args = append(args, month)
	} else {
		query += " AND strftime('%Y-%m', s.date) = strftime('%Y-%m', 'now')"
	}
	if restaurantIDParam != "" {
		query += " AND s.restaurant_id = ?"
		args = append(args, restaurantID)
	}

	err = database.DB.QueryRow(query, args...).Scan(
		&report.Month, &report.TotalSales, &report.TotalLunch, &report.TotalDinner, &report.EntryCount,
	)

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
