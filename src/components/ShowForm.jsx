import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import * as data from '../lib/data'
import { toast } from '../lib/toast'

/**
 * Formulario "Cargar evento" de la agenda: nombre, fecha, lugar y flyer.
 * El flyer pasa por el compresor de fotos antes de subir (en la capa de datos).
 */
export default function ShowForm({ userId, onCancel, onCreated }) {
  const { t } = useLang()
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [venue, setVenue] = useState('')
  const [city, setCity] = useState('')
  const [knownCities, setKnownCities] = useState([])
  const [flyerFile, setFlyerFile] = useState(null)
  const [flyerPreview, setFlyerPreview] = useState(null)
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const fileRef = useRef(null)

  // Ciudades ya usadas en la agenda: se ofrecen como sugerencia (se puede escribir otra).
  useEffect(() => {
    let alive = true
    data
      .listShows()
      .then((list) => {
        if (!alive) return
        const seen = []
        for (const s of list) {
          const c = (s.city || '').trim()
          if (c && !seen.some((x) => x.toLowerCase() === c.toLowerCase())) seen.push(c)
        }
        setKnownCities(seen)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  const today = (() => {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
  })()

  const pickFlyer = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.type.startsWith('image/')) {
      setError(t('demo.photoNotImage'))
      return
    }
    setError('')
    setFlyerFile(f)
    setFlyerPreview(URL.createObjectURL(f))
  }

  const removeFlyer = () => {
    setFlyerFile(null)
    setFlyerPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setError(t('show.needTitle'))
      return
    }
    if (!date) {
      setError(t('show.needDate'))
      return
    }
    if (date < today) {
      setError(t('show.pastDate'))
      return
    }
    if (!city.trim()) {
      setError(t('show.needCity'))
      return
    }
    setPublishing(true)
    setError('')
    try {
      await data.createShow(userId, { title, showDate: date, venue, city, flyerFile })
      toast(t('show.published'), 'success')
      onCreated && onCreated()
    } catch (err) {
      setError(err?.message || t('show.publishError'))
    } finally {
      setPublishing(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-clay bg-night px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70'
  const labelCls = 'mb-1 block text-xs font-bold uppercase tracking-wide text-muted'

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-clay bg-night-card p-4">
      <div>
        <label htmlFor="sf-title" className={labelCls}>
          {t('show.title')}
        </label>
        <input
          id="sf-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('show.titlePh')}
          maxLength={80}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="sf-date" className={labelCls}>
            {t('show.date')}
          </label>
          <input
            id="sf-date"
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="sf-city" className={labelCls}>
            {t('show.city')}
          </label>
          <input
            id="sf-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder={t('show.cityPh')}
            maxLength={60}
            list="sf-city-list"
            className={inputCls}
          />
          <datalist id="sf-city-list">
            {knownCities.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label htmlFor="sf-venue" className={labelCls}>
          {t('show.venue')}
        </label>
        <input
          id="sf-venue"
          type="text"
          value={venue}
          onChange={(e) => setVenue(e.target.value)}
          placeholder={t('show.venuePh')}
          maxLength={80}
          className={inputCls}
        />
      </div>

      <div>
        <span className={labelCls}>{t('show.flyer')}</span>
        {flyerPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-clay">
            <img src={flyerPreview} alt="" className="max-h-56 w-full object-cover" />
            <button
              type="button"
              onClick={removeFlyer}
              className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm transition hover:bg-black/80"
            >
              <X size={13} />
              {t('show.removeFlyer')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-clay px-4 py-5 text-sm font-bold text-muted transition hover:border-ink/40 hover:text-ink"
          >
            <ImagePlus size={18} />
            {t('show.addFlyer')}
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" onChange={pickFlyer} className="hidden" />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={publishing}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-up px-4 py-3 text-sm font-extrabold text-ink transition hover:bg-up-dark disabled:opacity-60"
        >
          {publishing && <Loader2 size={16} className="animate-spin" />}
          {publishing ? t('show.publishing') : t('show.publish')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={publishing}
          className="rounded-xl border border-clay px-4 py-3 text-sm font-bold text-muted transition hover:text-ink disabled:opacity-60"
        >
          {t('event.cancel')}
        </button>
      </div>
    </form>
  )
}
