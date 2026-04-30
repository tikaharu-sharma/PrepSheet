package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"prepsheet-backend/handlers"

	"github.com/golang-jwt/jwt/v5"
)

// AuthMiddleware validates the JWT token and injects user claims into the request context.
func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, `{"error": "Authorization header is required"}`, http.StatusUnauthorized)
			return
		}

		// Expect format: "Bearer <token>"
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			http.Error(w, `{"error": "Authorization header must be: Bearer <token>"}`, http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// Parse and validate the JWT token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return handlers.JWTSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, `{"error": "Invalid or expired token"}`, http.StatusUnauthorized)
			return
		}

		// Extract claims
		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"error": "Invalid token claims"}`, http.StatusUnauthorized)
			return
		}

		// Add user info to request context
		userID := int(claims["user_id"].(float64))
		name := claims["name"].(string)
		email := claims["email"].(string)
		role := claims["role"].(string)

		ctx := context.WithValue(r.Context(), "user_id", userID) //nolint:staticcheck
		ctx = context.WithValue(ctx, "name", name)               //nolint:staticcheck
		ctx = context.WithValue(ctx, "email", email)             //nolint:staticcheck
		ctx = context.WithValue(ctx, "role", role)               //nolint:staticcheck

		next.ServeHTTP(w, r.WithContext(ctx))
	}
}

// CORSMiddleware adds CORS headers to allow frontend connections.
func CORSMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		frontendURL := os.Getenv("FRONTEND_URL")
		if frontendURL == "" {
			frontendURL = "http://localhost:5173"
		}
		w.Header().Set("Access-Control-Allow-Origin", frontendURL)
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
