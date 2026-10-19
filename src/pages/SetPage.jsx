import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Play, Pause, Heart, MessageCircle, Disc3 } from 'lucide-react'
import InstagramIcon from '../components/InstagramIcon'
import { usePlayer } from '../context/PlayerContext'
import { useLang } from '../context/LanguageContext'
import { formatRelative, buildWaUrl, buildInstagramUrl } from '../lib/format'
import * as data from '../lib/data'
import ShareButton from '../components/ShareButton'

/**
 * Página pública de un set (/set/:id): portada, play, like, compartir,
 * WhatsApp al DJ y más sets del mismo DJ.
 */
export default function SetPage({ user, onAuthClick }) {
  const { id } = useParams()
  const { t } = useLang()
  const { track, isPlaying, playTrack } = usePlayer()
  const [event, setEvent] = useState(null)
  const [more, setMore] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [liking, setLiking] = useState(false)
  const [beating, setBeating] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setNotFound(false)
    ;(async () => {
      try {
        const e = await data.getEvent(id)
        if (!e) {
          if (alive) setNotFound(true)
          return
        }
        if (!alive) return
        setEvent(e)
        const [{ counts, mine }, others] = await Promise.all([
          data.getLikes([e.id]).catch(() => ({ counts: {}, mine: new Set() })),
          e.user_id
            ? data.listEventsByUser(e.user_id).catch(() => [])
            : Promise.resolve([]),
        ])
        if (!alive) return
        setLikeCount(counts[e.id] || 0)
        setLiked(mine.has(e.id))
        setMore(others.filter((o) => o.id !== e.id).slice(0, 5))
      } catch {
        if (alive) setNotFound(true)
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [id])

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="text-sm font-semibold text-muted">{t('profile.loading')}</p>
      </main>
    )
  }

  if (notFound || !event) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="text-5xl">🎧</p>
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">
          {t('setPage.notFound')}
        </h1>
        <Link to="/" className="mt-6 inline-block font-bold text-up-light hover:underline">
          Up!
        </Link>
      </main>
    )
  }

  const dj = event.dj || { username: t('card.djFallback'), avatar_url: null, whatsapp: '' }
  const initial = (dj.username || 'D').trim().charAt(0).toUpperCase()
  const playing = track?.id === event.id && isPlaying
  const waUrl = buildWaUrl(dj.whatsapp, t('card.waMessage'))
  const igUrl = buildInstagramUrl(dj.instagram)
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const setUrl = `${origin}/set/${event.id}`

  const handlePlay = () => {
    playTrack({
      id: event.id,
      title: event.title,
      djName: dj.username,
      djAvatar: dj.avatar_url,
      audioUrl: event.audio_url,
    })
  }

  const handleLike = async () => {
    if (!user) {
      onAuthClick?.('login')
      return
    }
    if (liking) return
    setLiking(true)
    try {
      await data.toggleLike(user.id, event.id, liked)
      setLiked(!liked)
      setLikeCount((c) => Math.max(0, c + (liked ? -1 : 1)))
      if (!liked) setBeating(true)
    } catch {
      /* noop */
    } finally {
      setLiking(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16 pt-8">
      <article className="overflow-hidden rounded-2xl border border-clay bg-night-card shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
        <div className="relative aspect-[16/10] bg-night-alt">
          {event.photo_url ? (
            <img
              src={event.photo_url}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EDE9FE] via-[#F5F3FF] to-[#DBEAFE]">
              <Disc3 size={80} className="text-up/50" strokeWidth={1.2} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <button
            onClick={handlePlay}
            aria-label={t(playing ? 'card.pauseTitle' : 'card.playTitle', { title: event.title })}
            className={`absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#00E065] text-night transition duration-200 hover:scale-110 ${
              playing
                ? 'shadow-[0_0_36px_rgba(0,224,101,0.75)]'
                : 'shadow-[0_0_26px_rgba(0,224,101,0.5)] hover:shadow-[0_0_36px_rgba(0,224,101,0.7)]'
            }`}
          >
            {playing ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" className="ml-1" />
            )}
          </button>
        </div>

        <div className="p-5 sm:p-6">
          <h1 className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-3xl">
            {event.title}
          </h1>

          <div className="mt-3 flex items-center gap-2.5">
            {dj.avatar_url ? (
              <img
                src={dj.avatar_url}
                alt=""
                className="h-8 w-8 rounded-full border border-clay object-cover"
              />
            ) : (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-up/20 font-display text-sm font-extrabold text-up-light">
                {initial}
              </span>
            )}
            {dj.username && event.user_id ? (
              <Link
                to={`/dj/${encodeURIComponent(dj.username)}`}
                className="min-h-[44px] text-left text-base font-bold text-[#1A1A1A] transition hover:text-up-light"
              >
                {dj.username}
              </Link>
            ) : (
              <span className="text-base font-bold text-[#1A1A1A]">{dj.username}</span>
            )}
            <span className="text-xs font-semibold text-[#767676]">
              · {formatRelative(event.created_at, t)}
            </span>
          </div>

          {event.description && (
            <p className="mt-3 whitespace-pre-line text-[15px] font-normal leading-[1.5] text-muted">
              {event.description}
            </p>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-[#E7DACA] pt-4">
            <div className="flex items-center gap-1">
              <button
                onClick={handleLike}
                aria-label={t(liked ? 'card.unlike' : 'card.like')}
                aria-pressed={liked}
                className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-extrabold transition ${
                  liked ? 'text-[#00884D]' : 'text-muted/50 hover:text-muted'
                }`}
              >
                <span
                  className={beating ? 'animate-heartbeat inline-flex' : 'inline-flex'}
                  onAnimationEnd={() => setBeating(false)}
                >
                  <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                </span>
                {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
              </button>
              <ShareButton
                title={event.title}
                text={t('share.setText', { title: event.title, dj: dj.username })}
                url={setUrl}
              />
            </div>
            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[44px] items-center gap-2 rounded-full border border-[#00E065]/40 px-4 py-2 text-sm font-extrabold text-[#00884D] transition hover:bg-[#00E065]/10"
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
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted">
            {t('djProfile.sets')}
          </h2>
          <ul className="mt-3 space-y-2">
            {more.map((e) => {
              const ePlaying = track?.id === e.id && isPlaying
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-3 rounded-xl border border-clay bg-white/70 p-3"
                >
                  <button
                    onClick={() =>
                      playTrack({
                        id: e.id,
                        title: e.title,
                        djName: dj.username,
                        djAvatar: dj.avatar_url,
                        audioUrl: e.audio_url,
                      })
                    }
                    aria-label={t(ePlaying ? 'card.pauseTitle' : 'card.playTitle', { title: e.title })}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00E065] text-night shadow-[0_0_18px_rgba(0,224,101,0.45)] transition hover:scale-105"
                  >
                    {ePlaying ? (
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
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </main>
  )
}
