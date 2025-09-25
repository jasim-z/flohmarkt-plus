import React from 'react'
import { render, screen } from '@testing-library/react'

jest.mock('@/contexts/UserContext', () => ({
  useUser: () => ({
    role: 'admin',
    isLoaded: true,
    isLoading: false,
    isLoggingOut: false,
    user: { _id: '1', email: 'a@b.c', role: 'admin' },
    checkUserRole: jest.fn(),
    setUserData: jest.fn(),
    refreshUser: jest.fn(),
    logout: jest.fn(),
  }),
}))

describe('Header', () => {
  it('renders role-based navigation links with locale prefix', () => {
    const Header = require('../layout/Header').default

    render(<Header />)

    // Admin links
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/en/dashboard')
    expect(screen.getByRole('link', { name: /users/i })).toHaveAttribute('href', '/en/users')
    expect(screen.getByRole('link', { name: /markets/i })).toHaveAttribute('href', '/en/markets')
  })
})


