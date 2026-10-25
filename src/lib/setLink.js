/**
 * Sets por link externo: Up! NO aloja audio. El set vive en la cuenta del DJ
 * en SoundCloud, YouTube o Mixcloud y se escucha con el reproductor oficial
 * de esa plataforma, incrustado en la ficha del set. Este módulo valida los
 * links aceptados y construye la URL del reproductor embebible.
 */

const YT_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
])
const SC_HOSTS = new Set([
  'soundcloud.com',
  'www.soundcloud.com',
  'm.soundcloud.com',
  'on.soundcloud.com',
])
const MC_HOSTS = new Set(['mixcloud.com', 'www.mixcloud.com'])

export const PLATFORM_LABELS = {
  youtube: 'YouTube',
  soundcloud: 'SoundCloud',
  mixcloud: 'Mixcloud',
}

function youtubeId(u) {
  if (u.hostname === 'youtu.be') {
    const id = u.pathname.slice(1).split('/')[0]
    return id || null
  }
  if (!YT_HOSTS.has(u.hostname)) return null
  if (u.pathname === '/watch') return u.searchParams.get('v')
  const m = u.pathname.match(/^\/(?:shorts|live|embed|v)\/([\w-]{6,})/)
  return m ? m[1] : null
}

/**
 * Valida un link de set y devuelve { platform, url, embedUrl } o null si no
 * es un link público válido de SoundCloud, YouTube o Mixcloud.
 */
export function parseSetUrl(raw) {
  let u
  try {
    u = new URL(String(raw || '').trim())
  } catch {
    return null
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  const host = u.hostname.toLowerCase()
  const url = u.toString()
  const segments = u.pathname.split('/').filter(Boolean)

  const ytId = youtubeId(u)
  if (ytId) {
    return {
      platform: 'youtube',
      url,
      embedUrl: `https://www.youtube-nocookie.com/embed/${ytId}`,
    }
  }
  if (SC_HOSTS.has(host) && segments.length >= 1) {
    return {
      platform: 'soundcloud',
      url,
      embedUrl:
        'https://w.soundcloud.com/player/?url=' +
        encodeURIComponent(url) +
        '&color=%2300e065&auto_play=false&hide_related=true&show_comments=false' +
        '&show_user=true&show_reposts=false&show_teaser=false&visual=false',
    }
  }
  if (MC_HOSTS.has(host) && segments.length >= 2) {
    return {
      platform: 'mixcloud',
      url,
      embedUrl:
        'https://www.mixcloud.com/widget/iframe/?hide_cover=1&light=1&feed=' +
        encodeURIComponent(u.pathname),
    }
  }
  return null
}

export function isSupportedSetUrl(raw) {
  return parseSetUrl(raw) !== null
}

/**
 * URL de audio del sistema viejo: el archivo estaba alojado en nuestro
 * propio Storage. Esos sets ya no se reproducen: quedan "en migración"
 * hasta que el DJ pegue el link de su plataforma.
 */
export function isLegacyAudioUrl(raw) {
  return typeof raw === 'string' && raw.includes('/storage/v1/object/public/')
}
