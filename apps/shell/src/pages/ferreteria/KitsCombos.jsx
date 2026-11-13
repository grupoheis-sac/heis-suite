import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 Boxes,
 Package,
 Plus,
 RefreshCw,
 Search,
 Wrench,
 CheckCircle2,
 AlertTriangle,
 Layers,
 ChevronDown,
 ChevronUp,
 ArrowRight,
 TrendingUp,
 Sparkles,
 Trash2,
 X,
 Check,
 Percent,
 DollarSign,
 Info
} from 'lucide-react';
import { useSettingsStore } from '@heis/core';

export default function KitsCombos() {
 const settings = useSettingsStore();
 const [combos, setCombos] = useState([]);
 const [productos, setProductos] = useState([]);
 const [categorias, setCategorias] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState('');
 const [comboExpandido, setComboExpandido] = useState(null);

 // Modales
 const [modalReceta, setModalReceta] = useState(false);
 const [modalArmar, setModalArmar] = useState(false);
 const [modalDesarmar, setModalDesarmar] = useState(false);
 const [comboSeleccionado, setComboSeleccionado] = useState(null);
 const [guardando, setGuardando] = useState(false);

 // Formulario Nuevo/Editar Combo
 const [idProductoCombo, setIdProductoCombo] = useState('');
 const [crearNuevoProducto, setCrearNuevoProducto] = useState(true);
 const [nombreCombo, setNombreCombo] = useState('');
 const [codigoBarras, setCodigoBarras] = useState('');
 const [descripcion, setDescripcion] = useState('');
 const [precioVenta, setPrecioVenta] = useState('');
 const [precioMayorista, setPrecioMayorista] = useState('');
 const [idCategoria, setIdCategoria] = useState('');
 const [componentes, setComponentes] = useState([]);

 // Dropdown Categoría personalizado con bordes redondeados (rounded-2xl)
 const [desplegableCatAbierto, setDesplegableCatAbierto] = useState(false);
 const [busquedaCat, setBusquedaCat] = useState('');
 const [modoCrearCat, setModoCrearCat] = useState(false);
 const [nuevoCatNombre, setNuevoCatNombre] = useState('');
 const [guardandoCat, setGuardandoCat] = useState(false);
 const refSelectorCat = useRef(null);

 // Dropdown Seleccionar Producto para Combo con bordes redondeados (rounded-2xl)
 const [desplegableProdComboAbierto, setDesplegableProdComboAbierto] = useState(false);
 const [busquedaProdCombo, setBusquedaProdCombo] = useState('');
 const refSelectorProdCombo = useRef(null);

 // Búsqueda de insumos en el modal de receta
 const [busqInsumo, setBusqInsumo] = useState('');
 const [mostrarDropInsumo, setMostrarDropInsumo] = useState(false);

 // Cantidad para Armar / Desarmar
 const [cantOperacion, setCantOperacion] = useState(1);

 // Presets Rápidos de Ferretería
 const presetsFerreteros = [
 {
 titulo: 'Combo Taladro + Brocas + Tarugos',
 desc: 'Pack ideal para instaladores y hogar con consumibles clave',
 sugerenciaNombre: 'Combo Taladro Percutor + 5 Brocas + 50 Tarugos',
 sugerenciaPrecio: '289.00',
 keywords: ['taladro', 'broca', 'tarugo']
 },
 {
 titulo: 'Kit Sanitario para Baño',
 desc: 'Solución integral de desagüe e instalación para gasfiteros',
 sugerenciaNombre: 'Kit Instalación Inodoro & Lavatorio Completo',
 sugerenciaPrecio: '85.00',
 keywords: ['inodoro', 'teflon', 'llave', 'manguera']
 },
 {
 titulo: 'Pack Pintor Experto',
 desc: 'Balde de látex con rodillo profesional, brocha y cinta',
 sugerenciaNombre: 'Pack Pintura Látex 4 Gal + Rodillo + Brocha 3"',
 sugerenciaPrecio: '145.00',
 keywords: ['pintura', 'rodillo', 'brocha', 'cinta']
 },
 {
 titulo: 'Kit Tablero Eléctrico Monofásico',
 desc: 'Gabinete con térmicas y cinta para proyectos domiciliarios',
 sugerenciaNombre: 'Kit Tablero Eléctrico 4 Polos + 2 Térmicas + Cinta',
 sugerenciaPrecio: '115.00',
 keywords: ['tablero', 'termica', 'cinta', 'cable']
 }
 ];

 const cargarDatos = async () => {
 try {
 setCargando(true);
 const [resCombos, resProds, resCats] = await Promise.all([
 api.get('/inventario/combos'),
 api.get('/productos?limit=1000'),
 api.get('/categorias').catch(() => ({ data: [] }))
 ]);

 setCombos(resCombos.data?.combos || []);
 const prodsList = Array.isArray(resProds.data)
 ? resProds.data
 : resProds.data?.productos || [];
 setProductos(prodsList);

 const catsList = Array.isArray(resCats.data)
 ? resCats.data
 : resCats.data?.categorias || [];
 setCategorias(catsList);
 } catch (error) {
 console.error(error);
 toast.error('Error al sincronizar kits y combos de inventario');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 // Bloquear scroll de fondo al abrir cualquier modal
 useEffect(() => {
 if (modalReceta || modalArmar || modalDesarmar) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = 'unset';
 }
 return () => {
 document.body.style.overflow = 'unset';
 };
 }, [modalReceta, modalArmar, modalDesarmar]);

 // Cerrar selectores desplegables al hacer clic fuera o Escape
 useEffect(() => {
 const handleClickAfuera = (e) => {
 if (refSelectorCat.current && !refSelectorCat.current.contains(e.target)) {
 setDesplegableCatAbierto(false);
 }
 if (refSelectorProdCombo.current && !refSelectorProdCombo.current.contains(e.target)) {
 setDesplegableProdComboAbierto(false);
 }
 };
 const handleKeyDown = (e) => {
 if (e.key === 'Escape') {
 setDesplegableCatAbierto(false);
 setDesplegableProdComboAbierto(false);
 }
 };
 document.addEventListener('mousedown', handleClickAfuera);
 document.addEventListener('keydown', handleKeyDown);
 return () => {
 document.removeEventListener('mousedown', handleClickAfuera);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, []);

 // Resetear estados de los selectores al cerrar el modal de receta
 useEffect(() => {
 if (!modalReceta) {
 setDesplegableCatAbierto(false);
 setModoCrearCat(false);
 setBusquedaCat('');
 setNuevoCatNombre('');
 setDesplegableProdComboAbierto(false);
 setBusquedaProdCombo('');
 }
 }, [modalReceta]);

 // Crear categoría rápida desde el propio modal
 const handleCrearCategoria = async (e) => {
 if (e) e.preventDefault();
 if (!nuevoCatNombre.trim()) {
 return toast.error('Ingresa el nombre de la categoría');
 }
 setGuardandoCat(true);
 try {
 const res = await api.post('/categorias', {
 nombre: nuevoCatNombre.trim()
 });
 const nuevaCat = res.categoria || res.data || res;
 if (nuevaCat && nuevaCat.id) {
 toast.success(`Categoría "${nuevaCat.nombre}" creada y seleccionada`);
 setCategorias((prev) => [...prev, nuevaCat].sort((a, b) => a.nombre.localeCompare(b.nombre)));
 setIdCategoria(nuevaCat.id);
 setNuevoCatNombre('');
 setModoCrearCat(false);
 setDesplegableCatAbierto(false);
 } else {
 toast.success('Categoría creada exitosamente');
 cargarDatos();
 setModoCrearCat(false);
 setDesplegableCatAbierto(false);
 }
 } catch (err) {
 toast.error(err.message || 'Error al crear la categoría');
 } finally {
 setGuardandoCat(false);
 }
 };

 // Abrir Modal para Nuevo Combo
 const handleAbrirNuevo = (preset = null) => {
 setIdProductoCombo('');
 setCrearNuevoProducto(true);
 setCodigoBarras('');
 setDescripcion('');
 setComponentes([]);
 setBusqInsumo('');

 if (preset) {
 setNombreCombo(preset.sugerenciaNombre);
 setPrecioVenta(preset.sugerenciaPrecio);
 setDescripcion(preset.desc);

 // Autoseleccionar insumos que coincidan con las palabras clave si existen
 const matches = [];
 preset.keywords.forEach((kw) => {
 const found = productos.find(
 (p) =>
 !p.es_combo &&
 p.nombre.toLowerCase().includes(kw.toLowerCase()) &&
 !matches.some((m) => m.id_producto_insumo === p.id)
 );
 if (found) {
 matches.push({
 id_producto_insumo: found.id,
 producto: found,
 cantidad: 1,
 costo_proporcional: parseFloat(found.precio_compra) || 0
 });
 }
 });
 setComponentes(matches);
 } else {
 setNombreCombo('');
 setPrecioVenta('');
 setIdCategoria('');
 }

 setModalReceta(true);
 };

 // Abrir Modal para Editar Receta de un Combo Existente
 const handleEditarReceta = (c) => {
 setIdProductoCombo(c.id);
 setCrearNuevoProducto(false);
 setNombreCombo(c.nombre);
 setCodigoBarras(c.codigo_barras || '');
 setDescripcion(c.descripcion || '');
 setPrecioVenta(c.precio_venta || '');
 setPrecioMayorista(c.precio_mayorista || '');
 setIdCategoria(c.id_categoria || '');

 const comps = (c.combo_detalles || []).map((d) => ({
 id_producto_insumo: d.id_producto_insumo,
 producto: d.insumo,
 cantidad: parseFloat(d.cantidad) || 1,
 costo_proporcional: parseFloat(d.costo_proporcional) || 0
 }));
 setComponentes(comps);
 setModalReceta(true);
 };

 // Agregar insumo a la receta
 const handleAgregarInsumo = (prod) => {
 if (componentes.some((c) => c.id_producto_insumo === prod.id)) {
 toast.error('Este componente ya forma parte de la receta.');
 return;
 }

 setComponentes([
 ...componentes,
 {
 id_producto_insumo: prod.id,
 producto: prod,
 cantidad: 1,
 costo_proporcional: parseFloat(prod.precio_compra) || 0
 }
 ]);
 setBusqInsumo('');
 setMostrarDropInsumo(false);
 };

 const handleCambiarCantidadInsumo = (idx, valor) => {
 const valNum = parseFloat(valor);
 const updated = [...componentes];
 updated[idx].cantidad = isNaN(valNum) || valNum <= 0 ? 1 : valNum;
 setComponentes(updated);
 };

 const handleEliminarInsumo = (idx) => {
 setComponentes(componentes.filter((_, i) => i !== idx));
 };

 // Cálculos en vivo dentro del modal
 const costoTotalInsumosModal = componentes.reduce((acc, c) => {
 const pComp = parseFloat(c.producto?.precio_compra) || 0;
 return acc + pComp * (parseFloat(c.cantidad) || 1);
 }, 0);

 const precioVentaNumModal = parseFloat(precioVenta) || 0;
 const margenEstimadoModal = precioVentaNumModal - costoTotalInsumosModal;
 const margenPctModal =
 precioVentaNumModal > 0
 ? ((margenEstimadoModal / precioVentaNumModal) * 100).toFixed(1)
 : 0;

 // Guardar Receta de Combo
 const handleGuardarCombo = async (e) => {
 e.preventDefault();
 if (!crearNuevoProducto && !idProductoCombo) {
 toast.error('Debe seleccionar el producto a convertir en combo.');
 return;
 }
 if (crearNuevoProducto && !nombreCombo.trim()) {
 toast.error('Ingrese el nombre del Kit o Combo.');
 return;
 }
 if (!precioVenta || parseFloat(precioVenta) <= 0) {
 toast.error('El precio de venta debe ser mayor a 0.');
 return;
 }
 if (componentes.length === 0) {
 toast.error('Agregue al menos 1 insumo componente a la receta.');
 return;
 }

 try {
 setGuardando(true);
 const payload = {
 id_producto: crearNuevoProducto ? null : idProductoCombo,
 nombre: nombreCombo.trim(),
 codigo_barras: codigoBarras.trim() || null,
 descripcion: descripcion.trim() || null,
 precio_venta: parseFloat(precioVenta),
 precio_mayorista: precioMayorista ? parseFloat(precioMayorista) : null,
 id_categoria: idCategoria || null,
 unidad_medida: 'Kit',
 componentes: componentes.map((c) => ({
 id_producto_insumo: c.id_producto_insumo,
 cantidad: c.cantidad
 }))
 };

 const res = await api.post('/inventario/combos', payload);
 toast.success(res.data?.message || 'Combo configurado exitosamente.');
 setModalReceta(false);
 cargarDatos();
 } catch (error) {
 console.error(error);
 toast.error(
 error.response?.data?.message || 'Error al guardar la receta del combo'
 );
 } finally {
 setGuardando(false);
 }
 };

 // Abrir Modal Armar Lote
 const handleAbrirArmar = (c) => {
 setComboSeleccionado(c);
 setCantOperacion(1);
 setModalArmar(true);
 };

 // Ejecutar Ensamble
 const handleEjecutarArmar = async () => {
 if (!cantOperacion || cantOperacion <= 0) {
 toast.error('Ingrese una cantidad válida a ensamblar.');
 return;
 }

 try {
 setGuardando(true);
 const res = await api.post('/inventario/combos/ensamblar', {
 id_combo: comboSeleccionado.id,
 cantidad: cantOperacion
 });
 toast.success(res.data?.message || 'Ensamble completado exitosamente');
 setModalArmar(false);
 cargarDatos();
 } catch (error) {
 console.error(error);
 toast.error(error.response?.data?.message || 'Error durante el ensamble');
 } finally {
 setGuardando(false);
 }
 };

 // Abrir Modal Desarmar Lote
 const handleAbrirDesarmar = (c) => {
 setComboSeleccionado(c);
 setCantOperacion(1);
 setModalDesarmar(true);
 };

 // Ejecutar Desensamble
 const handleEjecutarDesarmar = async () => {
 if (!cantOperacion || cantOperacion <= 0) {
 toast.error('Ingrese una cantidad válida a desensamblar.');
 return;
 }

 try {
 setGuardando(true);
 const res = await api.post('/inventario/combos/desensamblar', {
 id_combo: comboSeleccionado.id,
 cantidad: cantOperacion
 });
 toast.success(res.data?.message || 'Desensamble completado exitosamente');
 setModalDesarmar(false);
 cargarDatos();
 } catch (error) {
 console.error(error);
 toast.error(error.response?.data?.message || 'Error durante el desensamble');
 } finally {
 setGuardando(false);
 }
 };

 // Desactivar combo
 const handleEliminarCombo = async (c) => {
 if (
 !window.confirm(
 `¿Desea desvincular la receta del combo "${c.nombre}"? El producto pasará a ser individual sin alterar su stock.`
 )
 ) {
 return;
 }

 try {
 await api.delete(`/inventario/combos/${c.id}`);
 toast.success('Combo desvinculado exitosamente');
 cargarDatos();
 } catch (error) {
 console.error(error);
 toast.error('Error al desvincular el combo');
 }
 };

 // Filtros
 const combosFiltrados = combos.filter((c) => {
 if (!busqueda) return true;
 const term = busqueda.toLowerCase();
 const matchNombre = c.nombre?.toLowerCase().includes(term);
 const matchCodigo = c.codigo_barras?.toLowerCase().includes(term);
 const matchInsumo = (c.combo_detalles || []).some((d) =>
 d.insumo?.nombre?.toLowerCase().includes(term)
 );
 return matchNombre || matchCodigo || matchInsumo;
 });

 // KPIs
 const totalCombos = combos.length;
 const stockFisicoArmado = combos.reduce(
 (acc, c) => acc + (parseFloat(c.stock) || 0),
 0
 );
 const capacidadTotalArmable = combos.reduce(
 (acc, c) => acc + (c.combos_maximos_armables || 0),
 0
 );

 return (
 <div className="space-y-6">
 {/* ─── ENCABEZADO Y ACCIONES PRINCIPALES ─── */}
 <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card-soft">
 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0">
 <Boxes className="w-5 h-5 stroke-[2.3]" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight ">
 Kits, Combos & Ensambles
 </h2>
 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-100 dark:bg-violet-950/70 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
 Despiece & Armado
 </span>
 </div>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
 Arme packs promocionales y combos que descuentan insumos individuales automáticamente del almacén
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2.5 w-full sm:w-auto">
 <button
 type="button"
 onClick={cargarDatos}
 disabled={cargando}
 className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
 >
 <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
 </button>

 <button
 type="button"
 onClick={() => handleAbrirNuevo()}
 className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-md shadow-indigo-600/25 hover:shadow-lg hover:from-indigo-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
 >
 <Plus className="w-4 h-4 stroke-[2.5]" />
 <span>Nuevo Kit / Combo</span>
 </button>
 </div>
 </div>

 {/* ─── PRESETS RÁPIDOS DE FERRETERÍA ─── */}
 <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
 <div className="flex items-center gap-2 mb-2.5">
 <Sparkles className="w-3.5 h-3.5 text-amber-500" />
 <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider ">
 Packs Populares de Ferretería (1-Click para Configurar):
 </span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
 {presetsFerreteros.map((p, idx) => (
 <div
 key={idx}
 onClick={() => handleAbrirNuevo(p)}
 className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer group text-left"
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 line-clamp-1">
 {p.titulo}
 </span>
 <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
 </div>
 <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
 {p.desc}
 </p>
 <div className="mt-2 flex items-center justify-between text-[10px]">
 <span className="font-semibold text-slate-400">PVP Sugerido</span>
 <span className="font-black text-emerald-600 dark:text-emerald-400">
 {settings.currency} {p.sugerenciaPrecio}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* ─── TARJETAS DE INDICADORES / KPIS DE KITS & COMBOS ─── */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Recetas de Combos */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Recetas de Combos
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <Layers className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight truncate">
 {totalCombos}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Packs registrados
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 Recetario
 </span>
 </div>
 </div>

 {/* KPI 2: Stock Listo en Mostrador */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Stock Mostrador
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <Package className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {stockFisicoArmado}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Kits listos para venta
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 En Mostrador
 </span>
 </div>
 </div>

 {/* KPI 3: Potencial de Ensamble Inmediato */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 Potencial Ensamble
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <Wrench className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-600 dark:text-violet-400 tracking-tight truncate">
 +{capacidadTotalArmable}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Con stock de insumos
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 Armables
 </span>
 </div>
 </div>

 {/* KPI 4: Valorización de Packs en Mostrador */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Valorización Packs
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <DollarSign className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {settings.currency} {combos.reduce((acc, c) => acc + ((parseFloat(c.stock) || 0) * (parseFloat(c.precio_venta) || 0)), 0).toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Capital en packs listos
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 PVP Listo
 </span>
 </div>
 </div>
 </div>

 {/* ─── FILTROS Y BÚSQUEDA ─── */}
 <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
 <div className="relative w-full sm:w-96">
 <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder="Buscar por nombre de kit o componente..."
 className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-2xs"
 />
 </div>
 <span className="text-xs text-slate-400 font-medium">
 Mostrando {combosFiltrados.length} de {totalCombos} combos
 </span>
 </div>

 {/* ─── LISTADO DE KITS Y COMBOS ─── */}
 {cargando ? (
 <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
 <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
 <p className="text-xs font-bold text-slate-400 uppercase tracking-wider ">
 Cargando catálogo de combos y recetas...
 </p>
 </div>
 ) : combosFiltrados.length === 0 ? (
 <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-card-soft">
 <Boxes className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
 <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 ">
 No se encontraron Kits o Combos
 </h3>
 <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
 Cree su primer combo o kit promocional para vender paquetes de artículos con despiece automatizado.
 </p>
 <button
 type="button"
 onClick={() => handleAbrirNuevo()}
 className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-xs hover:bg-indigo-700 transition-all cursor-pointer"
 >
 Configurar Primer Kit
 </button>
 </div>
 ) : (
 <div className="space-y-3.5">
 {combosFiltrados.map((combo) => {
 const isExpanded = comboExpandido === combo.id;
 const stockActual = parseFloat(combo.stock) || 0;
 const maxArmables = combo.combos_maximos_armables || 0;
 const costoInsumos = combo.costo_teorico_componentes || 0;
 const pVenta = parseFloat(combo.precio_venta) || 0;
 const margenSoles = pVenta - costoInsumos;
 const margenPct = pVenta > 0 ? ((margenSoles / pVenta) * 100).toFixed(1) : 0;
 const componentesLista = combo.combo_detalles || [];

 return (
 <div
 key={combo.id}
 className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden transition-all"
 >
 {/* Cabecera de la Fila del Combo */}
 <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
 <div className="flex items-start gap-3.5 min-w-0">
 <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs font-black text-xs ">
 KIT
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h4 className="text-sm font-black text-slate-900 dark:text-white ">
 {combo.nombre}
 </h4>
 {combo.categoria && (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
 {combo.categoria.nombre}
 </span>
 )}
 {combo.codigo_barras && (
 <span className="text-[10px] text-slate-400 font-mono">
 [{combo.codigo_barras}]
 </span>
 )}
 </div>

 {combo.descripcion && (
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
 {combo.descripcion}
 </p>
 )}

 {/* Pill de Insumos */}
 <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px]">
 <span className="font-semibold text-slate-400">Receta:</span>
 <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold ">
 {componentesLista.length} insumos
 </span>
 <span className="text-slate-300 dark:text-slate-600">•</span>
 <span className="text-slate-500 dark:text-slate-400">
 Costo Piezas: <strong className="text-slate-700 dark:text-slate-200">{settings.currency} {costoInsumos.toFixed(2)}</strong>
 </span>
 <span className="text-slate-300 dark:text-slate-600">•</span>
 <span className="text-emerald-600 dark:text-emerald-400 font-bold">
 Margen: +{settings.currency} {margenSoles.toFixed(2)} ({margenPct}%)
 </span>
 </div>
 </div>
 </div>

 {/* Badges de Existencia & Acciones */}
 <div className="flex items-center gap-3 flex-wrap lg:flex-nowrap shrink-0">
 {/* Badge Stock Listo */}
 <div className="px-3.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
 <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
 Stock Listo
 </span>
 <span className="text-sm font-black text-slate-900 dark:text-white ">
 {stockActual} {combo.unidad_medida || 'Kits'}
 </span>
 </div>

 {/* Badge Capacidad Inmediata */}
 <div
 className={`px-3.5 py-1.5 rounded-xl border text-center ${
 maxArmables > 0
 ? 'bg-violet-50 dark:bg-violet-950/50 border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300'
 : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
 }`}
 >
 <span className="block text-[10px] font-bold uppercase tracking-wider">
 Armables Hoy
 </span>
 <span className="text-sm font-black ">
 {maxArmables} disponibles
 </span>
 </div>

 {/* PVP */}
 <div className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 text-center">
 <span className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
 Precio Venta
 </span>
 <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 ">
 {settings.currency} {pVenta.toFixed(2)}
 </span>
 </div>

 {/* Botones Rápidos de Operación */}
 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={() => handleAbrirArmar(combo)}
 disabled={maxArmables <= 0}
 className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
 maxArmables > 0
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
 : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
 }`}
 >
 <Wrench className="w-3.5 h-3.5" />
 <span>Armar</span>
 </button>

 <button
 type="button"
 onClick={() => handleAbrirDesarmar(combo)}
 disabled={stockActual <= 0}
 className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
 stockActual > 0
 ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
 : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
 }`}
 >
 <Layers className="w-3.5 h-3.5" />
 <span>Desarmar</span>
 </button>

 <button
 type="button"
 onClick={() =>
 setComboExpandido(isExpanded ? null : combo.id)
 }
 className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition-all cursor-pointer"
 >
 {isExpanded ? (
 <ChevronUp className="w-4 h-4" />
 ) : (
 <ChevronDown className="w-4 h-4" />
 )}
 </button>
 </div>
 </div>
 </div>

 {/* ─── DESGLOSE DE COMPONENTES EXPANDIBLE ─── */}
 {isExpanded && (
 <div className="px-5 pb-5 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40">
 <div className="flex items-center justify-between mb-3">
 <h5 className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center gap-2">
 <Boxes className="w-3.5 h-3.5 text-indigo-500" />
 Receta de Insumos que Componen 1 {combo.nombre}
 </h5>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => handleEditarReceta(combo)}
 className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
 >
 Modificar Receta
 </button>
 <span className="text-slate-300 dark:text-slate-700">|</span>
 <button
 type="button"
 onClick={() => handleEliminarCombo(combo)}
 className="text-xs text-rose-500 hover:underline cursor-pointer"
 >
 Desvincular
 </button>
 </div>
 </div>

 <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10.5px] uppercase font-bold text-slate-500 dark:text-slate-400 ">
 <th className="p-3">Insumo / Componente</th>
 <th className="p-3 text-center">Consumo x Kit</th>
 <th className="p-3 text-center">Stock Almacén</th>
 <th className="p-3 text-right">Costo Unitario</th>
 <th className="p-3 text-right">Costo Subtotal</th>
 <th className="p-3 text-center">Estado Stock</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {componentesLista.map((d, i) => {
 const insumo = d.insumo;
 const cantReq = parseFloat(d.cantidad) || 1;
 const stockIns = parseFloat(insumo?.stock) || 0;
 const pCompraIns = parseFloat(insumo?.precio_compra) || 0;
 const subtotalCosto = cantReq * pCompraIns;
 const armablesConEste =
 cantReq > 0 ? Math.floor(stockIns / cantReq) : 0;
 const esCuelloBotella = armablesConEste === maxArmables;

 return (
 <tr
 key={i}
 className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
 esCuelloBotella && maxArmables === 0
 ? 'bg-rose-50/40 dark:bg-rose-950/20'
 : ''
 }`}
 >
 <td className="p-3">
 <div className="font-bold text-slate-800 dark:text-slate-200">
 {insumo?.nombre || 'Insumo no disponible'}
 </div>
 <div className="text-[10.5px] text-slate-400">
 Ubicación: {insumo?.ubicacion || 'General'}
 </div>
 </td>
 <td className="p-3 text-center font-bold text-indigo-600 dark:text-indigo-400">
 {cantReq} {insumo?.unidad_medida || 'Und'}
 </td>
 <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">
 {stockIns} {insumo?.unidad_medida || 'Und'}
 </td>
 <td className="p-3 text-right text-slate-500 dark:text-slate-400">
 {settings.currency} {pCompraIns.toFixed(2)}
 </td>
 <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-200">
 {settings.currency} {subtotalCosto.toFixed(2)}
 </td>
 <td className="p-3 text-center">
 {stockIns < cantReq ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300">
 <AlertTriangle className="w-3 h-3" />
 Sin Stock (Agotado)
 </span>
 ) : esCuelloBotella ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
 Límite ({armablesConEste} kits)
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300">
 <CheckCircle2 className="w-3 h-3" />
 Disponible ({armablesConEste})
 </span>
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
 </div>
 );
 })}
 </div>
 )}

 {/* ─── MODAL 1: NUEVO / EDITAR COMBO Y RECETA ─── */}
      {modalReceta &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setModalReceta(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
              onClick={() => setModalReceta(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabecera Fija */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
                      <Boxes className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        {crearNuevoProducto ? 'Nuevo Kit / Combo Promocional' : 'Editar Receta del Combo'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Defina los componentes y precios del kit para descontar del stock
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalReceta(false)}
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors shadow-2xs touch-manipulation cursor-pointer shrink-0"
                    title="Cerrar ventana"
                  >
                    <X className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Formulario con Scroll */}
                <form onSubmit={handleGuardarCombo} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
                    {/* Switch Nuevo Producto vs Producto Existente */}
 <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 max-w-sm">
 <button
 type="button"
 onClick={() => {
 setCrearNuevoProducto(true);
 setIdProductoCombo('');
 }}
 className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
 crearNuevoProducto
 ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
 : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
 }`}
 >
 Crear Nuevo Producto Kit
 </button>
 <button
 type="button"
 onClick={() => setCrearNuevoProducto(false)}
 className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
 !crearNuevoProducto
 ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-2xs'
 : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
 }`}
 >
 Convertir Producto Existente
 </button>
 </div>

 {!crearNuevoProducto ? (
 /* Selector de Producto Existente con Ventana Desplegable Redondeada (rounded-2xl) */
 <div className={`relative ${desplegableProdComboAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorProdCombo}>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Seleccionar Producto para convertir en Combo <span className="text-rose-500">*</span>
 </label>

 {/* Botón Disparador estilo píldora redondeada (rounded-xl) */}
 {(() => {
 const prodSeleccionado = productos.find((p) => String(p.id) === String(idProductoCombo));
 return (
 <button
 type="button"
 onClick={() => {
 setDesplegableProdComboAbierto(!desplegableProdComboAbierto);
 setBusquedaProdCombo('');
 }}
 className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableProdComboAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800'
 }`}
 >
 <div className="truncate flex-1">
 {prodSeleccionado ? (
 <div className="flex items-center gap-2 truncate">
 <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
 {prodSeleccionado.nombre}
 </span>
 <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shrink-0">
 Stock: {prodSeleccionado.stock} {prodSeleccionado.unidad_medida}
 </span>
 </div>
 ) : (
 <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
 -- Elija un producto del catálogo --
 </span>
 )}
 </div>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableProdComboAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>
 );
 })()}

 {/* Ventana Desplegable con bordes redondeados (rounded-2xl) */}
 {desplegableProdComboAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {/* Buscador Rápido con bordes rounded-xl */}
 <div className="relative p-1">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 placeholder="Buscar producto por nombre o código..."
 value={busquedaProdCombo}
 onChange={(e) => setBusquedaProdCombo(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 {/* Lista con elementos redondeados (rounded-xl) */}
 <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {/* Opción Limpiar selección */}
 <button
 type="button"
 onClick={() => {
 setIdProductoCombo('');
 setNombreCombo('');
 setPrecioVenta('');
 setPrecioMayorista('');
 setCodigoBarras('');
 setDesplegableProdComboAbierto(false);
 setBusquedaProdCombo('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 !idProductoCombo
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span>-- Sin producto seleccionado --</span>
 {!idProductoCombo && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
 </button>

 {/* Productos filtrados */}
 {(() => {
 const prodsFiltrados = productos
 .filter((p) => !p.es_combo)
 .filter((p) => {
 if (!busquedaProdCombo.trim()) return true;
 const q = busquedaProdCombo.toLowerCase().trim();
 return (
 (p.nombre && p.nombre.toLowerCase().includes(q)) ||
 (p.codigo_barras && p.codigo_barras.toLowerCase().includes(q))
 );
 });

 if (prodsFiltrados.length === 0) {
 return (
 <div className="px-3 py-3 text-center text-xs text-slate-400">
 No se encontró "{busquedaProdCombo}"
 </div>
 );
 }

 return prodsFiltrados.map((p) => {
 const estaSeleccionado = String(p.id) === String(idProductoCombo);
 return (
 <button
 key={p.id}
 type="button"
 onClick={() => {
 setIdProductoCombo(p.id);
 setNombreCombo(p.nombre);
 setPrecioVenta(p.precio_venta || '');
 setPrecioMayorista(p.precio_mayorista || '');
 setCodigoBarras(p.codigo_barras || '');
 setDesplegableProdComboAbierto(false);
 setBusquedaProdCombo('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 estaSeleccionado
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <div className="truncate flex-1">
 <span className="block truncate font-semibold">{p.nombre}</span>
 <div className="flex items-center gap-2 mt-0.5 text-[10.5px] text-slate-400 font-normal">
 <span>Stock: {p.stock} {p.unidad_medida}</span>
 {p.precio_venta && (
 <span>• PVP: {settings.currency} {parseFloat(p.precio_venta).toFixed(2)}</span>
 )}
 {p.codigo_barras && (
 <span>• SKU: {p.codigo_barras}</span>
 )}
 </div>
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
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
 <div className="sm:col-span-2">
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Nombre del Kit o Combo *
 </label>
 <input
 type="text"
 required
 value={nombreCombo}
 onChange={(e) => setNombreCombo(e.target.value)}
 placeholder="Ej. Kit Sanitario Lavatorio + Grifería Completo"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Código de Barras / SKU (Opcional)
 </label>
 <input
 type="text"
 value={codigoBarras}
 onChange={(e) => setCodigoBarras(e.target.value)}
 placeholder="Ej. 775000123999"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>

 {/* Selector de Categoría con Ventana Desplegable Redondeada (rounded-2xl) */}
 <div className={`relative ${desplegableCatAbierto ? 'z-40' : 'z-20'}`} ref={refSelectorCat}>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 ">
 Categoría
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
 <span>{modoCrearCat ? 'Elegir de lista' : 'Nueva Categoría'}</span>
 </button>
 </div>

 {modoCrearCat ? (
 <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
 <input
 type="text"
 autoFocus
 placeholder="Nombre de la categoría..."
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
 className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer disabled:opacity-50 transition-colors shrink-0"
 title="Guardar y seleccionar"
 >
 <Check className="w-3.5 h-3.5" />
 <span>Guardar</span>
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
 {/* Botón Disparador estilo píldora redondeada (rounded-xl) */}
 {(() => {
 const catSeleccionada = categorias.find(c => String(c.id) === String(idCategoria));
 return (
 <button
 type="button"
 onClick={() => {
 setDesplegableCatAbierto(!desplegableCatAbierto);
 setBusquedaCat('');
 }}
 className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableCatAbierto
 ? 'border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10 dark:bg-slate-800'
 : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800'
 }`}
 >
 <span className={`text-xs font-semibold truncate ${
 catSeleccionada
 ? 'text-slate-900 dark:text-white'
 : 'text-slate-500 dark:text-slate-400'
 }`}>
 {catSeleccionada ? catSeleccionada.nombre : 'Sin categoría específica'}
 </span>
 <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableCatAbierto ? 'rotate-180 text-indigo-600' : ''
 }`} />
 </button>
 );
 })()}

 {/* Ventana Desplegable con bordes redondeados (rounded-2xl) */}
 {desplegableCatAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {/* Buscador Rápido con bordes rounded-xl si hay más de 4 categorías */}
 {categorias.length > 4 && (
 <div className="relative p-1">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 placeholder="Buscar categoría..."
 value={busquedaCat}
 onChange={(e) => setBusquedaCat(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
 />
 </div>
 )}

 {/* Lista con elementos redondeados (rounded-xl) */}
 <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {/* Opción Sin categoría específica */}
 <button
 type="button"
 onClick={() => {
 setIdCategoria('');
 setDesplegableCatAbierto(false);
 setBusquedaCat('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 !idCategoria
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span>Sin categoría específica</span>
 {!idCategoria && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
 </button>

 {/* Categorías Filtradas */}
 {(() => {
 const filtradas = categorias.filter(c =>
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
 const estaSeleccionada = String(idCategoria) === String(cat.id);
 return (
 <button
 key={cat.id}
 type="button"
 onClick={() => {
 setIdCategoria(cat.id);
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

 {/* Botón "+ Crear nueva categoría" al pie del menú */}
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
 <span>{busquedaCat ? `Crear "${busquedaCat}" como nueva categoría` : 'Crear nueva categoría'}</span>
 </button>
 </div>
 </div>
 )}
 </>
 )}
 </div>
 </div>
 )}

 {/* Precios */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50">
 <div>
 <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1 ">
 Precio de Venta al Público (PVP) *
 </label>
 <div className="relative">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500 select-none">
 {settings.currency}
 </span>
 <input
 type="number"
 step="0.01"
 required
 value={precioVenta}
 onChange={(e) => setPrecioVenta(e.target.value)}
 placeholder="0.00"
 className="w-full pl-14 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-black text-indigo-700 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500/20 font-mono"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1 ">
 Precio Mayorista (Opcional)
 </label>
 <div className="relative">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-500 select-none">
 {settings.currency}
 </span>
 <input
 type="number"
 step="0.01"
 value={precioMayorista}
 onChange={(e) => setPrecioMayorista(e.target.value)}
 placeholder="0.00"
 className="w-full pl-14 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 text-xs font-bold text-indigo-700 dark:text-indigo-300 focus:ring-2 focus:ring-indigo-500/20 font-mono"
 />
 </div>
 </div>
 </div>

 {/* Sección de Receta de Componentes */}
 <div className="pt-2">
 <div className="flex items-center justify-between mb-2">
 <label className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
 <Boxes className="w-4 h-4 text-indigo-600" />
 Insumos que Componen el Kit ({componentes.length})
 </label>
 <span className="text-[11px] text-slate-400">
 Escriba para buscar y agregar insumos
 </span>
 </div>

 {/* Buscador de Insumos */}
 <div className="relative mb-3">
 <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={busqInsumo}
 onChange={(e) => {
 setBusqInsumo(e.target.value);
 setMostrarDropInsumo(true);
 }}
 onFocus={() => setMostrarDropInsumo(true)}
 placeholder="Buscar insumo por nombre o código para añadir a la receta..."
 className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20"
 />

 {mostrarDropInsumo && busqInsumo.trim().length > 1 && (
 <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-56 overflow-y-auto z-20 divide-y divide-slate-100 dark:divide-slate-800">
 {productos
 .filter(
 (p) =>
 !p.es_combo &&
 (p.nombre?.toLowerCase().includes(busqInsumo.toLowerCase()) ||
 p.codigo_barras?.includes(busqInsumo))
 )
 .slice(0, 8)
 .map((p) => (
 <button
 key={p.id}
 type="button"
 onClick={() => handleAgregarInsumo(p)}
 className="w-full px-3.5 py-2.5 text-left hover:bg-indigo-50/60 dark:hover:bg-indigo-950/40 flex items-center justify-between text-xs transition-all cursor-pointer"
 >
 <div>
 <span className="font-bold text-slate-800 dark:text-slate-200 block">
 {p.nombre}
 </span>
 <span className="text-[10px] text-slate-400">
 Stock: {p.stock} {p.unidad_medida} • Costo: {settings.currency} {parseFloat(p.precio_compra).toFixed(2)}
 </span>
 </div>
 <Plus className="w-4 h-4 text-indigo-600 shrink-0" />
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Tabla de componentes agregados */}
 {componentes.length === 0 ? (
 <div className="p-6 text-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-400">
 No hay insumos en la receta. Busque arriba para agregar las piezas que forman este kit.
 </div>
 ) : (
 <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto custom-scrollbar">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10.5px] uppercase font-bold text-slate-500 ">
 <tr>
 <th className="p-2.5">Insumo</th>
 <th className="p-2.5 text-center w-28">Cant. x Kit</th>
 <th className="p-2.5 text-right">Costo Unit.</th>
 <th className="p-2.5 text-right">Subtotal</th>
 <th className="p-2.5 text-center w-10"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {componentes.map((comp, idx) => {
 const pComp = parseFloat(comp.producto?.precio_compra) || 0;
 const sub = pComp * (parseFloat(comp.cantidad) || 1);
 return (
 <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
 <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
 {comp.producto?.nombre}
 </td>
 <td className="p-2.5 text-center">
 <input
 type="number"
 min="0.001"
 step="any"
 value={comp.cantidad}
 onChange={(e) => handleCambiarCantidadInsumo(idx, e.target.value)}
 className="w-20 px-2 py-1 text-center font-bold text-indigo-600 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs"
 />
 </td>
 <td className="p-2.5 text-right text-slate-500">
 {settings.currency} {pComp.toFixed(2)}
 </td>
 <td className="p-2.5 text-right font-bold text-slate-800 dark:text-slate-200">
 {settings.currency} {sub.toFixed(2)}
 </td>
 <td className="p-2.5 text-center">
 <button
 type="button"
 onClick={() => handleEliminarInsumo(idx)}
 className="p-1 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all cursor-pointer"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}

 {/* Resumen de Margen de Ganancia */}
 <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between flex-wrap gap-2 text-xs">
 <div>
 <span className="text-slate-500">Costo Sumado de Insumos: </span>
 <strong className="text-slate-800 dark:text-slate-200">
 {settings.currency} {costoTotalInsumosModal.toFixed(2)}
 </strong>
 </div>
 <div>
 <span className="text-slate-500">Margen Bruto de Ganancia: </span>
 <strong
 className={`font-black ${
 margenEstimadoModal >= 0
 ? 'text-emerald-600 dark:text-emerald-400'
 : 'text-rose-600 dark:text-rose-400'
 }`}
 >
 {settings.currency} {margenEstimadoModal.toFixed(2)} ({margenPctModal}%)
 </strong>
 </div>
 </div>
 </div>
                  </div>

                  {/* Pie Fijo */}
                  <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0 z-20">
                    <button
                      type="button"
                      onClick={() => setModalReceta(false)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardando}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-md shadow-indigo-600/25 hover:from-indigo-700 hover:to-violet-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {guardando ? 'Guardando Receta...' : 'Guardar y Configurar Kit'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL 2: ARMAR / ENSAMBLAR LOTE ─── */}
      {modalArmar &&
        comboSeleccionado &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setModalArmar(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
              onClick={() => setModalArmar(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabecera Fija */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
                      <Wrench className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        Armar / Ensamblar Lote
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {comboSeleccionado.nombre}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalArmar(false)}
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors shadow-2xs touch-manipulation cursor-pointer shrink-0"
                    title="Cerrar ventana"
                  >
                    <X className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Contenido Scrolleable */}
                <div className="flex-1 overflow-y-auto custom-modal-scroll p-4 sm:p-6 space-y-4 text-xs">
                  {/* Cuadro de Estado */}
 <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
 <div>
 <span className="text-[11px] text-slate-400 block font-medium">Stock Armado Actual</span>
 <strong className="text-sm font-black text-slate-800 dark:text-slate-200 ">
 {parseFloat(comboSeleccionado.stock) || 0} {comboSeleccionado.unidad_medida || 'Kits'}
 </strong>
 </div>
 <div>
 <span className="text-[11px] text-slate-400 block font-medium">Máximo Fabricable Hoy</span>
 <strong className="text-sm font-black text-violet-600 dark:text-violet-400 ">
 {comboSeleccionado.combos_maximos_armables || 0} unidades
 </strong>
 </div>
 </div>

 {/* Input de Cantidad */}
 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ">
 ¿Cuántos kits desea armar ahora?
 </label>
 <div className="flex items-center gap-2">
 <input
 type="number"
 min="1"
 max={comboSeleccionado.combos_maximos_armables || 1}
 value={cantOperacion}
 onChange={(e) => setCantOperacion(parseInt(e.target.value, 10) || 1)}
 className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-indigo-600 text-center"
 />
 <button
 type="button"
 onClick={() => setCantOperacion(comboSeleccionado.combos_maximos_armables || 1)}
 className="px-3 py-2.5 rounded-xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 text-xs font-bold hover:bg-violet-200 transition-all cursor-pointer whitespace-nowrap"
 >
 Armar Todo ({comboSeleccionado.combos_maximos_armables})
 </button>
 </div>
 </div>

 {/* Resumen de consumo de insumos */}
 <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-2">
 <span className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 uppercase tracking-wider block ">
 Descuento Automático de Insumos:
 </span>
 <div className="space-y-1">
 {(comboSeleccionado.combo_detalles || []).map((d, i) => {
 const totalConsumo = (parseFloat(d.cantidad) || 1) * cantOperacion;
 return (
 <div key={i} className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-300">
 <span>• {d.insumo?.nombre}</span>
 <strong className="text-rose-600 dark:text-rose-400">
 -{totalConsumo} {d.insumo?.unidad_medida || 'Und'}
 </strong>
 </div>
 );
 })}
 </div>
 </div>
                </div>

                {/* Pie Fijo */}
                <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0 z-20">
                  <button
                    type="button"
                    onClick={() => setModalArmar(false)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleEjecutarArmar}
                    disabled={guardando || cantOperacion <= 0 || cantOperacion > (comboSeleccionado.combos_maximos_armables || 0)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-md shadow-indigo-600/25 hover:from-indigo-700 hover:to-violet-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {guardando ? 'Ensamblando...' : `Confirmar y Armar ${cantOperacion} Kits`}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL 3: DESARMAR LOTE ─── */}
      {modalDesarmar &&
        comboSeleccionado &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setModalDesarmar(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
              onClick={() => setModalDesarmar(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabecera Fija */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0 border border-amber-400/20">
                      <Layers className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        Desarmar Lote / Devolver Insumos
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {comboSeleccionado.nombre}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalDesarmar(false)}
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors shadow-2xs touch-manipulation cursor-pointer shrink-0"
                    title="Cerrar ventana"
                  >
                    <X className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Contenido Scrolleable */}
                <div className="flex-1 overflow-y-auto custom-modal-scroll p-4 sm:p-6 space-y-4 text-xs">
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
 <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
 <p>
 Al desensamblar, el stock del combo se reducirá y los insumos que lo integran regresarán inmediatamente al inventario individual.
 </p>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 ">
 Cantidad de Kits a desarmar (Máx: {parseFloat(comboSeleccionado.stock) || 0})
 </label>
 <input
 type="number"
 min="1"
 max={parseFloat(comboSeleccionado.stock) || 1}
 value={cantOperacion}
 onChange={(e) => setCantOperacion(parseInt(e.target.value, 10) || 1)}
 className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-black text-amber-600 text-center"
 />
 </div>

 {/* Resumen de devolución de insumos */}
 <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
 <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block ">
 Insumos que regresarán a stock:
 </span>
 <div className="space-y-1">
 {(comboSeleccionado.combo_detalles || []).map((d, i) => {
 const totalDevuelto = (parseFloat(d.cantidad) || 1) * cantOperacion;
 return (
 <div key={i} className="flex justify-between items-center text-[11px] text-slate-600 dark:text-slate-300">
 <span>• {d.insumo?.nombre}</span>
 <strong className="text-emerald-600 dark:text-emerald-400">
 +{totalDevuelto} {d.insumo?.unidad_medida || 'Und'}
 </strong>
 </div>
 );
 })}
 </div>
 </div>
                </div>

                {/* Pie Fijo */}
                <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0 z-20">
                  <button
                    type="button"
                    onClick={() => setModalDesarmar(false)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleEjecutarDesarmar}
                    disabled={guardando || cantOperacion <= 0 || cantOperacion > (parseFloat(comboSeleccionado.stock) || 0)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {guardando ? 'Desensamblando...' : `Confirmar y Desarmar ${cantOperacion} Kits`}
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
