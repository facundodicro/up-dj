import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

/**
 * Un solo <audio> global para toda la app. Al dar play a un set se abre la
 * barra flotante; si se elige otro set, la pista cambia. Sigue sonando
 * mientras se navega porque el contexto vive a nivel App.
 */
const PlayerContext = createContext(null)

export function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  const trackRef = useRef(null)
  const [track, setTrack] = useState(null) // { id, title, djName, djAvatar, audioUrl }
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const a = new Audio()
    a.preload = 'metadata'
    audioRef.current = a
    const onTime = () => setCurrentTime(a.currentTime)
    const onMeta = () => setDuration(Number.isFinite(a.duration) ? a.duration : 0)
    const onEnded = () => setIsPlaying(false)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnded)
    return () => {
      a.pause()
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnded)
      audioRef.current = null
    }
  }, [])

  /** Reproduce una pista; si es la actual, alterna play/pausa. */
  const playTrack = useCallback((t) => {
    const a = audioRef.current
    if (!a || !t?.audioUrl) return
    if (trackRef.current?.id === t.id) {
      if (a.paused) {
        a.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
      } else {
        a.pause()
        setIsPlaying(false)
      }
      return
    }
    trackRef.current = t
    setTrack(t)
    setCurrentTime(0)
    setDuration(0)
    a.src = t.audioUrl
    a.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [])

  const toggle = useCallback(() => {
    const a = audioRef.current
    if (!a || !trackRef.current) return
    if (a.paused) {
      a.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
    } else {
      a.pause()
      setIsPlaying(false)
    }
  }, [])

  const seek = useCallback((fraction) => {
    const a = audioRef.current
    if (!a || !Number.isFinite(a.duration) || a.duration <= 0) return
    const clamped = Math.min(Math.max(fraction, 0), 1)
    a.currentTime = clamped * a.duration
    setCurrentTime(a.currentTime)
  }, [])

  /** Detiene y oculta el reproductor. */
  const close = useCallback(() => {
    const a = audioRef.current
    if (a) {
      a.pause()
      a.removeAttribute('src')
      a.load()
    }
    trackRef.current = null
    setTrack(null)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
  }, [])

  return (
    <PlayerContext.Provider
      value={{ track, isPlaying, currentTime, duration, playTrack, toggle, seek, close }}
    >
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer() {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer debe usarse dentro de <PlayerProvider>')
  return ctx
}
