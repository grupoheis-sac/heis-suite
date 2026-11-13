import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2, Printer, X, MessageCircle, Share2, Copy,
  Check, RotateCcw, Receipt, BedDouble
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketTermico } from '../../utils/impresionTermica';

export default function ModalComprobantePOS({
  isOpen,
  onClose,
  data,
  onNuevaVenta
}) {
  const { settings } = useSettingsStore();

  const [telefonoWhatsapp, setTelefonoWhatsapp] = useState('');
  const [copiadoWhatsapp, setCopiadoWhatsapp] = useState(false);

  if (!isOpen || !data || typeof document === 'undefined') return null;

  const esHabitacion = data.tipo === 'habitacion';
  const nombreHotel = settings?.businessName || 'GRAND HOTEL & SUITES';
  const rucHotel = settings?.businessRuc || '20491823711';
  const direccionHotel = settings?.address || 'Av. Larco 1050, Miraflores, Lima - Perú';
  const telefonoHotel = settings?.phone || '(01) 489-3210 / 998-765-432';

  const numComp = data.factura?.numero || (esHabitacion ? `CARGO-HAB-${data.habitacion_numero || '000'}` : 'TK01-000001');
  const tipoComp = (data.factura?.tipo_comprobante || (esHabitacion ? 'Cargo a Habitación' : 'Boleta')).toUpperCase();
  const nomCliente = data.cliente?.nombre || data.huesped_nombre || (esHabitacion ? `Hab. ${data.habitacion_numero}` : 'CLIENTE GENERAL');
  const docCliente = data.cliente?.num_doc || '';
  const total = Number(data.total || 0);
  const metodoPago = (data.metodo_pago || 'efectivo').toUpperCase();
  const montoRecibido = Number(data.monto_recibido || total);
  const vuelto = Number(data.vuelto || 0);

  const fechaFormateada = new Date(data.factura?.created_at || Date.now()).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Generador de texto para WhatsApp
  const generarTextoWhatsApp = () => {
    let texto = `🏨 *${nombreHotel}*\n`;
    texto += `🧾 *${tipoComp}: ${numComp}*\n`;
    texto += `📅 Fecha: ${fechaFormateada}\n`;
    texto += `👤 Cliente: ${nomCliente}${docCliente ? ` (${docCliente})` : ''}\n`;
    if (!esHabitacion) {
      texto += `💳 Método de Pago: ${metodoPago}\n`;
    } else {
      texto += `🛏️ Habitación: ${data.habitacion_numero || 'Ocupada'}\n`;
    }
    texto += `--------------------------------\n`;
    texto += `🛒 *DETALLE DE CONSUMOS:*\n`;
    (data.items || []).forEach((it) => {
      texto += `• ${it.cantidad}x ${it.nombre} — S/ ${Number(it.subtotal).toFixed(2)}\n`;
    });
    texto += `--------------------------------\n`;
    texto += `💰 *TOTAL: S/ ${total.toFixed(2)}*\n`;
    if (!esHabitacion && metodoPago === 'EFECTIVO' && vuelto > 0) {
      texto += `💵 Recibido: S/ ${montoRecibido.toFixed(2)} | Vuelto: S/ ${vuelto.toFixed(2)}\n`;
    }
    if (esHabitacion) {
      texto += `\nℹ️ _Consumo cargado a la cuenta de la estancia para liquidación en Check-out._\n`;
    }
    texto += `\n✨ *¡Muchas gracias por su preferencia!* ✨`;
    return texto;
  };

  const handleEnviarWhatsApp = () => {
    const texto = generarTextoWhatsApp();
    const numLimpio = telefonoWhatsapp.replace(/\D/g, '');
    let url = '';
    if (numLimpio) {
      const prefijo = numLimpio.length === 9 ? '51' : '';
      url = `https://wa.me/${prefijo}${numLimpio}?text=${encodeURIComponent(texto)}`;
    } else {
      url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopiarPortapapeles = async () => {
    try {
      const texto = generarTextoWhatsApp();
      await navigator.clipboard.writeText(texto);
      setCopiadoWhatsapp(true);
      toast.success('Comprobante copiado al portapapeles');
      setTimeout(() => setCopiadoWhatsapp(false), 2000);
    } catch (_) {
      toast.error('No se pudo copiar el texto');
    }
  };

  const handleImprimir = (formato = '80mm') => {
    const venta = {
      tipo_comprobante: data.factura?.tipo_comprobante || (esHabitacion ? 'Recibo' : 'Boleta'),
      numero: numComp,
      serie: data.factura?.serie_sunat || 'B002',
      subtotal: data.factura?.subtotal || (total / 1.18),
      igv: data.factura?.igv || 0,
      total,
      descuento: data.factura?.descuento || 0,
      monto_recibido: montoRecibido,
      vuelto,
      metodo_pago: data.metodo_pago || 'efectivo',
      items: data.items || [],
      cliente: {
        nombre: nomCliente,
        tipo_documento: data.cliente?.tipo_doc || 'DNI',
        numero_documento: data.cliente?.num_doc || '00000000'
      },
      sunat_qr: data.factura?.qr_data,
      sunat_hash: data.factura?.hash_cpe,
      created_at: data.factura?.created_at || new Date().toISOString()
    };
    imprimirTicketTermico(venta, { formato, settings });
  };

  const handleCerrar = () => {
    if (onNuevaVenta) onNuevaVenta();
    else if (onClose) onClose();
  };

  return createPortal(
    <div
      onClick={handleCerrar}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/35 dark:bg-black/50 backdrop-blur-[3px] animate-in fade-in duration-200 overflow-y-auto"
      style={{
        WebkitBackdropFilter: 'blur(3px)',
        backdropFilter: 'blur(3px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in zoom-in-95 duration-150 font-sora"
      >
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
              esHabitacion
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800'
            }`}>
              {esHabitacion ? <BedDouble className="w-5 h-5" /> : <Receipt className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                {esHabitacion ? 'Consumo de Habitación' : 'Comprobante de Venta'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {numComp} • {fechaFormateada.split(',')[0]}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCerrar}
            className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido desplazable */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 custom-modal-scroll">
          {/* Badge de Confirmación Exitosa */}
          <div className="flex items-center justify-center gap-2 p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{esHabitacion ? '¡Consumo cargado a la estancia exitosamente!' : '¡Venta registrada y comprobante emitido!'}</span>
          </div>

          {/* Tarjeta Visual de Ticket Térmico */}
          <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700 text-xs font-mono space-y-2.5">
            {/* Membrete Hotel */}
            <div className="text-center pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
              <h4 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 font-sora uppercase">
                {nombreHotel}
              </h4>
              <p className="text-[10px] text-slate-500">RUC: {rucHotel}</p>
              <p className="text-[10px] text-slate-400 truncate">{direccionHotel}</p>
            </div>

            {/* Datos de Comprobante & Cliente */}
            <div className="space-y-1 text-[11px] pb-2 border-b border-dashed border-slate-300 dark:border-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Tipo:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{tipoComp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">Número:</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400">{numComp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-sans">{esHabitacion ? 'Habitación:' : 'Cliente:'}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[200px]">
                  {nomCliente}
                </span>
              </div>
              {docCliente && (
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400 font-sans">Documento:</span>
                  <span className="text-slate-600 dark:text-slate-300">{docCliente}</span>
                </div>
              )}
            </div>

            {/* Detalle de Productos */}
            <div className="space-y-1 max-h-36 overflow-y-auto py-1">
              {(data.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between text-[11px]">
                  <span className="truncate max-w-[210px] text-slate-700 dark:text-slate-300">
                    {it.cantidad}x {it.nombre}
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 shrink-0">
                    S/ {Number(it.subtotal).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Desglose Financiero */}
            <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-[11px]">
              <div className="flex justify-between items-center text-sm font-black font-sora pt-1">
                <span className="text-slate-900 dark:text-white">TOTAL:</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-base">
                  S/ {total.toFixed(2)}
                </span>
              </div>

              {!esHabitacion && (
                <>
                  <div className="flex justify-between text-slate-500 text-[10px] pt-1">
                    <span>Método de Pago:</span>
                    <span className="font-bold uppercase text-slate-800 dark:text-slate-200">{metodoPago}</span>
                  </div>
                  {metodoPago === 'EFECTIVO' && (
                    <div className="flex justify-between text-slate-500 text-[10px]">
                      <span>Recibido: S/ {montoRecibido.toFixed(2)}</span>
                      <span className="text-emerald-600 font-bold">Vuelto: S/ {vuelto.toFixed(2)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN WHATSAPP                                               */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/70 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Enviar Comprobante por WhatsApp</span>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                type="tel"
                value={telefonoWhatsapp}
                onChange={(e) => setTelefonoWhatsapp(e.target.value)}
                placeholder="N° Celular (Ej: 998765432)"
                className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl font-mono text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleEnviarWhatsApp}
                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopiarPortapapeles}
              className="w-full py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiadoWhatsapp ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>¡Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar texto del comprobante</span>
                </>
              )}
            </button>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SECCIÓN IMPRESIÓN TÉRMICA                                      */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleImprimir('80mm')}
              className="py-2.5 px-3 bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-blue-400" />
              <span>Ticket 80mm</span>
            </button>

            <button
              type="button"
              onClick={() => handleImprimir('58mm')}
              className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4 text-emerald-500" />
              <span>Ticket 58mm</span>
            </button>
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 shrink-0">
          <button
            type="button"
            onClick={handleCerrar}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-sora shadow-md shadow-blue-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Cerrar y Nueva Venta</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

