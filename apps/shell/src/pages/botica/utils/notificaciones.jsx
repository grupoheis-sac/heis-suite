/**
 * notificaciones.jsx — Sistema de Notificaciones Visuales de Sistema Boticas
 * 
 * Réplica idéntica de la ergonomía y diseño Clean Retail de Sistema Ferretería:
 * - Tarjeta cerámica blanca / dark slate con bordes suaves de 14px
 * - Ícono envuelto en cápsula circular de 36px (Teal #EBFDF6 / #00855E farmacéutico)
 * - Tipografía en 2 niveles: Título en negrita + Subtítulo descriptivo
 * - Tag pill automático: (+1 Caja • S/ 15.00)
 * - Botón de cierre o acción rápida (Ver Ticket / Cerrar)
 * - Barra de progreso en la base que avanza durante el tiempo de vida
 */
import toast from 'react-hot-toast';

/**
 * Notificación al agregar un medicamento al carrito / pistola
 * Renderiza la estética oficial Clean Retail / Farma con cápsula 36px y tag de unidades
 */
export function notificarProductoAgregado({
  nombre,
  formato = 'Caja',
  cantidad = 1,
  precio = null,
  unidad = null
}) {
  const unidadTexto = unidad || formato;
  const precioTexto = precio !== null ? ` • S/ ${parseFloat(precio).toFixed(2)}` : '';
  const titulo = `Medicamento Añadido (+${cantidad} ${unidadTexto}${precioTexto})`;

  return toast.success(`${titulo}\n${nombre}`, {
    id: 'toast-add-producto', // Reemplaza en vez de acumular para ventas ágiles de mostrador
    duration: 2400,
    btnText: 'Cerrar'
  });
}

/**
 * Notificación para canje de puntos de fidelidad del paciente
 */
export function notificarCanjePuntos({ descuento, puntos, descartado = false }) {
  if (descartado) {
    return toast('Puntos Restaurados\nDescuento por canje descartado', {
      id: 'toast-canje-puntos',
      duration: 2200,
      btnText: 'Cerrar'
    });
  }

  return toast.success(`Fidelización (${puntos} pts)\n- S/ ${parseFloat(descuento).toFixed(2)} de descuento aplicado`, {
    id: 'toast-canje-puntos',
    duration: 3000,
    btnText: 'Cerrar'
  });
}

/**
 * Notificación de alta visibilidad al emitir un comprobante (Boleta / Factura / Nota)
 * Incluye botón de acción contextual "Ver Ticket" si se proporciona el callback
 */
export function notificarComprobanteEmitido({
  numero,
  tipo = 'Boleta',
  total = null,
  cliente = null,
  onVerTicket = null
}) {
  const clienteTexto = cliente ? `para ${cliente}` : 'para Paciente Contado';
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
