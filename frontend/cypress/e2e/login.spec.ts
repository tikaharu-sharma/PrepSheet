/// <reference types="cypress" />

describe('Login Page', () => {
  let credentials: { email: string; password: string }

  before(() => {
    // Load credentials from fixture before all tests
    cy.fixture('login').then((data) => {
      credentials = data
    })
  })
  // Runs before each test
  beforeEach(() => {
    // Visit the login page
    cy.visit('/');
  });

  it('should display login form correctly', () => {
    // Check if email input exists
    cy.get('input[type="text"]').should('exist');

    // Check if password input exists
    cy.get('input[type="password"]').should('exist');

    // Check if submit button exists (case-insensitive)
    cy.get('button[type="submit"]').contains(/^sign in$/i).should('exist');
  });

  it('should show error if fields are empty', () => {
    cy.get('button[type="submit"]').click();

    // Should display error alert
    cy.get('.MuiAlert-root').should('contain.text', 'Email and password are required.')
  });

  it('allows typing in the input fields', () => {
    cy.get('input[type="text"]').type(credentials.email).should('have.value', credentials.email)
    cy.get('input[type="password"]').type(credentials.password).should('have.value', credentials.password)
  })

  it('toggles password visibility', () => {
    cy.get('input[type="password"]').should('have.attr', 'type', 'password')
    cy.get('button[aria-label="toggle password visibility"]').click()
    cy.get('input[type="text"]').should('have.attr', 'type', 'text') 
 })
});