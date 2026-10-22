/**
 * Dock flotante de secciones: Música · Eventos · Biografías.
 * Minimalista, texto negro; la sección activa lleva la barrita verde #00E065
 * (el mismo idioma de los filtros del feed). Si el reproductor está visible,
 * el dock se eleva para no pisarlo.
 */
const SECTIONS = [
  { id: 'musica', label: 'dock.musica' },
  { id: 'eventos', label: 'dock.eventos' },
  { id: 'bios', label: 'dock.bios' },
]

export default function Dock({ section, onChange, raised, t }) {
  return (
    <nav
      aria-label="Secciones"
      className={`fixed inset-x-0 z-30 flex justify-center px-4 transition-all duration-300 ${
        raised ? 'bottom-[118px]' : 'bottom-5'
      }`}
    >
      <div className="flex items-center gap-2 rounded-full border border-clay bg-white/92 px-2.5 py-2 shadow-[0_10px_36px_rgba(60,40,20,0.20)] backdrop-blur-md">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange(s.id)}
            aria-current={section === s.id ? 'page' : undefined}
            className={`relative min-h-[40px] rounded-full px-4 py-2 text-sm transition ${
              section === s.id
                ? 'font-extrabold text-ink'
                : 'font-semibold text-muted hover:text-ink'
            }`}
          >
            {t(s.label)}
            {section === s.id && (
              <span className="absolute inset-x-4 -bottom-0.5 h-1 rounded-full bg-[#00E065]" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
