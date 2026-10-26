// Constantes del negocio. Los datos (pedidos, productos, lanzamientos…) vienen siempre de Supabase.

export const ETAPAS = ['Análisis', 'Prompts', 'Creativos', 'Anuncios', 'Landing', 'Campaña', 'Ventas']

export const ESTADOS = ['Pendiente', 'Confirmado', 'Cambio de dirección', 'Despachado', 'Entregado', 'Devuelto', 'Cancelado']
export const TONO_ESTADO = {
  Pendiente: 'warn',
  Confirmado: 'info',
  'Cambio de dirección': 'violet',
  Despachado: 'brand',
  Entregado: 'ok',
  Devuelto: 'bad',
  Cancelado: 'gray',
}
export const TRANSPORTADORAS = ['Coordinadora', 'Servientrega', 'Interrapidísimo', 'Envía', 'TCC']

// Valores por defecto; el store los reemplaza con la tabla `configuracion` al cargar
export const PARAMETROS = { flete: 14000, recaudo: 0.03, tasaEntrega: 0.72 }
