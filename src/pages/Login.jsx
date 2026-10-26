import { useState } from 'react'
import { LogIn, Mail, Lock } from 'lucide-react'
import { Button, Card, Field, Input } from '../components/ui'
import { LogoMark } from '../components/brand'
import { supabase } from '../lib/supabase'

const ERRORES = {
  'Invalid login credentials': 'Correo o contraseña incorrectos',
  'Email not confirmed': 'Confirma tu correo antes de entrar',
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const entrar = async (e) => {
    e.preventDefault()
    setCargando(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: clave })
    if (error) setError(ERRORES[error.message] || error.message)
    setCargando(false)
  }

  return (
    <div className="relative grid min-h-full place-items-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_40%_at_50%_0%,rgba(249,115,22,0.15),transparent)]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark size={48} />
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Entrar a Ingenio OS</h1>
          <p className="mt-1 text-sm text-muted">Panel de operación de Ingenio Store</p>
        </div>
        <Card className="p-5 sm:p-6">
          <form onSubmit={entrar} className="space-y-4">
            <Field label="Correo">
              <div className="relative">
                <Mail size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
                <Input type="email" autoComplete="email" required autoFocus value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="tu@correo.com" />
              </div>
            </Field>
            <Field label="Contraseña">
              <div className="relative">
                <Lock size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
                <Input type="password" autoComplete="current-password" required value={clave} onChange={(e) => setClave(e.target.value)} className="pl-9" />
              </div>
            </Field>
            {error && <p className="rounded-lg border border-bad/25 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>}
            <Button type="submit" variant="primary" size="lg" icon={LogIn} loading={cargando} className="w-full">
              Entrar
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-xs text-faint">El acceso lo da el administrador desde Supabase.</p>
      </div>
    </div>
  )
}
