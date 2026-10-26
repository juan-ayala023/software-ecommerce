import { Routes, Route, Link } from 'react-router-dom'
import { Compass, ServerCrash } from 'lucide-react'
import Layout from './components/Layout'
import { Button, EmptyState, ToastProvider } from './components/ui'
import { LogoMark } from './components/brand'
import { StoreProvider, useStore } from './store'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import RadarPage from './pages/Radar'
import Lanzamientos from './pages/Lanzamientos'
import LanzamientoDetalle from './pages/LanzamientoDetalle'
import Pedidos from './pages/Pedidos'
import Chats from './pages/Chats'
import Resultados from './pages/Resultados'
import Configuracion from './pages/Configuracion'

export default function App() {
  // Sin conexión a Supabase no se muestra nada: el panel no tiene datos de ejemplo
  if (!supabase) return <FaltaConfig />
  return (
    <StoreProvider>
      <ToastProvider>
        <Acceso />
      </ToastProvider>
    </StoreProvider>
  )
}

function FaltaConfig() {
  return (
    <div className="grid min-h-full place-items-center px-4">
      <EmptyState
        icon={ServerCrash}
        title="El panel no está conectado a Supabase"
        text="Faltan las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY. En Vercel: Settings → Environment Variables, agrégalas y vuelve a desplegar (Deployments → Redeploy)."
      />
    </div>
  )
}

// El panel exige sesión
function Acceso() {
  const { session, cargandoSesion } = useStore()
  if (cargandoSesion) {
    return (
      <div className="grid h-full place-items-center">
        <div className="animate-pulse">
          <LogoMark size={44} />
        </div>
      </div>
    )
  }
  if (!session) return <Login />
  return <Rutas />
}

function Rutas() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Inicio />} />
        <Route path="radar" element={<RadarPage />} />
        <Route path="lanzamientos" element={<Lanzamientos />} />
        <Route path="lanzamientos/:id" element={<LanzamientoDetalle />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="chats" element={<Chats />} />
        <Route path="resultados" element={<Resultados />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route
          path="*"
          element={
            <EmptyState
              icon={Compass}
              title="Esta página no existe"
              text="Revisa el enlace o vuelve al inicio."
              action={
                <Link to="/">
                  <Button variant="primary">Ir al inicio</Button>
                </Link>
              }
            />
          }
        />
      </Route>
    </Routes>
  )
}
