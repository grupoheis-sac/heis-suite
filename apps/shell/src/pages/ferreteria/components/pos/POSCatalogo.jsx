/**
 * POSCatalogo.jsx — Catálogo de Artículos y Materiales de Ferretería
 * Panel izquierdo del POS: Búsqueda reactiva, escáner de código de barras,
 * chips de familias ferreteras con scroll horizontal y tarjetas de productos con stock y ubicación.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Barcode,
  Search,
  UserPlus,
  Package,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  MapPin,
  AlertTriangle,
  FileSpreadsheet,
  Boxes,
  Sparkles,
  Zap,
  Flame,
  LayoutGrid,
  List,
  Check,
  Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { notificarProductoAgregado } from '../../utils/notificaciones';
import { getCategoryConfig } from './categoryColors';

const STAPLES_CONFIG = [
  { id: 'cemento', label: 'Cemento', icon: '🏗️', regex: /cemento/i },
  { id: 'fierro', label: 'Fierro 1/2"', icon: '🔩', regex: /fierro|varilla|corrugad/i },
  { id: 'alambre', label: 'Alambre #16', icon: '🧵', regex: /alambre/i },
  { id: 'clavos', label: 'Clavos', icon: '🔨', regex: /clavo/i },
  { id: 'pvc', label: 'Tubo PVC', icon: '🚰', regex: /tubo|pvc/i },
  { id: 'pegamento', label: 'Pegamento PVC', icon: '🧪', regex: /pegamento|oatey/i },
  { id: 'pintura', label: 'Pintura', icon: '🎨', regex: /pintura|latex|esmalte/i },
  { id: 'agregados', label: 'Áridos / Arena', icon: '🧱', regex: /arena|ladrillo|yeso|cal/i }
];

const HardwareProductCard = React.memo(function HardwareProductCard({
  prod,
  catConfig,
  agotado,
  bajoStock,
  addItem,
  modoVisual = 'visual'
}) {
  const stockActual = parseFloat(prod.stock || 0);
  const stockMin = parseFloat(prod.stock_minimo || 5);
  const precio = parseFloat(prod.precio_venta || 0);
  const unidad = prod.unidad_medida || 'UND';

  return (
    <div
      onClick={() => {
        if (agotado) {
          toast.error(`Producto agotado: ${prod.nombre}`);
          return;
        }
        try {
          addItem(prod, 1);
          notificarProductoAgregado({
            nombre: prod.nombre,
            formato: unidad,
            cantidad: 1,
            precio: prod.precio_venta,
            unidad: unidad
          });
        } catch (err) {
          toast.error(err.message || 'Error al añadir');
        }
      }}
      className={`pos-hardware-card group relative bg-white dark:bg-slate-900 rounded-2xl border flex flex-col justify-between p-2.5 sm:p-3 min-w-0 overflow-hidden cursor-pointer select-none transition-all duration-150 active:scale-[0.98] hover:shadow-md ${
        agotado
          ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-60 cursor-not-allowed'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-indigo-500/10'
      }`}
    >
      <div className="space-y-1.5 min-w-0 flex-1 flex flex-col justify-between">
        {/* Banner de Foto en Modo Visual */}
        {modoVisual === 'visual' && (
          <div className="relative w-full h-20 sm:h-22 rounded-xl overflow-hidden mb-1.5 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200/60 dark:border-slate-800 shrink-0">
            {prod.imagen ? (
              <img
                src={prod.imagen}
                alt={prod.nombre}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 p-2 text-center">
                <Package className="w-7 h-7 opacity-40 mb-1" />
                <span className="text-[9.5px] font-bold text-slate-400 dark:text-slate-500 font-sora truncate max-w-[120px]">
                  {prod.categoria?.nombre || catConfig.nombre}
                </span>
              </div>
            )}

            {/* Badge de stock sobre la foto */}
            <div className="absolute top-1.5 right-1.5 pointer-events-none">
              <span
                className={`text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md shadow-2xs backdrop-blur-xs ${
                  agotado
                    ? 'bg-rose-500/95 text-white'
                    : bajoStock
                    ? 'bg-amber-500/95 text-white'
                    : 'bg-emerald-600/95 text-white'
                }`}
              >
                {agotado ? 'Sin stock' : `${stockActual} ${unidad.slice(0, 3)}`}
              </span>
            </div>
          </div>
        )}

        {/* Cabecera de la Tarjeta: Categoría (con punto indicador) + Unidad de Medida */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></span>
            <span
              className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate font-sora"
              title={prod.categoria?.nombre || catConfig.nombre}
            >
              {prod.categoria?.nombre || catConfig.nombre}
            </span>
          </div>

          <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-50/80 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 font-mono shrink-0">
            {unidad}
          </span>
        </div>

        {/* Nombre del Producto y Código */}
        <div className="min-w-0 my-0.5">
          <h3
            className="font-bold text-slate-800 dark:text-slate-100 text-[13px] sm:text-sm leading-snug line-clamp-2 break-words group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-sora"
            title={prod.nombre}
          >
            {prod.nombre}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {prod.codigo_barras && (
              <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 truncate">
                COD: {prod.codigo_barras}
              </span>
            )}
            {prod.ubicacion && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.2 rounded border border-amber-200/70 dark:border-amber-800/50 truncate"
                title={`Ubicación física: ${prod.ubicacion}`}
              >
                <MapPin className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate">{prod.ubicacion}</span>
              </span>
            )}
          </div>
        </div>

        {/* Semáforo de Stock a la izquierda + Precio destacado a la derecha (anti-overflow) */}
        <div className="flex items-center justify-between text-xs gap-1 pt-2 mt-auto border-t border-slate-100 dark:border-slate-800/80 min-w-0 w-full overflow-hidden">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold font-sora min-w-0 max-w-[55%] truncate shrink ${
              agotado
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                : bajoStock
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
            }`}
            title={agotado ? 'Sin stock' : `${stockActual} ${unidad.toLowerCase()}`}
          >
            <Package className="w-3 h-3 shrink-0" />
            <span className="truncate">
              {agotado ? 'Sin stock' : `${stockActual} ${unidad.toLowerCase()}`}
            </span>
          </span>

          <div className="flex items-baseline gap-0.5 text-right shrink-0 ml-auto whitespace-nowrap">
            <span className="text-[10px] font-extrabold text-indigo-500 dark:text-indigo-400 font-sora">S/</span>
            <span className="text-sm sm:text-[15px] font-black font-sora text-slate-900 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {precio.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function POSCatalogo({
  busqueda,
  setBusqueda,
  cargando,
  searchInputRef,
  handleBarcodeSubmit,
  productos = [],
  productosFiltrados = [],
  filtroCategoria,
  setFiltroCategoria,
  addItem,
  onAbrirModalCotizacion,
  onAbrirRegistroRapidoConDoc
}) {
  const [mostrarAltaRotacion, setMostrarAltaRotacion] = useState(true);
  const [modoVisual, setModoVisual] = useState(() => {
    return localStorage.getItem('ferre_pos_modo_visual') === 'compacto' ? 'compacto' : 'visual';
  });
  const [dropdownCatOpen, setDropdownCatOpen] = useState(false);
  const [busquedaCat, setBusquedaCat] = useState('');
  const dropdownCatRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera o presionar Esc
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownCatRef.current && !dropdownCatRef.current.contains(e.target)) {
        setDropdownCatOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownCatOpen(false);
      }
    };
    if (dropdownCatOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropdownCatOpen]);

  // Detección reactiva de los 8 artículos de mayor rotación ferretera
  const itemsAltaRotacion = useMemo(() => {
    if (!productos || productos.length === 0) return [];
    const matched = [];
    const usedIds = new Set();

    STAPLES_CONFIG.forEach((cfg) => {
      const found = productos.find((p) => cfg.regex.test(p.nombre) && !usedIds.has(p.id));
      if (found) {
        usedIds.add(found.id);
        matched.push({
          cfg,
          producto: found
        });
      }
    });

    // Si aún quedan cupos para completar 8, rellenar con productos con mayor stock
    if (matched.length < 8) {
      const ordenadosPorStock = [...productos]
        .filter((p) => !usedIds.has(p.id) && parseFloat(p.stock || 0) > 0)
        .sort((a, b) => parseFloat(b.stock || 0) - parseFloat(a.stock || 0));

      for (const p of ordenadosPorStock) {
        if (matched.length >= 8) break;
        usedIds.add(p.id);
        matched.push({
          cfg: {
            id: `prod-${p.id}`,
            label: p.nombre.split(' ')[0] + ' ' + (p.nombre.split(' ')[1] || ''),
            icon: '📦'
          },
          producto: p
        });
      }
    }

    return matched;
  }, [productos]);

  // Extracción dinámica de categorías
  const categoriasDisponibles = useMemo(() => {
    const map = new Map();

    // Filtros base
    map.set('TODOS', {
      id: 'TODOS',
      nombre: 'Todos los Artículos',
      tipo: 'filtro',
      total: productos.length
    });
    map.set('CON_STOCK', {
      id: 'CON_STOCK',
      nombre: 'Con Stock',
      tipo: 'filtro',
      total: productos.filter((p) => parseFloat(p.stock || 0) > 0).length
    });
    map.set('BAJO_STOCK', {
      id: 'BAJO_STOCK',
      nombre: 'Bajo Stock',
      tipo: 'filtro',
      total: productos.filter((p) => {
        const s = parseFloat(p.stock || 0);
        const min = parseFloat(p.stock_minimo || 5);
        return s > 0 && s <= min;
      }).length
    });

    // Categorías del backend
    productos.forEach((p) => {
      const catObj = p.categoria;
      const catNombre = typeof catObj === 'object' ? catObj?.nombre : p.categoria;
      if (catNombre && catNombre.trim()) {
        const key = catNombre.trim();
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            nombre: key,
            id_categoria: p.id_categoria,
            tipo: 'categoria',
            total: 1
          });
        } else {
          const item = map.get(key);
          item.total += 1;
        }
      }
    });

    return Array.from(map.values());
  }, [productos]);

  const categoriasList = useMemo(() => {
    return categoriasDisponibles.filter((c) => c.tipo === 'categoria');
  }, [categoriasDisponibles]);

  const categoriasFiltradasList = useMemo(() => {
    if (!busquedaCat.trim()) return categoriasList;
    const q = busquedaCat.trim().toLowerCase();
    return categoriasList.filter((c) => c.nombre.toLowerCase().includes(q));
  }, [categoriasList, busquedaCat]);

  const totalBajoStock = useMemo(() => {
    return productos.filter((p) => {
      const s = parseFloat(p.stock || 0);
      const min = parseFloat(p.stock_minimo || 5);
      return s > 0 && s <= min;
    }).length;
  }, [productos]);

  const esCategoriaEspecifica = filtroCategoria !== 'TODOS' && filtroCategoria !== 'CON_STOCK' && filtroCategoria !== 'BAJO_STOCK';

  // Detección de si la barra contiene DNI (8 dígitos) o RUC (11 dígitos)
  const esDocumentoEnBarra = useMemo(() => {
    const clean = busqueda.trim().replace(/\D/g, '');
    return (clean.length === 8 && busqueda.trim() === clean) ||
           (clean.length === 11 && busqueda.trim() === clean);
  }, [busqueda]);

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/90 rounded-[28px] p-3.5 sm:p-5 soft-card-shadow border border-slate-100 dark:border-slate-800 min-h-[500px] lg:min-h-0 lg:h-full min-w-0 overflow-hidden">
      {/* ── BARRA SUPERIOR STICKY: Búsqueda, Código de Barras y Atajos ── */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
        <form onSubmit={handleBarcodeSubmit} className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              id="pos-barcode-input"
              ref={searchInputRef}
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, código de barras o ubicación..."
              className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 rounded-2xl pl-10 pr-20 py-2.5 text-xs text-slate-800 dark:text-slate-100 font-sora font-semibold border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-9 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer"
              title="Escanear código de barras [Enter]"
            >
              <Barcode className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Atajos Rápidos */}
          <button
            type="button"
            onClick={() => onAbrirRegistroRapidoConDoc?.('')}
 className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/60 text-xs font-extrabold transition-all cursor-pointer shrink-0"
            title="Registrar Nuevo Cliente [F4]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Cliente</span>
            <span className="text-[10px] font-mono font-black text-indigo-500 dark:text-indigo-400">[F4]</span>
          </button>

          <button
            type="button"
            onClick={onAbrirModalCotizacion}
 className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 text-xs font-extrabold transition-all cursor-pointer shrink-0"
            title="Cargar Cotización [F6]"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-500" />
            <span>Cotización</span>
            <span className="text-[10px] font-mono font-black text-slate-500 dark:text-slate-400">[F6]</span>
          </button>
        </form>

        {/* Sugerencia Rápida si se digita DNI/RUC en la barra */}
        {esDocumentoEnBarra && (
          <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-2.5 flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
 <p className="text-xs text-indigo-900 dark:text-indigo-200 font-semibold ">
                ¿Desea registrar al cliente con {busqueda.trim().length === 8 ? 'DNI' : 'RUC'}{' '}
                <span className="font-mono font-black">{busqueda.trim()}</span>?
              </p>
            </div>
            <button
              type="button"
              onClick={() => onAbrirRegistroRapidoConDoc?.(busqueda.trim())}
 className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
            >
              Registrar Cliente
            </button>
          </div>
        )}

        {/* ── BARRA DE ALTA ROTACIÓN ULTRA-COMPACTA (TIRA RÁPIDA DE 1 SOLA FILA) ── */}
        {itemsAltaRotacion.length > 0 && mostrarAltaRotacion && (
          <div className="bg-amber-50/50 dark:bg-slate-800/60 rounded-xl px-2.5 py-1 border border-amber-200/60 dark:border-slate-700/80 flex items-center gap-1.5 min-w-0 shadow-2xs animate-in fade-in duration-150">
            {/* Etiqueta / Icono */}
            <div className="flex items-center gap-1 shrink-0 text-amber-700 dark:text-amber-400 pl-0.5">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-tight font-sora hidden sm:inline">
                Rápidos:
              </span>
            </div>

            {/* Tira horizontal deslizable de micro-chips */}
            <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth min-w-0 py-0.5">
              {itemsAltaRotacion.map(({ cfg, producto }) => {
                const stockActual = parseFloat(producto.stock || 0);
                const agotado = stockActual <= 0;
                const precio = parseFloat(producto.precio_venta || 0);
                const unidad = producto.unidad_medida || 'UND';

                return (
                  <button
                    key={producto.id}
                    type="button"
                    disabled={agotado}
                    onClick={() => {
                      if (agotado) {
                        toast.error(`Agotado: ${producto.nombre}`);
                        return;
                      }
                      try {
                        addItem(producto, 1);
                        notificarProductoAgregado({
                          nombre: producto.nombre,
                          formato: unidad,
                          cantidad: 1,
                          precio: producto.precio_venta,
                          unidad: unidad
                        });
                      } catch (err) {
                        toast.error(err.message || 'Error al añadir');
                      }
                    }}
                    className={`h-7 px-2 rounded-lg border text-xs flex items-center gap-1.5 shrink-0 transition-all cursor-pointer select-none active:scale-95 group/quick ${
                      agotado
                        ? 'bg-slate-100/70 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-400 opacity-50 cursor-not-allowed'
                        : 'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-600/70 text-slate-700 dark:text-slate-200 shadow-2xs hover:shadow-xs'
                    }`}
                    title={`Añadir 1 ${unidad} de ${producto.nombre} (Stock: ${stockActual})`}
                  >
                    <span className="text-xs leading-none shrink-0">{cfg.icon}</span>
                    <span className="text-[10.5px] font-bold font-sora truncate max-w-[85px] sm:max-w-[110px] group-hover/quick:text-amber-700 dark:group-hover/quick:text-amber-300">
                      {cfg.label || producto.nombre}
                    </span>
                    <span className="text-[10px] font-black font-mono text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-1 py-0.2 rounded border border-indigo-100 dark:border-indigo-900/40">
                      S/{precio.toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Botón de Colapsar */}
            <button
              type="button"
              onClick={() => setMostrarAltaRotacion(false)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors shrink-0 cursor-pointer"
              title="Ocultar barra de artículos rápidos"
              aria-label="Ocultar rápidos"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Botón sutil para re-expandir Alta Rotación si está oculta */}
        {itemsAltaRotacion.length > 0 && !mostrarAltaRotacion && (
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] text-slate-400 font-semibold font-sora">
              Artículos de alta rotación ocultos
            </span>
            <button
              type="button"
              onClick={() => setMostrarAltaRotacion(true)}
 className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/50 cursor-pointer transition-all hover:scale-102 shadow-2xs"
              title="Mostrar los artículos rápidos de mostrador"
            >
              <Zap className="w-3 h-3 fill-current text-amber-500" />
              <span>Mostrar Rápidos ({itemsAltaRotacion.length})</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* ── BARRA UNIFICADA: Categorías, Filtros de Stock y Modos de Vista (36px) ── */}
        <div className="flex items-center justify-between gap-2 pt-0.5 min-w-0 relative z-30">
          {/* Izquierda: Filtros Rápidos (en scroll) + Selector Dropdown (afuera de scroll para flotar libre) */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Tira scrollable de chips rápidos */}
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5">
              {/* Chip Todos */}
              <button
                type="button"
                onClick={() => setFiltroCategoria('TODOS')}
 className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                  filtroCategoria === 'TODOS'
                    ? 'bg-indigo-600 text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                }`}
              >
                <span>Todos</span>
                <span className={`text-[10px] font-mono font-bold px-1 rounded-full ${
                  filtroCategoria === 'TODOS' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {productos.length}
                </span>
              </button>

              {/* Chip Con Stock */}
              <button
                type="button"
                onClick={() => setFiltroCategoria('CON_STOCK')}
 className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                  filtroCategoria === 'CON_STOCK'
                    ? 'bg-emerald-600 text-white shadow-xs font-extrabold'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                }`}
                title="Mostrar solo artículos con inventario disponible"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                <span>En Stock</span>
              </button>

              {/* Chip Bajo Stock (si hay artículos con stock crítico) */}
              {totalBajoStock > 0 && (
                <button
                  type="button"
                  onClick={() => setFiltroCategoria('BAJO_STOCK')}
 className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 whitespace-nowrap transition-all cursor-pointer ${
                    filtroCategoria === 'BAJO_STOCK'
                      ? 'bg-amber-600 text-white shadow-xs font-extrabold'
                      : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700'
                  }`}
                  title={`${totalBajoStock} artículos en stock mínimo`}
                >
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Bajo Stock</span>
                  <span className="text-[10px] font-mono px-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-bold">
                    {totalBajoStock}
                  </span>
                </button>
              )}
            </div>

            {/* Selector Desplegable de Familias Ferreteras (AFUERA del scroll para que el popover flote libremente) */}
            <div className="relative shrink-0" ref={dropdownCatRef}>
              <button
                type="button"
                onClick={() => setDropdownCatOpen((prev) => !prev)}
 className={`px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  esCategoriaEspecifica
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-500/20 font-extrabold'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title="Filtrar por Familia / Categoría de Ferretería"
              >
                <Boxes className={`w-3.5 h-3.5 shrink-0 ${esCategoriaEspecifica ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`} />
                <span className="whitespace-nowrap font-semibold">
                  {esCategoriaEspecifica ? filtroCategoria : `Familias (${categoriasList.length})`}
                </span>
                {esCategoriaEspecifica ? (
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setFiltroCategoria('TODOS');
                    }}
                    className="p-0.5 rounded hover:bg-indigo-200/60 dark:hover:bg-indigo-800 text-indigo-600 dark:text-indigo-300 cursor-pointer ml-0.5"
                    title="Quitar filtro de categoría"
                  >
                    <X className="w-3 h-3" />
                  </span>
                ) : (
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${dropdownCatOpen ? 'rotate-180' : ''}`} />
                )}
              </button>

              {/* Popover flotante del catálogo de categorías */}
              {dropdownCatOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-slate-900/5 select-none">
                  {/* Cabecera & Buscador rápido de categorías */}
                  <div className="pb-2 mb-1.5 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between px-1 mb-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider font-sora">
                        Familias de Artículos
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 font-bold">
                        {categoriasList.length} familias
                      </span>
                    </div>
                    {categoriasList.length > 5 && (
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={busquedaCat}
                          onChange={(e) => setBusquedaCat(e.target.value)}
                          placeholder="Buscar familia (ej. tubos, clavos)..."
                          className="w-full bg-slate-50 dark:bg-slate-800 rounded-xl pl-8 pr-7 py-1 text-xs text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700 outline-none focus:ring-1 focus:ring-indigo-500 font-sora"
                        />
                        {busquedaCat && (
                          <button
                            type="button"
                            onClick={() => setBusquedaCat('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Lista scrollable de familias */}
                  <div className="max-h-60 overflow-y-auto space-y-1 custom-modal-scroll pr-1">
                    {/* Opción 'Todas las Familias' */}
                    <button
                      type="button"
                      onClick={() => {
                        setFiltroCategoria('TODOS');
                        setDropdownCatOpen(false);
                        setBusquedaCat('');
                      }}
 className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        filtroCategoria === 'TODOS'
                          ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-extrabold'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">Todas las Familias</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md">
                        {productos.length}
                      </span>
                    </button>

                    {/* Lista filtrada de categorías */}
                    {categoriasFiltradasList.map((cat) => {
                      const config = getCategoryConfig(cat.id);
                      const Icono = config.icon || Boxes;
                      const estaActivo = filtroCategoria === cat.id;

                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setFiltroCategoria(cat.id);
                            setDropdownCatOpen(false);
                            setBusquedaCat('');
                          }}
 className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            estaActivo
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-extrabold ring-1 ring-indigo-300 dark:ring-indigo-700'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Icono className={`w-3.5 h-3.5 shrink-0 ${estaActivo ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                            <span className="truncate">{cat.nombre}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] font-mono text-slate-400 font-bold bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md">
                              {cat.total}
                            </span>
                            {estaActivo && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                          </div>
                        </button>
                      );
                    })}

                    {categoriasFiltradasList.length === 0 && (
 <p className="text-[11px] text-center text-slate-400 py-3 ">
                        No hay familias que coincidan
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Derecha: Conteo y Selector Galería / Compacto */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="hidden xl:flex items-center gap-1 text-[11px] font-bold text-slate-400 font-sora">
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded border border-indigo-200/60 dark:border-indigo-800/60">
                {productosFiltrados.length}
              </span>
              <span>arts.</span>
            </div>

            {/* Toggle Galería / Compacto (Iconos compactos) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setModoVisual('visual');
                  localStorage.setItem('ferre_pos_modo_visual', 'visual');
                }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  modoVisual === 'visual'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Vista Galería (con imágenes)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoVisual('compacto');
                  localStorage.setItem('ferre_pos_modo_visual', 'compacto');
                }}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  modoVisual === 'compacto'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Vista Compacta de Mostrador"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── LISTADO / GRILLA DE ARTÍCULOS ── */}
      <div className="flex-1 overflow-y-auto pt-3.5 pr-1 space-y-3 custom-modal-scroll">
        {cargando ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <p className="text-xs font-bold ">Buscando productos en catálogo...</p>
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 text-slate-400">
              <Package className="w-7 h-7" />
            </div>
 <p className="text-sm font-bold text-slate-700 dark:text-slate-200 ">
              No se encontraron artículos
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              {busqueda
                ? 'Pruebe con otro término o verifique el código de barras.'
                : 'No hay productos registrados en esta categoría.'}
            </p>
          </div>
        ) : (
          <div className={`grid gap-2.5 sm:gap-3 ${
            modoVisual === 'visual'
              ? 'grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
              : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
          }`}>
            {productosFiltrados.map((prod) => {
              const catConfig = getCategoryConfig(prod.categoria?.nombre || prod.categoria);
              const stock = parseFloat(prod.stock || 0);
              const stockMin = parseFloat(prod.stock_minimo || 5);
              const agotado = stock <= 0;
              const bajoStock = stock > 0 && stock <= stockMin;

              return (
                <HardwareProductCard
                  key={prod.id}
                  prod={prod}
                  catConfig={catConfig}
                  agotado={agotado}
                  bajoStock={bajoStock}
                  addItem={addItem}
                  modoVisual={modoVisual}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
