// Lanzamientos reales: adapta filas de Supabase al formato de las pantallas
// y genera contenido base (precios, prompts, copys, landing) a partir del producto.
import { titulo } from './mapeo'

const redondeo = (n) => Math.round(n / 1000) * 1000 - 100

export function combosDesde(precio) {
  if (!precio) return []
  const c = [
    { qty: 1, precio: redondeo(precio) },
    { qty: 2, precio: redondeo(precio * 1.6), principal: true },
    { qty: 3, precio: redondeo(precio * 2.1) },
  ]
  return c.map((x) => ({ ...x, antes: redondeo(x.precio * 1.55) }))
}

export const hueDe = (s = '') => [...s].reduce((a, c) => a + c.charCodeAt(0), 0) % 360

const corto = (n = '') => {
  const p = n.split(/\s+/)
  return p.length <= 3 ? n : p.slice(0, 3).join(' ')
}

// Producto con la forma que esperan las pantallas de lanzamiento
export function productoDeLanzamiento(l, prod) {
  const costo = l.costo ?? prod?.costo_dropi ?? prod?.costo_est ?? null
  const precioBase = prod?.precio_venta_est ?? prod?.precio_sugerido_dropi ?? null
  return {
    id: l.producto_slug || l.id,
    nombre: l.nombre,
    corto: corto(l.nombre),
    emoji: null,
    hue: hueDe(l.producto_slug || l.nombre),
    imagen: l.imagen_url || prod?.ejemplos?.[0]?.imagen || null,
    categoria: titulo(prod?.categoria),
    proveedor: prod?.dropi_proveedor || null,
    costo,
    stock: prod?.stock_dropi ?? null,
    competencia: prod?.num_anunciantes ?? null,
    precios: Array.isArray(l.precios) && l.precios.length ? l.precios : combosDesde(precioBase),
    angulo: prod?.angulo || '',
    radar: prod || null,
  }
}

export function mapLanzamiento(l, productos) {
  const prod = productos.find((p) => p.id === l.producto_id) || null
  const d = new Date(l.creado_en)
  return {
    id: l.id,
    productoId: l.producto_id,
    etapa: l.etapa,
    veredicto: l.veredicto,
    creado: d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Bogota' }),
    responsable: (l.creado_por || '').split('@')[0],
    nombreShopify: l.nombre_shopify || '',
    notas: l.notas || '',
    landing: l.landing,
    anuncios: l.anuncios || {},
    campana: l.campana || {},
    real: true,
    producto: productoDeLanzamiento(l, prod),
  }
}

// Fila nueva a partir de un producto del Radar
export function filaNueva(prod) {
  return {
    producto_id: prod.id,
    producto_slug: prod.slug,
    nombre: prod.nombre,
    imagen_url: prod.ejemplos?.[0]?.imagen || null,
    costo: prod.costo_dropi ?? prod.costo_est ?? null,
    precios: combosDesde(prod.precio_venta_est ?? prod.precio_sugerido_dropi),
    veredicto: prod.veredicto_ia === 'descartar' ? 'DESCARTAR' : prod.veredicto_ia === 'testear' ? 'TESTEAR' : 'VIGILAR',
    etapa: 0,
  }
}

/* ---------- Contenido base ---------- */

export function promptsBase(p) {
  const n = p.nombre
  const ang = p.angulo ? ` Angle: ${p.angulo}.` : ''
  const img = (id, t, angulo, prompt) => ({ id, titulo: t, angulo, estado: 'pendiente', hue: p.hue, prompt })
  return {
    imagenes: [
      img('hero', 'Hero', 'Producto protagonista', `Studio product shot of "${n}", centered, premium lighting, soft shadow, clean dark background with orange rim light, ultra realistic, 1:1, no extra text.`),
      img('detalle', 'Detalle', 'Textura y calidad', `Macro close-up of "${n}" showing materials, finish and key details, shallow depth of field, natural daylight, 1:1, ultra realistic.`),
      img('uso', 'Uso', 'Paso a paso', `Colombian person using "${n}" at home, mid-shot, warm natural light, authentic smartphone-photo look, 1:1.${ang}`),
      img('publico1', 'Público 1', 'Comprador principal', `Main buyer persona in Colombia happily using "${n}" in a realistic everyday setting, candid lifestyle photo, 1:1.`),
      img('publico2', 'Público 2', 'Regalo', `"${n}" presented as a gift, hands opening a box, festive but realistic Colombian home, 1:1.`),
      img('publico3', 'Público 3', 'Antes / después', `Split image before and after using "${n}", clear visible improvement, realistic, 1:1.`),
      img('publico4', 'Público 4', 'Prueba social', `Several happy Colombian customers holding "${n}", UGC style collage, natural light, 1:1.`),
    ],
    clips: ['AD1', 'AD2', 'AD3'].flatMap((ad, i) => {
      const angulos = ['Problema → solución', 'Demostración', 'Prueba social']
      return [
        img(`${ad}-1`, `${ad}-1`, `${angulos[i]} · gancho`, `Vertical 9:16, 4 seconds. Hook for "${n}": ${['a frustrating everyday problem shown in a Colombian home', 'a fast satisfying demo of the product working', 'a real customer reaction unboxing the product'][i]}. Handheld smartphone feel. No text.`),
        img(`${ad}-2`, `${ad}-2`, `${angulos[i]} · cierre`, `Vertical 9:16, 4 seconds. Closing shot of "${n}" on a table, slow push-in, clean light, space at the bottom for price text. No text.`),
      ]
    }),
  }
}

export function anunciosBase(p) {
  const n = p.corto
  const precio = p.precios.find((c) => c.principal) || p.precios[0]
  const oferta = precio ? `${precio.qty}x por $${String(precio.precio).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}` : 'Oferta por tiempo limitado'
  return [
    {
      id: 'AD1', angulo: 'Problema → solución', gancho: p.angulo ? p.angulo.split(/[.,]/)[0] : `¿Todavía sin ${n}?`,
      subtitulos: ['Mira cómo funciona 👀', 'Fácil de usar en casa', 'Envío a toda Colombia'],
      texto: `🔥 ${p.nombre}\n\n${p.angulo || 'La solución práctica que estabas buscando.'}\n\n✅ ${oferta}\n🚚 Envío a toda Colombia · PAGAS AL RECIBIR`,
      titulo: `${n} · Paga al recibir`,
    },
    {
      id: 'AD2', angulo: 'Demostración', gancho: `Así funciona ${n} 👇`,
      subtitulos: ['Resultado en segundos', 'Calidad que se nota', 'Pídelo hoy'],
      texto: `👀 Mira ${n} en acción.\n\nSin complicaciones, resultados desde el primer uso.\n\n👉 ${oferta}\n🚚 PAGAS AL RECIBIR`,
      titulo: oferta,
    },
    {
      id: 'AD3', angulo: 'Prueba social', gancho: `+1.000 colombianos ya lo tienen`,
      subtitulos: ['Clientes felices en todo el país', 'Garantía de satisfacción', 'Últimas unidades'],
      texto: `⭐ Lo que dicen nuestros clientes de ${n}.\n\nCompra segura y pago en efectivo cuando te llegue.\n\n🚚 Envío a toda Colombia · PAGAS AL RECIBIR`,
      titulo: `${n} · Envío gratis`,
    },
  ]
}

export function landingBase(p) {
  return {
    titulo: p.nombre,
    subtitulo: p.angulo || 'Describe aquí en una frase el resultado que obtiene el cliente.',
    cta: 'PEDIR AHORA – PAGO CONTRA ENTREGA',
    beneficios: 'Beneficio principal\nSegundo beneficio\nTercer beneficio\nGarantía y envío gratis',
    paraQuien: 'Público principal\nSegundo público\nIdeal para regalar',
    comparativa: 'Resultado inmediato|Sí|No\nPago contra entrega|Sí|No\nGarantía|30 días|—',
    pasos: 'Haz clic en "Pedir ahora"\nLlena tus datos de envío\nConfirmamos por WhatsApp\nPagas cuando lo recibes',
    garantia: 'Si no quedas satisfecho te devolvemos el dinero. 30 días de garantía.',
    faq: '¿Cuánto se demora el envío?|De 2 a 5 días hábiles según tu ciudad.\n¿Cómo pago?|En efectivo cuando el mensajero te entregue.',
  }
}
