import { useEffect, useState } from 'react'
import { Plug, SlidersHorizontal, FlaskConical, CheckCircle2, AlertTriangle, CircleOff, Store, Save, BellRing, Smartphone } from 'lucide-react'
import { Badge, Button, Card, CardHeader, Field, Input, PageHeader, Switch, useToast } from '../components/ui'
import { useStore } from '../store'
import { INTEGRACIONES, PARAMETROS } from '../data/mock'
import { WEBHOOK } from '../lib/supabase'
import { fechaCorta } from '../lib/mapeo'
import { miles } from '../lib/format'
import { avisosActivos, avisosDisponibles, pedirPermisoAvisos } from '../lib/avisos'

const EST = {
  ok: { tone: 'ok', icon: CheckCircle2, txt: 'Conectado' },
  warn: { tone: 'warn', icon: AlertTriangle, txt: 'Revisar' },
  off: { tone: 'gray', icon: CircleOff, txt: 'Sin conectar' },
}

const num = (v) => Number(String(v).replace(/\D/g, '')) || 0

export default function Configuracion() {
  const { modo, vacio, setVacio, cargaLenta, setCargaLenta, config, guardarConfig, metricas, faltanTablas, autorizado } = useStore()
  const toast = useToast()
  const real = modo === 'real'
  const [f, setF] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [avisos, setAvisos] = useState(avisosActivos())

  useEffect(() => {
    const c = config || {}
    setF({
      marca: c.marca ?? 'Ingenio Store',
      dominio: c.dominio ?? 'ingeniostore.co',
      whatsapp: c.whatsapp ?? '',
      carpeta_drive: c.carpeta_drive ?? '/Ingenio Store/Lanzamientos',
      flete: c.flete ?? PARAMETROS.flete,
      recaudo: Math.round(Number(c.recaudo ?? PARAMETROS.recaudo) * 1000) / 10,
      entrega: Math.round(Number(c.tasa_entrega ?? PARAMETROS.tasaEntrega) * 1000) / 10,
    })
  }, [config])

  if (!f) return null
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const puedeGuardar = real && !faltanTablas && !!config

  const guardar = async () => {
    if (!puedeGuardar) return toast(real ? 'Ejecuta el SQL 002 para guardar la configuración' : 'En modo demo no se guarda', 'info')
    setGuardando(true)
    const r = await guardarConfig({
      marca: f.marca,
      dominio: f.dominio,
      whatsapp: f.whatsapp,
      carpeta_drive: f.carpeta_drive,
      flete: num(f.flete),
      recaudo: Number(f.recaudo) / 100,
      tasa_entrega: Number(f.entrega) / 100,
    })
    setGuardando(false)
    toast(r.error ? `No se guardó: ${r.error}` : 'Configuración guardada', r.error ? 'warn' : 'ok')
  }

  const ultimaMetrica = metricas.length ? metricas[metricas.length - 1].fecha : null
  const integraciones = real
    ? [
        { id: 'supabase', nombre: 'Supabase', desc: autorizado === false ? 'Tu correo no está en la lista blanca' : 'Base de datos, login y tiempo real', estado: autorizado === false ? 'warn' : 'ok' },
        { id: 'n8n', nombre: 'n8n', desc: WEBHOOK ? 'Webhook del panel: responder y enviar guía' : 'Falta VITE_N8N_WEBHOOK', estado: WEBHOOK ? 'ok' : 'off' },
        { id: 'meta', nombre: 'Meta Ads', desc: ultimaMetrica ? `Métricas guardadas hasta el ${fechaCorta(ultimaMetrica)} · falta sincronización diaria en n8n` : 'Sin métricas guardadas', estado: ultimaMetrica ? 'warn' : 'off' },
        { id: 'storage', nombre: 'Supabase Storage', desc: 'Bucket "creativos" para archivos de Flow', estado: faltanTablas ? 'off' : 'ok' },
        { id: 'whatsapp', nombre: 'WhatsApp Business', desc: 'Lo maneja n8n (confirmaciones y guías)', estado: WEBHOOK ? 'ok' : 'off' },
        { id: 'dropi', nombre: 'Dropi', desc: 'Costo, stock y proveedor de los productos del Radar', estado: 'off' },
        { id: 'shopify', nombre: 'Shopify', desc: 'Los pedidos llegan por n8n · landing se copia como HTML', estado: 'ok' },
      ]
    : INTEGRACIONES

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Tienda, integraciones y parámetros de cálculo"
        actions={
          <Button variant="primary" icon={Save} loading={guardando} onClick={guardar}>
            Guardar cambios
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-4 lg:col-span-2 lg:space-y-6">
          <Card>
            <CardHeader title="Tienda" icon={Store} />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Nombre de la marca">
                <Input value={f.marca} onChange={set('marca')} />
              </Field>
              <Field label="Dominio">
                <Input value={f.dominio} onChange={set('dominio')} />
              </Field>
              <Field label="WhatsApp de atención">
                <Input value={f.whatsapp} onChange={set('whatsapp')} placeholder="+57 300 000 0000" />
              </Field>
              <Field label="Carpeta de Drive">
                <Input value={f.carpeta_drive} onChange={set('carpeta_drive')} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Integraciones" subtitle={real ? 'Estado real de las conexiones' : 'Conexiones que usa el backend (n8n + Supabase)'} icon={Plug} />
            <div className="divide-y divide-line p-2">
              {integraciones.map((i) => {
                const e = EST[i.estado]
                return (
                  <div key={i.id} className="flex items-center gap-3 px-3 py-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg border border-line bg-panel text-xs font-semibold text-muted">{i.nombre.slice(0, 2)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{i.nombre}</div>
                      <div className="text-xs text-muted">{i.desc}</div>
                    </div>
                    <Badge tone={e.tone} icon={e.icon}>{e.txt}</Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <Card>
            <CardHeader title="Parámetros de margen" subtitle="Se usan en Radar, Análisis, Campaña y Resultados" icon={SlidersHorizontal} />
            <div className="space-y-4 p-5">
              <Field label="Flete promedio (COP)">
                <Input inputMode="numeric" value={miles(num(f.flete))} onChange={(e) => setF({ ...f, flete: num(e.target.value) })} />
              </Field>
              <Field label="Comisión de recaudo (%)">
                <Input type="number" step="0.1" value={f.recaudo} onChange={set('recaudo')} />
              </Field>
              <Field label="Tasa de entrega esperada (%)" hint="Porcentaje de pedidos despachados que se entregan y pagan">
                <Input type="number" step="1" value={f.entrega} onChange={set('entrega')} />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Avisos y app" icon={BellRing} />
            <div className="space-y-4 p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-sm">Avisos de pedidos y mensajes</div>
                  <div className="text-xs text-muted">Sonido y notificación del navegador</div>
                </div>
                {avisosDisponibles() ? (
                  avisos ? <Badge tone="ok">Activos</Badge> : <Button size="sm" onClick={async () => setAvisos(await pedirPermisoAvisos())}>Activar</Button>
                ) : (
                  <Badge tone="gray">No disponible</Badge>
                )}
              </div>
              <div className="flex gap-3 rounded-xl border border-line bg-panel p-3 text-xs leading-relaxed text-muted">
                <Smartphone size={16} className="mt-0.5 shrink-0 text-brand" />
                En el celular abre el panel en Chrome o Safari y elige "Agregar a pantalla de inicio" para usarlo como app.
              </div>
            </div>
          </Card>

          {!real && (
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
          )}
        </div>
      </div>
    </>
  )
}
