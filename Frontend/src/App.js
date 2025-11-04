import './style.css';
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import AIPrompt from './components/AIPromptPage';
import Home from './components/HomePage';
import SettingsPage from './components/SettingsPage';

// Create a theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/ai-prompt" element={<AIPrompt />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
