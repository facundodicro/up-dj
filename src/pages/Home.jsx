import { useEffect, useMemo, useState } from 'react'
import { Disc3, Plus, Search, X } from 'lucide-react'
import DonateButton from '../components/DonateButton'
import SimpleHero from '../components/SimpleHero'
import EventCard from '../components/EventCard'
import DjProfileModal from '../components/DjProfileModal'
import SmokeBackground from '../components/SmokeBackground'
import TopDjs from '../components/TopDjs'
import Dock from '../components/Dock'
import ShowsSection from '../components/ShowsSection'
import BiosSection from '../components/BiosSection'
import { useLang } from '../context/LanguageContext'
import * as data from '../lib/data'
import { isDemoMode } from '../lib/data'

const FILTERS = [
  { id: 'all', label: 'home.filterAll' },
  { id: 'today', label: 'home.filterToday' },
  { id: 'week', label: 'home.filterWeek' },
  { id: 'liked', label: 'home.filterLiked' },
  { id: 'following', label: 'home.filterFollowing' },
]

/** Página principal: hero simple en blanco + feed de eventos. */
export default function Home({ user, feedKey, onAuthClick, onProfileClick }) {
  const { t } = useLang()
  const [section, setSection] = useState('musica')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likeCounts, setLikeCounts] = useState({})
  const [myLikes, setMyLikes] = useState(new Set())
  const [myFollows, setMyFollows] = useState(new Set())
  const [followerCounts, setFollowerCounts] = useState({})
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [topDjs, setTopDjs] = useState([])
  const [djModalUserId, setDjModalUserId] = useState(null)

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = q
      ? events.filter(
          (e) =>
            (e.title || '').toLowerCase().includes(q) ||
            (e.description || '').toLowerCase().includes(q) ||
            (e.dj?.username || '').toLowerCase().includes(q),
        )
      : [...events]
    const now = Date.now()
    if (filter === 'today') {
      list = list.filter((e) => now - new Date(e.created_at).getTime() < 86400000)
    } else if (filter === 'week') {
      list = list.filter((e) => now - new Date(e.created_at).getTime() < 7 * 86400000)
    } else if (filter === 'following') {
      list = user ? list.filter((e) => e.user_id && myFollows.has(e.user_id)) : []
    }
    if (filter === 'week' || filter === 'liked') {
      list.sort((a, b) => (likeCounts[b.id] || 0) - (likeCounts[a.id] || 0))
    } else {
      list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
    return list
  }, [events, query, filter, likeCounts, myFollows, user])

  const handleSection = (id) => {
    setSection(id)
    window.scrollTo({ top: 0 })
  }

  const handleFilter = (id) => {
    if (id === 'following' && !user) {
      onAuthClick('login')
      return
    }
    setFilter(id)
  }

  const filterEmptyKey =
    filter === 'today'
      ? 'home.emptyToday'
      : filter === 'week'
        ? 'home.emptyWeek'
        : filter === 'following'
          ? 'home.emptyFollowing'
          : null

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

  useEffect(() => {
    let alive = true
    if (!events.length) {
      setLikeCounts({})
      setMyLikes(new Set())
      return
    }
    data
      .getLikes(events.map((e) => e.id))
      .then(({ counts, mine }) => {
        if (alive) {
          setLikeCounts(counts)
          setMyLikes(mine)
        }
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [events, user?.id])

  const handleToggleLike = (eventId, nowLiked) => {
    setMyLikes((prev) => {
      const next = new Set(prev)
      if (nowLiked) next.add(eventId)
      else next.delete(eventId)
      return next
    })
    setLikeCounts((prev) => ({
      ...prev,
      [eventId]: Math.max(0, (prev[eventId] || 0) + (nowLiked ? 1 : -1)),
    }))
  }

  const handleToggleFollow = (djId, nowFollowing) => {
    setMyFollows((prev) => {
      const next = new Set(prev)
      if (nowFollowing) next.add(djId)
      else next.delete(djId)
      return next
    })
    setFollowerCounts((prev) => ({
      ...prev,
      [djId]: Math.max(0, (prev[djId] || 0) + (nowFollowing ? 1 : -1)),
    }))
  }

  useEffect(() => {
    let alive = true
    if (user?.id) {
      data
        .getMyFollows(user.id)
        .then((s) => {
          if (alive) setMyFollows(s)
        })
        .catch(() => {})
    } else {
      setMyFollows(new Set())
    }
    const djIds = [...new Set(events.map((e) => e.user_id).filter(Boolean))]
    if (!djIds.length) {
      setFollowerCounts({})
      return
    }
    data
      .getFollowerCounts(djIds)
      .then((counts) => {
        if (alive) setFollowerCounts(counts)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [events, user?.id])

  useEffect(() => {
    let alive = true
    data
      .getTopDjs(10)
      .then((d) => {
        if (alive) setTopDjs(d)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [feedKey])

  return (
    <>
      {section === 'musica' && (
        <>
      {/* Hero simple en blanco */}
      <SimpleHero
        user={user}
        onUploadClick={onProfileClick}
        onRegisterClick={() => onAuthClick('register')}
      />
      <main className="mx-auto max-w-5xl px-4 pb-44">
      {/* Feed */}
      <section className="mt-10" aria-label="Sets publicados">
        <h2 className="font-display text-xl font-black text-ink">{t('home.latest')}</h2>

        {!loading && !error && events.length > 0 && (
          <div className="relative mt-3">
            <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted/60" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('home.searchPh')}
              aria-label={t('home.searchLabel')}
              className="w-full rounded-full border border-clay bg-night-card py-2.5 pl-11 pr-11 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70 [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('home.clearSearch')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted/60 transition hover:text-ink"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {!loading && !error && events.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-x-7 gap-y-1 px-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => handleFilter(f.id)}
                className={`relative min-h-[44px] py-2 text-sm transition ${
                  filter === f.id
                    ? 'font-extrabold text-ink'
                    : 'font-semibold text-muted hover:text-ink'
                }`}
              >
                {t(f.label)}
                {filter === f.id && (
                  <span className="absolute -bottom-0.5 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-[#00E065]" />
                )}
              </button>
            ))}
          </div>
        )}

        {!loading && !error && filter === 'all' && !query.trim() && (
          <TopDjs djs={topDjs} onSelect={(name) => setQuery(name)} />
        )}

        {loading && (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-clay bg-night-card"
              >
                <div className="aspect-[16/10] bg-clay-soft" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-2/3 rounded bg-clay-soft" />
                  <div className="h-3 w-1/3 rounded bg-clay-soft" />
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
          <div className="relative mt-4 overflow-hidden rounded-3xl border border-clay bg-night-alt px-6 py-14 text-center">
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

        {!loading && !error && events.length > 0 && filteredEvents.length === 0 && (
          <p className="mt-4 rounded-2xl border border-dashed border-clay px-5 py-8 text-center text-sm text-muted">
            {filterEmptyKey && !query.trim() ? t(filterEmptyKey) : t('home.noResults')}
          </p>
        )}

        {!loading && !error && filteredEvents.length > 0 && (
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            {filteredEvents.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                user={user}
                likeCount={likeCounts[e.id] || 0}
                liked={myLikes.has(e.id)}
                onToggleLike={handleToggleLike}
                onAuthClick={onAuthClick}
                followed={e.user_id ? myFollows.has(e.user_id) : false}
                followerCount={e.user_id ? followerCounts[e.user_id] || 0 : 0}
                onToggleFollow={handleToggleFollow}
                onDjClick={setDjModalUserId}
              />
            ))}
          </div>
        )}

        {djModalUserId && (
          <DjProfileModal
            djUserId={djModalUserId}
            user={user}
            events={events}
            myLikes={myLikes}
            likeCounts={likeCounts}
            onToggleLike={handleToggleLike}
            onAuthClick={onAuthClick}
            followed={myFollows.has(djModalUserId)}
            followerCount={followerCounts[djModalUserId] || 0}
            onToggleFollow={handleToggleFollow}
            onClose={() => setDjModalUserId(null)}
          />
        )}
      </section>
      </main>
        </>
      )}
      {section === 'eventos' && (
        <ShowsSection
          user={user}
          feedKey={feedKey}
          onAuthClick={onAuthClick}
          onProfileClick={onProfileClick}
        />
      )}
      {section === 'bios' && <BiosSection />}
      <Dock section={section} onChange={handleSection} t={t} />
    </>
  )
}
