/**
 * Capa de datos unificada: si hay credenciales de Supabase usa la nube,
 * si no, corre en modo demo local. Los componentes solo hablan con este módulo.
 */
import { isSupabaseConfigured } from './supabase'
import * as demoDb from './demo'
import * as cloudDb from './cloud'

const db = isSupabaseConfigured ? cloudDb : demoDb

/** true cuando la app corre en modo demo (sin Supabase configurado) */
export const isDemoMode = !isSupabaseConfigured

export const getSessionUser = (...args) => db.getSessionUser(...args)
export const onAuthChange = (...args) => db.onAuthChange(...args)
export const signUp = (...args) => db.signUp(...args)
export const signIn = (...args) => db.signIn(...args)
export const signOut = (...args) => db.signOut(...args)
export const resetPassword = (...args) => db.resetPassword(...args)
export const updatePassword = (...args) => db.updatePassword(...args)
export const signInWithGoogle = (...args) => db.signInWithGoogle(...args)
export const getProfile = (...args) => db.getProfile(...args)
export const saveProfile = (...args) => db.saveProfile(...args)
export const listEvents = (...args) => db.listEvents(...args)
export const createEvent = (...args) => db.createEvent(...args)
export const updateEvent = (...args) => {
  if (typeof db.updateEvent !== 'function')
    throw new Error('Editar no está disponible en modo demo')
  return db.updateEvent(...args)
}
export const getLikes = (...args) => db.getLikes(...args)
export const toggleLike = (...args) => db.toggleLike(...args)
export const getMyFollows = (...args) => db.getMyFollows(...args)
export const getFollowerCounts = (...args) => db.getFollowerCounts(...args)
export const getFollowCounts = (...args) => db.getFollowCounts(...args)
export const toggleFollow = (...args) => db.toggleFollow(...args)
export const deleteEvent = (...args) => db.deleteEvent(...args)
