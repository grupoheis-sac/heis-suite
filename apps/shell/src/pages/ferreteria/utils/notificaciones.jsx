/**
 * notificaciones.jsx — Sistema de Notificaciones Visuales de Ferretería
 * 
 * Propuesta 2: Modern Clean Retail & Pro-Steel (Estilo Sodimac / Maestro Clean SaaS)
 * - Tarjeta blanca cerámica (dark: slate-800) con bordes suaves de 14px
 * - Ícono envuelto en cápsula circular 36px (#dcfce7 esmeralda ferretero)
 * - Tipografía en 2 niveles: Título en negrita + Subtítulo descriptivo
 * - Botón de cierre o acción rápida
 * - Barra de progreso en la base que avanza durante el tiempo de vida
 */
import toast from 'react-hot-toast';

/**
 * Notificación al agregar un producto o material al carrito / pistola
 * Renderiza la estética oficial Propuesta 2 Clean Retail
 */
export function notificarProductoAgregado({
  nombre,
  formato = 'UND',
  cantidad = 1,
  precio = null,
  unidad = null
}) {
  const unidadTexto = unidad || formato;
  const precioTexto = precio !== null ? ` • S/ ${parseFloat(precio).toFixed(2)}` : '';
  const titulo = `Artículo Añadido (+${cantidad} ${unidadTexto}${precioTexto})`;

  return toast.success(`${titulo}\n${nombre}`, {
    id: 'toast-add-producto', // Reemplaza en vez de acumular para ventas ágiles de cajero
    duration: 2400,
    btnText: 'Cerrar'
  });
}

/**
 * Notificación de alta visibilidad al emitir un comprobante (Boleta / Factura / Nota)
 * Renderiza la estética oficial Propuesta 2 Clean Retail
 */
export function notificarComprobanteEmitido({
  numero,
  tipo = 'Boleta',
  total = null,
  cliente = null,
  onVerTicket = null
}) {
  const clienteTexto = cliente ? `para ${cliente}` : 'para Cliente Contado';
  const totalTexto = total !== null ? ` por S/ ${parseFloat(total).toFixed(2)}` : '';
  const titulo = `${tipo} ${numero} Guardada con Éxito`;
  const subtitulo = `Comprobante emitido ${clienteTexto}${totalTexto}.`;

  return toast.success(`${titulo}\n${subtitulo}`, {
    id: 'toast-comprobante-emitido',
    duration: 4000,
    btnText: onVerTicket ? 'Ver Ticket' : 'Cerrar',
    onAction: onVerTicket
  });
}
