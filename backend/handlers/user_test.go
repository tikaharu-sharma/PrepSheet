package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"prepsheet-backend/models"
)

func requestWithUserID(req *http.Request, userID int) *http.Request {
	ctx := context.WithValue(req.Context(), "user_id", userID) //nolint:staticcheck
	return req.WithContext(ctx)
}

func TestSignup_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"name":"John Doe","email":"john@example.com","password":"secret123","role":"employee"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	Signup(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", rr.Code, rr.Body.String())
	}

	var resp map[string]interface{}
	json.NewDecoder(rr.Body).Decode(&resp)
	if resp["user_id"] == nil {
		t.Fatal("expected user_id in response")
	}
}

func TestSignup_MethodNotAllowed(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/signup", nil)
	rr := httptest.NewRecorder()

	Signup(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status 405, got %d", rr.Code)
	}
}

func TestSignup_MissingFields(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"name":"","email":"john@example.com","password":"secret123"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	Signup(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

func TestSignup_DuplicateEmail(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"name":"John Doe","email":"dup@example.com","password":"secret123","role":"employee"}`

	// First signup
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	Signup(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("first signup failed: %d", rr.Code)
	}

	// Duplicate signup
	req2 := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(body))
	req2.Header.Set("Content-Type", "application/json")
	rr2 := httptest.NewRecorder()
	Signup(rr2, req2)

	if rr2.Code != http.StatusConflict {
		t.Fatalf("expected status 409 for duplicate email, got %d", rr2.Code)
	}
}

func TestSignup_DefaultRole(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"name":"Jane","email":"jane@example.com","password":"pass123","role":"invalid"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()

	Signup(rr, req)

	if rr.Code != http.StatusCreated {
		t.Fatalf("expected status 201, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestLogin_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	// Register first
	signupBody := `{"name":"Test User","email":"test@example.com","password":"mypassword","role":"employee"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(signupBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	Signup(rr, req)

	// Login
	loginBody := `{"email":"test@example.com","password":"mypassword"}`
	req2 := httptest.NewRequest(http.MethodPost, "/api/login", bytes.NewBufferString(loginBody))
	req2.Header.Set("Content-Type", "application/json")
	rr2 := httptest.NewRecorder()
	Login(rr2, req2)

	if rr2.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr2.Code, rr2.Body.String())
	}

	var resp models.LoginResponse
	json.NewDecoder(rr2.Body).Decode(&resp)
	if resp.Token == "" {
		t.Fatal("expected a token in response")
	}
	if resp.Email != "test@example.com" {
		t.Fatalf("expected email test@example.com, got %s", resp.Email)
	}
	if resp.Role != "employee" {
		t.Fatalf("expected role employee, got %s", resp.Role)
	}
}

func TestLogin_MethodNotAllowed(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/login", nil)
	rr := httptest.NewRecorder()
	Login(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status 405, got %d", rr.Code)
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	signupBody := `{"name":"User","email":"user@example.com","password":"correct","role":"employee"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(signupBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	Signup(rr, req)

	loginBody := `{"email":"user@example.com","password":"wrong"}`
	req2 := httptest.NewRequest(http.MethodPost, "/api/login", bytes.NewBufferString(loginBody))
	req2.Header.Set("Content-Type", "application/json")
	rr2 := httptest.NewRecorder()
	Login(rr2, req2)

	if rr2.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr2.Code)
	}
}

func TestLogin_NonexistentUser(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	loginBody := `{"email":"nobody@example.com","password":"password"}`
	req := httptest.NewRequest(http.MethodPost, "/api/login", bytes.NewBufferString(loginBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	Login(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d", rr.Code)
	}
}

func TestLogin_InactiveUser(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	// Create user
	signupBody := `{"name":"Inactive","email":"inactive@example.com","password":"pass123","role":"employee"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(signupBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	Signup(rr, req)

	// Deactivate
	statusBody := `{"user_id":1,"status":"inactive"}`
	req2 := httptest.NewRequest(http.MethodPut, "/api/users/status", bytes.NewBufferString(statusBody))
	req2.Header.Set("Content-Type", "application/json")
	rr2 := httptest.NewRecorder()
	UpdateUserStatus(rr2, req2)

	// Try to login
	loginBody := `{"email":"inactive@example.com","password":"pass123"}`
	req3 := httptest.NewRequest(http.MethodPost, "/api/login", bytes.NewBufferString(loginBody))
	req3.Header.Set("Content-Type", "application/json")
	rr3 := httptest.NewRecorder()
	Login(rr3, req3)

	if rr3.Code != http.StatusForbidden {
		t.Fatalf("expected status 403 for inactive user, got %d", rr3.Code)
	}
}

func TestLogin_MissingFields(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	loginBody := `{"email":"","password":""}`
	req := httptest.NewRequest(http.MethodPost, "/api/login", bytes.NewBufferString(loginBody))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	Login(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

func TestGetUsers_Empty(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	rr := httptest.NewRecorder()
	GetUsers(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var users []models.User
	json.NewDecoder(rr.Body).Decode(&users)
	if len(users) != 0 {
		t.Fatalf("expected 0 users, got %d", len(users))
	}
}

func TestGetUsers_WithData(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	// Create two users
	for _, body := range []string{
		`{"name":"Alice","email":"alice@example.com","password":"password","role":"manager"}`,
		`{"name":"Bob","email":"bob@example.com","password":"password","role":"employee"}`,
	} {
		req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(body))
		req.Header.Set("Content-Type", "application/json")
		Signup(httptest.NewRecorder(), req)
	}

	req := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	rr := httptest.NewRecorder()
	GetUsers(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	var users []models.User
	json.NewDecoder(rr.Body).Decode(&users)
	if len(users) != 2 {
		t.Fatalf("expected 2 users, got %d", len(users))
	}
}

func TestUpdateUserStatus_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	// Create a user
	signupBody := `{"name":"Status User","email":"status@example.com","password":"password","role":"employee"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(signupBody))
	req.Header.Set("Content-Type", "application/json")
	Signup(httptest.NewRecorder(), req)

	// Update status
	statusBody := `{"user_id":1,"status":"inactive"}`
	req2 := httptest.NewRequest(http.MethodPut, "/api/users/status", bytes.NewBufferString(statusBody))
	req2.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	UpdateUserStatus(rr, req2)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestUpdateUserStatus_MethodNotAllowed(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	req := httptest.NewRequest(http.MethodGet, "/api/users/status", nil)
	rr := httptest.NewRecorder()
	UpdateUserStatus(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected status 405, got %d", rr.Code)
	}
}

func TestUpdateUserStatus_InvalidStatus(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	body := `{"user_id":1,"status":"banned"}`
	req := httptest.NewRequest(http.MethodPut, "/api/users/status", bytes.NewBufferString(body))
	req.Header.Set("Content-Type", "application/json")
	rr := httptest.NewRecorder()
	UpdateUserStatus(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", rr.Code)
	}
}

func TestVerifyPassword_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	signupBody := `{"name":"Manager","email":"manager@example.com","password":"current-pass","role":"manager"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(signupBody))
	req.Header.Set("Content-Type", "application/json")
	Signup(httptest.NewRecorder(), req)

	verifyBody := `{"current_password":"current-pass"}`
	verifyReq := httptest.NewRequest(http.MethodPost, "/api/users/verify-password", bytes.NewBufferString(verifyBody))
	verifyReq.Header.Set("Content-Type", "application/json")
	verifyReq = requestWithUserID(verifyReq, 1)
	rr := httptest.NewRecorder()

	VerifyPassword(rr, verifyReq)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}
}

func TestChangePassword_Success(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	signupBody := `{"name":"Manager","email":"manager@example.com","password":"current-pass","role":"manager"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(signupBody))
	req.Header.Set("Content-Type", "application/json")
	Signup(httptest.NewRecorder(), req)

	changeBody := `{"current_password":"current-pass","new_password":"new-pass-123"}`
	changeReq := httptest.NewRequest(http.MethodPut, "/api/users/change-password", bytes.NewBufferString(changeBody))
	changeReq.Header.Set("Content-Type", "application/json")
	changeReq = requestWithUserID(changeReq, 1)
	rr := httptest.NewRecorder()

	ChangePassword(rr, changeReq)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", rr.Code, rr.Body.String())
	}

	loginBody := `{"email":"manager@example.com","password":"new-pass-123"}`
	loginReq := httptest.NewRequest(http.MethodPost, "/api/login", bytes.NewBufferString(loginBody))
	loginReq.Header.Set("Content-Type", "application/json")
	loginRR := httptest.NewRecorder()
	Login(loginRR, loginReq)

	if loginRR.Code != http.StatusOK {
		t.Fatalf("expected login with new password to succeed, got %d: %s", loginRR.Code, loginRR.Body.String())
	}
}

func TestChangePassword_WrongCurrentPassword(t *testing.T) {
	setupTestDB()
	defer teardownTestDB()

	signupBody := `{"name":"Manager","email":"manager@example.com","password":"current-pass","role":"manager"}`
	req := httptest.NewRequest(http.MethodPost, "/api/signup", bytes.NewBufferString(signupBody))
	req.Header.Set("Content-Type", "application/json")
	Signup(httptest.NewRecorder(), req)

	changeBody := `{"current_password":"wrong-pass","new_password":"new-pass-123"}`
	changeReq := httptest.NewRequest(http.MethodPut, "/api/users/change-password", bytes.NewBufferString(changeBody))
	changeReq.Header.Set("Content-Type", "application/json")
	changeReq = requestWithUserID(changeReq, 1)
	rr := httptest.NewRecorder()

	ChangePassword(rr, changeReq)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401, got %d: %s", rr.Code, rr.Body.String())
	}
}
