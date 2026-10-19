import DonateButton from './DonateButton'
import { useLang } from '../context/LanguageContext'

/**
 * Hero simple en blanco: logo "up!" (negro + "!" verde) con latido suave
 * y destello de entrada chico. Compacto a propósito: no es el protagonista.
 */
export default function SimpleHero({ user, onUploadClick, onRegisterClick }) {
  const { t } = useLang()
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
        style={{ fontSize: 'clamp(54px, 11vw, 88px)' }}
        aria-label="up!"
      >
        up<span className="text-[#00E065]">!</span>
      </div>
      <p className="relative mx-auto mt-3 max-w-md text-sm font-medium text-neutral-600 sm:text-base">
        {t('home.heroSub')}
      </p>
      <div className="relative mt-5 flex flex-row flex-wrap items-center justify-center gap-3">
        <button
          onClick={user ? onUploadClick : onRegisterClick}
          className="inline-flex items-center gap-2 rounded-full bg-[#00E065] px-7 py-3.5 text-base font-extrabold text-[#04120a] shadow-[0_0_24px_rgba(0,224,101,.45)] transition active:scale-95"
        >
          {user ? t('home.uploadSet') : t('home.createProfile')}
        </button>
        <DonateButton variant="light" />
      </div>
    </section>
  )
}
