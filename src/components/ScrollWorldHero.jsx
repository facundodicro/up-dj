import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useLang } from '../context/LanguageContext'
import DonateButton from './DonateButton'

/**
 * Héroe 3D de Up!: un mundo neón que la cámara recorre a medida que
 * se hace scroll, con paneles de texto superpuestos.
 *
 * - Se importa con React.lazy: three.js no pesa en la carga inicial.
 * - Pausa el render cuando el héroe sale de pantalla.
 * - Respeta prefers-reduced-motion (muestra una vista fija).
 * - Si WebGL no está disponible, muestra el héroe compacto clásico.
 */
export default function ScrollWorldHero({ user, onUploadClick, onRegisterClick }) {
  const { t } = useLang()
  const wrapRef = useRef(null)
  const stickyRef = useRef(null)
  const hostRef = useRef(null)
  const progressRef = useRef(null)
  const hintRef = useRef(null)
  const ctaRef = useRef(null)
  const panelRefs = useRef([])
  const [failed, setFailed] = useState(false)

  const panels = [
    { e: t('scroll3d.p0e'), title: t('scroll3d.p0t'), sub: t('scroll3d.p0s') },
    { e: t('scroll3d.p1e'), title: t('scroll3d.p1t'), sub: t('scroll3d.p1s') },
    { e: t('scroll3d.p2e'), title: t('scroll3d.p2t'), sub: t('scroll3d.p2s') },
    { e: t('scroll3d.p3e'), title: t('scroll3d.p3t'), sub: t('scroll3d.p3s') },
    { e: t('scroll3d.p4e'), title: t('scroll3d.p4t'), sub: '', cta: true },
  ]

  useEffect(() => {
    const wrap = wrapRef.current
    const sticky = stickyRef.current
    const host = hostRef.current
    if (!wrap || !sticky || !host) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
    } catch (e) {
      setFailed(true)
      return
    }

    const GREEN = 0x00e065
    const VIOLET = 0x8b5cf6
    const BLUE = 0x3b82f6
    const BG = 0x05050c

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    const fit = () => {
      const w = sticky.clientWidth || 1
      const h = sticky.clientHeight || 1
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(BG)
    scene.fog = new THREE.FogExp2(BG, 0.02)
    const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 500)
    fit()
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    renderer.domElement.style.display = 'block'
    host.appendChild(renderer.domElement)

    scene.add(new THREE.AmbientLight(0x8899bb, 0.55))
    const pl1 = new THREE.PointLight(VIOLET, 900, 60)
    pl1.position.set(16, 8, -6)
    scene.add(pl1)
    const pl2 = new THREE.PointLight(GREEN, 900, 60)
    pl2.position.set(0, 8, -24)
    scene.add(pl2)
    const pl3 = new THREE.PointLight(BLUE, 900, 70)
    pl3.position.set(-10, 8, -34)
    scene.add(pl3)

    /* ---------- helpers ---------- */
    function textTexture(
      text,
      { size = 160, color = '#00E065', font = '800 160px Arial', glow = 36, glowColor = 'rgba(0,224,101,0.9)', pad = 60 } = {},
    ) {
      const c = document.createElement('canvas')
      const g = c.getContext('2d')
      g.font = font
      const w = Math.ceil(g.measureText(text).width) + pad * 2
      c.width = w
      c.height = size + pad * 2
      const g2 = c.getContext('2d')
      g2.font = font
      g2.textAlign = 'center'
      g2.textBaseline = 'middle'
      g2.shadowColor = glowColor
      g2.shadowBlur = glow
      g2.fillStyle = color
      g2.fillText(text, c.width / 2, c.height / 2)
      g2.shadowBlur = 0
      g2.fillText(text, c.width / 2, c.height / 2)
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 4
      return { tex, aspect: c.width / c.height }
    }
    function glowTexture() {
      const c = document.createElement('canvas')
      c.width = c.height = 128
      const g = c.getContext('2d')
      const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
      gr.addColorStop(0, 'rgba(255,255,255,1)')
      gr.addColorStop(0.35, 'rgba(255,255,255,.35)')
      gr.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = gr
      g.fillRect(0, 0, 128, 128)
      const tex = new THREE.CanvasTexture(c)
      tex.colorSpace = THREE.SRGBColorSpace
      return tex
    }
    const GLOW = glowTexture()
    function glowSprite(color, scale, opacity = 0.55) {
      const m = new THREE.SpriteMaterial({
        map: GLOW,
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const s = new THREE.Sprite(m)
      s.scale.set(scale, scale, 1)
      return s
    }
    const neonMat = (color) =>
      new THREE.MeshStandardMaterial({ color: 0x0a0a12, emissive: color, emissiveIntensity: 2.2, roughness: 0.4 })
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111118, roughness: 0.6, metalness: 0.4 })

    /* ---------- suelo + estrellas ---------- */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: 0x07070e, roughness: 1 }),
    )
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)
    const grid = new THREE.GridHelper(320, 80, VIOLET, 0x1c1c34)
    grid.position.y = 0.02
    grid.material.transparent = true
    grid.material.opacity = 0.32
    scene.add(grid)
    {
      const n = 700
      const pos = new Float32Array(n * 3)
      const col = new Float32Array(n * 3)
      const palette = [
        [0, 0.88, 0.4],
        [0.55, 0.36, 0.98],
        [0.23, 0.51, 0.96],
        [1, 1, 1],
      ]
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 260
        pos[i * 3 + 1] = Math.random() * 70 + 2
        pos[i * 3 + 2] = 40 - Math.random() * 140
        const p = palette[(Math.random() * palette.length) | 0]
        const b = 0.35 + Math.random() * 0.65
        col[i * 3] = p[0] * b
        col[i * 3 + 1] = p[1] * b
        col[i * 3 + 2] = p[2] * b
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
      g.setAttribute('color', new THREE.BufferAttribute(col, 3))
      scene.add(
        new THREE.Points(
          g,
          new THREE.PointsMaterial({
            size: 0.55,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        ),
      )
    }

    /* ---------- escena 1: monumento up! ---------- */
    const logoGroup = new THREE.Group()
    logoGroup.position.set(0, 5, 10)
    scene.add(logoGroup)
    {
      const { tex, aspect } = textTexture('up!', { size: 200, color: '#00E065' })
      const h = 6
      const w = h * aspect
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }),
      )
      logoGroup.add(m)
      logoGroup.add(glowSprite(GREEN, 22, 0.35))
      const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.09, 12, 90), neonMat(VIOLET))
      logoGroup.add(ring)
      logoGroup.userData.ring = ring
    }

    /* ---------- escena 2: cabina DJ ---------- */
    const booth = new THREE.Group()
    booth.position.set(16, 0, -6)
    booth.rotation.y = -0.5
    scene.add(booth)
    const eqBars = []
    let vinyl
    {
      const table = new THREE.Mesh(new THREE.BoxGeometry(9, 1.1, 4), darkMat)
      table.position.y = 0.55
      booth.add(table)
      const edge = new THREE.Mesh(new THREE.BoxGeometry(9.2, 0.12, 4.2), neonMat(GREEN))
      edge.position.y = 1.14
      booth.add(edge)
      for (const sx of [-2.2, 2.2]) {
        const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 0.25, 40), darkMat)
        deck.position.set(sx, 1.32, 0)
        booth.add(deck)
        const rec = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.42, 14, 44), neonMat(VIOLET))
        rec.rotation.x = Math.PI / 2
        rec.position.set(sx, 1.5, 0)
        booth.add(rec)
        if (sx < 0) vinyl = rec
        const label = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.3, 24), neonMat(GREEN))
        label.position.set(sx, 1.5, 0)
        booth.add(label)
      }
      const mixer = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.3, 3.2), darkMat)
      mixer.position.set(0, 1.32, 0)
      booth.add(mixer)
      const barGeo = new THREE.BoxGeometry(0.32, 1, 0.32)
      barGeo.translate(0, 0.5, 0)
      for (let i = 0; i < 26; i++) {
        const col = i % 3 === 0 ? GREEN : i % 3 === 1 ? VIOLET : BLUE
        const b = new THREE.Mesh(barGeo, neonMat(col))
        b.position.set(-6 + i * 0.48, 1.2, -3.4)
        b.userData.ph = i * 0.7
        b.userData.sp = 2.2 + (i % 5) * 0.5
        booth.add(b)
        eqBars.push(b)
      }
      for (const sx of [-4.5, 4.5]) {
        const cone = new THREE.Mesh(
          new THREE.ConeGeometry(2.6, 9, 20, 1, true),
          new THREE.MeshBasicMaterial({
            color: sx < 0 ? VIOLET : GREEN,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        )
        cone.position.set(sx, 6, 0)
        booth.add(cone)
        const bulb = glowSprite(sx < 0 ? VIOLET : GREEN, 5, 0.6)
        bulb.position.set(sx, 10.6, 0)
        booth.add(bulb)
      }
    }

    /* ---------- escena 3: túnel de subida ---------- */
    const tunnel = new THREE.Group()
    scene.add(tunnel)
    const rings = []
    {
      for (let i = 0; i < 9; i++) {
        const r = new THREE.Mesh(new THREE.TorusGeometry(6.2, 0.13, 12, 72), neonMat(i % 2 ? VIOLET : GREEN))
        r.position.set(0, 3, -16 - i * 1.9)
        tunnel.add(r)
        rings.push(r)
      }
      const barGeo = new THREE.BoxGeometry(0.28, 1, 0.28)
      barGeo.translate(0, 0.5, 0)
      for (let i = 0; i < 40; i++) {
        const b = new THREE.Mesh(barGeo, neonMat(i % 2 ? BLUE : GREEN))
        const a = Math.random() * Math.PI * 2
        const rr = 3.5 + Math.random() * 2
        b.position.set(Math.cos(a) * rr, 3 + (Math.random() - 0.5) * 4, -16 - Math.random() * 15)
        b.userData.ph = Math.random() * 6.28
        b.userData.sp = 3 + Math.random() * 3
        tunnel.add(b)
        eqBars.push(b)
      }
      const arrow = new THREE.Group()
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.2, 16), neonMat(GREEN))
      const head = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 20), neonMat(GREEN))
      head.position.y = 1.9
      arrow.add(shaft, head)
      arrow.position.set(0, 6.5, -24)
      tunnel.add(arrow)
      tunnel.userData.arrow = arrow
      const halo = glowSprite(GREEN, 10, 0.4)
      halo.position.copy(arrow.position)
      tunnel.add(halo)
    }

    /* ---------- escena 4: multitud de fans ---------- */
    const crowd = new THREE.Group()
    crowd.position.set(-10, 0, -34)
    scene.add(crowd)
    const fans = []
    {
      const bodyGeo = new THREE.CylinderGeometry(0.42, 0.55, 1.5, 10)
      const headGeo = new THREE.SphereGeometry(0.42, 16, 14)
      const cols = [VIOLET, GREEN, BLUE, 0xffffff]
      for (let i = 0; i < 38; i++) {
        const col = cols[i % cols.length]
        const g = new THREE.Group()
        const body = new THREE.Mesh(
          bodyGeo,
          new THREE.MeshStandardMaterial({ color: 0x0c0c16, emissive: col, emissiveIntensity: 0.55, roughness: 0.7 }),
        )
        body.position.y = 0.75
        g.add(body)
        const head = new THREE.Mesh(
          headGeo,
          new THREE.MeshStandardMaterial({ color: 0x11111c, emissive: col, emissiveIntensity: 0.9, roughness: 0.5 }),
        )
        head.position.y = 1.95
        g.add(head)
        if (i % 3 === 0) {
          const hp = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 10, 24), neonMat(GREEN))
          hp.position.y = 1.95
          hp.rotation.y = Math.PI / 2.4
          g.add(hp)
        }
        const a = Math.random() * Math.PI * 2
        const rr = 2.5 + Math.random() * 7
        g.position.set(Math.cos(a) * rr, 0, Math.sin(a) * rr * 0.7)
        g.userData = { ph: Math.random() * 6.28, sp: 1.5 + Math.random() * 2, base: g.position.y }
        crowd.add(g)
        fans.push(g)
      }
      for (const sx of [-7, 7]) {
        const beam = new THREE.Mesh(
          new THREE.ConeGeometry(3, 12, 20, 1, true),
          new THREE.MeshBasicMaterial({
            color: sx < 0 ? BLUE : VIOLET,
            transparent: true,
            opacity: 0.09,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        )
        beam.position.set(sx, 7, 0)
        crowd.add(beam)
      }
    }

    /* ---------- escena 5: final ---------- */
    {
      const { tex, aspect } = textTexture('up!', { size: 220, color: '#00E065' })
      const h = 8
      const w = h * aspect
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }),
      )
      m.position.set(0, 6, -54)
      scene.add(m)
      const halo = glowSprite(GREEN, 30, 0.4)
      halo.position.set(0, 6, -55)
      scene.add(halo)
      const disc = new THREE.Mesh(new THREE.TorusGeometry(11, 0.14, 12, 90), neonMat(VIOLET))
      disc.rotation.x = Math.PI / 2
      disc.position.set(0, 0.05, -54)
      scene.add(disc)
    }

    /* ---------- recorrido de cámara ---------- */
    const curve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0, 3.4, 32),
        new THREE.Vector3(0, 2.8, 18),
        new THREE.Vector3(7, 2.6, 7),
        new THREE.Vector3(16, 2.8, -3),
        new THREE.Vector3(10, 3.2, -13),
        new THREE.Vector3(0, 2.8, -22),
        new THREE.Vector3(-4, 3.0, -30),
        new THREE.Vector3(-10, 3.2, -38),
        new THREE.Vector3(-4, 3.6, -48),
        new THREE.Vector3(0, 3.4, -58),
      ],
      false,
      'centripetal',
    )

    /* ---------- scroll dentro de la sección ---------- */
    let targetP = 0
    let curP = 0
    const readScroll = () => {
      const total = Math.max(1, wrap.offsetHeight - window.innerHeight)
      const p = -wrap.getBoundingClientRect().top / total
      targetP = Math.min(1, Math.max(0, p))
    }
    readScroll()
    window.addEventListener('scroll', readScroll, { passive: true })

    const setPanel = (i, p) => {
      const el = panelRefs.current[i]
      if (!el) return
      const c = (i + 0.5) / panels.length
      const d = Math.abs(p - c)
      const o = Math.max(0, 1 - d * panels.length * 1.5)
      el.style.opacity = o.toFixed(3)
      el.style.transform = `translateY(${(p - c) * 160}px)`
      el.style.visibility = o < 0.02 ? 'hidden' : 'visible'
    }
    const updateChrome = (p) => {
      for (let i = 0; i < panels.length; i++) setPanel(i, p)
      if (progressRef.current) progressRef.current.style.width = `${(p * 100).toFixed(2)}%`
      if (hintRef.current) hintRef.current.style.opacity = p > 0.04 ? '0' : '1'
      if (ctaRef.current) ctaRef.current.style.pointerEvents = p > 0.82 ? 'auto' : 'none'
    }

    /* ---------- loop ---------- */
    const clock = new THREE.Clock()
    let raf = 0
    let running = false
    let visible = true

    const renderFrame = (p, t) => {
      const pos = curve.getPoint(p)
      const ahead = curve.getPoint(Math.min(1, p + 0.022))
      camera.position.copy(pos)
      camera.lookAt(ahead)
      if (!reduced) {
        for (const b of eqBars) b.scale.y = 0.3 + Math.abs(Math.sin(t * b.userData.sp + b.userData.ph)) * 3.2
        if (vinyl) vinyl.rotation.z = t * 1.4
        logoGroup.userData.ring.rotation.z = t * 0.25
        logoGroup.position.y = 5 + Math.sin(t * 0.8) * 0.25
        rings.forEach((r, i) => {
          r.rotation.z = t * (0.15 + i * 0.02) * (i % 2 ? 1 : -1)
        })
        tunnel.userData.arrow.position.y = 6.5 + Math.sin(t * 1.6) * 0.5
        for (const f of fans) f.position.y = f.userData.base + Math.abs(Math.sin(t * f.userData.sp + f.userData.ph)) * 0.55
      }
      updateChrome(p)
      renderer.render(scene, camera)
    }

    const loop = () => {
      if (!running) return
      raf = requestAnimationFrame(loop)
      if (!visible) return
      const t = clock.getElapsedTime()
      if (reduced) {
        renderFrame(0.22, 1.2)
        return
      }
      curP += (targetP - curP) * 0.075
      if (Math.abs(targetP - curP) < 0.0004) curP = targetP
      renderFrame(curP, t)
    }
    const start = () => {
      if (!running) {
        running = true
        clock.getElapsedTime()
        loop()
      }
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? true
        if (visible) start()
      },
      { threshold: 0 },
    )
    io.observe(sticky)
    start()

    const ro = new ResizeObserver(fit)
    ro.observe(sticky)

    /* ---------- limpieza ---------- */
    return () => {
      stop()
      io.disconnect()
      ro.disconnect()
      window.removeEventListener('scroll', readScroll)
      scene.traverse((obj) => {
        const geo = obj.geometry
        if (geo) geo.dispose()
        const mat = obj.material
        if (Array.isArray(mat)) mat.forEach((m) => disposeMat(m))
        else if (mat) disposeMat(mat)
      })
      renderer.dispose()
      if (renderer.domElement.parentNode === host) host.removeChild(renderer.domElement)
    }

    function disposeMat(m) {
      for (const key of Object.keys(m)) {
        const v = m[key]
        if (v && v.isTexture) v.dispose()
      }
      m.dispose()
    }
  }, [])

  /* Fallback sin WebGL: héroe compacto clásico */
  if (failed) {
    return (
      <section className="relative overflow-hidden border-b border-white/10 bg-night-alt px-6 py-14 text-center">
        <p className="mx-auto max-w-md text-base font-medium text-muted sm:text-lg">{t('home.heroSub')}</p>
        <div className="mt-5">
          {user ? (
            <button
              onClick={onUploadClick}
              className="inline-flex items-center gap-2 rounded-full bg-up px-6 py-3 text-sm font-extrabold text-white shadow-[0_0_28px_rgba(139,92,246,0.5)] transition hover:bg-up-dark"
            >
              {t('home.uploadSet')}
            </button>
          ) : (
            <button
              onClick={onRegisterClick}
              className="inline-flex items-center gap-2 rounded-full bg-up px-6 py-3 text-sm font-extrabold text-white shadow-[0_0_28px_rgba(139,92,246,0.5)] transition hover:bg-up-dark"
            >
              {t('home.createProfile')}
            </button>
          )}
        </div>
        <div className="mt-5 flex justify-center">
          <DonateButton />
        </div>
      </section>
    )
  }

  return (
    <section ref={wrapRef} className="relative" style={{ height: '520vh' }} aria-label={t('scroll3d.aria')}>
      <div ref={stickyRef} className="sticky top-0 h-[100svh] overflow-hidden bg-[#05050c]">
        <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />
        <div
          ref={progressRef}
          className="absolute left-0 top-0 z-20 h-[3px] bg-gradient-to-r from-[#8B5CF6] to-[#00E065] shadow-[0_0_12px_rgba(0,224,101,.8)]"
          style={{ width: '0%' }}
        />
        {panels.map((p, i) => (
          <div
            key={i}
            ref={(el) => {
              panelRefs.current[i] = el
            }}
            className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center px-[8vw] text-center opacity-0"
          >
            <p
              className="mb-4 text-[13px] font-bold uppercase tracking-[0.35em] text-[#00E065]"
              style={{ textShadow: '0 0 18px rgba(0,224,101,.8)' }}
            >
              {p.e}
            </p>
            <h1
              className="font-display text-[clamp(38px,8vw,84px)] font-black leading-[1.05] tracking-tight text-white"
              style={{ textShadow: '0 4px 40px rgba(0,0,0,.9)' }}
              dangerouslySetInnerHTML={{ __html: p.title }}
            />
            {p.sub ? (
              <p
                className="mt-4 max-w-xl text-[clamp(15px,2.6vw,21px)] leading-relaxed text-[#c9c9d6]"
                style={{ textShadow: '0 2px 12px rgba(0,0,0,.9)' }}
              >
                {p.sub}
              </p>
            ) : null}
            {p.cta ? (
              <div ref={ctaRef} className="mt-7 flex flex-col items-center gap-4" style={{ pointerEvents: 'none' }}>
                <button
                  onClick={user ? onUploadClick : onRegisterClick}
                  className="inline-flex items-center gap-2 rounded-full bg-[#00E065] px-8 py-4 text-base font-extrabold text-[#04120a] shadow-[0_0_30px_rgba(0,224,101,.55)] transition active:scale-95"
                >
                  {user ? t('home.uploadSet') : t('home.createProfile')}
                </button>
                <DonateButton />
              </div>
            ) : null}
          </div>
        ))}
        <div
          ref={hintRef}
          className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-center text-[13px] uppercase tracking-[0.25em] text-[#8f8fa3] transition-opacity duration-500"
        >
          {t('scroll3d.hint')}
          <span className="sw-chev" />
        </div>
      </div>
    </section>
  )
}
