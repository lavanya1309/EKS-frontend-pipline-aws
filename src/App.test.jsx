import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './components/Login'
import Signup from './components/Signup'
import ErrorBoundary from './components/ErrorBoundary'

function renderAtRoute(route) {
  return render(
    <ErrorBoundary>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard/*" element={<Layout />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </MemoryRouter>
    </ErrorBoundary>
  )
}

describe('App', () => {
  it('redirects / to login', () => {
    renderAtRoute('/')
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('shows login at /login', () => {
    renderAtRoute('/login')
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
  })

  it('shows signup at /signup', () => {
    renderAtRoute('/signup')
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
  })
})
