import { useState } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import Modal from './Modal'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../context/LanguageContext'
import { toast } from '../lib/toast'

/** Logo G multicolor para el botón de Google. */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.5h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.3-2.1 3.8-5.2 3.8-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-3.7 2.9c2.1 4.1 6.1 6.7 10.5 6.7z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4L1.5 6.7C.5 8.5 0 10.2 0 12s.5 3.5 1.4 5.1l3.8-2.7z"
      />
      <path
        fill="#EA4335"
        d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.6 1.4 6.8l3.7 2.9c1-2.9 3.7-5 6.9-5z"
      />
    </svg>
  )
}

/**
 * Modal de autenticación:
 * - pestañas crear perfil / iniciar sesión (+ botón de Google)
 * - vista "olvidé mi contraseña" (envía link de recupero)
 * - vista "recovery" (define la nueva contraseña tras abrir el link)
 */
export default function AuthModal({ open, initialTab = 'login', onClose }) {
  const { signUp, signIn, resetPassword, updatePassword, signInWithGoogle } = useAuth()
  const { t } = useLang()
  const [tab, setTab] = useState(initialTab)
  const [view, setView] = useState('main') // main | forgot
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  // Cuando se reabre, sincronizar
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setTab(initialTab)
      setView('main')
      setError('')
      setInfo('')
      setConfirm('')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      if (tab === 'recovery') {
        if (password !== confirm) throw new Error(t('auth.mismatch'))
        await updatePassword(password)
        window.history.replaceState(null, '', window.location.pathname + window.location.search)
        toast(t('auth.passwordUpdated'), 'success')
        onClose()
      } else if (view === 'forgot') {
        await resetPassword(email)
        setInfo(t('auth.resetSent'))
      } else if (tab === 'register') {
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

  const handleGoogle = async () => {
    setError('')
    setInfo('')
    try {
      await signInWithGoogle()
      // En modo nube redirige a Google; si vuelve sin error, el flujo sigue solo.
    } catch (err) {
      // En modo demo se informa que se activa con Supabase
      if (err?.message === t('auth.googleDemo')) setInfo(err.message)
      else setError(err?.message || t('auth.genericError'))
    }
  }

  const tabBtn = (key, label) => (
    <button
      type="button"
      onClick={() => {
        setTab(key)
        setView('main')
        setError('')
        setInfo('')
      }}
      className={`flex-1 rounded-lg px-3 py-2 text-sm font-extrabold transition ${
        tab === key ? 'bg-up text-ink shadow-[0_0_18px_rgba(139,92,246,0.45)]' : 'text-muted hover:text-ink'
      }`}
    >
      {label}
    </button>
  )

  const inputCls =
    'w-full rounded-xl border border-black/10 bg-night px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.2)]'
  const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wide text-muted'

  return (
    <Modal open={open} onClose={onClose} label={t('auth.title')}>
      <div className="p-6 pt-8">
        <p className="text-center font-display text-4xl font-black text-ink">
          up<span className="text-[#00E065]">!</span>
        </p>

        {tab === 'recovery' ? (
          <>
            <p className="mt-2 text-center text-sm text-muted">{t('auth.newPasswordSub')}</p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <div>
                <label htmlFor="auth-newpass" className={labelCls}>
                  {t('auth.newPassword')}
                </label>
                <input
                  id="auth-newpass"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordHint')}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="auth-confirmpass" className={labelCls}>
                  {t('auth.newPassword')}
                </label>
                <input
                  id="auth-confirmpass"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder={t('auth.passwordHint')}
                  className={inputCls}
                />
              </div>
              {error && (
                <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-up px-4 py-3 text-sm font-extrabold text-ink transition hover:bg-up-dark disabled:opacity-60"
              >
                {loading && <Loader2 size={17} className="animate-spin" />}
                {t('auth.savePassword')}
              </button>
            </form>
          </>
        ) : view === 'forgot' ? (
          <>
            <p className="mt-2 text-center text-sm text-muted">{t('auth.resetSubtitle')}</p>
            <form onSubmit={submit} className="mt-5 space-y-3">
              <div>
                <label htmlFor="auth-email" className={labelCls}>
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
                  className={inputCls}
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-up px-4 py-3 text-sm font-extrabold text-ink transition hover:bg-up-dark disabled:opacity-60"
              >
                {loading && <Loader2 size={17} className="animate-spin" />}
                {t('auth.sendLink')}
              </button>
              <button
                type="button"
                onClick={() => {
                  setView('main')
                  setError('')
                  setInfo('')
                }}
                className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-bold text-muted transition hover:text-ink"
              >
                <ArrowLeft size={15} />
                {t('auth.back')}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="mt-2 text-center text-sm text-muted">
              {tab === 'register' ? t('auth.registerSubtitle') : t('auth.loginSubtitle')}
            </p>

            <button
              type="button"
              onClick={handleGoogle}
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl border border-black/10 bg-black/[0.04] px-4 py-3 text-sm font-extrabold text-ink transition hover:border-black/20 hover:bg-black/[0.06]"
            >
              <GoogleIcon />
              {t('auth.google')}
            </button>

            <div className="my-4 flex items-center gap-3">
              <span className="h-px flex-1 bg-black/5" />
              <span className="text-xs font-bold uppercase tracking-wide text-muted">{t('auth.or')}</span>
              <span className="h-px flex-1 bg-black/5" />
            </div>

            <div className="flex gap-1 rounded-xl bg-black/5 p-1">
              {tabBtn('login', t('auth.loginTab'))}
              {tabBtn('register', t('auth.registerTab'))}
            </div>

            <form onSubmit={submit} className="mt-5 space-y-3">
              <div>
                <label htmlFor="auth-email" className={labelCls}>
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
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="auth-pass" className={labelCls}>
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
                  className={inputCls}
                />
              </div>

              {tab === 'login' && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setView('forgot')
                      setError('')
                      setInfo('')
                    }}
                    className="text-xs font-bold text-up-light transition hover:text-ink"
                  >
                    {t('auth.forgot')}
                  </button>
                </div>
              )}

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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-up px-4 py-3 text-sm font-extrabold text-ink transition hover:bg-up-dark disabled:opacity-60"
              >
                {loading && <Loader2 size={17} className="animate-spin" />}
                {tab === 'register' ? t('auth.submitRegister') : t('auth.submitLogin')}
              </button>
            </form>
          </>
        )}
      </div>
    </Modal>
  )
}
