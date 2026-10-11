/**
 * Backend real con Supabase: Auth + Postgres + Storage.
 * Las subidas usan XMLHttpRequest contra la API REST de Storage
 * para poder mostrar progreso real de subida.
 */
import { supabase } from './supabase'
import { normalizeWhatsapp } from './format'
import { t } from './i18n'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const MAX_AUDIO_BYTES = 200 * 1024 * 1024
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

function validateCredentials(email, password) {
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error(t('demo.invalidEmail'))
  if (!password || password.length < 6)
    throw new Error(t('demo.shortPassword'))
}

function friendlyAuthError(error) {
  const msg = error?.message || ''
  if (/invalid login credentials/i.test(msg)) return t('demo.badCredentials')
  if (/user already registered|already exists/i.test(msg))
    return t('demo.emailTaken')
  if (/email not confirmed/i.test(msg))
    return t('auth.confirmFirst')
  return msg || t('auth.genericError')
}

function safeName(name) {
  const base = String(name || 'archivo').split('/').pop()
  return base.replace(/[^\w.\-]+/g, '_').slice(0, 120) || 'archivo'
}

function publicUrl(bucket, path) {
  const enc = path.split('/').map(encodeURIComponent).join('/')
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${enc}`
}

/** Sube un archivo a Storage con progreso real (0..1). Devuelve la URL pública. */
export function uploadWithProgress(bucket, path, file, onProgress) {
  return new Promise((resolve, reject) => {
    supabase.auth
      .getSession()
      .then(({ data }) => {
        const token = data.session?.access_token || ANON_KEY
        const encPath = path.split('/').map(encodeURIComponent).join('/')
        const xhr = new XMLHttpRequest()
        xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${bucket}/${encPath}`)
        xhr.setRequestHeader('apikey', ANON_KEY)
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.setRequestHeader('x-upsert', 'true')
        if (file.type) xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total)
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(publicUrl(bucket, path))
          } else {
            let msg = 'No se pudo subir el archivo.'
            try {
              const j = JSON.parse(xhr.responseText)
              if (j?.message) msg = j.message
            } catch {
              /* noop */
            }
            reject(new Error(msg))
          }
        }
        xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'))
        xhr.send(file)
      })
      .catch(reject)
  })
}

export async function getSessionUser() {
  const { data } = await supabase.auth.getSession()
  const u = data.session?.user
  return u ? { id: u.id, email: u.email } : null
}

export function onAuthChange(cb) {
  const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
    const u = session?.user
    cb(u ? { id: u.id, email: u.email } : null)
  })
  return () => sub.subscription.unsubscribe()
}

export async function signUp(email, password) {
  validateCredentials(email, password)
  const { data, error } = await supabase.auth.signUp({ email: email.trim() })
  if (error) throw new Error(friendlyAuthError(error))
  // El trigger handle_new_user crea la fila en profiles automáticamente.
  return {
    user: data.user ? { id: data.user.id, email: data.user.email } : null,
    needsConfirmation: !data.session,
  }
}

export async function signIn(email, password) {
  validateCredentials(email, password)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw new Error(friendlyAuthError(error))
  return { id: data.user.id, email: data.user.email }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getProfile(uid) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url, bio, whatsapp')
    .eq('id', uid)
    .maybeSingle()
  if (error) throw new Error(t('profile.loadError'))
  return data
}

export async function saveProfile(uid, { username, bio, whatsapp, avatarFile }, onProgress) {
  let avatar_url
  if (avatarFile) {
    if (!avatarFile.type.startsWith('image/'))
      throw new Error(t('demo.avatarNotImage'))
    if (avatarFile.size > MAX_IMAGE_BYTES)
      throw new Error(t('demo.avatarTooBig'))
    const ext = safeName(avatarFile.name).split('.').pop()
    const path = `${uid}/avatar-${crypto.randomUUID()}.${ext}`
    avatar_url = await uploadWithProgress('avatars', path, avatarFile, onProgress)
  }
  const patch = {
    id: uid,
    username: (username || '').trim().slice(0, 40) || 'DJ',
    bio: (bio || '').trim().slice(0, 300),
    whatsapp: normalizeWhatsapp(whatsapp).slice(0, 20),
    updated_at: new Date().toISOString(),
  }
  if (avatar_url) patch.avatar_url = avatar_url
  const { data, error } = await supabase
    .from('profiles')
    .upsert(patch, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw new Error(t('profile.saveError'))
  return data
}

export async function listEvents() {
  const { data, error } = await supabase
    .from('events')
    .select(
      'id, user_id, title, description, photo_url, audio_url, created_at, profiles(username, avatar_url, whatsapp)',
    )
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(t('home.loadError'))
  return (data || []).map((e) => ({
    id: e.id,
    user_id: e.user_id,
    title: e.title,
    description: e.description,
    photo_url: e.photo_url,
    audio_url: e.audio_url,
    created_at: e.created_at,
    dj: e.profiles || { username: 'DJ', avatar_url: null, whatsapp: '' },
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
  const audioPath = `${uid}/${crypto.randomUUID()}-${safeName(audioFile.name)}`
  const audio_url = await uploadWithProgress(
    'sets',
    audioPath,
    audioFile,
    (p) => onProgress && onProgress(photoFile ? p * 0.85 : p),
  )
  let photo_url = null
  if (photoFile) {
    const photoPath = `${uid}/${crypto.randomUUID()}-${safeName(photoFile.name)}`
    photo_url = await uploadWithProgress('event-photos', photoPath, photoFile, (p) =>
      onProgress ? onProgress(0.85 + p * 0.15) : undefined,
    )
  }
  const cleanName = audioFile.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim()
  const { data, error } = await supabase
    .from('events')
    .insert({
      user_id: uid,
      title: (title || '').trim() || cleanName || 'Set sin título',
      description: (description || '').trim(),
      photo_url,
      audio_url,
    })
    .select()
    .single()
  if (error) throw new Error(t('event.publishError'))
  return data
}

function pathFromPublicUrl(url, bucket) {
  try {
    const marker = `/object/public/${bucket}/`
    const i = url.indexOf(marker)
    if (i === -1) return null
    return decodeURIComponent(url.slice(i + marker.length))
  } catch {
    return null
  }
}

export async function deleteEvent(uid, id) {
  const { data: ev, error: fetchError } = await supabase
    .from('events')
    .select('audio_url, photo_url')
    .eq('id', id)
    .eq('user_id', uid)
    .maybeSingle()
  if (fetchError || !ev) throw new Error(t('demo.eventNotFound'))
  // Borrado best-effort de los archivos en Storage
  for (const [bucket, url] of [
    ['sets', ev.audio_url],
    ['event-photos', ev.photo_url],
  ]) {
    const path = url ? pathFromPublicUrl(url, bucket) : null
    if (path) {
      try {
        await supabase.storage.from(bucket).remove([path])
      } catch {
        /* sigue igual */
      }
    }
  }
  const { error } = await supabase.from('events').delete().eq('id', id).eq('user_id', uid)
  if (error) throw new Error(t('profile.deleteError'))
}

/** Envía el email de recupero de contraseña (link con token). */
export async function resetPassword(email) {
  if (!/^\S+@\S+\.\S+$/.test(email || '')) throw new Error(t('demo.invalidEmail'))
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: window.location.origin,
  })
  if (error) throw new Error(friendlyAuthError(error))
}

/** Define la nueva contraseña (tras abrir el link de recupero). */
export async function updatePassword(password) {
  if (!password || password.length < 6) throw new Error(t('demo.shortPassword'))
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(friendlyAuthError(error))
}

/** Login con Google vía OAuth (requiere configurarlo en Supabase). */
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw new Error(friendlyAuthError(error))
}
