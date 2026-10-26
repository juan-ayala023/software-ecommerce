import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CHATS, LANZAMIENTOS, PEDIDOS, PARAMETROS, producto } from './data/mock'
import { supabase, WEBHOOK, accionN8n, telefonoN8n } from './lib/supabase'
import { estadoDB, mapChats, mapPedido } from './lib/mapeo'
import { filaNueva, mapLanzamiento } from './lib/lanzamiento'
import { avisar } from './lib/avisos'

// Con Supabase configurado todo viene de la base (modo "real"); sin él, datos de ejemplo.
const StoreCtx = createContext(null)
export const MODO = supabase ? 'real' : 'demo'

const PARAMETROS_BASE = { ...PARAMETROS }

export function StoreProvider({ children }) {
  const [vacio, setVacio] = useState(false) // modo demo: muestra los estados vacíos
  const [cargaLenta, setCargaLenta] = useState(false)

  // --- Demo ---
  const [lanzamientosDemo, setLanzamientosDemo] = useState(LANZAMIENTOS)
  const [pedidosDemo, setPedidosDemo] = useState(PEDIDOS)
  const [chatsDemo, setChatsDemo] = useState(CHATS)

  // --- Real ---
  const [session, setSession] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(MODO === 'real')
  const [filasPedidos, setFilasPedidos] = useState([])
  const [filasMensajes, setFilasMensajes] = useState([])
  const [filasLanzamientos, setFilasLanzamientos] = useState([])
  const [productos, setProductos] = useState([])
  const [metricas, setMetricas] = useState([])
  const [config, setConfig] = useState(null)
  const [faltanTablas, setFaltanTablas] = useState(false)
  const [cargandoDatos, setCargandoDatos] = useState(MODO === 'real')
  const [errorDatos, setErrorDatos] = useState(null)
  const [leidos, setLeidos] = useState({})
  // RLS oculta las filas sin dar error: hay que preguntar explícitamente si el correo está autorizado
  const [autorizado, setAutorizado] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCargandoSesion(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !session) return setAutorizado(null)
    supabase.rpc('es_del_panel').then(({ data, error }) => setAutorizado(error ? null : !!data))
  }, [session])

  useEffect(() => {
    if (!supabase || !session) return
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

  const pedidosReal = useMemo(() => filasPedidos.map(mapPedido), [filasPedidos])
  const chatsReal = useMemo(() => mapChats(filasMensajes, pedidosReal, leidos), [filasMensajes, pedidosReal, leidos])
  const lanzamientosReal = useMemo(() => filasLanzamientos.map((l) => mapLanzamiento(l, productos)), [filasLanzamientos, productos])

  /* ---------- Lanzamientos ---------- */

  // Demo: recibe el id del producto de ejemplo. Real: recibe la fila de `productos`. Devuelve { id } o { error }
  const crearLanzamiento = useCallback(
    async (prod) => {
      if (!supabase) {
        const existente = lanzamientosDemo.find((l) => l.productoId === prod)
        if (existente) return { id: existente.id }
        const id = 'L' + (32886 + lanzamientosDemo.length)
        setLanzamientosDemo((s) => [{ id, productoId: prod, etapa: 0, veredicto: null, creado: '26 oct 2026', responsable: 'Juan A.' }, ...s])
        return { id }
      }
      const existente = filasLanzamientos.find((l) => l.producto_id === prod.id)
      if (existente) return { id: existente.id, existente: true }
      const { data, error } = await supabase.from('lanzamientos').insert(filaNueva(prod)).select().single()
      if (error) return { error: error.message }
      setFilasLanzamientos((s) => (s.some((r) => r.id === data.id) ? s : [data, ...s]))
      return { id: data.id }
    },
    [lanzamientosDemo, filasLanzamientos]
  )

  const actualizarLanzamiento = useCallback(async (id, cambios) => {
    if (!supabase) {
      setLanzamientosDemo((s) => s.map((l) => (l.id === id ? { ...l, ...cambios } : l)))
      return {}
    }
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
    if (!supabase) {
      setLanzamientosDemo((s) => s.filter((l) => l.id !== id))
      return {}
    }
    const { error } = await supabase.from('lanzamientos').delete().eq('id', id)
    if (error) return { error: error.message }
    setFilasLanzamientos((s) => s.filter((r) => r.id !== id))
    return {}
  }, [])

  /* ---------- Pedidos y chats ---------- */

  // Devuelve { error } o {}
  const actualizarPedido = useCallback(
    async (id, cambios) => {
      if (!supabase) {
        setPedidosDemo((s) => s.map((p) => (p.id === id ? { ...p, ...cambios } : p)))
        return {}
      }

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

  const enviarMensaje = useCallback(async (chatId, texto, de = 'yo') => {
    if (!supabase) {
      const d = new Date()
      const hora = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      setChatsDemo((s) => s.map((c) => (c.id === chatId ? { ...c, mensajes: [...c.mensajes, { de, texto, hora }] } : c)))
      return {}
    }
    // n8n envía el WhatsApp y guarda la fila en mensajes_whatsapp; aquí llega por tiempo real
    return accionN8n({ accion: 'responder', telefono: telefonoN8n(chatId), mensaje: texto })
  }, [])

  const marcarLeido = useCallback(
    (chatId) => {
      if (!supabase) {
        setChatsDemo((s) => s.map((c) => (c.id === chatId ? { ...c, noLeidos: 0 } : c)))
        return
      }
      const c = chatsReal.find((x) => x.id === chatId)
      if (c) setLeidos((s) => ({ ...s, [chatId]: c.total }))
    },
    [chatsReal]
  )

  /* ---------- Configuración ---------- */

  const guardarConfig = useCallback(async (cambios) => {
    if (!supabase) return { error: 'Sin backend' }
    const fila = { ...cambios, actualizado_en: new Date().toISOString() }
    const { data, error } = await supabase.from('configuracion').update(fila).eq('id', 1).select().single()
    if (error) return { error: error.message }
    setConfig(data)
    return {}
  }, [])

  const real = MODO === 'real'
  const value = {
    modo: MODO,
    session,
    cargandoSesion,
    cargandoDatos: real && cargandoDatos,
    errorDatos,
    autorizado,
    faltanTablas,
    puedeEnviar: !real || !!WEBHOOK,
    cerrarSesion: () => supabase?.auth.signOut(),
    lanzamientos: vacio ? [] : real ? lanzamientosReal : lanzamientosDemo.map((l) => ({ ...l, producto: producto(l.productoId) })),
    pedidos: vacio ? [] : real ? pedidosReal : pedidosDemo,
    chats: vacio ? [] : real ? chatsReal : chatsDemo,
    productos,
    metricas,
    config,
    vacio,
    setVacio,
    cargaLenta,
    setCargaLenta,
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
