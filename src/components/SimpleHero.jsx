/**
 * Hero simple en blanco: la escultura low-poly "up!" (papercraft, fondo blanco)
 * con latido suave y destello de entrada chico. La escultura ES el logo:
 * decisión de Facundo del 2026-10-21 (presencia tridimensional al entrar).
 */
import { upHeroImg } from '../assets/upHero'

export default function SimpleHero() {
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  return (
    <section className="relative overflow-hidden bg-white px-6 pb-10 pt-24 text-center">
      {!reducedMotion && (
        <div className="shine-burst shine-burst--sm" aria-hidden="true">
          <img src="/shine-burst.svg" alt="" className="h-full w-full" draggable="false" />
        </div>
      )}
      <div className="hero-breathe relative mx-auto" style={{ width: 'min(82vw, 470px)' }}>
        <img
          src={upHeroImg}
          alt="up!"
          className="block h-auto w-full select-none"
          draggable="false"
        />
      </div>
      <p className="relative mx-auto mt-4 translate-x-[0.15em] font-mono text-lg font-medium tracking-[0.3em] text-black sm:text-2xl">
        [escena electrónica]
      </p>
    </section>
  )
}
