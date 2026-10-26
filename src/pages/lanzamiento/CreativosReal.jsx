import { useEffect, useRef, useState } from 'react'
import { Replace, Trash2, Download, Images, Play, RefreshCw, UploadCloud } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton, cn, useToast } from '../../components/ui'
import { borrarCreativo, listarCreativos, subirCreativo } from '../../lib/creativos'

// Galería de lo que se subió en Prompts (bucket creativos/<lanzamiento>/)
export default function CreativosReal({ l, onIrPrompts }) {
  const toast = useToast()
  const [archivos, setArchivos] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const extra = useRef(null)

  const cargar = () => {
    setArchivos(null)
    listarCreativos(l.id).then(({ archivos, error }) => {
      if (error) toast(`No se pudieron leer los archivos: ${error}`, 'warn')
      setArchivos(archivos)
    })
  }
  useEffect(cargar, [l.id])

  const reemplazar = async (a, file) => {
    const r = await subirCreativo(l.id, a.clave, file, a.nombre)
    if (r.error) return toast(`No se subió: ${r.error}`, 'warn')
    toast(`${a.clave} reemplazado`)
    cargar()
  }
  const borrar = async (a) => {
    if (!window.confirm(`¿Eliminar ${a.nombre}?`)) return
    const r = await borrarCreativo(l.id, a.nombre)
    if (r.error) return toast(`No se borró: ${r.error}`, 'warn')
    setArchivos((s) => s.filter((x) => x.nombre !== a.nombre))
  }
  const subirExtra = async (file) => {
    const clave = `extra-${Date.now().toString(36)}`
    const r = await subirCreativo(l.id, clave, file)
    if (r.error) return toast(`No se subió: ${r.error}`, 'warn')
    toast('Creativo agregado')
    cargar()
  }

  const lista = (archivos || []).filter((a) => filtro === 'todos' || (filtro === 'video' ? a.esVideo : !a.esVideo))

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {[
          ['todos', `Todos (${archivos?.length ?? 0})`],
          ['img', 'Imágenes'],
          ['video', 'Videos'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFiltro(id)}
            className={cn('cursor-pointer rounded-full border px-3 py-1 text-xs transition', filtro === id ? 'border-brand/40 bg-brand/10 text-fg' : 'border-line text-muted hover:text-fg')}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <Button size="sm" icon={RefreshCw} onClick={cargar}>
            Actualizar
          </Button>
          <Button size="sm" variant="primary" icon={UploadCloud} onClick={() => extra.current.click()}>
            Subir otro
          </Button>
          <input ref={extra} type="file" accept="image/*,video/*" hidden onChange={(e) => e.target.files[0] && subirExtra(e.target.files[0])} />
        </div>
      </div>

      {archivos === null ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-card" />
          ))}
        </div>
      ) : lista.length === 0 ? (
        <Card>
          <EmptyState
            icon={Images}
            title="Aún no hay creativos"
            text="Sube los resultados de Flow en la pestaña Prompts y aparecen aquí listos para descargar."
            action={onIrPrompts && <Button onClick={onIrPrompts}>Ir a Prompts</Button>}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {lista.map((a) => (
            <Archivo key={a.nombre} a={a} onReemplazar={(f) => reemplazar(a, f)} onBorrar={() => borrar(a)} />
          ))}
        </div>
      )}
    </>
  )
}

function Archivo({ a, onReemplazar, onBorrar }) {
  const input = useRef(null)
  const vid = useRef(null)
  const [hover, setHover] = useState(false)
  return (
    <Card className="overflow-hidden">
      <div
        className={cn('relative overflow-hidden bg-panel', a.esVideo ? 'aspect-[9/16]' : 'aspect-square')}
        onMouseEnter={() => {
          setHover(true)
          vid.current?.play()
        }}
        onMouseLeave={() => {
          setHover(false)
          vid.current?.pause()
        }}
      >
        {a.esVideo ? (
          <>
            <video ref={vid} src={a.url} muted loop playsInline preload="metadata" className="size-full object-cover" />
            <div className={cn('absolute inset-0 grid place-items-center transition', hover ? 'opacity-0' : 'opacity-100')}>
              <span className="grid size-11 place-items-center rounded-full bg-black/50 backdrop-blur">
                <Play size={18} className="ml-0.5 text-white" fill="white" />
              </span>
            </div>
          </>
        ) : (
          <img src={a.url} alt={a.clave} loading="lazy" className="size-full object-cover" />
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium">{a.clave}</span>
          <a href={a.url} download={a.nombre} target="_blank" rel="noreferrer" className="text-faint hover:text-fg" aria-label="Descargar">
            <Download size={15} />
          </a>
        </div>
        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <Button size="xs" icon={Replace} onClick={() => input.current.click()}>
            Reemplazar
          </Button>
          <Button size="xs" variant="danger" icon={Trash2} onClick={onBorrar}>
            Borrar
          </Button>
          <input ref={input} type="file" hidden accept={a.esVideo ? 'video/*' : 'image/*'} onChange={(e) => e.target.files[0] && onReemplazar(e.target.files[0])} />
        </div>
      </div>
    </Card>
  )
}
