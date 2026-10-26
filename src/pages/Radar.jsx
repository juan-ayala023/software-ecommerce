import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import {
  Check, X, Search, RefreshCw, Store, Clock, SearchX, Package, ExternalLink, Rocket, Trash2, Undo2, Target, ShieldAlert, Megaphone, Calculator,
} from 'lucide-react'
import { Badge, Button, Card, EmptyState, Input, PageHeader, Select, Semaforo, Skeleton, Tabs, cn, useToast } from '../components/ui'
import { Thumb } from '../components/brand'
import { supabase } from '../lib/supabase'
import { titulo } from '../lib/mapeo'
import { PARAMETROS } from '../data/constantes'
import { cop, miles } from '../lib/format'

// Radar con la tabla `productos` (análisis de IA sobre la biblioteca de Meta) y `anuncios`

const FILTROS = [
  { id: 'score', label: 'Score ≥ 50', test: (p) => p.score >= 50 },
  { id: 'ia', label: 'IA no lo descarta', test: (p) => p.veredicto_ia !== 'descartar' },
  { id: 'competencia', label: 'Anunciantes ≤ 10', test: (p) => (p.num_anunciantes ?? 0) <= 10 },
  { id: 'dias', label: 'Anuncio activo ≥ 90 días', test: (p) => (p.max_dias_activo ?? 0) >= 90 },
  { id: 'margen', label: 'Margen ≥ $25.000', test: (p) => (margen(p) ?? 0) >= 25000 },
]

const DESGLOSE = [
  ['margen', 'Margen'],
  ['logistica', 'Logística'],
  ['efecto_wow', 'Efecto wow'],
  ['saturacion', 'Poca saturación'],
  ['senal_dinero', 'Señal de dinero'],
]

const VEREDICTO = {
  testear: { tone: 'ok', txt: 'TESTEAR' },
  vigilar: { tone: 'warn', txt: 'VIGILAR' },
  descartar: { tone: 'bad', txt: 'DESCARTAR' },
}

const costo = (p) => p.costo_dropi ?? p.costo_est
const precio = (p) => p.precio_venta_est ?? p.precio_sugerido_dropi
export function margen(p) {
  if (p.margen_real != null) return Number(p.margen_real)
  if (!precio(p) || costo(p) == null) return null
  return Math.round(precio(p) - costo(p) - PARAMETROS.flete - precio(p) * PARAMETROS.recaudo)
}
const nivel = (n) => (n <= 5 ? 'green' : n <= 12 ? 'yellow' : 'red')
const tonoScore = (s) => (s >= 60 ? 'text-ok' : s >= 45 ? 'text-accent' : 'text-bad')
const hue = (slug) => [...slug].reduce((a, c) => a + c.charCodeAt(0), 0) % 360

export default function RadarReal() {
  const toast = useToast()
  const nav = useNavigate()
  const { crearLanzamiento, lanzamientos } = useStore()
  const [params, setParams] = useSearchParams()
  const [filas, setFilas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [vista, setVista] = useState('nuevo')
  const [activos, setActivos] = useState({ score: false, ia: true, competencia: false, dias: false, margen: false })
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('todas')
  const [orden, setOrden] = useState('score')

  const cargar = async () => {
    setCargando(true)
    const { data, error } = await supabase.from('productos').select('*').order('score', { ascending: false })
    setError(error?.message ?? null)
    if (data) setFilas(data)
    setCargando(false)
  }
  useEffect(() => {
    cargar()
  }, [])

  const categorias = useMemo(() => [...new Set(filas.map((p) => titulo(p.categoria)).filter(Boolean))].sort(), [filas])
  const porVista = filas.filter((p) => vista === 'todos' || (vista === 'descartado' ? p.estado === 'descartado' : p.estado !== 'descartado'))
  const lista = porVista
    .filter((p) => FILTROS.every((f) => !activos[f.id] || f.test(p)))
    .filter((p) => cat === 'todas' || titulo(p.categoria) === cat)
    .filter((p) => !q || `${p.nombre} ${p.categoria} ${p.angulo}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) =>
      orden === 'margen' ? (margen(b) ?? -1e9) - (margen(a) ?? -1e9) : orden === 'competencia' ? (a.num_anunciantes ?? 0) - (b.num_anunciantes ?? 0) : orden === 'dias' ? (b.max_dias_activo ?? 0) - (a.max_dias_activo ?? 0) : b.score - a.score
    )

  const abierto = filas.find((p) => p.slug === params.get('p'))
  const abrir = (p) => setParams(p ? { p: p.slug } : {})

  const cambiarEstado = async (p, estado) => {
    const antes = p.estado
    setFilas((s) => s.map((x) => (x.id === p.id ? { ...x, estado } : x)))
    const { error } = await supabase.from('productos').update({ estado, updated_at: new Date().toISOString() }).eq('id', p.id)
    if (error) {
      setFilas((s) => s.map((x) => (x.id === p.id ? { ...x, estado: antes } : x)))
      return toast(`No se guardó: ${error.message}`, 'warn')
    }
    toast(estado === 'descartado' ? `${p.nombre} descartado` : `${p.nombre} vuelve al Radar`, estado === 'descartado' ? 'info' : 'ok')
  }

  const cuenta = (v) => filas.filter((p) => (v === 'todos' ? true : v === 'descartado' ? p.estado === 'descartado' : p.estado !== 'descartado')).length

  return (
    <>
      <PageHeader
        title="Radar"
        subtitle="Productos detectados en la biblioteca de Meta y analizados por IA"
        actions={
          <Button icon={RefreshCw} onClick={cargar} loading={cargando}>
            Actualizar
          </Button>
        }
      />

      <Tabs
        className="mb-5"
        value={vista}
        onChange={setVista}
        tabs={[
          { id: 'nuevo', label: 'Candidatos', count: cuenta('nuevo') },
          { id: 'descartado', label: 'Descartados', count: cuenta('descartado') },
          { id: 'todos', label: 'Todos', count: cuenta('todos') },
        ]}
      />

      <div className="mb-5 flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 xl:mx-0 xl:flex-wrap xl:px-0">
          {FILTROS.map((f) => {
            const on = activos[f.id]
            return (
              <button
                key={f.id}
                onClick={() => setActivos((s) => ({ ...s, [f.id]: !s[f.id] }))}
                className={cn(
                  'flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition',
                  on ? 'border-ok/30 bg-ok/10 text-fg' : 'border-line bg-panel text-muted hover:text-fg'
                )}
              >
                <span className={cn('grid size-4 place-items-center rounded-full', on ? 'bg-ok text-bg' : 'bg-bad/20 text-bad')}>
                  {on ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
                </span>
                {f.label}
              </button>
            )
          })}
        </div>
        <div className="flex gap-2 xl:ml-auto">
          <div className="relative min-w-0 flex-1 xl:w-48 xl:flex-none">
            <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar" className="pl-9" />
          </div>
          <div className="w-36 shrink-0">
            <Select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="todas">Categorías</option>
              {categorias.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div className="w-40 shrink-0">
            <Select value={orden} onChange={(e) => setOrden(e.target.value)}>
              <option value="score">Mayor score</option>
              <option value="margen">Mayor margen</option>
              <option value="competencia">Menos competencia</option>
              <option value="dias">Más días activo</option>
            </Select>
          </div>
        </div>
      </div>

      {error ? (
        <Card>
          <EmptyState icon={ShieldAlert} title="No se pudo leer la tabla productos" text={error} action={<Button onClick={cargar}>Reintentar</Button>} />
        </Card>
      ) : cargando && filas.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] rounded-none" />
              <div className="p-4">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="mt-3 h-3 w-1/2" />
                <Skeleton className="mt-4 h-16" />
              </div>
            </Card>
          ))}
        </div>
      ) : lista.length === 0 ? (
        <Card>
          {filas.length === 0 ? (
            <EmptyState icon={Package} title="El Radar aún no tiene productos" text="Cuando el flujo de n8n analice nuevos anuncios, los productos aparecen aquí." />
          ) : (
            <EmptyState
              icon={SearchX}
              title="Ningún producto cumple estos filtros"
              text="Desactiva algún filtro o cambia la búsqueda."
              action={
                <Button
                  onClick={() => {
                    setActivos({ score: false, ia: false, competencia: false, dias: false, margen: false })
                    setQ('')
                    setCat('todas')
                  }}
                >
                  Quitar filtros
                </Button>
              }
            />
          )}
        </Card>
      ) : (
        <>
          <p className="mb-3 text-xs text-muted">
            {lista.length} de {porVista.length} productos cumplen los filtros activos
          </p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {lista.map((p) => (
              <ProductoCard key={p.id} p={p} onAbrir={() => abrir(p)} />
            ))}
          </div>
        </>
      )}

      {abierto && (
        <Detalle
          p={abierto}
          onClose={() => abrir(null)}
          onEstado={(e) => cambiarEstado(abierto, e)}
          lanzamiento={lanzamientos.find((l) => l.productoId === abierto.id)}
          onLanzar={async () => {
            const r = await crearLanzamiento(abierto)
            if (r.error) return toast(`No se creó: ${r.error}`, 'warn')
            toast(r.existente ? `Abriendo ${r.id}` : `Lanzamiento ${r.id} creado`)
            nav(`/lanzamientos/${r.id}`)
          }}
        />
      )}
    </>
  )
}

function Imagen({ src, slug, className }) {
  const [rota, setRota] = useState(false)
  if (!src || rota) return <Thumb hue={hue(slug)} className={className} rounded="rounded-none" />
  return <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setRota(true)} className={cn('object-cover', className)} />
}

function ProductoCard({ p, onAbrir }) {
  const v = VEREDICTO[p.veredicto_ia]
  const m = margen(p)
  const n = p.num_anunciantes ?? 0
  return (
    <Card className={cn('group flex flex-col overflow-hidden transition hover:border-line-strong', p.estado === 'descartado' && 'opacity-60')}>
      <button onClick={onAbrir} className="relative cursor-pointer text-left">
        <Imagen src={p.ejemplos?.[0]?.imagen} slug={p.slug} className="aspect-[4/3] w-full bg-panel" />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <Badge tone="gray" className="bg-black/60 backdrop-blur">{titulo(p.categoria) || 'Sin categoría'}</Badge>
          <div className="flex flex-col items-center rounded-xl bg-black/70 px-2.5 py-1 backdrop-blur">
            <span className={cn('text-lg leading-none font-bold', tonoScore(p.score))}>{p.score}</span>
            <span className="text-[9px] tracking-wide text-muted uppercase">score</span>
          </div>
        </div>
      </button>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm leading-snug font-medium">{p.nombre}</h3>
          {v && <Badge tone={v.tone}>{v.txt}</Badge>}
        </div>
        {p.angulo && <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{p.angulo}</p>}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Dato label="Venta" value={precio(p) ? cop(precio(p)) : '—'} />
          <Dato label={p.costo_dropi != null ? 'Costo Dropi' : 'Costo est.'} value={costo(p) != null ? cop(costo(p)) : '—'} />
          <Dato label="Margen" value={m != null ? cop(m) : '—'} tone={m == null ? '' : m >= 25000 ? 'text-ok' : m > 0 ? 'text-accent' : 'text-bad'} />
        </div>

        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-panel px-3 py-2 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <Store size={13} /> {n} anunciante{n === 1 ? '' : 's'}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {miles(p.max_dias_activo ?? 0)} d
          </span>
          <Semaforo level={nivel(n)} />
        </div>

        <Button className="mt-4 w-full" onClick={onAbrir}>
          Ver análisis
        </Button>
      </div>
    </Card>
  )
}

function Dato({ label, value, tone }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-2.5 py-2">
      <div className="text-[10px] text-faint">{label}</div>
      <div className={cn('mt-0.5 truncate text-[13px] font-semibold', tone)}>{value}</div>
    </div>
  )
}

function Detalle({ p, onClose, onEstado, onLanzar, lanzamiento }) {
  const [anuncios, setAnuncios] = useState(null)
  const [lanzando, setLanzando] = useState(false)
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [onClose])
  useEffect(() => {
    setAnuncios(null)
    supabase
      .from('anuncios')
      .select('ad_archive_id,page_name,titulo,texto,imagen_url,link_url,dias_activo,last_seen')
      .eq('producto_slug', p.slug)
      .order('dias_activo', { ascending: false })
      .limit(30)
      .then(({ data }) => setAnuncios(data || []))
  }, [p.slug])

  const v = VEREDICTO[p.veredicto_ia]
  const m = margen(p)
  const cpaMax = m != null ? Math.round((m * PARAMETROS.tasaEntrega) / 100) * 100 : null
  const desglose = p.desglose || {}

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <aside className="relative flex h-full w-full animate-fade-in flex-col border-l border-line bg-bg shadow-2xl sm:max-w-xl">
        <header className="flex items-start gap-3 border-b border-line p-4 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {v && <Badge tone={v.tone}>{v.txt}</Badge>}
              <Badge tone="gray">{titulo(p.categoria)}</Badge>
              {p.estado === 'descartado' && <Badge tone="bad">Descartado</Badge>}
            </div>
            <h2 className="mt-2 text-lg leading-snug font-semibold">{p.nombre}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar" className="-mr-2">
            <X size={18} />
          </Button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-5">
          {/* Ejemplos de anuncios que inspiraron el análisis */}
          {p.ejemplos?.length > 0 && (
            <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:-mx-5 sm:px-5">
              {p.ejemplos.map((e) => (
                <a key={e.id} href={e.link} target="_blank" rel="noreferrer" className="w-48 shrink-0 snap-start overflow-hidden rounded-xl border border-line bg-card">
                  <Imagen src={e.imagen} slug={p.slug + e.id} className="aspect-square w-full" />
                  <div className="p-2.5">
                    <div className="truncate text-xs font-medium">{e.pagina}</div>
                    <div className="text-[11px] text-muted">{e.dias} días activo</div>
                  </div>
                </a>
              ))}
            </div>
          )}

          <section className="grid gap-4 sm:grid-cols-[auto_1fr]">
            <div className="flex flex-col items-center justify-center rounded-xl border border-line bg-card px-6 py-4">
              <span className={cn('text-4xl font-bold', tonoScore(p.score))}>{p.score}</span>
              <span className="text-xs text-muted">score / 100</span>
            </div>
            <div className="space-y-2">
              {DESGLOSE.map(([k, label]) =>
                desglose[k] == null ? null : (
                  <div key={k}>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted">{label}</span>
                      <span className="font-medium tabular-nums">{desglose[k]}</span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={cn('h-full rounded-full', desglose[k] >= 70 ? 'bg-ok' : desglose[k] >= 45 ? 'bg-accent' : 'bg-bad')} style={{ width: `${desglose[k]}%` }} />
                    </div>
                  </div>
                )
              )}
            </div>
          </section>

          {p.angulo && <Bloque icon={Target} titulo="Ángulo sugerido" texto={p.angulo} />}
          {p.riesgos && <Bloque icon={ShieldAlert} titulo="Riesgos" texto={p.riesgos} tono="text-accent" />}

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Calculator size={15} className="text-muted" /> Números estimados (1 unidad)
            </h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Dato label="Venta" value={precio(p) ? cop(precio(p)) : '—'} />
              <Dato label="Costo" value={costo(p) != null ? cop(costo(p)) : '—'} />
              <Dato label="Margen" value={m != null ? cop(m) : '—'} tone={m != null && m > 0 ? 'text-ok' : 'text-bad'} />
              <Dato label="CPA máximo" value={cpaMax != null ? cop(cpaMax) : '—'} tone="text-accent" />
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-faint">
              {p.costo_dropi != null
                ? `Costo de Dropi${p.dropi_proveedor ? ` · ${p.dropi_proveedor}` : ''}${p.stock_dropi != null ? ` · stock ${miles(p.stock_dropi)}` : ''}.`
                : 'Costo estimado por IA: aún no se ha cruzado con Dropi.'}{' '}
              Descuenta flete {cop(PARAMETROS.flete)} y recaudo {Math.round(PARAMETROS.recaudo * 100)}%; CPA con {Math.round(PARAMETROS.tasaEntrega * 100)}% de entrega.
            </p>
          </section>

          <section>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Megaphone size={15} className="text-muted" /> Competencia en Meta
              <span className="text-xs font-normal text-faint">
                {p.num_anunciantes ?? 0} anunciantes · {p.num_anuncios ?? 0} anuncios
              </span>
            </h3>
            {anuncios === null ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : anuncios.length === 0 ? (
              <p className="rounded-xl border border-line bg-card p-4 text-sm text-muted">No hay anuncios guardados para este producto.</p>
            ) : (
              <div className="space-y-2">
                {anuncios.map((a) => (
                  <a
                    key={a.ad_archive_id}
                    href={a.link_url || `https://www.facebook.com/ads/library/?id=${a.ad_archive_id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex gap-3 rounded-xl border border-line bg-card p-2.5 transition hover:border-line-strong"
                  >
                    <Imagen src={a.imagen_url} slug={a.ad_archive_id} className="size-14 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{a.page_name}</span>
                        <span className={cn('flex shrink-0 items-center gap-1 text-xs', a.dias_activo >= 30 ? 'text-accent' : 'text-muted')}>
                          <Clock size={11} /> {a.dias_activo ?? 0} d
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted">{a.titulo || a.texto}</p>
                    </div>
                    <ExternalLink size={13} className="mt-1 shrink-0 text-faint" />
                  </a>
                ))}
              </div>
            )}
          </section>
        </div>

        <footer className="flex gap-2 border-t border-line p-4 sm:p-5">
          {p.estado === 'descartado' ? (
            <Button icon={Undo2} onClick={() => onEstado('nuevo')} className="flex-1">
              Volver al Radar
            </Button>
          ) : (
            <Button variant="danger" icon={Trash2} onClick={() => onEstado('descartado')} className="flex-1">
              Descartar
            </Button>
          )}
          <Button
            variant="primary"
            icon={Rocket}
            loading={lanzando}
            className="flex-1"
            onClick={async () => {
              setLanzando(true)
              await onLanzar()
              setLanzando(false)
            }}
          >
            {lanzamiento ? `Ver ${lanzamiento.id}` : 'Lanzar'}
          </Button>
        </footer>
      </aside>
    </div>
  )
}

function Bloque({ icon: Icon, titulo: t, texto, tono }) {
  return (
    <section>
      <h3 className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
        <Icon size={15} className={tono || 'text-muted'} /> {t}
      </h3>
      <p className="rounded-xl border border-line bg-card p-3 text-sm leading-relaxed text-[#D1D5DB]">{texto}</p>
    </section>
  )
}
