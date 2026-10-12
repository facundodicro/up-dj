import { useState } from 'react'
import { Play, Pause, Disc3, MessageCircle, Heart } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { useLang } from '../context/LanguageContext'
import { formatRelative, buildWaUrl } from '../lib/format'
import * as data from '../lib/data'

/** Tarjeta de un evento en el feed: foto, play, DJ, descripción, like y WhatsApp. */
export default function EventCard({ event, user, likeCount = 0, liked = false, onToggleLike, onAuthClick, followed = false, followerCount = 0, onToggleFollow }) {
  const { track, isPlaying, playTrack } = usePlayer()
  const { t, lang } = useLang()
  const [expanded, setExpanded] = useState(false)
  const [beating, setBeating] = useState(false)
  const [liking, setLiking] = useState(false)
  const [following, setFollowing] = useState(false)

  const isCurrent = track?.id === event.id
  const playing = isCurrent && isPlaying
  const dj = event.dj || { username: t('card.djFallback'), avatar_url: null, whatsapp: '' }
  const initial = (dj.username || 'D').trim().charAt(0).toUpperCase()

  const handlePlay = () => {
    playTrack({
      id: event.id,
      title: event.title,
      djName: dj.username,
      djAvatar: dj.avatar_url,
      audioUrl: event.audio_url,
    })
  }

  const waUrl = buildWaUrl(dj.whatsapp, t('card.waMessage'))

  const handleFollow = async () => {
    if (!user) {
      onAuthClick?.('login')
      return
    }
    if (following || !event.user_id || user.id === event.user_id) return
    setFollowing(true)
    try {
      await data.toggleFollow(user.id, event.user_id, followed)
      onToggleFollow?.(event.user_id, !followed)
    } catch {
      /* noop */
    } finally {
      setFollowing(false)
    }
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
      onToggleLike?.(event.id, !liked)
      if (!liked) setBeating(true)
    } catch {
      /* noop */
    } finally {
      setLiking(false)
    }
  }

  const longDesc = (event.description || '').length > 140
  const desc = expanded || !longDesc ? event.description : `${event.description.slice(0, 140)}…`

  return (
    <article className="overflow-hidden rounded-2xl border border-black/10 bg-night-card shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition duration-200 hover:border-black/15 hover:shadow-[0_8px_40px_rgba(139,92,246,0.12)]">
      <div className="relative aspect-[16/10] bg-night-alt">
        {event.photo_url ? (
          <img
            src={event.photo_url}
            alt={event.title}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#EDE9FE] via-[#F5F3FF] to-[#DBEAFE]">
            <Disc3 size={64} className="text-up/50" strokeWidth={1.4} />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <button
          onClick={handlePlay}
          aria-label={t(playing ? 'card.pauseTitle' : 'card.playTitle', { title: event.title })}
          className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[#00E065] text-night transition duration-200 hover:scale-110 ${
            playing
              ? 'shadow-[0_0_36px_rgba(0,224,101,0.75)]'
              : 'shadow-[0_0_26px_rgba(0,224,101,0.5)] hover:shadow-[0_0_36px_rgba(0,224,101,0.7)]'
          }`}
        >
          {playing ? (
            <Pause size={26} fill="currentColor" />
          ) : (
            <Play size={26} fill="currentColor" className="ml-1" />
          )}
        </button>
      </div>

      <div className="p-5">
        <h3 className="font-display text-lg font-extrabold leading-snug text-ink">
          {event.title}
        </h3>

        <div className="mt-2.5 flex items-center gap-2.5">
          {dj.avatar_url ? (
            <img
              src={dj.avatar_url}
              alt=""
              className="h-6 w-6 rounded-full border border-black/10 object-cover"
            />
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-up/20 font-display text-xs font-extrabold text-up-light">
              {initial}
            </span>
          )}
          <span className="text-sm font-bold text-[#1A1A1A]">{dj.username}</span>
          {followerCount > 0 && (
            <span className="text-xs font-semibold text-muted/60">
              · {followerCount} {t('profile.followers')}
            </span>
          )}
          {event.user_id && (!user || user.id !== event.user_id) && (
            <button
              onClick={handleFollow}
              className={`ml-auto rounded-full px-3.5 py-1.5 text-xs font-extrabold transition active:scale-95 ${
                followed
                  ? 'border border-[#00E065]/40 bg-[#00E065]/10 text-[#00a34c]'
                  : 'bg-ink text-white shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:opacity-90'
              }`}
            >
              {followed ? t('card.following') : t('card.follow')}
            </button>
          )}
        </div>

        {event.description && (
          <p className="mt-2 text-sm font-normal leading-[1.4] text-[#8A8A8A]">
            {desc}{' '}
            {longDesc && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="font-extrabold text-up-light transition hover:text-ink"
              >
                {expanded ? t('card.less') : t('card.more')}
              </button>
            )}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between border-t border-[#F0F0F0] pt-3">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold text-[#A0A0A0]">{formatRelative(event.created_at, t)}</span>
            <button
              onClick={handleLike}
              aria-label={t(liked ? 'card.unlike' : 'card.like')}
              aria-pressed={liked}
              title={t(liked ? 'card.unlike' : 'card.like')}
              className={`flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-extrabold transition ${
                liked ? 'text-[#00D26A]' : 'text-muted/50 hover:text-muted'
              }`}
            >
              <span
                className={beating ? 'animate-heartbeat inline-flex' : 'inline-flex'}
                onAnimationEnd={() => setBeating(false)}
              >
                <Heart
                  size={19}
                  fill={liked ? 'currentColor' : 'none'}
                  className={liked ? 'drop-shadow-[0_0_8px_rgba(0,210,106,0.55)]' : ''}
                />
              </span>
              {likeCount > 0 && <span className="tabular-nums">{likeCount}</span>}
            </button>
          </div>
          {waUrl ? (
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-[#00E065]/40 px-4 py-2 text-sm font-extrabold text-[#00E065] transition hover:bg-[#00E065]/10 hover:shadow-[0_0_18px_rgba(0,224,101,0.25)]"
            >
              <MessageCircle size={16} />
              {t('card.whatsapp')}
            </a>
          ) : (
            <span className="text-xs text-[#A0A0A0]">{t('card.noContact')}</span>
          )}
        </div>
      </div>
    </article>
  )
}
