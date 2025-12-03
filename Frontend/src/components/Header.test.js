import React from 'react';
import { render, screen } from '@testing-library/react';
import Header from './Header';

describe('Header Component', () => {
  test('renders Tutor Bot text', () => {
    render(<Header />);
    const headerText = screen.getByText(/Tutor Bot/i);
    expect(headerText).toBeInTheDocument();
  });

  test('renders school icon', () => {
    render(<Header />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });
});
