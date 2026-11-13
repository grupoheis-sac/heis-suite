import React, { useState, useMemo } from 'react';
import {
  BedDouble, DollarSign, Trash2, Plus, Minus,
  Receipt, QrCode, Smartphone, CreditCard,
  CheckCircle2, Search, ArrowRight, ArrowLeft, Wallet,
  AlertCircle, Store
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketTermico } from '../../utils/impresionTermica';
import ModalComprobantePOS from './ModalComprobantePOS';

const BILLETES_PERUANOS = [10, 20, 50, 100, 200];

export default function POSHotelTicket({
  items = [],
  modoCobro = 'habitacion',
  setModoCobro,
  reservasActivas = [],
  reservaSeleccionada,
  setReservaSeleccionada,
  clienteMostrador,
  setClienteMostrador,
  tipoComprobante,
  setTipoComprobante,
  tipoPago,
  setTipoPago,
  numeroOperacion,
  setNumeroOperacion,
  montoRecibido,
  setMontoRecibido,
  descuento = 0,
  setDescuento,
  observaciones = '',
  setObservaciones,
  updateCantidad,
  removeItem,
  clearCart,
  getSubtotal,
  getTotal,
  getVuelto,
  procesando = false,
  onConfirmarOperacion,
  resultadoOperacion = null,
  onNuevaOperacion
}) {
  const { settings } = useSettingsStore();

  const [busquedaHabitacion, setBusquedaHabitacion] = useState('');
  const [mostrarSelectorHabitacion, setMostrarSelectorHabitacion] = useState(false);

  // Control de flujo en Venta Mostrador: 'resumen' (ver todos los productos) | 'pago' (desplegar métodos de pago)
  const [pasoVentaMostrador, setPasoVentaMostrador] = useState('resumen');
  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [copiadoWhatsapp, setCopiadoWhatsapp] = useState(false);

  const subtotal = getSubtotal();
  const total = getTotal();
  const vuelto = getVuelto();

  const montoRecibidoNum = parseFloat(montoRecibido);
  const montoInsuficiente =
    modoCobro === 'mostrador' &&
    tipoPago === 'efectivo' &&
    montoRecibido !== '' &&
    montoRecibido !== null &&
    montoRecibido !== undefined &&
    !isNaN(montoRecibidoNum) &&
    montoRecibidoNum < total - 0.01;
  const diferenciaInsuficiente = montoInsuficiente ? +(total - montoRecibidoNum).toFixed(2) : 0;

  // Habitaciones ocupadas filtradas
  const habitacionesFiltradas = useMemo(() => {
    if (!busquedaHabitacion.trim()) return reservasActivas;
    const q = busquedaHabitacion.toLowerCase().trim();
    return reservasActivas.filter((r) => {
      const numHab = r.habitacion?.numero?.toLowerCase() || '';
      const huesped = `${r.huesped?.nombre || ''} ${r.huesped?.apellido || ''}`.toLowerCase();
      const doc = r.huesped?.num_documento?.toLowerCase() || '';
      return numHab.includes(q) || huesped.includes(q) || doc.includes(q);
    });
  }, [reservasActivas, busquedaHabitacion]);

  // ═══════════════════════════════════════════════════════════════════════
  // PANTALLA PRINCIPAL DEL TICKET Y GESTIÓN DE COBRO
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col h-full min-w-0 select-none">
      {/* 1. Selector de Modo: Cargar a Habitación vs Venta Mostrador */}
      <div className="space-y-1.5 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
        <div className="grid grid-cols-2 p-0.5 bg-slate-100 dark:bg-slate-800/80 rounded-xl gap-0.5">
          <button
            type="button"
            onClick={() => {
              setModoCobro('habitacion');
              setPasoVentaMostrador('resumen');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold font-sora transition-all duration-150 cursor-pointer ${
              modoCobro === 'habitacion'
                ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-2xs ring-1 ring-emerald-500/25'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <BedDouble className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">Cargar a Habitación</span>
            {reservasActivas.length > 0 && (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  modoCobro === 'habitacion'
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                {reservasActivas.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setModoCobro('mostrador');
              setPasoVentaMostrador('resumen');
            }}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold font-sora transition-all duration-150 cursor-pointer ${
              modoCobro === 'mostrador'
                ? 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-300 shadow-2xs ring-1 ring-blue-500/25'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">Venta Mostrador</span>
          </button>
        </div>

        {/* Tarjeta Contextual según Modo */}
        {modoCobro === 'habitacion' ? (
          <div>
            {reservaSeleccionada ? (
              <div className="p-1.5 sm:p-2 bg-emerald-50/90 dark:bg-emerald-950/40 rounded-xl border border-emerald-300/80 dark:border-emerald-800/70 flex items-center justify-between gap-1.5 shadow-2xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black font-sora text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {reservaSeleccionada.habitacion?.numero}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate font-sora">
                        {reservaSeleccionada.huesped?.nombre} {reservaSeleccionada.huesped?.apellido}
                      </h4>
                      <span className="text-[8.5px] font-extrabold px-1 rounded bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 shrink-0 uppercase">
                        In
                      </span>
                    </div>
                    <p className="text-[9.5px] text-emerald-700 dark:text-emerald-300/80 font-medium truncate">
                      {reservaSeleccionada.habitacion?.tipo?.nombre || 'Hab.'} • Doc: {reservaSeleccionada.huesped?.num_documento || 'S/D'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setReservaSeleccionada(null)}
                  className="text-[10.5px] font-bold text-emerald-700 dark:text-emerald-300 hover:text-rose-600 dark:hover:text-rose-400 px-2 py-1 rounded-lg hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 transition-colors shrink-0 cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={busquedaHabitacion}
                    onChange={(e) => {
                      setBusquedaHabitacion(e.target.value);
                      setMostrarSelectorHabitacion(true);
                    }}
                    onFocus={() => setMostrarSelectorHabitacion(true)}
                    placeholder="Buscar habitación ocupada (N° o huésped)..."
                    className="w-full pl-8 pr-6 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl font-sora text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1.5 focus:ring-emerald-500 shadow-2xs"
                  />
                  {busquedaHabitacion && (
                    <button
                      type="button"
                      onClick={() => setBusquedaHabitacion('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {mostrarSelectorHabitacion && (
                  <div className="max-h-40 overflow-y-auto mt-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg divide-y divide-slate-100 dark:divide-slate-700/60 z-20 relative">
                    {habitacionesFiltradas.length === 0 ? (
                      <div className="p-2.5 text-center text-xs text-slate-400 font-sora">
                        No hay habitaciones ocupadas en check-in.
                      </div>
                    ) : (
                      habitacionesFiltradas.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => {
                            setReservaSeleccionada(r);
                            setMostrarSelectorHabitacion(false);
                            setBusquedaHabitacion('');
                          }}
                          className="p-2 hover:bg-emerald-50/70 dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between gap-1.5 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-6 h-6 rounded-md bg-emerald-600 text-white text-[11px] font-black flex items-center justify-center font-sora shrink-0 shadow-2xs">
                              {r.habitacion?.numero}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate font-sora">
                                {r.huesped?.nombre} {r.huesped?.apellido}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {r.habitacion?.tipo?.nombre} • {r.huesped?.num_documento || 'S/D'}
                              </p>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                            Elegir
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-1.5 px-2 bg-blue-50/80 dark:bg-blue-950/30 rounded-xl border border-blue-200/80 dark:border-blue-900/60 flex items-center justify-between gap-1.5 shadow-2xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Store className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate font-sora">
                  {clienteMostrador?.nombre?.trim() || 'Cliente General (Público)'}
                </h4>
                <p className="text-[9.5px] text-blue-700 dark:text-blue-300/80 font-medium truncate">
                  {clienteMostrador?.num_doc ? `Doc: ${clienteMostrador.num_doc} • ` : ''}Venta directa / Contado
                </p>
              </div>
            </div>

            <span className="text-[8.5px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-100/90 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 shrink-0 font-sora">
              Mostrador
            </span>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: LISTADO COMPLETO DE PRODUCTOS (Modo Mostrador o Hab.)    */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {modoCobro === 'habitacion' || pasoVentaMostrador === 'resumen' ? (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto py-2 space-y-1.5 pr-0.5 custom-scrollbar">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 font-sora px-1">
              <span>Productos en Ticket ({items.length})</span>
            </div>

            {items.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center p-3 text-slate-400">
                <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-1.5" />
                <p className="text-xs font-bold font-sora text-slate-600 dark:text-slate-400">
                  El ticket de consumo está vacío
                </p>
                <p className="text-[10.5px] text-slate-400 mt-0.5 max-w-[200px]">
                  Haz clic en los productos del catálogo izquierdo para agregarlos al ticket.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className="p-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-1.5 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <h5 className="font-bold text-slate-800 dark:text-slate-100 truncate font-sora text-xs">
                        {it.nombre}
                      </h5>
                      <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 mt-0.2">
                        {it.codigo && <span className="font-mono">{it.codigo} • </span>}
                        <span className="font-semibold text-slate-600 dark:text-slate-300">
                          S/ {it.precio_unitario.toFixed(2)} c/u
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900">
                        <button
                          type="button"
                          onClick={() => updateCantidad(it.id, it.cantidad - 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-l-lg cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-5 text-center font-bold font-mono text-xs text-slate-800 dark:text-slate-100">
                          {it.cantidad}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCantidad(it.id, it.cantidad + 1)}
                          className="w-5 h-5 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-r-lg cursor-pointer"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>

                      <span className="font-extrabold text-slate-900 dark:text-slate-50 font-sora w-14 text-right text-xs">
                        S/ {it.subtotal.toFixed(2)}
                      </span>

                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Totales y Botón para Pasar al Cobro (Estructura Botica) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 -mx-3.5 -mb-4 sm:-mx-4 sm:-mb-4 p-3 sm:p-3.5 rounded-b-[28px] shrink-0">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 font-semibold font-sora">Subtotal</span>
              <span className="font-sora font-bold text-slate-700 dark:text-slate-200">S/ {subtotal.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span className="font-semibold font-sora">Descuento</span>
              <div className="flex items-center gap-1">
                <span className="text-[11px] font-mono">S/</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={descuento || ''}
                  onChange={(e) => setDescuento(e.target.value)}
                  placeholder="0.00"
                  className="w-14 px-1 py-0.2 text-right font-mono bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/80 dark:border-slate-800 mb-2">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block font-sora">
                  {modoCobro === 'habitacion' ? 'TOTAL A CARGAR' : 'TOTAL A COBRAR'}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-sora tracking-tight">
                  S/ {total.toFixed(2)}
                </span>
              </div>

              <button
                type="button"
                onClick={clearCart}
                disabled={items.length === 0}
                className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center cursor-pointer active:scale-90 disabled:opacity-40 transition-colors shadow-2xs"
                title="Vaciar ticket"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Botón Acción Principal */}
            {modoCobro === 'habitacion' ? (
              <button
                type="button"
                disabled={items.length === 0 || procesando || !reservaSeleccionada}
                onClick={onConfirmarOperacion}
                className={`w-full h-12 rounded-xl text-white font-extrabold font-sora text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                  items.length === 0 || !reservaSeleccionada
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-600/25'
                }`}
              >
                {procesando ? (
                  <span>Procesando...</span>
                ) : reservaSeleccionada ? (
                  <>
                    <BedDouble className="w-4 h-4" />
                    <span>CARGAR A HAB. {reservaSeleccionada.habitacion?.numero}</span>
                  </>
                ) : (
                  <span>SELECCIONE UNA HABITACIÓN</span>
                )}
              </button>
            ) : (
              <button
                type="button"
                disabled={items.length === 0}
                onClick={() => setPasoVentaMostrador('pago')}
                className={`w-full h-12 rounded-xl text-white font-extrabold font-sora text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                  items.length === 0
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-blue-600/25'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Cobrar</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </button>
            )}
          </div>
        </>
      ) : (
        /* ═══════════════════════════════════════════════════════════════════ */
        /* VISTA 2: MÉTODOS DE PAGO DESPLEGADOS (Al pulsar Cobrar)            */
        /* ═══════════════════════════════════════════════════════════════════ */
        <div className="flex-1 flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-200">
          <div className="p-3 sm:p-4 space-y-3.5">
            {/* Barra superior de retorno */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setPasoVentaMostrador('resumen')}
                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-blue-600" />
                <span>← Volver a productos ({items.length})</span>
              </button>

              <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 font-mono">
                Total: S/ {total.toFixed(2)}
              </span>
            </div>

            {/* Selector de Comprobante & Datos de Cliente */}
            <div className="space-y-2 bg-slate-50/80 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 font-sora">
                  Comprobante:
                </span>
                <div className="flex rounded-lg bg-slate-200/80 dark:bg-slate-800 p-0.5 text-[11px] font-bold font-sora flex-1 max-w-[210px]">
                  {['boleta', 'factura', 'recibo'].map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoComprobante(tipo)}
                      className={`flex-1 py-1 rounded-md capitalize transition-all cursor-pointer ${
                        tipoComprobante === tipo
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={clienteMostrador.nombre}
                  onChange={(e) => setClienteMostrador({ nombre: e.target.value })}
                  placeholder="Nombre o Razón Social..."
                  className="flex-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-sora text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  value={clienteMostrador.num_doc}
                  onChange={(e) => setClienteMostrador({ num_doc: e.target.value })}
                  placeholder="DNI / RUC"
                  className="w-24 px-2 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-center"
                />
              </div>

              {reservasActivas.length > 0 && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                  <span className="text-[10px] text-slate-400">¿Huésped en estancia?:</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const r = reservasActivas.find((res) => String(res.id) === e.target.value);
                      if (r) {
                        setClienteMostrador({
                          nombre: `Hab. ${r.habitacion?.numero || ''} - ${r.huesped?.nombre || ''} ${r.huesped?.apellido || ''}`.trim(),
                          num_doc: r.huesped?.num_documento || ''
                        });
                      }
                      e.target.value = '';
                    }}
                    className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg px-2 py-0.5 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <option value="">⚡ Asignar Huésped (Pago Inmediato)...</option>
                    {reservasActivas.map((r) => (
                      <option key={r.id} value={r.id}>
                        Hab. {r.habitacion?.numero} — {r.huesped?.nombre} {r.huesped?.apellido}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Métodos de Pago */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 font-sora block">
                Seleccione Método de Pago
              </label>

              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'efectivo', label: 'Efectivo', icon: DollarSign },
                  { id: 'yape', label: 'Yape', icon: QrCode },
                  { id: 'plin', label: 'Plin', icon: Smartphone },
                  { id: 'tarjeta', label: 'Tarjeta', icon: CreditCard }
                ].map((p) => {
                  const Icon = p.icon;
                  const activo = tipoPago === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTipoPago(p.id)}
                      className={`py-2 px-1 rounded-xl text-[11px] font-bold font-sora flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        activo
                          ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-sm ring-2 ring-emerald-500/30'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {tipoPago === 'efectivo' ? (
                <div className="space-y-2 pt-1.5 bg-slate-50/70 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">Billetes:</span>
                    {BILLETES_PERUANOS.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setMontoRecibido(String(b))}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold font-mono hover:bg-emerald-100 cursor-pointer active:scale-95 transition-all"
                      >
                        S/{b}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Monto Recibido:</label>
                      <input
                        type="number"
                        value={montoRecibido}
                        onChange={(e) => setMontoRecibido(e.target.value)}
                        placeholder={String(total.toFixed(2))}
                        className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-xl font-mono font-bold text-sm text-slate-800 dark:text-slate-100 ${
                          montoInsuficiente
                            ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/20'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Vuelto a Entregar:</label>
                      <div
                        className={`w-full px-3 py-2 rounded-xl font-mono font-black text-sm flex items-center justify-center ${
                          montoInsuficiente
                            ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'
                        }`}
                      >
                        {montoInsuficiente ? `-S/ ${diferenciaInsuficiente.toFixed(2)}` : `S/ ${vuelto.toFixed(2)}`}
                      </div>
                    </div>
                  </div>

                  {montoInsuficiente && (
                    <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>El dinero no alcanza: Faltan S/ {diferenciaInsuficiente.toFixed(2)} para completar la venta.</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="pt-1">
                  <label className="text-[10px] font-bold text-slate-500 block mb-1">
                    N° de Operación o Aprobación (Opcional):
                  </label>
                  <input
                    type="text"
                    value={numeroOperacion}
                    onChange={(e) => setNumeroOperacion(e.target.value)}
                    placeholder="Ej: 148923 / REF-0091..."
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Botón de Confirmación Definitivo (Paso 2) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 -mx-3.5 -mb-4 sm:-mx-4 sm:-mb-4 p-3 sm:p-3.5 rounded-b-[28px] shrink-0">
            <button
              type="button"
              disabled={procesando || montoInsuficiente}
              onClick={onConfirmarOperacion}
              className={`w-full h-12 rounded-xl font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 font-sora shadow-md transition-all ${
                montoInsuficiente
                  ? 'bg-rose-500/80 text-white cursor-not-allowed shadow-none'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white shadow-emerald-600/25 cursor-pointer'
              }`}
            >
              {procesando ? (
                <span>Procesando venta...</span>
              ) : montoInsuficiente ? (
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>MONTO INSUFICIENTE (FALTA S/ {diferenciaInsuficiente.toFixed(2)})</span>
                </div>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>CONFIRMAR PAGO & EMITIR (S/ {total.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ─── MODAL COMPROBANTE DE VENTA & CARGO ─── */}
      <ModalComprobantePOS
        isOpen={!!resultadoOperacion}
        onClose={onNuevaOperacion}
        data={resultadoOperacion}
        onNuevaVenta={() => {
          setPasoVentaMostrador('resumen');
          if (onNuevaOperacion) onNuevaOperacion();
        }}
      />
    </div>
  );
}
