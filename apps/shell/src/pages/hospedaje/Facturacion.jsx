import React, { useState, useEffect, useMemo } from 'react';
import api from './api';
import { Modal } from '@heis/ui';
import {
  Receipt,
  Eye,
  Printer,
  ShieldCheck,
  QrCode,
  RefreshCw,
  Search,
  Calendar,
  X,
  FileText,
  CheckCircle2,
  AlertOctagon,
  FileX,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

const MOTIVOS_NOTA_CREDITO = [
  { codigo: '01', descripcion: 'Anulación de la operación' },
  { codigo: '02', descripcion: 'Anulación por error en el RUC / Documento' },
  { codigo: '03', descripcion: 'Corrección por error en la descripción' },
  { codigo: '04', descripcion: 'Descuento global' },
  { codigo: '06', descripcion: 'Devolución total' },
  { codigo: '07', descripcion: 'Devolución por ítem' },
  { codigo: '10', descripcion: 'Otros conceptos' }
];

export default function Facturacion({ isEmbedded = false }) {
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('todos'); // 'todos', 'hoy', 'mes'
  const [busqueda, setBusqueda] = useState('');

  // Estado para emisión de Nota de Crédito
  const [modalNotaOpen, setModalNotaOpen] = useState(false);
  const [facturaParaNota, setFacturaParaNota] = useState(null);
  const [motivoCodigo, setMotivoCodigo] = useState('01');
  const [motivoTexto, setMotivoTexto] = useState('');
  const [emitirNotaLoading, setEmitirNotaLoading] = useState(false);

  useEffect(() => {
    cargarFacturas();
  }, [filtroTipo]);

  const cargarFacturas = async () => {
    try {
      setLoading(true);
      const url = filtroTipo === 'todos' ? '/facturas' : `/facturas?tipo_comprobante=${filtroTipo}`;
      const res = await api.get(url);
      setFacturas(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAbrirNotaCredito = (factura) => {
    setFacturaParaNota(factura);
    setMotivoCodigo('01');
    setMotivoTexto('Anulación de la operación por cancelación o error');
    setModalNotaOpen(true);
  };

  const handleConfirmarNotaCredito = async (e) => {
    e.preventDefault();
    if (!facturaParaNota) return;

    try {
      setEmitirNotaLoading(true);
      const motivoObj = MOTIVOS_NOTA_CREDITO.find(m => m.codigo === motivoCodigo);
      const descripcionFinal = motivoTexto.trim() || motivoObj?.descripcion || 'Anulación de la operación';

      const res = await api.post(`/facturas/${facturaParaNota.id}/nota-credito`, {
        motivo_codigo: motivoCodigo,
        motivo_descripcion: descripcionFinal
      });

      setModalNotaOpen(false);
      setFacturaParaNota(null);
      await cargarFacturas();

      // Abrir el ticket de la nueva Nota de Crédito emitida
      if (res.data?.data) {
        setFacturaSeleccionada(res.data.data);
        setModalOpen(true);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al emitir la Nota de Crédito.');
    } finally {
      setEmitirNotaLoading(false);
    }
  };

  const facturasFiltradas = useMemo(() => {
    const hoyStr = new Date().toISOString().split('T')[0];
    const primerDiaMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

    return facturas.filter((f) => {
      // Filtro por fecha
      if (filtroFecha === 'hoy' && f.fecha_emision !== hoyStr) {
        return false;
      }
      if (filtroFecha === 'mes' && f.fecha_emision < primerDiaMes) {
        return false;
      }

      // Filtro por búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const num = (f.numero || '').toLowerCase();
        const nom = `${f.huesped?.nombre || ''} ${f.huesped?.apellido || ''}`.toLowerCase();
        const doc = (f.huesped?.num_documento || '').toLowerCase();
        const ruc = (f.ruc_cliente || '').toLowerCase();
        const rz = (f.razon_social || '').toLowerCase();
        const hab = String(f.reserva?.habitacion?.numero || '').toLowerCase();

        return num.includes(q) || nom.includes(q) || doc.includes(q) || ruc.includes(q) || rz.includes(q) || hab.includes(q);
      }

      return true;
    });
  }, [facturas, filtroFecha, busqueda]);

  // KPIs
  const metricas = useMemo(() => {
    const totalRecaudado = facturasFiltradas.reduce((acc, f) => acc + (f.estado === 'pagada' ? Number(f.total || 0) : 0), 0);
    const boletasCount = facturasFiltradas.filter(f => f.tipo_comprobante === 'boleta').length;
    const facturasCount = facturasFiltradas.filter(f => f.tipo_comprobante === 'factura').length;
    const notasCount = facturasFiltradas.filter(f => f.tipo_comprobante === 'nota_credito').length;
    const anuladasCount = facturasFiltradas.filter(f => f.estado === 'anulada').length;
    return {
      totalRecaudado,
      totalCount: facturasFiltradas.length,
      boletasCount,
      facturasCount,
      notasCount,
      anuladasCount
    };
  }, [facturasFiltradas]);

  const handleVerComprobante = async (id) => {
    try {
      const res = await api.get(`/facturas/${id}`);
      setFacturaSeleccionada(res.data.data || res.data);
      setModalOpen(true);
    } catch (err) {
      alert('Error al obtener datos del comprobante.');
    }
  };

  return (
    <div className="space-y-5">
      {/* ─── ENCABEZADO CÁPSULA FLOTANTE ULTRA-SLIM ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 dark:backdrop-blur-xl border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft dark:shadow-[0_16px_36px_-6px_rgba(0,0,0,0.8),inset_0_1px_1px_0_rgba(255,255,255,0.1)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {!isEmbedded ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 shadow-xs">
              <Receipt className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-white font-sora tracking-tight">
                  Comprobantes Electrónicos & Facturación SUNAT
                </h2>
                <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  UBL 2.1 • SUNAT
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Boletas de Venta, Facturas con RUC y Notas de Hospedaje con validez tributaria
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Emisión UBL 2.1 • Validez SUNAT
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
              Boletas, facturas y notas de crédito emitidas en recepción y check-out
            </span>
          </div>
        )}

        {/* Filter buttons & Refresh */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-2xs text-xs font-bold font-sora">
            <button
              type="button"
              onClick={() => setFiltroTipo('todos')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs ${
                filtroTipo === 'todos'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('boleta')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs ${
                filtroTipo === 'boleta'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Boletas (B001)
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('factura')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs ${
                filtroTipo === 'factura'
                  ? 'bg-blue-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Facturas (F001)
            </button>
            <button
              type="button"
              onClick={() => setFiltroTipo('nota_credito')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer text-xs ${
                filtroTipo === 'nota_credito'
                  ? 'bg-rose-600 text-white shadow-xs font-black'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Notas de Crédito (NC)
            </button>
          </div>

          <button
            type="button"
            onClick={cargarFacturas}
            disabled={loading}
            title="Refrescar lista de comprobantes"
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 transition-all flex items-center gap-1.5 text-xs font-semibold shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-500' : ''}`} />
            <span className="hidden sm:inline">Refrescar</span>
          </button>
        </div>
      </div>

      {/* ─── 4 TARJETAS KPI RESUMEN DE FACTURACIÓN ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora block mb-1">
            Total Emitido (S/)
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
            S/ {metricas.totalRecaudado.toFixed(2)}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora block mb-1">
            Comprobantes Válidos
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-slate-800 dark:text-white">
            {metricas.totalCount}
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora block mb-1">
            Boletas & Facturas
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <span>{metricas.boletasCount} B</span>
            <span className="text-slate-300">•</span>
            <span className="text-indigo-600 dark:text-indigo-400">{metricas.facturasCount} F</span>
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora block mb-1">
            Notas Crédito & Anulaciones
          </span>
          <div className="text-base sm:text-lg font-black font-mono text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
            <span>{metricas.notasCount} NC</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-500">{metricas.anuladasCount} anuladas</span>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE BÚSQUEDA Y FILTRO POR FECHA (QUICK WIN H) ─── */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white dark:bg-[#0d1527]/90 border border-slate-200/90 dark:border-white/[0.08] shadow-card-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por N° B001/F001, cliente, DNI, RUC o habitación..."
            className="w-full pl-10 pr-9 py-2 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/90 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Chips de filtro por fecha */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sora mr-1">
            Período:
          </span>
          {[
            { id: 'todos', label: 'Todo el Historial' },
            { id: 'hoy', label: 'Emitidas Hoy' },
            { id: 'mes', label: 'Este Mes' }
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setFiltroFecha(t.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filtroFecha === t.id
                  ? 'bg-blue-600 text-white shadow-2xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[28px] overflow-hidden soft-card-shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200/80 dark:border-slate-800 font-sora">
              <tr>
                <th className="px-6 py-4">N° Comprobante</th>
                <th className="px-6 py-4">Huésped / Razón Social</th>
                <th className="px-6 py-4">Habitación</th>
                <th className="px-6 py-4">Fecha Emisión</th>
                <th className="px-6 py-4">Estado SUNAT</th>
                <th className="px-6 py-4 text-right">Total Soles</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    Cargando historial de facturas...
                  </td>
                </tr>
              ) : facturasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                    No se han emitido comprobantes en este rango.
                  </td>
                </tr>
              ) : (
                facturasFiltradas.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-extrabold text-slate-800 dark:text-white text-xs bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/80 dark:border-slate-700">
                          {f.numero}
                        </span>
                        {f.tipo_comprobante === 'nota_credito' && (
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            NC
                          </span>
                        )}
                      </div>
                      {f.doc_afectado_numero && (
                        <p className="text-[10px] text-slate-400 font-mono mt-1">
                          Ref: {f.doc_afectado_numero}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 dark:text-white text-xs font-sora">
                        {f.razon_social || `${f.huesped?.nombre || ''} ${f.huesped?.apellido || ''}`}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {f.ruc_cliente ? `RUC: ${f.ruc_cliente}` : `${f.huesped?.tipo_documento || 'DOC'}: ${f.huesped?.num_documento || '-'}`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold">
                        Hab. {f.reserva?.habitacion?.numero || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {f.fecha_emision}
                    </td>
                    <td className="px-6 py-4">
                      {f.estado === 'anulada' ? (
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                          title={f.mensaje_sunat || 'Comprobante dado de baja / anulado'}
                        >
                          <AlertOctagon className="w-3.5 h-3.5 text-rose-500" />
                          <span>Anulada</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          {f.estado_sunat || 'Aceptado'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                      S/ {Number(f.total).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleVerComprobante(f.id)}
                          data-tooltip="Ver representación gráfica del ticket impreso"
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-emerald-700 dark:text-slate-300 dark:hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-200/80 dark:border-slate-700 cursor-pointer shadow-xs active:scale-95"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>Ticket</span>
                        </button>
                        {f.estado !== 'anulada' && f.tipo_comprobante !== 'nota_credito' && (
                          <button
                            type="button"
                            onClick={() => handleAbrirNotaCredito(f)}
                            title="Emitir Nota de Crédito SUNAT para este comprobante"
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white dark:bg-rose-950/40 dark:hover:bg-rose-600 dark:text-rose-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-rose-200 dark:border-rose-800/70 cursor-pointer shadow-xs active:scale-95"
                          >
                            <FileX className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Nota Crédito</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket / Printable Invoice Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={facturaSeleccionada?.tipo_comprobante === 'nota_credito' ? 'Nota de Crédito Electrónica — SUNAT' : 'Comprobante Electrónico — SUNAT'}
        subtitle="Representación impresa oficial con firma digital y código QR"
        icon={<Receipt className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        maxWidth="max-w-md"
      >
        {facturaSeleccionada && (
          <div className="space-y-4 text-slate-900 bg-white p-6 rounded-2xl font-mono text-xs shadow-lg border border-slate-200">
            {/* Header Hotel Info */}
            <div className="text-center border-b pb-3 border-slate-200 space-y-1">
              <h3 className="font-extrabold text-sm uppercase tracking-wider font-sora">
                HOTEL & SUITES
              </h3>
              <p className="text-[11px] text-slate-600">RUC: 20491823711</p>
              <p className="text-[11px] text-slate-600">Av. Principal 1050, Lima</p>
              <p className="text-[11px] text-slate-600">Tel: +51 (01) 445-8900</p>
            </div>

            {/* Document Details */}
            <div className="border-b pb-2 border-slate-200 text-center font-bold text-xs">
              <p className="uppercase">
                {facturaSeleccionada.tipo_comprobante === 'nota_credito'
                  ? 'NOTA DE CRÉDITO ELECTRÓNICA'
                  : facturaSeleccionada.tipo_comprobante === 'factura'
                  ? 'FACTURA ELECTRÓNICA'
                  : 'BOLETA DE VENTA ELECTRÓNICA'}
              </p>
              <p className="text-sm font-black text-emerald-700">{facturaSeleccionada.numero}</p>
              {facturaSeleccionada.tipo_comprobante === 'nota_credito' && (
                <div className="mt-1 pt-1 border-t border-slate-200 text-[10.5px] text-rose-700 font-semibold">
                  <p>DOC. AFECTADO: {facturaSeleccionada.doc_afectado_numero || '-'}</p>
                  <p>MOTIVO: {facturaSeleccionada.motivo_nota || 'Anulación de la operación'}</p>
                </div>
              )}
            </div>

            {/* Guest details */}
            <div className="border-b pb-2 border-slate-200 text-[11px] space-y-1">
              <p><strong>Fecha Emisión:</strong> {facturaSeleccionada.fecha_emision}</p>
              <p><strong>Cliente:</strong> {facturaSeleccionada.razon_social || `${facturaSeleccionada.huesped?.nombre || ''} ${facturaSeleccionada.huesped?.apellido || ''}`}</p>
              <p><strong>Documento:</strong> {facturaSeleccionada.ruc_cliente || facturaSeleccionada.huesped?.num_documento || '-'}</p>
              <p><strong>Habitación:</strong> {facturaSeleccionada.reserva?.habitacion?.numero || '-'}</p>
            </div>

            {/* Items */}
            <div className="border-b pb-2 border-slate-200 space-y-1.5 text-[11px]">
              <div className="flex justify-between font-bold border-b pb-1">
                <span>Descripción</span>
                <span>Total</span>
              </div>
              <div className="flex justify-between">
                <span>
                  {facturaSeleccionada.tipo_comprobante === 'nota_credito'
                    ? `Anulación de servicio ref. ${facturaSeleccionada.doc_afectado_numero || 'comprobante'}`
                    : `Alojamiento (${facturaSeleccionada.reserva?.num_noches || 1} noches)`}
                </span>
                <span>S/ {Number(facturaSeleccionada.subtotal).toFixed(2)}</span>
              </div>
              {facturaSeleccionada.cargos?.map((c) => (
                <div key={c.id} className="flex justify-between text-slate-700">
                  <span>{c.concepto} (×{c.cantidad})</span>
                  <span>S/ {Number(c.subtotal).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-1 text-right text-xs pt-1">
              {(facturaSeleccionada.tipo_comprobante === 'factura' || (facturaSeleccionada.serie_sunat && facturaSeleccionada.serie_sunat.startsWith('F'))) && (
                <>
                  <p>OP. GRAVADA: S/ {(facturaSeleccionada.total / 1.18).toFixed(2)}</p>
                  <p>IGV (18%): S/ {(facturaSeleccionada.total - (facturaSeleccionada.total / 1.18)).toFixed(2)}</p>
                </>
              )}
              <p className="text-sm font-black pt-1 border-t border-slate-300 text-slate-900">
                TOTAL: S/ {Number(facturaSeleccionada.total).toFixed(2)}
              </p>
            </div>

            {/* SUNAT & QR Stamp */}
            <div className="text-center pt-3 border-t border-dashed border-slate-300 space-y-2">
              <div className="w-20 h-20 bg-slate-100 border border-slate-300 mx-auto flex items-center justify-center rounded-xl">
                <QrCode className="w-16 h-16 text-slate-800" />
              </div>
              <p className="text-[10px] text-slate-500">
                Representación impresa del Comprobante de Pago Electrónico.<br />
                Autorizado mediante resolución SUNAT.
              </p>
              <p className="text-[9px] text-slate-400 font-mono truncate">
                Hash: {facturaSeleccionada.hash_cpe || 'c3VuYXQtdGVzdC1oYXNoLWNoZWNrb3V0LTIwMjY='}
              </p>
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="glow-btn-emerald w-full py-2.5 text-white rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── MODAL EMITIR NOTA DE CRÉDITO SUNAT ─── */}
      <Modal
        isOpen={modalNotaOpen}
        onClose={() => {
          if (!emitirNotaLoading) {
            setModalNotaOpen(false);
            setFacturaParaNota(null);
          }
        }}
        title="Emitir Nota de Crédito Electrónica"
        subtitle="Anulación oficial o corrección electrónica conforme a normativa SUNAT"
        icon={<FileX className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
        maxWidth="max-w-lg"
      >
        {facturaParaNota && (
          <form onSubmit={handleConfirmarNotaCredito} className="space-y-4">
            {/* Resumen del documento que se anula */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black uppercase text-rose-800 dark:text-rose-300 font-sora">
                  Documento Afectado
                </span>
                <span className="font-mono font-extrabold text-rose-700 dark:text-rose-300 text-sm">
                  {facturaParaNota.numero}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1 border-t border-rose-200/60 dark:border-rose-900/40">
                <div>
                  <span className="text-[10px] text-slate-400 block">Titular:</span>
                  <span className="font-bold truncate block">
                    {facturaParaNota.razon_social || `${facturaParaNota.huesped?.nombre || ''} ${facturaParaNota.huesped?.apellido || ''}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total a anular:</span>
                  <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                    S/ {Number(facturaParaNota.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Selector de motivo SUNAT (Catálogo 09) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 font-sora">
                Motivo de Nota de Crédito (Catálogo 09 SUNAT) *
              </label>
              <select
                value={motivoCodigo}
                onChange={(e) => setMotivoCodigo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              >
                {MOTIVOS_NOTA_CREDITO.map((m) => (
                  <option key={m.codigo} value={m.codigo}>
                    {m.codigo} — {m.descripcion}
                  </option>
                ))}
              </select>
            </div>

            {/* Detalle o sustento del motivo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 font-sora">
                Sustento / Explicación del Motivo *
              </label>
              <textarea
                rows={3}
                required
                value={motivoTexto}
                onChange={(e) => setMotivoTexto(e.target.value)}
                placeholder="Especifique el motivo por el cual se emite esta Nota de Crédito..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 resize-none"
              />
            </div>

            {/* Advertencia SUNAT */}
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                Al emitir esta Nota de Crédito se generará la serie <strong>{facturaParaNota.tipo_comprobante === 'factura' ? 'FC01' : 'BC01'}</strong> y el comprobante original <strong>{facturaParaNota.numero}</strong> quedará marcado automáticamente como <strong>ANULADO</strong>.
              </p>
            </div>

            {/* Acciones */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={emitirNotaLoading}
                onClick={() => {
                  setModalNotaOpen(false);
                  setFacturaParaNota(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={emitirNotaLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold font-sora transition flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 disabled:opacity-50"
              >
                {emitirNotaLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Firmando en SUNAT...</span>
                  </>
                ) : (
                  <>
                    <FileX className="w-3.5 h-3.5" />
                    <span>Emitir Nota de Crédito</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
