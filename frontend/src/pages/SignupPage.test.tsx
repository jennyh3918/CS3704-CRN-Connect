import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import SignupPage from './SignupPage'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ session: null, user: null, loading: false, signOut: vi.fn() }),
}))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}))

import { supabase } from '../lib/supabase'
const mockSignUp = vi.mocked(supabase.auth.signUp)

const renderSignup = () =>
  render(<MemoryRouter><SignupPage /></MemoryRouter>)

describe('SignupPage', () => {
  beforeEach(() => vi.clearAllMocks())

  test('renders email and password fields', () => {
    renderSignup()
    expect(screen.getByPlaceholderText('name@university.edu')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  test('renders the Create account button', () => {
    renderSignup()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
  })

  test('shows error for non-@vt.edu email', async () => {
    renderSignup()

    fireEvent.change(screen.getByPlaceholderText('name@university.edu'), {
      target: { value: 'test@gmail.com' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(
        screen.getByText('A valid @vt.edu email address is required to sign up.')
      ).toBeInTheDocument()
    )
    expect(mockSignUp).not.toHaveBeenCalled()
  })

  test('calls signUp with valid @vt.edu email', async () => {
    mockSignUp.mockResolvedValue({ error: null, data: { user: null, session: null } })
    window.alert = vi.fn()
    renderSignup()

    fireEvent.change(screen.getByPlaceholderText('name@university.edu'), {
      target: { value: 'hokie@vt.edu' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'hokie@vt.edu',
        password: 'password123',
      })
    )
  })

  test('shows error message when Supabase signup fails', async () => {
    mockSignUp.mockResolvedValue({ error: { message: 'Email already registered' } as any, data: { user: null, session: null } })
    renderSignup()

    fireEvent.change(screen.getByPlaceholderText('name@university.edu'), {
      target: { value: 'hokie@vt.edu' },
    })
    fireEvent.change(screen.getByPlaceholderText('••••••••'), {
      target: { value: 'password123' },
    })
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() =>
      expect(screen.getByText('Email already registered')).toBeInTheDocument()
    )
  })

  test('renders link back to login page', () => {
    renderSignup()
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument()
  })
})