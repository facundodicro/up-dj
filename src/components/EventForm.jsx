import { useRef, useState } from 'react'
import { Loader2, Link2, ImagePlus, X } from 'lucide-react'
import * as data from '../lib/data'
import { useLang } from '../context/LanguageContext'
import { parseSetUrl, isLegacyAudioUrl } from '../lib/setLink'
import { toast } from '../lib/toast'

/** Formulario para publicar un set: LINK a la plataforma donde vive el set
 * (SoundCloud / YouTube / Mixcloud) + descripción + foto. Up! no aloja audio:
 * el set suena con el reproductor oficial de la plataforma del DJ.
 * Con `editingEvent` funciona en modo edición (título, descripción, foto y,
 * desde el sistema nuevo, también el link). */
export default function EventForm({ userId, editingEvent, onCreated, onUpdated, onCancel }) {
  const { t } = useLang()
  const isEditing = !!editingEvent
  const legacyAudio = isEditing && isLegacyAudioUrl(editingEvent?.audio_url)
  const [title, setTitle] = useState(editingEvent?.title || '')
  const [description, setDescription] = useState(editingEvent?.description || '')
  const [setUrl, setSetUrl] = useState(
    editingEvent?.audio_url && !isLegacyAudioUrl(editingEvent.audio_url)
      ? editingEvent.audio_url
      : '',
  )
  const [declared, setDeclared] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(editingEvent?.photo_url || null)
  const [removePhoto, setRemovePhoto] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const photoRef = useRef(null)

  const pickPhoto = (e) => {
    const f = e.target.files?.[0]
    setError('')
    if (f) {
      setPhotoFile(f)
      setPhotoPreview(URL.createObjectURL(f))
      setRemovePhoto(false)
    }
  }

  const clearPhoto = () => {
    if (photoFile) {
      setPhotoFile(null)
      if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
      setPhotoPreview(editingEvent?.photo_url || null)
      setRemovePhoto(false)
    } else {
      setRemovePhoto(true)
      setPhotoPreview(null)
    }
    if (photoRef.current) photoRef.current.value = ''
  }

  /** Valida link + declaración. Devuelve la URL canónica o null (con error seteado). */
  const validate = () => {
    const parsed = parseSetUrl(setUrl)
    if (!parsed) {
      setError(setUrl.trim() ? t('event.invalidLink') : t('event.needLink'))
      return null
    }
    if (!declared) {
      setError(t('event.needDeclare'))
      return null
    }
    return parsed
  }

  const submitEdit = async () => {
    const parsed = validate()
    if (!parsed) return
    setUploading(true)
    setProgress(0)
    try {
      setStatus(t('event.uploadingPhoto'))
      await data.updateEvent(
        userId,
        editingEvent.id,
        { title, description, setUrl: parsed.url, photoFile, removePhoto },
        (p) => {
          setProgress(p)
          setStatus(t('event.uploadingPhoto'))
        },
      )
      toast(t('event.updated'), 'success')
      onUpdated?.()
    } catch (err) {
      setError(err?.message || t('event.updateError'))
    } finally {
      setUploading(false)
      setStatus('')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (isEditing) {
      await submitEdit()
      return
    }
    const parsed = validate()
    if (!parsed) return
    setUploading(true)
    setProgress(0)
    try {
      setStatus(t('event.publishing'))
      await data.createEvent(
        userId,
        { title, description, setUrl: parsed.url, photoFile },
        (p) => {
          setProgress(p)
          setStatus(t('event.uploadingPhoto'))
        },
      )
      toast(t('event.published'), 'success')
      onCreated()
    } catch (err) {
      setError(err?.message || t('event.publishError'))
    } finally {
      setUploading(false)
      setStatus('')
    }
  }

  const optional = <span className="font-semibold normal-case">{t('event.optional')}</span>

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-clay bg-night p-4">
      {isEditing && (
        <h4 className="font-display text-base font-black text-ink">{t('event.editTitle')}</h4>
      )}
      <div>
        <label htmlFor="ev-title" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          {t('event.title')} {optional}
        </label>
        <input
          id="ev-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('event.titlePh')}
          maxLength={80}
          disabled={uploading}
          className="w-full rounded-xl border border-clay bg-night-card px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70"
        />
      </div>

      <div>
        <label htmlFor="ev-link" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          {t('event.link')}
        </label>
        <div className="relative">
          <Link2 size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="ev-link"
            type="url"
            inputMode="url"
            value={setUrl}
            onChange={(e) => setSetUrl(e.target.value)}
            placeholder={t('event.linkPh')}
            disabled={uploading}
            className="w-full rounded-xl border border-clay bg-night-card py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70"
          />
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-muted">{t('event.linkHint')}</p>
        {legacyAudio && (
          <p className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold leading-relaxed text-amber-200">
            {t('event.legacyHint')}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="ev-desc" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          {t('event.description')} {optional}
        </label>
        <textarea
          id="ev-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('event.descPh')}
          rows={3}
          maxLength={500}
          disabled={uploading}
          className="w-full resize-none rounded-xl border border-clay bg-night-card px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70"
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          {t('event.photo')} {optional}
        </span>
        <input ref={photoRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" disabled={uploading} />
        {photoPreview ? (
          <div className="relative inline-block">
            <img src={photoPreview} alt={t('event.photoAlt')} className="h-28 w-44 rounded-xl border border-clay object-cover" />
            <button
              type="button"
              onClick={clearPhoto}
              aria-label={t('event.removePhoto')}
              disabled={uploading}
              className="absolute -right-2 -top-2 rounded-full bg-night-card p-1.5 text-muted shadow-lg transition hover:text-ink"
            >
              <X size={15} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 rounded-xl border border-clay bg-night-card px-4 py-2.5 text-sm font-bold text-muted transition hover:border-up/60 hover:text-ink disabled:opacity-60"
          >
            <ImagePlus size={17} className="text-up-light" />
            {t('event.addPhoto')}
          </button>
        )}
      </div>

      <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-clay bg-night-card px-3.5 py-3">
        <input
          type="checkbox"
          checked={declared}
          onChange={(e) => setDeclared(e.target.checked)}
          disabled={uploading}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#00C75C]"
        />
        <span className="text-xs font-semibold leading-relaxed text-muted">{t('event.declare')}</span>
      </label>

      {uploading && photoFile && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-clay-soft">
            <div
              className="h-full rounded-full bg-gradient-to-r from-up to-neon shadow-[0_0_12px_rgba(139,92,246,0.7)] transition-[width]"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs font-bold text-muted">
            {status} {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={uploading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-up px-4 py-3 text-sm font-extrabold text-ink transition hover:bg-up-dark disabled:opacity-60"
        >
          {uploading && <Loader2 size={17} className="animate-spin" />}
          {uploading ? t(isEditing ? 'event.updating' : 'event.publishing') : t(isEditing ? 'event.saveChanges' : 'event.save')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="rounded-xl border border-clay px-4 py-3 text-sm font-bold text-muted transition hover:text-ink disabled:opacity-60"
          >
            {t('event.cancel')}
          </button>
        )}
      </div>
    </form>
  )
}
