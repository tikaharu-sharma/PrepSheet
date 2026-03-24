import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Login from './Login'
import { loginUser } from '../lib/api'
import { setAuthSession } from '../lib/auth'

vi.mock('../lib/api', () => ({
  loginUser: vi.fn(),
}))

vi.mock('../lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/auth')>()
  return {
    ...actual,
    setAuthSession: vi.fn(),
  }
})

const mockedLoginUser = vi.mocked(loginUser)
const mockedSetAuthSession = vi.mocked(setAuthSession)

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Login page', () => {
  beforeEach(() => {
    mockedLoginUser.mockReset()
    mockedSetAuthSession.mockReset()
  })

  it('shows a validation error when email and password are empty', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Email and password are required.')).toBeInTheDocument()
    expect(mockedLoginUser).not.toHaveBeenCalled()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderLogin()

    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: /toggle password visibility/i }))
    expect(passwordInput).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: /toggle password visibility/i }))
    expect(passwordInput).toHaveAttribute('type', 'password')
  })

  it('clears both inputs and shows an error when login fails', async () => {
    const user = userEvent.setup()
    mockedLoginUser.mockRejectedValue({ status: 401, message: 'Invalid email or password.' })
    renderLogin()

    const emailInput = screen.getByLabelText('Email or Username')
    const passwordInput = screen.getByLabelText('Password')

    await user.type(emailInput, 'admin@example.com')
    await user.type(passwordInput, 'wrong-password')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText('Invalid email or password.')).toBeInTheDocument()
    await waitFor(() => {
      expect(emailInput).toHaveValue('')
      expect(passwordInput).toHaveValue('')
    })
  })

  it('stores the session and navigates home when login succeeds', async () => {
    const user = userEvent.setup()
    mockedLoginUser.mockResolvedValue({
      token: 'token-123',
      user: {
        id: 1,
        name: 'Admin',
        email: 'admin@example.com',
        role: 'manager',
      },
    })
    renderLogin()

    await user.type(screen.getByLabelText('Email or Username'), 'admin@example.com')
    await user.type(screen.getByLabelText('Password'), 'admin')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockedSetAuthSession).toHaveBeenCalledWith('token-123', {
        id: 1,
        name: 'Admin',
        email: 'admin@example.com',
        role: 'manager',
      })
    })
    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })
})
