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
  Pill,
  CheckCircle2,
  XCircle,
  Stethoscope,
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
  Smartphone,
  Banknote,
  Copy,
  Check,
  MapPin
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
  const [hashCopiado, setHashCopiado] = useState(false);

  // Estados para Anulación de Venta
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
        toast.success(res?.data?.message || res?.message || 'Venta anulada y stock devuelto exitosamente');
        setModalAnulacion(false);
        setMostrarModal(false);
        cargarVentas();
      } else {
        toast.error(res?.data?.message || res?.message || 'Error al anular la venta');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error al anular la venta');
    } finally {
      setAnulando(false);
    }
  };

  const cargarVentas = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/ventas?page=${pagina}&limit=25`);
      if (res?.data?.success) {
        setVentas(res.data.ventas || []);
        setTotalPaginas(res.data.paginas || 1);
      } else if (res?.success) {
        setVentas(res.ventas || []);
        setTotalPaginas(res.paginas || 1);
      } else if (res?.ventas) {
        setVentas(res.ventas);
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
      console.warn('Cargando ticket con datos locales:', err);
      setVentaParaTicket(venta);
      setMostrarTicket(true);
    }
  };

  const reenviarASunat = async (id) => {
    try {
      setReenviandoSunatId(id);
      toast.loading('Enviando comprobante a SUNAT...', { id: 'sunat-reenvio' });
      const res = await api.post(`/sunat/reenviar/${id}`);
      if (res?.data?.success || res?.success) {
        toast.success(res?.data?.message || res?.message || 'Comprobante procesado por SUNAT', { id: 'sunat-reenvio' });
        await cargarVentas();
        if (ventaSeleccionada && ventaSeleccionada.id === id) {
          verDetalle(id);
        }
      } else {
        toast.error(res?.data?.message || 'No se pudo emitir ante SUNAT', { id: 'sunat-reenvio' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error al conectar con SUNAT', { id: 'sunat-reenvio' });
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

  const copiarHash = (hash) => {
    if (!hash) return;
    navigator.clipboard?.writeText(hash);
    setHashCopiado(true);
    toast.success('Hash SHA-256 copiado al portapapeles');
    setTimeout(() => setHashCopiado(false), 2000);
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
      const numComp = String(v.numero_comprobante || '').toLowerCase();
      const clienteNombre = String(v.cliente?.nombre || '').toLowerCase();
      const clienteDoc = String(v.cliente?.numero_documento || '').toLowerCase();
      const medicoCmp = String(v.medico_cmp || '').toLowerCase();
      const tipoComprobante = String(v.tipo_comprobante || '').toLowerCase();
      const tipoPago = String(v.tipo_pago || '').toLowerCase();

      return (
        numCompleto.includes(q) ||
        numero.includes(q) ||
        numComp.includes(q) ||
        clienteNombre.includes(q) ||
        clienteDoc.includes(q) ||
        medicoCmp.includes(q) ||
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
      {/* ─── HEADER PRINCIPAL ELEGANTE Y COMPACTO ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 bg-white rounded-2xl py-3 px-4 sm:px-5 soft-card-shadow border border-[#D1F4E3]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] shrink-0">
            <Receipt className="w-4.5 h-4.5 text-[#00B884]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-800 tracking-tight font-sora">
                Historial de Ventas y Facturación
              </h1>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] shrink-0">
                <ShieldCheck className="w-3 h-3 text-[#00B884]" />
                UBL 2.1 SUNAT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              Trazabilidad tributaria de recetas y comprobantes, reimpresión térmica, descarga de PDF/XML/CDR y control DIGEMID.
            </p>
          </div>
        </div>

        {/* Acciones y Buscador */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {/* Buscador de comprobantes */}
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar N° comprobante, cliente, DNI, RUC..."
              className="w-full h-9 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl pl-9 pr-8 text-xs text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-[#00B884]/20 focus:border-[#00B884] font-medium transition-all"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full cursor-pointer z-10"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón Recargar */}
          <button
            type="button"
            onClick={cargarVentas}
            disabled={loading}
            className="h-9 px-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-all cursor-pointer shadow-2xs font-bold text-xs flex items-center gap-1.5 shrink-0"
            title="Actualizar listado de ventas"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#00B884]' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
        </div>
      </div>

      {/* ─── TARJETAS DE INDICADORES / KPIS (DISEÑO Y DIMENSIONES DASHBOARD) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 font-sora">
        {/* KPI 1: Total Dispensado */}
        <div 
          onClick={() => setFiltroTipo('Todos')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroTipo === 'Todos'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs shadow-emerald-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                Total Dispensado
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <Receipt className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate font-mono">
                S/ {kpis.totalFacturado.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Dispensaciones completadas
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora transition-colors ${
              filtroTipo === 'Todos'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
            }`}>
              {kpis.cantVentas} vta{kpis.cantVentas === 1 ? '' : 's'}
            </span>
          </div>
        </div>

        {/* KPI 2: Boletas de Venta */}
        <div 
          onClick={() => setFiltroTipo('Boleta')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroTipo === 'Boleta'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs shadow-emerald-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-[#00855E] dark:text-[#5EEBB8] font-sora truncate min-w-0 transition-colors">
                Boletas de Venta
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-[#00855E] dark:text-[#5EEBB8] font-sora tracking-tight truncate font-mono">
                S/ {kpis.totalBoletas.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              DNI / Consumidor final
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora transition-colors ${
              filtroTipo === 'Boleta'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
            }`}>
              {kpis.cantBoletas} emitidas
            </span>
          </div>
        </div>

        {/* KPI 3: Facturas Comerciales */}
        <div 
          onClick={() => setFiltroTipo('Factura')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroTipo === 'Factura'
              ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs shadow-blue-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-blue-500/50'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 font-sora truncate min-w-0 transition-colors">
                Facturas SUNAT
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <FileText className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-sora tracking-tight truncate font-mono">
                S/ {kpis.totalFacturas.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Crédito fiscal 18% IGV
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora transition-colors ${
              filtroTipo === 'Factura'
                ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50'
            }`}>
              {kpis.cantFacturas} con RUC
            </span>
          </div>
        </div>

        {/* KPI 4: Digitales vs Efectivo */}
        <div 
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 font-sora truncate min-w-0 transition-colors">
                Cobros Digitales
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <Smartphone className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-sora tracking-tight truncate font-mono">
                S/ {kpis.totalDigital.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Yape, Plin y POS
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/50 whitespace-nowrap font-sora">
              S/ {kpis.totalEfectivo.toFixed(2)} efec.
            </span>
          </div>
        </div>
      </div>

      {/* ─── BARRA DE FILTROS RÁPIDOS (RANGOS Y TIPO COMPROBANTE) ─── */}
      <div className="bg-white rounded-2xl py-2 px-3 sm:px-4 border border-[#D1F4E3] soft-card-shadow flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Filtro Rango de Tiempo */}
        <div className="flex items-center gap-1 overflow-x-auto custom-modal-scroll">
          <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
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
                  ? 'bg-[#00B884] text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Filtros Tipo Comprobante & Estado */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-200/60">
            {['Todos', 'Boleta', 'Factura', 'Ticket'].map((tipo) => (
              <button
                key={tipo}
                onClick={() => setFiltroTipo(tipo)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroTipo === tipo
                    ? 'bg-white text-[#00855E] shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tipo === 'Ticket' ? 'Nota Venta' : tipo}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded-xl border border-slate-200/60">
            {['Todos', 'Completada', 'Anulada'].map((est) => (
              <button
                key={est}
                onClick={() => setFiltroEstado(est)}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  filtroEstado === est
                    ? 'bg-white text-[#00855E] shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {est === 'Completada' ? 'Válidas' : est === 'Anulada' ? 'Anuladas' : est}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── TABLA PRINCIPAL DEL HISTORIAL DE VENTAS ─── */}
      <div className="bg-white rounded-2xl p-3 sm:p-5 soft-card-shadow border border-[#D1F4E3] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-100 text-slate-400 uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2.5">
                      <div className="w-7 h-7 border-3 border-[#00B884]/20 border-t-[#00B884] rounded-full animate-spin" />
                      <span className="text-xs font-bold text-slate-400">
                        Cargando historial de dispensación y facturación...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex flex-col items-center gap-2">
                      <Receipt className="w-8 h-8 text-slate-300" />
                      <span className="text-sm font-bold text-slate-600">
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
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* 1. Comprobante */}
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase inline-block mb-0.5 ${
                        v.tipo_comprobante === 'Factura'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : v.tipo_comprobante === 'Nota de Crédito' || v.tipo_comprobante === 'NotaCredito'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : v.tipo_comprobante === 'Ticket'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {v.tipo_comprobante === 'Ticket' ? 'Nota de Venta' : v.tipo_comprobante}
                      </span>
                      <span className="block text-xs text-slate-900 font-extrabold font-sora tracking-tight">
                        {v.numero_comprobante || (v.serie && v.numero ? `${v.serie}-${v.numero}` : v.numero)}
                      </span>
                    </td>

                    {/* 2. Fecha y Hora */}
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-[11px] leading-tight font-sora">
                        {formatearFecha(v)}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sora mt-0.5 leading-tight">
                        {formatearHora(v)}
                      </div>
                    </td>

                    {/* 3. Cliente */}
                    <td className="py-2.5 px-3 min-w-[130px] max-w-[220px]">
                      <div className="font-extrabold text-slate-800 text-xs truncate" title={v.cliente?.nombre || 'Público General'}>
                        {v.cliente?.nombre || 'Público General'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sora">
                        {v.cliente?.numero_documento || 'Sin doc.'}
                        {v.medico_cmp && <span className="text-blue-600 font-bold ml-1.5">• CMP: {v.medico_cmp}</span>}
                      </div>
                    </td>

                    {/* 4. Pago */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border inline-block font-sora ${
                        v.tipo_pago === 'Efectivo'
                          ? 'bg-[#EBFDF6] text-[#00855E] border-[#A6F6D8]'
                          : ['Yape', 'Plin'].includes(v.tipo_pago)
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : v.tipo_pago === 'Tarjeta'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {v.tipo_pago}
                      </span>
                    </td>

                    {/* 5. Total */}
                    <td className="py-2.5 px-3 font-extrabold text-slate-900 text-[13px] font-sora whitespace-nowrap">
                      S/ {parseFloat(v.total || 0).toFixed(2)}
                    </td>

                    {/* 6. Estado SUNAT */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {v.estado === 'Anulada' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          <Ban className="w-3 h-3 text-slate-500" />
                          Anulada
                        </span>
                      ) : v.sunat_estado === 'Aceptado' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200" title="Aceptado oficialmente por SUNAT">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          Aceptado
                        </span>
                      ) : v.sunat_estado === 'Rechazado' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200" title="Rechazado por SUNAT">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Rechazado
                        </span>
                      ) : (
                        <button
                          onClick={() => reenviarASunat(v.id)}
                          disabled={reenviandoSunatId === v.id}
                          className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200 transition-colors cursor-pointer"
                          title="Click para enviar a SUNAT"
                        >
                          <Clock className={`w-3 h-3 text-amber-600 ${reenviandoSunatId === v.id ? 'animate-spin' : ''}`} />
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
                              ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 cursor-pointer shadow-xs'
                              : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
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
                              ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 cursor-pointer shadow-xs'
                              : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
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
                              ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 cursor-pointer shadow-xs'
                              : 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
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
                        <button
                          onClick={() => abrirTicketImpresion(v)}
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors border border-emerald-200/60 shadow-xs cursor-pointer"
                          title="Imprimir Ticket Térmico 80mm"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => verDetalle(v.id)}
                          className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors border border-slate-200/80 shadow-xs cursor-pointer"
                          title="Ver Detalle y Trazabilidad Fiscal"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                        {!esCajero && v.estado === 'Completada' && (
                          <button
                            onClick={() => abrirModalAnulacion(v)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition-colors border border-rose-200/60 shadow-xs cursor-pointer"
                            title="Anular Venta / Generar Nota de Crédito (Solo Administrador/QF)"
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

        {/* Paginación */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Mostrando <strong>{ventasFiltradas.length}</strong> comprobantes (Página {pagina} de {totalPaginas})
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1 || loading}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold shadow-xs transition-colors cursor-pointer"
            >
              Anterior
            </button>
            <button
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas || loading}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold shadow-xs transition-colors cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* ─── MODAL DE DETALLE Y TRAZABILIDAD FISCAL (REDISEÑO PREMIUM BOTICA HEIS) ─── */}
      {mostrarModal && ventaSeleccionada && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setMostrarModal(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-[#D1F4E3] rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 my-auto cursor-default flex flex-col max-h-[92vh]"
          >
            {/* Modal Header Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2.5 rounded-2xl bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] shrink-0 shadow-2xs">
                  <Receipt className="w-5 h-5 text-[#00B884]" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-black text-slate-800 font-sora tracking-tight truncate">
                      Detalle y Trazabilidad del Comprobante
                    </h2>
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] shrink-0">
                      <ShieldCheck className="w-3 h-3 text-[#00B884]" />
                      UBL 2.1 SUNAT
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium truncate">
                    Auditoría tributaria, verificación de firma digital y control DIGEMID de lotes
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => abrirTicketImpresion(ventaSeleccionada)}
                  className="h-9 px-3 rounded-xl bg-white hover:bg-[#EBFDF6] text-slate-700 hover:text-[#00855E] border border-slate-200 hover:border-[#A6F6D8] transition-all cursor-pointer shadow-2xs font-bold text-xs flex items-center gap-1.5"
                  title="Imprimir Ticket Térmico 80mm"
                >
                  <Printer className="w-3.5 h-3.5 text-[#00B884]" />
                  <span className="hidden sm:inline">Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group"
                  title="Cerrar ventana (Esc)"
                >
                  <X className="w-4 h-4 text-slate-600 group-hover:text-rose-600 transition-transform duration-150 group-hover:rotate-90" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 overflow-y-auto custom-modal-scroll flex-1">
              {/* 1. BLOQUE FISCAL SUNAT UBL 2.1 (TEMA DÍA / LIGHT PREMIUM) */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#EBFDF6]/60 via-white to-[#F0FDF8] p-4 sm:p-5 border border-[#A6F6D8] soft-card-shadow">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00B884]/10 rounded-full blur-2xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#D1F4E3]">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] shadow-2xs font-sora">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#00B884]" />
                        SUNAT UBL 2.1 • Facturación Electrónica
                      </span>
                      {ventaSeleccionada.estado === 'Anulada' && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-sora">
                          ANULADO
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-black font-sora tracking-tight text-slate-800 flex items-center gap-2">
                      <span>{ventaSeleccionada.tipo_comprobante?.toUpperCase() || 'COMPROBANTE'}</span>
                      <span className="text-[#00855E] font-mono font-bold">
                        {ventaSeleccionada.serie ? `${ventaSeleccionada.serie}-${ventaSeleccionada.numero}` : ventaSeleccionada.numero}
                      </span>
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] font-black px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-2xs font-sora ${
                      ventaSeleccionada.sunat_estado === 'Aceptado'
                        ? 'bg-[#EBFDF6] text-[#00855E] border-[#A6F6D8]'
                        : ventaSeleccionada.sunat_estado === 'Rechazado'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-800 border-amber-200'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        ventaSeleccionada.sunat_estado === 'Aceptado'
                          ? 'bg-[#00B884] animate-pulse'
                          : ventaSeleccionada.sunat_estado === 'Rechazado'
                          ? 'bg-rose-500'
                          : 'bg-amber-500 animate-pulse'
                      }`} />
                      {ventaSeleccionada.sunat_estado === 'Aceptado'
                        ? 'Aceptado por SUNAT'
                        : ventaSeleccionada.sunat_estado === 'Rechazado'
                        ? 'Rechazado por SUNAT'
                        : 'Pendiente de Sincronización'}
                    </span>
                  </div>
                </div>

                {/* Hash SHA-256 DigestValue */}
                {ventaSeleccionada.sunat_hash && (
                  <div className="mt-3 text-[11px] bg-white p-2.5 rounded-xl border border-[#D1F4E3] flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold font-sora">
                        Hash SHA-256 (Firma Digital / DigestValue):
                      </span>
                      <span className="font-mono text-slate-700 text-[10.5px] break-all select-all font-semibold">
                        {ventaSeleccionada.sunat_hash}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copiarHash(ventaSeleccionada.sunat_hash)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-[#EBFDF6] text-slate-500 hover:text-[#00855E] border border-slate-200 hover:border-[#A6F6D8] transition-all cursor-pointer shrink-0 shadow-2xs"
                      title="Copiar Hash SHA-256"
                    >
                      {hashCopiado ? <Check className="w-3.5 h-3.5 text-[#00B884]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}

                {/* Acciones de Descarga Oficiales SUNAT en Tema Día */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => abrirEnlace(ventaSeleccionada.enlace_pdf, 'PDF')}
                    disabled={!ventaSeleccionada.enlace_pdf}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all border font-sora ${
                      ventaSeleccionada.enlace_pdf
                        ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs active:scale-95 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ver PDF Oficial</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirEnlace(ventaSeleccionada.enlace_xml, 'XML')}
                    disabled={!ventaSeleccionada.enlace_xml}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all border font-sora ${
                      ventaSeleccionada.enlace_xml
                        ? 'bg-[#EBFDF6] hover:bg-emerald-100/70 text-[#00855E] border-[#A6F6D8] shadow-2xs active:scale-95 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 text-[#00B884]" />
                    <span>XML Firmado UBL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => abrirEnlace(ventaSeleccionada.enlace_cdr, 'CDR')}
                    disabled={!ventaSeleccionada.enlace_cdr}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all border font-sora ${
                      ventaSeleccionada.enlace_cdr
                        ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 shadow-2xs active:scale-95 cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                    <span>CDR (Constancia ZIP)</span>
                  </button>
                </div>

                {ventaSeleccionada.sunat_estado !== 'Aceptado' && ventaSeleccionada.estado !== 'Anulada' && (
                  <button
                    type="button"
                    onClick={() => reenviarASunat(ventaSeleccionada.id)}
                    disabled={reenviandoSunatId === ventaSeleccionada.id}
                    className="w-full mt-3 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs active:scale-95 font-sora"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reenviandoSunatId === ventaSeleccionada.id ? 'animate-spin text-amber-700' : 'text-amber-700'}`} />
                    <span>{reenviandoSunatId === ventaSeleccionada.id ? 'Sincronizando con Servidores SUNAT...' : 'Reenviar / Sincronizar Comprobante con SUNAT'}</span>
                  </button>
                )}
              </div>

              {/* 2. GRID DE DATOS: CLIENTE, EMISIÓN Y MÉTODO DE PAGO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Tarjeta A: Paciente / Cliente */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sora flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#00B884]" />
                      Datos del Paciente / Cliente
                    </span>
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-sora">
                      {ventaSeleccionada.cliente?.tipo_documento || (ventaSeleccionada.tipo_comprobante === 'Factura' ? 'RUC' : 'DNI')}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 font-sora">
                      {ventaSeleccionada.cliente?.nombre || 'CLIENTE GENERAL / VENTAS VARIAS'}
                    </h4>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      {ventaSeleccionada.cliente?.numero_documento
                        ? `N° Doc: ${ventaSeleccionada.cliente.numero_documento}`
                        : 'Sin documento de identidad registrado'}
                    </p>
                  </div>
                  {ventaSeleccionada.cliente?.direccion && (
                    <p className="text-[11px] text-slate-500 flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate">{ventaSeleccionada.cliente.direccion}</span>
                    </p>
                  )}
                  {/* Receta Médica / CMP */}
                  {(ventaSeleccionada.medico_cmp || ventaSeleccionada.numero_receta || ventaSeleccionada.medico_nombre) && (
                    <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-blue-700 font-semibold bg-blue-50/70 p-2 rounded-xl border border-blue-200/60">
                      <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
                      <div className="min-w-0 text-[11px]">
                        <span className="font-bold">Prescripción Médica: </span>
                        {ventaSeleccionada.medico_nombre && <span>{ventaSeleccionada.medico_nombre} </span>}
                        {ventaSeleccionada.medico_cmp && <span>(CMP: {ventaSeleccionada.medico_cmp}) </span>}
                        {ventaSeleccionada.numero_receta && <span>• Receta N° {ventaSeleccionada.numero_receta}</span>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tarjeta B: Emisión & Modalidad de Cobro */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sora flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#00B884]" />
                      Emisión & Modalidad de Pago
                    </span>
                    <span className="text-[9.5px] font-black px-2 py-0.5 rounded-full bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] font-sora">
                      {ventaSeleccionada.tipo_pago || 'Efectivo'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold font-sora">Fecha de Emisión:</span>
                      <span className="font-mono text-slate-800 font-bold">
                        {formatearFecha(ventaSeleccionada)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold font-sora">Hora:</span>
                      <span className="font-mono text-slate-800 font-bold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formatearHora(ventaSeleccionada) || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold font-sora">Dispensado por:</span>
                      <span className="text-slate-800 font-bold truncate block">
                        {ventaSeleccionada.usuario?.nombre || 'Cajero / Q.F.'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold font-sora">Estado Operativo:</span>
                      <span className={`text-[10.5px] font-black px-2 py-0.5 rounded-md inline-block font-sora ${
                        ventaSeleccionada.estado === 'Completada'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {ventaSeleccionada.estado || 'Completada'}
                      </span>
                    </div>
                  </div>

                  {/* Detalle de Pago Mixto / Operación */}
                  {ventaSeleccionada.tipo_pago === 'Mixto' ? (
                    <div className="pt-2 border-t border-slate-100 text-[11px] grid grid-cols-2 gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                      <div>
                        <span className="text-slate-400">Efectivo: </span>
                        <b className="font-mono text-slate-800">S/ {parseFloat(ventaSeleccionada.monto_efectivo || 0).toFixed(2)}</b>
                      </div>
                      <div>
                        <span className="text-slate-400">Digital: </span>
                        <b className="font-mono text-slate-800">S/ {parseFloat(ventaSeleccionada.monto_digital || 0).toFixed(2)}</b>
                      </div>
                      {ventaSeleccionada.numero_operacion && (
                        <div className="col-span-2 text-[10px] text-slate-500 font-mono">
                          N° Op: {ventaSeleccionada.numero_operacion}
                        </div>
                      )}
                    </div>
                  ) : ventaSeleccionada.numero_operacion ? (
                    <div className="text-[10.5px] text-slate-500 font-mono bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                      N° Operación / Referencia: <b className="text-slate-700">{ventaSeleccionada.numero_operacion}</b>
                    </div>
                  ) : null}
                </div>
              </div>

              {/* 3. TABLA DE MEDICAMENTOS Y TRAZABILIDAD DE LOTES */}
              <div className="rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs bg-white">
                <div className="p-3 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 font-sora flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-[#00B884]" />
                    Medicamentos Dispensados & Trazabilidad de Lotes ({ventaSeleccionada.detalles?.length || 0})
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-sora">
                    Control FEFO / DIGEMID
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 font-sora">
                        <th className="py-2.5 px-3.5">Medicamento / Principio Activo</th>
                        <th className="py-2.5 px-3">Lote & Vencimiento</th>
                        <th className="py-2.5 px-3 text-center">Formato</th>
                        <th className="py-2.5 px-3 text-center">Cant.</th>
                        <th className="py-2.5 px-3 text-right">P. Unit.</th>
                        <th className="py-2.5 px-3.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ventaSeleccionada.detalles?.map((det, idx) => {
                        const esFraccion = det.tipo_dispensacion === 'Fraccion' || det.formato_venta === 'Fraccion';
                        return (
                          <tr key={idx} className="hover:bg-[#EBFDF6]/40 transition-colors">
                            <td className="py-2.5 px-3.5">
                              <p className="font-bold text-slate-900 font-sora">
                                {det.medicamento?.nombre_comercial || 'Medicamento'}
                              </p>
                              {(det.medicamento?.principio_activo || det.medicamento?.concentracion) && (
                                <p className="text-[10px] text-slate-400 font-medium truncate max-w-xs">
                                  {det.medicamento?.principio_activo} {det.medicamento?.concentracion}
                                </p>
                              )}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-[10.5px] font-bold text-slate-700">
                                  Lt: {det.lote?.numero_lote || 'N/A'}
                                </span>
                                <span className="text-[9.5px] font-medium text-slate-400 font-mono">
                                  Venc: {det.lote?.fecha_vencimiento || 'N/A'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center whitespace-nowrap">
                              <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full border ${
                                esFraccion
                                  ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                                  : 'bg-blue-50 text-blue-700 border-blue-200/80'
                              }`}>
                                {esFraccion ? 'Pastilla / Fracción' : 'Caja Completa'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-black font-sora text-slate-800">
                              {det.cantidad}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              S/ {parseFloat(det.precio_unitario || 0).toFixed(2)}
                            </td>
                            <td className="py-2.5 px-3.5 text-right font-black font-sora text-slate-900">
                              S/ {parseFloat(det.subtotal || 0).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 4. TOTALES Y DESGLOSE TRIBUTARIO */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p className="font-bold text-slate-700 flex items-center gap-1.5 font-sora">
                    <ShieldCheck className="w-4 h-4 text-[#00B884]" />
                    Liquidación Tributaria SUNAT
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Precios expresados en Soles (PEN) con IGV (18%) incluido según ley peruana.
                  </p>
                </div>

                <div className="w-full sm:w-64 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Op. Gravada (Subtotal):</span>
                    <span className="font-mono font-bold text-slate-700">
                      S/ {parseFloat(ventaSeleccionada.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>I.G.V. (18%):</span>
                    <span className="font-mono font-bold text-slate-700">
                      S/ {parseFloat(ventaSeleccionada.igv || 0).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(ventaSeleccionada.descuento || 0) > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Descuento Aplicado:</span>
                      <span className="font-mono font-bold">
                        -S/ {parseFloat(ventaSeleccionada.descuento).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                    <span className="font-black text-slate-900 font-sora text-sm">
                      TOTAL DISPENSADO:
                    </span>
                    <span className="text-xl font-black text-[#00855E] font-sora tracking-tight">
                      S/ {parseFloat(ventaSeleccionada.total || 0).toFixed(2)}
                    </span>
                  </div>
                  {parseFloat(ventaSeleccionada.vuelto || 0) > 0 && (
                    <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Vuelto Entregado:</span>
                      <span className="font-mono font-bold text-slate-600">
                        S/ {parseFloat(ventaSeleccionada.vuelto).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Bottom Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <ShieldCheck className="w-4 h-4 text-[#00B884] shrink-0" />
                <span>Documento emitido conforme a la R.S. 097-2012/SUNAT y normas DIGEMID.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={() => abrirTicketImpresion(ventaSeleccionada)}
                  className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-[#EBFDF6] hover:text-[#00855E] hover:border-[#A6F6D8] transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-[#00B884]" />
                  <span>Imprimir Ticket</span>
                </button>

                {!esCajero && ventaSeleccionada.estado === 'Completada' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMostrarModal(false);
                      abrirModalAnulacion(ventaSeleccionada);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200 cursor-pointer shadow-2xs"
                    title="Anular venta y emitir Nota de Crédito"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Anular Venta</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL DE CONFIRMACIÓN DE ANULACIÓN DE VENTA */}
      {modalAnulacion && ventaAAnular && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !anulando) setModalAnulacion(false);
          }}
          className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 my-auto cursor-default"
          >
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Anular Venta {ventaAAnular.numero}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Se emitirá una Nota de Crédito electrónica y se restaurará el stock.
                </p>
              </div>
            </div>

            <form onSubmit={confirmarAnulacion} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  Motivo de Anulación (Requerido por DIGEMID / SUNAT) *
                </label>
                <textarea
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej: Error en digitación del paciente, devolución inmediata del producto..."
                  rows="3"
                  required
                  className="w-full bg-slate-50 focus:bg-white text-xs text-slate-800 p-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                ></textarea>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalAnulacion(false)}
                  disabled={anulando}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
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

      {/* Visor de Ticket Térmico */}
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
