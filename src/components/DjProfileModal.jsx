import { useEffect, useState } from 'react'
import { Play, Pause, Heart, MessageCircle } from 'lucide-react'
import InstagramIcon from './InstagramIcon'
import Modal from './Modal'
import ShareButton from './ShareButton'
import { usePlayer } from '../context/PlayerContext'
import { useLang } from '../context/LanguageContext'
import { formatRelative, buildWaUrl, buildInstagramUrl } from '../lib/format'
import * as data from '../lib/data'

/**
 * Modal de perfil DJ (solo lectura): foto grande, nombre, bio, WhatsApp,
 * botón Seguir y lista de todos sus sets con play + like.
 * Se abre tocando el nombre del DJ en una tarjeta del feed.
 */
export default function DjProfileModal({
  djUserId,
  user,
  events = [],
  myLikes,
  likeCounts,
  onToggleLike,
  onAuthClick,
  followed = false,
  followerCount = 0,
  onToggleFollow,
  onClose,
}) {
  const { t } = useLang()
  const { track, isPlaying, playTrack } = usePlayer()
  const [profile, setProfile] = useState(null)
  const [following, setFollowing] = useState(false)
  const [likingId, setLikingId] = useState(null)
  const [beatingId, setBeatingId] = useState(null)

  useEffect(() => {
    if (!djUserId) return
    let alive = true
    data
      .getProfile(djUserId)
      .then((p) => {
        if (alive && p) setProfile(p)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [djUserId])

  if (!djUserId) return null

  const sets = events.filter((e) => e.user_id === djUserId)
  const dj = profile || sets[0]?.dj || { username: t('card.djFallback'), avatar_url: null, whatsapp: '' }
  const isOwn = !!user && user.id === djUserId
  const initial = (dj.username || 'D').trim().charAt(0).toUpperCase()
  const waUrl = buildWaUrl(dj.whatsapp, t('card.waMessage'))
  const igUrl = buildInstagramUrl(dj.instagram)

  const handleFollow = async () => {
    if (!user) {
      onAuthClick?.('login')
      return
    }
    if (following || isOwn) return
    setFollowing(true)
    try {
      await data.toggleFollow(user.id, djUserId, followed)
      onToggleFollow?.(djUserId, !followed)
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
      onToggleLike?.(eventId, !isLiked)
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
    <Modal open={!!djUserId} onClose={onClose} maxWidth="max-w-lg" label={dj.username}>
      <div className="px-6 pb-8 pt-14 sm:pt-10">
        <div className="flex flex-col items-center text-center">
          {dj.avatar_url ? (
            <img
              src={dj.avatar_url}
              alt={dj.username}
              className="h-24 w-24 rounded-full border border-black/10 object-cover"
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-up/20 font-display text-4xl font-bold text-up-light">
              {initial}
            </span>
          )}
          <h2 className="mt-3 text-xl font-bold text-[#1A1A1A]">{dj.username}</h2>
          {followerCount > 0 && (
            <p className="mt-1 text-xs font-medium text-muted">
              {followerCount} {t('profile.followers')}
            </p>
          )}
          {dj.bio && (
            <p className="mt-2 max-w-sm text-sm font-normal leading-relaxed text-[#6E6E78]">
              {dj.bio}
            </p>
          )}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
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
                className="flex min-h-[44px] items-center gap-2 rounded-full border border-[#E1306C]/40 px-4 py-2 text-sm font-bold text-[#C13584] transition hover:bg-[#E1306C]/10"
              >
                <InstagramIcon size={16} />
                {t('card.instagram')}
              </a>
            )}
            {!isOwn && (
              <button
                onClick={handleFollow}
                className={`relative min-h-[44px] rounded-full px-4 py-2 text-sm font-bold transition active:scale-95 ${
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
              url={`${typeof window !== 'undefined' ? window.location.origin : ''}/dj/${encodeURIComponent(dj.username || '')}`}
            />
          </div>
        </div>

        <h3 className="mt-8 text-xs font-bold uppercase tracking-widest text-muted">
          {t('djProfile.sets')}
        </h3>
        {sets.length === 0 ? (
          <p className="mt-3 text-sm text-muted">{t('djProfile.noSets')}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sets.map((e) => {
              const liked = myLikes?.has(e.id)
              const count = likeCounts?.[e.id] || 0
              const playing = track?.id === e.id && isPlaying
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{e.title}</p>
                    <p className="mt-0.5 text-xs font-normal text-[#767676]">
                      {formatRelative(e.created_at, t)}
                    </p>
                  </div>
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
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </Modal>
  )
}
