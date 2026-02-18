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
	mux.HandleFunc("/api/signup", handlers.Signup)  // POST
	mux.HandleFunc("/api/login", handlers.Login)    // POST

	// ─── Protected routes (JWT auth required) ───────────────────────────
	// Employee: add a daily sales entry
	mux.HandleFunc("/api/sales", middleware.AuthMiddleware(handlers.AddSale))           // POST
	// Employee: view own sales
	mux.HandleFunc("/api/sales/my", middleware.AuthMiddleware(handlers.GetMySales))     // GET
	// Manager: view all sales (with optional date filters)
	mux.HandleFunc("/api/sales/all", middleware.AuthMiddleware(handlers.GetSales))      // GET
	// Manager: get monthly aggregated report
	mux.HandleFunc("/api/reports/monthly", middleware.AuthMiddleware(handlers.GetMonthlyReport)) // GET

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
