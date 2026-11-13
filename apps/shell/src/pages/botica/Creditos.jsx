import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import api from './api';
import DropdownPill from './components/DropdownPill';
import {
  CreditCard,
  User,
  Building,
  PlusCircle,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Receipt,
  RotateCcw,
  History,
  X,
  AlertTriangle,
  FileSpreadsheet,
  Banknote,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Printer
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@heis/core';

export default function Creditos({ initialTab = 'cobrar' }) {
  const { user } = useAuthStore();
  const esCajero = user?.rol === 'Cajero';
  const tabEfectivo = esCajero ? 'cobrar' : (initialTab || 'cobrar');
  const [tab, setTab] = useState(tabEfectivo);

  useEffect(() => {
    if (esCajero) {
      setTab('cobrar');
    } else if (initialTab) {
      setTab(initialTab);
    }
  }, [initialTab, esCajero]);

  const [cuentasCobrar, setCuentasCobrar] = useState([]);
  const [cuentasPagar, setCuentasPagar] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros y Búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos'); // 'Todos' | 'Pendiente' | 'Pagado' | 'Vencido'

  // Modal Registrar Abono
  const [modalAbono, setModalAbono] = useState(false);
  const [cuentaActiva, setCuentaActiva] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [notasAbono, setNotasAbono] = useState('');
  const [guardandoAbono, setGuardandoAbono] = useState(false);

  // Modal Ver Historial de Abonos
  const [modalHistorialAbonos, setModalHistorialAbonos] = useState(false);
  const [cuentaHistorial, setCuentaHistorial] = useState(null);

  // Opciones estilizadas de Métodos de Pago para DropdownPill
  const opcionesMetodoPago = useMemo(() => {
    const base = [
      {
        value: 'Efectivo',
        label: 'Efectivo en Caja',
        subtitle: tab === 'cobrar' ? 'Ingreso a Caja Chica de Turno Activo' : 'Egreso en efectivo de Caja Chica',
        icon: Banknote,
        badge: 'Caja'
      },
      {
        value: 'Transferencia',
        label: 'Transferencia Bancaria',
        subtitle: 'Depósito / Pago móvil (BCP, BBVA, Interbank)',
        icon: Building,
        badge: 'Bancos'
      },
      {
        value: 'Yape',
        label: 'Yape',
        subtitle: 'Billetera digital BCP',
        icon: Smartphone,
        badge: 'Digital'
      },
      {
        value: 'Plin',
        label: 'Plin',
        subtitle: 'Billetera digital BBVA / Interbank / Scotiabank',
        icon: Smartphone,
        badge: 'Digital'
      },
      {
        value: 'Tarjeta',
        label: 'Tarjeta Débito / Crédito',
        subtitle: 'Terminal POS (Izipay / Niubiz)',
        icon: CreditCard,
        badge: 'POS'
      }
    ];

    if (tab === 'pagar') {
      base.push({
        value: 'Cheque',
        label: 'Cheque Comercial',
        subtitle: 'Cheque diferido o al día a la orden del proveedor',
        icon: Receipt,
        badge: 'Comercial'
      });
    }

    return base;
  }, [tab]);

  const iconoMetodoActual = useMemo(() => {
    switch (metodoPago) {
      case 'Transferencia':
        return Building;
      case 'Yape':
      case 'Plin':
        return Smartphone;
      case 'Tarjeta':
        return CreditCard;
      case 'Cheque':
        return Receipt;
      default:
        return Banknote;
    }
  }, [metodoPago]);

  const cargarCuentas = async () => {
    try {
      setLoading(true);
      if (esCajero) {
        const resCobrar = await api.get('/creditos/cobrar');
        const dataCobrar = resCobrar?.cuentas || resCobrar?.data?.cuentas || [];
        setCuentasCobrar(dataCobrar);
        setCuentasPagar([]);
      } else {
        const [resCobrar, resPagar] = await Promise.allSettled([
          api.get('/creditos/cobrar'),
          api.get('/creditos/pagar')
        ]);
        if (resCobrar.status === 'fulfilled') {
          const dataCobrar = resCobrar.value?.cuentas || resCobrar.value?.data?.cuentas || [];
          setCuentasCobrar(dataCobrar);
        }
        if (resPagar.status === 'fulfilled') {
          const dataPagar = resPagar.value?.cuentas || resPagar.value?.data?.cuentas || [];
          setCuentasPagar(dataPagar);
        }
      }
    } catch (err) {
      console.error('Error al cargar créditos:', err);
      toast.error('Error al sincronizar créditos y cuentas corrientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCuentas();
  }, []);

  const listaBase = tab === 'cobrar' ? cuentasCobrar : cuentasPagar;

  // Filtrado reactivo por texto y estado
  const listaFiltrada = useMemo(() => {
    let filtradas = [...listaBase];
    const q = busqueda.trim().toLowerCase();

    if (q) {
      filtradas = filtradas.filter((c) => {
        const nombre = tab === 'cobrar'
          ? (c.cliente?.nombre || '').toLowerCase()
          : (c.proveedor?.razon_social || '').toLowerCase();
        const doc = tab === 'cobrar'
          ? (c.cliente?.numero_documento || '')
          : (c.proveedor?.numero_documento || '');
        const nroComp = tab === 'cobrar'
          ? (c.venta?.numero || String(c.id_venta || ''))
          : (c.compra?.numero || String(c.id_compra || ''));

        return nombre.includes(q) || doc.includes(q) || nroComp.toLowerCase().includes(q);
      });
    }

    if (filtroEstado !== 'Todos') {
      filtradas = filtradas.filter((c) => {
        const saldo = parseFloat(c.saldo_pendiente || 0);
        if (filtroEstado === 'Pagado') return c.estado === 'Pagado' || saldo <= 0;
        if (filtroEstado === 'Pendiente') return (c.estado === 'Pendiente' || !c.estado) && saldo > 0;
        if (filtroEstado === 'Vencido') return c.estado === 'Vencido';
        return true;
      });
    }

    return filtradas;
  }, [listaBase, tab, busqueda, filtroEstado]);

  // Métricas y KPIs de la pestaña activa
  const metricas = useMemo(() => {
    const totalDocs = listaBase.length;
    const totalCredito = listaBase.reduce((acc, c) => acc + (parseFloat(c.monto_total) || 0), 0);
    const saldoPendiente = listaBase.reduce((acc, c) => acc + (parseFloat(c.saldo_pendiente) || 0), 0);
    const totalCobradoPagado = Math.max(0, totalCredito - saldoPendiente);

    const pendientes = listaBase.filter((c) => parseFloat(c.saldo_pendiente || 0) > 0 && c.estado !== 'Vencido').length;
    const vencidos = listaBase.filter((c) => c.estado === 'Vencido').length;
    const pagados = listaBase.filter((c) => c.estado === 'Pagado' || parseFloat(c.saldo_pendiente || 0) <= 0).length;

    return {
      totalDocs,
      totalCredito,
      saldoPendiente,
      totalCobradoPagado,
      pendientes,
      vencidos,
      pagados
    };
  }, [listaBase]);

  const abrirModalAbono = (cuenta) => {
    setCuentaActiva(cuenta);
    setMontoAbono(parseFloat(cuenta.saldo_pendiente || 0).toFixed(2));
    setMetodoPago(tab === 'cobrar' ? 'Efectivo' : 'Transferencia');
    setNotasAbono('');
    setModalAbono(true);
  };

  const abrirHistorialAbonos = (cuenta) => {
    setCuentaHistorial(cuenta);
    setModalHistorialAbonos(true);
  };

  const formatearFechaHora = (fechaStr) => {
    if (!fechaStr) return '-';
    try {
      const d = new Date(fechaStr);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return String(fechaStr);
    }
  };

  const imprimirComprobanteAbono = (ab, cuenta) => {
    if (!ab || !cuenta) return;
    const ventana = window.open('', '_blank', 'width=420,height=600');
    if (!ventana) {
      toast.error('Permite las ventanas emergentes para imprimir el comprobante térmico');
      return;
    }

    const esCobranza = tab === 'cobrar';
    const tituloDoc = esCobranza ? 'RECIBO DE COBRANZA / ABONO' : 'COMPROBANTE DE PAGO A PROVEEDOR';
    const personaLabel = esCobranza ? 'Cliente / Paciente' : 'Proveedor / Droguería';
    const personaNombre = esCobranza
      ? (cuenta.cliente?.nombre || 'CLIENTE VARIOS')
      : (cuenta.proveedor?.razon_social || cuenta.proveedor?.nombre || 'PROVEEDOR');
    const docPersona = esCobranza
      ? (cuenta.cliente?.numero_documento ? `Doc: ${cuenta.cliente.numero_documento}` : '')
      : (cuenta.proveedor?.numero_documento ? `RUC: ${cuenta.proveedor.numero_documento}` : '');

    const comprobanteRef = esCobranza
      ? (cuenta.venta?.numero ? `Venta: ${cuenta.venta.numero}` : `Venta #${cuenta.id_venta || cuenta.id}`)
      : (cuenta.compra?.numero ? `Compra: ${cuenta.compra.numero}` : `Compra #${cuenta.id_compra || cuenta.id}`);

    const montoAbono = parseFloat(ab.monto || 0).toFixed(2);
    const saldoPendiente = parseFloat(cuenta.saldo_pendiente || 0).toFixed(2);
    const fechaAbono = formatearFechaHora(ab.fecha || ab.created_at);
    const cajero = ab.usuario?.nombre || 'Cajero Responsable';

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${tituloDoc} - #${ab.id || ''}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace;
            width: 72mm;
            margin: 0 auto;
            padding: 12px;
            color: #000;
            font-size: 11px;
            text-align: center;
          }
          .header { border-bottom: 2px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .botica { font-size: 14px; font-weight: 900; margin: 0; text-transform: uppercase; }
          .tipo-doc { font-size: 11px; font-weight: 800; margin: 3px 0 0; color: #00855E; }
          .sub { font-size: 9px; color: #444; margin-top: 2px; }
          .sec { text-align: left; margin: 8px 0; font-size: 11px; line-height: 1.4; border-bottom: 1px dashed #ccc; padding-bottom: 6px; }
          .row { display: flex; justify-content: space-between; margin: 2px 0; }
          .label { color: #555; }
          .val { font-weight: 700; text-align: right; }
          .box-monto { border: 2px solid #000; border-radius: 6px; padding: 8px; margin: 10px 0; background: #fff; }
          .monto-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
          .monto-val { font-size: 22px; font-weight: 900; margin: 2px 0; font-family: monospace; color: #00855E; }
          .firmas { margin-top: 35px; display: flex; justify-content: space-between; font-size: 9px; }
          .firma-col { width: 46%; border-top: 1px dashed #000; padding-top: 4px; text-align: center; }
          .footer { font-size: 8.5px; margin-top: 15px; color: #666; border-top: 1px dashed #000; padding-top: 6px; }
          @media print { body { width: 100%; margin: 0; padding: 4px; } @page { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="botica">BOTICA FARMASALUD</div>
          <div class="sub">RUC: 20601234567 | Jr. Comercio 123</div>
          <div class="tipo-doc">${tituloDoc}</div>
          <div class="sub">Recibo N°: AB-${String(ab.id || '1').padStart(6, '0')}</div>
        </div>

        <div class="sec">
          <div class="row"><span class="label">Fecha / Hora:</span><span class="val">${fechaAbono}</span></div>
          <div class="row"><span class="label">Operación Ref:</span><span class="val">${comprobanteRef}</span></div>
          <div class="row"><span class="label">${personaLabel}:</span><span class="val">${personaNombre}</span></div>
          ${docPersona ? `<div class="row"><span class="label">Documento:</span><span class="val">${docPersona}</span></div>` : ''}
          <div class="row"><span class="label">Método Pago:</span><span class="val">${ab.metodo_pago || 'Efectivo'}</span></div>
          ${ab.notas ? `<div class="row"><span class="label">Notas:</span><span class="val">${ab.notas}</span></div>` : ''}
          <div class="row"><span class="label">Atendido por:</span><span class="val">${cajero}</span></div>
        </div>

        <div class="box-monto">
          <div class="monto-title">MONTO AMORTIZADO</div>
          <div class="monto-val">S/ ${montoAbono}</div>
          <div style="font-size: 9.5px; color: #555;">Saldo pendiente: S/ ${saldoPendiente}</div>
        </div>

        <div class="firmas">
          <div class="firma-col">
            Entregué Conforme<br>
            <b>${personaNombre.substring(0, 18)}</b>
          </div>
          <div class="firma-col">
            Recibí Conforme<br>
            <b>Cajero / Botica</b>
          </div>
        </div>

        <div class="footer">
          Conserve este comprobante como constancia de amortización.<br>
          Sistema Botica v2.5
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    ventana.document.open();
    ventana.document.write(html);
    ventana.document.close();
  };

  const handleRegistrarAbono = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoAbono);
    if (isNaN(monto) || monto <= 0) {
      toast.error('Ingrese un monto de abono válido mayor a 0');
      return;
    }

    const saldoMax = parseFloat(cuentaActiva.saldo_pendiente || 0);
    if (monto > saldoMax + 0.009) {
      toast.error(`El monto no puede exceder el saldo pendiente de S/ ${saldoMax.toFixed(2)}`);
      return;
    }

    try {
      setGuardandoAbono(true);
      if (tab === 'cobrar') {
        const res = await api.post('/creditos/cobrar/abono', {
          id_cuenta_cobrar: cuentaActiva.id,
          monto,
          metodo_pago: metodoPago,
          notas: notasAbono
        });
        if (res?.success || res?.data?.success) {
          toast.success(`Abono de S/ ${monto.toFixed(2)} registrado exitosamente en caja`);
          setModalAbono(false);
          setCuentaActiva(null);
          await cargarCuentas();
        }
      } else {
        const res = await api.post('/creditos/pagar/abono', {
          id_cuenta_pagar: cuentaActiva.id,
          monto,
          metodo_pago: metodoPago,
          notas: notasAbono
        });
        if (res?.success || res?.data?.success) {
          toast.success(`Abono a proveedor de S/ ${monto.toFixed(2)} registrado exitosamente`);
          setModalAbono(false);
          setCuentaActiva(null);
          await cargarCuentas();
        }
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Error al procesar el abono');
    } finally {
      setGuardandoAbono(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1700px] w-full mx-auto font-sora">
      {/* ─── 1. ENCABEZADO PRINCIPAL (PÍLDORA SISTEMA BOTICA) ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
            <CreditCard className="w-5 h-5 text-[#00B884] dark:text-[#5EEBB8]" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 tracking-tight">
                {tab === 'cobrar' ? 'Cobranzas & Abonos a Clientes' : 'Cuentas Corrientes con Proveedores'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[9.5px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] dark:border-emerald-800/60 shrink-0">
                <ShieldCheck className="w-3 h-3 text-[#00B884] dark:text-[#5EEBB8]" />
                {tab === 'cobrar' ? 'Pacientes & Crédito Clínico' : 'Droguerías & Laboratorios'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium truncate max-w-xl">
              {tab === 'cobrar'
                ? 'Control de líneas de crédito a pacientes, amortizaciones en caja chica y saldos pendientes.'
                : 'Control de compras a plazo con droguerías, compromisos comerciales y comprobantes de abono.'}
            </p>
          </div>
        </div>

        {/* Identificador de subcategoría activa en píldora contextual (sin redundancias de pestañas) */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="px-3 py-1.5 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/40 border border-[#A6F6D8] dark:border-emerald-800/50 text-xs font-bold text-[#00855E] dark:text-[#5EEBB8] flex items-center gap-2 font-sora shadow-2xs">
            {tab === 'cobrar' ? (
              <>
                <User className="w-3.5 h-3.5 text-[#00B884] dark:text-[#5EEBB8]" />
                <span>Cobranzas a Clientes</span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#00855E] text-white">
                  {cuentasCobrar.length}
                </span>
              </>
            ) : (
              <>
                <Building className="w-3.5 h-3.5 text-[#00B884] dark:text-[#5EEBB8]" />
                <span>Cuentas por Pagar a Droguerías</span>
                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-[#00855E] text-white">
                  {cuentasPagar.length}
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={cargarCuentas}
            disabled={loading}
            className="p-2 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 border border-slate-200/80 hover:border-slate-300 dark:border-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
            title="Sincronizar cuentas"
          >
            <RotateCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ─── 2. TARJETAS KPIS DEL BALANCE FINANCIERO ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#D1F4E3] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              {tab === 'cobrar' ? 'Total Otorgado a Crédito' : 'Total Facturado Droguerías'}
            </span>
            <DollarSign className="w-4 h-4 text-[#00B884]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
              S/ {metricas.totalCredito.toFixed(2)}
            </span>
            <span className="text-[10.5px] font-bold text-slate-400">
              {metricas.totalDocs} doc{metricas.totalDocs === 1 ? '' : 's'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Créditos comerciales registrados</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/50 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Saldo Pendiente de Cobro/Pago
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">
              S/ {metricas.saldoPendiente.toFixed(2)}
            </span>
            {metricas.vencidos > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                {metricas.vencidos} Vencido{metricas.vencidos === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Deuda activa a la fecha</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#D1F4E3] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#00855E] dark:text-[#5EEBB8]">
              {tab === 'cobrar' ? 'Total Cobrado / Abonos' : 'Total Amortizado'}
            </span>
            <CheckCircle className="w-4 h-4 text-[#00B884]" />
          </div>
          <div className="mt-2">
            <span className="text-xl sm:text-2xl font-black text-[#00855E] dark:text-[#5EEBB8] font-mono">
              S/ {metricas.totalCobradoPagado.toFixed(2)}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Ingresado / Abonado al sistema</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#D1F4E3] dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
              Estado de Cuentas
            </span>
            <History className="w-4 h-4 text-[#00B884]" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              {metricas.pagados} Pagadas
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200">
              {metricas.pendientes} Pendientes
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1">Monitoreo de cobranza</span>
        </div>
      </div>

      {/* ─── 3. BARRA DE BÚSQUEDA Y FILTROS POR ESTADO EN PÍLDORA ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-2.5 soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder={tab === 'cobrar' ? 'Buscar por Nombre de paciente, DNI o N° Comprobante...' : 'Buscar por Razón Social de Droguería, RUC o N° Factura...'}
            className="w-full bg-[#F8FCFA] dark:bg-slate-800/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 border border-slate-200/80 dark:border-slate-700 outline-none focus:ring-2 focus:ring-[#00B884]/20 focus:border-[#00B884] transition-all font-medium"
          />
          {busqueda && (
            <button
              type="button"
              onClick={() => setBusqueda('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 rounded-full flex items-center justify-center bg-slate-200/60"
            >
              ✕
            </button>
          )}
        </div>

        {/* Chips de filtro por estado */}
        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto no-scrollbar">
          {['Todos', 'Pendiente', 'Pagado', 'Vencido'].map((est) => (
            <button
              key={est}
              type="button"
              onClick={() => setFiltroEstado(est)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroEstado === est
                  ? 'bg-[#00855E] text-white shadow-xs'
                  : 'bg-[#F8FCFA] hover:bg-[#EBFDF6] text-slate-600 dark:text-slate-300 border border-slate-200/70 hover:border-[#A6F6D8]'
              }`}
            >
              {est}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. TABLA DE CRÉDITOS Y CUENTAS CORRIENTES ─── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8FCFA] dark:bg-slate-800/70 border-b border-slate-100 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[10.5px] font-black">
              <tr>
                <th className="py-3 px-4">
                  {tab === 'cobrar' ? 'Paciente / Cliente' : 'Laboratorio / Droguería'}
                </th>
                <th className="py-3 px-4">Comprobante Asoc.</th>
                <th className="py-3 px-4">F. Vencimiento</th>
                <th className="py-3 px-4 text-right">Total Crédito</th>
                <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                <th className="py-3 px-4 text-center">Abonos</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <span>Cargando cuentas corrientes y créditos...</span>
                    </div>
                  </td>
                </tr>
              ) : listaFiltrada.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No se encontraron registros con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                listaFiltrada.map((c) => {
                  const saldo = parseFloat(c.saldo_pendiente || 0);
                  const total = parseFloat(c.monto_total || 0);
                  const abonos = c.abonos || [];
                  const tieneSaldo = saldo > 0.009;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-800 dark:text-slate-100">
                          {tab === 'cobrar'
                            ? c.cliente?.nombre || 'Cliente General'
                            : c.proveedor?.razon_social || 'Proveedor'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {tab === 'cobrar'
                            ? `Doc: ${c.cliente?.numero_documento || '—'}`
                            : `RUC: ${c.proveedor?.numero_documento || '—'}`}
                          {c.notas && <span className="ml-2 text-slate-500 italic">“{c.notas}”</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 dark:text-slate-300">
                        {tab === 'cobrar' ? (
                          c.venta ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold">
                              {c.venta.tipo_comprobante} {c.venta.numero || `#${c.venta.id}`}
                            </span>
                          ) : (
                            `Venta #${c.id_venta}`
                          )
                        ) : (
                          c.compra ? (
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold">
                              Factura {c.compra.numero || `#${c.compra.id}`}
                            </span>
                          ) : (
                            `Compra #${c.id_compra}`
                          )
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{c.fecha_vencimiento}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-200">
                        S/ {total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-black">
                        {tieneSaldo ? (
                          <span className="text-rose-600 dark:text-rose-400">
                            S/ {saldo.toFixed(2)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400">
                            S/ 0.00
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {abonos.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => abrirHistorialAbonos(c)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] dark:text-[#5EEBB8] border border-[#A6F6D8] hover:bg-[#A6F6D8]/30 transition-all cursor-pointer"
                            title="Ver detalle de abonos"
                          >
                            <History className="w-3 h-3 text-[#00B884]" />
                            <span>{abonos.length} abono{abonos.length === 1 ? '' : 's'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Sin abonos</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {!tieneSaldo || c.estado === 'Pagado' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                            <CheckCircle className="w-3 h-3 text-emerald-600" />
                            Pagado
                          </span>
                        ) : c.estado === 'Vencido' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 rounded-full border border-rose-200/60">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Vencido
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200/60">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {tieneSaldo && (
                            <button
                              type="button"
                              onClick={() => abrirModalAbono(c)}
                              className="px-3 py-1.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer flex items-center gap-1"
                              title={tab === 'cobrar' ? 'Cobrar abono a cliente' : 'Registrar pago a proveedor'}
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              <span>Abonar</span>
                            </button>
                          )}
                          {abonos.length > 0 && (
                            <button
                              type="button"
                              onClick={() => abrirHistorialAbonos(c)}
                              className="p-1.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 border border-slate-200 dark:border-slate-700 shadow-2xs cursor-pointer"
                              title="Historial de comprobantes"
                            >
                              <Receipt className="w-3.5 h-3.5 text-[#00B884]" />
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

      {/* ─── 5. MODAL REGISTRAR ABONO / AMORTIZACIÓN ─── */}
      {modalAbono && cuentaActiva && typeof document !== 'undefined' && createPortal(
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalAbono(false);
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)'
          }}
        >
          <form
            onSubmit={handleRegistrarAbono}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-900 rounded-3xl soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 max-w-md w-full p-6 space-y-4 shadow-2xl font-sora animate-in zoom-in-95 duration-150 cursor-default my-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] border border-[#A6F6D8]">
                  <PlusCircle className="w-5 h-5 text-[#00B884]" />
                </span>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                    {tab === 'cobrar' ? 'Registrar Cobranza / Abono' : 'Registrar Pago a Proveedor'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {tab === 'cobrar'
                      ? 'Amortización de saldo de paciente en caja'
                      : 'Amortización de deuda con droguería'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalAbono(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 bg-[#F8FCFA] dark:bg-slate-800/60 rounded-2xl text-xs space-y-1.5 border border-[#D1F4E3]/60 dark:border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">{tab === 'cobrar' ? 'Paciente:' : 'Droguería:'}</span>
                <span className="font-black text-slate-800 dark:text-slate-100">
                  {tab === 'cobrar' ? cuentaActiva.cliente?.nombre : cuentaActiva.proveedor?.razon_social}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Comprobante:</span>
                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {tab === 'cobrar'
                    ? (cuentaActiva.venta?.numero || `#${cuentaActiva.id_venta}`)
                    : (cuentaActiva.compra?.numero || `#${cuentaActiva.id_compra}`)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <span className="font-bold text-slate-600">Saldo Pendiente:</span>
                <span className="text-rose-600 dark:text-rose-400 font-black font-mono text-sm">
                  S/ {parseFloat(cuentaActiva.saldo_pendiente || 0).toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Monto a Abonar (S/)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                  S/
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={cuentaActiva.saldo_pendiente}
                  required
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="w-full bg-[#F8FCFA] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-base font-black font-mono text-[#00855E] dark:text-[#5EEBB8] focus:outline-none focus:border-[#00B884] focus:ring-2 focus:ring-[#00B884]/20 transition-all"
                />
              </div>
              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                {[
                  { label: 'Total', val: parseFloat(cuentaActiva.saldo_pendiente || 0).toFixed(2) },
                  { label: '50%', val: (parseFloat(cuentaActiva.saldo_pendiente || 0) * 0.5).toFixed(2) },
                  { label: '25%', val: (parseFloat(cuentaActiva.saldo_pendiente || 0) * 0.25).toFixed(2) }
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={() => setMontoAbono(chip.val)}
                    className="px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold bg-[#EBFDF6] text-[#00855E] border border-[#A6F6D8] hover:bg-[#A6F6D8]/30 transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    {chip.label} (S/ {chip.val})
                  </button>
                ))}
              </div>
            </div>

            {/* ─── VISTA PREVIA DEL NUEVO SALDO RESIDUAL EN TIEMPO REAL ─── */}
            {(() => {
              const saldoActual = parseFloat(cuentaActiva.saldo_pendiente || 0);
              const montoIngresado = parseFloat(montoAbono);
              const esValido = !isNaN(montoIngresado) && montoIngresado > 0;
              const nuevoSaldo = isNaN(montoIngresado) ? saldoActual : Math.max(0, saldoActual - montoIngresado);
              const esCancelacionTotal = esValido && nuevoSaldo <= 0.009;
              const excedeSaldo = esValido && montoIngresado > saldoActual + 0.009;

              return (
                <div
                  className={`p-3 rounded-2xl border transition-all ${
                    excedeSaldo
                      ? 'bg-rose-50/80 border-rose-200 dark:bg-rose-950/40 dark:border-rose-800'
                      : esCancelacionTotal
                      ? 'bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800'
                      : 'bg-[#F8FCFA] dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">
                        Nuevo Saldo Residual:
                      </span>
                      {esCancelacionTotal && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          <CheckCircle className="w-3 h-3" />
                          Liquidación Total
                        </span>
                      )}
                    </div>
                    <span
                      className={`font-mono font-black text-sm ${
                        excedeSaldo
                          ? 'text-rose-600 dark:text-rose-400'
                          : esCancelacionTotal
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      S/ {nuevoSaldo.toFixed(2)}
                    </span>
                  </div>

                  {/* Operación Visual: Saldo Actual - Abono = Nuevo Saldo */}
                  <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-[11px] font-mono text-slate-500">
                    <span>
                      Saldo: <strong className="text-slate-700 dark:text-slate-300">S/ {saldoActual.toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">-</span>
                    <span>
                      Abono: <strong className="text-[#00855E] dark:text-[#5EEBB8]">S/ {(esValido ? montoIngresado : 0).toFixed(2)}</strong>
                    </span>
                    <span className="text-slate-300 dark:text-slate-600">=</span>
                    <span>
                      Resta: <strong className={esCancelacionTotal ? 'text-emerald-600 font-bold' : excedeSaldo ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}>S/ {nuevoSaldo.toFixed(2)}</strong>
                    </span>
                  </div>

                  {excedeSaldo && (
                    <p className="text-[10.5px] text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 mt-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      El monto no puede superar el saldo pendiente de S/ {saldoActual.toFixed(2)}
                    </p>
                  )}
                </div>
              );
            })()}

            <div>
              <DropdownPill
                label="Método de Pago"
                value={metodoPago}
                onChange={(val) => setMetodoPago(val)}
                options={opcionesMetodoPago}
                icon={iconoMetodoActual}
                placeholder="Seleccione método de pago..."
                searchable={false}
                direction="up"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Notas / N° de Operación (Opcional)
              </label>
              <input
                type="text"
                value={notasAbono}
                onChange={(e) => setNotasAbono(e.target.value)}
                placeholder="Ej: N° Op. 481920 / Pago parcial acordado..."
                className="w-full bg-[#F8FCFA] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#00B884]"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setModalAbono(false)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardandoAbono}
                className="flex-1 py-2 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white text-xs font-black shadow-md shadow-emerald-900/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
              >
                {guardandoAbono ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                <span>Confirmar Abono</span>
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* ─── 6. MODAL VER HISTORIAL DETALLADO DE ABONOS ─── */}
      {modalHistorialAbonos && cuentaHistorial && (() => {
        const montoTotal = parseFloat(cuentaHistorial.monto_total || 0);
        const saldoPendiente = parseFloat(cuentaHistorial.saldo_pendiente || 0);
        const totalAbonado = Math.max(0, montoTotal - saldoPendiente);
        const porcentajePagado = montoTotal > 0 ? Math.min(100, Math.round((totalAbonado / montoTotal) * 100)) : 100;

        const fechaVenc = cuentaHistorial.fecha_vencimiento ? new Date(cuentaHistorial.fecha_vencimiento + 'T00:00:00') : null;
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        let estadoBadge = {
          label: 'Pendiente',
          color: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          Icon: Clock
        };

        if (saldoPendiente <= 0 || cuentaHistorial.estado === 'Pagado') {
          estadoBadge = {
            label: 'Liquidado al 100%',
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
            Icon: CheckCircle
          };
        } else if (fechaVenc && fechaVenc < hoy) {
          const diffDias = Math.max(1, Math.round((hoy - fechaVenc) / (1000 * 60 * 60 * 24)));
          estadoBadge = {
            label: `Vencido (${diffDias} d)`,
            color: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
            Icon: AlertTriangle
          };
        }

        const nroComprobante = tab === 'cobrar'
          ? (cuentaHistorial.venta?.numero || `Venta #${cuentaHistorial.id_venta}`)
          : (cuentaHistorial.compra?.numero || `Compra #${cuentaHistorial.id_compra}`);

        const personaNombre = tab === 'cobrar'
          ? cuentaHistorial.cliente?.nombre
          : cuentaHistorial.proveedor?.razon_social;

        const docIdentidad = tab === 'cobrar'
          ? (cuentaHistorial.cliente?.numero_documento || cuentaHistorial.cliente?.dni || cuentaHistorial.cliente?.ruc)
          : (cuentaHistorial.proveedor?.numero_documento || cuentaHistorial.proveedor?.ruc);

        const fechaEmisionStr = cuentaHistorial.fecha_emision || (cuentaHistorial.venta?.fecha || cuentaHistorial.compra?.fecha) || '-';

        return typeof document !== 'undefined' ? createPortal(
          <div
            onClick={(e) => {
              if (e.target === e.currentTarget) setModalHistorialAbonos(false);
            }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200 cursor-pointer"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-3xl soft-card-shadow border border-[#D1F4E3] dark:border-slate-800 max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl font-sora animate-in zoom-in-95 duration-150 cursor-default my-auto"
            >
              {/* Encabezado del Modal */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-start gap-2.5">
                  <span className="p-2.5 rounded-2xl bg-[#EBFDF6] dark:bg-emerald-950/60 text-[#00855E] border border-[#A6F6D8] shrink-0 mt-0.5">
                    <Receipt className="w-5 h-5 text-[#00B884]" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
                        Historial de Abonos y Amortizaciones
                      </h3>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${estadoBadge.color}`}>
                        <estadoBadge.Icon className="w-3 h-3 shrink-0" />
                        <span>{estadoBadge.label}</span>
                      </span>
                    </div>
                    <p className="text-[11.5px] font-bold text-slate-700 dark:text-slate-200 mt-0.5">
                      {personaNombre}
                      {docIdentidad && (
                        <span className="text-slate-400 font-mono font-normal ml-1.5">
                          ({docIdentidad})
                        </span>
                      )}
                    </p>
                    <p className="text-[10.5px] text-slate-400">
                      Comprobante Ref: <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{nroComprobante}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalHistorialAbonos(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Panel de Desglose Financiero y Barra de Progreso */}
              <div className="p-4 bg-gradient-to-b from-[#F8FCFA] to-[#EBFDF6]/40 dark:from-slate-800/60 dark:to-slate-800/30 rounded-2xl border border-[#D1F4E3]/80 dark:border-slate-700/80 space-y-3">
                {/* Métricas de 3 Columnas */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60 shadow-2xs">
                    <span className="text-[10px] text-slate-500 font-medium block">Total Crédito</span>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 font-mono">
                      S/ {montoTotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-emerald-100 dark:border-emerald-950/40 shadow-2xs">
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium block">Total Abonado</span>
                    <span className="text-xs sm:text-sm font-black text-[#00855E] dark:text-[#5EEBB8] font-mono">
                      S/ {totalAbonado.toFixed(2)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-rose-100 dark:border-rose-950/40 shadow-2xs">
                    <span className="text-[10px] text-rose-700 dark:text-rose-400 font-medium block">Saldo Pendiente</span>
                    <span className="text-xs sm:text-sm font-black text-rose-600 dark:text-rose-400 font-mono">
                      S/ {saldoPendiente.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Barra de Progreso Visual */}
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex justify-between items-center text-[10.5px]">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">
                      Avance de Amortización
                    </span>
                    <span className="font-mono font-black text-[#00855E] dark:text-[#5EEBB8]">
                      {porcentajePagado}% pagado
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200/70 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00855E] to-[#00B884] transition-all duration-500 shadow-xs"
                      style={{ width: `${porcentajePagado}%` }}
                    />
                  </div>
                </div>

                {/* Fechas de Emisión y Vencimiento */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-700 text-[10.5px] text-slate-500 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Emisión: <strong className="text-slate-700 dark:text-slate-300">{fechaEmisionStr}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Vencimiento: <strong className={fechaVenc && fechaVenc < hoy && saldoPendiente > 0 ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-slate-300'}>{cuentaHistorial.fecha_vencimiento || '-'}</strong></span>
                  </div>
                </div>
              </div>

              {/* Lista Detallada de Abonos */}
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {(cuentaHistorial.abonos || []).length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs">
                    No se registran abonos previos para esta cuenta.
                  </div>
                ) : (
                  cuentaHistorial.abonos.map((ab, idx) => (
                    <div
                      key={ab.id || idx}
                      className="p-3 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-[#A6F6D8] transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {ab.metodo_pago || 'Efectivo'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {formatearFechaHora(ab.fecha || ab.created_at)}
                          </span>
                        </div>
                        {ab.notas && (
                          <p className="text-[10.5px] text-slate-500 italic mt-0.5">
                            {ab.notas}
                          </p>
                        )}
                        {ab.usuario?.nombre && (
                          <p className="text-[9.5px] text-slate-400 mt-0.5">
                            Registrado por: {ab.usuario.nombre}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-sm font-black text-[#00855E] dark:text-[#5EEBB8] font-mono">
                          S/ {parseFloat(ab.monto || 0).toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => imprimirComprobanteAbono(ab, cuentaHistorial)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#EBFDF6] dark:bg-slate-700 hover:text-[#00855E] text-slate-600 border border-slate-200 dark:border-slate-600 transition-all cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                          title="Imprimir comprobante térmico de abono"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Botonera de Acciones Inferior */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                {saldoPendiente > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setModalHistorialAbonos(false);
                      abrirModalAbono(cuentaHistorial);
                    }}
                    className="py-2.5 px-3.5 rounded-xl bg-[#EBFDF6] hover:bg-[#D1F4E3] text-[#00855E] dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold transition-all border border-[#A6F6D8] dark:border-emerald-800 cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-2xs"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Registrar Abono</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setModalHistorialAbonos(false)}
                  className="flex-1 py-2.5 rounded-xl bg-[#00855E] hover:bg-[#00704F] text-white text-xs font-bold transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Cerrar Detalle
                </button>
              </div>
            </div>
          </div>,
          document.body
        ) : null;
      })()}
    </div>
  );
}
