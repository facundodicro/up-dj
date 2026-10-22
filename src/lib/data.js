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
export const getTopDjs = (...args) => db.getTopDjs(...args)
export const deleteEvent = (...args) => db.deleteEvent(...args)
export const listShows = (...args) =>
  typeof db.listShows === 'function' ? db.listShows(...args) : Promise.resolve([])
export const listShowsByUser = (...args) =>
  typeof db.listShowsByUser === 'function' ? db.listShowsByUser(...args) : Promise.resolve([])
export const createShow = (...args) => {
  if (typeof db.createShow !== 'function')
    throw new Error('Publicar eventos no está disponible en modo demo')
  return db.createShow(...args)
}
export const deleteShow = (...args) => {
  if (typeof db.deleteShow !== 'function')
    throw new Error('Eliminar eventos no está disponible en modo demo')
  return db.deleteShow(...args)
}
export const getEvent = (...args) => db.getEvent(...args)
export const getProfileByUsername = (...args) => db.getProfileByUsername(...args)
export const listEventsByUser = (...args) => db.listEventsByUser(...args)
