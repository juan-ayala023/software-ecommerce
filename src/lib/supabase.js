import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// Sin variables de entorno el panel muestra un aviso de configuración (no hay datos de ejemplo)
export const supabase = url && key ? createClient(url, key) : null

// Webhook único de n8n para las acciones que salen por WhatsApp (responder, guia)
export const WEBHOOK = import.meta.env.VITE_N8N_WEBHOOK || ''

const ERRORES_HTTP = {
  401: 'Tu sesión venció. Vuelve a entrar.',
  403: 'Tu correo no está autorizado para enviar mensajes.',
  404: 'El flujo de n8n no está activo.',
}

// n8n responde { ok: true, ... } o { ok: false, error }. Devuelve { error } legible o {}
export async function accionN8n(body) {
  if (!WEBHOOK) return { error: 'Falta configurar el webhook de n8n (VITE_N8N_WEBHOOK).' }
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) return { error: ERRORES_HTTP[401] }

  let r
  try {
    r = await fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
  } catch {
    return { error: 'No hubo conexión con n8n.' }
  }
  const json = await r.json().catch(() => null)
  if (json?.ok === false) return { error: json.error || 'n8n no pudo completar la acción.' }
  if (!r.ok) return { error: ERRORES_HTTP[r.status] || `n8n respondió ${r.status}` }
  return {}
}

// La base guarda 57XXXXXXXXXX; n8n espera el número sin indicativo
export const telefonoN8n = (t) => (t.length === 12 && t.startsWith('57') ? t.slice(2) : t)
