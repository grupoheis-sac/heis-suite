import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
  Receipt,
  Search,
  Eye,
  Printer,
  Calendar,
  User,
  CreditCard,
  Ban,
  CheckCircle2,
  XCircle,
  X,
  RotateCcw,
  AlertTriangle,
  FileText,
  FileCode,
  ShieldCheck,
  Download,
  RefreshCw,
  ExternalLink,
  Clock,
  Sparkles,
  Filter,
  DollarSign,
  Smartphone,
  Banknote,
  Package,
  ArrowUpRight,
  Copy
} from 'lucide-react';
import { TicketImpresion } from '@heis/ui';
import { useAuthStore } from '@heis/core';

export default function Ventas() {
  const { user } = useAuthStore();
  const esCajero = user?.rol === 'Cajero';

  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  
  // Filtros rápidos
  const [filtroTipo, setFiltroTipo] = useState('Todos'); // 'Todos', 'Boleta', 'Factura', 'Ticket'
  const [filtroEstado, setFiltroEstado] = useState('Todos'); // 'Todos', 'Completada', 'Anulada'
  const [filtroFecha, setFiltroFecha] = useState('mes'); // 'hoy', '7dias', 'mes', 'todos'

  // Modales
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [ventaParaTicket, setVentaParaTicket] = useState(null);
  const [mostrarTicket, setMostrarTicket] = useState(false);
  const [reenviandoSunatId, setReenviandoSunatId] = useState(null);

  // Anulación de venta
  const [modalAnulacion, setModalAnulacion] = useState(false);
  const [ventaAAnular, setVentaAAnular] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);

  // Atajo de teclado: Escape para cerrar modales
  useEffect(() => {
    if (!mostrarModal && !modalAnulacion) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (mostrarModal) setMostrarModal(false);
        if (modalAnulacion) setModalAnulacion(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mostrarModal, modalAnulacion]);

  // Cargar ventas del backend
  const cargarVentas = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ventas?page=${pagina}&limit=30`);
      if (res?.data?.success) {
        setVentas(res.data.ventas || []);
        setTotalPaginas(res.data.paginas || 1);
      } else if (res?.success) {
        setVentas(res.ventas || []);
        setTotalPaginas(res.paginas || 1);
      }
    } catch (err) {
      console.error('Error al cargar ventas:', err);
      toast.error('No se pudo cargar el historial de ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, [pagina]);

  const abrirModalAnulacion = (v) => {
    setVentaAAnular(v);
    setMotivoAnulacion('');
    setModalAnulacion(true);
  };

  const confirmarAnulacion = async (e) => {
    e.preventDefault();
    if (!motivoAnulacion.trim()) {
      toast.error('Debe ingresar un motivo para la anulación');
      return;
    }

    try {
      setAnulando(true);
      const res = await api.post(`/ventas/${ventaAAnular.id}/anular`, {
        motivo: motivoAnulacion.trim()
      });
      if (res?.data?.success || res?.success) {
        toast.success(res?.data?.message || res?.message || 'Venta anulada y stock retornado exitosamente');
        setModalAnulacion(false);
        setMostrarModal(false);
        cargarVentas();
      } else {
        toast.error(res?.data?.message || res?.message || 'Error al anular comprobante');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error al anular la venta');
    } finally {
      setAnulando(false);
    }
  };

  const verDetalle = async (id) => {
    try {
      const res = await api.get(`/ventas/${id}`);
      const payload = res?.data ? res.data : res;
      const ventaData = payload?.venta || (payload?.id ? payload : null);
      if (ventaData) {
        setVentaSeleccionada(ventaData);
        setMostrarModal(true);
      } else {
        toast.error('No se pudo cargar el detalle del comprobante');
      }
    } catch (err) {
      console.error('Error al obtener detalle de venta:', err);
      toast.error('Error al obtener el detalle de la venta');
    }
  };

  const abrirTicketImpresion = async (venta) => {
    if (!venta) return;
    try {
      const res = await api.get(`/ventas/${venta.id}`);
      const payload = res?.data ? res.data : res;
      const ventaData = payload?.venta || (payload?.id ? payload : null);
      if (ventaData) {
        setVentaParaTicket(ventaData);
      } else {
        setVentaParaTicket(venta);
      }
      setMostrarTicket(true);
    } catch (err) {
      setVentaParaTicket(venta);
      setMostrarTicket(true);
    }
  };

  const reenviarASunat = async (id) => {
    try {
      setReenviandoSunatId(id);
      toast.loading('Sincronizando comprobante con SUNAT...', { id: 'sunat-reenvio' });
      const res = await api.post(`/sunat/reenviar/${id}`);
      if (res?.data?.success || res?.success) {
        toast.success(res?.data?.message || res?.message || 'Comprobante procesado por SUNAT exitosamente', { id: 'sunat-reenvio' });
        await cargarVentas();
        if (ventaSeleccionada && ventaSeleccionada.id === id) {
          verDetalle(id);
        }
      } else {
        toast.error(res?.data?.message || 'No se pudo emitir ante SUNAT', { id: 'sunat-reenvio' });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al conectar con SUNAT', { id: 'sunat-reenvio' });
    } finally {
      setReenviandoSunatId(null);
    }
  };

  const abrirEnlace = (url, nombre = 'archivo') => {
    if (!url) {
      toast.error(`El archivo de ${nombre} aún no está disponible.`);
      return;
    }
    window.open(url, '_blank');
  };

  const parseFechaVenta = (v) => {
    const raw = v?.created_at || v?.createdAt || v?.fecha_emision || v?.fecha;
    if (!raw) return null;
    const isoStr = typeof raw === 'string' && raw.includes(' ') && !raw.includes('T')
      ? raw.replace(' ', 'T')
      : raw;
    const d = new Date(isoStr);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatearFecha = (v) => {
    const d = parseFechaVenta(v);
    if (!d) return '—';
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatearHora = (v) => {
    const d = parseFechaVenta(v);
    if (!d) return '';
    return d.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Filtrado de ventas en cliente
  const ventasFiltradas = useMemo(() => {
    return ventas.filter((v) => {
      // 1. Filtro Tipo Comprobante
      if (filtroTipo !== 'Todos' && v.tipo_comprobante !== filtroTipo) {
        return false;
      }

      // 2. Filtro Estado
      if (filtroEstado !== 'Todos' && v.estado !== filtroEstado) {
        return false;
      }

      // 3. Filtro Rango de Fecha
      if (filtroFecha !== 'todos') {
        const d = parseFechaVenta(v);
        if (d) {
          const hoy = new Date();
          if (filtroFecha === 'hoy') {
            const esHoy = d.getDate() === hoy.getDate() &&
                          d.getMonth() === hoy.getMonth() &&
                          d.getFullYear() === hoy.getFullYear();
            if (!esHoy) return false;
          } else if (filtroFecha === '7dias') {
            const hace7Dias = new Date();
            hace7Dias.setDate(hoy.getDate() - 7);
            if (d < hace7Dias) return false;
          } else if (filtroFecha === 'mes') {
            const esMismoMes = d.getMonth() === hoy.getMonth() &&
                               d.getFullYear() === hoy.getFullYear();
            if (!esMismoMes) return false;
          }
        }
      }

      // 4. Búsqueda por texto libre
      if (!busqueda.trim()) return true;
      const q = busqueda.toLowerCase().trim();
      const numCompleto = `${v.serie || ''}-${v.numero || ''}`.toLowerCase();
      const numero = String(v.numero || '').toLowerCase();
      const clienteNombre = String(v.cliente?.nombre || '').toLowerCase();
      const clienteDoc = String(v.cliente?.numero_documento || '').toLowerCase();
      const tipoComprobante = String(v.tipo_comprobante || '').toLowerCase();
      const tipoPago = String(v.tipo_pago || '').toLowerCase();

      return (
        numCompleto.includes(q) ||
        numero.includes(q) ||
        clienteNombre.includes(q) ||
        clienteDoc.includes(q) ||
        tipoComprobante.includes(q) ||
        tipoPago.includes(q)
      );
    });
  }, [ventas, busqueda, filtroTipo, filtroEstado, filtroFecha]);

  // Cálculos de KPIs basados en el universo filtrado actual
  const kpis = useMemo(() => {
    let totalFacturado = 0;
    let cantVentas = 0;
    let totalBoletas = 0;
    let cantBoletas = 0;
    let totalFacturas = 0;
    let cantFacturas = 0;
    let totalDigital = 0;
    let totalEfectivo = 0;

    ventasFiltradas.forEach((v) => {
      const monto = parseFloat(v.total || 0);
      if (v.estado === 'Completada') {
        totalFacturado += monto;
        cantVentas++;

        if (v.tipo_comprobante === 'Boleta') {
          totalBoletas += monto;
          cantBoletas++;
        } else if (v.tipo_comprobante === 'Factura') {
          totalFacturas += monto;
          cantFacturas++;
        }

        if (['Yape', 'Plin', 'Tarjeta'].includes(v.tipo_pago) || v.billetera_digital) {
          totalDigital += monto;
        } else {
          totalEfectivo += monto;
        }
      }
    });

    return {
      totalFacturado,
      cantVentas,
      totalBoletas,
      cantBoletas,
      totalFacturas,
      cantFacturas,
      totalDigital,
      totalEfectivo
    };
  }, [ventasFiltradas]);

  return (
    <div className="space-y-4 w-full max-w-[1440px] mx-auto pb-8">
      {/* ─── PÍLDORA CÁPSULA DINÁMICA ULTRA-DELGADA (ESTILO DYNAMIC PILL) ─── */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-full bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs soft-card-shadow py-2 sm:py-2.5 px-3.5 sm:px-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3">
          {/* Lado izquierdo: Ícono squircle + Título destacado + Status SUNAT */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pl-0.5 sm:pl-0">
            <div className="w-[34px] h-[34px] rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
              <Receipt className="w-[17px] h-[17px] stroke-[2.3]" />
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap min-w-0">
 <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight ">
                Historial de Ventas
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                SUNAT UBL 2.1
              </span>
              <span className="hidden xl:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
                • Boletas, Facturas & Tickets Térmicos
              </span>
            </div>
          </div>

          {/* Lado derecho: Buscador redondeado + Botón en cápsula */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            <div className="relative flex-1 sm:w-60 md:w-68">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar comprobante, cliente, RUC..."
                className="w-full h-9 bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-900 border border-slate-200/90 dark:border-slate-700 rounded-full pl-[36px] pr-8 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium transition-all"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={cargarVentas}
              disabled={loading}
              title="Actualizar listado de ventas"
 className="h-9 px-3.5 sm:px-4 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs shadow-indigo-600/25 active:scale-95 shrink-0 "
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── TARJETAS DE INDICADORES / KPIS (ESTILO DASHBOARD MODERNO) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* KPI 1: Total Facturado */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-sora truncate min-w-0">
                Total Facturado
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate">
              S/ {kpis.totalFacturado.toFixed(2)}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Comprobantes completados
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 font-sora shrink-0 whitespace-nowrap">
              {kpis.cantVentas} vta{kpis.cantVentas === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* KPI 2: Boletas de Venta */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors font-sora truncate min-w-0">
                Boletas de Venta
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-sora tracking-tight truncate">
              S/ {kpis.totalBoletas.toFixed(2)}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Consumidor final DNI
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 font-sora shrink-0 whitespace-nowrap">
              {kpis.cantBoletas} emitidas
            </span>
          </div>
        </div>

        {/* KPI 3: Facturas Comerciales */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-sora truncate min-w-0">
                Facturas SUNAT
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-600/25 transition-all duration-200">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-sora tracking-tight truncate">
              S/ {kpis.totalFacturas.toFixed(2)}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Crédito fiscal 18% IGV
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/60 font-sora shrink-0 whitespace-nowrap">
              {kpis.cantFacturas} con RUC
            </span>
          </div>
        </div>

        {/* KPI 4: Digitales vs Efectivo */}
        <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-purple-500 dark:hover:border-purple-500 shadow-2xs hover:shadow-md hover:shadow-purple-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors font-sora truncate min-w-0">
                Cobros Digitales
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100/80 dark:border-purple-800/60 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-purple-600/25 transition-all duration-200">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-sora tracking-tight truncate">
              S/ {kpis.totalDigital.toFixed(2)}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Yape, Plin y Tarjetas
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/80 dark:border-slate-700 font-sora shrink-0 whitespace-nowrap">
              S/ {kpis.totalEfectivo.toFixed(2)} efec.
            </span>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE FILTROS RÁPIDOS (RANGOS Y TIPO COMPROBANTE) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl py-2 px-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Filtro Rango de Tiempo */}
        <div className="flex items-center gap-1 overflow-x-auto custom-modal-scroll">
          <span className="text-[10.5px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
            Período:
          </span>
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: '7dias', label: 'Últimos 7 días' },
            { id: 'mes', label: 'Este Mes' },
            { id: 'todos', label: 'Todo el Historial' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFiltroFecha(f.id)}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all text-xs cursor-pointer ${
                filtroFecha === f.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtros Tipo Comprobante & Estado */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {['Todos', 'Boleta', 'Factura', 'Ticket'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroTipo === tipo
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tipo === 'Ticket' ? 'Nota Venta' : tipo}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {['Todos', 'Completada', 'Anulada'].map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroEstado === est
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {est === 'Completada' ? 'Válidas' : est === 'Anulada' ? 'Anuladas' : est}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TABLA PRINCIPAL DEL HISTORIAL DE VENTAS (ESTILO BOTICAS) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3 font-extrabold whitespace-nowrap">COMPROBANTE</th>
                <th className="py-2.5 px-3 font-extrabold whitespace-nowrap">FECHA / HORA</th>
                <th className="py-2.5 px-3 font-extrabold min-w-[130px]">CLIENTE</th>
                <th className="py-2.5 px-3 font-extrabold whitespace-nowrap">PAGO</th>
                <th className="py-2.5 px-3 font-extrabold whitespace-nowrap">TOTAL</th>
                <th className="py-2.5 px-3 font-extrabold text-center whitespace-nowrap">SUNAT</th>
                <th className="py-2.5 px-3 font-extrabold text-center whitespace-nowrap">DOCS SUNAT</th>
                <th className="py-2.5 px-3 font-extrabold text-center whitespace-nowrap">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-7 h-7 border-3 border-indigo-500/20 border-t-indigo-600 rounded-full animate-spin" />
                      <span className="text-xs font-bold text-slate-400">
                        Cargando historial de ventas y comprobantes...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-700" />
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-300">
                        No se encontraron registros de ventas
                      </span>
                      <span className="text-xs text-slate-400">
                        Intenta ajustar los filtros de búsqueda o el período seleccionado.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* 1. Comprobante */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase inline-block mb-0.5 ${
                        v.tipo_comprobante === 'Factura'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/60'
                          : v.tipo_comprobante === 'Nota de Crédito' || v.tipo_comprobante === 'NotaCredito'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
                          : v.tipo_comprobante === 'Ticket'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900/60'
                      }`}>
                        {v.tipo_comprobante === 'Ticket' ? 'Nota de Venta' : v.tipo_comprobante}
                      </span>
                      <span className="block text-xs text-slate-900 dark:text-white font-extrabold font-sora tracking-tight">
                        {v.numero_comprobante || (v.serie && v.numero ? `${v.serie}-${v.numero}` : v.numero)}
                      </span>
                    </td>

                    {/* 2. Fecha y Hora */}
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-[11px] leading-tight font-sora">
                        {formatearFecha(v)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sora mt-0.5 leading-tight">
                        {formatearHora(v)}
                      </div>
                    </td>

                    {/* 3. Cliente */}
                    <td className="py-2.5 px-3 min-w-[130px] max-w-[220px]">
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 text-xs truncate" title={v.cliente?.nombre || 'Público General'}>
                        {v.cliente?.nombre || 'Público General'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sora">
                        {v.cliente?.numero_documento ? `${v.cliente.tipo_documento || 'DOC'}: ${v.cliente.numero_documento}` : 'Sin documento'}
                      </div>
                    </td>

                    {/* 4. Método de Pago */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block font-sora ${
                        v.tipo_pago === 'Efectivo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : ['Yape', 'Plin'].includes(v.tipo_pago)
                          ? 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800'
                          : v.tipo_pago === 'Tarjeta'
                          ? 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900'
                          : v.tipo_pago === 'Credito'
                          ? 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800'
                      }`}>
                        {v.tipo_pago}
                      </span>
                    </td>

                    {/* 5. Total */}
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 dark:text-indigo-300 text-[13px] font-sora whitespace-nowrap">
                      S/ {parseFloat(v.total || 0).toFixed(2)}
                    </td>

                    {/* 6. Estado SUNAT */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {v.estado === 'Anulada' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          <Ban className="w-3 h-3 text-slate-500" />
                          Anulada
                        </span>
                      ) : v.sunat_estado === 'Aceptado' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800" title="Aceptado oficialmente por SUNAT">
                          <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Aceptado
                        </span>
                      ) : v.sunat_estado === 'Rechazado' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800" title="Rechazado por SUNAT">
                          <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          Rechazado
                        </span>
                      ) : (
                        <button
                          onClick={() => reenviarASunat(v.id)}
                          disabled={reenviandoSunatId === v.id}
                          className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 transition-colors cursor-pointer"
                          title="Click para enviar / sincronizar con SUNAT"
                        >
                          <Clock className={`w-3 h-3 text-amber-600 dark:text-amber-400 ${reenviandoSunatId === v.id ? 'animate-spin' : ''}`} />
                          {reenviandoSunatId === v.id ? 'Enviando...' : 'Pendiente'}
                        </button>
                      )}
                    </td>

                    {/* 7. Descargas Oficiales SUNAT (PDF / XML / CDR) */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Botón PDF Oficial */}
                        <button
                          onClick={() => abrirEnlace(v.enlace_pdf, 'PDF')}
                          disabled={!v.enlace_pdf}
                          className={`p-1.5 rounded-lg border transition-all ${
                            v.enlace_pdf
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900 cursor-pointer shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                          }`}
                          title={v.enlace_pdf ? 'Ver PDF Oficial SUNAT (A4 con QR)' : 'PDF no generado aún'}
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón XML Firmado */}
                        <button
                          onClick={() => abrirEnlace(v.enlace_xml, 'XML')}
                          disabled={!v.enlace_xml}
                          className={`p-1.5 rounded-lg border transition-all ${
                            v.enlace_xml
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 cursor-pointer shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                          }`}
                          title={v.enlace_xml ? 'Descargar XML Firmado UBL 2.1' : 'XML no generado aún'}
                        >
                          <FileCode className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón CDR SUNAT */}
                        <button
                          onClick={() => abrirEnlace(v.enlace_cdr, 'CDR')}
                          disabled={!v.enlace_cdr}
                          className={`p-1.5 rounded-lg border transition-all ${
                            v.enlace_cdr
                              ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 cursor-pointer shadow-xs'
                              : 'bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                          }`}
                          title={v.enlace_cdr ? 'Descargar CDR de SUNAT (ZIP)' : 'CDR no disponible aún'}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* 8. Acciones Generales */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        {/* Imprimir Ticket Térmico */}
                        <button
                          onClick={() => abrirTicketImpresion(v)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80 transition-colors border border-emerald-200/60 shadow-xs cursor-pointer"
                          title="Imprimir Ticket Térmico 80mm / 58mm / A4"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Ver Detalle */}
                        <button
                          onClick={() => verDetalle(v.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors border border-slate-200/80 dark:border-slate-700 shadow-xs cursor-pointer"
                          title="Ver Detalle y Trazabilidad Fiscal"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Anular Venta (Solo si está Completada y no Cajero restringido) */}
                        {!esCajero && v.estado === 'Completada' && (
                          <button
                            onClick={() => abrirModalAnulacion(v)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 transition-colors border border-rose-200/60 shadow-xs cursor-pointer"
                            title="Anular Venta / Retornar Stock a Almacén"
                          >
                            <Ban className="w-3.5 h-3.5" />
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

        {/* ─── PAGINACIÓN MODERNA ─── */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Mostrando <strong>{ventasFiltradas.length}</strong> comprobantes (Página {pagina} de {totalPaginas})
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1 || loading}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold shadow-xs transition-colors cursor-pointer"
            >
              Anterior
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas || loading}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold shadow-xs transition-colors cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL DE DETALLE Y TRAZABILIDAD FISCAL (PRO TECH FERRETERO) ─── */}
      {mostrarModal && ventaSeleccionada && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMostrarModal(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-[28px] max-w-2xl w-full overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.3)] animate-in zoom-in-95 duration-200 my-auto cursor-default flex flex-col max-h-[90vh]"
          >
            {/* Modal Top Bar */}
            <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
                  <Receipt className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
 <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight truncate">
                      Detalle y Trazabilidad Fiscal
                    </h2>
                    <span className="hidden sm:inline-flex items-center text-[10px] font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md border border-indigo-200/70 dark:border-indigo-800/60 font-mono">
                      ID #{ventaSeleccionada.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                    Auditoría de venta, artículos despachados y comprobante electrónico
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => abrirTicketImpresion(ventaSeleccionada)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/90 dark:border-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                  title="Imprimir Ticket Térmico"
                >
                  <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="hidden sm:inline">Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                  title="Cerrar ventana (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 overflow-y-auto custom-modal-scroll flex-1">
              {/* Bloque Fiscal SUNAT */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-indigo-50/20 to-white dark:from-slate-800/70 dark:via-slate-800/50 dark:to-indigo-950/20 border border-slate-200/90 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/80 shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        SUNAT UBL 2.1 OFICIAL
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono uppercase">
                        {ventaSeleccionada.tipo_comprobante}
                      </span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 tracking-tight">
                      {ventaSeleccionada.serie ? `${ventaSeleccionada.serie}-${ventaSeleccionada.numero}` : ventaSeleccionada.numero}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1.5 rounded-full border shadow-2xs font-sora ${
                      ventaSeleccionada.sunat_estado === 'Aceptado'
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : ventaSeleccionada.sunat_estado === 'Rechazado'
                        ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                        : 'bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        ventaSeleccionada.sunat_estado === 'Aceptado' ? 'bg-emerald-500' :
                        ventaSeleccionada.sunat_estado === 'Rechazado' ? 'bg-rose-500' : 'bg-amber-500 animate-ping'
                      }`} />
                      {ventaSeleccionada.sunat_estado || 'Pendiente'}
                    </span>
                  </div>
                </div>

                {/* Hash Box con Copiar */}
                {ventaSeleccionada.sunat_hash && (
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5 font-sora">
                        Hash SHA-256 (DigestValue Firma Digital):
                      </span>
                      <span className="text-[10.5px] font-mono text-slate-700 dark:text-slate-300 break-all select-all font-semibold leading-tight block">
                        {ventaSeleccionada.sunat_hash}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(ventaSeleccionada.sunat_hash);
                        toast.success('Hash copiado al portapapeles');
                      }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/60 dark:border-slate-700 shrink-0 transition-colors cursor-pointer"
                      title="Copiar Hash SHA-256"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Acciones Rápidas de Descarga SUNAT */}
                <div className="grid grid-cols-3 gap-2 sm:gap-2.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => abrirEnlace(ventaSeleccionada.enlace_pdf, 'PDF')}
                    disabled={!ventaSeleccionada.enlace_pdf}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border font-sora ${
                      ventaSeleccionada.enlace_pdf
                        ? 'bg-blue-50/90 hover:bg-blue-100/90 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 dark:text-blue-300 dark:border-blue-800/80 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95'
                        : 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200/70 dark:border-slate-700/50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Ver PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirEnlace(ventaSeleccionada.enlace_xml, 'XML')}
                    disabled={!ventaSeleccionada.enlace_xml}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border font-sora ${
                      ventaSeleccionada.enlace_xml
                        ? 'bg-emerald-50/90 hover:bg-emerald-100/90 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 dark:text-emerald-300 dark:border-emerald-800/80 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95'
                        : 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200/70 dark:border-slate-700/50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <FileCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>XML Firmado</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirEnlace(ventaSeleccionada.enlace_cdr, 'CDR')}
                    disabled={!ventaSeleccionada.enlace_cdr}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all border font-sora ${
                      ventaSeleccionada.enlace_cdr
                        ? 'bg-purple-50/90 hover:bg-purple-100/90 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 dark:text-purple-300 dark:border-purple-800/80 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-95'
                        : 'bg-slate-100/80 dark:bg-slate-800/50 text-slate-400 dark:text-slate-500 border-slate-200/70 dark:border-slate-700/50 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>CDR (ZIP)</span>
                  </button>
                </div>

                {/* Botón Reenviar / Sincronizar SUNAT */}
                {ventaSeleccionada.sunat_estado !== 'Aceptado' && ventaSeleccionada.estado !== 'Anulada' && (
                  <button
                    type="button"
                    onClick={() => reenviarASunat(ventaSeleccionada.id)}
                    disabled={reenviandoSunatId === ventaSeleccionada.id}
 className="w-full mt-1.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-900 font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.99] "
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reenviandoSunatId === ventaSeleccionada.id ? 'animate-spin' : ''}`} />
                    <span>{reenviandoSunatId === ventaSeleccionada.id ? 'Enviando a SUNAT...' : 'Reenviar / Sincronizar con Servidor SUNAT'}</span>
                  </button>
                )}
              </div>

              {/* Datos Generales de la Operación */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* Emisión & Atendido */}
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider font-sora">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Emisión & Responsable</span>
                  </div>
                  <p className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                    {(() => {
                      const d = parseFechaVenta(ventaSeleccionada);
                      return d
                        ? `${d.toLocaleDateString('es-PE')} • ${d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })}`
                        : '—';
                    })()}
                  </p>
                  {ventaSeleccionada.usuario?.nombre && (
                    <div className="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <User className="w-3 h-3 text-slate-400" />
                      <span>Atendido por: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{ventaSeleccionada.usuario.nombre}</strong></span>
                    </div>
                  )}
                </div>

                {/* Cliente & Documento */}
                <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 text-[10px] font-extrabold uppercase tracking-wider font-sora">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Datos del Cliente</span>
                  </div>
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate" title={ventaSeleccionada.cliente?.nombre || 'CLIENTE GENERAL'}>
                    {ventaSeleccionada.cliente?.nombre || 'CLIENTE GENERAL'}
                  </p>
                  <div className="pt-1 border-t border-slate-200/50 dark:border-slate-700/50 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-mono text-[10.5px]">
                      {ventaSeleccionada.cliente?.numero_documento
                        ? `${ventaSeleccionada.cliente?.tipo_documento || 'DOC'}: ${ventaSeleccionada.cliente.numero_documento}`
                        : 'Venta sin documento de identidad'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tira Comercial de Pago y Estado */}
              <div className="p-3 rounded-xl bg-slate-50/60 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <div>
 <span className="text-[9.5px] text-slate-400 font-bold uppercase block leading-none ">Método de Pago</span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-200 font-sora text-xs">
                      {ventaSeleccionada.tipo_pago}
                      {ventaSeleccionada.billetera_digital ? ` • ${ventaSeleccionada.billetera_digital}` : ''}
                    </span>
                  </div>
                </div>

                {ventaSeleccionada.numero_operacion && (
                  <div className="text-right sm:text-left">
                    <span className="text-[9.5px] text-slate-400 font-bold uppercase block leading-none font-sora">N° Operación</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 text-xs">{ventaSeleccionada.numero_operacion}</span>
                  </div>
                )}

                <div className="text-right">
 <span className="text-[9.5px] text-slate-400 font-bold uppercase block leading-none ">Estado Comercial</span>
                  <span className={`inline-block font-extrabold text-[10.5px] uppercase font-sora ${
                    ventaSeleccionada.estado === 'Completada' ? 'text-emerald-600 dark:text-emerald-400' :
                    ventaSeleccionada.estado === 'Anulada' ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-300'
                  }`}>
                    {ventaSeleccionada.estado}
                  </span>
                </div>
              </div>

              {/* Observación / Notas */}
              {ventaSeleccionada.notas && (
                <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 text-[11px] text-amber-800 dark:text-amber-300 font-medium flex items-start gap-2">
 <span className="font-bold shrink-0 ">Nota:</span>
                  <span>{ventaSeleccionada.notas}</span>
                </div>
              )}

              {/* Items List (Materiales / Artículos Ferreteros) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sora flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-indigo-500" />
                    Artículos Despachados ({ventaSeleccionada.detalles?.length || 0})
                  </span>
                </div>

                <div className="border border-slate-200/90 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/50 shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
 <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase text-slate-400 dark:text-slate-400 ">
                          <th className="py-2.5 px-3.5">Material / Descripción</th>
                          <th className="py-2.5 px-2 text-center">Cant.</th>
                          <th className="py-2.5 px-3 text-right">P. Unit</th>
                          <th className="py-2.5 px-3.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                        {ventaSeleccionada.detalles?.map((det, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-2.5 px-3.5">
                              <p className="font-bold text-slate-900 dark:text-slate-100 leading-snug">
                                {det.producto?.nombre}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-400 dark:text-slate-500">
                                <span className="font-medium bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[10px] text-slate-600 dark:text-slate-400">
                                  {det.producto?.unidad_medida || 'UND'}
                                </span>
                                {det.producto?.codigo_barras && (
                                  <span className="font-mono text-[10px]">SKU: {det.producto.codigo_barras}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-2 text-center font-bold text-slate-800 dark:text-slate-200">
                              <span className="inline-block px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 font-mono text-xs">
                                {det.cantidad}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600 dark:text-slate-400">
                              S/ {parseFloat(det.precio_unitario || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-black font-mono text-slate-900 dark:text-white">
                              S/ {parseFloat(det.subtotal || 0).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Totales Financieros */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Subtotal (Operación Gravada):</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    S/ {parseFloat(ventaSeleccionada.subtotal || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-medium">I.G.V. Oficial (18%):</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    S/ {parseFloat(ventaSeleccionada.igv || 0).toFixed(2)}
                  </span>
                </div>

                {parseFloat(ventaSeleccionada.descuento || 0) > 0 && (
                  <div className="flex justify-between items-center text-xs text-rose-600 dark:text-rose-400">
                    <span className="font-bold">Descuento Comercial:</span>
                    <span className="font-mono font-bold">
                      - S/ {parseFloat(ventaSeleccionada.descuento).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 font-sora block">
                      Importe Total
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Comprobante Cancelado</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black font-sora tracking-tight text-indigo-700 dark:text-indigo-400">
                      S/ {parseFloat(ventaSeleccionada.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bottom Bar */}
            <div className="p-4 sm:p-4.5 bg-slate-50/90 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setMostrarModal(false)}
 className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-600 transition-all cursor-pointer shadow-xs active:scale-95 "
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => abrirTicketImpresion(ventaSeleccionada)}
 className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-xs active:scale-95 "
                >
                  <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Imprimir Ticket</span>
                </button>

                {!esCajero && ventaSeleccionada.estado === 'Completada' && (
                  <button
                    type="button"
                    onClick={() => abrirModalAnulacion(ventaSeleccionada)}
 className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-bold transition-all border border-rose-200/80 dark:border-rose-800 cursor-pointer shadow-xs active:scale-95 "
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Anular Venta / Retornar Stock</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL DE CONFIRMACIÓN DE ANULACIÓN DE VENTA (ESTILO BOTICAS) ─── */}
      {modalAnulacion && ventaAAnular && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !anulando) setModalAnulacion(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-auto cursor-default"
          >
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl border border-rose-100 dark:border-rose-900">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Anular Venta {ventaAAnular.serie ? `${ventaAAnular.serie}-${ventaAAnular.numero}` : ventaAAnular.numero}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Se revertirá el inventario a los almacenes y se marcará el comprobante como anulado.
                </p>
              </div>
            </div>

            <form onSubmit={confirmarAnulacion} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1.5">
                  Motivo de Anulación (Requerido por SUNAT / Auditoría) *
                </label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej: Devolución inmediata de material, error en emisión de comprobante, digitación..."
                  rows="3"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalAnulacion(false)}
                  disabled={anulando}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={anulando}
                  className="px-5 py-2 rounded-xl text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {anulando ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Confirmar Anulación</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── VISOR DE TICKET TÉRMICO (REIMPRESIÓN / WHATSAPP) ─── */}
      {mostrarTicket && ventaParaTicket && (
        <TicketImpresion
          isOpen={mostrarTicket}
          onClose={() => setMostrarTicket(false)}
          alCerrar={() => setMostrarTicket(false)}
          venta={ventaParaTicket}
        />
      )}
    </div>
  );
}
