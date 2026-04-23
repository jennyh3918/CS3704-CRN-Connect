import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'

// Mock all pages to keep tests simple
vi.mock('./pages/LoginPage', () => ({ default: () => <div>Login Page</div> }))
vi.mock('./pages/SignupPage', () => ({ default: () => <div>Signup Page</div> }))
vi.mock('./pages/DashboardPage', () => ({ default: () => <div>Dashboard Page</div> }))
vi.mock('./pages/ChatPage', () => ({ default: () => <div>Chat Page</div> }))

// Mock Supabase to prevent real network calls
vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  },
}))

describe('App routing', () => {
  test('renders without crashing', () => {
    render(<App />)
  })

  test('unauthenticated user sees login page at /login', async () => {
    window.history.pushState({}, '', '/login')
    render(<App />)
    expect(await screen.findByText('Login Page')).toBeInTheDocument()
  })
})