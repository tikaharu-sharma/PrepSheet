package handlers

import (
	"fmt"
	"regexp"
	"strings"
)

const (
	MaxNameLength       = 100
	MaxEmailLength      = 254
	MaxPasswordLength   = 72 // bcrypt limit
	MaxNoteLength       = 1000
	MaxRestaurantName   = 100
	MaxExpenditureTitle = 200
	MaxExpenditures     = 50
)

var emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)

// ValidateName checks a name field for length and emptiness.
func ValidateName(name, fieldName string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return fmt.Errorf("%s is required", fieldName)
	}
	if len(name) > MaxNameLength {
		return fmt.Errorf("%s must be %d characters or fewer", fieldName, MaxNameLength)
	}
	return nil
}

// ValidateEmail checks an email for format and length.
func ValidateEmail(email string) error {
	email = strings.TrimSpace(email)
	if email == "" {
		return fmt.Errorf("email is required")
	}
	if len(email) > MaxEmailLength {
		return fmt.Errorf("email must be %d characters or fewer", MaxEmailLength)
	}
	if !emailRegex.MatchString(email) {
		return fmt.Errorf("invalid email format")
	}
	return nil
}

// ValidatePassword checks a password for length constraints.
func ValidatePassword(password string) error {
	if password == "" {
		return fmt.Errorf("password is required")
	}
	if len(password) < 6 {
		return fmt.Errorf("password must be at least 6 characters")
	}
	if len(password) > MaxPasswordLength {
		return fmt.Errorf("password must be %d characters or fewer", MaxPasswordLength)
	}
	return nil
}

// ValidateNote checks a note field for length.
func ValidateNote(note string) error {
	if len(note) > MaxNoteLength {
		return fmt.Errorf("note must be %d characters or fewer", MaxNoteLength)
	}
	return nil
}

// ValidateRestaurantName checks a restaurant name for length and emptiness.
func ValidateRestaurantName(name string) error {
	name = strings.TrimSpace(name)
	if name == "" {
		return fmt.Errorf("restaurant name is required")
	}
	if len(name) > MaxRestaurantName {
		return fmt.Errorf("restaurant name must be %d characters or fewer", MaxRestaurantName)
	}
	return nil
}

// ValidateDate checks that a date string matches YYYY-MM-DD format.
func ValidateDate(date string) error {
	if date == "" {
		return fmt.Errorf("date is required")
	}
	matched, _ := regexp.MatchString(`^\d{4}-\d{2}-\d{2}$`, date)
	if !matched {
		return fmt.Errorf("date must be in YYYY-MM-DD format")
	}
	return nil
}
