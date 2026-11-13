import React from 'react';
import { Printer, X, CheckCircle, QrCode } from 'lucide-react';

export default function TicketImpresion({ ticketData, onClose }) {
  if (!ticketData) return null;

  const {
    empresa = {
      razon_social: 'HEIS SAC',
      ruc: '20601234567',
      direccion: 'Av. El Sol 450 - Lima, Perú',
      telefono: '(01) 456-7890'
    },
    orden = {},
    comprobante = null,
    items = [],
    pago = {}
  } = ticketData;

  const handlePrint = () => {
    window.print();
  };

  const fechaFormateada = orden.fecha || orden.createdAt
    ? new Date(orden.fecha || orden.createdAt).toLocaleString('es-PE')
    : new Date().toLocaleString('es-PE');

  const tipoDocTexto = comprobante?.tipo_documento === '01'
    ? 'FACTURA ELECTRÓNICA'
    : comprobante?.tipo_documento === '03'
    ? 'BOLETA ELECTRÓNICA'
    : 'TICKET DE COMANDA / PRE-CUENTA';

  const numeroDoc = comprobante?.numero_completo || orden.numero || `ORD-${orden.id || '001'}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Botón Imprimir en pantalla */}
        <div className="flex gap-2 mb-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-4 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir Ticket (80mm / 58mm)
          </button>
        </div>

        {/* ÁREA DE TICKET TÉRMICO */}
        <div id="thermal-ticket" className="font-mono text-xs text-slate-800 bg-white p-4 border-t border-b border-dashed border-slate-300 space-y-3">
          {/* Header Empresa */}
          <div className="text-center space-y-1">
            <h2 className="font-extrabold text-sm uppercase text-slate-900 leading-tight">
              {empresa?.razon_social || 'HEIS SAC'}
            </h2>
            <p className="text-[11px] text-slate-600">RUC: {empresa?.ruc || '20609988771'}</p>
            <p className="text-[10px] text-slate-500">{empresa?.direccion || 'Av. Principal 450 - Lima'}</p>
            {empresa?.telefono && (
              <p className="text-[10px] text-slate-500">Tel: {empresa?.telefono}</p>
            )}
          </div>

          <div className="border-b border-dashed border-slate-300 my-2"></div>

          {/* Datos del Comprobante y Salón */}
          <div className="text-[11px] space-y-0.5">
            <div className="flex justify-between font-bold">
              <span>{tipoDocTexto}</span>
              <span>{numeroDoc}</span>
            </div>
            <div className="flex justify-between text-slate-600 text-[10px]">
              <span>Fecha: {fechaFormateada}</span>
              <span>Mesa: {orden.mesa_numero || orden.mesa || 'Barra'}</span>
            </div>
            {orden.mozo && (
              <div className="text-[10px] text-slate-600">
                <span>Mozo: {orden.mozo}</span>
              </div>
            )}
            {orden.cliente && (
              <div className="text-[10px] text-slate-700 border-t border-dotted border-slate-300 pt-1 mt-1">
                <span className="font-bold">Cliente: </span>
                <span>{orden.cliente.nombre || orden.cliente.razon_social || 'Público General'}</span>
                {orden.cliente.documento && (
                  <div>Doc: {orden.cliente.documento}</div>
                )}
              </div>
            )}
          </div>

          <div className="border-b border-dashed border-slate-300 my-2"></div>

          {/* Detalle de Platos y Bebidas */}
          <div>
            <div className="flex justify-between font-bold text-[10px] border-b border-slate-300 pb-1 mb-1">
              <span className="w-8">CANT</span>
              <span className="flex-1">DESCRIPCIÓN</span>
              <span className="w-12 text-right">P.U</span>
              <span className="w-12 text-right">TOTAL</span>
            </div>
            <div className="space-y-1">
              {(items.length > 0 ? items : (orden.detalles || orden.items || [])).map((item, idx) => {
                const cant = item.cantidad || 1;
                const pu = parseFloat(item.precio || item.precio_unitario || 0);
                const sub = cant * pu;
                const nombre = item.nombre || item.producto_nombre || item.plato_nombre || `Item #${idx + 1}`;
                return (
                  <div key={idx} className="flex justify-between text-[11px] leading-tight">
                    <span className="w-8">{cant}</span>
                    <span className="flex-1 truncate pr-1">{nombre}</span>
                    <span className="w-12 text-right text-slate-600">S/ {pu.toFixed(2)}</span>
                    <span className="w-12 text-right font-bold">S/ {sub.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 my-2"></div>

          {/* Totales */}
          <div className="text-[11px] space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Op. Gravada:</span>
              <span>S/ {(parseFloat(orden.total || 0) / 1.18).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>I.G.V. (18%):</span>
              <span>S/ {(parseFloat(orden.total || 0) - (parseFloat(orden.total || 0) / 1.18)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 border-t border-slate-300 pt-1">
              <span>TOTAL A PAGAR:</span>
              <span>S/ {parseFloat(orden.total || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-b border-dashed border-slate-300 my-2"></div>

          {/* Forma de Pago y Vuelto */}
          <div className="text-[10px] space-y-0.5 text-slate-600">
            <div className="flex justify-between">
              <span>Método de Pago:</span>
              <span className="font-bold uppercase">{pago.metodo || orden.metodo_pago || 'EFECTIVO'}</span>
            </div>
            {pago.recibido && (
              <div className="flex justify-between">
                <span>Monto Recibido:</span>
                <span>S/ {parseFloat(pago.recibido).toFixed(2)}</span>
              </div>
            )}
            {pago.vuelto !== undefined && (
              <div className="flex justify-between font-bold text-slate-800">
                <span>Vuelto:</span>
                <span>S/ {parseFloat(pago.vuelto || 0).toFixed(2)}</span>
              </div>
            )}
            {pago.numeroOperacion && (
              <div className="flex justify-between">
                <span>N° Operación:</span>
                <span className="font-mono">{pago.numeroOperacion}</span>
              </div>
            )}
          </div>

          {/* Sección SUNAT QR y Hash si es CPE */}
          {comprobante && (
            <div className="text-center pt-2 border-t border-dashed border-slate-300 space-y-2">
              <div className="flex justify-center my-1">
                <div className="p-2 border border-slate-300 rounded bg-white inline-block">
                  <QrCode className="w-20 h-20 text-slate-800 mx-auto" />
                </div>
              </div>
              {comprobante.hash && (
                <p className="text-[9px] text-slate-500 font-mono break-all">
                  Hash: {comprobante.hash}
                </p>
              )}
              <p className="text-[9px] text-slate-500">
                Representación impresa del Comprobante de Pago Electrónico. Consulte en www.sunat.gob.pe
              </p>
            </div>
          )}

          {/* Mensaje de Despedida */}
          <div className="text-center pt-2 text-[10px] text-slate-500 italic space-y-0.5">
            <p>¡Muchas gracias por su preferencia!</p>
            <p>HEIS SAC &bull; Comprobante de Venta</p>
          </div>
        </div>

        {/* Botón Cerrar en Pantalla */}
        <div className="mt-4 print:hidden">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
