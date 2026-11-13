import React, { useMemo, useRef } from 'react';
import {
  Search, Barcode, Check, ShoppingBag, RefreshCw
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { HOTEL_CATEGORY_PALETTES, getHotelCategoryConfig } from './hotelCategoryColors';

export default function POSHotelCatalogo({
  productos = [],
  cargando = false,
  busqueda = '',
  setBusqueda,
  filtroCategoria = 'TODOS',
  setFiltroCategoria,
  onAgregarItem,
  itemsEnCarrito = [],
  onRecargar
}) {
  const searchInputRef = useRef(null);

  // Mapeo rápido de cantidades actuales en el carrito
  const cantidadesEnCarrito = useMemo(() => {
    const map = {};
    itemsEnCarrito.forEach((it) => {
      map[it.id] = (map[it.id] || 0) + it.cantidad;
    });
    return map;
  }, [itemsEnCarrito]);

  // Contadores por categoría
  const conteoPorCategoria = useMemo(() => {
    const counts = { TODOS: productos.length };
    productos.forEach((p) => {
      const cat = (p.categoria || 'otros').toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [productos]);

  // Filtrado de productos por búsqueda y categoría
  const productosFiltrados = useMemo(() => {
    let list = [...productos];

    if (filtroCategoria !== 'TODOS') {
      list = list.filter((p) => (p.categoria || '').toUpperCase() === filtroCategoria);
    }

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim();
      list = list.filter((p) =>
        (p.nombre && p.nombre.toLowerCase().includes(q)) ||
        (p.codigo && p.codigo.toLowerCase().includes(q)) ||
        (p.descripcion && p.descripcion.toLowerCase().includes(q))
      );
    }

    return list;
  }, [productos, filtroCategoria, busqueda]);

  // Manejo de lectura de código de barras
  const handleKeyDownBusqueda = (e) => {
    if (e.key === 'Enter') {
      const query = busqueda.trim().toLowerCase();
      if (!query) return;

      // Buscar coincidencia exacta por código
      const match = productos.find(
        (p) => (p.codigo && p.codigo.toLowerCase() === query)
      );

      if (match) {
        onAgregarItem(match);
        toast.success(`Agregado: ${match.nombre}`, { id: `add-${match.id}`, duration: 1500 });
        setBusqueda('');
      } else if (productosFiltrados.length === 1) {
        onAgregarItem(productosFiltrados[0]);
        toast.success(`Agregado: ${productosFiltrados[0].nombre}`, { id: `add-${productosFiltrados[0].id}`, duration: 1500 });
        setBusqueda('');
      }
    }
  };

  return (
    <div className="flex flex-col h-full min-w-0 space-y-2 overflow-hidden select-none font-sora">
      {/* 1. Barra de Búsqueda y Lector de Códigos */}
      <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-xl p-1.5 sm:p-2 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center gap-1.5 shrink-0">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            ref={searchInputRef}
            id="pos-hotel-search-input"
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={handleKeyDownBusqueda}
            placeholder="Buscar producto, minibar, servicio o escanear código (Enter)..."
            className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-1.5 focus:ring-blue-600 border border-slate-200/60 dark:border-slate-700 transition-all font-sora shadow-2xs"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => {
                setBusqueda('');
                searchInputRef.current?.focus();
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg border border-emerald-200/70 dark:border-emerald-800 text-[11px] font-bold font-sora shrink-0">
          <Barcode className="w-3.5 h-3.5" />
          <span>Lector Activo</span>
        </div>

        {onRecargar && (
          <button
            type="button"
            onClick={onRecargar}
            title="Recargar catálogo y habitaciones"
            className="p-1 sm:px-2.5 sm:py-1.5 bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer shrink-0 flex items-center gap-1 text-[11px] font-bold font-sora shadow-2xs active:scale-95"
          >
            <RefreshCw className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            <span className="hidden md:inline">Recargar</span>
          </button>
        )}
      </div>

      {/* 2. Chips Horizontales de Categorías */}
      <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 shrink-0">
        {Object.values(HOTEL_CATEGORY_PALETTES).map((cat) => {
          const Icon = cat.icon;
          const esActivo = filtroCategoria === cat.id;
          const count = conteoPorCategoria[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFiltroCategoria(cat.id)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold font-sora whitespace-nowrap transition-all duration-150 cursor-pointer ${
                esActivo
                  ? `${cat.activeTile} shadow-2xs ring-1.5 ring-offset-0 ring-slate-900/10`
                  : `${cat.inactiveTile} dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700`
              }`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span>{cat.nombre}</span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  esActivo
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Catálogo de Productos y Servicios en Grilla Optimizada */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-0.5 custom-scrollbar">
        {cargando ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-3 content-start">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-44 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-800 p-3 animate-pulse flex flex-col justify-between"
              >
                <div className="h-24 bg-slate-200 dark:bg-slate-700 rounded-xl w-full" />
                <div className="space-y-1.5 mt-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-2/5" />
                </div>
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-1/3 mt-2" />
              </div>
            ))}
          </div>
        ) : productosFiltrados.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <ShoppingBag className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-1.5" />
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 font-sora">
              No se encontraron productos o servicios
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
              Intenta con otra palabra clave o cambia de categoría en las pestañas superiores.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 sm:gap-3 content-start">
            {productosFiltrados.map((prod) => {
              const catConf = getHotelCategoryConfig(prod.categoria);
              const Icon = catConf.icon;
              const cantidadEnCarrito = cantidadesEnCarrito[prod.id] || 0;
              const precio = parseFloat(prod.precio_venta || 0);
              const sinStock = prod.controla_stock && prod.stock_actual <= 0;
              const bajoStock = prod.controla_stock && prod.stock_actual <= (prod.stock_minimo || 5);

              return (
                <div
                  key={prod.id}
                  onClick={() => {
                    if (sinStock) {
                      toast.error(`Sin stock de ${prod.nombre}`);
                      return;
                    }
                    onAgregarItem(prod);
                  }}
                  className={`pos-product-card group relative bg-white dark:bg-slate-900 rounded-2xl border flex flex-col justify-between p-2.5 sm:p-3 min-w-0 transition-all duration-150 cursor-pointer select-none active:scale-[0.97] hover:shadow-md ${
                    sinStock
                      ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-55 cursor-not-allowed shadow-none'
                      : cantidadEnCarrito > 0
                      ? 'border-emerald-500 dark:border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs ring-1.5 ring-emerald-500/30'
                      : 'border-slate-200/80 dark:border-slate-800/90 hover:border-blue-500 dark:hover:border-blue-400'
                  }`}
                  title={sinStock ? `Sin stock disponible de ${prod.nombre}` : `Toca para agregar al ticket: ${prod.nombre} (S/ ${precio.toFixed(2)})`}
                >
                  {/* 1. Área de Imagen / Miniatura Visual */}
                  <div className="relative w-full h-24 sm:h-28 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center shrink-0">
                    {prod.imagen_url ? (
                      <img
                        src={prod.imagen_url}
                        alt={prod.nombre}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 transition-colors group-hover:text-blue-500/70">
                        <Icon className="w-8 h-8 stroke-[1.5]" />
                        <span className="text-[9px] font-bold mt-1 text-slate-400 dark:text-slate-500">
                          {catConf.tag || 'Item'}
                        </span>
                      </div>
                    )}

                    {/* Badges Flotantes sobre la Imagen */}
                    {/* Top-Left: Categoría */}
                    <div className="absolute top-1.5 left-1.5 pointer-events-none">
                      <span
                        className="text-[9px] font-extrabold uppercase tracking-wider text-white bg-slate-900/75 backdrop-blur-xs px-1.5 py-0.5 rounded-md flex items-center gap-1 font-sora shadow-xs max-w-[95px] truncate"
                        title={catConf.nombre || catConf.tag}
                      >
                        <Icon className="w-2.5 h-2.5 shrink-0 text-blue-400" />
                        <span className="truncate">{catConf.tag || 'Item'}</span>
                      </span>
                    </div>

                    {/* Top-Right: Insignia de Cantidad en Ticket si está en el carrito */}
                    {cantidadEnCarrito > 0 && (
                      <div className="absolute top-1.5 right-1.5 pointer-events-none">
                        <span
                          className="h-5 px-2 text-[10px] font-black bg-emerald-600 text-white border border-emerald-400/40 rounded-md flex items-center gap-1 font-sora shadow-sm animate-in zoom-in-75 duration-150"
                          title={`${cantidadEnCarrito} en ticket`}
                        >
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>x{cantidadEnCarrito}</span>
                        </span>
                      </div>
                    )}

                    {/* Bottom-Right: Stock / Servicio */}
                    <div className="absolute bottom-1.5 right-1.5 pointer-events-none">
                      {prod.controla_stock ? (
                        <span
                          className={`text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md font-sora shadow-2xs ${
                            sinStock
                              ? 'bg-rose-600 text-white'
                              : bajoStock
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-900/75 dark:bg-slate-900/85 backdrop-blur-xs text-white'
                          }`}
                          title="Stock disponible"
                        >
                          {prod.stock_actual} {prod.unidad_medida?.toLowerCase() || 'un.'}
                        </span>
                      ) : (
                        <span className="text-[8.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-blue-600/90 backdrop-blur-xs text-white font-sora shadow-2xs">
                          Servicio
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 2. Información del Producto */}
                  <div className="min-w-0 pt-2 flex flex-col justify-between flex-1">
                    <div className="min-w-0">
                      <h3
                        className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-[12.5px] leading-snug line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors font-sora"
                        title={prod.nombre}
                      >
                        {prod.nombre}
                      </h3>

                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                        {prod.codigo ? `${prod.codigo} • ` : ''}{prod.unidad_medida || 'Unidad'}
                      </p>
                    </div>

                    {/* 3. Precio que ocupa TODO el espacio de forma limpia y prominente */}
                    <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between min-w-0">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase font-sora">
                          S/
                        </span>
                        <span className="text-base sm:text-lg font-black font-sora text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 tracking-tight tabular-nums transition-colors">
                          {precio.toFixed(2)}
                        </span>
                      </div>

                      {cantidadEnCarrito > 0 && (
                        <span className="text-[9.5px] font-black font-sora text-emerald-700 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300/80 dark:border-emerald-800">
                          Agregado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
