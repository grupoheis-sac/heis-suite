import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import {
  TrendingDown,
  Plus,
  Search,
  DollarSign,
  Calendar,
  Tag,
  User,
  X,
  RotateCw,
  LayoutGrid,
  List,
  ShoppingBag,
  UtensilsCrossed,
  Flame,
  Wine,
  Sparkles,
  Layers,
  Receipt,
  Wallet,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIAS_GASTO = [
  { id: 'Insumos Frescos', label: 'Insumos Frescos', desc: 'Verduras, carnes y abarrotes', icon: ShoppingBag, color: 'emerald' },
  { id: 'Bebidas y Licores', label: 'Bebidas y Licores', desc: 'Licores, cerveza y refrescos', icon: Wine, color: 'cyan' },
  { id: 'Servicios y Gas', label: 'Servicios y Gas', desc: 'Balón de gas GLP, agua, luz', icon: Flame, color: 'amber' },
  { id: 'Limpieza y Menaje', label: 'Limpieza y Menaje', desc: 'Detergentes, vajilla, descartables', icon: Sparkles, color: 'purple' },
  { id: 'Personal y Planilla', label: 'Personal y Planilla', desc: 'Adelantos, jornales y extras', icon: User, color: 'blue' },
  { id: 'Otros Operativos', label: 'Otros Operativos', desc: 'Mantenimiento y caja chica', icon: Tag, color: 'slate' }
];

export default function Gastos() {
  const [gastos, setGastos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [periodoFiltro, setPeriodoFiltro] = useState('todos'); // 'todos' | 'hoy' | 'mes'
  const [vistaModo, setVistaModo] = useState('tarjetas'); // 'tarjetas' | 'tabla'
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    description: '',
    amount: '',
    category: 'Insumos Frescos'
  });

  const cargarGastos = async () => {
    try {
      setLoading(true);
      const res = await api.get('/gastos');
      if (res.success) {
        setGastos(res.gastos || []);
      }
    } catch (err) {
      console.error('Error al cargar gastos:', err);
      toast.error('Error al sincronizar egresos');
    } finally {
      setLoading(false);
      setUltimaActualizacion(new Date());
    }
  };

  useEffect(() => {
    cargarGastos();
  }, []);

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setGastoEditando(null);
    setForm({
      description: '',
      amount: '',
      category: 'Insumos Frescos'
    });
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (gasto) => {
    setGastoEditando(gasto);
    setForm({
      description: gasto.description || '',
      amount: gasto.amount !== undefined ? gasto.amount.toString() : '',
      category: gasto.category || 'Insumos Frescos'
    });
    setModalAbierto(true);
  };

  // Guardar (Crear o Actualizar)
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.description || !form.amount) {
      toast.error('Complete la descripción y el monto del egreso');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        description: form.description.trim(),
        amount: parseFloat(form.amount),
        category: form.category
      };

      if (gastoEditando) {
        const res = await api.put(`/gastos/${gastoEditando.id}`, payload);
        if (res.success) {
          toast.success('Gasto actualizado correctamente');
          setModalAbierto(false);
          cargarGastos();
        }
      } else {
        const res = await api.post('/gastos', payload);
        if (res.success) {
          toast.success('Egreso operativo registrado');
          setModalAbierto(false);
          cargarGastos();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar gasto');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar gasto
  const handleEliminar = async (id, desc) => {
    if (!confirm(`¿Desea eliminar el registro de gasto "${desc}"?`)) return;
    try {
      const res = await api.delete(`/gastos/${id}`);
      if (res.success) {
        toast.success('Gasto eliminado');
        cargarGastos();
      }
    } catch (err) {
      toast.error('Error al eliminar gasto');
    }
  };

  // Métricas y totales KPI
  const kpis = useMemo(() => {
    const ahora = new Date();
    const hoyStr = ahora.toDateString();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    let totalMonto = 0;
    let hoyMonto = 0;
    let insumosMonto = 0;
    let serviciosMonto = 0;

    gastos.forEach((g) => {
      const monto = parseFloat(g.amount || 0);
      totalMonto += monto;

      if (g.created_at) {
        const d = new Date(g.created_at);
        if (d.toDateString() === hoyStr) {
          hoyMonto += monto;
        }
      }

      if (g.category === 'Insumos Frescos') {
        insumosMonto += monto;
      } else if (g.category === 'Servicios y Gas') {
        serviciosMonto += monto;
      }
    });

    return {
      total: totalMonto,
      hoy: hoyMonto,
      insumos: insumosMonto,
      servicios: serviciosMonto,
      conteo: gastos.length
    };
  }, [gastos]);

  // Conteo y totales por categoría
  const statsCategorias = useMemo(() => {
    const mapa = {};
    gastos.forEach((g) => {
      const cat = g.category || 'Otros';
      if (!mapa[cat]) {
        mapa[cat] = { count: 0, total: 0 };
      }
      mapa[cat].count += 1;
      mapa[cat].total += parseFloat(g.amount || 0);
    });
    return mapa;
  }, [gastos]);

  // Filtrado de gastos
  const gastosFiltrados = useMemo(() => {
    const ahora = new Date();
    const hoyStr = ahora.toDateString();
    const mesActual = ahora.getMonth();
    const anioActual = ahora.getFullYear();

    return gastos.filter((g) => {
      // Filtro de Categoría
      const coincideCat = categoriaFiltro === 'todas' || g.category === categoriaFiltro;

      // Filtro de Período
      let coincidePeriodo = true;
      if (g.created_at) {
        const d = new Date(g.created_at);
        if (periodoFiltro === 'hoy') {
          coincidePeriodo = d.toDateString() === hoyStr;
        } else if (periodoFiltro === 'mes') {
          coincidePeriodo = d.getMonth() === mesActual && d.getFullYear() === anioActual;
        }
      }

      // Filtro de Búsqueda
      const q = busqueda.toLowerCase().trim();
      const coincideBusq =
        !q ||
        g.description.toLowerCase().includes(q) ||
        (g.category && g.category.toLowerCase().includes(q)) ||
        (g.usuario && g.usuario.name.toLowerCase().includes(q));

      return coincideCat && coincidePeriodo && coincideBusq;
    });
  }, [gastos, categoriaFiltro, periodoFiltro, busqueda]);

  const totalFiltrado = gastosFiltrados.reduce((acc, g) => acc + parseFloat(g.amount || 0), 0);

  const horaActualizada = ultimaActualizacion.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="space-y-5 max-w-[1700px] w-full mx-auto">
      {/* ─── 1. ENCABEZADO DE GASTOS OPERATIVOS (ESTILO DASHBOARD / CYBER TECH) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200/80 dark:border-rose-800/60 font-sora">
              #06_GASTOS
            </span>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              CONTROL_EGRESOS_V2
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-100/80 dark:border-rose-800/60 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </span>
            Gastos Operativos y Compras de Insumos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Control de egresos, compras diarias de verduras, carnes, balón de gas, servicios y caja chica.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Buscador de Gastos */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar gasto, insumo, responsable..."
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-8 pr-7 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10 font-sora w-48 sm:w-60"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Selector de Modo de Vista (Tarjetas / Tabla) */}
          <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs">
            <button
              type="button"
              onClick={() => setVistaModo('tarjetas')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                vistaModo === 'tarjetas'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vista en Tarjetas de Gasto"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setVistaModo('tabla')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                vistaModo === 'tabla'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vista en Tabla Cronológica"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón de Refrescar */}
          <button
            type="button"
            onClick={cargarGastos}
            disabled={loading}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-rose-300 dark:hover:border-rose-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            title="Refrescar lista de egresos"
          >
            <RotateCw
              className={`w-3.5 h-3.5 text-rose-500 dark:text-rose-400 group-hover:rotate-180 transition-transform duration-500 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span className="font-sora text-[11px] font-bold hidden sm:inline">
              {loading ? 'Cargando...' : `Act. ${horaActualizada}`}
            </span>
          </button>

          {/* Botón Registrar Gasto */}
          <button
            type="button"
            onClick={abrirModalCrear}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-bold font-sora transition-all shadow-md shadow-rose-600/25 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Gasto</span>
          </button>
        </div>
      </div>

      {/* ─── 2. TARJETAS KPI (ESTILO DASHBOARD) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* KPI Total Acumulado */}
        <div
          onClick={() => {
            setCategoriaFiltro('todas');
            setPeriodoFiltro('todos');
          }}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            categoriaFiltro === 'todas' && periodoFiltro === 'todos'
              ? 'border-rose-500/80 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-rose-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">#01_TOTAL_EGRESOS</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Wallet className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-sora">
                S/ {kpis.total.toFixed(2)}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">
              {kpis.conteo} comprobantes de egreso
            </p>
          </div>
        </div>

        {/* KPI Gastos de Hoy */}
        <div
          onClick={() => {
            setPeriodoFiltro(periodoFiltro === 'hoy' ? 'todos' : 'hoy');
            setCategoriaFiltro('todas');
          }}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            periodoFiltro === 'hoy'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
              : 'border-amber-100/90 dark:border-slate-800 hover:border-amber-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">#02_TURNO_HOY</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-sora">
                S/ {kpis.hoy.toFixed(2)}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Compras del día actual</p>
          </div>
        </div>

        {/* KPI Insumos Frescos */}
        <div
          onClick={() => {
            setCategoriaFiltro(categoriaFiltro === 'Insumos Frescos' ? 'todas' : 'Insumos Frescos');
            setPeriodoFiltro('todos');
          }}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            categoriaFiltro === 'Insumos Frescos'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
              : 'border-emerald-100/90 dark:border-slate-800 hover:border-emerald-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">#03_INSUMOS</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sora">
                S/ {kpis.insumos.toFixed(2)}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Verduras, carnes y cocina</p>
          </div>
        </div>

        {/* KPI Servicios y Gas */}
        <div
          onClick={() => {
            setCategoriaFiltro(categoriaFiltro === 'Servicios y Gas' ? 'todas' : 'Servicios y Gas');
            setPeriodoFiltro('todos');
          }}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            categoriaFiltro === 'Servicios y Gas'
              ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md shadow-cyan-500/10'
              : 'border-cyan-100/90 dark:border-slate-800 hover:border-cyan-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">#04_SERVICIOS</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 font-sora">
                S/ {kpis.servicios.toFixed(2)}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Gas GLP, luz y mantenimiento</p>
          </div>
        </div>
      </div>

      {/* ─── 3. TARJETAS DE CATEGORÍAS (SELECTOR RÁPIDO ESTILO SALONES) ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sora flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            Categorías de Gastos Operativos
          </h2>
          <span className="text-[10.5px] text-slate-400 font-mono font-semibold">
            {CATEGORIAS_GASTO.length} Rubros Disponibles
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {/* Todas las categorías */}
          <div
            onClick={() => setCategoriaFiltro('todas')}
            role="button"
            tabIndex={0}
            className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2 overflow-hidden ${
              categoriaFiltro === 'todas'
                ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 dark:border-rose-500/80 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-rose-600 transition-colors">
                #CAT_ALL
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  categoriaFiltro === 'todas'
                    ? 'bg-rose-500 ring-4 ring-rose-500/20'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                  categoriaFiltro === 'todas'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-rose-500 group-hover:text-white'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                  Todas
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {kpis.conteo} gastos
                </p>
              </div>
            </div>
          </div>

          {/* Categorías específicas */}
          {CATEGORIAS_GASTO.map((cat, idx) => {
            const stat = statsCategorias[cat.id] || { count: 0, total: 0 };
            const esActiva = categoriaFiltro === cat.id;
            const IconComponent = cat.icon;
            const tagCat = `#CAT_${String(idx + 1).padStart(2, '0')}`;

            return (
              <div
                key={cat.id}
                onClick={() => setCategoriaFiltro(cat.id)}
                role="button"
                tabIndex={0}
                className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2 overflow-hidden ${
                  esActiva
                    ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-500 dark:border-rose-500/80 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-rose-600 transition-colors">
                    {tagCat}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      esActiva
                        ? 'bg-rose-500 ring-4 ring-rose-500/20'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                      esActiva
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-rose-500 group-hover:text-white'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                      {cat.label}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {stat.count} {stat.count === 1 ? 'gasto' : 'gastos'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. BARRA DE FILTROS SECUNDARIOS & TOTAL FILTRADO ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 font-sora tracking-tight">
            Comprobantes de Egreso {categoriaFiltro !== 'todas' ? `(${categoriaFiltro})` : ''}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
            {gastosFiltrados.length} {gastosFiltrados.length === 1 ? 'gasto' : 'gastos'}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-sora text-xs font-bold border border-rose-200/80 dark:border-rose-900/60">
            Total: S/ {totalFiltrado.toFixed(2)}
          </span>
        </div>

        {/* Filtros de Fecha / Período */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setPeriodoFiltro('todos')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer ${
              periodoFiltro === 'todos'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setPeriodoFiltro('hoy')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              periodoFiltro === 'hoy'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:border-rose-300'
            }`}
          >
            <Clock className="w-3 h-3" />
            Solo Hoy (S/ {kpis.hoy.toFixed(2)})
          </button>
          <button
            type="button"
            onClick={() => setPeriodoFiltro('mes')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              periodoFiltro === 'mes'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:border-amber-300'
            }`}
          >
            <Calendar className="w-3 h-3" />
            Este Mes
          </button>
        </div>
      </div>

      {/* ─── 5. CONTENIDO: TARJETAS O TABLA ─── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-sora flex flex-col items-center justify-center gap-2">
          <RotateCw className="w-6 h-6 animate-spin text-rose-500" />
          <span>Sincronizando gastos operativos...</span>
        </div>
      ) : gastosFiltrados.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-sora bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-2xs">
          No se encontraron gastos operativos con los filtros seleccionados.
        </div>
      ) : vistaModo === 'tarjetas' ? (
        /* ── VISTA EN TARJETAS DE GASTOS OPERATIVOS ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
          {gastosFiltrados.map((g) => {
            const monto = parseFloat(g.amount || 0);
            const tagGasto = `#G_${String(g.id).padStart(2, '0')}`;

            // Fecha
            const fechaObj = g.created_at ? new Date(g.created_at) : null;
            const esHoy = fechaObj && fechaObj.toDateString() === new Date().toDateString();
            const fechaStr = fechaObj
              ? fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
              : 'Sin fecha';
            const horaStr = fechaObj
              ? fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
              : '--:--';

            // Estilos según categoría
            const esInsumos = g.category === 'Insumos Frescos';
            const esBebidas = g.category === 'Bebidas y Licores';
            const esGas = g.category === 'Servicios y Gas';
            const esLimpieza = g.category === 'Limpieza y Menaje';
            const esPersonal = g.category === 'Personal y Planilla';

            const badgeBg = esInsumos
              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60'
              : esBebidas
              ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border-cyan-200/80 dark:border-cyan-800/60'
              : esGas
              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60'
              : esLimpieza
              ? 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60'
              : esPersonal
              ? 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

            const iconBoxBg = esInsumos
              ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60'
              : esBebidas
              ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-800/60'
              : esGas
              ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60'
              : 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60';

            return (
              <div
                key={g.id}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500 transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-xl hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] select-none touch-manipulation overflow-hidden"
              >
                {/* Ambient Glow */}
                <div className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-all bg-rose-500/10" />

                {/* Fila Superior: Tag técnico + Categoría */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500">
                      {tagGasto}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-sora border ${badgeBg}`}
                    >
                      {g.category}
                    </span>
                  </div>

                  {/* Descripción del Gasto con Icono */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${iconBoxBg} group-hover:scale-105 transition-transform mt-0.5`}
                    >
                      {esInsumos ? (
                        <ShoppingBag className="w-4 h-4" />
                      ) : esBebidas ? (
                        <Wine className="w-4 h-4" />
                      ) : esGas ? (
                        <Flame className="w-4 h-4" />
                      ) : (
                        <Receipt className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors"
                        title={g.description}
                      >
                        {g.description}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-0.5">
                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">Por: {g.usuario?.name || 'Administración'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Caja Financiera de Monto & Fecha */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 font-sora block">
                          Monto Erogado
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-sora">
                          S/ {monto.toFixed(2)}
                        </span>
                      </div>

                      {esHoy && (
                        <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 font-sora">
                          ¡Hoy!
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
                      <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-sora">
                        <Clock className="w-3 h-3 text-amber-500" />
                        <span>{fechaStr} • {horaStr}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción Táctiles */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(g)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold font-sora transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEliminar(g.id, g.description)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all active:scale-95 cursor-pointer"
                    title="Eliminar gasto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── VISTA EN TABLA CRONOLÓGICA DUAL LIGHT/DARK ── */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sora">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Código</th>
                  <th className="py-3.5 px-4 font-bold">Concepto / Detalle</th>
                  <th className="py-3.5 px-4 font-bold">Categoría</th>
                  <th className="py-3.5 px-4 font-bold">Responsable</th>
                  <th className="py-3.5 px-4 font-bold">Fecha y Hora</th>
                  <th className="py-3.5 px-4 font-bold text-right">Monto (S/)</th>
                  <th className="py-3.5 px-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {gastosFiltrados.map((g) => {
                  const tagGasto = `#G_${String(g.id).padStart(2, '0')}`;
                  const fechaObj = g.created_at ? new Date(g.created_at) : null;
                  const fechaStr = fechaObj
                    ? fechaObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
                    : 'Sin fecha';
                  const horaStr = fechaObj
                    ? fechaObj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })
                    : '--:--';

                  return (
                    <tr
                      key={g.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {tagGasto}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-100">
                        {g.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {g.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                        {g.usuario?.name || 'Administración'}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                        {fechaStr} • <span className="font-bold text-slate-700 dark:text-slate-300">{horaStr}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 dark:text-rose-400 text-sm">
                        S/ {parseFloat(g.amount || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(g)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(g.id, g.description)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── 6. MODAL PARA REGISTRAR / EDITAR GASTO OPERATIVO ─── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleGuardar}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-slate-800 dark:text-slate-100 font-sora"
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center shrink-0">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {gastoEditando ? 'Editar Gasto Operativo' : 'Registrar Gasto de Restaurante'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {gastoEditando
                      ? 'Modifique el importe o el rubro del comprobante.'
                      : 'Registre la compra de insumos, servicios o pagos de caja.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Concepto del Gasto */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Concepto / Detalle del Gasto *
              </label>
              <input
                type="text"
                required
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ej. Balón de gas GLP 45kg, Verduras mercado central, Bolsas..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
              />
            </div>

            {/* Categoría */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Categoría del Egreso
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-rose-500"
              >
                {CATEGORIAS_GASTO.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.desc})
                  </option>
                ))}
              </select>
            </div>

            {/* Monto */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Monto del Egreso (S/) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-rose-500">
                  S/
                </span>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-base font-black text-rose-600 dark:text-rose-400 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Botones del Modal */}
            <div className="flex gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalAbierto(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold font-sora hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 text-white text-xs font-bold font-sora hover:from-rose-500 hover:to-orange-500 shadow-md shadow-rose-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                {guardando
                  ? 'Guardando...'
                  : gastoEditando
                  ? 'Guardar Cambios'
                  : 'Registrar Egreso'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
