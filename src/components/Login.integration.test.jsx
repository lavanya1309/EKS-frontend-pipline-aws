import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'
import api from '../services/api'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('../services/api')

describe('Login integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('valid credentials call api and navigate to dashboard', async () => {
    api.login.mockResolvedValueOnce({ success: true })
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText(/enter your email/i), 'user@test.com')
    await user.type(screen.getByPlaceholderText(/enter your password/i), 'password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(api.login).toHaveBeenCalledWith('user@test.com', 'password1')
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('api error shows message and does not navigate', async () => {
    api.login.mockRejectedValueOnce(new Error('Invalid credentials'))
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    )
    await user.type(screen.getByPlaceholderText(/enter your email/i), 'user@test.com')
    await user.type(screen.getByPlaceholderText(/enter your password/i), 'password1')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await screen.findByText(/invalid credentials/i)
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
