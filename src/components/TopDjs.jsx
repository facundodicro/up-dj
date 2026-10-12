import { useLang } from '../context/LanguageContext'

/**
 * Tira horizontal con los DJs más seguidos de la semana.
 * Tocar uno filtra el feed por su nombre.
 */
export default function TopDjs({ djs, onSelect }) {
  const { t } = useLang()
  if (!djs?.length) return null
  return (
    <section aria-label={t('home.topDjs')} className="mt-6">
      <h2 className="font-display text-base font-black text-ink">{t('home.topDjs')}</h2>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
        {djs.map((dj) => {
          const initial = (dj.username || 'D').trim().charAt(0).toUpperCase()
          return (
            <button
              key={dj.user_id}
              type="button"
              onClick={() => onSelect?.(dj.username)}
              className="flex w-24 shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-black/10 bg-night-card p-3 transition hover:border-[#00e065]/50 active:scale-95"
            >
              {dj.avatar_url ? (
                <img
                  src={dj.avatar_url}
                  alt=""
                  loading="lazy"
                  className="h-12 w-12 rounded-full border border-black/10 object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-up/20 font-display text-xl font-extrabold text-up-light">
                  {initial}
                </span>
              )}
              <span className="w-full truncate text-center text-xs font-extrabold text-ink">
                {dj.username}
              </span>
              <span className="text-[11px] font-semibold text-muted">
                {dj.followers} · {t('profile.followers')}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
