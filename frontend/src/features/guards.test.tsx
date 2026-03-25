import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RequireAuth from './RequireAuth'
import RequireRole from './RequireRole'
import { AuthContext } from '../context/AuthContext'
import type { User } from '../context/AuthTypes'

function renderRequireAuth(isAuthenticated: boolean) {
  localStorage.clear()
  if (isAuthenticated) {
    localStorage.setItem('prepsheet_token', 'token-123')
    localStorage.setItem(
      'prepsheet_user',
      JSON.stringify({ id: 1, name: 'Admin', email: 'admin@example.com', role: 'manager' }),
    )
  }

  render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route element={<RequireAuth />}>
          <Route path="/protected" element={<div>Protected page</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderRequireRole(user: User | null, allowedRoles: Array<'manager' | 'employee'>) {
  localStorage.clear()
  if (user) {
    localStorage.setItem('prepsheet_token', 'token-123')
    localStorage.setItem('prepsheet_user', JSON.stringify(user))
  }

  render(
    <AuthContext.Provider value={{ user }}>
      <MemoryRouter initialEntries={['/restricted']}>
        <Routes>
          <Route element={<RequireRole allowedRoles={allowedRoles} />}>
            <Route path="/restricted" element={<div>Restricted page</div>} />
          </Route>
          <Route path="/login" element={<div>Login page</div>} />
          <Route path="/home" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('route guards', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('RequireAuth redirects unauthenticated users to login', () => {
    renderRequireAuth(false)

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('RequireAuth renders protected routes for authenticated users', () => {
    renderRequireAuth(true)

    expect(screen.getByText('Protected page')).toBeInTheDocument()
  })

  it('RequireRole redirects unauthenticated users to login', () => {
    renderRequireRole(null, ['manager'])

    expect(screen.getByText('Login page')).toBeInTheDocument()
  })

  it('RequireRole redirects authenticated users with the wrong role to home', () => {
    renderRequireRole(
      { id: 2, name: 'Employee', email: 'employee@example.com', role: 'employee' },
      ['manager'],
    )

    expect(screen.getByText('Home page')).toBeInTheDocument()
  })

  it('RequireRole renders the route for allowed roles', () => {
    renderRequireRole(
      { id: 1, name: 'Admin', email: 'admin@example.com', role: 'manager' },
      ['manager'],
    )

    expect(screen.getByText('Restricted page')).toBeInTheDocument()
  })
})
