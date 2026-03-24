import { clearAuthSession, getStoredUser, getToken, isLoggedIn, setAuthSession } from './auth'

describe('auth helpers', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('stores the token and user session', () => {
    setAuthSession('token-123', {
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'manager',
    })

    expect(getToken()).toBe('token-123')
    expect(getStoredUser()).toEqual({
      id: 1,
      name: 'Admin',
      email: 'admin@example.com',
      role: 'manager',
    })
    expect(isLoggedIn()).toBe(true)
  })

  it('clears auth and cached restaurant state on logout', () => {
    localStorage.setItem('prepsheet_token', 'token-123')
    localStorage.setItem(
      'prepsheet_user',
      JSON.stringify({
        id: 2,
        name: 'Employee',
        email: 'employee@example.com',
        role: 'employee',
      }),
    )
    localStorage.setItem('prepsheet_restaurants', JSON.stringify([{ id: 1, name: 'Test' }]))
    localStorage.setItem('prepsheet_selected_restaurant', '1')

    clearAuthSession()

    expect(getToken()).toBeNull()
    expect(getStoredUser()).toBeNull()
    expect(localStorage.getItem('prepsheet_restaurants')).toBeNull()
    expect(localStorage.getItem('prepsheet_selected_restaurant')).toBeNull()
    expect(isLoggedIn()).toBe(false)
  })
})
