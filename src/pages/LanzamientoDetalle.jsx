import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, BarChart2, Wand2, Images, Megaphone, LayoutTemplate, Target, SearchX, ExternalLink, ArrowRight } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton, Tabs, useFakeLoading, useToast } from '../components/ui'
import { ProductThumb } from '../components/brand'
import DemoAviso from '../components/DemoAviso'
import { Stepper, VeredictoBadge } from '../components/launch'
import { useStore } from '../store'
import { ETAPAS } from '../data/mock'
import { cop, miles } from '../lib/format'
import Analisis from './lanzamiento/Analisis'
import Prompts from './lanzamiento/Prompts'
import Creativos from './lanzamiento/Creativos'
import Anuncios from './lanzamiento/Anuncios'
import Landing from './lanzamiento/Landing'
import Campana from './lanzamiento/Campana'

const TABS = [
  { id: 'analisis', label: 'Análisis', icon: BarChart2 },
  { id: 'prompts', label: 'Prompts', icon: Wand2 },
  { id: 'creativos', label: 'Creativos', icon: Images },
  { id: 'anuncios', label: 'Anuncios', icon: Megaphone },
  { id: 'landing', label: 'Landing', icon: LayoutTemplate },
  { id: 'campana', label: 'Campaña', icon: Target },
]
const TAB_DE_ETAPA = ['analisis', 'prompts', 'creativos', 'anuncios', 'landing', 'campana', 'campana']

export default function LanzamientoDetalle() {
  const { id } = useParams()
  const { lanzamientos, actualizarLanzamiento, cargaLenta } = useStore()
  const [params, setParams] = useSearchParams()
  const toast = useToast()
  const loading = useFakeLoading(cargaLenta ? 2500 : 600, id)
  const l = lanzamientos.find((x) => x.id === id)

  if (!l) {
    return (
      <Card>
        <EmptyState
          icon={SearchX}
          title={`No encontramos el lanzamiento ${id}`}
          text="Puede que se haya eliminado o que el código esté mal escrito."
          action={
            <Link to="/lanzamientos">
              <Button>Ver lanzamientos</Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const tab = params.get('tab') || TAB_DE_ETAPA[l.etapa]
  const setTab = (t) => setParams({ tab: t }, { replace: true })
  const p = l.producto

  const avanzar = () => {
    if (l.etapa >= 6) return
    actualizarLanzamiento(l.id, { etapa: l.etapa + 1 })
    setTab(TAB_DE_ETAPA[l.etapa + 1])
    toast(`Etapa "${ETAPAS[l.etapa]}" completada`)
  }

  return (
    <>
      <Link to="/lanzamientos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft size={16} /> Lanzamientos
      </Link>

      <Card className="mb-6 overflow-hidden">
        <div className="relative p-4 sm:p-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: `radial-gradient(60% 120% at 0% 0%, hsl(${p.hue} 80% 40% / 0.18), transparent 60%)` }}
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center">
            {loading ? (
              <Skeleton className="size-20 rounded-2xl" />
            ) : (
              <ProductThumb p={p} className="size-20 rounded-2xl ring-1 ring-white/10 sm:size-24" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-line bg-panel px-1.5 py-0.5 font-mono text-[11px] text-muted">{l.id}</span>
                <VeredictoBadge v={l.veredicto} />
                <DemoAviso />
              </div>
              <h1 className="mt-2 text-lg leading-snug font-semibold tracking-tight sm:text-2xl">{p.nombre}</h1>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                <span>Costo Dropi {cop(p.costo)}</span>
                <span>{miles(p.v7)} ventas/7d</span>
                <span>Stock {miles(p.stock)}</span>
                <span className="inline-flex items-center gap-1">
                  {p.proveedor} <ExternalLink size={11} />
                </span>
              </div>
            </div>
            {l.etapa < 6 && l.veredicto !== 'DESCARTAR' && (
              <Button variant="primary" onClick={avanzar} className="self-start md:self-center">
                Completar {ETAPAS[l.etapa].toLowerCase()} <ArrowRight size={16} />
              </Button>
            )}
          </div>
          <div className="relative mt-6 border-t border-line pt-4">
            <Stepper etapa={l.etapa} onSelect={(i) => setTab(TAB_DE_ETAPA[i])} />
          </div>
        </div>
      </Card>

      <Tabs tabs={TABS} value={tab} onChange={setTab} className="mb-6" />

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
      ) : (
        <div key={tab} className="animate-fade-in">
          {tab === 'analisis' && <Analisis l={l} />}
          {tab === 'prompts' && <Prompts l={l} />}
          {tab === 'creativos' && <Creativos l={l} />}
          {tab === 'anuncios' && <Anuncios l={l} />}
          {tab === 'landing' && <Landing l={l} />}
          {tab === 'campana' && <Campana l={l} />}
        </div>
      )}
    </>
  )
}
