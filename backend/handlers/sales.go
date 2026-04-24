package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"

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

	if err := ValidateDate(req.Date); err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
		return
	}
	if req.RestaurantID == 0 {
		if err := ValidateRestaurantName(req.Restaurant); err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
			return
		}
	}
	if err := ValidateNote(req.Note); err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
		return
	}
	if len(req.Expenditures) > MaxExpenditures {
		http.Error(w, fmt.Sprintf(`{"error": "Maximum %d expenditures allowed"}`, MaxExpenditures), http.StatusBadRequest)
		return
	}
	for _, exp := range req.Expenditures {
		if len(exp.Title) > MaxExpenditureTitle {
			http.Error(w, fmt.Sprintf(`{"error": "Expenditure title must be %d characters or fewer"}`, MaxExpenditureTitle), http.StatusBadRequest)
			return
		}
	}

	if err := validateExpenditures(req.Expenditures); err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}

	if hasNegativeSaleValues(
		req.LunchHeadCount,
		req.DinnerHeadCount,
		req.LunchSale,
		req.DinnerSale,
		req.CreditSale,
		req.RejiMoney,
	) {
		http.Error(w, `{"error": "Sales values cannot be negative"}`, http.StatusBadRequest)
		return
	}

	restaurantID, err := lookupAssignedRestaurantID(userID, req.RestaurantID, req.Restaurant)
	if err == sql.ErrNoRows {
		http.Error(w, `{"error": "You are not assigned to the selected restaurant"}`, http.StatusForbidden)
		return
	}
	if err != nil {
		http.Error(w, `{"error": "Failed to validate restaurant assignment"}`, http.StatusInternalServerError)
		return
	}

	if err := ensureNoDuplicateSale(restaurantID, req.Date, 0); err != nil {
		if err == errDuplicateSale {
			http.Error(w, `{"error": "A sales entry for this restaurant and date already exists"}`, http.StatusConflict)
			return
		}
		http.Error(w, `{"error": "Failed to validate existing sales entry"}`, http.StatusInternalServerError)
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

// GetSales allows a manager to view sales entries for their restaurants with optional filters.
func GetSales(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	role := r.Context().Value("role").(string)

	if role != "manager" {
		http.Error(w, `{"error": "Only managers can view all sales"}`, http.StatusForbidden)
		return
	}

	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	restaurantIDParam := r.URL.Query().Get("restaurant_id")

	query := `
		SELECT s.id, s.employee_id, s.restaurant_id, r.name, s.date,
		       s.lunch_head_count, s.lunch_sale, s.dinner_head_count, s.dinner_sale,
		       s.credit_sale, s.reji_money, COALESCE(s.note, ''), s.created_at
		FROM sales s
		JOIN restaurants r ON s.restaurant_id = r.id
		WHERE r.manager_id = ?`

	args := []interface{}{userID}
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

// GetMySales allows an employee to view their own sales entries with optional date filters.
func GetMySales(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)

	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")
	restaurantIDParam := r.URL.Query().Get("restaurant_id")

	query := `
		SELECT s.id, s.employee_id, s.restaurant_id, r.name, s.date,
		       s.lunch_head_count, s.lunch_sale, s.dinner_head_count, s.dinner_sale,
		       s.credit_sale, s.reji_money, COALESCE(s.note, ''), s.created_at
		FROM sales s
		JOIN restaurants r ON s.restaurant_id = r.id
		WHERE s.employee_id = ?`

	args := []interface{}{userID}
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

	for i := range sales {
		sales[i].Expenditures, _ = getExpenditures(sales[i].ID)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(sales)
}

// GetMonthlyReport returns aggregated monthly sales data for the manager's restaurants.
func GetMonthlyReport(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	role := r.Context().Value("role").(string)

	if role != "manager" {
		http.Error(w, `{"error": "Only managers can view reports"}`, http.StatusForbidden)
		return
	}

	month := r.URL.Query().Get("month")
	restaurantIDParam := r.URL.Query().Get("restaurant_id")

	var report models.MonthlySalesReport
	query := `
		SELECT COALESCE(strftime('%Y-%m', s.date), COALESCE(?, strftime('%Y-%m', 'now'))) as month,
		       COALESCE(SUM(s.lunch_sale + s.dinner_sale), 0) as total_sales,
		       COALESCE(SUM(s.lunch_sale), 0) as total_lunch,
		       COALESCE(SUM(s.dinner_sale), 0) as total_dinner,
		       COUNT(DISTINCT s.id) as entry_count
		FROM sales s
		JOIN restaurants r ON r.id = s.restaurant_id
		WHERE r.manager_id = ?`

	args := []interface{}{month, userID}
	if month != "" {
		query += " AND strftime('%Y-%m', s.date) = ?"
		args = append(args, month)
	} else {
		query += " AND strftime('%Y-%m', s.date) = strftime('%Y-%m', 'now')"
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

	err := database.DB.QueryRow(query, args...).Scan(
		&report.Month, &report.TotalSales, &report.TotalLunch, &report.TotalDinner, &report.EntryCount,
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to generate report"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(report)
}

// UpdateSale allows an employee to update their own sale entry.
func UpdateSale(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	role := r.Context().Value("role").(string)

	if role != "employee" {
		http.Error(w, `{"error": "Only employees can update sales entries"}`, http.StatusForbidden)
		return
	}

	var req models.UpdateSaleRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.ID == 0 {
		http.Error(w, `{"error": "Sale ID is required"}`, http.StatusBadRequest)
		return
	}
	if err := ValidateDate(req.Date); err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
		return
	}
	if req.RestaurantID == 0 {
		if err := ValidateRestaurantName(req.Restaurant); err != nil {
			http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
			return
		}
	}
	if err := ValidateNote(req.Note); err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%s"}`, err.Error()), http.StatusBadRequest)
		return
	}
	if len(req.Expenditures) > MaxExpenditures {
		http.Error(w, fmt.Sprintf(`{"error": "Maximum %d expenditures allowed"}`, MaxExpenditures), http.StatusBadRequest)
		return
	}
	for _, exp := range req.Expenditures {
		if len(exp.Title) > MaxExpenditureTitle {
			http.Error(w, fmt.Sprintf(`{"error": "Expenditure title must be %d characters or fewer"}`, MaxExpenditureTitle), http.StatusBadRequest)
			return
		}
	}
	if err := validateExpenditures(req.Expenditures); err != nil {
		http.Error(w, `{"error": "`+err.Error()+`"}`, http.StatusBadRequest)
		return
	}
	if hasNegativeSaleValues(
		req.LunchHeadCount,
		req.DinnerHeadCount,
		req.LunchSale,
		req.DinnerSale,
		req.CreditSale,
		req.RejiMoney,
	) {
		http.Error(w, `{"error": "Sales values cannot be negative"}`, http.StatusBadRequest)
		return
	}

	// Verify the sale belongs to this employee
	var ownerID int
	err := database.DB.QueryRow("SELECT employee_id FROM sales WHERE id = ?", req.ID).Scan(&ownerID)
	if err != nil {
		http.Error(w, `{"error": "Sale not found"}`, http.StatusNotFound)
		return
	}
	if ownerID != userID {
		http.Error(w, `{"error": "You can only update your own sales"}`, http.StatusForbidden)
		return
	}

	restaurantID, err := lookupAssignedRestaurantID(userID, req.RestaurantID, req.Restaurant)
	if err == sql.ErrNoRows {
		http.Error(w, `{"error": "You are not assigned to the selected restaurant"}`, http.StatusForbidden)
		return
	}
	if err != nil {
		http.Error(w, `{"error": "Failed to validate restaurant assignment"}`, http.StatusInternalServerError)
		return
	}

	if err := ensureNoDuplicateSale(restaurantID, req.Date, req.ID); err != nil {
		if err == errDuplicateSale {
			http.Error(w, `{"error": "A sales entry for this restaurant and date already exists"}`, http.StatusConflict)
			return
		}
		http.Error(w, `{"error": "Failed to validate existing sales entry"}`, http.StatusInternalServerError)
		return
	}

	// Update the sale
	_, err = database.DB.Exec(
		`UPDATE sales SET restaurant_id = ?, date = ?, lunch_head_count = ?, lunch_sale = ?,
		 dinner_head_count = ?, dinner_sale = ?, credit_sale = ?, reji_money = ?, note = ?
		 WHERE id = ?`,
		restaurantID, req.Date,
		req.LunchHeadCount, req.LunchSale,
		req.DinnerHeadCount, req.DinnerSale,
		req.CreditSale, req.RejiMoney, req.Note, req.ID,
	)
	if err != nil {
		http.Error(w, `{"error": "Failed to update sale entry"}`, http.StatusInternalServerError)
		return
	}

	// Replace expenditures: delete old, insert new
	_, _ = database.DB.Exec("DELETE FROM expenditures WHERE sale_id = ?", req.ID)
	for _, exp := range req.Expenditures {
		_, err := database.DB.Exec(
			"INSERT INTO expenditures (sale_id, title, amount) VALUES (?, ?, ?)",
			req.ID, exp.Title, exp.Amount,
		)
		if err != nil {
			http.Error(w, `{"error": "Failed to update expenditure"}`, http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Sale entry updated successfully",
	})
}

// DeleteSale allows an employee to delete their own sale entry.
func DeleteSale(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value("user_id").(int)
	role := r.Context().Value("role").(string)

	if role != "employee" && role != "manager" {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusForbidden)
		return
	}

	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, `{"error": "Sale ID is required"}`, http.StatusBadRequest)
		return
	}

	saleID, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, `{"error": "Invalid sale ID"}`, http.StatusBadRequest)
		return
	}

	// Verify the sale exists and check ownership
	var ownerID int
	err = database.DB.QueryRow("SELECT employee_id FROM sales WHERE id = ?", saleID).Scan(&ownerID)
	if err != nil {
		http.Error(w, `{"error": "Sale not found"}`, http.StatusNotFound)
		return
	}

	// Employees can only delete their own; managers can delete any
	if role == "employee" && ownerID != userID {
		http.Error(w, `{"error": "You can only delete your own sales"}`, http.StatusForbidden)
		return
	}

	// Expenditures are deleted automatically via ON DELETE CASCADE
	_, err = database.DB.Exec("DELETE FROM sales WHERE id = ?", saleID)
	if err != nil {
		http.Error(w, `{"error": "Failed to delete sale"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Sale deleted successfully",
	})
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

var (
	errDuplicateSale         = errors.New("duplicate sale")
	errIncompleteExpenditure = errors.New("Each expenditure must include both title and amount")
	errEmptyExpenditure      = errors.New("Empty expenditure rows are not allowed")
)

func validateExpenditures(expenditures []models.ExpenditureInput) error {
	for _, exp := range expenditures {
		hasTitle := strings.TrimSpace(exp.Title) != ""
		hasAmount := exp.Amount != 0
		if hasTitle != hasAmount {
			return errIncompleteExpenditure
		}
		if !hasTitle && !hasAmount {
			return errEmptyExpenditure
		}
	}
	return nil
}

func hasNegativeSaleValues(lunchHeadCount, dinnerHeadCount int, lunchSale, dinnerSale, creditSale, rejiMoney float64) bool {
	return lunchHeadCount < 0 ||
		dinnerHeadCount < 0 ||
		lunchSale < 0 ||
		dinnerSale < 0 ||
		creditSale < 0 ||
		rejiMoney < 0
}

func lookupAssignedRestaurantID(userID, restaurantID int, restaurantName string) (int, error) {
	var resolvedID int
	var err error
	if restaurantID != 0 {
		err = database.DB.QueryRow(
			`SELECT r.id
			 FROM restaurants r
			 JOIN assignments a ON a.restaurant_id = r.id
			 WHERE a.employee_id = ?
			   AND a.status = 'active'
			   AND r.id = ?
			 LIMIT 1`,
			userID,
			restaurantID,
		).Scan(&resolvedID)
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
			restaurantName,
		).Scan(&resolvedID)
	}
	return resolvedID, err
}

func ensureNoDuplicateSale(restaurantID int, date string, excludeSaleID int) error {
	query := `
		SELECT id
		FROM sales
		WHERE restaurant_id = ?
		  AND date = ?`
	args := []interface{}{restaurantID, date}
	if excludeSaleID != 0 {
		query += " AND id != ?"
		args = append(args, excludeSaleID)
	}
	query += " LIMIT 1"

	var existingSaleID int
	err := database.DB.QueryRow(query, args...).Scan(&existingSaleID)
	if err == sql.ErrNoRows {
		return nil
	}
	if err != nil {
		return err
	}
	return errDuplicateSale
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
