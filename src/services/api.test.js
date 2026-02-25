import { describe, it, expect, vi, beforeEach } from 'vitest'
import api from './api'

describe('api', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.stubGlobal('fetch', vi.fn())
  })

  it('getToken returns null when no token', () => {
    expect(api.getToken()).toBeNull()
  })

  it('isAuthenticated returns false when no token', () => {
    expect(api.isAuthenticated()).toBe(false)
  })

  it('getToken and isAuthenticated after set', () => {
    localStorage.setItem('token', 'abc')
    expect(api.getToken()).toBe('abc')
    expect(api.isAuthenticated()).toBe(true)
  })

  it('logout clears token and user', () => {
    localStorage.setItem('token', 'x')
    localStorage.setItem('user', '{}')
    api.logout()
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('request sends Authorization when token exists', async () => {
    localStorage.setItem('token', 'secret')
    fetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) })
    await api.request('/test')
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/test'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer secret' }),
      })
    )
  })

  it('login stores token and user on success', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: { token: 'jwt', user: { id: 1, email: 'a@b.com' } },
      }),
    })
    await api.login('a@b.com', 'pass')
    expect(localStorage.getItem('token')).toBe('jwt')
    expect(JSON.parse(localStorage.getItem('user'))).toEqual({ id: 1, email: 'a@b.com' })
  })
})
