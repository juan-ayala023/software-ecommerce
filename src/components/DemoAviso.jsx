import { FlaskConical } from 'lucide-react'
import { Badge } from './ui'
import { useStore } from '../store'

// Marca las secciones que siguen con datos de ejemplo cuando el panel ya está conectado
export default function DemoAviso() {
  const { modo } = useStore()
  if (modo !== 'real') return null
  return (
    <Badge tone="violet" icon={FlaskConical} className="text-xs">
      Datos de ejemplo
    </Badge>
  )
}
