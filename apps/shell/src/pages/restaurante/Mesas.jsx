import React, { useState, useEffect } from 'react';
import { api } from './api';
import {
  UtensilsCrossed,
  Users,
  Clock,
  DollarSign,
  Plus,
  CheckCircle,
  Receipt,
  Search,
  Sparkles,
  ChefHat,
  X,
  CreditCard,
  QrCode,
  Printer,
  Smartphone,
  Coins,
  Layers,
  Loader2,
  Building2,
  RotateCw,
  Flame,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';
import { TicketImpresion } from '@heis/ui';

export default function Mesas() {
  const [areas, setAreas] = useState([]);
  const [areaActiva, setAreaActiva] = useState('todas');
  const [loading, setLoading] = useState(true);
  const [busquedaMesa, setBusquedaMesa] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos'); // 'todos' | 'available' | 'occupied' | 'billed' | 'reserved'
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  // Mesa activa y modales
  const [mesaSeleccionada, setMesaSeleccionada] = useState(null);
  const [modalComanda, setModalComanda] = useState(false);
  const [modalCobrar, setModalCobrar] = useState(false);
  const [procesandoCobro, setProcesandoCobro] = useState(false);

  // Ticket Modal
  const [ticketData, setTicketData] = useState(null);
  const [mostrarTicket, setMostrarTicket] = useState(false);

  // Catálogo para comanda
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState('todas');
  const [busquedaProd, setBusquedaProd] = useState('');

  // Carrito de la comanda actual
  const [itemsComanda, setItemsComanda] = useState([]);
  const [notaItem, setNotaItem] = useState('');
  const [productoParaNota, setProductoParaNota] = useState(null);

  // Formulario de Cobro
  const [datosCobro, setDatosCobro] = useState({
    document_type: 'Ticket',
    client_name: 'Público General',
    client_document: '',
    payment_method: 'Efectivo',
    monto_efectivo: '',
    monto_digital: '',
    billetera_digital: 'Yape',
    discount: 0,
    tip: 0,
    received_amount: ''
  });

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [resAreas, resProds, resCats] = await Promise.all([
        api.get('/mesas/areas'),
        api.get('/productos'),
        api.get('/productos/categorias')
      ]);

      if (resAreas.success) setAreas(resAreas.areas);
      if (resProds.success) setProductos(resProds.productos);
      if (resCats.success) setCategorias(resCats.categorias);
    } catch (err) {
      console.error('Error al cargar mesas:', err);
    } finally {
      setLoading(false);
      setUltimaActualizacion(new Date());
    }
  };

  useEffect(() => {
    cargarDatos();
    const interval = setInterval(cargarDatos, 12000); // Polling ligero para actualizar comandas
    return () => clearInterval(interval);
  }, []);

  const abrirMesa = (mesa) => {
    setMesaSeleccionada(mesa);
    setItemsComanda([]);
    setModalComanda(true);
  };

  const abrirCobro = (mesa) => {
    setMesaSeleccionada(mesa);
    const ordenActiva = mesa.ordenes && mesa.ordenes.length > 0 ? mesa.ordenes[0] : null;
    const totalActual = ordenActiva ? parseFloat(ordenActiva.total) : 0;
    setDatosCobro({
      document_type: 'Ticket',
      client_name: ordenActiva?.client_name || 'Público General',
      client_document: '',
      payment_method: 'cash',
      discount: 0,
      tip: 0,
      received_amount: totalActual.toString()
    });
    setModalCobrar(true);
  };

  const agregarAComanda = (prod, nota = '') => {
    const existingIndex = itemsComanda.findIndex(
      (i) => i.product_id === prod.id && i.note === nota
    );
    if (existingIndex > -1) {
      const updated = [...itemsComanda];
      updated[existingIndex].quantity += 1;
      setItemsComanda(updated);
    } else {
      setItemsComanda([
        ...itemsComanda,
        {
          product_id: prod.id,
          name: prod.name,
          price: parseFloat(prod.price),
          quantity: 1,
          note: nota
        }
      ]);
    }
  };

  const enviarComanda = async () => {
    if (itemsComanda.length === 0) {
      alert('Agregue al menos un plato o bebida a la comanda.');
      return;
    }

    try {
      const res = await api.post('/ordenes/agregar', {
        table_id: mesaSeleccionada.id,
        items: itemsComanda
      });

      if (res.success) {
        // Enviar a cocina
        await api.post('/ordenes/cocina', { order_id: res.orden.id });
        alert('¡Comanda enviada a Cocina y Bar con éxito!');
        setModalComanda(false);
        setItemsComanda([]);
        cargarDatos();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al enviar comanda');
    }
  };

  const pedirPrecuenta = async (mesaId) => {
    try {
      const res = await api.post('/ordenes/pedir-cuenta', { table_id: mesaId });
      if (res.success) {
        cargarDatos();
      }
    } catch (err) {
      alert('Error al pedir precuenta');
    }
  };

  const ejecutarCobro = async (e) => {
    e.preventDefault();
    const ordenActiva = mesaSeleccionada.ordenes && mesaSeleccionada.ordenes.length > 0
      ? mesaSeleccionada.ordenes[0]
      : null;

    if (!ordenActiva) {
      toast.error('No hay orden activa en esta mesa');
      return;
    }

    if (datosCobro.document_type === 'Factura' && (!datosCobro.client_document || datosCobro.client_document.length !== 11)) {
      toast.error('Las Facturas requieren un RUC válido de 11 dígitos');
      return;
    }

    setProcesandoCobro(true);
    try {
      const subtotal = parseFloat(ordenActiva.subtotal) || 0;
      const desc = parseFloat(datosCobro.discount) || 0;
      const propina = parseFloat(datosCobro.tip) || 0;
      const totalPagar = subtotal - desc + propina;
      const recibido = parseFloat(datosCobro.received_amount) || totalPagar;

      const res = await api.post('/ordenes/cobrar', {
        order_id: ordenActiva.id,
        ...datosCobro,
        discount: desc,
        tip: propina,
        received_amount: recibido,
        monto_efectivo: parseFloat(datosCobro.monto_efectivo) || 0,
        monto_digital: parseFloat(datosCobro.monto_digital) || 0,
        billetera_digital: datosCobro.billetera_digital
      });

      if (res.success) {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 }
        });
        toast.success(`¡Cuenta de ${mesaSeleccionada.name} cobrada con éxito!`);
        setModalCobrar(false);

        // Preparar datos para imprimir ticket térmico
        setTicketData({
          empresa: {
            razon_social: 'HEIS SAC',
            ruc: '20601234567',
            direccion: 'Av. El Sol 450 - Lima, Perú',
            telefono: '(01) 456-7890'
          },
          orden: {
            ...res.orden,
            mesa_numero: mesaSeleccionada.name,
            total: res.orden.total
          },
          comprobante: res.sunat ? {
            tipo_documento: datosCobro.document_type === 'Factura' ? '01' : '03',
            numero_completo: `${res.sunat.serie || 'B001'}-${String(res.orden.id).padStart(8, '0')}`,
            hash: res.sunat.sunat_hash
          } : null,
          items: ordenActiva.detalles || [],
          pago: {
            metodo: datosCobro.payment_method,
            recibido,
            vuelto: res.orden.change_amount
          }
        });
        setMostrarTicket(true);
        cargarDatos();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al procesar cobro');
    } finally {
      setProcesandoCobro(false);
    }
  };

  // Totales generales para tarjetas de estadísticas
  const totalMesasGeneral = areas.reduce((acc, a) => acc + (a.mesas?.length || 0), 0);
  const libresGeneral = areas.reduce((acc, a) => acc + (a.mesas?.filter(m => m.status === 'available').length || 0), 0);
  const ocupadasGeneral = areas.reduce((acc, a) => acc + (a.mesas?.filter(m => m.status === 'occupied').length || 0), 0);
  const billedGeneral = areas.reduce((acc, a) => acc + (a.mesas?.filter(m => m.status === 'billed').length || 0), 0);

  // Filtrado de mesas por Área, Estado y Búsqueda
  const mesasMostradas = areas.flatMap((a) => {
    if (areaActiva !== 'todas' && a.id.toString() !== areaActiva.toString()) {
      return [];
    }
    return (a.mesas || []).map((m) => ({ ...m, areaNombre: a.name }));
  }).filter((m) => {
    const coincideEstado = filtroEstado === 'todos' || m.status === filtroEstado;
    const coincideBusq = !busquedaMesa.trim() ||
      m.name.toLowerCase().includes(busquedaMesa.toLowerCase()) ||
      m.areaNombre.toLowerCase().includes(busquedaMesa.toLowerCase()) ||
      (m.ordenes?.[0]?.mozo?.name && m.ordenes[0].mozo.name.toLowerCase().includes(busquedaMesa.toLowerCase()));
    return coincideEstado && coincideBusq;
  });

  // Filtrado de productos para comanda
  const productosFiltrados = productos.filter((p) => {
    const coincideCat = categoriaFiltro === 'todas' || p.category_id.toString() === categoriaFiltro.toString();
    const coincideBusq = !busquedaProd.trim() || p.name.toLowerCase().includes(busquedaProd.toLowerCase());
    return coincideCat && coincideBusq;
  });

  const totalComandaNueva = itemsComanda.reduce(
    (acc, it) => acc + it.price * it.quantity,
    0
  );

  const horaActualizada = ultimaActualizacion.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="space-y-5 max-w-[1700px] w-full mx-auto">
      {/* ─── 1. ENCABEZADO DE SALONES & MESAS (MINIMALISTA Y SAAS/CYBER) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/80 dark:border-amber-800/60 font-sora">
              #01_SALON
            </span>
            <span className="text-[10px] text-slate-400 font-semibold font-mono">
              MAPA_INTERACTIVO_V2
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight font-sora flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100/80 dark:border-amber-800/60 flex items-center justify-center shrink-0">
              <UtensilsCrossed className="w-4 h-4" />
            </span>
            Salones y Control de Mesas en Vivo
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Plano interactivo del salón, toma ágil de comandas a cocina y facturación en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Buscador de Mesas */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busquedaMesa}
              onChange={(e) => setBusquedaMesa(e.target.value)}
              placeholder="Buscar mesa o mozo..."
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl pl-8 pr-7 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 font-sora w-44 sm:w-56"
            />
            {busquedaMesa && (
              <button
                type="button"
                onClick={() => setBusquedaMesa('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón de Actualización Rápida en Vivo */}
          <button
            type="button"
            onClick={cargarDatos}
            disabled={loading}
            className="group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs hover:shadow-xs hover:border-amber-300 dark:hover:border-amber-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer disabled:opacity-60"
            title="Refrescar mesas y comandas"
          >
            <RotateCw
              className={`w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:rotate-180 transition-transform duration-500 ${
                loading ? 'animate-spin' : ''
              }`}
            />
            <span className="font-sora text-[11px] font-bold hidden sm:inline">
              {loading ? 'Cargando...' : `Act. ${horaActualizada}`}
            </span>
          </button>
        </div>
      </div>

      {/* ─── 2. TARJETAS KPI (ESTILO DASHBOARD) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {/* KPI Total */}
        <div
          onClick={() => setFiltroEstado('todos')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            filtroEstado === 'todos'
              ? 'border-amber-500/80 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
              : 'border-slate-200/90 dark:border-slate-800 hover:border-amber-400 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-slate-400">#01_TOTAL</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <Building2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 font-sora">
              {totalMesasGeneral}
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Total mesas del restaurante</p>
          </div>
        </div>

        {/* KPI Libres */}
        <div
          onClick={() => setFiltroEstado(filtroEstado === 'available' ? 'todos' : 'available')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            filtroEstado === 'available'
              ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-md shadow-emerald-500/10'
              : 'border-emerald-100/90 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">#02_LIBRES</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-sora">
                {libresGeneral}
              </span>
              <span className="text-[10px] font-bold text-emerald-600/80 font-mono">
                ({totalMesasGeneral > 0 ? Math.round((libresGeneral / totalMesasGeneral) * 100) : 0}%)
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Listas para recibir comensales</p>
          </div>
        </div>

        {/* KPI Ocupadas */}
        <div
          onClick={() => setFiltroEstado(filtroEstado === 'occupied' ? 'todos' : 'occupied')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            filtroEstado === 'occupied'
              ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-md shadow-rose-500/10'
              : 'border-rose-100/90 dark:border-slate-800 hover:border-rose-500 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">#03_EN_SERVICIO</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-800/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-sora">
                {ocupadasGeneral}
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Comensales consumiendo</p>
          </div>
        </div>

        {/* KPI Cuentas Pedidas */}
        <div
          onClick={() => setFiltroEstado(filtroEstado === 'billed' ? 'todos' : 'billed')}
          role="button"
          tabIndex={0}
          className={`group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border transition-all duration-200 cursor-pointer select-none overflow-hidden flex flex-col justify-between ${
            filtroEstado === 'billed'
              ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
              : 'border-amber-100/90 dark:border-slate-800 hover:border-amber-500 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">#04_PRECUENTAS</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Receipt className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-sora">
                {billedGeneral}
              </span>
              <span className="text-[10px] text-amber-600 font-bold font-sora">por cobrar</span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-medium">Cuentas pedidas listas</p>
          </div>
        </div>
      </div>

      {/* ─── 3. TARJETAS DE SALONES Y AMBIENTES (ACCESOS DIRECTOS TECH) ─── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-sora flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-amber-500" />
            Salones y Ambientes del Restaurante
          </h2>
          <span className="text-[10.5px] text-slate-400 font-mono font-semibold">
            {areas.length} Zonas Disponibles
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {/* Tarjeta: Todas las Zonas */}
          <div
            onClick={() => setAreaActiva('todas')}
            role="button"
            tabIndex={0}
            className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2.5 overflow-hidden ${
              areaActiva === 'todas'
                ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
                : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-amber-600 transition-colors">
                #ZONA_ALL
              </span>
              <span className={`w-2 h-2 rounded-full ${areaActiva === 'todas' ? 'bg-amber-500 ring-4 ring-amber-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                areaActiva === 'todas'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-white'
              }`}>
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                  Todas las Zonas
                </h3>
                <p className="text-[10px] text-slate-400 font-medium truncate">
                  {totalMesasGeneral} mesas registradas
                </p>
              </div>
            </div>

            {/* Micro-Barra de ocupación */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>{libresGeneral} libres</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">{ocupadasGeneral + billedGeneral} ocup.</span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div style={{ width: `${totalMesasGeneral > 0 ? (libresGeneral / totalMesasGeneral) * 100 : 0}%` }} className="h-full bg-emerald-500" />
                <div style={{ width: `${totalMesasGeneral > 0 ? ((ocupadasGeneral + billedGeneral) / totalMesasGeneral) * 100 : 0}%` }} className="h-full bg-amber-500" />
              </div>
            </div>
          </div>

          {/* Tarjetas de cada Salón */}
          {areas.map((a, idx) => {
            const mesasDelArea = a.mesas || [];
            const totalArea = mesasDelArea.length;
            const libresArea = mesasDelArea.filter(m => m.status === 'available').length;
            const ocupadasArea = mesasDelArea.filter(m => m.status === 'occupied').length;
            const billedArea = mesasDelArea.filter(m => m.status === 'billed').length;
            const isSelected = areaActiva.toString() === a.id.toString();

            return (
              <div
                key={a.id}
                onClick={() => setAreaActiva(a.id)}
                role="button"
                tabIndex={0}
                className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-200 ease-out cursor-pointer select-none touch-manipulation flex flex-col justify-between gap-2.5 overflow-hidden ${
                  isSelected
                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-500 dark:border-amber-500/80 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/10'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-slate-700 shadow-2xs hover:shadow-md hover:-translate-y-0.5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 group-hover:text-amber-600 transition-colors">
                    #ZONA_0{idx + 1}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-amber-500 ring-4 ring-amber-500/20' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150 ${
                    isSelected
                      ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-amber-500 group-hover:text-white'
                  }`}>
                    <UtensilsCrossed className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs sm:text-[13px] tracking-tight text-slate-800 dark:text-slate-100 truncate font-sora">
                      {a.name}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-medium truncate">
                      {totalArea} mesas registradas
                    </p>
                  </div>
                </div>

                {/* Micro-Barra de ocupación */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                    <span>{libresArea} libres</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{ocupadasArea + billedArea} ocup.</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                    <div style={{ width: `${totalArea > 0 ? (libresArea / totalArea) * 100 : 0}%` }} className="h-full bg-emerald-500" />
                    <div style={{ width: `${totalArea > 0 ? ((ocupadasArea + billedArea) / totalArea) * 100 : 0}%` }} className="h-full bg-amber-500" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── 4. GRID DE TARJETAS DE MESAS INTERACTIVAS (ESTILO DASHBOARD) ─── */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 font-sora tracking-tight">
              Plano de Mesas {areaActiva !== 'todas' ? `(${areas.find(a => a.id.toString() === areaActiva.toString())?.name || ''})` : ''}
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono text-xs font-bold">
              {mesasMostradas.length} {mesasMostradas.length === 1 ? 'mesa' : 'mesas'}
            </span>
          </div>

          {/* Filtros de Estado Pills */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setFiltroEstado('todos')}
              className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer ${
                filtroEstado === 'todos'
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-2xs'
                  : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('available')}
              className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtroEstado === 'available'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800/80 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:border-emerald-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Libres ({libresGeneral})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('occupied')}
              className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtroEstado === 'occupied'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800/80 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 hover:border-rose-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
              Ocupadas ({ocupadasGeneral})
            </button>
            <button
              type="button"
              onClick={() => setFiltroEstado('billed')}
              className={`px-2.5 py-1 rounded-xl font-sora text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                filtroEstado === 'billed'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'bg-white dark:bg-slate-800/80 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:border-amber-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Por Cobrar ({billedGeneral})
            </button>
          </div>
        </div>

        {/* Grid de Mesas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs font-sora flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              <span>Sincronizando plano operativo del restaurante...</span>
            </div>
          ) : mesasMostradas.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 text-xs font-sora bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-8 shadow-2xs">
              No se encontraron mesas con los filtros seleccionados.
            </div>
          ) : (
            mesasMostradas.map((mesa) => {
              const ordenActiva = mesa.ordenes && mesa.ordenes.length > 0 ? mesa.ordenes[0] : null;
              const esOcupada = mesa.status === 'occupied';
              const esBilled = mesa.status === 'billed';
              const esReservada = mesa.status === 'reserved';
              const esDisponible = mesa.status === 'available';

              // Colores de borde, glow y tarjetas según estado
              const cardBorder = esOcupada
                ? 'border-rose-200/90 dark:border-rose-900/60 hover:border-rose-500 dark:hover:border-rose-500'
                : esBilled
                ? 'border-amber-200/90 dark:border-amber-800/80 hover:border-amber-500 dark:hover:border-amber-500'
                : esReservada
                ? 'border-sky-200/90 dark:border-sky-800/80 hover:border-sky-500 dark:hover:border-sky-500'
                : 'border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400';

              const glowBg = esOcupada
                ? 'bg-rose-500/10'
                : esBilled
                ? 'bg-amber-500/15'
                : esReservada
                ? 'bg-sky-500/10'
                : 'bg-emerald-500/10';

              const iconBoxBg = esOcupada
                ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200/80 dark:border-rose-800/60'
                : esBilled
                ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-800/60'
                : esReservada
                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-800/60';

              // Número técnico
              const cleanNumber = mesa.name.replace(/\D/g, '') || String(mesa.id);
              const tagMesa = `#M_${cleanNumber.padStart(2, '0')}`;

              return (
                <div
                  key={mesa.id}
                  className={`group relative bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-xl hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] select-none touch-manipulation overflow-hidden ${cardBorder}`}
                >
                  {/* Ambient Glow similar a Dashboard KPI */}
                  <div className={`absolute -top-12 -right-12 w-28 h-28 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-all ${glowBg}`} />

                  {/* Fila Superior: Tag técnico + Salón + Badge Estado */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 shrink-0">
                          {tagMesa}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[85px] font-semibold">
                          • {mesa.areaNombre}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 font-sora ${
                          esOcupada
                            ? 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/60'
                            : esBilled
                            ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60'
                            : esReservada
                            ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60'
                            : 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            esOcupada
                              ? 'bg-rose-500 animate-pulse'
                              : esBilled
                              ? 'bg-amber-500 animate-ping'
                              : esReservada
                              ? 'bg-sky-500'
                              : 'bg-emerald-500'
                          }`}
                        />
                        {esOcupada ? 'Ocupada' : esBilled ? 'Por Cobrar' : esReservada ? 'Reservada' : 'Disponible'}
                      </span>
                    </div>

                    {/* Título de Mesa con Icono en Caja Neutra */}
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${iconBoxBg} group-hover:scale-105 transition-transform`}>
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight truncate font-sora">
                          {mesa.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10.5px] text-slate-400 font-medium mt-0.5">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-400" /> {mesa.seats} sillas
                          </span>
                          {ordenActiva && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold font-mono">
                              <Clock className="w-3 h-3" />
                              {new Date(ordenActiva.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cuerpo: Caja de Orden o Caja de Mesa Libre */}
                  <div className="my-3.5">
                    {ordenActiva ? (
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/80 space-y-1.5 shadow-2xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 font-sora">
                            Consumo:
                          </span>
                          <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 font-sora tracking-tight">
                            S/ {parseFloat(ordenActiva.total || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10.5px] text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-1">
                          <span className="flex items-center gap-1">
                            <ChefHat className="w-3 h-3 text-slate-400" />
                            Platos marchando:
                          </span>
                          <span className="font-bold text-slate-700 dark:text-slate-200 font-mono">
                            {ordenActiva.detalles?.length || 0} ítems
                          </span>
                        </div>
                        {ordenActiva.mozo && (
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Atiende: <strong>{ordenActiva.mozo.name}</strong></span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-2xl bg-slate-50/60 dark:bg-slate-800/30 border border-dashed border-slate-200/80 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-1">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 font-sora">
                          Mesa Disponible
                        </span>
                        <span className="text-[9.5px] text-slate-400">
                          Lista para recibir comensales
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Botones de Acción (Estilo Táctil Dashboard) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    {esDisponible ? (
                      <button
                        type="button"
                        onClick={() => abrirMesa(mesa)}
                        className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-sora"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ocupar y Comandar</span>
                      </button>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => abrirMesa(mesa)}
                          className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center gap-1 cursor-pointer active:scale-95 font-sora"
                        >
                          <Plus className="w-3.5 h-3.5 text-amber-500" />
                          <span>+ Platos</span>
                        </button>

                        {esBilled ? (
                          <button
                            type="button"
                            onClick={() => abrirCobro(mesa)}
                            className="py-2 px-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1 cursor-pointer active:scale-95 font-sora"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Cobrar</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => pedirPrecuenta(mesa.id)}
                            className="py-2 px-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1 cursor-pointer active:scale-95 font-sora"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            <span>Pre-cuenta</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Tomar Comanda / Agregar Platos */}
      {modalComanda && mesaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-base font-bold text-slate-100">
                    Comanda para {mesaSeleccionada.name} ({mesaSeleccionada.areaNombre})
                  </h2>
                  <p className="text-xs text-slate-400">
                    Seleccione los platos, agregue notas especiales y envíe directamente a cocina.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalComanda(false)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Left Menu & Right Cart */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* Left Column: Menu Items */}
              <div className="flex-1 flex flex-col p-4 border-r border-slate-800 overflow-hidden">
                {/* Categories & Search */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={busquedaProd}
                      onChange={(e) => setBusquedaProd(e.target.value)}
                      placeholder="Buscar plato, bebida, entrada..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                      onClick={() => setCategoriaFiltro('todas')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        categoriaFiltro === 'todas'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Todos
                    </button>
                    {categorias.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCategoriaFiltro(c.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          categoriaFiltro === c.id
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dishes Grid */}
                <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-3 pr-1">
                  {productosFiltrados.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => agregarAComanda(p)}
                      className="cursor-pointer bg-slate-950/70 border border-slate-800 hover:border-amber-500/60 p-3 rounded-2xl flex flex-col justify-between transition-all hover:scale-[1.02] group"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-xs text-slate-200 group-hover:text-amber-300 transition-colors">
                            {p.name}
                          </h4>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                              p.destination === 'kitchen'
                                ? 'bg-rose-500/20 text-rose-300'
                                : 'bg-cyan-500/20 text-cyan-300'
                            }`}
                          >
                            {p.destination === 'kitchen' ? 'Cocina' : 'Bar'}
                          </span>
                        </div>
                        {p.description && (
                          <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">
                            {p.description}
                          </p>
                        )}
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-900">
                        <span className="text-sm font-black text-amber-400">
                          S/ {parseFloat(p.price).toFixed(2)}
                        </span>
                        <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs group-hover:bg-amber-500 group-hover:text-black transition-colors">
                          +
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Order Cart */}
              <div className="w-full md:w-80 bg-slate-950/40 p-4 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                    <span>Platos Nuevos a Enviar</span>
                    <span className="text-amber-400 font-bold">{itemsComanda.length} ítems</span>
                  </h3>

                  <div className="overflow-y-auto max-h-[48vh] space-y-2 mt-3 pr-1">
                    {itemsComanda.length === 0 ? (
                      <div className="py-12 text-center text-xs text-slate-500">
                        Haga clic en los platos a la izquierda para agregarlos a la comanda.
                      </div>
                    ) : (
                      itemsComanda.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5"
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-slate-200">{item.name}</span>
                            <span className="font-bold text-amber-400">
                              S/ {(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            {/* Quantity buttons */}
                            <div className="flex items-center gap-2 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                              <button
                                onClick={() => {
                                  const updated = [...itemsComanda];
                                  if (updated[idx].quantity > 1) {
                                    updated[idx].quantity -= 1;
                                    setItemsComanda(updated);
                                  } else {
                                    setItemsComanda(itemsComanda.filter((_, i) => i !== idx));
                                  }
                                }}
                                className="text-slate-400 hover:text-white font-bold"
                              >
                                -
                              </button>
                              <span className="font-bold text-slate-200">{item.quantity}</span>
                              <button
                                onClick={() => {
                                  const updated = [...itemsComanda];
                                  updated[idx].quantity += 1;
                                  setItemsComanda(updated);
                                }}
                                className="text-slate-400 hover:text-white font-bold"
                              >
                                +
                              </button>
                            </div>

                            {/* Note input */}
                            <input
                              type="text"
                              value={item.note || ''}
                              onChange={(e) => {
                                const updated = [...itemsComanda];
                                updated[idx].note = e.target.value;
                                setItemsComanda(updated);
                              }}
                              placeholder="Nota: ej. sin cebolla"
                              className="w-32 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Subtotal & Enviar Button */}
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-semibold">Total a Enviar:</span>
                    <span className="text-xl font-black text-amber-400">
                      S/ {totalComandaNueva.toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={enviarComanda}
                    disabled={itemsComanda.length === 0}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black transition-all shadow-lg shadow-amber-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <ChefHat className="w-4 h-4" />
                    Enviar a Cocina / Bar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Cobrar Cuenta */}
      {modalCobrar && mesaSeleccionada && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto select-none">
          <form
            onSubmit={ejecutarCobro}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-8"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-base font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                Cobrar Mesa: {mesaSeleccionada.name} ({mesaSeleccionada.areaNombre || 'Salón'})
              </h2>
              <button
                type="button"
                onClick={() => setModalCobrar(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total Banner */}
            {(() => {
              const ordenActiva = mesaSeleccionada.ordenes && mesaSeleccionada.ordenes.length > 0 ? mesaSeleccionada.ordenes[0] : null;
              const subtotal = ordenActiva ? parseFloat(ordenActiva.subtotal) : 0;
              const totalPagar = subtotal - (parseFloat(datosCobro.discount) || 0) + (parseFloat(datosCobro.tip) || 0);

              return (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between shadow-lg shadow-amber-500/25">
                  <div>
                    <span className="text-[11px] font-bold text-amber-100 uppercase tracking-wider block">Consumo en Mesa</span>
                    <span className="text-2xl font-black">S/ {totalPagar.toFixed(2)}</span>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-amber-100 block">Subtotal: S/ {subtotal.toFixed(2)}</span>
                    <span className="text-amber-200 text-[11px]">IGV 18% incluido</span>
                  </div>
                </div>
              );
            })()}

            {/* Tipo de Comprobante SUNAT */}
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
                Comprobante de Pago
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'Ticket', label: 'Ticket / Nota' },
                  { id: 'Boleta', label: 'Boleta SUNAT' },
                  { id: 'Factura', label: 'Factura SUNAT' }
                ].map((tipo) => (
                  <button
                    key={tipo.id}
                    type="button"
                    onClick={() => setDatosCobro({ ...datosCobro, document_type: tipo.id })}
                    className={`py-2 px-3 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                      datosCobro.document_type === tipo.id
                        ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-500/20'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tipo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Datos Cliente */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Nombre / Razón Social
                </label>
                <input
                  type="text"
                  required
                  value={datosCobro.client_name}
                  onChange={(e) => setDatosCobro({ ...datosCobro, client_name: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  {datosCobro.document_type === 'Factura' ? 'RUC (11 dígitos) *' : 'DNI / RUC'}
                </label>
                <input
                  type="text"
                  value={datosCobro.client_document}
                  onChange={(e) => setDatosCobro({ ...datosCobro, client_document: e.target.value })}
                  placeholder={datosCobro.document_type === 'Factura' ? 'Obligatorio' : 'Opcional'}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>

            {/* Método de Pago Peruano */}
            <div>
              <label className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1.5">
                Método de Pago
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[
                  { id: 'Efectivo', label: 'Efectivo', icon: DollarSign, color: 'text-emerald-500' },
                  { id: 'Yape', label: 'Yape', icon: QrCode, color: 'text-purple-500' },
                  { id: 'Plin', label: 'Plin', icon: Smartphone, color: 'text-sky-500' },
                  { id: 'Tarjeta', label: 'Tarjeta', icon: CreditCard, color: 'text-blue-500' },
                  { id: 'Credito', label: 'Crédito', icon: Clock, color: 'text-amber-500' },
                  { id: 'Mixto', label: 'Mixto', icon: Layers, color: 'text-teal-500' }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = datosCobro.payment_method.toLowerCase() === m.id.toLowerCase() || (datosCobro.payment_method === 'cash' && m.id === 'Efectivo');
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setDatosCobro({ ...datosCobro, payment_method: m.id })}
                      className={`p-2 rounded-2xl text-xs font-extrabold flex flex-col items-center justify-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1 ${isSelected ? 'text-white' : m.color}`} />
                      <span className="text-[10px] truncate">{m.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Billetes Sugeridos & Vuelto para Efectivo */}
            {(() => {
              const ordenActiva = mesaSeleccionada.ordenes && mesaSeleccionada.ordenes.length > 0 ? mesaSeleccionada.ordenes[0] : null;
              const subtotal = ordenActiva ? parseFloat(ordenActiva.subtotal) : 0;
              const totalPagar = subtotal - (parseFloat(datosCobro.discount) || 0) + (parseFloat(datosCobro.tip) || 0);
              const recibido = parseFloat(datosCobro.received_amount) || totalPagar;
              const vuelto = Math.max(0, recibido - totalPagar);

              if (datosCobro.payment_method === 'Efectivo' || datosCobro.payment_method === 'cash') {
                return (
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Efectivo Recibido:</span>
                      <button
                        type="button"
                        onClick={() => setDatosCobro({ ...datosCobro, received_amount: totalPagar.toFixed(2) })}
                        className="text-xs font-extrabold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Exacto S/ {totalPagar.toFixed(2)}
                      </button>
                    </div>

                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">S/</span>
                      <input
                        type="number"
                        step="0.50"
                        value={datosCobro.received_amount}
                        onChange={(e) => setDatosCobro({ ...datosCobro, received_amount: e.target.value })}
                        placeholder={totalPagar.toFixed(2)}
                        className="w-full pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-black text-slate-800 dark:text-white outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Chips de Billetes Peruanos */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Coins className="w-3 h-3" /> Billetes:
                      </span>
                      {[10, 20, 50, 100, 200].map((b) => (
                        <button
                          key={b}
                          type="button"
                          onClick={() => setDatosCobro({ ...datosCobro, received_amount: b.toString() })}
                          className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:border-amber-400 cursor-pointer"
                        >
                          S/ {b}
                        </button>
                      ))}
                    </div>

                    {/* Vuelto */}
                    <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Vuelto al Comensal:</span>
                      <span className="text-base font-black text-emerald-700 dark:text-emerald-400">S/ {vuelto.toFixed(2)}</span>
                    </div>
                  </div>
                );
              }

              if (datosCobro.payment_method === 'Mixto') {
                return (
                  <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-900/40 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block mb-1">Monto Efectivo:</span>
                        <input
                          type="number"
                          step="0.50"
                          value={datosCobro.monto_efectivo}
                          onChange={(e) => {
                            const val = e.target.value;
                            const rest = Math.max(0, totalPagar - (parseFloat(val) || 0));
                            setDatosCobro({ ...datosCobro, monto_efectivo: val, monto_digital: rest.toFixed(2) });
                          }}
                          placeholder="0.00"
                          className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-200 text-xs font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block mb-1">Monto Digital:</span>
                        <input
                          type="number"
                          readOnly
                          value={datosCobro.monto_digital}
                          placeholder="0.00"
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-teal-200 text-xs font-bold"
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              return null;
            })()}

            {/* Descuento y Propina */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Descuento (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={datosCobro.discount}
                  onChange={(e) => setDatosCobro({ ...datosCobro, discount: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">Propina Sugerida (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={datosCobro.tip}
                  onChange={(e) => setDatosCobro({ ...datosCobro, tip: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalCobrar(false)}
                className="flex-1 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-extrabold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesandoCobro}
                className="flex-[2] py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {procesandoCobro ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Emitiendo...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirmar y Emitir Comprobante</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ticket Térmico 80mm / 58mm Modal */}
      {mostrarTicket && (
        <TicketImpresion ticketData={ticketData} onClose={() => setMostrarTicket(false)} />
      )}
    </div>
  );
}

