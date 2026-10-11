import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** true cuando hay credenciales de Supabase configuradas */
export const isSupabaseConfigured = Boolean(url && anonKey)

/** Cliente de Supabase, o null si la app corre en modo demo local */
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
