import { useRef, useState } from 'react'
import { Loader2, Music2, ImagePlus, X } from 'lucide-react'
import * as data from '../lib/data'
import { useLang } from '../context/LanguageContext'
import { formatBytes } from '../lib/format'
import { toast } from '../lib/toast'

/** Formulario para publicar un evento: audio del set + descripción + foto. */
export default function EventForm({ userId, onCreated, onCancel }) {
  const { t, lang } = useLang()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [audioFile, setAudioFile] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const audioRef = useRef(null)
  const photoRef = useRef(null)

  const pickAudio = (e) => {
    const f = e.target.files?.[0]
    setError('')
    if (f) setAudioFile(f)
  }

  const pickPhoto = (e) => {
    const f = e.target.files?.[0]
    setError('')
    if (f) {
      setPhotoFile(f)
      setPhotoPreview(URL.createObjectURL(f))
    }
  }

  const clearPhoto = () => {
    setPhotoFile(null)
    if (photoPreview?.startsWith('blob:')) URL.revokeObjectURL(photoPreview)
    setPhotoPreview(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (!audioFile) {
      setError(t('event.needAudio'))
      return
    }
    setUploading(true)
    setProgress(0)
    try {
      setStatus(t('event.uploadingAudio'))
      await data.createEvent(
        userId,
        { title, description, audioFile, photoFile },
        (p) => {
          setProgress(p)
          setStatus(p < 0.85 || !photoFile ? t('event.uploadingAudio') : t('event.uploadingPhoto'))
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
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-night p-4">
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
          className="w-full rounded-xl border border-white/10 bg-night-card px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70"
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          {t('event.audio')}
        </span>
        <input ref={audioRef} type="file" accept="audio/*" onChange={pickAudio} className="hidden" disabled={uploading} />
        <button
          type="button"
          onClick={() => audioRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center gap-3 rounded-xl border border-dashed border-white/20 bg-night-card px-4 py-3.5 text-left transition hover:border-up/60 disabled:opacity-60"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-up/15 text-up-light">
            <Music2 size={19} />
          </span>
          {audioFile ? (
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-ink">{audioFile.name}</span>
              <span className="block text-xs text-muted">{formatBytes(audioFile.size, lang)} — {t('event.maxAudio')}</span>
            </span>
          ) : (
            <span className="text-sm text-muted">
              <span className="font-bold text-ink">{t('event.chooseSet')}</span> — {t('event.audioHint')}
            </span>
          )}
        </button>
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
          className="w-full resize-none rounded-xl border border-white/10 bg-night-card px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70"
        />
      </div>

      <div>
        <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
          {t('event.photo')} {optional}
        </span>
        <input ref={photoRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" disabled={uploading} />
        {photoPreview ? (
          <div className="relative inline-block">
            <img src={photoPreview} alt={t('event.photoAlt')} className="h-28 w-44 rounded-xl border border-white/10 object-cover" />
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
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-night-card px-4 py-2.5 text-sm font-bold text-muted transition hover:border-up/60 hover:text-ink disabled:opacity-60"
          >
            <ImagePlus size={17} className="text-up-light" />
            {t('event.addPhoto')}
          </button>
        )}
      </div>

      {uploading && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
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
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-up px-4 py-3 text-sm font-extrabold text-white transition hover:bg-up-dark disabled:opacity-60"
        >
          {uploading && <Loader2 size={17} className="animate-spin" />}
          {uploading ? t('event.publishing') : t('event.save')}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-muted transition hover:text-ink disabled:opacity-60"
          >
            {t('event.cancel')}
          </button>
        )}
      </div>
    </form>
  )
}
