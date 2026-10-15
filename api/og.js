/**
 * Open Graph para crawlers (WhatsApp, X/Twitter, Telegram, Discord, Slack...).
 *
 * Esos bots no ejecutan JavaScript, así que no ven el contenido de la SPA.
 * vercel.json reescribe /set/:id y /dj/:username hacia acá SOLO cuando el
 * user-agent es de un bot; esta función devuelve un HTML mínimo con los
 * meta tags og: para que el link compartido muestre portada, título y DJ.
 * Los humanos nunca llegan acá (ven la SPA normal).
 * v2: redeploy para tomar env vars de producción.
 */

const SITE = 'https://up-dj.vercel.app'
const FALLBACK_IMG = `${SITE}/icons/icon-512.png`

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function sb(path) {
  const base = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!base || !key) return null
  const r = await fetch(`${base}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!r.ok) return null
  const j = await r.json()
  return Array.isArray(j) ? j[0] ?? null : j
}

function htmlPage({ title, description, image, canonical }) {
  const t = esc(title)
  const d = esc(description)
  const img = esc(image)
  const url = esc(canonical)
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>${t} — Up!</title>
<meta name="description" content="${d}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Up!">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${img}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${img}">
<script>window.location.replace(${JSON.stringify(canonical)});</script>
</head>
<body style="font-family:system-ui,sans-serif;text-align:center;padding:3rem">
<p>Abriendo en Up!… <a href="${url}">${t}</a></p>
</body>
</html>`
}

export default async function handler(req, res) {
  const { type, id, u } = req.query || {}

  try {
    if (type === 'set' && id) {
      const e = await sb(
        `events?select=id,title,description,photo_url,profiles(username,avatar_url)&id=eq.${encodeURIComponent(id)}`,
      )
      if (!e) throw new Error('not found')
      const dj = e.profiles?.username || 'DJ'
      return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(
        htmlPage({
          title: `${e.title} — ${dj}`,
          description: e.description || `Escuchá el set "${e.title}" de ${dj} en Up!`,
          image: e.photo_url || e.profiles?.avatar_url || FALLBACK_IMG,
          canonical: `${SITE}/set/${e.id}`,
        }),
      )
    }

    if (type === 'dj' && u) {
      const p = await sb(
        `profiles?select=id,username,avatar_url,bio&username=ilike.${encodeURIComponent(u)}`,
      )
      if (!p) throw new Error('not found')
      return res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8').send(
        htmlPage({
          title: p.username,
          description: p.bio || `Seguí a ${p.username} y escuchá sus sets en Up!`,
          image: p.avatar_url || FALLBACK_IMG,
          canonical: `${SITE}/dj/${encodeURIComponent(p.username)}`,
        }),
      )
    }

    throw new Error('bad request')
  } catch {
    // Si algo falla, devolver la home: mejor un link pelado que un error.
    return res.redirect(302, SITE)
  }
}
