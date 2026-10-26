import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { PARAMETROS } from './data/constantes'
import { supabase, WEBHOOK, accionN8n, telefonoN8n } from './lib/supabase'
import { estadoDB, mapChats, mapPedido } from './lib/mapeo'
import { filaNueva, mapLanzamiento } from './lib/lanzamiento'
import { avisar } from './lib/avisos'

// Estado global: todo viene de Supabase, con tiempo real para pedidos, mensajes y lanzamientos.
const StoreCtx = createContext(null)

const PARAMETROS_BASE = { ...PARAMETROS }

export function StoreProvider({ children }) {
  const [session, setSession] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(true)
  const [filasPedidos, setFilasPedidos] = useState([])
  const [filasMensajes, setFilasMensajes] = useState([])
  const [filasLanzamientos, setFilasLanzamientos] = useState([])
  const [productos, setProductos] = useState([])
  const [metricas, setMetricas] = useState([])
  const [config, setConfig] = useState(null)
  const [faltanTablas, setFaltanTablas] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(true)
  const [errorDatos, setErrorDatos] = useState(null)
  const [leidos, setLeidos] = useState({})
  // RLS oculta las filas sin dar error: hay que preguntar explícitamente si el correo está autorizado
  const [autorizado, setAutorizado] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargandoSesion(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session) return setAutorizado(null)
    supabase.rpc('es_del_panel').then(({ data, error }) => setAutorizado(error ? null : !!data))
  }, [session])

  useEffect(() => {
    if (!session) return
    let vivo = true
    const cargar = async () => {
      setCargandoDatos(true)
      const [p, m, l, pr, me, c] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('mensajes_whatsapp').select('*').order('creado_en', { ascending: true }).limit(5000),
        supabase.from('lanzamientos').select('*').order('creado_en', { ascending: false }),
        supabase.from('productos').select('*'),
        supabase.from('metricas_meta').select('*').order('fecha'),
        supabase.from('configuracion').select('*').eq('id', 1).maybeSingle(),
      ])
      if (!vivo) return
      const err = p.error || m.error
      setErrorDatos(err ? err.message : null)
      if (!p.error) setFilasPedidos(p.data)
      if (!m.error) setFilasMensajes(m.data)
      if (!pr.error) setProductos(pr.data)
      // Tablas de la migración 002: si no existen el panel sigue funcionando con lo demás
      setFaltanTablas(!!(l.error || me.error || c.error))
      if (!l.error) setFilasLanzamientos(l.data)
      if (!me.error) setMetricas(me.data)
      if (c.data) setConfig(c.data)
      setCargandoDatos(false)
    }
    cargar()

    const upsert = (setter, key = 'id') => ({ eventType, new: n, old }) =>
      setter((s) => (eventType === 'DELETE' ? s.filter((r) => r[key] !== old[key]) : s.some((r) => r[key] === n[key]) ? s.map((r) => (r[key] === n[key] ? n : r)) : [n, ...s]))

    const canal = supabase
      .channel('panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, (e) => {
        upsert(setFilasPedidos)(e)
        if (e.eventType === 'INSERT') avisar(`Nuevo pedido ${e.new.numero_pedido || ''}`, `${e.new.nombre || ''} · ${e.new.productos || ''}`)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_whatsapp' }, ({ new: n }) => {
        setFilasMensajes((s) => (s.some((r) => r.id === n.id) ? s : [...s, n]))
        if (n.sentido === 'entra') avisar(`${n.nombre || 'Cliente'} escribió`, n.texto)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lanzamientos' }, upsert(setFilasLanzamientos))
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canal)
    }
  }, [session])

  // Los cálculos de margen leen PARAMETROS: se actualiza con la configuración guardada
  useEffect(() => {
    Object.assign(
      PARAMETROS,
      config ? { flete: config.flete, recaudo: Number(config.recaudo), tasaEntrega: Number(config.tasa_entrega) } : PARAMETROS_BASE
    )
  }, [config])

  const pedidos = useMemo(() => filasPedidos.map(mapPedido), [filasPedidos])
  const chats = useMemo(() => mapChats(filasMensajes, pedidos, leidos), [filasMensajes, pedidos, leidos])
  const lanzamientos = useMemo(() => filasLanzamientos.map((l) => mapLanzamiento(l, productos)), [filasLanzamientos, productos])

  /* ---------- Lanzamientos ---------- */

  // Recibe la fila de `productos`. Devuelve { id, existente } o { error }
  const crearLanzamiento = useCallback(
    async (prod) => {
      const existente = filasLanzamientos.find((l) => l.producto_id === prod.id)
      if (existente) return { id: existente.id, existente: true }
      const { data, error } = await supabase.from('lanzamientos').insert(filaNueva(prod)).select().single()
      if (error) return { error: error.message }
      setFilasLanzamientos((s) => (s.some((r) => r.id === data.id) ? s : [data, ...s]))
      return { id: data.id }
    },
    [filasLanzamientos]
  )

  const actualizarLanzamiento = useCallback(async (id, cambios) => {
    const fila = { ...cambios, actualizado_en: new Date().toISOString() }
    if ('nombreShopify' in fila) {
      fila.nombre_shopify = fila.nombreShopify
      delete fila.nombreShopify
    }
    setFilasLanzamientos((s) => s.map((r) => (r.id === id ? { ...r, ...fila } : r)))
    const { error } = await supabase.from('lanzamientos').update(fila).eq('id', id)
    if (error) {
      const { data } = await supabase.from('lanzamientos').select('*').eq('id', id).single()
      if (data) setFilasLanzamientos((s) => s.map((r) => (r.id === id ? data : r)))
      return { error: error.message }
    }
    return {}
  }, [])

  const eliminarLanzamiento = useCallback(async (id) => {
    const { error } = await supabase.from('lanzamientos').delete().eq('id', id)
    if (error) return { error: error.message }
    setFilasLanzamientos((s) => s.filter((r) => r.id !== id))
    return {}
  }, [])

  /* ---------- Pedidos y chats ---------- */

  // Devuelve { error } o {}
  const actualizarPedido = useCallback(
    async (id, cambios) => {
      // La guía la registra n8n: envía la plantilla, marca despachado y guarda guía/transportadora.
      // El cambio llega al panel por tiempo real.
      if (cambios.guia) {
        const fila = filasPedidos.find((r) => r.id === id)
        return accionN8n({
          accion: 'guia',
          pedido: (fila?.numero_pedido || String(id)).replace(/^#/, ''),
          guia: cambios.guia,
          transportadora: (cambios.transportadora || '').toLowerCase(),
        })
      }

      const fila = { actualizado_en: new Date().toISOString() }
      if (cambios.estado) fila.estado = estadoDB(cambios.estado)

      setFilasPedidos((s) => s.map((r) => (r.id === id ? { ...r, ...fila } : r)))
      const { error } = await supabase.from('pedidos').update(fila).eq('id', id)
      if (error) {
        // Revertir con lo que de verdad quedó en la base
        const { data } = await supabase.from('pedidos').select('*').eq('id', id).single()
        if (data) setFilasPedidos((s) => s.map((r) => (r.id === id ? data : r)))
        return { error: error.message }
      }
      return {}
    },
    [filasPedidos]
  )

  // n8n envía el WhatsApp y guarda la fila en mensajes_whatsapp; aquí llega por tiempo real
  const enviarMensaje = useCallback((chatId, texto) => accionN8n({ accion: 'responder', telefono: telefonoN8n(chatId), mensaje: texto }), [])

  const marcarLeido = useCallback(
    (chatId) => {
      const c = chats.find((x) => x.id === chatId)
      if (c) setLeidos((s) => ({ ...s, [chatId]: c.total }))
    },
    [chats]
  )

  /* ---------- Configuración ---------- */

  const guardarConfig = useCallback(async (cambios) => {
    const fila = { ...cambios, actualizado_en: new Date().toISOString() }
    const { data, error } = await supabase.from('configuracion').update(fila).eq('id', 1).select().single()
    if (error) return { error: error.message }
    setConfig(data)
    return {}
  }, [])

  const value = {
    session,
    cargandoSesion,
    cargandoDatos,
    errorDatos,
    autorizado,
    faltanTablas,
    puedeEnviar: !!WEBHOOK,
    cerrarSesion: () => supabase.auth.signOut(),
    lanzamientos,
    pedidos,
    chats,
    productos,
    metricas,
    config,
    crearLanzamiento,
    actualizarLanzamiento,
    eliminarLanzamiento,
    actualizarPedido,
    enviarMensaje,
    marcarLeido,
    guardarConfig,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export const useStore = () => useContext(StoreCtx)
