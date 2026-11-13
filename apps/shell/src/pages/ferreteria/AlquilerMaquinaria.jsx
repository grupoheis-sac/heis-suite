import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 Wrench,
 Truck,
 Plus,
 RefreshCw,
 Search,
 CheckCircle2,
 AlertTriangle,
 Clock,
 Calendar,
 User,
 ShieldCheck,
 DollarSign,
 FileText,
 Printer,
 X,
 Phone,
 MapPin,
 Building2,
 HardHat,
 ArrowRight,
 Filter,
 Layers,
 Sparkles,
 ChevronDown,
 Check
} from 'lucide-react';
import { useSettingsStore } from '@heis/core';

export default function AlquilerMaquinaria() {
 const settings = useSettingsStore();
 const [vistaActual, setVistaActual] = useState('equipos'); // 'equipos', 'contratos', 'historial'
 const [equipos, setEquipos] = useState([]);
 const [alquileres, setAlquileres] = useState([]);
 const [clientes, setClientes] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState('');
 const [filtroEstadoEquipo, setFiltroEstadoEquipo] = useState('TODOS');
 const [filtroEstadoContrato, setFiltroEstadoContrato] = useState('TODOS');

 // Modales
 const [modalEquipo, setModalEquipo] = useState(false);
 const [modalAlquilar, setModalAlquilar] = useState(false);
 const [modalDevolver, setModalDevolver] = useState(false);
 const [modalContrato, setModalContrato] = useState(false);
 const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
 const [alquilerSeleccionado, setAlquilerSeleccionado] = useState(null);
 const [guardando, setGuardando] = useState(false);

 // Formulario Nuevo/Editar Equipo
 const [idEquipoEdit, setIdEquipoEdit] = useState('');
 const [codigoInterno, setCodigoInterno] = useState('');
 const [nombreEquipo, setNombreEquipo] = useState('');
 const [categoriaEquipo, setCategoriaEquipo] = useState('Construcción');
 const [marcaEquipo, setMarcaEquipo] = useState('');
 const [modeloEquipo, setModeloEquipo] = useState('');
 const [serieEquipo, setSerieEquipo] = useState('');
 const [tarifaDia, setTarifaDia] = useState('30.00');
 const [garantiaSugerida, setGarantiaSugerida] = useState('150.00');
 const [ubicacionPatio, setUbicacionPatio] = useState('Patio de Maquinarias');
 const [condicionEquipo, setCondicionEquipo] = useState('Operativo y probado');
 const [accesoriosIncluidos, setAccesoriosIncluidos] = useState('');

 // Selector Píldora Desplegable de Categoría de Maquinaria
 const [desplegableCatEquipoAbierto, setDesplegableCatEquipoAbierto] = useState(false);
 const [busquedaCatEquipo, setBusquedaCatEquipo] = useState('');
 const refSelectorCatEquipo = useRef(null);

 // Formulario Salida / Contrato de Alquiler
 const [idCliente, setIdCliente] = useState('');
 const [nombreCliente, setNombreCliente] = useState('');
 const [dniCliente, setDniCliente] = useState('');
 const [telefonoCliente, setTelefonoCliente] = useState('');
 const [direccionObra, setDireccionObra] = useState('');
 const [fechaSalida, setFechaSalida] = useState(new Date().toISOString().split('T')[0]);
 const [fechaEstimadaDev, setFechaEstimadaDev] = useState('');
 const [diasPactados, setDiasPactados] = useState(1);
 const [tarifaAplicada, setTarifaAplicada] = useState('30.00');
 const [montoGarantia, setMontoGarantia] = useState('150.00');
 const [condicionSalida, setCondicionSalida] = useState('Excelente estado, probado en presencia del cliente');
 const [obsAlquiler, setObsAlquiler] = useState('');

 // Formulario Devolución / Retorno
 const [condicionRetorno, setCondicionRetorno] = useState('Retornado conforme, probado');
 const [penalidadMora, setPenalidadMora] = useState('0.00');
 const [estadoGarantia, setEstadoGarantia] = useState('DEVUELTA');
 const [enviarMantenimiento, setEnviarMantenimiento] = useState(false);
 const [obsRetorno, setObsRetorno] = useState('');

 // Categorías estándar para maquinaria
 const CATEGORIAS_MAQUINARIA = [
 { id: 'Construcción', nombre: 'Construcción' },
 { id: 'Demolición', nombre: 'Demolición' },
 { id: 'Andamiaje', nombre: 'Andamiaje' },
 { id: 'Eléctrico', nombre: 'Eléctrico / Generadores' },
 { id: 'Elevación', nombre: 'Elevación / Escaleras' },
 { id: 'Pintura', nombre: 'Pintura / Compresoras' }
 ];

 // Presets Rápidos para Maquinaria Ferretera
 const presetsMaquinaria = [
 {
 nombre: 'Andamio Tubular Estándar (Cuerpo + Plataforma)',
 categoria: 'Andamiaje',
 marca: 'Tubomax',
 tarifaDia: '15.00',
 garantia: '100.00',
 accesorios: '2 Marcos, 2 Crucetas tijera, 1 Plataforma metálica antideslizante'
 },
 {
 nombre: 'Rotomartillo Demoledor SDS Max 11 Kg',
 categoria: 'Demolición',
 marca: 'Bosch Professional',
 tarifaDia: '60.00',
 garantia: '300.00',
 accesorios: 'Maletín antichoque, 1 Punta cónica, 1 Cincel plano, Grasa lubricante'
 },
 {
 nombre: 'Mezcladora Trompo de Concreto 9 p3 Motor Gasolina',
 categoria: 'Construcción',
 marca: 'Husqvarna / Honda',
 tarifaDia: '70.00',
 garantia: '400.00',
 accesorios: 'Motor Honda 9HP, Barra de remolque, Paletas internas reforzadas'
 },
 {
 nombre: 'Compactadora Tipo Canguro / Bailarina 4HP',
 categoria: 'Construcción',
 marca: 'Wacker Neuson',
 tarifaDia: '80.00',
 garantia: '500.00',
 accesorios: 'Zapata de madera/acero, Carro de transporte con ruedas'
 }
 ];

 const cargarDatos = async () => {
 try {
 setCargando(true);
 const [resEq, resAlq, resCli] = await Promise.all([
 api.get('/inventario/maquinaria'),
 api.get('/inventario/alquileres'),
 api.get('/clientes').catch(() => ({ data: [] }))
 ]);

 setEquipos(resEq.data?.equipos || []);
 setAlquileres(resAlq.data?.alquileres || []);
 const cliList = Array.isArray(resCli.data) ? resCli.data : resCli.data?.clientes || [];
 setClientes(cliList);
 } catch (error) {
 console.error(error);
 toast.error('Error al sincronizar inventario de maquinaria y alquileres');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 // Bloquear scroll de fondo al abrir cualquier modal
 useEffect(() => {
 if (modalEquipo || modalAlquilar || modalDevolver || modalContrato) {
 document.body.style.overflow = 'hidden';
 } else {
 document.body.style.overflow = 'unset';
 }
 return () => {
 document.body.style.overflow = 'unset';
 };
 }, [modalEquipo, modalAlquilar, modalDevolver, modalContrato]);

 // Cerrar desplegable de categoría de equipo al hacer clic fuera o presionar Escape
 useEffect(() => {
 const handleClickAfuera = (event) => {
 if (
 refSelectorCatEquipo.current &&
 !refSelectorCatEquipo.current.contains(event.target)
 ) {
 setDesplegableCatEquipoAbierto(false);
 }
 };

 const handleKeyDown = (event) => {
 if (event.key === 'Escape') {
 setDesplegableCatEquipoAbierto(false);
 }
 };

 if (desplegableCatEquipoAbierto) {
 document.addEventListener('mousedown', handleClickAfuera);
 document.addEventListener('keydown', handleKeyDown);
 }
 return () => {
 document.removeEventListener('mousedown', handleClickAfuera);
 document.removeEventListener('keydown', handleKeyDown);
 };
 }, [desplegableCatEquipoAbierto]);

 useEffect(() => {
 if (!modalEquipo) {
 setDesplegableCatEquipoAbierto(false);
 setBusquedaCatEquipo('');
 }
 }, [modalEquipo]);

 // Abrir Modal Nuevo Equipo
 const handleAbrirNuevoEquipo = (preset = null) => {
 setIdEquipoEdit('');
 if (preset) {
 setCodigoInterno('');
 setNombreEquipo(preset.nombre);
 setCategoriaEquipo(preset.categoria);
 setMarcaEquipo(preset.marca);
 setModeloEquipo('');
 setSerieEquipo('');
 setTarifaDia(preset.tarifaDia);
 setGarantiaSugerida(preset.garantia);
 setAccesoriosIncluidos(preset.accesorios);
 setCondicionEquipo('Operativo, listo para flete o alquiler');
 } else {
 setCodigoInterno('');
 setNombreEquipo('');
 setCategoriaEquipo('Construcción');
 setMarcaEquipo('');
 setModeloEquipo('');
 setSerieEquipo('');
 setTarifaDia('30.00');
 setGarantiaSugerida('150.00');
 setAccesoriosIncluidos('');
 setCondicionEquipo('Excelente estado operativo');
 }
 setModalEquipo(true);
 };

 // Abrir Modal Editar Equipo
 const handleAbrirEditarEquipo = (eq) => {
 setIdEquipoEdit(eq.id);
 setCodigoInterno(eq.codigo_interno);
 setNombreEquipo(eq.nombre);
 setCategoriaEquipo(eq.categoria);
 setMarcaEquipo(eq.marca || '');
 setModeloEquipo(eq.modelo || '');
 setSerieEquipo(eq.numero_serie || '');
 setTarifaDia(eq.tarifa_dia);
 setGarantiaSugerida(eq.garantia_sugerida);
 setUbicacionPatio(eq.ubicacion_patio || 'Patio de Maquinarias');
 setCondicionEquipo(eq.condicion_actual || 'Operativo');
 setAccesoriosIncluidos(eq.accesorios_incluidos || '');
 setModalEquipo(true);
 };

 // Guardar Equipo
 const handleGuardarEquipo = async (e) => {
 e.preventDefault();
 if (!nombreEquipo.trim()) {
 toast.error('Ingrese el nombre del equipo.');
 return;
 }

 try {
 setGuardando(true);
 const payload = {
 id: idEquipoEdit || null,
 codigo_interno: codigoInterno.trim() || null,
 nombre: nombreEquipo.trim(),
 categoria: categoriaEquipo,
 marca: marcaEquipo.trim() || null,
 modelo: modeloEquipo.trim() || null,
 numero_serie: serieEquipo.trim() || null,
 tarifa_dia: parseFloat(tarifaDia),
 garantia_sugerida: parseFloat(garantiaSugerida),
 ubicacion_patio: ubicacionPatio.trim(),
 condicion_actual: condicionEquipo.trim(),
 accesorios_incluidos: accesoriosIncluidos.trim() || null
 };

 const res = await api.post('/inventario/maquinaria', payload);
 toast.success(res.data?.message || 'Equipo guardado correctamente');
 setModalEquipo(false);
 cargarDatos();
 } catch (error) {
 console.error(error);
 toast.error('Error al guardar maquinaria');
 } finally {
 setGuardando(false);
 }
 };

 // Abrir Modal Alquilar Equipo
 const handleAbrirAlquilar = (eq) => {
 setEquipoSeleccionado(eq);
 setIdCliente('');
 setNombreCliente('');
 setDniCliente('');
 setTelefonoCliente('');
 setDireccionObra('');
 setTarifaAplicada(eq.tarifa_dia);
 setMontoGarantia(eq.garantia_sugerida);
 setDiasPactados(1);
 setCondicionSalida(`Equipo operativo. Accesorios: ${eq.accesorios_incluidos || 'Sin adicionales'}`);
 setObsAlquiler('');

 // Fecha retorno sugerida = mañana
 const manana = new Date();
 manana.setDate(manana.getDate() + 1);
 setFechaEstimadaDev(manana.toISOString().split('T')[0]);

 setModalAlquilar(true);
 };

 // Guardar Contrato de Alquiler
 const handleGuardarAlquiler = async (e) => {
 e.preventDefault();
 if (!nombreCliente.trim()) {
 toast.error('Ingrese el nombre del cliente o contratista.');
 return;
 }
 if (!fechaEstimadaDev) {
 toast.error('Indique la fecha estimada de devolución.');
 return;
 }

 try {
 setGuardando(true);
 const payload = {
 id_equipo: equipoSeleccionado.id,
 id_cliente: idCliente || null,
 nombre_cliente: nombreCliente.trim(),
 dni_cliente: dniCliente.trim() || null,
 telefono_cliente: telefonoCliente.trim() || null,
 direccion_obra: direccionObra.trim() || null,
 fecha_salida: fechaSalida,
 fecha_estimada_devolucion: fechaEstimadaDev,
 dias_pactados: diasPactados,
 tarifa_dia_aplicada: parseFloat(tarifaAplicada),
 monto_garantia: parseFloat(montoGarantia),
 condicion_salida: condicionSalida.trim(),
 observaciones: obsAlquiler.trim() || null
 };

 const res = await api.post('/inventario/alquileres', payload);
 toast.success(res.data?.message || 'Alquiler registrado con éxito');
 setModalAlquilar(false);
 setAlquilerSeleccionado(res.data?.alquiler);
 setModalContrato(true);
 cargarDatos();
 } catch (error) {
 console.error(error);
 toast.error(error.response?.data?.message || 'Error al registrar contrato de alquiler');
 } finally {
 setGuardando(false);
 }
 };

 // Abrir Modal Devolución
 const handleAbrirDevolver = (alq) => {
 setAlquilerSeleccionado(alq);
 setCondicionRetorno('Equipo retornado limpio y con todos sus accesorios');
 setPenalidadMora('0.00');
 setEstadoGarantia('DEVUELTA');
 setEnviarMantenimiento(false);
 setObsRetorno('');
 setModalDevolver(true);
 };

 // Confirmar Devolución
 const handleConfirmarDevolucion = async () => {
 try {
 setGuardando(true);
 const res = await api.post(`/inventario/alquileres/${alquilerSeleccionado.id}/devolver`, {
 condicion_retorno: condicionRetorno.trim(),
 monto_penalidad_mora: parseFloat(penalidadMora) || 0,
 estado_garantia: estadoGarantia,
 enviar_mantenimiento: enviarMantenimiento,
 observaciones_retorno: obsRetorno.trim() || null
 });

 toast.success(res.data?.message || 'Devolución procesada exitosamente');
 setModalDevolver(false);
 cargarDatos();
 } catch (error) {
 console.error(error);
 toast.error('Error al procesar devolución');
 } finally {
 setGuardando(false);
 }
 };

 // Cambiar a Mantenimiento directamente
 const handleCambiarMantenimiento = async (eq, aMantenimiento) => {
 try {
 const nuevoEstado = aMantenimiento ? 'MANTENIMIENTO' : 'DISPONIBLE';
 await api.patch(`/inventario/maquinaria/${eq.id}/estado`, {
 estado: nuevoEstado,
 condicion_actual: aMantenimiento ? 'En revisión técnica / cambio de carbones' : 'Operativo'
 });
 toast.success(`Estado actualizado a ${nuevoEstado}`);
 cargarDatos();
 } catch (error) {
 console.error(error);
 toast.error('Error al cambiar estado');
 }
 };

 // KPIs
 const totalEquipos = equipos.length;
 const disponibles = equipos.filter((e) => e.estado === 'DISPONIBLE').length;
 const alquilados = equipos.filter((e) => e.estado === 'ALQUILADO').length;
 const enMantenimiento = equipos.filter((e) => e.estado === 'MANTENIMIENTO').length;
 const contratosActivos = alquileres.filter((a) => a.estado === 'ACTIVO' || a.estado === 'MORA');
 const contratosEnMora = alquileres.filter((a) => a.estado === 'MORA');
 const totalGarantiasRetenidas = contratosActivos.reduce(
 (acc, a) => acc + (parseFloat(a.monto_garantia) || 0),
 0
 );

 // Filtros
 const equiposFiltrados = equipos.filter((e) => {
 if (filtroEstadoEquipo !== 'TODOS' && e.estado !== filtroEstadoEquipo) return false;
 if (!busqueda) return true;
 const term = busqueda.toLowerCase();
 return (
 e.nombre?.toLowerCase().includes(term) ||
 e.codigo_interno?.toLowerCase().includes(term) ||
 e.marca?.toLowerCase().includes(term) ||
 e.categoria?.toLowerCase().includes(term)
 );
 });

 const contratosFiltrados = alquileres.filter((a) => {
 if (filtroEstadoContrato !== 'TODOS' && a.estado !== filtroEstadoContrato) return false;
 if (!busqueda) return true;
 const term = busqueda.toLowerCase();
 return (
 a.codigo_contrato?.toLowerCase().includes(term) ||
 a.nombre_cliente?.toLowerCase().includes(term) ||
 a.equipo?.nombre?.toLowerCase().includes(term)
 );
 });

 return (
 <div className="space-y-6">
 {/* ─── ENCABEZADO Y ACCIONES PRINCIPALES ─── */}
 <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-card-soft">
 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-600/25 shrink-0">
 <HardHat className="w-5 h-5 stroke-[2.3]" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight ">
 Alquiler de Maquinaria & Equipos
 </h2>
 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
 Flota Ferretera
 </span>
 </div>
 <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
 Control de andamios, rotomartillos, trompos mezcladores y maquinaria con fianza retenida y estado técnico
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
 onClick={() => handleAbrirNuevoEquipo()}
 className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-600/25 hover:shadow-lg hover:from-amber-700 hover:to-orange-700 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
 >
 <Plus className="w-4 h-4 stroke-[2.5]" />
 <span>Registrar Maquinaria</span>
 </button>
 </div>
 </div>

 {/* ─── PRESETS DE MAQUINARIA POPULAR ─── */}
 <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
 <div className="flex items-center gap-2 mb-2.5">
 <Sparkles className="w-3.5 h-3.5 text-amber-500" />
 <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider ">
 Equipos de Alta Rotación en Ferretería (1-Clic para Alta en Flota):
 </span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
 {presetsMaquinaria.map((p, idx) => (
 <div
 key={idx}
 onClick={() => handleAbrirNuevoEquipo(p)}
 className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-all cursor-pointer group text-left"
 >
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 line-clamp-1">
 {p.nombre}
 </span>
 <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
 </div>
 <div className="mt-2 flex items-center justify-between text-[11px]">
 <span className="font-semibold text-slate-400">Tarifa / Día:</span>
 <span className="font-black text-amber-600 dark:text-amber-400">
 {settings.currency} {p.tarifaDia}
 </span>
 </div>
 <div className="flex items-center justify-between text-[10px] text-slate-400 mt-0.5">
 <span>Garantía sugerida:</span>
 <span className="font-bold text-slate-600 dark:text-slate-300">
 {settings.currency} {p.garantia}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* ─── TARJETAS DE INDICADORES / KPIS DE ALQUILER & MAQUINARIA ─── */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Flota Total */}
 <button
 type="button"
 onClick={() => {
 setVistaActual('equipos');
 setFiltroEstadoEquipo('TODOS');
 }}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 vistaActual === 'equipos' && filtroEstadoEquipo === 'TODOS'
 ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/25 shadow-md shadow-amber-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Flota Total
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <HardHat className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {totalEquipos}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Máquinas en inventario
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 {vistaActual === 'equipos' && filtroEstadoEquipo === 'TODOS' ? 'Filtrando' : 'Parque Total'}
 </span>
 </div>
 </button>

 {/* KPI 2: Disponibles en Patio */}
 <button
 type="button"
 onClick={() => {
 setVistaActual('equipos');
 setFiltroEstadoEquipo('Disponible');
 }}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 vistaActual === 'equipos' && filtroEstadoEquipo === 'Disponible'
 ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Disponibles Patio
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {disponibles}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Listos para alquilar
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 {vistaActual === 'equipos' && filtroEstadoEquipo === 'Disponible' ? 'Filtrando' : 'En Patio'}
 </span>
 </div>
 </button>

 {/* KPI 3: En Obra / Alquilados */}
 <button
 type="button"
 onClick={() => setVistaActual('contratos')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 vistaActual === 'contratos'
 ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/25 shadow-md shadow-blue-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate min-w-0">
 En Obra / Alquilados
 </span>
 <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-600/25 transition-all duration-200">
 <Truck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight truncate">
 {alquilados}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Contratos vigentes
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/60 shrink-0 whitespace-nowrap">
 {contratosEnMora.length > 0 ? `${contratosEnMora.length} en mora` : 'En Obra'}
 </span>
 </div>
 </button>

 {/* KPI 4: Fianzas en Custodia */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-violet-500 dark:hover:border-violet-500 shadow-2xs hover:shadow-md hover:shadow-violet-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-violet-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate min-w-0">
 Fianzas en Custodia
 </span>
 <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-100/80 dark:border-violet-800/60 flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-violet-600/25 transition-all duration-200">
 <ShieldCheck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-violet-600 dark:text-violet-400 tracking-tight truncate">
 {settings.currency} {totalGarantiasRetenidas.toFixed(2)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Garantías retenidas
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/80 dark:border-violet-800/60 shrink-0 whitespace-nowrap">
 Garantía Activa
 </span>
 </div>
 </div>
 </div>

 {/* ─── NAVEGACIÓN DE VISTAS (PÍLDORAS RESPONSIVAS MÓVIL) ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Riel Desplazable de Píldoras para Móviles */}
        <div className="w-full sm:w-auto overflow-x-auto custom-scrollbar no-scrollbar py-0.5 -mx-1 px-1 sm:mx-0 sm:px-0">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-slate-100/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shrink-0 select-none whitespace-nowrap">
            <button
              type="button"
              onClick={() => setVistaActual('equipos')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap cursor-pointer touch-manipulation active:scale-[0.98] ${
                vistaActual === 'equipos'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <HardHat className="w-3.5 h-3.5 shrink-0" />
              <span>Catálogo de Flota ({totalEquipos})</span>
            </button>

            <button
              type="button"
              onClick={() => setVistaActual('contratos')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap cursor-pointer touch-manipulation active:scale-[0.98] ${
                vistaActual === 'contratos'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Contratos Activos ({contratosActivos.length})</span>
              {contratosEnMora.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setVistaActual('historial')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap cursor-pointer touch-manipulation active:scale-[0.98] ${
                vistaActual === 'historial'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span>Historial de Devoluciones</span>
            </button>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, equipo o cliente..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs focus:ring-2 focus:ring-amber-500/20 shadow-2xs"
          />
        </div>
      </div>

      {/* ─── VISTA 1: CATÁLOGO DE EQUIPOS ─── */}
 {vistaActual === 'equipos' && (
 <div className="space-y-3.5">
 {equiposFiltrados.length === 0 ? (
 <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
 <HardHat className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
 <p className="text-xs font-bold text-slate-500 ">
 No hay maquinarias registradas o no coinciden con la búsqueda.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {equiposFiltrados.map((eq) => {
 const isDisponible = eq.estado === 'DISPONIBLE';
 const isAlquilado = eq.estado === 'ALQUILADO';
 const isMantenimiento = eq.estado === 'MANTENIMIENTO';
 const alquilerActivo = eq.alquileres?.[0];

 return (
 <div
 key={eq.id}
 className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
 >
 <div>
 {/* Header de la tarjeta */}
 <div className="flex items-start justify-between gap-2">
 <div>
 <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
 [{eq.codigo_interno}] • {eq.categoria}
 </span>
 <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
 {eq.nombre}
 </h4>
 {eq.marca && (
 <span className="text-xs text-slate-500 dark:text-slate-400">
 {eq.marca} {eq.modelo && `• ${eq.modelo}`}
 </span>
 )}
 </div>

 {/* Estado Badge */}
 <span
 className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
 isDisponible
 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
 : isAlquilado
 ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
 : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
 }`}
 >
 {eq.estado}
 </span>
 </div>

 {/* Información de Tarifas */}
 <div className="grid grid-cols-2 gap-2 mt-4 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 text-xs">
 <div>
 <span className="text-[10.5px] text-slate-400 block font-medium">Tarifa x Día</span>
 <strong className="text-sm font-black text-amber-600 dark:text-amber-400 ">
 {settings.currency} {parseFloat(eq.tarifa_dia).toFixed(2)}
 </strong>
 </div>
 <div>
 <span className="text-[10.5px] text-slate-400 block font-medium">Fianza Requerida</span>
 <strong className="text-sm font-black text-slate-700 dark:text-slate-300 ">
 {settings.currency} {parseFloat(eq.garantia_sugerida).toFixed(2)}
 </strong>
 </div>
 </div>

 {/* Alquiler activo info si aplica */}
 {isAlquilado && alquilerActivo && (
 <div className="mt-3 p-2.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
 <div className="flex items-center gap-1.5 font-bold">
 <User className="w-3.5 h-3.5" />
 <span>En obra: {alquilerActivo.nombre_cliente}</span>
 </div>
 <div className="text-[10.5px] text-blue-700 dark:text-blue-300">
 Pactado hasta: {new Date(alquilerActivo.fecha_estimada_devolucion).toLocaleDateString('es-PE')}
 </div>
 </div>
 )}

 {/* Accesorios y Condición */}
 {eq.accesorios_incluidos && (
 <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
 <strong>Accesorios:</strong> {eq.accesorios_incluidos}
 </p>
 )}
 </div>

 {/* Botones de acción */}
 <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
 <button
 type="button"
 onClick={() => handleAbrirEditarEquipo(eq)}
 className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
 >
 Editar
 </button>

 <div className="flex items-center gap-1.5">
 {isMantenimiento ? (
 <button
 type="button"
 onClick={() => handleCambiarMantenimiento(eq, false)}
 className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
 >
 Dar de Alta
 </button>
 ) : isDisponible ? (
 <>
 <button
 type="button"
 onClick={() => handleCambiarMantenimiento(eq, true)}
 className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
 >
 Taller
 </button>
 <button
 type="button"
 onClick={() => handleAbrirAlquilar(eq)}
 className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
 >
 Alquilar a Obra
 </button>
 </>
 ) : (
 <button
 type="button"
 onClick={() => handleAbrirDevolver(alquilerActivo)}
 className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
 >
 Recepcionar
 </button>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {/* ─── VISTA 2: CONTRATOS ACTIVOS & MORA ─── */}
 {vistaActual === 'contratos' && (
 <div className="space-y-3.5">
 {contratosFiltrados.filter((a) => a.estado === 'ACTIVO' || a.estado === 'MORA').length === 0 ? (
 <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
 <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
 <p className="text-xs font-bold text-slate-700 dark:text-slate-300 ">
 No hay maquinarias alquiladas actualmente. Toda la flota está disponible en patio.
 </p>
 </div>
 ) : (
 <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10.5px] uppercase font-bold text-slate-500 ">
 <th className="p-3.5">Contrato / Equipo</th>
 <th className="p-3.5">Cliente / Contratista</th>
 <th className="p-3.5 text-center">Fecha Salida</th>
 <th className="p-3.5 text-center">Devolución Pactada</th>
 <th className="p-3.5 text-right">Fianza Retenida</th>
 <th className="p-3.5 text-right">Total Alquiler</th>
 <th className="p-3.5 text-center">Estado</th>
 <th className="p-3.5 text-center">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {contratosFiltrados
 .filter((a) => a.estado === 'ACTIVO' || a.estado === 'MORA')
 .map((alq) => {
 const isMora = alq.estado === 'MORA';
 return (
 <tr
 key={alq.id}
 className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
 isMora ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
 }`}
 >
 <td className="p-3.5">
 <span className="font-mono text-[10.5px] font-bold text-slate-400 block">
 {alq.codigo_contrato}
 </span>
 <strong className="text-slate-800 dark:text-slate-200 ">
 {alq.equipo?.nombre}
 </strong>
 </td>
 <td className="p-3.5">
 <div className="font-bold text-slate-800 dark:text-slate-200">
 {alq.nombre_cliente}
 </div>
 {alq.telefono_cliente && (
 <div className="text-[10.5px] text-slate-400 flex items-center gap-1">
 <Phone className="w-3 h-3" />
 {alq.telefono_cliente}
 </div>
 )}
 </td>
 <td className="p-3.5 text-center text-slate-600 dark:text-slate-400">
 {new Date(alq.fecha_salida).toLocaleDateString('es-PE')}
 </td>
 <td className="p-3.5 text-center">
 <span
 className={`font-bold ${
 isMora ? 'text-rose-600 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'
 }`}
 >
 {new Date(alq.fecha_estimada_devolucion).toLocaleDateString('es-PE')}
 </span>
 </td>
 <td className="p-3.5 text-right font-black text-violet-600 dark:text-violet-400">
 {settings.currency} {parseFloat(alq.monto_garantia).toFixed(2)}
 </td>
 <td className="p-3.5 text-right font-black text-slate-900 dark:text-white">
 {settings.currency} {parseFloat(alq.monto_alquiler).toFixed(2)}
 </td>
 <td className="p-3.5 text-center">
 {isMora ? (
 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
 En Mora (Vencido)
 </span>
 ) : (
 <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 border border-blue-200">
 Vigente
 </span>
 )}
 </td>
 <td className="p-3.5 text-center">
 <div className="flex items-center justify-center gap-1.5">
 <button
 type="button"
 onClick={() => handleAbrirDevolver(alq)}
 className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-xs hover:shadow-md cursor-pointer"
 >
 Recepcionar & Liquidar
 </button>
 <button
 type="button"
 onClick={() => {
 setAlquilerSeleccionado(alq);
 setModalContrato(true);
 }}
 className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 cursor-pointer"
 >
 <Printer className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}

 {/* ─── VISTA 3: HISTORIAL COMPLETO DE ALQUILERES ─── */}
 {vistaActual === 'historial' && (
 <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[10.5px] uppercase font-bold text-slate-500 ">
 <th className="p-3.5">Contrato</th>
 <th className="p-3.5">Maquinaria</th>
 <th className="p-3.5">Cliente</th>
 <th className="p-3.5 text-center">Fechas (Salida / Retorno)</th>
 <th className="p-3.5 text-center">Días Reales</th>
 <th className="p-3.5 text-right">Cobro Final</th>
 <th className="p-3.5 text-center">Estado Fianza</th>
 <th className="p-3.5 text-center">Ficha</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {contratosFiltrados.map((alq) => (
 <tr key={alq.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
 <td className="p-3.5 font-mono font-bold text-slate-500">{alq.codigo_contrato}</td>
 <td className="p-3.5 font-bold text-slate-800 dark:text-slate-200">
 {alq.equipo?.nombre}
 </td>
 <td className="p-3.5 text-slate-700 dark:text-slate-300">{alq.nombre_cliente}</td>
 <td className="p-3.5 text-center text-slate-500 text-[11px]">
 {new Date(alq.fecha_salida).toLocaleDateString('es-PE')} ➔{' '}
 {alq.fecha_real_devolucion
 ? new Date(alq.fecha_real_devolucion).toLocaleDateString('es-PE')
 : 'En obra'}
 </td>
 <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">
 {alq.dias_reales || alq.dias_pactados} días
 </td>
 <td className="p-3.5 text-right font-black text-emerald-600 dark:text-emerald-400">
 {settings.currency} {parseFloat(alq.total_cobrado || alq.monto_alquiler).toFixed(2)}
 </td>
 <td className="p-3.5 text-center">
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
 {alq.estado_garantia}
 </span>
 </td>
 <td className="p-3.5 text-center">
 <button
 type="button"
 onClick={() => {
 setAlquilerSeleccionado(alq);
 setModalContrato(true);
 }}
 className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer"
 >
 <Printer className="w-3.5 h-3.5" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {/* ─── MODAL 1: REGISTRAR / EDITAR EQUIPO ─── */}
      {modalEquipo &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setModalEquipo(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
              onClick={() => setModalEquipo(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabecera Fija */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0 border border-amber-400/20">
                      <HardHat className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        {idEquipoEdit ? 'Editar Maquinaria / Equipo' : 'Alta de Maquinaria para Alquiler'}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Configure el activo, tarifas por día y fianza sugerida
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalEquipo(false)}
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors shadow-2xs touch-manipulation cursor-pointer shrink-0"
                    title="Cerrar ventana"
                  >
                    <X className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Formulario con Scroll */}
                <form onSubmit={handleGuardarEquipo} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
 <div className="sm:col-span-2">
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Nombre del Equipo / Maquinaria *
 </label>
 <input
 type="text"
 required
 value={nombreEquipo}
 onChange={(e) => setNombreEquipo(e.target.value)}
 placeholder="Ej. Trompo Mezclador de Concreto 9 p3 Motor Gasolina"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:ring-2 focus:ring-amber-500/20"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Código Interno / Placa (Opcional)
 </label>
 <input
 type="text"
 value={codigoInterno}
 onChange={(e) => setCodigoInterno(e.target.value)}
 placeholder="Autogenerado si está vacío"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
 />
 </div>

 {/* Selector Píldora Desplegable de Categoría con diseño rounded-xl y rounded-2xl */}
 <div
 className={`relative ${desplegableCatEquipoAbierto ? 'z-40' : 'z-20'}`}
 ref={refSelectorCatEquipo}
 >
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Categoría *
 </label>

 {/* Botón Disparador que simula el select con bordes redondeados rounded-xl (evita ventana cuadrada del SO) */}
 {(() => {
 const catActual = CATEGORIAS_MAQUINARIA.find((c) => c.id === categoriaEquipo);
 const etiquetaCategoria = catActual ? catActual.nombre : (categoriaEquipo || 'Seleccionar Categoría');

 return (
 <button
 type="button"
 onClick={() => {
 setDesplegableCatEquipoAbierto(!desplegableCatEquipoAbierto);
 setBusquedaCatEquipo('');
 }}
 className={`w-full px-3.5 py-2.5 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none ${
 desplegableCatEquipoAbierto
 ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/10 dark:bg-slate-800'
 : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-800'
 }`}
 >
 <span className="text-xs font-semibold text-slate-900 dark:text-white truncate">
 {etiquetaCategoria}
 </span>
 <ChevronDown
 className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
 desplegableCatEquipoAbierto ? 'rotate-180 text-amber-600' : ''
 }`}
 />
 </button>
 );
 })()}

 {/* Ventana Desplegable con bordes redondeados (rounded-2xl) */}
 {desplegableCatEquipoAbierto && (
 <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/60 p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
 {/* Buscador Rápido con bordes rounded-xl si hay búsqueda o más de 4 opciones */}
 <div className="relative p-1">
 <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 autoFocus
 placeholder="Buscar categoría..."
 value={busquedaCatEquipo}
 onChange={(e) => setBusquedaCatEquipo(e.target.value)}
 className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
 />
 </div>

 {/* Lista con elementos redondeados (rounded-xl) */}
 <div className="max-h-56 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
 {(() => {
 const mapCats = new Map();
 CATEGORIAS_MAQUINARIA.forEach((c) => mapCats.set(c.id, c.nombre));
 equipos.forEach((eq) => {
 if (eq.categoria && !mapCats.has(eq.categoria)) {
 mapCats.set(eq.categoria, eq.categoria);
 }
 });
 const listaCombinada = Array.from(mapCats.entries()).map(([id, nombre]) => ({ id, nombre }));
 const filtradas = listaCombinada.filter((cat) => {
 if (!busquedaCatEquipo.trim()) return true;
 return (
 cat.nombre.toLowerCase().includes(busquedaCatEquipo.toLowerCase().trim()) ||
 cat.id.toLowerCase().includes(busquedaCatEquipo.toLowerCase().trim())
 );
 });

 if (filtradas.length === 0) {
 return (
 <div className="px-3 py-3 text-center text-xs text-slate-400">
 No se encontraron categorías
 </div>
 );
 }

 return filtradas.map((cat) => {
 const esSeleccionado = categoriaEquipo === cat.id;
 return (
 <button
 key={cat.id}
 type="button"
 onClick={() => {
 setCategoriaEquipo(cat.id);
 setDesplegableCatEquipoAbierto(false);
 setBusquedaCatEquipo('');
 }}
 className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
 esSeleccionado
 ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold'
 : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
 }`}
 >
 <span>{cat.nombre}</span>
 {esSeleccionado && (
 <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
 )}
 </button>
 );
 });
 })()}
 </div>
 </div>
 )}
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Marca
 </label>
 <input
 type="text"
 value={marcaEquipo}
 onChange={(e) => setMarcaEquipo(e.target.value)}
 placeholder="Ej. Bosch, Honda, Wacker"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Número de Serie / Motor
 </label>
 <input
 type="text"
 value={serieEquipo}
 onChange={(e) => setSerieEquipo(e.target.value)}
 placeholder="Ej. SN-99882211"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
 />
 </div>
 </div>

 {/* Tarifas */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/50">
 <div>
 <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1 ">
 Tarifa x Día *
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">
 {settings.currency}
 </span>
 <input
 type="number"
 step="0.01"
 required
 value={tarifaDia}
 onChange={(e) => setTarifaDia(e.target.value)}
 className="w-full pl-14 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-xs font-black text-amber-700 dark:text-amber-300"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1 ">
 Garantía / Fianza Requerida *
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">
 {settings.currency}
 </span>
 <input
 type="number"
 step="0.01"
 required
 value={garantiaSugerida}
 onChange={(e) => setGarantiaSugerida(e.target.value)}
 className="w-full pl-14 pr-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 text-xs font-black text-amber-700 dark:text-amber-300"
 />
 </div>
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Accesorios y Piezas Incluidas en la Entrega
 </label>
 <textarea
 rows={2}
 value={accesoriosIncluidos}
 onChange={(e) => setAccesoriosIncluidos(e.target.value)}
 placeholder="Ej. Maletín plástico, 1 punta, 1 cincel plano, llave de ajuste"
 className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
 />
 </div>
                  </div>

                  {/* Pie Fijo */}
                  <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0 z-20">
                    <button
                      type="button"
                      onClick={() => setModalEquipo(false)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardando}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-600/25 hover:from-amber-700 hover:to-orange-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {guardando ? 'Guardando...' : 'Guardar Equipo en Flota'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL 2: ALQUILAR A OBRA (SALIDA DE EQUIPO) ─── */}
      {modalAlquilar &&
        equipoSeleccionado &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setModalAlquilar(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
              onClick={() => setModalAlquilar(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabecera Fija */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 shrink-0 border border-amber-400/20">
                      <Truck className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        Nuevo Contrato de Alquiler de Maquinaria
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Equipo: <strong>{equipoSeleccionado.nombre}</strong> [{equipoSeleccionado.codigo_interno}]
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalAlquilar(false)}
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors shadow-2xs touch-manipulation cursor-pointer shrink-0"
                    title="Cerrar ventana"
                  >
                    <X className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Formulario con Scroll */}
                <form onSubmit={handleGuardarAlquiler} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                  <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
                    {/* Datos del Cliente */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
 <div className="sm:col-span-2">
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Nombre del Cliente / Contratista *
 </label>
 <input
 type="text"
 required
 value={nombreCliente}
 onChange={(e) => setNombreCliente(e.target.value)}
 placeholder="Ej. Ing. Carlos Mendoza / Constructora San Pedro"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 DNI / RUC del Responsable
 </label>
 <input
 type="text"
 value={dniCliente}
 onChange={(e) => setDniCliente(e.target.value)}
 placeholder="Ej. 45678912"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Teléfono de Contacto
 </label>
 <input
 type="text"
 value={telefonoCliente}
 onChange={(e) => setTelefonoCliente(e.target.value)}
 placeholder="Ej. 987654321"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
 />
 </div>

 <div className="sm:col-span-2">
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Dirección de Obra / Destino
 </label>
 <input
 type="text"
 value={direccionObra}
 onChange={(e) => setDireccionObra(e.target.value)}
 placeholder="Ej. Av. Los Próceres Mz D Lt 14, Obra Residencial"
 className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium"
 />
 </div>
 </div>

 {/* Fechas y Días */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Fecha Salida
 </label>
 <input
 type="date"
 value={fechaSalida}
 onChange={(e) => setFechaSalida(e.target.value)}
 className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Fecha Devolución *
 </label>
 <input
 type="date"
 required
 value={fechaEstimadaDev}
 onChange={(e) => {
 setFechaEstimadaDev(e.target.value);
 if (e.target.value && fechaSalida) {
 const diff = Math.ceil(
 (new Date(e.target.value) - new Date(fechaSalida)) / (1000 * 60 * 60 * 24)
 );
 setDiasPactados(Math.max(1, diff));
 }
 }}
 className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Días Pactados
 </label>
 <input
 type="number"
 min="1"
 value={diasPactados}
 onChange={(e) => {
 const d = parseInt(e.target.value, 10) || 1;
 setDiasPactados(d);
 if (fechaSalida) {
 const f = new Date(fechaSalida);
 f.setDate(f.getDate() + d);
 setFechaEstimadaDev(f.toISOString().split('T')[0]);
 }
 }}
 className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-center"
 />
 </div>
 </div>

 {/* Importes Financieros */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40">
 <div>
 <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1 ">
 Tarifa Diaria Pactada
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">
 {settings.currency}
 </span>
 <input
 type="number"
 step="0.01"
 value={tarifaAplicada}
 onChange={(e) => setTarifaAplicada(e.target.value)}
 className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 text-xs font-bold"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-amber-950 dark:text-amber-200 mb-1 ">
 Fianza / Garantía Retenida
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-600">
 {settings.currency}
 </span>
 <input
 type="number"
 step="0.01"
 value={montoGarantia}
 onChange={(e) => setMontoGarantia(e.target.value)}
 className="w-full pl-8 pr-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 text-xs font-black text-violet-600"
 />
 </div>
 </div>
 </div>

 {/* Resumen Total Alquiler */}
 <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-between">
 <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
 Costo Estimado Alquiler ({diasPactados} días x {settings.currency} {tarifaAplicada}):
 </span>
 <span className="text-base font-black text-slate-900 dark:text-white ">
 {settings.currency} {(diasPactados * parseFloat(tarifaAplicada || 0)).toFixed(2)}
 </span>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Checklist de Estado y Accesorios al Entregar
 </label>
 <textarea
 rows={2}
 value={condicionSalida}
 onChange={(e) => setCondicionSalida(e.target.value)}
 className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
 />
 </div>
                  </div>

                  {/* Pie Fijo */}
                  <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0 z-20">
                    <button
                      type="button"
                      onClick={() => setModalAlquilar(false)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardando}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold shadow-md shadow-amber-600/25 hover:from-amber-700 hover:to-orange-700 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {guardando ? 'Emitiendo Contrato...' : 'Emitir Contrato y Despachar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL 3: RECEPCIONAR & LIQUIDAR DEVOLUCIÓN ─── */}
      {modalDevolver &&
        alquilerSeleccionado &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
              onClick={() => setModalDevolver(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
              onClick={() => setModalDevolver(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabecera Fija */}
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0 border border-emerald-400/20">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        Recepcionar Maquinaria & Liquidar
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        Contrato: {alquilerSeleccionado.codigo_contrato} • {alquilerSeleccionado.equipo?.nombre}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalDevolver(false)}
                    className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors shadow-2xs touch-manipulation cursor-pointer shrink-0"
                    title="Cerrar ventana"
                  >
                    <X className="w-4 h-4 sm:w-4 sm:h-4" />
                  </button>
                </div>

                {/* Contenido Scrolleable */}
                <div className="flex-1 overflow-y-auto custom-modal-scroll p-4 sm:p-6 space-y-4 text-xs">
                  {/* Cuadro Resumen */}
 <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
 <div>
 <span className="text-[10.5px] text-slate-400 block font-medium">Cliente</span>
 <strong className="text-xs font-bold text-slate-800 dark:text-slate-200">
 {alquilerSeleccionado.nombre_cliente}
 </strong>
 </div>
 <div>
 <span className="text-[10.5px] text-slate-400 block font-medium">Garantía en Depósito</span>
 <strong className="text-xs font-black text-violet-600 dark:text-violet-400 ">
 {settings.currency} {parseFloat(alquilerSeleccionado.monto_garantia).toFixed(2)}
 </strong>
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Condición Técnica del Equipo al Retornar
 </label>
 <input
 type="text"
 value={condicionRetorno}
 onChange={(e) => setCondicionRetorno(e.target.value)}
 placeholder="Ej. Limpio, probado, accesorios completos"
 className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Penalidad por Mora / Daños
 </label>
 <div className="relative">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-500">
 {settings.currency}
 </span>
 <input
 type="number"
 step="0.01"
 value={penalidadMora}
 onChange={(e) => setPenalidadMora(e.target.value)}
 className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-rose-600"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 ">
 Destino de la Garantía
 </label>
 <select
 value={estadoGarantia}
 onChange={(e) => setEstadoGarantia(e.target.value)}
 className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
 >
 <option value="DEVUELTA">Devolver al Cliente (100% Conforme)</option>
 <option value="APLICADA_A_PAGO">Aplicar al Pago del Alquiler</option>
 <option value="RETENIDA_POR_DANOS">Retener por Reparación / Daños</option>
 </select>
 </div>
 </div>

 <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40">
 <input
 type="checkbox"
 id="chkMant"
 checked={enviarMantenimiento}
 onChange={(e) => setEnviarMantenimiento(e.target.checked)}
 className="w-4 h-4 text-amber-600 rounded"
 />
 <label htmlFor="chkMant" className="text-xs font-bold text-amber-900 dark:text-amber-200 cursor-pointer">
 Enviar a Mantenimiento Preventivo (Revisión de escobillas, aceite o limpieza)
 </label>
 </div>
                </div>

                {/* Pie Fijo */}
                <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0 z-20">
                  <button
                    type="button"
                    onClick={() => setModalDevolver(false)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmarDevolucion}
                    disabled={guardando}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold shadow-md shadow-emerald-600/25 hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {guardando ? 'Liquidando...' : 'Confirmar Retorno y Liquidar'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ─── MODAL 4: CONTRATO / FICHA IMPRIMIBLE DE ALQUILER ─── */}
      {modalContrato &&
        alquilerSeleccionado &&
        createPortal(
          <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
            <div
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity print:hidden"
              onClick={() => setModalContrato(false)}
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto print:p-0 print:static"
              onClick={() => setModalContrato(false)}
            >
              <div
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default print:border-none print:shadow-none print:max-h-none print:rounded-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Cabecera Fija */}
                <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs print:hidden">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    Ficha Oficial de Alquiler de Maquinaria
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Contrato</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalContrato(false)}
                      className="w-9 h-9 sm:w-8 sm:h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors shadow-2xs touch-manipulation cursor-pointer shrink-0"
                      title="Cerrar ventana"
                    >
                      <X className="w-4 h-4 sm:w-4 sm:h-4" />
                    </button>
                  </div>
                </div>

                {/* Ficha Imprimible con Scroll */}
                <div className="p-4 sm:p-8 space-y-5 flex-1 overflow-y-auto custom-modal-scroll text-xs text-slate-800 dark:text-slate-200 print:text-black print:p-0">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
 <div>
 <h2 className="text-base font-black uppercase">
 CONTRATO DE ARRENDAMIENTO DE MAQUINARIA & EQUIPOS
 </h2>
 <span className="text-xs text-slate-500 block font-mono">
 N° {alquilerSeleccionado.codigo_contrato}
 </span>
 </div>
 <div className="text-right">
 <span className="font-bold text-xs">Fecha Emisión:</span>{' '}
 {new Date(alquilerSeleccionado.fecha_salida).toLocaleDateString('es-PE')}
 </div>
 </div>

 {/* Cliente & Obra */}
 <div className="grid grid-cols-2 gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
 <div>
 <span className="text-[10px] text-slate-400 uppercase font-bold block">
 Arrendatario / Cliente
 </span>
 <strong className="text-sm block">{alquilerSeleccionado.nombre_cliente}</strong>
 <span className="text-slate-500">DNI/RUC: {alquilerSeleccionado.dni_cliente || 'N/A'}</span>
 <br />
 <span className="text-slate-500">Tel: {alquilerSeleccionado.telefono_cliente || 'N/A'}</span>
 </div>
 <div>
 <span className="text-[10px] text-slate-400 uppercase font-bold block">
 Destino de la Maquinaria
 </span>
 <span className="text-xs block font-medium">
 {alquilerSeleccionado.direccion_obra || 'Uso en obra según lo pactado'}
 </span>
 </div>
 </div>

 {/* Equipo */}
 <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-100 dark:bg-slate-800 text-[10.5px] uppercase font-bold text-slate-600">
 <tr>
 <th className="p-2.5">Código</th>
 <th className="p-2.5">Descripción del Activo</th>
 <th className="p-2.5 text-center">Días</th>
 <th className="p-2.5 text-right">Tarifa / Día</th>
 <th className="p-2.5 text-right">Fianza Retenida</th>
 <th className="p-2.5 text-right">Total Alquiler</th>
 </tr>
 </thead>
 <tbody>
 <tr>
 <td className="p-2.5 font-mono">{alquilerSeleccionado.equipo?.codigo_interno}</td>
 <td className="p-2.5 font-bold">{alquilerSeleccionado.equipo?.nombre}</td>
 <td className="p-2.5 text-center">{alquilerSeleccionado.dias_pactados}</td>
 <td className="p-2.5 text-right">
 {settings.currency} {parseFloat(alquilerSeleccionado.tarifa_dia_aplicada).toFixed(2)}
 </td>
 <td className="p-2.5 text-right font-bold text-violet-600">
 {settings.currency} {parseFloat(alquilerSeleccionado.monto_garantia).toFixed(2)}
 </td>
 <td className="p-2.5 text-right font-black">
 {settings.currency} {parseFloat(alquilerSeleccionado.monto_alquiler).toFixed(2)}
 </td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Cláusulas */}
 <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-500 leading-relaxed space-y-1">
 <strong>Cláusulas de Arrendamiento:</strong>
 <p>
 1. El cliente declara recibir la maquinaria en óptimo estado de funcionamiento y se compromete a devolverla en la fecha pactada ({new Date(alquilerSeleccionado.fecha_estimada_devolucion).toLocaleDateString('es-PE')}).
 </p>
 <p>
 2. La fianza en custodia será liquidada y devuelta una vez inspeccionado el equipo y sus accesorios.
 </p>
 <p>
 3. Los días adicionales por mora o demoras en la devolución devengarán la tarifa diaria pactada más gastos administrativos.
 </p>
 </div>

 {/* Casillero de firmas */}
 <div className="pt-8 grid grid-cols-2 gap-8 text-center">
 <div className="border-t border-slate-300 pt-2">
 <span className="font-bold block text-xs">Entregado Conforme</span>
 <span className="text-[10px] text-slate-400">Responsable Almacén / Ferretería</span>
 </div>
 <div className="border-t border-slate-300 pt-2">
 <span className="font-bold block text-xs">Recibido Conforme</span>
 <span className="text-[10px] text-slate-400">Firma del Cliente / DNI</span>
 </div>
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
