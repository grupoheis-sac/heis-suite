import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../api';
import toast from 'react-hot-toast';
import {
 Package,
 HardHat,
 X,
 Check,
 Image as ImageIcon,
 Sparkles,
 DollarSign,
 Boxes,
 ShieldAlert,
 Calculator,
 MapPin,
 Plus,
 Loader2,
 ChevronDown,
 Search,
 Camera,
  Info
} from 'lucide-react';

export const GRUPOS_UNIDADES = [
 {
 grupo: 'Conteo / Piezas',
 unidades: [
 { valor: 'Unidad', etiqueta: 'Unidad (Pza / Und)' },
 { valor: 'Juego', etiqueta: 'Juego (Set / Kit)' },
 { valor: 'Par', etiqueta: 'Par' },
 { valor: 'Paquete', etiqueta: 'Paquete' },
 { valor: 'Caja', etiqueta: 'Caja' },
 { valor: 'Ciento', etiqueta: 'Ciento (100 pzas)' },
 { valor: 'Millar', etiqueta: 'Millar (1,000 pzas)' }
 ]
 },
 {
 grupo: 'Longitud / Metraje (Fraccionable)',
 unidades: [
 { valor: 'Metro', etiqueta: 'Metro Lineal (m)' },
 { valor: 'Centimetro', etiqueta: 'Centímetro (cm)' },
 { valor: 'Pulgada', etiqueta: 'Pulgada (")' },
 { valor: 'Varilla', etiqueta: 'Varilla (x 9m)' },
 { valor: 'Tubo', etiqueta: 'Tubo (x 3m / 5m)' },
 { valor: 'Rollo', etiqueta: 'Rollo (x 50m / 100m)' }
 ]
 },
 {
 grupo: 'Superficie / Área (Fraccionable)',
 unidades: [
 { valor: 'Metro Cuadrado', etiqueta: 'Metro Cuadrado (m²)' },
 { valor: 'Plancha', etiqueta: 'Plancha (Drywall / Triplay / Policarbonato)' }
 ]
 },
 {
 grupo: 'Volumen / Áridos / Líquidos (Fraccionable)',
 unidades: [
 { valor: 'Metro Cubico', etiqueta: 'Metro Cúbico (m³ / Arena / Piedra)' },
 { valor: 'Litro', etiqueta: 'Litro (L)' },
 { valor: 'Galon', etiqueta: 'Galón (Gln / 3.785L)' },
 { valor: 'Balde', etiqueta: 'Balde (4 Galones / 19L)' },
 { valor: 'Bolsa', etiqueta: 'Bolsa (Cemento 42.5kg / Yeso / Cal)' }
 ]
 },
 {
 grupo: 'Peso a Granel (Fraccionable)',
 unidades: [
 { valor: 'Kilo', etiqueta: 'Kilo (Kg)' },
 { valor: 'Gramo', etiqueta: 'Gramo (g)' },
 { valor: 'Tonelada', etiqueta: 'Tonelada (Tn)' }
 ]
 }
];

export const obtenerEtiquetaUnidad = (valor) => {
 if (!valor) return 'Seleccionar Unidad';
 for (const g of GRUPOS_UNIDADES) {
 const u = g.unidades.find(item => item.valor === valor);
 if (u) return u.etiqueta;
 }
 return valor;
};

export default function ModalProducto({
 isOpen,
 onClose,
 onSuccess,
 productoEditar = null,
 categorias = [],
 proveedores = [],
 modoConstruccion = false
}) {
 const [tabModal, setTabModal] = useState('general'); // 'general' | 'stock' | 'tecnico'
 const [guardando, setGuardando] = useState(false);

 // Lista de categorías y ventana desplegable con bordes redondeados
 const [listaCategorias, setListaCategorias] = useState(categorias || []);
 const [desplegableCatAbierto, setDesplegableCatAbierto] = useState(false);
 const [busquedaCat, setBusquedaCat] = useState('');
 const [modoCrearCat, setModoCrearCat] = useState(false);
 const [nuevoCatNombre, setNuevoCatNombre] = useState('');
 const [guardandoCat, setGuardandoCat] = useState(false);
 const refSelectorCat = useRef(null);

 // Unidad de Medida con ventana desplegable redondeada
 const [desplegableUnidadAbierto, setDesplegableUnidadAbierto] = useState(false);
 const [busquedaUnidad, setBusquedaUnidad] = useState('');
 const refSelectorUnidad = useRef(null);

 // Proveedor Habitual con ventana desplegable redondeada
 const [desplegableProvAbierto, setDesplegableProvAbierto] = useState(false);
 const [busquedaProv, setBusquedaProv] = useState('');
 const refSelectorProv = useRef(null);

 useEffect(() => {
 if (categorias && categorias.length > 0) {
 setListaCategorias(categorias);
 }
 }, [categorias]);

 // Cerrar ventanas desplegables al hacer clic fuera o con tecla Escape
 useEffect(() => {
 const handleClickAfuera = (e) => {
 if (refSelectorCat.current && !refSelectorCat.current.contains(e.target)) {
 setDesplegableCatAbierto(false);
 }
 if (refSelectorUnidad.current && !refSelectorUnidad.current.contains(e.target)) {
 setDesplegableUnidadAbierto(false);
 }
 if (refSelectorProv.current && !refSelectorProv.current.contains(e.target)) {
 setDesplegableProvAbierto(false);
 }
 };
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 setDesplegableCatAbierto(false);
 setDesplegableUnidadAbierto(false);
 setDesplegableProvAbierto(false);
 }
 };
 document.addEventListener('mousedown', handleClickAfuera);
 document.addEventListener('keydown', handleKeyDown);
 return () => {
 document.removeEventListener('mousedown', handleClickAfuera);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, []);

 const handleCrearCategoria = async (e) => {
 if (e) e.preventDefault();
 if (!nuevoCatNombre.trim()) {
 return toast.error('Ingresa el nombre de la categoría o familia');
 }
 setGuardandoCat(true);
 try {
 const res = await api.post('/categorias', {
 nombre: nuevoCatNombre.trim()
 });
 if (res.success && res.categoria) {
 toast.success(`Familia "${res.categoria.nombre}" creada y seleccionada`);
 setListaCategorias(prev => [...prev, res.categoria].sort((a, b) => a.nombre.localeCompare(b.nombre)));
 handleCategoriaChange(res.categoria.id);
 setNuevoCatNombre('');
 setModoCrearCat(false);
 setDesplegableCatAbierto(false);
 }
 } catch (err) {
 toast.error(err.response?.data?.message || err.message || 'Error al crear la categoría');
 } finally {
 setGuardandoCat(false);
 }
 };

 const [formData, setFormData] = useState({
 nombre: '',
 codigo_barras: '',
 marca: '',
 descripcion: '',
 precio_compra: '',
 precio_venta: '',
 precio_mayorista: '',
 stock: '',
 stock_minimo: modoConstruccion ? '10' : '5',
 unidad_medida: modoConstruccion ? 'Bolsa' : 'Unidad',
 id_categoria: '',
 id_proveedor: '',
 ubicacion: modoConstruccion ? 'Patio de Materiales - Zona A' : '',
 imagen: '',
 es_material_construccion: modoConstruccion,
 es_fiscalizado: false,
 codigo_iqbf: '',
 tipo_fiscalizacion: 'NINGUNO',
 norma_tecnica: ''
 });

 // Bloquear scroll de fondo cuando el modal esté abierto
 useEffect(() => {
 if (isOpen) {
 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';
 return () => {
 document.body.style.overflow = originalOverflow;
 };
 }
 }, [isOpen]);

 // Inicializar valores según creación o edición
 useEffect(() => {
 if (isOpen) {
 setTabModal('general');
 if (productoEditar) {
 setFormData({
 nombre: productoEditar.nombre || '',
 codigo_barras: productoEditar.codigo_barras || '',
 marca: productoEditar.marca || '',
 descripcion: productoEditar.descripcion || '',
 precio_compra: productoEditar.precio_compra ?? '',
 precio_venta: productoEditar.precio_venta ?? '',
 precio_mayorista: productoEditar.precio_mayorista ?? '',
 stock: productoEditar.stock ?? '',
 stock_minimo: productoEditar.stock_minimo ?? (modoConstruccion ? '10' : '5'),
 unidad_medida: productoEditar.unidad_medida || (modoConstruccion ? 'Bolsa' : 'Unidad'),
 id_categoria: productoEditar.id_categoria || '',
 id_proveedor: productoEditar.id_proveedor || '',
 ubicacion: productoEditar.ubicacion || (modoConstruccion ? 'Patio de Materiales - Zona A' : ''),
 imagen: productoEditar.imagen || '',
 es_material_construccion: productoEditar.es_material_construccion !== undefined ? !!productoEditar.es_material_construccion : modoConstruccion,
 es_fiscalizado: !!productoEditar.es_fiscalizado,
 codigo_iqbf: productoEditar.codigo_iqbf || '',
 tipo_fiscalizacion: productoEditar.tipo_fiscalizacion || 'NINGUNO',
 norma_tecnica: productoEditar.norma_tecnica || ''
 });
 } else {
 // En creación buscar si hay una categoría afín si es modo construcción
 let catDefault = categorias[0]?.id || '';
 if (modoConstruccion) {
 const catConstruc = categorias.find(c => {
 const n = (c.nombre || '').toLowerCase();
 return n.includes('construc') || n.includes('cemento') || n.includes('árido') || n.includes('tuber');
 });
 if (catConstruc) catDefault = catConstruc.id;
 }

 setFormData({
 nombre: '',
 codigo_barras: '',
 marca: '',
 descripcion: '',
 precio_compra: '',
 precio_venta: '',
 precio_mayorista: '',
 stock: '',
 stock_minimo: modoConstruccion ? '10' : '5',
 unidad_medida: modoConstruccion ? 'Bolsa' : 'Unidad',
 id_categoria: catDefault,
 id_proveedor: '',
 ubicacion: modoConstruccion ? 'Patio de Materiales - Zona A' : '',
 imagen: '',
 es_material_construccion: modoConstruccion,
 es_fiscalizado: false,
 codigo_iqbf: '',
 tipo_fiscalizacion: 'NINGUNO',
 norma_tecnica: ''
 });
 }
 }
 }, [isOpen, productoEditar, modoConstruccion, categorias]);

 // AUTO-DETECCIÓN INTELIGENTE DE MATERIAL DE CONSTRUCCIÓN & GRANEL
 // Detecta si la categoría o unidad de medida seleccionada corresponde a obra
 const esUnidadConstruccion = (unidad) => {
 const u = (unidad || '').toLowerCase();
 return ['bolsa', 'metro cubico', 'varilla', 'plancha', 'tubo', 'tonelada'].includes(u);
 };

 const handleCategoriaChange = (nuevaCatId) => {
 const catEncontrada = categorias.find(c => String(c.id) === String(nuevaCatId));
 const nombreCat = (catEncontrada?.nombre || '').toLowerCase();
 const esCatConstruccion =
 nombreCat.includes('construc') ||
 nombreCat.includes('cemento') ||
 nombreCat.includes('tuber') ||
 nombreCat.includes('árido') ||
 nombreCat.includes('hierro') ||
 nombreCat.includes('acero');

 setFormData(prev => ({
 ...prev,
 id_categoria: nuevaCatId,
 es_material_construccion: modoConstruccion || esCatConstruccion || prev.es_material_construccion
 }));
 };

 const handleUnidadChange = (nuevaUnidad) => {
 const esDeConstruccion = esUnidadConstruccion(nuevaUnidad);
 setFormData(prev => ({
 ...prev,
 unidad_medida: nuevaUnidad,
 es_material_construccion: modoConstruccion || esDeConstruccion || prev.es_material_construccion
 }));
 };

 // Calculadora de Márgenes en Tiempo Real
 const pCompraNum = parseFloat(formData.precio_compra) || 0;
 const pVentaNum = parseFloat(formData.precio_venta) || 0;
 const gananciaSoles = pVentaNum > 0 && pCompraNum > 0 ? (pVentaNum - pCompraNum) : 0;
 const margenPorcentaje = pCompraNum > 0 && pVentaNum > 0 ? (((pVentaNum - pCompraNum) / pCompraNum) * 100) : 0;

 const aplicarMargen = (porcentaje) => {
 if (!formData.precio_compra || pCompraNum <= 0) {
 return toast.error('Ingresa primero el Precio de Compra para calcular el margen');
 }
 const nuevoPrecioVenta = (pCompraNum * (1 + porcentaje / 100)).toFixed(2);
 setFormData(prev => ({ ...prev, precio_venta: nuevoPrecioVenta }));
 toast.success(`Precio venta calculado al +${porcentaje}% de margen (S/ ${nuevoPrecioVenta})`);
 };

 const generarCodigoBarras = () => {
 const prefijo = modoConstruccion || formData.es_material_construccion ? 'MAT' : 'FER';
 const randomPart = Math.floor(100000 + Math.random() * 900000);
 setFormData(prev => ({ ...prev, codigo_barras: `${prefijo}-${randomPart}` }));
 toast.success(`Código interno generado (${prefijo})`);
 };

 const handleSubmit = async (e) => {
 e.preventDefault();
 if (!formData.nombre.trim()) {
 return toast.error('El nombre del producto es obligatorio');
 }

 setGuardando(true);
 try {
 if (productoEditar) {
 await api.put(`/productos/${productoEditar.id}`, formData);
 toast.success('Artículo actualizado exitosamente');
 } else {
 await api.post('/productos', formData);
 toast.success(
 formData.es_material_construccion
 ? 'Material registrado en almacén y catálogo'
 : 'Artículo registrado en inventario'
 );
 }
 onClose();
 if (onSuccess) onSuccess();
 } catch (error) {
 toast.error(error.message || 'Error al guardar artículo');
 } finally {
 setGuardando(false);
 }
 };

 if (!isOpen || typeof document === 'undefined') return null;

 return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
      {/* Backdrop estático e independiente */}
      <div
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Contenedor centrado */}
      <div
        className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
        onClick={onClose}
      >
        <div
          className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera del Modal */}
          <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl text-white flex items-center justify-center shadow-xs shrink-0 ${
                modoConstruccion || formData.es_material_construccion
                  ? 'bg-amber-600'
                  : 'bg-indigo-600'
              }`}>
                {modoConstruccion || formData.es_material_construccion ? (
                  <HardHat className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </div>
              <div className="min-w-0 flex-1 pr-1">
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                  <span className="truncate">
                    {productoEditar
                      ? modoConstruccion
                        ? 'Editar Material de Construcción'
                        : 'Editar Artículo'
                      : modoConstruccion
                        ? 'Nuevo Material de Construcción & Granel'
                        : 'Nuevo Artículo en Inventario'}
                  </span>
                  {productoEditar && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                      ID: #{productoEditar.id}
                    </span>
                  )}
                </h3>
                <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                  {modoConstruccion
                    ? 'Cemento, fierro corrugado, áridos, tuberías PVC, mallas y ladrillos'
                    : 'Herramientas, construcción, cerrajería, tuberías, fijación y suministros'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
              title="Cerrar modal"
            >
              <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
            </button>
          </div>

          {/* Barra Segmentada de Pestañas */}
          <div className="flex items-center gap-1 px-3 sm:px-5 pt-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/50 overflow-x-auto custom-scrollbar no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setTabModal('general')}
              className={`pb-2.5 pt-1.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold transition-all relative flex items-center gap-1.5 border-b-2 cursor-pointer shrink-0 whitespace-nowrap ${
                tabModal === 'general'
                  ? (modoConstruccion || formData.es_material_construccion
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                      : 'border-indigo-600 text-indigo-600 dark:text-indigo-400')
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>General & Precios</span>
            </button>

            <button
              type="button"
              onClick={() => setTabModal('stock')}
              className={`pb-2.5 pt-1.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold transition-all relative flex items-center gap-1.5 border-b-2 cursor-pointer shrink-0 whitespace-nowrap ${
                tabModal === 'stock'
                  ? (modoConstruccion || formData.es_material_construccion
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                      : 'border-indigo-600 text-indigo-600 dark:text-indigo-400')
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Boxes className="w-3.5 h-3.5" />
              <span>Stock & Almacén</span>
            </button>

            <button
              type="button"
              onClick={() => setTabModal('tecnico')}
              className={`pb-2.5 pt-1.5 px-2.5 sm:px-3 text-[11px] sm:text-xs font-bold transition-all relative flex items-center gap-1.5 border-b-2 cursor-pointer shrink-0 whitespace-nowrap ${
                tabModal === 'tecnico'
                  ? (modoConstruccion || formData.es_material_construccion
                      ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                      : 'border-indigo-600 text-indigo-600 dark:text-indigo-400')
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Ficha Técnica & SUNAT</span>
              {(formData.es_fiscalizado || formData.es_material_construccion) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              )}
            </button>
          </div>

          {/* Formulario con Cuerpo Scrolleable y Pie Fijo */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Cuerpo Scrolleable */}
            <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-5 space-y-4">
 {/* ═══════════ TAB 1: GENERAL & PRECIOS ═══════════ */}
 {tabModal === 'general' && (
 <div className="space-y-3.5 animate-in fade-in-50 duration-150">
 {/* Foto y Nombre */}
 <div className="flex flex-col sm:flex-row gap-3.5 items-start">
 {/* Thumbnail Foto Interactivo (Clic directo en el espacio para agregar/cambiar foto) */}
 <div className="relative w-20 h-20 shrink-0 group">
 <label
 className="w-full h-full rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50/40 dark:hover:bg-slate-700/60 flex flex-col items-center justify-center overflow-hidden cursor-pointer transition-all select-none relative"
 title={formData.imagen ? 'Clic para cambiar foto' : 'Clic para seleccionar foto'}
 >
 <input
 type="file"
 accept="image/png, image/jpeg, image/webp"
 className="hidden"
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (!file) return;
 if (file.size > 5 * 1024 * 1024) {
 return toast.error('La imagen no debe superar los 5MB');
 }
 const reader = new FileReader();
 reader.onload = (uploadEvent) => {
 setFormData({ ...formData, imagen: uploadEvent.target.result });
 toast.success('Foto cargada');
 };
 reader.readAsDataURL(file);
 }}
 />

 {formData.imagen ? (
 <>
 <img
 src={formData.imagen}
 alt="Vista previa"
 className="w-full h-full object-cover"
 />
 {/* Overlay hover para cambiar foto */}
 <div className="absolute inset-0 bg-slate-950/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
 <Camera className="w-5 h-5 text-white/95 drop-shadow-sm" />
 <span className="text-[9px] font-bold text-white/95 mt-0.5">Cambiar</span>
 </div>
 </>
 ) : (
 <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
 <ImageIcon className="w-6 h-6 stroke-[1.5]" />
 <span className="text-[9px] font-bold mt-1">Sin foto</span>
 </div>
 )}
 </label>

 {/* Botón flotante para quitar foto si ya existe una */}
 {formData.imagen && (
 <button
 type="button"
 onClick={(e) => {
 e.preventDefault();
 e.stopPropagation();
 setFormData({ ...formData, imagen: '' });
 }}
 className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md cursor-pointer transition-all z-10"
 title="Quitar foto"
 >
 <X className="w-3 h-3 stroke-[2.5]" />
 </button>
 )}
 </div>

 <div className="flex-1 w-full space-y-2">
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
 Nombre del Producto / Material <span className="text-rose-500">*</span>
 </label>
 <input
 type="text"
 required
 placeholder={
 modoConstruccion
 ? 'Ej: Cemento Sol Tipo I (42.5kg) o Fierro Corrugado 1/2" Aceros Arequipa'
 : 'Ej: Taladro Percutor 650W o Tubo PVC SAP 1/2 x 3m Presión'
 }
 value={formData.nombre}
 onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>
 </div>

 {/* Categoría / Familia y Marca */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
 {/* Selector con Ventana Desplegable Redondeada (rounded-2xl) y Alta Rápida */}
 <div className={`relative ${desplegableCatAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorCat}>
 <div className="flex items-center justify-between mb-1">
 <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
 Categoría / Familia
 </label>
 <button
 type="button"
 onClick={() => {
 setModoCrearCat(!modoCrearCat);
 setNuevoCatNombre('');
 setDesplegableCatAbierto(false);
 }}
 className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
 >
 <Plus className="w-3 h-3 stroke-[2.5]" />
 <span>{modoCrearCat ? 'Elegir de lista' : 'Nueva Familia'}</span>
 </button>
 </div>

 {modoCrearCat ? (
 <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
 <input
 type="text"
 autoFocus
 placeholder="Nombre de la nueva familia..."
 value={nuevoCatNombre}
 onChange={(e) => setNuevoCatNombre(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === 'Enter') {
 e.preventDefault();
 handleCrearCategoria();
 }
 if (e.key === 'Escape') {
 setModoCrearCat(false);
 setNuevoCatNombre('');
 }
 }}
 className="flex-1 px-3 py-2 rounded-xl border border-indigo-400 dark:border-indigo-600 text-xs font-semibold text-slate-800 dark:text-white bg-indigo-50/20 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 <button
 type="button"
 disabled={guardandoCat}
 onClick={handleCrearCategoria}
 className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
 title="Guardar y seleccionar"
 >
 {guardandoCat ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
 <span className="hidden sm:inline">Guardar</span>
 </button>
 <button
 type="button"
 onClick={() => {
 setModoCrearCat(false);
 setNuevoCatNombre('');
 }}
 className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
 title="Cancelar"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 ) : (
 <>
 {/* Botón Disparador que simula el select con bordes redondeados rounded-xl (evita ventana cuadrada del SO) */}
 {(() => {
 const catSeleccionada = listaCategorias.find(c => String(c.id) === String(formData.id_categoria));
 return (
 <button
 type="button"
 onClick={() => {
 setDesplegableCatAbierto(!desplegableCatAbierto);
 setBusquedaCat('');
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableCatAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className={`text-xs font-semibold truncate ${
 catSeleccionada
 ? 'text-slate-900 dark:text-white'
 : 'text-slate-500 dark:text-slate-400'
 }`}>
 {catSeleccionada ? catSeleccionada.nombre : 'General (Sin asignar)'}
 </span>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableCatAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>
 );
 })()}

 {/* ── VENTANA DESPLEGABLE CON BORDES REDONDEADOS (rounded-2xl) ── */}
 {desplegableCatAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {/* Buscador Rápido con bordes rounded-xl */}
 {listaCategorias.length > 5 && (
 <div className="relative p-1">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 placeholder="Buscar familia..."
 value={busquedaCat}
 onChange={(e) => setBusquedaCat(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 )}

 {/* Lista con elementos redondeados (rounded-xl) */}
 <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {/* Opción General (Sin asignar) */}
 <button
 type="button"
 onClick={() => {
 handleCategoriaChange('');
 setDesplegableCatAbierto(false);
 setBusquedaCat('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 !formData.id_categoria
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span>General (Sin asignar)</span>
 {!formData.id_categoria && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
 </button>

 {/* Categorías Filtradas */}
 {(() => {
 const filtradas = listaCategorias.filter(c =>
 !busquedaCat.trim() || c.nombre.toLowerCase().includes(busquedaCat.toLowerCase().trim())
 );

 if (filtradas.length === 0) {
 return (
 <div className="px-3 py-3 text-center text-xs text-slate-400">
 No se encontró "{busquedaCat}"
 </div>
 );
 }

 return filtradas.map((cat) => {
 const estaSeleccionada = String(formData.id_categoria) === String(cat.id);
 return (
 <button
 key={cat.id}
 type="button"
 onClick={() => {
 handleCategoriaChange(cat.id);
 setDesplegableCatAbierto(false);
 setBusquedaCat('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSeleccionada
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span className="truncate">{cat.nombre}</span>
 {estaSeleccionada && (
 <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
 )}
 </button>
 );
 });
 })()}
 </div>

 {/* Botón "+ Crear nueva familia" al pie con bordes rounded-xl */}
 <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
 <button
 type="button"
 onClick={() => {
 setModoCrearCat(true);
 setDesplegableCatAbierto(false);
 setNuevoCatNombre(busquedaCat);
 setBusquedaCat('');
 }}
 className="w-full px-3 py-1.5 rounded-xl text-left text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 flex items-center gap-1.5 transition-colors cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
 <span>{busquedaCat ? `Crear "${busquedaCat}" como nueva familia` : 'Crear nueva familia'}</span>
 </button>
 </div>
 </div>
 )}
 </>
 )}
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Marca / Fabricante
 </label>
 <input
 type="text"
 placeholder="Ej: Aceros Arequipa, Cemento Sol, Pavco, Stanley, Bosch, Sika"
 value={formData.marca}
 onChange={(e) => setFormData({ ...formData, marca: e.target.value })}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
 />
 </div>
 </div>

 {/* Código de barras / SKU con Generador */}
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
 Código de Barras / SKU / Código Interno
 </label>
 <span className="text-[10px] text-slate-400">
 Para lectores láser o artículos a granel
 </span>
 </div>
 <div className="flex items-center gap-2">
 <div className="relative flex-1">
 <input
 type="text"
 placeholder="775123456789 o pulsa Autogenerar"
 value={formData.codigo_barras}
 onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
 />
 </div>
 <button
 type="button"
 onClick={generarCodigoBarras}
 className="px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold border border-indigo-200/80 dark:border-indigo-800/80 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
 title="Genera un código único para productos sin código de fábrica (tornillos sueltos, manguera por metro, etc.)"
 >
 <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
 <span>Autogenerar</span>
 </button>
 </div>
 </div>

 {/* ── TARJETA CALCULADORA INTELIGENTE DE PRECIOS & MÁRGENES ── */}
 <div className="bg-slate-50/90 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
 <div className="flex items-center justify-between">
 <span className="text-[11px] font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
 <Calculator className="w-3.5 h-3.5 text-indigo-600" />
 <span>Estructura de Precios & Rentabilidad</span>
 </span>

 {/* Badge de Margen Dinámico */}
 <div className={`px-2 py-0.5 rounded-lg text-[10.5px] font-mono font-bold flex items-center gap-1 border ${
 gananciaSoles > 0
 ? margenPorcentaje >= 25
 ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
 : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
 : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600'
 }`}>
 <span>Margen: {margenPorcentaje > 0 ? `+${margenPorcentaje.toFixed(1)}%` : '0%'}</span>
 {gananciaSoles > 0 && (
 <span className="text-[9.5px] opacity-80">
 (Ganancia: +S/ {gananciaSoles.toFixed(2)})
 </span>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
 <div>
 <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
 P. Compra / Costo (S/)
 </label>
 <input
 type="number"
 step="any"
 placeholder="20.00"
 value={formData.precio_compra}
 onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
 className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
 />
 </div>

 <div>
 <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-200 mb-1">
 P. Venta Público (S/) <span className="text-rose-500">*</span>
 </label>
 <input
 type="number"
 step="any"
 required
 placeholder="28.00"
 value={formData.precio_venta}
 onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
 className="w-full px-2.5 py-2 rounded-xl border border-indigo-300 dark:border-indigo-600 text-xs font-mono font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 ring-1 ring-indigo-500/20"
 />
 </div>

 <div>
 <label className="block text-[10.5px] font-bold text-slate-600 dark:text-slate-300 mb-1">
 P. por Mayor / Maestro (S/)
 </label>
 <input
 type="number"
 step="any"
 placeholder="24.50"
 value={formData.precio_mayorista}
 onChange={(e) => setFormData({ ...formData, precio_mayorista: e.target.value })}
 className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
 />
 </div>
 </div>

 {/* Atajos de margen rápido */}
 <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
 Margen Rápido:
 </span>
 {[20, 25, 30, 40, 50, 100].map((pct) => (
 <button
 key={pct}
 type="button"
 onClick={() => aplicarMargen(pct)}
 className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 text-[10.5px] font-bold border border-slate-200 dark:border-slate-600 transition-colors cursor-pointer"
 >
 +{pct}%
 </button>
 ))}
 </div>
 </div>
 </div>
 )}

 {/* ═══════════ TAB 2: STOCK & ALMACÉN ═══════════ */}
 {tabModal === 'stock' && (
 <div className="space-y-3.5 min-h-[380px] animate-in fade-in-50 duration-150">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
 {productoEditar ? 'Stock Físico Actual (Kardex)' : 'Stock Inicial (Apertura de Kardex)'} {!productoEditar && <span className="text-rose-500">*</span>}
 </label>
 {productoEditar && (
 <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
 Protegido por Kardex
 </span>
 )}
 </div>
 {productoEditar ? (
 <div>
 <input
 type="number"
 readOnly
 disabled
 value={formData.stock}
 className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono font-black text-slate-600 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800/80 cursor-not-allowed select-none"
 />
 <div className="mt-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-[10.5px] text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
 <Info className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span><b className="text-indigo-600 dark:text-indigo-400">Auditoría:</b></span>
 <span>Para ingresar o retirar unidades físicas de este producto, use <b>Control de Stock</b>, <b>Ajustes</b> o el módulo de <b>Compras</b>.</span>
 </div>
 </div>
 ) : (
 <>
 <input
 type="number"
 step="any"
 required
 placeholder="15"
 value={formData.stock}
 onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-black text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800"
 />
 <span className="text-[10px] text-slate-400 mt-0.5 block">
 Cantidad física inicial registrada oficialmente al abrir el inventario.
 </span>
 </>
 )}
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Stock Mínimo (Alerta de Reposición)
 </label>
 <input
 type="number"
 step="any"
 placeholder="5"
 value={formData.stock_minimo}
 onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
 />
 <span className="text-[10px] text-slate-400 mt-0.5 block">
 Genera alertas en Control de Stock cuando el saldo baje de este nivel.
 </span>
 </div>
 </div>

 {/* Unidad de Medida con ventana desplegable redondeada (rounded-2xl) */}
 <div className={`relative ${desplegableUnidadAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorUnidad}>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Unidad de Medida
 </label>

 {/* Botón Disparador */}
 <button
 type="button"
 onClick={() => {
 setDesplegableUnidadAbierto(!desplegableUnidadAbierto);
 setBusquedaUnidad('');
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableUnidadAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
 {obtenerEtiquetaUnidad(formData.unidad_medida)}
 </span>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableUnidadAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>

 {/* Ventana Desplegable con bordes redondeados (rounded-2xl) */}
 {desplegableUnidadAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {/* Buscador de Unidad */}
 <div className="relative p-1">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 placeholder="Buscar unidad (m, kg, bolsa, tubo...)..."
 value={busquedaUnidad}
 onChange={(e) => setBusquedaUnidad(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 {/* Lista agrupada */}
 <div className="max-h-60 overflow-y-auto space-y-2 custom-scrollbar p-0.5">
 {GRUPOS_UNIDADES.map(grupo => {
 const unidadesFiltradas = grupo.unidades.filter(u =>
 !busquedaUnidad.trim() ||
 u.etiqueta.toLowerCase().includes(busquedaUnidad.toLowerCase().trim()) ||
 u.valor.toLowerCase().includes(busquedaUnidad.toLowerCase().trim())
 );

 if (unidadesFiltradas.length === 0) return null;

 return (
 <div key={grupo.grupo} className="space-y-0.5">
 <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 px-2 py-0.5 uppercase tracking-wider">
 {grupo.grupo}
 </div>
 {unidadesFiltradas.map(u => {
 const seleccionada = formData.unidad_medida === u.valor;
 return (
 <button
 key={u.valor}
 type="button"
 onClick={() => {
 handleUnidadChange(u.valor);
 setDesplegableUnidadAbierto(false);
 setBusquedaUnidad('');
 }}
 className={`w-full px-3 py-1.5 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 seleccionada
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span>{u.etiqueta}</span>
 {seleccionada && (
 <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
 )}
 </button>
 );
 })}
 </div>
 );
 })}
 </div>
 </div>
 )}
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Ubicación Almacén / Tienda
 </label>
 <div className="relative">
 <input
 type="text"
 placeholder="Ej: Estante B-3, Pasillo 2, Patio Áridos"
 value={formData.ubicacion}
 onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
 className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
 />
 <MapPin className="w-3.5 h-3.5 text-rose-500 absolute left-2.5 top-2.5" />
 </div>
 </div>

 {/* Proveedor Habitual con ventana desplegable redondeada (rounded-2xl) - Despliega hacia arriba para no chocar con el pie */}
 <div className={`relative ${desplegableProvAbierto ? 'z-40' : 'z-10'}`} ref={refSelectorProv}>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Proveedor Habitual / Distribuidor
 </label>

 {/* Botón Disparador */}
 {(() => {
 const provSeleccionado = proveedores.find(p => String(p.id) === String(formData.id_proveedor));
 return (
 <button
 type="button"
 onClick={() => {
 setDesplegableProvAbierto(!desplegableProvAbierto);
 setBusquedaProv('');
 }}
 className={`w-full px-3 py-2 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableProvAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800'
 }`}
 >
 <span className={`text-xs font-semibold truncate ${
 provSeleccionado
 ? 'text-slate-900 dark:text-white'
 : 'text-slate-500 dark:text-slate-400'
 }`}>
 {provSeleccionado ? provSeleccionado.razon_social : 'Sin proveedor específico / Varios'}
 </span>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableProvAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>
 );
 })()}

 {/* Ventana Desplegable con bordes redondeados (rounded-2xl) - Despliegue hacia abajo */}
 {desplegableProvAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {proveedores.length > 4 && (
 <div className="relative p-1">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 placeholder="Buscar proveedor o RUC..."
 value={busquedaProv}
 onChange={(e) => setBusquedaProv(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 )}

 <div className="max-h-52 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {/* Opción Sin Proveedor */}
 <button
 type="button"
 onClick={() => {
 setFormData({ ...formData, id_proveedor: '' });
 setDesplegableProvAbierto(false);
 setBusquedaProv('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 !formData.id_proveedor
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span>Sin proveedor específico / Varios</span>
 {!formData.id_proveedor && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
 </button>

 {/* Proveedores Filtrados */}
 {(() => {
 const filtrados = proveedores.filter(p => {
 if (!busquedaProv.trim()) return true;
 const q = busquedaProv.toLowerCase().trim();
 return (p.razon_social && p.razon_social.toLowerCase().includes(q)) ||
 (p.numero_documento && p.numero_documento.includes(q));
 });

 if (filtrados.length === 0) {
 return (
 <div className="px-3 py-3 text-center text-xs text-slate-400">
 No se encontró "{busquedaProv}"
 </div>
 );
 }

 return filtrados.map(p => {
 const estaSeleccionado = String(formData.id_proveedor) === String(p.id);
 return (
 <button
 key={p.id}
 type="button"
 onClick={() => {
 setFormData({ ...formData, id_proveedor: p.id });
 setDesplegableProvAbierto(false);
 setBusquedaProv('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSeleccionado
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div className="truncate flex-1">
 <span>{p.razon_social}</span>
 {p.numero_documento && (
 <span className="ml-2 text-[10px] font-mono font-normal text-slate-400">
 (RUC: {p.numero_documento})
 </span>
 )}
 </div>
 {estaSeleccionado && (
 <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 ml-2" />
 )}
 </button>
 );
 });
 })()}
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 )}

 {/* ═══════════ TAB 3: FICHA TÉCNICA & SUNAT ═══════════ */}
 {tabModal === 'tecnico' && (
 <div className="space-y-3.5 min-h-[380px] animate-in fade-in-50 duration-150">
 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Descripción Detallada / Especificaciones Técnicas
 </label>
 <textarea
 rows={3}
 placeholder="Ej: Broca de acero rápido HSS 1/4 con revestimiento de titanio. Apta para metal y madera dura. Velocidad máx 3000 RPM."
 value={formData.descripcion}
 onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Norma Técnica / Certificación (Opcional)
 </label>
 <input
 type="text"
 placeholder="Ej: NTP 339.009 (Cemento), ASTM A615 (Fierro), SENCICO"
 value={formData.norma_tecnica}
 onChange={(e) => setFormData({ ...formData, norma_tecnica: e.target.value })}
 className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
 />
 </div>

 {/* Card: Material de Construcción & Granel con auto-detección visual */}
 <div className={`p-3 rounded-2xl border transition-all ${
 formData.es_material_construccion
 ? 'border-sky-300 dark:border-sky-800 bg-sky-50/60 dark:bg-sky-950/20'
 : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40'
 }`}>
 <div className="flex items-start gap-3">
 <input
 type="checkbox"
 id="chk_material_modal"
 checked={formData.es_material_construccion}
 onChange={(e) => setFormData({ ...formData, es_material_construccion: e.target.checked })}
 className="w-4 h-4 mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
 />
 <label htmlFor="chk_material_modal" className="flex-1 cursor-pointer">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
 ¿Es Material de Construcción Pesado o Árido a Granel?
 </span>
 {formData.es_material_construccion && (
 <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
 Visible en Materiales & Granel
 </span>
 )}
 </div>
 <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
 Se auto-activa si eliges categorías o unidades de obra (cemento, m³, varilla, plancha, arena). Habilita el cálculo de flete, mermas y calculadora de mezclas.
 </span>
 </label>
 </div>
 </div>

 {/* Card: Fiscalización IQBF / SUCAMEC */}
 <div className={`p-3 rounded-2xl border transition-all ${
 formData.es_fiscalizado
 ? 'border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20'
 : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40'
 }`}>
 <div className="flex items-start gap-3">
 <input
 type="checkbox"
 id="chk_fiscalizado_modal"
 checked={formData.es_fiscalizado}
 onChange={(e) => setFormData({ ...formData, es_fiscalizado: e.target.checked })}
 className="w-4 h-4 mt-0.5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
 />
 <label htmlFor="chk_fiscalizado_modal" className="flex-1 cursor-pointer">
 <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
 <span>Insumo Químico Fiscalizado SUNAT IQBF / SUCAMEC</span>
 <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
 Normativa SUNAT
 </span>
 </span>
 <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
 Obligatorio para thinner, ácido muriático, acetona, solventes o explosivos que requieren libro de control ante SUNAT / SUCAMEC.
 </span>
 </label>
 </div>

 {/* Campos condicionales de Fiscalización */}
 {formData.es_fiscalizado && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 animate-in fade-in-50 duration-150">
 <div>
 <label className="block text-[10.5px] font-bold text-amber-900 dark:text-amber-200 mb-1">
 Régimen de Fiscalización
 </label>
 <select
 value={formData.tipo_fiscalizacion}
 onChange={(e) => setFormData({ ...formData, tipo_fiscalizacion: e.target.value })}
 className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
 >
 <option value="SUNAT_IQBF">SUNAT IQBF (Insumos Químicos)</option>
 <option value="SUCAMEC">SUCAMEC (Explosivos / Regulados)</option>
 </select>
 </div>

 <div>
 <label className="block text-[10.5px] font-bold text-amber-900 dark:text-amber-200 mb-1">
 Código Oficial de Bien / Insumo
 </label>
 <input
 type="text"
 placeholder="Ej: IQBF-01294 o Partida Arancelaria"
 value={formData.codigo_iqbf}
 onChange={(e) => setFormData({ ...formData, codigo_iqbf: e.target.value })}
 className="w-full px-2.5 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 text-xs font-mono font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
 />
 </div>
 </div>
 )}
 </div>
 </div>
 )}

             </div>

            {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
            <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 z-20">
              <div className="flex items-center justify-between sm:justify-start gap-1.5 text-[10.5px] sm:text-[11px] text-slate-400 order-2 sm:order-1">
                <span>Paso {tabModal === 'general' ? '1/3' : tabModal === 'stock' ? '2/3' : '3/3'}:</span>
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  {tabModal === 'general' ? 'General & Precios' : tabModal === 'stock' ? 'Stock & Almacén' : 'Ficha Técnica & SUNAT'}
                </span>
              </div>

              <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className={`flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap ${
                    modoConstruccion || formData.es_material_construccion
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {guardando ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span>
                        {productoEditar
                          ? modoConstruccion
                            ? 'Actualizar Material'
                            : 'Actualizar Artículo'
                          : modoConstruccion
                            ? 'Guardar Material'
                            : 'Guardar en Inventario'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
 </div>
 </div>
 </div>,
 document.body
 );
}
