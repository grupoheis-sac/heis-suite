/**
 * POSTicket.jsx — Panel derecho del POS Ferretería (Refactorización Visual & Funcional)
 * Inspirado en la ergonomía y arquitectura fluida del sistema de Boticas:
 * - Selector reactivo de cliente con detección de DNI (8) / RUC (11), autocompletado y alta rápida vía RENIEC/SUNAT.
 * - Flujo de Cobro Inline integrado (0 modales invasivos): los montos fijos/billetero rápido aparecen al dar click en COBRAR.
 * - Métodos de pago completos (Efectivo, Yape, Plin, Tarjeta POS, Crédito con plazo, Mixto).
 * - Pantalla de éxito post-emisión con reimpresión térmica 80mm, WhatsApp, Email y atajo a Nueva Venta.
 */
import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Keyboard,
  Search,
  X,
  UserPlus,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Calculator,
  DollarSign,
  QrCode,
  Smartphone,
  CreditCard,
  Clock,
  Layers,
  ArrowLeft,
  Printer,
  MessageCircle,
  Mail,
  RotateCcw,
  Eye,
  HardHat,
  Tag,
  FileSpreadsheet,
  AlertCircle,
  AlertTriangle,
  Package,
  Boxes,
  Lock,
  Sparkles,
  MapPin,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketTermico } from '../../utils/impresionTermica';
import POSTouchNumpad from './POSTouchNumpad';

const METODOS_PAGO = [
  { id: 'Efectivo', label: 'Efectivo', icon: DollarSign, activeCls: 'bg-emerald-600 text-white shadow-xs' },
  { id: 'Yape', label: 'Yape', icon: QrCode, activeCls: 'bg-purple-600 text-white shadow-xs' },
  { id: 'Plin', label: 'Plin', icon: Smartphone, activeCls: 'bg-sky-600 text-white shadow-xs' },
  { id: 'Tarjeta', label: 'Tarjeta', icon: CreditCard, activeCls: 'bg-blue-600 text-white shadow-xs' },
  { id: 'Credito', label: 'Crédito', icon: Clock, activeCls: 'bg-amber-600 text-white shadow-xs' },
  { id: 'Mixto', label: 'Mixto', icon: Layers, activeCls: 'bg-indigo-600 text-white shadow-xs' }
];

const BILLETES_PERUANOS = [10, 20, 50, 100, 200];

// Detecta si una unidad de medida ferretera es fraccionable / decimal (corte o pesaje)
const esUnidadFraccionable = (unidad = '') => {
  const u = (unidad || '').toLowerCase().trim();
  return (
    u.includes('metro') ||
    u.includes('m2') ||
    u.includes('m²') ||
    u.includes('m3') ||
    u.includes('m³') ||
    u.includes('kilo') ||
    u.includes('kg') ||
    u.includes('gram') ||
    u.includes('litro') ||
    u.includes('galon') ||
    u.includes('gln') ||
    u.includes('balde') ||
    u.includes('bolsa') ||
    u.includes('rollo') ||
    u.includes('plancha') ||
    u.includes('pulgada') ||
    u.includes('centimetro') ||
    u.includes('cm') ||
    u.includes('tonelada') ||
    u.includes('tn') ||
    u === 'm' ||
    u === 'l' ||
    u === 'g'
  );
};

export default function POSTicket({
  cajaAbierta,
  onAbrirCajaPrompt,
  items = [],
  clientes = [],
  clienteSeleccionado,
  setClienteSeleccionado,
  idCliente,
  setIdCliente,
  busquedaCliente,
  setBusquedaCliente,
  mostrarDropdownClientes,
  setMostrarDropdownClientes,
  clientesFiltrados = [],
  clienteExisteExacto,
  esDniValido,
  esRucValido,
  onAbrirRegistroRapidoConDoc,
  tipoComprobante,
  setTipoComprobante,
  tarifa = 'publico',
  setTarifa,
  updateCantidad,
  removeItem,
  clearCart,
  descuento = 0,
  setDescuento,
  subtotal = 0,
  total = 0,
  vuelto = 0,
  onAbrirModalCotizacion,
  setMostrarModalAtajos,
  // Props para cobro inline
  modoCobroActivo = false,
  setModoCobroActivo,
  tipoPago = 'Efectivo',
  setTipoPago,
  numeroOperacion = '',
  setNumeroOperacion,
  montoRecibido = '',
  setMontoRecibido,
  creditoDias = 30,
  setCreditoDias,
  // Pago Mixto
  montoMixtoEfectivo = '',
  setMontoMixtoEfectivo,
  efectivoRecibidoMixto = '',
  setEfectivoRecibidoMixto,
  montoMixtoYape = '',
  setMontoMixtoYape,
  montoMixtoPlin = '',
  setMontoMixtoPlin,
  montoMixtoTarjeta = '',
  setMontoMixtoTarjeta,
  operacionMixtoYape = '',
  setOperacionMixtoYape,
  operacionMixtoPlin = '',
  setOperacionMixtoPlin,
  operacionMixtoTarjeta = '',
  setOperacionMixtoTarjeta,
  procesandoVenta = false,
  onCobrar,
  ticketVenta = null,
  onVerTicket,
  onNuevaVenta
}) {
  const settings = useSettingsStore();

  // Numpad táctil de cantidad por item
  const [itemParaNumpad, setItemParaNumpad] = useState(null);
  const [valorNumpad, setValorNumpad] = useState('');

  // Compartir ticket
  const [mostrarInputWhatsapp, setMostrarInputWhatsapp] = useState(false);
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [mostrarInputEmail, setMostrarInputEmail] = useState(false);
  const [emailCliente, setEmailCliente] = useState('');

  // Auto-completar mixto
  const [billeteraRestante, setBilleteraRestante] = useState('Yape');

  // Modo expandido del Ticket Mostrador (permite agrandar el ancho para ver más información)
  const [ticketExpandido, setTicketExpandido] = useState(() => {
    try {
      return localStorage.getItem('pos_ticket_expandido') === 'true';
    } catch {
      return false;
    }
  });

  const toggleExpandir = () => {
    setTicketExpandido((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('pos_ticket_expandido', String(next));
      } catch {}
      return next;
    });
  };

  useEffect(() => {
    if (clienteSeleccionado?.telefono || clienteSeleccionado?.celular) {
      setTelefonoWhatsapp(clienteSeleccionado.telefono || clienteSeleccionado.celular);
    } else {
      setTelefonoWhatsapp('');
    }
    if (clienteSeleccionado?.email) {
      setEmailCliente(clienteSeleccionado.email);
    } else {
      setEmailCliente('');
    }
  }, [clienteSeleccionado]);

  const abrirNumpadItem = (item) => {
    setItemParaNumpad(item);
    setValorNumpad(String(item.cantidad));
  };

  const confirmarNumpadItem = () => {
    if (!itemParaNumpad) return;
    const cant = parseFloat(valorNumpad);
    if (!isNaN(cant) && cant > 0) {
      try {
        updateCantidad(itemParaNumpad.id, cant);
        toast.success(`Cantidad: ${cant} ${itemParaNumpad.unidad_medida || 'UND'}`);
      } catch (err) {
        toast.error(err.message || 'Error de stock');
      }
    } else {
      toast.error('Ingrese una cantidad válida mayor a 0');
    }
    setItemParaNumpad(null);
  };

  // Helper mixto
  const numEfec = parseFloat(montoMixtoEfectivo) || 0;
  const numYap = parseFloat(montoMixtoYape) || 0;
  const numPli = parseFloat(montoMixtoPlin) || 0;
  const numTar = parseFloat(montoMixtoTarjeta) || 0;
  const totalAsignadoMixto = parseFloat((numEfec + numYap + numPli + numTar).toFixed(2));
  const saldoPendienteMixto = Math.max(0, parseFloat((total - totalAsignadoMixto).toFixed(2)));
  const vueltoEfectivoMixto = Math.max(0, parseFloat(((parseFloat(efectivoRecibidoMixto) || 0) - numEfec).toFixed(2)));

  const handleCambioEfectivoMixto = (val) => {
    setMontoMixtoEfectivo(val);
    const efec = parseFloat(val) || 0;
    const restante = Math.max(0, parseFloat((total - efec).toFixed(2)));
    const restanteStr = restante > 0 ? restante.toString() : '';

    if (billeteraRestante === 'Yape') {
      setMontoMixtoYape(restanteStr);
      setMontoMixtoPlin('');
      setMontoMixtoTarjeta('');
    } else if (billeteraRestante === 'Plin') {
      setMontoMixtoPlin(restanteStr);
      setMontoMixtoYape('');
      setMontoMixtoTarjeta('');
    } else if (billeteraRestante === 'Tarjeta') {
      setMontoMixtoTarjeta(restanteStr);
      setMontoMixtoYape('');
      setMontoMixtoPlin('');
    }
  };

  const asignarRestanteA = (metodo) => {
    if (saldoPendienteMixto <= 0) return;
    const s = saldoPendienteMixto.toFixed(2);
    if (metodo === 'Yape') setMontoMixtoYape((numYap + saldoPendienteMixto).toFixed(2));
    if (metodo === 'Plin') setMontoMixtoPlin((numPli + saldoPendienteMixto).toFixed(2));
    if (metodo === 'Tarjeta') setMontoMixtoTarjeta((numTar + saldoPendienteMixto).toFixed(2));
    if (metodo === 'Efectivo') setMontoMixtoEfectivo((numEfec + saldoPendienteMixto).toFixed(2));
  };

  // Resumen texto WhatsApp y Email
  const generarTextoResumen = (ventaObj) => {
    const v = ventaObj || ticketVenta || {
      numero: 'COT-PREVIA',
      tipo_comprobante: tipoComprobante,
      cliente: clienteSeleccionado,
      total,
      detalles: items.map((i) => ({
        cantidad: i.cantidad,
        producto: { nombre: i.nombre, unidad_medida: i.unidad_medida },
        subtotal: i.subtotal
      })),
      tipo_pago: tipoPago,
      vuelto
    };

    const nombreNegocio = settings.businessName || 'FERRETERÍA & MATERIALES HEIS';
    const lines = [];
    lines.push(`🔨 *${nombreNegocio.toUpperCase()}*`);
    lines.push(`📄 *${v.tipo_comprobante === 'Factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA'}*`);
    lines.push(`🔢 N°: ${v.numero || 'B001-000001'}`);
    lines.push(`👤 Cliente: ${v.cliente?.nombre || 'Público General'}`);
    if (v.cliente?.numero_documento) {
      lines.push(`🪪 Doc: ${v.cliente.numero_documento}`);
    }
    lines.push(`─────────────────────`);
    lines.push(`📦 *MATERIALES / ARTÍCULOS:*`);
    (v.detalles || []).forEach((det) => {
      const nom = det.producto?.nombre || det.nombre || 'Artículo';
      const unid = det.producto?.unidad_medida || det.unidad_medida || 'UND';
      lines.push(`• ${det.cantidad} ${unid} x ${nom} - S/ ${parseFloat(det.subtotal || 0).toFixed(2)}`);
    });
    lines.push(`─────────────────────`);
    lines.push(`💰 *TOTAL: S/ ${parseFloat(v.total || total).toFixed(2)}*`);
    lines.push(`💳 Método: ${v.tipo_pago || tipoPago}`);
    if (parseFloat(v.vuelto || vuelto || 0) > 0) {
      lines.push(`🪙 Vuelto: S/ ${parseFloat(v.vuelto || vuelto).toFixed(2)}`);
    }
    lines.push(`🛠️ _¡Gracias por construir con nosotros!_`);
    return lines.join('\n');
  };

  const handlePrint80mm = () => {
    const comprobanteAImprimir = ticketVenta || {
      numero: 'PRE-CUENTA',
      tipo_comprobante: tipoComprobante,
      cliente: clienteSeleccionado,
      total,
      subtotal,
      descuento,
      detalles: items.map((i) => ({
        cantidad: i.cantidad,
        producto: { nombre: i.nombre, unidad_medida: i.unidad_medida },
        precio_unitario: i.precio_unitario,
        subtotal: i.subtotal
      })),
      tipo_pago: tipoPago,
      vuelto
    };

    if (!comprobanteAImprimir.detalles || comprobanteAImprimir.detalles.length === 0) {
      toast.error('No hay artículos en el carrito para imprimir');
      return;
    }

    imprimirTicketTermico(comprobanteAImprimir, { formato: '80mm', settings, autoPrint: true });
  };

  const handleEnviarWhatsapp = (e) => {
    if (e) e.preventDefault();
    let numLimpio = (telefonoWhatsapp || '').replace(/\D/g, '');
    if (!numLimpio) {
      setMostrarInputWhatsapp(true);
      toast('Ingrese el número de celular para enviar el ticket', { icon: '📱' });
      return;
    }
    if (numLimpio.length === 9) numLimpio = '51' + numLimpio;
    const texto = encodeURIComponent(generarTextoResumen(ticketVenta));
    const url = `https://api.whatsapp.com/send?phone=${numLimpio}&text=${texto}`;
    window.open(url, '_blank');
    toast.success('Abriendo WhatsApp...');
    setMostrarInputWhatsapp(false);
  };

  const handleEnviarEmail = (e) => {
    if (e) e.preventDefault();
    const resumen = generarTextoResumen(ticketVenta);
    if (!emailCliente) {
      navigator.clipboard.writeText(resumen).then(() => {
        toast.success('¡Resumen de venta copiado al portapapeles!');
      });
      setMostrarInputEmail(true);
      return;
    }
    const asunto = encodeURIComponent(`Comprobante ${ticketVenta?.numero || ''} - ${settings.businessName || 'Ferretería'}`);
    const cuerpo = encodeURIComponent(resumen);
    window.open(`mailto:${emailCliente}?subject=${asunto}&body=${cuerpo}`, '_blank');
    toast.success('Abriendo correo...');
    setMostrarInputEmail(false);
  };

  const numRecibido =
    montoRecibido !== '' && montoRecibido !== null && montoRecibido !== undefined
      ? parseFloat(montoRecibido)
      : total;
  const esEfectivoInsuficiente = tipoPago === 'Efectivo' && !isNaN(numRecibido) && numRecibido < total - 0.009;
  const montoFaltante = esEfectivoInsuficiente ? parseFloat((total - numRecibido).toFixed(2)) : 0;

  const esMixtoEfectivoInsuficiente =
    tipoPago === 'Mixto' &&
    numEfec > 0 &&
    efectivoRecibidoMixto !== '' &&
    parseFloat(efectivoRecibidoMixto) < numEfec - 0.009;

  const cobrarDisabled =
    procesandoVenta ||
    !cajaAbierta ||
    items.length === 0 ||
    esEfectivoInsuficiente ||
    esMixtoEfectivoInsuficiente ||
    (tipoPago === 'Mixto' && (Math.abs(total - totalAsignadoMixto) > 0.01 || totalAsignadoMixto === 0));

  return (
    <div
      className={`w-full shrink-0 flex flex-col justify-between bg-white dark:bg-slate-900/90 rounded-[28px] p-3 sm:p-4.5 soft-card-shadow border border-slate-100 dark:border-slate-800 min-h-[520px] lg:min-h-0 lg:h-full min-w-0 overflow-hidden relative transition-all duration-200 ${
        ticketExpandido
          ? 'lg:w-[560px] xl:w-[620px] 2xl:w-[680px]'
          : 'lg:w-[480px] xl:w-[510px] 2xl:w-[540px]'
      }`}
    >

      {/* ═══════════════════════════════════════════════════════════════════════
          ESTADO 1: TICKET YA EMITIDO CON ÉXITO (INLINE 0 MODALES)
          ═══════════════════════════════════════════════════════════════════════ */}
      {ticketVenta ? (
        <div className="flex-1 flex flex-col justify-between min-h-0 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
          <div className="space-y-4">
            {/* Banner de Éxito */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-3xl p-5 shadow-lg shadow-indigo-600/25 text-center relative overflow-hidden">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-white stroke-[2.5]" />
              </div>
              <span className="text-[10.5px] font-black uppercase tracking-wider text-indigo-200 block font-sora">
                Venta Procesada con Éxito
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight mt-0.5">
                {ticketVenta.numero || 'B001-000001'}
              </h3>
 <p className="text-xs text-indigo-100 font-semibold mt-1 ">
                {ticketVenta.tipo_comprobante} • {ticketVenta.cliente?.nombre || 'Público General'}
              </p>
            </div>

            {/* Resumen del cobro realizado */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-4 space-y-2 text-xs font-sora">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                <span>Total Cobrado:</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-slate-100">
                  S/ {parseFloat(ticketVenta.total || total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                <span>Método de Pago:</span>
                <span className="font-extrabold text-indigo-600 dark:text-indigo-400 uppercase">
                  {ticketVenta.tipo_pago || tipoPago}
                </span>
              </div>
              {parseFloat(ticketVenta.vuelto || vuelto || 0) > 0 && (
                <div className="flex justify-between items-center bg-emerald-100/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl font-bold text-emerald-900 dark:text-emerald-200">
                  <span>Vuelto Entregado:</span>
                  <span className="text-sm font-black font-mono">
                    S/ {parseFloat(ticketVenta.vuelto || vuelto).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Post-Emisión */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0 mt-auto">
            {onVerTicket && (
              <button
                type="button"
                onClick={onVerTicket}
 className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-indigo-600/20 "
                title="Abrir vista previa del comprobante / reimpresión"
              >
                <Eye className="w-4 h-4 stroke-[2.5]" />
                <span>VER COMPROBANTE EN PANTALLA</span>
              </button>
            )}

            <button
              type="button"
              onClick={onNuevaVenta}
 className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md border border-slate-800 dark:border-slate-700 "
            >
              <RotateCcw className="w-4 h-4 text-indigo-400" />
              <span>NUEVA VENTA (ESC / F2)</span>
            </button>
          </div>
        </div>
      ) : modoCobroActivo ? (
        /* ═══════════════════════════════════════════════════════════════════════
            ESTADO 2: PANEL INLINE DE COBRO (0 MODALES)
            AQUÍ SALEN LOS MONTOS FIJOS/BILLES AL ABRIR EL BOTÓN COBRAR
            ═══════════════════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col justify-between min-h-0 overflow-y-auto overflow-x-hidden custom-modal-scroll pr-0.5 animate-in fade-in duration-150">
          <div className="space-y-3.5 pb-2">
            {/* Header del Panel de Cobro */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModoCobroActivo(false)}
 className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer active:scale-95 "
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Carrito</span>
              </button>

              <span className="text-xs font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-xl font-sora">
                {tipoComprobante}
              </span>
            </div>

            {/* Tarjeta de Total a Cobrar */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-50/80 via-indigo-50/40 to-white dark:from-indigo-950/40 dark:via-slate-800 dark:to-slate-850 border border-indigo-200/80 dark:border-indigo-800/60 flex items-center justify-between shadow-2xs">
              <div>
                <span className="text-[10px] sm:text-xs font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider block font-sora">
                  Total a Cobrar
                </span>
 <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                  S/ {total.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block font-sora">
                  {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                </span>
                {descuento > 0 && (
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-black text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60 px-2 py-0.5 rounded-full font-sora">
                    - S/ {parseFloat(descuento).toFixed(2)} dto
                  </span>
                )}
              </div>
            </div>

            {/* Tabs de Métodos de Pago */}
            <div>
 <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5 ">
                Método de Pago:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {METODOS_PAGO.map(({ id, label, icon: Icon, activeCls }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTipoPago(id)}
 className={`py-2 px-1 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition-all cursor-pointer select-none active:scale-95 ${
                      tipoPago === id
                        ? `${activeCls} border-transparent font-black`
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-[10px] leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── OPCIONES SEGÚN MÉTODO DE PAGO ── */}

            {/* 1. EFECTIVO: AQUÍ APARECEN LOS MONTOS FIJOS Y BILLETERO RÁPIDO */}
            {tipoPago === 'Efectivo' && (
              <div className="bg-slate-50/90 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-3 animate-in fade-in duration-150">
                <div>
                  <span className="block text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 font-sora">
                    Billetero Rápido:
                  </span>
                  <div className="grid grid-cols-6 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMontoRecibido(total.toFixed(2))}
 className="py-2 px-1 text-[10px] font-black rounded-xl bg-indigo-600 text-white shadow-xs hover:bg-indigo-700 transition-all active:scale-95 cursor-pointer text-center "
                    >
                      EXACTO
                    </button>
                    {BILLETES_PERUANOS.map((billete) => (
                      <button
                        key={billete}
                        type="button"
                        onClick={() => setMontoRecibido(billete.toString())}
                        className={`py-2 px-1 text-xs font-mono font-black rounded-xl border transition-all cursor-pointer active:scale-95 text-center ${
                          parseFloat(montoRecibido) === billete
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        S/ {billete}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block mb-1 font-sora">
                      Efectivo Recibido (S/)
                    </span>
                    <input
                      type="number"
                      step="0.5"
                      value={montoRecibido || ''}
                      onChange={(e) => setMontoRecibido(e.target.value)}
                      placeholder="0.00"
                      autoFocus
                      className={`w-full bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-sm font-mono font-black border outline-none transition-all ${
                        esEfectivoInsuficiente
                          ? 'border-rose-400 dark:border-rose-600 text-rose-600 dark:text-rose-400 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold uppercase block mb-1 font-sora ${
                      esEfectivoInsuficiente
                        ? 'text-rose-700 dark:text-rose-400 font-black'
                        : 'text-emerald-900 dark:text-emerald-300'
                    }`}>
                      {esEfectivoInsuficiente ? 'Monto Faltante' : 'Vuelto a Entregar'}
                    </span>
                    <div className={`w-full h-[38px] rounded-xl px-2.5 flex items-center justify-between font-mono font-black whitespace-nowrap overflow-hidden shadow-2xs border transition-all ${
                      esEfectivoInsuficiente
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                        : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-300'
                    }`}>
                      <span className={`text-[10px] font-black uppercase tracking-tight shrink-0 font-sora ${
                        esEfectivoInsuficiente ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {esEfectivoInsuficiente ? 'Falta' : 'Vuelto'}
                      </span>
                      <span className={`text-xs sm:text-sm font-black font-mono shrink-0 ${
                        esEfectivoInsuficiente ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-950 dark:text-emerald-200'
                      }`}>
                        {esEfectivoInsuficiente ? `-S/ ${montoFaltante.toFixed(2)}` : `S/ ${vuelto.toFixed(2)}`}
                      </span>
                    </div>
                  </div>
                </div>

                {esEfectivoInsuficiente && (
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in duration-150">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-bold text-[11px] leading-tight">
                        Monto recibido insuficiente
                      </p>
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5 leading-snug">
                        El cliente entregó S/ {numRecibido.toFixed(2)} de un total de S/ {total.toFixed(2)}. Faltan cobrar <strong className="font-mono text-rose-700 dark:text-rose-300">S/ {montoFaltante.toFixed(2)}</strong> para completar el pago.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. YAPE */}
            {tipoPago === 'Yape' && (
              <div className="bg-purple-50/70 dark:bg-purple-950/30 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800/60 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-purple-950 dark:text-purple-200 font-black font-sora">
                  <QrCode className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                  <span>Cobro con Yape (BCP)</span>
                </div>
 <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 ">
                  Número de Operación Yape:
                </label>
                <input
                  type="text"
                  placeholder="Código de 6 a 8 dígitos (Ej. 482910)"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  autoFocus
                  className="w-full bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border border-purple-300 dark:border-purple-700 outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <p className="text-[10px] text-purple-700 dark:text-purple-300">
                  Verifique la confirmación de abono en el celular o portal Yape.
                </p>
              </div>
            )}

            {/* 3. PLIN */}
            {tipoPago === 'Plin' && (
              <div className="bg-sky-50/70 dark:bg-sky-950/30 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800/60 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-sky-950 dark:text-sky-200 font-black font-sora">
                  <Smartphone className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span>Cobro con Plin (BBVA / Interbank / Scotiabank)</span>
                </div>
 <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 ">
                  Número de Operación / Referencia Plin:
                </label>
                <input
                  type="text"
                  placeholder="Código de referencia (Ej. 904218)"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  autoFocus
                  className="w-full bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border border-sky-300 dark:border-sky-700 outline-none focus:ring-2 focus:ring-sky-500/20"
                />
                <p className="text-[10px] text-sky-700 dark:text-sky-300">
                  Verifique la confirmación de abono en su app de Plin.
                </p>
              </div>
            )}

            {/* 4. TARJETA */}
            {tipoPago === 'Tarjeta' && (
              <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-2 text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 text-blue-950 dark:text-blue-200 font-black font-sora">
                  <CreditCard className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Cobro con Tarjeta Débito / Crédito (POS)</span>
                </div>
 <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 ">
                  N° de Referencia / Voucher POS (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Visa 8942 / Niubiz / Izipay"
                  value={numeroOperacion}
                  onChange={(e) => setNumeroOperacion(e.target.value)}
                  autoFocus
                  className="w-full bg-white dark:bg-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-mono font-bold border border-blue-300 dark:border-blue-700 outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            {/* 5. CRÉDITO */}
            {tipoPago === 'Credito' && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2.5 text-xs animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-amber-950 dark:text-amber-200 font-black font-sora">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    <span>Venta a Crédito</span>
                  </div>
                  {clienteSeleccionado ? (
                    <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold">
                      Límite: S/ {parseFloat(clienteSeleccionado.limite_credito || 0).toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-[10px] text-rose-600 font-bold">
                      ¡Requiere cliente asignado!
                    </span>
                  )}
                </div>

                <div>
                  <span className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300 mb-1 font-sora">
                    Plazo de Crédito:
                  </span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[7, 15, 30, 45].map((dias) => (
                      <button
                        key={dias}
                        type="button"
                        onClick={() => setCreditoDias(dias)}
 className={`py-1.5 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                          creditoDias === dias
                            ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {dias} días
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 6. MIXTO */}
            {tipoPago === 'Mixto' && (
              <div className="bg-slate-50/90 dark:bg-slate-800/60 p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-2 text-xs animate-in fade-in duration-150 font-sora">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-800 dark:text-slate-200 text-xs">Pago Combinado</span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full font-mono ${
                        saldoPendienteMixto > 0.01
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      }`}
                    >
                      {saldoPendienteMixto > 0.01 ? `Falta: S/ ${saldoPendienteMixto.toFixed(2)}` : 'Cubierto al 100%'}
                    </span>
                  </div>

                  {saldoPendienteMixto > 0.01 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => asignarRestanteA('Efectivo')}
                        className="px-1.5 py-0.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-[9.5px] font-bold cursor-pointer transition-all active:scale-95"
                        title="Asignar restante a Efectivo"
                      >
                        + Efec
                      </button>
                      <button
                        type="button"
                        onClick={() => asignarRestanteA('Yape')}
                        className="px-1.5 py-0.5 rounded-md bg-purple-600 hover:bg-purple-700 text-white text-[9.5px] font-bold cursor-pointer transition-all active:scale-95"
                        title="Asignar restante a Yape"
                      >
                        + Yape
                      </button>
                      <button
                        type="button"
                        onClick={() => asignarRestanteA('Plin')}
                        className="px-1.5 py-0.5 rounded-md bg-sky-600 hover:bg-sky-700 text-white text-[9.5px] font-bold cursor-pointer transition-all active:scale-95"
                        title="Asignar restante a Plin"
                      >
                        + Plin
                      </button>
                      <button
                        type="button"
                        onClick={() => asignarRestanteA('Tarjeta')}
                        className="px-1.5 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[9.5px] font-bold cursor-pointer transition-all active:scale-95"
                        title="Asignar restante a Tarjeta"
                      >
                        + Tarj
                      </button>
                    </div>
                  )}
                </div>

                {/* Desglose Efectivo */}
                <div className="p-2 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex justify-between items-center text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
                    <span className="font-black text-slate-800 dark:text-slate-200">1. Efectivo:</span>
                    <div className="flex gap-1 items-center">
                      {BILLETES_PERUANOS.map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => handleCambioEfectivoMixto(b.toString())}
                          className="px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer transition-colors"
                        >
                          S/{b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Monto (S/)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={montoMixtoEfectivo}
                        onChange={(e) => handleCambioEfectivoMixto(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2.5 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 block mb-0.5">Recibido (S/)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={efectivoRecibidoMixto}
                        onChange={(e) => setEfectivoRecibidoMixto(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2.5 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  {numEfec > 0 && vueltoEfectivoMixto > 0 && (
                    <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-100 dark:border-slate-700">
                      <span className="text-slate-500 dark:text-slate-400 font-bold">Vuelto efectivo:</span>
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">
                        S/ {vueltoEfectivoMixto.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Desglose Digital / Tarjeta */}
                <div className="p-2 bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="block text-[10.5px] font-black text-slate-800 dark:text-slate-200">
                    2. Digitales / Tarjeta:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <span className="text-[9px] font-black text-purple-700 dark:text-purple-400 block mb-0.5">Yape (S/)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={montoMixtoYape}
                        onChange={(e) => setMontoMixtoYape(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-sky-700 dark:text-sky-400 block mb-0.5">Plin (S/)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={montoMixtoPlin || ''}
                        onChange={(e) => setMontoMixtoPlin && setMontoMixtoPlin(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-blue-700 dark:text-blue-400 block mb-0.5">Tarjeta (S/)</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="0.00"
                        value={montoMixtoTarjeta}
                        onChange={(e) => setMontoMixtoTarjeta(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── BOTONES BOTTOM DE COBRO INLINE ── */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-2 shrink-0 mt-auto">
            <button
              type="button"
              disabled={cobrarDisabled}
              onClick={onCobrar}
 className={`w-full h-12 rounded-xl text-white font-extrabold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                esEfectivoInsuficiente
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-600/25'
              }`}
            >
              {procesandoVenta ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
 <span className=" tracking-wide">EMITIENDO COMPROBANTE...</span>
                </>
              ) : esEfectivoInsuficiente ? (
                <>
                  <AlertCircle className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span className="font-sora tracking-wide">
                    MONTO INSUFICIENTE (FALTA S/ {montoFaltante.toFixed(2)})
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span className="font-sora tracking-wide">COBRAR Y EMITIR (ENTER / F8)</span>
                </>
              )}
            </button>

            {/* Fila Secundaria: 3 Icon Buttons (Ocultar si el monto es insuficiente) */}
            {!esEfectivoInsuficiente && !esMixtoEfectivoInsuficiente && (
              <div className="grid grid-cols-3 gap-2 animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={handlePrint80mm}
 className="h-10 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer "
                  title="Imprimir ticket térmico 80mm"
                >
                  <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="truncate">Imprimir 80mm</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnviarWhatsapp}
 className="h-10 px-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1EBE5D] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer "
                  title="Enviar por WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 fill-current" />
                  <span className="truncate">WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={handleEnviarEmail}
 className="h-10 px-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer "
                  title="Enviar comprobante por Email"
                >
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="truncate">Email</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════════
            ESTADO 3: TICKET / CARRITO DE VENTA NORMAL
            ═══════════════════════════════════════════════════════════════════════ */
        <>
          {/* Header de Caja, Atajos y Toggle Expandir */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold border border-indigo-100 dark:border-indigo-800 shadow-2xs shrink-0">
                <Receipt className="w-4 h-4" />
              </div>
              <div className="min-w-0">
 <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight truncate">
                  Ticket de Mostrador
                </h2>
 <p className="text-[10.5px] text-slate-400 font-semibold ">
                  {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Botón para expandir/reducir el ancho del ticket */}
              <button
                type="button"
                onClick={toggleExpandir}
 className="text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 transition-all cursor-pointer shadow-2xs active:scale-95 "
                title={ticketExpandido ? 'Reducir tamaño del carrito' : 'Ampliar carrito para tener más espacio'}
              >
                {ticketExpandido ? (
                  <>
                    <Minimize2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Normal</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    <span>Ampliar</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setMostrarModalAtajos?.(true)}
 className="text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95 "
                title="Ver atajos de teclado [F1]"
              >
                <Keyboard className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>Atajos [F1]</span>
              </button>
            </div>
          </div>

          {/* 1. Selector Reactivo de Cliente (DNI / RUC / Nombre) */}
          <div className="space-y-2 mb-2 shrink-0">
            <div className="relative">
              {clienteSeleccionado ? (
                <>
                  <div className="bg-gradient-to-r from-indigo-50/90 to-slate-50/80 dark:from-slate-800 dark:to-slate-800/80 border border-indigo-200/90 dark:border-slate-700 rounded-2xl p-2 shadow-2xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-[11px] shadow-xs shrink-0 font-mono">
                        {clienteSeleccionado.tipo_documento === 'RUC' ? 'RUC' : 'DNI'}
                      </div>
                      <div className="min-w-0">
 <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate leading-tight ">
                          {clienteSeleccionado.nombre}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold mt-0.5">
                          {clienteSeleccionado.tipo_documento}: {clienteSeleccionado.numero_documento || 'Sin doc'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {(clienteSeleccionado.categoria === 'MAESTRO' || clienteSeleccionado.perfil_cliente?.toLowerCase().includes('maestro') || clienteSeleccionado.perfil_cliente?.toLowerCase().includes('contratista')) && (
                        <span className="text-[9.5px] font-black text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 font-sora">
                          <HardHat className="w-3 h-3 text-amber-600" /> Maestro (-5%)
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setClienteSeleccionado(null);
                          setIdCliente('');
                          setBusquedaCliente('');
                        }}
                        className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                        title="Cambiar cliente"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* ── ALERTA DE SALDO DEUDOR / LÍNEA DE CRÉDITO DEL CLIENTE ── */}
                  {(() => {
                    const deuda = parseFloat(clienteSeleccionado.deuda_total || 0);
                    const limite = parseFloat(clienteSeleccionado.limite_credito || 0);
                    const disponible = parseFloat(clienteSeleccionado.credito_disponible ?? (limite - deuda));
                    const esBloqueado = clienteSeleccionado.estado_credito === 'Bloqueado';
                    const cuentasVencidas = (clienteSeleccionado.cuentas_cobrar || []).filter((cc) => {
                      if (!cc.fecha_vencimiento) return false;
                      return new Date(cc.fecha_vencimiento) < new Date();
                    });

                    if (deuda <= 0 && limite <= 0) return null;

                    return (
                      <div
                        className={`mt-1.5 p-2.5 rounded-2xl border flex items-center justify-between gap-2 text-xs animate-in fade-in duration-150 ${
                          esBloqueado || cuentasVencidas.length > 0
                            ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300/80 dark:border-rose-800/70 text-rose-900 dark:text-rose-200'
                            : deuda > 0
                            ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-300/80 dark:border-amber-800/70 text-amber-900 dark:text-amber-200'
                            : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                              esBloqueado || cuentasVencidas.length > 0
                                ? 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'
                                : deuda > 0
                                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300'
                                : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                            }`}
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 font-sora">
                            <p className="font-black text-[11px] truncate leading-tight">
                              {deuda > 0
                                ? `Saldo Deudor: S/ ${deuda.toFixed(2)}`
                                : `Línea de Crédito Activa: S/ ${limite.toFixed(2)}`}
                            </p>
                            <p className="text-[10px] opacity-80 truncate font-semibold">
                              {esBloqueado
                                ? '⛔ Línea bloqueada por morosidad'
                                : cuentasVencidas.length > 0
                                ? `⚠️ ${cuentasVencidas.length} cuenta(s) vencida(s)`
                                : deuda > 0
                                ? 'Tiene pagos pendientes en Cuentas por Cobrar'
                                : `Disponible: S/ ${Math.max(0, disponible).toFixed(2)}`}
                            </p>
                          </div>
                        </div>

                        {limite > 0 && deuda > 0 && (
                          <div className="text-right shrink-0 font-mono">
                            <span className="text-[9px] uppercase font-bold opacity-75 block font-sora">
                              Línea Disp.
                            </span>
                            <span className="text-[11px] font-black">
                              S/ {Math.max(0, disponible).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="DNI, RUC o Nombre del Cliente (F4)"
                      value={busquedaCliente}
                      onFocus={() => setMostrarDropdownClientes(true)}
                      onChange={(e) => {
                        setBusquedaCliente(e.target.value);
                        setMostrarDropdownClientes(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-xl pl-8 pr-2.5 py-2 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-sora"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => onAbrirRegistroRapidoConDoc?.(busquedaCliente)}
 className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95 "
                    title="Registrar Nuevo Cliente (F4)"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span className="hidden sm:inline">+ Cliente</span>
                  </button>
                </div>
              )}

              {/* Dropdown flotante de autocompletado */}
              {mostrarDropdownClientes && !clienteSeleccionado && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setMostrarDropdownClientes(false)}
                  />
                  <div className="absolute top-full left-0 w-full sm:min-w-[340px] mt-1 bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-2xl max-h-64 overflow-y-auto p-1.5 z-50 space-y-1 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setClienteSeleccionado(null);
                        setIdCliente('');
                        setBusquedaCliente('');
                        setMostrarDropdownClientes(false);
                      }}
 className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-between cursor-pointer "
                    >
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span>Público General / Varios</span>
                      </div>
                      <span className="text-[10px] text-slate-400">Sin documento</span>
                    </button>

                    {clientesFiltrados.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setClienteSeleccionado(c);
                          setIdCliente(c.id.toString());
                          if (c.tipo_documento === 'RUC' || c.numero_documento?.length === 11) {
                            setTipoComprobante('Factura');
                          } else {
                            setTipoComprobante('Boleta');
                          }
                          if (c.categoria === 'MAESTRO') {
                            setTarifa?.('maestro');
                          }
                          setMostrarDropdownClientes(false);
                        }}
 className="w-full text-left p-2 rounded-xl text-xs hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-100 font-bold transition-colors flex items-center justify-between gap-2 cursor-pointer "
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate leading-tight">{c.nombre}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                            {c.tipo_documento}: {c.numero_documento}
                          </p>
                        </div>
                        {c.categoria === 'MAESTRO' && (
                          <span className="text-[9px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full shrink-0">
                            👷 Maestro
                          </span>
                        )}
                      </button>
                    ))}

                    {busquedaCliente.trim() && !clienteExisteExacto && (
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => onAbrirRegistroRapidoConDoc?.(busquedaCliente.trim())}
 className="w-full text-left p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-2 "
                        >
                          <UserPlus className="w-4 h-4 text-white shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black">
                              Registrar {esDniValido ? `DNI ${busquedaCliente.trim()}` : esRucValido ? `RUC ${busquedaCliente.trim()}` : `"${busquedaCliente.trim()}"`}
                            </p>
                            <p className="text-[10px] text-indigo-100 font-medium">
                              {esDniValido ? 'Consulta RENIEC en vivo' : esRucValido ? 'Consulta SUNAT en vivo' : 'Registro rápido'}
                            </p>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 2. Barra Unificada y Compacta de Control: Comprobante + Tarifa + Cotización */}
            <div className="flex items-center justify-between gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl border border-slate-200/70 dark:border-slate-700">
              {/* Selector de Comprobante */}
              <div className="flex items-center gap-0.5">
                {['Boleta', 'Factura', 'Ticket'].map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => {
                      if (tipo === 'Factura' && clienteSeleccionado?.tipo_documento !== 'RUC') {
                        toast('Para emitir Factura se recomienda cliente con RUC (11 dígitos)', { icon: 'ℹ️' });
                      }
                      setTipoComprobante(tipo);
                    }}
 className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                      tipoComprobante === tipo
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/70 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{tipo}</span>
                  </button>
                ))}
              </div>

              {/* Tarifa y Cotización integradas */}
              <div className="flex items-center gap-1">
                <div className="flex items-center bg-white/80 dark:bg-slate-700/60 p-0.5 rounded-lg border border-slate-200/60 dark:border-slate-600">
                  <button
                    type="button"
                    onClick={() => setTarifa?.('publico')}
 className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer ${
                      tarifa === 'publico'
                        ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Tarifa general al público"
                  >
                    Público
                  </button>
                  <button
                    type="button"
                    onClick={() => setTarifa?.('maestro')}
 className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-0.5 ${
                      tarifa === 'maestro'
                        ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                    title="Tarifa Maestro de Obra (-5%)"
                  >
                    <HardHat className="w-2.5 h-2.5" />
                    <span>Maestro</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={onAbrirModalCotizacion}
 className="px-2 py-1 rounded-lg text-[10px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                  title="Cargar cotización previa [F6]"
                >
                  <FileSpreadsheet className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">[F6]</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Carrito de Artículos de Ferretería */}
          <div className="flex-1 min-h-0 overflow-y-auto py-1 my-1 custom-scrollbar space-y-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6 text-center font-sora">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-2 border border-indigo-100 dark:border-indigo-800">
                  <Boxes className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                  Carrito de mostrador vacío
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[210px]">
                  Haga clic en un producto o pistolee con el lector de barras
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => {
                  const esDecimal = esUnidadFraccionable(item.unidad_medida);
                  const paso = esDecimal ? 0.5 : 1;

                  return (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-800/90 hover:bg-indigo-50/20 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700/90 rounded-2xl p-2.5 sm:p-3 transition-all flex flex-col gap-2 shadow-2xs group"
                    >
                      {/* Fila 1: Nombre + Unidad + Ubicación + Botón Eliminar */}
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 font-mono shrink-0">
                              {item.unidad_medida || 'UND'}
                            </span>
 <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs sm:text-[13px] leading-snug line-clamp-2 ">
                              {item.nombre}
                            </h4>
                          </div>
                          {item.ubicacion && (
 <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-0.5 flex items-center gap-1 ">
                              <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                              <span className="truncate">{item.ubicacion}</span>
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            removeItem(item.id);
                            toast.success(`Eliminado: ${item.nombre}`);
                          }}
                          className="w-7 h-7 rounded-xl bg-slate-50 dark:bg-slate-700/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                          title="Eliminar del carrito"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Fila 2: Stepper Táctil + Precios */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                        {/* Stepper */}
                        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              const nuevaCant = parseFloat((item.cantidad - paso).toFixed(2));
                              if (nuevaCant <= 0) {
                                removeItem(item.id);
                                toast.success(`Eliminado: ${item.nombre}`);
                              } else {
                                updateCantidad(item.id, nuevaCant);
                              }
                            }}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black active:scale-90 cursor-pointer shadow-2xs"
                            title={`Disminuir (-${paso} ${item.unidad_medida || ''})`}
                          >
                            <Minus className="w-3 h-3 stroke-[3]" />
                          </button>

                          <button
                            type="button"
                            onClick={() => abrirNumpadItem(item)}
                            className="min-w-[42px] h-7 px-2 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-black text-xs sm:text-sm flex items-center justify-center gap-1 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-colors"
                            title="Tocar para digitar cantidad con teclado numérico"
                          >
                            <span>{item.cantidad}</span>
                            <Calculator className="w-2.5 h-2.5 text-slate-400" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const nuevaCant = parseFloat((item.cantidad + paso).toFixed(2));
                              try {
                                updateCantidad(item.id, nuevaCant);
                              } catch (err) {
                                toast.error(err.message);
                              }
                            }}
                            className="w-7 h-7 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center font-black active:scale-90 cursor-pointer shadow-xs"
                            title={`Aumentar (+${paso} ${item.unidad_medida || ''})`}
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                          </button>
                        </div>

                        {/* Precios: Unitario y Subtotal */}
                        <div className="text-right">
 <p className="text-[10px] text-slate-400 font-semibold">
                            S/ {parseFloat(item.precio_unitario || 0).toFixed(2)} c/u
                          </p>
 <p className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                            S/ {parseFloat(item.subtotal || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {/* Fila 3: Chips de Corte y Fracciones Rápidas */}
                      {esDecimal && (
                        <div className="flex items-center gap-1 pt-1 border-t border-slate-100 dark:border-slate-700/60 overflow-x-auto no-scrollbar">
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-wider font-sora shrink-0 mr-0.5">
                            Corte:
                          </span>
                          {[0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 5].map((frac) => (
                            <button
                              key={frac}
                              type="button"
                              onClick={() => {
                                try {
                                  updateCantidad(item.id, frac);
                                  toast.success(`Fijado en ${frac} ${item.unidad_medida || 'UND'}`);
                                } catch (err) {
                                  toast.error(err.message);
                                }
                              }}
                              className={`text-[9.5px] font-black px-1.5 py-0.5 rounded-md border transition-all cursor-pointer font-mono shrink-0 ${
                                item.cantidad === frac
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                                  : 'bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600'
                              }`}
                            >
                              {frac}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Resumen Financiero y Botón para Pasar al Cobro */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 -mx-3.5 -mb-3.5 sm:-mx-4.5 sm:-mb-4.5 p-3 sm:p-3.5 rounded-b-[28px] shrink-0 font-sora">
            {/* Fila sutil de desglose financiero */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1.5 px-0.5">
              <div className="flex items-center gap-2">
                <span>Subtotal: S/ {subtotal.toFixed(2)}</span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span>IGV (18%): S/ {((total / 1.18) * 0.18).toFixed(2)}</span>
              </div>
              {descuento > 0 && (
                <span className="font-extrabold text-amber-600 dark:text-amber-400">
                  Dto Maestro: -S/ {parseFloat(descuento).toFixed(2)}
                </span>
              )}
            </div>

            {/* Barra de Acción de Cobro Principal */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {/* Bloque Total */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl sm:rounded-2xl px-3.5 py-2 sm:py-1.5 flex sm:block items-center justify-between sm:justify-start shrink-0 sm:min-w-[140px] shadow-2xs">
                <span className="text-[10px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 block font-sora leading-tight">
                  TOTAL A PAGAR
                </span>
                <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-sora tracking-tight leading-tight">
                  S/ {total.toFixed(2)}
                </span>
              </div>

              {/* Botón Cobrar y Limpiar Carrito */}
              <div className="flex items-center gap-2 flex-1 w-full">
                <button
                  type="button"
                  onClick={() => {
                    if (items.length === 0) {
                      toast.error('El carrito de mostrador está vacío.');
                      return;
                    }
                    if (!cajaAbierta) {
                      toast.error('La caja se encuentra cerrada. Debe aperturar un turno antes de cobrar.');
                      if (onAbrirCajaPrompt) onAbrirCajaPrompt();
                      return;
                    }
                    setModoCobroActivo(true);
                  }}
                  disabled={items.length === 0}
                  className={`flex-1 h-12 rounded-xl sm:rounded-2xl text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.98] ${
                    cajaAbierta
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-emerald-600/25'
                      : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                  title="Pasar al cobro [F8 / F9]"
                >
                  {cajaAbierta ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 stroke-[2.5] shrink-0" />
                      <span className="tracking-wide whitespace-nowrap">COBRAR (F8)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 shrink-0" />
                      <span className="tracking-wide whitespace-nowrap">CAJA CERRADA</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={clearCart}
                  disabled={items.length === 0}
                  className="w-11 sm:w-10 h-12 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center cursor-pointer active:scale-90 disabled:opacity-40 transition-colors shrink-0 shadow-2xs"
                  title="Limpiar Carrito [F8]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── MODAL FLOTANTE DEL NUMPAD TÁCTIL PARA EDITAR CANTIDAD ── */}
      {itemParaNumpad && (
        <POSTouchNumpad
          visible={Boolean(itemParaNumpad)}
          item={itemParaNumpad}
          titulo="Editar Cantidad de Artículo"
          subtitulo="Ajuste táctil o por teclado numérico"
          valor={valorNumpad}
          onChange={setValorNumpad}
          onConfirm={confirmarNumpadItem}
          onClose={() => setItemParaNumpad(null)}
          conDecimales={true}
          botonesRapidos={
            esUnidadFraccionable(itemParaNumpad.unidad_medida)
              ? [0.25, 0.5, 1, 2, 5, 10]
              : [1, 2, 5, 10, 20, 50]
          }
        />
      )}
    </div>
  );
}
