package handlers

import (
	"strings"
	"testing"
)

func TestValidateName_Valid(t *testing.T) {
	if err := ValidateName("Alice", "name"); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestValidateName_Empty(t *testing.T) {
	if err := ValidateName("", "name"); err == nil {
		t.Fatal("expected error for empty name")
	}
}

func TestValidateName_WhitespaceOnly(t *testing.T) {
	if err := ValidateName("   ", "name"); err == nil {
		t.Fatal("expected error for whitespace-only name")
	}
}

func TestValidateName_TooLong(t *testing.T) {
	long := strings.Repeat("a", MaxNameLength+1)
	if err := ValidateName(long, "name"); err == nil {
		t.Fatal("expected error for name exceeding max length")
	}
}

func TestValidateName_ExactMax(t *testing.T) {
	exact := strings.Repeat("a", MaxNameLength)
	if err := ValidateName(exact, "name"); err != nil {
		t.Fatalf("expected no error at max length, got %v", err)
	}
}

func TestValidateEmail_Valid(t *testing.T) {
	for _, email := range []string{"user@example.com", "a.b+c@domain.co", "test@sub.domain.org"} {
		if err := ValidateEmail(email); err != nil {
			t.Fatalf("expected valid for %q, got %v", email, err)
		}
	}
}

func TestValidateEmail_Empty(t *testing.T) {
	if err := ValidateEmail(""); err == nil {
		t.Fatal("expected error for empty email")
	}
}

func TestValidateEmail_InvalidFormat(t *testing.T) {
	for _, email := range []string{"notanemail", "missing@", "@nodomain.com", "spaces @x.com"} {
		if err := ValidateEmail(email); err == nil {
			t.Fatalf("expected error for invalid email %q", email)
		}
	}
}

func TestValidateEmail_TooLong(t *testing.T) {
	long := strings.Repeat("a", MaxEmailLength) + "@example.com"
	if err := ValidateEmail(long); err == nil {
		t.Fatal("expected error for email exceeding max length")
	}
}

func TestValidatePassword_Valid(t *testing.T) {
	if err := ValidatePassword("secure123"); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestValidatePassword_Empty(t *testing.T) {
	if err := ValidatePassword(""); err == nil {
		t.Fatal("expected error for empty password")
	}
}

func TestValidatePassword_TooShort(t *testing.T) {
	if err := ValidatePassword("12345"); err == nil {
		t.Fatal("expected error for password with 5 chars")
	}
}

func TestValidatePassword_MinLength(t *testing.T) {
	if err := ValidatePassword("123456"); err != nil {
		t.Fatalf("expected no error at min length, got %v", err)
	}
}

func TestValidatePassword_TooLong(t *testing.T) {
	long := strings.Repeat("a", MaxPasswordLength+1)
	if err := ValidatePassword(long); err == nil {
		t.Fatal("expected error for password exceeding max length")
	}
}

func TestValidateNote_Valid(t *testing.T) {
	if err := ValidateNote("short note"); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestValidateNote_Empty(t *testing.T) {
	// Empty notes are allowed
	if err := ValidateNote(""); err != nil {
		t.Fatalf("expected no error for empty note, got %v", err)
	}
}

func TestValidateNote_TooLong(t *testing.T) {
	long := strings.Repeat("x", MaxNoteLength+1)
	if err := ValidateNote(long); err == nil {
		t.Fatal("expected error for note exceeding max length")
	}
}

func TestValidateRestaurantName_Valid(t *testing.T) {
	if err := ValidateRestaurantName("Pizza Palace"); err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
}

func TestValidateRestaurantName_Empty(t *testing.T) {
	if err := ValidateRestaurantName(""); err == nil {
		t.Fatal("expected error for empty restaurant name")
	}
}

func TestValidateRestaurantName_TooLong(t *testing.T) {
	long := strings.Repeat("r", MaxRestaurantName+1)
	if err := ValidateRestaurantName(long); err == nil {
		t.Fatal("expected error for restaurant name exceeding max length")
	}
}

func TestValidateDate_Valid(t *testing.T) {
	for _, d := range []string{"2025-01-15", "2024-12-31", "2000-06-01"} {
		if err := ValidateDate(d); err != nil {
			t.Fatalf("expected valid for %q, got %v", d, err)
		}
	}
}

func TestValidateDate_Empty(t *testing.T) {
	if err := ValidateDate(""); err == nil {
		t.Fatal("expected error for empty date")
	}
}

func TestValidateDate_InvalidFormat(t *testing.T) {
	for _, d := range []string{"01-15-2025", "2025/01/15", "not-a-date", "2025-1-5"} {
		if err := ValidateDate(d); err == nil {
			t.Fatalf("expected error for invalid date %q", d)
		}
	}
}
