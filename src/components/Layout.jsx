import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Radar, Rocket, Package, MessageCircle, BarChart3, Settings, Search, Plus, Bell, Menu, X, Link2, ChevronRight, Sparkles, LogOut, AlertTriangle,
} from 'lucide-react'
import { Logo, ProductThumb } from './brand'
import { Button, Input, Modal, cn, useToast } from './ui'
import { useStore } from '../store'
import { PRODUCTOS } from '../data/mock'
import { cop, miles } from '../lib/format'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [nuevo, setNuevo] = useState(false)
  const loc = useLocation()
  const flush = loc.pathname.startsWith('/chats')

  useEffect(() => setOpen(false), [loc.pathname])

  return (
    <div className="flex h-full">
      {/* Barra lateral escritorio */}
      <aside className="hidden w-60 shrink-0 border-r border-line bg-bg lg:block">
        <Sidebar />
      </aside>

      {/* Barra lateral móvil */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 animate-fade-in border-r border-line bg-bg">
            <button onClick={() => setOpen(false)} className="absolute top-5 right-4 cursor-pointer text-muted" aria-label="Cerrar menú">
              <X size={20} />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} onNuevo={() => setNuevo(true)} />
        <AvisoDatos />
        <main className={cn('min-h-0 flex-1', flush ? 'overflow-hidden' : 'overflow-y-auto')}>
          <div className={cn(!flush && 'mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8', flush && 'h-full')}>
            <Outlet />
          </div>
        </main>
      </div>

      <NuevoLanzamiento open={nuevo} onClose={() => setNuevo(false)} />
    </div>
  )
}

function Sidebar() {
  const { pedidos, chats } = useStore()
  const pendientes = pedidos.filter((p) => p.estado === 'Pendiente' || p.estado === 'Cambio de dirección').length
  const noLeidos = chats.reduce((a, c) => a + c.noLeidos, 0)
  const items = [
    { to: '/', label: 'Inicio', icon: Home, end: true },
    { to: '/radar', label: 'Radar', icon: Radar },
    { to: '/lanzamientos', label: 'Lanzamientos', icon: Rocket },
    { to: '/pedidos', label: 'Pedidos', icon: Package, badge: pendientes },
    { to: '/chats', label: 'Chats', icon: MessageCircle, badge: noLeidos, hot: true },
    { to: '/resultados', label: 'Resultados', icon: BarChart3 },
  ]
  return (
    <div className="flex h-full flex-col px-3 py-5">
      <div className="px-2.5">
        <Logo />
      </div>
      <div className="mt-6 mb-2 px-3 text-[10px] font-semibold tracking-[0.14em] text-faint uppercase">Operación</div>
      <nav className="flex flex-col gap-0.5">
        {items.map((it) => (
          <NavItem key={it.to} {...it} />
        ))}
      </nav>
      <div className="mt-auto">
        <Card2 />
        <NavItem to="/configuracion" label="Configuración" icon={Settings} />
      </div>
    </div>
  )
}

function NavItem({ to, label, icon: Icon, end, badge, hot }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm transition-colors',
          isActive ? 'bg-brand/10 text-fg' : 'text-muted hover:bg-white/[0.04] hover:text-fg'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && <span className="absolute top-1/2 -left-3 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" />}
          <Icon size={18} strokeWidth={1.8} className={isActive ? 'text-brand' : ''} />
          <span className="flex-1">{label}</span>
          {badge > 0 && (
            <span className={cn('min-w-5 rounded-full px-1.5 text-center text-[11px] leading-5 font-semibold', hot ? 'bg-brand text-white' : 'bg-white/[0.08] text-muted')}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function Card2() {
  return (
    <div className="mx-1 mb-3 rounded-xl border border-line bg-gradient-to-b from-brand/10 to-transparent p-3.5">
      <div className="flex items-center gap-2 text-xs font-medium">
        <Sparkles size={14} className="text-accent" /> Créditos IA
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-lg font-semibold">340</span>
        <span className="text-xs text-muted">/ 500</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-brand to-accent" />
      </div>
    </div>
  )
}

function Topbar({ onMenu, onNuevo }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-line bg-bg/80 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <button onClick={onMenu} className="-ml-1 cursor-pointer text-muted hover:text-fg lg:hidden" aria-label="Abrir menú">
        <Menu size={22} />
      </button>
      <div className="lg:hidden">
        <Logo compact />
      </div>
      <form
        className="relative hidden max-w-md flex-1 sm:block"
        onSubmit={(e) => {
          e.preventDefault()
          if (q.trim()) nav(`/pedidos?q=${encodeURIComponent(q.trim())}`)
        }}
      >
        <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar pedidos, clientes, guías…" className="pr-12 pl-9" />
        <kbd className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md border border-line px-1.5 text-[10px] text-faint">Enter</kbd>
      </form>
      <div className="flex-1 sm:hidden" />
      <div className="ml-auto flex items-center gap-2">
        <Button variant="primary" icon={Plus} onClick={onNuevo} className="px-2.5 sm:px-3.5">
          <span className="hidden sm:inline">Nuevo lanzamiento</span>
        </Button>
        <Button variant="ghost" size="icon" aria-label="Notificaciones" className="relative">
          <Bell size={18} />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-brand ring-2 ring-bg" />
        </Button>
        <MenuUsuario />
      </div>
    </header>
  )
}

function MenuUsuario() {
  const { modo, session, cerrarSesion } = useStore()
  const [open, setOpen] = useState(false)
  const email = session?.user?.email
  const ini = email ? email.slice(0, 2).toUpperCase() : 'JA'
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="grid size-9 cursor-pointer place-items-center rounded-full bg-gradient-to-br from-brand to-accent text-xs font-semibold text-white ring-2 ring-line"
        aria-label="Menú de usuario"
      >
        {ini}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-11 right-0 z-50 w-60 animate-fade-in rounded-xl border border-line-strong bg-card p-1.5 shadow-2xl">
            <div className="px-3 py-2">
              <div className="truncate text-sm font-medium">{email || 'Modo demo'}</div>
              <div className="text-xs text-muted">{modo === 'real' ? 'Conectado a Supabase' : 'Sin backend · datos de ejemplo'}</div>
            </div>
            {modo === 'real' && (
              <button onClick={cerrarSesion} className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:bg-white/[0.05] hover:text-fg">
                <LogOut size={15} /> Cerrar sesión
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function AvisoDatos() {
  const { errorDatos, autorizado, session } = useStore()
  if (autorizado === false) {
    return (
      <div className="flex items-start gap-2 border-b border-accent/25 bg-accent/10 px-4 py-2.5 text-sm text-accent sm:px-6 lg:px-8">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        <span>
          Tu correo <b>{session?.user?.email}</b> no está en la lista blanca, por eso no ves pedidos ni chats. Agrégalo en Supabase con:{' '}
          <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">insert into public.panel_usuarios (email) values ('{session?.user?.email}');</code>
        </span>
      </div>
    )
  }
  if (!errorDatos) return null
  const permiso = /permission denied|42501/i.test(errorDatos)
  return (
    <div className="flex items-start gap-2 border-b border-bad/25 bg-bad/10 px-4 py-2.5 text-sm text-bad sm:px-6 lg:px-8">
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>
        {permiso
          ? 'Supabase rechazó la lectura: falta ejecutar supabase/migrations/001_acceso_panel.sql o tu correo no está en panel_usuarios.'
          : `Error al cargar datos: ${errorDatos}`}
      </span>
    </div>
  )
}

function NuevoLanzamiento({ open, onClose }) {
  const { crearLanzamiento } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const [link, setLink] = useState('')
  const [cargando, setCargando] = useState(false)

  const lanzar = (id) => {
    const lid = crearLanzamiento(id)
    onClose()
    toast(`Lanzamiento ${lid} creado`)
    nav(`/lanzamientos/${lid}`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo lanzamiento"
      subtitle="Pega el enlace del producto en Dropi o elige uno sugerido por el Radar."
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            loading={cargando}
            disabled={!link.trim()}
            onClick={() => {
              setCargando(true)
              setTimeout(() => {
                setCargando(false)
                setLink('')
                lanzar('sellador')
              }, 900)
            }}
          >
            Analizar producto
          </Button>
        </>
      }
    >
      <div className="relative">
        <Link2 size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
        <Input autoFocus value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://app.dropi.co/productos/…" className="pl-9" />
      </div>
      <div className="mt-5 mb-2 text-xs font-medium text-muted">Sugeridos por el Radar</div>
      <div className="flex flex-col gap-1.5">
        {PRODUCTOS.slice(0, 4).map((p) => (
          <button key={p.id} onClick={() => lanzar(p.id)} className="group flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-panel p-2.5 text-left transition hover:border-line-strong hover:bg-hover">
            <ProductThumb p={p} className="size-10" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{p.nombre}</div>
              <div className="text-xs text-muted">
                Costo {cop(p.costo)} · {miles(p.v7)} ventas/7d
              </div>
            </div>
            <ChevronRight size={16} className="text-faint transition group-hover:translate-x-0.5 group-hover:text-brand" />
          </button>
        ))}
      </div>
    </Modal>
  )
}
