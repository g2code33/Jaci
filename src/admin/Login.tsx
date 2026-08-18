import { useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '@/lib/api'
import { GlowingHeart } from '@/components/GlowingHeart'

interface LoginProps {
  onSuccess: () => void
}

export function Login({ onSuccess }: LoginProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading || !password) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.login(password)
      if (res.ok) onSuccess()
      else setError('Wrong password. Try again.')
    } catch (err) {
      const status = (err as { status?: number }).status
      setError(status === 401 ? 'Wrong password. Try again.' : 'Unable to sign in right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[100dvh] w-full items-center justify-center bg-night-900 px-6">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="glass w-full max-w-sm rounded-3xl p-8 text-center"
      >
        <div className="mb-6 flex justify-center">
          <GlowingHeart color="#ff4f9a" size={42} glow={0.7} pulse={false} />
        </div>
        <h1 className="font-display text-2xl font-light text-white/90">Private dashboard</h1>
        <p className="mt-1 font-body text-xs uppercase tracking-[0.25em] text-white/40">Admin only</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="input-luxe mt-6 text-center"
          aria-label="Admin password"
        />
        {error && (
          <p className="mt-3 font-body text-sm text-rose-soft" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn-solid mt-6 w-full" disabled={loading}>
          {loading ? '…' : 'Sign in'}
        </button>
      </motion.form>
    </div>
  )
}
