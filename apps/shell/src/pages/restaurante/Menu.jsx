import React, { useState, useEffect, useMemo } from 'react';
import { api } from './api';
import {
  BookOpen,
  Plus,
  Search,
  Flame,
  Wine,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Layers,
  RotateCw,
  CheckCircle2,
  UtensilsCrossed,
  ChefHat,
  LayoutGrid,
  List,
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  TrendingUp,
  Tag
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Menu() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [destinoFiltro, setDestinoFiltro] = useState('todos'); // 'todos' | 'kitchen' | 'bar' | 'dessert'
  const [vistaModo, setVistaModo] = useState('tarjetas'); // 'tarjetas' | 'tabla'
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  // Modal para Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState({
    name: '',
    category_id: '',
    price: '',
    cost: '',
    stock: '',
    destination: 'kitchen',
    description: ''
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resProds, resCats] = await Promise.all([
        api.get('/productos'),
        api.get('/productos/categorias')
      ]);
      if (resProds.success) setProductos(resProds.productos || []);
      if (resCats.success) setCategorias(resCats.categorias || []);
    } catch (err) {
      console.error('Error al cargar menú:', err);
      toast.error('Error al sincronizar la carta');
    } finally {
      setLoading(false);
      setUltimaActualizacion(new Date());
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Abrir modal para crear
  const abrirModalCrear = () => {
    setProductoEditando(null);
    setForm({
      name: '',
      category_id: categorias.length > 0 ? categorias[0].id : '',
      price: '',
      cost: '',
      stock: '',
      destination: 'kitchen',
      description: ''
    });
    setModalAbierto(true);
  };

  // Abrir modal para editar
  const abrirModalEditar = (prod) => {
    setProductoEditando(prod);
    setForm({
      name: prod.name || '',
      category_id: prod.category_id || (categorias.length > 0 ? categorias[0].id : ''),
      price: prod.price !== undefined && prod.price !== null ? prod.price.toString() : '',
      cost: prod.cost !== undefined && prod.cost !== null ? prod.cost.toString() : '',
      stock: prod.stock !== null && prod.stock !== undefined ? prod.stock.toString() : '',
      destination: prod.destination || 'kitchen',
      description: prod.description || ''
    });
    setModalAbierto(true);
  };

  // Guardar (Crear o Actualizar)
  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!form.name || !form.category_id || !form.price) {
      toast.error('Complete los campos requeridos (*)');
      return;
    }

    try {
      setGuardando(true);
      const payload = {
        name: form.name.trim(),
        category_id: form.category_id,
        price: parseFloat(form.price),
        cost: form.cost ? parseFloat(form.cost) : 0,
        stock: form.stock !== '' ? parseInt(form.stock, 10) : null,
        destination: form.destination,
        description: form.description ? form.description.trim() : ''
      };

      if (productoEditando) {
        const res = await api.put(`/productos/${productoEditando.id}`, payload);
        if (res.success) {
          toast.success(`"${payload.name}" actualizado correctamente`);
          setModalAbierto(false);
          cargarDatos();
        }
      } else {
        const res = await api.post('/productos', payload);
        if (res.success) {
          toast.success(`"${payload.name}" agregado a la carta`);
          setModalAbierto(false);
          cargarDatos();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al guardar producto');
    } finally {
      setGuardando(false);
    }
  };

  // Deshabilitar producto
  const handleEliminar = async (id, nombre) => {
    if (!confirm(`¿Desea deshabilitar "${nombre}" de la carta del restaurante?`)) return;
    try {
      const res = await api.delete(`/productos/${id}`);
      if (res.success) {
        toast.success(`Plato "${nombre}" deshabilitado`);
        cargarDatos();
      }
    } catch (err) {
      toast.error('Error al deshabilitar el ítem');
    }
  };

  // Contadores y métricas KPI
  const kpis = useMemo(() => {
    const total = productos.length;
    const cocina = productos.filter((p) => p.destination === 'kitchen').length;
    const bar = productos.filter((p) => p.destination === 'bar').length;
    const postres = productos.filter((p) => p.destination === 'dessert').length;
    return { total, cocina, bar, postres };
  }, [productos]);

  // Conteo de platos por categoría
  const conteoPorCategoria = useMemo(() => {
    const mapa = {};
    productos.forEach((p) => {
      const catId = p.category_id ? p.category_id.toString() : 'sin_cat';
      mapa[catId] = (mapa[catId] || 0) + 1;
    });
    return mapa;
  }, [productos]);

  // Filtrado de platos
  const prodsFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideCat =
        categoriaFiltro === 'todas' || p.category_id.toString() === categoriaFiltro.toString();
      const coincideDestino =
        destinoFiltro === 'todos' || p.destination === destinoFiltro;
      const coincideBusq =
        !busqueda.trim() ||
        p.name.toLowerCase().includes(busqueda.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(busqueda.toLowerCase()));
      return coincideCat && coincideDestino && coincideBusq;
    });
  }, [productos, categoriaFiltro, destinoFiltro, busqueda]);

  const horaActualizada = ultimaActualizacion.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="space-y-5 max-w-[1700px] w-full mx-auto">
      {/* ─── 1. ENCABEZADO DE CARTA GASTRONÓMICA (ESTILO DASHBOARD / CYBER TECH) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 font-sora">
              #04_MENU
            </span>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              CARTA_DIGITAL_V2
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </span>
            Carta Gastronómica y Menú Digital
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Gestión de platos, cócteles, costos de insumos, márgenes comerciales y enrutamiento a Cocina/Bar.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Buscador de Platos */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar plato, trago o ingrediente..."
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-8 pr-7 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 font-sora w-48 sm:w-60"
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
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vista en Tarjetas de la Carta"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setVistaModo('tabla')}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                vistaModo === 'tabla'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
              title="Vista en Tabla Detallada"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botón de Refrescar */}
          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-amber-300 dark:hover:border-amber-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            title="Refrescar catálogo"
          >
            <RotateCw
              className={`w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:rotate-180 transition-transform duration-500 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span className="font-sora text-[11px] font-bold hidden sm:inline">
              {loading ? 'Cargando...' : `Act. ${horaActualizada}`}
            </span>
          </button>

          {/* Botón Nuevo Plato */}
          <button
            type="button"
            onClick={abrirModalCrear}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold font-sora transition-all shadow-md shadow-amber-600/25 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Ítem</span>
          </button>
        </div>
      </div>

      {/* ─── 2. TARJETAS KPI (ESTILO DASHBOARD) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* KPI Total Platos */}
        <div
          onClick={() => {
            setDestinoFiltro('todos');
            setCategoriaFiltro('todas');
          }}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            destinoFiltro === 'todos' && categoriaFiltro === 'todas'
              ? 'border-amber-500/80 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">#01_TOTAL</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-sora">
                {kpis.total}
              </span>
              <span className="text-[10px] text-slate-400 font-bold font-sora">ítems</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Carta completa registrada</p>
          </div>
        </div>

        {/* KPI Cocina */}
        <div
          onClick={() => setDestinoFiltro(destinoFiltro === 'kitchen' ? 'todos' : 'kitchen')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            destinoFiltro === 'kitchen'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
              : 'border-rose-100/90 dark:border-slate-800 hover:border-rose-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">#02_COCINA</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-sora">
                {kpis.cocina}
              </span>
              <span className="text-[10px] text-rose-600 font-bold font-sora">platos</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Cocina caliente y fría</p>
          </div>
        </div>

        {/* KPI Bar & Bebidas */}
        <div
          onClick={() => setDestinoFiltro(destinoFiltro === 'bar' ? 'todos' : 'bar')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            destinoFiltro === 'bar'
              ? 'border-cyan-500 ring-2 ring-cyan-500/20 shadow-md shadow-cyan-500/10'
              : 'border-cyan-100/90 dark:border-slate-800 hover:border-cyan-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400">#03_BARRA</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200/80 dark:border-cyan-800/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Wine className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 font-sora">
                {kpis.bar}
              </span>
              <span className="text-[10px] text-cyan-600 font-bold font-sora">bebidas</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Coctelería y refrescos</p>
          </div>
        </div>

        {/* KPI Postres y Dulces */}
        <div
          onClick={() => setDestinoFiltro(destinoFiltro === 'dessert' ? 'todos' : 'dessert')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            destinoFiltro === 'dessert'
              ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-md shadow-purple-500/10'
              : 'border-purple-100/90 dark:border-slate-800 hover:border-purple-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-purple-600 dark:text-purple-400">#04_POSTRES</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200/80 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 font-sora">
                {kpis.postres}
              </span>
              <span className="text-[10px] text-purple-600 font-bold font-sora">postres</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Repostería y dulces</p>
          </div>
        </div>
      </div>

      {/* ─── 3. TARJETAS DE CATEGORÍAS (SELECTOR ESTILO SALONES) ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sora flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Categorías de la Carta Gastronómica
          </h2>
          <span className="text-[10.5px] text-slate-400 font-mono font-semibold">
            {categorias.length} Categorías Activas
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {/* Tarjeta: Todas las Categorías */}
          <div
            onClick={() => setCategoriaFiltro('todas')}
            role="button"
            tabIndex={0}
            className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2 overflow-hidden ${
              categoriaFiltro === 'todas'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-amber-600 transition-colors">
                #CAT_ALL
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  categoriaFiltro === 'todas'
                    ? 'bg-amber-500 ring-4 ring-amber-500/20'
                    : 'bg-slate-300 dark:bg-slate-700'
                }`}
              />
            </div>

            <div className="flex items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                  categoriaFiltro === 'todas'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-white'
                }`}
              >
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                  Todas
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {productos.length} ítems totales
                </p>
              </div>
            </div>
          </div>

          {/* Tarjetas de cada Categoría */}
          {categorias.map((cat, idx) => {
            const count = conteoPorCategoria[cat.id.toString()] || 0;
            const esActiva = categoriaFiltro.toString() === cat.id.toString();
            const tagCat = `#CAT_${String(idx + 1).padStart(2, '0')}`;

            return (
              <div
                key={cat.id}
                onClick={() => setCategoriaFiltro(cat.id)}
                role="button"
                tabIndex={0}
                className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2 overflow-hidden ${
                  esActiva
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-amber-600 transition-colors">
                    {tagCat}
                  </span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      esActiva
                        ? 'bg-amber-500 ring-4 ring-amber-500/20'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                      esActiva
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-white'
                    }`}
                  >
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                      {cat.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {count} {count === 1 ? 'ítem' : 'ítems'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. BARRA DE FILTROS SECUNDARIOS & RESULTADOS ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-1 pt-1">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 font-sora tracking-tight">
            Platos y Carta {categoriaFiltro !== 'todas' ? `(${categorias.find((c) => c.id.toString() === categoriaFiltro.toString())?.name || ''})` : ''}
          </h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
            {prodsFiltrados.length} {prodsFiltrados.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

        {/* Filtros de Destino Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setDestinoFiltro('todos')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer ${
              destinoFiltro === 'todos'
                ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => setDestinoFiltro('kitchen')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              destinoFiltro === 'kitchen'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:border-rose-300'
            }`}
          >
            <Flame className="w-3 h-3" />
            Cocina ({kpis.cocina})
          </button>
          <button
            type="button"
            onClick={() => setDestinoFiltro('bar')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              destinoFiltro === 'bar'
                ? 'bg-cyan-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 hover:border-cyan-300'
            }`}
          >
            <Wine className="w-3 h-3" />
            Bar ({kpis.bar})
          </button>
          <button
            type="button"
            onClick={() => setDestinoFiltro('dessert')}
            className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              destinoFiltro === 'dessert'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'bg-white dark:bg-slate-800/80 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:border-purple-300'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Postres ({kpis.postres})
          </button>
        </div>
      </div>

      {/* ─── 5. CONTENIDO: TARJETAS O TABLA ─── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-xs font-sora flex flex-col items-center justify-center gap-2">
          <RotateCw className="w-6 h-6 animate-spin text-amber-500" />
          <span>Sincronizando carta gastronómica del restaurante...</span>
        </div>
      ) : prodsFiltrados.length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs font-sora bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-2xs">
          No se encontraron platos ni bebidas con los filtros seleccionados.
        </div>
      ) : vistaModo === 'tarjetas' ? (
        /* ── VISTA EN TARJETAS DE LA CARTA (ESTILO DASHBOARD / MESAS) ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {prodsFiltrados.map((p) => {
            const precio = parseFloat(p.price || 0);
            const costo = parseFloat(p.cost || 0);
            const margenPct =
              precio > 0 && costo > 0 ? Math.round(((precio - costo) / precio) * 100) : null;

            const esCocina = p.destination === 'kitchen';
            const esBar = p.destination === 'bar';
            const esPostre = p.destination === 'dessert';

            const cardBorder = esCocina
              ? 'border-slate-200/90 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-500'
              : esBar
              ? 'border-slate-200/90 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-500'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500';

            const glowBg = esCocina
              ? 'bg-rose-500/10'
              : esBar
              ? 'bg-cyan-500/10'
              : 'bg-purple-500/10';

            const iconBoxBg = esCocina
              ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60'
              : esBar
              ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-600 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-800/60'
              : 'bg-purple-50 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 border-purple-200/80 dark:border-purple-800/60';

            const tagPlato = `#P_${String(p.id).padStart(2, '0')}`;

            return (
              <div
                key={p.id}
                className={`group relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-xl hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] select-none touch-manipulation overflow-hidden ${cardBorder}`}
              >
                {/* Ambient Glow */}
                <div
                  className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-all ${glowBg}`}
                />

                {/* Fila Superior: Tag técnico + Categoría + Badge Destino */}
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                        {tagPlato}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate max-w-[95px] font-semibold">
                        • {p.categoria?.name || 'General'}
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 font-sora ${
                        esCocina
                          ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                          : esBar
                          ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/60'
                          : 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60'
                      }`}
                    >
                      {esCocina ? (
                        <Flame className="w-3 h-3" />
                      ) : esBar ? (
                        <Wine className="w-3 h-3" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      {esCocina ? 'Cocina' : esBar ? 'Barra' : 'Postres'}
                    </span>
                  </div>

                  {/* Nombre del Plato y Detalle con Icono */}
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${iconBoxBg} group-hover:scale-105 transition-transform mt-0.5`}
                    >
                      {esCocina ? (
                        <Flame className="w-4 h-4" />
                      ) : esBar ? (
                        <Wine className="w-4 h-4" />
                      ) : (
                        <UtensilsCrossed className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora truncate group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors"
                        title={p.name}
                      >
                        {p.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium line-clamp-2 mt-0.5 min-h-[30px]">
                        {p.description || 'Receta gastronómica estándar de la casa.'}
                      </p>
                    </div>
                  </div>

                  {/* Caja Comercial (Precios, Costo, Margen y Stock) */}
                  <div className="mt-3.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-[9.5px] uppercase font-bold text-slate-400 font-sora block">
                          Precio Venta
                        </span>
                        <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-sora">
                          S/ {precio.toFixed(2)}
                        </span>
                      </div>

                      {margenPct !== null && margenPct > 0 && (
                        <div className="text-right">
                          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-sora bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60">
                            <TrendingUp className="w-3 h-3" />
                            +{margenPct}%
                          </span>
                          <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">
                            margen bruto
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/60 dark:border-slate-700/60 text-[10.5px]">
                      <div className="text-slate-500 dark:text-slate-400 font-medium">
                        Costo: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">S/ {costo.toFixed(2)}</span>
                      </div>

                      <div>
                        {p.stock !== null ? (
                          <span
                            className={`inline-flex items-center gap-1 font-bold font-sora ${
                              p.stock <= 5
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {p.stock <= 5 && <AlertTriangle className="w-3 h-3" />}
                            Stock: {p.stock}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold font-sora">
                            <CheckCircle2 className="w-3 h-3" />
                            Ilimitado
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción Táctiles */}
                <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => abrirModalEditar(p)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold font-sora transition-all active:scale-95 cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEliminar(p.id, p.name)}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 hover:text-rose-600 border border-transparent hover:border-rose-200 dark:hover:border-rose-800 transition-all active:scale-95 cursor-pointer"
                    title="Deshabilitar de la carta"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── VISTA EN TABLA MODERNA DUAL LIGHT/DARK ── */
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sora">
              <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Código</th>
                  <th className="py-3.5 px-4 font-bold">Plato / Bebida</th>
                  <th className="py-3.5 px-4 font-bold">Categoría</th>
                  <th className="py-3.5 px-4 font-bold">Área Destino</th>
                  <th className="py-3.5 px-4 font-bold text-right">Precio Venta</th>
                  <th className="py-3.5 px-4 font-bold text-right">Costo Insumos</th>
                  <th className="py-3.5 px-4 font-bold text-center">Margen</th>
                  <th className="py-3.5 px-4 font-bold text-center">Stock</th>
                  <th className="py-3.5 px-4 font-bold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {prodsFiltrados.map((p) => {
                  const precio = parseFloat(p.price || 0);
                  const costo = parseFloat(p.cost || 0);
                  const margenPct =
                    precio > 0 && costo > 0 ? Math.round(((precio - costo) / precio) * 100) : null;
                  const tagPlato = `#P_${String(p.id).padStart(2, '0')}`;

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-400">
                        {tagPlato}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-100">
                          {p.name}
                        </div>
                        {p.description && (
                          <div className="text-[10px] text-slate-400 line-clamp-1">
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-medium">
                        {p.categoria?.name || 'General'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            p.destination === 'kitchen'
                              ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                              : p.destination === 'bar'
                              ? 'bg-cyan-50 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/60'
                              : 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60'
                          }`}
                        >
                          {p.destination === 'kitchen' ? (
                            <Flame className="w-3 h-3" />
                          ) : p.destination === 'bar' ? (
                            <Wine className="w-3 h-3" />
                          ) : (
                            <Sparkles className="w-3 h-3" />
                          )}
                          {p.destination === 'kitchen'
                            ? 'Cocina'
                            : p.destination === 'bar'
                            ? 'Bar'
                            : 'Postres'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                        S/ {precio.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500 dark:text-slate-400 font-mono">
                        S/ {costo.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {margenPct !== null ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                            +{margenPct}%
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-700 dark:text-slate-300 font-bold">
                        {p.stock !== null ? p.stock : 'Ilimitado'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => abrirModalEditar(p)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/60 transition-colors"
                            title="Editar plato"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminar(p.id, p.name)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-colors"
                            title="Deshabilitar"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* ─── 6. MODAL PARA CREAR / EDITAR PRODUCTO (ESTILO DASHBOARD / MESAS) ─── */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleGuardar}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-slate-800 dark:text-slate-100 font-sora"
          >
            {/* Cabecera del Modal */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
                  {productoEditando ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight text-slate-900 dark:text-slate-100">
                    {productoEditando ? 'Editar Ítem de la Carta' : 'Nuevo Ítem a la Carta'}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {productoEditando
                      ? 'Actualice precios, costos o área de preparación.'
                      : 'Complete los datos del plato o bebida comercial.'}
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

            {/* Nombre */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Nombre del Plato o Bebida *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ej. Lomo Saltado Criollo, Pisco Sour Catedral..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10"
              />
            </div>

            {/* Categoría y Destino */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Categoría Gastronómica *
                </label>
                <select
                  required
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="">Seleccionar categoría...</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Área Destino de Comanda *
                </label>
                <select
                  value={form.destination}
                  onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                >
                  <option value="kitchen">Cocina (KDS / Impresora)</option>
                  <option value="bar">Bar & Bebidas</option>
                  <option value="dessert">Postres & Repostería</option>
                </select>
              </div>
            </div>

            {/* Precios, Costo y Stock */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Precio Venta (S/) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-600 dark:text-amber-400 font-black focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Costo Insumo (S/)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  placeholder="0.00"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                  Stock Límite
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="Ilimitado"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Vista Previa de Margen en tiempo real */}
            {parseFloat(form.price) > 0 && parseFloat(form.cost) > 0 && (
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs font-sora">
                <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  Margen Bruto Calculado:
                </span>
                <span className="font-black text-emerald-700 dark:text-emerald-300">
                  +{Math.round(((parseFloat(form.price) - parseFloat(form.cost)) / parseFloat(form.price)) * 100)}%
                  {' '}(S/ {(parseFloat(form.price) - parseFloat(form.cost)).toFixed(2)} ganancia)
                </span>
              </div>
            )}

            {/* Descripción */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Descripción / Ingredientes Destacados (Opcional)
              </label>
              <textarea
                rows="2"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Breve reseña para la carta o notas para los mozos..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-xs text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-amber-500"
              />
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
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold font-sora hover:from-amber-500 hover:to-orange-500 shadow-md shadow-amber-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
              >
                {guardando ? 'Guardando...' : productoEditando ? 'Guardar Cambios' : 'Registrar Ítem'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
