import { useRef, useState } from 'react'
import { Play, Pause, X } from 'lucide-react'
import { usePlayer } from '../context/PlayerContext'
import { useLang } from '../context/LanguageContext'
import { formatTime } from '../lib/format'

/** Barra flotante de reproducción: fija abajo, con seek arrastrable y saltos ±15s. */
export default function PlayerBar() {
  const { track, isPlaying, currentTime, duration, toggle, seek, close } = usePlayer()
  const { t } = useLang()
  const barRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  if (!track) return null

  const fraction = duration > 0 ? Math.min(currentTime / duration, 1) : 0

  const seekFromClientX = (clientX) => {
    const el = barRef.current
    if (!el || duration <= 0) return
    const rect = el.getBoundingClientRect()
    const f = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1)
    seek(f)
  }

  const skip = (seconds) => {
    if (duration <= 0) return
    seek((currentTime + seconds) / duration)
  }

  const initial = (track.djName || 'D').trim().charAt(0).toUpperCase()

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-night-card/95 shadow-[0_-8px_40px_rgba(0,0,0,0.55)] backdrop-blur-md">
      {/* Progreso arrastrable */}
      <div
        ref={barRef}
        role="slider"
        aria-label={t('player.progress')}
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') seek(fraction + 0.02)
          if (e.key === 'ArrowLeft') seek(fraction - 0.02)
        }}
        onPointerDown={(e) => {
          setDragging(true)
          e.currentTarget.setPointerCapture?.(e.pointerId)
          seekFromClientX(e.clientX)
        }}
        onPointerMove={(e) => {
          if (dragging) seekFromClientX(e.clientX)
        }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        className="group h-2.5 cursor-pointer touch-none bg-black/5"
      >
        <div
          className={`h-full bg-gradient-to-r from-up to-neon shadow-[0_0_14px_rgba(139,92,246,0.8)] group-hover:brightness-125 ${
            dragging ? '' : 'transition-[width] duration-150'
          }`}
          style={{ width: `${fraction * 100}%` }}
        />
      </div>

      <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:gap-3">
        <button
          onClick={() => skip(-15)}
          aria-label={t('player.back15')}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold text-muted transition hover:bg-black/5 hover:text-ink"
        >
          −15s
        </button>

        <button
          onClick={toggle}
          aria-label={t(isPlaying ? 'player.pause' : 'player.play')}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#00E065] text-night shadow-[0_0_22px_rgba(0,224,101,0.55)] transition hover:scale-105 hover:shadow-[0_0_30px_rgba(0,224,101,0.75)]"
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        <button
          onClick={() => skip(15)}
          aria-label={t('player.fwd15')}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full px-2 text-xs font-bold text-muted transition hover:bg-black/5 hover:text-ink"
        >
          +15s
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink">{track.title}</p>
          <p className="truncate text-xs font-medium text-muted">{track.djName}</p>
        </div>

        {track.djAvatar ? (
          <img
            src={track.djAvatar}
            alt=""
            className="hidden h-9 w-9 shrink-0 rounded-full border border-black/10 object-cover sm:block"
          />
        ) : (
          <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-up/20 font-display text-sm font-bold text-up-light sm:flex">
            {initial}
          </span>
        )}

        <span className="shrink-0 text-xs font-semibold tabular-nums text-muted">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <button
          onClick={close}
          aria-label={t('player.close')}
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full p-2 text-muted transition hover:bg-black/5 hover:text-ink"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  )
}
