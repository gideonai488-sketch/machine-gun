import { Router } from 'express'
import crypto from 'crypto'

export const authRouter = Router()

const sessions = new Map()

function generateToken() {
  return crypto.randomBytes(32).toString('hex')
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
  const { code, state } = req.query
  if (!code) {
    return res.status(400).json({ message: 'Missing code parameter' })
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    })

    const tokenData = await tokenRes.json()
    if (tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error)
    }

    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const githubUser = await userRes.json()

    const emailRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const emails = await emailRes.json()
    const primaryEmail = emails.find((e) => e.primary)?.email || emails[0]?.email || null

    const user = {
      id: githubUser.id,
      login: githubUser.login,
      name: githubUser.name || githubUser.login,
      email: primaryEmail,
      avatar: githubUser.avatar_url,
      githubToken: tokenData.access_token,
    }

    const token = generateToken()
    sessions.set(token, user)

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/dashboard?token=${token}`)
  } catch (err) {
    console.error('GitHub OAuth error:', err)
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    res.redirect(`${frontendUrl}/?error=auth_failed`)
  }
})

authRouter.get('/me', (req, res) => {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const token = auth.slice(7)
  const user = sessions.get(token)
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

authRouter.post('/logout', (req, res) => {
  const auth = req.headers.authorization
  if (auth?.startsWith('Bearer ')) {
    sessions.delete(auth.slice(7))
  }
  res.json({ success: true })
})

export function getSessionUser(token) {
  return sessions.get(token) || null
}
