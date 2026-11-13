import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Boxes, Plus, Search, RefreshCw, Edit3, Trash2, Camera,
  Upload, AlertTriangle, DollarSign, Package,
  X, Check, ChevronDown,
  TrendingUp, AlertCircle, Sparkles, Image as ImageIcon,
  Building2, PackageCheck
} from 'lucide-react';
import ProveedoresTab from './components/inventario/ProveedoresTab';
import ComprasTab from './components/inventario/ComprasTab';
import { toast } from 'react-hot-toast';
import api from './api';
import { useSucursalStore } from '@heis/core';
import { useAuthStore } from '@heis/core';
import { HOTEL_CATEGORY_PALETTES, getHotelCategoryConfig } from './components/pos/hotelCategoryColors';

// Función para comprimir imagen en el cliente usando HTML5 Canvas
const comprimirImagen = (file, maxDim = 500, calidad = 0.85) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', calidad);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const CATEGORIAS_HOTEL = [
  { id: 'minibar', nombre: 'Minibar & Snacks', tag: 'Bebidas, licores y golosinas', prefix: 'MIN', colorKey: 'amber' },
  { id: 'restaurante', nombre: 'Restaurante & Room Service', tag: 'Desayunos, platos y cafetería', prefix: 'RES', colorKey: 'emerald' },
  { id: 'lavanderia', nombre: 'Lavandería & Tintorería', tag: 'Prendas, lavado y planchado', prefix: 'LAV', colorKey: 'sky' },
  { id: 'spa', nombre: 'Spa & Bienestar', tag: 'Masajes, sauna y aromaterapia', prefix: 'SPA', colorKey: 'rose' },
  { id: 'extras', nombre: 'Amenidades & Extras', tag: 'Kits, pantuflas y almohadas', prefix: 'EXT', colorKey: 'purple' },
  { id: 'tours', nombre: 'Tours & Movilidad', tag: 'Traslados y excursiones', prefix: 'TOU', colorKey: 'indigo' },
  { id: 'otros', nombre: 'Otros Productos / Servicios', tag: 'Varios y cargos generales', prefix: 'HOT', colorKey: 'slate' }
];

const getCategoryColorClasses = (colorKey, isSelected) => {
  if (isSelected) {
    return 'bg-blue-600 text-white shadow-xs';
  }
  switch (colorKey) {
    case 'amber':
      return 'bg-amber-100/80 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/80 dark:border-amber-900/60';
    case 'emerald':
      return 'bg-emerald-100/80 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60';
    case 'sky':
      return 'bg-sky-100/80 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200/80 dark:border-sky-900/60';
    case 'rose':
      return 'bg-rose-100/80 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60';
    case 'purple':
      return 'bg-purple-100/80 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200/80 dark:border-purple-900/60';
    case 'indigo':
      return 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-900/60';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700';
  }
};

/**
 * CategoriaDropdown - Selector de categoría estilizado Neo-SaaS con iconos temáticos y badges
 */
function CategoriaDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const catActual = CATEGORIAS_HOTEL.find((c) => c.id === value) || CATEGORIAS_HOTEL[0];
  const catConf = getHotelCategoryConfig(catActual.id);
  const ActiveIcon = catConf.icon;

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
        Categoría del Producto / Servicio *
      </label>

      {/* Botón Trigger de la Cápsula Dropdown */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-2 p-2 bg-slate-50/90 hover:bg-slate-100/90 dark:bg-slate-800/60 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 rounded-xl transition-all font-sora cursor-pointer shadow-2xs group focus:outline-hidden focus:ring-2 focus:ring-blue-500"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${getCategoryColorClasses(
              catActual.colorKey,
              false
            )}`}
          >
            <ActiveIcon className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="text-left min-w-0">
            <span className="block text-xs font-black text-slate-900 dark:text-slate-100 truncate">
              {catActual.nombre}
            </span>
            <span className="block text-[10px] text-slate-400 truncate">
              {catActual.tag}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-600 font-mono shadow-2xs">
            {catActual.prefix}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
            }`}
          />
        </div>
      </button>

      {/* Menú Desplegable Flotante Elegante */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sora animate-in fade-in zoom-in-95 duration-150 p-1.5 space-y-1 max-h-64 overflow-y-auto custom-modal-scroll ring-1 ring-slate-900/5 dark:ring-white/5">
          {CATEGORIAS_HOTEL.map((cat) => {
            const conf = getHotelCategoryConfig(cat.id);
            const Icon = conf.icon;
            const esSeleccionado = cat.id === value;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-all cursor-pointer ${
                  esSeleccionado
                    ? 'bg-blue-50/90 dark:bg-blue-950/60 text-blue-950 dark:text-blue-100 border border-blue-200/80 dark:border-blue-800/80'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${getCategoryColorClasses(
                      cat.colorKey,
                      esSeleccionado
                    )}`}
                  >
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-bold leading-tight truncate ${
                        esSeleccionado ? 'text-blue-950 dark:text-white font-extrabold' : ''
                      }`}
                    >
                      {cat.nombre}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      {cat.tag}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[9px] font-black font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {cat.prefix}
                  </span>
                  {esSeleccionado && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Inventario() {
  const { sedeActiva } = useSucursalStore();
  const { user } = useAuthStore();

  const rolNormalizado = (user?.rol || user?.role || '').toLowerCase();
  const esAdmin =
    !user ||
    !user?.rol ||
    rolNormalizado.includes('admin') ||
    rolNormalizado === 'gerente' ||
    rolNormalizado === 'superadmin' ||
    user?.rol === 'Administrador';

  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('TODOS');
  const [filtroStock, setFiltroStock] = useState('TODOS'); // 'TODOS' | 'BAJO' | 'AGOTADO' | 'DISPONIBLE'
  const [vistaModo, setVistaModo] = useState('tabla'); // 'tabla' por defecto (modo tabla predeterminado)
  const [tabPrincipal, setTabPrincipal] = useState('stock'); // 'stock' | 'proveedores' | 'compras'

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [modalStockOpen, setModalStockOpen] = useState(false);
  const [productoParaStock, setProductoParaStock] = useState(null);
  const [cantidadAjuste, setCantidadAjuste] = useState('');
  const [tipoAjuste, setTipoAjuste] = useState('entrada'); // 'entrada' | 'salida' | 'fijar'

  // Modal para foto rápida
  const [modalFotoOpen, setModalFotoOpen] = useState(false);
  const [productoParaFoto, setProductoParaFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState('');
  const [fotoTab, setFotoTab] = useState('archivo'); // 'archivo' | 'url'
  const [fotoUrlInput, setFotoUrlInput] = useState('');
  const fileInputFotoRef = useRef(null);
  const formFileInputRef = useRef(null);

  // Bloquear scroll de fondo y escuchar Escape al abrir cualquier modal
  useEffect(() => {
    const isAnyModalOpen = modalFormOpen || modalStockOpen || modalFotoOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setModalFormOpen(false);
          setModalStockOpen(false);
          setModalFotoOpen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [modalFormOpen, modalStockOpen, modalFotoOpen]);

  // Helper para generar código SKU con prefijo por categoría
  const generarCodigoPorCategoria = (catId = 'minibar') => {
    const prefijos = {
      minibar: 'MIN',
      restaurante: 'RES',
      lavanderia: 'LAV',
      spa: 'SPA',
      extras: 'EXT',
      tours: 'TOU',
      otros: 'HOT'
    };
    const prefix = prefijos[catId] || 'HOT';
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${rand}`;
  };

  // Formulario Producto State
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria: 'minibar',
    precio_venta: '',
    costo: '',
    controla_stock: true,
    stock_actual: '',
    stock_minimo: '5',
    unidad_medida: 'Unidad',
    imagen_url: '',
    activo: true
  });
  const [guardandoProducto, setGuardandoProducto] = useState(false);

  // Cálculo en vivo de margen y ganancia para el formulario
  const calculoRentabilidad = useMemo(() => {
    const precio = parseFloat(formData.precio_venta) || 0;
    const costo = parseFloat(formData.costo) || 0;
    if (precio <= 0) return null;

    const ganancia = precio - costo;
    let porcentaje = null;
    if (costo > 0) {
      porcentaje = ((ganancia / costo) * 100).toFixed(0);
    }

    return {
      ganancia,
      porcentaje,
      esPerdida: ganancia < 0,
      esNeutro: ganancia === 0 && costo > 0,
      sinCosto: costo === 0
    };
  }, [formData.precio_venta, formData.costo]);

  // Cargar productos (incluyendo activos y pausados para control total)
  const cargarProductos = async () => {
    try {
      setCargando(true);
      const res = await api.get('/catalogo', {
        params: { sede_id: sedeActiva?.id, activo: 'todos' }
      });
      if (res.data?.success) {
        setProductos(res.data.data || []);
      }
    } catch (err) {
      console.error('Error al cargar inventario:', err);
      toast.error('No se pudo cargar el inventario.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, [sedeActiva]);

  // Métricas de Inventario
  const metricas = useMemo(() => {
    const totalItems = productos.length;
    let itemsAgotados = 0;
    let itemsBajoStock = 0;
    let valorCostoTotal = 0;
    let valorVentaTotal = 0;

    productos.forEach((p) => {
      const stock = parseInt(p.stock_actual) || 0;
      const min = parseInt(p.stock_minimo) || 5;
      const costo = parseFloat(p.costo) || 0;
      const precio = parseFloat(p.precio_venta) || 0;

      if (p.controla_stock) {
        if (stock <= 0) itemsAgotados++;
        else if (stock <= min) itemsBajoStock++;

        valorCostoTotal += stock * costo;
        valorVentaTotal += stock * precio;
      }
    });

    return {
      totalItems,
      itemsAgotados,
      itemsBajoStock,
      valorCostoTotal,
      valorVentaTotal
    };
  }, [productos]);

  // Productos filtrados
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      // Filtro Categoría
      if (filtroCategoria !== 'TODOS') {
        if ((p.categoria || '').toUpperCase() !== filtroCategoria) return false;
      }

      // Filtro Stock
      if (filtroStock === 'AGOTADO') {
        if (!p.controla_stock || p.stock_actual > 0) return false;
      } else if (filtroStock === 'BAJO') {
        if (!p.controla_stock || p.stock_actual <= 0 || p.stock_actual > (p.stock_minimo || 5)) return false;
      } else if (filtroStock === 'DISPONIBLE') {
        if (p.controla_stock && p.stock_actual <= (p.stock_minimo || 5)) return false;
      }

      // Búsqueda de texto
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim();
        const matchNombre = p.nombre && p.nombre.toLowerCase().includes(q);
        const matchCodigo = p.codigo && p.codigo.toLowerCase().includes(q);
        const matchDesc = p.descripcion && p.descripcion.toLowerCase().includes(q);
        return matchNombre || matchCodigo || matchDesc;
      }

      return true;
    });
  }, [productos, filtroCategoria, filtroStock, busqueda]);

  // Abrir modal de nuevo producto
  const handleNuevoProducto = () => {
    setProductoEditando(null);
    setFormData({
      codigo: generarCodigoPorCategoria('minibar'),
      nombre: '',
      descripcion: '',
      categoria: 'minibar',
      precio_venta: '',
      costo: '',
      controla_stock: true,
      stock_actual: '20',
      stock_minimo: '5',
      unidad_medida: 'Unidad',
      imagen_url: '',
      activo: true
    });
    setModalFormOpen(true);
  };

  // Abrir modal para editar
  const handleEditarProducto = (prod) => {
    setProductoEditando(prod);
    setFormData({
      codigo: prod.codigo || '',
      nombre: prod.nombre || '',
      descripcion: prod.descripcion || '',
      categoria: prod.categoria || 'minibar',
      precio_venta: String(prod.precio_venta || ''),
      costo: String(prod.costo || ''),
      controla_stock: Boolean(prod.controla_stock),
      stock_actual: String(prod.stock_actual || 0),
      stock_minimo: String(prod.stock_minimo || 5),
      unidad_medida: prod.unidad_medida || 'Unidad',
      imagen_url: prod.imagen_url || '',
      activo: prod.activo !== undefined ? Boolean(prod.activo) : true
    });
    setModalFormOpen(true);
  };

  // Alternar disponibilidad rápida (Activo / Pausado en POS)
  const handleToggleActivo = async (prod) => {
    try {
      const nuevoEstado = prod.activo === false ? true : false;
      const res = await api.put(`/catalogo/${prod.id}`, { activo: nuevoEstado });
      if (res.data?.success) {
        toast.success(
          nuevoEstado
            ? `"${prod.nombre}" ahora está activo en el POS`
            : `"${prod.nombre}" pausado (oculto en POS)`
        );
        setProductos((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, activo: nuevoEstado } : p))
        );
      }
    } catch (err) {
      console.error('Error al cambiar estado activo:', err);
      toast.error('No se pudo actualizar el estado del producto.');
    }
  };

  // Guardar creación o edición
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      toast.error('El nombre del producto es obligatorio.');
      return;
    }
    if (!formData.precio_venta || parseFloat(formData.precio_venta) < 0) {
      toast.error('Indique un precio de venta válido.');
      return;
    }

    try {
      setGuardandoProducto(true);
      const payload = {
        ...formData,
        descripcion: formData.descripcion?.trim() || null,
        precio_venta: parseFloat(formData.precio_venta),
        costo: parseFloat(formData.costo || 0),
        stock_actual: formData.controla_stock ? parseInt(formData.stock_actual || 0) : 999,
        stock_minimo: formData.controla_stock ? parseInt(formData.stock_minimo || 5) : 0,
        activo: Boolean(formData.activo),
        sede_id: sedeActiva?.id || null
      };

      if (productoEditando) {
        // Actualizar
        const res = await api.put(`/catalogo/${productoEditando.id}`, payload);
        if (res.data?.success) {
          toast.success('Producto actualizado exitosamente');
          setProductos((prev) =>
            prev.map((p) => (p.id === productoEditando.id ? { ...p, ...payload } : p))
          );
          setModalFormOpen(false);
        }
      } else {
        // Crear
        const res = await api.post('/catalogo', payload);
        if (res.data?.success) {
          toast.success('Producto creado y agregado al catálogo');
          cargarProductos();
          setModalFormOpen(false);
        }
      }
    } catch (err) {
      console.error('Error al guardar producto:', err);
      toast.error(err.response?.data?.message || 'Error al guardar el producto.');
    } finally {
      setGuardandoProducto(false);
    }
  };

  // Eliminar / Desactivar producto
  const handleEliminarProducto = async (prod) => {
    if (!window.confirm(`¿Está seguro de eliminar "${prod.nombre}" del catálogo de inventario?`)) {
      return;
    }

    try {
      const res = await api.delete(`/catalogo/${prod.id}`);
      if (res.data?.success) {
        toast.success(`"${prod.nombre}" ha sido eliminado`);
        setProductos((prev) => prev.filter((p) => p.id !== prod.id));
      }
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      toast.error('No se pudo eliminar el producto.');
    }
  };

  // Ajuste rápido de stock
  const handleAbrirAjusteStock = (prod) => {
    setProductoParaStock(prod);
    setCantidadAjuste('');
    setTipoAjuste('entrada');
    setModalStockOpen(true);
  };

  const handleConfirmarAjusteStock = async () => {
    if (!productoParaStock || !cantidadAjuste || isNaN(parseInt(cantidadAjuste))) {
      toast.error('Ingrese una cantidad válida.');
      return;
    }

    const cantidad = parseInt(cantidadAjuste);
    let nuevoStock = productoParaStock.stock_actual;

    if (tipoAjuste === 'entrada') {
      nuevoStock += cantidad;
    } else if (tipoAjuste === 'salida') {
      nuevoStock = Math.max(0, nuevoStock - cantidad);
    } else {
      nuevoStock = Math.max(0, cantidad);
    }

    try {
      const res = await api.put(`/catalogo/${productoParaStock.id}`, {
        stock_actual: nuevoStock
      });
      if (res.data?.success) {
        toast.success(`Stock actualizado a ${nuevoStock} ${productoParaStock.unidad_medida || 'un.'}`);
        setProductos((prev) =>
          prev.map((p) => (p.id === productoParaStock.id ? { ...p, stock_actual: nuevoStock } : p))
        );
        setModalStockOpen(false);
      }
    } catch (err) {
      console.error('Error al actualizar stock:', err);
      toast.error('No se pudo actualizar el stock.');
    }
  };

  // Modal Foto Rápida
  const handleAbrirModalFoto = (prod) => {
    setProductoParaFoto(prod);
    setFotoPreview(prod.imagen_url || '');
    setFotoUrlInput(prod.imagen_url && prod.imagen_url.startsWith('http') ? prod.imagen_url : '');
    setFotoTab('archivo');
    setModalFotoOpen(true);
  };

  const handleFotoFileChange = async (e, target = 'modal') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor seleccione una imagen válida (JPG, PNG, WEBP).');
      return;
    }

    try {
      const compressed = await comprimirImagen(file);
      if (target === 'modal') {
        setFotoPreview(compressed);
      } else {
        setFormData((prev) => ({ ...prev, imagen_url: compressed }));
      }
      toast.success('Imagen cargada con éxito', { duration: 1200 });
    } catch (err) {
      console.error('Error al procesar imagen:', err);
      toast.error('Error al procesar la imagen.');
    }
  };

  const handleGuardarFotoRapida = async () => {
    if (!productoParaFoto) return;
    try {
      const finalImg = fotoPreview.trim() || null;
      const res = await api.put(`/catalogo/${productoParaFoto.id}`, {
        imagen_url: finalImg
      });
      if (res.data?.success) {
        toast.success(finalImg ? 'Fotografía guardada' : 'Fotografía eliminada');
        setProductos((prev) =>
          prev.map((p) => (p.id === productoParaFoto.id ? { ...p, imagen_url: finalImg } : p))
        );
        setModalFotoOpen(false);
      }
    } catch (err) {
      console.error('Error al guardar foto:', err);
      toast.error('No se pudo guardar la fotografía.');
    }
  };

  return (
    <div className="flex flex-col min-h-full font-sora space-y-4 pb-12 select-none">
      {/* ─── 1. CABECERA PRINCIPAL ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-[28px] p-4 sm:p-5 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center shadow-xs">
            <Boxes className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Inventario & Tienda
              </h1>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                Control Total
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Gestión centralizada de productos, minibar, amenidades, precios y fotografías.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={cargarProductos}
            title="Recargar catálogo"
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer active:scale-95 shadow-2xs"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>

          {esAdmin && (
            <button
              type="button"
              onClick={handleNuevoProducto}
              className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Producto</span>
            </button>
          )}
        </div>
      </div>

      {/* ─── SELECTOR DE PESTAÑA PRINCIPAL (STOCK / PROVEEDORES / COMPRAS) ─── */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 w-fit">
        <button
          type="button"
          onClick={() => setTabPrincipal('stock')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            tabPrincipal === 'stock'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Stock & Catálogo ({productos.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setTabPrincipal('proveedores')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            tabPrincipal === 'proveedores'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Directorio de Proveedores</span>
        </button>

        <button
          type="button"
          onClick={() => setTabPrincipal('compras')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            tabPrincipal === 'compras'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <PackageCheck className="w-4 h-4" />
          <span>Ingreso de Compras & Stock</span>
        </button>
      </div>

      {tabPrincipal === 'stock' && (
        <>
          {/* ─── 2. TARJETAS DE MÉTRICAS KPI ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Catálogo */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Catálogo
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5 block">
              {metricas.totalItems}
            </span>
            <span className="text-[10px] text-slate-400">ítems activos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Stock Bajo */}
        <div
          onClick={() => setFiltroStock(filtroStock === 'BAJO' ? 'TODOS' : 'BAJO')}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
            filtroStock === 'BAJO'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div>
            <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Stock Bajo
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5 block">
              {metricas.itemsBajoStock}
            </span>
            <span className="text-[10px] text-amber-600/80">requieren reposición</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Agotados */}
        <div
          onClick={() => setFiltroStock(filtroStock === 'AGOTADO' ? 'TODOS' : 'AGOTADO')}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all active:scale-98 ${
            filtroStock === 'AGOTADO'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
              : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div>
            <span className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              Sin Stock
            </span>
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
              {metricas.itemsAgotados}
            </span>
            <span className="text-[10px] text-rose-600/80">agotados en almacén</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Valor Total Inventario */}
        <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Valor en Almacén
            </span>
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5 block font-mono">
              S/ {metricas.valorVentaTotal.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">en venta proyectada</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ─── 3. BARRA DE FILTROS & BÚSQUEDA ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-[28px] p-3 sm:p-4 border border-slate-100 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-2">
          {/* Buscador */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código, nombre o descripción..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-600 border border-slate-200/60 dark:border-slate-700 transition-all font-sora shadow-2xs"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Toggle Vista: Grilla vs Tabla */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setVistaModo('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                vistaModo === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Tarjetas</span>
            </button>
            <button
              type="button"
              onClick={() => setVistaModo('tabla')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${
                vistaModo === 'tabla'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>Tabla</span>
            </button>
          </div>
        </div>

        {/* Chips de Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          {Object.values(HOTEL_CATEGORY_PALETTES).map((cat) => {
            const Icon = cat.icon;
            const esActivo = filtroCategoria === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setFiltroCategoria(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  esActivo
                    ? `${cat.activeTile} shadow-xs ring-1 ring-slate-900/10`
                    : `${cat.inactiveTile} dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-700`
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{cat.nombre}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 4. LISTADO DE PRODUCTOS (GRID vs TABLA) ─── */}
      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 animate-pulse"
            />
          ))}
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 p-8 sm:p-12 text-center text-slate-400 space-y-3 shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto shadow-2xs">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
            No se encontraron productos en esta selección
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Intenta cambiando los filtros superiores o crea un nuevo producto usando el botón superior.
          </p>
          {esAdmin && (
            <button
              type="button"
              onClick={handleNuevoProducto}
              className="mt-2 py-2 px-4 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-md hover:bg-blue-700 transition-all cursor-pointer"
            >
              + Agregar Primer Producto
            </button>
          )}
        </div>
      ) : vistaModo === 'grid' ? (
        /* VISTA EN TARJETAS CON FOTOS */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {productosFiltrados.map((prod) => {
            const catConf = getHotelCategoryConfig(prod.categoria);
            const Icon = catConf.icon;
            const precioVenta = parseFloat(prod.precio_venta || 0);
            const costo = parseFloat(prod.costo || 0);
            const stock = parseInt(prod.stock_actual) || 0;
            const stockMin = parseInt(prod.stock_minimo) || 5;
            const sinStock = prod.controla_stock && stock <= 0;
            const bajoStock = prod.controla_stock && stock <= stockMin;
            const margen = costo > 0 ? (((precioVenta - costo) / costo) * 100).toFixed(0) : null;

            return (
              <div
                key={prod.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-3 sm:p-3.5 flex flex-col justify-between shadow-sm hover:shadow-md transition-all group"
              >
                <div>
                  {/* Foto con acción de cambio rápido */}
                  <div className="relative w-full h-32 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center group/img">
                    {prod.imagen_url ? (
                      <img
                        src={prod.imagen_url}
                        alt={prod.nombre}
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
                        <Icon className="w-10 h-10 stroke-[1.5]" />
                        <span className="text-[10px] font-bold mt-1 text-slate-400">
                          {catConf.tag || 'Sin Foto'}
                        </span>
                      </div>
                    )}

                    {/* Botón flotante para cambiar foto */}
                    {esAdmin && (
                      <button
                        type="button"
                        onClick={() => handleAbrirModalFoto(prod)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-white/90 dark:bg-slate-900/90 hover:bg-white text-slate-700 dark:text-slate-200 shadow-sm border border-slate-200/80 dark:border-slate-700 flex items-center gap-1 text-[10px] font-bold cursor-pointer transition-all active:scale-95"
                        title="Gestionar foto del producto"
                      >
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span className="hidden group-hover/img:inline">Foto</span>
                      </button>
                    )}

                    {/* Badge de Categoría */}
                    <div className="absolute top-2 left-2">
                      <span className="text-[9.5px] font-black uppercase text-white bg-slate-900/80 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1 font-sora shadow-xs">
                        <Icon className="w-2.5 h-2.5 text-blue-400" />
                        <span>{catConf.tag || 'Ítem'}</span>
                      </span>
                    </div>

                    {/* Indicador de Stock */}
                    <div className="absolute bottom-2 right-2">
                      {prod.controla_stock ? (
                        <span
                          className={`text-[9.5px] font-black px-2 py-0.5 rounded-md font-sora shadow-2xs ${
                            sinStock
                              ? 'bg-rose-600 text-white'
                              : bajoStock
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-900/80 backdrop-blur-xs text-white'
                          }`}
                        >
                          {stock} {prod.unidad_medida?.toLowerCase() || 'un.'}
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-black px-2 py-0.5 rounded-md bg-blue-600/90 text-white font-sora shadow-2xs">
                          Servicio
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Detalle */}
                  <div className="mt-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span>{prod.codigo || 'SIN CÓDIGO'}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActivo(prod)}
                          className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-black uppercase cursor-pointer transition-all active:scale-95 ${
                            prod.activo !== false
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                          }`}
                          title="Clic para pausar o activar en POS"
                        >
                          {prod.activo !== false ? '● Activo' : '⏸ Pausado'}
                        </button>
                        <span>{prod.unidad_medida || 'Unidad'}</span>
                      </div>
                    </div>
                    <h3
                      className="font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm leading-tight line-clamp-2"
                      title={prod.nombre}
                    >
                      {prod.nombre}
                    </h3>
                    {prod.descripcion && (
                      <p className="text-[10px] text-slate-400 italic line-clamp-1" title={prod.descripcion}>
                        "{prod.descripcion}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Precios y Acciones */}
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] text-slate-400 font-bold block">Precio Venta:</span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white font-sora">
                        S/ {precioVenta.toFixed(2)}
                      </span>
                    </div>

                    {costo > 0 && (
                      <div className="text-right">
                        <span className="text-[9.5px] text-slate-400 font-bold block">Costo: S/ {costo.toFixed(2)}</span>
                        {margen && (
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 font-sora">
                            +{margen}% mg.
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Botones de Administración */}
                  {esAdmin && (
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      {prod.controla_stock ? (
                        <button
                          type="button"
                          onClick={() => handleAbrirAjusteStock(prod)}
                          className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                          title="Ajustar cantidad en stock"
                        >
                          <Boxes className="w-3 h-3 text-blue-600" />
                          <span>Stock</span>
                        </button>
                      ) : (
                        <div />
                      )}

                      <button
                        type="button"
                        onClick={() => handleEditarProducto(prod)}
                        className="py-1.5 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800 text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                        title="Editar datos del producto"
                      >
                        <Edit3 className="w-3 h-3 text-blue-600" />
                        <span>Editar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEliminarProducto(prod)}
                        className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50 text-[10.5px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors active:scale-95"
                        title="Eliminar de catálogo"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" />
                        <span>Borrar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VISTA EN TABLA DETALLADA */
        <div className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Precio Venta</th>
                  <th className="py-3 px-4">Costo</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {productosFiltrados.map((prod) => {
                  const catConf = getHotelCategoryConfig(prod.categoria);
                  const Icon = catConf.icon;
                  const precioVenta = parseFloat(prod.precio_venta || 0);
                  const costo = parseFloat(prod.costo || 0);
                  const stock = parseInt(prod.stock_actual) || 0;
                  const stockMin = parseInt(prod.stock_minimo) || 5;
                  const sinStock = prod.controla_stock && stock <= 0;
                  const bajoStock = prod.controla_stock && stock <= stockMin;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Foto */}
                      <td className="py-2.5 px-4">
                        <div
                          onClick={() => handleAbrirModalFoto(prod)}
                          className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all shrink-0"
                          title="Clic para cambiar foto"
                        >
                          {prod.imagen_url ? (
                            <img
                              src={prod.imagen_url}
                              alt={prod.nombre}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Icon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                      </td>

                      {/* Producto */}
                      <td className="py-2.5 px-4 font-sora">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                            {prod.nombre}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleToggleActivo(prod)}
                            className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase cursor-pointer transition-all active:scale-95 ${
                              prod.activo !== false
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 hover:bg-emerald-100'
                                : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/80 hover:bg-amber-100'
                            }`}
                            title={prod.activo !== false ? 'Activo en POS (Clic para pausar)' : 'Pausado en POS (Clic para activar)'}
                          >
                            {prod.activo !== false ? '● Activo' : '⏸ Pausado'}
                          </button>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {prod.codigo} • {prod.unidad_medida || 'Unidad'}
                        </p>
                        {prod.descripcion && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 italic truncate max-w-xs mt-0.5" title={prod.descripcion}>
                            "{prod.descripcion}"
                          </p>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-2.5 px-4">
                        <span className="text-[9.5px] font-black uppercase text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Icon className="w-2.5 h-2.5 text-blue-500" />
                          <span>{catConf.tag || 'Ítem'}</span>
                        </span>
                      </td>

                      {/* Precio */}
                      <td className="py-2.5 px-4 font-black text-slate-900 dark:text-white font-mono text-xs">
                        S/ {precioVenta.toFixed(2)}
                      </td>

                      {/* Costo con Margen */}
                      <td className="py-2.5 px-4 font-mono text-xs">
                        <span className="font-bold text-slate-500 block">
                          {costo > 0 ? `S/ ${costo.toFixed(2)}` : '—'}
                        </span>
                        {costo > 0 && precioVenta > 0 && (
                          <span
                            className={`block text-[9.5px] font-extrabold ${
                              precioVenta < costo
                                ? 'text-rose-600'
                                : (((precioVenta - costo) / costo) * 100) >= 30
                                ? 'text-emerald-600'
                                : 'text-amber-600'
                            }`}
                          >
                            {(((precioVenta - costo) / costo) * 100).toFixed(0) > 0 ? '+' : ''}
                            {(((precioVenta - costo) / costo) * 100).toFixed(0)}% marg.
                          </span>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="py-2.5 px-4">
                        {prod.controla_stock ? (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black inline-flex items-center gap-1 font-sora ${
                              sinStock
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : bajoStock
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            }`}
                          >
                            <span>{stock} {prod.unidad_medida?.toLowerCase() || 'un.'}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
                            Servicio
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-2.5 px-4 text-right">
                        {esAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            {prod.controla_stock && (
                              <button
                                type="button"
                                onClick={() => handleAbrirAjusteStock(prod)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                                title="Ajuste de Stock"
                              >
                                <Boxes className="w-3.5 h-3.5 text-blue-600" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleEditarProducto(prod)}
                              className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-600 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEliminarProducto(prod)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
        </>
      )}

      {/* ─── PESTAÑA: DIRECTORIO DE PROVEEDORES ─── */}
      {tabPrincipal === 'proveedores' && (
        <ProveedoresTab esAdmin={esAdmin} />
      )}

      {/* ─── PESTAÑA: INGRESO DE COMPRAS & STOCK ─── */}
      {tabPrincipal === 'compras' && (
        <ComprasTab
          esAdmin={esAdmin}
          productos={productos}
          onStockActualizado={cargarProductos}
        />
      )}

      {/* ─── MODAL CREACIÓN & EDICIÓN DE PRODUCTO ─── */}
      {modalFormOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setModalFormOpen(false)}
        >
          <div
            className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden font-sora animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800 flex items-center justify-center shadow-xs">
                  {productoEditando ? <Edit3 className="w-4.5 h-4.5" /> : <Plus className="w-4.5 h-4.5" />}
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                    {productoEditando ? 'Editar Producto / Servicio' : 'Nuevo Producto / Servicio'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Catálogo de tienda, minibar, restaurante o amenidades
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalFormOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmitForm} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 custom-modal-scroll">
              {/* Sección de Imagen del Producto */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Fotografía del Producto (Opcional):
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  {/* Preview de la foto */}
                  <div className="w-24 h-24 rounded-xl overflow-hidden bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center relative shrink-0 group">
                    {formData.imagen_url ? (
                      <>
                        <img
                          src={formData.imagen_url}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, imagen_url: '' }))}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold"
                        >
                          Quitar
                        </button>
                      </>
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    )}
                  </div>

                  {/* Acciones de carga */}
                  <div className="flex-1 space-y-2 w-full">
                    <input
                      ref={formFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFotoFileChange(e, 'form')}
                      className="hidden"
                      id="form-product-image-upload"
                    />

                    <label
                      htmlFor="form-product-image-upload"
                      className="w-full py-2 px-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-98 shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Subir foto desde este equipo</span>
                    </label>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={formData.imagen_url}
                        onChange={(e) => setFormData((prev) => ({ ...prev, imagen_url: e.target.value }))}
                        placeholder="O pegar URL web de imagen..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-sora text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1.5 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Nombre y Código */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nombre del Producto / Servicio *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Agua San Luis 600ml / Desayuno Americano"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-sora text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Código / SKU
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          codigo: generarCodigoPorCategoria(prev.categoria)
                        }))
                      }
                      className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 font-extrabold flex items-center gap-0.5 cursor-pointer"
                      title="Generar código automático con prefijo de categoría"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generar</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value }))}
                    placeholder="MIN-1001"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 uppercase"
                  />
                </div>
              </div>

              {/* Descripción / Notas de Servicio para Recepción */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Descripción / Instrucciones de Servicio (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.descripcion}
                  onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Ej: Ubicado en el minibar de suites. Reponer en checkout matutino o incluir cubiertos..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-sora text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-400"
                />
              </div>

              {/* Categoría Personalizada Neo-SaaS & Unidad de Medida */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <CategoriaDropdown
                  value={formData.categoria}
                  onChange={(nuevaCat) => {
                    setFormData((prev) => ({
                      ...prev,
                      categoria: nuevaCat,
                      codigo:
                        !prev.codigo || /^[A-Z]{3}-\d{4}$/.test(prev.codigo)
                          ? generarCodigoPorCategoria(nuevaCat)
                          : prev.codigo
                    }));
                  }}
                />

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    value={formData.unidad_medida}
                    onChange={(e) => setFormData((prev) => ({ ...prev, unidad_medida: e.target.value }))}
                    placeholder="Ej: Unidad / Botella / Servicio"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-sora text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 font-bold"
                  />
                  {/* Chips de sugerencia rápida */}
                  <div className="flex items-center gap-1 mt-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                    {['Unidad', 'Botella', 'Servicio', 'Plato', 'Copa'].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, unidad_medida: u }))}
                        className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md transition-all cursor-pointer ${
                          formData.unidad_medida === u
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Precios: Venta y Costo con Cálculo de Rentabilidad en Vivo */}
              <div className="p-3 bg-slate-50/70 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-blue-700 dark:text-blue-300 block mb-1">
                      Precio de Venta al Público (S/) *
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      required
                      value={formData.precio_venta}
                      onChange={(e) => setFormData((prev) => ({ ...prev, precio_venta: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-xl font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">
                      Costo de Compra / Insumo (S/)
                    </label>
                    <input
                      type="number"
                      step="0.10"
                      min="0"
                      value={formData.costo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, costo: e.target.value }))}
                      placeholder="0.00"
                      className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Badge de Rentabilidad en Vivo */}
                {calculoRentabilidad && (
                  <div
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                      calculoRentabilidad.esPerdida
                        ? 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300'
                        : calculoRentabilidad.esNeutro
                        ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300'
                        : 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {calculoRentabilidad.esPerdida ? (
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <span>
                        {calculoRentabilidad.esPerdida
                          ? '¡Alerta! Vendiendo por debajo del costo'
                          : calculoRentabilidad.esNeutro
                          ? 'Venta a precio de costo (Sin margen)'
                          : 'Margen de ganancia:'}
                      </span>
                    </div>

                    <div className="font-mono font-black text-right shrink-0">
                      <span>
                        {calculoRentabilidad.ganancia >= 0 ? '+' : ''}S/ {calculoRentabilidad.ganancia.toFixed(2)}
                      </span>
                      {calculoRentabilidad.porcentaje !== null && (
                        <span className="text-[10px] ml-1.5 opacity-80">
                          ({calculoRentabilidad.porcentaje > 0 ? '+' : ''}{calculoRentabilidad.porcentaje}%)
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Switch Estado: Activo para Venta en POS vs Pausado */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Disponibilidad en el POS de Recepción
                    </h4>
                    <span
                      className={`text-[9.5px] font-black uppercase px-2 py-0.5 rounded-full ${
                        formData.activo
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      }`}
                    >
                      {formData.activo ? '● Activo en Caja' : '⏸ Pausado (Oculto)'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {formData.activo
                      ? 'El producto aparecerá disponible para cobro inmediato en el POS'
                      : 'Pausado temporalmente: el cajero no podrá venderlo hasta que lo actives'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, activo: !prev.activo }))}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    formData.activo ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white block transition-transform absolute top-1 ${
                      formData.activo ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Switch Controla Stock */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      ¿Controla Existencias / Stock?
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      Desactívalo para servicios (lavandería, masajes, tours, etc.)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, controla_stock: !prev.controla_stock }))}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      formData.controla_stock ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white block transition-transform absolute top-1 ${
                        formData.controla_stock ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {formData.controla_stock && (
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Stock Actual
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.stock_actual}
                        onChange={(e) => setFormData((prev) => ({ ...prev, stock_actual: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                        Stock Mínimo (Alerta)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.stock_minimo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, stock_minimo: e.target.value }))}
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setModalFormOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardandoProducto}
                  className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-600/25 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>{productoEditando ? 'Guardar Cambios' : 'Registrar Producto'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL AJUSTE RÁPIDO DE STOCK ─── */}
      {modalStockOpen && productoParaStock && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setModalStockOpen(false)}
        >
          <div
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden font-sora animate-in zoom-in-95 duration-200 p-4 sm:p-5 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Ajuste de Existencias
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
                    {productoParaStock.nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalStockOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Stock Actual</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                {productoParaStock.stock_actual} {productoParaStock.unidad_medida || 'un.'}
              </span>
            </div>

            <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setTipoAjuste('entrada')}
                className={`py-1.5 rounded-lg transition-all ${
                  tipoAjuste === 'entrada'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                + Entrada
              </button>
              <button
                type="button"
                onClick={() => setTipoAjuste('salida')}
                className={`py-1.5 rounded-lg transition-all ${
                  tipoAjuste === 'salida'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                - Salida
              </button>
              <button
                type="button"
                onClick={() => setTipoAjuste('fijar')}
                className={`py-1.5 rounded-lg transition-all ${
                  tipoAjuste === 'fijar'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                = Fijar
              </button>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Cantidad a {tipoAjuste === 'entrada' ? 'sumar (+)' : tipoAjuste === 'salida' ? 'restar (-)' : 'establecer (=)'}:
              </label>
              <input
                type="number"
                min="0"
                value={cantidadAjuste}
                onChange={(e) => setCantidadAjuste(e.target.value)}
                placeholder="Ej: 10"
                className="w-full px-3 py-2 text-center text-base font-black font-mono bg-slate-50 dark:bg-slate-800 border rounded-xl focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalStockOpen(false)}
                className="py-2 px-3 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarAjusteStock}
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL FOTO RÁPIDA ─── */}
      {modalFotoOpen && productoParaFoto && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs select-none overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setModalFotoOpen(false)}
        >
          <div
            className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden font-sora animate-in zoom-in-95 duration-200 p-4 sm:p-5 space-y-4 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                    Fotografía del Producto
                  </h4>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    {productoParaFoto.nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalFotoOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Preview */}
            <div className="w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden flex items-center justify-center">
              {fotoPreview ? (
                <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4 text-slate-400">
                  <ImageIcon className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-1" />
                  <p className="text-xs font-bold">Sin foto asignada</p>
                </div>
              )}
            </div>

            {/* Selector de subida */}
            <div className="space-y-2">
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFotoTab('archivo')}
                  className={`py-1.5 rounded-lg transition-all ${
                    fotoTab === 'archivo' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Subir Archivo
                </button>
                <button
                  type="button"
                  onClick={() => setFotoTab('url')}
                  className={`py-1.5 rounded-lg transition-all ${
                    fotoTab === 'url' ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-2xs' : 'text-slate-500'
                  }`}
                >
                  Enlace Web
                </button>
              </div>

              {fotoTab === 'archivo' ? (
                <>
                  <input
                    ref={fileInputFotoRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFotoFileChange(e, 'modal')}
                    className="hidden"
                    id="quick-photo-input"
                  />
                  <label
                    htmlFor="quick-photo-input"
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Seleccionar foto de mi computadora</span>
                  </label>
                </>
              ) : (
                <input
                  type="url"
                  value={fotoUrlInput}
                  onChange={(e) => {
                    setFotoUrlInput(e.target.value);
                    setFotoPreview(e.target.value);
                  }}
                  placeholder="https://ejemplo.com/foto.jpg"
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl font-sora"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              {fotoPreview ? (
                <button
                  type="button"
                  onClick={() => {
                    setFotoPreview('');
                    setFotoUrlInput('');
                  }}
                  className="text-xs text-rose-600 font-bold hover:underline"
                >
                  Quitar foto
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalFotoOpen(false)}
                  className="py-2 px-3 text-xs font-bold text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarFotoRapida}
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl shadow-md"
                >
                  Guardar Foto
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

