import React, { useState, useEffect, useCallback } from 'react';
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
  Grid,
  Paper,
  Divider,
  Chip,
  CircularProgress,
  Fab,
  Tooltip,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SchoolIcon from '@mui/icons-material/School';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import ChatIcon from '@mui/icons-material/Chat';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

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

const ConversationCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  borderLeft: '4px solid #1a5f7a',
  '&:hover': {
    boxShadow: theme.shadows[4],
    transform: 'translateY(-2px)',
  },
}));

const FloatingChatButton = styled(Fab)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(3),
  right: theme.spacing(3),
  backgroundColor: '#1a5f7a',
  color: 'white',
  width: 64,
  height: 64,
  '&:hover': {
    backgroundColor: '#134557',
    transform: 'scale(1.1)',
  },
  transition: 'all 0.3s ease',
  boxShadow: '0 4px 12px rgba(26, 95, 122, 0.4)',
  zIndex: 1000,
}));

function Home() {
  const [user, setUser] = useState(null);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({
    visual: true,
    adhd: true,
    'due-dates': true,
  });
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';

  const fetchSessions = useCallback(
    async (userId) => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/api/sessions/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setSessions(data);
        } else {
          console.error('Failed to fetch sessions');
        }
      } catch (error) {
        console.error('Error fetching sessions:', error);
        showAlert('Failed to load conversation history', 'error');
      } finally {
        setLoading(false);
      }
    },
    [API_BASE]
  );

  useEffect(() => {
    const userData = localStorage.getItem('user');

    if (userData) {
      const userObj = JSON.parse(userData);
      setUser(userObj);

      // Load preferences and onboarding from backend
      (async () => {
        try {
          const res = await fetch(
            `${API_BASE}/api/user/${userObj.id}/preferences`
          );
          if (res.ok) {
            const data = await res.json();
            const prefs = {
              visual: !!data.visual,
              adhd: !!data.adhd,
              'due-dates': !!data.due_dates,
            };
            setSelectedOptions(prefs);
            setIsFirstTimeUser(!data.onboarding_complete);
          } else {
            setIsFirstTimeUser(true);
          }
        } catch (e) {
          setIsFirstTimeUser(true);
        }
      })();

      // Fetch user's sessions/conversations
      fetchSessions(userObj.id);
    } else {
      navigate('/login');
    }
  }, [navigate, API_BASE, fetchSessions]);

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
      // Save preferences to backend and mark onboarding complete
      const body = {
        visual: !!selectedOptions.visual,
        adhd: !!selectedOptions.adhd,
        due_dates: !!selectedOptions['due-dates'],
        onboarding_complete: true,
      };
      fetch(`${API_BASE}/api/user/${user.id}/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to save preferences');
          return res.json();
        })
        .then(() => {
          showAlert(
            `Learning preferences confirmed! Selected: ${activeOptions.join(
              ', '
            )}`,
            'success'
          );
          setIsFirstTimeUser(false);
        })
        .catch(() => {
          showAlert('Could not save preferences. Please try again.', 'error');
        });
    } else {
      showAlert('Please select at least one learning option.', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleViewConversation = async (sessionId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/sessions/${user.id}/${sessionId}`
      );
      if (response.ok) {
        const data = await response.json();
        // Navigate to AI prompt page with the conversation data
        navigate('/ai-prompt', {
          state: {
            topic: data.topic,
            messages: data.messages,
            sessionId: sessionId,
          },
        });
      } else {
        showAlert('Failed to load conversation', 'error');
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      showAlert('Failed to load conversation', 'error');
    }
  };

  const handleNewConversation = () => {
    navigate('/ai-prompt');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  // Show onboarding screen for first-time users
  if (isFirstTimeUser) {
    return (
      <Box sx={{ flexGrow: 1, minHeight: '100vh', bgcolor: 'white' }}>
        {/* Header */}
        <AppBar
          position="static"
          sx={{
            bgcolor: 'white',
            color: '#333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <Toolbar sx={{ justifyContent: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <SchoolIcon sx={{ fontSize: 32, color: '#1a5f7a', mr: 1 }} />
              <Typography
                variant="h6"
                sx={{ color: '#1a5f7a', fontWeight: 600 }}
              >
                Tutor Bot
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Onboarding Content */}
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
              Welcome, {user.username}!
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
              Let&apos;s personalize your learning experience
            </Typography>
            <Typography variant="body2" sx={{ color: '#999' }}>
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
              Get Started
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

  // Regular home page after onboarding
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
            <IconButton
              onClick={() => navigate('/settings')}
              sx={{
                color: '#2c3e50',
              }}
            >
              <SettingsIcon />
            </IconButton>
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

      {/* Main Dashboard Content */}
      <Container maxWidth="lg" sx={{ py: 4, pb: 10 }}>
        {/* Header Section */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 4,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600 }}>
            Your Dashboard
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleNewConversation}
            sx={{
              bgcolor: '#1a5f7a',
              color: 'white',
              textTransform: 'none',
              px: 3,
              py: 1,
              '&:hover': {
                bgcolor: '#134557',
              },
            }}
          >
            New Conversation
          </Button>
        </Box>

        {/* Conversations Section */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h5"
            sx={{
              mb: 2,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ChatIcon sx={{ mr: 1, color: '#1a5f7a' }} />
            Recent Conversations
          </Typography>
          <Divider sx={{ mb: 3 }} />

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : sessions.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#fafafa' }}>
              <ChatIcon sx={{ fontSize: 48, color: '#bbb', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
                No conversations yet
              </Typography>
              <Typography variant="body2" sx={{ color: '#999', mb: 3 }}>
                Start your first conversation with the AI tutor
              </Typography>
              <Button
                variant="contained"
                onClick={handleNewConversation}
                sx={{
                  bgcolor: '#1a5f7a',
                  color: 'white',
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: '#134557',
                  },
                }}
              >
                Start Learning
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2}>
              {sessions.map((session) => (
                <Grid item xs={12} md={6} key={session.id}>
                  <ConversationCard
                    elevation={2}
                    onClick={() => handleViewConversation(session.id)}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1,
                      }}
                    >
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: '#333', flex: 1 }}
                      >
                        {session.topic}
                      </Typography>
                      <Chip
                        label="Active"
                        size="small"
                        sx={{
                          bgcolor: '#e8f5e9',
                          color: '#2e7d32',
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: '#666',
                      }}
                    >
                      <AccessTimeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                      <Typography variant="caption">
                        {formatDate(session.date_created)}
                      </Typography>
                    </Box>
                  </ConversationCard>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        {/* Stats Section (Optional) */}
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{ color: '#1a5f7a', fontWeight: 600 }}
                >
                  {sessions.length}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Total Conversations
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{ color: '#1a5f7a', fontWeight: 600 }}
                >
                  {sessions.length > 0 ? sessions.length * 5 : 0}
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Questions Asked
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography
                  variant="h3"
                  sx={{ color: '#1a5f7a', fontWeight: 600 }}
                >
                  {sessions.length > 0 ? Math.floor(sessions.length * 2.5) : 0}h
                </Typography>
                <Typography variant="body2" sx={{ color: '#666' }}>
                  Learning Time
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Floating Chat Button */}
      <Tooltip title="Start a conversation" placement="left" arrow>
        <FloatingChatButton
          color="primary"
          aria-label="chat"
          onClick={handleNewConversation}
        >
          <ChatIcon sx={{ fontSize: 28 }} />
        </FloatingChatButton>
      </Tooltip>

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
