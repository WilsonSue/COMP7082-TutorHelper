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
  IconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

function SettingsPage() {
  const [user, setUser] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({
    visual: false,
    adhd: false,
    'due-dates': false,
  });
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

  useEffect(() => {
    const userData = localStorage.getItem('user');

    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);
      // Load saved preferences from backend
      (async () => {
        try {
          const res = await fetch(`${API_BASE}/api/user/${userObj.id}/preferences`);
          if (res.ok) {
            const data = await res.json();
            setSelectedOptions({
              visual: !!data.visual,
              adhd: !!data.adhd,
              'due-dates': !!data.due_dates,
            });
          }
        } catch (e) {
          // ignore, keep defaults
        }
      })();
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

  const handleSave = () => {
    const body = {
      visual: !!selectedOptions.visual,
      adhd: !!selectedOptions.adhd,
      due_dates: !!selectedOptions['due-dates'],
    };

    fetch(`${API_BASE}/api/user/${user.id}/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to save');
        return res.json();
      })
      .then(() => {
        showAlert('Settings saved successfully!', 'success');
      })
      .catch(() => {
        showAlert('Could not save settings. Please try again.', 'error');
      });
  };

  if (!user) {
    return null;
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
        <Toolbar>
          <IconButton
            edge="start"
            onClick={() => navigate('/home')}
            sx={{ mr: 2, color: '#2c3e50' }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <SchoolIcon sx={{ fontSize: 32, color: '#1a5f7a', mr: 1 }} />
            <Typography variant="h6" sx={{ color: '#1a5f7a', fontWeight: 600 }}>
              Tutor Bot - Settings
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              color: '#333',
              mb: 2,
            }}
          >
            Learning Preferences
          </Typography>
          <Typography variant="body1" sx={{ color: '#666' }}>
            Customize your learning experience by selecting your preferred
            methods
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

        {/* Save Button */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/home')}
            sx={{
              textTransform: 'none',
              borderColor: '#2c3e50',
              color: '#2c3e50',
              py: 1.5,
              px: 4,
              '&:hover': {
                borderColor: '#1a252f',
                backgroundColor: 'rgba(44, 62, 80, 0.04)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
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
            Save Changes
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

export default SettingsPage;