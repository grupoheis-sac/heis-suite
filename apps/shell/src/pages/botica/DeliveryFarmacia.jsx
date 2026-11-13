import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
  Bike,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  Plus,
  Search,
  ThermometerSnowflake,
  Banknote,
  CreditCard,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Phone,
  MapPin,
  Calendar,
  Printer,
  ChevronRight,
  User,
  ShieldAlert,
  ArrowRight,
  Filter,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  FileText,
  Building2,
  Check,
  X,
  Receipt,
  Zap,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@heis/core';
import DropdownPill from './components/DropdownPill';

// Métodos de pago oficiales para delivery con metadatos visuales y diseño premium
const METODOS_PAGO_OPCIONES = [
  {
    id: 'Contraentrega',
    nombre: 'Efectivo Contraentrega',
    subtitulo: 'El motorizado cobra en efectivo en el domicilio del cliente',
    badge: 'Efectivo en mano',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300/80',
    iconColor: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/80',
    icon: Banknote
  },
  {
    id: 'Yape',
    nombre: 'Yape Móvil (BCP)',
    subtitulo: 'Pago vía código QR o celular al número autorizado de la botica',
    badge: 'Billetera BCP',
    badgeColor: 'bg-purple-50 text-purple-800 border-purple-300/80',
    iconColor: 'bg-purple-500/10 text-purple-600 border-purple-200/80',
    icon: Smartphone
  },
  {
    id: 'Plin',
    nombre: 'Plin Móvil (Interbank / BBVA / Scotiabank)',
    subtitulo: 'Transferencia móvil inmediata al número de la botica',
    badge: 'Billetera Digital',
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-300/80',
    iconColor: 'bg-sky-500/10 text-sky-600 border-sky-200/80',
    icon: Smartphone
  },
  {
    id: 'Tarjeta',
    nombre: 'Tarjeta Débito / Crédito (POS Móvil)',
    subtitulo: 'El motorizado lleva un equipo POS inalámbrico a domicilio',
    badge: 'POS Móvil',
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-300/80',
    iconColor: 'bg-indigo-500/10 text-indigo-600 border-indigo-200/80',
    icon: CreditCard
  },
  {
    id: 'Pagado_Previo',
    nombre: 'Pagado Previo (Web / Transferencia)',
    subtitulo: 'Abono validado en cuenta bancaria antes de despachar a ruta',
    badge: 'Pago Confirmado',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-300/80',
    iconColor: 'bg-teal-500/10 text-teal-600 border-teal-200/80',
    icon: CheckCircle2
  }
];

export default function DeliveryFarmacia() {
  const { user } = useAuthStore();
  const [pedidos, setPedidos] = useState([]);
  const [metricas, setMetricas] = useState({
    total: 0,
    pendientes: 0,
    preparando: 0,
    enRuta: 0,
    entregados: 0,
    cancelados: 0,
    porCobrarRuta: 0
  });
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [sucursalSeleccionada, setSucursalSeleccionada] = useState(user?.id_sucursal || 'todas');

  // Modales
  const [modalNuevo, setModalNuevo] = useState(false);
  const [modalDespacho, setModalDespacho] = useState(false);
  const [modalEntrega, setModalEntrega] = useState(false);
  const [modalImprimir, setModalImprimir] = useState(false);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [datosImpresion, setDatosImpresion] = useState(null);

  // Dropdown personalizado de método de pago
  const [dropdownMetodoPagoOpen, setDropdownMetodoPagoOpen] = useState(false);
  const dropdownMetodoRef = useRef(null);

  // Cerrar dropdown de método de pago al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownMetodoRef.current && !dropdownMetodoRef.current.contains(event.target)) {
        setDropdownMetodoPagoOpen(false);
      }
    };
    if (dropdownMetodoPagoOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownMetodoPagoOpen]);

  // Cerrar modales y dropdown con tecla Escape
  useEffect(() => {
    if (!modalNuevo && !modalDespacho && !modalEntrega && !modalImprimir && !dropdownMetodoPagoOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (dropdownMetodoPagoOpen) {
          setDropdownMetodoPagoOpen(false);
          return;
        }
        setModalNuevo(false);
        setModalDespacho(false);
        setModalEntrega(false);
        setModalImprimir(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalNuevo, modalDespacho, modalEntrega, modalImprimir, dropdownMetodoPagoOpen]);

  // Bloquear el scroll de la página de fondo cuando cualquier modal esté abierto
  useEffect(() => {
    if (modalNuevo || modalDespacho || modalEntrega || modalImprimir) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [modalNuevo, modalDespacho, modalEntrega, modalImprimir]);

  // Formulario Nuevo Pedido
  const [formNuevo, setFormNuevo] = useState({
    paciente_nombre: '',
    paciente_dni: '',
    paciente_telefono: '',
    direccion_entrega: '',
    referencia: '',
    distrito: 'Local',
    metodo_pago: 'Contraentrega',
    monto_total: '',
    monto_paga_con: '',
    costo_envio: '0.00',
    requiere_cadena_frio: false,
    temperatura_salida: '5.0',
    productos_resumen: '',
    observaciones: '',
    id_sucursal: user?.id_sucursal || '',
    id_venta: null,
    repartidor_nombre: '',
    repartidor_telefono: '',
    vehiculo_placa: ''
  });

  // ─── ESTADOS DE LA SOLUCIÓN HÍBRIDA (NUEVO PEDIDO) ───
  const [modoNuevoPedido, setModoNuevoPedido] = useState('rapido'); // 'rapido' | 'pos'
  const [montoProductos, setMontoProductos] = useState('');
  const [costoEnvio, setCostoEnvio] = useState('0.00');
  const [tipoReceta, setTipoReceta] = useState('venta_libre'); // 'venta_libre' | 'receta_fisica' | 'receta_digital'
  const [tipoUrgencia, setTipoUrgencia] = useState('inmediata'); // 'inmediata' | 'programada'
  const [horaProgramada, setHoraProgramada] = useState('');
  const [asignarRepartidorDirecto, setAsignarRepartidorDirecto] = useState(false);

  // Búsqueda de clientes para autocompletado
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clientesEncontrados, setClientesEncontrados] = useState([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);

  // Búsqueda y vinculación con Ventas POS
  const [ventasDisponibles, setVentasDisponibles] = useState([]);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [busquedaVenta, setBusquedaVenta] = useState('');
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);

  // Funciones auxiliares de cálculo y sincronización de flete
  const handleCambioMontoProductos = (val) => {
    setMontoProductos(val);
    const prod = parseFloat(val || 0);
    const envio = parseFloat(costoEnvio || 0);
    const total = (prod + envio).toFixed(2);
    setFormNuevo((prev) => ({ ...prev, monto_total: total }));
  };

  const handleCambioCostoEnvio = (val) => {
    setCostoEnvio(val);
    const prod = parseFloat(montoProductos || formNuevo.monto_total || 0);
    const envio = parseFloat(val || 0);
    const total = (prod + envio).toFixed(2);
    setFormNuevo((prev) => ({ ...prev, costo_envio: val, monto_total: total }));
  };

  // Buscar clientes en base de datos para autocompletar
  const buscarClientes = async (texto) => {
    setBusquedaCliente(texto);
    if (!texto || texto.trim().length < 2) {
      setClientesEncontrados([]);
      setMostrarDropdownClientes(false);
      return;
    }
    setBuscandoClientes(true);
    try {
      const res = await api.get('/clientes', {
        params: { busqueda: texto.trim(), limit: 5 }
      });
      const data = res.data?.success !== undefined ? res.data : res;
      if (data?.clientes) {
        setClientesEncontrados(data.clientes);
        setMostrarDropdownClientes(data.clientes.length > 0);
      }
    } catch (err) {
      console.warn('Error al buscar clientes:', err);
    } finally {
      setBuscandoClientes(false);
    }
  };

  const seleccionarCliente = (cliente) => {
    setFormNuevo((prev) => ({
      ...prev,
      paciente_nombre: cliente.nombre || prev.paciente_nombre,
      paciente_dni: cliente.numero_documento || prev.paciente_dni,
      paciente_telefono: cliente.telefono || prev.paciente_telefono,
      direccion_entrega: cliente.direccion || prev.direccion_entrega
    }));
    setMostrarDropdownClientes(false);
    setBusquedaCliente('');
    toast.success(`Datos de ${cliente.nombre} cargados`);
  };

  // Cargar ventas POS recientes
  const cargarVentasPOS = async () => {
    setCargandoVentas(true);
    try {
      const res = await api.get('/ventas?limit=25');
      const data = res.data?.success !== undefined ? res.data : res;
      if (data?.ventas) {
        setVentasDisponibles(data.ventas.filter((v) => v.estado !== 'Anulada'));
      }
    } catch (err) {
      console.warn('Error al cargar ventas POS:', err);
    } finally {
      setCargandoVentas(false);
    }
  };

  const seleccionarVentaPOS = (venta) => {
    setVentaSeleccionada(venta);
    const resumen = (venta.detalles || []).map((d) => {
      const cant = d.cantidad_unidades || d.cantidad_fracciones || 1;
      const med = d.medicamento?.nombre_comercial || 'Producto';
      const conc = d.medicamento?.concentracion ? ` ${d.medicamento.concentracion}` : '';
      return `${cant}x ${med}${conc}`;
    }).join(', ');

    if (venta.numero_receta || venta.medico_cmp) {
      setTipoReceta('receta_fisica');
    }

    const totalVenta = parseFloat(venta.total || 0);
    const envio = parseFloat(costoEnvio || 0);
    const totalCobrar = (totalVenta + envio).toFixed(2);

    setMontoProductos(totalVenta.toFixed(2));
    setFormNuevo((prev) => ({
      ...prev,
      id_venta: venta.id,
      paciente_nombre: venta.paciente_nombre || venta.cliente?.nombre || prev.paciente_nombre,
      paciente_dni: venta.paciente_dni || venta.cliente?.numero_documento || prev.paciente_dni,
      paciente_telefono: venta.cliente?.telefono || prev.paciente_telefono,
      direccion_entrega: venta.cliente?.direccion || prev.direccion_entrega,
      productos_resumen: resumen || prev.productos_resumen,
      monto_total: totalCobrar,
      costo_envio: costoEnvio,
      metodo_pago: 'Pagado_Previo'
    }));

    toast.success(`Venta ${venta.tipo_comprobante} ${venta.serie}-${venta.numero} vinculada`);
  };

  const desvincularVentaPOS = () => {
    setVentaSeleccionada(null);
    setFormNuevo((prev) => ({
      ...prev,
      id_venta: null,
      metodo_pago: 'Contraentrega'
    }));
    toast('Venta desvinculada');
  };

  // Filtrado de ventas POS en memoria
  const ventasFiltradas = ventasDisponibles.filter((v) => {
    if (!busquedaVenta) return true;
    const q = busquedaVenta.toLowerCase().trim();
    const comp = `${v.tipo_comprobante} ${v.serie}-${v.numero}`.toLowerCase();
    const cliente = (v.paciente_nombre || v.cliente?.nombre || '').toLowerCase();
    const doc = (v.cliente?.numero_documento || v.paciente_dni || '').toLowerCase();
    return comp.includes(q) || cliente.includes(q) || doc.includes(q);
  });

  // Formulario Despacho
  const [formDespacho, setFormDespacho] = useState({
    repartidor_nombre: '',
    repartidor_telefono: '',
    vehiculo_placa: '',
    temperatura_salida: '5.0',
    observaciones: ''
  });

  // Formulario Entrega
  const [formEntrega, setFormEntrega] = useState({
    recibido_por_nombre: '',
    recibido_por_dni: '',
    temperatura_llegada: '5.2',
    observaciones: ''
  });

  // Cargar lista de sucursales
  useEffect(() => {
    const fetchSucursales = async () => {
      try {
        const res = await api.get('/sucursales');
        const data = res.data?.success !== undefined ? res.data : res;
        if (data?.success) {
          setSucursales(data.sucursales || []);
        }
      } catch (err) {
        console.warn('No se pudieron cargar sucursales:', err.message);
      }
    };
    fetchSucursales();
  }, []);

  // Cargar pedidos
  const cargarPedidos = async () => {
    setCargando(true);
    try {
      const res = await api.get('/delivery', {
        params: {
          estado: filtroEstado,
          id_sucursal: sucursalSeleccionada,
          busqueda
        }
      });
      const data = res.data?.success !== undefined ? res.data : res;
      if (data?.success) {
        setPedidos(data.pedidos || []);
        if (data.metricas) {
          setMetricas(data.metricas);
        }
      }
    } catch (err) {
      toast.error('Error al cargar pedidos de delivery');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, [filtroEstado, sucursalSeleccionada]);

  // Manejo de búsqueda
  const handleBuscar = (e) => {
    e.preventDefault();
    cargarPedidos();
  };

  // Crear pedido
  const handleCrearPedido = async (e) => {
    e.preventDefault();
    if (!formNuevo.paciente_nombre || !formNuevo.paciente_telefono || !formNuevo.direccion_entrega) {
      toast.error('Por favor complete los campos obligatorios del paciente y entrega');
      return;
    }

    try {
      let observacionesFinales = (formNuevo.observaciones || '').trim();

      if (tipoReceta === 'receta_fisica') {
        observacionesFinales = `[DIGEMID: RECETA FÍSICA - VERIFICAR/RECOGER EN ENTREGA] ${observacionesFinales}`.trim();
      } else if (tipoReceta === 'receta_digital') {
        observacionesFinales = `[DIGEMID: RECETA DIGITAL VALIDADA POR Q.F.] ${observacionesFinales}`.trim();
      }

      if (tipoUrgencia === 'programada' && horaProgramada) {
        observacionesFinales = `[ENTREGA PROGRAMADA: ${horaProgramada}] ${observacionesFinales}`.trim();
      } else {
        observacionesFinales = `[ENTREGA INMEDIATA] ${observacionesFinales}`.trim();
      }

      if (ventaSeleccionada) {
        observacionesFinales = `[VENTA POS: ${ventaSeleccionada.tipo_comprobante} ${ventaSeleccionada.serie}-${ventaSeleccionada.numero}] ${observacionesFinales}`.trim();
      }

      const payload = {
        ...formNuevo,
        id_venta: ventaSeleccionada?.id || formNuevo.id_venta || null,
        costo_envio: parseFloat(costoEnvio || formNuevo.costo_envio || 0),
        monto_total: parseFloat(formNuevo.monto_total || 0),
        observaciones: observacionesFinales || null
      };

      if (!asignarRepartidorDirecto) {
        delete payload.repartidor_nombre;
        delete payload.repartidor_telefono;
        delete payload.vehiculo_placa;
      }

      const res = await api.post('/delivery', payload);
      const data = res.data?.success !== undefined ? res.data : res;
      if (data?.success) {
        toast.success(`Pedido ${data.pedido.numero_guia_reparto} registrado exitosamente`);
        setModalNuevo(false);
        // Reset states
        setModoNuevoPedido('rapido');
        setVentaSeleccionada(null);
        setMontoProductos('');
        setCostoEnvio('0.00');
        setTipoReceta('venta_libre');
        setTipoUrgencia('inmediata');
        setHoraProgramada('');
        setAsignarRepartidorDirecto(false);
        setBusquedaCliente('');
        setBusquedaVenta('');
        setFormNuevo({
          paciente_nombre: '',
          paciente_dni: '',
          paciente_telefono: '',
          direccion_entrega: '',
          referencia: '',
          distrito: 'Local',
          metodo_pago: 'Contraentrega',
          monto_total: '',
          monto_paga_con: '',
          costo_envio: '0.00',
          requiere_cadena_frio: false,
          temperatura_salida: '5.0',
          productos_resumen: '',
          observaciones: '',
          id_sucursal: user?.id_sucursal || '',
          id_venta: null,
          repartidor_nombre: '',
          repartidor_telefono: '',
          vehiculo_placa: ''
        });
        cargarPedidos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Error al registrar pedido');
    }
  };

  // Pasar a Preparando
  const handlePasarPreparando = async (pedido) => {
    try {
      const res = await api.patch(`/delivery/${pedido.id}/estado`, {
        estado: 'Preparando'
      });
      const data = res.data?.success !== undefined ? res.data : res;
      if (data?.success) {
        toast.success(`Pedido puesto en preparación`);
        cargarPedidos();
      }
    } catch (err) {
      toast.error('Error al actualizar estado');
    }
  };

  // Abrir modal despacho
  const handleAbrirDespacho = (pedido) => {
    setPedidoSeleccionado(pedido);
    setFormDespacho({
      repartidor_nombre: pedido.repartidor_nombre || '',
      repartidor_telefono: pedido.repartidor_telefono || '',
      vehiculo_placa: pedido.vehiculo_placa || '',
      temperatura_salida: pedido.temperatura_salida || (pedido.requiere_cadena_frio ? '5.0' : ''),
      observaciones: pedido.observaciones || ''
    });
    setModalDespacho(true);
  };

  // Confirmar despacho
  const handleConfirmarDespacho = async (e) => {
    e.preventDefault();
    if (!formDespacho.repartidor_nombre) {
      toast.error('Indique el nombre del repartidor o motorizado');
      return;
    }

    try {
      const res = await api.patch(`/delivery/${pedidoSeleccionado.id}/estado`, {
        estado: 'En_Ruta',
        ...formDespacho
      });
      const data = res.data?.success !== undefined ? res.data : res;
      if (data?.success) {
        toast.success('Pedido despachado a ruta exitosamente');
        setModalDespacho(false);
        cargarPedidos();
      }
    } catch (err) {
      toast.error('Error al despachar pedido');
    }
  };

  // Abrir modal entrega
  const handleAbrirEntrega = (pedido) => {
    setPedidoSeleccionado(pedido);
    setFormEntrega({
      recibido_por_nombre: pedido.paciente_nombre || '',
      recibido_por_dni: pedido.paciente_dni || '',
      temperatura_llegada: pedido.requiere_cadena_frio ? '5.2' : '',
      observaciones: pedido.observaciones || ''
    });
    setModalEntrega(true);
  };

  // Confirmar entrega
  const handleConfirmarEntrega = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/delivery/${pedidoSeleccionado.id}/estado`, {
        estado: 'Entregado',
        ...formEntrega
      });
      const data = res.data?.success !== undefined ? res.data : res;
      if (data?.success) {
        toast.success('Entrega confirmada y registrada en el historial');
        setModalEntrega(false);
        cargarPedidos();
      }
    } catch (err) {
      toast.error('Error al confirmar entrega');
    }
  };

  // Cancelar pedido
  const handleCancelarPedido = async (pedido) => {
    if (!confirm(`¿Está seguro de cancelar el pedido ${pedido.numero_guia_reparto}?`)) return;

    try {
      const res = await api.patch(`/delivery/${pedido.id}/estado`, {
        estado: 'Cancelado'
      });
      const data = res.data?.success !== undefined ? res.data : res;
      if (data?.success) {
        toast.success('Pedido cancelado');
        cargarPedidos();
      }
    } catch (err) {
      toast.error('Error al cancelar pedido');
    }
  };

  // Imprimir Hoja de Ruta / Guía de Reparto
  const handleImprimirGuia = async (pedido) => {
    try {
      const res = await api.get(`/delivery/${pedido.id}/imprimir`);
      const data = res.data?.success !== undefined ? res.data : res;
      if (data?.success) {
        setDatosImpresion(data.guia);
        setModalImprimir(true);
      }
    } catch (err) {
      toast.error('Error al cargar datos para impresión');
    }
  };

  // Cálculo de vuelto en tiempo real
  const vueltoCalculado = () => {
    const total = parseFloat(formNuevo.monto_total || 0);
    const pagaCon = parseFloat(formNuevo.monto_paga_con || 0);
    if (pagaCon > total) return (pagaCon - total).toFixed(2);
    return '0.00';
  };

  return (
    <div className="space-y-4 w-full max-w-[1440px] mx-auto pb-8 animate-in fade-in duration-300">
      {/* ─── HEADER PRINCIPAL ELEGANTE Y COMPACTO TIPO PÍLDORA (ESTILO HISTORIAL DE VENTAS) ─── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 bg-white dark:bg-slate-900 rounded-2xl py-3 px-4 sm:px-5 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
            <Bike className="w-4.5 h-4.5 text-[#00B884] dark:text-[#5EEBB8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora">
                Módulo de Delivery & Envíos a Domicilio
              </h1>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
                <ThermometerSnowflake className="w-3 h-3 text-[#00B884] dark:text-[#5EEBB8]" />
                BPD (R.M. 554-2022/MINSA)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              Gestión de repartos, cadena de frío (2°C – 8°C), cobranza contraentrega y hojas de ruta para motorizados.
            </p>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <button
            type="button"
            onClick={cargarPedidos}
            disabled={cargando}
            className="h-9 px-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer shadow-2xs font-bold text-xs flex items-center gap-1.5 shrink-0"
            title="Refrescar pedidos de delivery"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-[#00B884]' : 'text-slate-500 dark:text-slate-400'}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => setModalNuevo(true)}
            className="h-9 px-3.5 sm:px-4 rounded-xl glow-btn-emerald bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-xs font-black text-white transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-95 cursor-pointer shrink-0 font-sora"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Pedido Delivery</span>
          </button>
        </div>
      </div>

      {/* ─── TARJETAS DE INDICADORES / KPIS (IDÉNTICO A VENTAS Y FACTURACIÓN: COMPACTAS Y TEMA DÍA) ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* 1. Pendientes */}
        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === 'Pendiente' ? 'todos' : 'Pendiente')}
          className={`text-left p-3.5 rounded-2xl bg-white transition-all duration-200 cursor-pointer select-none flex flex-col justify-between relative overflow-hidden ${
            filtroEstado === 'Pendiente'
              ? 'border-2 border-amber-400 ring-2 ring-amber-400/30 bg-amber-50/20 shadow-md -translate-y-0.5'
              : 'border border-[#D1F4E3] soft-card-shadow hover:border-amber-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
          }`}
          title="Filtrar pedidos Pendientes por validar y preparar"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 font-sora truncate">Pendientes</span>
            <span className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 shrink-0">
              <Clock className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-amber-600 font-sora tracking-tight">
              {metricas.pendientes}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black font-sora flex items-center gap-1 shrink-0 ${
              filtroEstado === 'Pendiente'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-amber-50 text-amber-700 border border-amber-200'
            }`}>
              {filtroEstado === 'Pendiente' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />}
              {filtroEstado === 'Pendiente' ? 'Filtrando' : 'Por validar'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Por validar y preparar</span>
        </button>

        {/* 2. Preparando */}
        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === 'Preparando' ? 'todos' : 'Preparando')}
          className={`text-left p-3.5 rounded-2xl bg-white transition-all duration-200 cursor-pointer select-none flex flex-col justify-between relative overflow-hidden ${
            filtroEstado === 'Preparando'
              ? 'border-2 border-blue-400 ring-2 ring-blue-400/30 bg-blue-50/20 shadow-md -translate-y-0.5'
              : 'border border-[#D1F4E3] soft-card-shadow hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
          }`}
          title="Filtrar pedidos en empaque farmacéutico (Preparando)"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 font-sora truncate">Preparando</span>
            <span className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 shrink-0">
              <Package className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-blue-600 font-sora tracking-tight">
              {metricas.preparando}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black font-sora flex items-center gap-1 shrink-0 ${
              filtroEstado === 'Preparando'
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}>
              {filtroEstado === 'Preparando' && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shrink-0" />}
              {filtroEstado === 'Preparando' ? 'Filtrando' : 'En empaque'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">En empaque farmacéutico</span>
        </button>

        {/* 3. En Ruta */}
        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === 'En_Ruta' ? 'todos' : 'En_Ruta')}
          className={`text-left p-3.5 rounded-2xl bg-white transition-all duration-200 cursor-pointer select-none flex flex-col justify-between relative overflow-hidden ${
            filtroEstado === 'En_Ruta'
              ? 'border-2 border-indigo-400 ring-2 ring-indigo-400/30 bg-indigo-50/20 shadow-md -translate-y-0.5'
              : 'border border-[#D1F4E3] soft-card-shadow hover:border-indigo-400 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
          }`}
          title="Filtrar pedidos despachados con repartidor (En Ruta)"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 font-sora truncate">En Ruta</span>
            <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200/60 shrink-0">
              <Bike className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-indigo-600 font-sora tracking-tight">
              {metricas.enRuta}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black font-sora flex items-center gap-1 shrink-0 ${
              filtroEstado === 'En_Ruta'
                ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}>
              {filtroEstado === 'En_Ruta' && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse shrink-0" />}
              {filtroEstado === 'En_Ruta' ? 'Filtrando' : 'En tránsito'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Con repartidor asignado</span>
        </button>

        {/* 4. Por Cobrar en Ruta */}
        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === 'En_Ruta' ? 'todos' : 'En_Ruta')}
          className={`text-left p-3.5 rounded-2xl bg-white transition-all duration-200 cursor-pointer select-none flex flex-col justify-between relative overflow-hidden ${
            filtroEstado === 'En_Ruta'
              ? 'border-2 border-[#00B884] ring-2 ring-[#00B884]/30 bg-[#EBFDF6]/20 shadow-md -translate-y-0.5'
              : 'border border-[#D1F4E3] soft-card-shadow hover:border-[#00B884] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
          }`}
          title="Ver pedidos con cobro contraentrega en ruta"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#00855E] font-sora truncate">Por Cobrar en Ruta</span>
            <span className="p-1 rounded-lg bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] shrink-0">
              <Banknote className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-slate-800 font-sora tracking-tight truncate" title={`S/ ${Number(metricas.porCobrarRuta || 0).toFixed(2)}`}>
              S/ {Number(metricas.porCobrarRuta || 0).toFixed(2)}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] font-sora shrink-0">
              Efectivo
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Contraentrega en ruta</span>
        </button>

        {/* 5. Entregados Hoy */}
        <button
          type="button"
          onClick={() => setFiltroEstado(filtroEstado === 'Entregado' ? 'todos' : 'Entregado')}
          className={`text-left p-3.5 rounded-2xl bg-white transition-all duration-200 cursor-pointer select-none flex flex-col justify-between relative overflow-hidden col-span-2 sm:col-span-1 md:col-span-1 lg:col-span-1 ${
            filtroEstado === 'Entregado'
              ? 'border-2 border-emerald-500 ring-2 ring-emerald-500/30 bg-emerald-50/20 shadow-md -translate-y-0.5'
              : 'border border-[#D1F4E3] soft-card-shadow hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0'
          }`}
          title="Filtrar pedidos completados con éxito (Entregados)"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 font-sora truncate">Entregados Hoy</span>
            <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-lg sm:text-xl font-black text-emerald-600 font-sora tracking-tight">
              {metricas.entregados}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black font-sora flex items-center gap-1 shrink-0 ${
              filtroEstado === 'Entregado'
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {filtroEstado === 'Entregado' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />}
              {filtroEstado === 'Entregado' ? 'Filtrando' : 'Cerrados'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 font-medium truncate">Completados con éxito</span>
        </button>
      </div>

      {/* ─── BARRA DE FILTROS Y ESTADOS ─── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Pestañas de Estado */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'todos', label: 'Todos', count: metricas.total },
            { id: 'Pendiente', label: 'Pendientes', count: metricas.pendientes, color: 'text-amber-600 bg-amber-50' },
            { id: 'Preparando', label: 'Preparando', count: metricas.preparando, color: 'text-blue-600 bg-blue-50' },
            { id: 'En_Ruta', label: 'En Ruta', count: metricas.enRuta, color: 'text-indigo-600 bg-indigo-50' },
            { id: 'Entregado', label: 'Entregados', count: metricas.entregados, color: 'text-emerald-600 bg-emerald-50' },
            { id: 'Cancelado', label: 'Cancelados', count: metricas.cancelados, color: 'text-rose-600 bg-rose-50' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFiltroEstado(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                filtroEstado === tab.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                  filtroEstado === tab.id ? 'bg-white/20 text-white' : tab.color || 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Buscador y Sucursal */}
        <div className="flex items-center gap-2">
          {sucursales.length > 0 && (
            <div className="w-48 shrink-0">
              <DropdownPill
                value={sucursalSeleccionada}
                onChange={(val) => setSucursalSeleccionada(val)}
                options={[
                  { value: 'todas', label: 'Todas las Sedes' },
                  ...sucursales.map((s) => ({
                    value: String(s.id),
                    label: s.nombre,
                    subtitle: `Sede #${s.id}`
                  }))
                ]}
                icon={Building2}
              />
            </div>
          )}

          <form onSubmit={handleBuscar} className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paciente, teléfono, guía..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200/80 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </form>
        </div>
      </div>

      {/* ─── LISTADO DE PEDIDOS (TARJETAS DINÁMICAS) ─── */}
      {cargando ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Cargando despachos de delivery...</p>
        </div>
      ) : pedidos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Bike className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-slate-700">No hay pedidos registrados</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            No se encontraron pedidos de delivery con los filtros actuales. Haz clic en "Nuevo Pedido Delivery" para registrar uno.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {pedidos.map((p) => {
            const esFrio = p.requiere_cadena_frio;
            let badgeConfig = {
              color: 'bg-slate-100 text-slate-700 border-slate-200',
              dot: 'bg-slate-400',
              label: p.estado.replace('_', ' ')
            };
            if (p.estado === 'Pendiente') {
              badgeConfig = {
                color: 'bg-amber-50 text-amber-800 border-amber-200 shadow-2xs',
                dot: 'bg-amber-500 animate-pulse',
                label: 'Pendiente'
              };
            } else if (p.estado === 'Preparando') {
              badgeConfig = {
                color: 'bg-blue-50 text-blue-800 border-blue-200 shadow-2xs',
                dot: 'bg-blue-500 animate-pulse',
                label: 'Preparando'
              };
            } else if (p.estado === 'En_Ruta') {
              badgeConfig = {
                color: 'bg-indigo-50 text-indigo-800 border-indigo-200 shadow-2xs',
                dot: 'bg-indigo-500 animate-ping',
                label: 'En Ruta'
              };
            } else if (p.estado === 'Entregado') {
              badgeConfig = {
                color: 'bg-[#EBFDF6] text-[#00855E] border-[#A6F6D8] shadow-2xs',
                dot: 'bg-[#00B884]',
                label: 'Entregado'
              };
            } else if (p.estado === 'Cancelado') {
              badgeConfig = {
                color: 'bg-rose-50 text-rose-800 border-rose-200 shadow-2xs',
                dot: 'bg-rose-500',
                label: 'Cancelado'
              };
            }

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl border border-[#D1F4E3] p-4 sm:p-5 soft-card-shadow hover:border-[#00B884] hover:shadow-md transition-all duration-200 flex flex-col justify-between gap-3.5 relative group overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Encabezado con Guía y Estado (Tema Día Botica) */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] font-mono text-xs font-black shadow-2xs font-sora">
                        <FileText className="w-3.5 h-3.5 text-[#00B884] shrink-0" />
                        <span>{p.numero_guia_reparto}</span>
                      </div>
                      {esFrio && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-cyan-50 text-cyan-800 border border-cyan-200/80 flex items-center gap-1 shadow-2xs font-sora">
                          <ThermometerSnowflake className="w-3 h-3 text-cyan-600 shrink-0" />
                          <span>2°C – 8°C</span>
                        </span>
                      )}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-black border flex items-center gap-1.5 font-sora shrink-0 ${badgeConfig.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeConfig.dot}`} />
                      <span>{badgeConfig.label}</span>
                    </span>
                  </div>

                  {/* Tarjeta Interna del Paciente / Destino */}
                  <div className="p-3 rounded-xl bg-slate-50/90 border border-slate-200/70 space-y-2">
                    {/* Paciente y DNI */}
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#EBFDF6] border border-[#A6F6D8] flex items-center justify-center text-[#00855E] shadow-2xs shrink-0 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-[13px] font-black text-slate-800 font-sora leading-tight truncate">
                          {p.paciente_nombre}
                        </h4>
                        {p.paciente_dni && (
                          <span className="text-[9.5px] font-bold text-slate-500 bg-white px-1.5 py-0.2 rounded border border-slate-200/80 inline-block mt-0.5 font-mono">
                            DNI: {p.paciente_dni}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dirección de Entrega */}
                    <div className="flex items-start gap-2 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-rose-50 border border-rose-200/70 flex items-center justify-center text-rose-500 shadow-2xs shrink-0 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-700 leading-snug text-xs">
                          {p.direccion_entrega}
                        </p>
                        {p.referencia && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5">
                            Ref: {p.referencia}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Teléfono y Distrito */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] flex items-center justify-center shrink-0">
                          <Phone className="w-3 h-3 text-[#00B884]" />
                        </div>
                        <a
                          href={`tel:${p.paciente_telefono}`}
                          className="text-xs font-bold text-slate-700 hover:text-[#00855E] hover:underline font-mono"
                        >
                          {p.paciente_telefono}
                        </a>
                      </div>
                      {p.distrito && (
                        <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/70 font-sora">
                          {p.distrito}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resumen de Medicamentos Solicitados */}
                  {p.productos_resumen && (
                    <div className="p-2.5 rounded-xl bg-[#EBFDF6]/50 border border-[#D1F4E3] space-y-0.5">
                      <span className="text-[9.5px] font-black uppercase tracking-wider text-[#00855E] flex items-center gap-1.5 font-sora">
                        <Package className="w-3 h-3 text-[#00B884]" />
                        Medicamentos Solicitados:
                      </span>
                      <p className="text-xs font-medium text-slate-700 leading-relaxed italic line-clamp-2">
                        {p.productos_resumen}
                      </p>
                    </div>
                  )}

                  {/* Datos del Repartidor (si está asignado) */}
                  {p.repartidor_nombre && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200/60 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-white border border-indigo-200 flex items-center justify-center text-indigo-600 shadow-2xs shrink-0">
                        <Bike className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 text-xs">
                        <span className="font-black text-indigo-950 block truncate font-sora">
                          {p.repartidor_nombre}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-indigo-700 mt-0.5">
                          {p.vehiculo_placa && <span>Placa: <b>{p.vehiculo_placa}</b></span>}
                          {p.temperatura_salida && <span>• Temp: <b>{p.temperatura_salida}°C</b></span>}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tarjeta de Cobro & Finanzas */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-[#D1F4E3] flex items-center justify-between">
                    <div>
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 font-sora">
                        Método de Pago
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-white border border-slate-200 text-slate-700 shadow-2xs font-sora">
                          {p.metodo_pago}
                        </span>
                        {p.vuelto > 0 && (
                          <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 font-mono">
                            Vuelto S/ {parseFloat(p.vuelto).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5 font-sora">
                        Total a Cobrar
                      </span>
                      <span className="text-base sm:text-lg font-black text-[#00855E] tracking-tight font-sora">
                        S/ {parseFloat(p.monto_total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Barra Inferior de Acciones */}
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-0.5">
                  <button
                    type="button"
                    onClick={() => handleImprimirGuia(p)}
                    className="h-8.5 px-2.5 rounded-xl bg-white hover:bg-[#EBFDF6] text-slate-600 hover:text-[#00855E] border border-slate-200 hover:border-[#A6F6D8] transition-all cursor-pointer shadow-2xs flex items-center gap-1 text-xs font-bold"
                    title="Imprimir Hoja de Ruta para motorizado"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#00B884]" />
                    <span className="hidden sm:inline">Hoja</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {p.estado === 'Pendiente' && (
                      <button
                        type="button"
                        onClick={() => handlePasarPreparando(p)}
                        className="h-8.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 font-sora"
                      >
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        <span>Iniciar Preparación</span>
                      </button>
                    )}

                    {p.estado === 'Preparando' && (
                      <button
                        type="button"
                        onClick={() => handleAbrirDespacho(p)}
                        className="h-8.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 font-sora"
                      >
                        <Bike className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Despachar a Ruta</span>
                      </button>
                    )}

                    {p.estado === 'En_Ruta' && (
                      <button
                        type="button"
                        onClick={() => handleAbrirEntrega(p)}
                        className="h-8.5 px-3 rounded-xl bg-[#EBFDF6] hover:bg-emerald-100/80 text-[#00855E] border border-[#A6F6D8] text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 font-sora"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00B884]" />
                        <span>Confirmar Entrega</span>
                      </button>
                    )}

                    {p.estado === 'Entregado' && (
                      <span className="h-8.5 px-3 rounded-xl bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] text-xs font-black flex items-center gap-1.5 font-sora">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00B884]" />
                        <span>Completado</span>
                      </span>
                    )}

                    {(p.estado === 'Pendiente' || p.estado === 'Preparando') && (
                      <button
                        type="button"
                        onClick={() => handleCancelarPedido(p)}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs active:scale-95 group"
                        title="Cancelar pedido de delivery"
                      >
                        <X className="w-3.5 h-3.5 text-slate-500 group-hover:text-rose-600 transition-transform duration-150 group-hover:rotate-90" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── MODAL NUEVO PEDIDO DELIVERY (SOLUCIÓN HÍBRIDA) (PORTAL GLOBAL SOBRE EL TOPBAR) ─── */}
      {modalNuevo && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalNuevo(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-150 my-auto animate-in zoom-in-95 duration-200 cursor-default relative max-h-[92vh] flex flex-col overflow-hidden"
          >
            {/* Telón de desenfoque mínimo sobre el modal cuando el menú de pago o clientes está desplegado */}
            {dropdownMetodoPagoOpen && (
              <div
                onClick={() => setDropdownMetodoPagoOpen(false)}
                className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1.5px] z-30 rounded-3xl animate-in fade-in duration-200 cursor-pointer"
                title="Haga clic para volver al formulario"
              />
            )}

            {/* Cabecera del modal (Fija arriba) */}
            <div className={`flex items-center justify-between px-6 sm:px-7 py-3.5 border-b border-slate-100 shrink-0 transition-all duration-200 ${
              dropdownMetodoPagoOpen ? 'blur-[1px] opacity-70 select-none pointer-events-none' : ''
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] shadow-2xs">
                  <Bike className="w-5 h-5 text-[#00B884]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-tight font-sora">
                    Registrar Nuevo Pedido Delivery
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Flujo híbrido: Toma directa (WhatsApp / Teléfono) o vinculación con Venta POS (BPD MINSA)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalNuevo(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 text-slate-600 group-hover:text-rose-600 transition-transform duration-150 group-hover:rotate-90" />
              </button>
            </div>

            <form onSubmit={handleCrearPedido} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Cuerpo del formulario (Scroll contenido estrictamente dentro de la tarjeta) */}
              <div className="flex-1 overflow-y-auto custom-modal-scroll px-6 sm:px-7 py-4 space-y-4">
                
                {/* ─── PESTAÑAS SELECTORAS DE MODO: RÁPIDO VS VINCULAR POS ─── */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setModoNuevoPedido('rapido')}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer font-sora ${
                      modoNuevoPedido === 'rapido'
                        ? 'bg-white text-emerald-800 shadow-2xs border border-emerald-300/80 ring-1 ring-emerald-400/20'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">Modo Rápido (Llamada / WhatsApp)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModoNuevoPedido('pos');
                      if (ventasDisponibles.length === 0) cargarVentasPOS();
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer font-sora ${
                      modoNuevoPedido === 'pos'
                        ? 'bg-white text-indigo-800 shadow-2xs border border-indigo-300/80 ring-1 ring-indigo-400/20'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate">Vincular Venta POS (Caja)</span>
                  </button>
                </div>

                {/* ─── PANEL DE VENTA POS (SI ESTÁ EN MODO POS) ─── */}
                {modoNuevoPedido === 'pos' && (
                  <div className="animate-in fade-in duration-200">
                    {ventaSeleccionada ? (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white border border-emerald-300 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-2xs">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-emerald-950 font-sora">
                                {ventaSeleccionada.tipo_comprobante} {ventaSeleccionada.serie}-{ventaSeleccionada.numero}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                Importe: S/ {parseFloat(ventaSeleccionada.total || 0).toFixed(2)}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-700 truncate mt-0.5 font-medium">
                              Cliente: {ventaSeleccionada.paciente_nombre || ventaSeleccionada.cliente?.nombre || 'Cliente General'} • {ventaSeleccionada.detalles?.length || 0} medicamentos dispensados
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={desvincularVentaPOS}
                          className="px-2.5 py-1.5 rounded-xl bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 text-[11px] font-bold transition-all shrink-0 cursor-pointer shadow-2xs active:scale-95"
                        >
                          Cambiar venta
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Receipt className="w-4 h-4 text-indigo-600" />
                            <span className="text-xs font-black text-indigo-950 font-sora">
                              Ventas y Comprobantes Recientes en Caja
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={cargarVentasPOS}
                            disabled={cargandoVentas}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${cargandoVentas ? 'animate-spin' : ''}`} />
                            <span>Actualizar</span>
                          </button>
                        </div>

                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            placeholder="Buscar venta por serie (ej. B001), número, cliente o DNI..."
                            value={busquedaVenta}
                            onChange={(e) => setBusquedaVenta(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 rounded-xl border border-indigo-200/90 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>

                        <div className="max-h-44 overflow-y-auto custom-modal-scroll space-y-1.5 pr-1">
                          {cargandoVentas ? (
                            <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                              <span>Cargando comprobantes...</span>
                            </div>
                          ) : ventasFiltradas.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400 bg-white/70 rounded-xl border border-dashed border-slate-200">
                              No se encontraron ventas para vincular.
                            </div>
                          ) : (
                            ventasFiltradas.map((v) => (
                              <div
                                key={v.id}
                                onClick={() => seleccionarVentaPOS(v)}
                                className="p-2.5 rounded-xl bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-2xs"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-black text-slate-800 group-hover:text-indigo-700 font-sora">
                                      {v.tipo_comprobante} {v.serie}-{v.numero}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {v.paciente_nombre || v.cliente?.nombre || 'Cliente General'} {v.cliente?.numero_documento ? `• DNI: ${v.cliente.numero_documento}` : ''}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs font-black text-emerald-700 block font-sora">
                                    S/ {parseFloat(v.total || 0).toFixed(2)}
                                  </span>
                                  <span className="text-[10px] font-bold text-indigo-600 group-hover:underline">
                                    Vincular →
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ─── AUTOCOMPLETADO DE CLIENTES (MODO RÁPIDO) ─── */}
                {modoNuevoPedido === 'rapido' && (
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 font-sora">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        Autocompletado de Clientes Registrados
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        Escribe DNI, teléfono o nombre
                      </span>
                    </div>
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Buscar cliente frecuente para autocompletar formulario..."
                        value={busquedaCliente}
                        onChange={(e) => buscarClientes(e.target.value)}
                        className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 bg-slate-50/70 text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                      {buscandoClientes && (
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                      )}
                    </div>

                    {/* Dropdown flotante de clientes encontrados */}
                    {mostrarDropdownClientes && clientesEncontrados.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white rounded-2xl border border-emerald-300 shadow-xl p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                        <div className="px-2 py-1 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 flex items-center justify-between">
                          <span>Pacientes Encontrados ({clientesEncontrados.length})</span>
                          <button
                            type="button"
                            onClick={() => setMostrarDropdownClientes(false)}
                            className="text-slate-400 hover:text-slate-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                        {clientesEncontrados.map((cli) => (
                          <button
                            key={cli.id}
                            type="button"
                            onClick={() => seleccionarCliente(cli)}
                            className="w-full p-2 rounded-xl text-left hover:bg-emerald-50/80 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-black text-slate-800 group-hover:text-emerald-800 block truncate">
                                {cli.nombre}
                              </span>
                              <div className="flex items-center gap-2 text-[10.5px] text-slate-500">
                                {cli.numero_documento && <span>DNI: {cli.numero_documento}</span>}
                                {cli.telefono && <span>• Tel: {cli.telefono}</span>}
                              </div>
                              {cli.direccion && (
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">
                                  📍 {cli.direccion}
                                </p>
                              )}
                            </div>
                            <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-bold group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0">
                              Autocompletar
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ─── DATOS DEL PACIENTE Y CONTACTO ─── */}
                <div className={`space-y-3.5 transition-all duration-200 ${
                  dropdownMetodoPagoOpen ? 'blur-[1px] opacity-70 select-none pointer-events-none' : ''
                }`}>
                  {/* Paciente y Teléfono */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Nombre del Paciente / Cliente *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Juan Pérez García"
                        value={formNuevo.paciente_nombre}
                        onChange={(e) => setFormNuevo({ ...formNuevo, paciente_nombre: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Teléfono Celular *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ej. 987654321"
                        value={formNuevo.paciente_telefono}
                        onChange={(e) => setFormNuevo({ ...formNuevo, paciente_telefono: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* DNI y Distrito */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">D.N.I. (Opcional)</label>
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="Ej. 74859612"
                        value={formNuevo.paciente_dni}
                        onChange={(e) => setFormNuevo({ ...formNuevo, paciente_dni: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Distrito / Sector</label>
                      <input
                        type="text"
                        placeholder="Ej. San Isidro / Miraflores / Los Olivos"
                        value={formNuevo.distrito}
                        onChange={(e) => setFormNuevo({ ...formNuevo, distrito: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Dirección y Referencia */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Dirección de Entrega Exacta *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Av. Los Álamos 450, Dpto 302"
                        value={formNuevo.direccion_entrega}
                        onChange={(e) => setFormNuevo({ ...formNuevo, direccion_entrega: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">Referencia de Llegada</label>
                      <input
                        type="text"
                        placeholder="Ej. Frente al parque, portón negro"
                        value={formNuevo.referencia}
                        onChange={(e) => setFormNuevo({ ...formNuevo, referencia: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Detalle de Medicamentos */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-600 font-sora">
                        Medicamentos / Productos Solicitados
                      </label>
                      {ventaSeleccionada && (
                        <span className="text-[10.5px] font-bold text-emerald-600">
                          (Importados automáticamente de Venta POS)
                        </span>
                      )}
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Ej. 2 cajas Amoxicilina 500mg, 1 jarabe Paracetamol infantil"
                      value={formNuevo.productos_resumen}
                      onChange={(e) => setFormNuevo({ ...formNuevo, productos_resumen: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>

                  {/* ─── EXIGENCIA DIGEMID: CONTROL DE RECETA MÉDICA ─── */}
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 font-sora">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        Control de Receta Médica (DIGEMID)
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">R.M. 554-2022/MINSA</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setTipoReceta('venta_libre')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 cursor-pointer ${
                          tipoReceta === 'venta_libre'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400/20 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                        <div className="min-w-0">
                          <span className="block leading-tight text-[11px]">Venta Libre (OTC)</span>
                          <span className="text-[9.5px] font-normal text-slate-400">Sin receta requerida</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoReceta('receta_fisica')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 cursor-pointer ${
                          tipoReceta === 'receta_fisica'
                            ? 'bg-blue-50 text-blue-800 border-blue-400 ring-2 ring-blue-400/20 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                        <div className="min-w-0">
                          <span className="block leading-tight text-[11px]">Receta Física</span>
                          <span className="text-[9.5px] font-normal text-slate-400">Verificar/Retener en casa</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoReceta('receta_digital')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all text-left flex items-center gap-2 cursor-pointer ${
                          tipoReceta === 'receta_digital'
                            ? 'bg-purple-50 text-purple-800 border-purple-400 ring-2 ring-purple-400/20 shadow-2xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                        <div className="min-w-0">
                          <span className="block leading-tight text-[11px]">Receta Digital</span>
                          <span className="text-[9.5px] font-normal text-slate-400">Validada por Q.F. (Foto)</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* ─── URGENCIA Y HORARIO DE ENTREGA ─── */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Prioridad de Entrega
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setTipoUrgencia('inmediata')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            tipoUrgencia === 'inmediata'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-400 ring-2 ring-emerald-400/20 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Inmediato (30-45m)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipoUrgencia('programada')}
                          className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            tipoUrgencia === 'programada'
                              ? 'bg-amber-50 text-amber-800 border-amber-400 ring-2 ring-amber-400/20 shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Programado</span>
                        </button>
                      </div>
                    </div>
                    {tipoUrgencia === 'programada' ? (
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Hora Estimada de Entrega
                        </label>
                        <input
                          type="time"
                          value={horaProgramada}
                          onChange={(e) => setHoraProgramada(e.target.value)}
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          Ventana de Despacho
                        </label>
                        <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-500 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          Salida en turno de reparto activo
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ─── CHECKBOX CADENA DE FRÍO ─── */}
                  <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <ThermometerSnowflake className="w-5 h-5 text-teal-600 shrink-0" />
                      <div>
                        <span className="text-xs font-black text-teal-900 block leading-tight font-sora">
                          Requiere Cadena de Frío (2°C – 8°C)
                        </span>
                        <span className="text-[10px] text-teal-700">
                          Aplica caja térmica con gel refrigerante según R.M. 554-2022/MINSA
                        </span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={formNuevo.requiere_cadena_frio}
                      onChange={(e) => setFormNuevo({ ...formNuevo, requiere_cadena_frio: e.target.checked })}
                      className="w-4.5 h-4.5 text-teal-600 rounded-md focus:ring-teal-500 cursor-pointer"
                    />
                  </div>

                  {/* ─── ASIGNAR MOTORIZADO DE INMEDIATO (OPCIONAL) ─── */}
                  <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-200/70 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-indigo-600" />
                        <div>
                          <span className="text-xs font-black text-indigo-950 block leading-tight font-sora">
                            Asignar Motorizado Ahora (Opcional)
                          </span>
                          <span className="text-[10px] text-indigo-700">
                            Activar si el repartidor ya está en botica listo para salir
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={asignarRepartidorDirecto}
                        onChange={(e) => setAsignarRepartidorDirecto(e.target.checked)}
                        className="w-4.5 h-4.5 text-indigo-600 rounded-md focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>

                    {asignarRepartidorDirecto && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-indigo-200/60 animate-in fade-in duration-200">
                        <div>
                          <label className="text-[10.5px] font-bold text-indigo-900 block mb-1">Nombre Motorizado *</label>
                          <input
                            type="text"
                            placeholder="Ej. Carlos Mendoza"
                            value={formNuevo.repartidor_nombre || ''}
                            onChange={(e) => setFormNuevo({ ...formNuevo, repartidor_nombre: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-bold text-indigo-900 block mb-1">Teléfono</label>
                          <input
                            type="tel"
                            placeholder="999888777"
                            value={formNuevo.repartidor_telefono || ''}
                            onChange={(e) => setFormNuevo({ ...formNuevo, repartidor_telefono: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10.5px] font-bold text-indigo-900 block mb-1">Placa Moto</label>
                          <input
                            type="text"
                            placeholder="1234-5A"
                            value={formNuevo.vehiculo_placa || ''}
                            onChange={(e) => setFormNuevo({ ...formNuevo, vehiculo_placa: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl border border-indigo-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── SECCIÓN FINANCIERA: FLETE, MÉTODO DE PAGO E IMPORTES ─── */}
                <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-3.5 relative">
                  
                  {/* Desglose de Importes: Productos + Costo Envío = Total */}
                  <div className="p-3 rounded-2xl bg-white border border-slate-200/90 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 font-sora">
                        <Truck className="w-3.5 h-3.5 text-emerald-600" />
                        Costo de Envío / Flete Delivery
                      </label>
                      <div className="flex items-center gap-1 flex-wrap">
                        {['0.00', '3.00', '5.00', '7.00', '10.00'].map((tarifa) => (
                          <button
                            key={tarifa}
                            type="button"
                            onClick={() => handleCambioCostoEnvio(tarifa)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                              parseFloat(costoEnvio) === parseFloat(tarifa)
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {tarifa === '0.00' ? 'Gratis' : `S/ ${tarifa}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-500 block mb-1">
                          Monto Medicamentos
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">S/</span>
                          <input
                            type="number"
                            step="0.10"
                            placeholder="0.00"
                            value={montoProductos}
                            onChange={(e) => handleCambioMontoProductos(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10.5px] font-bold text-slate-500 block mb-1">
                          Flete de Envío
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">S/</span>
                          <input
                            type="number"
                            step="0.50"
                            placeholder="0.00"
                            value={costoEnvio}
                            onChange={(e) => handleCambioCostoEnvio(e.target.value)}
                            className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10.5px] font-bold text-emerald-800 block mb-1">
                          Total a Cobrar *
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-emerald-600">S/</span>
                          <input
                            type="number"
                            step="0.10"
                            required
                            placeholder="0.00"
                            value={formNuevo.monto_total}
                            onChange={(e) => setFormNuevo({ ...formNuevo, monto_total: e.target.value })}
                            className="w-full pl-8 pr-2.5 py-2 rounded-xl border border-emerald-300 text-xs font-black text-emerald-950 bg-emerald-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-sora"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Desplegable Personalizado de Método de Pago */}
                  <div className="relative z-40" ref={dropdownMetodoRef}>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700">
                        Método de Pago *
                      </label>
                      <span className="text-[10.5px] font-semibold text-slate-400">
                        Forma de cobranza o liquidación
                      </span>
                    </div>

                    {(() => {
                      const metodoSeleccionado = METODOS_PAGO_OPCIONES.find(
                        (m) => m.id === formNuevo.metodo_pago
                      ) || METODOS_PAGO_OPCIONES[0];
                      const MetodoIcon = metodoSeleccionado.icon;

                      return (
                        <>
                          <button
                            type="button"
                            onClick={() => setDropdownMetodoPagoOpen(!dropdownMetodoPagoOpen)}
                            className={`w-full flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl bg-white border transition-all text-left cursor-pointer shadow-2xs ${
                              dropdownMetodoPagoOpen
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${metodoSeleccionado.iconColor}`}>
                                <MetodoIcon className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-black text-slate-900 leading-tight">
                                    {metodoSeleccionado.nombre}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${metodoSeleccionado.badgeColor}`}>
                                    {metodoSeleccionado.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                                  {metodoSeleccionado.subtitulo}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 pl-2 text-slate-400 shrink-0">
                              <span className="text-[10.5px] font-bold text-slate-400 hidden sm:inline">
                                {dropdownMetodoPagoOpen ? 'Cerrar' : 'Cambiar'}
                              </span>
                              <ChevronUp
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  dropdownMetodoPagoOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'
                                }`}
                              />
                            </div>
                          </button>

                          {/* Menú Desplegable hacia arriba (Drop-up) con Tarjetas Diseñadas */}
                          {dropdownMetodoPagoOpen && (
                            <div className="absolute bottom-full left-0 right-0 mb-2 z-50 bg-white rounded-2xl border border-slate-200/95 shadow-2xl p-2 space-y-1.5 max-h-[380px] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
                              <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 flex items-center justify-between">
                                <span>Opciones de Pago Disponibles (5)</span>
                                <span>MINSA / BPD</span>
                              </div>
                              {METODOS_PAGO_OPCIONES.map((opcion) => {
                                const IconComponent = opcion.icon;
                                const isSelected = formNuevo.metodo_pago === opcion.id;
                                return (
                                  <button
                                    key={opcion.id}
                                    type="button"
                                    onClick={() => {
                                      setFormNuevo((prev) => ({
                                        ...prev,
                                        metodo_pago: opcion.id,
                                        monto_paga_con: opcion.id !== 'Contraentrega' ? '' : prev.monto_paga_con
                                      }));
                                      setDropdownMetodoPagoOpen(false);
                                    }}
                                    className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-50/90 border-emerald-500 shadow-2xs'
                                        : 'bg-white border-slate-150 hover:bg-slate-50 hover:border-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${opcion.iconColor}`}>
                                        <IconComponent className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-black text-slate-800 leading-tight">
                                            {opcion.nombre}
                                          </span>
                                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${opcion.badgeColor}`}>
                                            {opcion.badge}
                                          </span>
                                        </div>
                                        <p className="text-[10.5px] text-slate-500 font-medium leading-snug mt-0.5">
                                          {opcion.subtitulo}
                                        </p>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                        <Check className="w-3 h-3 stroke-[3]" />
                                      </div>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Efectivo con el que paga el cliente */}
                  <div className={`pt-1 border-t border-slate-200/60 transition-all duration-200 ${
                    dropdownMetodoPagoOpen ? 'blur-[1px] opacity-70 select-none pointer-events-none' : ''
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-bold text-slate-700">
                        Paga con (Efectivo Billete)
                      </label>
                      {formNuevo.metodo_pago !== 'Contraentrega' && (
                        <span className="text-[10px] font-medium text-slate-400">
                          (Solo aplica para cobro contraentrega)
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        S/
                      </span>
                      <input
                        type="number"
                        step="0.10"
                        placeholder="Ej. 50.00 / 100.00"
                        value={formNuevo.monto_paga_con}
                        onChange={(e) => setFormNuevo({ ...formNuevo, monto_paga_con: e.target.value })}
                        disabled={formNuevo.metodo_pago !== 'Contraentrega'}
                        className={`w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
                          formNuevo.metodo_pago !== 'Contraentrega'
                            ? 'bg-slate-100/70 text-slate-400 cursor-not-allowed border-dashed'
                            : 'bg-white text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Indicador de Vuelto si es Contraentrega */}
                  {formNuevo.metodo_pago === 'Contraentrega' && parseFloat(formNuevo.monto_paga_con || 0) > parseFloat(formNuevo.monto_total || 0) && (
                    <div className={`p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800 flex items-center justify-between animate-in fade-in duration-150 transition-all ${
                      dropdownMetodoPagoOpen ? 'blur-[1px] opacity-70 select-none pointer-events-none' : ''
                    }`}>
                      <span className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-amber-600" />
                        Vuelto exacto a llevar por el repartidor:
                      </span>
                      <span className="text-sm font-black text-amber-900 font-sora">S/ {vueltoCalculado()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de acción (Fijos al pie del modal) */}
              <div className={`flex items-center justify-between px-6 sm:px-7 py-3.5 border-t border-slate-100 bg-slate-50/70 shrink-0 rounded-b-3xl transition-all duration-200 ${
                dropdownMetodoPagoOpen ? 'blur-[1px] opacity-70 select-none pointer-events-none' : ''
              }`}>
                <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Correlativo automático: <span className="font-mono font-bold text-slate-600">DEL-2026-XXXXX</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setModalNuevo(false)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-500/25 transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 font-sora"
                  >
                    {asignarRepartidorDirecto ? (
                      <>
                        <Truck className="w-4 h-4" />
                        <span>Registrar y Despachar a Ruta</span>
                      </>
                    ) : (
                      <>
                        <Bike className="w-4 h-4" />
                        <span>Registrar Pedido Delivery</span>
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

      {/* ─── MODAL DESPACHAR A RUTA (ASIGNAR MOTORIZADO) (PORTAL GLOBAL) ─── */}
      {modalDespacho && pedidoSeleccionado && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalDespacho(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-150 my-auto animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200/70 shadow-2xs">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Asignar Repartidor y Despachar</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Salida de almacén farmacéutico a ruta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDespacho(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 text-slate-600 group-hover:text-rose-600 transition-transform duration-150 group-hover:rotate-90" />
              </button>
            </div>

            <form onSubmit={handleConfirmarDespacho} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-1">
                <span className="font-black text-slate-800 block">Guía: {pedidoSeleccionado.numero_guia_reparto}</span>
                <span className="text-slate-600 block">Destino: {pedidoSeleccionado.direccion_entrega}</span>
                <span className="text-emerald-700 font-black block">
                  Total a Cobrar: S/ {parseFloat(pedidoSeleccionado.monto_total).toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre del Motorizado / Repartidor *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carlos Mendoza"
                  value={formDespacho.repartidor_nombre}
                  onChange={(e) => setFormDespacho({ ...formDespacho, repartidor_nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Teléfono Móvil</label>
                  <input
                    type="tel"
                    placeholder="999888777"
                    value={formDespacho.repartidor_telefono}
                    onChange={(e) => setFormDespacho({ ...formDespacho, repartidor_telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Placa Vehículo</label>
                  <input
                    type="text"
                    placeholder="1234-5A"
                    value={formDespacho.vehiculo_placa}
                    onChange={(e) => setFormDespacho({ ...formDespacho, vehiculo_placa: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {pedidoSeleccionado.requiere_cadena_frio && (
                <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/70">
                  <label className="text-[11px] font-bold text-teal-900 block mb-1 flex items-center gap-1.5">
                    <ThermometerSnowflake className="w-4 h-4 text-teal-600" />
                    Temperatura de Salida (°C) - Termolábil
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="5.0"
                    value={formDespacho.temperatura_salida}
                    onChange={(e) => setFormDespacho({ ...formDespacho, temperatura_salida: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-teal-300 text-xs font-bold text-teal-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalDespacho(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold shadow-md shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
                >
                  Confirmar Salida a Ruta
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL CONFIRMAR ENTREGA (PORTAL GLOBAL) ─── */}
      {modalEntrega && pedidoSeleccionado && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalEntrega(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-150 my-auto animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/70 shadow-2xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Confirmar Recepción de Entrega</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Cierre de despacho conforme BPD</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEntrega(false)}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group"
                title="Cerrar ventana (Esc)"
              >
                <X className="w-4 h-4 text-slate-600 group-hover:text-rose-600 transition-transform duration-150 group-hover:rotate-90" />
              </button>
            </div>

            <form onSubmit={handleConfirmarEntrega} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/70 text-xs space-y-1">
                <span className="font-black text-emerald-950 block">Guía: {pedidoSeleccionado.numero_guia_reparto}</span>
                <span className="text-emerald-800 font-bold block">
                  Cobranza: S/ {parseFloat(pedidoSeleccionado.monto_total).toFixed(2)} ({pedidoSeleccionado.metodo_pago})
                </span>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Nombre de Quien Recibió *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez (o Titular/Familiar)"
                  value={formEntrega.recibido_por_nombre}
                  onChange={(e) => setFormEntrega({ ...formEntrega, recibido_por_nombre: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">D.N.I. de Quien Recibió</label>
                <input
                  type="text"
                  maxLength={12}
                  placeholder="Ej. 74859612"
                  value={formEntrega.recibido_por_dni}
                  onChange={(e) => setFormEntrega({ ...formEntrega, recibido_por_dni: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {pedidoSeleccionado.requiere_cadena_frio && (
                <div className="p-3.5 rounded-2xl bg-teal-50/70 border border-teal-200/70">
                  <label className="text-[11px] font-bold text-teal-900 block mb-1 flex items-center gap-1.5">
                    <ThermometerSnowflake className="w-4 h-4 text-teal-600" />
                    Temperatura de Llegada / Entrega (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="5.2"
                    value={formEntrega.temperatura_llegada}
                    onChange={(e) => setFormEntrega({ ...formEntrega, temperatura_llegada: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-teal-300 text-xs font-bold text-teal-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              )}

              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setModalEntrega(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/25 transition-all cursor-pointer active:scale-95"
                >
                  Finalizar Pedido
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ─── MODAL IMPRIMIR HOJA DE RUTA / GUÍA DE DESPACHO (PORTAL GLOBAL) ─── */}
      {modalImprimir && datosImpresion && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalImprimir(false);
          }}
          className="fixed inset-0 z-[9999] bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-150 my-auto animate-in zoom-in-95 duration-200 cursor-default"
          >
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 mb-4 print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200/70 shadow-2xs">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Guía de Reparto Farmacéutico</h3>
                  <p className="text-[11px] text-slate-400 font-semibold">Documento oficial para motorizado</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModalImprimir(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95 group"
                  title="Cerrar ventana (Esc)"
                >
                  <X className="w-4 h-4 text-slate-600 group-hover:text-rose-600 transition-transform duration-150 group-hover:rotate-90" />
                </button>
              </div>
            </div>

            {/* Formato de Ticket / Hoja Oficial */}
            <div className="border border-dashed border-slate-300 p-5 rounded-2xl bg-white font-mono text-xs text-slate-800 space-y-3">
              <div className="text-center pb-2 border-b border-dashed border-slate-300">
                <div className="font-bold text-sm text-slate-900">{datosImpresion.botica.nombre}</div>
                <div className="text-[10px] text-slate-500">{datosImpresion.botica.razon_social}</div>
                <div className="text-[10px] text-slate-500">R.U.C. {datosImpresion.botica.ruc}</div>
                <div className="text-[10px] text-slate-500">{datosImpresion.botica.direccion}</div>
                <div className="mt-1 text-[11px] font-black text-slate-900 bg-slate-100 py-1 rounded">
                  GUÍA DE REPARTO / DESPACHO: {datosImpresion.pedido.numero_guia_reparto}
                </div>
              </div>

              <div className="space-y-1 text-[11px]">
                <div><span className="font-bold">FECHA:</span> {new Date(datosImpresion.pedido.created_at).toLocaleString('es-PE')}</div>
                <div><span className="font-bold">PACIENTE:</span> {datosImpresion.pedido.paciente_nombre}</div>
                <div><span className="font-bold">TELÉFONO:</span> {datosImpresion.pedido.paciente_telefono}</div>
                <div><span className="font-bold">DIRECCIÓN:</span> {datosImpresion.pedido.direccion_entrega}</div>
                {datosImpresion.pedido.referencia && (
                  <div><span className="font-bold">REF:</span> {datosImpresion.pedido.referencia}</div>
                )}
              </div>

              {datosImpresion.pedido.requiere_cadena_frio && (
                <div className="p-2 rounded bg-teal-50 border border-teal-200 text-teal-800 text-[10px] font-bold">
                  ❄️ PRODUCTO TERMOLÁBIL - CONTROL DE TEMPERATURA BPA (2°C A 8°C)
                  {datosImpresion.pedido.temperatura_salida && (
                    <div>Temp. Salida: {datosImpresion.pedido.temperatura_salida}°C</div>
                  )}
                </div>
              )}

              {datosImpresion.pedido.productos_resumen && (
                <div className="py-2 border-y border-dashed border-slate-300">
                  <div className="font-bold mb-1">DETALLE DE MEDICAMENTOS:</div>
                  <div className="text-[11px] whitespace-pre-wrap">{datosImpresion.pedido.productos_resumen}</div>
                </div>
              )}

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between">
                  <span>MÉTODO DE PAGO:</span>
                  <span className="font-bold">{datosImpresion.pedido.metodo_pago}</span>
                </div>
                <div className="flex justify-between text-sm font-black">
                  <span>TOTAL A COBRAR:</span>
                  <span className="text-emerald-700">S/ {parseFloat(datosImpresion.pedido.monto_total).toFixed(2)}</span>
                </div>
                {datosImpresion.pedido.monto_paga_con && (
                  <div className="flex justify-between text-slate-600">
                    <span>Paga con:</span>
                    <span>S/ {parseFloat(datosImpresion.pedido.monto_paga_con).toFixed(2)}</span>
                  </div>
                )}
                {datosImpresion.pedido.vuelto > 0 && (
                  <div className="flex justify-between font-bold text-amber-700">
                    <span>VUELTO A ENTREGAR:</span>
                    <span>S/ {parseFloat(datosImpresion.pedido.vuelto).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 text-center space-y-4 text-[10px]">
                <div className="border-t border-slate-300 pt-1">
                  FIRMA DE CONFORMIDAD DEL PACIENTE / DNI
                </div>
                <div className="text-[9px] text-slate-400">
                  Conservar los medicamentos bajo las condiciones indicadas en el rotulado.
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
