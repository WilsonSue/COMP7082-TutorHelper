import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Home from './HomePage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('HomePage Component', () => {
  const mockUser = { id: 1, username: 'testuser', email: 'test@example.com' };

  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();

    // Mock fetch for this test suite
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([]),
      })
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('redirects to login if no user', () => {
    localStorage.clear();

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});