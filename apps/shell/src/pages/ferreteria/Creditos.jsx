import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import toast from 'react-hot-toast';
import {
 CreditCard,
 DollarSign,
 Calendar,
 CheckCircle2,
 AlertCircle,
 PlusCircle,
 X,
 Search,
 Filter,
 Building2,
 HardHat,
 Phone,
 MapPin,
 Clock,
 ArrowUpRight,
 ArrowDownLeft,
 ShieldCheck,
 ChevronRight,
 UserCheck,
 AlertTriangle,
 Eye,
 RefreshCw,
 Wallet,
 Sparkles,
 Printer,
 FileText,
 MessageCircle,
 Send,
 Copy,
 Check,
 Smartphone,
  ChevronDown
} from 'lucide-react';
import { useSettingsStore } from '@heis/core';
import { imprimirReciboCobranza, imprimirEstadoCuentaCliente } from './utils/impresionTermica';

function calcularDiasVencimiento(fechaVencimiento) {
 if (!fechaVencimiento) return null;
 try {
 const hoy = new Date();
 hoy.setHours(0, 0, 0, 0);
 const v = new Date(fechaVencimiento + 'T00:00:00');
 if (isNaN(v.getTime())) return null;
 const diffTime = v.getTime() - hoy.getTime();
 return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
 } catch (e) {
 return null;
 }
}


// Opciones de filtro para Plazo y Estado
const OPCIONES_PLAZO = [
  { valor: 'TODOS', etiqueta: 'Todos los plazos', descripcion: 'Sin filtro de plazo' },
  { valor: '15', etiqueta: '15 Días (Quincenal)', descripcion: 'Plazo quincenal de obra' },
  { valor: '30', etiqueta: '30 Días (Mensual)', descripcion: 'Plazo mensual habitual' },
  { valor: '45', etiqueta: '45 Días', descripcion: 'Plazo extendido de obra' },
  { valor: '60', etiqueta: '60 Días (Bimestral)', descripcion: 'Plazo bimestral mayorista' }
];

const OPCIONES_ESTADO_CREDITOS = [
  { valor: 'TODOS', etiqueta: 'Todos los estados', descripcion: 'Líneas activas, alertas y bloqueadas' },
  { valor: 'Activo', etiqueta: 'Activo', descripcion: 'Línea de crédito autorizada', badge: 'Activo', color: 'emerald' },
  { valor: 'Alerta', etiqueta: 'En Alerta', descripcion: 'Consumo alto o demoras', badge: 'Alerta', color: 'amber' },
  { valor: 'Bloqueado', etiqueta: 'Bloqueado', descripcion: 'Línea suspendida por mora', badge: 'Bloqueado', color: 'rose' }
];

const OPCIONES_ESTADO_CUENTAS = [
  { valor: 'TODOS', etiqueta: 'Todos los estados', descripcion: 'Todas las cuentas' },
  { valor: 'Pendiente', etiqueta: 'Pendiente', descripcion: 'En plazo acordado vigente', badge: 'Pendiente', color: 'amber' },
  { valor: 'Vencido', etiqueta: 'Vencido', descripcion: 'Superó fecha límite de pago', badge: 'Vencido', color: 'rose' },
  { valor: 'Pagado', etiqueta: 'Pagado', descripcion: 'Saldo regularizado al 100%', badge: 'Pagado', color: 'emerald' }
];

// Componente de Píldora Desplegable con diseño idéntico a las otras categorías
function PildoraDesplegableFiltro({
  label,
  icon: Icon,
  valor,
  opciones = [],
  onChange,
  className = ''
}) {
  const [abierto, setAbierto] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setAbierto(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') setAbierto(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const opcionSeleccionada = opciones.find((o) => String(o.valor) === String(valor)) || opciones[0];
  const esFiltroActivo = valor !== 'TODOS';

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setAbierto(!abierto)}
        className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between gap-2.5 select-none touch-manipulation active:scale-[0.98] ${
          abierto
            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
            : esFiltroActivo
            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700 shadow-2xs font-black'
            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/90 dark:border-slate-700 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          {Icon && (
            <Icon
              className={`w-3.5 h-3.5 shrink-0 ${
                esFiltroActivo || abierto
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-400 dark:text-slate-500'
              }`}
            />
          )}
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            {label}:
          </span>
          <span className="truncate max-w-[130px] sm:max-w-[170px] font-extrabold text-slate-800 dark:text-slate-100">
            {opcionSeleccionada ? opcionSeleccionada.etiqueta : valor}
          </span>
          {esFiltroActivo && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 animate-pulse" />
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
            abierto ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Flotante Redondeado */}
      {abierto && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-slate-900/20 dark:shadow-black/70 p-1.5 space-y-0.5 animate-in fade-in zoom-in-95 duration-150 min-w-[230px] sm:min-w-[260px]">
          <div className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Filtrar por {label}</span>
            {esFiltroActivo && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('TODOS');
                  setAbierto(false);
                }}
                className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer lowercase font-medium"
              >
                restablecer
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar p-0.5">
            {opciones.map((opc) => {
              const estaSel = String(valor) === String(opc.valor);
              return (
                <button
                  key={String(opc.valor)}
                  type="button"
                  onClick={() => {
                    onChange(opc.valor);
                    setAbierto(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-semibold flex items-center justify-between gap-2.5 transition-colors cursor-pointer select-none ${
                    estaSel
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate pr-1">
                    <span className="block truncate font-bold text-xs">{opc.etiqueta}</span>
                    {opc.descripcion && (
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal block truncate mt-0.5">
                        {opc.descripcion}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {opc.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          opc.color === 'emerald'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : opc.color === 'rose'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            : opc.color === 'amber'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {opc.badge}
                      </span>
                    )}
                    {estaSel && (
                      <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Creditos({ initialTab = 'creditos' }) {
 const [tab, setTab] = useState(initialTab); // 'creditos' | 'cobrar' | 'pagar'
 const [lineasCredito, setLineasCredito] = useState([]);
 const [cuentasCobrar, setCuentasCobrar] = useState([]);
 const [cuentasPagar, setCuentasPagar] = useState([]);
 const [cargando, setCargando] = useState(true);

 // Filtros y búsquedas
 const [busqueda, setBusqueda] = useState('');
 const [filtroPlazo, setFiltroPlazo] = useState('TODOS');
 const [filtroEstado, setFiltroEstado] = useState('TODOS');

 // Modal Abono
 const [modalAbono, setModalAbono] = useState(false);
 const [cuentaSeleccionada, setCuentaSeleccionada] = useState(null);
 const [montoAbono, setMontoAbono] = useState('');
 const [metodoPago, setMetodoPago] = useState('Efectivo');
 const [notasAbono, setNotasAbono] = useState('');
 const [guardandoAbono, setGuardandoAbono] = useState(false);

 // Modal Éxito y Recibo de Cobranza
 const [modalAbonoExito, setModalAbonoExito] = useState(false);
 const [ultimoAbonoRealizado, setUltimoAbonoRealizado] = useState(null);

 const settings = useSettingsStore();

 // Modal Estado de Cuenta del Cliente
 const [modalEstadoCuenta, setModalEstadoCuenta] = useState(false);
 const [clienteEstadoCuenta, setClienteEstadoCuenta] = useState(null);
 const [tamanoPapelEstadoCuenta, setTamanoPapelEstadoCuenta] = useState('80mm');
 const [vistaEstadoCuentaTab, setVistaEstadoCuentaTab] = useState('resumen');
 const [copiadoEstadoCuenta, setCopiadoEstadoCuenta] = useState(false);
 const [mostrarInputWhatsappEstadoCuenta, setMostrarInputWhatsappEstadoCuenta] = useState(false);
 const [telefonoWhatsappEstadoCuenta, setTelefonoWhatsappEstadoCuenta] = useState('');

 // Modal Detalle Cliente / Línea de Crédito
 const [modalDetalleCliente, setModalDetalleCliente] = useState(false);
 const [clienteActivo, setClienteActivo] = useState(null);

 // Sincronizar tab si cambia el prop initialTab
 useEffect(() => {
 if (initialTab && ['creditos', 'cobrar', 'pagar'].includes(initialTab)) {
 setTab(initialTab);
 }
 }, [initialTab]);

 const cargarDatos = async () => {
 setCargando(true);
 try {
 const [resLineas, resCobrar, resPagar] = await Promise.all([
 api.get('/creditos/lineas-credito').catch(() => ({ success: false, lineas: [] })),
 api.get('/creditos/cobrar').catch(() => ({ success: false, cuentas: [] })),
 api.get('/creditos/pagar').catch(() => ({ success: false, cuentas: [] }))
 ]);

 if (resLineas.success) setLineasCredito(resLineas.lineas || []);
 if (resCobrar.success) setCuentasCobrar(resCobrar.cuentas || []);
 if (resPagar.success) setCuentasPagar(resPagar.cuentas || []);
 } catch (e) {
 toast.error('Error al cargar datos financieros');
 } finally {
 setCargando(false);
 }
 };

 useEffect(() => {
 cargarDatos();
 }, []);

 // ─── CÁLCULOS KPI ───
 // Líneas de crédito mayoristas
 const totalLineaOtorgada = lineasCredito.reduce((sum, l) => sum + parseFloat(l.limite_credito || 0), 0);
 const totalDeudaLineas = lineasCredito.reduce((sum, l) => sum + parseFloat(l.deuda_total || 0), 0);
 const totalDisponibleLineas = lineasCredito.reduce((sum, l) => sum + parseFloat(l.credito_disponible || 0), 0);
 const clientesCreditoActivo = lineasCredito.filter((l) => l.estado_credito === 'Activo').length;

 // Cuentas por cobrar
 const totalPendienteCobrar = cuentasCobrar
 .filter((c) => c.estado !== 'Pagado')
 .reduce((sum, c) => sum + parseFloat(c.saldo_pendiente || 0), 0);

 const totalVencidoCobrar = cuentasCobrar
 .filter((c) => {
 if (c.estado === 'Pagado') return false;
 const dias = calcularDiasVencimiento(c.fecha_vencimiento);
 return dias !== null && dias < 0;
 })
 .reduce((sum, c) => sum + parseFloat(c.saldo_pendiente || 0), 0);

 // Cuentas por pagar
 const totalPendientePagar = cuentasPagar
 .filter((c) => c.estado !== 'Pagado')
 .reduce((sum, c) => sum + parseFloat(c.saldo_pendiente || 0), 0);

 // ─── FILTRADO DE LÍNEAS DE CRÉDITO ───
 const lineasFiltradas = useMemo(() => {
 return lineasCredito.filter((l) => {
 const q = busqueda.toLowerCase().trim();
 const matchBusqueda =
 !q ||
 l.nombre?.toLowerCase().includes(q) ||
 l.numero_documento?.includes(q) ||
 l.contacto_obra?.toLowerCase().includes(q) ||
 l.direccion_obra?.toLowerCase().includes(q) ||
 l.perfil_cliente?.toLowerCase().includes(q);

 const matchPlazo =
 filtroPlazo === 'TODOS' ||
 String(l.dias_credito) === String(filtroPlazo);

 const matchEstado =
 filtroEstado === 'TODOS' ||
 l.estado_credito === filtroEstado;

 return matchBusqueda && matchPlazo && matchEstado;
 });
 }, [lineasCredito, busqueda, filtroPlazo, filtroEstado]);

 // ─── FILTRADO DE CUENTAS POR COBRAR ───
 const cuentasCobrarFiltradas = useMemo(() => {
 return cuentasCobrar.filter((c) => {
 const q = busqueda.toLowerCase().trim();
 const matchBusqueda =
 !q ||
 c.cliente?.nombre?.toLowerCase().includes(q) ||
 c.cliente?.numero_documento?.includes(q) ||
 c.venta?.numero?.toLowerCase().includes(q) ||
 c.cliente?.contacto_obra?.toLowerCase().includes(q) ||
 c.cliente?.direccion_obra?.toLowerCase().includes(q);

 const matchEstado =
 filtroEstado === 'TODOS' ||
 (filtroEstado === 'Vencido'
 ? c.estado !== 'Pagado' && (calcularDiasVencimiento(c.fecha_vencimiento) ?? 0) < 0
 : c.estado === filtroEstado);

 return matchBusqueda && matchEstado;
 });
 }, [cuentasCobrar, busqueda, filtroEstado]);

 // ─── FILTRADO DE CUENTAS POR PAGAR ───
 const cuentasPagarFiltradas = useMemo(() => {
 return cuentasPagar.filter((c) => {
 const q = busqueda.toLowerCase().trim();
 const matchBusqueda =
 !q ||
 c.proveedor?.razon_social?.toLowerCase().includes(q) ||
 c.proveedor?.numero_documento?.includes(q) ||
 c.compra?.numero?.toLowerCase().includes(q);

 const matchEstado =
 filtroEstado === 'TODOS' || c.estado === filtroEstado;

 return matchBusqueda && matchEstado;
 });
 }, [cuentasPagar, busqueda, filtroEstado]);

 // Abrir modal de abono
 const abrirAbono = (cuenta, esCliente = true) => {
 setCuentaSeleccionada({ ...cuenta, esCliente });
 setMontoAbono(parseFloat(cuenta.saldo_pendiente || 0).toFixed(2));
 setMetodoPago('Efectivo');
 setNotasAbono('');
 setModalAbono(true);
 };

 // Abrir abono rápido para un cliente mayorista
 const abrirAbonoClienteLinea = (cliente) => {
 // Buscar la cuenta más antigua o primera pendiente de este cliente
 const cuentasPendientes = cuentasCobrar.filter(
 (c) => c.id_cliente === cliente.id && c.estado !== 'Pagado'
 );
 if (cuentasPendientes.length === 0) {
 toast('Este cliente no tiene cuentas pendientes con saldo por cobrar.', { icon: 'ℹ️' });
 return;
 }
 // Tomar la primera
 abrirAbono(cuentasPendientes[0], true);
 };

 const handleAbonoSubmit = async (e) => {
 e.preventDefault();
 if (!montoAbono || parseFloat(montoAbono) <= 0) {
 toast.error('Ingrese un monto de abono válido mayor a 0');
 return;
 }

 setGuardandoAbono(true);
 try {
 if (cuentaSeleccionada.esCliente) {
 const res = await api.post('/creditos/cobrar/abono', {
 id_cuenta_cobrar: cuentaSeleccionada.id,
 monto: parseFloat(montoAbono),
 metodo_pago: metodoPago,
 notas: notasAbono
 });
 const abonoData = {
 id: res.abono?.id || Date.now(),
 monto: parseFloat(montoAbono),
 metodo_pago: metodoPago,
 notas: notasAbono,
 fecha: new Date(),
 saldo_anterior: parseFloat(cuentaSeleccionada.saldo_pendiente || 0),
 saldo_restante:
 res.saldo_pendiente !== undefined
 ? parseFloat(res.saldo_pendiente)
 : Math.max(0, parseFloat(cuentaSeleccionada.saldo_pendiente || 0) - parseFloat(montoAbono)),
 cliente: cuentaSeleccionada.cliente,
 venta: cuentaSeleccionada.venta,
 id_cuenta_cobrar: cuentaSeleccionada.id
 };
 setUltimoAbonoRealizado(abonoData);
 setModalAbonoExito(true);
 toast.success(res.message || 'Abono de cliente registrado correctamente.');
 } else {
 const res = await api.post('/creditos/pagar/abono', {
 id_cuenta_pagar: cuentaSeleccionada.id,
 monto: parseFloat(montoAbono),
 metodo_pago: metodoPago,
 notas: notasAbono
 });
 toast.success(res.message || 'Pago a proveedor registrado correctamente.');
 }
 setModalAbono(false);
 cargarDatos();
 } catch (err) {
 toast.error(err.message || 'Error al registrar el abono');
 } finally {
 setGuardandoAbono(false);
 }
 };

 const handleAbrirEstadoCuenta = (cliente) => {
 const pendientes = cuentasCobrar.filter(
 (c) => c.id_cliente === cliente.id && c.estado !== 'Pagado'
 );
 setClienteEstadoCuenta({
 cliente,
 cuentasPendientes: pendientes,
 totalDeuda: parseFloat(cliente.deuda_total || 0),
 limiteCredito: parseFloat(cliente.limite_credito || 0),
 creditoDisponible: parseFloat(cliente.credito_disponible || 0)
 });
 setVistaEstadoCuentaTab('resumen');
 setCopiadoEstadoCuenta(false);
 setMostrarInputWhatsappEstadoCuenta(false);
 setTelefonoWhatsappEstadoCuenta(cliente.telefono || cliente.celular || '');
 setModalEstadoCuenta(true);
 };

 const handleImprimirEstadoCuenta = (formato = tamanoPapelEstadoCuenta || '80mm') => {
 if (!clienteEstadoCuenta) return;
 imprimirEstadoCuentaCliente(clienteEstadoCuenta, { formato, settings, autoPrint: true });
 toast.success(`Enviando estado de cuenta (${formato}) a la impresora térmica...`, { icon: '🖨️' });
 };

 const handleCopiarEstadoCuenta = () => {
 if (!clienteEstadoCuenta?.cliente) return;
 const c = clienteEstadoCuenta.cliente;
 const texto = `*ESTADO DE CUENTA — ${settings?.businessName || 'FERRETERÍA HEIS'}*
*Cliente:* ${c.nombre || 'Cliente'}
*Documento:* ${c.tipo_documento || 'Doc'}: ${c.numero_documento || '-'}
${c.contacto_obra ? `*Contacto de Obra:* ${c.contacto_obra}\n` : ''}${c.direccion_obra ? `*Ubicación Obra:* ${c.direccion_obra}\n` : ''}
*Línea Autorizada:* S/ ${clienteEstadoCuenta.limiteCredito.toFixed(2)}
*Deuda Total Pendiente:* S/ ${clienteEstadoCuenta.totalDeuda.toFixed(2)}
*Crédito Disponible:* S/ ${clienteEstadoCuenta.creditoDisponible.toFixed(2)}
*Comprobantes Pendientes:* ${clienteEstadoCuenta.cuentasPendientes?.length || 0}
*Fecha de Emisión:* ${new Date().toLocaleDateString('es-PE')}`;

 navigator.clipboard.writeText(texto);
 setCopiadoEstadoCuenta(true);
 toast.success('Resumen de estado de cuenta copiado al portapapeles');
 setTimeout(() => setCopiadoEstadoCuenta(false), 2200);
 };

 const handleEnviarWhatsAppEstadoCuenta = (e) => {
 if (e && e.preventDefault) e.preventDefault();
 if (!clienteEstadoCuenta?.cliente) return;
 const c = clienteEstadoCuenta.cliente;
 const tel = telefonoWhatsappEstadoCuenta || c.telefono || c.celular || '';
 const numLimpio = tel.replace(/[^0-9]/g, '');
 const telefonoDestino = numLimpio.startsWith('51')
 ? numLimpio
 : numLimpio.length === 9
 ? `51${numLimpio}`
 : numLimpio;

 const texto = `Hola *${c.nombre || 'Estimado(a)'}*, le saludamos de *${settings?.businessName || 'FERRETERÍA & MATERIALES HEIS'}*.
Le compartimos el resumen de su *Estado de Cuenta de Obra*:

*Línea Autorizada:* S/ ${clienteEstadoCuenta.limiteCredito.toFixed(2)}
*Deuda Total Pendiente:* S/ ${clienteEstadoCuenta.totalDeuda.toFixed(2)}
*Crédito Disponible:* S/ ${clienteEstadoCuenta.creditoDisponible.toFixed(2)}
*Documentos Pendientes:* ${clienteEstadoCuenta.cuentasPendientes?.length || 0}

Agradecemos coordinar la cancelación de sus saldos para mantener activa su línea de crédito.
¡Muchas gracias por su preferencia!`;

 const url = telefonoDestino
 ? `https://api.whatsapp.com/send?phone=${telefonoDestino}&text=${encodeURIComponent(texto)}`
 : `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`;

 window.open(url, '_blank');
 };

 return (
 <div className="space-y-4">
 {/* ─── PÍLDORA UNIFICADA: IDENTIFICADOR Y SELECTOR DE CARTERAS DE CRÉDITO ─── */}
 <div className="bg-white dark:bg-slate-900 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-3 flex-wrap">
 {/* Lado izquierdo: Identificador squircle + Título dinámico + Badge status */}
 <div className="flex items-center gap-2.5 flex-wrap min-w-0">
 <div
 className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs border ${
 tab === 'creditos'
 ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white border-indigo-400/20 shadow-indigo-600/20'
 : tab === 'cobrar'
 ? 'bg-gradient-to-tr from-emerald-600 to-teal-600 text-white border-emerald-400/20 shadow-emerald-600/20'
 : 'bg-gradient-to-tr from-amber-600 to-orange-600 text-white border-amber-400/20 shadow-amber-600/20'
 }`}
 >
 {tab === 'creditos' && <CreditCard className="w-4 h-4" />}
 {tab === 'cobrar' && <ArrowDownLeft className="w-4 h-4" />}
 {tab === 'pagar' && <ArrowUpRight className="w-4 h-4" />}
 </div>

 <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight ">
 Cuentas Corrientes y Créditos a Plazos
 </span>

 <span
 className={`inline-flex items-center gap-1.5 text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
 tab === 'creditos'
 ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/80 shadow-2xs'
 : tab === 'cobrar'
 ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs'
 : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs'
 }`}
 >
 <span
 className={`w-1.5 h-1.5 rounded-full animate-pulse ${
 tab === 'creditos' ? 'bg-indigo-500' : tab === 'cobrar' ? 'bg-emerald-500' : 'bg-amber-500'
 }`}
 />
 {tab === 'creditos' && 'Líneas Activas'}
 {tab === 'cobrar' && 'Recaudación'}
 {tab === 'pagar' && 'Proveedores'}
 </span>
 </div>

 {/* Lado derecho: Botones de carteras + Divisor + Botón refrescar */}
 <div className="flex items-center gap-2 flex-wrap">
 {[
 { id: 'creditos', label: 'Líneas y Plazos de Obra', icon: HardHat },
 { id: 'cobrar', label: `Por Cobrar (S/ ${totalPendienteCobrar.toFixed(2)})`, icon: ArrowDownLeft },
 { id: 'pagar', label: `Por Pagar (S/ ${totalPendientePagar.toFixed(2)})`, icon: ArrowUpRight }
 ].map((item) => {
 const isSelected = tab === item.id;
 const Icon = item.icon;
 return (
 <button
 key={item.id}
 type="button"
 onClick={() => {
   setTab(item.id);
   setFiltroEstado('TODOS');
   setFiltroPlazo('TODOS');
 }}
 className={`px-3.5 py-2 sm:px-4 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 flex items-center justify-center gap-1.5 active:scale-95 ${
 isSelected
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs hover:shadow-md'
 : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs'
 }`}
 >
 <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
 <span>{item.label}</span>
 </button>
 );
 })}

 <div className="h-5 w-[1px] bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

 <button
 type="button"
 onClick={cargarDatos}
 title="Refrescar datos de créditos"
 className="h-8 w-8 rounded-xl border border-slate-200/90 dark:border-slate-700 bg-slate-100 hover:bg-slate-200/70 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer flex items-center justify-center shrink-0 active:scale-95 shadow-2xs"
 >
 <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin text-indigo-600' : ''}`} />
 </button>
 </div>
 </div>

 {/* ─── TARJETAS KPI DE RESUMEN ─── */}
 {tab === 'creditos' && (
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
 {/* Línea Total Autorizada */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Línea Total Autorizada
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <ShieldCheck className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
 S/ {totalLineaOtorgada.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Cupo a contratistas de obra</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
 Autorizado
 </span>
 </div>
 </div>

 {/* Deuda Consumida en Obra */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-rose-500 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-rose-600 dark:text-rose-400 uppercase truncate">
 Deuda Consumida en Obra
 </span>
 <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <Clock className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
 S/ {totalDeudaLineas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Materiales entregados pendiente</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
 En Deuda
 </span>
 </div>
 </div>

 {/* Crédito Disponible */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase truncate">
 Crédito Disponible
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <Wallet className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
 S/ {totalDisponibleLineas.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Disponible para despachos</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
 Disponible
 </span>
 </div>
 </div>

 {/* Clientes Mayoristas */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Clientes Mayoristas
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <HardHat className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10 flex items-baseline gap-1.5">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
 {clientesCreditoActivo}
 </span>
 <span className="text-xs font-semibold text-slate-400">con crédito activo</span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Plazos: 15, 30, 45 y 60 días</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
 Plazos
 </span>
 </div>
 </div>
 </div>
 )}

 {tab === 'cobrar' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
 {/* Total Pendiente por Cobrar */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-rose-500 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-rose-600 dark:text-rose-400 uppercase truncate">
 Total Pendiente por Cobrar
 </span>
 <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <ArrowDownLeft className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
 S/ {totalPendienteCobrar.toFixed(2)}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Saldos de ventas a crédito</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
 Por Cobrar
 </span>
 </div>
 </div>

 {/* Documentos Vencidos */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500 shadow-2xs hover:shadow-md hover:shadow-amber-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-amber-600 dark:text-amber-400 uppercase truncate">
 Documentos Vencidos
 </span>
 <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <AlertTriangle className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">
 S/ {totalVencidoCobrar.toFixed(2)}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Superaron la fecha límite</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
 Vencidos
 </span>
 </div>
 </div>

 {/* Por Cobrar al Día */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between sm:col-span-2 lg:col-span-1">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase truncate">
 Por Cobrar al Día
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
 S/ {(totalPendienteCobrar - totalVencidoCobrar).toFixed(2)}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">En período normal acordado</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
 Al Día
 </span>
 </div>
 </div>
 </div>
 )}

 {tab === 'pagar' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
 {/* Total Pendiente por Pagar */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-rose-500 shadow-2xs hover:shadow-md hover:shadow-rose-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-rose-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-rose-600 dark:text-rose-400 uppercase truncate">
 Total Pendiente por Pagar
 </span>
 <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <ArrowUpRight className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
 S/ {totalPendientePagar.toFixed(2)}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Compromisos con proveedores</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
 Por Pagar
 </span>
 </div>
 </div>

 {/* Compromisos Registrados */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-500 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase truncate">
 Documentos Registrados
 </span>
 <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <Building2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
 {cuentasPagar.length}
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Facturas y compras ferreteras</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
 Proveedores
 </span>
 </div>
 </div>

 {/* Saldo Regularizado */}
 <div className="group relative bg-white dark:bg-slate-900 rounded-2xl py-2.5 px-3.5 sm:py-3 sm:px-4 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500 shadow-2xs hover:shadow-md hover:shadow-emerald-500/10 hover:-translate-y-1 hover:scale-[1.015] active:translate-y-0 active:scale-[0.99] transition-all duration-200 ease-out select-none overflow-hidden flex flex-col justify-between sm:col-span-2 lg:col-span-1">
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
 <div className="flex items-center justify-between gap-2 relative z-10">
 <span className="text-[10.5px] sm:text-[11px] font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase truncate">
 Crédito Comercial
 </span>
 <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform flex-shrink-0">
 <CheckCircle2 className="w-3.5 h-3.5" />
 </div>
 </div>
 <div className="mt-1.5 relative z-10">
 <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">
 100%
 </span>
 </div>
 <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs relative z-10">
 <span className="text-[11px] text-slate-400 truncate">Cuentas con plazos acordados</span>
 <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
 Al Día
 </span>
 </div>
 </div>
 </div>
 )}

 {/* ─── BARRA DE BÚSQUEDA Y FILTROS ─── */}
 <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
 <div className="relative w-full md:w-96">
 <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 value={busqueda}
 onChange={(e) => setBusqueda(e.target.value)}
 placeholder={
 tab === 'creditos'
 ? 'Buscar cliente, RUC, contacto u obra...'
 : tab === 'cobrar'
 ? 'Buscar por cliente, documento o comprobante...'
 : 'Buscar proveedor o factura...'
 }
 className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>

 <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
 {tab === 'creditos' && (
            <PildoraDesplegableFiltro
              label="Plazo"
              icon={Clock}
              valor={filtroPlazo}
              opciones={OPCIONES_PLAZO}
              onChange={(val) => setFiltroPlazo(val)}
            />
          )}

          <PildoraDesplegableFiltro
            label="Estado"
            icon={Filter}
            valor={filtroEstado}
            opciones={tab === 'creditos' ? OPCIONES_ESTADO_CREDITOS : OPCIONES_ESTADO_CUENTAS}
            onChange={(val) => setFiltroEstado(val)}
          />

 <button
 type="button"
 onClick={cargarDatos}
 title="Recargar datos"
 className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
 >
 <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
 </button>
 </div>
 </div>

 {/* ─── TABLA 1: LÍNEAS DE CRÉDITO Y PLAZOS PARA MAYORISTAS Y OBRAS ─── */}
 {tab === 'creditos' && (
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider ">
 <th className="py-3 px-4">Cliente / Contratista</th>
 <th className="py-3 px-4">Obra / Proyecto</th>
 <th className="py-3 px-4 text-center">Plazo Acordado</th>
 <th className="py-3 px-4 text-right">Línea de Crédito</th>
 <th className="py-3 px-4 text-right">Deuda Consumida</th>
 <th className="py-3 px-4 text-right">Disponible</th>
 <th className="py-3 px-4 text-center">Estado</th>
 <th className="py-3 px-4 text-center">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
 {cargando ? (
 <tr>
 <td colSpan="8" className="py-12 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-2">
 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span>Cargando líneas de crédito mayoristas...</span>
 </div>
 </td>
 </tr>
 ) : lineasFiltradas.length === 0 ? (
 <tr>
 <td colSpan="8" className="py-12 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-2">
 <HardHat className="w-8 h-8 text-slate-300 dark:text-slate-600" />
 <p className="font-semibold">No se encontraron clientes con línea de crédito configurada.</p>
 <p className="text-[11px] text-slate-400">Puedes asignar cupo y plazo desde el módulo de Clientes & Mayoristas.</p>
 </div>
 </td>
 </tr>
 ) : (
 lineasFiltradas.map((l) => {
 const pctUso = l.limite_credito > 0 ? (l.deuda_total / l.limite_credito) * 100 : 0;
 return (
 <tr key={l.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
 {/* Cliente */}
 <td className="py-3.5 px-4">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-xs shrink-0 border border-indigo-100 dark:border-indigo-800/50">
 {l.nombre?.charAt(0) || 'C'}
 </div>
 <div className="min-w-0">
 <p className="font-black text-slate-900 dark:text-white truncate">
 {l.nombre}
 </p>
 <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
 <span>{l.tipo_documento}: {l.numero_documento}</span>
 {l.perfil_cliente && (
 <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-sans font-bold">
 {l.perfil_cliente}
 </span>
 )}
 </div>
 </div>
 </div>
 </td>

 {/* Obra / Proyecto */}
 <td className="py-3.5 px-4">
 {l.direccion_obra || l.contacto_obra ? (
 <div className="space-y-0.5 max-w-[200px]">
 {l.contacto_obra && (
 <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate flex items-center gap-1">
 <HardHat className="w-3 h-3 text-amber-500 shrink-0" />
 <span className="truncate">{l.contacto_obra}</span>
 </p>
 )}
 {l.direccion_obra && (
 <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
 <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
 <span className="truncate">{l.direccion_obra}</span>
 </p>
 )}
 {l.telefono_obra && (
 <p className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
 <Phone className="w-3 h-3 text-slate-400 shrink-0" />
 <span>{l.telefono_obra}</span>
 </p>
 )}
 </div>
 ) : (
 <span className="text-[11px] text-slate-400 italic">Despacho en tienda</span>
 )}
 </td>

 {/* Plazo Acordado */}
 <td className="py-3.5 px-4 text-center">
 <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
 <Calendar className="w-3 h-3" />
 {l.dias_credito || 15} Días
 </span>
 </td>

 {/* Límite Autorizado */}
 <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
 S/ {parseFloat(l.limite_credito).toFixed(2)}
 </td>

 {/* Deuda Consumida & Barra */}
 <td className="py-3.5 px-4 text-right">
 <p className={`font-mono font-black text-xs ${l.deuda_total > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
 S/ {parseFloat(l.deuda_total).toFixed(2)}
 </p>
 <div className="w-24 ml-auto mt-1 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
 <div
 className={`h-full rounded-full transition-all ${
 pctUso > 90 ? 'bg-rose-500' : pctUso > 60 ? 'bg-amber-500' : 'bg-emerald-500'
 }`}
 style={{ width: `${Math.min(100, pctUso)}%` }}
 />
 </div>
 <span className="text-[9.5px] text-slate-400 font-mono">
 {pctUso.toFixed(0)}% usado
 </span>
 </td>

 {/* Disponible */}
 <td className="py-3.5 px-4 text-right font-mono font-black text-xs text-emerald-600 dark:text-emerald-400">
 S/ {parseFloat(l.credito_disponible).toFixed(2)}
 </td>

 {/* Estado */}
 <td className="py-3.5 px-4 text-center">
 {l.estado_credito === 'Activo' && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
 <CheckCircle2 className="w-3 h-3" />
 Activo
 </span>
 )}
 {l.estado_credito === 'Alerta' && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
 <AlertTriangle className="w-3 h-3" />
 En Alerta
 </span>
 )}
 {l.estado_credito === 'Bloqueado' && (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
 <AlertCircle className="w-3 h-3" />
 Bloqueado
 </span>
 )}
 </td>

 {/* Acciones */}
 <td className="py-3.5 px-4 text-center">
 <div className="flex items-center justify-center gap-1.5">
 <button
 type="button"
 onClick={() => {
 setClienteActivo(l);
 setModalDetalleCliente(true);
 }}
 title="Ver cuentas y detalles de obra"
 className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors cursor-pointer"
 >
 <Eye className="w-4 h-4" />
 </button>

 <button
 type="button"
 onClick={() => handleAbrirEstadoCuenta(l)}
 title="Ver e Imprimir Estado de Cuenta / WhatsApp"
 className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
 >
 <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
 </button>

 {l.deuda_total > 0 && (
 <button
 type="button"
 onClick={() => abrirAbonoClienteLinea(l)}
 className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shadow-xs shadow-emerald-600/20 active:scale-95 cursor-pointer flex items-center gap-1"
 >
 <PlusCircle className="w-3 h-3" />
 <span>Abonar</span>
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
 )}

 {/* ─── TABLA 2: CUENTAS POR COBRAR (FACTURAS A CRÉDITO) ─── */}
 {tab === 'cobrar' && (
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider ">
 <th className="py-3 px-4">Cliente / Razón Social</th>
 <th className="py-3 px-4">Comprobante Asoc.</th>
 <th className="py-3 px-4">Obra / Destino</th>
 <th className="py-3 px-4">F. Vencimiento</th>
 <th className="py-3 px-4 text-right">Total Crédito</th>
 <th className="py-3 px-4 text-right">Saldo Pendiente</th>
 <th className="py-3 px-4 text-center">Estado</th>
 <th className="py-3 px-4 text-center">Acción</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
 {cargando ? (
 <tr>
 <td colSpan="8" className="py-12 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-2">
 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span>Cargando cuentas por cobrar...</span>
 </div>
 </td>
 </tr>
 ) : cuentasCobrarFiltradas.length === 0 ? (
 <tr>
 <td colSpan="8" className="py-12 text-center text-slate-400 font-semibold">
 No se encontraron cuentas por cobrar con los filtros seleccionados.
 </td>
 </tr>
 ) : (
 cuentasCobrarFiltradas.map((c) => {
 const diasVence = calcularDiasVencimiento(c.fecha_vencimiento);
 const estaVencido = diasVence !== null && diasVence < 0 && c.estado !== 'Pagado';
 return (
 <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
 <td className="py-3.5 px-4">
 <p className="font-black text-slate-900 dark:text-white">
 {c.cliente?.nombre || 'Cliente General'}
 </p>
 <p className="text-[10px] text-slate-400 font-mono">
 Doc: {c.cliente?.numero_documento || 'S/N'}
 </p>
 </td>

 <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
 {c.venta ? (
 <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
 {c.venta.tipo_comprobante} #{c.venta.numero || c.venta.id}
 </span>
 ) : (
 'Venta Crédito'
 )}
 </td>

 <td className="py-3.5 px-4 text-slate-500 max-w-[180px] truncate">
 {c.cliente?.direccion_obra || c.cliente?.contacto_obra ? (
 <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate block" title={c.cliente?.direccion_obra}>
 {c.cliente?.contacto_obra ? `${c.cliente.contacto_obra} - ` : ''}
 {c.cliente?.direccion_obra || ''}
 </span>
 ) : (
 <span className="text-[10px] text-slate-400 italic">Mostrador</span>
 )}
 </td>

 <td className="py-3.5 px-4">
 <p className="font-mono text-slate-600 dark:text-slate-400">
 {c.fecha_vencimiento}
 </p>
 {c.estado !== 'Pagado' && diasVence !== null && (
 <span
 className={`text-[9.5px] font-bold ${
 estaVencido
 ? 'text-rose-600 dark:text-rose-400'
 : diasVence <= 3
 ? 'text-amber-600 dark:text-amber-400'
 : 'text-slate-400'
 }`}
 >
 {estaVencido
 ? `Vencido hace ${Math.abs(diasVence)} d`
 : diasVence === 0
 ? 'Vence hoy'
 : `En ${diasVence} días`}
 </span>
 )}
 </td>

 <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600 dark:text-slate-300">
 S/ {parseFloat(c.monto_total).toFixed(2)}
 </td>

 <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-rose-600 dark:text-rose-400">
 S/ {parseFloat(c.saldo_pendiente).toFixed(2)}
 </td>

 <td className="py-3.5 px-4 text-center">
 {c.estado === 'Pagado' || parseFloat(c.saldo_pendiente) <= 0 ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
 <CheckCircle2 className="w-3 h-3" />
 Pagado
 </span>
 ) : estaVencido ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-800 animate-pulse">
 <AlertCircle className="w-3 h-3" />
 Vencido
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
 <Clock className="w-3 h-3" />
 Pendiente
 </span>
 )}
 </td>

 <td className="py-3.5 px-4 text-center">
 <div className="flex items-center justify-center gap-1.5">
 {parseFloat(c.saldo_pendiente) > 0 && (
 <button
 type="button"
 onClick={() => abrirAbono(c, true)}
 className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-xs shadow-indigo-600/25 active:scale-95 cursor-pointer inline-flex items-center gap-1"
 >
 <PlusCircle className="w-3.5 h-3.5" />
 <span>Amortizar</span>
 </button>
 )}
 {c.cliente && (
 <button
 type="button"
 onClick={() => handleAbrirEstadoCuenta(c.cliente)}
 title="Ver Estado de Cuenta del Cliente"
 className="p-1.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors cursor-pointer"
 >
 <FileText className="w-4 h-4" />
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
 )}

 {/* ─── TABLA 3: CUENTAS POR PAGAR (PROVEEDORES DE FERRETERÍA) ─── */}
 {tab === 'pagar' && (
 <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs">
 <thead>
 <tr className="bg-slate-50/80 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider ">
 <th className="py-3 px-4">Proveedor / Empresa</th>
 <th className="py-3 px-4">Factura Compra</th>
 <th className="py-3 px-4">F. Vencimiento</th>
 <th className="py-3 px-4 text-right">Total Facturado</th>
 <th className="py-3 px-4 text-right">Saldo por Pagar</th>
 <th className="py-3 px-4 text-center">Estado</th>
 <th className="py-3 px-4 text-center">Acción</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
 {cargando ? (
 <tr>
 <td colSpan="7" className="py-12 text-center text-slate-400">
 <div className="flex flex-col items-center justify-center gap-2">
 <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
 <span>Cargando cuentas por pagar a proveedores...</span>
 </div>
 </td>
 </tr>
 ) : cuentasPagarFiltradas.length === 0 ? (
 <tr>
 <td colSpan="7" className="py-12 text-center text-slate-400 font-semibold">
 No se registran compromisos de pago pendientes con proveedores.
 </td>
 </tr>
 ) : (
 cuentasPagarFiltradas.map((c) => (
 <tr key={c.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
 <td className="py-3.5 px-4">
 <p className="font-black text-slate-900 dark:text-white">
 {c.proveedor?.razon_social}
 </p>
 <p className="text-[10px] text-slate-400 font-mono">
 RUC: {c.proveedor?.numero_documento}
 </p>
 </td>
 <td className="py-3.5 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
 {c.compra ? `Factura Compra #${c.compra.numero || c.compra.id}` : 'Compra'}
 </td>
 <td className="py-3.5 px-4 font-mono text-slate-500">
 {c.fecha_vencimiento}
 </td>
 <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-600 dark:text-slate-300">
 S/ {parseFloat(c.monto_total).toFixed(2)}
 </td>
 <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-rose-600 dark:text-rose-400">
 S/ {parseFloat(c.saldo_pendiente).toFixed(2)}
 </td>
 <td className="py-3.5 px-4 text-center">
 {c.estado === 'Pagado' || parseFloat(c.saldo_pendiente) <= 0 ? (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
 <CheckCircle2 className="w-3 h-3" />
 Cancelado
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
 <Clock className="w-3 h-3" />
 Pendiente
 </span>
 )}
 </td>
 <td className="py-3.5 px-4 text-center">
 {parseFloat(c.saldo_pendiente) > 0 && (
 <button
 type="button"
 onClick={() => abrirAbono(c, false)}
 className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-all shadow-xs active:scale-95 cursor-pointer inline-flex items-center gap-1"
 >
 <PlusCircle className="w-3.5 h-3.5" />
 <span>Pagar</span>
 </button>
 )}
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {/* ─── MODAL REGISTRAR ABONO / AMORTIZACIÓN ─── */}
 {modalAbono && cuentaSeleccionada && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden">
 {/* Fondo oscuro desenfocado global que cubre toda la pantalla */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalAbono(false)}
 aria-hidden="true"
 />

 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
 onClick={() => setModalAbono(false)}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-2xl max-w-sm w-full p-0 overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col text-left"
 >
 {/* Cabecera */}
 <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
 <div className="flex items-center gap-2.5">
 <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/60 shadow-2xs">
 <CreditCard className="w-5 h-5" />
 </span>
 <div>
 <h3 className="text-base font-black text-slate-800 dark:text-white tracking-tight ">
 {cuentaSeleccionada.esCliente ? 'Registrar Cobranza / Abono' : 'Registrar Pago a Proveedor'}
 </h3>
 <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
 Abono directo a cuenta corriente
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalAbono(false)}
 className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <form onSubmit={handleAbonoSubmit} className="p-5 space-y-3.5">
 {/* Información de deuda */}
 <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-1">
 <p className="text-xs text-slate-600 dark:text-slate-300">
 <strong className="text-slate-900 dark:text-white">
 {cuentaSeleccionada.esCliente ? 'Cliente / Obra:' : 'Proveedor:'}
 </strong>{' '}
 {cuentaSeleccionada.esCliente
 ? cuentaSeleccionada.cliente?.nombre
 : cuentaSeleccionada.proveedor?.razon_social}
 </p>
 <div className="flex items-center justify-between pt-1">
 <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
 Saldo Pendiente:
 </span>
 <span className="text-base font-black font-mono text-rose-700 dark:text-rose-300">
 S/ {parseFloat(cuentaSeleccionada.saldo_pendiente).toFixed(2)}
 </span>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-1">
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
 Monto a Abonar (S/) *
 </label>
 <button
 type="button"
 onClick={() => setMontoAbono(parseFloat(cuentaSeleccionada.saldo_pendiente).toFixed(2))}
 className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
 >
 Pagar total
 </button>
 </div>
 <input
 type="number"
 step="0.01"
 min="0.01"
 max={cuentaSeleccionada.saldo_pendiente}
 required
 value={montoAbono}
 onChange={(e) => setMontoAbono(e.target.value)}
 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 text-center focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 autoFocus
 />
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Método de Pago
 </label>
 <select
 value={metodoPago}
 onChange={(e) => setMetodoPago(e.target.value)}
 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 >
 <option value="Efectivo">Efectivo (Ingresa a Caja Chica en Vivo)</option>
 <option value="Transferencia">Transferencia Bancaria (BCP / BBVA / Interbank)</option>
 <option value="Yape">Yape</option>
 <option value="Plin">Plin</option>
 <option value="Tarjeta">Tarjeta POS / Débito / Crédito</option>
 </select>
 </div>

 <div>
 <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
 Notas / N° de Operación (Opcional)
 </label>
 <input
 type="text"
 placeholder="Ej. Operación #1298492 o recibo de amortización"
 value={notasAbono}
 onChange={(e) => setNotasAbono(e.target.value)}
 className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
 />
 </div>

 <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
 <button
 type="button"
 onClick={() => setModalAbono(false)}
 className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 disabled={guardandoAbono}
 className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50 transition-all active:scale-95"
 >
 {guardandoAbono ? 'Registrando...' : 'Confirmar Abono'}
 </button>
 </div>
 </form>
 </div>
 </div>
 </div>,
 document.body
 )}

 {/* ─── MODAL DETALLE DE CLIENTE / OBRA Y FACTURAS PENDIENTES ─── */}
 {modalDetalleCliente && clienteActivo && typeof document !== 'undefined' && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden">
 {/* Fondo oscuro desenfocado global que cubre toda la pantalla */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalDetalleCliente(false)}
 aria-hidden="true"
 />

 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
 onClick={() => setModalDetalleCliente(false)}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200/90 dark:border-slate-800 shadow-2xl max-w-lg w-full p-0 overflow-hidden animate-in zoom-in-95 duration-150 my-auto flex flex-col text-left"
 >
 <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
 <div className="flex items-center gap-2.5">
 <span className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
 <HardHat className="w-5 h-5" />
 </span>
 <div>
 <h3 className="text-base font-black text-slate-900 dark:text-white ">
 Expediente de Crédito Mayorista
 </h3>
 <p className="text-[11px] text-slate-400">
 {clienteActivo.nombre} ({clienteActivo.tipo_documento}: {clienteActivo.numero_documento})
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalDetalleCliente(false)}
 className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-modal-scroll">
 {/* Tarjeta de Línea */}
 <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/70 text-center">
 <div>
 <span className="text-[10px] uppercase font-bold text-slate-400">Cupo Total</span>
 <p className="text-sm font-black font-mono text-slate-800 dark:text-white mt-0.5">
 S/ {parseFloat(clienteActivo.limite_credito).toFixed(2)}
 </p>
 </div>
 <div>
 <span className="text-[10px] uppercase font-bold text-rose-500">Deuda en Obra</span>
 <p className="text-sm font-black font-mono text-rose-600 dark:text-rose-400 mt-0.5">
 S/ {parseFloat(clienteActivo.deuda_total).toFixed(2)}
 </p>
 </div>
 <div>
 <span className="text-[10px] uppercase font-bold text-emerald-500">Disponible</span>
 <p className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
 S/ {parseFloat(clienteActivo.credito_disponible).toFixed(2)}
 </p>
 </div>
 </div>

 {/* Datos de Obra */}
 <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl space-y-1.5">
 <span className="text-[11px] font-black uppercase text-amber-800 dark:text-amber-300 flex items-center gap-1.5 ">
 <Building2 className="w-3.5 h-3.5" />
 Información de Obra y Plazos
 </span>
 <p className="text-xs text-slate-700 dark:text-slate-300">
 <strong>Plazo Acordado:</strong> {clienteActivo.dias_credito || 15} días calendario
 </p>
 {clienteActivo.contacto_obra && (
 <p className="text-xs text-slate-700 dark:text-slate-300">
 <strong>Residente / Contacto:</strong> {clienteActivo.contacto_obra}
 </p>
 )}
 {clienteActivo.direccion_obra && (
 <p className="text-xs text-slate-700 dark:text-slate-300">
 <strong>Ubicación de Obra:</strong> {clienteActivo.direccion_obra}
 </p>
 )}
 {clienteActivo.telefono_obra && (
 <p className="text-xs text-slate-700 dark:text-slate-300">
 <strong>Teléfono Obra:</strong> {clienteActivo.telefono_obra}
 </p>
 )}
 </div>

 {/* Facturas Pendientes de este cliente */}
 <div>
 <h4 className="text-xs font-black uppercase text-slate-500 tracking-wider mb-2 ">
 Comprobantes Pendientes de Cobro
 </h4>
 {cuentasCobrar.filter((c) => c.id_cliente === clienteActivo.id && c.estado !== 'Pagado').length === 0 ? (
 <p className="text-xs text-slate-400 text-center py-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl">
 Este cliente no tiene cuentas pendientes de pago.
 </p>
 ) : (
 <div className="space-y-2">
 {cuentasCobrar
 .filter((c) => c.id_cliente === clienteActivo.id && c.estado !== 'Pagado')
 .map((c) => (
 <div
 key={c.id}
 className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
 >
 <div>
 <p className="text-xs font-bold text-slate-800 dark:text-white">
 {c.venta ? `${c.venta.tipo_comprobante} #${c.venta.numero || c.venta.id}` : `Cuenta #${c.id}`}
 </p>
 <p className="text-[10px] text-slate-400 font-mono">
 Vence: {c.fecha_vencimiento}
 </p>
 </div>
 <div className="flex items-center gap-3">
 <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
 S/ {parseFloat(c.saldo_pendiente).toFixed(2)}
 </span>
 <button
 type="button"
 onClick={() => {
 setModalDetalleCliente(false);
 abrirAbono(c, true);
 }}
 className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-all cursor-pointer"
 >
 Abonar
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
 <button
 type="button"
 onClick={() => {
 setModalDetalleCliente(false);
 handleAbrirEstadoCuenta(clienteActivo);
 }}
 className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
 >
 <FileText className="w-4 h-4" />
 Ver Estado de Cuenta
 </button>
 <button
 type="button"
 onClick={() => setModalDetalleCliente(false)}
 className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>
 </div>
 </div>,
 document.body
 )}

 {/* ─── MODAL ÉXITO DE ABONO / RECIBO TÉRMICO ─── */}
 {modalAbonoExito && ultimoAbonoRealizado && createPortal(
 <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
 <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
 {/* Cabecera verde de éxito */}
 <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5 text-white flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner">
 <CheckCircle2 className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-base font-black tracking-tight leading-tight">
 ¡Abono Registrado!
 </h3>
 <p className="text-xs text-emerald-100 font-medium">
 Operación de cobranza asentada en caja
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => setModalAbonoExito(false)}
 className="w-8 h-8 rounded-lg bg-black/10 hover:bg-black/20 text-white flex items-center justify-center transition-colors cursor-pointer"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* Contenido / Resumen del abono */}
 <div className="p-6 space-y-4">
 <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-center space-y-1">
 <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
 Monto Recibido
 </span>
 <div className="text-3xl font-black font-mono text-emerald-700 dark:text-emerald-300 tracking-tight">
 S/ {parseFloat(ultimoAbonoRealizado.monto || 0).toFixed(2)}
 </div>
 <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
 <Wallet className="w-3 h-3" />
 Método: {ultimoAbonoRealizado.metodo_pago || 'Efectivo'}
 </div>
 </div>

 <div className="space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800">
 <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-400">
 <span>Cliente / Contratista:</span>
 <span className="font-bold text-slate-800 dark:text-white truncate max-w-[200px]">
 {ultimoAbonoRealizado.cliente?.nombre || 'Cliente'}
 </span>
 </div>
 {ultimoAbonoRealizado.cliente?.numero_documento && (
 <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-400">
 <span>Documento:</span>
 <span className="font-bold text-slate-800 dark:text-white">
 {ultimoAbonoRealizado.cliente.tipo_documento || 'DNI/RUC'}: {ultimoAbonoRealizado.cliente.numero_documento}
 </span>
 </div>
 )}
 <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-400">
 <span>Comprobante / Deuda:</span>
 <span className="font-bold text-slate-800 dark:text-white">
 {ultimoAbonoRealizado.venta ? `${ultimoAbonoRealizado.venta.tipo_comprobante} #${ultimoAbonoRealizado.venta.numero || ultimoAbonoRealizado.venta.id}` : `Cuenta #${ultimoAbonoRealizado.id_cuenta_cobrar}`}
 </span>
 </div>
 <div className="flex justify-between py-1.5 text-slate-600 dark:text-slate-400">
 <span>Nuevo Saldo Pendiente:</span>
 <span className="font-black font-mono text-slate-900 dark:text-white">
 S/ {parseFloat(ultimoAbonoRealizado.nuevo_saldo || 0).toFixed(2)}
 </span>
 </div>
 </div>

 {/* Acciones principales */}
 <div className="pt-2 space-y-2">
 <button
 type="button"
 onClick={() => imprimirReciboCobranza(ultimoAbonoRealizado, { formato: '80mm' })}
 className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
 >
 <Printer className="w-4 h-4" />
 Imprimir Recibo Térmico (80mm)
 </button>
 <div className="grid grid-cols-2 gap-2">
 <button
 type="button"
 onClick={() => imprimirReciboCobranza(ultimoAbonoRealizado, { formato: '58mm' })}
 className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
 >
 <Printer className="w-3.5 h-3.5 text-slate-500" />
 Ticket 58mm
 </button>
 <button
 type="button"
 onClick={() => setModalAbonoExito(false)}
 className="py-2 px-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 inline-flex items-center justify-center transition-colors cursor-pointer"
 >
 Listo / Cerrar
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>,
 document.body
 )}

 {/* ─── MODAL ESTADO DE CUENTA DE CLIENTE / OBRA (NEO-SAAS LUMINOSO & PROFESIONAL) ─── */}
 {modalEstadoCuenta && clienteEstadoCuenta && createPortal(
 <div className="fixed inset-0 z-[9999] overflow-hidden pointer-events-auto">
 {/* Backdrop con blur */}
 <div
 className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
 onClick={() => setModalEstadoCuenta(false)}
 aria-hidden="true"
 />

 {/* Contenedor Centrado */}
 <div
 className="fixed inset-0 z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto pointer-events-auto"
 onClick={() => setModalEstadoCuenta(false)}
 >
 <div
 onClick={(e) => e.stopPropagation()}
 className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150 my-auto text-left cursor-default"
 >
 {/* 1. Cabecera Luminosa Neo-SaaS */}
 <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs shadow-indigo-600/25 shrink-0 border border-indigo-400/20">
 <FileText className="w-5 h-5" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
 Estado de Cuenta de Obra
 </h3>
 {clienteEstadoCuenta.totalDeuda > 0 ? (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/80">
 <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
 Saldo Pendiente
 </span>
 ) : (
 <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
 <CheckCircle2 className="w-3 h-3 text-emerald-500" />
 Cuenta al Día
 </span>
 )}
 </div>
 <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
 {clienteEstadoCuenta.cliente?.nombre || 'Cliente'} • {clienteEstadoCuenta.cliente?.tipo_documento || 'RUC/DNI'}: {clienteEstadoCuenta.cliente?.numero_documento || '-'}
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setModalEstadoCuenta(false)}
 className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer border border-slate-200 dark:border-slate-700 shrink-0"
 title="Cerrar modal"
 >
 <X className="w-4 h-4" />
 </button>
 </div>

 {/* 2. Riel de Modo (Resumen vs Ticket Térmico) y Acciones Rápidas */}
 <div className="px-6 py-2.5 bg-slate-100/80 dark:bg-slate-950/50 border-b border-slate-200/70 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap shrink-0">
 <div className="flex items-center gap-1.5">
 <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
 <button
 type="button"
 onClick={() => setVistaEstadoCuentaTab('resumen')}
 className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
 vistaEstadoCuentaTab === 'resumen'
 ? 'bg-indigo-600 text-white shadow-2xs'
 : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
 }`}
 >
 Resumen y Facturas
 </button>
 <button
 type="button"
 onClick={() => setVistaEstadoCuentaTab('ticket')}
 className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
 vistaEstadoCuentaTab === 'ticket'
 ? 'bg-indigo-600 text-white shadow-2xs'
 : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
 }`}
 >
 Ticket Térmico
 </button>
 </div>

 {vistaEstadoCuentaTab === 'ticket' && (
 <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl p-0.5 border border-slate-200 dark:border-slate-700 shadow-2xs ml-1">
 {['80mm', '58mm'].map((fmt) => (
 <button
 key={fmt}
 type="button"
 onClick={() => setTamanoPapelEstadoCuenta(fmt)}
 className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
 tamanoPapelEstadoCuenta === fmt
 ? 'bg-indigo-600 text-white shadow-2xs'
 : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
 }`}
 >
 {fmt}
 </button>
 ))}
 </div>
 )}
 </div>

 <div className="flex items-center gap-1.5">
 <button
 type="button"
 onClick={handleCopiarEstadoCuenta}
 className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
 title="Copiar resumen al portapapeles"
 >
 {copiadoEstadoCuenta ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
 <span>{copiadoEstadoCuenta ? 'Copiado' : 'Copiar'}</span>
 </button>

 <button
 type="button"
 onClick={() => setMostrarInputWhatsappEstadoCuenta(!mostrarInputWhatsappEstadoCuenta)}
 className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
 title="Enviar estado de cuenta a WhatsApp"
 >
 <MessageCircle className="w-3.5 h-3.5" />
 <span>WhatsApp</span>
 </button>
 </div>
 </div>

 {/* Formulario WhatsApp Desplegable */}
 {mostrarInputWhatsappEstadoCuenta && (
 <form
 onSubmit={handleEnviarWhatsAppEstadoCuenta}
 className="px-6 py-2.5 bg-emerald-50/90 dark:bg-emerald-950/50 border-b border-emerald-200/80 dark:border-emerald-800/80 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0"
 >
 <Smartphone className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
 <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 shrink-0">Celular:</span>
 <input
 type="tel"
 value={telefonoWhatsappEstadoCuenta}
 onChange={(e) => setTelefonoWhatsappEstadoCuenta(e.target.value)}
 placeholder="Ej. 987654321"
 autoFocus
 className="flex-1 max-w-[220px] bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/20"
 />
 <button
 type="submit"
 className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
 >
 <Send className="w-3 h-3" />
 <span>Enviar</span>
 </button>
 <button
 type="button"
 onClick={() => setMostrarInputWhatsappEstadoCuenta(false)}
 className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold px-1.5 py-1 cursor-pointer"
 >
 Cancelar
 </button>
 </form>
 )}

 {/* 3. Contenido Scrolleable */}
 <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-modal-scroll">
 {vistaEstadoCuentaTab === 'resumen' ? (
 <>
 {/* 3 Tarjetas de Resumen Financiero */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
 <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
 <div className="flex items-center justify-between text-slate-400">
 <span className="text-[10px] font-black uppercase tracking-wider ">
 Línea Autorizada
 </span>
 <CreditCard className="w-4 h-4 text-indigo-500" />
 </div>
 <p className="text-xl font-black font-mono text-slate-800 dark:text-white mt-1.5">
 S/ {clienteEstadoCuenta.limiteCredito.toFixed(2)}
 </p>
 <span className="text-[10px] text-slate-500 mt-0.5">Límite comercial acordado</span>
 </div>

 <div className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 flex flex-col justify-between">
 <div className="flex items-center justify-between text-rose-500">
 <span className="text-[10px] font-black uppercase tracking-wider ">
 Deuda Pendiente
 </span>
 <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
 </div>
 <p className="text-xl font-black font-mono text-rose-600 dark:text-rose-400 mt-1.5">
 S/ {clienteEstadoCuenta.totalDeuda.toFixed(2)}
 </p>
 <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">Saldo total por regularizar</span>
 </div>

 <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex flex-col justify-between">
 <div className="flex items-center justify-between text-emerald-600">
 <span className="text-[10px] font-black uppercase tracking-wider ">
 Crédito Disponible
 </span>
 <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
 </div>
 <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1.5">
 S/ {clienteEstadoCuenta.creditoDisponible.toFixed(2)}
 </p>
 <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">Margen libre para despachos</span>
 </div>
 </div>

 {/* Dossier de Contratista y Obra */}
 <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 text-xs grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600 dark:text-slate-300">
 <div className="flex items-start gap-2">
 <Building2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
 <div>
 <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Razón Social / Titular:</span>
 <span className="font-bold text-slate-800 dark:text-white">
 {clienteEstadoCuenta.cliente?.nombre || 'Cliente'}
 </span>
 </div>
 </div>

 <div className="flex items-start gap-2">
 <Phone className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
 <div>
 <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Teléfono de Cobranza:</span>
 <span className="font-bold text-slate-800 dark:text-white font-mono">
 {clienteEstadoCuenta.cliente?.telefono || clienteEstadoCuenta.cliente?.celular || 'No registrado'}
 </span>
 </div>
 </div>

 {clienteEstadoCuenta.cliente?.contacto_obra && (
 <div className="flex items-start gap-2">
 <HardHat className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
 <div>
 <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Contacto en Obra:</span>
 <span className="font-bold text-slate-800 dark:text-white">
 {clienteEstadoCuenta.cliente.contacto_obra}
 </span>
 </div>
 </div>
 )}

 {clienteEstadoCuenta.cliente?.direccion_obra && (
 <div className="flex items-start gap-2">
 <MapPin className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
 <div>
 <span className="text-[10.5px] font-bold text-slate-400 block uppercase">Destino de Entrega / Obra:</span>
 <span className="font-bold text-slate-800 dark:text-white">
 {clienteEstadoCuenta.cliente.direccion_obra}
 </span>
 </div>
 </div>
 )}
 </div>

 {/* Lista de Comprobantes Pendientes */}
 <div>
 <div className="flex items-center justify-between mb-2 px-0.5">
 <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 ">
 Comprobantes Pendientes de Cancelación ({clienteEstadoCuenta.cuentasPendientes?.length || 0})
 </h4>
 <span className="text-[10.5px] text-slate-400">
 Total: S/ {clienteEstadoCuenta.totalDeuda.toFixed(2)}
 </span>
 </div>

 {(!clienteEstadoCuenta.cuentasPendientes || clienteEstadoCuenta.cuentasPendientes.length === 0) ? (
 <div className="p-8 text-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300">
 <CheckCircle2 className="w-10 h-10 mx-auto mb-1.5 opacity-80" />
 <p className="text-sm font-black ">¡Línea al día! Sin saldos vencidos</p>
 <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
 Este cliente no registra facturas ni documentos de crédito pendientes.
 </p>
 </div>
 ) : (
 <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
 <table className="w-full text-left text-xs">
 <thead className="bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] ">
 <tr>
 <th className="p-3">Comprobante</th>
 <th className="p-3">Vencimiento</th>
 <th className="p-3 text-right">Monto Total</th>
 <th className="p-3 text-right">Saldo Pendiente</th>
 <th className="p-3 text-center w-[85px]">Acción</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
 {clienteEstadoCuenta.cuentasPendientes.map((cc) => {
 const dias = calcularDiasVencimiento(cc.fecha_vencimiento);
 const esVencido = dias !== null && dias < 0;
 return (
 <tr key={cc.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
 <td className="p-3">
 <span className="font-bold text-slate-800 dark:text-white">
 {cc.venta ? `${cc.venta.tipo_comprobante} #${cc.venta.numero || cc.venta.id}` : `Cuenta #${cc.id}`}
 </span>
 <div className="text-[10px] text-slate-400">
 Emisión: {cc.fecha_emision || cc.createdAt?.substring(0, 10) || '-'}
 </div>
 </td>
 <td className="p-3 font-mono text-[11px]">
 <div className="text-slate-700 dark:text-slate-200 font-semibold">{cc.fecha_vencimiento || '-'}</div>
 {esVencido ? (
 <span className="inline-block text-[9px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.2 rounded mt-0.5">
 Vencido hace {Math.abs(dias)}d
 </span>
 ) : dias !== null ? (
 <span className="inline-block text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded mt-0.5">
 Vence en {dias}d
 </span>
 ) : null}
 </td>
 <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
 S/ {parseFloat(cc.monto_total || 0).toFixed(2)}
 </td>
 <td className="p-3 text-right font-black font-mono text-rose-600 dark:text-rose-400">
 S/ {parseFloat(cc.saldo_pendiente || 0).toFixed(2)}
 </td>
 <td className="p-3 text-center">
 <button
 type="button"
 onClick={() => {
 setModalEstadoCuenta(false);
 abrirAbono(cc, true);
 }}
 className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center gap-1"
 >
 <PlusCircle className="w-3.5 h-3.5" />
 <span>Abonar</span>
 </button>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </>
 ) : (
 /* ─── VISTA PREVIA DEL TICKET TÉRMICO FÍSICO ─── */
 <div className="flex justify-center items-start py-2">
 <div
 className={`w-full h-fit shrink-0 bg-white text-slate-900 shadow-xl border border-slate-200/90 leading-tight font-mono select-none transition-all rounded-xl ${
 tamanoPapelEstadoCuenta === '58mm'
 ? 'max-w-[260px] p-3 text-[9.5px]'
 : 'max-w-[340px] p-4 text-[11px]'
 }`}
 >
 <div className="text-center pb-2 border-b border-dashed border-slate-400">
 {settings?.businessLogoUrl ? (
 <div className="flex justify-center mb-1.5">
 <img
 src={settings.businessLogoUrl}
 alt={settings?.businessName || 'Ferretería'}
 className={`object-contain ${tamanoPapelEstadoCuenta === '58mm' ? 'max-h-8 max-w-[120px]' : 'max-h-11 max-w-[150px]'}`}
 />
 </div>
 ) : (
 <div className="flex items-center justify-center gap-1 mb-1 text-indigo-700">
 <Building2 className="w-4 h-4 stroke-[2.5]" />
 </div>
 )}
 <h4 className="font-black tracking-tight text-slate-900 uppercase text-xs">
 {settings?.businessName || 'FERRETERÍA & MATERIALES HEIS'}
 </h4>
 <p className="font-bold text-slate-800">R.U.C. N° {settings?.businessRuc || '20609123456'}</p>
 <p className="text-slate-600 mt-0.5 leading-snug">{settings?.address || 'Av. Industrial 840, Ate Vitarte, Lima - Perú'}</p>
 <p className="text-slate-600">Telf: {settings?.phone || '(01) 489-3210'}</p>
 </div>

 <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
 <div className="text-center font-black uppercase tracking-wider text-slate-900 text-xs">
 *** ESTADO DE CUENTA / CRÉDITO ***
 </div>
 <div className="text-center text-[9px] text-slate-500">
 EMISIÓN: {new Date().toLocaleString('es-PE')}
 </div>
 <div className="flex justify-between pt-1">
 <span className="text-slate-500">CLIENTE:</span>
 <span className="font-bold truncate max-w-[170px] text-right">{clienteEstadoCuenta.cliente?.nombre || 'Cliente'}</span>
 </div>
 <div className="flex justify-between">
 <span className="text-slate-500">DOCUMENTO:</span>
 <span className="font-bold">{clienteEstadoCuenta.cliente?.tipo_documento || 'RUC/DNI'}: {clienteEstadoCuenta.cliente?.numero_documento || '-'}</span>
 </div>
 {clienteEstadoCuenta.cliente?.direccion_obra && (
 <div className="flex justify-between">
 <span className="text-slate-500">OBRA:</span>
 <span className="font-bold truncate max-w-[170px] text-right">{clienteEstadoCuenta.cliente.direccion_obra}</span>
 </div>
 )}
 <div className="flex justify-between">
 <span className="text-slate-500">PLAZO:</span>
 <span className="font-bold">{clienteEstadoCuenta.cliente?.dias_credito || 15} días</span>
 </div>
 </div>

 <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
 <div className="flex justify-between">
 <span>LÍNEA AUTORIZADA:</span>
 <span className="font-bold">S/ {clienteEstadoCuenta.limiteCredito.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-rose-700 font-bold">
 <span>DEUDA ACUMULADA:</span>
 <span>S/ {clienteEstadoCuenta.totalDeuda.toFixed(2)}</span>
 </div>
 <div className="flex justify-between text-emerald-700 font-bold">
 <span>CRÉDITO DISPONIBLE:</span>
 <span>S/ {clienteEstadoCuenta.creditoDisponible.toFixed(2)}</span>
 </div>
 </div>

 {/* Detalle Documentos en el ticket */}
 <div className="py-2 border-b border-dashed border-slate-400 space-y-1 text-[9.5px]">
 <div className="font-bold uppercase text-slate-600">
 COMPROBANTES PENDIENTES ({clienteEstadoCuenta.cuentasPendientes?.length || 0}):
 </div>
 {clienteEstadoCuenta.cuentasPendientes?.map((item) => (
 <div key={item.id} className="flex justify-between items-baseline gap-1 py-0.5">
 <div className="truncate max-w-[150px]">
 <span className="font-bold">{item.venta?.numero || ('#' + item.id)}</span>
 <div className="text-[8.5px] text-slate-500">Vence: {item.fecha_vencimiento || '-'}</div>
 </div>
 <div className="text-right shrink-0">
 <span className="font-bold text-rose-700">S/ {parseFloat(item.saldo_pendiente || 0).toFixed(2)}</span>
 </div>
 </div>
 ))}
 </div>

 <div className="pt-2 text-center text-[9px] text-slate-500 space-y-2">
 <p>Agradecemos coordinar la cancelación de sus saldos pendientes.</p>
 <p className="font-bold text-slate-700">*** CONTROL DE CRÉDITOS & COBRANZAS ***</p>
 </div>
 </div>
 </div>
 )}
 </div>

 {/* 4. Footer con Acciones */}
 <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
 <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
 {clienteEstadoCuenta.cuentasPendientes?.length || 0} comprobante(s) pendiente(s) por liquidar
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setModalEstadoCuenta(false)}
 className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
 >
 Cerrar
 </button>
 <button
 type="button"
 onClick={() => handleImprimirEstadoCuenta(tamanoPapelEstadoCuenta)}
 className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-indigo-600/25 active:scale-95 transition-all cursor-pointer"
 >
 <Printer className="w-4 h-4" />
 <span>Imprimir Ticket ({tamanoPapelEstadoCuenta})</span>
 </button>
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
