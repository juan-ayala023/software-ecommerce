import { Routes, Route, Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import Layout from './components/Layout'
import { Button, EmptyState, ToastProvider } from './components/ui'
import { LogoMark } from './components/brand'
import { StoreProvider, useStore } from './store'
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
  return (
    <StoreProvider>
      <ToastProvider>
        <Acceso />
      </ToastProvider>
    </StoreProvider>
  )
}

// Con Supabase configurado, el panel exige sesión
function Acceso() {
  const { modo, session, cargandoSesion } = useStore()
  if (modo === 'real' && cargandoSesion) {
    return (
      <div className="grid h-full place-items-center">
        <div className="animate-pulse">
          <LogoMark size={44} />
        </div>
      </div>
    )
  }
  if (modo === 'real' && !session) return <Login />
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
