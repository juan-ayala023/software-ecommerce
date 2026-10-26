import { useEffect, useRef, useState } from 'react'
import { Copy, Check, UploadCloud, CheckCircle2, ImageIcon, Film, Clock, Trash2, Loader2 } from 'lucide-react'
import { Badge, Button, Card, Progress, cn, useToast } from '../../components/ui'
import { Thumb } from '../../components/brand'
import { promptsBase } from '../../lib/lanzamiento'
import { borrarCreativo, listarCreativos, subirCreativo } from '../../lib/creativos'

export default function Prompts({ l }) {
  const toast = useToast()
  const base = promptsBase(l.producto)
  const [imgs, setImgs] = useState(base.imagenes)
  const [clips, setClips] = useState(base.clips)
  const [cargando, setCargando] = useState(true)
  const total = imgs.length + clips.length
  const recibidos = [...imgs, ...clips].filter((x) => x.estado === 'recibido').length

  // Marca como recibidos los archivos que ya están en el bucket
  useEffect(() => {
    listarCreativos(l.id).then(({ archivos, error }) => {
      if (error) toast(`No se pudieron leer los archivos: ${error}`, 'warn')
      const marcar = (s) => s.map((x) => {
        const a = archivos.find((f) => f.clave === x.id)
        return a ? { ...x, estado: 'recibido', url: a.url, archivo: a.nombre, esVideo: a.esVideo } : x
      })
      setImgs(marcar)
      setClips(marcar)
      setCargando(false)
    })
  }, [l.id, toast])

  const actualizar = (set) => (id, cambios) => set((s) => s.map((x) => (x.id === id ? { ...x, ...cambios } : x)))

  const subir = (set) => async (it, file) => {
    const r = await subirCreativo(l.id, it.id, file, it.archivo)
    if (r.error) return toast(`No se subió: ${r.error}`, 'warn')
    actualizar(set)(it.id, { estado: 'recibido', archivo: r.nombre, url: r.url, esVideo: r.esVideo })
    toast(`${it.titulo} guardado`)
  }

  const quitar = (set) => async (it) => {
    if (it.archivo) {
      const r = await borrarCreativo(l.id, it.archivo)
      if (r.error) return toast(`No se borró: ${r.error}`, 'warn')
    }
    actualizar(set)(it.id, { estado: 'pendiente', url: null, archivo: null })
  }

  return (
    <>
      <Card className="mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
        <div className="flex-1">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium">Archivos recibidos de Flow</span>
            <span className="text-sm text-muted">{cargando ? '…' : `${recibidos} / ${total}`}</span>
          </div>
          <Progress value={(recibidos / total) * 100} className="mt-2" tone={recibidos === total ? 'ok' : 'brand'} />
        </div>
        <p className="text-xs text-faint sm:max-w-xs">
          Copia cada prompt en Google Flow, genera y arrastra el resultado a su tarjeta. Se guarda en Supabase y aparece en Creativos.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Columna titulo="Imágenes de página" icon={ImageIcon} items={imgs} onSubir={subir(setImgs)} onQuitar={quitar(setImgs)} tipo="img" />
        <Columna titulo="Clips de video" icon={Film} items={clips} onSubir={subir(setClips)} onQuitar={quitar(setClips)} tipo="video" />
      </div>
    </>
  )
}

function Columna({ titulo, icon: Icon, items, onSubir, onQuitar, tipo }) {
  const ok = items.filter((x) => x.estado === 'recibido').length
  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className="text-muted" />
        <h2 className="text-sm font-semibold">{titulo}</h2>
        <span className="text-xs text-faint">
          {ok}/{items.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((it) => (
          <PromptCard key={it.id} it={it} tipo={tipo} onSubir={(f) => onSubir(it, f)} onQuitar={() => onQuitar(it)} />
        ))}
      </div>
    </section>
  )
}

function PromptCard({ it, tipo, onSubir, onQuitar }) {
  const toast = useToast()
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(it.prompt)
    } catch {
      /* sin permiso de portapapeles: igual mostramos confirmación */
    }
    setCopiado(true)
    toast(`Prompt ${it.titulo} copiado`)
    setTimeout(() => setCopiado(false), 1600)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{it.titulo}</h3>
        {it.estado === 'recibido' ? <Badge tone="ok" icon={CheckCircle2}>Recibido</Badge> : <Badge tone="warn" icon={Clock}>Pendiente</Badge>}
      </div>
      <p className="mt-0.5 text-xs text-muted">Ángulo: {it.angulo}</p>
      <div className="relative mt-3 rounded-xl border border-line bg-[#0A0D14]">
        <pre className="max-h-28 overflow-y-auto p-3 pr-24 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-[#D1D5DB]">{it.prompt}</pre>
        <Button size="xs" icon={copiado ? Check : Copy} onClick={copiar} className={cn('absolute top-2 right-2', copiado && 'text-ok')}>
          {copiado ? 'Copiado' : 'Copiar'}
        </Button>
      </div>
      <Dropzone it={it} tipo={tipo} onSubir={onSubir} onQuitar={onQuitar} />
    </Card>
  )
}

function Dropzone({ it, tipo, onSubir, onQuitar }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  const [subiendo, setSubiendo] = useState(false)

  const tomar = async (file) => {
    if (!file) return
    setSubiendo(true)
    await onSubir(file)
    setSubiendo(false)
  }
  const medida = tipo === 'video' ? 'h-14 w-8' : 'size-12'

  if (it.estado === 'recibido' && !subiendo) {
    return (
      <div className="mt-3 flex items-center gap-3 rounded-xl border border-ok/25 bg-ok/[0.05] p-2.5">
        {it.url ? (
          it.esVideo ? <video src={it.url} className={cn('rounded-lg object-cover', medida)} muted /> : <img src={it.url} alt="" className={cn('rounded-lg object-cover', medida)} />
        ) : (
          <Thumb hue={it.hue} video={tipo === 'video'} className={medida} rounded="rounded-lg" />
        )}
        <button onClick={() => input.current.click()} className="min-w-0 flex-1 cursor-pointer text-left" title="Reemplazar archivo">
          <div className="flex items-center gap-1.5 text-sm font-medium text-ok">
            <CheckCircle2 size={15} /> Recibido
          </div>
          <div className="truncate text-xs text-muted">{it.archivo || `flow_${it.id.toLowerCase()}.${tipo === 'video' ? 'mp4' : 'png'}`}</div>
        </button>
        <input ref={input} type="file" accept={tipo === 'video' ? 'video/*' : 'image/*'} hidden onChange={(e) => tomar(e.target.files[0])} />
        <Button variant="ghost" size="icon" aria-label="Quitar archivo" onClick={onQuitar}>
          <Trash2 size={15} />
        </Button>
      </div>
    )
  }

  return (
    <button
      onClick={() => input.current.click()}
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        tomar(e.dataTransfer.files[0])
      }}
      disabled={subiendo}
      className={cn(
        'mt-3 flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center transition',
        over ? 'border-brand bg-brand/[0.08]' : 'border-line-strong hover:border-brand/50 hover:bg-white/[0.02]'
      )}
    >
      <input ref={input} type="file" accept={tipo === 'video' ? 'video/*' : 'image/*'} hidden onChange={(e) => tomar(e.target.files[0])} />
      {subiendo ? (
        <span className="flex items-center gap-2 text-sm text-muted">
          <Loader2 size={15} className="animate-spin" /> Subiendo…
        </span>
      ) : (
        <>
          <UploadCloud size={20} className={over ? 'text-brand' : 'text-faint'} />
          <span className="text-sm">Sube aquí el archivo de Flow</span>
          <span className="text-[11px] text-faint">Arrastra o haz clic · {tipo === 'video' ? 'MP4 9:16' : 'PNG/JPG 1:1'}</span>
        </>
      )}
    </button>
  )
}
