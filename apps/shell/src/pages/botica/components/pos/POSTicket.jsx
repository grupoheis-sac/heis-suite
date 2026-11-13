/**
 * POSTicket.jsx — Panel derecho del POS Botica (Refactorización Visual)
 * Ticket de dispensación e integración inline del cobro y emisión (0 modales).
 * Tabs de métodos de pago, billetero rápido peruano (10, 20, 50, 100), botón sticky COBRAR Y EMITIR,
 * y fila secundaria con 3 icon buttons: Imprimir 80mm, WhatsApp, Email.
 */
import React, { useState, useEffect } from 'react';
import {
  Receipt, Keyboard, Search, X, UserPlus, Plus,
  Minus, Trash2, Gift, CheckCircle2, Stethoscope, Pill, Lock,
  Calculator, Sparkles, DollarSign, QrCode, Smartphone,
  CreditCard, Clock, Layers, ArrowLeft, Printer, MessageCircle,
  Mail, Send, Check, Copy, AlertCircle, Zap, RefreshCw,
  RotateCcw, ShieldCheck, Eye
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

const BILLETES_PERUANOS = [10, 20, 50, 100];

export default function POSTicket({
  cajaAbierta,
  onAbrirCajaPrompt,
  items = [],
  clienteSeleccionado,
  setClienteSeleccionado,
  setIdCliente,
  busquedaCliente,
  setBusquedaCliente,
  mostrarDropdownClientes,
  setMostrarDropdownClientes,
  clienteExisteExacto,
  clientesFiltrados = [],
  esDniValido,
  esRucValido,
  esDocumentoBuscado,
  abrirRegistroRapidoConDoc,
  tipoComprobante,
  setTipoComprobante,
  necesitaReceta,
  medicoCmp,
  setMedicoCmp,
  updateCantidad,
  removeItem,
  clearCart,
  puntosCanjeados,
  descuento,
  setPuntosCanjeados,
  setDescuento,
  maximoDescuentoPorPuntos,
  toggleCanjearPuntos,
  getSubtotal,
  total = 0,
  setMostrarModalAtajos,
  // Props para cobro inline
  modoCobroActivo = false,
  setModoCobroActivo,
  tipoPago,
  setTipoPago,
  numeroOperacion,
  setNumeroOperacion,
  montoRecibido,
  setMontoRecibido,
  vuelto = 0,
  creditoDias,
  setCreditoDias,
  montoMixtoEfectivo,
  setMontoMixtoEfectivo,
  efectivoRecibidoMixto,
  setEfectivoRecibidoMixto,
  montoMixtoYape,
  setMontoMixtoYape,
  montoMixtoPlin,
  setMontoMixtoPlin,
  montoMixtoTarjeta,
  setMontoMixtoTarjeta,
  operacionMixtoYape,
  setOperacionMixtoYape,
  operacionMixtoPlin,
  setOperacionMixtoPlin,
  operacionMixtoTarjeta,
  setOperacionMixtoTarjeta,
  totalAsignadoMixto = 0,
  saldoPendienteMixto = 0,
  numEfectivo = 0,
  numYape = 0,
  numPlin = 0,
  numTarjeta = 0,
  vueltoEfectivoMixto = 0,
  procesandoVenta = false,
  onCobrar,
  ticketVenta = null,
  onVerTicket,
  onNuevaVenta
}) {
  const settings = useSettingsStore();

  // Numpad táctil de cantidad
  const [itemParaNumpad, setItemParaNumpad] = useState(null);
  const [valorNumpad, setValorNumpad] = useState('');

  // Estados para acciones secundarias inline
  const [mostrarInputWhatsapp, setMostrarInputWhatsapp] = useState(false);
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [mostrarInputEmail, setMostrarInputEmail] = useState(false);
  const [emailCliente, setEmailCliente] = useState('');

  // Auto-completar mixto
  const [billeteraRestante, setBilleteraRestante] = useState('Yape');

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
      updateCantidad(itemParaNumpad.itemKey, cant);
      toast.success(`Cantidad actualizada: ${cant}`);
    } else {
      toast.error('Ingrese una cantidad válida mayor a 0');
    }
    setItemParaNumpad(null);
  };

  // Helper para asignar efectivo en pago mixto
  const handleCambioEfectivoMixto = (val) => {
    setMontoMixtoEfectivo(val);
    const efec = parseFloat(val) || 0;
    const restante = Math.max(0, parseFloat((total - efec).toFixed(2)));
    const restanteStr = restante > 0 ? restante.toString() : '';

    if (billeteraRestante === 'Yape') {
      setMontoMixtoYape(restanteStr);
      if (setMontoMixtoPlin) setMontoMixtoPlin('');
      setMontoMixtoTarjeta('');
    } else if (billeteraRestante === 'Plin') {
      if (setMontoMixtoPlin) setMontoMixtoPlin(restanteStr);
      setMontoMixtoYape('');
      setMontoMixtoTarjeta('');
    } else if (billeteraRestante === 'Tarjeta') {
      setMontoMixtoTarjeta(restanteStr);
      setMontoMixtoYape('');
      if (setMontoMixtoPlin) setMontoMixtoPlin('');
    }
  };

  const resetMixto = () => {
    setMontoMixtoEfectivo('');
    setEfectivoRecibidoMixto('');
    setMontoMixtoYape('');
    if (setMontoMixtoPlin) setMontoMixtoPlin('');
    setMontoMixtoTarjeta('');
    setOperacionMixtoYape('');
    if (setOperacionMixtoPlin) setOperacionMixtoPlin('');
    setOperacionMixtoTarjeta('');
  };

  const asignarRestanteA = (metodo) => {
    const faltante = saldoPendienteMixto;
    if (faltante <= 0) return;
    if (metodo === 'Yape') {
      setMontoMixtoYape(parseFloat((numYape + faltante).toFixed(2)).toString());
      setBilleteraRestante('Yape');
    } else if (metodo === 'Plin') {
      if (setMontoMixtoPlin) setMontoMixtoPlin(parseFloat((numPlin + faltante).toFixed(2)).toString());
      setBilleteraRestante('Plin');
    } else if (metodo === 'Tarjeta') {
      setMontoMixtoTarjeta(parseFloat((numTarjeta + faltante).toFixed(2)).toString());
      setBilleteraRestante('Tarjeta');
    } else if (metodo === 'Efectivo') {
      setMontoMixtoEfectivo(parseFloat((numEfectivo + faltante).toFixed(2)).toString());
    }
  };

  // Helper de texto del comprobante para WhatsApp y Email
  const generarTextoResumen = (ventaObj) => {
    const v = ventaObj || ticketVenta || {
      numero: 'B001-000001',
      tipo_comprobante: tipoComprobante,
      cliente: clienteSeleccionado,
      total,
      detalles: items.map((i) => ({
        cantidad: i.cantidad,
        formato_venta: i.formato_venta,
        medicamento: { nombre_comercial: i.nombre },
        subtotal: i.subtotal
      })),
      tipo_pago: tipoPago,
      vuelto
    };

    const nombreBotica = settings.businessName || 'BOTICA HEIS & SALUD';
    const lines = [];
    lines.push(`🏥 *${nombreBotica.toUpperCase()}*`);
    lines.push(`📄 *${v.tipo_comprobante === 'Factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA ELECTRÓNICA'}*`);
    lines.push(`🔢 N°: ${v.numero || 'B001-000001'}`);
    lines.push(`👤 Paciente: ${v.cliente?.nombre || 'Público General'}`);
    if (v.cliente?.numero_documento) {
      lines.push(`🪪 Doc: ${v.cliente.numero_documento}`);
    }
    lines.push(`─────────────────────`);
    lines.push(`💊 *MEDICAMENTOS:*`);
    (v.detalles || []).forEach((det) => {
      const formato = det.formato_venta === 'Fraccion' ? 'fr' : 'cj';
      const nom = det.medicamento?.nombre_comercial || 'Medicamento';
      lines.push(`• ${det.cantidad} ${formato} x ${nom} - S/ ${parseFloat(det.subtotal || 0).toFixed(2)}`);
    });
    lines.push(`─────────────────────`);
    lines.push(`💰 *TOTAL: S/ ${parseFloat(v.total || total).toFixed(2)}*`);
    lines.push(`💳 Método: ${v.tipo_pago || tipoPago}`);
    if (parseFloat(v.vuelto || vuelto || 0) > 0) {
      lines.push(`🪙 Vuelto: S/ ${parseFloat(v.vuelto || vuelto).toFixed(2)}`);
    }
    lines.push(`🌿 _¡Gracias por su confianza y cuidar su salud con nosotros!_`);
    return lines.join('\n');
  };

  const handlePrintTermico = (formato = '80mm') => {
    const comprobanteAImprimir = ticketVenta || {
      numero: 'PRE-CUENTA',
      tipo_comprobante: tipoComprobante,
      cliente: clienteSeleccionado,
      total,
      subtotal: getSubtotal ? getSubtotal() : total,
      descuento: descuento || 0,
      detalles: items.map((i) => ({
        cantidad: i.cantidad,
        formato_venta: i.formato_venta,
        unidad_fraccion: i.unidad_fraccion,
        medicamento: { nombre_comercial: i.nombre },
        precio_unitario: i.precio,
        subtotal: i.subtotal
      })),
      tipo_pago: tipoPago,
      vuelto
    };

    if (!comprobanteAImprimir.detalles || comprobanteAImprimir.detalles.length === 0) {
      toast.error('No hay medicamentos en el carrito para imprimir');
      return;
    }

    imprimirTicketTermico(comprobanteAImprimir, { formato, settings, autoPrint: true });
  };

  const handlePrint80mm = () => handlePrintTermico('80mm');

  const handleEnviarWhatsapp = (e) => {
    if (e) e.preventDefault();
    let numLimpio = (telefonoWhatsapp || '').replace(/\D/g, '');
    if (!numLimpio) {
      setMostrarInputWhatsapp(true);
      toast('Ingrese el número de celular para enviar el ticket', { icon: '📱' });
      return;
    }
    if (numLimpio.length === 9) {
      numLimpio = '51' + numLimpio;
    }
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
      // Si no hay correo registrado, copiar al portapapeles
      navigator.clipboard.writeText(resumen).then(() => {
        toast.success('¡Resumen de venta copiado al portapapeles para enviar por Email!');
      });
      setMostrarInputEmail(true);
      return;
    }
    const asunto = encodeURIComponent(`Comprobante ${ticketVenta?.numero || ''} - ${settings.businessName || 'Botica'}`);
    const cuerpo = encodeURIComponent(resumen);
    window.open(`mailto:${emailCliente}?subject=${asunto}&body=${cuerpo}`, '_blank');
    toast.success('Abriendo cliente de correo...');
    setMostrarInputEmail(false);
  };

  const numRecibido =
    montoRecibido !== '' && montoRecibido !== null && montoRecibido !== undefined
      ? parseFloat(montoRecibido)
      : null;

  const esEfectivoVacio = tipoPago === 'Efectivo' && (numRecibido === null || isNaN(numRecibido));
  const esEfectivoInsuficiente =
    tipoPago === 'Efectivo' &&
    total > 0 &&
    (esEfectivoVacio || numRecibido < total - 0.009 || numRecibido <= 0);

  const montoFaltante = esEfectivoInsuficiente
    ? parseFloat((total - (esEfectivoVacio ? 0 : Math.max(0, numRecibido))).toFixed(2))
    : 0;

  const esMixtoEfectivoInsuficiente =
    tipoPago === 'Mixto' &&
    numEfectivo > 0 &&
    efectivoRecibidoMixto !== '' &&
    parseFloat(efectivoRecibidoMixto) < numEfectivo - 0.009;

  const cobrarDisabled =
    procesandoVenta ||
    !cajaAbierta ||
    items.length === 0 ||
    total <= 0 ||
    esEfectivoInsuficiente ||
    esMixtoEfectivoInsuficiente ||
    (tipoPago === 'Credito' && !clienteSeleccionado) ||
    (tipoPago === 'Mixto' && (Math.abs(total - totalAsignadoMixto) > 0.01 || totalAsignadoMixto === 0));

  return (
    <div className="w-full lg:w-[410px] xl:w-[440px] 2xl:w-[470px] shrink-0 flex flex-col justify-between bg-white dark:bg-slate-900/90 rounded-[28px] p-3.5 sm:p-5 soft-card-shadow border border-slate-100 dark:border-slate-800 min-h-[520px] lg:min-h-0 lg:h-full min-w-0 overflow-hidden relative">
      
      {/* ─── VISTA: TICKET YA EMITIDO CON ÉXITO (INLINE 0 MODALES) ─── */}
      {ticketVenta ? (
        <div className="flex-1 flex flex-col justify-between min-h-0 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
          <div className="space-y-4">
            {/* Banner de Éxito */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-5 shadow-lg shadow-emerald-600/25 text-center relative overflow-hidden">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-inner">
                <CheckCircle2 className="w-8 h-8 text-white stroke-[2.5]" />
              </div>
              <span className="text-[10.5px] font-black uppercase tracking-wider text-emerald-200 block">
                Comprobante Emitido con Éxito
              </span>
              <h3 className="text-xl sm:text-2xl font-black font-mono tracking-tight mt-0.5">
                {ticketVenta.numero || 'B001-000001'}
              </h3>
              <p className="text-xs text-emerald-100 font-semibold mt-1">
                {ticketVenta.tipo_comprobante} • {ticketVenta.cliente?.nombre || 'Cliente General'}
              </p>
            </div>

            {/* Resumen del cobro realizado */}
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                <span>Total Cobrado:</span>
                <span className="text-base font-black font-mono text-slate-900 dark:text-slate-100">
                  S/ {parseFloat(ticketVenta.total || total).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 font-semibold">
                <span>Método de Pago:</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400 uppercase">
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

          {/* Footer Post-Emisión: Acción Principal de Comprobante + Botón Nueva Venta */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5 shrink-0 mt-auto">
            {/* Botón Principal: Ver Comprobante en Pantalla */}
            {onVerTicket && (
              <button
                type="button"
                onClick={onVerTicket}
                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-emerald-600/20"
                title="Abrir vista previa del comprobante, imprimir en 80mm/58mm o enviar por WhatsApp"
              >
                <Eye className="w-4 h-4 stroke-[2.5]" />
                <span>VER COMPROBANTE EN PANTALLA</span>
              </button>
            )}

            {/* Botón Secundario: Nueva Venta */}
            <button
              type="button"
              onClick={onNuevaVenta}
              className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md border border-slate-800 dark:border-slate-700"
            >
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              <span>NUEVA VENTA (ESC / F2)</span>
            </button>
          </div>
        </div>
      ) : modoCobroActivo ? (
        /* ─── VISTA: PANEL INLINE DE COBRO (0 MODALES) ─── */
        <div className="flex-1 flex flex-col justify-between min-h-0 overflow-y-auto custom-scrollbar animate-in fade-in duration-150">
          <div className="space-y-3.5 pb-2">
            {/* Header del Panel de Cobro con botón para volver al carrito */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModoCobroActivo(false)}
                className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 px-3 py-1.5 rounded-xl transition-colors cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al Carrito</span>
              </button>

              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-xl">
                {tipoComprobante}
              </span>
            </div>

            {/* Tarjeta de Total a Cobrar */}
            <div className="bg-[#09261E] text-white p-3.5 sm:p-4 rounded-2xl flex items-center justify-between shadow-md border border-[#00B884]/30">
              <div>
                <span className="text-[10px] font-black uppercase text-[#10E599] tracking-wider block font-sora">
                  Total a Cobrar
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold font-sora text-white mt-0.5 tracking-tight">
                  S/ {total.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-emerald-200/80 font-bold block font-sora">
                  {items.length} {items.length === 1 ? 'medicamento' : 'medicamentos'}
                </span>
                {descuento > 0 && (
                  <span className="text-[10px] font-extrabold text-[#10E599] font-sora">
                    - S/ {descuento.toFixed(2)} dto
                  </span>
                )}
              </div>
            </div>

            {/* Tabs de Métodos de Pago */}
            <div>
              <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-1.5">
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
                    <span className="text-[10.5px] leading-none">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── OPCIONES ESPECÍFICAS SEGÚN MÉTODO ── */}
            {/* 1. EFECTIVO */}
            {tipoPago === 'Efectivo' && (
              <div className="bg-slate-50/90 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-700 space-y-3">
                <div>
                  <span className="block text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    Billetero Rápido:
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setMontoRecibido(total.toFixed(2))}
                      className="py-2 px-1 text-[10.5px] font-black rounded-xl bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 transition-all active:scale-95 cursor-pointer text-center"
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
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
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
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase block mb-1">
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
                          : 'border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500'
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
                        {esEfectivoVacio ? (
                          <>Ingrese el monto entregado por el paciente o presione el botón <button type="button" onClick={() => setMontoRecibido(total.toFixed(2))} className="font-bold underline text-rose-700 dark:text-rose-300 cursor-pointer">EXACTO</button>.</>
                        ) : (
                          <>El paciente entregó S/ {(isNaN(numRecibido) ? 0 : numRecibido).toFixed(2)} de un total de S/ {total.toFixed(2)}. Faltan cobrar <strong className="font-mono font-black text-rose-700 dark:text-rose-300">S/ {montoFaltante.toFixed(2)}</strong> para completar el pago.</>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. YAPE */}
            {tipoPago === 'Yape' && (
              <div className="bg-purple-50/70 dark:bg-purple-950/30 p-3.5 rounded-2xl border border-purple-200 dark:border-purple-800/60 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-purple-950 dark:text-purple-200 font-black">
                  <QrCode className="w-4 h-4 text-purple-700 dark:text-purple-400" />
                  <span>Cobro con Yape (BCP)</span>
                </div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
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
                <p className="text-[10px] text-purple-700 dark:text-purple-300">Verifique la confirmación de abono en el celular o portal Yape.</p>
              </div>
            )}

            {/* 3. PLIN */}
            {tipoPago === 'Plin' && (
              <div className="bg-sky-50/70 dark:bg-sky-950/30 p-3.5 rounded-2xl border border-sky-200 dark:border-sky-800/60 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-sky-950 dark:text-sky-200 font-black">
                  <Smartphone className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                  <span>Cobro con Plin (BBVA / Interbank / Scotiabank)</span>
                </div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
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
                <p className="text-[10px] text-sky-700 dark:text-sky-300">Verifique la confirmación de abono en su app de Plin.</p>
              </div>
            )}

            {/* 4. TARJETA POS */}
            {tipoPago === 'Tarjeta' && (
              <div className="bg-blue-50/70 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/60 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 text-blue-950 dark:text-blue-200 font-black">
                  <CreditCard className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>Cobro con Tarjeta Débito / Crédito (Terminal POS)</span>
                </div>
                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-300">
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
                <p className="text-[10px] text-blue-700 dark:text-blue-300">Procese la tarjeta en el terminal inalámbrico e ingrese la referencia.</p>
              </div>
            )}

            {/* 5. CRÉDITO */}
            {tipoPago === 'Credito' && (
              <div className="bg-amber-50/70 dark:bg-amber-950/30 p-3.5 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2 text-xs">
                <label className="block text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase">
                  Días de Crédito Autorizados:
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[15, 30, 45, 60].map((dias) => (
                    <button
                      key={dias}
                      type="button"
                      onClick={() => setCreditoDias(dias)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        creditoDias === dias
                          ? 'bg-amber-600 text-white border-amber-600 font-black'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {dias} Días
                    </button>
                  ))}
                </div>
                {!clienteSeleccionado && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                    ⚠ Debe seleccionar o registrar un cliente para ventas a crédito.
                  </p>
                )}
              </div>
            )}

            {/* 6. PAGO MIXTO */}
            {tipoPago === 'Mixto' && (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                {/* Reconciliación */}
                <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
                  saldoPendienteMixto === 0 && totalAsignadoMixto > 0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 font-bold'
                    : saldoPendienteMixto > 0
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-bold'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 font-bold'
                }`}>
                  <div className="flex items-center gap-1.5">
                    {saldoPendienteMixto === 0 && totalAsignadoMixto > 0 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    )}
                    <span>
                      {saldoPendienteMixto === 0 && totalAsignadoMixto > 0
                        ? '100% Cubierto'
                        : saldoPendienteMixto > 0
                        ? `Falta: S/ ${saldoPendienteMixto.toFixed(2)}`
                        : `Excede: S/ ${(totalAsignadoMixto - total).toFixed(2)}`}
                    </span>
                  </div>
                  <button type="button" onClick={resetMixto} className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 underline cursor-pointer">
                    Limpiar
                  </button>
                </div>

                {/* Asignación rápida de saldo */}
                {saldoPendienteMixto > 0.01 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mr-1">Pasar saldo a:</span>
                    <button type="button" onClick={() => asignarRestanteA('Yape')} className="px-2 py-0.5 rounded-lg bg-purple-600 text-white text-[10px] font-bold cursor-pointer">
                      + Yape
                    </button>
                    <button type="button" onClick={() => asignarRestanteA('Plin')} className="px-2 py-0.5 rounded-lg bg-sky-600 text-white text-[10px] font-bold cursor-pointer">
                      + Plin
                    </button>
                    <button type="button" onClick={() => asignarRestanteA('Tarjeta')} className="px-2 py-0.5 rounded-lg bg-blue-600 text-white text-[10px] font-bold cursor-pointer">
                      + POS
                    </button>
                    <button type="button" onClick={() => asignarRestanteA('Efectivo')} className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer">
                      + Efectivo
                    </button>
                  </div>
                )}

                {/* Desglose Efectivo */}
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <div className="flex justify-between items-center text-[11px] font-black text-slate-800 dark:text-slate-200">
                    <span>1. Parte Efectivo</span>
                    <div className="flex gap-1">
                      {BILLETES_PERUANOS.map((b) => (
                        <button key={b} type="button" onClick={() => handleCambioEfectivoMixto(b.toString())} className="px-2 py-0.5 rounded text-[9.5px] font-mono bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 cursor-pointer whitespace-nowrap">
                          S/{b}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="Monto S/"
                      value={montoMixtoEfectivo}
                      onChange={(e) => handleCambioEfectivoMixto(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 rounded-lg px-2.5 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    />
                    <input
                      type="number"
                      placeholder="Recibido S/"
                      value={efectivoRecibidoMixto}
                      onChange={(e) => setEfectivoRecibidoMixto(e.target.value)}
                      className="bg-slate-50 dark:bg-slate-900 rounded-lg px-2.5 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                    />
                  </div>
                  {numEfectivo > 0 && vueltoEfectivoMixto > 0 && (
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 text-right">
                      Vuelto efectivo: S/ {vueltoEfectivoMixto.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Desglose Digital (Yape / Plin / Tarjeta) */}
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="block text-[11px] font-black text-slate-800 dark:text-slate-200">2. Parte Digital</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <span className="text-[9.5px] font-bold text-purple-700 dark:text-purple-400 block">Yape (S/)</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={montoMixtoYape}
                        onChange={(e) => setMontoMixtoYape(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-sky-700 dark:text-sky-400 block">Plin (S/)</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={montoMixtoPlin || ''}
                        onChange={(e) => setMontoMixtoPlin && setMontoMixtoPlin(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-blue-700 dark:text-blue-400 block">Tarjeta (S/)</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={montoMixtoTarjeta}
                        onChange={(e) => setMontoMixtoTarjeta(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg px-2 py-1 text-xs font-mono font-bold border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── STICKY BOTTOM ACTIONS: COBRAR Y EMITIR + 3 ICON BUTTONS ── */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/90 space-y-2 shrink-0 mt-auto">
            {/* Botón Principal: COBRAR Y EMITIR */}
            <button
              type="button"
              disabled={cobrarDisabled}
              onClick={onCobrar}
              className={`w-full h-12 rounded-xl text-white font-extrabold font-sora text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                esEfectivoInsuficiente
                  ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                  : 'bg-gradient-to-r from-[#00B884] to-[#009E70] hover:from-[#009E70] hover:to-[#00855E] shadow-[#00B884]/20'
              }`}
            >
              {procesandoVenta ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="font-sora tracking-wide">EMITIENDO COMPROBANTE...</span>
                </>
              ) : esEfectivoInsuficiente ? (
                <>
                  <AlertCircle className="w-4 h-4 stroke-[2.5]" />
                  <span className="font-sora tracking-wide">
                    {esEfectivoVacio ? 'INGRESE MONTO EN EFECTIVO' : `FALTAN S/ ${montoFaltante.toFixed(2)} EN EFECTIVO`}
                  </span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span className="font-sora tracking-wide">COBRAR Y EMITIR (ENTER / F8)</span>
                </>
              )}
            </button>

            {/* Fila Secundaria: 3 Icon Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handlePrint80mm}
                className="h-10 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Configurar / Probar Impresora Térmica 80mm"
              >
                <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="truncate">Imprimir 80mm</span>
              </button>

              <button
                type="button"
                onClick={handleEnviarWhatsapp}
                className="h-10 px-2 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1EBE5D] text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Enviar por WhatsApp"
              >
                <MessageCircle className="w-4 h-4 fill-current" />
                <span className="truncate">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleEnviarEmail}
                className="h-10 px-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                title="Enviar comprobante por Email"
              >
                <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="truncate">Email</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ─── VISTA: TICKET / DISPENSACIÓN NORMAL (CARRITO) ─── */
        <>
          {/* Header de Caja */}
          <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold border border-emerald-100 dark:border-emerald-800 shadow-2xs">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight">
                  Ticket de Dispensación
                </h2>
                <p className="text-[11px] text-slate-400 font-semibold">
                  {items.length} {items.length === 1 ? 'medicamento' : 'medicamentos'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setMostrarModalAtajos(true)}
                className="text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="Ver atajos de teclado (F1)"
              >
                <Keyboard className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                <span>Atajos</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!cajaAbierta && onAbrirCajaPrompt) onAbrirCajaPrompt();
                }}
                disabled={cajaAbierta}
                className={`text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 border transition-all ${
                  cajaAbierta
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800 cursor-default'
                    : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800 cursor-pointer shadow-xs active:scale-95'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${cajaAbierta ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{cajaAbierta ? 'Abierta' : 'Abrir'}</span>
              </button>
            </div>
          </div>

          {/* 1. Selector de Paciente (DNI/RUC/Nombre) + Botón Agregar Cliente */}
          <div className="space-y-2 mb-2 shrink-0">
            <div className="relative">
              {clienteSeleccionado ? (
                <div className="bg-gradient-to-r from-emerald-50/90 to-teal-50/80 dark:from-slate-800 dark:to-slate-800/80 border border-emerald-200/90 dark:border-slate-700 rounded-2xl p-2 shadow-2xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-[11px] shadow-xs shrink-0">
                      {clienteSeleccionado.tipo_documento === 'RUC' ? 'RUC' : 'DNI'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate leading-tight">
                        {clienteSeleccionado.nombre}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono font-bold mt-0.5">
                        {clienteSeleccionado.tipo_documento}: {clienteSeleccionado.numero_documento || 'Sin doc'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full inline-block">
                        ⭐ {clienteSeleccionado.puntos_fidelidad || 0} pts
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setClienteSeleccionado(null);
                        setIdCliente('');
                        setPuntosCanjeados(0);
                        setDescuento(0);
                      }}
                      className="w-7 h-7 rounded-xl bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                      title="Cambiar paciente"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="DNI, RUC o Nombre del Paciente (F4)"
                      value={busquedaCliente}
                      onFocus={() => setMostrarDropdownClientes(true)}
                      onChange={(e) => {
                        setBusquedaCliente(e.target.value);
                        setMostrarDropdownClientes(true);
                      }}
                      className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 rounded-xl pl-8 pr-2.5 py-2 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => abrirRegistroRapidoConDoc(busquedaCliente)}
                    className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-black flex items-center gap-1 transition-all cursor-pointer shrink-0 shadow-2xs active:scale-95"
                    title="Registrar Nuevo Paciente (F4)"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">+ Paciente</span>
                  </button>
                </div>
              )}

              {/* Dropdown de búsqueda de clientes */}
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
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span>Cliente General / Varios</span>
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
                          setMostrarDropdownClientes(false);
                        }}
                        className="w-full text-left p-2 rounded-xl text-xs hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-100 font-bold transition-colors flex items-center justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-slate-800 dark:text-slate-100 truncate leading-tight">{c.nombre}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate">
                            {c.tipo_documento}: {c.numero_documento}
                          </p>
                        </div>
                        <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-black bg-indigo-50 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full shrink-0">
                          ⭐ {c.puntos_fidelidad || 0} pts
                        </span>
                      </button>
                    ))}

                    {busquedaCliente.trim() && !clienteExisteExacto && (
                      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-700">
                        <button
                          type="button"
                          onClick={() => abrirRegistroRapidoConDoc(busquedaCliente.trim())}
                          className="w-full text-left p-2.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-700 text-white transition-all shadow-xs cursor-pointer flex items-center gap-2"
                        >
                          <UserPlus className="w-4 h-4 text-white shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-black">
                              Registrar {esDniValido ? `DNI ${busquedaCliente.trim()}` : esRucValido ? `RUC ${busquedaCliente.trim()}` : `"${busquedaCliente.trim()}"`}
                            </p>
                            <p className="text-[10px] text-emerald-100 font-medium">
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

            {/* 2. Opciones Boleta / Factura / Ticket como Pills */}
            <div className="grid grid-cols-3 gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/70 dark:border-slate-700">
              {['Boleta', 'Factura', 'Ticket'].map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoComprobante(tipo)}
                  className={`py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer active:scale-95 ${
                    tipoComprobante === tipo
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-700'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Alerta de Receta Médica si se requiere */}
          {necesitaReceta && (
            <div className="mb-2 p-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex items-center gap-2 shrink-0">
              <Stethoscope className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-rose-800 dark:text-rose-300">Receta Médica Obligatoria</p>
              </div>
              <input
                type="text"
                required
                placeholder="CMP Médico"
                value={medicoCmp}
                onChange={(e) => setMedicoCmp(e.target.value)}
                className="w-24 bg-white dark:bg-slate-800 rounded-lg px-2 py-1 text-xs text-slate-800 dark:text-slate-100 border border-rose-300 dark:border-rose-700 font-mono font-bold outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          )}

          {/* 3. Carrito de Medicamentos */}
          <div className="flex-1 min-h-0 overflow-y-auto py-1 my-1 custom-scrollbar space-y-2">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 border border-emerald-100 dark:border-emerald-800">
                  <Pill className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">Carrito de farmacia vacío</p>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px]">
                  Haga clic en "+" o pistolee con el lector de barras
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.itemKey}
                    className="bg-slate-50/90 dark:bg-slate-800/70 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-2.5 transition-all flex flex-col gap-1.5"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded border shrink-0 ${
                              item.formato_venta === 'Caja'
                                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                : 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700'
                            }`}
                          >
                            {item.formato_venta}
                          </span>
                          <p className="font-black text-slate-900 dark:text-slate-100 text-xs truncate">
                            {item.nombre}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          Lt: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{item.numero_lote}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.itemKey)}
                        className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/80">
                      {/* Botones - [Cant] + */}
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateCantidad(item.itemKey, Math.max(1, item.cantidad - 1))}
                          className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center font-black active:scale-90 cursor-pointer"
                        >
                          <Minus className="w-3 h-3 stroke-[3]" />
                        </button>

                        <button
                          type="button"
                          onClick={() => abrirNumpadItem(item)}
                          className="min-w-[36px] h-7 px-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 hover:bg-[#EBFDF6] dark:hover:bg-[#00B884]/20 text-slate-900 dark:text-slate-100 hover:text-[#00855E] dark:hover:text-[#5EEBB8] font-mono font-black text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors border border-transparent hover:border-[#A6F6D8] dark:hover:border-[#00B884]/40"
                          title="Cambiar cantidad con teclado numérico"
                        >
                          <span>{item.cantidad}</span>
                          <Calculator className="w-2.5 h-2.5 text-slate-400" />
                        </button>

                        <button
                          type="button"
                          onClick={() => updateCantidad(item.itemKey, item.cantidad + 1)}
                          className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-black active:scale-90 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 stroke-[3]" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[9.5px] text-slate-400 font-sora font-semibold">
                          S/ {item.precio_unitario.toFixed(2)} c/u
                        </p>
                        <p className="text-xs sm:text-sm font-extrabold font-sora text-[#00855E] dark:text-emerald-400">
                          S/ {item.subtotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Fidelización / Canje Puntos */}
          {clienteSeleccionado && (clienteSeleccionado.puntos_fidelidad || 0) > 0 && (
            <div className="my-1.5 p-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60 rounded-xl flex items-center justify-between shadow-2xs shrink-0">
              <div className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <div className="text-[10.5px]">
                  <p className="font-black text-indigo-950 dark:text-indigo-200">
                    Puntos: <span className="font-mono text-indigo-700 dark:text-indigo-400">{clienteSeleccionado.puntos_fidelidad} pts</span>
                  </p>
                  {puntosCanjeados > 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      Canjeando S/ {descuento.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">
                      Canjee hasta S/ {maximoDescuentoPorPuntos.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={toggleCanjearPuntos}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-black cursor-pointer ${
                  puntosCanjeados > 0
                    ? 'bg-rose-500 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {puntosCanjeados > 0 ? 'Quitar' : 'Canjear'}
              </button>
            </div>
          )}

          {/* Totales y Botón para Pasar al Cobro */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 -mx-3.5 -mb-3.5 sm:-mx-5 sm:-mb-5 p-3.5 sm:p-4 rounded-b-[28px] shrink-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-semibold font-sora">Subtotal</span>
              <span className="font-sora font-bold text-slate-700 dark:text-slate-200">S/ {getSubtotal().toFixed(2)}</span>
            </div>

            {descuento > 0 && (
              <div className="flex items-center justify-between text-xs text-[#00855E] dark:text-emerald-400 font-bold mb-1 font-sora">
                <span>Descuento Puntos</span>
                <span className="font-sora">- S/ {descuento.toFixed(2)}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-slate-800 mb-2.5">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block font-sora">
                  TOTAL A COBRAR
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sora tracking-tight">
                  S/ {total.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={clearCart}
                disabled={items.length === 0}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center cursor-pointer active:scale-90 disabled:opacity-40"
                title="Limpiar Carrito (F9)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Botón Cobrar (Expande el panel inline) */}
            <button
              type="button"
              onClick={() => {
                if (items.length === 0) {
                  toast.error('El carrito de dispensación está vacío.');
                  return;
                }
                if (!cajaAbierta) {
                  toast.error('La caja chica se encuentra cerrada. Debe aperturar un turno antes de cobrar.');
                  if (onAbrirCajaPrompt) onAbrirCajaPrompt();
                  return;
                }
                setModoCobroActivo(true);
                if (montoRecibido === '' || montoRecibido === null || montoRecibido === undefined || parseFloat(montoRecibido) <= 0) {
                  setMontoRecibido(total.toFixed(2));
                }
              }}
              disabled={items.length === 0}
              className={`w-full h-12 rounded-xl text-white font-extrabold font-sora text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                cajaAbierta
                  ? 'bg-gradient-to-r from-[#00B884] to-[#009E70] hover:from-[#009E70] hover:to-[#00855E] shadow-[#00B884]/25'
                  : 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800'
              }`}
            >
              {cajaAbierta ? (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span className="tracking-wide">COBRAR S/ {total.toFixed(2)} (F8)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span className="tracking-wide">CAJA CERRADA (F8)</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* ── MODAL FLOTANTE DEL NUMPAD TÁCTIL PARA EDITAR CANTIDAD ── */}
      {itemParaNumpad && (
        <POSTouchNumpad
          visible={Boolean(itemParaNumpad)}
          item={itemParaNumpad}
          titulo="Editar Cantidad de Medicamento"
          subtitulo={itemParaNumpad.nombre}
          valor={valorNumpad}
          onChange={setValorNumpad}
          onConfirm={confirmarNumpadItem}
          onClose={() => setItemParaNumpad(null)}
          conDecimales={itemParaNumpad.formato_venta === 'Fraccion'}
          botonesRapidos={[1, 2, 5, 10, 20]}
        />
      )}

      {/* ── CONTENEDOR OCULTO PARA IMPRESIÓN TÉRMICA 80MM (Vía window.print() y @media print) ── */}
      <div id="ticket-impresion-backup-pos" className="papel-80mm hidden print:block text-black font-mono">
        {ticketVenta && (
          <div className="p-2 space-y-1 text-center">
            <h4 className="font-black text-sm uppercase">{settings.businessName || 'BOTICA HEIS & SALUD'}</h4>
            <p className="text-xs">RUC: {settings.businessRuc || '20608945123'}</p>
            <p className="text-[10px]">{settings.address || 'Av. Las Palmas 450'}</p>
            <p className="text-[10px]">Telf: {settings.phone || '998-765-432'}</p>
            <div className="border-t border-b border-dashed border-black my-1 py-1">
              <p className="font-black uppercase">{ticketVenta.tipo_comprobante || 'BOLETA'}</p>
              <p className="font-bold">{ticketVenta.numero || 'B001-000001'}</p>
              <p className="text-[9.5px]">Fecha: {new Date(ticketVenta.created_at || Date.now()).toLocaleString('es-PE')}</p>
              <p className="text-[9.5px]">Cliente: {ticketVenta.cliente?.nombre || 'Público General'}</p>
              {ticketVenta.cliente?.numero_documento && (
                <p className="text-[9.5px]">Doc: {ticketVenta.cliente.numero_documento}</p>
              )}
            </div>
            <div className="text-left text-[9.5px] space-y-0.5">
              {(ticketVenta.detalles || []).map((det, i) => (
                <div key={i} className="flex justify-between">
                  <span>{det.cantidad}x {det.medicamento?.nombre_comercial}</span>
                  <span className="font-bold">S/ {parseFloat(det.subtotal || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dashed border-black pt-1 my-1 text-right text-xs">
              <p className="font-black">TOTAL: S/ {parseFloat(ticketVenta.total || 0).toFixed(2)}</p>
              <p className="text-[9px]">Método: {ticketVenta.tipo_pago}</p>
              {parseFloat(ticketVenta.vuelto || 0) > 0 && (
                <p className="text-[9px]">Vuelto: S/ {parseFloat(ticketVenta.vuelto).toFixed(2)}</p>
              )}
            </div>
            <p className="text-[8px] text-center pt-1">¡Gracias por su compra!</p>
          </div>
        )}
      </div>
    </div>
  );
}
