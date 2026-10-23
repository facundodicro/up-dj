import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Plus } from 'lucide-react'
import ShowCard from './ShowCard'
import { useLang } from '../context/LanguageContext'
import * as data from '../lib/data'

/** Sección EVENTOS: la agenda magazine de la escena (solo próximos, por fecha). */
export default function ShowsSection({ user, feedKey, onAuthClick, onProfileClick }) {
  const { t } = useLang()
  const [shows, setShows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [city, setCity] = useState(null)

  // Chips dinámicos: las ciudades salen de los eventos próximos cargados.
  const cities = useMemo(() => {
    const seen = []
    for (const s of shows) {
      const c = (s.city || '').trim()
      if (c && !seen.some((x) => x.toLowerCase() === c.toLowerCase())) seen.push(c)
    }
    return seen
  }, [shows])

  const activeCity = city && cities.some((c) => c.toLowerCase() === city.toLowerCase()) ? city : null
  const visible = activeCity
    ? shows.filter((s) => (s.city || '').trim().toLowerCase() === activeCity.toLowerCase())
    : shows

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError('')
    data
      .listShows()
      .then((list) => {
        if (alive) setShows(list)
      })
      .catch(() => {
        if (alive) setError(t('shows.loadError'))
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
    <main className="mx-auto max-w-5xl px-4 pb-44">
      <section className="mt-24" aria-label={t('shows.title')}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-3xl font-black tracking-tight text-ink">
              {t('shows.title')}
            </h2>
            <p className="mt-1 text-sm text-muted">{t('shows.sub')}</p>
          </div>
          <button
            type="button"
            onClick={() => (user ? onProfileClick() : onAuthClick('register'))}
            className="flex items-center gap-1.5 rounded-full border border-clay bg-night-card px-4 py-2.5 text-sm font-extrabold text-ink transition hover:border-ink/40"
          >
            <Plus size={16} />
            {t('shows.addYours')}
          </button>
        </div>

        {!loading && !error && cities.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1" role="group" aria-label={t('show.city')}>
            <button
              type="button"
              onClick={() => setCity(null)}
              className={`relative min-h-[44px] py-2 text-sm transition ${
                !activeCity ? 'font-extrabold text-ink' : 'font-semibold text-muted hover:text-ink'
              }`}
            >
              {t('shows.allCities')}
              {!activeCity && (
                <span className="absolute -bottom-0.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#00E065]" />
              )}
            </button>
            {cities.map((c) => {
              const isActive = activeCity && c.toLowerCase() === activeCity.toLowerCase()
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCity(c)}
                  className={`relative min-h-[44px] py-2 text-sm transition ${
                    isActive ? 'font-extrabold text-ink' : 'font-semibold text-muted hover:text-ink'
                  }`}
                >
                  {c}
                  {isActive && (
                    <span className="absolute -bottom-0.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#00E065]" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {loading && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-3xl border border-clay bg-night-card"
              >
                <div className="aspect-[4/5] bg-clay-soft" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-1/3 rounded bg-clay-soft" />
                  <div className="h-6 w-2/3 rounded bg-clay-soft" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && error && (
          <p className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-300">
            {error}
          </p>
        )}

        {!loading && !error && shows.length === 0 && (
          <div className="mt-6 rounded-3xl border border-dashed border-clay px-6 py-14 text-center">
            <CalendarDays size={38} className="mx-auto text-muted" strokeWidth={1.5} />
            <p className="mx-auto mt-4 max-w-sm text-sm text-muted">{t('shows.empty')}</p>
          </div>
        )}

        {!loading && !error && shows.length > 0 && visible.length === 0 && (
          <p className="mt-6 rounded-3xl border border-dashed border-clay px-6 py-10 text-center text-sm text-muted">
            {t('shows.noneInCity')}
          </p>
        )}

        {!loading && !error && visible.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {visible.map((s) => (
              <ShowCard key={s.id} show={s} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
