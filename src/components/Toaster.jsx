import { useEffect, useState } from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'

/** Avisos flotantes minimalistas (arriba de la barra del reproductor). */
export default function Toaster() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const onToast = (e) => {
      const item = e.detail
      setItems((prev) => [...prev.slice(-2), item])
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.id !== item.id))
      }, 3600)
    }
    window.addEventListener('up:toast', onToast)
    return () => window.removeEventListener('up:toast', onToast)
  }, [])

  const styles = {
    success: 'border-emerald-400/40 bg-white',
    error: 'border-red-400/40 bg-white',
    info: 'border-up/30 bg-night-card',
  }
  const icons = {
    success: <CheckCircle2 size={17} className="shrink-0 text-emerald-400" />,
    error: <AlertCircle size={17} className="shrink-0 text-red-400" />,
    info: <Info size={17} className="shrink-0 text-up-light" />,
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex flex-col items-center gap-2 px-4">
      {items.map((i) => (
        <div
          key={i.id}
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-bold text-ink shadow-2xl shadow-black/50 backdrop-blur ${styles[i.type] || styles.info}`}
        >
          {icons[i.type] || icons.info}
          <span>{i.message}</span>
        </div>
      ))}
    </div>
  )
}
