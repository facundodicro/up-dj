import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import Modal from './Modal'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../context/LanguageContext'
import { toast } from '../lib/toast'

/** Modal de autenticación con pestañas: crear perfil / iniciar sesión. */
export default function AuthModal({ open, initialTab = 'login', onClose }) {
  const { signUp, signIn } = useAuth()
  const { t } = useLang()
  const [tab, setTab] = useState(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Cuando se reabre con otra pestaña, sincronizar
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setTab(initialTab)
      setError('')
      setInfo('')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (tab === 'register') {
        const { needsConfirmation } = await signUp(email, password)
        if (needsConfirmation) {
          setInfo(t('auth.confirmEmail'))
          setTab('login')
        } else {
          toast(t('auth.welcome'), 'success')
          onClose()
        }
      } else {
        await signIn(email, password)
        toast(t('auth.welcomeBack'), 'success')
        onClose()
      }
    } catch (err) {
      setError(err?.message || t('auth.genericError'))
    } finally {
      setLoading(false)
    }
  }

  const tabBtn = (key, label) => (
    <button
      type="button"
      onClick={() => {
        setTab(key)
        setError('')
        setInfo('')
      }}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-extrabold transition ${
        tab === key ? 'bg-up text-white shadow-[0_0_18px_rgba(139,92,246,0.45)]' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  )

  return (
    <Modal open={open} onClose={onClose} label={t('auth.title')}>
      <div className="p-6 pt-8">
        <p className="logo-neon text-center font-display text-4xl font-black">up!</p>
        <p className="mt-2 text-center text-sm text-muted">
          {tab === 'register' ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
        </p>

        <div className="mt-5 flex gap-1 rounded-xl bg-white/5 p-1">
          {tabBtn('login', t('auth.loginTab'))}
          {tabBtn('register', t('auth.registerTab'))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
              {t('auth.email')}
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-white/10 bg-night px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]"
            />
          </div>
          <div>
            <label htmlFor="auth-pass" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
              {t('auth.password')}
            </label>
            <input
              id="auth-pass"
              type="password"
              required
              autoComplete={tab === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('auth.passwordHint')}
              className="w-full rounded-xl border border-white/10 bg-night px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]"
            />
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300">
              {error}
            </p>
          )}
          {info && (
            <p className="rounded-xl border border-neon/30 bg-neon/10 px-4 py-2.5 text-sm font-semibold text-neon-light">
              {info}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-up px-4 py-3 text-sm font-extrabold text-white transition hover:bg-up-dark disabled:opacity-60"
          >
            {loading && <Loader2 size={17} className="animate-spin" />}
            {tab === 'register' ? t('auth.submitRegister') : t('auth.submitLogin')}
          </button>
        </form>
      </div>
    </Modal>
  )
}
