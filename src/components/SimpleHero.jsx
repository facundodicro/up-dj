/**
 * Hero simple en blanco: logo "up!" (negro + "!" verde) con latido suave
 * y destello de entrada chico. Compacto a propósito: no es el protagonista.
 */
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
      <div
        className="hero-breathe relative font-display font-black leading-none tracking-tight text-black"
        style={{ fontSize: 'clamp(76px, 17vw, 124px)' }}
        aria-label="up!"
      >
        up<span className="text-[#00E065]">!</span>
      </div>
      <p className="relative mx-auto mt-4 translate-x-[0.15em] font-mono text-lg font-medium tracking-[0.3em] text-black sm:text-2xl">
        [escena electrónica]
      </p>
    </section>
  )
}
