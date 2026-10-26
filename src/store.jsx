import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { CHATS, LANZAMIENTOS, PEDIDOS, producto } from './data/mock'
import { supabase, WEBHOOK, accionN8n, telefonoN8n } from './lib/supabase'
import { estadoDB, mapChats, mapPedido } from './lib/mapeo'

// Con Supabase configurado, pedidos y chats vienen de la base (modo "real").
// Lanzamientos, campañas y resultados aún no tienen tabla: siguen con datos de ejemplo.
const StoreCtx = createContext(null)
export const MODO = supabase ? 'real' : 'demo'

export function StoreProvider({ children }) {
  const [lanzamientos, setLanzamientos] = useState(LANZAMIENTOS)
  const [vacio, setVacio] = useState(false) // modo demo: muestra los estados vacíos
  const [cargaLenta, setCargaLenta] = useState(false)

  // --- Demo ---
  const [pedidosDemo, setPedidosDemo] = useState(PEDIDOS)
  const [chatsDemo, setChatsDemo] = useState(CHATS)

  // --- Real ---
  const [session, setSession] = useState(null)
  const [cargandoSesion, setCargandoSesion] = useState(MODO === 'real')
  const [filasPedidos, setFilasPedidos] = useState([])
  const [filasMensajes, setFilasMensajes] = useState([])
  const [cargandoDatos, setCargandoDatos] = useState(MODO === 'real')
  const [errorDatos, setErrorDatos] = useState(null)
  const [leidos, setLeidos] = useState({})
  // RLS oculta las filas sin dar error: hay que preguntar explícitamente si el correo está autorizado
  const [autorizado, setAutorizado] = useState(null)

  useEffect(() => {
    if (!supabase || !session) return setAutorizado(null)
    supabase.rpc('es_del_panel').then(({ data, error }) => setAutorizado(error ? null : !!data))
  }, [session])

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
    if (!supabase || !session) return
    let vivo = true
    const cargar = async () => {
      setCargandoDatos(true)
      const [p, m] = await Promise.all([
        supabase.from('pedidos').select('*').order('created_at', { ascending: false }).limit(1000),
        supabase.from('mensajes_whatsapp').select('*').order('creado_en', { ascending: true }).limit(5000),
      ])
      if (!vivo) return
      const err = p.error || m.error
      setErrorDatos(err ? err.message : null)
      if (!p.error) setFilasPedidos(p.data)
      if (!m.error) setFilasMensajes(m.data)
      setCargandoDatos(false)
    }
    cargar()

    const canal = supabase
      .channel('panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, ({ eventType, new: n, old }) => {
        setFilasPedidos((s) =>
          eventType === 'DELETE' ? s.filter((r) => r.id !== old.id) : s.some((r) => r.id === n.id) ? s.map((r) => (r.id === n.id ? n : r)) : [n, ...s]
        )
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_whatsapp' }, ({ new: n }) => {
        setFilasMensajes((s) => (s.some((r) => r.id === n.id) ? s : [...s, n]))
      })
      .subscribe()

    return () => {
      vivo = false
      supabase.removeChannel(canal)
    }
  }, [session])

  const pedidosReal = useMemo(() => filasPedidos.map(mapPedido), [filasPedidos])
  const chatsReal = useMemo(() => mapChats(filasMensajes, pedidosReal, leidos), [filasMensajes, pedidosReal, leidos])

  const crearLanzamiento = useCallback(
    (productoId) => {
      const existente = lanzamientos.find((l) => l.productoId === productoId)
      if (existente) return existente.id
      const id = 'L' + (32886 + lanzamientos.length)
      setLanzamientos((s) => [{ id, productoId, etapa: 0, veredicto: null, creado: '26 oct 2026', responsable: 'Juan A.' }, ...s])
      return id
    },
    [lanzamientos]
  )

  const actualizarLanzamiento = useCallback((id, cambios) => {
    setLanzamientos((s) => s.map((l) => (l.id === id ? { ...l, ...cambios } : l)))
  }, [])

  // Devuelve { error } o {}
  const actualizarPedido = useCallback(async (id, cambios) => {
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
  }, [filasPedidos])

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

  const value = {
    modo: MODO,
    session,
    cargandoSesion,
    cargandoDatos: MODO === 'real' && cargandoDatos,
    errorDatos,
    autorizado,
    puedeEnviar: MODO === 'demo' || !!WEBHOOK,
    cerrarSesion: () => supabase?.auth.signOut(),
    lanzamientos: vacio ? [] : lanzamientos.map((l) => ({ ...l, producto: producto(l.productoId) })),
    pedidos: vacio ? [] : MODO === 'real' ? pedidosReal : pedidosDemo,
    chats: vacio ? [] : MODO === 'real' ? chatsReal : chatsDemo,
    vacio,
    setVacio,
    cargaLenta,
    setCargaLenta,
    crearLanzamiento,
    actualizarLanzamiento,
    actualizarPedido,
    enviarMensaje,
    marcarLeido,
  }
  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>
}

export const useStore = () => useContext(StoreCtx)
