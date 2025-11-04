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
    console.log('Login:', { email, password });
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

          {/* Welcome Text */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              mb: 4,
              color: '#1a5f7a',
            }}
          >
            Welcome Back!
          </Typography>

          {/* Login Form */}
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{ width: '100%', maxWidth: '400px' }}
          >
            <TextField
              fullWidth
              placeholder="Email or Username"
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

            <Typography
              variant="body2"
              align="center"
              sx={{ color: '#1a5f7a' }}
            >
              Don't have an Account?{' '}
              <Link
                component="button"
                type="button"
                onClick={() => navigate('/signup')}
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
                Sign up
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

export default LoginPage;
