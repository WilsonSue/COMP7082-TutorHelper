import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock child components to avoid complex rendering
jest.mock('./components/LoginPage', () => {
  return function MockLoginPage() {
    return <div data-testid="login-page">Login Page</div>;
  };
});

jest.mock('./components/SignupPage', () => {
  return function MockSignupPage() {
    return <div data-testid="signup-page">Signup Page</div>;
  };
});

jest.mock('./components/HomePage', () => {
  return function MockHomePage() {
    return <div data-testid="home-page">Home Page</div>;
  };
});

jest.mock('./components/SettingsPage', () => {
  return function MockSettingsPage() {
    return <div data-testid="settings-page">Settings Page</div>;
  };
});

jest.mock('./components/AIPromptPage', () => {
  return function MockAIPromptPage() {
    return <div data-testid="ai-prompt-page">AI Prompt Page</div>;
  };
});

describe('App Component', () => {
  test('renders without crashing', () => {
    render(<App />);
  });

  test('redirects root path to /login', () => {
    render(<App />);

    const loginPage = screen.getByTestId('login-page');
    expect(loginPage).toBeInTheDocument();
  });

  test('renders LoginPage on /login route', () => {
    render(<App />);

    const loginPage = screen.getByTestId('login-page');
    expect(loginPage).toBeInTheDocument();
  });
});
