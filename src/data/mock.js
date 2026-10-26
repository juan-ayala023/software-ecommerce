// Datos de ejemplo. Al conectar el backend, estas colecciones vienen de Supabase
// (tablas: productos_radar, lanzamientos, pedidos, chats, resultados_diarios).

export const ETAPAS = ['Análisis', 'Prompts', 'Creativos', 'Anuncios', 'Landing', 'Campaña', 'Ventas']

const combos = (c1, c2, c3) => [
  { qty: 1, precio: c1, antes: Math.round((c1 * 1.6) / 1000) * 1000 - 100 },
  { qty: 2, precio: c2, antes: Math.round((c2 * 1.55) / 1000) * 1000 - 100, principal: true },
  { qty: 3, precio: c3, antes: Math.round((c3 * 1.5) / 1000) * 1000 - 100 },
]

export const PRODUCTOS = [
  { id: 'nexus', nombre: 'Nexus Renovador de Partes Negras 250ml', corto: 'Nexus Renovador', emoji: '🧴', hue: 24, categoria: 'Vehículos', proveedor: 'Distrimax SAS', costo: 8900, v7: 211, total: 1135, stock: 822, competencia: 12, similares: 1480, precios: combos(39900, 59900, 74900) },
  { id: 'pelador', nombre: 'Pelador Eléctrico de Frutas y Verduras', corto: 'Pelador Eléctrico', emoji: '🥔', hue: 145, categoria: 'Cocina', proveedor: 'Hogar Fácil Import', costo: 24500, v7: 96, total: 1840, stock: 310, competencia: 4, similares: 640, precios: combos(69900, 107900, 139900) },
  { id: 'corrector', nombre: 'Corrector de Postura Inteligente con Vibración', corto: 'Corrector de Postura', emoji: '🧍', hue: 205, categoria: 'Salud', proveedor: 'Bienestar Total', costo: 18900, v7: 58, total: 940, stock: 145, competencia: 27, similares: 2310, precios: combos(59900, 89900, 119900) },
  { id: 'sellador', nombre: 'Mini Sellador al Vacío Recargable USB', corto: 'Mini Sellador', emoji: '🔌', hue: 265, categoria: 'Cocina', proveedor: 'Hogar Fácil Import', costo: 12900, v7: 41, total: 620, stock: 260, competencia: 6, similares: 890, precios: combos(44900, 69900, 89900) },
  { id: 'lampara', nombre: 'Lámpara Lunar 3D con Control Remoto 16 Colores', corto: 'Lámpara Lunar 3D', emoji: '🌕', hue: 45, categoria: 'Decoración', proveedor: 'Luces del Valle', costo: 21900, v7: 9, total: 2450, stock: 80, competencia: 41, similares: 3200, precios: combos(64900, 99900, 129900) },
  { id: 'rodillo', nombre: 'Rodillo Quitapelusa Reutilizable para Mascotas', corto: 'Rodillo Quitapelusa', emoji: '🐾', hue: 330, categoria: 'Mascotas', proveedor: 'PetLand Colombia', costo: 7400, v7: 33, total: 410, stock: 1200, competencia: 3, similares: 520, precios: combos(34900, 54900, 69900) },
  { id: 'masajeador', nombre: 'Masajeador Cervical EMS 6 Modos', corto: 'Masajeador Cervical', emoji: '💆', hue: 180, categoria: 'Salud', proveedor: 'Bienestar Total', costo: 29900, v7: 18, total: 155, stock: 54, competencia: 9, similares: 760, precios: combos(79900, 119900, 159900) },
  { id: 'organizador', nombre: 'Organizador de Cables Magnético x6', corto: 'Organizador Magnético', emoji: '🧲', hue: 0, categoria: 'Tecnología', proveedor: 'TecnoShop Medellín', costo: 5900, v7: 22, total: 380, stock: 940, competencia: 2, similares: 410, precios: combos(29900, 44900, 59900) },
  { id: 'alisador', nombre: 'Cepillo Alisador Iónico 3 en 1', corto: 'Cepillo Alisador', emoji: '💇', hue: 300, categoria: 'Belleza', proveedor: 'Glamour Import', costo: 32900, v7: 74, total: 3100, stock: 410, competencia: 58, similares: 4100, precios: combos(89900, 139900, 179900) },
]

export const producto = (id) => PRODUCTOS.find((p) => p.id === id)

export const nivelCompetencia = (n) => (n <= 8 ? 'green' : n <= 20 ? 'yellow' : 'red')

export const FILTROS_RADAR = [
  { id: 'total', label: 'Ventas totales 200–2.000', test: (p) => p.total >= 200 && p.total <= 2000 },
  { id: 'v7', label: 'Ventas 7 días ≥ 14', test: (p) => p.v7 >= 14 },
  { id: 'stock', label: 'Stock ≥ 60', test: (p) => p.stock >= 60 },
  { id: 'similares', label: 'Similares ≤ 2.000', test: (p) => p.similares <= 2000 },
]

export const LANZAMIENTOS = [
  { id: 'L32864', productoId: 'nexus', etapa: 3, veredicto: 'TESTEAR', creado: '22 oct 2026', responsable: 'Juan A.' },
  { id: 'L32871', productoId: 'pelador', etapa: 6, veredicto: 'TESTEAR', creado: '9 oct 2026', responsable: 'Juan A.' },
  { id: 'L32880', productoId: 'corrector', etapa: 2, veredicto: 'VIGILAR', creado: '24 oct 2026', responsable: 'Camila R.' },
  { id: 'L32885', productoId: 'sellador', etapa: 0, veredicto: null, creado: '26 oct 2026', responsable: 'Juan A.' },
  { id: 'L32852', productoId: 'lampara', etapa: 1, veredicto: 'DESCARTAR', creado: '18 oct 2026', responsable: 'Camila R.' },
]

export const KPIS = {
  pedidosHoy: 12,
  confirmados: 9,
  porDespachar: 5,
  ventasSemana: 1284000,
}

export const ACTIVIDAD = [
  { tipo: 'pedido', texto: 'Rubby confirmó pedido #1003', meta: 'Pelador Eléctrico · $107.900', hace: 'hace 4 min' },
  { tipo: 'creativo', texto: 'Anuncio AD2 listo', meta: 'Nexus Renovador · ángulo ahorro', hace: 'hace 12 min' },
  { tipo: 'guia', texto: 'Guía enviada a Rubby Perea', meta: 'Coordinadora 99360060346', hace: 'hace 25 min' },
  { tipo: 'landing', texto: 'Landing de Nexus guardada como borrador', meta: 'Por Juan A.', hace: 'hace 1 h' },
  { tipo: 'alerta', texto: 'Diana pidió cambio de dirección', meta: 'Pedido #1006 · Bogotá', hace: 'hace 2 h' },
  { tipo: 'radar', texto: 'Radar encontró 3 productos nuevos', meta: 'Cumplen los 4 filtros', hace: 'hace 2 h' },
  { tipo: 'campana', texto: 'Campaña Pelador: CPA $14.200', meta: 'Por debajo del CPA máximo', hace: 'hace 3 h' },
  { tipo: 'revisar', texto: 'Creativo "Público 2" marcado para revisar', meta: 'El producto se ve distinto', hace: 'hace 4 h' },
]

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

const PEDIDOS_BASE = [
  { id: 1016, cliente: 'Edwin Alexis Palacios', tel: '3148820193', ciudad: 'Medellín', depto: 'Antioquia', direccion: 'Cl 44 #79-25, Laureles', productoId: 'pelador', qty: 2, total: 107900, estado: 'Pendiente', transportadora: '', guia: '', fecha: '2026-10-26', hora: '10:42' },
  { id: 1015, cliente: 'Natalia Andrea Muñoz', tel: '3175509921', ciudad: 'Pasto', depto: 'Nariño', direccion: 'Cra 27 #18-40, barrio Las Cuadras', productoId: 'pelador', qty: 2, total: 107900, estado: 'Confirmado', transportadora: '', guia: '', fecha: '2026-10-26', hora: '10:05' },
  { id: 1014, cliente: 'Héctor Fabio Cardona', tel: '3006671245', ciudad: 'Armenia', depto: 'Quindío', direccion: 'Mz 12 Cs 8, barrio La Clarita', productoId: 'nexus', qty: 2, total: 59900, estado: 'Confirmado', transportadora: '', guia: '', fecha: '2026-10-26', hora: '09:31' },
  { id: 1013, cliente: 'Sandra Liliana Ríos', tel: '3209183344', ciudad: 'Neiva', depto: 'Huila', direccion: 'Cl 9 #14-27, Centro', productoId: 'nexus', qty: 3, total: 74900, estado: 'Pendiente', transportadora: '', guia: '', fecha: '2026-10-26', hora: '09:12' },
  { id: 1012, cliente: 'Marleny Cuesta', tel: '3116024587', ciudad: 'Cartagena', depto: 'Bolívar', direccion: 'Tv 54 #31-102, Olaya Herrera', productoId: 'pelador', qty: 2, total: 107900, estado: 'Confirmado', transportadora: '', guia: '', fecha: '2026-10-26', hora: '08:47' },
  { id: 1011, cliente: 'Brayan Stiven Díaz', tel: '3012239876', ciudad: 'Villavicencio', depto: 'Meta', direccion: 'Cra 33 #15-08, La Esperanza', productoId: 'nexus', qty: 2, total: 59900, estado: 'Confirmado', transportadora: '', guia: '', fecha: '2026-10-26', hora: '08:20' },
  { id: 1008, cliente: 'Ana Milena Vargas', tel: '3043378812', ciudad: 'Barranquilla', depto: 'Atlántico', direccion: 'Cl 72 #46-18, El Prado', productoId: 'pelador', qty: 2, total: 107900, estado: 'Pendiente', transportadora: '', guia: '', fecha: '2026-10-26', hora: '07:58' },
  { id: 1007, cliente: 'Óscar Iván Restrepo', tel: '3127745501', ciudad: 'Manizales', depto: 'Caldas', direccion: 'Av Santander #52-14, Cable', productoId: 'nexus', qty: 2, total: 59900, estado: 'Pendiente', transportadora: '', guia: '', fecha: '2026-10-26', hora: '07:31' },
  { id: 1006, cliente: 'Diana Patricia Gómez', tel: '3185562290', ciudad: 'Bogotá', depto: 'Cundinamarca', direccion: 'Cl 145 #19-60 apto 502, Cedritos', productoId: 'pelador', qty: 1, total: 69900, estado: 'Cambio de dirección', transportadora: '', guia: '', fecha: '2026-10-25', hora: '19:14' },
  { id: 1005, cliente: 'Wilson Andrés Mosquera', tel: '3166628830', ciudad: 'Cali', depto: 'Valle del Cauca', direccion: 'Cra 39 #5B-60, San Fernando', productoId: 'nexus', qty: 3, total: 74900, estado: 'Confirmado', transportadora: '', guia: '', fecha: '2026-10-25', hora: '16:40' },
  { id: 1004, cliente: 'Yeimy Carolina Rojas', tel: '3157781024', ciudad: 'Bucaramanga', depto: 'Santander', direccion: 'Cl 36 #27-51, Sotomayor', productoId: 'nexus', qty: 2, total: 59900, estado: 'Confirmado', transportadora: '', guia: '', fecha: '2026-10-25', hora: '14:02' },
  { id: 1003, cliente: 'Rubby Perea', tel: '3218874410', ciudad: 'Quibdó', depto: 'Chocó', direccion: 'Cra 4 #25-38, Yesca Grande', productoId: 'pelador', qty: 2, total: 107900, estado: 'Despachado', transportadora: 'Coordinadora', guia: '99360060346', fecha: '2026-10-24', hora: '11:26' },
  { id: 1002, cliente: 'Jhon Fredy Castaño', tel: '3105524718', ciudad: 'Pereira', depto: 'Risaralda', direccion: 'Cl 21 #8-33, Centro', productoId: 'pelador', qty: 2, total: 107900, estado: 'Entregado', transportadora: 'Servientrega', guia: '2087731190', fecha: '2026-10-21', hora: '17:55' },
  { id: 1001, cliente: 'Luz Marina Ospina', tel: '3014456120', ciudad: 'Medellín', depto: 'Antioquia', direccion: 'Cra 65 #32-10, Belén', productoId: 'pelador', qty: 1, total: 69900, estado: 'Entregado', transportadora: 'Interrapidísimo', guia: '240018837721', fecha: '2026-10-20', hora: '12:10' },
  { id: 1000, cliente: 'Carlos Mario Zapata', tel: '3192205567', ciudad: 'Montería', depto: 'Córdoba', direccion: 'Cl 29 #4-55, La Granja', productoId: 'nexus', qty: 1, total: 39900, estado: 'Devuelto', transportadora: 'Envía', guia: '014032881905', fecha: '2026-10-18', hora: '09:44' },
  { id: 999, cliente: 'Leidy Johana Torres', tel: '3135590871', ciudad: 'Ibagué', depto: 'Tolima', direccion: 'Mz B Cs 14, Jordán 8ª etapa', productoId: 'pelador', qty: 1, total: 69900, estado: 'Cancelado', transportadora: '', guia: '', fecha: '2026-10-17', hora: '20:31' },
]

// Mismo formato que mapPedido() para que las pantallas no distingan demo de real
export const PEDIDOS = PEDIDOS_BASE.map((p) => ({
  ...p,
  numero: `#${p.id}`,
  producto: `${p.qty}x ${producto(p.productoId).corto}`,
  tel: `57${p.tel}`,
  creado: `${p.fecha}T${p.hora}:00-05:00`,
}))

export const CHATS = [
  {
    id: 'c1003', pedidoId: 1003, nombre: 'Rubby Perea', noLeidos: 1,
    mensajes: [
      { de: 'bot', texto: '¡Hola Rubby! 👋 Soy el asistente de Ingenio Store. Recibimos tu pedido #1003: 2x Pelador Eléctrico por $107.900, pago contra entrega. ¿Confirmas la dirección Cra 4 #25-38, Yesca Grande, Quibdó?', hora: '11:27' },
      { de: 'cliente', texto: 'Sí señor, confirmo. Estoy en la casa en la tarde', hora: '11:40' },
      { de: 'bot', texto: '¡Listo! Tu pedido quedó confirmado ✅ Te escribimos cuando salga con la guía.', hora: '11:40' },
      { de: 'yo', texto: 'Rubby, tu pedido ya salió por Coordinadora 🚚 Guía 99360060346. Ten listos los $107.900 en efectivo.', hora: '15:02' },
      { de: 'cliente', texto: 'Muchas gracias, ¿más o menos cuándo llega a Quibdó?', hora: '15:20' },
    ],
  },
  {
    id: 'c1006', pedidoId: 1006, nombre: 'Diana Patricia Gómez', noLeidos: 2,
    mensajes: [
      { de: 'bot', texto: '¡Hola Diana! Recibimos tu pedido #1006: 1x Pelador Eléctrico por $69.900. ¿Confirmas la dirección Cl 145 #19-06, Cedritos, Bogotá?', hora: '19:15' },
      { de: 'cliente', texto: 'Buenas, me equivoqué en la dirección 🙈 es Calle 145 #19-60 apto 502', hora: '19:31' },
      { de: 'cliente', texto: 'Y el conjunto se llama Torres de Cedritos, en portería lo reciben', hora: '19:32' },
      { de: 'bot', texto: 'Entendido Diana, paso tu solicitud a un asesor para corregir la dirección 🙌', hora: '19:32' },
    ],
  },
  {
    id: 'c1008', pedidoId: 1008, nombre: 'Ana Milena Vargas', noLeidos: 1,
    mensajes: [
      { de: 'bot', texto: '¡Hola Ana! 👋 Recibimos tu pedido #1008: 2x Pelador Eléctrico por $107.900, pago contra entrega. ¿Confirmas la dirección Cl 72 #46-18, El Prado, Barranquilla?', hora: '07:59' },
      { de: 'cliente', texto: 'Hola, ¿sí sirve para pelar papa criolla? Porque es pequeñita', hora: '08:14' },
      { de: 'bot', texto: 'Sí 😊 trae 3 cuchillas y la más pequeña funciona con papa criolla, cebolla y ajo. ¿Confirmamos tu pedido?', hora: '08:14' },
    ],
  },
  {
    id: 'c1013', pedidoId: 1013, nombre: 'Sandra Liliana Ríos', noLeidos: 0,
    mensajes: [
      { de: 'bot', texto: '¡Hola Sandra! Recibimos tu pedido #1013: 3x Nexus Renovador por $74.900. ¿Confirmas la dirección Cl 9 #14-27, Centro, Neiva?', hora: '09:13' },
      { de: 'cliente', texto: '¿Puedo pagar con Nequi cuando llegue?', hora: '09:20' },
      { de: 'bot', texto: 'El pago es en efectivo al recibir 💵 Algunos mensajeros aceptan Nequi, pero no lo podemos garantizar. ¿Confirmamos?', hora: '09:20' },
    ],
  },
  {
    id: 'c1007', pedidoId: 1007, nombre: 'Óscar Iván Restrepo', noLeidos: 0,
    mensajes: [
      { de: 'bot', texto: '¡Hola Óscar! 👋 Recibimos tu pedido #1007: 2x Nexus Renovador por $59.900, pago contra entrega. ¿Confirmas la dirección Av Santander #52-14, Cable, Manizales?', hora: '07:32' },
    ],
  },
  {
    id: 'c1004', pedidoId: 1004, nombre: 'Yeimy Carolina Rojas', noLeidos: 0,
    mensajes: [
      { de: 'bot', texto: '¡Hola Yeimy! Recibimos tu pedido #1004: 2x Nexus Renovador por $59.900. ¿Confirmas la dirección Cl 36 #27-51, Sotomayor, Bucaramanga?', hora: '14:03' },
      { de: 'cliente', texto: 'Sí, confirmo 👍', hora: '14:10' },
      { de: 'bot', texto: '¡Perfecto! Pedido confirmado ✅ Llega en 2 a 4 días hábiles.', hora: '14:10' },
    ],
  },
]

/* ---------- Detalle de lanzamiento ---------- */

export const PARAMETROS = { flete: 14000, recaudo: 0.03, tasaEntrega: 0.72 }

export const ALERTAS_ANALISIS = [
  { tipo: 'ok', texto: 'Stock para más de 30 días de ventas (822 unidades)' },
  { tipo: 'ok', texto: 'Proveedor con 96% de efectividad de entrega en Dropi' },
  { tipo: 'warn', texto: '12 tiendas activas en Meta: diferenciar el ángulo del gancho' },
  { tipo: 'warn', texto: 'Producto líquido: pedir embalaje doble a la transportadora' },
  { tipo: 'bad', texto: 'Evitar promesas tipo "dura para siempre": riesgo de rechazo en Meta' },
]

export const COMPETENCIA = [
  { tienda: 'AutoBrillo CO', dias: 38, gancho: '"Tu carro parece de concesionario otra vez"', hue: 20, formato: 'Video' },
  { tienda: 'Detailing Express', dias: 21, gancho: '"Lo que usan los lavaderos y no te dicen"', hue: 200, formato: 'Video' },
  { tienda: 'ElMejorPrecio.co', dias: 14, gancho: '"Antes y después en 30 segundos"', hue: 140, formato: 'Imagen' },
  { tienda: 'TiendaMotor', dias: 9, gancho: '"Plásticos grises → negros sin pintura"', hue: 280, formato: 'Video' },
  { tienda: 'Compra Fácil Col', dias: 6, gancho: '"2x1 solo por hoy, paga al recibir"', hue: 50, formato: 'Carrusel' },
  { tienda: 'CarCare Medellín', dias: 3, gancho: '"Mi esposo no creía que fuera el mismo carro"', hue: 330, formato: 'Video' },
]

export const PROMPTS_IMAGENES = [
  { id: 'hero', titulo: 'Hero', angulo: 'Producto protagonista', estado: 'recibido', hue: 24, prompt: 'Studio product shot of a 250ml black plastic bottle labeled "NEXUS Renovador de Partes Negras", standing on wet dark asphalt, glossy reflection, orange rim light, shallow depth of field, 1:1, ultra realistic, no extra text.' },
  { id: 'detalle', titulo: 'Detalle', angulo: 'Textura y aplicación', estado: 'recibido', hue: 30, prompt: 'Macro close-up of a microfiber applicator spreading a thick black restoring gel over faded grey car trim, half restored half faded, crisp detail, natural daylight, 1:1.' },
  { id: 'uso', titulo: 'Uso', angulo: 'Paso a paso', estado: 'recibido', hue: 36, prompt: 'Latino man in his 30s applying the NEXUS bottle product to a car bumper in a Colombian residential garage, mid-shot, warm afternoon light, authentic smartphone-photo look, 1:1.' },
  { id: 'publico1', titulo: 'Público 1', angulo: 'Dueño de carro usado', estado: 'recibido', hue: 12, prompt: 'Proud Colombian man, 45, leaning on a 2012 Chevrolet Spark with freshly restored black bumpers, neighborhood street in Bogotá, holding the NEXUS bottle, candid, 1:1.' },
  { id: 'publico2', titulo: 'Público 2', angulo: 'Mototaxista / motero', estado: 'pendiente', hue: 0, prompt: 'Young Colombian motorcyclist wiping the black plastic fairings of a Pulsar 200 with the NEXUS product, street in Medellín, golden hour, realistic, 1:1.' },
  { id: 'publico3', titulo: 'Público 3', angulo: 'Mamá práctica', estado: 'pendiente', hue: 340, prompt: 'Colombian woman, 38, in a parking lot next to a family SUV, smiling at the restored black side mirrors, NEXUS bottle in hand, soft daylight, lifestyle, 1:1.' },
  { id: 'publico4', titulo: 'Público 4', angulo: 'Lavadero de barrio', estado: 'pendiente', hue: 50, prompt: 'Small Colombian car-wash business, worker showing a customer the before/after on a tire and trim using the NEXUS bottle, vibrant, realistic, 1:1.' },
]

export const PROMPTS_CLIPS = [
  { id: 'AD1-1', titulo: 'AD1-1', angulo: 'Transformación · gancho', estado: 'recibido', hue: 24, prompt: 'Vertical 9:16, 4 seconds. Close-up of faded grey car bumper; a hand sweeps a microfiber pad and the plastic turns deep black instantly. Fast, satisfying, handheld smartphone feel. No text.' },
  { id: 'AD1-2', titulo: 'AD1-2', angulo: 'Transformación · cierre', estado: 'recibido', hue: 30, prompt: 'Vertical 9:16, 4 seconds. Slow orbit around a fully restored car with glossy black trims, ending on the NEXUS bottle on the hood. Cinematic light. No text.' },
  { id: 'AD2-1', titulo: 'AD2-1', angulo: 'Ahorro · gancho', estado: 'recibido', hue: 140, prompt: 'Vertical 9:16, 4 seconds. Colombian man looks at a car-wash receipt and shakes his head, then grabs the NEXUS bottle from a shelf. Natural home garage. Spanish lip movement not required.' },
  { id: 'AD2-2', titulo: 'AD2-2', angulo: 'Ahorro · cierre', estado: 'pendiente', hue: 150, prompt: 'Vertical 9:16, 4 seconds. Same man finishes applying product, steps back proudly, thumbs up to camera. Warm light.' },
  { id: 'AD3-1', titulo: 'AD3-1', angulo: 'Secreto · gancho', estado: 'pendiente', hue: 270, prompt: 'Vertical 9:16, 4 seconds. Car-wash worker whispering to camera while hiding a black bottle behind his back, playful conspiracy vibe.' },
  { id: 'AD3-2', titulo: 'AD3-2', angulo: 'Secreto · cierre', estado: 'pendiente', hue: 280, prompt: 'Vertical 9:16, 4 seconds. Reveal of the NEXUS bottle with a quick split screen before/after of a tire sidewall. Punchy.' },
]

export const CREATIVOS = [
  { id: 'cr1', tipo: 'img', titulo: 'Hero', fiel: true, hue: 24 },
  { id: 'cr2', tipo: 'img', titulo: 'Detalle', fiel: true, hue: 30 },
  { id: 'cr3', tipo: 'video', titulo: 'AD1-1', fiel: true, hue: 24, dur: '0:04' },
  { id: 'cr4', tipo: 'img', titulo: 'Uso', fiel: true, hue: 36 },
  { id: 'cr5', tipo: 'video', titulo: 'AD1-2', fiel: true, hue: 30, dur: '0:04' },
  { id: 'cr6', tipo: 'img', titulo: 'Público 1', fiel: true, hue: 12 },
  { id: 'cr7', tipo: 'video', titulo: 'AD2-1', fiel: false, hue: 140, dur: '0:04' },
  { id: 'cr8', tipo: 'img', titulo: 'Público 2', fiel: false, hue: 0 },
]

export const ANUNCIOS = [
  {
    id: 'AD1', angulo: 'Transformación antes/después', gancho: '¿Tus plásticos se ven grises y viejos?',
    subtitulos: ['Una pasada y quedan negros 🖤', 'Bómperes, retrovisores y llantas', 'Sin pintar, en 5 minutos'],
    texto: '🚗 Devuélvele el negro de fábrica a tu carro en 5 minutos.\n\nNexus Renovador recupera bómperes, retrovisores y llantas que el sol dejó grises. Sin pintura, sin lavadero.\n\n✅ Rinde para todo el carro\n✅ Resiste lluvia y lavadas\n🚚 Envío a toda Colombia · PAGAS AL RECIBIR',
    titulo: 'Tu carro como nuevo · Paga al recibir',
  },
  {
    id: 'AD2', angulo: 'Ahorro vs. lavadero', gancho: 'Deja de pagar $40.000 en el lavadero',
    subtitulos: ['Hazlo tú mismo en casa', 'Un frasco = varios meses', 'Resultado de detailing profesional'],
    texto: '💸 ¿Cada mes pagando "brillada de plásticos" en el lavadero?\n\nCon un frasco de Nexus lo haces tú mismo en casa y te dura meses.\n\n👉 2 frascos por $59.900\n🚚 Envío gratis · PAGAS AL RECIBIR',
    titulo: '2 frascos por $59.900 · Envío gratis',
  },
  {
    id: 'AD3', angulo: 'Secreto de lavaderos', gancho: 'El truco que los lavaderos no te cuentan 🤫',
    subtitulos: ['No es pintura, no es aceite', 'Es lo que usan los detailers', 'Ahora lo puedes tener tú'],
    texto: '🤫 Esto es lo que usan los lavaderos para que el carro "salga como nuevo".\n\nNexus Renovador de Partes Negras: aplicas, esperas 5 minutos y listo.\n\n⭐ +1.000 clientes en Colombia\n🚚 PAGAS AL RECIBIR',
    titulo: 'El secreto de los lavaderos 🤫',
  },
]

export const LANDING_INICIAL = {
  titulo: 'Nexus Renovador de Partes Negras 250ml',
  subtitulo: 'Devuelve el negro de fábrica a bómperes, retrovisores y llantas en 5 minutos.',
  cta: 'PEDIR AHORA – PAGO CONTRA ENTREGA',
  beneficios: 'Resultado visible desde la primera aplicación\nResiste lluvia, sol y lavadas\nRinde para todo el carro varias veces\nNo mancha la pintura ni los vidrios',
  paraQuien: 'Dueños de carro usado que quieren verlo como nuevo\nMoteros que cuidan su moto\nLavaderos y detailers de barrio',
  comparativa: 'Resultado en 5 min|Sí|No\nSin pintura|Sí|No\nPrecio por uso|$2.000|$40.000',
  pasos: 'Haz clic en "Pedir ahora"\nLlena tus datos de envío\nConfirmamos por WhatsApp\nPagas cuando lo recibes',
  garantia: 'Si no ves el cambio en tus plásticos te devolvemos el dinero. 30 días de garantía.',
  faq: '¿Cuánto se demora el envío?|De 2 a 5 días hábiles según tu ciudad.\n¿Cómo pago?|En efectivo cuando el mensajero te entregue.\n¿Sirve para moto?|Sí, para cualquier plástico negro o gris.',
}

export const CAMPANA_INICIAL = {
  presupuesto: 60000,
  edadMin: 25,
  edadMax: 60,
  anuncios: { AD1: true, AD2: true, AD3: false },
  activa: false,
  metricas: { gasto: 184300, cpm: 9850, ctr: 0.0214, compras: 11, impresiones: 18710 },
}

/* ---------- Resultados ---------- */

const DIAS = ['13 oct', '14 oct', '15 oct', '16 oct', '17 oct', '18 oct', '19 oct', '20 oct', '21 oct', '22 oct', '23 oct', '24 oct', '25 oct', '26 oct']

// Serie diaria determinística para que la gráfica no cambie entre recargas
function serie(seed, base, trend, margen) {
  let s = seed
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  return DIAS.map((dia, i) => {
    const ingreso = Math.round((base * (1 + trend * i) * (0.75 + rnd() * 0.5)) / 100) * 100
    const gasto = Math.round((ingreso / (margen * (0.85 + rnd() * 0.3))) / 100) * 100
    return { dia, ingreso, gasto, ganancia: Math.round(ingreso * 0.42 - gasto) }
  })
}

export const RESULTADOS = [
  { productoId: 'pelador', pedidos: 86, confirmacion: 0.82, entrega: 0.78, devoluciones: 9, gasto: 1420000, ingreso: 4860000, ganancia: 1210000, roas: 3.42, semaforo: 'Escalar', serie: serie(7, 260000, 0.05, 3.4) },
  { productoId: 'nexus', pedidos: 31, confirmacion: 0.74, entrega: 0.7, devoluciones: 5, gasto: 610000, ingreso: 1290000, ganancia: 185000, roas: 2.11, semaforo: 'Optimizar', serie: serie(13, 70000, 0.06, 2.1) },
  { productoId: 'corrector', pedidos: 12, confirmacion: 0.58, entrega: 0.55, devoluciones: 4, gasto: 480000, ingreso: 410000, ganancia: -236000, roas: 0.85, semaforo: 'Apagar', serie: serie(29, 38000, -0.03, 0.85) },
]

export const INTEGRACIONES = [
  { id: 'supabase', nombre: 'Supabase', desc: 'Base de datos y autenticación', estado: 'ok' },
  { id: 'n8n', nombre: 'n8n', desc: 'Flujos: radar, bot de WhatsApp, guías', estado: 'ok' },
  { id: 'dropi', nombre: 'Dropi', desc: 'Catálogo, pedidos y guías', estado: 'ok' },
  { id: 'meta', nombre: 'Meta Ads', desc: 'Campañas y biblioteca de anuncios', estado: 'ok' },
  { id: 'shopify', nombre: 'Shopify', desc: 'Publicación de landings', estado: 'warn' },
  { id: 'drive', nombre: 'Google Drive', desc: 'Carpeta de creativos', estado: 'ok' },
  { id: 'whatsapp', nombre: 'WhatsApp Business', desc: 'Confirmación de pedidos', estado: 'off' },
]
