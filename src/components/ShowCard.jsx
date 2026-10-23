import { MapPin, Star } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { localeTag } from '../lib/i18n'
import { localDateFromYmd } from '../lib/format'

const NEW_WINDOW_MS = 7 * 86400000

/**
 * Tarjeta magazine de un evento de la agenda: flyer protagonista,
 * fecha como titular grande y estrellita verde parpadeante si es nuevo
 * (publicado dentro de los últimos 7 días).
 */
export default function ShowCard({ show }) {
  const { lang } = useLang()
  const d = localDateFromYmd(show.show_date)
  const tag = localeTag()
  const weekday = d ? d.toLocaleDateString(tag, { weekday: 'long' }) : ''
  const dayNum = d ? d.getDate() : ''
  const month = d ? d.toLocaleDateString(tag, { month: 'long' }) : ''
  const year = d ? d.getFullYear() : ''
  const isNew = Date.now() - new Date(show.created_at).getTime() < NEW_WINDOW_MS
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)
  // Lugar visible: venue + ciudad (sin repetir si el venue ya la incluye).
  const venueTxt = (show.venue || '').trim()
  const cityTxt = (show.city || '').trim()
  const placeLine =
    venueTxt && cityTxt && !venueTxt.toLowerCase().includes(cityTxt.toLowerCase())
      ? `${venueTxt} · ${cityTxt}`
      : venueTxt || cityTxt

  return (
    <article className="overflow-hidden rounded-3xl border border-clay bg-night-card">
      <div className="relative">
        {show.flyer_url ? (
          <img
            src={show.flyer_url}
            alt={show.title}
            className="aspect-[4/5] w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex aspect-[4/5] w-full flex-col items-center justify-center bg-clay-soft px-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted">{cap(weekday)}</p>
            <p className="font-display text-[92px] font-black leading-none text-ink">{dayNum}</p>
            <p className="mt-1 text-lg font-extrabold uppercase tracking-[0.2em] text-ink">
              {cap(month)}
            </p>
          </div>
        )}
        {isNew && (
          <span
            className="absolute right-3.5 top-3.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 backdrop-blur-sm"
            title="Nuevo"
          >
            <Star size={19} className="star-blink fill-[#00E065] text-[#00E065]" />
          </span>
        )}
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">
          {cap(weekday)} {dayNum} · {cap(month)} {year}
        </p>
        <h3 className="mt-1.5 font-display text-2xl font-black leading-tight text-ink">
          {show.title}
        </h3>
        {placeLine && (
          <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-muted">
            <MapPin size={15} className="shrink-0" />
            {placeLine}
          </p>
        )}
        <p className="mt-3 text-xs font-bold text-muted">
          {lang === 'en' ? 'Posted by' : 'Publicado por'}{' '}
          <span className="text-ink">@{show.dj?.username || 'DJ'}</span>
        </p>
      </div>
    </article>
  )
}
