package middleware

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestLimitBody_AllowsSmallBody(t *testing.T) {
	handler := LimitBody(func(w http.ResponseWriter, r *http.Request) {
		buf := make([]byte, 1024)
		_, err := r.Body.Read(buf)
		if err != nil && err.Error() != "EOF" {
			t.Fatalf("unexpected error reading body: %v", err)
		}
		w.WriteHeader(http.StatusOK)
	})

	body := strings.NewReader(`{"name":"test"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/test", body)
	rr := httptest.NewRecorder()
	handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}

func TestLimitBody_RejectsOversizedBody(t *testing.T) {
	handler := LimitBody(func(w http.ResponseWriter, r *http.Request) {
		buf := make([]byte, MaxRequestBodySize+100)
		_, err := r.Body.Read(buf)
		if err == nil {
			t.Fatal("expected error reading oversized body")
		}
		// MaxBytesReader returns an error when limit exceeded
		w.WriteHeader(http.StatusOK)
	})

	// Create a body just over the limit
	oversized := strings.Repeat("x", MaxRequestBodySize+1)
	req := httptest.NewRequest(http.MethodPost, "/api/test", strings.NewReader(oversized))
	rr := httptest.NewRecorder()
	handler(rr, req)
}

func TestLimitBody_NilBody(t *testing.T) {
	handler := LimitBody(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	req := httptest.NewRequest(http.MethodGet, "/api/test", nil)
	rr := httptest.NewRecorder()
	handler(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
}
