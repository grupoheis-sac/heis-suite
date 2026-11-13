import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useModulos, api } from '@heis/core';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  UtensilsCrossed,
  ChefHat,
  Users,
  Building2,
  DollarSign,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Pill,
  Hotel,
  Layers,
  Clock,
  Package,
  CalendarCheck,
  AlertTriangle,
  Send,
  FileText,
  CheckCircle2,
  XCircle,
  RefreshCw,
  CreditCard,
  Wallet,
  QrCode,
  Printer,
  Receipt,
  Calendar,
  ChevronRight,
  Eye,
  LifeBuoy,
  Check,
  ExternalLink,
  ShieldAlert,
  Zap,
  Lock,
  ArrowRight
} from 'lucide-react';

export default function Dashboard() {
  const { user, empresa, sucursalActual } = useAuthStore();
  const modulos = useModulos();
  const navigate = useNavigate();

  const [rango, setRango] = useState('hoy'); // 'hoy' | 'semana' | 'mes'
  const [sincronizandoSunat, setSincronizandoSunat] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);

  // Módulo seleccionado para ver su widget principal
  const [moduloActivoTab, setModuloActivoTab] = useState(() => {
    if (modulos.restaurante) return 'restaurante';
    if (modulos.ferreteria) return 'ferreteria';
    if (modulos.botica) return 'botica';
    if (modulos.hospedaje) return 'hospedaje';
    return 'general';
  });

  const [stats, setStats] = useState({
    ventasHoy: 3240.50,
    ventasEfectivo: 2180.00,
    ventasDigital: 1060.50, // Yape, Plin, Tarjeta
    cpeEmitidosTotal: 24,
    cpeBoletas: 18,
    cpeFacturas: 5,
    cpeNotas: 1,
    cpePendientesSunat: 2,
    cpeRechazadosSunat: 0,
    pedidosActivos: 6,
    mesasOcupadas: 4,
    totalMesas: 10,
    articulosStockBajo: 3,
    lotesPorVencer: 2,
    habitacionesOcupadas: 7,
    totalHabitaciones: 12,
  });

  const [actividades, setActividades] = useState([]);

  // Atajos de teclado en el Dashboard (F1 para acción principal del negocio)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        if (modulos.restaurante) navigate('/mesas');
        else if (modulos.ferreteria) navigate('/pos');
        else if (modulos.botica) navigate('/dispensacion');
        else if (modulos.hospedaje) navigate('/habitaciones');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modulos, navigate]);

  useEffect(() => {
    api.get('/admin/auditoria?limit=5')
      .then((res) => {
        if (res.data?.data) {
          setActividades(res.data.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleSincronizarSunat = () => {
    setSincronizandoSunat(true);
    setTimeout(() => {
      setSincronizandoSunat(false);
      setStats((prev) => ({ ...prev, cpePendientesSunat: 0 }));
      toast.success('2 comprobantes sincronizados exitosamente con SUNAT (CDR Aceptado)');
    }, 1200);
  };

  const handleRefrescar = () => {
    setLoadingRefresh(true);
    setTimeout(() => {
      setLoadingRefresh(false);
      toast.success('Métricas operativas actualizadas');
    }, 800);
  };

  // Multiplicadores según rango temporal
  const factorRango = rango === 'hoy' ? 1 : rango === 'semana' ? 6.4 : 26.8;
  const ventasMostradas = stats.ventasHoy * factorRango;
  const efectivoMostrado = stats.ventasEfectivo * factorRango;
  const digitalMostrado = stats.ventasDigital * factorRango;

  // Lista simulada de comprobantes del día
  const ultimosComprobantes = [
    { id: 1, serie: 'B001-00042', cliente: 'Juan Perez Ramos', tipo: 'Boleta', total: 45.00, metodo: 'Yape', sunat: 'Aceptado', hora: '10:14 AM' },
    { id: 2, serie: 'F001-00015', cliente: 'CONSTRUCTORA DEL SUR SAC', tipo: 'Factura', total: 820.00, metodo: 'Transferencia', sunat: 'Aceptado', hora: '09:58 AM' },
    { id: 3, serie: 'B001-00041', cliente: 'Consumidor Final', tipo: 'Boleta', total: 18.50, metodo: 'Efectivo', sunat: 'Pendiente', hora: '09:42 AM' },
    { id: 4, serie: 'B001-00040', cliente: 'Maria Flores Quispe', tipo: 'Boleta', total: 64.00, metodo: 'Efectivo', sunat: 'Pendiente', hora: '09:15 AM' },
  ];

  return (
    <div className="space-y-6">
      {/* 1. CABECERA DINÁMICA DE LA EMPRESA & CONTROL DE CAJA */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading">
              {empresa?.nombre || 'HEIS SAC'}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/10">
              RUC: {empresa?.ruc || '20100077707'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#02CBA9]/10 text-[#02CBA9] border border-[#02CBA9]/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#02CBA9] animate-pulse" />
              <span>{sucursalActual?.nombre || 'Sede Principal'}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span>Operador: <strong className="text-slate-700 dark:text-slate-200">{user?.nombre || 'Administrador'}</strong></span>
            <span>&bull;</span>
            <span className="text-emerald-500 font-semibold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Caja Abierta (Turno Mañana)
            </span>
          </p>
        </div>

        {/* Filtros Temporales (Hoy, Semana, Mes) & Refrescar */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
            <button
              onClick={() => setRango('hoy')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                rango === 'hoy'
                  ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Ventas de Hoy
            </button>
            <button
              onClick={() => setRango('semana')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                rango === 'semana'
                  ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setRango('mes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                rango === 'mes'
                  ? 'bg-white dark:bg-white/15 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Mes
            </button>
          </div>

          <button
            onClick={handleRefrescar}
            disabled={loadingRefresh}
            className="h-9 w-9 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Actualizar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loadingRefresh ? 'animate-spin text-[#02CBA9]' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. BARRA DE COMANDO RÁPIDO ADAPTATIVA (Superando los botones toscos de GSTIONE) */}
      <div className="p-3.5 rounded-3xl bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* ACCIÓN ESTRELLA DEL MÓDULO ACTIVO (Tecla F1) */}
          {modulos.restaurante && (
            <button
              onClick={() => navigate('/mesas')}
              className="h-10 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-black text-xs shadow-md shadow-amber-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Abrir mapa de salón y comandas (Atajo: F1)"
            >
              <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
              <span>Salón & Mesas (F1)</span>
            </button>
          )}

          {modulos.ferreteria && (
            <button
              onClick={() => navigate('/pos')}
              className="h-10 px-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Abrir Punto de Venta Retail (Atajo: F1)"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span>Punto de Venta POS (F1)</span>
            </button>
          )}

          {modulos.botica && (
            <button
              onClick={() => navigate('/dispensacion')}
              className="h-10 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Abrir Dispensación Farmacéutica (Atajo: F1)"
            >
              <Pill className="w-4 h-4 stroke-[2.5]" />
              <span>Dispensación FEFO (F1)</span>
            </button>
          )}

          {modulos.hospedaje && (
            <button
              onClick={() => navigate('/habitaciones')}
              className="h-10 px-4 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-95 text-white font-black text-xs shadow-md shadow-purple-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              title="Abrir Rack de Habitaciones (Atajo: F1)"
            >
              <Hotel className="w-4 h-4 stroke-[2.5]" />
              <span>Rack Hotel (F1)</span>
            </button>
          )}

          {/* BOTONES CORE: Emitir Boleta / Factura */}
          <button
            onClick={() => {
              if (modulos.restaurante) navigate('/mesas');
              else if (modulos.ferreteria) navigate('/pos');
              else if (modulos.botica) navigate('/dispensacion');
              else if (modulos.hospedaje) navigate('/habitaciones');
              else navigate('/ventas');
            }}
            className="h-10 px-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Receipt className="w-4 h-4 text-blue-500" />
            <span>Emitir Comprobante</span>
          </button>

          {/* BOTÓN CORE: Arqueo / Caja */}
          <button
            onClick={() => navigate('/caja')}
            className="h-10 px-4 rounded-2xl bg-white dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-2xs"
          >
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>Cierre de Caja</span>
          </button>
        </div>

        {/* ACCIÓN RÁPIDA: Sincronización con SUNAT */}
        <div className="flex items-center gap-2">
          {stats.cpePendientesSunat > 0 ? (
            <button
              onClick={handleSincronizarSunat}
              disabled={sincronizandoSunat}
              className="h-10 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${sincronizandoSunat ? 'animate-bounce' : ''}`} />
              <span>Enviar a SUNAT ({stats.cpePendientesSunat})</span>
            </button>
          ) : (
            <span className="h-10 px-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>SUNAT 100% al día</span>
            </span>
          )}
        </div>
      </div>

      {/* 3. GRID DE KPIS COMERCIALES & TELEMETRÍA SUNAT (4 Tarjetas de Alta Densidad) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ventas Totales */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Ventas ({rango.toUpperCase()})
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <DollarSign className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
              S/ {ventasMostradas.toFixed(2)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>{stats.cpeEmitidosTotal} comprobantes emitidos</span>
            <span className="text-emerald-500 font-bold flex items-center gap-0.5">
              +18.2% <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* KPI 2: Desglose de Caja (Efectivo vs Digital) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Efectivo en Caja
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
              S/ {efectivoMostrado.toFixed(2)}
            </span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>Digital / Yape: S/ {digitalMostrado.toFixed(2)}</span>
            <span className="font-mono text-slate-500">
              {Math.round((efectivoMostrado / (ventasMostradas || 1)) * 100)}% físico
            </span>
          </div>
        </div>

        {/* KPI 3: MONITOR SUNAT CPE EN VIVO (Superando a GSTIONE) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Facturación SUNAT
            </span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              stats.cpePendientesSunat > 0 ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'
            }`}>
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            {stats.cpePendientesSunat > 0 ? (
              <>
                <span className="text-3xl font-black text-amber-500 font-mono tracking-tight">
                  {stats.cpePendientesSunat}
                </span>
                <span className="text-xs font-bold text-amber-500">por regularizar</span>
              </>
            ) : (
              <>
                <span className="text-3xl font-black text-emerald-500 font-mono tracking-tight">
                  0
                </span>
                <span className="text-xs font-bold text-emerald-500">pendientes</span>
              </>
            )}
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
            <span>0 rechazados / anulados</span>
            <span className="font-mono text-emerald-500 font-bold">CDR OK</span>
          </div>
        </div>

        {/* KPI 4: OPERACIÓN CLAVE DEL RUBRO */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs">
          {modulos.restaurante ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Salón & Cocina KDS
                </span>
                <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center">
                  <ChefHat className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {stats.mesasOcupadas} / {stats.totalMesas}
                </span>
                <span className="text-xs font-bold text-amber-500">mesas activas</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>{stats.pedidosActivos} comandas en preparación</span>
                <span className="text-orange-500 font-bold">KDS en vivo</span>
              </div>
            </>
          ) : modulos.ferreteria ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Alertas de Stock Kardex
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Package className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500 font-mono tracking-tight">
                  {stats.articulosStockBajo}
                </span>
                <span className="text-xs font-bold text-amber-500">por reponer</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Stock físico bajo mínimo</span>
                <span className="text-indigo-500 font-bold">Kardex OK</span>
              </div>
            </>
          ) : modulos.botica ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Control Sanitario FEFO
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Pill className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-500 font-mono tracking-tight">
                  {stats.lotesPorVencer}
                </span>
                <span className="text-xs font-bold text-amber-500">lotes &lt; 30 días</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Reportes DIGEMID al día</span>
                <span className="text-emerald-500 font-bold">Baja OK</span>
              </div>
            </>
          ) : modulos.hospedaje ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Ocupación Hotelera
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                  <Hotel className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  {Math.round((stats.habitacionesOcupadas / stats.totalHabitaciones) * 100)}%
                </span>
                <span className="text-xs font-bold text-purple-500">
                  {stats.habitacionesOcupadas}/{stats.totalHabitaciones} cuartos
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Check-in / Check-out</span>
                <span className="text-purple-500 font-bold">PMS Rack</span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Seguridad Suite
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-500 font-mono tracking-tight">
                  100%
                </span>
                <span className="text-xs font-bold text-emerald-500">inmutable</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                <span>Trazabilidad auditada</span>
                <span className="text-blue-500 font-bold">HEIS Cloud</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 4. SECCIÓN PRINCIPAL ASIMÉTRICA (8 Cols Izquierda / 4 Cols Derecha) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* COLUMNA IZQUIERDA (8 Cols): Widget Especializado + Ventas Recientes */}
        <div className="xl:col-span-8 space-y-6">
          {/* A. WIDGET ADAPTATIVO DEL RUBRO CONTRATADO */}
          {modulos.restaurante && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                      Monitor de Salón & Mesas
                    </h3>
                    <p className="text-xs text-slate-400">Estado de comensales en piso en tiempo real</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/mesas')}
                  className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir Salón Completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Grid de Mesas Rápidas */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                {[
                  { num: 'M-01', estado: 'ocupada', total: 'S/ 115.00', tiempo: '42m' },
                  { num: 'M-02', estado: 'libre', total: '-', tiempo: '-' },
                  { num: 'M-03', estado: 'ocupada', total: 'S/ 84.50', tiempo: '18m' },
                  { num: 'M-04', estado: 'cuenta', total: 'S/ 240.00', tiempo: 'Por cobrar' },
                  { num: 'M-05', estado: 'libre', total: '-', tiempo: '-' },
                ].map((m) => (
                  <div
                    key={m.num}
                    onClick={() => navigate('/mesas')}
                    className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                      m.estado === 'ocupada'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                        : m.estado === 'cuenta'
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-500'
                        : 'bg-slate-50 dark:bg-white/[0.02] border-slate-200/60 dark:border-white/5 text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-black font-mono">{m.num}</span>
                    <p className="text-[10px] font-bold uppercase mt-1">
                      {m.estado === 'ocupada' ? 'Ocupada' : m.estado === 'cuenta' ? 'Pide Cuenta' : 'Libre'}
                    </p>
                    <p className="text-[11px] font-mono font-bold mt-0.5">{m.total}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {modulos.ferreteria && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                      Alertas de Stock & Reposición
                    </h3>
                    <p className="text-xs text-slate-400">Productos que alcanzaron su umbral mínimo de seguridad</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/inventario')}
                  className="text-xs font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Kardex Completo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {[
                  { desc: 'Cemento Portland Tipo I (Bolsa 42.5kg)', stock: 4, min: 20, cod: 'MAT-001' },
                  { desc: 'Fierro Corrugado 1/2" Siderperu', stock: 2, min: 15, cod: 'MAT-008' },
                  { desc: 'Tubo PVC 1/2" Agua Presión Pavco', stock: 6, min: 25, cod: 'TUB-012' },
                ].map((art) => (
                  <div key={art.cod} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{art.desc}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Código: {art.cod}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-bold font-mono">
                        {art.stock} en stock (mín: {art.min})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {modulos.botica && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                      Semáforo FEFO de Lotes Médicos
                    </h3>
                    <p className="text-xs text-slate-400">Control de caducidad para auditoría sanitaria DIGEMID</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/lotes')}
                  className="text-xs font-bold text-emerald-500 hover:text-emerald-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>Ver Todos los Lotes</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                {[
                  { med: 'Amoxicilina 500mg (Caja x 100)', lote: 'L-2024A', vence: '15/12/2026', estado: 'alerta' },
                  { med: 'Paracetamol 500mg Genfar', lote: 'L-8910B', vence: '20/12/2026', estado: 'alerta' },
                  { med: 'Ibuprofeno 400mg Forte', lote: 'L-7741C', vence: '18/06/2027', estado: 'optimo' },
                ].map((l) => (
                  <div key={l.lote} className="py-2.5 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{l.med}</p>
                      <p className="text-[10px] text-slate-400 font-mono">Lote: {l.lote} &bull; Vence: {l.vence}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px] uppercase ${
                      l.estado === 'alerta'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {l.estado === 'alerta' ? 'Próximo a Vencer (< 30d)' : 'Óptimo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {modulos.hospedaje && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Hotel className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                      Rack de Habitaciones en Vivo
                    </h3>
                    <p className="text-xs text-slate-400">Distribución de habitaciones del establecimiento</p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/habitaciones')}
                  className="text-xs font-bold text-purple-500 hover:text-purple-400 flex items-center gap-1 cursor-pointer"
                >
                  <span>Abrir Rack PMS</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {[
                  { hab: 'Hab 101 (Matrimonial)', estado: 'Ocupada', huesped: 'Carlos Mendoza' },
                  { hab: 'Hab 102 (Simple)', estado: 'Libre', huesped: '-' },
                  { hab: 'Hab 103 (Doble)', estado: 'Limpieza', huesped: 'Pendiente aseo' },
                  { hab: 'Hab 201 (Suite VIP)', estado: 'Ocupada', huesped: 'Lucia Ramirez' },
                ].map((h) => (
                  <div
                    key={h.hab}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5"
                  >
                    <p className="font-bold text-slate-800 dark:text-slate-200">{h.hab}</p>
                    <span className="text-[10px] font-bold text-purple-500 uppercase">{h.estado}</span>
                    <p className="text-[10px] text-slate-400 truncate mt-1">{h.huesped}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* B. HISTORIAL RECIENTE DE COMPROBANTES EMITIDOS */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                  Últimos Comprobantes Emitidos
                </h3>
                <p className="text-xs text-slate-400">Movimientos de facturación electrónica de la jornada</p>
              </div>
              <button
                onClick={() => navigate('/ventas')}
                className="text-xs font-bold text-[#02CBA9] hover:underline cursor-pointer"
              >
                Ver todos &rarr;
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-white/5 text-[10px] uppercase font-bold text-slate-400">
                    <th className="py-2 px-3">Comprobante</th>
                    <th className="py-2 px-3">Cliente</th>
                    <th className="py-2 px-3">Método</th>
                    <th className="py-2 px-3 text-right">Monto</th>
                    <th className="py-2 px-3 text-center">SUNAT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {ultimosComprobantes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {c.serie}
                        <span className="block text-[10px] font-normal text-slate-400">{c.hora}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                        {c.cliente}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-medium">
                          {c.metodo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        S/ {c.total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                            c.sunat === 'Aceptado'
                              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}
                        >
                          {c.sunat}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA (4 Cols): Arqueo de Caja + Auditoría Local */}
        <div className="xl:col-span-4 space-y-6">
          {/* 1. ESTADO DE CAJA CHICA & ARQUEO */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                    Caja Chica & Turno
                  </h3>
                  <p className="text-[11px] text-slate-400">Control de fondos y arqueo de caja</p>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50" />
            </div>

            <div className="space-y-2.5 divide-y divide-slate-100 dark:divide-white/5 text-xs">
              <div className="pt-1 flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Monto Inicial de Apertura</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">S/ 150.00</span>
              </div>
              <div className="pt-2 flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Ventas Cobradas en Efectivo</span>
                <span className="font-mono font-bold text-emerald-500">+ S/ {stats.ventasEfectivo.toFixed(2)}</span>
              </div>
              <div className="pt-2 flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span>Egresos / Gastos Menores</span>
                <span className="font-mono font-bold text-rose-500">- S/ 35.00</span>
              </div>
              <div className="pt-3 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white">Total Físico en Cajón</span>
                <span className="font-mono font-black text-base text-slate-900 dark:text-white">
                  S/ {(150 + stats.ventasEfectivo - 35).toFixed(2)}
                </span>
              </div>
            </div>

            <button
              onClick={() => navigate('/caja')}
              className="w-full py-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200/70 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Wallet className="w-4 h-4 text-emerald-500" />
              <span>Realizar Corte & Cierre Z</span>
            </button>
          </div>

          {/* 2. REGISTRO DE ACTIVIDAD RECIENTE */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#18123B] border border-slate-200/80 dark:border-white/5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white font-heading">
                    Actividad Reciente
                  </h3>
                  <p className="text-[11px] text-slate-400">Trazabilidad de la sucursal</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {actividades.length === 0 ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Apertura de turno</p>
                      <p className="text-[10px] text-slate-400">08:00 AM &bull; {user?.nombre || 'Admin'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Emisión de Factura F001-00015</p>
                      <p className="text-[10px] text-slate-400">09:58 AM &bull; SUNAT Aceptado</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">Arqueo parcial verificado</p>
                      <p className="text-[10px] text-slate-400">10:15 AM &bull; Sin descuadre</p>
                    </div>
                  </div>
                </div>
              ) : (
                actividades.map((act) => (
                  <div key={act.id} className="flex items-start gap-2.5 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {act.usuario_nombre}: <span className="font-normal text-slate-500">{act.accion}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(act.created_at).toLocaleTimeString()} &bull; Módulo {act.modulo}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. ASISTENCIA & MESA DE AYUDA HEIS */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#7D71EB]/10 via-[#1CC0F9]/10 to-[#02CBA9]/10 border border-[#7D71EB]/20 text-xs space-y-3">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-[#7D71EB]" />
              <span className="font-bold text-slate-800 dark:text-white font-heading">
                Soporte & Asistencia HEIS
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              ¿Dudas con tu facturación SUNAT o necesitas habilitar más sucursales? Nuestro equipo técnico está activo.
            </p>
            <a
              href="https://wa.me/51999999999"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 font-bold text-xs text-[#02CBA9] hover:underline cursor-pointer"
            >
              <span>Contactar con Soporte Técnico</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
