/**
 * Humo de boliche: 2-3 manchas radiales difuminadas en violeta/azul que
 * derivan lentamente. Ambiente sutil, nunca protagonista.
 * - density="ambient": fondo general de la app, muy tenue.
 * - density="hero": detrás del hero / estado vacío, un poco más presente.
 * Respeta prefers-reduced-motion (el humo queda fijo) vía CSS.
 */
export default function SmokeBackground({ density = 'ambient' }) {
  const hero = density === 'hero'
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="smoke-blob smoke-a"
        style={{
          width: '55vmax',
          height: '55vmax',
          left: '-12vmax',
          top: '-14vmax',
          background: '#8B5CF6',
          opacity: hero ? 0.1 : 0.04,
        }}
      />
      <div
        className="smoke-blob smoke-b"
        style={{
          width: '48vmax',
          height: '48vmax',
          right: '-10vmax',
          bottom: '-12vmax',
          background: '#3B82F6',
          opacity: hero ? 0.08 : 0.03,
        }}
      />
      <div
        className="smoke-blob smoke-a"
        style={{
          width: '34vmax',
          height: '34vmax',
          left: '38%',
          top: '28%',
          background: '#7C3AED',
          opacity: hero ? 0.06 : 0.02,
          animationDelay: '-12s',
        }}
      />
    </div>
  )
}
