/**
 * Compresión de audio en el navegador (MP3 vía lamejs).
 *
 * Los sets de DJ casi siempre superan el límite de 50 MB por archivo del plan
 * Free de Supabase, así que los archivos grandes se re-codifican a MP3 con
 * bitrate adaptativo antes de subirlos. Todo ocurre en el dispositivo del DJ.
 */
import { Mp3Encoder } from 'lamejs'

/** Límite por archivo del plan Free de Supabase. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
/** Tamaño objetivo del comprimido (margen de seguridad bajo el límite). */
const TARGET_BYTES = 48 * 1024 * 1024
/** Segundos de audio codificados por tanda (acota el uso de memoria). */
const CHUNK_SECONDS = 300

export function needsCompression(file) {
  return !!file && file.size > MAX_UPLOAD_BYTES
}

const tick = () => new Promise((r) => setTimeout(r, 0))

function floatTo16BitPCM(float32) {
  const out = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

/** Normaliza sample rate y canales a valores que lamejs maneja bien. */
async function normalizeBuffer(audio) {
  const goodRates = [32000, 44100, 48000]
  const targetRate = goodRates.includes(audio.sampleRate) ? audio.sampleRate : 44100
  const targetCh = Math.min(audio.numberOfChannels, 2)
  if (targetRate === audio.sampleRate && targetCh === audio.numberOfChannels) return audio
  const off = new OfflineAudioContext(
    targetCh,
    Math.max(1, Math.ceil(audio.duration * targetRate)),
    targetRate,
  )
  const src = off.createBufferSource()
  src.buffer = audio
  src.connect(off.destination)
  src.start(0)
  return off.startRendering()
}

/**
 * Comprime un archivo de audio a MP3 con bitrate adaptativo para que el
 * resultado quede por debajo del límite de subida. `onProgress` recibe 0..1.
 * Devuelve un File listo para subir.
 * Errores: 'compress-unsupported' | 'compress-decode' | 'compress-too-big'.
 */
export async function compressAudio(file, onProgress) {
  const raw = await file.arrayBuffer()
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) throw new Error('compress-unsupported')
  const ctx = new AC()
  let decoded
  try {
    decoded = await ctx.decodeAudioData(raw)
  } catch (e) {
    throw new Error('compress-decode')
  } finally {
    try {
      await ctx.close()
    } catch (_) {
      /* noop */
    }
  }
  const audio = await normalizeBuffer(decoded)
  const duration = audio.duration || 1
  // Bitrate adaptativo: ~48 MB como máximo sin importar la duración.
  const bitrate = Math.max(48, Math.min(128, Math.floor(((TARGET_BYTES * 8) / duration / 1000))))
  const channels = audio.numberOfChannels
  const encoder = new Mp3Encoder(channels, audio.sampleRate, bitrate)
  const left = audio.getChannelData(0)
  const right = channels > 1 ? audio.getChannelData(1) : null
  const chunkLen = Math.floor(audio.sampleRate * CHUNK_SECONDS)
  const parts = []
  for (let i = 0; i < left.length; i += chunkLen) {
    const end = Math.min(i + chunkLen, left.length)
    const l16 = floatTo16BitPCM(left.subarray(i, end))
    const mp3 = right
      ? encoder.encodeBuffer(l16, floatTo16BitPCM(right.subarray(i, end)))
      : encoder.encodeBuffer(l16)
    if (mp3.length > 0) parts.push(mp3)
    if (onProgress) onProgress(end / left.length)
    await tick() // cede el hilo para no congelar la UI
  }
  const tail = encoder.flush()
  if (tail.length > 0) parts.push(tail)
  const blob = new Blob(parts, { type: 'audio/mpeg' })
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error('compress-too-big')
  const base = (file.name || 'set').replace(/\.[a-z0-9]+$/i, '')
  return new File([blob], `${base}-comprimido.mp3`, { type: 'audio/mpeg' })
}
