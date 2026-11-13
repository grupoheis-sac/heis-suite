import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import api from './api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@heis/core';
import ModalProducto from './components/ModalProducto';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Edit2,
  Trash2,
  X,
  Check,
  Building2,
  RefreshCw,
  Boxes,
  MapPin,
  TrendingUp,
  List,
  LayoutGrid,
  DollarSign,
  Tag,
  FileSpreadsheet,
  Upload,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Filter,
  Barcode,
  Sparkles,
  ShieldAlert,
  Calculator,
  Layers,
  ChevronDown
} from 'lucide-react';

export default function Productos({ soloStockBajoInicial = false }) {
  const { user } = useAuthStore();
  const esCajero = user?.rol === 'Cajero';
  const [, setSearchParams] = useSearchParams();
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('todas');
  const [soloStockBajo, setSoloStockBajo] = useState(soloStockBajoInicial);
  const [cargando, setCargando] = useState(true);
  const [vistaModo, setVistaModo] = useState('table'); // 'table' | 'grid'

  // Dropdown Píldora de Subfamilias
  const [dropdownSubfamiliasOpen, setDropdownSubfamiliasOpen] = useState(false);
  const [busquedaSubfamilia, setBusquedaSubfamilia] = useState('');
  const dropdownSubfamiliasRef = useRef(null);

  // Modal Crear / Editar
  const [modalAbierto, setModalAbierto] = useState(false);
  const [productoEditar, setProductoEditar] = useState(null);

  // Modal Importar Excel
  const [modalImportarAbierto, setModalImportarAbierto] = useState(false);
  const [archivoExcel, setArchivoExcel] = useState(null);
  const [importandoExcel, setImportandoExcel] = useState(false);
  const [resultadoImportacion, setResultadoImportacion] = useState(null);

  // Bloquear scroll de fondo cuando el modal de importar esté abierto
  useEffect(() => {
    if (modalImportarAbierto) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [modalImportarAbierto]);

  // Cerrar dropdown de subfamilias al hacer clic fuera
  useEffect(() => {
    if (!dropdownSubfamiliasOpen) return;
    const handleClickOutside = (e) => {
      if (dropdownSubfamiliasRef.current && !dropdownSubfamiliasRef.current.contains(e.target)) {
        setDropdownSubfamiliasOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownSubfamiliasOpen]);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      let url = `/productos?limit=250`;
      if (busqueda.trim()) url += `&busqueda=${encodeURIComponent(busqueda.trim())}`;
      if (soloStockBajo) url += `&stock_bajo=true`;
      if (categoriaSeleccionada !== 'todas') url += `&id_categoria=${categoriaSeleccionada}`;

      const [resProd, resCat, resProv] = await Promise.all([
        api.get(url),
        api.get('/categorias'),
        api.get('/proveedores').catch(() => ({ success: false, proveedores: [] }))
      ]);

      if (resProd.success) setProductos(resProd.productos || []);
      if (resCat.success) setCategorias(resCat.categorias || []);
      if (resProv.success) setProveedores(resProv.proveedores || []);
    } catch (e) {
      toast.error('Error al cargar catálogo de productos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [busqueda, soloStockBajo, categoriaSeleccionada]);

  const abrirCrear = () => {
    if (esCajero) {
      toast.error('No tienes permisos para registrar nuevos productos (Rol Cajero)');
      return;
    }
    setProductoEditar(null);
    setModalAbierto(true);
  };

  const abrirEditar = (prod) => {
    if (esCajero) {
      toast.error('No tienes permisos para modificar productos o precios (Rol Cajero)');
      return;
    }
    setProductoEditar(prod);
    setModalAbierto(true);
  };

  const handleDescargarPlantilla = async () => {
    if (esCajero) return;
    try {
      toast.loading('Generando plantilla oficial de Excel...', { id: 'plantilla-dl' });
      const token = localStorage.getItem('ferre_token');
      const response = await fetch('/api/productos/excel/plantilla', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Error al generar la plantilla');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_productos_ferreteria.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Plantilla descargada con éxito', { id: 'plantilla-dl' });
    } catch (err) {
      toast.error('No se pudo descargar la plantilla', { id: 'plantilla-dl' });
    }
  };

  const handleImportarExcel = async (e) => {
    e.preventDefault();
    if (esCajero) {
      toast.error('Acceso denegado: solo Administradores pueden importar catálogo');
      return;
    }
    if (!archivoExcel) {
      return toast.error('Por favor selecciona un archivo Excel (.xlsx)');
    }

    setImportandoExcel(true);
    setResultadoImportacion(null);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('archivo', archivoExcel);

      const token = localStorage.getItem('ferre_token');
      const response = await fetch('/api/productos/excel/importar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formDataUpload
      });

      const res = await response.json();
      if (!response.ok || !res.success) {
        throw new Error(res.message || 'Error en la importación');
      }

      setResultadoImportacion(res.resumen);
      toast.success(res.message || 'Importación completada con éxito');
      cargarDatos();
    } catch (error) {
      toast.error(error.message || 'Error al procesar el archivo Excel');
    } finally {
      setImportandoExcel(false);
    }
  };


  const handleEliminar = async (prod) => {
    if (esCajero) {
      toast.error('Acceso denegado: solo Administradores pueden desactivar productos');
      return;
    }
    if (!confirm(`¿Estás seguro de desactivar "${prod.nombre}"?`)) return;
    try {
      await api.delete(`/productos/${prod.id}`);
      toast.success('Producto desactivado');
      cargarDatos();
    } catch (e) {
      toast.error('Error al desactivar');
    }
  };

  // Métricas rápidas
  const totalArticulos = productos.length;
  const totalAgotados = productos.filter(p => parseFloat(p.stock) <= 0).length;
  const totalBajos = productos.filter(p => parseFloat(p.stock) > 0 && parseFloat(p.stock) <= parseFloat(p.stock_minimo)).length;
  const productosFiltrados = productos;
  const categoriaActual = categorias.find(c => String(c.id) === String(categoriaSeleccionada));
  const subfamiliasFiltradas = categorias.filter(c =>
    !busquedaSubfamilia.trim() || c.nombre.toLowerCase().includes(busquedaSubfamilia.toLowerCase().trim())
  );

  return (
    <div className="space-y-4">
      {/* ─── PÍLDORAS DE FILTRO POR SUBFAMILIAS (ESTILO SLIM & DROPDOWN) ─── */}
      <div className="bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
            Subfamilias:
          </span>

          {/* Píldora Rápida: Todas */}
          <button
            type="button"
            onClick={() => {
              setCategoriaSeleccionada('todas');
              setSoloStockBajo(false);
            }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              categoriaSeleccionada === 'todas' && !soloStockBajo
                ? 'bg-indigo-600 text-white shadow-2xs font-black'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
            }`}
          >
            <span>Todas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
                categoriaSeleccionada === 'todas' && !soloStockBajo
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {totalArticulos}
            </span>
          </button>

          {/* PÍLDORA DESPLEGABLE DE SUBFAMILIAS */}
          <div className="relative" ref={dropdownSubfamiliasRef}>
            <button
              type="button"
              onClick={() => {
                setDropdownSubfamiliasOpen(prev => !prev);
                setBusquedaSubfamilia('');
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                categoriaSeleccionada !== 'todas' && !soloStockBajo
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-xs font-black'
                  : dropdownSubfamiliasOpen
                  ? 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700 border-slate-200/70 dark:border-slate-700/80'
              }`}
              title="Filtrar por subfamilia"
            >
              <Layers className={`w-3.5 h-3.5 shrink-0 ${categoriaSeleccionada !== 'todas' && !soloStockBajo ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'}`} />
              <span className="max-w-[140px] sm:max-w-[200px] truncate">
                {categoriaActual ? categoriaActual.nombre : 'Seleccionar Subfamilia'}
              </span>

              {categoriaActual && categoriaActual.productos_count !== undefined ? (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
                    categoriaSeleccionada !== 'todas' && !soloStockBajo
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {categoriaActual.productos_count}
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-mono bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  {categorias.length}
                </span>
              )}

              {categoriaActual && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setCategoriaSeleccionada('todas');
                    setSoloStockBajo(false);
                    setDropdownSubfamiliasOpen(false);
                  }}
                  className="p-0.5 rounded-full hover:bg-white/30 text-white transition-colors cursor-pointer ml-0.5"
                  title="Quitar filtro de subfamilia"
                >
                  <X className="w-3 h-3" />
                </span>
              )}

              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                  dropdownSubfamiliasOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Menú Desplegable Flotante */}
            {dropdownSubfamiliasOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute left-0 top-full mt-1.5 w-64 sm:w-72 bg-white/95 dark:bg-[#0c1324]/95 backdrop-blur-2xl rounded-2xl border border-slate-200/90 dark:border-white/[0.09] shadow-2xl dark:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.85)] p-2 z-50 animate-in fade-in zoom-in-95 duration-150 select-none ring-1 ring-slate-900/5 dark:ring-white/[0.06] cursor-default text-slate-800 dark:text-slate-100"
              >
                {/* Buscador interno si hay más de 4 subfamilias */}
                {categorias.length > 4 && (
                  <div className="relative mb-1.5 px-0.5">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar subfamilia..."
                      value={busquedaSubfamilia}
                      onChange={(e) => setBusquedaSubfamilia(e.target.value)}
                      className="w-full pl-7 pr-6 py-1.5 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs font-medium text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                    />
                    {busquedaSubfamilia && (
                      <button
                        type="button"
                        onClick={() => setBusquedaSubfamilia('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}

                {/* Opción 'Todas' dentro del dropdown */}
                <button
                  type="button"
                  onClick={() => {
                    setCategoriaSeleccionada('todas');
                    setSoloStockBajo(false);
                    setDropdownSubfamiliasOpen(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    categoriaSeleccionada === 'todas' && !soloStockBajo
                      ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-extrabold ring-1 ring-indigo-300 dark:ring-indigo-500/50'
                      : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-semibold">Todas las Subfamilias</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                      {totalArticulos}
                    </span>
                    {categoriaSeleccionada === 'todas' && !soloStockBajo && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    )}
                  </div>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-800/80 my-1" />

                {/* Lista scrollable de subfamilias */}
                <div className="max-h-56 overflow-y-auto custom-modal-scroll space-y-0.5 pr-0.5">
                  {subfamiliasFiltradas.length === 0 ? (
                    <div className="py-4 text-center text-xs text-slate-400">
                      No se encontró ninguna subfamilia
                    </div>
                  ) : (
                    subfamiliasFiltradas.map((cat) => {
                      const isSelected = categoriaSeleccionada === String(cat.id) && !soloStockBajo;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoriaSeleccionada(String(cat.id));
                            setSoloStockBajo(false);
                            setDropdownSubfamiliasOpen(false);
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-900 dark:text-indigo-200 font-extrabold ring-1 ring-indigo-300 dark:ring-indigo-500/50'
                              : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="truncate pr-2 font-medium">{cat.nombre}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {cat.productos_count !== undefined && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold">
                                {cat.productos_count}
                              </span>
                            )}
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Píldora Rápida: Stock Bajo */}
          <button
            type="button"
            onClick={() => setSoloStockBajo(!soloStockBajo)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              soloStockBajo
                ? 'bg-amber-600 text-white shadow-2xs font-black'
                : 'bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100/70 dark:hover:bg-amber-950/70 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Stock Bajo</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[9.5px] font-mono ${
                soloStockBajo ? 'bg-white/25 text-white' : 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200'
              }`}
            >
              {totalBajos + totalAgotados}
            </span>
          </button>
        </div>

        <span className="text-[10.5px] font-semibold text-slate-400 shrink-0">
          {productosFiltrados.length} {productosFiltrados.length === 1 ? 'producto' : 'productos'}
        </span>
      </div>

      {/* ─── FILA DE BÚSQUEDA Y ACCIONES ─── */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, código de barras, marca o ubicación..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Toggle de Vista */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setVistaModo('table')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  vistaModo === 'table' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista Tabla Compacta"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setVistaModo('grid')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  vistaModo === 'grid' ? 'bg-white dark:bg-slate-900 shadow-xs text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600'
                }`}
                title="Vista Tarjetas Cuadrícula"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

            {esCajero ? (
              <div className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 select-none shadow-2xs">
                <ShieldAlert className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Modo Consulta (Precios & Stock)</span>
              </div>
            ) : (
              <>
                {/* Botón Descargar Plantilla */}
                <button
                  type="button"
                  onClick={handleDescargarPlantilla}
                  className="px-2.5 sm:px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Descargar formato modelo de Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden md:inline">Plantilla</span>
                </button>

                {/* Botón Importar Excel */}
                <button
                  type="button"
                  onClick={() => {
                    setArchivoExcel(null);
                    setResultadoImportacion(null);
                    setModalImportarAbierto(true);
                  }}
                  className="px-2.5 sm:px-3 py-2 rounded-xl border border-emerald-300/80 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-800 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  title="Importar catálogo masivo desde Excel (.xlsx o .csv)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                  <span className="hidden xs:inline">Importar Excel</span>
                  <span className="xs:hidden">Excel</span>
                </button>

                {/* Botón Nuevo Producto */}
                <button
                  type="button"
                  onClick={abrirCrear}
                  className="flex-1 sm:flex-initial px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Producto</span>
                </button>
              </>
            )}
          </div>
        </div>

      {/* ─── CONTENIDO: TABLA COMPACTA O GRID ─── */}
      {cargando ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <RefreshCw className="w-7 h-7 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-500">Cargando catálogo de ferretería...</p>
        </div>
      ) : productos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h4 className="text-sm font-black text-slate-700">No se encontraron productos</h4>
          <p className="text-xs text-slate-400 mt-0.5">Prueba ajustando los filtros de búsqueda o agrega un nuevo producto.</p>
        </div>
      ) : vistaModo === 'grid' ? (
        /* VISTA GRID DE TARJETAS */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {productos.map((prod) => {
            const stockNum = parseFloat(prod.stock) || 0;
            const minNum = parseFloat(prod.stock_minimo) || 0;
            const esAgotado = stockNum <= 0;
            const esCritico = !esAgotado && stockNum <= minNum;

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                {/* Banner de Imagen del Producto */}
                <div className="h-28 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                  {prod.imagen ? (
                    <img
                      src={prod.imagen}
                      alt={prod.nombre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-300">
                      <Package className="w-8 h-8 opacity-40" />
                      <span className="text-[10px] font-bold text-slate-400 mt-1">Sin foto</span>
                    </div>
                  )}

                  {/* Badges superiores sobre la imagen */}
                  <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px]">
                    <span className="font-mono font-bold bg-white/90 text-slate-700 px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                      {prod.codigo_barras || 'S/C'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold shadow-xs backdrop-blur-xs ${
                        esAgotado
                          ? 'bg-rose-500/90 text-white'
                          : esCritico
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-emerald-600/90 text-white'
                      }`}
                    >
                      {stockNum} {prod.unidad_medida}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-semibold mb-1">
                      <span>{prod.categoria?.nombre || 'General'}</span>
                      <span className="text-slate-500">{prod.unidad_medida}</span>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs font-black text-slate-900 leading-tight line-clamp-2" title={prod.nombre}>
                        {prod.nombre}
                      </h4>
                      {prod.es_material_construccion && (
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          Construcción
                        </span>
                      )}
                      {prod.es_fiscalizado && (
                        <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300" title={`Fiscalizado: ${prod.tipo_fiscalizacion || 'IQBF'}`}>
                          IQBF
                        </span>
                      )}
                    </div>
                    {prod.marca && (
                      <span className="text-[10.5px] font-bold text-indigo-600 mt-0.5 block">
                        {prod.marca}
                      </span>
                    )}

                    {prod.ubicacion && (
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                        <span className="truncate">{prod.ubicacion}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] text-slate-400 block font-semibold">PRECIO</span>
                      <span className="font-mono font-black text-slate-900 text-sm">
                        S/ {parseFloat(prod.precio_venta).toFixed(2)}
                      </span>
                      {prod.precio_mayorista && parseFloat(prod.precio_mayorista) > 0 && (
                        <span className="text-[9.5px] font-mono font-bold text-indigo-600 block">
                          May: S/ {parseFloat(prod.precio_mayorista).toFixed(2)}
                        </span>
                      )}
                    </div>

                    {!esCajero && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setSearchParams({ tab: 'kardex', busqueda: prod.nombre })}
                          className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Ver Historial Kardex"
                        >
                          <Layers className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => abrirEditar(prod)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEliminar(prod)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                          title="Desactivar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA TABLA COMPACTA (POR DEFECTO) */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10.5px] font-extrabold">
                <tr>
                  <th className="py-2.5 px-3 text-center whitespace-nowrap w-12">FOTO</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">CÓDIGO</th>
                  <th className="py-2.5 px-3.5 min-w-[200px]">PRODUCTO / ARTÍCULO</th>
                  <th className="py-2.5 px-3.5 whitespace-nowrap">CATEGORÍA</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">UNIDAD</th>
                  <th className="py-2.5 px-3.5 min-w-[120px]">UBICACIÓN</th>
                  {!esCajero && (
                    <th className="py-2.5 px-3.5 text-right whitespace-nowrap">P. COMPRA</th>
                  )}
                  <th className="py-2.5 px-3.5 text-right whitespace-nowrap">P. VENTA</th>
                  <th className="py-2.5 px-3.5 text-center whitespace-nowrap">STOCK</th>
                  {!esCajero && (
                    <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ACCIONES</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {productos.map((prod) => {
                  const stockNum = parseFloat(prod.stock) || 0;
                  const minNum = parseFloat(prod.stock_minimo) || 0;
                  const esAgotado = stockNum <= 0;
                  const esCritico = !esAgotado && stockNum <= minNum;
                  const pCompra = parseFloat(prod.precio_compra) || 0;
                  const pVenta = parseFloat(prod.precio_venta) || 0;
                  const margen = pCompra > 0 ? (((pVenta - pCompra) / pCompra) * 100).toFixed(0) : 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Foto Thumbnail */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {prod.imagen ? (
                          <img
                            src={prod.imagen}
                            alt={prod.nombre}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200/90 shadow-2xs mx-auto"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center border border-slate-200/60 mx-auto">
                            <Package className="w-4 h-4 opacity-50" />
                          </div>
                        )}
                      </td>

                      {/* Código */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap font-mono font-bold text-slate-700">
                        {prod.codigo_barras ? (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] border border-slate-200/60">
                            {prod.codigo_barras}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">S/C</span>
                        )}
                      </td>

                      {/* Nombre y Marca */}
                      <td className="py-2.5 px-3.5">
                        <div className="font-extrabold text-slate-900 leading-tight flex items-center gap-1.5 flex-wrap">
                          <span>{prod.nombre}</span>
                          {prod.es_material_construccion && (
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                              Construcción
                            </span>
                          )}
                          {prod.es_fiscalizado && (
                            <span className="px-1.5 py-0.2 rounded text-[8.5px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300" title={`Controlado: ${prod.tipo_fiscalizacion || 'IQBF'}`}>
                              IQBF
                            </span>
                          )}
                        </div>
                        {prod.marca && (
                          <div className="text-[10px] text-indigo-600 font-bold mt-0.5">
                            {prod.marca}
                          </div>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-slate-600 text-[11px]">
                        {prod.categoria?.nombre || 'General'}
                      </td>

                      {/* Unidad */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10.5px]">
                          {prod.unidad_medida}
                        </span>
                      </td>

                      {/* Ubicación */}
                      <td className="py-2.5 px-3.5 text-slate-600 text-[11px]">
                        {prod.ubicacion ? (
                          <span className="flex items-center gap-1 truncate max-w-[150px]" title={prod.ubicacion}>
                            <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                            <span className="truncate">{prod.ubicacion}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* Precio Compra */}
                      {!esCajero && (
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap font-mono text-slate-500 text-xs">
                          S/ {pCompra.toFixed(2)}
                        </td>
                      )}

                      {/* Precio Venta con Margen & Mayorista */}
                      <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                        <div className="font-mono font-black text-slate-900 text-xs">
                          S/ {pVenta.toFixed(2)}
                        </div>
                        {prod.precio_mayorista && parseFloat(prod.precio_mayorista) > 0 ? (
                          <div className="text-[9.5px] font-mono font-bold text-indigo-600">
                            May: S/ {parseFloat(prod.precio_mayorista).toFixed(2)}
                          </div>
                        ) : !esCajero && margen > 0 ? (
                          <span className="text-[9.5px] font-bold text-emerald-600 font-mono">
                            +{margen}%
                          </span>
                        ) : null}
                      </td>

                      {/* Stock */}
                      <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${
                            esAgotado
                              ? 'bg-rose-50 text-rose-700 border-rose-200/80'
                              : esCritico
                              ? 'bg-amber-50 text-amber-700 border-amber-200/80'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              esAgotado ? 'bg-rose-500' : esCritico ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="font-mono font-black">{stockNum}</span>
                        </span>
                      </td>

                      {/* Acciones */}
                      {!esCajero && (
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => setSearchParams({ tab: 'kardex', busqueda: prod.nombre })}
                              className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Ver Historial Kardex"
                            >
                              <Layers className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => abrirEditar(prod)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Editar Producto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEliminar(prod)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Desactivar Producto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL UNIFICADO NUEVO / EDITAR PRODUCTO (Solo Admin) ─── */}
      {!esCajero && (
        <ModalProducto
          isOpen={modalAbierto}
          onClose={() => setModalAbierto(false)}
          onSuccess={cargarDatos}
          productoEditar={productoEditar}
          categorias={categorias}
          proveedores={proveedores}
          modoConstruccion={false}
        />
      )}

      {/* ─── MODAL IMPORTAR INVENTARIO EXCEL ─── */}
      {modalImportarAbierto && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-y-auto">
          {/* Backdrop estático e independiente: siempre cubre 100% de la ventana sin desplazarse al hacer scroll */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!importandoExcel) setModalImportarAbierto(false);
            }}
            aria-hidden="true"
          />

          {/* Contenedor de scroll y centrado */}
          <div
            className="min-h-full flex items-center justify-center p-3 sm:p-4 text-center cursor-pointer"
            onClick={() => {
              if (!importandoExcel) setModalImportarAbierto(false);
            }}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden my-6 flex flex-col text-left relative z-10 cursor-default animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      Importación Masiva de Productos Excel
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Carga inventario existente desde archivos .xlsx o .csv
                    </p>
                  </div>
                </div>
                {!importandoExcel && (
                  <button
                    type="button"
                    onClick={() => setModalImportarAbierto(false)}
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                    title="Cerrar modal"
                  >
                    <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
              </div>

            {/* Contenido */}
            <div className="p-5 space-y-4">
              {/* Tarjeta de Guía y Descarga de Plantilla */}
              <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-emerald-900">
                    ¿No tienes el formato oficial de columnas?
                  </p>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Descarga nuestra plantilla prediseñada con ejemplos de cemento, fierro, PVC y alambre para asegurar una importación limpia.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDescargarPlantilla}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Plantilla</span>
                </button>
              </div>

              {/* Zona de Drop / Selección de Archivo */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) {
                    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
                      return toast.error('El archivo debe tener formato .xlsx, .xls o .csv');
                    }
                    setArchivoExcel(file);
                    setResultadoImportacion(null);
                  }
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  archivoExcel
                    ? 'border-emerald-500 bg-emerald-50/30'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                {archivoExcel ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-black text-slate-800 break-all">
                      {archivoExcel.name}
                    </p>
                    <p className="text-[10.5px] font-mono text-slate-500 mt-0.5">
                      {(archivoExcel.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      disabled={importandoExcel}
                      onClick={() => setArchivoExcel(null)}
                      className="mt-2 text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                    >
                      Cambiar archivo
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center cursor-pointer">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800">
                      Haz clic para buscar tu archivo Excel
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      o arrastra y suelta tu archivo .xlsx aquí
                    </p>
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setArchivoExcel(file);
                          setResultadoImportacion(null);
                        }
                      }}
                    />
                  </label>
                )}
              </div>

              {/* Resumen de Resultados si ya se procesó */}
              {resultadoImportacion && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Resumen de la importación:</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-slate-400 font-bold block">FILAS</span>
                      <span className="text-sm font-black text-slate-800 font-mono">
                        {resultadoImportacion.totalFilas}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-emerald-600 font-bold block">NUEVOS</span>
                      <span className="text-sm font-black text-emerald-600 font-mono">
                        +{resultadoImportacion.creados}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-slate-200">
                      <span className="text-[10px] text-indigo-600 font-bold block">ACTUALIZADOS</span>
                      <span className="text-sm font-black text-indigo-600 font-mono">
                        {resultadoImportacion.actualizados}
                      </span>
                    </div>
                  </div>

                  {resultadoImportacion.totalErrores > 0 && (
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-800 font-bold">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Advertencias en {resultadoImportacion.totalErrores} fila(s):</span>
                      </div>
                      <div className="max-h-24 overflow-y-auto space-y-1 text-rose-700 pl-5">
                        {resultadoImportacion.errores.slice(0, 10).map((err, idx) => (
                          <div key={idx}>
                            Fila {err.fila} ({err.producto || 'Sin nombre'}): {err.motivo}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={importandoExcel}
                  onClick={() => setModalImportarAbierto(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 text-center"
                >
                  {resultadoImportacion ? 'Cerrar' : 'Cancelar'}
                </button>

                {!resultadoImportacion ? (
                  <button
                    type="button"
                    disabled={!archivoExcel || importandoExcel}
                    onClick={handleImportarExcel}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {importandoExcel ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Procesando archivo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Procesar e Importar</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setArchivoExcel(null);
                      setResultadoImportacion(null);
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    Importar otro archivo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>,
      document.body
    )}
    </div>
  );
}

