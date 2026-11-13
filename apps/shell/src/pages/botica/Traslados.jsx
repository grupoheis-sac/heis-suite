import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Truck,
  Plus,
  Search,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Printer,
  X,
  Package,
  Boxes,
  Calendar,
  User,
  ShieldCheck,
  RefreshCw,
  Building2,
  RotateCcw,
  Check,
  Eye,
  Ban,
  Snowflake
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from './api';
import { useSucursalStore } from '@heis/core';
import { useAuthStore } from '@heis/core';
import DropdownPill from './components/DropdownPill';

const MOTIVO_TRASLADO_OPCIONES = [
  {
    value: '04 - TRASLADO ENTRE ESTABLECIMIENTOS DE LA MISMA EMPRESA',
    label: '04 - Entre Sedes de la Misma Empresa',
    subtitle: 'Reabastecimiento regular entre locales botica'
  },
  {
    value: '13 - OTROS (Custodia / Rebalanceo de Stock)',
    label: '13 - Rebalanceo o Custodia Temporal',
    subtitle: 'Almacenamiento por remodelación o sobrestock'
  },
  {
    value: '02 - TRASLADO POR EMISOR ITINERANTE',
    label: '02 - Emisor Itinerante / Campaña',
    subtitle: 'Atención móvil autorizada fuera de sede'
  },
  {
    value: '07 - REUBICACION POR CONDICIONES SANITARIAS',
    label: '07 - Reubicación por Alerta Sanitaria',
    subtitle: 'Falla de climatización o almacén no conforme'
  }
];

export default function Traslados() {
  const { user } = useAuthStore();
  const { sucursales, sucursalActiva, fetchSucursales } = useSucursalStore();

  const [traslados, setTraslados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('TODOS');

  // Modal Nuevo Traslado
  const [modalNuevoOpen, setModalNuevoOpen] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [origenId, setOrigenId] = useState('');
  const [destinoId, setDestinoId] = useState('');
  const [motivoTraslado, setMotivoTraslado] = useState('04 - TRASLADO ENTRE ESTABLECIMIENTOS DE LA MISMA EMPRESA');
  const [modalidadTransporte, setModalidadTransporte] = useState('Transporte Privado'); // 'Transporte Privado' | 'Transporte Publico'
  const [transportistaNombre, setTransportistaNombre] = useState('');
  const [transportistaDoc, setTransportistaDoc] = useState('');
  const [vehiculoPlaca, setVehiculoPlaca] = useState('');
  const [totalBultos, setTotalBultos] = useState('1');
  const [cadenaFrio, setCadenaFrio] = useState(false);
  const [observacionesEnvio, setObservacionesEnvio] = useState('');
  
  // Carrito de items a trasladar
  const [itemsTraslado, setItemsTraslado] = useState([]);
  const [catalogoOrigen, setCatalogoOrigen] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [busquedaMed, setBusquedaMed] = useState('');

  // Modal Recepción
  const [modalRecibirOpen, setModalRecibirOpen] = useState(false);
  const [trasladoSeleccionado, setTrasladoSeleccionado] = useState(null);
  const [itemsRecibidos, setItemsRecibidos] = useState([]);
  const [obsRecepcion, setObsRecepcion] = useState('');
  const [procesandoRecepcion, setProcesandoRecepcion] = useState(false);

  // Modal Guía / Vista Impresión
  const [modalGuiaOpen, setModalGuiaOpen] = useState(false);
  const [guiaData, setGuiaData] = useState(null);
  const printGuiaRef = useRef(null);

  const cargarTraslados = async () => {
    setCargando(true);
    try {
      const res = await api.get('/traslados');
      const lista = Array.isArray(res.data) ? res.data : (res.data?.data || res.traslados || []);
      setTraslados(lista);
    } catch (e) {
      toast.error('Error al cargar la lista de traslados.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchSucursales();
    cargarTraslados();
  }, []);

  // Cuando cambia la sucursal de origen en el modal nuevo, cargar su stock disponible
  const cargarStockOrigen = async (idSuc) => {
    if (!idSuc) {
      setCatalogoOrigen([]);
      return;
    }
    setCargandoCatalogo(true);
    try {
      const res = await api.get(`/sucursales/${idSuc}/stock`);
      const stockList = Array.isArray(res.data) ? res.data : (res.data?.data || res.stocks || []);
      setCatalogoOrigen(stockList);
    } catch (e) {
      toast.error('Error al cargar stock de la sede de origen.');
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const esTermolabil = (med) => {
    const txt = `${med?.nombre_comercial || ''} ${med?.nombre_generico || ''} ${med?.presentacion || ''}`.toLowerCase();
    return txt.includes('insulina') || txt.includes('vacuna') || txt.includes('refrig') || txt.includes('oftálm') || txt.includes('oftalm') || txt.includes('suero') || txt.includes('ergotamina');
  };

  const abrirModalNuevo = () => {
    const defaultOrigen = sucursalActiva ? String(sucursalActiva.id) : (sucursales[0] ? String(sucursales[0].id) : '');
    const defaultDestino = sucursales.find(s => String(s.id) !== defaultOrigen)?.id || '';

    setOrigenId(defaultOrigen);
    setDestinoId(String(defaultDestino));
    setMotivoTraslado('04 - TRASLADO ENTRE ESTABLECIMIENTOS DE LA MISMA EMPRESA');
    setModalidadTransporte('Transporte Privado');
    setTransportistaNombre('');
    setTransportistaDoc('');
    setVehiculoPlaca('');
    setTotalBultos('1');
    setCadenaFrio(false);
    setObservacionesEnvio('');
    setItemsTraslado([]);
    setBusquedaMed('');
    cargarStockOrigen(defaultOrigen);
    setModalNuevoOpen(true);
  };

  const agregarItemAlTraslado = (stockItem) => {
    const existe = itemsTraslado.find(i => i.id_lote === stockItem.id_lote);
    if (existe) {
      toast.error('Este lote ya está agregado en la lista de despacho.');
      return;
    }

    const termolabilItem = esTermolabil(stockItem.medicamento);
    if (termolabilItem && !cadenaFrio) {
      setCadenaFrio(true);
      toast.success('Medicamento termolábil detectado. Control de cadena de frío (2°C - 8°C) activado.');
    }

    setItemsTraslado([
      ...itemsTraslado,
      {
        id_medicamento: stockItem.id_medicamento,
        id_lote: stockItem.id_lote,
        nombre: stockItem.medicamento?.nombre_comercial || 'Medicamento',
        presentacion: stockItem.medicamento?.presentacion || '',
        lote: stockItem.lote?.numero_lote || 'S/L',
        vencimiento: stockItem.lote?.fecha_vencimiento || 'N/A',
        stock_max_cajas: parseFloat(stockItem.stock_cajas || 0),
        stock_max_fracciones: parseInt(stockItem.stock_fraccion || 0, 10),
        cantidad_cajas: stockItem.stock_cajas > 0 ? 1 : 0,
        cantidad_fracciones: 0,
        termolabil: termolabilItem
      }
    ]);
  };

  const actualizarItemTraslado = (id_lote, campo, valor) => {
    setItemsTraslado(
      itemsTraslado.map(i => {
        if (i.id_lote === id_lote) {
          return { ...i, [campo]: valor };
        }
        return i;
      })
    );
  };

  const eliminarItemTraslado = (id_lote) => {
    setItemsTraslado(itemsTraslado.filter(i => i.id_lote !== id_lote));
  };

  const handleCrearTraslado = async (e) => {
    e.preventDefault();
    if (!origenId || !destinoId) {
      toast.error('Seleccione sucursal de origen y destino.');
      return;
    }
    if (origenId === destinoId) {
      toast.error('La sucursal de origen y destino deben ser distintas.');
      return;
    }
    if (itemsTraslado.length === 0) {
      toast.error('Agregue al menos un medicamento a la lista.');
      return;
    }

    // Validar cantidades positivas y topes de stock
    for (const item of itemsTraslado) {
      const cCajas = parseFloat(item.cantidad_cajas || 0);
      const cFracc = parseInt(item.cantidad_fracciones || 0, 10);
      if (cCajas <= 0 && cFracc <= 0) {
        toast.error(`Indique una cantidad válida de cajas o fracciones para ${item.nombre}.`);
        return;
      }
      if (cCajas > item.stock_max_cajas) {
        toast.error(`Stock de cajas insuficiente para ${item.nombre}. Máx: ${item.stock_max_cajas} cajas.`);
        return;
      }
      if (cFracc > item.stock_max_fracciones && cCajas >= item.stock_max_cajas) {
        toast.error(`Stock de fracciones insuficiente para ${item.nombre}. Máx: ${item.stock_max_fracciones} fracciones.`);
        return;
      }
    }

    setGuardando(true);
    try {
      const obsParts = [];
      if (cadenaFrio) obsParts.push('[TERMOLÁBIL 2°C - 8°C / CADENA DE FRÍO]');
      if (totalBultos) obsParts.push(`Bultos: ${totalBultos}`);
      if (observacionesEnvio.trim()) obsParts.push(observacionesEnvio.trim());

      const payload = {
        id_sucursal_origen: parseInt(origenId, 10),
        id_sucursal_destino: parseInt(destinoId, 10),
        motivo_traslado: motivoTraslado,
        modalidad_transporte: modalidadTransporte,
        transportista_nombre: transportistaNombre.trim() || null,
        transportista_documento: transportistaDoc.trim() || null,
        vehiculo_placa: vehiculoPlaca.trim() || null,
        observaciones: obsParts.length > 0 ? obsParts.join(' • ') : null,
        items: itemsTraslado.map(i => ({
          id_medicamento: i.id_medicamento,
          id_lote: i.id_lote,
          cantidad_cajas: parseFloat(i.cantidad_cajas || 0),
          cantidad_fracciones: parseInt(i.cantidad_fracciones || 0, 10)
        }))
      };

      const res = await api.post('/traslados', payload);
      toast.success(res.message || res.data?.message || 'Traslado generado exitosamente.');
      setModalNuevoOpen(false);
      await cargarTraslados();

      // Abrir automáticamente la guía para imprimir
      const trasladoCreado = res.data?.data || res.data || res.traslado;
      if (trasladoCreado && trasladoCreado.id) {
        abrirGuiaImpresion(trasladoCreado);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al generar traslado.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalRecepcion = (traslado) => {
    setTrasladoSeleccionado(traslado);
    setObsRecepcion('');
    setItemsRecibidos(
      (traslado.detalles || []).map(d => ({
        id_detalle: d.id,
        nombre: d.medicamento?.nombre_comercial,
        lote: d.lote?.numero_lote,
        cantidad_enviada_cajas: parseFloat(d.cantidad_enviada_cajas || 0),
        cantidad_enviada_fracciones: parseInt(d.cantidad_enviada_fracciones || 0, 10),
        cantidad_recibida_cajas: parseFloat(d.cantidad_enviada_cajas || 0),
        cantidad_recibida_fracciones: parseInt(d.cantidad_enviada_fracciones || 0, 10),
        discrepancia: false,
        observacion: ''
      }))
    );
    setModalRecibirOpen(true);
  };

  const handleConfirmarRecepcion = async (e) => {
    e.preventDefault();
    if (!trasladoSeleccionado) return;

    setProcesandoRecepcion(true);
    try {
      const payload = {
        observaciones_recepcion: obsRecepcion.trim() || null,
        items_recibidos: itemsRecibidos.map(i => ({
          id_detalle: i.id_detalle,
          cantidad_recibida_cajas: parseFloat(i.cantidad_recibida_cajas || 0),
          cantidad_recibida_fracciones: parseInt(i.cantidad_recibida_fracciones || 0, 10),
          observacion: i.observacion || null
        }))
      };

      const res = await api.put(`/traslados/${trasladoSeleccionado.id}/recibir`, payload);
      toast.success(res.message || res.data?.message || 'Traslado recibido y cargado al inventario.');
      setModalRecibirOpen(false);
      await cargarTraslados();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al recibir el traslado.');
    } finally {
      setProcesandoRecepcion(false);
    }
  };

  const handleAnular = async (traslado) => {
    if (!confirm(`¿Está seguro de anular el traslado ${traslado.numero}? La mercadería retornará al stock de origen.`)) {
      return;
    }
    const motivo = prompt('Ingrese motivo de la anulación:') || 'Cancelado por administración';
    try {
      const res = await api.put(`/traslados/${traslado.id}/anular`, { motivo_anulacion: motivo });
      toast.success(res.message || res.data?.message || 'Traslado anulado.');
      await cargarTraslados();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al anular traslado.');
    }
  };

  const abrirGuiaImpresion = (traslado) => {
    setGuiaData(traslado);
    setModalGuiaOpen(true);
  };

  const handlePrintGuia = () => {
    window.print();
  };

  // Filtrado de traslados
  const trasladosFiltrados = traslados.filter(t => {
    const matchBusqueda =
      t.numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.guia_remision_numero?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.sucursal_origen?.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      t.sucursal_destino?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const matchEstado = filtroEstado === 'TODOS' ? true : t.estado === filtroEstado;
    return matchBusqueda && matchEstado;
  });

  const totalEnTransito = traslados.filter(t => t.estado === 'En Transito').length;
  const totalRecibidos = traslados.filter(t => t.estado === 'Recibido').length;

  return (
    <div className="space-y-4 font-sora">
      
      {/* ─── 1. HEADER LOGÍSTICO Y ACCIONES (PÍLDORA SISTEMA BOTICA) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
            <Truck className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                Traslados entre Sedes
              </h2>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0 font-sora">
                Guías & FEFO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              Despacho, transporte, guías de remisión y recepción entre sucursales de la botica con trazabilidad.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <button
            type="button"
            onClick={cargarTraslados}
            disabled={cargando}
            className="p-2 bg-white hover:bg-[#EBFDF6] dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-[#00855E] dark:text-slate-300 dark:hover:text-[#5EEBB8] border border-slate-200/80 hover:border-[#A6F6D8] dark:border-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Refrescar lista de traslados"
          >
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={abrirModalNuevo}
            className="px-3.5 py-2 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-bold text-xs shadow-xs shadow-emerald-900/20 active:scale-[0.98] transition-all flex items-center gap-1.5 font-sora cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Traslado</span>
          </button>
        </div>
      </div>

      {/* ─── 2. TARJETAS DE INDICADORES / KPIS (DISEÑO Y DIMENSIONES DASHBOARD) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 font-sora">
        {/* KPI 1: En Tránsito */}
        <div 
          onClick={() => setFiltroEstado('En Transito')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroEstado === 'En Transito'
              ? 'border-amber-500 bg-amber-50/20 dark:bg-amber-950/20 shadow-xs shadow-amber-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-amber-500/50'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 font-sora truncate min-w-0 transition-colors">
                En Tránsito (Pendientes)
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <Truck className="w-3.5 h-3.5 animate-pulse" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sora tracking-tight truncate font-mono">
                {totalEnTransito}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Envíos en ruta
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora transition-colors ${
              filtroEstado === 'En Transito'
                ? 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/50'
            }`}>
              {filtroEstado === 'En Transito' ? 'Filtro Activo' : 'En Camino'}
            </span>
          </div>
        </div>

        {/* KPI 2: Recibidos con Conformidad */}
        <div 
          onClick={() => setFiltroEstado('Recibido')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroEstado === 'Recibido'
              ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs shadow-emerald-500/10'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/50'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 font-sora truncate min-w-0 transition-colors">
                Recibidos con Conformidad
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-emerald-100 dark:border-emerald-800/40 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sora tracking-tight truncate font-mono">
                {totalRecibidos}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Conformidad firmada
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora transition-colors ${
              filtroEstado === 'Recibido'
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
            }`}>
              {filtroEstado === 'Recibido' ? 'Filtro Activo' : 'Completados'}
            </span>
          </div>
        </div>

        {/* KPI 3: Historial Total de Envíos */}
        <div 
          onClick={() => setFiltroEstado('TODOS')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border shadow-2xs hover:shadow-md hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation overflow-hidden flex flex-col justify-between outline-none focus:outline-none focus-visible:outline-none ${
            filtroEstado === 'TODOS'
              ? 'border-slate-400 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/20'
              : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-400'
          }`}
        >
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-slate-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-slate-500/12 transition-all" />

          <div>
            <div className="flex items-center justify-between gap-2 mb-1 sm:mb-1.5">
              <span className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 font-sora truncate min-w-0 transition-colors">
                Historial Total de Envíos
              </span>
              <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105 group-hover:shadow-xs">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-1 sm:my-1.5">
              <span className="text-xl sm:text-2xl font-extrabold text-slate-800 dark:text-slate-100 font-sora tracking-tight truncate font-mono">
                {traslados.length}
              </span>
            </div>
          </div>

          <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
            <span className="text-[10.5px] sm:text-[11px] text-slate-400 dark:text-slate-500 font-medium truncate">
              Todos los traslados
            </span>
            <span className={`text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap font-sora transition-colors ${
              filtroEstado === 'TODOS'
                ? 'bg-slate-200 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200'
                : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400'
            }`}>
              {filtroEstado === 'TODOS' ? 'Activo' : 'Ver Todos'}
            </span>
          </div>
        </div>
      </div>

      {/* ─── 3. BARRA DE BÚSQUEDA Y PESTAÑAS DE ESTADO ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-[#D1F4E3] dark:border-slate-800 soft-card-shadow">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por código de traslado, guía o sucursal..."
            className="w-full pl-9 pr-3.5 py-1.5 bg-[#F8FCFA] dark:bg-slate-950 border border-[#D1F4E3] dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:bg-white dark:focus:bg-slate-900 focus:border-[#00855E] focus:ring-1 focus:ring-[#00855E]/30 font-sora"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F8FCFA] dark:bg-slate-950 rounded-xl border border-[#D1F4E3]/60 dark:border-slate-800 text-xs font-bold w-full sm:w-auto overflow-x-auto">
          {['TODOS', 'En Transito', 'Recibido', 'Anulado'].map(est => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer font-sora select-none ${
                filtroEstado === est
                  ? 'bg-[#00855E] text-white font-black shadow-xs shadow-emerald-900/20'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {est === 'En Transito' ? 'En Camino' : est}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. TABLA DE TRASLADOS ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-[#D1F4E3] dark:border-slate-800 soft-card-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FCFA] dark:bg-slate-950 text-slate-500 dark:text-slate-400 uppercase font-black text-[10px] tracking-wider border-b border-[#D1F4E3] dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Correlativo / Guía</th>
                <th className="py-3 px-4">Ruta (Origen ➔ Destino)</th>
                <th className="py-3 px-4">Fecha y Despachador</th>
                <th className="py-3 px-4 text-center">Cajas / Ítems</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {cargando ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    Cargando traslados logísticos...
                  </td>
                </tr>
              ) : trasladosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                    No se encontraron traslados registrados con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                trasladosFiltrados.map((t) => {
                  const enCamino = t.estado === 'En Transito';
                  const recibido = t.estado === 'Recibido';
                  const anulado = t.estado === 'Anulado';

                  return (
                    <tr key={t.id} className="hover:bg-[#EBFDF6]/40 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-mono font-black text-slate-900 dark:text-slate-100 text-xs">
                          {t.numero}
                        </div>
                        {t.guia_remision_numero && (
                          <div className="text-[10px] font-mono text-[#00855E] dark:text-[#5EEBB8] font-bold">
                            Guía: {t.guia_remision_numero}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <span className="truncate max-w-[130px]">{t.sucursal_origen?.nombre || 'Origen'}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#00B884] dark:text-[#5EEBB8] shrink-0" />
                          <span className="truncate max-w-[130px] text-[#00855E] dark:text-[#5EEBB8] font-black">
                            {t.sucursal_destino?.nombre || 'Destino'}
                          </span>
                        </div>
                        {t.vehiculo_placa && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Vehículo: {t.vehiculo_placa} {t.transportista_nombre ? `• ${t.transportista_nombre}` : ''}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        <div className="font-bold">
                          {new Date(t.fecha_envio || t.created_at).toLocaleDateString('es-PE')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Por: {t.usuario_envia?.nombre || 'Personal'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-slate-900 dark:text-slate-100 text-xs font-mono">
                          {parseFloat(t.total_cajas || 0).toFixed(0)} cjs
                        </span>
                        <div className="text-[10px] text-slate-400">
                          {t.total_items} medicamentos
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-sora ${
                            enCamino
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 animate-pulse'
                              : recibido
                              ? 'bg-[#EBFDF6] text-[#00855E] dark:bg-emerald-950/60 dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {enCamino && <Clock className="w-3 h-3" />}
                          {recibido && <CheckCircle2 className="w-3 h-3 text-[#00B884]" />}
                          <span>{t.estado}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {enCamino && (
                            <button
                              type="button"
                              onClick={() => abrirModalRecepcion(t)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white font-bold text-[11px] shadow-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1 cursor-pointer font-sora"
                              title="Confirmar recepción en destino y cargar stock"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Recibir</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => abrirGuiaImpresion(t)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#EBFDF6] dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-[#00855E] dark:hover:text-[#5EEBB8] border border-slate-200/60 dark:border-slate-700 transition-colors cursor-pointer"
                            title="Ver Guía de Despacho / Imprimir"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {enCamino && (
                            <button
                              type="button"
                              onClick={() => handleAnular(t)}
                              className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-transparent hover:border-rose-200/50 transition-colors cursor-pointer"
                              title="Anular traslado y regresar mercadería al origen"
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

      {/* ─── 5. MODAL NUEVO TRASLADO ENTRE SEDES ─── */}
      {modalNuevoOpen && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalNuevoOpen(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden font-sora"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/70 dark:border-teal-800/60 shadow-2xs shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight font-sora">
                      Despacho de Traslado entre Sedes
                    </h3>
                    <span className="inline-flex items-center whitespace-nowrap text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200/80 tracking-wide">
                      Guía SUNAT / BPA
                    </span>
                    {cadenaFrio && (
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 tracking-wide animate-pulse">
                        <Snowflake className="w-3 h-3 text-cyan-500" />
                        Cadena de Frío
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-semibold truncate max-w-md">
                    Sustento de traslado interno SUNAT y Buenas Prácticas de Almacenamiento DIGEMID
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevoOpen(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <form onSubmit={handleCrearTraslado} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 custom-modal-scroll">
                
                {/* 1. Selección de Sedes y Motivo SUNAT */}
                <div className="p-3.5 rounded-2xl bg-[#F8FCFA] dark:bg-slate-950/50 border border-[#D1F4E3] dark:border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <DropdownPill
                        label="Sede Origen (De donde sale la mercadería)"
                        required
                        value={origenId}
                        onChange={(val) => {
                          setOrigenId(val);
                          setItemsTraslado([]);
                          cargarStockOrigen(val);
                        }}
                        options={sucursales.map(s => ({
                          value: s.id,
                          label: s.nombre,
                          subtitle: `SUNAT: ${s.codigo_establecimiento || '0000'}`
                        }))}
                        icon={Building2}
                        placeholder="Seleccionar sede de origen..."
                        direction="down"
                      />
                    </div>

                    <div>
                      <DropdownPill
                        label="Sede Destino (A donde llegará)"
                        required
                        value={destinoId}
                        onChange={(val) => setDestinoId(val)}
                        options={sucursales
                          .filter(s => String(s.id) !== String(origenId))
                          .map(s => ({
                            value: s.id,
                            label: s.nombre,
                            subtitle: `SUNAT: ${s.codigo_establecimiento || '0000'}`
                          }))}
                        icon={Truck}
                        placeholder="Seleccionar sede destino..."
                        direction="down"
                      />
                    </div>
                  </div>

                  <div>
                    <DropdownPill
                      label="Motivo de Traslado (Catálogo 20 SUNAT - Guía Remisión)"
                      required
                      value={motivoTraslado}
                      onChange={(val) => setMotivoTraslado(val)}
                      options={MOTIVO_TRASLADO_OPCIONES}
                      icon={FileText}
                      placeholder="Seleccionar motivo regulador..."
                      direction="down"
                    />
                  </div>
                </div>

                {/* 2. Buscador de medicamentos en origen */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      1. Seleccionar Medicamentos con Stock en Sede Origen:
                    </label>
                    {catalogoOrigen.length > 0 && (
                      <span className="text-[10.5px] font-medium text-slate-400">
                        {catalogoOrigen.length} lote(s) disponible(s)
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={busquedaMed}
                      onChange={(e) => setBusquedaMed(e.target.value)}
                      placeholder="Filtrar catálogo de origen por nombre de medicamento o lote..."
                      className="w-full bg-white dark:bg-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 dark:text-slate-100 font-medium border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs font-sora h-[38px]"
                    />
                  </div>

                  {/* Lista rápida de catálogo disponible */}
                  <div className="max-h-44 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-2 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 custom-scrollbar">
                    {cargandoCatalogo ? (
                      <div className="text-center py-6 text-xs text-slate-400 flex items-center justify-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                        <span>Cargando stock de origen...</span>
                      </div>
                    ) : !origenId ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        Selecciona una sede de origen arriba para consultar su stock disponible.
                      </div>
                    ) : catalogoOrigen.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400">
                        No hay lotes con stock positivo en esta sede.
                      </div>
                    ) : (
                      catalogoOrigen
                        .filter(s => {
                          const m = s.medicamento;
                          const match =
                            m?.nombre_comercial?.toLowerCase().includes(busquedaMed.toLowerCase()) ||
                            s.lote?.numero_lote?.toLowerCase().includes(busquedaMed.toLowerCase());
                          return match && (s.stock_cajas > 0 || s.stock_fraccion > 0);
                        })
                        .map((s, idx) => {
                          const esFrio = esTermolabil(s.medicamento);
                          return (
                            <div key={idx} className="py-2 px-2.5 flex items-center justify-between text-xs hover:bg-[#EBFDF6]/40 dark:hover:bg-slate-800/50 rounded-xl transition-colors">
                              <div className="min-w-0 flex-1 pr-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate font-sora">
                                    {s.medicamento?.nombre_comercial}
                                  </span>
                                  {esFrio && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 shrink-0 flex items-center gap-0.5">
                                      <Snowflake className="w-2.5 h-2.5 text-cyan-500" />
                                      2°C - 8°C
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                                  <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                    Lt: {s.lote?.numero_lote || 'S/L'}
                                  </span>
                                  <span>Disp: {parseFloat(s.stock_cajas || 0).toFixed(0)} cjs ({s.stock_fraccion || 0} fcs)</span>
                                  {s.lote?.fecha_vencimiento && (
                                    <span>• Venc: {s.lote.fecha_vencimiento}</span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => agregarItemAlTraslado(s)}
                                className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 dark:text-teal-300 font-black text-[11px] rounded-xl border border-teal-200 dark:border-teal-800 transition-colors cursor-pointer shadow-2xs shrink-0"
                              >
                                + Agregar
                              </button>
                            </div>
                          );
                        })
                    )}
                  </div>
                </div>

                {/* 3. Tabla de items agregados al traslado */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                      2. Lista de Despacho ({itemsTraslado.length} ítems seleccionados)
                    </label>
                    {itemsTraslado.length > 0 && (
                      <span className="text-[10.5px] font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 px-2 py-0.5 rounded-lg border border-teal-200 dark:border-teal-800">
                        Total: {itemsTraslado.reduce((acc, i) => acc + (parseFloat(i.cantidad_cajas) || 0), 0)} cjs • {itemsTraslado.reduce((acc, i) => acc + (parseInt(i.cantidad_fracciones) || 0), 0)} fcs
                      </span>
                    )}
                  </div>

                  {itemsTraslado.length === 0 ? (
                    <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 text-xs font-medium bg-slate-50/50 dark:bg-slate-950/30">
                      Haga clic en "+ Agregar" arriba para incluir lotes a este traslado.
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#F8FCFA] dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 font-sora">
                          <tr>
                            <th className="py-2.5 px-3">Medicamento / Lote</th>
                            <th className="py-2.5 px-3 text-center">Stock Disp.</th>
                            <th className="py-2.5 px-3 text-center w-28">Cant. Cajas</th>
                            <th className="py-2.5 px-3 text-center w-28">Fracciones</th>
                            <th className="py-2.5 px-3 text-center w-12">Quitar</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-sora">
                          {itemsTraslado.map((item) => (
                            <tr key={item.id_lote} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                              <td className="py-2 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{item.nombre}</span>
                                  {item.termolabil && (
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 font-black flex items-center gap-1 border border-cyan-200 dark:border-cyan-800">
                                      <Snowflake className="w-2.5 h-2.5 text-cyan-600 dark:text-cyan-400" />
                                      2°C - 8°C
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  Lt: {item.lote} • Venc: {item.vencimiento}
                                </div>
                              </td>
                              <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-300 font-bold text-[11px]">
                                {item.stock_max_cajas} cjs <span className="text-slate-400 font-normal">({item.stock_max_fracciones} fcs)</span>
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.stock_max_cajas}
                                  step="1"
                                  value={item.cantidad_cajas}
                                  onChange={(e) =>
                                    actualizarItemTraslado(item.id_lote, 'cantidad_cajas', e.target.value)
                                  }
                                  className="w-20 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  max={item.stock_max_fracciones}
                                  step="1"
                                  value={item.cantidad_fracciones}
                                  onChange={(e) =>
                                    actualizarItemTraslado(item.id_lote, 'cantidad_fracciones', e.target.value)
                                  }
                                  className="w-20 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20"
                                />
                              </td>
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => eliminarItemTraslado(item.id_lote)}
                                  className="w-7 h-7 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center justify-center transition-colors mx-auto cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 4. Control de Cadena de Frío DIGEMID */}
                <div className={`p-3 rounded-2xl border transition-all ${
                  cadenaFrio
                    ? 'bg-cyan-50/60 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800'
                    : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={cadenaFrio}
                        onChange={(e) => setCadenaFrio(e.target.checked)}
                        className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 border-slate-300 cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-sora">
                        <Snowflake className={`w-4 h-4 ${cadenaFrio ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                        Despacho con Cadena de Frío (2°C - 8°C)
                      </span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-bold">DIGEMID - BPA Transporte</span>
                  </div>
                  {cadenaFrio && (
                    <div className="flex items-start gap-2 mt-2 pl-6">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-cyan-900 dark:text-cyan-200 font-medium leading-relaxed">
                        <strong className="font-bold">Protocolo BPA Activo:</strong> Embalar en caja isotérmica con acumuladores de frío (ice packs) y control mediante datalogger térmico.
                      </p>
                    </div>
                  )}
                </div>

                {/* 5. Modalidad y Datos de Transporte (SUNAT Catálogo 18) */}
                <div className="p-3.5 bg-[#F8FCFA] dark:bg-slate-950/50 rounded-2xl border border-[#D1F4E3] dark:border-slate-800 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-2">
                    <div className="text-[11px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-1.5 font-sora">
                      <Truck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <span>Datos de Transporte / Guía de Remisión</span>
                    </div>

                    {/* Segmented Switch Modalidad */}
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-slate-200/70 dark:bg-slate-800 self-start sm:self-auto border border-slate-200/80 dark:border-slate-700/60 font-sora">
                      <button
                        type="button"
                        onClick={() => setModalidadTransporte('Transporte Privado')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          modalidadTransporte === 'Transporte Privado'
                            ? 'bg-white dark:bg-slate-900 text-[#00855E] dark:text-[#00B884] shadow-xs font-black'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Truck className={`w-3.5 h-3.5 ${modalidadTransporte === 'Transporte Privado' ? 'text-[#00855E] dark:text-[#00B884]' : 'text-slate-400'}`} />
                        <span>Transporte Privado</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalidadTransporte('Transporte Publico')}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          modalidadTransporte === 'Transporte Publico'
                            ? 'bg-white dark:bg-slate-900 text-[#00855E] dark:text-[#00B884] shadow-xs font-black'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        <Building2 className={`w-3.5 h-3.5 ${modalidadTransporte === 'Transporte Publico' ? 'text-[#00855E] dark:text-[#00B884]' : 'text-slate-400'}`} />
                        <span>Courier / Transporte Público</span>
                      </button>
                    </div>
                  </div>

                  {modalidadTransporte === 'Transporte Privado' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Conductor (Personal Botica)
                        </label>
                        <input
                          type="text"
                          value={transportistaNombre}
                          onChange={(e) => setTransportistaNombre(e.target.value)}
                          placeholder="Ej. Carlos Mendoza Ramos"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          DNI / Licencia
                        </label>
                        <input
                          type="text"
                          value={transportistaDoc}
                          onChange={(e) => setTransportistaDoc(e.target.value)}
                          placeholder="45892014"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Placa Vehicular
                        </label>
                        <input
                          type="text"
                          value={vehiculoPlaca}
                          onChange={(e) => setVehiculoPlaca(e.target.value.toUpperCase())}
                          placeholder="ABC-123"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 uppercase outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Empresa de Transporte / Courier
                        </label>
                        <input
                          type="text"
                          value={transportistaNombre}
                          onChange={(e) => setTransportistaNombre(e.target.value)}
                          placeholder="Ej. Shalom Empresarial / Olva Courier"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          RUC Transportista (11 dígitos)
                        </label>
                        <input
                          type="text"
                          maxLength={11}
                          value={transportistaDoc}
                          onChange={(e) => setTransportistaDoc(e.target.value.replace(/\D/g, ''))}
                          placeholder="20123456789"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          N° Guía / Encomienda
                        </label>
                        <input
                          type="text"
                          value={vehiculoPlaca}
                          onChange={(e) => setVehiculoPlaca(e.target.value.toUpperCase())}
                          placeholder="SH-001248"
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-100 uppercase outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        N° de Bultos / Cajas
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={totalBultos}
                        onChange={(e) => setTotalBultos(e.target.value)}
                        placeholder="1"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-center text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                        Observaciones adicionales de entrega
                      </label>
                      <input
                        type="text"
                        value={observacionesEnvio}
                        onChange={(e) => setObservacionesEnvio(e.target.value)}
                        placeholder="Ej. Cajas selladas con precinto de seguridad, entrega antes del mediodía"
                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botonera modal nuevo */}
              <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-950/40 shrink-0 font-sora">
                <div className="text-[11px] font-bold text-slate-400">
                  {itemsTraslado.length > 0 ? (
                    <span className="text-teal-600 dark:text-teal-400">
                      {itemsTraslado.length} producto(s) • {itemsTraslado.reduce((acc, i) => acc + (parseFloat(i.cantidad_cajas) || 0), 0)} cjs • {itemsTraslado.reduce((acc, i) => acc + (parseInt(i.cantidad_fracciones) || 0), 0)} fracc en {totalBultos || 1} bulto(s)
                    </span>
                  ) : (
                    'Sin productos seleccionados'
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setModalNuevoOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardando || itemsTraslado.length === 0}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00855E] to-[#00B884] text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 hover:brightness-105 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {guardando ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Despachando...</span>
                      </>
                    ) : (
                      <>
                        <Truck className="w-4 h-4" />
                        <span>Despachar Traslado</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── 6. MODAL RECEPCIÓN Y CONFORMIDAD EN DESTINO ─── */}
      {modalRecibirOpen && trasladoSeleccionado && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalRecibirOpen(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[90vh] overflow-hidden font-sora animate-in zoom-in-95 duration-200"
          >
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/70 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/60 shadow-2xs shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100 tracking-tight font-sora">
                    Recepción y Conformidad: {trasladoSeleccionado.numero}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-semibold truncate">
                    Verifique los medicamentos antes de ingresarlos al stock de {trasladoSeleccionado.sucursal_destino?.nombre}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalRecibirOpen(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            <form onSubmit={handleConfirmarRecepcion} className="p-6 space-y-4 overflow-y-auto flex-1 custom-modal-scroll">
              <div className="p-3.5 rounded-2xl bg-[#F8FCFA] dark:bg-slate-950/50 border border-[#D1F4E3] dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex justify-between font-sora">
                <span><b>Origen:</b> {trasladoSeleccionado.sucursal_origen?.nombre}</span>
                <span><b>Destino:</b> {trasladoSeleccionado.sucursal_destino?.nombre}</span>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wide font-sora">
                  Ítems a Recepcionar
                </div>
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FCFA] dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase border-b border-slate-100 dark:border-slate-800 font-sora">
                      <tr>
                        <th className="py-2.5 px-3">Medicamento / Lote</th>
                        <th className="py-2.5 px-3 text-center">Enviado</th>
                        <th className="py-2.5 px-3 text-center w-28">Recibido (Cajas)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sora">
                      {itemsRecibidos.map((item, idx) => (
                        <tr key={item.id_detalle}>
                          <td className="py-2.5 px-3">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100">{item.nombre}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Lote: {item.lote}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-600 dark:text-slate-300">
                            {item.cantidad_enviada_cajas} cjs
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.cantidad_recibida_cajas}
                              onChange={(e) => {
                                const val = e.target.value;
                                setItemsRecibidos(
                                  itemsRecibidos.map(i =>
                                    i.id_detalle === item.id_detalle
                                      ? { ...i, cantidad_recibida_cajas: val }
                                      : i
                                  )
                                );
                              }}
                              className="w-20 px-2 py-1 text-center font-bold text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones de Recepción
                </label>
                <input
                  type="text"
                  value={obsRecepcion}
                  onChange={(e) => setObsRecepcion(e.target.value)}
                  placeholder="Ej. Bulto recibido completo y en buen estado de conservación"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 font-sora">
                <button
                  type="button"
                  onClick={() => setModalRecibirOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={procesandoRecepcion}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 hover:scale-102 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {procesandoRecepcion ? 'Cargando Stock...' : 'Conformidad e Ingreso de Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── 7. MODAL IMPRESIÓN GUÍA DE REMISIÓN / DESPACHO DE TRASLADO ─── */}
      {modalGuiaOpen && guiaData && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalGuiaOpen(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[92vh] font-sora animate-in zoom-in-95 duration-200"
          >
            <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/90 dark:bg-slate-950/40 shrink-0">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                  Hoja de Despacho & Traslado: {guiaData.numero}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalGuiaOpen(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-300 hover:text-white dark:hover:text-white border border-rose-200/90 dark:border-rose-800/70 hover:border-rose-500 dark:hover:border-rose-600 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 stroke-[2.5] text-rose-600 dark:text-rose-300 group-hover:text-white group-hover:rotate-90 transition-transform duration-200" />
              </button>
            </div>

            {/* Vista Previa de la Guía */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100/70 dark:bg-slate-950/80 flex justify-center custom-modal-scroll">
              <div
                ref={printGuiaRef}
                className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-md w-full font-mono text-xs text-slate-900 space-y-4"
              >
                <div className="text-center border-b border-dashed border-slate-300 pb-3">
                  <h2 className="font-black text-sm uppercase">BOTICA HEIS & SALUD</h2>
                  <p className="font-bold text-[10px]">GUÍA INTERNA DE TRASLADO ENTRE SEDES</p>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">
                    N°: {guiaData.numero} {guiaData.guia_remision_numero ? `• GRE: ${guiaData.guia_remision_numero}` : ''}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Fecha: {new Date(guiaData.fecha_envio || guiaData.created_at).toLocaleString('es-PE')}
                  </p>
                </div>

                <div className="space-y-1.5 text-[10px] border-b border-dashed border-slate-300 pb-3">
                  <div><b>MOTIVO SUNAT:</b> {guiaData.motivo_traslado || '04 - TRASLADO ENTRE ESTABLECIMIENTOS'}</div>
                  <div><b>MODALIDAD:</b> {guiaData.modalidad_transporte || 'Transporte Privado'}</div>
                  {guiaData.observaciones?.includes('TERMOLÁBIL') && (
                    <div className="p-1.5 rounded bg-cyan-50 border border-cyan-200 text-cyan-800 font-black text-[9px] text-center">
                      [MERCADERÍA TERMOLÁBIL - CADENA DE FRÍO 2°C - 8°C]
                    </div>
                  )}
                  <div className="pt-1"><b>ORIGEN:</b> {guiaData.sucursal_origen?.nombre}</div>
                  <div className="text-slate-500 pl-3">{guiaData.sucursal_origen?.direccion}</div>
                  <div className="pt-1"><b>DESTINO:</b> {guiaData.sucursal_destino?.nombre}</div>
                  <div className="text-slate-500 pl-3">{guiaData.sucursal_destino?.direccion}</div>
                  {(guiaData.transportista_nombre || guiaData.vehiculo_placa) && (
                    <div className="pt-1">
                      <b>TRANSPORTE:</b> {guiaData.transportista_nombre || 'N/A'} {guiaData.transportista_documento ? `(Doc: ${guiaData.transportista_documento})` : ''} {guiaData.vehiculo_placa ? `• Placa: ${guiaData.vehiculo_placa}` : ''}
                    </div>
                  )}
                  {guiaData.observaciones && (
                    <div className="pt-1 text-[9px] text-slate-500 italic">
                      Obs: {guiaData.observaciones}
                    </div>
                  )}
                </div>

                <div className="space-y-2 border-b border-dashed border-slate-300 pb-3">
                  <div className="font-black text-[10px] flex justify-between border-b border-slate-200 pb-1">
                    <span>DESCRIPCIÓN / LOTE</span>
                    <span>CANT</span>
                  </div>
                  {(guiaData.detalles || []).map((det, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[10px]">
                      <div>
                        <div className="font-bold">{det.medicamento?.nombre_comercial}</div>
                        <div className="text-[8.5px] text-slate-500">
                          Lt: {det.lote?.numero_lote || 'S/L'} • Venc: {det.lote?.fecha_vencimiento || ''}
                        </div>
                      </div>
                      <div className="font-black text-right shrink-0">
                        {parseFloat(det.cantidad_enviada_cajas || 0).toFixed(0)} cjs
                        {det.cantidad_enviada_fracciones > 0 && ` +${det.cantidad_enviada_fracciones} fr`}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 grid grid-cols-2 gap-4 text-center text-[9px] text-slate-500">
                  <div className="border-t border-slate-400 pt-1">
                    Firma Despachador (Q.F.)
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    Firma Receptor (Conformidad)
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-slate-400 font-medium">
                Listo para impresión térmica o A4
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalGuiaOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={handlePrintGuia}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-extrabold text-xs shadow-md shadow-teal-500/25 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Guía</span>
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
