import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import Settings from '../pages/Settings'
import { verifyCurrentPassword, changePassword } from '../lib/api'
import { clearAuthSession } from '../lib/auth'

vi.mock('../lib/api', () => ({
  verifyCurrentPassword: vi.fn(),
  changePassword: vi.fn(),
}))

vi.mock('../lib/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/auth')>()
  return {
    ...actual,
    clearAuthSession: vi.fn(),
  }
})

const mockedVerify = vi.mocked(verifyCurrentPassword)
const mockedChange = vi.mocked(changePassword)
const mockedClearAuth = vi.mocked(clearAuthSession)

function renderSettings() {
  return render(
    <MemoryRouter initialEntries={['/settings']}>
      <Routes>
        <Route path="/settings" element={<Settings />} />
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Settings page', () => {
  beforeEach(() => {
    mockedVerify.mockReset()
    mockedChange.mockReset()
    mockedClearAuth.mockReset()
  })

  it('shows validation error when current password is empty', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByText('Change Password'))
    await user.click(screen.getByRole('button', { name: /verify password/i }))

    expect(await screen.findByText('Current password is required.')).toBeInTheDocument()
    expect(mockedVerify).not.toHaveBeenCalled()
  })

  it('toggles password visibility', async () => {
    const user = userEvent.setup()
    renderSettings()

    await user.click(screen.getByText('Change Password'))

    const input = screen.getByLabelText('Current Password')
    expect(input).toHaveAttribute('type', 'password')

    const toggle = screen.getByLabelText('toggle current password visibility')

    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'text')

    await user.click(toggle)
    expect(input).toHaveAttribute('type', 'password')
  })

  it('moves to change step when verification succeeds', async () => {
    const user = userEvent.setup()
    mockedVerify.mockResolvedValue({message:"Password verified successfully."})

    renderSettings()

    await user.click(screen.getByText('Change Password'))
    await user.type(screen.getByLabelText('Current Password'), 'oldpass')
    await user.click(screen.getByRole('button', { name: /verify password/i }))

    expect(await screen.findByText('Current password verified. Enter your new password below.')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toBeInTheDocument()
  })

  it('shows error when verification fails', async () => {
    const user = userEvent.setup()
    mockedVerify.mockRejectedValue(new Error('Invalid password'))

    renderSettings()

    await user.click(screen.getByText('Change Password'))
    await user.type(screen.getByLabelText('Current Password'), 'wrong')
    await user.click(screen.getByRole('button', { name: /verify password/i }))

    expect(await screen.findByText('Invalid password')).toBeInTheDocument()
  })

  it('successfully changes password and navigates to login', async () => {
    const user = userEvent.setup()
    mockedVerify.mockResolvedValue({message:"ok"})
    mockedChange.mockResolvedValue({message:"ok"})

    renderSettings()

    // go to verify step
    await user.click(screen.getByText('Change Password'))
    await user.type(screen.getByLabelText('Current Password'), 'oldpass')
    await user.click(screen.getByRole('button', { name: /verify password/i }))

    // fill new password step
    await screen.findByLabelText('New Password')

    await user.type(screen.getByLabelText('New Password'), 'newpass123')
    await user.type(screen.getByLabelText('Confirm New Password'), 'newpass123')

    await user.click(screen.getByRole('button', { name: /update password/i }))

    await waitFor(() => {
      expect(mockedChange).toHaveBeenCalledWith('oldpass', 'newpass123')
      expect(mockedClearAuth).toHaveBeenCalled()
    })

    expect(await screen.findByText('Login page')).toBeInTheDocument()
  })

  it('shows mismatch error for new passwords', async () => {
    const user = userEvent.setup()
    mockedVerify.mockResolvedValue({message:"ok"})

    renderSettings()

    await user.click(screen.getByText('Change Password'))
    await user.type(screen.getByLabelText('Current Password'), 'oldpass')
    await user.click(screen.getByRole('button', { name: /verify password/i }))

    await screen.findByLabelText('New Password')

    await user.type(screen.getByLabelText('New Password'), 'a')
    await user.type(screen.getByLabelText('Confirm New Password'), 'b')

    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByText('New password and confirm password must match.')).toBeInTheDocument()
  })
})