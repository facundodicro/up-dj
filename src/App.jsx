import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { PlayerProvider, usePlayer } from './context/PlayerContext'
import { LanguageProvider, useLang } from './context/LanguageContext'
import Header from './components/Header'
import AuthModal from './components/AuthModal'
import ProfileModal from './components/ProfileModal'
import PlayerBar from './components/PlayerBar'
import Toaster from './components/Toaster'
import SmokeBackground from './components/SmokeBackground'
import DonateButton from './components/DonateButton'
import Home from './pages/Home'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import LiveTagline from './components/LiveTagline'
import * as data from './lib/data'

function Shell() {
  const { user, loading } = useAuth()
  const { track } = usePlayer()
  const { t } = useLang()
  const [profile, setProfile] = useState(null)
  const [authModal, setAuthModal] = useState({ open: false, tab: 'login' })
  const [profileOpen, setProfileOpen] = useState(false)
  const [feedKey, setFeedKey] = useState(0)

  // Si se abrió el link de recupero de contraseña (hash con type=recovery),
  // abrir el modal en modo "nueva contraseña".
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('type=recovery')) {
      setAuthModal({ open: true, tab: 'recovery' })
    }
  }, [])

  useEffect(() => {
    if (!user) {
      setProfile(null)
      return
    }
    let alive = true
    data
      .getProfile(user.id)
      .then((p) => {
        if (alive) setProfile(p)
      })
      .catch(() => {
        if (alive) setProfile(null)
      })
    return () => {
      alive = false
    }
  }, [user])

  const openAuth = useCallback((tab = 'login') => setAuthModal({ open: true, tab }), [])
  const openProfile = useCallback(() => setProfileOpen(true), [])
  const refreshFeed = useCallback(() => setFeedKey((k) => k + 1), [])
  const scrollTop = useCallback(() => window.scrollTo({ top: 0, behavior: 'smooth' }), [])

  return (
    <div className="min-h-screen">
      {/* Humo ambiente general, muy tenue */}
      <div className="fixed inset-0 z-0">
        <SmokeBackground density="ambient" />
      </div>

      <div className="relative z-10">
        <Header
          user={user}
          profile={profile}
          onAuthClick={openAuth}
          onProfileClick={openProfile}
          onLogoClick={scrollTop}
        />

        {!loading && (
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  user={user}
                  feedKey={feedKey}
                  onAuthClick={openAuth}
                  onProfileClick={openProfile}
                />
              }
            />
            <Route path="/privacidad" element={<Privacy />} />
            <Route path="/terminos" element={<Terms />} />
            <Route
              path="*"
              element={
                <Home
                  user={user}
                  feedKey={feedKey}
                  onAuthClick={openAuth}
                  onProfileClick={openProfile}
                />
              }
            />
          </Routes>
        )}

        {/* Compensa la altura de la barra flotante */}
        {track && <div className="h-[104px]" aria-hidden="true" />}

        <footer className="border-t border-black/10 py-8 text-center">
          <p className="font-display text-2xl font-black tracking-tight">
            <span className="text-ink">up</span>
            <span className="text-[#00C75C]">!</span>
          </p>
          <LiveTagline />
          <p className="mt-3 text-xs">
            <Link to="/privacidad" className="text-muted underline-offset-4 hover:text-ink hover:underline">
              {t('footer.privacy')}
            </Link>
            <span className="mx-2 text-muted/50">·</span>
            <Link to="/terminos" className="text-muted underline-offset-4 hover:text-ink hover:underline">
              {t('footer.terms')}
            </Link>
          </p>
          <div className="mt-4">
            <DonateButton />
          </div>
          <p className="mt-4 text-[11px] font-medium text-muted/70">Hecha por Facundo Dicroce</p>
        </footer>
      </div>

      <PlayerBar />
      <Toaster />

      <AuthModal
        open={authModal.open}
        initialTab={authModal.tab}
        onClose={() => setAuthModal((s) => ({ ...s, open: false }))}
      />

      {user && (
        <ProfileModal
          open={profileOpen}
          user={user}
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSaved={(p) => setProfile(p)}
          onEventsChanged={refreshFeed}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <PlayerProvider>
          <BrowserRouter>
            <Shell />
          </BrowserRouter>
        </PlayerProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}
