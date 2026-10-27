import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpenText, ChevronRight } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import * as data from '../lib/data'

/**
 * Sección BIOGRAFÍAS: la "enciclopedia de la escena". Si ya hay biografías
 * publicadas, muestra la más reciente destacada y debajo el archivo completo
 * (cada ficha es permanente, con su URL /bio/:slug). Si todavía no hay
 * ninguna, se mantiene el anuncio de lanzamiento ("Muy pronto").
 */
export default function BiosSection() {
  const { t } = useLang()
  const [bios, setBios] = useState(null)

  useEffect(() => {
    let alive = true
    data
      .listBios()
      .then((list) => {
        if (alive) setBios(list)
      })
      .catch(() => {
        if (alive) setBios([])
      })
    return () => {
      alive = false
    }
  }, [])

  const hasBios = Array.isArray(bios) && bios.length > 0
  const [featured, ...archive] = hasBios ? bios : []

  return (
    <main className="mx-auto max-w-5xl px-4 pb-44">
      <section className="mt-24" aria-label={t('dock.bios')}>
        <h2 className="font-display text-3xl font-black tracking-tight text-ink">{t('dock.bios')}</h2>

        {!hasBios ? (
          <div className="mt-6 rounded-3xl border border-dashed border-clay px-6 py-14 text-center">
            <BookOpenText size={38} className="mx-auto text-muted" strokeWidth={1.5} />
            <p className="mx-auto mt-4 max-w-md text-sm text-muted">{t('bios.teaser')}</p>
            <p className="mt-5 inline-block rounded-full border border-clay px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-ink">
              {t('bios.soon')}
            </p>
          </div>
        ) : (
          <>
            {/* La más reciente, destacada */}
            <p className="mt-6 text-xs font-bold uppercase tracking-widest text-muted">
              {t('bios.latest')} · {t('bios.pressKit')}
            </p>
            <Link
              to={`/bio/${encodeURIComponent(featured.slug)}`}
              className="group mt-3 block overflow-hidden rounded-3xl border border-clay bg-night-card shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition hover:border-clay-deep hover:shadow-[0_10px_44px_rgba(0,0,0,0.12)]"
            >
              <div className="relative aspect-[16/9] bg-night-alt sm:aspect-[21/9]">
                {featured.foto_url ? (
                  <img
                    src={featured.foto_url}
                    alt={featured.nombre}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#F3E7DE] via-[#FAF4EE] to-[#EAD9CB]">
                    <BookOpenText size={56} className="text-up/50" strokeWidth={1.4} />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end gap-x-3 gap-y-2 p-5 sm:p-6">
                  <h3 className="font-display text-3xl font-black leading-none tracking-tight text-white sm:text-4xl">
                    {featured.nombre}
                  </h3>
                  {featured.ciudad && (
                    <span className="rounded-full bg-[#00E065] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-night">
                      {featured.ciudad}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-6">
                <p className="line-clamp-2 min-w-0 text-sm leading-relaxed text-muted">
                  {featured.bio}
                </p>
                <span className="flex shrink-0 items-center gap-1 text-sm font-extrabold text-[#00884D]">
                  {t('bios.viewBio')}
                  <ChevronRight size={16} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>

            {/* El archivo: la enciclopedia completa */}
            {archive.length > 0 && (
              <>
                <h3 className="mt-10 text-xs font-bold uppercase tracking-widest text-muted">
                  {t('bios.allBios')}
                </h3>
                <ul className="mt-3 divide-y divide-clay overflow-hidden rounded-2xl border border-clay bg-night-card">
                  {archive.map((b) => (
                    <li key={b.id}>
                      <Link
                        to={`/bio/${encodeURIComponent(b.slug)}`}
                        className="flex min-h-[64px] items-center gap-3.5 px-4 py-2.5 transition hover:bg-clay-soft/60"
                      >
                        {b.foto_url ? (
                          <img
                            src={b.foto_url}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 shrink-0 rounded-xl border border-clay object-cover"
                          />
                        ) : (
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-up/15 font-display text-lg font-black text-up-light">
                            {(b.nombre || 'D').trim().charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-extrabold text-ink">
                            {b.nombre}
                          </span>
                          {b.ciudad && (
                            <span className="block text-xs font-semibold text-muted">{b.ciudad}</span>
                          )}
                        </span>
                        <ChevronRight size={18} className="shrink-0 text-muted/60" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        )}
      </section>
    </main>
  )
}
