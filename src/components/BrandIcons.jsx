/**
 * Íconos de plataformas de música (lucide-react eliminó los íconos de marcas).
 * SVG 24x24 con `currentColor`: el color oficial de cada marca lo pone el
 * contenedor (text-[#FF5500] SoundCloud, text-[#FF0000] YouTube,
 * text-[#5000FF] Mixcloud), porque las redes van SIEMPRE en sus colores
 * originales de marca.
 */

export function SoundCloudIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <rect x="1.5" y="10" width="1.8" height="5" rx="0.9" />
      <rect x="4.2" y="8" width="1.8" height="9" rx="0.9" />
      <rect x="6.9" y="9.5" width="1.8" height="7.5" rx="0.9" />
      <rect x="9.6" y="7" width="1.8" height="10" rx="0.9" />
      <path d="M13 17.2V7.6c.6-.3 1.3-.5 2-.5 2.3 0 4.2 1.7 4.6 3.9.3-.1.6-.1.9-.1 1.9 0 3.5 1.6 3.5 3.5S22.4 17.9 20.5 17.9c-.2 0-.4 0-.6-.1H13z" transform="scale(0.92) translate(0.6 0.8)" />
    </svg>
  )
}

export function YouTubeIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function MixcloudIcon({ size = 18, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.5 19a4.5 4.5 0 1 0-.42-8.98 6 6 0 1 0-10.4 6.63A3.5 3.5 0 0 0 7.5 19h10z" />
      <path d="M9 15.5v-3M12 15.5V9.8M15 15.5v-4.5" />
    </svg>
  )
}
