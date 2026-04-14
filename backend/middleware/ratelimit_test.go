package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestRateLimiter_AllowsUnderLimit(t *testing.T) {
	rl := NewRateLimiter(3, 1*time.Minute)

	handler := rl.Limit(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	for i := 0; i < 3; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/login", nil)
		req.RemoteAddr = "192.168.1.1:12345"
		rr := httptest.NewRecorder()
		handler(rr, req)
		if rr.Code != http.StatusOK {
			t.Fatalf("request %d: expected 200, got %d", i+1, rr.Code)
		}
	}
}

func TestRateLimiter_BlocksOverLimit(t *testing.T) {
	rl := NewRateLimiter(2, 1*time.Minute)

	handler := rl.Limit(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	for i := 0; i < 2; i++ {
		req := httptest.NewRequest(http.MethodPost, "/api/login", nil)
		req.RemoteAddr = "10.0.0.1:9999"
		rr := httptest.NewRecorder()
		handler(rr, req)
	}

	// 3rd request should be rejected
	req := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	req.RemoteAddr = "10.0.0.1:9999"
	rr := httptest.NewRecorder()
	handler(rr, req)

	if rr.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429, got %d", rr.Code)
	}
	if rr.Header().Get("Retry-After") == "" {
		t.Fatal("expected Retry-After header")
	}
}

func TestRateLimiter_DifferentIPsIndependent(t *testing.T) {
	rl := NewRateLimiter(1, 1*time.Minute)

	handler := rl.Limit(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// First IP uses its one allowed request
	req1 := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	req1.RemoteAddr = "1.1.1.1:1111"
	rr1 := httptest.NewRecorder()
	handler(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Fatalf("expected 200 for first IP, got %d", rr1.Code)
	}

	// Second IP should still be allowed
	req2 := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	req2.RemoteAddr = "2.2.2.2:2222"
	rr2 := httptest.NewRecorder()
	handler(rr2, req2)
	if rr2.Code != http.StatusOK {
		t.Fatalf("expected 200 for second IP, got %d", rr2.Code)
	}
}

func TestRateLimiter_ResetsAfterWindow(t *testing.T) {
	rl := NewRateLimiter(1, 50*time.Millisecond)

	handler := rl.Limit(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Use the one allowed request
	req := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	req.RemoteAddr = "3.3.3.3:3333"
	rr := httptest.NewRecorder()
	handler(rr, req)

	// Should be blocked
	req2 := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	req2.RemoteAddr = "3.3.3.3:3333"
	rr2 := httptest.NewRecorder()
	handler(rr2, req2)
	if rr2.Code != http.StatusTooManyRequests {
		t.Fatalf("expected 429 before window reset, got %d", rr2.Code)
	}

	// Wait for window to expire
	time.Sleep(60 * time.Millisecond)

	// Should be allowed again
	req3 := httptest.NewRequest(http.MethodPost, "/api/login", nil)
	req3.RemoteAddr = "3.3.3.3:3333"
	rr3 := httptest.NewRecorder()
	handler(rr3, req3)
	if rr3.Code != http.StatusOK {
		t.Fatalf("expected 200 after window reset, got %d", rr3.Code)
	}
}
