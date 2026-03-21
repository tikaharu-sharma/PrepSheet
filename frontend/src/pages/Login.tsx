import React, { useState } from 'react'
import { Box, Paper, Stack, Typography, TextField, Button, Alert, InputAdornment, IconButton } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom';
import { setAuthSession } from '../lib/auth';
import { loginUser } from '../lib/api';


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
    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ width: '100vw', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.50' }}>
      <Paper elevation={6} sx={{ p: 4, width: '100%', maxWidth: 420, borderRadius: 3 }}>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h5" component="h1" align="center">
              PrepSheet Login
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center">
              Enter your credentials to access the sales dashboard
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
          />

          <TextField
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    edge="end"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.2 }}>
            Sign in
          </Button>
        </Stack>
      </Paper>
    </Box>
  )
}

