import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import {
  BookOpenText,
  ChevronRight,
  Disc3,
  Download,
  Globe,
  MessageCircle,
  SlidersHorizontal,
} from 'lucide-react'
import InstagramIcon from '../components/InstagramIcon'
import { SoundCloudIcon, YouTubeIcon, MixcloudIcon } from '../components/BrandIcons'
import SetEmbed from '../components/SetEmbed'
import ShareButton from '../components/ShareButton'
import { useLang } from '../context/LanguageContext'
import { buildWaUrl, buildInstagramUrl, sanitizeInstagram } from '../lib/format'
import * as data from '../lib/data'

/** URL de plataforma: acepta URL completa o usuario/handle suelto. */
function platformUrl(base, value) {
  const v = String(value || '').trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  if (!base) return `https://${v.replace(/^\/+/, '')}`
  return `${base}/${v.replace(/^@/, '').replace(/^\/+/, '')}`
}

function socialLinks(bio) {
  const links = []
  const ig = buildInstagramUrl(bio.instagram)
  if (ig) {
    links.push({
      id: 'instagram',
      label: 'Instagram',
      href: ig,
      color: 'text-[#C13584]',
      border: 'border-[#E1306C]/40 hover:bg-[#E1306C]/10',
      Icon: InstagramIcon,
      printText: `Instagram: @${sanitizeInstagram(bio.instagram)}`,
    })
  }
  const sc = platformUrl('https://soundcloud.com', bio.soundcloud)
  if (sc) {
    links.push({
      id: 'soundcloud',
      label: 'SoundCloud',
      href: sc,
      color: 'text-[#FF5500]',
      border: 'border-[#FF5500]/40 hover:bg-[#FF5500]/10',
      Icon: SoundCloudIcon,
      printText: `SoundCloud: ${sc}`,
    })
  }
  const yt = platformUrl('https://youtube.com', bio.youtube)
  if (yt) {
    links.push({
      id: 'youtube',
      label: 'YouTube',
      href: yt,
      color: 'text-[#FF0000]',
      border: 'border-[#FF0000]/35 hover:bg-[#FF0000]/10',
      Icon: YouTubeIcon,
      printText: `YouTube: ${yt}`,
    })
  }
  const mc = platformUrl('https://mixcloud.com', bio.mixcloud)
  if (mc) {
    links.push({
      id: 'mixcloud',
      label: 'Mixcloud',
      href: mc,
      color: 'text-[#5000FF]',
      border: 'border-[#5000FF]/35 hover:bg-[#5000FF]/10',
      Icon: MixcloudIcon,
      printText: `Mixcloud: ${mc}`,
    })
  }
  const web = platformUrl('', bio.web)
  if (web) {
    links.push({
      id: 'web',
      label: 'Web',
      href: web,
      color: 'text-ink',
      border: 'border-clay-deep/60 hover:bg-clay-soft',
      Icon: Globe,
      printText: `Web: ${web}`,
    })
  }
  return links
}

/**
 * Hoja de prensa de UNA página: solo se ve al imprimir (portal fuera de #root;
 * el CSS de impresión oculta la app y muestra esta hoja). Sin reproductores:
 * el set va como link en texto, listo para papel o PDF.
 */
function PrintSheet({ bio, links, waUrl, t }) {
  return createPortal(
    <div className="bio-print-sheet" aria-hidden="true">
      <div style={{ fontFamily: 'Georgia, serif', color: '#111', maxWidth: '640px', margin: '0 auto' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', margin: 0 }}>
          up<span style={{ color: '#00A854' }}>!</span> — {t('bios.pressKit')}
        </p>
        {bio.foto_url && (
          <img
            src={bio.foto_url}
            alt={bio.nombre}
            style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', marginTop: '14px' }}
          />
        )}
        <h1 style={{ fontSize: '38px', lineHeight: 1.05, margin: '16px 0 4px', fontWeight: 900 }}>
          {bio.nombre}
        </h1>
        {bio.ciudad && (
          <p style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 10px' }}>{bio.ciudad}</p>
        )}
        {bio.bio && <p style={{ fontSize: '14px', lineHeight: 1.55, margin: '0 0 14px' }}>{bio.bio}</p>}
        {bio.set_url && (
          <p style={{ fontSize: '13px', margin: '0 0 6px' }}>
            <strong>{t('bios.listenAt')}:</strong> {bio.set_url}
          </p>
        )}
        {links.map((l) => (
          <p key={l.id} style={{ fontSize: '13px', margin: '0 0 4px' }}>{l.printText}</p>
        ))}
        {waUrl && (
          <p style={{ fontSize: '13px', margin: '10px 0 4px' }}>
            <strong>{t('bios.booking')}:</strong> WhatsApp {bio.whatsapp}
          </p>
        )}
        {bio.rider && (
          <p style={{ fontSize: '13px', margin: '0 0 4px' }}>
            <strong>{t('bios.rider')}:</strong> {bio.rider}
          </p>
        )}
        <p style={{ fontSize: '11px', color: '#555', marginTop: '18px', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
          {t('bios.curatedBy')} · up-dj.vercel.app/bio/{bio.slug}
        </p>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Ficha pública de Biografía (/bio/:slug): el PRESS KIT vivo del DJ.
 * Foto-galería, nombre + ciudad, un párrafo, UN set que suena adentro
 * (reproductor oficial), redes en sus colores de marca, contrataciones,
 * rider, descargar ficha y compartir. URL propia y permanente.
 */
export default function BioPage({ user, onAuthClick }) {
  const { slug } = useParams()
  const { t } = useLang()
  const [bio, setBio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [photoIdx, setPhotoIdx] = useState(0)
  const galleryRef = useRef(null)
  const [followed, setFollowed] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setNotFound(false)
    setPhotoIdx(0)
    data
      .getBioBySlug(slug)
      .then(async (b) => {
        if (!alive) return
        if (!b) {
          setNotFound(true)
          return
        }
        setBio(b)
        if (b.user_id) {
          const [countsMap, follows] = await Promise.all([
            data.getFollowerCounts([b.user_id]).catch(() => ({})),
            user?.id ? data.getMyFollows(user.id).catch(() => new Set()) : Promise.resolve(new Set()),
          ])
          if (!alive) return
          setFollowerCount(countsMap[b.user_id] || 0)
          setFollowed(follows.has(b.user_id))
        }
      })
      .catch(() => {
        if (alive) setNotFound(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [slug, user?.id])

  // Mientras la ficha está montada, el cuerpo marca que hay hoja imprimible.
  useEffect(() => {
    document.body.classList.add('bio-printing')
    return () => document.body.classList.remove('bio-printing')
  }, [])

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <p className="text-sm font-semibold text-muted">{t('profile.loading')}</p>
      </main>
    )
  }

  if (notFound || !bio) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <BookOpenText size={44} className="mx-auto text-muted" strokeWidth={1.4} />
        <h1 className="mt-4 font-display text-2xl font-extrabold text-ink">{t('bios.notFound')}</h1>
        <Link to="/" className="mt-6 inline-block font-bold text-up-light hover:underline">
          Up!
        </Link>
      </main>
    )
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const fichaUrl = `${origin}/bio/${encodeURIComponent(bio.slug)}`
  const waUrl = buildWaUrl(bio.whatsapp, t('bios.bookingMessage', { dj: bio.nombre }))
  const links = socialLinks(bio)
  const photos = bio.fotos.length ? bio.fotos : bio.foto_url ? [bio.foto_url] : []
  const isOwn = !!user && !!bio.user_id && user.id === bio.user_id

  const handleGalleryScroll = () => {
    const el = galleryRef.current
    if (!el || !el.clientWidth) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    if (idx !== photoIdx) setPhotoIdx(idx)
  }

  const goToPhoto = (idx) => {
    const el = galleryRef.current
    if (!el) return
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    setPhotoIdx(idx)
  }

  const handleFollow = async () => {
    if (!user) {
      onAuthClick?.('login')
      return
    }
    if (following || isOwn || !bio.user_id) return
    setFollowing(true)
    try {
      await data.toggleFollow(user.id, bio.user_id, followed)
      setFollowed(!followed)
      setFollowerCount((c) => Math.max(0, c + (followed ? -1 : 1)))
    } catch {
      /* noop */
    } finally {
      setFollowing(false)
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-20 pt-8">
      {/* Encabezado press kit: etiqueta + compartir prominente */}
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.22em] text-muted">
          <BookOpenText size={15} className="text-[#00884D]" />
          {t('dock.bios')} · {t('bios.pressKit')}
        </p>
        <ShareButton
          title={bio.nombre}
          text={t('share.bioText', { dj: bio.nombre })}
          url={fichaUrl}
          label={t('share.share')}
          className="rounded-full border border-clay bg-night-card px-3 text-ink shadow-[0_2px_10px_rgba(0,0,0,0.06)]"
        />
      </div>

      {/* Galería de fotos: deslizable, puntitos abajo */}
      {photos.length > 0 && (
        <div className="mt-5">
          <div
            ref={galleryRef}
            onScroll={handleGalleryScroll}
            className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl border border-clay bg-night-alt [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((src, i) => (
              <img
                key={`${src}-${i}`}
                src={src}
                alt={bio.nombre}
                loading={i === 0 ? 'eager' : 'lazy'}
                className="aspect-[4/3] w-full shrink-0 snap-center object-cover"
              />
            ))}
          </div>
          {photos.length > 1 && (
            <div className="mt-1 flex items-center justify-center">
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToPhoto(i)}
                  aria-label={`${i + 1} / ${photos.length}`}
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center"
                >
                  <span
                    className={`h-2 rounded-full transition-all ${
                      i === photoIdx ? 'w-6 bg-[#00E065]' : 'w-2 bg-clay-deep'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nombre + ciudad */}
      <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className="font-display text-4xl font-black leading-none tracking-tight text-ink sm:text-5xl">
          {bio.nombre}
        </h1>
        {bio.ciudad && (
          <span className="rounded-full bg-[#00E065] px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-night shadow-[0_0_18px_rgba(0,224,101,0.45)]">
            {bio.ciudad}
          </span>
        )}
      </div>

      {followerCount > 0 && (
        <p className="mt-2 text-sm font-semibold text-muted">
          {followerCount} {t('profile.followers')}
        </p>
      )}

      {/* Un solo párrafo de bio */}
      {bio.bio && (
        <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed text-[#3D3D45]">
          {bio.bio}
        </p>
      )}

      {/* Rider técnico: una línea tranquila */}
      {bio.rider && (
        <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-muted">
          <SlidersHorizontal size={16} className="mt-0.5 shrink-0 text-[#00884D]" />
          <span>
            {t('bios.rider')}: {bio.rider}
          </span>
        </p>
      )}

      {/* UN set destacado, sonando adentro */}
      {bio.set_url && (
        <section className="mt-7" aria-label={t('bios.featuredSet')}>
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted">
            <Disc3 size={15} className="text-[#00884D]" />
            {bio.set_titulo || t('bios.featuredSet')}
          </h2>
          <div className="mt-3 overflow-hidden rounded-2xl border border-clay bg-night-card shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            <SetEmbed url={bio.set_url} title={bio.set_titulo || bio.nombre} />
          </div>
        </section>
      )}

      {/* Redes en sus colores originales de marca */}
      {links.length > 0 && (
        <div className="mt-7 flex flex-wrap gap-2.5">
          {links.map(({ id, label, href, color, border, Icon }) => (
            <a
              key={id}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex min-h-[44px] items-center gap-2 rounded-full border bg-night-card px-4 py-2 text-sm font-bold transition ${border} ${color}`}
            >
              <Icon size={18} />
              {label}
            </a>
          ))}
        </div>
      )}

      {/* Utilidades del press kit: contrataciones + descargar ficha */}
      <div className="mt-6 flex flex-wrap gap-2.5">
        {waUrl && (
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-[44px] items-center gap-2 rounded-full border border-[#00E065]/40 px-4 py-2 text-sm font-bold text-[#00884D] transition hover:bg-[#00E065]/10"
          >
            <MessageCircle size={16} />
            {t('bios.booking')}
          </a>
        )}
        <button
          type="button"
          onClick={() => window.print()}
          className="flex min-h-[44px] items-center gap-2 rounded-full border border-clay-deep/60 bg-night-card px-4 py-2 text-sm font-bold text-ink transition hover:bg-clay-soft"
        >
          <Download size={16} />
          {t('bios.download')}
        </button>
      </div>

      {/* Seguir, al final (solo si el DJ está registrado en Up!) */}
      {bio.user_id && !isOwn && (
        <div className="mt-10 flex items-center justify-between border-t border-clay pt-5">
          <p className="text-sm font-semibold text-muted">{t('bios.curatedBy')}</p>
          <button
            onClick={handleFollow}
            className={`min-h-[44px] rounded-full px-5 py-2 text-sm font-bold transition active:scale-95 ${
              followed
                ? 'border border-[#00E065]/40 bg-[#00E065]/10 text-[#00884D]'
                : 'bg-ink text-white shadow-[0_2px_12px_rgba(0,0,0,0.25)] hover:opacity-90'
            }`}
          >
            {followed ? t('card.following') : t('card.follow')}
          </button>
        </div>
      )}

      <Link
        to="/"
        className="mt-8 inline-flex min-h-[44px] items-center gap-1 text-sm font-bold text-muted transition hover:text-ink"
      >
        Up!
        <ChevronRight size={15} />
        {t('dock.bios')}
      </Link>

      <PrintSheet bio={bio} links={links} waUrl={waUrl} t={t} />
    </main>
  )
}
