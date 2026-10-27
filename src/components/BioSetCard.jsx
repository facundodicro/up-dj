import { Link } from 'react-router-dom'
import { BookOpenText, ChevronRight } from 'lucide-react'
import SetEmbed from './SetEmbed'
import { useLang } from '../context/LanguageContext'

/**
 * Espejo en Música del set destacado de una Biografía: la misma carga que
 * hace Facundo al armar la ficha alimenta las dos superficies. La tarjeta
 * se marca "desde su Biografía", suena con el reproductor oficial de la
 * plataforma (SetEmbed) y lleva a la ficha completa (/bio/:slug).
 */
export default function BioSetCard({ bio }) {
  const { t } = useLang()
  const initial = (bio.nombre || 'D').trim().charAt(0).toUpperCase()

  return (
    <article className="overflow-hidden rounded-2xl border border-clay bg-night-card shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition duration-200 hover:border-clay-deep hover:shadow-[0_8px_40px_rgba(0,0,0,0.1)]">
      <div className="flex items-center gap-3 px-5 pb-1 pt-4">
        {bio.foto_url ? (
          <img
            src={bio.foto_url}
            alt=""
            loading="lazy"
            className="h-11 w-11 shrink-0 rounded-full border border-clay object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-up/20 font-display text-lg font-extrabold text-up-light">
            {initial}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-display text-lg font-extrabold leading-snug text-ink">
            {bio.set_titulo || bio.nombre}
          </h3>
          <p className="truncate text-sm font-bold text-[#1A1A1A]">
            {bio.nombre}
            {bio.ciudad ? <span className="font-semibold text-muted"> · {bio.ciudad}</span> : null}
          </p>
        </div>
      </div>

      <p className="flex items-center gap-1.5 px-5 pb-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#00884D]">
        <BookOpenText size={13} />
        {t('bios.fromBio')}
      </p>

      <SetEmbed url={bio.set_url} title={bio.set_titulo || bio.nombre} />

      <Link
        to={`/bio/${encodeURIComponent(bio.slug)}`}
        className="flex min-h-[48px] items-center justify-between px-5 py-3 text-sm font-extrabold text-ink transition hover:text-[#00884D]"
      >
        {t('bios.viewBio')} · {t('bios.pressKit')}
        <ChevronRight size={17} className="text-muted/60" />
      </Link>
    </article>
  )
}
