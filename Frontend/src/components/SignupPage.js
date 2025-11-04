import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Link,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

const API_BASE = 'http://localhost:5000/api';

function SignupPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const validateForm = () => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/;

    if (!usernameRegex.test(username)) {
      showAlert(
        'Username can only contain letters, numbers, and underscores',
        'error'
      );
      return false;
    }

    if (username.length < 3 || username.length > 20) {
      showAlert('Username must be between 3 and 20 characters', 'error');
      return false;
    }

    if (password !== confirmPassword) {
      showAlert('Passwords do not match', 'error');
      return false;
    }

    if (password.length < 6) {
      showAlert('Password must be at least 6 characters long', 'error');
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    console.log('Signup:', { email, password });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'white',
        px: 2,
      }}
    >
      <Container maxWidth="xs">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Header Component */}
          <Header />

          {/* Signup Text */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 500,
              mb: 4,
              color: '#1a5f7a',
            }}
          >
            Signup
          </Typography>

          {/* Signup Form */}
          <Box
            component="form"
            onSubmit={handleSignup}
            sx={{ width: '100%', maxWidth: '400px' }}
          >
            <TextField
              fullWidth
              placeholder="Username"
              variant="standard"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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
              placeholder="Email Address"
              variant="standard"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              placeholder="Confirm Password"
              variant="standard"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? 'Creating Account...' : 'Sign Up'}
            </Button>

            <Typography variant="body2" align="center" sx={{ color: '#666' }}>
              Already have an Account?{' '}
              <Link
                component="button"
                type="button"
                onClick={() => navigate('/login')}
                sx={{
                  color: '#1976d2',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  fontWeight: 500,
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Login
              </Link>
            </Typography>
          </Box>
        </Box>
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

export default SignupPage;
