import React, { useState, useEffect } from 'react';
import api from './api';
import {
  Truck,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  PlusCircle,
  Edit2,
  Trash2,
  Eye,
  X,
  AlertCircle,
  Receipt,
  CheckCircle2,
  Package,
  ShieldCheck,
  RotateCcw,
  ArrowLeftRight,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import DropdownPill from './components/DropdownPill';
import ModalRegistrarDrogueria from './components/ModalRegistrarDrogueria';

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroDeuda, setFiltroDeuda] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Modales
  const [modalFormulario, setModalFormulario] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(false);
  const [proveedorDetalle, setProveedorDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // Devoluciones a Proveedor
  const [modalDevolucion, setModalDevolucion] = useState(false);
  const [proveedorDevolucion, setProveedorDevolucion] = useState(null);
  const [itemsDevolucion, setItemsDevolucion] = useState([{ id_medicamento: '', nombre: '', cantidad: 1, precio_unitario: 0 }]);
  const [motivoDevolucion, setMotivoDevolucion] = useState('Producto Vencido');
  const [observacionesDevolucion, setObservacionesDevolucion] = useState('');
  const [enviandoDevolucion, setEnviandoDevolucion] = useState(false);
  const [totalDevoluciones, setTotalDevoluciones] = useState(0);

  const MOTIVOS_DEVOLUCION = [
    'Producto Vencido',
    'Producto Dañado o Deteriorado',
    'Error en Pedido (Producto Incorrecto)',
    'Recall / Alerta DIGEMID',
    'Temperatura de Cadena de Frío Incumplida',
    'Sobrante de Stock por Pedido Excesivo',
    'Producto Falsificado o Adulterado',
    'Otro'
  ];


  const cargarProveedores = async () => {
    try {
      setLoading(true);
      const [resP, resDev] = await Promise.all([
        api.get('/proveedores', {
          params: {
            busqueda: busqueda.trim() || undefined,
            con_deuda: filtroDeuda ? 'true' : undefined,
            page: pagina,
            limit: 20
          }
        }),
        api.get('/devoluciones-proveedor').catch(() => ({ data: { devoluciones: [] } }))
      ]);
      if (resP.data?.success) {
        setProveedores(resP.data.proveedores || []);
        setTotalPaginas(resP.data.paginas || 1);
      }
      setTotalDevoluciones((resDev.data?.devoluciones || []).length);
    } catch (err) {
      toast.error('Error al cargar droguerías y proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarProveedores();
  }, [pagina, filtroDeuda]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      cargarProveedores();
    }, 350);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const abrirNuevoProveedor = () => {
    setProveedorEditando(null);
    setModalFormulario(true);
  };

  const abrirEditarProveedor = (p) => {
    setProveedorEditando(p);
    setModalFormulario(true);
  };

  const verFichaProveedor = async (id) => {
    try {
      setCargandoDetalle(true);
      setModalDetalle(true);
      const res = await api.get(`/proveedores/${id}`);
      if (res.data?.success) {
        setProveedorDetalle(res.data.proveedor);
      }
    } catch (err) {
      toast.error('No se pudo cargar el historial de la droguería');
      setModalDetalle(false);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const eliminarProveedor = async (id, razonSocial) => {
    if (!window.confirm(`¿Estás seguro de desactivar a "${razonSocial}"?`)) return;
    try {
      await api.delete(`/proveedores/${id}`);
      toast.success('Proveedor desactivado');
      cargarProveedores();
    } catch (err) {
      toast.error(err.response?.data?.message || 'No se pudo desactivar el proveedor');
    }
  };

  // KPIs
  const totalProveedores = proveedores.length;
  const conDeuda = proveedores.filter(p => p.tiene_deuda).length;
  const deudaTotal = proveedores.reduce((acc, p) => acc + (parseFloat(p.deuda_total) || 0), 0);
  const alDia = Math.max(0, totalProveedores - conDeuda);

  return (
    <div className="space-y-6 max-w-[1700px] w-full mx-auto">
      {/* ─── 1. ENCABEZADO PRINCIPAL (PÍLDORA SISTEMA BOTICA) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sora">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
            <Truck className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                Droguerías y Laboratorios Proveedores
              </h2>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                Directorio RUC & DIGEMID
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              Gestión de distribuidores farmacéuticos, RUC y cuentas por pagar a proveedores.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={abrirNuevoProveedor}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-500/25 hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0 font-sora"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Registrar Droguería</span>
        </button>
      </div>

      {/* ─── 2. TARJETAS KPI (DISEÑO Y DIMENSIONES IDÉNTICAS AL DASHBOARD) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-3.5 font-sora">
        {/* KPI 1: Droguerías Activas */}
        <div
          onClick={() => setFiltroDeuda(false)}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            !filtroDeuda
              ? 'border border-[#00B884] dark:border-[#10E599] bg-[#EBFDF6]/40 dark:bg-emerald-950/25 shadow-xs shadow-emerald-500/10 -translate-y-0.5'
              : 'border border-[#D1F4E3] dark:border-slate-800 hover:border-[#00B884] dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-[#00B884]/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
          }`}
          title="Ver todas las droguerías registradas"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#00B884]/5 rounded-full blur-xl pointer-events-none group-hover:bg-[#00B884]/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-[#00855E] dark:group-hover:text-[#5EEBB8] transition-colors font-sora truncate min-w-0">
                Droguerías Activas
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00B884] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-[#00B884] group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-[#00B884]/25 transition-all duration-200">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 font-sora tracking-tight truncate">
              {totalProveedores}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 min-w-0 truncate text-[11px] sm:text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00B884] dark:text-[#5EEBB8] shrink-0" />
              <span className="truncate">Distribuidores activos</span>
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-[#00855E] dark:text-[#5EEBB8] bg-[#EBFDF6] dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-[#A6F6D8] dark:border-emerald-800/60 flex items-center gap-1 font-sora shrink-0 whitespace-nowrap">
              {!filtroDeuda && <span className="w-1.5 h-1.5 rounded-full bg-[#00B884] animate-pulse shrink-0"></span>}
              {!filtroDeuda ? 'En catálogo' : 'Ver todas'}
            </span>
          </div>
        </div>

        {/* KPI 2: Facturas Pendientes (Con Saldo) */}
        <div
          onClick={() => setFiltroDeuda(prev => !prev)}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroDeuda
              ? 'border border-amber-400 dark:border-amber-500 bg-amber-50/30 dark:bg-amber-950/25 shadow-xs shadow-amber-500/10 -translate-y-0.5'
              : 'border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
          }`}
          title="Filtrar droguerías con facturas pendientes de pago"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors font-sora truncate min-w-0">
                Facturas Pendientes
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/20 transition-all duration-200">
                <AlertCircle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-sora tracking-tight truncate">
              {conDeuda} <span className="text-xs font-semibold text-amber-700/80 dark:text-amber-300/80 font-sora">{conDeuda === 1 ? 'droguería' : 'droguerías'}</span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Por pagar a laboratorios
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/60 flex items-center gap-1 font-sora shrink-0 whitespace-nowrap">
              {filtroDeuda && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>}
              {filtroDeuda ? 'Filtrando' : `${conDeuda} con saldo`}
            </span>
          </div>
        </div>

        {/* KPI 3: Deuda por Liquidar */}
        <div
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/80 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-rose-700 dark:group-hover:text-rose-400 transition-colors font-sora truncate min-w-0">
                Deuda por Liquidar
              </span>
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center shrink-0 group-hover:bg-rose-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-rose-500/20 transition-all duration-200">
                <CreditCard className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-sora tracking-tight truncate">
              S/ {(parseFloat(deudaTotal) || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Compromiso a crédito
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-800/60 font-sora shrink-0 whitespace-nowrap">
              Por pagar
            </span>
          </div>
        </div>

        {/* KPI 4: Cuentas Saneadas */}
        <div
          onClick={() => setFiltroDeuda(false)}
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-[#D1F4E3] dark:border-slate-800 hover:border-teal-400 dark:hover:border-teal-500 shadow-2xs hover:shadow-md hover:shadow-teal-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none"
          title="Droguerías al día sin deudas"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-teal-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-teal-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors font-sora truncate min-w-0">
                Cuentas Saneadas
              </span>
              <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-100/80 dark:border-teal-800/60 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-teal-500/20 transition-all duration-200">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-teal-700 dark:text-teal-400 font-sora tracking-tight truncate">
              {alDia} <span className="text-xs font-semibold text-slate-400 font-sora">/ {totalProveedores}</span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Al día sin deudas
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full border border-teal-200/60 dark:border-teal-800/60 font-sora shrink-0 whitespace-nowrap">
              {totalProveedores > 0 ? Math.round((alDia / totalProveedores) * 100) : 100}% saneadas
            </span>
          </div>
        </div>

        {/* KPI 5: Devoluciones a Laboratorio */}
        <div
          onClick={() => { if (proveedores.length > 0) { setProveedorDevolucion(proveedores[0]); setModalDevolucion(true); } }}
          role="button"
          tabIndex={0}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-[#D1F4E3] dark:border-slate-800 hover:border-violet-400 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none"
          title="Registrar devolución de medicamentos a laboratorio"
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors font-sora truncate min-w-0">
                Devoluciones DIGEMID
              </span>
              <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-500/20 transition-all duration-200">
                <RotateCcw className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-violet-700 dark:text-violet-400 font-sora tracking-tight truncate">
              {totalDevoluciones}
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
              Canjes y mermas
            </span>
            <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-800 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/60 dark:border-violet-800/60 flex items-center gap-1 font-sora shrink-0 whitespace-nowrap">
              <ArrowLeftRight className="w-2.5 h-2.5 shrink-0" />
              + Nueva Dev.
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. BARRA DE BÚSQUEDA Y FILTROS ─── */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-[#D1F4E3] dark:border-slate-800 soft-card-shadow flex flex-col sm:flex-row items-center justify-between gap-3 font-sora">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por RUC, Droguería o contacto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-3.5 py-1.5 bg-[#F8FCFA] dark:bg-slate-950 border border-[#D1F4E3] dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#00855E] focus:ring-1 focus:ring-[#00855E]/30 font-sora transition-all shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setFiltroDeuda(!filtroDeuda)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer font-sora flex items-center gap-1.5 ${
              filtroDeuda
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs ring-1 ring-amber-500'
                : 'bg-white hover:bg-[#F8FCFA] text-slate-700 dark:bg-slate-800 dark:text-slate-200 border-[#D1F4E3] dark:border-slate-700 shadow-2xs'
            }`}
          >
            <span>{filtroDeuda ? '✓ Mostrando Solo Con Deuda' : 'Filtrar Facturas por Pagar'}</span>
          </button>
        </div>
      </div>

      {/* ─── 4. TABLA DE PROVEEDORES ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#D1F4E3] dark:border-slate-800 soft-card-shadow overflow-hidden font-sora">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sora">
            <thead className="bg-[#F8FCFA] dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-[#D1F4E3] dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Droguería / Laboratorio</th>
                <th className="py-3 px-4">RUC</th>
                <th className="py-3 px-4">Contacto & Teléfono</th>
                <th className="py-3 px-4">Dirección Fiscal</th>
                <th className="py-3 px-4">Estado de Cuenta</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                    Cargando catálogo de droguerías...
                  </td>
                </tr>
              ) : proveedores.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                    No se encontraron proveedores registrados.
                  </td>
                </tr>
              ) : (
                proveedores.map((p) => {
                  const tieneDeuda = parseFloat(p.deuda_total || 0) > 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-black flex items-center justify-center text-xs shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-extrabold text-slate-800 leading-snug">{p.razon_social}</p>
                            {p.contacto && (
                              <p className="text-[10px] text-slate-400">
                                Contacto: {p.contacto}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {p.numero_documento}
                      </td>

                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-[11px]">
                          {p.telefono ? (
                            <div className="flex items-center gap-1 text-slate-600">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{p.telefono}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Sin teléfono</span>
                          )}
                          {p.email && (
                            <div className="flex items-center gap-1 text-slate-400 text-[10px]">
                              <Mail className="w-3 h-3" />
                              <span className="truncate max-w-[150px]">{p.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate">
                        {p.direccion || '—'}
                      </td>

                      <td className="py-3 px-4">
                        {tieneDeuda ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 font-extrabold text-[11px] border border-rose-200/60">
                            Por pagar: S/ {parseFloat(p.deuda_total).toFixed(2)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-[11px]">
                            Al día
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => verFichaProveedor(p.id)}
                            title="Ver facturas y compras históricas"
                            className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => abrirEditarProveedor(p)}
                            title="Editar datos"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => eliminarProveedor(p.id, p.razon_social)}
                            title="Desactivar"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
          <div className="p-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-semibold bg-slate-50/50">
            <span>Página {pagina} de {totalPaginas}</span>
            <div className="flex gap-1.5">
              <button
                disabled={pagina === 1}
                onClick={() => setPagina(pagina - 1)}
                className="px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Anterior
              </button>
              <button
                disabled={pagina === totalPaginas}
                onClick={() => setPagina(pagina + 1)}
                className="px-3 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 cursor-pointer"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── MODAL NUEVO / EDITAR PROVEEDOR ─── */}
      <ModalRegistrarDrogueria
        isOpen={modalFormulario}
        onClose={() => setModalFormulario(false)}
        proveedorEditando={proveedorEditando}
        onSuccess={() => cargarProveedores()}
      />

      {/* ─── MODAL DETALLE DE DROGUERÍA ─── */}
      {modalDetalle && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar relative">
            <button
              type="button"
              onClick={() => setModalDetalle(false)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200/90 hover:border-rose-500 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group absolute right-5 top-5"
              title="Cerrar ventana (Esc)"
            >
              <X className="w-4 h-4 stroke-[2.5] text-rose-600 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
            </button>

            {cargandoDetalle || !proveedorDetalle ? (
              <div className="py-12 text-center text-slate-400 font-semibold">
                Cargando cuenta de droguería...
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-start gap-3.5 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-black text-slate-900">{proveedorDetalle.razon_social}</h3>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-bold text-slate-700">RUC: {proveedorDetalle.numero_documento}</span>
                      {proveedorDetalle.contacto && <span>• Contacto: {proveedorDetalle.contacto}</span>}
                      {proveedorDetalle.telefono && <span>• Telf: {proveedorDetalle.telefono}</span>}
                    </div>
                  </div>
                </div>

                {/* Resumen Deuda */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase">Saldo Pendiente por Pagar</p>
                    <p className="text-2xl font-black text-rose-600">S/ {(parseFloat(proveedorDetalle.deuda_total) || 0).toFixed(2)}</p>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p className="font-bold">Facturas registradas: {(proveedorDetalle.compras || []).length}</p>
                    <p className="text-slate-400 text-[11px]">{proveedorDetalle.direccion || 'Sin dirección fiscal'}</p>
                  </div>
                </div>

                {/* Cuentas por Pagar (Facturas con crédito) */}
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-700 mb-2.5 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-rose-500" />
                    Facturas de Compra por Liquidar
                  </h4>
                  {(!proveedorDetalle.cuentas_pagar || proveedorDetalle.cuentas_pagar.length === 0) ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl">
                      No hay facturas por pagar pendientes con esta droguería.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {proveedorDetalle.cuentas_pagar.map((cp) => (
                        <div key={cp.id} className="p-3 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-extrabold text-slate-800">Factura Compra #{cp.id_compra}</span>
                            <span className="text-slate-400 text-[10px] ml-2">Vence: {cp.fecha_vencimiento}</span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              Total Facturado: S/ {parseFloat(cp.monto_total).toFixed(2)} • Estado: {cp.estado}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                              Pendiente: S/ {parseFloat(cp.saldo_pendiente).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Historial de Compras Recientes */}
                <div>
                  <h4 className="text-xs font-black uppercase text-slate-700 mb-2.5 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-emerald-600" />
                    Últimas Compras Farmacéuticas Recibidas
                  </h4>
                  {(!proveedorDetalle.compras || proveedorDetalle.compras.length === 0) ? (
                    <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-2xl">
                      No se registran compras previas a este proveedor.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {proveedorDetalle.compras.map((c) => (
                        <div key={c.id} className="p-3 rounded-2xl border border-slate-100 bg-white flex items-center justify-between text-xs">
                          <div>
                            <span className="font-black text-slate-800">{c.serie}-{c.numero}</span>
                            <span className="text-[10px] text-slate-400 ml-2">
                              {new Date(c.created_at).toLocaleDateString('es-PE')}
                            </span>
                            <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                              {(c.detalles || []).map(d => d.medicamento?.nombre_comercial).filter(Boolean).join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-slate-900">S/ {parseFloat(c.total).toFixed(2)}</span>
                            <p className="text-[10px] text-slate-400 uppercase font-bold">{c.tipo_pago}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setModalDetalle(false)}
                    className="px-5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition-colors"
                  >
                    Cerrar Ficha
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL: NUEVA DEVOLUCIÓN A PROVEEDOR ─── */}
      {modalDevolucion && proveedorDevolucion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}>
          <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header del modal */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-violet-50 to-white flex items-start justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center border border-violet-200">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Nueva Devolución a Proveedor</h3>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">Registro con trazabilidad DIGEMID · Kardex automático</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDevolucion(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 hover:bg-rose-500 text-rose-600 hover:text-white border border-rose-200/90 hover:border-rose-500 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 stroke-[2.5] text-rose-600 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Selector de proveedor */}
              <div>
                <DropdownPill
                  label="Droguería / Proveedor"
                  value={proveedorDevolucion?.id ? String(proveedorDevolucion.id) : ''}
                  onChange={(val) => setProveedorDevolucion(proveedores.find(p => String(p.id) === String(val)))}
                  options={proveedores.map(p => ({
                    value: String(p.id),
                    label: p.razon_social,
                    subtitle: `RUC: ${p.numero_documento}`
                  }))}
                  icon={Building2}
                  placeholder="Seleccionar droguería..."
                  searchPlaceholder="Buscar droguería por razón social..."
                />
              </div>

              {/* Motivo */}
              <div>
                <DropdownPill
                  label="Motivo de Devolución"
                  value={motivoDevolucion}
                  onChange={(val) => setMotivoDevolucion(val)}
                  options={MOTIVOS_DEVOLUCION.map(m => ({ value: m, label: m }))}
                  icon={RotateCcw}
                  placeholder="Seleccionar motivo..."
                />
              </div>

              {/* Ítems */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-700 uppercase tracking-wider">Productos a Devolver</label>
                  <button
                    onClick={() => setItemsDevolucion(prev => [...prev, { id_medicamento: '', nombre: '', cantidad: 1, precio_unitario: 0 }])}
                    className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Agregar producto
                  </button>
                </div>
                <div className="space-y-2.5">
                  {itemsDevolucion.map((item, idx) => (
                    <div key={idx} className="relative bg-slate-50 border border-slate-200 rounded-2xl p-3.5 group">
                      <span className="absolute top-2 right-2 text-4xl opacity-[0.04] select-none pointer-events-none group-hover:opacity-[0.07] transition-opacity">📦</span>
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">ID Medicamento</p>
                          <input
                            type="number"
                            placeholder="ID del producto"
                            value={item.id_medicamento}
                            onChange={e => setItemsDevolucion(prev => prev.map((it, i) => i === idx ? { ...it, id_medicamento: e.target.value } : it))}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-violet-400 transition-all"
                          />
                        </div>
                        <div className="col-span-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Cantidad</p>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={e => setItemsDevolucion(prev => prev.map((it, i) => i === idx ? { ...it, cantidad: parseFloat(e.target.value) || 1 } : it))}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-violet-400 transition-all"
                          />
                        </div>
                        <div className="col-span-3">
                          <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">P. Compra (S/)</p>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.precio_unitario}
                            onChange={e => setItemsDevolucion(prev => prev.map((it, i) => i === idx ? { ...it, precio_unitario: parseFloat(e.target.value) || 0 } : it))}
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold bg-white focus:outline-none focus:border-violet-400 transition-all"
                          />
                        </div>
                        <div className="col-span-1 flex items-end justify-center pb-0.5">
                          {itemsDevolucion.length > 1 && (
                            <button onClick={() => setItemsDevolucion(prev => prev.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-rose-600 cursor-pointer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Observaciones (opcional)</label>
                <textarea
                  rows={2}
                  value={observacionesDevolucion}
                  onChange={e => setObservacionesDevolucion(e.target.value)}
                  placeholder="Ej: Lote GE-0412 vencido el 01/10/2026. Se coordina recojo con ALFARO S.A.C."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:border-violet-400 focus:bg-white transition-all resize-none"
                />
              </div>

              {/* Resumen total */}
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-xs font-black text-violet-700 uppercase">Total Valorizado a Devolver</span>
                <span className="text-lg font-black text-violet-900 font-mono">
                  S/ {itemsDevolucion.reduce((acc, it) => acc + ((parseFloat(it.cantidad) || 0) * (parseFloat(it.precio_unitario) || 0)), 0).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3 shrink-0">
              <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
                Se actualizará Kardex y stock automáticamente
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setModalDevolucion(false); setItemsDevolucion([{ id_medicamento: '', nombre: '', cantidad: 1, precio_unitario: 0 }]); }}
                  className="px-4 py-2 rounded-2xl bg-white border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  disabled={enviandoDevolucion || itemsDevolucion.some(it => !it.id_medicamento)}
                  onClick={async () => {
                    if (itemsDevolucion.some(it => !it.id_medicamento)) return toast.error('Complete el ID de medicamento en todos los ítems.');
                    try {
                      setEnviandoDevolucion(true);
                      await api.post('/devoluciones-proveedor', {
                        id_proveedor: proveedorDevolucion.id,
                        motivo: motivoDevolucion,
                        observaciones: observacionesDevolucion,
                        items: itemsDevolucion.map(it => ({
                          id_medicamento: parseInt(it.id_medicamento),
                          cantidad: it.cantidad,
                          precio_unitario: it.precio_unitario
                        }))
                      });
                      toast.success('✅ Devolución registrada con trazabilidad en Kardex');
                      setModalDevolucion(false);
                      setItemsDevolucion([{ id_medicamento: '', nombre: '', cantidad: 1, precio_unitario: 0 }]);
                      setMotivoDevolucion('Producto Vencido');
                      setObservacionesDevolucion('');
                      cargarProveedores();
                    } catch (err) {
                      toast.error(err?.response?.data?.message || 'Error al registrar la devolución');
                    } finally {
                      setEnviandoDevolucion(false);
                    }
                  }}
                  className="px-5 py-2 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-extrabold text-xs shadow-lg shadow-violet-500/25 hover:scale-105 transition-all flex items-center gap-2 disabled:opacity-50 disabled:scale-100 cursor-pointer"
                >
                  {enviandoDevolucion ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Registrando...</>
                  ) : (
                    <><Send className="w-3.5 h-3.5" /> Registrar Devolución</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
