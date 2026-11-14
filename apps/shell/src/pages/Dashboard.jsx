import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, useAuthStore, useModulos, useRealtime } from '@heis/core';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  UtensilsCrossed,
  ShoppingBag,
  Pill,
  Hotel,
  AlertTriangle,
  Activity,
  RefreshCw,
  ArrowUpRight,
  Calendar,
  ShieldCheck,
  Radio,
  Boxes,
  ChefHat
} from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { empresa, user } = useAuthStore();
  const modulos = useModulos();

  const [periodoDias, setPeriodoDias] = useState(30);
  const [biData, setBiData] = useState(null);
  const [loading, setLoading] = useState(true);

  const cargarBI = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/core/bi/dashboard', {
        params: { dias: periodoDias },
      });
      if (res.data?.success) {
        setBiData(res.data.data);
      }
    } catch (error) {
      console.warn('Error cargando Dashboard BI:', error.message);
    } finally {
      setLoading(false);
    }
  }, [periodoDias]);

  useEffect(() => {
    cargarBI();
  }, [cargarBI]);

  // Suscripción en tiempo real: recarga indicadores automáticamente ante cualquier evento operativo
  const { connected: rtConnected } = useRealtime((eventName) => {
    if (
      eventName === 'kds:updated' ||
      eventName === 'rack:updated' ||
      eventName === 'caja:updated' ||
      eventName === 'venta:created'
    ) {
      cargarBI();
    }
  });

  const kpis = biData?.kpis || {
    ingresos_periodo: 0,
    egresos_periodo: 0,
    utilidad_neta: 0,
    margen_operativo_pct: 0,
    ingresos_hoy: 0,
    egresos_hoy: 0,
    cajas_abiertas: 0,
    cpe_emitidos: 0,
    cpe_total_facturado: 0,
    cpe_total_igv: 0,
  };

  const serie7Dias = biData?.serie_ultimos_7_dias || [];
  const maxValorSerie = Math.max(
    100,
    ...serie7Dias.map((d) => Math.max(Number(d.ingresos || 0), Number(d.egresos || 0)))
  );

  const opVivo = biData?.operacion_en_vivo || {
    restaurante: { total_mesas: 0, mesas_ocupadas: 0, comandas_kds_activas: 0 },
    hospedaje: { total_habitaciones: 0, habitaciones_ocupadas: 0, tasa_ocupacion_pct: 0 },
    alertas_ferreteria: [],
    alertas_fefo_botica: [],
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-8 animate-in fade-in duration-300">
      {/* Cabecera Ejecutiva BI + Estado Realtime */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-heading tracking-tight">
              Dashboard Ejecutivo BI — {empresa?.nombre || 'HEIS Suite'}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                rtConnected
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25'
              }`}
            >
              <Radio className={`w-3 h-3 ${rtConnected ? 'animate-pulse' : ''}`}/>
              {rtConnected ? 'Tiempo Real Activo' : 'Sincronizando...'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Analítica financiera transversal, facturación electrónica UBL 2.1 y telemetría operativa en vivo para {user?.nombre || 'Gerencia'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setPeriodoDias(d)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                periodoDias === d
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70'
              }`}
            >
              Últimos {d} días
            </button>
          ))}
          <button
            onClick={cargarBI}
            className="p-2.5 rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 cursor-pointer"
            title="Actualizar métricas BI"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
      </div>

      {/* Tarjetas Principales de KPIs Financieros Consolidados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Ingresos Consolidados ({periodoDias}d)
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4"/>
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            S/ {Number(kpis.ingresos_periodo).toFixed(2)}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">
            Hoy en caja: S/ {Number(kpis.ingresos_hoy).toFixed(2)}
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Utilidad Operativa Neta
            </span>
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500">
              <Activity className="w-4 h-4"/>
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            S/ {Number(kpis.utilidad_neta).toFixed(2)}
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
            Margen neto: {kpis.margen_operativo_pct}% (Egresos: S/ {Number(kpis.egresos_periodo).toFixed(2)})
          </div>
        </div>

        <div
          onClick={() => navigate('/facturacion-sunat')}
          className="p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 shadow-xs cursor-pointer hover:border-emerald-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              CPE Emitidos SUNAT UBL 2.1
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <Receipt className="w-4 h-4"/>
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            S/ {Number(kpis.cpe_total_facturado).toFixed(2)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1 flex items-center justify-between">
            <span>{kpis.cpe_emitidos} comprobantes • IGV: S/ {Number(kpis.cpe_total_igv).toFixed(2)}</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-500"/>
          </div>
        </div>

        <div
          onClick={() => navigate('/caja')}
          className="p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 shadow-xs cursor-pointer hover:border-sky-500/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              Turnos de Caja Activos
            </span>
            <span className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
              <Wallet className="w-4 h-4"/>
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2 font-mono">
            {kpis.cajas_abiertas} {kpis.cajas_abiertas === 1 ? 'Gaveta Abierta' : 'Gavetas Abiertas'}
          </div>
          <div className="text-[11px] text-sky-600 dark:text-sky-400 font-bold mt-1 flex items-center justify-between">
            <span>{kpis.sucursales_activas} sede(s) operativa(s)</span>
            <ArrowUpRight className="w-3.5 h-3.5"/>
          </div>
        </div>
      </div>

      {/* Gráfico Interactivo de Flujo de Caja (Últimos 7 días) + Distribución por Módulo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white font-heading">
                Evolución Diaria de Ingresos vs. Egresos (Últimos 7 días)
              </h2>
              <p className="text-[11px] text-slate-400">
                 Flujo real consolidado desde la tabla transversal core_caja_movimientos
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1.5 text-emerald-500">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/> Ingresos
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"/> Egresos
              </span>
            </div>
          </div>

          <div className="h-52 flex items-end gap-3 pt-6 px-2 border-b border-slate-100 dark:border-white/5">
            {serie7Dias.map((item) => {
              const pctIng = Math.max(6, Math.round((Number(item.ingresos || 0) / maxValorSerie) * 100));
              const pctEgr = Math.max(4, Math.round((Number(item.egresos || 0) / maxValorSerie) * 100));
              return (
                <div key={item.fecha} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-40">
                    <div
                      style={{ height: `${pctIng}%` }}
                      className="w-4 sm:w-6 rounded-t-xl bg-gradient-to-t from-emerald-600 to-emerald-400 transition-all duration-300 group-hover:opacity-90"
                      title={`Ingresos ${item.fecha}: S/ ${Number(item.ingresos).toFixed(2)}`}
                    />
                    <div
                      style={{ height: `${pctEgr}%` }}
                      className="w-3 sm:w-4 rounded-t-xl bg-gradient-to-t from-rose-600 to-rose-400 opacity-80 transition-all duration-300"
                      title={`Egresos ${item.fecha}: S/ ${Number(item.egresos).toFixed(2)}`}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    {item.fecha.slice(5)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Telemetría por Giro Activo */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#0d1527] border border-slate-200/80 dark:border-white/10 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white font-heading">
              Estado Operativo por Giro Contratado
            </h2>
            <p className="text-[11px] text-slate-400">
              Módulos habilitados para esta empresa desde SuperAdmin
            </p>
          </div>

          <div className="space-y-3 text-xs">
            {modulos.restaurante && (
              <div
                onClick={() => navigate('/cocina')}
                className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 flex items-center justify-between cursor-pointer hover:bg-amber-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ChefHat className="w-5 h-5 text-amber-500"/>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Restaurante & KDS</div>
                    <div className="text-[11px] text-slate-500">
                      {opVivo.restaurante.mesas_ocupadas}/{opVivo.restaurante.total_mesas} mesas ocupadas
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 font-black text-[11px]">
                  {opVivo.restaurante.comandas_kds_activas} en KDS
                </span>
              </div>
            )}

            {modulos.hospedaje && (
              <div
                onClick={() => navigate('/habitaciones')}
                className="p-3.5 rounded-2xl bg-violet-500/5 border border-violet-500/20 flex items-center justify-between cursor-pointer hover:bg-violet-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Hotel className="w-5 h-5 text-violet-500"/>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Rack Hospedaje PMS</div>
                    <div className="text-[11px] text-slate-500">
                      {opVivo.hospedaje.habitaciones_ocupadas}/{opVivo.hospedaje.total_habitaciones} habitaciones ocupadas
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-violet-500/15 text-violet-600 dark:text-violet-300 font-black text-[11px]">
                  {opVivo.hospedaje.tasa_ocupacion_pct}% Ocupación
                </span>
              </div>
            )}

            {modulos.botica && (
              <div
                onClick={() => navigate('/lotes')}
                className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between cursor-pointer hover:bg-emerald-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Pill className="w-5 h-5 text-emerald-500"/>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Botica & Lotes FEFO</div>
                    <div className="text-[11px] text-slate-500">
                       Vigilancia sanitaria DIGEMID activa
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 font-black text-[11px]">
                  {opVivo.alertas_fefo_botica.length} alertas FEFO
                </span>
              </div>
            )}

            {modulos.ferreteria && (
              <div
                onClick={() => navigate('/inventario')}
                className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 flex items-center justify-between cursor-pointer hover:bg-indigo-500/10 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="w-5 h-5 text-indigo-500"/>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Almacén Ferretería</div>
                    <div className="text-[11px] text-slate-500">
                      Reposición y control de existencias
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 font-black text-[11px]">
                  {opVivo.alertas_ferreteria.length} en stock crítico
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
