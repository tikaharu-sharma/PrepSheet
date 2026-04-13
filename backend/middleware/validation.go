package middleware

import (
	"net/http"
)

// MaxRequestBodySize is the maximum allowed request body size (1 MB).
const MaxRequestBodySize = 1 * 1024 * 1024

// LimitBody wraps a handler to enforce a maximum request body size.
func LimitBody(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil {
			r.Body = http.MaxBytesReader(w, r.Body, MaxRequestBodySize)
		}
		next.ServeHTTP(w, r)
	}
}
