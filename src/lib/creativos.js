// Archivos de cada lanzamiento en el bucket público `creativos/<lanzamiento>/<clave>.<ext>`
import { supabase } from './supabase'

const BUCKET = 'creativos'
const esVideo = (nombre) => /\.(mp4|mov|webm|m4v)$/i.test(nombre)

const urlPublica = (path, version) => {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return version ? `${data.publicUrl}?v=${encodeURIComponent(version)}` : data.publicUrl
}

export async function listarCreativos(lanzamientoId) {
  const { data, error } = await supabase.storage.from(BUCKET).list(lanzamientoId, { limit: 200, sortBy: { column: 'name', order: 'asc' } })
  if (error) return { error: error.message, archivos: [] }
  return {
    archivos: (data || [])
      .filter((f) => f.id) // las carpetas no traen id
      .map((f) => ({
        nombre: f.name,
        clave: f.name.replace(/\.[^.]+$/, ''),
        url: urlPublica(`${lanzamientoId}/${f.name}`, f.updated_at),
        esVideo: esVideo(f.name),
        actualizado: f.updated_at,
      })),
  }
}

// Sube (o reemplaza) el archivo de una clave. `anterior` = nombre previo, por si cambió la extensión
export async function subirCreativo(lanzamientoId, clave, file, anterior) {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const nombre = `${clave}.${ext}`
  if (anterior && anterior !== nombre) await supabase.storage.from(BUCKET).remove([`${lanzamientoId}/${anterior}`])
  const { error } = await supabase.storage.from(BUCKET).upload(`${lanzamientoId}/${nombre}`, file, { upsert: true, contentType: file.type || undefined })
  if (error) return { error: error.message }
  return { nombre, url: urlPublica(`${lanzamientoId}/${nombre}`, Date.now()), esVideo: esVideo(nombre) }
}

export async function borrarCreativo(lanzamientoId, nombre) {
  const { error } = await supabase.storage.from(BUCKET).remove([`${lanzamientoId}/${nombre}`])
  return error ? { error: error.message } : {}
}
