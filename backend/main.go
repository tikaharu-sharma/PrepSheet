package main

import (
	"log"
	"net/http"
	"time"

	"prepsheet-backend/database"
	"prepsheet-backend/handlers"
	"prepsheet-backend/middleware"
)

func main() {
	// Initialize the SQLite database
	database.InitDB()

	// Rate limiter: 10 attempts per 15 minutes for auth endpoints
	authLimiter := middleware.NewRateLimiter(10, 15*time.Minute)

	// Create a new ServeMux
	mux := http.NewServeMux()

	// ─── Public routes (no auth required) ───────────────────────────────
	mux.HandleFunc("/api/signup", authLimiter.Limit(middleware.LimitBody(handlers.Signup)))
	mux.HandleFunc("/api/login", authLimiter.Limit(middleware.LimitBody(handlers.Login)))

	// ─── Restaurant routes ──────────────────────────────────────────────
	mux.HandleFunc("/api/restaurants", middleware.AuthMiddleware(middleware.LimitBody(handlers.GetRestaurants)))
	mux.HandleFunc("/api/restaurants/add", middleware.AuthMiddleware(middleware.LimitBody(handlers.AddRestaurant)))
	mux.HandleFunc("/api/restaurants/update", middleware.AuthMiddleware(middleware.LimitBody(handlers.UpdateRestaurant)))
	mux.HandleFunc("/api/restaurants/delete", middleware.AuthMiddleware(middleware.LimitBody(handlers.DeleteRestaurant)))

	// ─── Sales routes ───────────────────────────────────────────────────
	mux.HandleFunc("/api/sales", middleware.AuthMiddleware(middleware.LimitBody(handlers.AddSale)))
	mux.HandleFunc("/api/sales/my", middleware.AuthMiddleware(middleware.LimitBody(handlers.GetMySales)))
	mux.HandleFunc("/api/sales/all", middleware.AuthMiddleware(middleware.LimitBody(handlers.GetSales)))
	mux.HandleFunc("/api/sales/update", middleware.AuthMiddleware(middleware.LimitBody(handlers.UpdateSale)))
	mux.HandleFunc("/api/sales/delete", middleware.AuthMiddleware(middleware.LimitBody(handlers.DeleteSale)))

	// ─── Reports ────────────────────────────────────────────────────────
	mux.HandleFunc("/api/reports/monthly", middleware.AuthMiddleware(middleware.LimitBody(handlers.GetMonthlyReport)))

	// ─── User management routes ─────────────────────────────────────────
	mux.HandleFunc("/api/users", middleware.AuthMiddleware(middleware.LimitBody(handlers.GetUsers)))
	mux.HandleFunc("/api/users/create", middleware.AuthMiddleware(middleware.LimitBody(handlers.CreateEmployee)))
	mux.HandleFunc("/api/users/update", middleware.AuthMiddleware(middleware.LimitBody(handlers.UpdateEmployee)))
	mux.HandleFunc("/api/users/delete", middleware.AuthMiddleware(middleware.LimitBody(handlers.DeleteEmployee)))
	mux.HandleFunc("/api/users/status", middleware.AuthMiddleware(middleware.LimitBody(handlers.UpdateUserStatus)))
	mux.HandleFunc("/api/users/verify-password", middleware.AuthMiddleware(middleware.LimitBody(handlers.VerifyPassword)))
	mux.HandleFunc("/api/users/change-password", middleware.AuthMiddleware(middleware.LimitBody(handlers.ChangePassword)))

	// ─── Assignment routes ──────────────────────────────────────────────
	mux.HandleFunc("/api/assignments", middleware.AuthMiddleware(middleware.LimitBody(handlers.GetAssignments)))
	mux.HandleFunc("/api/assignments/add", middleware.AuthMiddleware(middleware.LimitBody(handlers.AddAssignment)))
	mux.HandleFunc("/api/assignments/update", middleware.AuthMiddleware(middleware.LimitBody(handlers.UpdateAssignment)))
	mux.HandleFunc("/api/assignments/delete", middleware.AuthMiddleware(middleware.LimitBody(handlers.DeleteAssignment)))

	// Health check endpoint
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"status": "ok", "service": "PrepSheet Backend"}`))
	})

	// Wrap with CORS middleware
	handler := middleware.CORSMiddleware(mux)

	// Start the server
	port := ":8080"
	log.Printf("PrepSheet backend server starting on http://localhost%s", port)
	log.Fatal(http.ListenAndServe(port, handler))
}
