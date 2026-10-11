import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus, Trash2, LogOut, Camera, Pencil } from 'lucide-react'
import Modal from './Modal'
import EventForm from './EventForm'
import { useAuth } from '../hooks/useAuth'
import { useLang } from '../context/LanguageContext'
import * as data from '../lib/data'
import { formatDate, normalizeWhatsapp } from '../lib/format'
import { toast } from '../lib/toast'

/**
 * Popup de perfil: datos del DJ (nombre, foto, descripción, WhatsApp),
 * creación de eventos y lista de "Mis eventos" con borrado.
 */
export default function ProfileModal({ open, user, profile, onClose, onSaved, onEventsChanged }) {
  const { signOut } = useAuth()
  const { t, lang } = useLang()
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [myEvents, setMyEvents] = useState([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const fileRef = useRef(null)

  // Sincronizar campos al abrir
  const [lastOpen, setLastOpen] = useState(open)
  if (open !== lastOpen) {
    setLastOpen(open)
    if (open) {
      setUsername(profile?.username || '')
      setBio(profile?.bio || '')
      setWhatsapp(profile?.whatsapp || '')
      setAvatarFile(null)
      setAvatarPreview(null)
      setError('')
      setShowForm(false)
      setConfirmDelete(null)
    }
  }

  useEffect(() => {
    if (!open || !user) return
    setLoadingEvents(true)
    data
      .listEvents()
      .then((all) => setMyEvents(all.filter((e) => e.user_id === user.id)))
      .catch(() => setMyEvents([]))
      .finally(() => setLoadingEvents(false))
  }, [open, user])

  const pickAvatar = (e) => {
    const f = e.target.files?.[0]
    setError('')
    if (f) {
      setAvatarFile(f)
      setAvatarPreview(URL.createObjectURL(f))
    }
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const updated = await data.saveProfile(user.id, {
        username,
        bio,
        whatsapp,
        avatarFile,
      })
      toast(t('profile.saved'), 'success')
      onSaved(updated)
    } catch (err) {
      setError(err?.message || t('profile.saveError'))
    } finally {
      setSaving(false)
    }
  }

  const refreshMyEvents = async () => {
    try {
      const all = await data.listEvents()
      setMyEvents(all.filter((e) => e.user_id === user.id))
    } catch {
      /* noop */
    }
    onEventsChanged()
  }

  const handleDelete = async (id) => {
    if (confirmDelete !== id) {
      setConfirmDelete(id)
      return
    }
    try {
      await data.deleteEvent(user.id, id)
      setMyEvents((prev) => prev.filter((e) => e.id !== id))
      toast(t('profile.deleted'), 'success')
      onEventsChanged()
    } catch (err) {
      toast(err?.message || t('profile.deleteError'), 'error')
    } finally {
      setConfirmDelete(null)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await signOut()
      onClose()
    } finally {
      setSigningOut(false)
    }
  }

  const avatarSrc = avatarPreview || profile?.avatar_url
  const initial = (username || user?.email || '?').trim().charAt(0).toUpperCase()

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg" label={t('profile.title')}>
      <div className="p-6 pt-8">
        <h2 className="font-display text-xl font-black text-ink">{t('profile.title')}</h2>
        <p className="mt-1 text-sm text-muted">{t('profile.subtitle')}</p>

        <form onSubmit={save} className="mt-5 space-y-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-label={t('profile.changePhoto')}
              className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-black/10 bg-night transition hover:border-up/70"
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-3xl font-black text-up-light">{initial}</span>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition hover:opacity-100">
                <Camera size={20} className="text-ink" />
              </span>
            </button>
            <div className="text-sm">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="font-extrabold text-up-light transition hover:text-ink"
              >
                {avatarSrc ? t('profile.changePhotoBtn') : t('profile.addPhoto')}
              </button>
              <p className="mt-1 text-xs text-muted">{t('profile.photoHint')}</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={pickAvatar} className="hidden" />
          </div>

          <div>
            <label htmlFor="pf-username" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
              {t('profile.username')}
            </label>
            <input
              id="pf-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t('profile.usernamePh')}
              maxLength={40}
              className="w-full rounded-xl border border-black/10 bg-night px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70"
            />
          </div>

          <div>
            <label htmlFor="pf-bio" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
              {t('profile.bio')}
            </label>
            <textarea
              id="pf-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('profile.bioPh')}
              rows={3}
              maxLength={300}
              className="w-full resize-none rounded-xl border border-black/10 bg-night px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70"
            />
          </div>

          <div>
            <label htmlFor="pf-wa" className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">
              {t('profile.whatsapp')}
            </label>
            <input
              id="pf-wa"
              type="tel"
              inputMode="numeric"
              value={whatsapp}
              onChange={(e) => setWhatsapp(normalizeWhatsapp(e.target.value))}
              placeholder={t('profile.whatsappPh')}
              className="w-full rounded-xl border border-black/10 bg-night px-4 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-up/70"
            />
            <p className="mt-1 text-xs text-muted">{t('profile.whatsappHint')}</p>
          </div>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-up px-4 py-3 text-sm font-extrabold text-ink transition hover:bg-up-dark disabled:opacity-60"
          >
            {saving && <Loader2 size={17} className="animate-spin" />}
            {t('profile.save')}
          </button>
        </form>

        <div className="my-6 border-t border-black/10" />

        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-black text-ink">{t('profile.createEvent')}</h3>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 rounded-xl bg-up/15 px-4 py-2 text-sm font-extrabold text-up-light transition hover:bg-up/25"
            >
              <Plus size={16} />
              {t('profile.newEvent')}
            </button>
          )}
        </div>
        {showForm && (
          <div className="mt-3">
            <EventForm
              userId={user.id}
              onCancel={() => setShowForm(false)}
              onCreated={() => {
                setShowForm(false)
                refreshMyEvents()
              }}
            />
          </div>
        )}

        <h3 className="mt-6 font-display text-lg font-black text-ink">{t('profile.myEvents')}</h3>
        {editingEvent && (
          <div className="mt-3">
            <EventForm
              userId={user.id}
              editingEvent={editingEvent}
              onCancel={() => setEditingEvent(null)}
              onUpdated={() => {
                setEditingEvent(null)
                refreshMyEvents()
              }}
            />
          </div>
        )}
        <div className="mt-3 space-y-2">
          {loadingEvents && <p className="text-sm text-muted">{t('profile.loading')}</p>}
          {!loadingEvents && myEvents.length === 0 && (
            <p className="rounded-xl border border-dashed border-black/10 px-4 py-5 text-center text-sm text-muted">
              {t('profile.noEvents')}
            </p>
          )}
          {myEvents.map((e) => (
            <div
              key={e.id}
              className="flex items-center gap-3 rounded-xl border border-black/10 bg-night px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-ink">{e.title}</p>
                <p className="text-xs text-muted">{formatDate(e.created_at, lang)}</p>
              </div>
              <button
                onClick={() => setEditingEvent(editingEvent?.id === e.id ? null : e)}
                aria-label={t('profile.edit')}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold text-muted transition hover:bg-black/5 hover:text-ink"
              >
                <Pencil size={15} />
                {t('profile.edit')}
              </button>
              <button
                onClick={() => handleDelete(e.id)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                  confirmDelete === e.id
                    ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                    : 'text-muted hover:bg-black/5 hover:text-red-300'
                }`}
              >
                <Trash2 size={15} />
                {confirmDelete === e.id ? t('profile.confirmDelete') : t('profile.delete')}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-black/10 pt-4">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/10 px-4 py-2.5 text-sm font-bold text-muted transition hover:border-red-500/40 hover:text-red-300 disabled:opacity-60"
          >
            {signingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            {t('profile.signOut')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
