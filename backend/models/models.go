package models

// User represents an employee or manager in the system.
type User struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Password  string `json:"password,omitempty"`
	Role      string `json:"role"`
	Status    string `json:"status"`
	CreatedAt string `json:"created_at"`
}

// SignupRequest is the payload for user registration.
type SignupRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Password string `json:"password"`
	Role     string `json:"role"`
}

// LoginRequest is the payload for user login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginResponse is returned after successful authentication.
type LoginResponse struct {
	Token  string `json:"token"`
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
	Role   string `json:"role"`
}

// Restaurant represents a restaurant location.
type Restaurant struct {
	ID        int    `json:"id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at,omitempty"`
}

// Expenditure represents a single expenditure line item within a sale.
type Expenditure struct {
	ID     int     `json:"id"`
	SaleID int     `json:"sale_id,omitempty"`
	Title  string  `json:"title"`
	Amount float64 `json:"amount"`
}

// Sale represents a daily sales entry matching the frontend SalesData interface.
type Sale struct {
	ID              int           `json:"id"`
	EmployeeID      int           `json:"employee_id"`
	RestaurantID    int           `json:"restaurant_id"`
	RestaurantName  string        `json:"restaurant_name,omitempty"`
	Date            string        `json:"date"`
	LunchHeadCount  int           `json:"lunch_head_count"`
	LunchSale       float64       `json:"lunch_sale"`
	DinnerHeadCount int           `json:"dinner_head_count"`
	DinnerSale      float64       `json:"dinner_sale"`
	CreditSale      float64       `json:"credit_sale"`
	RejiMoney       float64       `json:"reji_money"`
	Expenditures    []Expenditure `json:"expenditures"`
	Note            string        `json:"note"`
	CreatedAt       string        `json:"created_at,omitempty"`
}

// SaleRequest is the payload for adding a new sale entry.
type SaleRequest struct {
	Date            string             `json:"date"`
	Restaurant      string             `json:"restaurant"`
	LunchHeadCount  int                `json:"lunch_head_count"`
	LunchSale       float64            `json:"lunch_sale"`
	DinnerHeadCount int                `json:"dinner_head_count"`
	DinnerSale      float64            `json:"dinner_sale"`
	CreditSale      float64            `json:"credit_sale"`
	RejiMoney       float64            `json:"reji_money"`
	Expenditures    []ExpenditureInput `json:"expenditures"`
	Note            string             `json:"note"`
}

// ExpenditureInput is the payload for a single expenditure in a sale request.
type ExpenditureInput struct {
	Title  string  `json:"title"`
	Amount float64 `json:"amount"`
}

// MonthlySalesReport holds aggregated monthly data.
type MonthlySalesReport struct {
	Month       string  `json:"month"`
	TotalSales  float64 `json:"total_sales"`
	TotalLunch  float64 `json:"total_lunch"`
	TotalDinner float64 `json:"total_dinner"`
	EntryCount  int     `json:"entry_count"`
}

// Assignment represents a restaurant-to-employee assignment.
type Assignment struct {
	ID             int    `json:"id"`
	RestaurantID   int    `json:"restaurant_id"`
	RestaurantName string `json:"restaurant_name,omitempty"`
	EmployeeID     int    `json:"employee_id"`
	EmployeeName   string `json:"employee_name,omitempty"`
	EmployeeEmail  string `json:"employee_email,omitempty"`
	Status         string `json:"status"`
	CreatedAt      string `json:"created_at,omitempty"`
}

// AssignmentRequest is the payload for creating/updating an assignment.
type AssignmentRequest struct {
	RestaurantID int    `json:"restaurant_id"`
	EmployeeID   int    `json:"employee_id"`
	Status       string `json:"status"`
}
