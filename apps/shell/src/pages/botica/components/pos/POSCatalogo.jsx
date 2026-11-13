/**
 * POSCatalogo.jsx — Panel izquierdo del POS Botica (Refactorización Visual)
 * Búsqueda sticky superior, chips de categorías horizontales scrollables,
 * grilla de 2 columnas para laptop y tarjetas blancas con borde izquierdo de 4px por categoría.
 */
import React, { useMemo, useRef, useState } from 'react';
import {
  Barcode, Search, UserPlus, Package, Stethoscope,
  Pill, Clock, Sparkles, Plus, Building2, ChevronLeft,
  ChevronRight, X, Check
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getCategoryConfig } from './categoryColors';
import { notificarProductoAgregado } from '../../utils/notificaciones';

function MedicationCard({
  med,
  catConfig,
  loteMasCercano,
  stockTotalCajas,
  agotado,
  abrirModalDci,
  onConsultarStockSedes,
  addItem
}) {
  const tieneFraccion = Boolean(med.fraccionable && parseFloat(med.precio_fraccion || 0) > 0);
  const unidadMedida = med.unidad_medida || 'Caja';
  const unidadFraccion = med.unidad_fraccion || 'Tableta';
  const precioCaja = parseFloat(med.precio_venta || 0);
  const precioFraccion = parseFloat(med.precio_fraccion || 0);
  const stockFraccion = med.stock_fraccion || 0;
  const sinStockCajas = stockTotalCajas <= 0;
  const sinStockFraccion = tieneFraccion && stockFraccion <= 0 && sinStockCajas;

  return (
    <div
      className={`pos-med-card group relative bg-white dark:bg-slate-900 rounded-2xl border flex flex-col justify-between p-3 sm:p-3.5 min-w-0 cursor-pointer ${
        agotado
          ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 opacity-60'
          : 'border-[#D1F4E3] dark:border-slate-800 hover:border-[#00B884] dark:hover:border-emerald-500'
      }`}
    >
      <div className="space-y-2 min-w-0">
        {/* Cabecera: Categoría + Badges DCI & Receta */}
        <div className="flex items-center justify-between gap-1.5 min-w-0">
          <span
            className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/70 dark:border-slate-700 truncate max-w-[150px] font-sora"
            title={med.categoria?.nombre || catConfig.nombre}
          >
            {med.categoria?.nombre || catConfig.nombre}
          </span>

          <div className="flex items-center gap-1 shrink-0">
            {med.nombre_generico && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  abrirModalDci(med);
                }}
                className="h-5 px-1.5 text-[9.5px] font-extrabold bg-[#EBFDF6] dark:bg-teal-950/40 hover:bg-[#D0FBEB] dark:hover:bg-teal-900/50 text-[#00855E] dark:text-teal-300 border border-[#A6F6D8] dark:border-teal-800/60 rounded-md flex items-center gap-0.5 transition-colors cursor-pointer font-sora"
                title="Ver genéricos bioequivalentes DCI"
              >
                <Sparkles className="w-2.5 h-2.5 text-[#00B884] dark:text-teal-400" />
                <span>DCI</span>
              </button>
            )}

            {med.requiere_receta && (
              <span
                className="h-5 px-1.5 text-[9px] font-extrabold uppercase tracking-wide bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60 rounded-md flex items-center gap-0.5 shrink-0 font-sora"
                title="Medicamento bajo receta médica obligatoria"
              >
                <Stethoscope className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                <span>Receta</span>
              </span>
            )}
          </div>
        </div>

        {/* Nombre Comercial y Principio Activo */}
        <div className="min-w-0">
          <h3
            className="font-bold text-slate-800 dark:text-slate-100 text-[13px] sm:text-sm leading-snug line-clamp-2 break-words group-hover:text-[#00855E] dark:group-hover:text-emerald-300 transition-colors font-sora"
            title={med.nombre_comercial}
          >
            {med.nombre_comercial}
          </h3>
          {med.nombre_generico ? (
            <p
              className="text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5"
              title={`${med.nombre_generico} ${med.concentracion || ''}`}
            >
              {med.nombre_generico} {med.concentracion}
            </p>
          ) : (
            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium truncate mt-0.5">
              {med.laboratorio || med.presentacion || 'Fármaco'}
            </p>
          )}
        </div>

        {/* Stock en Sede + Link Otras Sedes + FEFO */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 font-sora ${
                stockTotalCajas <= 0
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                  : stockTotalCajas <= (med.stock_minimo || 5)
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60'
                  : 'bg-[#EBFDF6] dark:bg-emerald-950/40 text-[#00855E] dark:text-emerald-300 border border-[#A6F6D8] dark:border-emerald-800/60'
              }`}
              title="Stock físico en esta sucursal"
            >
              <Package className="w-3 h-3 shrink-0" />
              <span>{stockTotalCajas} {unidadMedida.toLowerCase()}{stockFraccion > 0 ? ` +${stockFraccion} fr` : ''}</span>
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onConsultarStockSedes?.(med.id);
              }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800 hover:bg-[#EBFDF6] dark:hover:bg-emerald-950/40 text-slate-600 dark:text-slate-300 hover:text-[#00855E] dark:hover:text-emerald-300 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold transition-colors cursor-pointer font-sora"
              title="Consultar disponibilidad en otras sucursales"
            >
              <Building2 className="w-3 h-3 text-slate-400" />
              <span>Sedes</span>
            </button>
          </div>

          {loteMasCercano && (
            <span
              className="inline-flex items-center gap-1 text-[9.5px] text-slate-400 dark:text-slate-400 font-sora bg-slate-50 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700 truncate shrink"
              title={`Lote FEFO: ${loteMasCercano.numero_lote} - Vence: ${loteMasCercano.fecha_vencimiento}`}
            >
              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
              <span className="truncate">{loteMasCercano.fecha_vencimiento}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── BOTONES DE ACCIÓN: COMPACTOS, INTUITIVOS Y ELEGANTES ── */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 min-w-0">
        {tieneFraccion ? (
          <div className="grid grid-cols-2 gap-1.5">
            {/* Botón Caja */}
            <button
              type="button"
              disabled={agotado || sinStockCajas}
              onClick={() => {
                if (sinStockCajas) {
                  toast.error(`Sin stock disponible de ${unidadMedida}`);
                  return;
                }
                addItem(med, 'Caja', 1, loteMasCercano);
                notificarProductoAgregado({
                  nombre: med.nombre_comercial,
                  formato: 'Caja',
                  cantidad: 1,
                  precio: precioCaja,
                  unidad: unidadMedida
                });
              }}
              className={`p-2 rounded-xl border flex flex-col justify-between text-left transition-all active:scale-[0.97] cursor-pointer group/btn ${
                sinStockCajas
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-400 opacity-40 cursor-not-allowed'
                  : 'bg-[#EBFDF6]/80 dark:bg-emerald-950/30 hover:bg-[#00B884] dark:hover:bg-[#00B884] border-[#A6F6D8] dark:border-emerald-800/60 hover:border-[#00B884] text-slate-800 dark:text-slate-100 hover:text-white'
              }`}
              title={sinStockCajas ? `Sin stock de ${unidadMedida}` : `Añadir 1 ${unidadMedida} (S/ ${precioCaja.toFixed(2)})`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#00855E] dark:text-emerald-400 group-hover/btn:text-emerald-100 truncate flex items-center gap-1 font-sora">
                  <Package className="w-2.5 h-2.5" />
                  {unidadMedida}
                </span>
                <Plus className="w-3 h-3 text-[#00855E] dark:text-emerald-300 group-hover/btn:text-white stroke-[2.5]" />
              </div>
              <span className="text-xs font-extrabold font-sora mt-1 text-slate-900 dark:text-white group-hover/btn:text-white tracking-tight">
                S/ {precioCaja.toFixed(2)}
              </span>
            </button>

            {/* Botón Fracción / Tableta */}
            <button
              type="button"
              disabled={agotado || sinStockFraccion}
              onClick={() => {
                addItem(med, 'Fraccion', 1, loteMasCercano);
                notificarProductoAgregado({
                  nombre: med.nombre_comercial,
                  formato: 'Fraccion',
                  cantidad: 1,
                  precio: precioFraccion,
                  unidad: unidadFraccion
                });
              }}
              className={`p-2 rounded-xl border flex flex-col justify-between text-left transition-all active:scale-[0.97] cursor-pointer group/btn ${
                sinStockFraccion
                  ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 text-slate-400 opacity-40 cursor-not-allowed'
                  : 'bg-sky-50/60 dark:bg-sky-950/30 hover:bg-sky-600 dark:hover:bg-sky-600 border-sky-200 dark:border-sky-800/60 hover:border-sky-600 text-slate-800 dark:text-slate-100 hover:text-white'
              }`}
              title={`Añadir 1 ${unidadFraccion} (S/ ${precioFraccion.toFixed(2)})`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-800 dark:text-sky-400 group-hover/btn:text-sky-100 truncate flex items-center gap-1 font-sora">
                  <Pill className="w-2.5 h-2.5" />
                  {unidadFraccion}
                </span>
                <Plus className="w-3 h-3 text-sky-700 dark:text-sky-300 group-hover/btn:text-white stroke-[2.5]" />
              </div>
              <span className="text-xs font-extrabold font-sora mt-1 text-slate-900 dark:text-white group-hover/btn:text-white tracking-tight">
                S/ {precioFraccion.toFixed(2)}
              </span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={agotado || sinStockCajas}
            onClick={() => {
              if (sinStockCajas) {
                toast.error(`Sin stock disponible de ${unidadMedida}`);
                return;
              }
              addItem(med, 'Caja', 1, loteMasCercano);
              notificarProductoAgregado({
                nombre: med.nombre_comercial,
                formato: 'Caja',
                cantidad: 1,
                precio: precioCaja,
                unidad: unidadMedida
              });
            }}
            className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between gap-2 transition-all active:scale-[0.98] group/btn ${
              agotado || sinStockCajas
                ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800 opacity-40 cursor-not-allowed'
                : 'bg-slate-50/90 dark:bg-slate-800/80 hover:bg-[#EBFDF6]/90 dark:hover:bg-emerald-950/30 border-[#D1F4E3] dark:border-slate-700 hover:border-[#00B884] dark:hover:border-emerald-600 cursor-pointer'
            }`}
            title={sinStockCajas ? `Sin stock de ${unidadMedida}` : `Añadir 1 ${unidadMedida} (S/ ${precioCaja.toFixed(2)})`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 group-hover/btn:text-[#00855E] dark:group-hover/btn:text-emerald-300 truncate font-sora">
                {unidadMedida}
              </span>
              <span className="text-xs font-extrabold font-sora text-slate-900 dark:text-white group-hover/btn:text-[#00855E] dark:group-hover/btn:text-emerald-300 tracking-tight">
                S/ {precioCaja.toFixed(2)}
              </span>
            </div>

            <span className="h-6 px-2.5 rounded-lg bg-[#00B884] group-hover/btn:bg-[#009E70] text-white flex items-center justify-center gap-1 font-bold text-[10px] shadow-2xs group-hover/btn:scale-102 transition-all shrink-0 font-sora">
              <Plus className="w-3 h-3 stroke-[2.5]" />
              <span>Añadir</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

export default function POSCatalogo({
  busqueda, setBusqueda,
  cargando,
  searchInputRef,
  handleBarcodeSubmit,
  medicamentos = [],
  medicamentosFiltrados = [],
  filtroCategoria, setFiltroCategoria,
  cargarDatos,
  addItem,
  abrirModalDci,
  clienteDetectadoEnBarra,
  esDocumentoEnBarra,
  setClienteSeleccionado,
  setIdCliente,
  abrirRegistroRapidoConDoc,
  onConsultarStockSedes
}) {
  const scrollCategoriasRef = useRef(null);

  // Extraer dinámicamente las categorías farmacéuticas presentes en el catálogo
  const categoriasDisponibles = useMemo(() => {
    const map = new Map();

    // 1. Filtros base predeterminados
    map.set('TODOS', {
      id: 'TODOS',
      nombre: 'Todos',
      tipo: 'filtro',
      total: medicamentos.length
    });
    map.set('RECETA', {
      id: 'RECETA',
      nombre: 'Con Receta',
      tipo: 'filtro',
      total: medicamentos.filter((m) => m.requiere_receta).length
    });
    map.set('FRACCION', {
      id: 'FRACCION',
      nombre: 'Fraccionables',
      tipo: 'filtro',
      total: medicamentos.filter((m) => m.fraccionable && parseFloat(m.precio_fraccion || 0) > 0).length
    });
    map.set('FEFO', {
      id: 'FEFO',
      nombre: 'Próx. a Vencer',
      tipo: 'filtro',
      total: medicamentos.filter((m) => m.lotes && m.lotes.length > 0).length
    });

    // 2. Extraer categorías específicas de medicamentos
    medicamentos.forEach((m) => {
      const catObj = m.categoria;
      const catNombre = typeof catObj === 'object' ? catObj?.nombre : m.categoria;
      if (catNombre && catNombre.trim()) {
        const key = catNombre.trim();
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            nombre: key,
            id_categoria: m.id_categoria,
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
  }, [medicamentos]);

  const scrollHoriz = (direccion) => {
    if (scrollCategoriasRef.current) {
      scrollCategoriasRef.current.scrollBy({
        left: direccion === 'left' ? -260 : 260,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900/90 rounded-[28px] p-3.5 sm:p-5 soft-card-shadow border border-slate-100 dark:border-slate-800 min-h-[500px] lg:min-h-0 lg:h-full min-w-0 overflow-hidden">
      
      {/* ── 1. Búsqueda por Nombre / DCI / Código de Barras (Compacto & Elegante) ── */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md pb-2 -mt-0.5 shrink-0">
        <form onSubmit={handleBarcodeSubmit} className="relative flex items-center">
          <Barcode className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="pos-barcode-input"
            ref={searchInputRef}
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por Nombre, DCI o escanear código de barras..."
            className="w-full bg-slate-50 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 rounded-xl pl-9 pr-20 h-10 sm:h-10.5 border border-slate-200/90 dark:border-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            autoFocus
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {busqueda && (
              <button
                type="button"
                onClick={() => {
                  setBusqueda('');
                  searchInputRef?.current?.focus();
                }}
                className="w-5 h-5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                title="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {cargando ? (
              <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-slate-400" />
            )}
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-bold font-mono text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1 py-0.5 rounded shadow-2xs">
              F3
            </kbd>
          </div>
        </form>

        {/* Detección cliente con puntos de canje */}
        {clienteDetectadoEnBarra && (
          <div className="mt-2 p-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                👤
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">{clienteDetectadoEnBarra.nombre}</p>
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono shrink-0">
                    ({clienteDetectadoEnBarra.tipo_documento}: {clienteDetectadoEnBarra.numero_documento})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 rounded-full">
                    ⭐ {clienteDetectadoEnBarra.puntos_fidelidad || 0} pts
                  </span>
                  <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                    (Descuento: S/ {((clienteDetectadoEnBarra.puntos_fidelidad || 0) / 10).toFixed(2)})
                  </span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setClienteSeleccionado(clienteDetectadoEnBarra);
                setIdCliente(clienteDetectadoEnBarra.id.toString());
                setBusqueda('');
                toast.success(`Paciente ${clienteDetectadoEnBarra.nombre} asignado.`);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
            >
              Asignar Paciente
            </button>
          </div>
        )}

        {/* DNI / RUC no registrado → sugerir consulta */}
        {esDocumentoEnBarra && !clienteDetectadoEnBarra && (
          <div className="mt-2 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                  {busqueda.trim().length === 8 ? 'DNI' : 'RUC'} {busqueda.trim()} no registrado
                </p>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium leading-tight">
                  ¿Consultar en {busqueda.trim().length === 8 ? 'RENIEC' : 'SUNAT'} y registrar este paciente?
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { abrirRegistroRapidoConDoc(busqueda.trim()); setBusqueda(''); }}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer active:scale-95"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Consultar y Agregar</span>
            </button>
          </div>
        )}
      </div>

      {/* ── 2. Categorías Farmacéuticas: Fila Horizontal Scrollable de Chips ── */}
      <div className="relative mb-3 shrink-0">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[10.5px] font-black uppercase tracking-wider text-slate-400">
              Categorías Farmacéuticas
            </span>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
              {categoriasDisponibles.length}
            </span>
          </div>

          {/* Flechas de navegación para scroll táctil / laptop */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => scrollHoriz('left')}
              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
              title="Desplazar a la izquierda"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollHoriz('right')}
              className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer active:scale-90"
              title="Desplazar a la derecha"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chips Horizontales Scrollables */}
        <div
          ref={scrollCategoriasRef}
          className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 custom-scrollbar scroll-smooth"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {categoriasDisponibles.map((cat) => {
            const config = getCategoryConfig(cat.nombre || cat.id);
            const Icon = config.icon;
            const activo = filtroCategoria === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFiltroCategoria(cat.id)}
                className={`h-9 px-3.5 rounded-full text-xs font-black flex items-center gap-2 whitespace-nowrap shrink-0 transition-all cursor-pointer select-none active:scale-95 ${
                  activo
                    ? 'bg-slate-900 dark:bg-emerald-600 text-white shadow-xs ring-2 ring-slate-900/20 dark:ring-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800/90 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${activo ? 'text-emerald-400 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                <span>{cat.nombre}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activo ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {cat.total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 3. Grid de Medicamentos: 2 Columnas para Laptop ── */}
      {medicamentosFiltrados.length === 0 ? (
        <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center p-8 text-center text-slate-400">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
            <Package className="w-8 h-8" />
          </div>
          <p className="text-sm font-black text-slate-700 dark:text-slate-200">No se encontraron medicamentos en esta categoría</p>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Intente seleccionando "Todos" o busque por nombre o código de barras.
          </p>
          <button
            type="button"
            onClick={() => { setBusqueda(''); setFiltroCategoria('TODOS'); cargarDatos(); }}
            className="mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
          >
            Mostrar Todo el Catálogo
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5 p-1 pt-1.5 pb-6 pr-1.5 custom-scrollbar content-start">
          {medicamentosFiltrados.map((med) => {
            const loteMasCercano = med.lotes?.[0];
            const stockTotalCajas = parseFloat(med.stock_cajas || 0);
            const agotado = stockTotalCajas <= 0 && (!med.stock_fraccion || med.stock_fraccion <= 0);
            const catConfig = getCategoryConfig(med.categoria?.nombre || med.categoria);

            return (
              <MedicationCard
                key={med.id}
                med={med}
                catConfig={catConfig}
                loteMasCercano={loteMasCercano}
                stockTotalCajas={stockTotalCajas}
                agotado={agotado}
                abrirModalDci={abrirModalDci}
                onConsultarStockSedes={onConsultarStockSedes}
                addItem={addItem}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
