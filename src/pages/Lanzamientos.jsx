import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Rocket, Radar, ChevronRight, User } from 'lucide-react'
import { Button, Card, EmptyState, PageHeader, Segmented, Skeleton, useFakeLoading } from '../components/ui'
import { ProductThumb } from '../components/brand'
import { MiniEtapas, VeredictoBadge } from '../components/launch'
import { useStore } from '../store'
import { ETAPAS } from '../data/mock'

export default function Lanzamientos() {
  const { lanzamientos, cargaLenta, cargandoDatos, faltanTablas } = useStore()
  const loading = useFakeLoading(cargaLenta ? 2500 : 550) || cargandoDatos
  const [f, setF] = useState('activos')
  const lista = lanzamientos.filter((l) =>
    f === 'activos' ? l.veredicto !== 'DESCARTAR' && l.etapa < 6 : f === 'ventas' ? l.etapa === 6 : f === 'descartados' ? l.veredicto === 'DESCARTAR' : true
  )

  return (
    <>
      <PageHeader title="Lanzamientos" subtitle="Cada producto que pasa por el ciclo completo" />
      <Segmented
        className="mb-5"
        value={f}
        onChange={setF}
        options={[
          { id: 'activos', label: 'En curso' },
          { id: 'ventas', label: 'Vendiendo' },
          { id: 'descartados', label: 'Descartados' },
          { id: 'todos', label: 'Todos' },
        ]}
      />
      <Card className="overflow-hidden">
        {loading ? (
          <div className="divide-y divide-line">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <Skeleton className="size-12 rounded-xl" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="mt-2 h-2 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : faltanTablas ? (
          <EmptyState
            icon={Rocket}
            title="Falta crear la tabla de lanzamientos"
            text="Ejecuta supabase/migrations/002_lanzamientos_config_metricas.sql en el SQL Editor de Supabase y recarga."
          />
        ) : lista.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title="No hay lanzamientos aquí"
            text="Elige un producto en el Radar para iniciar un lanzamiento."
            action={
              <Link to="/radar">
                <Button variant="primary" icon={Radar}>Ir al Radar</Button>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-line">
            {lista.map((l) => (
              <Link key={l.id} to={`/lanzamientos/${l.id}`} className="group grid grid-cols-[auto_1fr_auto] items-center gap-4 p-4 transition hover:bg-white/[0.02] md:grid-cols-[auto_2fr_2fr_auto_auto]">
                <ProductThumb p={l.producto} className="size-12" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{l.producto.nombre}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-faint">
                    <span>{l.id}</span>·<span>{l.creado}</span>
                    <span className="hidden items-center gap-1 sm:flex">· <User size={11} /> {l.responsable}</span>
                  </div>
                  <div className="mt-2 md:hidden">
                    <MiniEtapas etapa={l.etapa} descartado={l.veredicto === 'DESCARTAR'} />
                  </div>
                </div>
                <div className="hidden md:block">
                  <MiniEtapas etapa={l.etapa} descartado={l.veredicto === 'DESCARTAR'} />
                  <div className="mt-1.5 text-xs text-muted">
                    {ETAPAS[l.etapa]} · paso {l.etapa + 1} de {ETAPAS.length}
                  </div>
                </div>
                <VeredictoBadge v={l.veredicto} className="hidden md:inline-flex" />
                <ChevronRight size={16} className="text-faint transition group-hover:translate-x-0.5 group-hover:text-fg" />
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
