import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useLang } from '../context/LanguageContext'
import { toast } from '../lib/toast'

/**
 * Botón mínimo de instalación PWA (flechita de descarga).
 * - Si el navegador ofrece instalación (beforeinstallprompt), abre el diálogo.
 * - Si no, muestra las instrucciones manuales según el dispositivo.
 * - Se oculta si la app ya está instalada.
 */
export default function InstallButton() {
  const { t } = useLang()
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
      toast(t('install.done'), 'success')
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    try {
      if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)
    } catch {
      /* noop */
    }
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [t])

  if (installed) return null

  const handleClick = async () => {
    if (deferred) {
      deferred.prompt()
      try {
        const { outcome } = await deferred.userChoice
        if (outcome === 'accepted') setDeferred(null)
      } catch {
        /* noop */
      }
    } else {
      toast(t('install.manual'), 'info')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={t('install.label')}
      title={t('install.label')}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-night-card text-muted transition hover:border-[#00e065]/60 hover:text-[#00e065] hover:shadow-[0_0_16px_rgba(0,224,101,0.3)]"
    >
      <Download size={18} />
    </button>
  )
}
