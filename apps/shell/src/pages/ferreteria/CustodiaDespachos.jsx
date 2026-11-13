import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 Truck,
 HardHat,
 Search,
 Plus,
 RefreshCw,
 Clock,
 CheckCircle2,
 AlertTriangle,
 X,
 Check,
 Printer,
 Eye,
 MapPin,
 Calendar,
 User,
 Package,
 Boxes,
 ArrowRight,
 FileText,
 Phone,
 Trash2,
 Building2
} from 'lucide-react';
import { useSettingsStore } from '@heis/core';

export default function CustodiaDespachos() {
 const settings = useSettingsStore();
 const [custodias, setCustodias] = useState([]);
 const [productos, setProductos] = useState([]);
 const [clientes, setClientes] = useState([]);
 const [cargando, setCargando] = useState(true);
 const [busqueda, setBusqueda] = useState('');
 const [filtroEstado, setFiltroEstado] = useState('TODOS');

 // Modales
 const [modalNuevo, setModalNuevo] = useState(false);
 const [modalDespachar, setModalDespachar] = useState(false);
 const [modalGuia, setModalGuia] = useState(false);
 const [custodiaSeleccionada, setCustodiaSeleccionada] = useState(null);
 const [guardando, setGuardando] = useState(false);

 // Formulario Nueva Custodia
 const [idCliente, setIdCliente] = useState('');
 const [nombreCliente, setNombreCliente] = useState('');
 const [telefonoCliente, setTelefonoCliente] = useState('');
 const [direccionObra, setDireccionObra] = useState('');
 const [fechaEstimada, setFechaEstimada] = useState('');
 const [choferFlete, setChoferFlete] = useState('');
 const [vehiculoPlaca, setVehiculoPlaca] = useState('');
 const [observaciones, setObservaciones] = useState('');
 const [itemsCustodia, setItemsCustodia] = useState([]);

 // Buscador de productos para la custodia
 const [busqProd, setBusqProd] = useState('');
 const [mostrarDropProd, setMostrarDropProd] = useState(false);

 // Formulario Despachar a Obra
 const [despachoChofer, setDespachoChofer] = useState('');
 const [despachoPlaca, setDespachoPlaca] = useState('');
 const [despachoNotas, setDespachoNotas] = useState('');
 const [cantidadesADespachar, setCantidadesADespachar] = useState({});

 // Bloquear scroll de fondo cuando los modales estén abiertos
 useEffect(() => {
 if (modalNuevo || modalDespachar || modalGuia) {
 const originalOverflow = document.body.style.overflow;
 document.body.style.overflow = 'hidden';
 return () => {
 document.body.style.overflow = originalOverflow;
 };
 }
 }, [modalNuevo, modalDespachar, modalGuia]);

 const cargarDatos = async () => {
 setCargando(true);
 try {
 const [resCust, resProd, resCli] = await Promise.all([
 api.get('/inventario/custodias'),
 api.get('/productos?limit=250'),
 api.get('/clientes?limit=100').catch(() => ({ success: false, clientes: [] }))
 ]);

 if (resCust?.success) setCustodias(resCust.custodias || []);
 if (resProd?.success) setProductos(resProd.productos || []);
 if (resCli?.success) setClientes(resCli.clientes || []);
 } catch (e) {
 console.error('Error al cargar custodias y despachos:', e);
 const msg = e.response?.data?.error || e.response?.data?.message || e.message || 'Error al cargar custodias y despachos';
 toast.error(msg);
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 const abrirNuevaCustodia = () => {
 setIdCliente('');
 setNombreCliente('');
 setTelefonoCliente('');
 setDireccionObra('');
 setFechaEstimada('');
 setChoferFlete('');
 setVehiculoPlaca('');
 setObservaciones('');
 setItemsCustodia([]);
 setBusqProd('');
 setModalNuevo(true);
 };

 const seleccionarCliente = (cli) => {
 setIdCliente(cli.id);
 setNombreCliente(cli.nombre);
 setTelefonoCliente(cli.telefono || '');
 setDireccionObra(cli.direccion || '');
 };

 const agregarItemCustodia = (prod) => {
 const existe = itemsCustodia.find(i => i.id_producto === prod.id);
 if (existe) {
 toast.error('Este material ya está en la lista de custodia');
 return;
 }

 setItemsCustodia([
 ...itemsCustodia,
 {
 id_producto: prod.id,
 nombre: prod.nombre,
 unidad_medida: prod.unidad_medida || 'Unidad',
 stock_actual: parseFloat(prod.stock) || 0,
 cantidad: 10,
 observaciones: ''
 }
 ]);
 setBusqProd('');
 setMostrarDropProd(false);
 };

 const actualizarCantidadItem = (id_producto, cant) => {
 setItemsCustodia(
 itemsCustodia.map(i =>
 i.id_producto === id_producto ? { ...i, cantidad: Math.max(0.1, parseFloat(cant) || 0) } : i
 )
 );
 };

 const quitarItemCustodia = (id_producto) => {
 setItemsCustodia(itemsCustodia.filter(i => i.id_producto !== id_producto));
 };

 const handleGuardarCustodia = async (e) => {
 e.preventDefault();
 if (!nombreCliente.trim()) {
 return toast.error('Ingresa el nombre del cliente o contratista');
 }
 if (itemsCustodia.length === 0) {
 return toast.error('Agrega al menos un material a custodiar en patio');
 }

 setGuardando(true);
 try {
 const res = await api.post('/inventario/custodias', {
 id_cliente: idCliente || null,
 nombre_cliente: nombreCliente.trim(),
 telefono_cliente: telefonoCliente.trim(),
 direccion_obra: direccionObra.trim(),
 fecha_estimada_entrega: fechaEstimada || null,
 chofer_flete: choferFlete.trim(),
 vehiculo_placa: vehiculoPlaca.trim(),
 observaciones: observaciones.trim(),
 items: itemsCustodia.map(i => ({
 id_producto: i.id_producto,
 cantidad: i.cantidad,
 unidad_medida: i.unidad_medida,
 observaciones: i.observaciones
 }))
 });

 if (res.success) {
 toast.success(res.message || 'Orden de custodia registrada exitosamente');
 setModalNuevo(false);
 cargarDatos();
 }
 } catch (err) {
 toast.error(err.message || 'Error al registrar custodia');
 } finally {
 setGuardando(false);
 }
 };

 const abrirDespachar = (cust) => {
 setCustodiaSeleccionada(cust);
 setDespachoChofer(cust.chofer_flete || '');
 setDespachoPlaca(cust.vehiculo_placa || '');
 setDespachoNotas('');

 const initialCant = {};
 (cust.detalles || []).forEach(d => {
 initialCant[d.id] = parseFloat(d.cantidad_pendiente) || 0;
 });
 setCantidadesADespachar(initialCant);
 setModalDespachar(true);
 };

 const handleConfirmarDespacho = async (e) => {
 e.preventDefault();
 if (!custodiaSeleccionada) return;

 const itemsDespachoPayload = Object.entries(cantidadesADespachar).map(([idDetalle, cant]) => ({
 id_detalle: parseInt(idDetalle, 10),
 cantidad_a_entregar: parseFloat(cant) || 0
 })).filter(i => i.cantidad_a_entregar > 0);

 if (itemsDespachoPayload.length === 0) {
 return toast.error('Debes ingresar al menos una cantidad a despachar');
 }

 setGuardando(true);
 try {
 const res = await api.post('/inventario/custodias/despachar', {
 id_custodia: custodiaSeleccionada.id,
 chofer_flete: despachoChofer.trim(),
 vehiculo_placa: despachoPlaca.trim(),
 observaciones_despacho: despachoNotas.trim(),
 items_despacho: itemsDespachoPayload
 });

 if (res.success) {
 toast.success(res.message || 'Despacho a obra registrado exitosamente');
 setModalDespachar(false);
 setCustodiaSeleccionada(res.custodia);
 setModalGuia(true);
 cargarDatos();
 }
 } catch (err) {
 toast.error(err.message || 'Error al registrar el despacho a obra');
 } finally {
 setGuardando(false);
 }
 };

 const verGuia = (cust) => {
 setCustodiaSeleccionada(cust);
 setModalGuia(true);
 };

 // Métricas
 const totalEnCustodia = custodias.filter(c => c.estado !== 'Completado' && c.estado !== 'Cancelado').length;
 const entregasCompletadas = custodias.filter(c => c.estado === 'Completado').length;
 const bultosTotales = custodias.reduce((acc, c) => acc + (parseFloat(c.total_bultos) || 0), 0);

 const custodiasFiltradas = custodias.filter(c => {
 const matchBusq = !busqueda ||
 c.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
 c.nombre_cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
 (c.direccion_obra && c.direccion_obra.toLowerCase().includes(busqueda.toLowerCase()));

 if (!matchBusq) return false;
 if (filtroEstado !== 'TODOS') return c.estado === filtroEstado;
 return true;
 });

 return (
 <div className="space-y-4">
 {/* ─── TARJETAS DE INDICADORES / KPIS DE CUSTODIA & OBRA ─── */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5">
 {/* KPI 1: Órdenes Activas en Patio */}
 <button
 type="button"
 onClick={() => setFiltroEstado(filtroEstado === 'En Custodia' ? 'TODOS' : 'En Custodia')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtroEstado === 'En Custodia'
 ? 'border-amber-500 dark:border-amber-500 ring-2 ring-amber-500/25 shadow-md shadow-amber-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors truncate min-w-0">
 Custodia Activa
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-amber-500/25 transition-all duration-200">
 <HardHat className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight truncate">
 {totalEnCustodia}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Materiales en patio
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 shrink-0 whitespace-nowrap">
 {filtroEstado === 'En Custodia' ? 'Filtrando' : 'Pendientes'}
 </span>
 </div>
 </button>

 {/* KPI 2: Total Bultos Comprometidos */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate min-w-0">
 Bultos Comprometidos
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100/80 dark:border-indigo-800/60 flex items-center justify-center shrink-0 group-hover:bg-indigo-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-indigo-600/25 transition-all duration-200">
 <Boxes className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight truncate">
 {bultosTotales.toFixed(0)}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Sacos, fierros y tubos
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full border border-indigo-200/80 dark:border-indigo-800/60 shrink-0 whitespace-nowrap">
 Comprometido
 </span>
 </div>
 </div>

 {/* KPI 3: Despachos / Fletes Hoy */}
 <button
 type="button"
 onClick={() => setFiltroEstado(filtroEstado === 'Entrega Parcial' ? 'TODOS' : 'Entrega Parcial')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtroEstado === 'Entrega Parcial'
 ? 'border-emerald-500 dark:border-emerald-500 ring-2 ring-emerald-500/25 shadow-md shadow-emerald-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate min-w-0">
 Fletes a Obra
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100/80 dark:border-emerald-800/60 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-emerald-600/25 transition-all duration-200">
 <Truck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight truncate">
 {custodias.filter(c => c.estado === 'Entrega Parcial').length}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Despacho fraccionado
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 whitespace-nowrap">
 {filtroEstado === 'Entrega Parcial' ? 'Filtrando' : 'En Ruta'}
 </span>
 </div>
 </button>

 {/* KPI 4: Entregas Completadas */}
 <button
 type="button"
 onClick={() => setFiltroEstado(filtroEstado === 'Completado' ? 'TODOS' : 'Completado')}
 className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 ease-out text-left select-none overflow-hidden flex flex-col justify-between cursor-pointer ${
 filtroEstado === 'Completado'
 ? 'border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/25 shadow-md shadow-blue-500/10'
 : 'border-slate-200/90 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md hover:shadow-blue-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99]'
 }`}
 >
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />
 <div>
 <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
 <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate min-w-0">
 Completadas 100%
 </span>
 <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100/80 dark:border-blue-800/60 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-md group-hover:shadow-blue-600/25 transition-all duration-200">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 tracking-tight truncate">
 {entregasCompletadas}
 </div>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
 <span className="text-slate-500 dark:text-slate-400 font-medium min-w-0 truncate text-[11px] sm:text-xs">
 Despachos liquidados
 </span>
 <span className="text-[9.5px] sm:text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/80 dark:border-blue-800/60 shrink-0 whitespace-nowrap">
 {filtroEstado === 'Completado' ? 'Filtrando' : 'Entregado'}
 </span>
 </div>
 </button>
 </div>

 {/* ─── BARRA DE BÚSQUEDA, FILTROS Y NUEVA CUSTODIA ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 shadow-card-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 min-w-0">
          <div className="relative w-full sm:max-w-xs md:max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código, cliente o dirección..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-850 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold overflow-x-auto no-scrollbar scroll-smooth">
            {['TODOS', 'Pendiente', 'Entrega Parcial', 'Completado'].map((est) => (
              <button
                key={est}
                type="button"
                onClick={() => setFiltroEstado(est)}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer text-[11px] shrink-0 whitespace-nowrap ${
                  filtroEstado === est
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs font-extrabold'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {est}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={cargarDatos}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Recargar datos"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={abrirNuevaCustodia}
            className="flex-1 md:flex-initial px-3.5 sm:px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 shrink-0" />
            <span>Nueva Custodia <span className="hidden xs:inline">en Patio</span></span>
          </button>
        </div>
      </div>

      {/* ─── TABLA DE CUSTODIAS Y ENTREGAS ─── */}
 <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-card-soft overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10.5px] font-extrabold ">
 <tr>
 <th className="py-2.5 px-3.5 whitespace-nowrap">CÓDIGO</th>
 <th className="py-2.5 px-3.5 min-w-[180px]">CLIENTE / CONTACTO</th>
 <th className="py-2.5 px-3.5 min-w-[180px]">OBRA / DESTINO</th>
 <th className="py-2.5 px-3.5 min-w-[280px]">MATERIALES EN CUSTODIA (AVANCE)</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ESTADO</th>
 <th className="py-2.5 px-3.5 text-center whitespace-nowrap">ACCIONES</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {cargando ? (
 <tr>
 <td colSpan="6" className="p-8 text-center text-slate-400 text-xs">
 Cargando órdenes de custodia y despachos...
 </td>
 </tr>
 ) : custodiasFiltradas.length === 0 ? (
 <tr>
 <td colSpan="6" className="p-10 text-center text-slate-400 text-xs italic">
 No se encontraron órdenes de custodia con los filtros actuales.
 </td>
 </tr>
 ) : (
 custodiasFiltradas.map((c) => {
 const esCompletado = c.estado === 'Completado';
 const esParcial = c.estado === 'Entrega Parcial';

 return (
 <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
 {/* Código y Fecha */}
 <td className="py-2.5 px-3.5 whitespace-nowrap">
 <div className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs">
 {c.codigo}
 </div>
 <div className="text-[10px] text-slate-400 font-medium">
 {new Date(c.fecha_emision).toLocaleDateString('es-PE')}
 </div>
 </td>

 {/* Cliente */}
 <td className="py-2.5 px-3.5">
 <div className="font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
 {c.nombre_cliente}
 </div>
 {c.telefono_cliente && (
 <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
 <Phone className="w-2.5 h-2.5" />
 <span>{c.telefono_cliente}</span>
 </div>
 )}
 </td>

 {/* Obra */}
 <td className="py-2.5 px-3.5 text-slate-600 dark:text-slate-300">
 {c.direccion_obra ? (
 <div className="flex items-start gap-1 text-[11px]">
 <MapPin className="w-3 h-3 text-rose-500 shrink-0 mt-0.5" />
 <span className="line-clamp-2">{c.direccion_obra}</span>
 </div>
 ) : (
 <span className="text-slate-400 italic text-[11px]">En patio (por definir)</span>
 )}
 {c.fecha_estimada_entrega && (
 <div className="text-[9.5px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-1">
 <Calendar className="w-2.5 h-2.5" />
 <span>Límite: {new Date(c.fecha_estimada_entrega).toLocaleDateString('es-PE')}</span>
 </div>
 )}
 </td>

 {/* Detalle de Materiales con Progreso */}
 <td className="py-2.5 px-3.5">
 <div className="space-y-1.5">
 {(c.detalles || []).map((d) => {
 const tot = parseFloat(d.cantidad_total) || 0;
 const ent = parseFloat(d.cantidad_entregada) || 0;
 const pend = parseFloat(d.cantidad_pendiente) || 0;
 const pct = tot > 0 ? Math.min(100, Math.round((ent / tot) * 100)) : 0;

 return (
 <div key={d.id} className="text-xs bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
 <div className="flex items-center justify-between gap-1 mb-1 font-semibold text-[11px]">
 <span className="text-slate-900 dark:text-slate-100 truncate">{d.producto?.nombre || 'Material'}</span>
 <span className="font-mono text-slate-500 shrink-0">
 <strong className="text-emerald-600 dark:text-emerald-400">{ent}</strong> / {tot} {d.unidad_medida}
 </span>
 </div>
 <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
 <div
 className={`h-full transition-all ${
 pct === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
 }`}
 style={{ width: `${pct}%` }}
 />
 </div>
 {pend > 0 && (
 <div className="text-[9.5px] text-amber-600 dark:text-amber-400 font-bold mt-0.5 text-right">
 Falta enviar: {pend} {d.unidad_medida}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </td>

 {/* Estado */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <span
 className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
 esCompletado
 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800'
 : esParcial
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800'
 : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800'
 }`}
 >
 <span
 className={`w-1.5 h-1.5 rounded-full ${
 esCompletado ? 'bg-emerald-500' : esParcial ? 'bg-indigo-500' : 'bg-amber-500 animate-pulse'
 }`}
 />
 <span>{c.estado}</span>
 </span>
 </td>

 {/* Acciones */}
 <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
 <div className="flex items-center justify-center gap-1">
 {!esCompletado && (
 <button
 type="button"
 onClick={() => abrirDespachar(c)}
 className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
 >
 <Truck className="w-3 h-3" />
 <span>Despachar</span>
 </button>
 )}
 <button
 type="button"
 onClick={() => verGuia(c)}
 className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
 >
 <Eye className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 );
 })
 )}
 </tbody>
 </table>
 </div>
 </div>

 {/* ─── MODAL NUEVA ORDEN DE CUSTODIA (MATERIALES GUARDADOS EN PATIO) ─── */}
      {modalNuevo && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop estático e independiente */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setModalNuevo(false)}
            aria-hidden="true"
          />

          {/* Contenedor centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
            onClick={() => setModalNuevo(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera del Modal */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <HardHat className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      Nueva Custodia de Materiales en Patio
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      Venta pendiente de entrega programada en flete
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalNuevo(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                  title="Cerrar modal"
                >
                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Formulario con cuerpo scrolleable y pie fijo */}
              <form onSubmit={handleGuardarCustodia} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-6 space-y-3.5 sm:space-y-4">
                  {/* Cliente y Obra */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Cliente / Contratista <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Constructora Los Álamos S.A.C."
                        value={nombreCliente}
                        onChange={(e) => setNombreCliente(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        required
                      />

                      {/* Sugerencias de Clientes */}
                      {clientes.length > 0 && !idCliente && (
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          <span className="text-[10px] text-slate-400">Sugerir:</span>
                          {clientes.slice(0, 3).map(cli => (
                            <button
                              key={cli.id}
                              type="button"
                              onClick={() => seleccionarCliente(cli)}
                              className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 cursor-pointer"
                            >
                              {cli.nombre.split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Teléfono de Contacto (para flete)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 987654321"
                        value={telefonoCliente}
                        onChange={(e) => setTelefonoCliente(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Dirección de la Obra / Punto de Descarga
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Mz. D Lt. 14 - Urb. San Antonio (Frente al colegio)"
                        value={direccionObra}
                        onChange={(e) => setDireccionObra(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>

                  {/* Agregar Materiales */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Materiales en Custodia en Patio <span className="text-rose-500">*</span>
                    </label>

                    {/* Buscador de Producto */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar cemento, fierro, arena, ladrillos para agregar a la custodia..."
                        value={busqProd}
                        onChange={(e) => {
                          setBusqProd(e.target.value);
                          setMostrarDropProd(true);
                        }}
                        onFocus={() => setMostrarDropProd(true)}
                        className="w-full pl-8 pr-7 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />

                      {/* Dropdown de Resultados */}
                      {mostrarDropProd && busqProd && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl max-h-48 overflow-y-auto z-20 divide-y divide-slate-100 dark:divide-slate-700/60">
                          {productos
                            .filter(p => p.nombre.toLowerCase().includes(busqProd.toLowerCase()) || (p.codigo_barras && p.codigo_barras.includes(busqProd)))
                            .slice(0, 8)
                            .map(p => (
                              <div
                                key={p.id}
                                onClick={() => agregarItemCustodia(p)}
                                className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 cursor-pointer flex items-center justify-between text-xs transition-colors"
                              >
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-slate-100">{p.nombre}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    Stock actual en patio: {p.stock} {p.unidad_medida}
                                  </div>
                                </div>
                                <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold">
                                  Agregar
                                </span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Lista de Items Agregados */}
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                      {itemsCustodia.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs italic">
                          No hay materiales en la lista. Busca arriba y agrégalos.
                        </div>
                      ) : (
                        itemsCustodia.map(i => (
                          <div key={i.id_producto} className="p-2.5 flex items-center justify-between gap-2 sm:gap-3 text-xs bg-white dark:bg-slate-900">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{i.nombre}</div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Stock actual: {i.stock_actual} {i.unidad_medida}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                              <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={i.cantidad}
                                onChange={(e) => actualizarCantidadItem(i.id_producto, e.target.value)}
                                className="w-16 sm:w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-black text-center text-xs"
                              />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 w-10 sm:w-12 truncate">{i.unidad_medida}</span>
                              <button
                                type="button"
                                onClick={() => quitarItemCustodia(i.id_producto)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                title="Quitar material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Fecha Límite y Notas */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fecha Límite Estimada para Recojo/Flete
                      </label>
                      <input
                        type="date"
                        value={fechaEstimada}
                        onChange={(e) => setFechaEstimada(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Observaciones / Indicaciones Especiales
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Llamar 2 horas antes de enviar; cliente pone peones para descargar..."
                        value={observaciones}
                        onChange={(e) => setObservaciones(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
                <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 z-20">
                  <div className="text-[10.5px] sm:text-[11px] text-slate-400 font-medium order-2 sm:order-1 text-center sm:text-left">
                    <span className="text-indigo-600 dark:text-indigo-400 font-bold">{itemsCustodia.length}</span> {itemsCustodia.length === 1 ? 'material agregado' : 'materiales agregados'} a custodiar
                  </div>

                  <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setModalNuevo(false)}
                      className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={guardando || itemsCustodia.length === 0}
                      className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                    >
                      {guardando ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Guardando...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 shrink-0" />
                          <span>Crear Orden de Custodia</span>
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
      )}

      {/* ─── MODAL DESPACHAR A OBRA (SALIDA DE FLETE) ─── */}
      {modalDespachar && custodiaSeleccionada && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop estático e independiente */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setModalDespachar(false)}
            aria-hidden="true"
          />

          {/* Contenedor centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
            onClick={() => setModalDespachar(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera del Modal */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      Registrar Despacho / Flete a Obra
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      {custodiaSeleccionada.codigo} • {custodiaSeleccionada.nombre_cliente}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalDespachar(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                  title="Cerrar modal"
                >
                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Formulario con cuerpo scrolleable y pie fijo */}
              <form onSubmit={handleConfirmarDespacho} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-modal-scroll p-3.5 sm:p-5 space-y-4">
                  {/* Información de Transporte */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Chofer / Transportista
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: Raúl Chofer (Camión FUSO)"
                        value={despachoChofer}
                        onChange={(e) => setDespachoChofer(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Placa del Vehículo
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: ABC-789"
                        value={despachoPlaca}
                        onChange={(e) => setDespachoPlaca(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                      />
                    </div>
                  </div>

                  {/* Cantidades a enviar hoy */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Cantidades a Despachar en este Viaje
                    </label>
                    <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                      {(custodiaSeleccionada.detalles || []).map((d) => {
                        const pend = parseFloat(d.cantidad_pendiente) || 0;
                        if (pend <= 0) return null;

                        return (
                          <div key={d.id} className="p-2.5 flex items-center justify-between gap-2 sm:gap-3 text-xs bg-white dark:bg-slate-900">
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{d.producto?.nombre}</div>
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                                Pendiente en patio: {pend} {d.unidad_medida}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] text-slate-500 hidden sm:inline">Enviar:</span>
                              <input
                                type="number"
                                min="0"
                                max={pend}
                                step="0.1"
                                value={cantidadesADespachar[d.id] ?? pend}
                                onChange={(e) => {
                                  const val = Math.min(pend, Math.max(0, parseFloat(e.target.value) || 0));
                                  setCantidadesADespachar({
                                    ...cantidadesADespachar,
                                    [d.id]: val
                                  });
                                }}
                                className="w-16 sm:w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-mono font-black text-center text-xs"
                              />
                              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 w-10 sm:w-12 truncate">{d.unidad_medida}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nota del Despacho
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Entrega de primer lote para vaciado de zapatas..."
                      value={despachoNotas}
                      onChange={(e) => setDespachoNotas(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
                    />
                  </div>
                </div>

                {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
                <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 shrink-0 z-20">
                  <button
                    type="button"
                    onClick={() => setModalDespachar(false)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando}
                    className="flex-1 sm:flex-initial px-4 sm:px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
                  >
                    {guardando ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Despachando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 shrink-0" />
                        <span>Emitir Guía & Despachar</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL GUÍA DE DESPACHO A OBRA (VISTA IMPRESIÓN / CONFORMIDAD) ─── */}
      {modalGuia && custodiaSeleccionada && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
          {/* Backdrop estático e independiente */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={() => setModalGuia(false)}
            aria-hidden="true"
          />

          {/* Contenedor centrado */}
          <div
            className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4 overflow-hidden pointer-events-auto"
            onClick={() => setModalGuia(false)}
          >
            <div
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col text-left relative z-10 animate-in zoom-in-95 duration-200 overflow-hidden cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Cabecera del Modal */}
              <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-slate-50/90 dark:bg-slate-800/90 rounded-t-3xl shrink-0 z-20 backdrop-blur-xs">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
                    <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-1">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                      Guía de Despacho & Entrega a Obra
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate">
                      {custodiaSeleccionada.codigo}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalGuia(false)}
                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0 touch-manipulation shadow-2xs"
                  title="Cerrar guía"
                >
                  <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>

              {/* Documento Imprimible con cuerpo scrolleable */}
              <div className="flex-1 overflow-y-auto custom-modal-scroll p-4 sm:p-6 space-y-4 text-xs text-slate-800 dark:text-slate-200">
                <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3 space-y-0.5">
                  <h2 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight ">
                    {settings.businessName || 'FERRETERÍA HEIS'}
                  </h2>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">RUC: {settings.businessRuc || '20600000000'}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500">{settings.address || 'Almacén & Patio Central'}</div>
                  <div className="pt-2 font-mono font-black text-indigo-600 dark:text-indigo-400 text-sm">
                    GUÍA DE DESPACHO A OBRA: {custodiaSeleccionada.codigo}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div>
                    <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">CLIENTE / RECEPTOR</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{custodiaSeleccionada.nombre_cliente}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">TELÉFONO</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{custodiaSeleccionada.telefono_cliente || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">DIRECCIÓN DE LA OBRA</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{custodiaSeleccionada.direccion_obra || 'Entrega en mostrador'}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">FECHA DE EMISIÓN</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(custodiaSeleccionada.fecha_emision).toLocaleDateString('es-PE')}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">ESTADO</span>
                    <span className="font-black text-emerald-600 dark:text-emerald-400">{custodiaSeleccionada.estado}</span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-400 dark:text-slate-500 block text-[9.5px]">CHOFER & VEHÍCULO FLETE</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {custodiaSeleccionada.chofer_flete || 'Transporte Interno'} {custodiaSeleccionada.vehiculo_placa ? `(Placa: ${custodiaSeleccionada.vehiculo_placa})` : ''}
                    </span>
                  </div>
                </div>

                {/* Detalle de Materiales */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[340px]">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-[10px] uppercase">
                      <tr>
                        <th className="p-2">Material</th>
                        <th className="p-2 text-center">Total</th>
                        <th className="p-2 text-center">Entregado</th>
                        <th className="p-2 text-center">Pendiente</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(custodiaSeleccionada.detalles || []).map((d) => (
                        <tr key={d.id}>
                          <td className="p-2 font-bold text-slate-900 dark:text-slate-100">{d.producto?.nombre || 'Material'}</td>
                          <td className="p-2 text-center font-mono">{d.cantidad_total} {d.unidad_medida}</td>
                          <td className="p-2 text-center font-mono font-black text-emerald-600 dark:text-emerald-400">{d.cantidad_entregada} {d.unidad_medida}</td>
                          <td className="p-2 text-center font-mono font-black text-amber-600 dark:text-amber-400">{d.cantidad_pendiente} {d.unidad_medida}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {custodiaSeleccionada.observaciones && (
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 italic">
                    Nota: {custodiaSeleccionada.observaciones}
                  </div>
                )}

                {/* Firmas de Conformidad */}
                <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-6 text-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
                    Despachado por (Almacén)
                  </div>
                  <div className="border-t border-slate-300 dark:border-slate-700 pt-1">
                    Recibido en Obra (Firma y DNI)
                  </div>
                </div>
              </div>

              {/* ─── PIE FIJO CON ACCIONES (SHRINK-0 Z-20) ─── */}
              <div className="p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0 z-20">
                <button
                  type="button"
                  onClick={() => setModalGuia(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer text-center"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>Imprimir Guía de Entrega</span>
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
