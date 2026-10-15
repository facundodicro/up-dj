import { useState } from 'react'
import { Share2, Loader2 } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { toast } from '../lib/toast'

/**
 * Botón compartir: en el celu abre el menú nativo (WhatsApp, Instagram, …);
 * donde no hay Web Share API, copia el enlace y avisa con un toast.
 */
export default function ShareButton({ title, text, url, className = '', label }) {
  const { t } = useLang()
  const [busy, setBusy] = useState(false)

  const handleShare = async () => {
    if (busy) return
    setBusy(true)
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({ title, text, url })
        return
      }
      const link = url || window.location.href
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(link)
      } else {
        const ta = document.createElement('textarea')
        ta.value = link
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      toast(t('share.copied'), 'success')
    } catch {
      /* el usuario canceló el menú nativo: no hacer nada */
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label={label || t('share.share')}
      title={label || t('share.share')}
      className={`flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-extrabold text-muted/60 transition hover:text-up-light ${className}`}
    >
      {busy ? <Loader2 size={19} className="animate-spin" /> : <Share2 size={19} />}
      {label && <span>{label}</span>}
    </button>
  )
}
