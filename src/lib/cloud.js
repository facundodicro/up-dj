/**
 * Backend real con Supabase: Auth + Postgres + Storage.
 * Las subidas usan XMLHttpRequest contra la API REST de Storage
 * para poder mostrar progreso real de subida.
 */
import { supabase } from './supabase'
import { sanitizeWhatsapp, sanitizeInstagram } from './format'
import { t } from './i18n'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
const MAX_AUDIO_BYTES = 50 * 1024 * 1024
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
  const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
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
  // select('*'): tolera que la columna instagram aún no exista (migración pendiente)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', uid)
    .maybeSingle()
  if (error) throw new Error(t('profile.loadError'))
  return data
}

export async function saveProfile(uid, { username, bio, whatsapp, instagram, avatarFile }, onProgress) {
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
  const cleanName = (username || '').trim().replace(/\s+/g, ' ').slice(0, 40) || null
  if (cleanName) {
    // El nombre de DJ es único (insensible a mayúsculas): aviso amigable antes del upsert.
    const { data: taken } = await supabase
      .from('profiles')
      .select('id')
      .neq('id', uid)
      .ilike('username', cleanName)
      .maybeSingle()
    if (taken) throw new Error(t('profile.usernameTaken'))
  }
  const patch = {
    id: uid,
    username: cleanName,
    bio: (bio || '').trim().slice(0, 300),
    whatsapp: sanitizeWhatsapp(whatsapp),
    updated_at: new Date().toISOString(),
  }
  if (avatar_url) patch.avatar_url = avatar_url
  // Instagram: la columna puede no existir aún (migración pendiente) → reintentar sin ella
  const ig = sanitizeInstagram(instagram)
  if (ig) patch.instagram = ig
  let res = await supabase.from('profiles').upsert(patch, { onConflict: 'id' }).select().single()
  // Si la columna instagram aún no existe (migración pendiente), reintentar sin ella
  if (res.error && ig && /instagram/i.test(res.error.message || '')) {
    delete patch.instagram
    res = await supabase.from('profiles').upsert(patch, { onConflict: 'id' }).select().single()
  }
  const { data, error } = res
  if (error) {
    // 23505 = violación del índice único (carrera entre dos usuarios)
    if (error.code === '23505') throw new Error(t('profile.usernameTaken'))
    throw new Error(t('profile.saveError'))
  }
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

/** Un DJ por su nombre de usuario (insensible a mayúsculas), para /dj/:username. */
export async function getProfileByUsername(username) {
  // select('*'): tolera que la columna instagram aún no exista (migración pendiente)
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('username', (username || '').trim())
    .maybeSingle()
  if (error) throw new Error(t('profile.loadError'))
  return data
}

const EVENT_SELECT =
  // profiles(*): tolera que la columna instagram aún no exista (migración pendiente)
  'id, user_id, title, description, photo_url, audio_url, created_at, profiles(*)'

function mapEvent(e) {
  return {
    id: e.id,
    user_id: e.user_id,
    title: e.title,
    description: e.description,
    photo_url: e.photo_url,
    audio_url: e.audio_url,
    created_at: e.created_at,
    dj: e.profiles || { username: 'DJ', avatar_url: null, whatsapp: '', instagram: '' },
  }
}

/** Un set por id, para /set/:id. */
export async function getEvent(id) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error(t('demo.eventNotFound'))
  return data ? mapEvent(data) : null
}

/** Sets de un DJ, para su página pública. */
export async function listEventsByUser(uid) {
  const { data, error } = await supabase
    .from('events')
    .select(EVENT_SELECT)
    .eq('user_id', uid)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw new Error(t('home.loadError'))
  return (data || []).map(mapEvent)
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

/**
 * Actualiza un evento ya publicado: título, descripción y foto.
 * El audio no se puede cambiar (se publica un set nuevo para eso).
 */
export async function updateEvent(
  uid,
  id,
  { title, description, photoFile, removePhoto },
  onProgress,
) {
  const { data: ev, error: fetchError } = await supabase
    .from('events')
    .select('photo_url')
    .eq('id', id)
    .eq('user_id', uid)
    .maybeSingle()
  if (fetchError || !ev) throw new Error(t('demo.eventNotFound'))

  let photo_url = ev.photo_url ?? null
  if (photoFile) {
    if (!photoFile.type.startsWith('image/')) throw new Error(t('demo.photoNotImage'))
    if (photoFile.size > MAX_IMAGE_BYTES) throw new Error(t('demo.photoTooBig'))
    const photoPath = `${uid}/${crypto.randomUUID()}-${safeName(photoFile.name)}`
    photo_url = await uploadWithProgress('event-photos', photoPath, photoFile, onProgress)
    // Borra la foto anterior (best-effort)
    const oldPath = ev.photo_url ? pathFromPublicUrl(ev.photo_url, 'event-photos') : null
    if (oldPath) {
      try {
        await supabase.storage.from('event-photos').remove([oldPath])
      } catch {
        /* sigue igual */
      }
    }
  } else if (removePhoto && ev.photo_url) {
    const oldPath = pathFromPublicUrl(ev.photo_url, 'event-photos')
    if (oldPath) {
      try {
        await supabase.storage.from('event-photos').remove([oldPath])
      } catch {
        /* sigue igual */
      }
    }
    photo_url = null
  }

  const { error } = await supabase
    .from('events')
    .update({
      title: (title || '').trim(),
      description: (description || '').trim(),
      photo_url,
    })
    .eq('id', id)
    .eq('user_id', uid)
  if (error) throw new Error(t('event.publishError'))
}

/**
 * Likes de varios eventos: conteo por evento + cuáles likeó el usuario actual.
 * Devuelve { counts: {eventId: n}, mine: Set<eventId> }.
 */
export async function getLikes(eventIds) {
  const counts = {}
  const mine = new Set()
  if (!eventIds?.length) return { counts, mine }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('likes')
    .select('event_id, user_id')
    .in('event_id', eventIds)
  if (error) throw new Error(t('home.loadError'))
  for (const l of data || []) {
    counts[l.event_id] = (counts[l.event_id] || 0) + 1
    if (user && l.user_id === user.id) mine.add(l.event_id)
  }
  return { counts, mine }
}

/** Da o quita el like del usuario a un evento. */
export async function toggleLike(uid, eventId, liked) {
  let error
  if (liked) {
    ;({ error } = await supabase
      .from('likes')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', uid))
  } else {
    ;({ error } = await supabase.from('likes').insert({ event_id: eventId, user_id: uid }))
  }
  if (error) throw new Error(t('home.loadError'))
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

/** IDs de los DJs que sigue el usuario. */
export async function getMyFollows(uid) {
  if (!sb || !uid) return new Set()
  const { data, error } = await supabase
    .from('follows')
    .select('followed_id')
    .eq('follower_id', uid)
  if (error) return new Set()
  return new Set((data || []).map((f) => f.followed_id))
}

/** Cantidad de seguidores por cada ID de usuario. */
export async function getFollowerCounts(userIds) {
  const counts = {}
  if (!sb || !userIds?.length) return counts
  const { data, error } = await supabase
    .from('follows')
    .select('followed_id')
    .in('followed_id', userIds)
  if (error) return counts
  for (const f of data || []) counts[f.followed_id] = (counts[f.followed_id] || 0) + 1
  return counts
}

/** Seguidores y seguidos de un usuario (para mostrar en el perfil). */
export async function getFollowCounts(uid) {
  if (!sb || !uid) return { followers: 0, following: 0 }
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('follows').select('follower_id', { count: 'exact', head: true }).eq('followed_id', uid),
    supabase.from('follows').select('followed_id', { count: 'exact', head: true }).eq('follower_id', uid),
  ])
  return { followers: followers || 0, following: following || 0 }
}

/** Seguir o dejar de seguir a un DJ. */
export async function toggleFollow(uid, followedId, following) {
  if (uid === followedId) return
  let error
  if (following) {
    ;({ error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', uid)
      .eq('followed_id', followedId))
  } else {
    ;({ error } = await supabase
      .from('follows')
      .insert({ follower_id: uid, followed_id: followedId }))
  }
  if (error) throw new Error(t('home.loadError'))
}

/** DJs más seguidos en los últimos 7 días (para la tira "Top DJs"). */
export async function getTopDjs(limit = 10) {
  if (!sb) return []
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const { data, error } = await supabase
    .from('follows')
    .select('followed_id')
    .gte('created_at', weekAgo)
  if (error || !data) return []
  const counts = {}
  for (const f of data) counts[f.followed_id] = (counts[f.followed_id] || 0) + 1
  const ids = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
  if (!ids.length) return []
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .in('id', ids)
  const byId = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  return ids
    .filter((id) => byId[id])
    .map((id) => ({
      user_id: id,
      username: byId[id].username || t('card.djFallback'),
      avatar_url: byId[id].avatar_url || null,
      followers: counts[id],
    }))
}
