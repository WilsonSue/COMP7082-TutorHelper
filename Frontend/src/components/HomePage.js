import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Button,
  Typography,
  Card,
  CardContent,
  Snackbar,
  Alert,
  AppBar,
  Toolbar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import LogoutIcon from '@mui/icons-material/Logout';

// Styled components for custom styling
const LearningOptionCard = styled(Card)(({ theme, active }) => ({
  cursor: 'pointer',
  border: active
    ? `2px solid ${theme.palette.primary.main}`
    : '2px solid #e0e0e0',
  backgroundColor: active ? '#f8fdff' : '#ffffff',
  transition: 'all 0.3s ease',
  marginBottom: theme.spacing(2),
  '&:hover': {
    borderColor: theme.palette.primary.main,
    backgroundColor: '#f0f8ff',
  },
}));

const CustomCheckbox = styled(Box)(({ checked }) => ({
  width: 20,
  height: 20,
  border: checked ? '2px solid #1a5f7a' : '2px solid #bdc3c7',
  backgroundColor: checked ? '#1a5f7a' : 'transparent',
  borderRadius: 4,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: 16,
  '& .checkmark': {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    display: checked ? 'block' : 'none',
  },
}));

function Home() {
  const [user, setUser] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({
    visual: true,
    adhd: true,
    'due-dates': true,
  });
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');

    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const showAlert = (message, severity) => {
    setAlert({ open: true, message, severity });
  };

  const handleCloseAlert = () => {
    setAlert({ ...alert, open: false });
  };

  const handleOptionToggle = (option) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option],
    }));
  };

  const handleConfirm = () => {
    const activeOptions = Object.keys(selectedOptions).filter(
      (option) => selectedOptions[option]
    );

    if (activeOptions.length > 0) {
      showAlert(
        `Learning preferences confirmed! Selected: ${activeOptions.join(', ')}`,
        'success'
      );
      // Here you would typically send this data to your backend
      // For now, we'll just show an alert
    } else {
      showAlert('Please select at least one learning option.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return null; // or a loading spinner
  }

  const learningOptions = [
    {
      key: 'visual',
      title: 'Visual Learner',
      description: 'For students who need images to study better.',
    },
    {
      key: 'adhd',
      title: 'ADHD Learning Strategies',
      description: 'For students who need ADHD learning strategies.',
    },
    {
      key: 'due-dates',
      title: 'Due Dates',
      description: 'An alarm or calendar to promote pressure induced learning.',
    },
  ];

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar
        position="static"
        sx={{
          bgcolor: 'white',
          color: '#333',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <SchoolIcon sx={{ fontSize: 32, color: '#1a5f7a', mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#1a5f7a', fontWeight: 600 }}>
              Tutor Bot
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body1" sx={{ color: '#333' }}>
              Welcome, {user.username}!
            </Typography>
            <Button
              variant="outlined"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                textTransform: 'none',
                borderColor: '#2c3e50',
                color: '#2c3e50',
                '&:hover': {
                  borderColor: '#1a252f',
                  backgroundColor: 'rgba(44, 62, 80, 0.04)',
                },
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#333',
              mb: 2,
            }}
          >
            Start Learning!
          </Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            Choose your preferred learning methods below
          </Typography>
        </Box>

        {/* Learning Options */}
        <Box sx={{ mb: 4 }}>
          {learningOptions.map((option) => (
            <LearningOptionCard
              key={option.key}
              active={selectedOptions[option.key]}
              onClick={() => handleOptionToggle(option.key)}
            >
              <CardContent
                sx={{ display: 'flex', alignItems: 'flex-start', p: 3 }}
              >
                <CustomCheckbox checked={selectedOptions[option.key]}>
                  <span className="checkmark">✓</span>
                </CustomCheckbox>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: '#333',
                      mb: 1,
                    }}
                  >
                    {option.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: '#666', lineHeight: 1.5 }}
                  >
                    {option.description}
                  </Typography>
                </Box>
              </CardContent>
            </LearningOptionCard>
          ))}
        </Box>

        {/* Confirm Button */}
        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            onClick={handleConfirm}
            sx={{
              bgcolor: '#2c3e50',
              color: 'white',
              py: 1.5,
              px: 4,
              textTransform: 'none',
              fontSize: '16px',
              fontWeight: 500,
              borderRadius: 1,
              '&:hover': {
                bgcolor: '#1a252f',
              },
            }}
          >
            Confirm
          </Button>
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

export default Home;
