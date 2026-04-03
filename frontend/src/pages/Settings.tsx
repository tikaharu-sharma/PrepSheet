import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { changePassword, verifyCurrentPassword } from '../lib/api'
import { clearAuthSession } from '../lib/auth'

type Step = 'overview' | 'verify' | 'change'
type PasswordField = 'current' | 'new' | 'confirm'

export default function Settings() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('overview')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState<Record<PasswordField, boolean>>({
    current: false,
    new: false,
    confirm: false,
  })

  const toggleVisibility = (field: PasswordField) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const resetFlow = () => {
    setStep('overview')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError(null)
    setInfoMessage(null)
    setVerifying(false)
    setSubmitting(false)
    setShowPassword({
      current: false,
      new: false,
      confirm: false,
    })
  }

  const handleVerifyCurrentPassword = async () => {
    if (!currentPassword.trim()) {
      setError('Current password is required.')
      return
    }

    try {
      setVerifying(true)
      setError(null)
      await verifyCurrentPassword(currentPassword)
      setInfoMessage('Current password verified. Enter your new password below.')
      setStep('change')
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message)
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message?: string }).message || 'Failed to verify current password.')
      } else {
        setError('Failed to verify current password.')
      }
    } finally {
      setVerifying(false)
    }
  }

  const handleChangePassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('New password and confirmation are required.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirm password must match.')
      return
    }

    if (newPassword === currentPassword) {
      setError('New password must be different from the current password.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await changePassword(currentPassword, newPassword)
      clearAuthSession()
      navigate('/login', { replace: true })
    } catch (err) {
      if (err instanceof Error && err.message) {
        setError(err.message)
      } else if (typeof err === 'object' && err !== null && 'message' in err) {
        setError((err as { message?: string }).message || 'Failed to change password.')
      } else {
        setError('Failed to change password.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const passwordAdornment = (field: PasswordField) => (
    <InputAdornment position="end">
      <IconButton
        onClick={() => toggleVisibility(field)}
        edge="end"
        tabIndex={-1}
        aria-label={`toggle ${field} password visibility`}
      >
        {showPassword[field] ? <VisibilityOff /> : <Visibility />}
      </IconButton>
    </InputAdornment>
  )

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Card elevation={6} sx={{ p: 4, borderRadius: 3 }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" component="h1">
              Settings
            </Typography>
            <Typography color="text.secondary">
              Manage your account settings.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {infoMessage && <Alert severity="success">{infoMessage}</Alert>}

          {step === 'overview' && (
            <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Button
                fullWidth
                onClick={() => setStep('verify')}
                sx={{
                  justifyContent: 'space-between',
                  px: 3,
                  py: 2.25,
                  color: 'text.primary',
                  textTransform: 'none',
                  borderRadius: 0,
                }}
              >
                <Box sx={{ textAlign: 'left' }}>
                  <Typography variant="h6">Change Password</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Update your account password.
                  </Typography>
                </Box>
                <Typography variant="h6" color="text.secondary">
                  &gt;
                </Typography>
              </Button>
              <Divider />
            </Paper>
          )}

          {(step === 'verify' || step === 'change') && (
            <Stack spacing={2}>
              <Box>
                <Button
                  variant="text"
                  onClick={resetFlow}
                  sx={{ px: 0, mb: 1, textTransform: 'none' }}
                >
                  Back to Settings
                </Button>
                <Typography variant="h5">
                  Change Password
                </Typography>
                <Typography color="text.secondary">
                  {step === 'verify'
                    ? 'Confirm your current password to continue.'
                    : 'Choose a new password and confirm it before saving.'}
                </Typography>
              </Box>

              {step === 'verify' && (
                <>
                  <TextField
                    label="Current Password"
                    type={showPassword.current ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    fullWidth
                    InputProps={{ endAdornment: passwordAdornment('current') }}
                  />
                  <Stack direction="row" spacing={2}>
                    <Button variant="outlined" fullWidth onClick={resetFlow} disabled={verifying}>
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleVerifyCurrentPassword}
                      disabled={verifying}
                      startIcon={verifying ? <CircularProgress size={18} color="inherit" /> : undefined}
                    >
                      {verifying ? 'Verifying...' : 'Verify Password'}
                    </Button>
                  </Stack>
                </>
              )}

              {step === 'change' && (
                <>
                  <TextField
                    label="New Password"
                    type={showPassword.new ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    autoComplete="new-password"
                    fullWidth
                    InputProps={{ endAdornment: passwordAdornment('new') }}
                  />
                  <TextField
                    label="Confirm New Password"
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    fullWidth
                    InputProps={{ endAdornment: passwordAdornment('confirm') }}
                  />
                  <Stack direction="row" spacing={2}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        setStep('verify')
                        setNewPassword('')
                        setConfirmPassword('')
                        setError(null)
                        setInfoMessage(null)
                      }}
                      disabled={submitting}
                    >
                      Back
                    </Button>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleChangePassword}
                      disabled={submitting}
                      startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : undefined}
                    >
                      {submitting ? 'Updating...' : 'Update Password'}
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>
          )}
        </Stack>
      </Card>
    </Container>
  )
}
