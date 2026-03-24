import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '../pages/Login'
import { loginUser } from '../lib/api'
import { setAuthSession } from '../lib/auth'
import { vi } from 'vitest'

// Mock the loginUser API and auth functions
vi.mock('../lib/api', () => ({
  loginUser: vi.fn(),
}))
vi.mock('../lib/auth', () => ({
  setAuthSession: vi.fn(),
}))

const mockedLoginUser = vi.mocked(loginUser)
const mockedSetAuthSession = vi.mocked(setAuthSession)

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password fields and sign-in button', () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows error when submitting empty fields', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    const button = screen.getByRole('button', { name: /sign in/i })
    fireEvent.click(button)

    expect(await screen.findByText(/email and password are required/i)).toBeInTheDocument()
  })

  it('calls loginUser and sets auth on successful login', async () => {
    mockedLoginUser.mockResolvedValue({ token: '123', user: { id: 1, name: 'Test' , email: 'test@example.com', role: 'manager'}, })

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    // Wait for next render (sign in button still exists)
    await screen.findByRole('button', { name: /sign in/i })

    expect(mockedLoginUser).toHaveBeenCalledWith('test@example.com', 'password')
    expect(mockedSetAuthSession).toHaveBeenCalledWith('123', { id: 1, name: 'Test', email: 'test@example.com', role: 'manager' })
  })

  it('shows error message on failed login', async () => {
    // Use unknown + type guard
    mockedLoginUser.mockRejectedValue({ status: 401 } as unknown)

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument()
  })
})