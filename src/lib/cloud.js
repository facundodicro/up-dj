/**
 * Backend real con Supabase: Auth + Postgres + Storage.
 * Las subidas usan XMLHttpRequest contra la API REST de Storage
 * para poder mostrar progreso real de subida.
 */
import { supabase } from './supabase'
import { sanitizeWhatsapp, sanitizeInstagram } from './format'
import { compressImage } from './image'
import { parseSetUrl } from './setLink'
import { t } from './i18n'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
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
function uploadOnce(bucket, path, file, onProgress) {
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

const NETWORK_ERROR_MSG = 'Error de red al subir el archivo.'

/* ------------------------------------------------------------------ */
/* Subida reanudable (protocolo tus): el archivo sube en pedazos de    */
/* 6 MB; si la conexión se corta, se retoma desde el último pedazo     */
/* confirmado por el servidor en vez de arrancar de cero.              */
/* ------------------------------------------------------------------ */

const TUS_CHUNK_SIZE = 6 * 1024 * 1024 // tamaño de chunk que exige Supabase

function b64utf8(str) {
  const bytes = new TextEncoder().encode(str)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

async function getAuthToken() {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || ANON_KEY
}

async function tusCreate(token, bucket, path, file) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/upload/resumable`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Tus-Resumable': '1.0.0',
      'Upload-Length': String(file.size),
      'Upload-Metadata':
        `bucketName ${b64utf8(bucket)},objectName ${b64utf8(path)},` +
        `contentType ${b64utf8(file.type || 'application/octet-stream')}`,
      'x-upsert': 'true',
    },
  })
  if (res.status !== 201) {
    let msg = 'No se pudo subir el archivo.'
    try {
      const j = await res.json()
      if (j?.message) msg = j.message
    } catch {
      /* noop */
    }
    const err = new Error(msg)
    err.httpStatus = res.status
    throw err
  }
  const loc = res.headers.get('Location')
  if (!loc) {
    const err = new Error('No se pudo crear la subida.')
    err.unsupported = true
    throw err
  }
  return loc.startsWith('http') ? loc : `${SUPABASE_URL}${loc}`
}

/** Offset confirmado por el servidor; -1 si la sesión ya no existe. */
async function tusHead(token, url) {
  const res = await fetch(url, {
    method: 'HEAD',
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${token}`,
      'Tus-Resumable': '1.0.0',
      'Cache-Control': 'no-store',
    },
  })
  if (res.status === 404 || res.status === 410) return -1
  if (!res.ok) throw new Error(NETWORK_ERROR_MSG)
  return parseInt(res.headers.get('Upload-Offset') || '0', 10)
}

function tusPatch(token, url, blob, offset, onLoaded) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PATCH', url)
    xhr.setRequestHeader('apikey', ANON_KEY)
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Tus-Resumable', '1.0.0')
    xhr.setRequestHeader('Upload-Offset', String(offset))
    xhr.setRequestHeader('Content-Type', 'application/offset+octet-stream')
    xhr.timeout = 120000
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onLoaded) onLoaded(e.loaded)
    }
    xhr.onload = () => {
      if (xhr.status === 204) {
        const off = parseInt(
          xhr.getResponseHeader('Upload-Offset') || String(offset + blob.size),
          10,
        )
        resolve(off)
      } else if (xhr.status === 409) {
        const err = new Error('Conflicto de offset.')
        err.conflict = true
        reject(err)
      } else {
        let msg = 'No se pudo subir el archivo.'
        try {
          const j = JSON.parse(xhr.responseText)
          if (j?.message) msg = j.message
        } catch {
          /* noop */
        }
        const err = new Error(msg)
        err.httpStatus = xhr.status
        reject(err)
      }
    }
    xhr.onerror = () => reject(new Error(NETWORK_ERROR_MSG))
    xhr.ontimeout = () => reject(new Error(NETWORK_ERROR_MSG))
    xhr.send(blob)
  })
}

async function uploadResumable(bucket, path, file, onProgress) {
  const token = await getAuthToken()
  let url = await tusCreate(token, bucket, path, file)
  let offset = 0
  let resumes = 0
  let restarts = 0
  while (offset < file.size) {
    const end = Math.min(offset + TUS_CHUNK_SIZE, file.size)
    try {
      offset = await tusPatch(token, url, file.slice(offset, end), offset, (loaded) => {
        if (onProgress) onProgress(Math.min(1, (offset + loaded) / file.size))
      })
    } catch (err) {
      if (err?.httpStatus) throw err // error del servidor: no reintentar a ciegas
      if (++resumes > 15) throw new Error(FRIENDLY_CUT_MSG)
      await new Promise((r) => setTimeout(r, Math.min(1000 * resumes, 6000)))
      let serverOffset = -2
      try {
        serverOffset = await tusHead(token, url)
      } catch {
        serverOffset = -2 // HEAD falló por red: se reintenta el mismo chunk
      }
      if (serverOffset === -1) {
        if (++restarts > 2) throw new Error(FRIENDLY_CUT_MSG)
        url = await tusCreate(token, bucket, path, file)
        offset = 0
      } else if (serverOffset >= 0) {
        offset = serverOffset
      }
    }
  }
  if (onProgress) onProgress(1)
  return publicUrl(bucket, path)
}

const FRIENDLY_CUT_MSG =
  'Se cortó la conexión varias veces. Revisá tu WiFi e intentá de nuevo.'

/** Camino clásico: un solo envío con reintentos (respaldo si tus no está). */
async function uploadLegacyWithRetries(bucket, path, file, onProgress) {
  const delays = [0, 1500, 4000]
  let lastErr = null
  for (let i = 0; i < delays.length; i++) {
    if (i > 0) await new Promise((r) => setTimeout(r, delays[i]))
    try {
      return await uploadOnce(bucket, path, file, onProgress)
    } catch (err) {
      lastErr = err
      const isNetwork = err?.message === NETWORK_ERROR_MSG
      if (!isNetwork || i === delays.length - 1) break
    }
  }
  if (lastErr?.message === NETWORK_ERROR_MSG) {
    throw new Error('Se cortó la conexión varias veces. Revisá tu WiFi e intentá de nuevo.')
  }
  throw lastErr
}

/**
 * Subida de archivos: reanudable por pedazos (tus); si el servidor no
 * soporta ese protocolo o la sesión no se puede crear por red, cae al
 * camino clásico de un solo envío con reintentos.
 */
export async function uploadWithProgress(bucket, path, file, onProgress) {
  try {
    return await uploadResumable(bucket, path, file, onProgress)
  } catch (err) {
    if (
      err?.unsupported ||
      err?.httpStatus === 404 ||
      err?.httpStatus === 501 ||
      err instanceof TypeError
    ) {
      return uploadLegacyWithRetries(bucket, path, file, onProgress)
    }
    throw err
  }
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
    // Compresor de fotos: se achica antes de subir
    const compressed = await compressImage(avatarFile)
    if (compressed.size > MAX_IMAGE_BYTES)
      throw new Error(t('demo.avatarTooBig'))
    const path = `${uid}/avatar-${crypto.randomUUID()}.webp`
    avatar_url = await uploadWithProgress('avatars', path, compressed, onProgress)
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

/**
 * Publica un set por LINK externo: Up! no aloja audio. La columna audio_url
 * guarda el link público del set en la plataforma del DJ (SoundCloud /
 * YouTube / Mixcloud); la reproducción se incrusta desde esa plataforma.
 */
export async function createEvent(uid, { title, description, setUrl, photoFile }, onProgress) {
  const parsed = parseSetUrl(setUrl)
  if (!parsed) throw new Error(t('event.invalidLink'))
  if (photoFile) {
    if (!photoFile.type.startsWith('image/'))
      throw new Error(t('demo.photoNotImage'))
  }
  let photo_url = null
  if (photoFile) {
    // Compresor de fotos: se achica antes de subir
    const compressed = await compressImage(photoFile)
    if (compressed.size > MAX_IMAGE_BYTES)
      throw new Error(t('demo.photoTooBig'))
    const photoPath = `${uid}/${crypto.randomUUID()}.webp`
    photo_url = await uploadWithProgress('event-photos', photoPath, compressed, (p) =>
      onProgress ? onProgress(p) : undefined,
    )
  }
  const { data, error } = await supabase
    .from('events')
    .insert({
      user_id: uid,
      title: (title || '').trim() || t('demo.untitled'),
      description: (description || '').trim(),
      photo_url,
      audio_url: parsed.url,
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
 * Actualiza un set ya publicado: título, descripción, foto y el link
 * externo del set (con el sistema nuevo el link sí se puede cambiar:
 * es la vía para migrar los sets del sistema viejo).
 */
export async function updateEvent(
  uid,
  id,
  { title, description, setUrl, photoFile, removePhoto },
  onProgress,
) {
  let audio_url
  if (setUrl !== undefined) {
    const parsed = parseSetUrl(setUrl)
    if (!parsed) throw new Error(t('event.invalidLink'))
    audio_url = parsed.url
  }
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
    // Compresor de fotos: se achica antes de subir
    const compressed = await compressImage(photoFile)
    if (compressed.size > MAX_IMAGE_BYTES) throw new Error(t('demo.photoTooBig'))
    const photoPath = `${uid}/${crypto.randomUUID()}.webp`
    photo_url = await uploadWithProgress('event-photos', photoPath, compressed, onProgress)
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
      ...(audio_url ? { audio_url } : {}),
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

/** Fecha local de hoy como 'YYYY-MM-DD' (para comparar con show_date). */
function todayYmd() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const SHOW_SELECT =
  'id, user_id, title, show_date, venue, city, flyer_url, created_at, profiles(username, avatar_url)'

function mapShow(s) {
  return {
    id: s.id,
    user_id: s.user_id,
    title: s.title,
    show_date: s.show_date,
    venue: s.venue || '',
    city: s.city || '',
    flyer_url: s.flyer_url || null,
    created_at: s.created_at,
    dj: s.profiles || { username: 'DJ', avatar_url: null },
  }
}

/** Agenda pública: solo eventos de hoy en adelante, ordenados por fecha. */
export async function listShows() {
  const { data, error } = await supabase
    .from('shows')
    .select(SHOW_SELECT)
    .gte('show_date', todayYmd())
    .order('show_date', { ascending: true })
    .order('created_at', { ascending: true })
    .limit(100)
  if (error) throw new Error(t('shows.loadError'))
  return (data || []).map(mapShow)
}

/** Todos los eventos de un usuario (incluye pasados, para su panel). */
export async function listShowsByUser(uid) {
  const { data, error } = await supabase
    .from('shows')
    .select('id, user_id, title, show_date, venue, city, flyer_url, created_at')
    .eq('user_id', uid)
    .order('show_date', { ascending: true })
    .limit(100)
  if (error) throw new Error(t('shows.loadError'))
  return (data || []).map((s) => ({ ...s, flyer_url: s.flyer_url || null }))
}

/** Publica un evento de la agenda: flyer (comprimido) + fila en shows. */
export async function createShow(uid, { title, showDate, venue, city, flyerFile }, onProgress) {
  if (!(title || '').trim()) throw new Error(t('show.needTitle'))
  if (!showDate) throw new Error(t('show.needDate'))
  if (!(city || '').trim()) throw new Error(t('show.needCity'))
  let flyer_url = null
  if (flyerFile) {
    if (!flyerFile.type.startsWith('image/')) throw new Error(t('demo.photoNotImage'))
    // Compresor de fotos: se achica antes de subir
    const compressed = await compressImage(flyerFile)
    if (compressed.size > MAX_IMAGE_BYTES) throw new Error(t('demo.photoTooBig'))
    const path = `${uid}/${crypto.randomUUID()}.webp`
    flyer_url = await uploadWithProgress('flyers', path, compressed, onProgress)
  }
  const { data, error } = await supabase
    .from('shows')
    .insert({
      user_id: uid,
      title: title.trim(),
      show_date: showDate,
      venue: (venue || '').trim(),
      city: (city || '').trim(),
      flyer_url,
    })
    .select()
    .single()
  if (error) throw new Error(t('show.publishError'))
  return data
}

/** Elimina un evento de la agenda: flyer del storage + fila. */
export async function deleteShow(uid, id) {
  const { data: sh, error: fetchError } = await supabase
    .from('shows')
    .select('flyer_url')
    .eq('id', id)
    .eq('user_id', uid)
    .maybeSingle()
  if (fetchError || !sh) throw new Error(t('shows.loadError'))
  const path = sh.flyer_url ? pathFromPublicUrl(sh.flyer_url, 'flyers') : null
  if (path) {
    try {
      await supabase.storage.from('flyers').remove([path])
    } catch {
      /* sigue igual */
    }
  }
  const { error } = await supabase.from('shows').delete().eq('id', id).eq('user_id', uid)
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
