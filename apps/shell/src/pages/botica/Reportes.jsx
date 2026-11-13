import React, { useState, useEffect } from 'react';
import api from './api';
import {
  FileText,
  TrendingUp,
  Package,
  ClipboardList,
  Wallet,
  Download,
  Calendar,
  Filter,
  Search,
  DollarSign,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Receipt,
  User,
  ChevronDown,
  ArrowDownLeft,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useSettingsStore } from '@heis/core';
import { imprimirTicketCierreCaja } from './utils/impresionTermica';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Reportes() {
  const settings = useSettingsStore();
  const [tabActiva, setTabActiva] = useState('ventas'); // 'ventas' | 'inventario' | 'kardex' | 'caja'
  const [loading, setLoading] = useState(false);

  const handleImprimirTicketCaja = async (idCaja) => {
    try {
      const toastId = toast.loading('Cargando ticket de cierre...');
      const res = await api.get(`/caja/${idCaja}/resumen`);
      toast.dismiss(toastId);
      const cajaInfo = res?.caja || res?.data?.caja;
      if (cajaInfo) {
        imprimirTicketCierreCaja(cajaInfo, { formato: '80mm', settings, autoPrint: true });
        toast.success('Ticket enviado a la impresora térmica', { icon: '🖨️' });
      } else {
        toast.error('No se pudo obtener el detalle de la caja');
      }
    } catch (e) {
      toast.error('Error al generar ticket de cierre');
    }
  };

  // Filtros Generales
  const [rangoRapido, setRangoRapido] = useState('mes'); // 'hoy' | '7d' | '30d' | 'mes' | 'custom'
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Datos Reporte Ventas
  const [reporteVentas, setReporteVentas] = useState(null);
  const [filtroPago, setFiltroPago] = useState('');
  const [filtroComprobante, setFiltroComprobante] = useState('');

  // Datos Reporte Inventario
  const [reporteInventario, setReporteInventario] = useState(null);
  const [busquedaMed, setBusquedaMed] = useState('');

  // Datos Reporte Kardex
  const [reporteKardex, setReporteKardex] = useState([]);
  const [filtroTipoKardex, setFiltroTipoKardex] = useState('');

  // Datos Reporte Caja
  const [reporteCaja, setReporteCaja] = useState([]);
  const [filtroEstadoCaja, setFiltroEstadoCaja] = useState('');

  // Configurar fechas iniciales según el rango rápido
  useEffect(() => {
    const hoy = new Date();
    const hoyStr = hoy.toISOString().split('T')[0];

    if (rangoRapido === 'hoy') {
      setFechaInicio(hoyStr);
      setFechaFin(hoyStr);
    } else if (rangoRapido === '7d') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      setFechaInicio(d7.toISOString().split('T')[0]);
      setFechaFin(hoyStr);
    } else if (rangoRapido === '30d') {
      const d30 = new Date();
      d30.setDate(d30.getDate() - 30);
      setFechaInicio(d30.toISOString().split('T')[0]);
      setFechaFin(hoyStr);
    } else if (rangoRapido === 'mes') {
      const primerDia = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      setFechaInicio(primerDia.toISOString().split('T')[0]);
      setFechaFin(hoyStr);
    }
  }, [rangoRapido]);

  // Cargar datos según pestaña activa
  useEffect(() => {
    if (tabActiva === 'ventas') cargarReporteVentas();
    else if (tabActiva === 'inventario') cargarReporteInventario();
    else if (tabActiva === 'kardex') cargarReporteKardex();
    else if (tabActiva === 'caja') cargarReporteCaja();
  }, [tabActiva, fechaInicio, fechaFin, filtroPago, filtroComprobante, filtroTipoKardex]);

  const cargarReporteVentas = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reportes/ventas', {
        params: {
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined,
          tipo_pago: filtroPago || undefined,
          tipo_comprobante: filtroComprobante || undefined
        }
      });
      if (res.data?.success) {
        setReporteVentas(res.data);
      }
    } catch (e) {
      toast.error('Error al cargar reporte de ventas');
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteInventario = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reportes/inventario');
      if (res.data?.success) {
        setReporteInventario(res.data);
      }
    } catch (e) {
      toast.error('Error al cargar inventario valorizado');
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteKardex = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reportes/kardex', {
        params: {
          tipo: filtroTipoKardex || undefined,
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined,
          limit: 100
        }
      });
      if (res.data?.success) {
        setReporteKardex(res.data.movimientos || []);
      }
    } catch (e) {
      toast.error('Error al consultar Kardex DIGEMID');
    } finally {
      setLoading(false);
    }
  };

  const cargarReporteCaja = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reportes/caja', {
        params: {
          fecha_inicio: fechaInicio || undefined,
          fecha_fin: fechaFin || undefined
        }
      });
      if (res.data?.success) {
        setReporteCaja(res.data.cajas || []);
      }
    } catch (e) {
      toast.error('Error al cargar arqueos de caja');
    } finally {
      setLoading(false);
    }
  };

  const descargarExcel = (modulo) => {
    const params = new URLSearchParams({
      modulo,
      fecha_inicio: fechaInicio || '',
      fecha_fin: fechaFin || ''
    });

    const url = `/api/reportes/exportar-excel?${params.toString()}`;
    window.open(url, '_blank');
    toast.success(`Generando archivo Excel de ${modulo.toUpperCase()}...`);
  };

  // Preparar datos para el gráfico de ventas
  const chartDataVentas = {
    labels: Object.keys(reporteVentas?.serie_diaria || {}),
    datasets: [
      {
        label: 'Ventas Diarias (S/)',
        data: Object.values(reporteVentas?.serie_diaria || {}),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        tension: 0.35,
        borderWidth: 2.5,
        pointBackgroundColor: '#0d9488',
        pointRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => ` Total: S/ ${parseFloat(context.raw || 0).toFixed(2)}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `S/ ${value}`
        },
        grid: { color: 'rgba(226, 232, 240, 0.6)' }
      },
      x: {
        grid: { display: false }
      }
    }
  };

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto">
      {/* ─── 1. HEADER & CONTROLES DE FECHA ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-xs">
              <FileText className="w-5 h-5" />
            </span>
            Reportes Clínicos & Análisis Financiero
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Métricas de facturación, inventario valorizado y libros de Kardex para DIGEMID
          </p>
        </div>

        {/* Filtros de Rango Temporal */}
        <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-100 soft-card-shadow">
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/70 text-xs font-bold text-slate-600">
            {[
              { id: 'hoy', label: 'Hoy' },
              { id: '7d', label: '7 Días' },
              { id: '30d', label: '30 Días' },
              { id: 'mes', label: 'Este Mes' }
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRangoRapido(r.id)}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  rangoRapido === r.id
                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                    : 'hover:text-slate-900 text-slate-500'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => {
                setRangoRapido('custom');
                setFechaInicio(e.target.value);
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
            />
            <span>a</span>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => {
                setRangoRapido('custom');
                setFechaFin(e.target.value);
              }}
              className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            onClick={() => descargarExcel(tabActiva)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Excel (.xlsx)</span>
          </button>
        </div>
      </div>

      {/* ─── 2. PESTAÑAS PRINCIPALES (TABS) ─── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-1 overflow-x-auto">
        {[
          { id: 'ventas', label: 'Ventas y Facturación', icon: TrendingUp },
          { id: 'inventario', label: 'Inventario Valorizado', icon: Package },
          { id: 'kardex', label: 'Kardex Clínico (DIGEMID)', icon: ClipboardList },
          { id: 'caja', label: 'Arqueos y Cierres de Caja', icon: Wallet }
        ].map((tab) => {
          const Icon = tab.icon;
          const esActiva = tabActiva === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setTabActiva(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer whitespace-nowrap ${
                esActiva
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/20'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── 3. CONTENIDO: TAB 1 (VENTAS) ─── */}
      {tabActiva === 'ventas' && (
        <div className="space-y-6">
          {/* KPIs de Ventas (DISEÑO Y DIMENSIONES DASHBOARD) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
            {/* KPI 1: Total Facturado */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                    Total Facturado
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                    S/ {Number(reporteVentas?.resumen?.total_ventas || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Dispensaciones
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 whitespace-nowrap font-sora flex items-center gap-1">
                  <Receipt className="w-3 h-3 text-emerald-600" />
                  {reporteVentas?.resumen?.conteo_completadas || 0} completadas
                </span>
              </div>
            </div>

            {/* KPI 2: I.G.V. Fiscal */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-sora truncate min-w-0 transition-colors">
                    I.G.V. Fiscal (18%)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                    S/ {Number(reporteVentas?.resumen?.total_igv || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  SUNAT
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 whitespace-nowrap font-sora">
                  Impuesto fiscal
                </span>
              </div>
            </div>

            {/* KPI 3: Ticket Promedio */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-sora truncate min-w-0 transition-colors">
                    Ticket Promedio
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-indigo-700 dark:text-indigo-300 tracking-tight font-mono">
                    S/ {Number(reporteVentas?.resumen?.ticket_promedio || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Por paciente
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50 whitespace-nowrap font-sora">
                  Gasto medio
                </span>
              </div>
            </div>

            {/* KPI 4: Descuentos Aplicados */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-rose-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 font-sora truncate min-w-0 transition-colors">
                    Descuentos Aplicados
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <Percent className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight font-mono">
                    S/ {Number(reporteVentas?.resumen?.total_descuentos || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  {reporteVentas?.resumen?.conteo_anuladas || 0} anuladas
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50 whitespace-nowrap font-sora">
                  Promociones
                </span>
              </div>
            </div>
          </div>

          {/* Gráfico y Distribución por Método de Pago */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-100 soft-card-shadow">
              <h3 className="text-sm font-extrabold text-slate-800 mb-3 flex items-center justify-between">
                <span>Curva de Ingresos Diarios</span>
                <span className="text-[11px] text-slate-400 font-medium">Valores en Soles (S/)</span>
              </h3>
              <div className="h-64">
                {Object.keys(reporteVentas?.serie_diaria || {}).length > 0 ? (
                  <Line data={chartDataVentas} options={chartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400 font-semibold">
                    No hay ventas registradas en el rango seleccionado
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 soft-card-shadow flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 mb-3">Métodos de Cobro</h3>
                <div className="space-y-3">
                  {Object.entries(reporteVentas?.por_metodo_pago || {}).map(([metodo, total]) => {
                    const porcentaje = reporteVentas?.resumen?.total_ventas > 0
                      ? ((total / reporteVentas.resumen.total_ventas) * 100).toFixed(1)
                      : 0;

                    return (
                      <div key={metodo} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-slate-700">{metodo}</span>
                          <span className="text-slate-900 font-mono">S/ {parseFloat(total).toFixed(2)} ({porcentaje}%)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 text-[11px] text-slate-400">
                Total recaudado en el período: <strong>S/ {reporteVentas?.resumen?.total_ventas?.toFixed(2)}</strong>
              </div>
            </div>
          </div>

          {/* Tabla Resumen de Ventas */}
          <div className="bg-white rounded-3xl border border-slate-100 soft-card-shadow overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-xs font-black uppercase text-slate-700">Listado Detallado de Comprobantes</h4>
              <div className="flex gap-2">
                <select
                  value={filtroComprobante}
                  onChange={(e) => setFiltroComprobante(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">Todos los Comprobantes</option>
                  <option value="Boleta">Solo Boletas</option>
                  <option value="Factura">Solo Facturas</option>
                  <option value="Ticket">Solo Tickets</option>
                </select>
                <select
                  value={filtroPago}
                  onChange={(e) => setFiltroPago(e.target.value)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
                >
                  <option value="">Todos los Pagos</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                  <option value="Tarjeta">Tarjeta POS</option>
                  <option value="Credito">Crédito</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                  <tr>
                    <th className="py-3 px-4">Comprobante</th>
                    <th className="py-3 px-4">Fecha/Hora</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Dispensador</th>
                    <th className="py-3 px-4">Pago</th>
                    <th className="py-3 px-4 text-right">Subtotal</th>
                    <th className="py-3 px-4 text-right">IGV (18%)</th>
                    <th className="py-3 px-4 text-right">Total</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(reporteVentas?.ventas || []).slice(0, 15).map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-bold text-slate-900 font-mono">
                        {v.tipo_comprobante} {v.numero}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(v.created_at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2.5 px-4 font-medium">
                        {v.cliente?.nombre || 'CLIENTE GENERAL'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {v.usuario?.nombre || 'Cajero'}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-emerald-700">
                        {v.tipo_pago}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        S/ {parseFloat(v.subtotal).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-500">
                        S/ {parseFloat(v.igv).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900">
                        S/ {parseFloat(v.total).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          v.estado === 'Completada' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {v.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. CONTENIDO: TAB 2 (INVENTARIO VALORIZADO) ─── */}
      {tabActiva === 'inventario' && (
        <div className="space-y-6">
          {/* KPIs de Valorización (DISEÑO Y DIMENSIONES DASHBOARD) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
            {/* KPI 1: Capital Invertido */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-slate-400 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-slate-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 font-sora truncate min-w-0 transition-colors">
                    Capital Invertido (Costo)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <Package className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                    S/ {Number(reporteInventario?.resumen?.costo_total_inventario || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Almacén botica
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 whitespace-nowrap font-sora">
                  Costo Total
                </span>
              </div>
            </div>

            {/* KPI 2: Valor Proyectado */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                    Valor Proyectado (Venta)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight font-mono">
                    S/ {Number(reporteInventario?.resumen?.venta_total_proyectada || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Ingreso estimado
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 whitespace-nowrap font-sora">
                  Retorno
                </span>
              </div>
            </div>

            {/* KPI 3: Ganancia Bruta Esperada */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-teal-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 font-sora truncate min-w-0 transition-colors">
                    Ganancia Bruta Esperada
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-300 tracking-tight font-mono">
                    S/ {Number(reporteInventario?.resumen?.ganancia_bruta_estimada || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Rentabilidad
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50 whitespace-nowrap font-sora">
                  +{reporteInventario?.resumen?.margen_promedio_porcentaje || 0}%
                </span>
              </div>
            </div>

            {/* KPI 4: Fármacos Críticos */}
            <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none">
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-sora truncate min-w-0 transition-colors">
                    Fármacos Críticos
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                    {reporteInventario?.resumen?.con_stock_bajo || 0}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Bajo mínimo
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 whitespace-nowrap font-sora">
                  {reporteInventario?.resumen?.agotados || 0} agotados
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Medicamentos Valorizados */}
          <div className="bg-white rounded-3xl border border-slate-100 soft-card-shadow overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar medicamento..."
                  value={busquedaMed}
                  onChange={(e) => setBusquedaMed(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <span className="text-xs text-slate-500 font-bold">
                {reporteInventario?.resumen?.total_medicamentos || 0} productos evaluados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                  <tr>
                    <th className="py-3 px-4">Medicamento</th>
                    <th className="py-3 px-4">Laboratorio</th>
                    <th className="py-3 px-4">Stock Cajas</th>
                    <th className="py-3 px-4 text-right">P. Compra</th>
                    <th className="py-3 px-4 text-right">P. Venta</th>
                    <th className="py-3 px-4 text-right">Valor Costo</th>
                    <th className="py-3 px-4 text-right">Valor Venta</th>
                    <th className="py-3 px-4 text-right">Rentabilidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(reporteInventario?.medicamentos || [])
                    .filter((m) => {
                      if (!busquedaMed.trim()) return true;
                      const q = busquedaMed.toLowerCase();
                      return (
                        m.nombre_comercial.toLowerCase().includes(q) ||
                        m.nombre_generico?.toLowerCase().includes(q)
                      );
                    })
                    .map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4">
                          <p className="font-extrabold text-slate-900">{m.nombre_comercial}</p>
                          <p className="text-[10px] text-slate-400">{m.nombre_generico} {m.concentracion}</p>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500">{m.laboratorio || '—'}</td>
                        <td className="py-2.5 px-4 font-mono font-bold">
                          <span className={m.stock_cajas <= m.stock_minimo ? 'text-amber-600 font-black' : 'text-slate-800'}>
                            {m.stock_cajas} cj
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-600">S/ {(parseFloat(m.precio_compra) || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">S/ {(parseFloat(m.precio_venta) || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-500">S/ {(parseFloat(m.costo_total) || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-extrabold text-emerald-700">S/ {(parseFloat(m.venta_total) || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-4 text-right font-mono font-black text-indigo-700">+{parseFloat(m.margen_porcentaje || 0).toFixed(1)}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 5. CONTENIDO: TAB 3 (KARDEX DIGEMID) ─── */}
      {tabActiva === 'kardex' && (
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-emerald-950">
                  Libro de Control y Trazabilidad Farmacéutica (Norma DIGEMID)
                </h4>
                <p className="text-xs text-emerald-800">
                  Registro cronológico auditable de todas las entradas, salidas por dispensación, mermas y vencimientos
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filtroTipoKardex}
                onChange={(e) => setFiltroTipoKardex(e.target.value)}
                className="px-3 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 focus:outline-none"
              >
                <option value="">Todos los Movimientos</option>
                <option value="Entrada">Solo Entradas (Compras)</option>
                <option value="Salida">Solo Salidas (Ventas)</option>
                <option value="Ajuste">Ajustes Físicos</option>
                <option value="Anulacion">Anulaciones</option>
                <option value="Vencimiento">Bajas por Vencimiento</option>
              </select>
            </div>
          </div>

          {/* KPIs de Kardex Clínico (DISEÑO Y DIMENSIONES DASHBOARD) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
            {/* KPI 1: Total Movimientos */}
            <div
              onClick={() => setFiltroTipoKardex('')}
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
                filtroTipoKardex === ''
                  ? 'border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/20 shadow-xs shadow-emerald-500/10'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-400'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                    Movimientos Totales
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <ClipboardList className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                    {reporteKardex.length}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Trazabilidad
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 whitespace-nowrap font-sora">
                  DIGEMID
                </span>
              </div>
            </div>

            {/* KPI 2: Entradas / Compras */}
            <div
              onClick={() => setFiltroTipoKardex(filtroTipoKardex === 'Entrada' ? '' : 'Entrada')}
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
                filtroTipoKardex === 'Entrada'
                  ? 'border-blue-500 bg-blue-50/10 dark:bg-blue-950/20 shadow-xs shadow-blue-500/10'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-400'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 font-sora truncate min-w-0 transition-colors">
                    Entradas / Compras
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <ArrowDownLeft className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight font-mono">
                    {reporteKardex.filter(k => k.tipo === 'Entrada').length}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Ingreso
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 whitespace-nowrap font-sora">
                  Proveedores
                </span>
              </div>
            </div>

            {/* KPI 3: Salidas / Ventas */}
            <div
              onClick={() => setFiltroTipoKardex(filtroTipoKardex === 'Salida' ? '' : 'Salida')}
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
                filtroTipoKardex === 'Salida'
                  ? 'border-teal-500 bg-teal-50/10 dark:bg-teal-950/20 shadow-xs shadow-teal-500/10'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-teal-400'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 font-sora truncate min-w-0 transition-colors">
                    Salidas / Ventas
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-300 tracking-tight font-mono">
                    {reporteKardex.filter(k => k.tipo === 'Salida').length}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Dispensación
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50 whitespace-nowrap font-sora">
                  Pacientes
                </span>
              </div>
            </div>

            {/* KPI 4: Ajustes y Bajas */}
            <div
              onClick={() => setFiltroTipoKardex(filtroTipoKardex === 'Vencimiento' ? '' : 'Vencimiento')}
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
                filtroTipoKardex === 'Vencimiento' || filtroTipoKardex === 'Ajuste'
                  ? 'border-rose-500 bg-rose-50/10 dark:bg-rose-950/20 shadow-xs shadow-rose-500/10'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-rose-400'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-600 dark:group-hover:text-rose-400 font-sora truncate min-w-0 transition-colors">
                    Ajustes y Bajas
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight font-mono">
                    {reporteKardex.filter(k => k.tipo === 'Vencimiento' || k.tipo === 'Ajuste' || k.tipo === 'Anulacion').length}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Auditoría
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/50 whitespace-nowrap font-sora">
                  Mermas & Bajas
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Movimientos Kardex */}
          <div className="bg-white rounded-3xl border border-slate-100 soft-card-shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                  <tr>
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Medicamento</th>
                    <th className="py-3 px-4">Lote & Vencimiento</th>
                    <th className="py-3 px-4">Tipo Movimiento</th>
                    <th className="py-3 px-4 text-center">Cantidad</th>
                    <th className="py-3 px-4 text-center">Stock Final</th>
                    <th className="py-3 px-4">Responsable (QF)</th>
                    <th className="py-3 px-4">Motivo / Documento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reporteKardex.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-400 font-semibold">
                        No se registran movimientos en el período seleccionado.
                      </td>
                    </tr>
                  ) : (
                    reporteKardex.map((k) => (
                      <tr key={k.id} className="hover:bg-slate-50/70">
                        <td className="py-2.5 px-4 font-mono text-slate-500">
                          {new Date(k.fecha).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-2.5 px-4">
                          <p className="font-extrabold text-slate-900">{k.medicamento?.nombre_comercial}</p>
                          {k.medicamento?.registro_sanitario && (
                            <p className="text-[10px] text-slate-400 font-mono">Reg: {k.medicamento.registro_sanitario}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-mono">
                          <span className="font-bold text-slate-800">{k.lote?.numero_lote || '—'}</span>
                          {k.lote?.fecha_vencimiento && (
                            <p className="text-[10px] text-slate-400">Vence: {k.lote.fecha_vencimiento}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            k.tipo === 'Entrada'
                              ? 'bg-emerald-100 text-emerald-800'
                              : k.tipo === 'Salida'
                              ? 'bg-blue-100 text-blue-800'
                              : k.tipo === 'Anulacion'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {k.tipo}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-black text-slate-800">
                          {k.cantidad} {k.formato === 'Caja' ? 'cj' : 'fr'}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-emerald-700">
                          {k.stock_despues} cj
                        </td>
                        <td className="py-2.5 px-4">
                          <p className="font-bold text-slate-800">{k.usuario?.nombre}</p>
                          {k.usuario?.colegiatura_qf && (
                            <p className="text-[10px] text-teal-700 font-extrabold">{k.usuario.colegiatura_qf}</p>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 max-w-[200px] truncate" title={k.motivo}>
                          {k.motivo}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. CONTENIDO: TAB 4 (ARQUEOS DE CAJA) ─── */}
      {tabActiva === 'caja' && (
        <div className="space-y-6">
          {/* KPIs de Arqueos de Caja (DISEÑO Y DIMENSIONES DASHBOARD) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
            {/* KPI 1: Turnos */}
            <div
              onClick={() => setFiltroEstadoCaja('')}
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
                filtroEstadoCaja === ''
                  ? 'border-indigo-500 bg-indigo-50/10 dark:bg-indigo-950/20 shadow-xs shadow-indigo-500/10'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-indigo-400'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 font-sora truncate min-w-0 transition-colors">
                    Turnos Registrados
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <Wallet className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight font-mono">
                    {reporteCaja.length}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Caja Chica
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/50 whitespace-nowrap font-sora">
                  Historial turnos
                </span>
              </div>
            </div>

            {/* KPI 2: Total Declarado */}
            <div
              className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none"
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                    Total Declarado
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-emerald-300 tracking-tight font-mono">
                    S/ {reporteCaja.reduce((acc, c) => acc + (parseFloat(c.monto_final) || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Efectivo
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 whitespace-nowrap font-sora">
                  Arqueo cierres
                </span>
              </div>
            </div>

            {/* KPI 3: Turnos Cuadrados */}
            <div
              onClick={() => setFiltroEstadoCaja(filtroEstadoCaja === 'Cuadrado' ? '' : 'Cuadrado')}
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
                filtroEstadoCaja === 'Cuadrado'
                  ? 'border-teal-500 bg-teal-50/10 dark:bg-teal-950/20 shadow-xs shadow-teal-500/10'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-teal-400'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-teal-600 dark:group-hover:text-teal-400 font-sora truncate min-w-0 transition-colors">
                    Turnos Cuadrados
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-300 tracking-tight font-mono">
                    {reporteCaja.filter(c => c.cuadre_estado === 'Cuadrado').length}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Sin diferencias
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50 whitespace-nowrap font-sora">
                  100% Exacto
                </span>
              </div>
            </div>

            {/* KPI 4: Diferencias / Observados */}
            <div
              onClick={() => setFiltroEstadoCaja(filtroEstadoCaja === 'Observado' ? '' : 'Observado')}
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
                filtroEstadoCaja === 'Observado'
                  ? 'border-amber-500 bg-amber-50/10 dark:bg-amber-950/20 shadow-xs shadow-amber-500/10'
                  : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-400'
              }`}
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/12 transition-all" />

              <div>
                <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
                  <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 font-sora truncate min-w-0 transition-colors">
                    Diferencias / Observados
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="my-1 sm:my-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight font-mono">
                    {reporteCaja.filter(c => c.cuadre_estado !== 'Cuadrado').length}
                  </span>
                </div>
              </div>

              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
                  Auditoría
                </span>
                <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50 whitespace-nowrap font-sora">
                  Sobrante / Faltante
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 soft-card-shadow overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h4 className="text-xs font-black uppercase text-slate-700">Historial de Turnos y Arqueos Físicos</h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[10px] font-black">
                  <tr>
                    <th className="py-3 px-4">Cajero / Usuario</th>
                    <th className="py-3 px-4">Apertura</th>
                    <th className="py-3 px-4">Cierre</th>
                    <th className="py-3 px-4 text-right">Monto Inicial</th>
                    <th className="py-3 px-4 text-right">Saldo Esperado</th>
                    <th className="py-3 px-4 text-right">Monto Declarado</th>
                    <th className="py-3 px-4 text-center">Diferencia</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-center">Ticket</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {reporteCaja
                    .filter((c) =>
                      !filtroEstadoCaja
                        ? true
                        : filtroEstadoCaja === 'Cuadrado'
                        ? c.cuadre_estado === 'Cuadrado'
                        : c.cuadre_estado !== 'Cuadrado'
                    )
                    .map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/70">
                      <td className="py-2.5 px-4 font-extrabold text-slate-900">
                        {c.usuario?.nombre || 'Cajero'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(c.fecha_apertura).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {c.fecha_cierre
                          ? new Date(c.fecha_cierre).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })
                          : 'En curso (Abierta)'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono">
                        S/ {parseFloat(c.monto_inicial).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                        S/ {parseFloat(c.monto_final_esperado || c.monto_inicial).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        S/ {parseFloat(c.monto_final || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          c.cuadre_estado === 'Cuadrado'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.cuadre_estado === 'Sobrante'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {c.diferencia > 0 ? `+ S/ ${c.diferencia}` : c.diferencia < 0 ? `- S/ ${Math.abs(c.diferencia)}` : 'Exacto'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.estado === 'Abierta' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {c.estado}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {c.estado === 'Cerrada' && (
                          <button
                            type="button"
                            onClick={() => handleImprimirTicketCaja(c.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] border border-emerald-200/60 transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Imprimir Ticket Térmico de Arqueo"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Imprimir</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
