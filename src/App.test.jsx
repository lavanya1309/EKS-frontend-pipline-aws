import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

function renderWithRouter(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {ui}
    </MemoryRouter>
  )
}

describe('App', () => {
  it('redirects / to login', () => {
    renderWithRouter(<App />, { route: '/' })
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('shows login at /login', () => {
    renderWithRouter(<App />, { route: '/login' })
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('shows signup at /signup', () => {
    renderWithRouter(<App />, { route: '/signup' })
    expect(screen.getByRole('heading', { name: /create account|sign up/i })).toBeInTheDocument()
  })
})
