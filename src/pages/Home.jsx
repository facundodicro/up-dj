import { Suspense, lazy, useEffect, useState } from 'react'
import { Disc3, Plus } from 'lucide-react'
import DonateButton from '../components/DonateButton'
import EventCard from '../components/EventCard'
import SmokeBackground from '../components/SmokeBackground'
import { useLang } from '../context/LanguageContext'
import * as data from '../lib/data'
import { isDemoMode } from '../lib/data'

const ScrollWorldHero = lazy(() => import('../components/ScrollWorldHero'))

/** Héroe 3D mientras three.js se descarga. */
function HeroFallback() {
  return (
    <section className="relative overflow-hidden border-b border-black/10 bg-night-alt px-6 py-16 text-center">
      <p className="font-display text-5xl font-black text-ink">
        up<span className="text-[#00E065]">!</span>
      </p>
      <p className="mx-auto mt-3 max-w-md animate-pulse text-sm text-muted">Cargando mundo 3D…</p>
    </section>
  )
}

/** Página principal: hero nocturno + feed de eventos. */
export default function Home({ user, feedKey, onAuthClick, onProfileClick }) {
  const { t } = useLang()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    data
      .listEvents()
      .then((list) => {
        if (alive) setEvents(list)
      })
      .catch(() => {
        if (alive) setError(t('home.loadError'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedKey])

  return (
    <>
      {/* Héroe 3D: mundo neón navegable con scroll (carga diferida) */}
      <Suspense fallback={<HeroFallback />}>
        <ScrollWorldHero
          user={user}
          onUploadClick={onProfileClick}
          onRegisterClick={() => onAuthClick('register')}
        />
      </Suspense>
      <main className="mx-auto max-w-5xl px-4 pb-44">
      {/* Feed */}
      <section className="mt-10" aria-label="Sets publicados">
        <h2 className="font-display text-lg font-black text-ink">{t('home.latest')}</h2>

        {loading && (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-black/10 bg-night-card"
              >
                <div className="aspect-[16/10] bg-black/5" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-black/5" />
                  <div className="h-3 w-1/3 rounded bg-black/5" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && events.length === 0 && (
          <div className="relative mt-4 overflow-hidden rounded-3xl border border-black/10 bg-night-alt px-6 py-14 text-center">
            <SmokeBackground density="hero" />
            <div className="relative">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-up/25 to-neon/25 shadow-[0_0_40px_rgba(139,92,246,0.35)]">
                <Disc3 size={40} className="text-up-light" strokeWidth={1.6} />
              </span>
              <h3 className="mt-5 font-display text-xl font-black text-ink">
                {t('home.emptyTitle')}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted">{t('home.emptySub')}</p>
              <button
                onClick={() => (user ? onProfileClick() : onAuthClick('register'))}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-up px-6 py-3 text-sm font-extrabold text-ink shadow-[0_0_28px_rgba(139,92,246,0.5)] transition hover:bg-up-dark"
              >
                <Plus size={17} />
                {user ? t('home.publishFirst') : t('home.beFirst')}
              </button>
            </div>
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {events.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        )}
      </section>
      </main>
    </>
  )
}
