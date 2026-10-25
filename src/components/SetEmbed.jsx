import { ExternalLink } from 'lucide-react'
import { parseSetUrl, isLegacyAudioUrl } from '../lib/setLink'
import { useLang } from '../context/LanguageContext'

/**
 * Reproductor de un set: incrusta el player OFICIAL de la plataforma donde
 * vive el set (SoundCloud / YouTube / Mixcloud). El audio nunca pasa por los
 * servidores de Up!. Si el set es del sistema viejo (archivo alojado por
 * nosotros), muestra el aviso de migración en vez de reproducirlo.
 */
export default function SetEmbed({ url, title }) {
  const { t } = useLang()
  const parsed = parseSetUrl(url)

  if (parsed) {
    const common = {
      src: parsed.embedUrl,
      title: title || 'Set',
      loading: 'lazy',
      allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen',
      allowFullScreen: true,
    }
    if (parsed.platform === 'youtube') {
      return (
        <div className="aspect-video w-full bg-night-alt">
          <iframe {...common} className="h-full w-full border-0" />
        </div>
      )
    }
    if (parsed.platform === 'soundcloud') {
      return (
        <iframe
          {...common}
          height={166}
          scrolling="no"
          frameBorder="no"
          className="w-full border-0 bg-night-alt"
        />
      )
    }
    return (
      <iframe
        {...common}
        height={120}
        frameBorder="0"
        className="w-full border-0 bg-night-alt"
      />
    )
  }

  if (isLegacyAudioUrl(url)) {
    return (
      <div className="border border-dashed border-clay-deep bg-night-alt px-4 py-5 text-center">
        <p className="text-sm font-extrabold text-ink">{t('embed.migrating')}</p>
        <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted">
          {t('embed.migratingText')}
        </p>
      </div>
    )
  }

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-[52px] items-center justify-center gap-2 bg-[#00E065] px-4 py-3 text-sm font-extrabold text-night transition hover:brightness-105"
      >
        {t('embed.listen')}
        <ExternalLink size={16} />
      </a>
    )
  }

  return null
}
