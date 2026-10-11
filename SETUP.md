# Guía de setup — Up!

## 1. Crear el proyecto en Supabase

1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo
   (región **São Paulo** si tu público está en Argentina).
2. **Ojo con el plan Free**: permite 2 proyectos activos. Si ya los tenés
   ocupados, liberá uno o pasate a un plan pago antes de seguir.

## 2. Crear tablas y buckets

1. En el dashboard de Supabase, abrí el **SQL Editor**.
2. Pegá todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y
   ejecutalo (**Run**).
3. Verificá en **Storage** que existan los buckets públicos `avatars`,
   `event-photos` y `sets`.

El script crea:

- `profiles` (id, username, avatar_url, bio, whatsapp) con trigger que crea la
  fila automáticamente al registrarse un usuario.
- `events` (user_id, title, description, photo_url, audio_url) con índice por
  usuario y fecha.
- Políticas RLS: lectura pública; escritura solo de filas/archivos propios.

## 3. Variables de entorno

1. En Supabase: **Project Settings → API**. Copiá la **Project URL** y la
   **anon public key**.
2. Creá el archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

## 4. Correr en local

```bash
npm install
npm run dev
```

Sin `.env` la app corre en **modo demo** (datos en el navegador).

## 5. Deploy en Vercel

1. Subí el código a un repo de GitHub.
2. En Vercel: **Add New → Project** e importá el repo.
3. En **Environment Variables** agregá `VITE_SUPABASE_URL` y
   `VITE_SUPABASE_ANON_KEY`.
4. Deploy. El archivo `vercel.json` ya maneja el ruteo de la SPA.

## Auth por email

Supabase trae la confirmación por email activada por defecto: al registrarse,
el usuario recibe un correo y debe confirmarlo antes de entrar. La app muestra
un aviso en ese caso. Si preferís login directo sin confirmación, desactivá
**"Confirm email"** en **Authentication → Providers → Email**.
