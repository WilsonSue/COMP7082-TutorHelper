import React, { useState } from 'react';
import {
  Box,
  Container,
  TextField,
  Button,
  Typography,
  Link,
  Paper,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { useNavigate } from 'react-router-dom';

function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();
    console.log('Signup:', { email, password });
    // Add your signup API call here
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

          {/* Signup Text */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 4,
              color: '#333',
            }}
          >
            Signup
          </Typography>

          {/* Signup Form */}
          <Box component="form" onSubmit={handleSignup} sx={{ width: '100%' }}>
            <TextField
              fullWidth
              placeholder="Email Address"
              variant="standard"
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
              }}
            >
              Sign Up
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
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Login
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

export default SignupPage;
