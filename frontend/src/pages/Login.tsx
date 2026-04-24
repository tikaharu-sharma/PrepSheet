import React, { useState } from 'react'
import { Box, Paper, Stack, Typography, TextField, Button, Alert, InputAdornment, IconButton, Chip } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom';
import { setAuthSession } from '../lib/auth';
import { loginUser } from '../lib/api';
import PrepSheetLogo from '../assets/PrepSheet.svg';


export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const navigate = useNavigate();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required.');
      return;
    }

    setError(null);

    try {
      const response = await loginUser(email, password);
      setAuthSession(response.token, response.user);
      navigate('/home');
    } catch (err: unknown) {
      const error = err as { status?: number; message?: string };
      if (error.status === 401) {
        setError('Invalid email or password.');
      } else if (error.status === 403) {
        setError('Account is disabled. Please contact your administrator.');
      } else {
        setError(error.message || 'Login failed. Please try again.');
      }
      // Clear input fields on login failure
      setEmail('');
      setPassword('');
    }
  };


  return (
    <Box
      sx={{
        width: '100vw',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: { xs: 2, sm: 3, md: 5 },
        py: { xs: 3, md: 5 },
        background: 'linear-gradient(135deg, #f7f4ec 0%, #eef6ef 38%, #fffdf8 100%)',
      }}
    >
      <Paper
        elevation={10}
        sx={{
          width: '100%',
          maxWidth: 1180,
          overflow: 'hidden',
          borderRadius: 6,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' },
          maxHeight: { md: 'calc(100vh - 48px)' },
          boxShadow: '0 24px 70px rgba(31, 31, 31, 0.14)',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            px: { xs: 3, sm: 5, md: 7 },
            py: { xs: 4, sm: 5, md: 5 },
            color: '#fcfaf4',
            background: 'linear-gradient(155deg, #17362d 0%, #1f4f40 44%, #2f745e 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: { xs: 4, md: 3 },
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at top right, rgba(255,255,255,0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(236, 184, 82, 0.18), transparent 24%)',
              pointerEvents: 'none',
            }}
          />

          <Stack spacing={{ xs: 3, md: 2.5 }} sx={{ position: 'relative', zIndex: 1 }}>
            <Chip
              label="PrepSheet"
              sx={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.14)',
                color: '#fcfaf4',
                fontWeight: 700,
                letterSpacing: 0.8,
                borderRadius: 999,
              }}
            />

            <Box
              sx={{
                width: { xs: 120, md: 130 },
                height: { xs: 120, md: 130 },
                borderRadius: 4,
                backgroundColor: 'rgba(255,255,255,0.96)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 18px 30px rgba(8, 28, 23, 0.2)',
                p: 1.25,
              }}
            >
              <Box
                component="img"
                src={PrepSheetLogo}
                alt="PrepSheet Logo"
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            </Box>

            <Stack spacing={2}>
              <Box sx={{ maxWidth: 520 }}>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: '"Avenir Next", "Trebuchet MS", sans-serif',
                    fontSize: { xs: '2.4rem', sm: '3rem', md: '3.8rem' },
                    lineHeight: 0.96,
                    fontWeight: 700,
                    letterSpacing: '-0.04em',
                  }}
                >
                  PrepSheet
                </Typography>
                <Typography
                  component="p"
                  sx={{
                    mt: 1.25,
                    fontSize: { xs: '1.2rem', sm: '1.35rem', md: '1.55rem' },
                    lineHeight: 1.2,
                    fontWeight: 600,
                    color: 'rgba(252, 250, 244, 0.9)',
                    maxWidth: 430,
                  }}
                >
                  The hub for restaurant sales management.
                </Typography>
              </Box>

              <Typography
                sx={{
                  maxWidth: 520,
                  color: 'rgba(252, 250, 244, 0.82)',
                  fontSize: { xs: '1rem', md: '1.02rem' },
                  lineHeight: 1.6,
                }}
              >
                Track branch performance, manage daily sales entries, monitor restaurant activity, and generate monthly reports from one focused workspace.
              </Typography>
            </Stack>
          </Stack>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.25}
            sx={{ position: 'relative', zIndex: 1 }}
          >
            {['Sales visibility', 'Restaurant reporting', 'Branch-ready workflows'].map((item) => (
              <Box
                key={item}
                sx={{
                  px: 1.75,
                  py: 1,
                  borderRadius: 3,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Typography sx={{ color: '#fcfaf4', fontWeight: 600, fontSize: '0.95rem' }}>
                  {item}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          noValidate
          sx={{
            backgroundColor: '#fffdf8',
            px: { xs: 3, sm: 5, md: 6 },
            py: { xs: 4, sm: 5, md: 4.5 },
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Stack spacing={{ xs: 3, md: 2.25 }} sx={{ width: '100%', maxWidth: 420, mx: 'auto' }}>
            <Box>
              <Typography
                variant="overline"
                sx={{
                  color: '#4ea674',
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                }}
              >
                Welcome Back
              </Typography>
              <Typography
                variant="h3"
                component="h2"
                sx={{
                  mt: 0.5,
                  fontSize: { xs: '2rem', sm: '2.4rem', md: '2.2rem' },
                  lineHeight: 1,
                  fontWeight: 700,
                }}
              >
                PrepSheet Login
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1.25, lineHeight: 1.6 }}>
                Enter your credentials to access the sales dashboard and keep every restaurant branch in sync.
              </Typography>
            </Box>

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            <TextField
              label="Email or Username"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              autoComplete="username"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: '#ffffff',
                },
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              autoComplete="current-password"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  backgroundColor: '#ffffff',
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      edge="end"
                      tabIndex={-1}
                      aria-label="toggle password visibility"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                py: 1.4,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2a6d57 0%, #4ea674 100%)',
                boxShadow: '0 16px 28px rgba(78, 166, 116, 0.26)',
                fontWeight: 700,
                letterSpacing: '0.04em',
                '&:hover': {
                  background: 'linear-gradient(135deg, #215947 0%, #418e63 100%)',
                },
              }}
            >
              Sign in
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  )
}
