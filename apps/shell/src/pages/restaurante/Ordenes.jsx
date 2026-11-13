import React, { useState, useEffect } from 'react';
import { api } from './api';
import {
  Receipt,
  Search,
  Eye,
  Printer,
  Calendar,
  DollarSign,
  Utensils,
  CheckCircle,
  XCircle,
  X,
  QrCode,
  Send,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TicketImpresion } from '@heis/ui';

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);

  // Ticket Thermal Modal
  const [ticketData, setTicketData] = useState(null);
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [emitiendoSunatId, setEmitiendoSunatId] = useState(null);

  const cargarOrdenes = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ordenes?page=${pagina}&limit=15`);
      if (res.success) {
        setOrdenes(res.ordenes);
        setTotalPaginas(res.paginas);
      }
    } catch (err) {
      console.error('Error al cargar ordenes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarOrdenes();
  }, [pagina]);

  const handleAbrirTicket = (ord) => {
    setTicketData({
      empresa: {
        razon_social: 'HEIS SAC',
        ruc: '20601234567',
        direccion: 'Av. El Sol 450 - Lima, Perú',
        telefono: '(01) 456-7890'
      },
      orden: {
        ...ord,
        mesa_numero: ord.mesa?.name || 'Mesa',
        mozo: ord.mozo?.name || 'Personal'
      },
      comprobante: ord.sunat_hash ? {
        tipo_documento: ord.document_type === 'Factura' ? '01' : '03',
        numero_completo: `${ord.serie || 'B001'}-${String(ord.id).padStart(8, '0')}`,
        hash: ord.sunat_hash
      } : null,
      items: ord.detalles || [],
      pago: {
        metodo: ord.payment_method,
        recibido: ord.received_amount || ord.total,
        vuelto: ord.change_amount || 0
      }
    });
    setMostrarTicket(true);
  };

  const handleEmitirSunat = async (ordenId) => {
    setEmitiendoSunatId(ordenId);
    try {
      const res = await api.post(`/ordenes/${ordenId}/emitir-sunat`);
      if (res.success) {
        toast.success('¡Comprobante emitido a SUNAT con éxito!');
        cargarOrdenes();
      } else {
        toast.error(res.message || 'Error al emitir a SUNAT');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error de conexión con SUNAT');
    } finally {
      setEmitiendoSunatId(null);
    }
  };

  const ordenesFiltradas = ordenes.filter((o) => {
    if (!busqueda.trim()) return true;
    const q = busqueda.toLowerCase();
    return (
      o.client_name?.toLowerCase().includes(q) ||
      o.mesa?.name?.toLowerCase().includes(q) ||
      o.id.toString().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
            <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
              <Receipt className="w-6 h-6" />
            </span>
            Historial de Comandas y Facturación SUNAT
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Registro de consumos en salón, comprobantes emitidos y tickets térmicos.
          </p>
        </div>
      </div>

      {/* Buscador */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por N° de orden, mesa o cliente..."
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Tabla de Órdenes */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4 font-extrabold">Orden #</th>
                <th className="py-3.5 px-4 font-extrabold">Mesa</th>
                <th className="py-3.5 px-4 font-extrabold">Fecha y Hora</th>
                <th className="py-3.5 px-4 font-extrabold">Cliente</th>
                <th className="py-3.5 px-4 font-extrabold">Método Pago</th>
                <th className="py-3.5 px-4 font-extrabold">SUNAT</th>
                <th className="py-3.5 px-4 font-extrabold text-right">Total</th>
                <th className="py-3.5 px-4 font-extrabold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    Cargando historial de comandas...
                  </td>
                </tr>
              ) : ordenesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400">
                    No se encontraron órdenes registradas.
                  </td>
                </tr>
              ) : (
                ordenesFiltradas.map((ord) => {
                  const tieneSunat = Boolean(ord.sunat_hash || ord.sunat_estado === 'ACEPTADO');
                  const esFacturaBoleta = ['boleta', 'factura'].includes((ord.document_type || '').toLowerCase());
                  return (
                    <tr
                      key={ord.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                        #{ord.id}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                        {ord.mesa?.name || 'Mesa'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {new Date(ord.created_at).toLocaleString('es-PE')}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700 dark:text-slate-300">
                        {ord.client_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase">
                          {ord.payment_method}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {tieneSunat ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-black text-[10px] border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle className="w-3 h-3" /> CPE Aceptado
                          </span>
                        ) : esFacturaBoleta ? (
                          <button
                            type="button"
                            onClick={() => handleEmitirSunat(ord.id)}
                            disabled={emitiendoSunatId === ord.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 hover:bg-amber-100 font-bold text-[10px] border border-amber-300 cursor-pointer"
                          >
                            {emitiendoSunatId === ord.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3" />
                            )}
                            Emitir SUNAT
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Ticket Nota</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900 dark:text-white">
                        S/ {parseFloat(ord.total).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setOrdenSeleccionada(ord)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-amber-500/20 text-slate-600 dark:text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                            title="Ver resumen"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleAbrirTicket(ord)}
                            className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                            title="Imprimir ticket térmico"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPaginas > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-1.5">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                disabled={pagina === totalPaginas}
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 disabled:opacity-50"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Resumen Rápido */}
      {ordenSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                Orden #{ordenSeleccionada.id}
              </h2>
              <button
                onClick={() => setOrdenSeleccionada(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Mesa:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{ordenSeleccionada.mesa?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{ordenSeleccionada.client_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha:</span>
                <span className="text-slate-600 dark:text-slate-300">{new Date(ordenSeleccionada.created_at).toLocaleString('es-PE')}</span>
              </div>
            </div>

            <div className="border-t border-b border-dashed border-slate-200 dark:border-slate-700 py-3 space-y-1 text-xs">
              {ordenSeleccionada.detalles?.map((det, i) => (
                <div key={i} className="flex justify-between">
                  <span>{det.quantity}x {det.producto?.name}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">S/ {parseFloat(det.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-sm font-black text-slate-900 dark:text-white">
              <span>Total Pagado:</span>
              <span className="text-amber-600 dark:text-amber-400 text-lg">S/ {parseFloat(ordenSeleccionada.total).toFixed(2)}</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleAbrirTicket(ordenSeleccionada)}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/25 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Térmico Modal */}
      {mostrarTicket && (
        <TicketImpresion ticketData={ticketData} onClose={() => setMostrarTicket(false)} />
      )}
    </div>
  );
}
