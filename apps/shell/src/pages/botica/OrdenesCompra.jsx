import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
  PackageCheck,
  Plus,
  PlusCircle,
  Search,
  Building2,
  Calendar,
  DollarSign,
  CheckCircle2,
  Printer,
  X,
  FileText,
  Boxes,
  Sparkles,
  Clock,
  Ban,
  Truck,
  Eye,
  Check,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import DropdownPill from './components/DropdownPill';
import DatePickerPill from './components/DatePickerPill';
import ModalRegistrarDrogueria from './components/ModalRegistrarDrogueria';
import { useAuthStore } from '@heis/core';
import { useSucursalStore } from '@heis/core';

const ESTADOS_FILTRO = [
  { id: 'TODOS', label: 'Todas' },
  { id: 'Pendiente', label: 'Pendientes' },
  { id: 'Aprobada', label: 'Aprobadas' },
  { id: 'Atendida', label: 'Atendidas (Facturadas)' },
  { id: 'Cancelada', label: 'Canceladas' }
];

const CONDICIONES_PAGO = [
  { value: 'Contado', label: 'Contado', subtitle: 'Cancelación inmediata contra entrega' },
  { value: 'Credito', label: 'Crédito', subtitle: 'Pago pactado a plazo con droguería' }
];

export default function OrdenesCompra() {
  const { user } = useAuthStore();
  const { sucursalActiva } = useSucursalStore();

  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [medicamentos, setMedicamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Modal Nueva Orden
  const [modalNuevaOrden, setModalNuevaOrden] = useState(false);
  const [modalNuevaDrogueria, setModalNuevaDrogueria] = useState(false);
  const [guardandoOrden, setGuardandoOrden] = useState(false);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [condicionPago, setCondicionPago] = useState('Contado');
  const [creditoDias, setCreditoDias] = useState(30);
  const [observaciones, setObservaciones] = useState('');
  const [itemsOrden, setItemsOrden] = useState([]);
  const [busquedaMed, setBusquedaMed] = useState('');

  // Modal Detalle / Hoja de Pedido
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const printHojaRef = useRef(null);

  // Modal Recepción y Conversión a Factura
  const [modalRecepcionOpen, setModalRecepcionOpen] = useState(false);
  const [ordenParaRecepcionar, setOrdenParaRecepcionar] = useState(null);
  const [datosFactura, setDatosFactura] = useState({
    serie: 'F001',
    numero: '',
    tipo_comprobante: 'Factura',
    fecha_emision: new Date().toISOString().split('T')[0],
    guia_remision: '',
    tipo_pago: 'Contado',
    credito_dias: 30,
    notas: ''
  });
  const [itemsRecepcion, setItemsRecepcion] = useState([]);
  const [procesandoRecepcion, setProcesandoRecepcion] = useState(false);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resOrd, resProv, resMeds] = await Promise.all([
        api.get('/ordenes-compra'),
        api.get('/compras/proveedores'),
        api.get('/medicamentos?limit=150')
      ]);

      const dataOrd = resOrd?.data || resOrd;
      const dataProv = resProv?.data || resProv;
      const dataMeds = resMeds?.data || resMeds;

      if (dataOrd?.success) setOrdenes(dataOrd.ordenes || []);
      if (dataProv?.success) setProveedores(dataProv.proveedores || []);
      if (dataMeds?.success) setMedicamentos(dataMeds.medicamentos || []);
    } catch (error) {
      console.error('Error cargando datos de órdenes:', error);
      toast.error('Error al sincronizar órdenes de compra');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Atajo ESC para cerrar modales
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (modalNuevaOrden) setModalNuevaOrden(false);
        if (modalDetalleOpen) setModalDetalleOpen(false);
        if (modalRecepcionOpen) setModalRecepcionOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalNuevaOrden, modalDetalleOpen, modalRecepcionOpen]);

  // Cargar Sugerencias de Reposición por Stock Mínimo
  const cargarSugerenciasStockMinimo = async () => {
    try {
      toast.loading('Analizando stock bajo y puntos de reposición...', { id: 'sug-stock' });
      const rawRes = await api.get('/ordenes-compra/sugerencias-reposicion');
      const res = rawRes?.data || rawRes;
      if (res?.success && res.sugerencias?.length > 0) {
        toast.dismiss('sug-stock');
        const itemsSugeridos = res.sugerencias.map(s => ({
          id_medicamento: s.id_medicamento,
          nombre: s.nombre,
          concentracion: s.concentracion,
          laboratorio: s.laboratorio,
          presentacion: s.presentacion,
          stock_actual: s.stock_actual,
          cantidad_cajas_solicitada: s.cantidad_sugerida,
          cantidad_fracciones_solicitada: 0,
          precio_unitario_estimado: s.costo_referencial
        }));

        setItemsOrden(itemsSugeridos);
        setModalNuevaOrden(true);
        toast.success(`Se agregaron ${itemsSugeridos.length} medicamentos con stock bajo al pedido.`);
      } else {
        toast.dismiss('sug-stock');
        toast.success('El inventario se encuentra abastecido. No hay medicamentos por debajo del stock mínimo.');
      }
    } catch (err) {
      toast.dismiss('sug-stock');
      toast.error('Error al calcular reposición de stock');
    }
  };

  // Agregar ítem manual a la orden
  const agregarItemOrden = (med) => {
    const existe = itemsOrden.find(i => i.id_medicamento === med.id);
    if (existe) {
      toast.error('Este producto ya está en la lista del pedido.');
      return;
    }

    setItemsOrden(prev => [
      ...prev,
      {
        id_medicamento: med.id,
        nombre: med.nombre_comercial,
        concentracion: med.concentracion,
        laboratorio: med.laboratorio,
        presentacion: med.presentacion,
        stock_actual: med.stock_cajas,
        cantidad_cajas_solicitada: 1,
        cantidad_fracciones_solicitada: 0,
        precio_unitario_estimado: parseFloat(med.precio_compra) || 0
      }
    ]);
    setBusquedaMed('');
  };

  const actualizarItemOrden = (idMed, campo, valor) => {
    setItemsOrden(prev =>
      prev.map(item => {
        if (item.id_medicamento === idMed) {
          return { ...item, [campo]: valor };
        }
        return item;
      })
    );
  };

  const eliminarItemOrden = (idMed) => {
    setItemsOrden(prev => prev.filter(i => i.id_medicamento !== idMed));
  };

  // Totales de la nueva orden
  const totalEstimadoNuevaOrden = itemsOrden.reduce((acc, it) => {
    const cant = parseFloat(it.cantidad_cajas_solicitada) || 0;
    const precio = parseFloat(it.precio_unitario_estimado) || 0;
    return acc + (cant * precio);
  }, 0);

  // Guardar Orden
  const handleGuardarOrden = async (e) => {
    e.preventDefault();
    if (!proveedorSeleccionado) {
      toast.error('Debe seleccionar la Droguería o Laboratorio.');
      return;
    }
    if (itemsOrden.length === 0) {
      toast.error('Debe agregar al menos un medicamento a la orden de compra.');
      return;
    }

    setGuardandoOrden(true);
    try {
      const payload = {
        id_proveedor: proveedorSeleccionado,
        fecha_entrega_esperada: fechaEntrega || null,
        condicion_pago: condicionPago,
        credito_dias: creditoDias,
        observaciones,
        items: itemsOrden.map(it => ({
          id_medicamento: it.id_medicamento,
          cantidad_cajas_solicitada: parseFloat(it.cantidad_cajas_solicitada) || 1,
          cantidad_fracciones_solicitada: parseInt(it.cantidad_fracciones_solicitada) || 0,
          precio_unitario_estimado: parseFloat(it.precio_unitario_estimado) || 0
        }))
      };

      const rawRes = await api.post('/ordenes-compra', payload);
      const res = rawRes?.data || rawRes;
      if (res?.success) {
        toast.success(res.message || 'Orden de Compra generada.');
        setModalNuevaOrden(false);
        setItemsOrden([]);
        setProveedorSeleccionado('');
        setObservaciones('');
        await cargarDatos();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al emitir orden de compra');
    } finally {
      setGuardandoOrden(false);
    }
  };

  // Cambiar Estado (Aprobar o Cancelar)
  const handleCambiarEstado = async (idOrden, nuevoEstado) => {
    try {
      const rawRes = await api.put(`/ordenes-compra/${idOrden}/estado`, { estado: nuevoEstado });
      const res = rawRes?.data || rawRes;
      if (res?.success) {
        toast.success(`Orden marcada como ${nuevoEstado}.`);
        await cargarDatos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar estado de la orden');
    }
  };

  // Abrir Modal de Recepción y Conversión
  const abrirModalRecepcion = (ord) => {
    setOrdenParaRecepcionar(ord);
    setDatosFactura({
      serie: 'F001',
      numero: '',
      tipo_comprobante: 'Factura',
      fecha_emision: new Date().toISOString().split('T')[0],
      guia_remision: '',
      tipo_pago: ord.condicion_pago || 'Contado',
      credito_dias: ord.credito_dias || 30,
      notas: `Recepcionado desde Orden ${ord.codigo_orden}`
    });

    const itemsPrep = (ord.detalles || []).map(d => ({
      id_medicamento: d.id_medicamento,
      nombre: d.medicamento?.nombre_comercial || 'Medicamento',
      concentracion: d.medicamento?.concentracion || '',
      laboratorio: d.medicamento?.laboratorio || '',
      presentacion: d.medicamento?.presentacion || '',
      cantidad_cajas: parseFloat(d.cantidad_cajas_solicitada) || 1,
      precio_unitario: parseFloat(d.precio_unitario_estimado) || 0,
      numero_lote: '',
      fecha_vencimiento: '',
      registro_sanitario: ''
    }));

    setItemsRecepcion(itemsPrep);
    setModalRecepcionOpen(true);
  };

  const actualizarItemRecepcion = (idx, campo, valor) => {
    setItemsRecepcion(prev => {
      const copia = [...prev];
      copia[idx][campo] = valor;
      return copia;
    });
  };

  const handleConfirmarRecepcion = async (e) => {
    e.preventDefault();
    if (!datosFactura.serie || !datosFactura.numero) {
      toast.error('Debe ingresar la Serie y Número de la Factura SUNAT.');
      return;
    }

    // Validar que cada ítem tenga lote y vencimiento
    for (const it of itemsRecepcion) {
      if (!it.numero_lote || !it.numero_lote.trim()) {
        toast.error(`Debe ingresar el N° de Lote para ${it.nombre}`);
        return;
      }
      if (!it.fecha_vencimiento) {
        toast.error(`Debe ingresar la fecha de vencimiento para ${it.nombre}`);
        return;
      }
    }

    setProcesandoRecepcion(true);
    try {
      const payload = {
        serie: datosFactura.serie,
        numero: datosFactura.numero,
        tipo_comprobante: datosFactura.tipo_comprobante,
        fecha_emision: datosFactura.fecha_emision,
        guia_remision: datosFactura.guia_remision,
        tipo_pago: datosFactura.tipo_pago,
        credito_dias: datosFactura.credito_dias,
        notas: datosFactura.notas,
        items: itemsRecepcion
      };

      const rawRes = await api.post(`/ordenes-compra/${ordenParaRecepcionar.id}/recepcionar-compra`, payload);
      const res = rawRes?.data || rawRes;
      if (res?.success) {
        toast.success(res.message || 'Orden recepcionada y convertida a Factura exitosamente.');
        setModalRecepcionOpen(false);
        await cargarDatos();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Error al recepcionar orden');
    } finally {
      setProcesandoRecepcion(false);
    }
  };

  // Filtrado de órdenes
  const ordenesFiltradas = ordenes.filter(o => {
    const matchEstado = filtroEstado === 'TODOS' || o.estado === filtroEstado;
    const matchBusq = !busqueda.trim() ||
      o.codigo_orden?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.proveedor?.razon_social?.toLowerCase().includes(busqueda.toLowerCase()) ||
      o.proveedor?.numero_documento?.includes(busqueda);
    return matchEstado && matchBusq;
  });

  return (
    <div className="space-y-4 font-sora">
      {/* ─── BARRA SUPERIOR Y ACCIONES RÁPIDAS ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-2xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shadow-xs shrink-0">
            <PackageCheck className="w-5 h-5 text-[#00B884]" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
                Órdenes de Compra & Pedidos a Droguerías
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60">
                Abastecimiento Preventivo
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Formulación de pedidos por punto de reposición, seguimiento con laboratorios y conversión a facturas fiscales al arribo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
          <button
            type="button"
            onClick={cargarSugerenciasStockMinimo}
            className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-102 active:scale-98"
            title="Calcular automáticamente medicamentos con stock bajo o agotados para pedir reposición"
          >
            <Sparkles className="w-4 h-4 text-amber-600 animate-spin-slow" />
            <span>Sugerir por Stock Mínimo</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setItemsOrden([]);
              setProveedorSeleccionado('');
              setObservaciones('');
              setModalNuevaOrden(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs shadow-emerald-900/20 hover:scale-102 active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden de Pedido</span>
          </button>
        </div>
      </div>

      {/* ─── FILTROS Y BÚSQUEDA ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xs">
        {/* Píldoras de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {ESTADOS_FILTRO.map(est => {
            const count = est.id === 'TODOS'
              ? ordenes.length
              : ordenes.filter(o => o.estado === est.id).length;
            const activo = filtroEstado === est.id;

            return (
              <button
                key={est.id}
                type="button"
                onClick={() => setFiltroEstado(est.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activo
                    ? 'bg-[#00855E] text-white shadow-xs ring-1 ring-[#00855E]'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                <span>{est.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activo ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código, RUC o droguería..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* ─── TABLA DE ÓRDENES DE COMPRA ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FCFA] dark:bg-slate-950/60 border-b border-[#D1F4E3]/60 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider font-sora">
              <tr>
                <th className="py-3 px-4">Código & Emisión</th>
                <th className="py-3 px-4">Droguería / Laboratorio</th>
                <th className="py-3 px-4 text-center">Condición Pago</th>
                <th className="py-3 px-4 text-center">Productos</th>
                <th className="py-3 px-4 text-right">Total Estimado</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sora">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                      <span>Cargando órdenes de compra...</span>
                    </div>
                  </td>
                </tr>
              ) : ordenesFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-1.5">
                      <PackageCheck className="w-8 h-8 text-slate-300" />
                      <p className="font-bold text-slate-600 dark:text-slate-300">No hay órdenes de compra registradas.</p>
                      <p className="text-[11px] text-slate-400">Crea un nuevo pedido o genera uno con la sugerencia de stock mínimo.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                ordenesFiltradas.map(ord => {
                  const pendiente = ord.estado === 'Pendiente';
                  const aprobada = ord.estado === 'Aprobada';
                  const atendida = ord.estado === 'Atendida';
                  const cancelada = ord.estado === 'Cancelada';

                  return (
                    <tr key={ord.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-1.5">
                          <span>{ord.codigo_orden}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans font-normal mt-0.5">
                          Emisión: {ord.fecha_emision}
                          {ord.fecha_entrega_esperada && ` • Entrega: ${ord.fecha_entrega_esperada}`}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {ord.proveedor?.razon_social || 'Proveedor no especificado'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          RUC: {ord.proveedor?.numero_documento}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.condicion_pago === 'Credito'
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {ord.condicion_pago} {ord.condicion_pago === 'Credito' && `(${ord.credito_dias}d)`}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                        {ord.detalles?.length || 0} medicamentos
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        S/ {parseFloat(ord.total_estimado || 0).toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          pendiente
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200'
                            : aprobada
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200'
                            : atendida
                            ? 'bg-[#EBFDF6] text-[#00855E] dark:bg-emerald-950/60 dark:text-[#5EEBB8] border border-[#A6F6D8]'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {pendiente && <Clock className="w-3 h-3 text-amber-600" />}
                          {aprobada && <Check className="w-3 h-3 text-blue-600" />}
                          {atendida && <CheckCircle2 className="w-3 h-3 text-[#00B884]" />}
                          {cancelada && <Ban className="w-3 h-3 text-slate-400" />}
                          <span>{ord.estado}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Recepcionar y Convertir a Factura */}
                          {(pendiente || aprobada) && (
                            <button
                              type="button"
                              onClick={() => abrirModalRecepcion(ord)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-bold text-[11px] shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer font-sora"
                              title="Arribó la mercadería: Recepcionar con Factura comercial y registrar lotes"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Recepcionar</span>
                            </button>
                          )}

                          {/* Ver Hoja de Pedido */}
                          <button
                            type="button"
                            onClick={() => {
                              setOrdenSeleccionada(ord);
                              setModalDetalleOpen(true);
                            }}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Ver Hoja de Pedido / Imprimir para visitador"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Aprobar orden */}
                          {pendiente && (
                            <button
                              type="button"
                              onClick={() => handleCambiarEstado(ord.id, 'Aprobada')}
                              className="p-1.5 rounded-xl text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                              title="Aprobar orden de compra"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Cancelar orden */}
                          {(pendiente || aprobada) && (
                            <button
                              type="button"
                              onClick={() => handleCambiarEstado(ord.id, 'Cancelada')}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Cancelar orden"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* ─── MODAL 1: NUEVA ORDEN DE COMPRA ─── */}
      {modalNuevaOrden && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !guardandoOrden) setModalNuevaOrden(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Header con botón (X) de alto contraste */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shadow-xs shrink-0">
                  <PackageCheck className="w-5 h-5 text-[#00B884]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Generar Orden de Compra (Pedido a Laboratorio)
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                      Presupuesto / Pedido
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold truncate max-w-md">
                    Documento previo de solicitud de mercadería sin afectación de Kardex contable.
                  </p>
                </div>
              </div>

              {/* Botón (X) de Alto Contraste y Fácil Localización */}
              <button
                type="button"
                onClick={() => setModalNuevaOrden(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <form onSubmit={handleGuardarOrden} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-modal-scroll">
                {/* Cabecera del Formulario */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/70 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Droguería / Proveedor *
                      </span>
                      <button
                        type="button"
                        onClick={() => setModalNuevaDrogueria(true)}
                        className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer transition-all"
                        title="Registrar nueva droguería en SUNAT sin salir"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>+ Nueva Droguería</span>
                      </button>
                    </div>
                    <DropdownPill
                      value={proveedorSeleccionado}
                      onChange={(val) => setProveedorSeleccionado(val)}
                      options={proveedores.map(p => ({
                        value: p.id,
                        label: p.razon_social,
                        subtitle: `RUC: ${p.numero_documento}`
                      }))}
                      icon={Building2}
                      placeholder="Seleccionar droguería..."
                      searchPlaceholder="Buscar droguería..."
                    />
                  </div>

                  <div>
                    <DropdownPill
                      label="Condición de Pago"
                      value={condicionPago}
                      onChange={(val) => setCondicionPago(val)}
                      options={CONDICIONES_PAGO}
                      icon={DollarSign}
                    />
                  </div>

                  <div>
                    <DatePickerPill
                      label="Fecha Estimada de Entrega"
                      value={fechaEntrega}
                      onChange={(val) => setFechaEntrega(val)}
                      mode="entrega"
                      direction="down"
                      align="right"
                      placeholder="Seleccionar entrega..."
                    />
                  </div>
                </div>

                {/* Buscador de Medicamentos */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Buscar y Agregar Medicamentos al Pedido
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={busquedaMed}
                      onChange={(e) => setBusquedaMed(e.target.value)}
                      placeholder="Escribe el nombre del medicamento, concentración o laboratorio..."
                      className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                    />
                  </div>

                  {busquedaMed.trim().length > 1 && (
                    <div className="max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-800 shadow-md">
                      {medicamentos
                        .filter(m =>
                          m.nombre_comercial?.toLowerCase().includes(busquedaMed.toLowerCase()) ||
                          m.concentracion?.toLowerCase().includes(busquedaMed.toLowerCase()) ||
                          m.laboratorio?.toLowerCase().includes(busquedaMed.toLowerCase())
                        )
                        .slice(0, 8)
                        .map(med => (
                          <div
                            key={med.id}
                            onClick={() => agregarItemOrden(med)}
                            className="p-2.5 hover:bg-[#EBFDF6] dark:hover:bg-slate-700/60 cursor-pointer flex items-center justify-between transition-colors"
                          >
                            <div>
                              <p className="font-bold text-xs text-slate-800 dark:text-slate-200">{med.nombre_comercial} {med.concentracion}</p>
                              <p className="text-[10px] text-slate-400">{med.laboratorio} • Stock actual: {med.stock_cajas} cjs</p>
                            </div>
                            <span className="text-xs font-mono font-bold text-[#00855E] dark:text-[#5EEBB8]">
                              Ref: S/ {parseFloat(med.precio_compra || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Tabla de Medicamentos en la Orden */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FCFA] dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Medicamento</th>
                        <th className="p-2.5 text-center w-24">Cant. Cajas</th>
                        <th className="p-2.5 text-right w-28">Costo Ref. (S/)</th>
                        <th className="p-2.5 text-right w-28">Subtotal (S/)</th>
                        <th className="p-2.5 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {itemsOrden.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-6 text-center text-slate-400 text-xs">
                            No has agregado medicamentos al pedido. Usa el buscador superior o el botón de sugerencia por stock mínimo.
                          </td>
                        </tr>
                      ) : (
                        itemsOrden.map((it) => {
                          const sub = (parseFloat(it.cantidad_cajas_solicitada) || 0) * (parseFloat(it.precio_unitario_estimado) || 0);

                          return (
                            <tr key={it.id_medicamento} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                              <td className="p-2.5">
                                <p className="font-bold text-slate-800 dark:text-slate-200">{it.nombre} {it.concentracion}</p>
                                <p className="text-[10px] text-slate-400">{it.laboratorio} • Stock: {it.stock_actual} cjs</p>
                              </td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  value={it.cantidad_cajas_solicitada}
                                  onChange={(e) => actualizarItemOrden(it.id_medicamento, 'cantidad_cajas_solicitada', e.target.value)}
                                  className="w-20 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                              </td>
                              <td className="p-2.5 text-right">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={it.precio_unitario_estimado}
                                  onChange={(e) => actualizarItemOrden(it.id_medicamento, 'precio_unitario_estimado', e.target.value)}
                                  className="w-24 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                                />
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                S/ {sub.toFixed(2)}
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => eliminarItemOrden(it.id_medicamento)}
                                  className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Quitar de la lista"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Observaciones */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Instrucciones / Observaciones de entrega para la droguería
                  </label>
                  <input
                    type="text"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Ej. Entregar antes de las 13:00 hrs, solicitar presentación hospitalaria"
                    className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Footer con Totales */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {itemsOrden.length} medicamento(s) en la orden • Total Estimado:{' '}
                  <span className="text-[#00855E] dark:text-[#5EEBB8] font-mono text-sm font-black">
                    S/ {totalEstimadoNuevaOrden.toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalNuevaOrden(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoOrden || itemsOrden.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-black text-xs shadow-md shadow-emerald-900/20 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <PackageCheck className="w-4 h-4" />
                    <span>{guardandoOrden ? 'Emitiendo Orden...' : 'Emitir Orden de Compra'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 2: RECEPCIÓN Y CONVERSIÓN A FACTURA (FLUJO HÍBRIDO) ─── */}
      {modalRecepcionOpen && ordenParaRecepcionar && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !procesandoRecepcion) setModalRecepcionOpen(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Header con botón (X) de alto contraste */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/70 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#00855E] text-white shadow-xs shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">
                      Recepción de Mercadería y Conversión a Factura
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
                      Orden: {ordenParaRecepcionar.codigo_orden}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-semibold truncate max-w-lg">
                    Proveedor: <b>{ordenParaRecepcionar.proveedor?.razon_social}</b> (RUC: {ordenParaRecepcionar.proveedor?.numero_documento})
                  </p>
                </div>
              </div>

              {/* Botón (X) de Alto Contraste y Fácil Localización */}
              <button
                type="button"
                onClick={() => setModalRecepcionOpen(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRecepcion} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-modal-scroll">
                {/* Metadatos de la Factura Entregada */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-slate-50/70 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Serie y Número Factura *
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        required
                        value={datosFactura.serie}
                        onChange={(e) => setDatosFactura({ ...datosFactura, serie: e.target.value.toUpperCase() })}
                        placeholder="F001"
                        className="w-16 px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 text-center"
                      />
                      <input
                        type="text"
                        required
                        value={datosFactura.numero}
                        onChange={(e) => setDatosFactura({ ...datosFactura, numero: e.target.value })}
                        placeholder="004812"
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Guía de Remisión (GRR)
                    </label>
                    <input
                      type="text"
                      value={datosFactura.guia_remision}
                      onChange={(e) => setDatosFactura({ ...datosFactura, guia_remision: e.target.value.toUpperCase() })}
                      placeholder="T001-001248"
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <DatePickerPill
                      label="Fecha Emisión Factura (SUNAT)"
                      required
                      value={datosFactura.fecha_emision}
                      onChange={(val) => setDatosFactura({ ...datosFactura, fecha_emision: val })}
                      mode="emision"
                      direction="down"
                      align="right"
                      placeholder="Seleccionar fecha..."
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Condición de Pago
                    </label>
                    <select
                      value={datosFactura.tipo_pago}
                      onChange={(e) => setDatosFactura({ ...datosFactura, tipo_pago: e.target.value })}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                    >
                      <option value="Contado">Contado</option>
                      <option value="Credito">Crédito (30 días)</option>
                    </select>
                  </div>
                </div>

                {/* Tabla de Medicamentos con Lote y Vencimiento */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#00855E]" />
                      <span>Recepción Técnica de Medicamentos, Lotes y Vencimientos BPA</span>
                    </label>
                    <span className="text-[10px] text-slate-400">Verifique físicamente antes de ingresar al stock</span>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F8FCFA] dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                        <tr>
                          <th className="p-2.5">Medicamento</th>
                          <th className="p-2.5 text-center w-20">Cant. Cajas</th>
                          <th className="p-2.5 w-28">N° de Lote *</th>
                          <th className="p-2.5 w-32">Vencimiento *</th>
                          <th className="p-2.5 w-28">Reg. Sanitario</th>
                          <th className="p-2.5 text-right w-24">Costo Factura</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {itemsRecepcion.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                            <td className="p-2.5">
                              <p className="font-bold text-slate-800 dark:text-slate-200">{it.nombre} {it.concentracion}</p>
                              <p className="text-[10px] text-slate-400">{it.laboratorio}</p>
                            </td>

                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                min="0.5"
                                step="0.5"
                                required
                                value={it.cantidad_cajas}
                                onChange={(e) => actualizarItemRecepcion(idx, 'cantidad_cajas', e.target.value)}
                                className="w-16 px-1.5 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </td>

                            <td className="p-2.5">
                              <input
                                type="text"
                                required
                                placeholder="LT12345"
                                value={it.numero_lote}
                                onChange={(e) => actualizarItemRecepcion(idx, 'numero_lote', e.target.value.toUpperCase())}
                                className="w-full px-2 py-1 font-mono font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase"
                              />
                            </td>

                            <td className="p-2.5">
                              <input
                                type="date"
                                required
                                value={it.fecha_vencimiento}
                                onChange={(e) => actualizarItemRecepcion(idx, 'fecha_vencimiento', e.target.value)}
                                className="w-full px-2 py-1 text-xs font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </td>

                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="EE-04821"
                                value={it.registro_sanitario}
                                onChange={(e) => actualizarItemRecepcion(idx, 'registro_sanitario', e.target.value.toUpperCase())}
                                className="w-full px-2 py-1 font-mono text-[11px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 uppercase"
                              />
                            </td>

                            <td className="p-2.5 text-right">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={it.precio_unitario}
                                onChange={(e) => actualizarItemRecepcion(idx, 'precio_unitario', e.target.value)}
                                className="w-20 px-2 py-1 text-right font-mono font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Footer de Recepción */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
                <div className="text-xs font-bold text-slate-500">
                  Total Factura Recibida:{' '}
                  <span className="text-[#00855E] dark:text-[#5EEBB8] font-mono text-sm font-black">
                    S/{' '}
                    {itemsRecepcion
                      .reduce((acc, it) => acc + ((parseFloat(it.cantidad_cajas) || 0) * (parseFloat(it.precio_unitario) || 0)), 0)
                      .toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalRecepcionOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesandoRecepcion}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-900/20 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{procesandoRecepcion ? 'Ingresando a Kardex...' : 'Confirmar Factura e Ingreso a Kardex'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL 3: VISTA PREVIA E IMPRESIÓN DE HOJA DE PEDIDO ─── */}
      {modalDetalleOpen && ordenSeleccionada && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalDetalleOpen(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Header con botón (X) de alto contraste */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-[#00855E]" />
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  Hoja de Pedido Oficial: {ordenSeleccionada.codigo_orden}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>

                {/* Botón (X) de Alto Contraste y Fácil Localización */}
                <button
                  type="button"
                  onClick={() => setModalDetalleOpen(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                  title="Cerrar ventana (Esc)"
                >
                  <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70 dark:bg-slate-950/80 flex justify-center custom-modal-scroll">
              <div
                ref={printHojaRef}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-lg w-full font-mono text-xs text-slate-900 space-y-4"
              >
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <h2 className="font-black text-sm uppercase">BOTICA HEIS & SALUD</h2>
                  <p className="text-[10px] text-slate-500">RUC: 20608976543 • Tumbes, Perú</p>
                  <p className="font-bold text-xs mt-1 text-[#00855E]">SOLICITUD / ORDEN DE COMPRA</p>
                  <p className="font-black text-xs">{ordenSeleccionada.codigo_orden}</p>
                </div>

                <div className="space-y-1 text-[11px] border-b border-dashed border-slate-300 pb-3">
                  <p><b>Droguería:</b> {ordenSeleccionada.proveedor?.razon_social}</p>
                  <p><b>RUC Proveedor:</b> {ordenSeleccionada.proveedor?.numero_documento}</p>
                  <p><b>Fecha Pedido:</b> {ordenSeleccionada.fecha_emision}</p>
                  {ordenSeleccionada.fecha_entrega_esperada && (
                    <p><b>Entrega Deseada:</b> {ordenSeleccionada.fecha_entrega_esperada}</p>
                  )}
                  <p><b>Condición Pago:</b> {ordenSeleccionada.condicion_pago} {ordenSeleccionada.condicion_pago === 'Credito' && `(${ordenSeleccionada.credito_dias} días)`}</p>
                  <p><b>Estado Actual:</b> {ordenSeleccionada.estado}</p>
                </div>

                <div className="space-y-1.5">
                  <p className="font-bold text-[11px] uppercase">Medicamentos Requeridos:</p>
                  <table className="w-full text-left text-[10px]">
                    <thead className="border-b border-slate-200">
                      <tr>
                        <th className="py-1">Producto</th>
                        <th className="py-1 text-center">Cant.</th>
                        <th className="py-1 text-right">P. Ref</th>
                        <th className="py-1 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ordenSeleccionada.detalles?.map((d, i) => (
                        <tr key={i}>
                          <td className="py-1">
                            <span className="font-bold">{d.medicamento?.nombre_comercial}</span> {d.medicamento?.concentracion}
                          </td>
                          <td className="py-1 text-center font-bold">{d.cantidad_cajas_solicitada} cjs</td>
                          <td className="py-1 text-right">S/ {parseFloat(d.precio_unitario_estimado || 0).toFixed(2)}</td>
                          <td className="py-1 text-right font-bold">S/ {parseFloat(d.subtotal_estimado || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-dashed border-slate-300 pt-2 text-right space-y-0.5 text-xs">
                  <p><b>Total Estimado:</b> S/ {parseFloat(ordenSeleccionada.total_estimado || 0).toFixed(2)}</p>
                </div>

                {ordenSeleccionada.observaciones && (
                  <div className="border-t border-slate-200 pt-2 text-[10px] text-slate-500">
                    <b>Obs:</b> {ordenSeleccionada.observaciones}
                  </div>
                )}

                <div className="text-center pt-4 text-[9px] text-slate-400">
                  <p>Documento de cotización y pedido interno emitido por Botica Heis & Salud.</p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Modal Registrar Nueva Droguería en línea */}
      <ModalRegistrarDrogueria
        isOpen={modalNuevaDrogueria}
        onClose={() => setModalNuevaDrogueria(false)}
        onSuccess={(nuevoProv) => {
          if (nuevoProv) {
            setProveedores((prev) => [nuevoProv, ...prev]);
            setProveedorSeleccionado(nuevoProv.id);
            toast.success(`Droguería "${nuevoProv.razon_social}" lista y seleccionada`);
          }
        }}
      />
    </div>
  );
}
