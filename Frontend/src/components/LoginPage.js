import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
  Alert,
  Snackbar,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';

const API_BASE = 'http://localhost:5000/api';

function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('Login successful! Redirecting...', 'success');
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => {
          navigate('/home'); // Update this to your home route
        }, 1500);
      } else {
        showAlert(data.error || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showAlert('An error occurred during login. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'white',
            borderRadius: 2,
          }}
        >
          {/* Logo and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#1a5f7a',
                mr: 1,
              }}
            >
              Tutor Bot
            </Typography>
            <SchoolIcon sx={{ fontSize: 32, color: '#1a5f7a' }} />
          </Box>

          {/* Welcome Text */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 4,
              color: '#333',
            }}
          >
            Welcome Back!
          </Typography>

          {/* Login Form */}
          <Box component="form" onSubmit={handleLogin} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              placeholder="Email or Username"
              variant="standard"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              sx={{
                mb: 3,
                '& .MuiInput-underline:before': {
                  borderBottomColor: '#e0e0e0',
                },
                '& .MuiInput-underline:hover:before': {
                  borderBottomColor: '#1a5f7a',
                },
                '& input': {
                  fontSize: '14px',
                  color: '#666',
                },
              }}
            />

            <TextField
              fullWidth
              type="password"
              placeholder="Password"
              variant="standard"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                mb: 4,
                '& .MuiInput-underline:before': {
                  borderBottomColor: '#e0e0e0',
                },
                '& .MuiInput-underline:hover:before': {
                  borderBottomColor: '#1a5f7a',
                },
                '& input': {
                  fontSize: '14px',
                  color: '#666',
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                bgcolor: '#2c3e50',
                color: 'white',
                py: 1.5,
                textTransform: 'none',
                fontSize: '16px',
                fontWeight: 500,
                borderRadius: 1,
                mb: 2,
                '&:hover': {
                  bgcolor: '#1a252f',
                },
                '&:disabled': {
                  bgcolor: '#bdc3c7',
                },
              }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>

            <Typography variant="body2" align="center" sx={{ color: '#666' }}>
              Don't have an Account?{' '}
              <Link
                component="button"
                type="button"
                onClick={() => navigate('/signup')}
                sx={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>

      {/* Alert Snackbar */}
      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseAlert}
          severity={alert.severity}
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default LoginPage;
