import { useEffect, useRef, useState } from 'react'
import { useLang } from '../context/LanguageContext'
import { upHeroImg } from '../assets/upHero'

/**
 * Pantalla de bienvenida de Up! (pedido de Facundo, 2026-11-17).
 * Se muestra en cada apertura de la app, ~1,2 s, mientras la app carga:
 * fondo #FAFAF8 (el mismo del splash del sistema, transición sin corte),
 * la escultura "up!" y el saludo en el idioma elegido por el usuario
 * (clave i18n 'splash.welcome'). Se salta con un toque.
 * Es un overlay: las rutas montan debajo normalmente.
 */
export default function WelcomeSplash() {
  const { t } = useLang()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [gone, setGone] = useState(false)
  const timers = useRef([])

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    timers.current.push(setTimeout(() => setLeaving(true), 1250))
    timers.current.push(setTimeout(() => setGone(true), 1600))
    return () => {
      cancelAnimationFrame(raf)
      timers.current.forEach(clearTimeout)
    }
  }, [])

  const skip = () => {
    timers.current.forEach(clearTimeout)
    setLeaving(true)
    timers.current.push(setTimeout(() => setGone(true), 320))
  }

  if (gone) return null

  return (
    <div
      role="status"
      aria-label={t('splash.welcome')}
      onClick={skip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FAFAF8] transition-opacity duration-300 ${
        leaving ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`flex flex-col items-center transition-all duration-500 ${
          visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
        }`}
      >
        <img src={upHeroImg} alt="up!" className="w-36 select-none" draggable="false" />
        <p className="mt-5 font-display text-4xl font-black tracking-tight text-ink">
          {t('splash.welcome')}
        </p>
      </div>
    </div>
  )
}
