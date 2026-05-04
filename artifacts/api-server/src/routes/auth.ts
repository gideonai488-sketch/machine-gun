import { Router } from 'express'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

export const authRouter = Router()

authRouter.get('/me', async (req, res) => {
  const auth = req.headers['authorization']
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' })
  }

  const token = auth.slice(7)

  if (isSupabaseConfigured()) {
    const { data: { user }, error } = await supabase!.auth.getUser(token)
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' })
    }
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: (user.user_metadata as { name?: string })?.name ?? null,
      },
    })
  }

  return res.status(401).json({ message: 'Auth not configured' })
})
