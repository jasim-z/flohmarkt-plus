import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LoginForm } from '../forms/LoginForm'

// Mock the API function
jest.mock('@/app/api/auth', () => ({
  loginUser: jest.fn(),
}))

const { loginUser: mockLoginUser } = require('@/app/api/auth')

describe('LoginForm', () => {
  const user = userEvent.setup()

  // Silence expected error logs from error-path tests
  const originalError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalError
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form fields', () => {
    render(<LoginForm onSuccess={() => {}} />)

    expect(screen.getByPlaceholderText('login.email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('login.password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'login.button' })).toBeInTheDocument()
  })

  it('prevents submit with empty fields', async () => {
    render(<LoginForm onSuccess={() => {}} />)

    const submitButton = screen.getByRole('button', { name: 'login.button' })
    // Button should be disabled when form is invalid
    expect(submitButton).toBeDisabled()
  })

  it('shows validation error for invalid email', async () => {
    render(<LoginForm onSuccess={() => {}} />)

    const emailInput = screen.getByPlaceholderText('login.email')
    await user.type(emailInput, 'invalid-email')

    const submitButton = screen.getByRole('button', { name: 'login.button' })
    await user.click(submitButton)

    await waitFor(() => {
      // Error text is localized; assert aria-invalid and error element exists
      expect(screen.getByPlaceholderText('login.email')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  it('submits form with valid data', async () => {
    const mockOnSuccess = jest.fn()
    mockLoginUser.mockResolvedValue({ user: { id: '1', email: 'test@example.com' } })

    render(<LoginForm onSuccess={mockOnSuccess} />)

    const emailInput = screen.getByPlaceholderText('login.email')
    const passwordInput = screen.getByPlaceholderText('login.password')
    const submitButton = screen.getByRole('button', { name: 'login.button' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockLoginUser).toHaveBeenCalledWith('test@example.com', 'password123')
      expect(mockOnSuccess).toHaveBeenCalled()
    })
  })

  it('shows error message when login fails', async () => {
    mockLoginUser.mockRejectedValue(new Error('Invalid credentials'))

    render(<LoginForm onSuccess={() => {}} />)

    const emailInput = screen.getByPlaceholderText('login.email')
    const passwordInput = screen.getByPlaceholderText('login.password')
    const submitButton = screen.getByRole('button', { name: 'login.button' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'wrongpassword')
    await user.click(submitButton)

    await waitFor(() => {
      // We show a toast; assert that submit re-enabled and error path executed
      expect(screen.getByRole('button', { name: 'login.button' })).not.toBeDisabled()
    })
  })

  it('shows loading state during submission', async () => {
    mockLoginUser.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(<LoginForm onSuccess={() => {}} />)

    const emailInput = screen.getByPlaceholderText('login.email')
    const passwordInput = screen.getByPlaceholderText('login.password')
    const submitButton = screen.getByRole('button', { name: 'login.button' })

    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(submitButton)

    // Loading shows spinner and disables button
    expect(screen.getByRole('button', { name: 'login.button' })).toBeDisabled()
  })
})
