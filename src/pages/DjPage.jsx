import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, Pause, Heart, MessageCircle } from 'lucide-react'
import InstagramIcon from '../components/InstagramIcon'
import { usePlayer } from '../context/PlayerContext'
import { useLang } from '../context/LanguageContext'
import { formatRelative, buildWaUrl, buildInstagramUrl } from '../lib/format'
import * as data from '../lib/data'
import ShareButton from '../components/ShareButton'

/**
 * Página pública del DJ (/dj/:username): su "link en bio".
 * Avatar, bio, seguidores, WhatsApp, Seguir, compartir y lista de sets.
 */
export default function DjPage({ user, onAuthClick }) {
  const { username } = useParams()
  const { t } = useLang()
  const { track, isPlaying, playTrack } = usePlayer()
  const [profile, setProfile] = useState(null)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [myLikes, setMyLikes] = useState(new Set())
  const [likeCounts, setLikeCounts] = useState({})
  const [followed, setFollowed] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [following, setFollowing] = useState(false)
  const [likingId, setLikingId] = useState(null)
  const [beatingId, setBeatingId] = useState(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setNotFound(false)
    ;(async () => {
      try {
        const p = await data.getProfileByUsername(username)
        if (!p) {
          if (alive) setNotFound(true)
          return
        }
        const evts = await data.listEventsByUser(p.id)
        if (!alive) return
        setProfile(p)
        setEvents(evts)
        const [{ counts, mine }, countsMap, follows] = await Promise.all([
          data.getLikes(evts.map((e) => e.id)).catch(() => ({ counts: {}, mine: new Set() })),
          data.getFollowerCounts([p.id]).catch(() => ({})),
          user?.id ? data.getMyFollows(user.id).catch(() => new Set()) : Promise.resolve(new Set()),
        ])
        if (!alive) return
        setLikeCounts(counts)
        setMyLikes(mine)
        setFollowerCount(countsMap[p.id] || 0)
        setFollowed(follows.has(p.id))
      } catch {
        if (alive) setNotFound(true)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [username, user?.id])

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="text-sm font-semibold text-muted">{t('profile.loading')}</p>
      </main>
    )
  }

  if (notFound || !profile) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="text-5xl">🎧</p>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
          {t('djPage.notFound')}
        </h1>
        <Link to="/" className="mt-6 inline-block font-bold text-up-light hover:underline">
          Up!
        </Link>
      </main>
    )
  }

  const dj = profile
  const isOwn = !!user && user.id === dj.id
  const initial = (dj.username || 'D').trim().charAt(0).toUpperCase()
  const waUrl = buildWaUrl(dj.whatsapp, t('card.waMessage'))
  const igUrl = buildInstagramUrl(dj.instagram)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const profileUrl = `${origin}/dj/${encodeURIComponent(dj.username)}`

  const handleFollow = async () => {
    if (!user) {
      onAuthClick?.('login')
      return
    }
    if (following || isOwn) return
    setFollowing(true)
    try {
      await data.toggleFollow(user.id, dj.id, followed)
      setFollowed(!followed)
      setFollowerCount((c) => Math.max(0, c + (followed ? -1 : 1)))
    } catch {
      /* noop */
    } finally {
      setFollowing(false)
    }
  }

  const handleLike = async (eventId, isLiked) => {
    if (!user) {
      onAuthClick?.('login')
      return
    }
    if (likingId) return
    setLikingId(eventId)
    try {
      await data.toggleLike(user.id, eventId, isLiked)
      setMyLikes((prev) => {
        const next = new Set(prev)
        if (isLiked) next.delete(eventId)
        else next.add(eventId)
        return next
      })
      setLikeCounts((prev) => ({
        ...prev,
        [eventId]: Math.max(0, (prev[eventId] || 0) + (isLiked ? -1 : 1)),
      }))
      if (!isLiked) setBeatingId(eventId)
    } catch {
      /* noop */
    } finally {
      setLikingId(null)
    }
  }

  const handlePlay = (e) => {
    playTrack({
      id: e.id,
      title: e.title,
      djName: dj.username,
      djAvatar: dj.avatar_url,
      audioUrl: e.audio_url,
    })
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8">
      <div className="flex flex-col items-center text-center">
        {dj.avatar_url ? (
          <img
            src={dj.avatar_url}
            alt={dj.username}
            className="h-28 w-28 rounded-full border border-black/10 object-cover shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
          />
        ) : (
          <span className="flex h-28 w-28 items-center justify-center rounded-full bg-up/20 font-display text-5xl font-bold text-up-light">
            {initial}
          </span>
        )}
        <h1 className="mt-4 font-display text-3xl font-extrabold text-ink">{dj.username}</h1>
        {followerCount > 0 && (
          <p className="mt-1 text-sm font-semibold text-muted">
            {followerCount} {t('profile.followers')}
          </p>
        )}
        {dj.bio && (
          <p className="mt-3 max-w-md text-[15px] font-normal leading-relaxed text-[#6E6E78]">
            {dj.bio}
          </p>
        )}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          {waUrl && (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-[#00E065]/40 px-4 py-2 text-sm font-bold text-[#00884D] transition hover:bg-[#00E065]/10"
            >
              <MessageCircle size={16} />
              {t('card.whatsapp')}
            </a>
          )}
          {igUrl && (
            <a
              href={igUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#E1306C]/40 text-[#C13584] transition hover:bg-[#E1306C]/10"
              aria-label="Instagram"
              title="Instagram"
            >
              <InstagramIcon size={18} />
            </a>
          )}
          {!isOwn && (
            <button
              onClick={handleFollow}
              className={`relative min-h-[44px] rounded-full px-5 py-2 text-sm font-bold transition active:scale-95 ${
                followed
                  ? 'border border-[#00E065]/40 bg-[#00E065]/10 text-[#00884D]'
                  : 'bg-ink text-white shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:opacity-90'
              }`}
            >
              {followed ? t('card.following') : t('card.follow')}
            </button>
          )}
          <ShareButton
            title={dj.username}
            text={t('share.djText', { dj: dj.username })}
            url={profileUrl}
          />
        </div>
      </div>

      <h2 className="mt-10 text-xs font-bold uppercase tracking-widest text-muted">
        {t('djProfile.sets')}
      </h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t('djProfile.noSets')}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {events.map((e) => {
            const liked = myLikes.has(e.id)
            const count = likeCounts[e.id] || 0
            const playing = track?.id === e.id && isPlaying
            const setUrl = `${origin}/set/${e.id}`
            return (
              <li
                key={e.id}
                className="flex items-center gap-3 rounded-xl border border-black/10 bg-white/70 p-3"
              >
                <button
                  onClick={() => handlePlay(e)}
                  aria-label={t(playing ? 'card.pauseTitle' : 'card.playTitle', { title: e.title })}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00E065] text-night shadow-[0_0_18px_rgba(0,224,101,0.45)] transition hover:scale-105"
                >
                  {playing ? (
                    <Pause size={18} fill="currentColor" />
                  ) : (
                    <Play size={18} fill="currentColor" className="ml-0.5" />
                  )}
                </button>
                <Link to={`/set/${e.id}`} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-ink hover:text-up-light">
                    {e.title}
                  </p>
                  <p className="mt-0.5 text-xs font-normal text-[#767676]">
                    {formatRelative(e.created_at, t)}
                  </p>
                </Link>
                <button
                  onClick={() => handleLike(e.id, liked)}
                  aria-label={t(liked ? 'card.unlike' : 'card.like')}
                  aria-pressed={!!liked}
                  className={`flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-full px-2 text-sm font-bold transition ${
                    liked ? 'text-[#00884D]' : 'text-muted/50 hover:text-muted'
                  }`}
                >
                  <span
                    className={beatingId === e.id ? 'animate-heartbeat inline-flex' : 'inline-flex'}
                    onAnimationEnd={() => setBeatingId(null)}
                  >
                    <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                  </span>
                  {count > 0 && <span className="tabular-nums">{count}</span>}
                </button>
                <ShareButton
                  title={e.title}
                  text={t('share.setText', { title: e.title, dj: dj.username })}
                  url={setUrl}
                />
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
