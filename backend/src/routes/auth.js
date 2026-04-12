import { Router } from 'express'
import crypto from 'crypto'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

export const authRouter = Router()

const memSessions = new Map()

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
}

async function upsertUser(userData) {
  if (isSupabaseConfigured()) {
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('github_id', userData.github_id)
      .single()

    if (existing) {
      await supabase.from('users').update({
        login: userData.login,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        github_token: userData.github_token,
      }).eq('id', existing.id)
      return { ...userData, id: existing.id }
    }

    const { data: inserted, error } = await supabase
      .from('users')
      .insert(userData)
      .select('id')
      .single()

    if (inserted) return { ...userData, id: inserted.id }
    if (error) console.error('Supabase upsert user error:', error)
  }

  return { ...userData, id: userData.github_id.toString() }
}

async function saveSession(token, user) {
  memSessions.set(token, user)

  if (isSupabaseConfigured() && user.id) {
    await supabase.from('sessions').insert({
      token,
      user_id: user.id,
    }).catch(() => {})
  }
}

async function getSessionUser(token) {
  const mem = memSessions.get(token)
  if (mem) return mem

  if (isSupabaseConfigured()) {
    const { data } = await supabase
      .from('sessions')
      .select('user_id, users(*)')
      .eq('token', token)
      .single()

    if (data?.users) {
      const user = {
        id: data.users.id,
        github_id: data.users.github_id,
        login: data.users.login,
        name: data.users.name,
        email: data.users.email,
        avatar: data.users.avatar,
      }
      memSessions.set(token, user)
      return user
    }
  }

  return null
}

authRouter.get('/github', (_req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID
  if (!clientId) {
    return res.status(500).json({ message: 'GitHub OAuth not configured. Add GITHUB_CLIENT_ID.' })
  }

  const state = crypto.randomBytes(16).toString('hex')
  const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:3001'}/api/auth/github/callback`

  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email&state=${state}`

  res.redirect(url)
})

authRouter.get('/github/callback', async (req, res) => {
  const { code } = req.query
  if (!code) {
    return res.status(400).json({ message: 'Missing code parameter' })
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error)

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const githubUser = await userRes.json()

    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const emails = await emailRes.json()
    const primaryEmail = Array.isArray(emails)
      ? (emails.find((e) => e.primary)?.email || emails[0]?.email)
      : null

    const user = await upsertUser({
      github_id: githubUser.id,
      login: githubUser.login,
      name: githubUser.name || githubUser.login,
      email: primaryEmail,
      avatar: githubUser.avatar_url,
      github_token: tokenData.access_token,
    })

    const token = generateToken()
    await saveSession(token, user)

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/dashboard?token=${token}`)
  } catch (err) {
    console.error('GitHub OAuth error:', err)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/?error=auth_failed`)
  }
})

authRouter.get('/me', async (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const user = await getSessionUser(auth.slice(7))
  if (!user) {
    return res.status(401).json({ message: 'Invalid or expired token' })
  }

  res.json({
    user: {
      id: user.id,
      login: user.login,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
    },
  })
})

authRouter.post('/logout', async (req, res) => {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    const token = auth.slice(7)
    memSessions.delete(token)
    if (isSupabaseConfigured()) {
      await supabase.from('sessions').delete().eq('token', token).catch(() => {})
    }
  }
  res.json({ success: true })
})

export { getSessionUser }
