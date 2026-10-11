import { useEffect, useRef, useState } from 'react'
import { User, UserPlus, LogIn, Globe, Check } from 'lucide-react'
import InstallButton from './InstallButton'
import { useLang } from '../context/LanguageContext'
import { SUPPORTED_LANGS } from '../lib/i18n'

const LANG_LABELS = { es: 'Español', en: 'English' }

/**
 * Header fijo: flechita de instalación a la izquierda, logo "up!" neón
 * verde centrado, y a la derecha donar + idioma + cuenta.
 */
export default function Header({ user, profile, onAuthClick, onProfileClick, onLogoClick }) {
  const { t, lang, setLang } = useLang()
  const [menuOpen, setMenuOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const menuRef = useRef(null)
  const langRef = useRef(null)

  useEffect(() => {
    if (!menuOpen && !langOpen) return
    const onDoc = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [menuOpen, langOpen])

  const initial = (profile?.username || user?.email || '?').trim().charAt(0).toUpperCase()

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-black/10 bg-night/85 backdrop-blur-md">
      <div className="relative mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center">
          <InstallButton />
        </div>

        <button
          onClick={onLogoClick}
          aria-label={t('header.home')}
          className="absolute left-1/2 -translate-x-1/2 font-display text-[34px] font-black leading-none tracking-tight text-ink transition-transform duration-200 hover:scale-105"
        >
          up<span className="text-[#00E065]">!</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setLangOpen((v) => !v)}
              aria-label={t('header.language')}
              aria-expanded={langOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-night-card text-muted transition hover:border-up/70 hover:text-ink"
            >
              <Globe size={18} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-black/10 bg-night-card py-1.5 shadow-2xl shadow-black/60">
                {SUPPORTED_LANGS.map((l) => (
                  <button
                    key={l}
                    onClick={() => {
                      setLang(l)
                      setLangOpen(false)
                    }}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm font-bold text-ink transition hover:bg-black/5"
                  >
                    {LANG_LABELS[l]}
                    {lang === l && <Check size={16} className="text-[#00e065]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            {user ? (
              <button
                onClick={onProfileClick}
                aria-label={t('header.openProfile')}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-night-card transition hover:border-up/70 hover:shadow-[0_0_16px_rgba(139,92,246,0.35)]"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-display text-lg font-extrabold text-up-light">
                    {initial}
                  </span>
                )}
              </button>
            ) : (
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label={t('header.account')}
                aria-expanded={menuOpen}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-night-card text-muted transition hover:border-up/70 hover:text-ink"
              >
                <User size={20} />
              </button>
            )}

            {menuOpen && !user && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-black/10 bg-night-card py-1.5 shadow-2xl shadow-black/60">
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onAuthClick('register')
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-ink transition hover:bg-black/5"
                >
                  <UserPlus size={17} className="text-up-light" />
                  {t('header.createProfile')}
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    onAuthClick('login')
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-bold text-ink transition hover:bg-black/5"
                >
                  <LogIn size={17} className="text-up-light" />
                  {t('header.login')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
