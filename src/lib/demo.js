/**
 * Modo demo: cuando no hay credenciales de Supabase, la app funciona 100%
 * local con datos guardados en el navegador. Ideal para probar todos los
 * flujos antes de conectar el backend real.
 */
import { normalizeWhatsapp } from './format'
import { t } from './i18n'

const LS_DATA = 'up_demo_v1'
const LS_SESSION = 'up_demo_session'
const MAX_AUDIO_BYTES = 200 * 1024 * 1024
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function readData() {
  try {
    return (
      JSON.parse(localStorage.getItem(LS_DATA)) || { users: {}, profiles: {}, events: [] }
    )
  } catch {
    return { users: {}, profiles: {}, events: [] }
  }
}

function writeData(d) {
  try {
    localStorage.setItem(LS_DATA, JSON.stringify(d))
  } catch {
    /* cuota llena: se sigue en memoria de la sesión */
  }
}

function emitAuth() {
  window.dispatchEvent(new CustomEvent('up:demo-auth'))
}

function fakeProgress(onProgress, ms = 1400) {
  return new Promise((resolve) => {
    if (!onProgress) {
      setTimeout(resolve, 400)
      return
    }
    const start = Date.now()
    const t = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / ms)
      onProgress(p)
      if (p >= 1) {
        clearInterval(t)
        resolve()
      }
    }, 90)
  })
}

function validateCredentials(email, password) {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error(t('demo.invalidEmail'))
  if (!password || password.length < 6)
    throw new Error(t('demo.shortPassword'))
}

export async function getSessionUser() {
  try {
    const uid = localStorage.getItem(LS_SESSION)
    if (!uid) return null
    const d = readData()
    const found = Object.values(d.users).find((u) => u.id === uid)
    return found ? { id: found.id, email: found.email } : null
  } catch {
    return null
  }
}

export function onAuthChange(cb) {
  const handler = async () => cb(await getSessionUser())
  window.addEventListener('up:demo-auth', handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener('up:demo-auth', handler)
    window.removeEventListener('storage', handler)
  }
}

export async function signUp(email, password) {
  validateCredentials(email, password)
  const d = readData()
  const key = email.trim().toLowerCase()
  if (d.users[key]) throw new Error(t('demo.emailTaken'))
  const id = `demo-${Date.now().toString(36)}`
  d.users[key] = { id, email: key, password }
  d.profiles[id] = {
    id,
    username: key.split('@')[0],
    avatar_url: null,
    bio: '',
    whatsapp: '',
  }
  writeData(d)
  try {
    localStorage.setItem(LS_SESSION, id)
  } catch {}
  emitAuth()
  return { user: { id, email: key }, needsConfirmation: false }
}

export async function signIn(email, password) {
  validateCredentials(email, password)
  const d = readData()
  const found = d.users[email.trim().toLowerCase()]
  if (!found || found.password !== password)
    throw new Error(t('demo.badCredentials'))
  try {
    localStorage.setItem(LS_SESSION, found.id)
  } catch {}
  emitAuth()
  return { id: found.id, email: found.email }
}

export async function signOut() {
  try {
    localStorage.removeItem(LS_SESSION)
  } catch {}
  emitAuth()
}

export async function getProfile(uid) {
  const d = readData()
  return d.profiles[uid] || null
}

export async function saveProfile(uid, { username, bio, whatsapp, avatarFile }, onProgress) {
  const d = readData()
  let avatar_url = d.profiles[uid]?.avatar_url || null
  if (avatarFile) {
    if (!avatarFile.type.startsWith('image/'))
      throw new Error(t('demo.avatarNotImage'))
    if (avatarFile.size > MAX_IMAGE_BYTES)
      throw new Error(t('demo.avatarTooBig'))
    await fakeProgress(onProgress, 900)
    avatar_url = URL.createObjectURL(avatarFile)
  }
  d.profiles[uid] = {
    id: uid,
    username: (username || '').trim().slice(0, 40) || 'DJ',
    bio: (bio || '').trim().slice(0, 300),
    whatsapp: normalizeWhatsapp(whatsapp).slice(0, 20),
    avatar_url,
  }
  writeData(d)
  return d.profiles[uid]
}

export async function listEvents() {
  const d = readData()
  return [...d.events]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map((e) => ({
      ...e,
      dj: d.profiles[e.user_id] || { username: 'DJ', avatar_url: null, whatsapp: '' },
    }))
}

export async function createEvent(uid, { title, description, audioFile, photoFile }, onProgress) {
  if (!audioFile) throw new Error(t('event.needAudio'))
  if (audioFile.size > MAX_AUDIO_BYTES)
    throw new Error(t('demo.audioTooBig'))
  if (photoFile) {
    if (!photoFile.type.startsWith('image/'))
      throw new Error(t('demo.photoNotImage'))
    if (photoFile.size > MAX_IMAGE_BYTES)
      throw new Error(t('demo.photoTooBig'))
  }
  const total = 1
  await fakeProgress(
    (p) => onProgress && onProgress((p * 0.85) / total),
    1600,
  )
  const audio_url = URL.createObjectURL(audioFile)
  let photo_url = null
  if (photoFile) {
    await fakeProgress(
      (p) => onProgress && onProgress(0.85 + (p * 0.15) / total),
      700,
    )
    photo_url = URL.createObjectURL(photoFile)
  }
  const cleanName = audioFile.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  const event = {
    id: `ev-${Date.now().toString(36)}`,
    user_id: uid,
    title: (title || '').trim() || cleanName || t('demo.untitled'),
    description: (description || '').trim(),
    photo_url,
    audio_url,
    created_at: new Date().toISOString(),
  }
  const d = readData()
  d.events.unshift(event)
  writeData(d)
  return event
}

export async function deleteEvent(uid, id) {
  const d = readData()
  const ev = d.events.find((e) => e.id === id && e.user_id === uid)
  if (!ev) throw new Error(t('demo.eventNotFound'))
  if (ev.audio_url?.startsWith('blob:')) URL.revokeObjectURL(ev.audio_url)
  if (ev.photo_url?.startsWith('blob:')) URL.revokeObjectURL(ev.photo_url)
  d.events = d.events.filter((e) => e.id !== id)
  writeData(d)
}

/** Recupero de contraseña (demo): valida el email y simula el envío. */
export async function resetPassword(email) {
  if (!/^\S+@\S+\.\S+$/.test(email || '')) throw new Error(t('demo.invalidEmail'))
}

/** Actualiza la contraseña (demo): solo valida el formato. */
export async function updatePassword(password) {
  if (!password || password.length < 6) throw new Error(t('demo.shortPassword'))
}

/** Login con Google: solo disponible con Supabase conectado. */
export async function signInWithGoogle() {
  throw new Error(t('auth.googleDemo'))
}
