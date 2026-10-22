import { useEffect, useState } from 'react'
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
      <section className="mt-10" aria-label={t('shows.title')}>
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

        {!loading && !error && shows.length > 0 && (
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {shows.map((s) => (
              <ShowCard key={s.id} show={s} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
