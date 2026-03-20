package main

import (
	"log"
	"net/http"

	"prepsheet-backend/database"
	"prepsheet-backend/handlers"
	"prepsheet-backend/middleware"
)

func main() {
	// Initialize the SQLite database
	database.InitDB()

	// Create a new ServeMux
	mux := http.NewServeMux()

	// ─── Public routes (no auth required) ───────────────────────────────
	mux.HandleFunc("/api/signup", handlers.Signup)
	mux.HandleFunc("/api/login", handlers.Login)

	// ─── Restaurant routes ──────────────────────────────────────────────
	mux.HandleFunc("/api/restaurants", middleware.AuthMiddleware(handlers.GetRestaurants))
	mux.HandleFunc("/api/restaurants/add", middleware.AuthMiddleware(handlers.AddRestaurant))
	mux.HandleFunc("/api/restaurants/delete", middleware.AuthMiddleware(handlers.DeleteRestaurant))

	// ─── Sales routes ───────────────────────────────────────────────────
	mux.HandleFunc("/api/sales", middleware.AuthMiddleware(handlers.AddSale))
	mux.HandleFunc("/api/sales/my", middleware.AuthMiddleware(handlers.GetMySales))
	mux.HandleFunc("/api/sales/all", middleware.AuthMiddleware(handlers.GetSales))

	// ─── Reports ────────────────────────────────────────────────────────
	mux.HandleFunc("/api/reports/monthly", middleware.AuthMiddleware(handlers.GetMonthlyReport))

	// ─── User management routes ─────────────────────────────────────────
	mux.HandleFunc("/api/users", middleware.AuthMiddleware(handlers.GetUsers))
	mux.HandleFunc("/api/users/status", middleware.AuthMiddleware(handlers.UpdateUserStatus))

	// ─── Assignment routes ──────────────────────────────────────────────
	mux.HandleFunc("/api/assignments", middleware.AuthMiddleware(handlers.GetAssignments))
	mux.HandleFunc("/api/assignments/add", middleware.AuthMiddleware(handlers.AddAssignment))
	mux.HandleFunc("/api/assignments/update", middleware.AuthMiddleware(handlers.UpdateAssignment))
	mux.HandleFunc("/api/assignments/delete", middleware.AuthMiddleware(handlers.DeleteAssignment))

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
