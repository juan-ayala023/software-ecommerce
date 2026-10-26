import { useRef, useState } from 'react'
import { RotateCcw, Replace, CheckCircle2, AlertTriangle, Play, Gift, Zap, Sparkles, Images } from 'lucide-react'
import { Badge, Button, Card, EmptyState, Progress, Segmented, cn, useToast } from '../../components/ui'
import { Thumb } from '../../components/brand'
import { CREATIVOS } from '../../data/mock'

const COSTO = { img: 4, video: 20 }

export default function Creativos({ l }) {
  const toast = useToast()
  const [modo, setModo] = useState('gratis')
  const [creditos, setCreditos] = useState(340)
  const [items, setItems] = useState(CREATIVOS)
  const [filtro, setFiltro] = useState('todos')

  const rehacer = (c) => {
    if (modo === 'auto') {
      if (creditos < COSTO[c.tipo]) return toast('No tienes créditos suficientes', 'warn')
      setCreditos((x) => x - COSTO[c.tipo])
    }
    setItems((s) => s.map((x) => (x.id === c.id ? { ...x, rehaciendo: true } : x)))
    setTimeout(() => {
      setItems((s) => s.map((x) => (x.id === c.id ? { ...x, rehaciendo: false, fiel: true, hue: x.hue + 8 } : x)))
      toast(modo === 'auto' ? `${c.titulo} regenerado (−${COSTO[c.tipo]} créditos)` : `${c.titulo}: prompt reenviado a Prompts`)
    }, 1600)
  }
  const reemplazar = (c, file) => {
    setItems((s) => s.map((x) => (x.id === c.id ? { ...x, url: URL.createObjectURL(file), esVideo: file.type.startsWith('video'), fiel: true } : x)))
    toast(`${c.titulo} reemplazado`)
  }

  const lista = items.filter((c) => filtro === 'todos' || (filtro === 'revisar' ? !c.fiel : c.tipo === filtro))
  const revisar = items.filter((c) => !c.fiel).length

  return (
    <>
      <Card className="mb-6 flex flex-col gap-4 p-4 sm:p-5 md:flex-row md:items-center">
        <div>
          <div className="mb-2 text-xs font-medium text-muted">Modo de generación</div>
          <Segmented
            value={modo}
            onChange={setModo}
            options={[
              { id: 'gratis', label: 'Gratis (subo desde Flow)', icon: Gift },
              { id: 'auto', label: 'Automático (créditos IA)', icon: Zap },
            ]}
          />
        </div>
        <div className={cn('rounded-xl border border-line bg-panel p-3 transition md:ml-auto md:w-64', modo !== 'auto' && 'opacity-50')}>
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <Sparkles size={13} className="text-accent" /> Créditos IA
            </span>
            <span className="font-semibold">
              {creditos} <span className="font-normal text-faint">/ 500</span>
            </span>
          </div>
          <Progress value={(creditos / 500) * 100} tone="warn" className="mt-2" />
          <div className="mt-1.5 text-[11px] text-faint">Imagen {COSTO.img} · Video {COSTO.video} créditos</div>
        </div>
      </Card>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          ['todos', `Todos (${items.length})`],
          ['img', 'Imágenes'],
          ['video', 'Videos'],
          ['revisar', `Por revisar (${revisar})`],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFiltro(id)}
            className={cn('cursor-pointer rounded-full border px-3 py-1 text-xs transition', filtro === id ? 'border-brand/40 bg-brand/10 text-fg' : 'border-line text-muted hover:text-fg')}
          >
            {label}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <Card>
          <EmptyState icon={Images} title="Nada por aquí" text={filtro === 'revisar' ? 'Todos los creativos pasaron el control de calidad.' : 'Aún no hay creativos de este tipo.'} />
        </Card>
      ) : (
        <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {lista.map((c) => (
            <Creativo key={c.id} c={c} emoji={l.producto.emoji} onRehacer={() => rehacer(c)} onReemplazar={(f) => reemplazar(c, f)} />
          ))}
        </div>
      )}
    </>
  )
}

function Creativo({ c, emoji, onRehacer, onReemplazar }) {
  const input = useRef(null)
  const vid = useRef(null)
  const [hover, setHover] = useState(false)
  const esVideo = c.tipo === 'video'

  return (
    <Card className="overflow-hidden">
      <div
        className={cn('relative overflow-hidden', esVideo ? 'aspect-[9/16]' : 'aspect-square')}
        onMouseEnter={() => {
          setHover(true)
          vid.current?.play()
        }}
        onMouseLeave={() => {
          setHover(false)
          vid.current?.pause()
        }}
      >
        {c.url ? (
          c.esVideo ? (
            <video ref={vid} src={c.url} muted loop playsInline className="size-full object-cover" />
          ) : (
            <img src={c.url} alt={c.titulo} className="size-full object-cover" />
          )
        ) : (
          <Thumb hue={c.hue} emoji={emoji} className={cn('size-full', esVideo && hover && 'animate-kenburns')} rounded="rounded-none" />
        )}

        {c.rehaciendo && (
          <div className="absolute inset-0 grid place-items-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 text-xs text-muted">
              <RotateCcw size={20} className="animate-spin text-brand" /> Rehaciendo…
            </div>
          </div>
        )}

        {esVideo && !c.rehaciendo && (
          <>
            <div className={cn('absolute inset-0 grid place-items-center transition', hover ? 'opacity-0' : 'opacity-100')}>
              <span className="grid size-11 place-items-center rounded-full bg-black/50 backdrop-blur">
                <Play size={18} className="ml-0.5 text-white" fill="white" />
              </span>
            </div>
            <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 text-[10px] text-white">{c.dur}</span>
            {hover && !c.url && (
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
                <div className="h-full animate-progress bg-brand" />
              </div>
            )}
          </>
        )}

        <div className="absolute top-2 left-2">
          {c.fiel ? (
            <Badge tone="ok" icon={CheckCircle2} className="bg-black/60 backdrop-blur">Producto fiel</Badge>
          ) : (
            <Badge tone="warn" icon={AlertTriangle} className="bg-black/60 backdrop-blur">Revisar</Badge>
          )}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{c.titulo}</span>
          <span className="text-[11px] text-faint">{esVideo ? '9:16' : '1:1'}</span>
        </div>
        {!c.fiel && <p className="mt-1 text-[11px] leading-snug text-accent">El producto se ve distinto al original</p>}
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <Button size="xs" icon={RotateCcw} onClick={onRehacer} disabled={c.rehaciendo}>
            Rehacer
          </Button>
          <Button size="xs" icon={Replace} onClick={() => input.current.click()}>
            Reemplazar
          </Button>
          <input ref={input} type="file" hidden accept={esVideo ? 'video/*' : 'image/*'} onChange={(e) => e.target.files[0] && onReemplazar(e.target.files[0])} />
        </div>
      </div>
    </Card>
  )
}
