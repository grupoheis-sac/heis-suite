import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  DollarSign,
  QrCode,
  CreditCard,
  Clock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Coins,
  Loader2
} from 'lucide-react';

const METODOS_PAGO = [
  { id: 'Efectivo', label: 'Efectivo', icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400', activeCls: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-500/20' },
  { id: 'Yape', label: 'Yape', icon: QrCode, color: 'text-purple-600 dark:text-purple-400', activeCls: 'bg-purple-50 dark:bg-purple-950/60 border-purple-500 text-purple-800 dark:text-purple-200 ring-2 ring-purple-500/20' },
  { id: 'Plin', label: 'Plin', icon: Smartphone, color: 'text-sky-600 dark:text-sky-400', activeCls: 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-800 dark:text-sky-200 ring-2 ring-sky-500/20' },
  { id: 'Tarjeta', label: 'Tarjeta POS', icon: CreditCard, color: 'text-blue-600 dark:text-blue-400', activeCls: 'bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-800 dark:text-blue-200 ring-2 ring-blue-500/20' },
  { id: 'Credito', label: 'Crédito', icon: Clock, color: 'text-amber-600 dark:text-amber-400', activeCls: 'bg-amber-50 dark:bg-amber-950/60 border-amber-500 text-amber-800 dark:text-amber-200 ring-2 ring-amber-500/20' },
  { id: 'Mixto', label: 'Pago Mixto', icon: Layers, color: 'text-indigo-600 dark:text-indigo-400', activeCls: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-500 text-indigo-800 dark:text-indigo-200 ring-2 ring-indigo-500/20' }
];

const BILLETES_PERUANOS = [10, 20, 50, 100, 200];

export default function POSModalCobro({
  visible,
  onClose,
  onCobrar,
  total = 0,
  tipoComprobante,
  setTipoComprobante,
  tipoPago,
  setTipoPago,
  numeroOperacion,
  setNumeroOperacion,
  montoRecibido,
  setMontoRecibido,
  vuelto = 0,
  creditoDias,
  setCreditoDias,
  procesandoVenta = false,
  clienteNombre = 'Público General'
}) {
  if (!visible) return null;

  // Estados para Pago Mixto
  const [montoEfectivoMixto, setMontoEfectivoMixto] = useState('');
  const [montoDigitalMixto, setMontoDigitalMixto] = useState('');
  const [billeteraDigital, setBilleteraDigital] = useState('Yape'); // 'Yape' | 'Plin' | 'Tarjeta'

  const handleMontoEfectivoMixtoChange = (val) => {
    setMontoEfectivoMixto(val);
    const num = parseFloat(val) || 0;
    const restante = Math.max(0, parseFloat((total - num).toFixed(2)));
    setMontoDigitalMixto(restante > 0 ? restante.toString() : '');
  };

  const numRecibido =
    montoRecibido !== '' && montoRecibido !== null && montoRecibido !== undefined
      ? parseFloat(montoRecibido)
      : total;
  const esEfectivoInsuficiente = tipoPago === 'Efectivo' && !isNaN(numRecibido) && numRecibido < total - 0.009;
  const montoFaltante = esEfectivoInsuficiente ? parseFloat((total - numRecibido).toFixed(2)) : 0;

  const handleConfirmar = () => {
    if (tipoPago === 'Efectivo' && esEfectivoInsuficiente) {
      return;
    }
    if (tipoPago === 'Mixto') {
      const efec = parseFloat(montoEfectivoMixto) || 0;
      const dig = parseFloat(montoDigitalMixto) || 0;
      onCobrar({
        tipoPago: 'Mixto',
        monto_efectivo: efec,
        monto_digital: dig,
        billetera_digital: billeteraDigital,
        montoRecibido: total
      });
    } else {
      onCobrar({
        tipoPago,
        numeroOperacion,
        montoRecibido: numRecibido
      });
    }
  };

  if (!visible) return null;

  const modalJSX = (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150 select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-150 my-auto"
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white">
              Cobro y Emisión de Comprobante
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Cliente: <span className="font-bold text-slate-600 dark:text-slate-300">{clienteNombre}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-modal-scroll">
          {/* Total a Pagar Grande */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-indigo-950/40 dark:to-slate-800 border border-indigo-200/80 dark:border-indigo-800/80 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider block">
                Total a Pagar
              </span>
              <span className="text-3xl font-black text-indigo-900 dark:text-white">
                S/ {Number(total).toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Tipo Comprobante
              </span>
              <div className="inline-flex rounded-xl p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                {['Boleta', 'Factura', 'Ticket'].map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setTipoComprobante(tipo)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      tipoComprobante === tipo
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {tipo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selector de Método de Pago */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              Método de Pago SUNAT / Pasarela
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {METODOS_PAGO.map((m) => {
                const Icon = m.icon;
                const isSelected = tipoPago === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTipoPago(m.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? m.activeCls
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1 ${m.color}`} />
                    <span className="text-[11px] truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones según Método Seleccionado */}
          {tipoPago === 'Efectivo' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-500" /> Monto Recibido (S/)
                </label>
                <button
                  type="button"
                  onClick={() => setMontoRecibido(total.toString())}
                  className="text-[11px] font-extrabold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                >
                  Monto Exacto
                </button>
              </div>

              <input
                type="number"
                step="0.10"
                value={montoRecibido}
                onChange={(e) => setMontoRecibido(e.target.value)}
                placeholder={Number(total).toFixed(2)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-lg font-black text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />

              {/* Billetes rápidos */}
              <div className="flex flex-wrap gap-2 pt-1">
                {BILLETES_PERUANOS.map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setMontoRecibido(b.toString())}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 cursor-pointer transition-all"
                  >
                    S/ {b}
                  </button>
                ))}
              </div>

              {/* Vuelto o Falta */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className={`text-xs font-bold ${esEfectivoInsuficiente ? 'text-rose-600 dark:text-rose-400 font-black' : 'text-slate-500 dark:text-slate-400'}`}>
                  {esEfectivoInsuficiente ? 'Monto Faltante:' : 'Vuelto al Cliente:'}
                </span>
                <span className={`text-xl font-black ${esEfectivoInsuficiente ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {esEfectivoInsuficiente ? `-S/ ${montoFaltante.toFixed(2)}` : `S/ ${Number(vuelto) > 0 ? Number(vuelto).toFixed(2) : '0.00'}`}
                </span>
              </div>

              {esEfectivoInsuficiente && (
                <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs font-bold animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                  <span>El monto recibido (S/ {numRecibido.toFixed(2)}) no cubre el total (S/ {Number(total).toFixed(2)}). Falta cobrar S/ {montoFaltante.toFixed(2)}.</span>
                </div>
              )}
            </div>
          )}

          {(tipoPago === 'Yape' || tipoPago === 'Plin' || tipoPago === 'Tarjeta') && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                N° de Operación / Referencia (Opcional):
              </label>
              <input
                type="text"
                value={numeroOperacion || ''}
                onChange={(e) => setNumeroOperacion(e.target.value)}
                placeholder="Ej. OP-492041 o últimos 4 dígitos"
                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {tipoPago === 'Credito' && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
              <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                Plazo de Crédito (Días):
              </label>
              <input
                type="number"
                value={creditoDias || 30}
                onChange={(e) => setCreditoDias(parseInt(e.target.value) || 0)}
                className="w-full bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none"
              />
              <p className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                Se generará una Cuenta por Cobrar asignada al cliente seleccionado.
              </p>
            </div>
          )}

          {tipoPago === 'Mixto' && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Parte en Efectivo (S/):
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    value={montoEfectivoMixto}
                    onChange={(e) => handleMontoEfectivoMixtoChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Parte Digital ({billeteraDigital}) (S/):
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={billeteraDigital}
                      onChange={(e) => setBilleteraDigital(e.target.value)}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-2 text-xs font-bold"
                    >
                      <option value="Yape">Yape</option>
                      <option value="Plin">Plin</option>
                      <option value="Tarjeta">Tarjeta</option>
                    </select>
                    <input
                      type="number"
                      step="0.10"
                      value={montoDigitalMixto}
                      onChange={(e) => setMontoDigitalMixto(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer con Botones */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={procesandoVenta || esEfectivoInsuficiente}
            onClick={handleConfirmar}
            className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              esEfectivoInsuficiente
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'glow-btn-indigo shadow-indigo-600/30'
            }`}
          >
            {procesandoVenta ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Emitiendo SUNAT...</span>
              </>
            ) : esEfectivoInsuficiente ? (
              <>
                <AlertCircle className="w-4 h-4" />
                <span>Monto Insuficiente (Falta S/ {montoFaltante.toFixed(2)})</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar y Cobrar S/ {Number(total).toFixed(2)}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : modalJSX;
}
