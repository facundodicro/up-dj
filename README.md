# Up! — Sets de DJs

App web para que los DJs suban sus sets y los compartan con el mundo. Diseño
minimalista con estética nocturna: fondo casi negro, humo de boliche animado
con CSS puro, logo **up!** en verde neón con glow y acentos violeta/azul.

## Funcionalidad

- **Header**: logo `up!` neón + icono de cuenta (crear perfil / iniciar sesión).
- **Perfil** (popup): nombre de usuario, foto, descripción y WhatsApp.
- **Crear evento**: subís el set (audio), descripción y foto, con barra de
  progreso real de subida.
- **Feed principal**: los eventos más recientes, con reproductor integrado.
- **Reproductor flotante**: al darle play a cualquier set se abre una barra
  fija abajo con play/pausa, seek clickeable y tiempos. Sigue sonando mientras
  navegás.
- **WhatsApp**: cada tarjeta tiene botón para escribirle al DJ con mensaje
  pre-cargado.

## Stack

Vite + React 19 + Tailwind CSS 3 + Supabase (Auth + Postgres + Storage) +
react-router-dom + lucide-react.

## Modo demo

Sin credenciales de Supabase la app corre en **modo demo local**: registro,
perfil, eventos y reproducciones funcionan con datos guardados en el
navegador. Ideal para probar todo antes de conectar el backend.

## Setup rápido

```bash
cp .env.example .env   # y completá con tus datos de Supabase
npm install
npm run dev
```

Ver la guía completa en [SETUP.md](./SETUP.md).

## Estructura

```
src/
  components/   Header, AuthModal, ProfileModal, EventForm, EventCard,
                PlayerBar, Modal, Toaster, SmokeBackground
  context/      PlayerContext (un solo <audio> global)
  hooks/        useAuth
  lib/          supabase, data (nube/demo), cloud, demo, format, toast
  pages/        Home (hero + feed)
supabase/
  schema.sql    Tablas + RLS + buckets, listo para el SQL Editor
```
