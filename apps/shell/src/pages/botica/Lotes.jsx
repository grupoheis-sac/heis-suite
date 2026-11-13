import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@heis/core';
import DatePickerPill from './components/DatePickerPill';
import {
  Clock,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Package,
  Calendar,
  Building,
  RefreshCw,
  TrendingDown,
  Edit,
  FileSpreadsheet,
  X,
  Check,
  FileText,
  DollarSign
} from 'lucide-react';

export default function Lotes() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const esCajero = user?.rol === 'Cajero';

  const [data, setData] = useState({
    resumen: { total_vencidos: 0, total_criticos: 0, total_proximos: 0 },
    vencidos: [],
    criticos: [],
    proximos: []
  });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('todos'); // 'todos', 'vencidos', 'criticos', 'proximos'
  const [busqueda, setBusqueda] = useState('');

  // Modal para corrección administrativa de lote y fecha FEFO
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
  const [loteEditar, setLoteEditar] = useState(null);
  const [editarData, setEditarData] = useState({
    numero_lote: '',
    fecha_vencimiento: ''
  });
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);

  const cargarSemaforo = async () => {
    try {
      setLoading(true);
      const res = await api.get('/lotes/semaforo');
      const payload = res?.success !== undefined ? res : (res?.data || {});
      if (payload?.success) {
        setData(payload);
      }
    } catch (err) {
      console.error('Error al cargar semáforo de lotes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSemaforo();
  }, []);

  // Combinar o filtrar lotes
  const obtenerLista = () => {
    const arrVencidos = Array.isArray(data.vencidos) ? data.vencidos : [];
    const arrCriticos = Array.isArray(data.criticos) ? data.criticos : [];
    const arrProximos = Array.isArray(data.proximos) ? data.proximos : [];

    let lista = [];
    if (tab === 'todos') {
      lista = [
        ...arrVencidos.map(l => ({ ...l, estado_semaforo: 'vencido' })),
        ...arrCriticos.map(l => ({ ...l, estado_semaforo: 'critico' })),
        ...arrProximos.map(l => ({ ...l, estado_semaforo: 'proximo' }))
      ];
    } else if (tab === 'vencidos') {
      lista = arrVencidos.map(l => ({ ...l, estado_semaforo: 'vencido' }));
    } else if (tab === 'criticos') {
      lista = arrCriticos.map(l => ({ ...l, estado_semaforo: 'critico' }));
    } else if (tab === 'proximos') {
      lista = arrProximos.map(l => ({ ...l, estado_semaforo: 'proximo' }));
    }

    if (!busqueda.trim()) return lista;

    const q = busqueda.toLowerCase();
    return lista.filter(l =>
      (l.numero_lote && l.numero_lote.toLowerCase().includes(q)) ||
      (l.medicamento?.nombre_comercial && l.medicamento.nombre_comercial.toLowerCase().includes(q)) ||
      (l.medicamento?.laboratorio && l.medicamento.laboratorio.toLowerCase().includes(q))
    );
  };

  const calcularDiasRestantes = (fechaStr) => {
    if (!fechaStr) return 0;
    const partes = String(fechaStr).split('-').map(Number);
    if (partes.length < 3) return 0;
    const venc = new Date(partes[0], partes[1] - 1, partes[2]);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    venc.setHours(0, 0, 0, 0);
    const diffTime = venc.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Canalizar lote observado directamente al Acta de Baja y Cuarentena oficial
  const handleEnviarABaja = (lote) => {
    navigate('/inventario?tab=bajas', {
      state: {
        preloadedLote: {
          id_medicamento: lote.id_medicamento,
          nombre_comercial: lote.medicamento?.nombre_comercial,
          concentracion: lote.medicamento?.concentracion,
          laboratorio: lote.medicamento?.laboratorio || 'N/A',
          unidades_por_caja: lote.medicamento?.unidades_por_caja || 1,
          id_lote: lote.id,
          lote_codigo: lote.numero_lote,
          vencimiento: lote.fecha_vencimiento,
          stock_max_cajas: parseFloat(lote.stock_cajas || 0),
          stock_max_fraccion: parseInt(lote.stock_fraccion || 0),
          cantidad_cajas: parseFloat(lote.stock_cajas || 0) > 0 ? parseFloat(lote.stock_cajas || 1) : 0,
          cantidad_fraccion: parseFloat(lote.stock_cajas || 0) <= 0 ? parseInt(lote.stock_fraccion || 0) : 0,
          costo_unitario: parseFloat(lote.medicamento?.precio_compra || 0)
        }
      }
    });
  };

  const abrirModalEditarLote = (lote) => {
    setLoteEditar(lote);
    setEditarData({
      numero_lote: lote.numero_lote || '',
      fecha_vencimiento: lote.fecha_vencimiento || ''
    });
    setModalEditarAbierto(true);
  };

  const handleEditarSubmit = async (e) => {
    e.preventDefault();
    if (!loteEditar) return;

    if (!editarData.numero_lote || !editarData.numero_lote.trim()) {
      toast.error('El número de lote es obligatorio');
      return;
    }
    if (!editarData.fecha_vencimiento) {
      toast.error('La fecha de vencimiento es obligatoria');
      return;
    }

    try {
      setGuardandoEdicion(true);
      const res = await api.put(`/lotes/${loteEditar.id}`, {
        numero_lote: editarData.numero_lote.trim().toUpperCase(),
        fecha_vencimiento: editarData.fecha_vencimiento
      });

      if (res.success) {
        toast.success('Lote y fecha FEFO actualizados con éxito');
        setModalEditarAbierto(false);
        cargarSemaforo();
      }
    } catch (err) {
      toast.error(err.message || 'Error al actualizar lote');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const exportarReporteFEFO = () => {
    if (!listaLotes || listaLotes.length === 0) {
      toast.error('No hay lotes en el semáforo para exportar');
      return;
    }

    const headers = [
      'Estado FEFO',
      'Medicamento',
      'Concentracion',
      'Presentacion',
      'Laboratorio',
      'Numero Lote',
      'Fecha Vencimiento',
      'Dias Restantes',
      'Stock Cajas',
      'Stock Fracciones'
    ];

    const rows = listaLotes.map(lote => {
      const dias = calcularDiasRestantes(lote.fecha_vencimiento);
      const estado = dias < 0 ? 'VENCIDO' : (dias <= 30 ? 'CRITICO' : 'PROXIMO');
      return [
        `"${estado}"`,
        `"${(lote.medicamento?.nombre_comercial || '').replace(/"/g, '""')}"`,
        `"${(lote.medicamento?.concentracion || '').replace(/"/g, '""')}"`,
        `"${(lote.medicamento?.presentacion || '').replace(/"/g, '""')}"`,
        `"${(lote.medicamento?.laboratorio || 'N/A').replace(/"/g, '""')}"`,
        `"${lote.numero_lote}"`,
        `"${lote.fecha_vencimiento}"`,
        dias,
        lote.stock_cajas || 0,
        lote.stock_fraccion || 0
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_DIGEMID_Control_Lotes_FEFO_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reporte oficial DIGEMID (.csv) descargado');
  };

  const listaLotes = obtenerLista();

  return (
    <div className="space-y-4 max-w-[1700px] w-full mx-auto">
      {/* Botones de Cabecera: Exportar DIGEMID y Actualizar */}
      <div className="flex items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={exportarReporteFEFO}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-emerald-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-emerald-700 text-xs font-bold transition-all border border-slate-200 dark:border-slate-800 shadow-xs active:scale-95 cursor-pointer font-sora"
          title="Descargar libro oficial de control de vencimientos para auditorías DIGEMID"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Exportar DIGEMID</span>
          <span className="sm:hidden">Exportar</span>
        </button>

        <button
          type="button"
          onClick={cargarSemaforo}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200 dark:border-slate-800 shadow-xs active:scale-95 cursor-pointer font-sora"
        >
          <RefreshCw className={`w-4 h-4 text-emerald-600 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* ─── TARJETAS DE INDICADORES / KPIS (DISEÑO Y DIMENSIONES IDÉNTICAS AL DASHBOARD) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
        {/* KPI 1: Ya Vencidos */}
        <div
          onClick={() => setTab(tab === 'vencidos' ? 'todos' : 'vencidos')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            tab === 'vencidos'
              ? 'border border-rose-400 dark:border-rose-500 bg-rose-50/30 dark:bg-rose-950/25 shadow-xs shadow-rose-500/10 -translate-y-0.5'
              : 'border border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
          }`}
          title="Filtrar medicamentos con fecha de vencimiento cumplida"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors font-sora truncate min-w-0">
                Lotes Vencidos
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-rose-500/20 transition-all duration-200">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-sora tracking-tight truncate">
              {data.resumen.total_vencidos}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Inmovilización DIGEMID
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-800/60 flex items-center gap-1 font-sora shrink-0 whitespace-nowrap">
              {tab === 'vencidos' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />}
              {tab === 'vencidos' ? 'Filtrando' : 'Baja técnica'}
            </span>
          </div>
        </div>

        {/* KPI 2: Críticos (< 30 días) */}
        <div
          onClick={() => setTab(tab === 'criticos' ? 'todos' : 'criticos')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            tab === 'criticos'
              ? 'border border-amber-400 dark:border-amber-500 bg-amber-50/30 dark:bg-amber-950/25 shadow-xs shadow-amber-500/10 -translate-y-0.5'
              : 'border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
          }`}
          title="Filtrar lotes críticos que vencen en menos de 30 días"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors font-sora truncate min-w-0">
                Críticos (&lt; 30d)
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/20 transition-all duration-200">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-sora tracking-tight truncate">
              {data.resumen.total_criticos}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Rotación prioritaria FEFO
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60 flex items-center gap-1 font-sora shrink-0 whitespace-nowrap">
              {tab === 'criticos' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
              {tab === 'criticos' ? 'Filtrando' : 'Alerta FEFO'}
            </span>
          </div>
        </div>

        {/* KPI 3: Próximos (31 - 90 días) */}
        <div
          onClick={() => setTab(tab === 'proximos' ? 'todos' : 'proximos')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            tab === 'proximos'
              ? 'border border-yellow-400 dark:border-yellow-500 bg-yellow-50/30 dark:bg-yellow-950/25 shadow-xs shadow-yellow-500/10 -translate-y-0.5'
              : 'border border-slate-200/80 dark:border-slate-800 hover:border-yellow-400 dark:hover:border-yellow-500 shadow-2xs hover:shadow-md hover:shadow-yellow-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
          }`}
          title="Filtrar lotes próximos a vencer entre 31 y 90 días"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-yellow-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-yellow-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-yellow-700 dark:group-hover:text-yellow-400 transition-colors font-sora truncate min-w-0">
                Próximos (31 - 90d)
              </span>
              <div className="w-7 h-7 rounded-lg bg-yellow-50 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-400 border border-yellow-200/60 dark:border-yellow-800/60 flex items-center justify-center shrink-0 group-hover:bg-yellow-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-yellow-500/20 transition-all duration-200">
                <TrendingDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-yellow-700 dark:text-yellow-400 font-sora tracking-tight truncate">
              {data.resumen.total_proximos}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Despacho preventivo
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/60 px-2 py-0.5 rounded-full border border-yellow-200/60 dark:border-yellow-800/60 flex items-center gap-1 font-sora shrink-0 whitespace-nowrap">
              {tab === 'proximos' && <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse shrink-0" />}
              {tab === 'proximos' ? 'Filtrando' : 'Preventivo'}
            </span>
          </div>
        </div>

        {/* KPI 4: Total en Semáforo */}
        <div
          onClick={() => setTab('todos')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            tab === 'todos'
              ? 'border border-[#00B884] dark:border-[#10E599] bg-[#EBFDF6]/40 dark:bg-emerald-950/25 shadow-xs shadow-emerald-500/10 -translate-y-0.5'
              : 'border border-[#D1F4E3] dark:border-slate-800 hover:border-[#00B884] dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-[#00B884]/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
          }`}
          title="Ver todos los lotes bajo control"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00B884]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[#00B884]/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-[#00855E] dark:group-hover:text-[#5EEBB8] transition-colors font-sora truncate min-w-0">
                Monitoreo Total
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00B884] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-[#00B884] group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-[#00B884]/25 transition-all duration-200">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate">
              {data.resumen.total_general !== undefined ? data.resumen.total_general : ((data.resumen.total_vencidos || 0) + (data.resumen.total_criticos || 0) + (data.resumen.total_proximos || 0))}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Lotes bajo control FEFO
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-[#00855E] dark:text-[#5EEBB8] bg-[#EBFDF6] dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-[#A6F6D8] dark:border-emerald-800/60 flex items-center gap-1 font-sora shrink-0 whitespace-nowrap">
              {tab === 'todos' && <span className="w-1.5 h-1.5 rounded-full bg-[#00B884] animate-pulse shrink-0"></span>}
              {tab === 'todos' ? 'Activo' : 'Ver Todos'}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-3.5 rounded-2xl soft-card-shadow border border-slate-100">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'todos', label: 'Todos los Lotes' },
            { id: 'vencidos', label: 'Vencidos 🔴' },
            { id: 'criticos', label: 'Críticos <30d 🟠' },
            { id: 'proximos', label: 'Próximos 30-90d 🟡' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                tab === t.id
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por lote, medicamento o lab..."
            className="w-full bg-slate-50 focus:bg-white border border-slate-200 rounded-full pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
          />
        </div>
      </div>

      {/* Tabla de Lotes */}
      <div className="bg-white rounded-[28px] p-3.5 sm:p-5 soft-card-shadow border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50/70 text-slate-400 border-b border-slate-100 text-[10.5px]">
                <th className="py-3 px-2.5 font-extrabold uppercase text-center w-28 whitespace-nowrap">ESTADO FEFO</th>
                <th className="py-3 px-3 font-extrabold uppercase min-w-[170px]">MEDICAMENTO</th>
                <th className="py-3 px-2 font-extrabold uppercase text-center w-28 whitespace-nowrap">N° LOTE</th>
                <th className="py-3 px-2 font-extrabold uppercase text-center w-28 whitespace-nowrap">F. VENCIMIENTO</th>
                <th className="py-3 px-2 font-extrabold uppercase text-center w-32 whitespace-nowrap">DÍAS RESTANTES</th>
                <th className="py-3 px-2 font-extrabold uppercase text-center w-24 whitespace-nowrap">STOCK CAJAS</th>
                <th className="py-3 px-2 font-extrabold uppercase text-center w-20 whitespace-nowrap">FRACCIONES</th>
                <th className="py-3 px-2.5 font-extrabold uppercase w-28 whitespace-nowrap">LABORATORIO</th>
                {!esCajero && (
                  <th className="py-3 px-2.5 font-extrabold uppercase text-center w-36 whitespace-nowrap">ACCIONES</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={esCajero ? "8" : "9"} className="py-12 text-center text-slate-400 font-medium">
                    Cargando información del semáforo farmacéutico...
                  </td>
                </tr>
              ) : listaLotes.length === 0 ? (
                <tr>
                  <td colSpan={esCajero ? "8" : "9"} className="py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <ShieldCheck className="w-10 h-10 text-emerald-500" />
                      <p className="font-extrabold text-slate-800 text-sm">¡Excelente estado sanitario!</p>
                      <p className="text-xs text-slate-400">No se encontraron lotes para los filtros seleccionados.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                listaLotes.map((lote) => {
                  const dias = calcularDiasRestantes(lote.fecha_vencimiento);
                  const isVencido = dias < 0;
                  const isCritico = dias >= 0 && dias <= 30;

                  return (
                    <tr
                      key={lote.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                        {isVencido ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shrink-0"></span>
                            VENCIDO
                          </span>
                        ) : isCritico ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                            CRÍTICO
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-50 text-yellow-800 border border-yellow-200/80 shadow-2xs">
                            PRÓXIMO
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 min-w-[170px]">
                        <div className="font-extrabold text-slate-800 text-xs">
                          {lote.medicamento?.nombre_comercial || 'Medicamento'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold truncate max-w-[200px]" title={lote.medicamento?.concentracion || ''}>
                          {lote.medicamento?.presentacion ? `${lote.medicamento.presentacion} • ` : ''}
                          {lote.medicamento?.concentracion || ''}
                        </div>
                      </td>
                      <td className="py-2.5 px-2 text-center whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200/80 text-[11px] inline-block">
                          {lote.numero_lote}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-600 font-mono font-bold text-xs whitespace-nowrap">
                        {lote.fecha_vencimiento}
                      </td>
                      <td className="py-2.5 px-2 text-center font-mono font-bold whitespace-nowrap text-xs">
                        {isVencido ? (
                          <span className="text-rose-600 font-extrabold bg-rose-50/70 px-2 py-0.5 rounded-md border border-rose-200/60 inline-block text-[11px]">
                            Venció hace {Math.abs(dias)}d
                          </span>
                        ) : (
                          <span className={`${isCritico ? 'text-amber-700 bg-amber-50/70 border-amber-200/60' : 'text-yellow-800 bg-yellow-50/70 border-yellow-200/60'} font-extrabold px-2 py-0.5 rounded-md border inline-block text-[11px]`}>
                            {dias}d restantes
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-center font-black text-slate-800 font-mono text-xs whitespace-nowrap">
                        {lote.stock_cajas} cjs
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500 font-mono font-semibold text-xs whitespace-nowrap">
                        {lote.stock_fraccion || 0} fcs
                      </td>
                      <td className="py-2.5 px-2.5 text-slate-500 font-medium text-xs max-w-[120px] truncate whitespace-nowrap" title={lote.medicamento?.laboratorio || 'N/A'}>
                        {lote.medicamento?.laboratorio || 'N/A'}
                      </td>
                      {!esCajero && (
                        <td className="py-2.5 px-2.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleEnviarABaja(lote)}
                              className={`px-2.5 py-1.5 rounded-xl border transition-all font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs group whitespace-nowrap active:scale-95 ${
                                isVencido
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200/90 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200/90 dark:bg-amber-950/60 dark:text-amber-300'
                              }`}
                              title="Cargar en el Acta Oficial de Baja y Cuarentena (BPA DIGEMID)"
                            >
                              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                              <span className="text-[11px] font-extrabold whitespace-nowrap">Pasar a Baja</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirModalEditarLote(lote)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-all font-bold text-xs flex items-center gap-1 cursor-pointer shadow-2xs group whitespace-nowrap active:scale-95"
                              title="Corregir N° de lote o fecha FEFO"
                            >
                              <Edit className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                              <span className="text-[11px] font-extrabold whitespace-nowrap">Editar</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* ─── MODAL EDITAR / CORREGIR LOTE & FEFO ─── */}
      {modalEditarAbierto && loteEditar && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEditarAbierto(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Cabecera del modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs shrink-0">
                  <Edit className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight font-sora">
                    Modificar Lote & Fecha FEFO
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold truncate">
                    Corrección de datos de trazabilidad del fabricante
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarAbierto(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <form onSubmit={handleEditarSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5 custom-modal-scroll">
                {/* Resumen Medicamento */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 font-sora">
                    {loteEditar.medicamento?.nombre_comercial}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {loteEditar.medicamento?.presentacion} • {loteEditar.medicamento?.concentracion}
                  </p>
                </div>

                {/* Número de Lote */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    N° de Lote de Fabricante *
                  </label>
                  <input
                    type="text"
                    value={editarData.numero_lote}
                    onChange={(e) => setEditarData({ ...editarData, numero_lote: e.target.value })}
                    placeholder="Ej. LOT-2026A"
                    className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase"
                  />
                </div>

                {/* Fecha Vencimiento con DatePickerPill */}
                <div>
                  <DatePickerPill
                    label="Fecha de Vencimiento FEFO *"
                    value={editarData.fecha_vencimiento}
                    onChange={(val) => setEditarData({ ...editarData, fecha_vencimiento: val })}
                    direction="down"
                    align="left"
                    placeholder="Seleccionar fecha FEFO..."
                  />
                </div>

                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] text-amber-800 dark:text-amber-300">
                  ⚠️ <b>Nota de Auditoría:</b> Esta corrección subsana errores tipográficos en el registro de la guía/factura del proveedor. No altera el stock físico ni los valores del Kardex.
                </div>
              </div>

              {/* Botones de Pie */}
              <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalEditarAbierto(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer font-sora"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoEdicion}
                  className="px-5 py-2.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-black text-xs shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer flex items-center gap-2 font-sora disabled:opacity-50"
                >
                  {guardandoEdicion ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Guardar Corrección</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
