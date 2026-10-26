import { useState } from 'react'
import { Plug, SlidersHorizontal, FlaskConical, CheckCircle2, AlertTriangle, CircleOff, Store } from 'lucide-react'
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Switch, useToast } from '../components/ui'
import { useStore } from '../store'
import { INTEGRACIONES, PARAMETROS } from '../data/mock'
import { miles } from '../lib/format'

const EST = {
  ok: { tone: 'ok', icon: CheckCircle2, txt: 'Conectado' },
  warn: { tone: 'warn', icon: AlertTriangle, txt: 'Revisar token' },
  off: { tone: 'gray', icon: CircleOff, txt: 'Sin conectar' },
}

export default function Configuracion() {
  const { vacio, setVacio, cargaLenta, setCargaLenta } = useStore()
  const toast = useToast()
  const [par, setPar] = useState({ flete: PARAMETROS.flete, recaudo: PARAMETROS.recaudo * 100, entrega: PARAMETROS.tasaEntrega * 100 })

  return (
    <>
      <PageHeader title="Configuración" subtitle="Tienda, integraciones y parámetros de cálculo" />
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          <Card>
            <CardHeader title="Tienda" icon={Store} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Nombre de la marca">
                <Input defaultValue="Ingenio Store" />
              </Field>
              <Field label="Dominio">
                <Input defaultValue="ingeniostore.co" />
              </Field>
              <Field label="WhatsApp de atención">
                <Input defaultValue="+57 321 887 4410" />
              </Field>
              <Field label="Carpeta de Drive">
                <Input defaultValue="/Ingenio Store/Lanzamientos" />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Integraciones" subtitle="Conexiones que usa el backend (n8n + Supabase)" icon={Plug} />
            <div className="divide-y divide-line p-2">
              {INTEGRACIONES.map((i) => {
                const e = EST[i.estado]
                return (
                  <div key={i.id} className="flex items-center gap-3 px-3 py-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-panel text-xs font-semibold text-muted">{i.nombre.slice(0, 2)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{i.nombre}</div>
                      <div className="truncate text-xs text-muted">{i.desc}</div>
                    </div>
                    <Badge tone={e.tone} icon={e.icon} className="hidden sm:inline-flex">{e.txt}</Badge>
                    <Button size="sm" onClick={() => toast(`Abriendo ${i.nombre}…`, 'info')}>{i.estado === 'off' ? 'Conectar' : 'Gestionar'}</Button>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader title="Parámetros de margen" subtitle="Se usan en Análisis y Campaña" icon={SlidersHorizontal} />
            <div className="space-y-4 p-5">
              <Field label="Flete promedio (COP)">
                <Input value={miles(par.flete)} onChange={(e) => setPar({ ...par, flete: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
              </Field>
              <Field label="Comisión de recaudo (%)">
                <Input type="number" step="0.5" value={par.recaudo} onChange={(e) => setPar({ ...par, recaudo: +e.target.value })} />
              </Field>
              <Field label="Tasa de entrega esperada (%)">
                <Input type="number" value={par.entrega} onChange={(e) => setPar({ ...par, entrega: +e.target.value })} />
              </Field>
              <Button variant="primary" className="w-full" onClick={() => toast('Parámetros guardados')}>Guardar</Button>
            </div>
          </Card>

          <Card>
            <CardHeader title="Modo demo" subtitle="Para revisar el prototipo" icon={FlaskConical} />
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm">Mostrar estados vacíos</div>
                  <div className="text-xs text-muted">Oculta todos los datos de ejemplo</div>
                </div>
                <Switch checked={vacio} onChange={setVacio} label="Mostrar estados vacíos" />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm">Simular carga lenta</div>
                  <div className="text-xs text-muted">Skeletons de 2,5 s en cada pantalla</div>
                </div>
                <Switch checked={cargaLenta} onChange={setCargaLenta} label="Simular carga lenta" />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
