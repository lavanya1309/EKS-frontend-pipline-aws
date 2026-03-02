import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
import api from '../services/api'

vi.mock('../services/api')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => vi.fn() }
})

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders email and password fields', () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><Login /></MemoryRouter>)
    await user.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument()
    expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    expect(api.login).not.toHaveBeenCalled()
  })

  it('shows error for invalid email', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    const emailInput = screen.getByPlaceholderText(/enter your email/i)
    const passwordInput = screen.getByPlaceholderText(/enter your password/i)
    fireEvent.change(emailInput, { target: { name: 'email', value: 'bad' } })
    fireEvent.change(passwordInput, { target: { name: 'password', value: 'password1' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/email is invalid/i)).toBeInTheDocument()
    expect(api.login).not.toHaveBeenCalled()
  })

  it('shows error for short password', async () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { name: 'email', value: 'a@b.com' } })
    fireEvent.change(screen.getByPlaceholderText(/enter your password/i), { target: { name: 'password', value: '12345' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(await screen.findByText(/at least 6 characters/i)).toBeInTheDocument()
    expect(api.login).not.toHaveBeenCalled()
  })
})
